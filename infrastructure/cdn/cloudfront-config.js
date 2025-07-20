const AWS = require('aws-sdk');

// CloudFront CDN configuration for VIB3
const cloudfront = new AWS.CloudFront();

const distributionConfig = {
  CallerReference: Date.now().toString(),
  Comment: 'VIB3 Video Content Distribution',
  DefaultRootObject: 'index.html',
  
  Origins: {
    Quantity: 2,
    Items: [
      {
        // DigitalOcean Spaces origin
        Id: 'DO-Spaces-Origin',
        DomainName: process.env.DO_SPACES_BUCKET + '.nyc3.digitaloceanspaces.com',
        S3OriginConfig: {
          OriginAccessIdentity: ''
        },
        CustomHeaders: {
          Quantity: 0,
          Items: []
        }
      },
      {
        // Application Load Balancer origin
        Id: 'ALB-Origin',
        DomainName: process.env.ALB_DOMAIN || 'api.vib3.app',
        CustomOriginConfig: {
          HTTPPort: 80,
          HTTPSPort: 443,
          OriginProtocolPolicy: 'https-only',
          OriginSslProtocols: {
            Quantity: 3,
            Items: ['TLSv1', 'TLSv1.1', 'TLSv1.2']
          },
          OriginReadTimeout: 30,
          OriginKeepaliveTimeout: 5
        }
      }
    ]
  },
  
  DefaultCacheBehavior: {
    TargetOriginId: 'DO-Spaces-Origin',
    ViewerProtocolPolicy: 'redirect-to-https',
    AllowedMethods: {
      Quantity: 7,
      Items: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
      CachedMethods: {
        Quantity: 2,
        Items: ['GET', 'HEAD']
      }
    },
    ForwardedValues: {
      QueryString: true,
      Cookies: { Forward: 'none' },
      Headers: {
        Quantity: 4,
        Items: ['Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers', 'Range']
      }
    },
    TrustedSigners: { Enabled: false, Quantity: 0 },
    MinTTL: 0,
    DefaultTTL: 86400, // 1 day
    MaxTTL: 31536000, // 1 year
    Compress: true,
    SmoothStreaming: false,
    
    // Cache policies for video content
    CachePolicyId: '658327ea-f89e-4fab-a63d-7e88639e58f6', // Managed-CachingOptimized
    OriginRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf', // Managed-CORS-S3Origin
    ResponseHeadersPolicyId: '5cc3b908-e619-4b99-88e5-2cf7f45965bd', // Managed-CORS-With-Preflight
  },
  
  CacheBehaviors: {
    Quantity: 4,
    Items: [
      {
        // API endpoints - no caching
        PathPattern: '/api/*',
        TargetOriginId: 'ALB-Origin',
        ViewerProtocolPolicy: 'https-only',
        AllowedMethods: {
          Quantity: 7,
          Items: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
          CachedMethods: {
            Quantity: 2,
            Items: ['GET', 'HEAD']
          }
        },
        ForwardedValues: {
          QueryString: true,
          Cookies: { Forward: 'all' },
          Headers: {
            Quantity: 5,
            Items: ['*']
          }
        },
        MinTTL: 0,
        DefaultTTL: 0,
        MaxTTL: 0,
        Compress: true,
      },
      {
        // Video files - aggressive caching
        PathPattern: '/videos/*',
        TargetOriginId: 'DO-Spaces-Origin',
        ViewerProtocolPolicy: 'redirect-to-https',
        AllowedMethods: {
          Quantity: 2,
          Items: ['GET', 'HEAD'],
          CachedMethods: {
            Quantity: 2,
            Items: ['GET', 'HEAD']
          }
        },
        ForwardedValues: {
          QueryString: false,
          Cookies: { Forward: 'none' },
          Headers: {
            Quantity: 1,
            Items: ['Range'] // For video seeking
          }
        },
        MinTTL: 86400, // 1 day
        DefaultTTL: 604800, // 7 days
        MaxTTL: 31536000, // 1 year
        Compress: false, // Videos are already compressed
      },
      {
        // Thumbnails - moderate caching
        PathPattern: '/thumbnails/*',
        TargetOriginId: 'DO-Spaces-Origin',
        ViewerProtocolPolicy: 'redirect-to-https',
        AllowedMethods: {
          Quantity: 2,
          Items: ['GET', 'HEAD'],
          CachedMethods: {
            Quantity: 2,
            Items: ['GET', 'HEAD']
          }
        },
        ForwardedValues: {
          QueryString: true,
          Cookies: { Forward: 'none' },
          Headers: { Quantity: 0 }
        },
        MinTTL: 3600, // 1 hour
        DefaultTTL: 86400, // 1 day
        MaxTTL: 604800, // 7 days
        Compress: true,
      },
      {
        // HLS streaming files
        PathPattern: '*.m3u8',
        TargetOriginId: 'DO-Spaces-Origin',
        ViewerProtocolPolicy: 'redirect-to-https',
        AllowedMethods: {
          Quantity: 2,
          Items: ['GET', 'HEAD'],
          CachedMethods: {
            Quantity: 2,
            Items: ['GET', 'HEAD']
          }
        },
        ForwardedValues: {
          QueryString: false,
          Cookies: { Forward: 'none' },
          Headers: {
            Quantity: 2,
            Items: ['Origin', 'Access-Control-Request-Method']
          }
        },
        MinTTL: 0,
        DefaultTTL: 60, // 1 minute for manifest files
        MaxTTL: 300, // 5 minutes
        Compress: true,
      }
    ]
  },
  
  CustomErrorResponses: {
    Quantity: 2,
    Items: [
      {
        ErrorCode: 403,
        ResponsePagePath: '/error/403.html',
        ResponseCode: '403',
        ErrorCachingMinTTL: 300
      },
      {
        ErrorCode: 404,
        ResponsePagePath: '/error/404.html',
        ResponseCode: '404',
        ErrorCachingMinTTL: 300
      }
    ]
  },
  
  Restrictions: {
    GeoRestriction: {
      RestrictionType: 'none',
      Quantity: 0
    }
  },
  
  ViewerCertificate: {
    CloudFrontDefaultCertificate: false,
    ACMCertificateArn: process.env.ACM_CERTIFICATE_ARN,
    SSLSupportMethod: 'sni-only',
    MinimumProtocolVersion: 'TLSv1.2_2021'
  },
  
  Aliases: {
    Quantity: 2,
    Items: ['cdn.vib3.app', 'videos.vib3.app']
  },
  
  Enabled: true,
  HttpVersion: 'http2and3',
  IsIPV6Enabled: true,
  
  Logging: {
    Enabled: true,
    IncludeCookies: false,
    Bucket: process.env.LOGS_BUCKET + '.s3.amazonaws.com',
    Prefix: 'cloudfront-logs/'
  },
  
  PriceClass: 'PriceClass_All', // Use all edge locations for best performance
  
  WebACLId: process.env.WAF_WEB_ACL_ID || '' // Optional WAF integration
};

