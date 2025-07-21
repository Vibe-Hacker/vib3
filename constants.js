// Application Constants
module.exports = {
    // Session configuration
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    SESSION_CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
    
    // Security
    SECURITY: {
        TOKEN_LENGTH: 32,
        BCRYPT_ROUNDS: 10,
        JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    },
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    BCRYPT_ROUNDS: 10,
    
    // Rate limiting
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100,
    
    // File upload limits
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    
    // Database
    DB_NAME: 'vib3',
    COLLECTIONS: {
        USERS: 'users',
        VIDEOS: 'videos',
        LIKES: 'likes',
        COMMENTS: 'comments',
        FOLLOWS: 'follows',
        NOTIFICATIONS: 'notifications'
    },
    
    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    
    // Video processing
    VIDEO_QUALITIES: {
        HIGH: '1080p',
        MEDIUM: '720p', 
        LOW: '480p'
    },
    
    // API versioning
    API_VERSION: 'v1',
    
    // Error codes
    ERROR_CODES: {
        UNAUTHORIZED: 'UNAUTHORIZED',
        FORBIDDEN: 'FORBIDDEN',
        NOT_FOUND: 'NOT_FOUND',
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        SERVER_ERROR: 'SERVER_ERROR',
        RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
    },
    
    // Response messages
    MESSAGES: {
        AUTH_REQUIRED: 'Authentication required',
        INVALID_CREDENTIALS: 'Invalid credentials',
        USER_NOT_FOUND: 'User not found',
        VIDEO_NOT_FOUND: 'Video not found',
        SERVER_ERROR: 'Internal server error',
        RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later'
    }
};