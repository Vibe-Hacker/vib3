require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const winston = require('winston');
const { body, query, param, validationResult } = require('express-validator');
const { getCacheManager } = require('@vib3/cache');
const { getMessageQueue } = require('@vib3/queue');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'video-service' },
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

// Cache and Queue managers
const cache = getCacheManager();
const queue = getMessageQueue();

// S3 configuration
const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
  region: process.env.DO_SPACES_REGION || 'nyc3',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'vib3-videos';
const CDN_URL = process.env.CDN_URL || `https://${BUCKET_NAME}.nyc3.cdn.digitaloceanspaces.com`;

// Multer S3 configuration
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: BUCKET_NAME,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const key = `videos/${Date.now()}-${uuidv4()}${ext}`;
      cb(null, key);
    },
  }),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  },
});

// Connect to MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db('vib3');
    logger.info('Connected to MongoDB');
    
    // Create indexes
    await createIndexes();
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Create database indexes
async function createIndexes() {
  try {
    await db.collection('videos').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('videos').createIndex({ createdAt: -1 });
    await db.collection('videos').createIndex({ viewCount: -1 });
    await db.collection('videos').createIndex({ trendingScore: -1 });
    await db.collection('videos').createIndex({ hashtags: 1 });
    await db.collection('videos').createIndex({ category: 1 });
    await db.collection('videos').createIndex({ 'location.coordinates': '2dsphere' });
    logger.info('Video indexes created');
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

// Authentication middleware (checks with auth service)
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    // In production, verify with auth service
    // For now, extract user ID from token
    const token = authHeader.split(' ')[1];
    // TODO: Verify token with auth service
    req.userId = req.headers['x-user-id'] || 'test-user';
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Upload video
app.post('/upload', authenticateUser, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const { title, description, hashtags, category, privacy } = req.body;

    // Create video document
    const videoId = new ObjectId();
    const video = {
      _id: videoId,
      userId: req.userId,
      title: title || 'Untitled',
      description: description || '',
      hashtags: hashtags ? hashtags.split(',').map(h => h.trim()) : [],
      category: category || 'general',
      privacy: privacy || 'public',
      originalUrl: req.file.location,
      cdnUrl: `${CDN_URL}/${req.file.key}`,
      s3Key: req.file.key,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      duration: null, // Will be set by video processor
      width: null,
      height: null,
      thumbnailUrl: null,
      hlsUrl: null,
      qualities: [],
      status: 'processing',
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      trendingScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    await db.collection('videos').insertOne(video);

    // Add to processing queue
    await queue.addVideoProcessingJob({
      videoId: videoId.toString(),
      userId: req.userId,
      filePath: req.file.key,
      originalUrl: req.file.location,
    });

    // Add thumbnail generation job
    await queue.addThumbnailJob({
      videoId: videoId.toString(),
      videoUrl: req.file.location,
    });

    // Cache the video data
    await cache.setVideo(videoId.toString(), video);

    logger.info(`Video uploaded: ${videoId} by user ${req.userId}`);

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        id: videoId,
        url: video.cdnUrl,
        status: video.status,
      },
    });

  } catch (error) {
    logger.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Get video by ID
app.get('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;

    // Try cache first
    let video = await cache.getVideo(videoId);

    if (!video) {
      // Get from database
      video = await db.collection('videos').findOne({ 
        _id: new ObjectId(videoId) 
      });

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Cache for future requests
      await cache.setVideo(videoId, video);
    }

    // Increment view count asynchronously
    setImmediate(async () => {
      await incrementViewCount(videoId);
    });

    res.json({ video });

  } catch (error) {
    logger.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to get video' });
  }
});

