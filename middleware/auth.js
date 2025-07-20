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