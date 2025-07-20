const AWS = require('aws-sdk');
const axios = require('axios');
const crypto = require('crypto');
const winston = require('winston');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'cdn-manager' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

class CDNManager {
  constructor(config) {
    this.config = {
      provider: process.env.CDN_PROVIDER || 'cloudfront',
      distributionId: process.env.CDN_DISTRIBUTION_ID,
      domain: process.env.CDN_DOMAIN || 'cdn.vib3.app',
      signingKeyId: process.env.CDN_SIGNING_KEY_ID,
      signingKey: process.env.CDN_SIGNING_KEY,
      ...config
    };

    // Initialize CloudFront
    this.cloudfront = new AWS.CloudFront({
      region: process.env.AWS_REGION || 'us-east-1'
    });

    // Cache purge queue
    this.purgeQueue = new Set();
    this.startPurgeWorker();
  }

  // Generate signed URL for private content
  generateSignedUrl(path, expiresIn = 3600) {
    const url = `https://${this.config.domain}${path}`;
    const expires = Math.floor(Date.now() / 1000) + expiresIn;

    if (this.config.provider === 'cloudfront') {
      return this.generateCloudFrontSignedUrl(url, expires);
    }

    // Add other CDN providers here
    return url;
  }

  generateCloudFrontSignedUrl(url, expires) {
    const policy = {
      Statement: [{
        Resource: url,
        Condition: {
          DateLessThan: { 'AWS:EpochTime': expires }
        }
      }]
    };

    const policyString = JSON.stringify(policy);
    const base64Policy = Buffer.from(policyString).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const signature = crypto
      .createSign('RSA-SHA1')
      .update(policyString)
      .sign(this.config.signingKey, 'base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const queryParams = new URLSearchParams({
      'Policy': base64Policy,
      'Signature': signature,
      'Key-Pair-Id': this.config.signingKeyId
    });

