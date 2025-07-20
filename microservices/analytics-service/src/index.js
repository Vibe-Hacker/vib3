require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const { Client: ElasticsearchClient } = require('@elastic/elasticsearch');
const winston = require('winston');
const { body, query, param, validationResult } = require('express-validator');
const prometheus = require('prom-client');
const cron = require('node-cron');
const { format, subDays, startOfDay, endOfDay } = require('date-fns');
const _ = require('lodash');
const { getCacheManager } = require('@vib3/cache');
const { getMessageQueue } = require('@vib3/queue');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'analytics-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Express app
const app = express();
app.use(express.json());

// MongoDB connection
let db;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vib3';

// Elasticsearch connection
let esClient;
const esUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

// Cache and Queue managers
const cache = getCacheManager();
const queue = getMessageQueue();

// Prometheus metrics
const analyticsEventCounter = new prometheus.Counter({
  name: 'analytics_events_total',
  help: 'Total number of analytics events processed',
  labelNames: ['event_type'],
});

const aggregationDuration = new prometheus.Histogram({
  name: 'analytics_aggregation_duration_seconds',
  help: 'Duration of analytics aggregation operations',
  labelNames: ['aggregation_type'],
});

prometheus.register.registerMetric(analyticsEventCounter);
prometheus.register.registerMetric(aggregationDuration);

