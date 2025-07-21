#!/bin/bash

# Script to create missing config files for VIB3 server
# This script creates config/video-config.js and middleware/auth.js

echo "=== VIB3 Server Configuration Script ==="
echo "Creating missing configuration files..."

# Function to create directories if they don't exist
create_dir_if_missing() {
    if [ ! -d "$1" ]; then
        echo "Creating directory: $1"
        mkdir -p "$1"
    else
        echo "Directory already exists: $1"
    fi
}

# Create config directory
create_dir_if_missing "config"

# Create middleware directory
create_dir_if_missing "middleware"

# Create constants directory (if needed)
create_dir_if_missing "constants"

# Create config/video-config.js
echo "Creating config/video-config.js..."
cat > config/video-config.js << 'EOF'
// Video Processing Configuration
// Centralizes all video-related settings to prevent breaking when modifying server.js

module.exports = {
    // Quality presets for multi-resolution encoding
    QUALITY_PRESETS: [
        {
            name: '4k',
            height: 2160,
            videoBitrate: '8000k',
            h264_crf: 22,
            h265_crf: 24,
            audioBitrate: '192k',
            condition: (metadata) => metadata.video && metadata.video.height >= 2160
        },
        {
            name: '1080p',
            height: 1080,
            videoBitrate: '4000k',
            h264_crf: 23,
            h265_crf: 25,
            audioBitrate: '128k',
            condition: (metadata) => metadata.video && metadata.video.height >= 1080
        },
        {
            name: '720p',
            height: 720,
            videoBitrate: '2000k',
            h264_crf: 23,
            h265_crf: 25,
            audioBitrate: '128k',
            condition: () => true // Always generate
        },
        {
            name: '480p',
            height: 480,
            videoBitrate: '1000k',
            h264_crf: 24,
            h265_crf: 26,
            audioBitrate: '96k',
            condition: () => true // Always generate
        },
        {
            name: '360p',
            height: 360,
            videoBitrate: '600k',
            h264_crf: 25,
            h265_crf: 27,
            audioBitrate: '64k',
            condition: () => true // For slow connections
        }
    ],

    // Video format support
    SUPPORTED_FORMATS: {
        input: [
            'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
            'video/3gpp', 'video/x-flv', 'video/x-ms-wmv', 'video/x-msvideo',
            'video/avi', 'video/mov', 'video/mkv', 'video/x-matroska'
        ],
        output: {
            default: 'mp4',
            mime: 'video/mp4'
        }
    },

    // Upload limits
    UPLOAD_LIMITS: {
        maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
        maxDuration: 180, // 3 minutes in seconds
        minDuration: 3, // 3 seconds minimum
    },

    // Processing settings
    PROCESSING: {
        // Enable multi-quality by default for videos >= this resolution
        autoMultiQualityThreshold: 1080,
        
        // Codec settings
        codecs: {
            h264: {
                preset: 'faster',
                profile: 'main',
                level: '4.1'
            },
            h265: {
                preset: 'medium',
                tag: 'hvc1', // Apple compatibility
                params: 'keyint=48:min-keyint=48:no-scenecut'
            }
        },
        
        // Processing timeouts
        timeouts: {
            validation: 30000, // 30 seconds
            conversion: 300000, // 5 minutes
            multiQuality: 600000 // 10 minutes
        }
    },

    // Storage paths
    STORAGE: {
        tempDir: 'temp',
        uploadsDir: 'uploads',
        variantsSubdir: 'variants',
        manifestFilename: 'manifest.json'
    },

    // FFmpeg optimization settings
    FFMPEG: {
        // Number of threads (0 = auto-detect)
        threads: 0,
        
        // Hardware acceleration (when available)
        hwAccel: {
            enabled: false,
            type: 'auto' // auto, vaapi, nvenc, videotoolbox
        },
        
        // Memory limits
        maxMemory: '2G'
    },

    // Quality selection defaults (for client)
    QUALITY_SELECTION: {
        wifi: '1080p',
        '5g': '1080p',
        '4g': '720p',
        '3g': '480p',
        'slow': '360p',
        'unknown': '360p'
    },

    // Feature flags
    FEATURES: {
        multiQuality: process.env.ENABLE_MULTI_QUALITY === 'true' || false,
        thumbnailGeneration: true,
        videoValidation: true,
        adaptiveStreaming: true,
        h265Support: true
    }
};
EOF

# Create middleware/auth.js
echo "Creating middleware/auth.js..."
cat > middleware/auth.js << 'EOF'
// Authentication Middleware
// Handles authentication checks and session management

const constants = require('../constants');

// In-memory session storage (should be replaced with Redis in production)
const sessions = new Map();

// Create a new session
function createSession(userId) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(constants.SECURITY.TOKEN_LENGTH).toString('hex');
    sessions.set(token, { 
        userId, 
        createdAt: Date.now(),
        lastActivity: Date.now()
    });
    return token;
}

// Get session
function getSession(token) {
    return sessions.get(token);
}

// Update session activity
function updateSessionActivity(token) {
    const session = sessions.get(token);
    if (session) {
        session.lastActivity = Date.now();
    }
}

// Delete session
function deleteSession(token) {
    sessions.delete(token);
}

