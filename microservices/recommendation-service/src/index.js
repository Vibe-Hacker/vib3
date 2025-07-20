require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const winston = require('winston');
const prometheus = require('prom-client');
const { getCacheManager } = require('@vib3/cache');
const RecommendationEngine = require('./recommendation/RecommendationEngine');
const MLPipeline = require('./ml/MLPipeline');
const ContentAnalyzer = require('./analyzers/ContentAnalyzer');
const UserBehaviorTracker = require('./tracking/UserBehaviorTracker');
const cron = require('node-cron');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'recommendation-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Prometheus metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'recommendation_request_duration_seconds',
  help: 'Duration of recommendation requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const recommendationGenerationTime = new prometheus.Histogram({
  name: 'recommendation_generation_seconds',
  help: 'Time to generate recommendations',
  labelNames: ['algorithm', 'user_segment'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2],
});

const cacheHitRate = new prometheus.Gauge({
  name: 'recommendation_cache_hit_rate',
  help: 'Cache hit rate for recommendations',
});

prometheus.register.registerMetric(httpRequestDuration);
prometheus.register.registerMetric(recommendationGenerationTime);
prometheus.register.registerMetric(cacheHitRate);

// Express app
const app = express();
app.use(express.json({ limit: '10mb' }));

// MongoDB connection
let db;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vib3';

// Cache manager
const cache = getCacheManager();

// Services
let recommendationEngine;
let mlPipeline;
let contentAnalyzer;
let behaviorTracker;

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode,
    }, duration);
  });
  
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});

// Get recommendations for a user
app.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      limit = 20, 
      page = 1,
      type = 'personalized', // personalized, trending, similar, discovery
      excludeViewed = true 
    } = req.query;

    const startTime = Date.now();

    // Check cache first
    const cacheKey = `recommendations:${userId}:${type}:${page}`;
    const cached = await cache.getUserRecommendations(userId, page, limit);
    
    if (cached && cached.length > 0) {
      cacheHitRate.set(1);
      return res.json({
        recommendations: cached,
        source: 'cache',
        page: parseInt(page),
        limit: parseInt(limit),
      });
    }

    cacheHitRate.set(0);

    // Generate recommendations based on type
    let recommendations;
    const userSegment = await recommendationEngine.getUserSegment(userId);

    switch (type) {
      case 'personalized':
        recommendations = await recommendationEngine.getPersonalizedRecommendations(
          userId, limit, excludeViewed
        );
        break;
      
      case 'trending':
        recommendations = await recommendationEngine.getTrendingRecommendations(
          userId, limit, userSegment
        );
        break;
      
      case 'similar':
        const { videoId } = req.query;
        if (!videoId) {
          return res.status(400).json({ error: 'videoId required for similar recommendations' });
        }
        recommendations = await recommendationEngine.getSimilarVideos(
          videoId, userId, limit
        );
        break;
      
      case 'discovery':
        recommendations = await recommendationEngine.getDiscoveryRecommendations(
          userId, limit
        );
        break;
      
      default:
        recommendations = await recommendationEngine.getPersonalizedRecommendations(
          userId, limit, excludeViewed
        );
    }

    // Cache the recommendations
    if (recommendations.length > 0) {
      await cache.setUserRecommendations(userId, recommendations.map(r => r.videoId));
    }

    // Track generation time
    const generationTime = (Date.now() - startTime) / 1000;
    recommendationGenerationTime.observe({
      algorithm: type,
      user_segment: userSegment,
    }, generationTime);

    res.json({
      recommendations,
      source: 'generated',
      page: parseInt(page),
      limit: parseInt(limit),
      generationTime,
    });

  } catch (error) {
    logger.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get recommendations for anonymous users
app.get('/recommendations/anonymous/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 20 } = req.query;

    // Get popular/trending content for anonymous users
    const recommendations = await recommendationEngine.getAnonymousRecommendations(
      sessionId, limit
    );

    res.json({
      recommendations,
      source: 'anonymous',
      limit: parseInt(limit),
    });

  } catch (error) {
    logger.error('Error getting anonymous recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Record user interaction
app.post('/interactions', async (req, res) => {
  try {
    const { userId, videoId, action, duration, timestamp } = req.body;

    if (!userId || !videoId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Track the interaction
    await behaviorTracker.trackInteraction({
      userId,
      videoId,
      action,
      duration,
      timestamp: timestamp || new Date(),
    });

    // Update ML model features asynchronously
    setImmediate(async () => {
      try {
        await mlPipeline.updateUserFeatures(userId, { videoId, action, duration });
      } catch (error) {
        logger.error('Error updating ML features:', error);
      }
    });

    res.json({ success: true });

  } catch (error) {
    logger.error('Error recording interaction:', error);
    res.status(500).json({ error: 'Failed to record interaction' });
  }
});

// Batch record interactions
app.post('/interactions/batch', async (req, res) => {
  try {
    const { interactions } = req.body;

    if (!Array.isArray(interactions)) {
      return res.status(400).json({ error: 'Interactions must be an array' });
    }

    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < interactions.length; i += batchSize) {
      const batch = interactions.slice(i, i + batchSize);
      await behaviorTracker.trackBatchInteractions(batch);
    }

    res.json({ 
      success: true, 
      processed: interactions.length 
    });

  } catch (error) {
    logger.error('Error recording batch interactions:', error);
    res.status(500).json({ error: 'Failed to record interactions' });
  }
});

// Analyze content for better recommendations
app.post('/analyze/video', async (req, res) => {
  try {
    const { videoId, title, description, hashtags, thumbnailUrl } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId required' });
    }

    const analysis = await contentAnalyzer.analyzeVideo({
      videoId,
      title,
      description,
      hashtags,
      thumbnailUrl,
    });

    // Store analysis results
    await db.collection('video_analysis').updateOne(
      { videoId },
      { $set: { ...analysis, updatedAt: new Date() } },
      { upsert: true }
    );

    res.json({ 
      videoId,
      analysis,
    });

  } catch (error) {
    logger.error('Error analyzing video:', error);
    res.status(500).json({ error: 'Failed to analyze video' });
  }
});

// Get similar users (for collaborative filtering)
app.get('/users/:userId/similar', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const similarUsers = await recommendationEngine.findSimilarUsers(userId, limit);

    res.json({
      userId,
      similarUsers,
      count: similarUsers.length,
    });

  } catch (error) {
    logger.error('Error finding similar users:', error);
    res.status(500).json({ error: 'Failed to find similar users' });
  }
});

