require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
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
  defaultMeta: { service: 'user-service' },
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

// S3 configuration for profile pictures
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

// Multer S3 configuration for profile pictures
const uploadProfilePic = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: BUCKET_NAME,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const key = `profile-pictures/${req.userId}/${Date.now()}-${uuidv4()}${ext}`;
      cb(null, key);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
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
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ createdAt: -1 });
    await db.collection('follows').createIndex({ follower: 1, following: 1 }, { unique: true });
    await db.collection('follows').createIndex({ following: 1 });
    await db.collection('blocks').createIndex({ blocker: 1, blocked: 1 }, { unique: true });
    logger.info('User indexes created');
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

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    req.userId = userId;
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

// Get user profile
app.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.headers['x-user-id'];

    // Check cache first
    let user = await cache.getUserById(userId);

    if (!user) {
      // Get from database
      user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0, twoFactorSecret: 0 } }
      );

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Cache the user
      await cache.setUser(userId, user);
    }

    // Check if requester is blocked
    if (requesterId && requesterId !== userId) {
      const isBlocked = await checkIfBlocked(userId, requesterId);
      if (isBlocked) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get additional stats
    const [followersCount, followingCount, videosCount] = await Promise.all([
      db.collection('follows').countDocuments({ following: userId }),
      db.collection('follows').countDocuments({ follower: userId }),
      db.collection('videos').countDocuments({ userId, status: 'ready' }),
    ]);

    // Check follow status if requester is logged in
    let isFollowing = false;
    let isFollowedBy = false;
    
    if (requesterId && requesterId !== userId) {
      [isFollowing, isFollowedBy] = await Promise.all([
        checkIfFollowing(requesterId, userId),
        checkIfFollowing(userId, requesterId),
      ]);
    }

    const profile = {
      ...user,
      stats: {
        followers: followersCount,
        following: followingCount,
        videos: videosCount,
        likes: user.stats?.likes || 0,
      },
      isFollowing,
      isFollowedBy,
      isSelf: requesterId === userId,
    };

    res.json({ profile });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
app.put('/profile', [
  authenticateUser,
  body('fullName').optional().notEmpty(),
  body('username').optional().isLength({ min: 3 }),
  body('bio').optional().isLength({ max: 500 }),
  body('website').optional().isURL(),
  body('location').optional(),
  validateRequest
], async (req, res) => {
  try {
    const userId = req.userId;
    const updates = req.body;

    // Check username availability if changing
    if (updates.username) {
      const existing = await db.collection('users').findOne({
        username: updates.username,
        _id: { $ne: new ObjectId(userId) },
      });

      if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    // Update user
    updates.updatedAt = new Date();
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updates }
    );

    // Invalidate cache
    await cache.invalidateUser(userId);

    // Get updated user
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0, twoFactorSecret: 0 } }
    );

    res.json({ user });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload profile picture