// Clean up expired sessions
function cleanupSessions() {
    const now = Date.now();
    for (const [token, session] of sessions.entries()) {
        if (now - session.lastActivity > constants.SECURITY.SESSION_DURATION) {
            sessions.delete(token);
        }
    }
}

// Run cleanup every hour
setInterval(cleanupSessions, 60 * 60 * 1000);

// Main authentication middleware
function requireAuth(req, res, next) {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');
        
        console.log('🔐 Auth check:', {
            hasToken: !!token,
            tokenPrefix: token ? token.substring(0, 8) + '...' : 'none',
            sessionsCount: sessions.size
        });
        
        // Check if token exists and is valid
        if (token && sessions.has(token)) {
            const session = sessions.get(token);
            
            // Check if session is expired
            if (Date.now() - session.lastActivity > constants.SECURITY.SESSION_DURATION) {
                sessions.delete(token);
                console.log('🔒 Session expired');
                return res.status(401).json({ 
                    error: 'Session expired',
                    code: constants.ERROR_CODES.SESSION_EXPIRED
                });
            }
            
            // Update activity and attach user to request
            updateSessionActivity(token);
            req.user = session;
            req.token = token;
            console.log('✅ Auth successful');
            return next();
        }
        
        // Development mode fallback
        if (process.env.NODE_ENV === 'development' && sessions.size > 0) {
            console.log('🔧 Development mode: using fallback session');
            const firstSession = sessions.values().next().value;
            req.user = firstSession;
            return next();
        }
        
        console.log('🔒 Authentication required');
        return res.status(401).json({ 
            error: 'Authentication required',
            code: constants.ERROR_CODES.UNAUTHORIZED
        });
        
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            error: 'Authentication error',
            code: constants.ERROR_CODES.SERVER_ERROR
        });
    }
}

// Optional authentication middleware (doesn't fail if no auth)
function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');
        
        if (token && sessions.has(token)) {
            const session = sessions.get(token);
            
            // Check if session is expired
            if (Date.now() - session.lastActivity <= constants.SECURITY.SESSION_DURATION) {
                updateSessionActivity(token);
                req.user = session;
                req.token = token;
            }
        }
        
        next();
    } catch (error) {
        console.error('Optional auth error:', error);
        next(); // Continue without auth
    }
}

// Admin authentication middleware
function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        // Check if user is admin (would need to check database)
        // For now, just check if userId matches admin list
        const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];
        
        if (!adminIds.includes(req.user.userId)) {
            return res.status(403).json({ 
                error: 'Admin access required',
                code: constants.ERROR_CODES.UNAUTHORIZED
            });
        }
        
        next();
    });
}

module.exports = {
    requireAuth,
    optionalAuth,
    requireAdmin,
    createSession,
    getSession,
    updateSessionActivity,
    deleteSession,
    sessions
};
EOF

# Check if constants/index.js exists, create a basic one if not
if [ ! -f "constants/index.js" ] && [ ! -f "constants.js" ]; then
    echo "Creating constants/index.js..."
    cat > constants/index.js << 'EOF'
// Application Constants
module.exports = {
    // Security settings
    SECURITY: {
        TOKEN_LENGTH: 32,
        SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        PASSWORD_MIN_LENGTH: 8,
        PASSWORD_SALT_ROUNDS: 10
    },

    // Error codes
    ERROR_CODES: {
        UNAUTHORIZED: 'UNAUTHORIZED',
        SESSION_EXPIRED: 'SESSION_EXPIRED',
        SERVER_ERROR: 'SERVER_ERROR',
        BAD_REQUEST: 'BAD_REQUEST',
        NOT_FOUND: 'NOT_FOUND',
        FORBIDDEN: 'FORBIDDEN'
    },

    // File upload limits
    UPLOAD: {
        MAX_FILE_SIZE: 5 * 1024 * 1024 * 1024, // 5GB
        ALLOWED_MIME_TYPES: [
            'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
            'video/3gpp', 'video/x-flv', 'video/x-ms-wmv', 'video/x-msvideo',
            'video/avi', 'video/mov', 'video/mkv', 'video/x-matroska'
        ]
    },

    // API settings
    API: {
        VERSION: 'v1',
        BASE_PATH: '/api',
        RATE_LIMIT: {
            WINDOW_MS: 15 * 60 * 1000, // 15 minutes
            MAX_REQUESTS: 100
        }
    },

    // Database settings
    DATABASE: {
        CONNECTION_TIMEOUT: 30000,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    }
};
EOF
fi

# Set appropriate permissions
echo "Setting file permissions..."
chmod 644 config/video-config.js
chmod 644 middleware/auth.js
[ -f "constants/index.js" ] && chmod 644 constants/index.js

# Make the script executable
chmod +x "$0"

echo ""
echo "✅ Configuration files created successfully!"
echo ""
echo "Files created:"
echo "  - config/video-config.js"
echo "  - middleware/auth.js"
[ -f "constants/index.js" ] && echo "  - constants/index.js (basic constants file)"
echo ""
echo "Next steps:"
echo "1. Ensure your server.js requires these files correctly"
echo "2. Update any environment variables if needed"
echo "3. Restart your Node.js server"
echo ""
echo "Note: The auth middleware uses in-memory sessions."
echo "For production, consider using Redis or another session store."