// Connect to databases
async function connectDB() {
  try {
    // MongoDB
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db('vib3');
    logger.info('Connected to MongoDB');

    // Elasticsearch
    esClient = new ElasticsearchClient({
      node: esUrl,
      auth: process.env.ELASTICSEARCH_AUTH ? {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
      } : undefined,
    });

    // Test Elasticsearch connection
    await esClient.ping();
    logger.info('Connected to Elasticsearch');

    // Create indexes
    await createIndexes();
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
}

// Create database indexes
async function createIndexes() {
  try {
    // MongoDB indexes
    await db.collection('analytics_events').createIndex({ timestamp: -1 });
    await db.collection('analytics_events').createIndex({ userId: 1, timestamp: -1 });
    await db.collection('analytics_events').createIndex({ eventType: 1, timestamp: -1 });
    await db.collection('analytics_events').createIndex({ 'data.videoId': 1, timestamp: -1 });

    // Elasticsearch index
    const indexExists = await esClient.indices.exists({ index: 'vib3-analytics' });
    if (!indexExists) {
      await esClient.indices.create({
        index: 'vib3-analytics',
        body: {
          mappings: {
            properties: {
              timestamp: { type: 'date' },
              userId: { type: 'keyword' },
              eventType: { type: 'keyword' },
              sessionId: { type: 'keyword' },
              data: { type: 'object' },
              deviceInfo: { type: 'object' },
              location: { type: 'geo_point' },
            },
          },
        },
      });
    }

    logger.info('Indexes created');
  } catch (error) {
    logger.error('Error creating indexes:', error);
  }
}

// Middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});

// Track event
app.post('/events', [
  body('eventType').notEmpty(),
  body('userId').optional(),
  body('sessionId').optional(),
  body('data').optional().isObject(),
  body('deviceInfo').optional().isObject(),
  body('location').optional().isObject(),
  validateRequest
], async (req, res) => {
  try {
    const event = {
      ...req.body,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    // Save to MongoDB
    await db.collection('analytics_events').insertOne(event);

    // Index in Elasticsearch for real-time analytics
    await esClient.index({
      index: 'vib3-analytics',
      body: event,
    });

    // Update counters
    analyticsEventCounter.inc({ event_type: event.eventType });

    // Process specific event types
    await processEvent(event);

    res.json({ success: true });

  } catch (error) {
    logger.error('Track event error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Batch track events
app.post('/events/batch', [
  body('events').isArray().notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { events } = req.body;
    const timestamp = new Date();

    // Enrich events
    const enrichedEvents = events.map(event => ({
      ...event,
      timestamp: event.timestamp || timestamp,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }));

    // Bulk insert to MongoDB
    await db.collection('analytics_events').insertMany(enrichedEvents);

    // Bulk index to Elasticsearch
    const bulkBody = enrichedEvents.flatMap(doc => [
      { index: { _index: 'vib3-analytics' } },
      doc,
    ]);
    await esClient.bulk({ body: bulkBody });

    // Update counters
    enrichedEvents.forEach(event => {
      analyticsEventCounter.inc({ event_type: event.eventType });
    });

    // Process events asynchronously
    setImmediate(async () => {
      for (const event of enrichedEvents) {
        await processEvent(event);
      }
    });

    res.json({ success: true, processed: events.length });

  } catch (error) {
    logger.error('Batch track error:', error);
    res.status(500).json({ error: 'Failed to track events' });
  }
});

// Get video analytics
app.get('/videos/:videoId/analytics', [
  param('videoId').notEmpty(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validateRequest
], async (req, res) => {
  try {
    const { videoId } = req.params;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : subDays(new Date(), 30);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Check cache first
    const cacheKey = `video:analytics:${videoId}:${startDate.getTime()}:${endDate.getTime()}`;
    const cached = await cache.getRedis().get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Aggregate video metrics
    const pipeline = [
      {
        $match: {
          'data.videoId': videoId,
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
        },
      },
      {
        $project: {
          eventType: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
        },
      },
    ];

    const metrics = await db.collection('analytics_events').aggregate(pipeline).toArray();

    // Get time series data
    const timeSeriesData = await getVideoTimeSeries(videoId, startDate, endDate);

    // Get demographic data
    const demographics = await getVideoDemographics(videoId, startDate, endDate);

    // Get retention data
    const retention = await getVideoRetention(videoId);

    const analytics = {
      videoId,
      period: { startDate, endDate },
      metrics: metrics.reduce((acc, m) => {
        acc[m.eventType] = {
          total: m.count,
          unique: m.uniqueUsers,
        };
        return acc;
      }, {}),
      timeSeries: timeSeriesData,
      demographics,
      retention,
    };

    // Cache for 1 hour
    await cache.getRedis().client.setex(cacheKey, 3600, JSON.stringify(analytics));

    res.json(analytics);

  } catch (error) {
    logger.error('Get video analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Get user analytics
app.get('/users/:userId/analytics', [
  param('userId').notEmpty(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validateRequest
], async (req, res) => {
  try {
    const { userId } = req.params;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : subDays(new Date(), 30);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Get user's video performance
    const videoPerformance = await db.collection('analytics_events').aggregate([
      {
        $match: {
          'data.creatorId': userId,
          eventType: { $in: ['video_view', 'video_like', 'video_share'] },
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            videoId: '$data.videoId',
            eventType: '$eventType',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.videoId',
          metrics: {
            $push: {
              type: '$_id.eventType',
              count: '$count',
            },
          },
        },
      },
    ]).toArray();

    // Get follower growth
    const followerGrowth = await getFollowerGrowth(userId, startDate, endDate);

    // Get engagement rate
    const engagementRate = await calculateEngagementRate(userId, startDate, endDate);

    // Get best performing content
    const topContent = await getTopContent(userId, startDate, endDate);

    res.json({
      userId,
      period: { startDate, endDate },
      videoPerformance,
      followerGrowth,
      engagementRate,
      topContent,
    });

  } catch (error) {
    logger.error('Get user analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Get platform analytics (admin)
app.get('/platform/analytics', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validateRequest
], async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : subDays(new Date(), 30);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Daily active users
    const dau = await getDailyActiveUsers(startDate, endDate);

    // Monthly active users
    const mau = await getMonthlyActiveUsers();

    // Content statistics
    const contentStats = await getContentStatistics(startDate, endDate);

    // Revenue metrics (if applicable)
    const revenue = await getRevenueMetrics(startDate, endDate);

    // Platform health metrics
    const health = await getPlatformHealth();

    res.json({
      period: { startDate, endDate },
      users: { dau, mau },
      content: contentStats,
      revenue,
      health,
    });

  } catch (error) {
    logger.error('Get platform analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Real-time analytics endpoint (using Elasticsearch)
app.get('/realtime', [
  query('interval').optional().isIn(['1m', '5m', '15m', '1h']),
  validateRequest
], async (req, res) => {
  try {
    const interval = req.query.interval || '5m';

    const result = await esClient.search({
      index: 'vib3-analytics',
      body: {
        query: {
          range: {
            timestamp: {
              gte: `now-${interval}`,
            },
          },
        },
        aggs: {
          events_over_time: {
            date_histogram: {
              field: 'timestamp',
              interval: '30s',
            },
            aggs: {
              by_type: {
                terms: {
                  field: 'eventType',
                },
              },
            },
          },
          unique_users: {
            cardinality: {
              field: 'userId',
            },
          },
          top_videos: {
            terms: {
              field: 'data.videoId',
              size: 10,
            },
          },
        },
      },
    });

    res.json({
      interval,
      timestamp: new Date(),
      aggregations: result.aggregations,
    });

  } catch (error) {
    logger.error('Real-time analytics error:', error);
    res.status(500).json({ error: 'Failed to get real-time analytics' });
  }
});

// Export analytics data
app.post('/export', [
  body('type').notEmpty().isIn(['user', 'video', 'platform']),
  body('entityId').optional(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('format').optional().isIn(['csv', 'json']),
  validateRequest
], async (req, res) => {
  try {
    const { type, entityId, startDate, endDate, format = 'json' } = req.body;

    // Queue export job
    await queue.addBulkJob('export-analytics', {
      type,
      entityId,
      startDate,
      endDate,
      format,
      requestedBy: req.headers['x-user-id'],
    });

    res.json({
      message: 'Export queued successfully',
      jobId: `export-${Date.now()}`,
    });

  } catch (error) {
    logger.error('Export analytics error:', error);
    res.status(500).json({ error: 'Failed to queue export' });
  }
});

// Helper functions
async function processEvent(event) {
  try {
    switch (event.eventType) {
      case 'video_view':
        await processVideoView(event);
        break;
      case 'video_complete':
        await processVideoComplete(event);
        break;
      case 'user_follow':
        await processUserFollow(event);
        break;
      case 'app_open':
        await processAppOpen(event);
        break;
    }
  } catch (error) {
    logger.error(`Error processing event ${event.eventType}:`, error);
  }
}

async function processVideoView(event) {
  const { videoId, userId } = event.data;
  
  // Update video view count in cache
  await cache.incrementVideoView(videoId);
  
  // Track unique viewers
  if (userId) {
    const key = `video:viewers:${videoId}:${format(new Date(), 'yyyy-MM-dd')}`;
    await cache.getRedis().sadd(key, userId);
    await cache.getRedis().expire(key, 86400 * 7); // Keep for 7 days
  }
}

async function processVideoComplete(event) {
  const { videoId, watchTime, duration } = event.data;
  
  if (watchTime && duration) {
    const completionRate = watchTime / duration;
    
    // Store retention data
    await db.collection('video_retention').insertOne({
      videoId,
      completionRate,
      watchTime,
      duration,
      timestamp: event.timestamp,
    });
  }
}

async function processUserFollow(event) {
  const { followerId, followingId } = event.data;
  
  // Track follower growth
  await db.collection('follower_events').insertOne({
    userId: followingId,
    followerId,
    action: 'follow',
    timestamp: event.timestamp,
  });
}

async function processAppOpen(event) {
  const { userId, sessionId } = event;
  
  // Track DAU
  if (userId) {
    const key = `dau:${format(new Date(), 'yyyy-MM-dd')}`;
    await cache.getRedis().sadd(key, userId);
    await cache.getRedis().expire(key, 86400 * 30); // Keep for 30 days
  }
}

async function getVideoTimeSeries(videoId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        'data.videoId': videoId,
        eventType: 'video_view',
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$timestamp',
          },
        },
        views: { $sum: 1 },
        uniqueViewers: { $addToSet: '$userId' },
      },
    },
    {
      $project: {
        date: '$_id',
        views: 1,
        uniqueViewers: { $size: '$uniqueViewers' },
      },
    },
    { $sort: { date: 1 } },
  ];

  return db.collection('analytics_events').aggregate(pipeline).toArray();
}

async function getVideoDemographics(videoId, startDate, endDate) {
  // This would typically join with user data to get demographics
  // For now, returning mock data structure
  return {
    age: {
      '13-17': 15,
      '18-24': 40,
      '25-34': 30,
      '35-44': 10,
      '45+': 5,
    },
    gender: {
      male: 45,
      female: 53,
      other: 2,
    },
    location: {
      US: 35,
      UK: 15,
      CA: 10,
      other: 40,
    },
  };
}

async function getVideoRetention(videoId) {
  const retentionData = await db.collection('video_retention')
    .find({ videoId })
    .toArray();

  if (retentionData.length === 0) {
    return { averageWatchTime: 0, completionRate: 0 };
  }

  const avgWatchTime = _.meanBy(retentionData, 'watchTime');
  const avgCompletionRate = _.meanBy(retentionData, 'completionRate');

  return {
    averageWatchTime: Math.round(avgWatchTime),
    completionRate: Math.round(avgCompletionRate * 100),
  };
}

async function getFollowerGrowth(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        userId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$timestamp',
          },
        },
        gained: {
          $sum: { $cond: [{ $eq: ['$action', 'follow'] }, 1, 0] },
        },
        lost: {
          $sum: { $cond: [{ $eq: ['$action', 'unfollow'] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        date: '$_id',
        gained: 1,
        lost: 1,
        net: { $subtract: ['$gained', '$lost'] },
      },
    },
    { $sort: { date: 1 } },
  ];

  return db.collection('follower_events').aggregate(pipeline).toArray();
}

async function calculateEngagementRate(userId, startDate, endDate) {
  const [engagement, views] = await Promise.all([
    db.collection('analytics_events').countDocuments({
      'data.creatorId': userId,
      eventType: { $in: ['video_like', 'video_comment', 'video_share'] },
      timestamp: { $gte: startDate, $lte: endDate },
    }),
    db.collection('analytics_events').countDocuments({
      'data.creatorId': userId,
      eventType: 'video_view',
      timestamp: { $gte: startDate, $lte: endDate },
    }),
  ]);

  return views > 0 ? (engagement / views * 100).toFixed(2) : 0;
}

async function getTopContent(userId, startDate, endDate, limit = 10) {
  const pipeline = [
    {
      $match: {
        'data.creatorId': userId,
        eventType: { $in: ['video_view', 'video_like', 'video_share'] },
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$data.videoId',
        views: {
          $sum: { $cond: [{ $eq: ['$eventType', 'video_view'] }, 1, 0] },
        },
        likes: {
          $sum: { $cond: [{ $eq: ['$eventType', 'video_like'] }, 1, 0] },
        },
        shares: {
          $sum: { $cond: [{ $eq: ['$eventType', 'video_share'] }, 1, 0] },
        },
      },
    },
    {
      $addFields: {
        score: {
          $add: [
            '$views',
            { $multiply: ['$likes', 3] },
            { $multiply: ['$shares', 5] },
          ],
        },
      },
    },
    { $sort: { score: -1 } },
    { $limit: limit },
  ];

  return db.collection('analytics_events').aggregate(pipeline).toArray();
}

async function getDailyActiveUsers(startDate, endDate) {
  const days = [];
  let current = startOfDay(startDate);

  while (current <= endDate) {
    const key = `dau:${format(current, 'yyyy-MM-dd')}`;
    const count = await cache.getRedis().scard(key);
    
    days.push({
      date: format(current, 'yyyy-MM-dd'),
      count: count || 0,
    });

    current = new Date(current.getTime() + 86400000);
  }

  return days;
}

async function getMonthlyActiveUsers() {
  const thirtyDaysAgo = subDays(new Date(), 30);
  
  const mau = await db.collection('analytics_events').distinct('userId', {
    eventType: 'app_open',
    timestamp: { $gte: thirtyDaysAgo },
  });

  return mau.length;
}

async function getContentStatistics(startDate, endDate) {
  const [totalVideos, totalViews, avgViewsPerVideo] = await Promise.all([
    db.collection('videos').countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    }),
    db.collection('analytics_events').countDocuments({
      eventType: 'video_view',
      timestamp: { $gte: startDate, $lte: endDate },
    }),
    db.collection('analytics_events').aggregate([
      {
        $match: {
          eventType: 'video_view',
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$data.videoId',
          views: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          avgViews: { $avg: '$views' },
        },
      },
    ]).toArray(),
  ]);

  return {
    totalVideos,
    totalViews,
    avgViewsPerVideo: avgViewsPerVideo[0]?.avgViews || 0,
  };
}

async function getRevenueMetrics(startDate, endDate) {
  // Placeholder for revenue calculations
  // Would integrate with payment/monetization systems
  return {
    totalRevenue: 0,
    adRevenue: 0,
    creatorFundPayouts: 0,
    virtualGifts: 0,
  };
}

async function getPlatformHealth() {
  const [errorRate, avgResponseTime, uptime] = await Promise.all([
    // Calculate error rate from logs
    db.collection('error_logs').countDocuments({
      timestamp: { $gte: subDays(new Date(), 1) },
    }),
    // Get average response time from monitoring
    cache.getRedis().get('platform:avg_response_time'),
    // Calculate uptime
    cache.getRedis().get('platform:uptime'),
  ]);

  return {
    errorRate: errorRate / 1000, // Per 1000 requests
    avgResponseTime: parseFloat(avgResponseTime) || 0,
    uptime: parseFloat(uptime) || 99.9,
  };
}

// Scheduled tasks
function scheduleTasks() {
  // Aggregate hourly metrics
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running hourly analytics aggregation...');
      const endTime = Date.now();
      await aggregateHourlyMetrics();
      const duration = (Date.now() - endTime) / 1000;
      aggregationDuration.observe({ aggregation_type: 'hourly' }, duration);
    } catch (error) {
      logger.error('Hourly aggregation error:', error);
    }
  });

  // Daily reports
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Generating daily reports...');
      await generateDailyReports();
    } catch (error) {
      logger.error('Daily reports error:', error);
    }
  });

  // Clean up old data
  cron.schedule('0 3 * * 0', async () => {
    try {
      logger.info('Cleaning up old analytics data...');
      const cutoffDate = subDays(new Date(), 90);
      
      await db.collection('analytics_events').deleteMany({
        timestamp: { $lt: cutoffDate },
      });
    } catch (error) {
      logger.error('Cleanup error:', error);
    }
  });
}

async function aggregateHourlyMetrics() {
  const hourAgo = new Date(Date.now() - 3600000);
  
  // Aggregate video metrics
  const videoMetrics = await db.collection('analytics_events').aggregate([
    {
      $match: {
        eventType: { $in: ['video_view', 'video_like', 'video_share'] },
        timestamp: { $gte: hourAgo },
      },
    },
    {
      $group: {
        _id: {
          videoId: '$data.videoId',
          hour: { $hour: '$timestamp' },
        },
        views: {
          $sum: { $cond: [{ $eq: ['$eventType', 'video_view'] }, 1, 0] },
        },
        likes: {
          $sum: { $cond: [{ $eq: ['$eventType', 'video_like'] }, 1, 0] },
        },
        shares: {
          $sum: { $cond: [{ $eq: ['$eventType', 'video_share'] }, 1, 0] },
        },
      },
    },
  ]).toArray();

  // Store aggregated metrics
  if (videoMetrics.length > 0) {
    await db.collection('hourly_video_metrics').insertMany(
      videoMetrics.map(m => ({
        ...m,
        timestamp: hourAgo,
      }))
    );
  }
}

async function generateDailyReports() {
  const yesterday = subDays(new Date(), 1);
  const startOfYesterday = startOfDay(yesterday);
  const endOfYesterday = endOfDay(yesterday);

  // Generate platform summary
  const summary = await db.collection('analytics_events').aggregate([
    {
      $match: {
        timestamp: { $gte: startOfYesterday, $lte: endOfYesterday },
      },
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
      },
    },
    {
      $project: {
        eventType: '$_id',
        total: '$count',
        uniqueUsers: { $size: '$uniqueUsers' },
      },
    },
  ]).toArray();

  // Store daily report
  await db.collection('daily_reports').insertOne({
    date: yesterday,
    summary,
    generatedAt: new Date(),
  });

  logger.info('Daily report generated:', summary);
}

// Worker process for handling analytics queue
queue.createWorker('analytics-events', async (job) => {
  const { eventType, userId, data, timestamp } = job.data;
  
  const event = {
    eventType,
    userId,
    data,
    timestamp: new Date(timestamp),
  };

  await db.collection('analytics_events').insertOne(event);
  await processEvent(event);
}, 10);

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Shutting down analytics service...');
  
  try {
    await cache.getRedis().disconnect();
    await esClient.close();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 3005;
const server = app.listen(PORT, async () => {
  await connectDB();
  scheduleTasks();
  logger.info(`Analytics service listening on port ${PORT}`);
});

module.exports = app;