// Get user preferences/profile
app.get('/users/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;

    const preferences = await recommendationEngine.getUserPreferences(userId);

    res.json({
      userId,
      preferences,
    });

  } catch (error) {
    logger.error('Error getting user preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update user preferences
app.put('/users/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const { categories, hashtags, creators, minDuration, maxDuration } = req.body;

    await recommendationEngine.updateUserPreferences(userId, {
      categories,
      hashtags,
      creators,
      minDuration,
      maxDuration,
    });

    // Invalidate recommendation cache
    await cache.del(`recommendations:${userId}:personalized:1`);

    res.json({ success: true });

  } catch (error) {
    logger.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Train/retrain ML models
app.post('/ml/train', async (req, res) => {
  try {
    const { modelType = 'all', async = true } = req.body;

    if (async) {
      // Queue training job
      setImmediate(() => {
        mlPipeline.trainModels(modelType).catch(error => {
          logger.error('Error in async training:', error);
        });
      });

      res.json({ 
        message: 'Training job queued',
        modelType,
      });
    } else {
      // Synchronous training (not recommended for production)
      const results = await mlPipeline.trainModels(modelType);
      res.json({ 
        message: 'Training completed',
        results,
      });
    }

  } catch (error) {
    logger.error('Error initiating training:', error);
    res.status(500).json({ error: 'Failed to initiate training' });
  }
});

// Get ML model performance metrics
app.get('/ml/metrics', async (req, res) => {
  try {
    const metrics = await mlPipeline.getModelMetrics();

    res.json({
      metrics,
      lastTraining: mlPipeline.getLastTrainingTime(),
      modelVersions: mlPipeline.getModelVersions(),
    });

  } catch (error) {
    logger.error('Error getting ML metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// A/B testing endpoints
app.get('/ab-test/:userId/variant', async (req, res) => {
  try {
    const { userId } = req.params;
    const { experiment } = req.query;

    const variant = await recommendationEngine.getABTestVariant(userId, experiment);

    res.json({
      userId,
      experiment,
      variant,
    });

  } catch (error) {
    logger.error('Error getting A/B test variant:', error);
    res.status(500).json({ error: 'Failed to get variant' });
  }
});

// Initialize services
async function initialize() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db('vib3');
    logger.info('Connected to MongoDB');

    // Initialize services
    recommendationEngine = new RecommendationEngine(db, cache);
    mlPipeline = new MLPipeline(db);
    contentAnalyzer = new ContentAnalyzer();
    behaviorTracker = new UserBehaviorTracker(db, cache);

    // Initialize recommendation engine
    await recommendationEngine.initialize();
    logger.info('Recommendation engine initialized');

    // Load ML models
    await mlPipeline.loadModels();
    logger.info('ML models loaded');

    // Schedule periodic tasks
    scheduleTasks();

  } catch (error) {
    logger.error('Failed to initialize services:', error);
    throw error;
  }
}

// Schedule periodic tasks
function scheduleTasks() {
  // Update trending scores every hour
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Updating trending scores...');
      await recommendationEngine.updateTrendingScores();
    } catch (error) {
      logger.error('Error updating trending scores:', error);
    }
  });

  // Retrain ML models daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Starting daily model retraining...');
      await mlPipeline.trainModels('all');
    } catch (error) {
      logger.error('Error in daily model training:', error);
    }
  });

  // Clean up old interactions weekly
  cron.schedule('0 3 * * 0', async () => {
    try {
      logger.info('Cleaning up old interactions...');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days
      
      await db.collection('user_interactions').deleteMany({
        timestamp: { $lt: cutoffDate }
      });
    } catch (error) {
      logger.error('Error cleaning up interactions:', error);
    }
  });

  // Update user segments every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      logger.info('Updating user segments...');
      await recommendationEngine.updateUserSegments();
    } catch (error) {
      logger.error('Error updating user segments:', error);
    }
  });

  // Cache warming every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      logger.info('Warming recommendation cache...');
      await recommendationEngine.warmCache();
    } catch (error) {
      logger.error('Error warming cache:', error);
    }
  });
}

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Shutting down recommendation service...');
  
  try {
    // Save model states
    await mlPipeline.saveModels();
    
    // Close connections
    await cache.getRedis().disconnect();
    
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
const PORT = process.env.PORT || 3004;
const server = app.listen(PORT, async () => {
  await initialize();
  logger.info(`Recommendation service listening on port ${PORT}`);
});

module.exports = app;