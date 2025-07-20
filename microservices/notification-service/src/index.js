require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { MongoClient, ObjectId } = require('mongodb');
const Redis = require('ioredis');
const winston = require('winston');
const { body, query, param, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getCacheManager } = require('@vib3/cache');
const { getMessageQueue } = require('@vib3/queue');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'notification-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Express app and Socket.io
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

app.use(express.json());

// MongoDB connection
let db;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vib3';

// Redis for Socket.io adapter
const pubClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});
const subClient = pubClient.duplicate();

// Set up Socket.io Redis adapter
io.adapter(createAdapter(pubClient, subClient));

// Cache and Queue managers
const cache = getCacheManager();
const queue = getMessageQueue();

// Push notification clients
let firebaseApp;
const expo = new Expo();

// Email transporter
let emailTransporter;

// Template cache
const templateCache = new Map();

// Connect to databases
async function connectDB() {
  try {
    // MongoDB
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db('vib3');
    logger.info('Connected to MongoDB');

    // Create indexes
    await createIndexes();

    // Initialize Firebase (if credentials available)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
      });
      logger.info('Firebase initialized');
    }

    // Initialize email transporter
    if (process.env.SMTP_HOST) {
      emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      
      await emailTransporter.verify();
      logger.info('Email transporter initialized');
    }

  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
}