// Function to create CloudFront distribution
async function createDistribution() {
  try {
    const params = {
      DistributionConfig: distributionConfig
    };
    
    const result = await cloudfront.createDistribution(params).promise();
    console.log('CloudFront distribution created:', result.Distribution.Id);
    console.log('Domain name:', result.Distribution.DomainName);
    
    return result.Distribution;
  } catch (error) {
    console.error('Error creating CloudFront distribution:', error);
    throw error;
  }
}

// Function to invalidate cache
async function invalidateCache(distributionId, paths) {
  try {
    const params = {
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: paths.length,
          Items: paths
        }
      }
    };
    
    const result = await cloudfront.createInvalidation(params).promise();
    console.log('Cache invalidation created:', result.Invalidation.Id);
    
    return result.Invalidation;
  } catch (error) {
    console.error('Error creating cache invalidation:', error);
    throw error;
  }
}

// Function to update distribution config
async function updateDistribution(distributionId, config) {
  try {
    // First get current distribution config
    const current = await cloudfront.getDistributionConfig({
      Id: distributionId
    }).promise();
    
    // Merge with new config
    const updatedConfig = {
      ...current.DistributionConfig,
      ...config
    };
    
    const params = {
      Id: distributionId,
      DistributionConfig: updatedConfig,
      IfMatch: current.ETag
    };
    
    const result = await cloudfront.updateDistribution(params).promise();
    console.log('Distribution updated:', result.Distribution.Id);
    
    return result.Distribution;
  } catch (error) {
    console.error('Error updating distribution:', error);
    throw error;
  }
}

// Lambda@Edge function for dynamic content optimization
const lambdaEdgeFunction = `
'use strict';

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;
    
    // Add security headers
    const securityHeaders = {
        'x-frame-options': [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
        'x-content-type-options': [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
        'referrer-policy': [{ key: 'Referrer-Policy', value: 'same-origin' }],
        'x-xss-protection': [{ key: 'X-XSS-Protection', value: '1; mode=block' }],
        'strict-transport-security': [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubdomains; preload' }]
    };
    
    // Device detection for adaptive streaming
    const userAgent = headers['user-agent'] ? headers['user-agent'][0].value : '';
    const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
    
    // Modify request for video quality based on device
    if (request.uri.includes('/videos/') && isMobile) {
        // Redirect mobile users to lower quality by default
        request.uri = request.uri.replace('/1080p/', '/720p/');
    }
    
    // Add custom headers
    request.headers['x-device-type'] = [{ key: 'X-Device-Type', value: isMobile ? 'mobile' : 'desktop' }];
    
    callback(null, request);
};
`;

module.exports = {
  createDistribution,
  invalidateCache,
  updateDistribution,
  distributionConfig,
  lambdaEdgeFunction
};