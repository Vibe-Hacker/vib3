const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const expressWinston = require('express-winston');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const prometheus = require('prom-client');
const jwt = require('jsonwebtoken');

// Initialize Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
});

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
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
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Register Prometheus metrics
prometheus.register.registerMetric(httpRequestDuration);
prometheus.register.registerMetric(httpRequestTotal);

// Service discovery configuration
const services = {
  auth: {
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '' },
  },
  video: {
    target: process.env.VIDEO_SERVICE_URL || 'http://video-service:3002',
    changeOrigin: true,
    pathRewrite: { '^/api/video': '' },
  },
  user: {
    target: process.env.USER_SERVICE_URL || 'http://user-service:3003',
    changeOrigin: true,
    pathRewrite: { '^/api/user': '' },
  },
  recommendation: {
    target: process.env.RECOMMENDATION_SERVICE_URL || 'http://recommendation-service:3004',
    changeOrigin: true,
    pathRewrite: { '^/api/recommendation': '' },
  },
  analytics: {
    target: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3005',
    changeOrigin: true,
    pathRewrite: { '^/api/analytics': '' },
  },
  notification: {
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006',
    changeOrigin: true,
    pathRewrite: { '^/api/notification': '' },
  },
};

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "wss:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Request logging
app.use(morgan('combined'));
app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console(),
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json()
  ),
  meta: true,
  expressFormat: true,
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || require('crypto').randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Rate limiting configurations
const createRateLimiter = (windowMs, max, keyPrefix) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      client: redis,
      prefix: `rl:${keyPrefix}:`,
    }),
    message: 'Too many requests from this IP, please try again later.',
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: res.getHeader('Retry-After'),
      });
    },
  });
};

// Different rate limits for different endpoints
const generalLimiter = createRateLimiter(60000, 100, 'general'); // 100 requests per minute
const authLimiter = createRateLimiter(60000, 20, 'auth'); // 20 auth requests per minute
const uploadLimiter = createRateLimiter(60000, 10, 'upload'); // 10 uploads per minute
const feedLimiter = createRateLimiter(60000, 200, 'feed'); // 200 feed requests per minute

// Apply general rate limiting
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token && !isPublicRoute(req.path)) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (token) {
    try {
      // Verify token from cache first
      const cachedUser = await redis.get(`auth:token:${token}`);
      if (cachedUser) {
        req.user = JSON.parse(cachedUser);
        return next();
      }

      // Verify with auth service
      const user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = user;
      
      // Cache for 5 minutes
      await redis.setex(`auth:token:${token}`, 300, JSON.stringify(user));
      
      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      return res.status(403).json({ error: 'Invalid token' });
    }
  } else {
    next();
  }
};

// Check if route is public
const isPublicRoute = (path) => {
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/refresh',
    '/api/video/public',
    '/health',
    '/metrics',
  ];
  return publicRoutes.some(route => path.startsWith(route));
};

// Apply authentication middleware
app.use(authenticateToken);

// Circuit breaker middleware
const circuitBreaker = (serviceName) => {
  const state = { open: false, failures: 0, lastFailTime: null };
  const threshold = 5;
  const timeout = 60000; // 1 minute

  return (req, res, next) => {
    if (state.open) {
      const now = Date.now();
      if (now - state.lastFailTime > timeout) {
        state.open = false;
        state.failures = 0;
      } else {
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          service: serviceName,
          retryAfter: Math.ceil((timeout - (now - state.lastFailTime)) / 1000),
        });
      }
    }

    const originalSend = res.send;
    res.send = function (data) {
      if (res.statusCode >= 500) {
        state.failures++;
        state.lastFailTime = Date.now();
        if (state.failures >= threshold) {
          state.open = true;
          logger.error(`Circuit breaker opened for ${serviceName}`);
        }
      } else {
        state.failures = 0;
      }
      originalSend.call(this, data);
    };

    next();
  };
};

// Service-specific routes with rate limiting and circuit breakers
app.use('/api/auth', authLimiter, circuitBreaker('auth'), 
  createProxyMiddleware(services.auth));

app.use('/api/video/upload', uploadLimiter, circuitBreaker('video'),
  createProxyMiddleware(services.video));

app.use('/api/video', feedLimiter, circuitBreaker('video'),
  createProxyMiddleware(services.video));

app.use('/api/user', circuitBreaker('user'),
  createProxyMiddleware(services.user));

app.use('/api/recommendation', feedLimiter, circuitBreaker('recommendation'),
  createProxyMiddleware(services.recommendation));

app.use('/api/analytics', circuitBreaker('analytics'),
  createProxyMiddleware(services.analytics));

app.use('/api/notification', circuitBreaker('notification'),
  createProxyMiddleware(services.notification));

// Load balancing for feed endpoint
let currentVideoInstance = 0;
const videoInstances = process.env.VIDEO_SERVICE_INSTANCES?.split(',') || [
  'http://video-service-1:3002',
  'http://video-service-2:3002',
  'http://video-service-3:3002',
];

app.use('/api/feed', feedLimiter, (req, res, next) => {
  // Round-robin load balancing
  const targetInstance = videoInstances[currentVideoInstance];
  currentVideoInstance = (currentVideoInstance + 1) % videoInstances.length;

  createProxyMiddleware({
    target: targetInstance,
    changeOrigin: true,
    pathRewrite: { '^/api/feed': '/feed' },
  })(req, res, next);
});

// Metrics collection middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode,
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  });
  
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Gateway error:', err);
  
  res.status(err.status || 500).json({
    error: 'Gateway error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    requestId: req.id,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal');
  
  // Close Redis connection
  await redis.quit();
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Redis connected: ${redis.status === 'ready'}`);
});

// Handle Redis errors
redis.on('error', (err) => {
  logger.error('Redis error:', err);
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

module.exports = app;