// Get videos feed
app.get('/feed', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isString(),
  validateRequest
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category;

    // Build query
    const query = { 
      status: 'ready',
      privacy: 'public',
    };

    if (category) {
      query.category = category;
    }

    // Get videos
    const videos = await db.collection('videos')
      .find(query)
      .sort({ trendingScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get user data for videos
    const userIds = [...new Set(videos.map(v => v.userId))];
    const users = await db.collection('users')
      .find({ _id: { $in: userIds } })
      .project({ username: 1, fullName: 1, profilePicture: 1 })
      .toArray();

    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Enrich videos with user data
    const enrichedVideos = videos.map(video => ({
      ...video,
      user: userMap.get(video.userId.toString()) || null,
    }));

    res.json({
      videos: enrichedVideos,
      pagination: {
        page,
        limit,
        hasMore: videos.length === limit,
      },
    });

  } catch (error) {
    logger.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

// Get trending videos
app.get('/trending', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('timeframe').optional().isIn(['day', 'week', 'month']),
  validateRequest
], async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const timeframe = req.query.timeframe || 'day';

    // Calculate date range
    const now = new Date();
    const dateRange = {
      day: new Date(now - 24 * 60 * 60 * 1000),
      week: new Date(now - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now - 30 * 24 * 60 * 60 * 1000),
    };

    // Try cache first
    const cacheKey = `trending:${timeframe}`;
    const cached = await cache.getTrendingVideos(cacheKey, limit);

    if (cached && cached.length > 0) {
      return res.json({ videos: cached });
    }

    // Get from database
    const videos = await db.collection('videos')
      .find({
        status: 'ready',
        privacy: 'public',
        createdAt: { $gte: dateRange[timeframe] },
      })
      .sort({ trendingScore: -1 })
      .limit(limit)
      .toArray();

    // Cache the results
    if (videos.length > 0) {
      await cache.setVideoBatch(videos);
      for (const video of videos) {
        await cache.updateTrendingScore(video._id.toString(), cacheKey, video.trendingScore);
      }
    }

    res.json({ videos });

  } catch (error) {
    logger.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to get trending videos' });
  }
});