    return `${url}?${queryParams.toString()}`;
  }

  // Purge cache for specific paths
  async purgeCache(paths) {
    if (!Array.isArray(paths)) {
      paths = [paths];
    }

    // Add to purge queue
    paths.forEach(path => this.purgeQueue.add(path));

    logger.info(`Added ${paths.length} paths to purge queue`);
  }

  // Batch purge processor
  async processPurgeQueue() {
    if (this.purgeQueue.size === 0) return;

    const paths = Array.from(this.purgeQueue);
    this.purgeQueue.clear();

    try {
      if (this.config.provider === 'cloudfront') {
        await this.purgeCloudFront(paths);
      }
      // Add other CDN providers here

      logger.info(`Successfully purged ${paths.length} paths`);
    } catch (error) {
      logger.error('Cache purge error:', error);
      // Re-add failed paths to queue
      paths.forEach(path => this.purgeQueue.add(path));
    }
  }

  async purgeCloudFront(paths) {
    const params = {
      DistributionId: this.config.distributionId,
      InvalidationBatch: {
        CallerReference: `purge-${Date.now()}`,
        Paths: {
          Quantity: paths.length,
          Items: paths
        }
      }
    };

    const result = await this.cloudfront.createInvalidation(params).promise();
    logger.info(`CloudFront invalidation created: ${result.Invalidation.Id}`);
    return result;
  }

  // Start purge worker
  startPurgeWorker() {
    // Process purge queue every 30 seconds
    setInterval(() => {
      this.processPurgeQueue();
    }, 30000);
  }

  // Preload content to edge locations
  async preloadContent(urls) {
    const promises = urls.map(url => this.warmCache(url));
    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    logger.info(`Preloaded ${successful}/${urls.length} URLs`);
    
    return results;
  }

  async warmCache(url) {
    try {
      // Make HEAD request to warm cache
      await axios.head(url, {
        headers: {
          'User-Agent': 'VIB3-CDN-Warmer/1.0'
        }
      });
      return { url, success: true };
    } catch (error) {
      logger.error(`Failed to warm cache for ${url}:`, error.message);
      return { url, success: false, error: error.message };
    }
  }

  // Get CDN statistics
  async getStatistics(startTime, endTime) {
    if (this.config.provider === 'cloudfront') {
      return this.getCloudFrontStatistics(startTime, endTime);
    }

    return null;
  }

  async getCloudFrontStatistics(startTime, endTime) {
    const cloudwatch = new AWS.CloudWatch({
      region: 'us-east-1' // CloudFront metrics are in us-east-1
    });

    const metrics = [
      { name: 'Requests', stat: 'Sum' },
      { name: 'BytesDownloaded', stat: 'Sum' },
      { name: 'BytesUploaded', stat: 'Sum' },
      { name: '4xxErrorRate', stat: 'Average' },
      { name: '5xxErrorRate', stat: 'Average' },
      { name: 'OriginLatency', stat: 'Average' }
    ];

    const promises = metrics.map(metric => {
      const params = {
        MetricName: metric.name,
        Namespace: 'AWS/CloudFront',
        Statistics: [metric.stat],
        StartTime: new Date(startTime),
        EndTime: new Date(endTime),
        Period: 3600, // 1 hour
        Dimensions: [{
          Name: 'DistributionId',
          Value: this.config.distributionId
        }]
      };

      return cloudwatch.getMetricStatistics(params).promise();
    });

    const results = await Promise.all(promises);
    
    const stats = {};
    metrics.forEach((metric, index) => {
      stats[metric.name] = results[index].Datapoints;
    });

    return stats;
  }

  // Configure custom error pages
  async configureErrorPages() {
    const errorPages = [
      {
        ErrorCode: 403,
        ResponsePagePath: '/errors/403.html',
        ResponseCode: '403',
        ErrorCachingMinTTL: 300
      },
      {
        ErrorCode: 404,
        ResponsePagePath: '/errors/404.html',
        ResponseCode: '404',
        ErrorCachingMinTTL: 300
      },
      {
        ErrorCode: 500,
        ResponsePagePath: '/errors/500.html',
        ResponseCode: '500',
        ErrorCachingMinTTL: 60
      }
    ];

    // Update distribution config with error pages
    // Implementation depends on CDN provider
  }

  // Set up geo-restrictions
  async configureGeoRestrictions(allowedCountries = [], blockedCountries = []) {
    if (this.config.provider === 'cloudfront') {
      const geoRestriction = {
        RestrictionType: 'none',
        Quantity: 0
      };

      if (allowedCountries.length > 0) {
        geoRestriction.RestrictionType = 'whitelist';
        geoRestriction.Quantity = allowedCountries.length;
        geoRestriction.Items = allowedCountries;
      } else if (blockedCountries.length > 0) {
        geoRestriction.RestrictionType = 'blacklist';
        geoRestriction.Quantity = blockedCountries.length;
        geoRestriction.Items = blockedCountries;
      }

      // Update distribution with geo restrictions
      // Implementation requires getting current config and updating
    }
  }

  // Configure WAF rules
  async configureWAF(webAclId) {
    // Associate WAF Web ACL with CloudFront distribution
    // This helps protect against common web exploits
  }

  // Get bandwidth usage
  async getBandwidthUsage(period = 'day') {
    const now = new Date();
    let startTime;

    switch (period) {
      case 'hour':
        startTime = new Date(now - 3600000);
        break;
      case 'day':
        startTime = new Date(now - 86400000);
        break;
      case 'week':
        startTime = new Date(now - 604800000);
        break;
      case 'month':
        startTime = new Date(now - 2592000000);
        break;
      default:
        startTime = new Date(now - 86400000);
    }

    const stats = await this.getStatistics(startTime, now);
    
    if (stats && stats.BytesDownloaded) {
      const totalBytes = stats.BytesDownloaded.reduce((sum, point) => {
        return sum + (point.Sum || 0);
      }, 0);

      return {
        period,
        totalBytes,
        totalGB: (totalBytes / 1073741824).toFixed(2),
        averageBytesPerHour: totalBytes / ((now - startTime) / 3600000)
      };
    }

    return null;
  }

  // Monitor cache hit ratio
  async getCacheHitRatio(hours = 24) {
    const endTime = new Date();
    const startTime = new Date(endTime - hours * 3600000);

    if (this.config.provider === 'cloudfront') {
      const cloudwatch = new AWS.CloudWatch({ region: 'us-east-1' });

      const params = {
        MetricName: 'CacheHitRate',
        Namespace: 'AWS/CloudFront',
        Statistics: ['Average'],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Dimensions: [{
          Name: 'DistributionId',
          Value: this.config.distributionId
        }]
      };

      const result = await cloudwatch.getMetricStatistics(params).promise();
      
      if (result.Datapoints.length > 0) {
        const avgHitRate = result.Datapoints.reduce((sum, point) => {
          return sum + point.Average;
        }, 0) / result.Datapoints.length;

        return {
          hours,
          averageHitRate: avgHitRate.toFixed(2),
          datapoints: result.Datapoints
        };
      }
    }

    return null;
  }
}

// Singleton instance
let instance;

module.exports = {
  getCDNManager: (config) => {
    if (!instance) {
      instance = new CDNManager(config);
    }
    return instance;
  },
  CDNManager
};