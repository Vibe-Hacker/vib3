require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { getCacheManager } = require('@vib3/cache');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'auth-service' },
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

// Cache manager
const cache = getCacheManager();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

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
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('refresh_tokens').createIndex({ token: 1 });
    await db.collection('refresh_tokens').createIndex({ userId: 1 });
    await db.collection('refresh_tokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    logger.info('Database indexes created');
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

// Register endpoint
app.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  validateRequest
], async (req, res) => {
  try {
    const { email, password, username, fullName, phoneNumber } = req.body;

    // Check if user exists
    const existingUser = await db.collection('users').findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      if (existingUser.username === username) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = new MongoClient.ObjectId();
    const user = {
      _id: userId,
      email,
      username,
      password: hashedPassword,
      fullName: fullName || username,
      phoneNumber,
      isVerified: false,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      loginAttempts: 0,
      isLocked: false,
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        privacy: 'public',
      },
      stats: {
        followers: 0,
        following: 0,
        videos: 0,
        likes: 0,
      },
    };

    await db.collection('users').insertOne(user);

    // Generate tokens
    const accessToken = generateAccessToken(userId);
    const refreshToken = await generateRefreshToken(userId);

    // Cache user data
    await cache.setUser(userId.toString(), {
      _id: userId,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
    });

    logger.info(`New user registered: ${username}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
      },
      accessToken,
      refreshToken,
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by email or username
    const user = await db.collection('users').findOne({
      $or: [{ email: username }, { username }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ error: 'Account is locked due to multiple failed attempts' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Increment failed attempts
      await db.collection('users').updateOne(
        { _id: user._id },
        { 
          $inc: { loginAttempts: 1 },
          $set: { 
            lastFailedLogin: new Date(),
            isLocked: user.loginAttempts >= 4 // Lock after 5 attempts
          }
        }
      );

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled && req.body.twoFactorCode) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: req.body.twoFactorCode,
        window: 2,
      });

      if (!verified) {
        return res.status(401).json({ error: 'Invalid 2FA code' });
      }
    } else if (user.twoFactorEnabled) {
      return res.status(200).json({ 
        requiresTwoFactor: true,
        userId: user._id,
      });
    }

    // Reset login attempts and update last login
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          loginAttempts: 0,
          lastLoginAt: new Date(),
          isLocked: false,
        }
      }
    );

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    // Cache user data
    await cache.setUser(user._id.toString(), {
      _id: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
    });

    // Log successful login
    await db.collection('login_history').insertOne({
      userId: user._id,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    logger.info(`User logged in: ${user.username}`);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token endpoint
app.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Find refresh token in database
    const tokenDoc = await db.collection('refresh_tokens').findOne({
      token: refreshToken,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Get user
    const user = await db.collection('users').findOne({ _id: tokenDoc.userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id);

    // Optionally rotate refresh token
    const newRefreshToken = await generateRefreshToken(user._id);

    // Delete old refresh token
    await db.collection('refresh_tokens').deleteOne({ token: refreshToken });

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Logout endpoint
app.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(' ')[1];

    // Delete refresh token
    if (refreshToken) {
      await db.collection('refresh_tokens').deleteOne({ token: refreshToken });
    }

    // Add access token to blacklist (with expiration)
    if (accessToken) {
      const decoded = jwt.decode(accessToken);
      if (decoded) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        await cache.getRedis().client.setex(
          `blacklist:${accessToken}`,
          expiresIn,
          'true'
        );
      }
    }

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Verify token endpoint
app.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { _id: new MongoClient.ObjectId(req.userId) },
      { projection: { password: 0, twoFactorSecret: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    logger.error('Verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Change password
app.post('/change-password', [
  authenticateToken,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  validateRequest
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await db.collection('users').findOne({ 
      _id: new MongoClient.ObjectId(req.userId) 
    });

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date(),
        }
      }
    );

    // Invalidate all refresh tokens
    await db.collection('refresh_tokens').deleteMany({ userId: user._id });

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Enable 2FA
app.post('/2fa/enable', authenticateToken, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `VIB3 (${req.user.username})`,
      issuer: 'VIB3',
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store secret temporarily
    await cache.getRedis().client.setex(
      `2fa:setup:${req.userId}`,
      600, // 10 minutes
      secret.base32
    );

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
    });

  } catch (error) {
    logger.error('2FA enable error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

// Verify and confirm 2FA
app.post('/2fa/verify', [
  authenticateToken,
  body('code').notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { code } = req.body;

    // Get temporary secret
    const secret = await cache.getRedis().client.get(`2fa:setup:${req.userId}`);
    if (!secret) {
      return res.status(400).json({ error: '2FA setup expired' });
    }

    // Verify code
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    // Enable 2FA for user
    await db.collection('users').updateOne(
      { _id: new MongoClient.ObjectId(req.userId) },
      { 
        $set: { 
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          updatedAt: new Date(),
        }
      }
    );

    // Clean up temporary secret
    await cache.getRedis().client.del(`2fa:setup:${req.userId}`);

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    await db.collection('backup_codes').insertOne({
      userId: new MongoClient.ObjectId(req.userId),
      codes: backupCodes.map(code => ({ code: bcrypt.hashSync(code, 10), used: false })),
      createdAt: new Date(),
    });

    res.json({
      message: '2FA enabled successfully',
      backupCodes,
    });

  } catch (error) {
    logger.error('2FA verify error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

// Disable 2FA
app.post('/2fa/disable', [
  authenticateToken,
  body('password').notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { password } = req.body;

    const user = await db.collection('users').findOne({ 
      _id: new MongoClient.ObjectId(req.userId) 
    });

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Disable 2FA
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          twoFactorEnabled: false,
          twoFactorSecret: null,
          updatedAt: new Date(),
        }
      }
    );

    // Delete backup codes
    await db.collection('backup_codes').deleteMany({ userId: user._id });

    res.json({ message: '2FA disabled successfully' });

  } catch (error) {
    logger.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// Request password reset
app.post('/password-reset/request', [
  body('email').isEmail().normalizeEmail(),
  validateRequest
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = await db.collection('users').findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store reset token
    await db.collection('password_resets').insertOne({
      userId: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      createdAt: new Date(),
    });

    // TODO: Send email with reset link
    // For now, log the token
    logger.info(`Password reset requested for ${email}, token: ${resetToken}`);

    res.json({ message: 'If the email exists, a reset link has been sent' });

  } catch (error) {
    logger.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset password
app.post('/password-reset/confirm', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  validateRequest
], async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const resetDoc = await db.collection('password_resets').findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
    });

    if (!resetDoc) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.collection('users').updateOne(
      { _id: resetDoc.userId },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date(),
        }
      }
    );

    // Delete reset token
    await db.collection('password_resets').deleteOne({ _id: resetDoc._id });

    // Invalidate all refresh tokens
    await db.collection('refresh_tokens').deleteMany({ userId: resetDoc.userId });

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    logger.error('Password reset confirm error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Helper functions
function generateAccessToken(userId) {
  return jwt.sign(
    { userId: userId.toString() },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function generateRefreshToken(userId) {
  const token = crypto.randomBytes(64).toString('hex');
  
  await db.collection('refresh_tokens').insertOne({
    token,
    userId,
    expiresAt: new Date(Date.now() + parseDuration(REFRESH_TOKEN_EXPIRES_IN)),
    createdAt: new Date(),
  });

  return token;
}

function parseDuration(duration) {
  const units = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };
  
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 86400000 * 30; // Default 30 days
  
  return parseInt(match[1]) * units[match[2]];
}

function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

// Authentication middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Check if token is blacklisted
    const isBlacklisted = await cache.getRedis().client.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;

    // Get user from cache or database
    let user = await cache.getUserById(decoded.userId);
    if (!user) {
      user = await db.collection('users').findOne(
        { _id: new MongoClient.ObjectId(decoded.userId) },
        { projection: { password: 0, twoFactorSecret: 0 } }
      );
      
      if (user) {
        await cache.setUser(decoded.userId, user);
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Shutting down auth service...');
  
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
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, async () => {
  await connectDB();
  logger.info(`Auth service listening on port ${PORT}`);
});

module.exports = app;