// Get videos by user
app.get('/user/:userId', [
  param('userId').notEmpty(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validateRequest
], async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const videos = await db.collection('videos')
      .find({ 
        userId,
        status: 'ready',
        privacy: { $in: ['public', 'followers'] }, // Add logic for followers
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    res.json({
      videos,
      pagination: {
        page,
        limit,
        hasMore: videos.length === limit,
      },
    });

  } catch (error) {
    logger.error('User videos error:', error);
    res.status(500).json({ error: 'Failed to get user videos' });
  }
});

// Search videos
app.get('/search', [
  query('q').notEmpty(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validateRequest
], async (req, res) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Check cache first
    const cached = await cache.getSearchResults(q, page);
    if (cached) {
      return res.json(cached);
    }

    // Search in database
    const videos = await db.collection('videos')
      .find({
        $and: [
          { status: 'ready', privacy: 'public' },
          {
            $or: [
              { title: { $regex: q, $options: 'i' } },
              { description: { $regex: q, $options: 'i' } },
              { hashtags: { $in: [new RegExp(q, 'i')] } },
            ],
          },
        ],
      })
      .sort({ trendingScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const result = {
      videos,
      query: q,
      pagination: {
        page,
        limit,
        hasMore: videos.length === limit,
      },
    };

    // Cache the results
    await cache.setSearchResults(q, page, result);

    res.json(result);

  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search videos' });
  }
});

// Get videos by hashtag
app.get('/hashtag/:hashtag', [
  param('hashtag').notEmpty(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validateRequest
], async (req, res) => {
  try {
    const { hashtag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Check cache first
    const cached = await cache.getHashtagVideos(hashtag, page, limit);
    if (cached && cached.length > 0) {
      return res.json({ videos: cached, hashtag });
    }

    const videos = await db.collection('videos')
      .find({
        hashtags: { $regex: new RegExp(`^${hashtag}$`, 'i') },
        status: 'ready',
        privacy: 'public',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Update hashtag trending score
    await cache.incrementHashtagScore(hashtag);

    // Cache videos
    for (const video of videos) {
      await cache.addVideoToHashtag(hashtag, video._id.toString());
    }

    res.json({
      videos,
      hashtag,
      pagination: {
        page,
        limit,
        hasMore: videos.length === limit,
      },
    });

  } catch (error) {
    logger.error('Hashtag videos error:', error);
    res.status(500).json({ error: 'Failed to get hashtag videos' });
  }
});

// Update video
app.put('/:videoId', [
  authenticateUser,
  param('videoId').notEmpty(),
  body('title').optional().notEmpty(),
  body('description').optional(),
  body('hashtags').optional().isArray(),
  body('privacy').optional().isIn(['public', 'private', 'followers']),
  validateRequest
], async (req, res) => {
  try {
    const { videoId } = req.params;
    const updates = req.body;

    // Verify ownership
    const video = await db.collection('videos').findOne({ 
      _id: new ObjectId(videoId) 
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to update this video' });
    }

    // Update video
    updates.updatedAt = new Date();
    await db.collection('videos').updateOne(
      { _id: new ObjectId(videoId) },
      { $set: updates }
    );

    // Update cache
    await cache.invalidateVideo(videoId);

    res.json({ message: 'Video updated successfully' });

  } catch (error) {
    logger.error('Update video error:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Delete video
app.delete('/:videoId', [
  authenticateUser,
  param('videoId').notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { videoId } = req.params;

    // Verify ownership
    const video = await db.collection('videos').findOne({ 
      _id: new ObjectId(videoId) 
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this video' });
    }

    // Mark as deleted (soft delete)
    await db.collection('videos').updateOne(
      { _id: new ObjectId(videoId) },
      { 
        $set: { 
          status: 'deleted',
          deletedAt: new Date(),
        }
      }
    );

    // Remove from cache
    await cache.invalidateVideo(videoId);

    // TODO: Queue job to delete from S3

    res.json({ message: 'Video deleted successfully' });

  } catch (error) {
    logger.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Get video stream URL (with quality selection)
app.get('/:videoId/stream', [
  param('videoId').notEmpty(),
  query('quality').optional().isIn(['360p', '480p', '720p', '1080p', 'auto']),
  validateRequest
], async (req, res) => {
  try {
    const { videoId } = req.params;
    const quality = req.query.quality || 'auto';

    const video = await db.collection('videos').findOne({ 
      _id: new ObjectId(videoId) 
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Return appropriate URL based on quality
    let streamUrl = video.cdnUrl;

    if (quality === 'auto' && video.hlsUrl) {
      streamUrl = video.hlsUrl; // HLS adaptive streaming
    } else if (video.qualities && video.qualities[quality]) {
      streamUrl = video.qualities[quality];
    }

    // Generate signed URL if needed
    if (video.privacy !== 'public') {
      // TODO: Generate signed URL for private videos
    }

    res.json({
      url: streamUrl,
      quality,
      type: video.hlsUrl && quality === 'auto' ? 'hls' : 'mp4',
    });

  } catch (error) {
    logger.error('Stream URL error:', error);
    res.status(500).json({ error: 'Failed to get stream URL' });
  }
});

// Report video
app.post('/:videoId/report', [
  authenticateUser,
  param('videoId').notEmpty(),
  body('reason').notEmpty().isIn(['spam', 'inappropriate', 'copyright', 'other']),
  body('description').optional(),
  validateRequest
], async (req, res) => {
  try {
    const { videoId } = req.params;
    const { reason, description } = req.body;

    await db.collection('video_reports').insertOne({
      videoId: new ObjectId(videoId),
      reportedBy: req.userId,
      reason,
      description,
      status: 'pending',
      createdAt: new Date(),
    });

    res.json({ message: 'Video reported successfully' });

  } catch (error) {
    logger.error('Report video error:', error);
    res.status(500).json({ error: 'Failed to report video' });
  }
});

// Helper functions
async function incrementViewCount(videoId) {
  try {
    // Update database
    await db.collection('videos').updateOne(
      { _id: new ObjectId(videoId) },
      { $inc: { viewCount: 1 } }
    );

    // Update cache
    await cache.incrementVideoView(videoId);

    // Add to analytics queue
    await queue.addAnalyticsEvent({
      eventType: 'video_view',
      data: { videoId },
      timestamp: new Date(),
    });

  } catch (error) {
    logger.error('Error incrementing view count:', error);
  }
}

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Shutting down video service...');
  
  try {
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
const PORT = process.env.PORT || 3002;
const server = app.listen(PORT, async () => {
  await connectDB();
  logger.info(`Video service listening on port ${PORT}`);
});

module.exports = app;