// Create database indexes
async function createIndexes() {
  try {
    await db.collection('notifications').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('notifications').createIndex({ userId: 1, read: 1 });
    await db.collection('notifications').createIndex({ createdAt: -1 });
    await db.collection('push_tokens').createIndex({ userId: 1 });
    await db.collection('email_logs').createIndex({ userId: 1, sentAt: -1 });
    logger.info('Notification indexes created');
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

// Socket.io authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;

    if (!userId) {
      return next(new Error('Authentication error'));
    }

    // TODO: Verify token with auth service
    socket.userId = userId;
    socket.join(`user:${userId}`);

    logger.info(`User ${userId} connected via WebSocket`);
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  const userId = socket.userId;

  // Join user's notification room
  socket.join(`notifications:${userId}`);

  // Send pending notifications
  sendPendingNotifications(userId);

  // Handle marking notifications as read
  socket.on('markAsRead', async (notificationIds) => {
    try {
      await markNotificationsAsRead(userId, notificationIds);
      socket.emit('marked_as_read', { notificationIds });
    } catch (error) {
      logger.error('Error marking notifications as read:', error);
      socket.emit('error', { message: 'Failed to mark as read' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`User ${userId} disconnected`);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connections: io.engine.clientsCount,
  });
});

// Register push token
app.post('/tokens', [
  body('userId').notEmpty(),
  body('token').notEmpty(),
  body('platform').notEmpty().isIn(['ios', 'android', 'web']),
  body('deviceId').optional(),
  validateRequest
], async (req, res) => {
  try {
    const { userId, token, platform, deviceId } = req.body;

    await db.collection('push_tokens').updateOne(
      { userId, deviceId: deviceId || 'default' },
      {
        $set: {
          token,
          platform,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.json({ message: 'Token registered successfully' });

  } catch (error) {
    logger.error('Register token error:', error);
    res.status(500).json({ error: 'Failed to register token' });
  }
});

// Get notifications
app.get('/notifications/:userId', [
  param('userId').notEmpty(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('unreadOnly').optional().isBoolean(),
  validateRequest
], async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';

    const query = { userId };
    if (unreadOnly) {
      query.read = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      db.collection('notifications')
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('notifications').countDocuments({ userId, read: false }),
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        hasMore: notifications.length === limit,
      },
    });

  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notifications as read
app.put('/notifications/:userId/read', [
  param('userId').notEmpty(),
  body('notificationIds').optional().isArray(),
  validateRequest
], async (req, res) => {
  try {
    const { userId } = req.params;
    const { notificationIds } = req.body;

    const query = { userId, read: false };
    if (notificationIds && notificationIds.length > 0) {
      query._id = { $in: notificationIds.map(id => new ObjectId(id)) };
    }

    const result = await db.collection('notifications').updateMany(
      query,
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      }
    );

    // Update cache
    await cache.del(`notifications:${userId}`);

    res.json({
      message: 'Notifications marked as read',
      modifiedCount: result.modifiedCount,
    });

  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Delete notification
app.delete('/notifications/:userId/:notificationId', [
  param('userId').notEmpty(),
  param('notificationId').notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { userId, notificationId } = req.params;

    const result = await db.collection('notifications').deleteOne({
      _id: new ObjectId(notificationId),
      userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });

  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Update notification preferences
app.put('/preferences/:userId', [
  param('userId').notEmpty(),
  body('email').optional().isObject(),
  body('push').optional().isObject(),
  body('inApp').optional().isObject(),
  validateRequest
], async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    await db.collection('notification_preferences').updateOne(
      { userId },
      {
        $set: {
          ...preferences,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.json({ message: 'Preferences updated successfully' });

  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Send test notification (admin)
app.post('/test', [
  body('userId').notEmpty(),
  body('type').notEmpty(),
  body('title').notEmpty(),
  body('message').notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { userId, type, title, message } = req.body;

    await sendNotification({
      userId,
      type,
      title,
      message,
      data: { test: true },
    });

    res.json({ message: 'Test notification sent' });

  } catch (error) {
    logger.error('Send test notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Core notification functions
async function sendNotification(notification) {
  try {
    const { userId, type, title, message, data = {} } = notification;

    // Check user preferences
    const preferences = await getUserNotificationPreferences(userId);
    
    // Create notification record
    const notificationDoc = {
      _id: new ObjectId(),
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
    };

    await db.collection('notifications').insertOne(notificationDoc);

    // Send via different channels based on preferences
    const promises = [];

    // In-app notification via WebSocket
    if (preferences.inApp[type] !== false) {
      promises.push(sendWebSocketNotification(userId, notificationDoc));
    }

    // Push notification
    if (preferences.push[type] !== false) {
      promises.push(sendPushNotification(userId, { title, message, data }));
    }

    // Email notification (for certain types)
    if (preferences.email[type] && shouldSendEmail(type)) {
      promises.push(sendEmailNotification(userId, { type, title, message, data }));
    }

    await Promise.allSettled(promises);

    // Cache the notification
    await cache.addNotification(userId, notificationDoc);

    logger.info(`Notification sent to user ${userId}: ${type}`);

  } catch (error) {
    logger.error('Send notification error:', error);
    throw error;
  }
}

async function sendWebSocketNotification(userId, notification) {
  try {
    io.to(`notifications:${userId}`).emit('new_notification', notification);
  } catch (error) {
    logger.error('WebSocket notification error:', error);
  }
}

async function sendPushNotification(userId, { title, message, data }) {
  try {
    // Get user's push tokens
    const tokens = await db.collection('push_tokens')
      .find({ userId })
      .toArray();

    if (tokens.length === 0) {
      return;
    }

    // Send to each platform
    for (const tokenDoc of tokens) {
      const { token, platform } = tokenDoc;

      if (platform === 'web' && firebaseApp) {
        // Firebase Cloud Messaging for web
        await admin.messaging().send({
          token,
          notification: { title, body: message },
          data: { ...data, userId },
        });
      } else if (platform === 'expo') {
        // Expo push notifications
        if (!Expo.isExpoPushToken(token)) {
          continue;
        }

        await expo.sendPushNotificationsAsync([{
          to: token,
          title,
          body: message,
          data,
          priority: 'high',
        }]);
      }
      // Add other platforms (iOS, Android native) as needed
    }

  } catch (error) {
    logger.error('Push notification error:', error);
  }
}

async function sendEmailNotification(userId, { type, title, message, data }) {
  try {
    if (!emailTransporter) {
      return;
    }

    // Get user email
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { email: 1, fullName: 1 } }
    );

    if (!user || !user.email) {
      return;
    }

    // Get email template
    const template = await getEmailTemplate(type);
    const html = template({
      userName: user.fullName || 'User',
      title,
      message,
      data,
      actionUrl: `${process.env.APP_URL}/notifications`,
    });

    // Send email
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || 'VIB3 <noreply@vib3.app>',
      to: user.email,
      subject: title,
      html,
    });

    // Log email
    await db.collection('email_logs').insertOne({
      userId,
      type,
      sentAt: new Date(),
    });

  } catch (error) {
    logger.error('Email notification error:', error);
  }
}

async function getUserNotificationPreferences(userId) {
  const prefs = await db.collection('notification_preferences').findOne({ userId });
  
  // Default preferences
  return prefs || {
    email: {
      new_follower: true,
      video_like: false,
      video_comment: true,
      video_share: false,
      mention: true,
      weekly_digest: true,
    },
    push: {
      new_follower: true,
      video_like: true,
      video_comment: true,
      video_share: true,
      mention: true,
    },
    inApp: {
      // All in-app notifications enabled by default
    },
  };
}

function shouldSendEmail(type) {
  // Only send emails for important notifications
  const emailTypes = [
    'new_follower',
    'video_comment',
    'mention',
    'weekly_digest',
    'account_warning',
    'video_removed',
  ];
  
  return emailTypes.includes(type);
}

async function getEmailTemplate(type) {
  // Check cache
  if (templateCache.has(type)) {
    return templateCache.get(type);
  }

  // Load template
  const templatePath = path.join(__dirname, 'templates', `${type}.hbs`);
  let templateContent;
  
  try {
    templateContent = await fs.readFile(templatePath, 'utf8');
  } catch (error) {
    // Use default template
    templateContent = await fs.readFile(
      path.join(__dirname, 'templates', 'default.hbs'),
      'utf8'
    );
  }

  const compiled = handlebars.compile(templateContent);
  templateCache.set(type, compiled);
  
  return compiled;
}

async function sendPendingNotifications(userId) {
  try {
    const notifications = await db.collection('notifications')
      .find({ userId, read: false })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    if (notifications.length > 0) {
      io.to(`notifications:${userId}`).emit('pending_notifications', notifications);
    }
  } catch (error) {
    logger.error('Send pending notifications error:', error);
  }
}

async function markNotificationsAsRead(userId, notificationIds) {
  const query = { userId };
  
  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds.map(id => new ObjectId(id)) };
  } else {
    query.read = false;
  }

  await db.collection('notifications').updateMany(
    query,
    {
      $set: {
        read: true,
        readAt: new Date(),
      },
    }
  );
}

// Process notification queue
queue.createWorker('notifications', async (job) => {
  const notification = job.data;
  await sendNotification(notification);
}, 5);

// Process email queue
queue.createWorker('emails', async (job) => {
  const { to, subject, template, data } = job.data;
  
  if (!emailTransporter) {
    logger.warn('Email transporter not configured');
    return;
  }

  const templateFn = await getEmailTemplate(template);
  const html = templateFn(data);

  await emailTransporter.sendMail({
    from: process.env.EMAIL_FROM || 'VIB3 <noreply@vib3.app>',
    to,
    subject,
    html,
  });
}, 3);

// Scheduled notifications
const cron = require('node-cron');

// Weekly digest emails
cron.schedule('0 10 * * 1', async () => {
  try {
    logger.info('Sending weekly digest emails...');
    await sendWeeklyDigests();
  } catch (error) {
    logger.error('Weekly digest error:', error);
  }
});

async function sendWeeklyDigests() {
  // Get users who want weekly digests
  const users = await db.collection('notification_preferences')
    .find({ 'email.weekly_digest': true })
    .toArray();

  for (const pref of users) {
    try {
      const userId = pref.userId;
      
      // Get user's weekly stats
      const stats = await getWeeklyStats(userId);
      
      if (stats.hasActivity) {
        await queue.addEmailJob({
          to: stats.email,
          subject: 'Your VIB3 Weekly Digest',
          template: 'weekly_digest',
          data: stats,
        });
      }
    } catch (error) {
      logger.error(`Weekly digest error for user ${pref.userId}:`, error);
    }
  }
}

async function getWeeklyStats(userId) {
  // This would aggregate user's weekly activity
  // Placeholder implementation
  return {
    userId,
    hasActivity: true,
    newFollowers: 10,
    totalViews: 1000,
    topVideo: {
      title: 'Your top video',
      views: 500,
    },
  };
}

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Shutting down notification service...');
  
  try {
    io.close();
    await pubClient.quit();
    await subClient.quit();
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
const PORT = process.env.PORT || 3006;
server.listen(PORT, async () => {
  await connectDB();
  logger.info(`Notification service listening on port ${PORT}`);
});

module.exports = { app, io };