// VIB3 Application Constants
// Centralizes all magic numbers, strings, and configuration values

module.exports = {
    // Server Configuration
    SERVER: {
        DEFAULT_PORT: 3000,
        HOST: '0.0.0.0',
        ENVIRONMENT: process.env.NODE_ENV || 'development'
    },

    // Database Collections
    COLLECTIONS: {
        USERS: 'users',
        VIDEOS: 'videos',
        POSTS: 'posts',
        LIKES: 'likes',
        COMMENTS: 'comments',
        FOLLOWS: 'follows',
        VIEWS: 'views',
        ANALYTICS: 'analytics',
        MUSIC_TRACKS: 'music_tracks',
        USER_PREFERENCES: 'user_preferences',
        NOTIFICATIONS: 'notifications'
    },

    // API Configuration
    API: {
        // Pagination
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100,
        DEFAULT_FEED_SIZE: 10,
        
        // Rate Limiting
        RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
        RATE_LIMIT_MAX_REQUESTS: 100,
        
        // Timeouts
        REQUEST_TIMEOUT: 30000, // 30 seconds
        UPLOAD_TIMEOUT: 300000, // 5 minutes
        
        // Cache TTL (in seconds)
        CACHE_TTL: {
            FEED: 300, // 5 minutes
            USER_PROFILE: 600, // 10 minutes
            TRENDING: 1800, // 30 minutes
            STATIC_CONTENT: 86400 // 24 hours
        }
    },

    // Upload Limits
    UPLOAD: {
        // Video
        MAX_VIDEO_SIZE: 5 * 1024 * 1024 * 1024, // 5GB
        MIN_VIDEO_DURATION: 3, // 3 seconds
        MAX_VIDEO_DURATION: 180, // 3 minutes
        
        // Images
        MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
        MAX_PROFILE_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
        
        // Batch
        MAX_BATCH_SIZE: 10, // Max files in one upload
        
        // Supported formats
        VIDEO_FORMATS: ['mp4', 'mov', 'avi', 'webm', 'mkv', '3gp', 'flv'],
        IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        AUDIO_FORMATS: ['mp3', 'wav', 'aac', 'm4a']
    },

    // Social Features
    SOCIAL: {
        MAX_COMMENT_LENGTH: 500,
        MAX_BIO_LENGTH: 150,
        MAX_USERNAME_LENGTH: 30,
        MIN_USERNAME_LENGTH: 3,
        MAX_DISPLAY_NAME_LENGTH: 50,
        MAX_HASHTAGS_PER_POST: 30,
        MAX_MENTIONS_PER_POST: 10
    },

    // Algorithm Configuration
    ALGORITHM: {
        // Engagement weights
        WEIGHTS: {
            LIKE: 1.0,
            COMMENT: 2.0,
            SHARE: 3.0,
            WATCH_TIME: 0.5,
            COMPLETION_RATE: 1.5
        },
        
        // Time decay
        FRESHNESS_WEIGHT: 0.8,
        VIRAL_THRESHOLD: 10000, // Views to be considered viral
        
        // User preferences
        PREFERENCE_UPDATE_THRESHOLD: 5, // Interactions before updating preferences
        PREFERENCE_DECAY_RATE: 0.95, // Daily decay
        
        // Feed diversity
        MAX_SAME_CREATOR_IN_FEED: 2,
        FOLLOWING_FEED_RATIO: 0.3 // 30% from following, 70% discovery
    },

    // Analytics
    ANALYTICS: {
        // Events
        EVENTS: {
            VIDEO_VIEW: 'video_view',
            VIDEO_LIKE: 'video_like',
            VIDEO_COMMENT: 'video_comment',
            VIDEO_SHARE: 'video_share',
            VIDEO_COMPLETE: 'video_complete',
            USER_FOLLOW: 'user_follow',
            USER_UNFOLLOW: 'user_unfollow',
            SEARCH: 'search',
            PROFILE_VIEW: 'profile_view'
        },
        
        // Metrics
        MIN_WATCH_TIME_FOR_VIEW: 3000, // 3 seconds
        COMPLETION_THRESHOLD: 0.8, // 80% watched = complete
        
        // Batch processing
        BATCH_SIZE: 100,
        PROCESSING_INTERVAL: 60000 // 1 minute
    },

    // Security
    SECURITY: {
        // Session
        SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
        SESSION_RENEWAL_THRESHOLD: 24 * 60 * 60 * 1000, // 1 day
        
        // Password
        MIN_PASSWORD_LENGTH: 8,
        PASSWORD_SALT_ROUNDS: 10,
        
        // Tokens
        TOKEN_LENGTH: 32,
        VERIFICATION_CODE_LENGTH: 6,
        VERIFICATION_CODE_EXPIRY: 600000, // 10 minutes
        
        // Rate limiting
        LOGIN_ATTEMPTS_LIMIT: 5,
        LOGIN_ATTEMPTS_WINDOW: 900000 // 15 minutes
    },

    // Storage
    STORAGE: {
        // S3/Spaces
        BUCKET_NAME: process.env.DO_SPACES_BUCKET || 'vib3-videos',
        REGION: process.env.DO_SPACES_REGION || 'nyc3',
        ENDPOINT: process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com',
        
        // Local paths
        TEMP_DIR: 'temp',
        UPLOADS_DIR: 'uploads',
        THUMBNAILS_DIR: 'thumbnails',
        
        // File naming
        FILE_NAME_LENGTH: 16, // Random hex string length
        
        // CDN
        CDN_URL: process.env.CDN_URL || null
    },

    // Video Processing
    VIDEO: {
        // Thumbnail
        THUMBNAIL_WIDTH: 720,
        THUMBNAIL_HEIGHT: 1280,
        THUMBNAIL_QUALITY: 80,
        THUMBNAIL_TIME_OFFSET: 1, // 1 second into video
        
        // Compression
        DEFAULT_CRF: 28,
        DEFAULT_PRESET: 'fast',
        DEFAULT_AUDIO_BITRATE: '128k',
        
        // Streaming
        CHUNK_SIZE: 1024 * 1024, // 1MB chunks
        
        // HLS
        HLS_SEGMENT_DURATION: 10,
        HLS_LIST_SIZE: 0 // Infinite playlist
    },

    // Notifications
    NOTIFICATIONS: {
        TYPES: {
            LIKE: 'like',
            COMMENT: 'comment',
            FOLLOW: 'follow',
            MENTION: 'mention',
            VIDEO_READY: 'video_ready'
        },
        
        // Batching
        BATCH_DELAY: 5000, // 5 seconds
        MAX_BATCH_SIZE: 10,
        
        // Retention
        RETENTION_DAYS: 30
    },

    // Feature Flags
    FEATURES: {
        MULTI_QUALITY_VIDEO: process.env.ENABLE_MULTI_QUALITY === 'true',
        LIVE_STREAMING: false,
        DIRECT_MESSAGING: false,
        STORIES: false,
        SHOPPING: false,
        CREATOR_FUND: false,
        PREMIUM_SUBSCRIPTION: false
    },

    // Error Codes
    ERROR_CODES: {
        // Auth errors (1xxx)
        INVALID_CREDENTIALS: 1001,
        SESSION_EXPIRED: 1002,
        UNAUTHORIZED: 1003,
        USER_NOT_FOUND: 1004,
        EMAIL_IN_USE: 1005,
        USERNAME_IN_USE: 1006,
        
        // Upload errors (2xxx)
        FILE_TOO_LARGE: 2001,
        INVALID_FILE_TYPE: 2002,
        UPLOAD_FAILED: 2003,
        PROCESSING_FAILED: 2004,
        
        // Social errors (3xxx)
        ALREADY_FOLLOWING: 3001,
        NOT_FOLLOWING: 3002,
        ALREADY_LIKED: 3003,
        NOT_LIKED: 3004,
        COMMENT_TOO_LONG: 3005,
        
        // System errors (9xxx)
        DATABASE_ERROR: 9001,
        EXTERNAL_SERVICE_ERROR: 9002,
        RATE_LIMIT_EXCEEDED: 9003,
        SERVER_ERROR: 9999
    }
};