app.post('/profile/picture', [
  authenticateUser,
  uploadProfilePic.single('picture')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const userId = req.userId;
    const profilePictureUrl = req.file.location;

    // Process image (create thumbnails)
    // TODO: Use sharp to create different sizes

    // Update user
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          profilePicture: profilePictureUrl,
          updatedAt: new Date(),
        },
      }
    );

    // Invalidate cache
    await cache.invalidateUser(userId);

    res.json({
      message: 'Profile picture updated',
      profilePicture: profilePictureUrl,
    });

  } catch (error) {
    logger.error('Upload profile picture error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// Follow user
app.post('/follow/:targetUserId', [
  authenticateUser,
  param('targetUserId').notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const followerId = req.userId;
    const followingId = req.params.targetUserId;

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const existing = await db.collection('follows').findOne({
      follower: followerId,
      following: followingId,
    });

    if (existing) {
      return res.status(409).json({ error: 'Already following' });
    }

    // Check if blocked
    const isBlocked = await checkIfBlocked(followingId, followerId);
    if (isBlocked) {
      return res.status(403).json({ error: 'Cannot follow this user' });
    }

    // Create follow relationship
    await db.collection('follows').insertOne({
      follower: followerId,
      following: followingId,
      createdAt: new Date(),
    });

    // Update stats
    await Promise.all([
      db.collection('users').updateOne(
        { _id: new ObjectId(followerId) },
        { $inc: { 'stats.following': 1 } }
      ),
      db.collection('users').updateOne(
        { _id: new ObjectId(followingId) },
        { $inc: { 'stats.followers': 1 } }
      ),
    ]);

    // Send notification
    await queue.addNotificationJob({
      userId: followingId,
      type: 'new_follower',
      title: 'New Follower',
      message: `${req.user?.username || 'Someone'} started following you`,
      data: { followerId },
    });

    // Invalidate caches
    await Promise.all([
      cache.invalidateUser(followerId),
      cache.invalidateUser(followingId),
    ]);

    res.json({ message: 'Followed successfully' });

  } catch (error) {
    logger.error('Follow error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow user
app.delete('/follow/:targetUserId', [
  authenticateUser,
  param('targetUserId').notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const followerId = req.userId;
    const followingId = req.params.targetUserId;

    // Remove follow relationship
    const result = await db.collection('follows').deleteOne({
      follower: followerId,
      following: followingId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Not following this user' });
    }

    // Update stats
    await Promise.all([
      db.collection('users').updateOne(
        { _id: new ObjectId(followerId) },
        { $inc: { 'stats.following': -1 } }
      ),
      db.collection('users').updateOne(
        { _id: new ObjectId(followingId) },
        { $inc: { 'stats.followers': -1 } }
      ),
    ]);

    // Invalidate caches
    await Promise.all([
      cache.invalidateUser(followerId),
      cache.invalidateUser(followingId),
    ]);

    res.json({ message: 'Unfollowed successfully' });

  } catch (error) {
    logger.error('Unfollow error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Get followers
app.get('/:userId/followers', [
  param('userId').notEmpty(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest
], async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get follower relationships
    const follows = await db.collection('follows')
      .find({ following: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get user details
    const followerIds = follows.map(f => new ObjectId(f.follower));
    const users = await db.collection('users')
      .find(
        { _id: { $in: followerIds } },
        { projection: { password: 0, twoFactorSecret: 0 } }
      )
      .toArray();

    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const followers = follows.map(f => ({
      user: userMap.get(f.follower),
      followedAt: f.createdAt,
    }));

    res.json({
      followers,
      pagination: {
        page,
        limit,
        hasMore: follows.length === limit,
      },
    });

  } catch (error) {
    logger.error('Get followers error:', error);
    res.status(500).json({ error: 'Failed to get followers' });
  }
});

// Get following
app.get('/:userId/following', [
  param('userId').notEmpty(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest
], async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get following relationships
    const follows = await db.collection('follows')
      .find({ follower: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get user details
    const followingIds = follows.map(f => new ObjectId(f.following));
    const users = await db.collection('users')
      .find(
        { _id: { $in: followingIds } },
        { projection: { password: 0, twoFactorSecret: 0 } }
      )
      .toArray();

    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const following = follows.map(f => ({
      user: userMap.get(f.following),
      followedAt: f.createdAt,
    }));

    res.json({
      following,
      pagination: {
        page,
        limit,
        hasMore: follows.length === limit,
      },
    });

  } catch (error) {
    logger.error('Get following error:', error);
    res.status(500).json({ error: 'Failed to get following' });
  }
});

// Block user
app.post('/block/:targetUserId', [
  authenticateUser,
  param('targetUserId').notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const blockerId = req.userId;
    const blockedId = req.params.targetUserId;

    if (blockerId === blockedId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    // Check if already blocked
    const existing = await db.collection('blocks').findOne({
      blocker: blockerId,
      blocked: blockedId,
    });

    if (existing) {
      return res.status(409).json({ error: 'Already blocked' });
    }

    // Create block relationship
    await db.collection('blocks').insertOne({
      blocker: blockerId,
      blocked: blockedId,
      createdAt: new Date(),
    });

    // Remove any follow relationships
    await db.collection('follows').deleteMany({
      $or: [
        { follower: blockerId, following: blockedId },
        { follower: blockedId, following: blockerId },
      ],
    });

    res.json({ message: 'User blocked successfully' });

  } catch (error) {
    logger.error('Block error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// Unblock user
app.delete('/block/:targetUserId', [
  authenticateUser,
  param('targetUserId').notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const blockerId = req.userId;
    const blockedId = req.params.targetUserId;

    const result = await db.collection('blocks').deleteOne({
      blocker: blockerId,
      blocked: blockedId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not blocked' });
    }

    res.json({ message: 'User unblocked successfully' });

  } catch (error) {
    logger.error('Unblock error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// Search users
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

    // Search users by username or full name
    const users = await db.collection('users')
      .find({
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { fullName: { $regex: q, $options: 'i' } },
        ],
      })
      .sort({ 'stats.followers': -1 })
      .skip(skip)
      .limit(limit)
      .project({ password: 0, twoFactorSecret: 0 })
      .toArray();

    res.json({
      users,
      query: q,
      pagination: {
        page,
        limit,
        hasMore: users.length === limit,
      },
    });

  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get suggested users
app.get('/suggestions', [
  authenticateUser,
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validateRequest
], async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 10;

    // Get users the current user follows
    const following = await db.collection('follows')
      .find({ follower: userId })
      .toArray();
    
    const followingIds = following.map(f => f.following);

    // Find users followed by people you follow (collaborative filtering)
    const suggestions = await db.collection('follows').aggregate([
      // Find follows by people you follow
      { $match: { follower: { $in: followingIds } } },
      // Group by followed user
      { $group: { _id: '$following', count: { $sum: 1 } } },
      // Filter out already followed users and self
      { $match: { 
        _id: { 
          $nin: [...followingIds, userId] 
        } 
      }},
      // Sort by popularity among your network
      { $sort: { count: -1 } },
      { $limit: limit * 2 }, // Get extra to filter later
      // Join with user data
      { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      }},
      { $unwind: '$user' },
      // Filter out blocked users
      { $lookup: {
        from: 'blocks',
        let: { userId: '$_id' },
        pipeline: [
          { $match: {
            $expr: {
              $or: [
                { $and: [
                  { $eq: ['$blocker', userId] },
                  { $eq: ['$blocked', '$$userId'] }
                ]},
                { $and: [
                  { $eq: ['$blocker', '$$userId'] },
                  { $eq: ['$blocked', userId] }
                ]}
              ]
            }
          }}
        ],
        as: 'blocks',
      }},
      { $match: { blocks: { $size: 0 } } },
      // Project final data
      { $project: {
        _id: 0,
        user: {
          _id: '$user._id',
          username: '$user.username',
          fullName: '$user.fullName',
          profilePicture: '$user.profilePicture',
          bio: '$user.bio',
          stats: '$user.stats',
        },
        mutualFollowers: '$count',
      }},
      { $limit: limit },
    ]).toArray();

    res.json({ suggestions });

  } catch (error) {
    logger.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Update user preferences
app.put('/preferences', [
  authenticateUser,
  body('emailNotifications').optional().isBoolean(),
  body('pushNotifications').optional().isBoolean(),
  body('privacy').optional().isIn(['public', 'private']),
  body('language').optional(),
  body('darkMode').optional().isBoolean(),
  validateRequest
], async (req, res) => {
  try {
    const userId = req.userId;
    const preferences = req.body;

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'preferences': { ...preferences },
          updatedAt: new Date(),
        },
      }
    );

    await cache.invalidateUser(userId);

    res.json({ message: 'Preferences updated successfully' });

  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Delete account
app.delete('/account', [
  authenticateUser,
  body('password').notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const userId = req.userId;

    // Verify password (would need auth service in production)
    // For now, we'll proceed with deletion

    // Soft delete user
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          deletedAt: new Date(),
          status: 'deleted',
        },
      }
    );

    // Queue cleanup job
    await queue.addBulkJob('delete-user-data', {
      userId,
      tasks: [
        'delete-videos',
        'delete-comments',
        'delete-likes',
        'delete-follows',
        'delete-messages',
      ],
    });

    // Clear cache
    await cache.clearUserCache(userId);

    res.json({ message: 'Account deletion initiated' });

  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Helper functions
async function checkIfFollowing(followerId, followingId) {
  const follow = await db.collection('follows').findOne({
    follower: followerId,
    following: followingId,
  });
  return !!follow;
}

async function checkIfBlocked(blockerId, blockedId) {
  const block = await db.collection('blocks').findOne({
    blocker: blockerId,
    blocked: blockedId,
  });
  return !!block;
}

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Shutting down user service...');
  
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
const PORT = process.env.PORT || 3003;
const server = app.listen(PORT, async () => {
  await connectDB();
  logger.info(`User service listening on port ${PORT}`);
});

module.exports = app;