const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Optimize for low memory
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from www directory
app.use(express.static(path.join(__dirname, 'www')));

// CORS headers for API endpoints
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        server: 'minimal-mock-data',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API endpoint for app info
app.get('/api/info', (req, res) => {
    res.json({
        name: 'VIB3',
        version: '1.0.0',
        description: 'Vertical video social app'
    });
});

// Mock user profile data based on the videos in the console logs
const mockUser = {
    _id: '55502f40',
    username: 'vib3user',
    email: 'tmc363@gmail.com',
    bio: 'Creator | Dancer | Music Lover ✨ Living my best life through dance 💃 Follow for daily vibes!',
    profilePicture: '👤',
    stats: {
        following: 123,
        followers: 1200,
        likes: 5600,
        videos: 3
    }
};

// Mock video data removed - no longer using test videos

// Simple auth middleware (simulates being logged in as the video uploader)
const authMiddleware = (req, res, next) => {
    // Simulate being logged in as the user who uploaded the videos we see in the feed
    req.userId = '55502f40';
    req.user = mockUser;
    console.log(`🔐 Auth: Simulating user ${req.userId} for ${req.method} ${req.path}`);
    next();
};

// === MAIN API ENDPOINTS ===

// Get videos for feed (this is what the main feed uses)
app.get('/api/videos', (req, res) => {
    const feed = req.query.feed || 'foryou';
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    
    console.log(`📹 Video feed request: ${feed}, page ${page}, limit ${limit}`);
    
    // Return empty videos array since test videos have been removed
    res.json({
        videos: [],
        page: page,
        hasMore: false,
        totalCount: 0
    });
});

// === PROFILE API ENDPOINTS ===

// Get current user profile
app.get('/api/auth/me', (req, res) => {
    console.log('🔐 Auth check: Returning mock user profile');
    res.json({ user: mockUser });
});

app.get('/api/user/profile', (req, res) => {
    console.log('👤 Profile request: Returning mock user profile');
    res.json(mockUser);
});

// Update user profile
app.put('/api/user/profile', authMiddleware, (req, res) => {
    const updates = req.body;
    console.log('📝 Profile update request:', updates);
    
    // Update mock user data
    if (updates.bio) mockUser.bio = updates.bio;
    if (updates.username) mockUser.username = updates.username;
    if (updates.displayName) mockUser.displayName = updates.displayName;
    if (updates.profilePicture) mockUser.profilePicture = updates.profilePicture;
    
    console.log('✅ Profile updated:', { bio: mockUser.bio, username: mockUser.username, displayName: mockUser.displayName });
    res.json({ message: 'Profile updated', updates });
});

// Get user stats
app.get('/api/user/stats', (req, res) => {
    console.log('📊 Stats request: Returning mock user stats');
    res.json(mockUser.stats);
});

// Get user videos
app.get('/api/user/videos', (req, res) => {
    // Extract the actual user ID from the video URLs in the console logs
    // From the logs, we can see the user ID is 55502f40
    const actualUserId = '55502f40';
    
    // Return empty videos array since test videos have been removed
    const userVideos = [];
    
    console.log(`📹 Profile request: Returning ${userVideos.length} videos for user ${actualUserId}`);
    res.json(userVideos);
});

// Get liked videos (empty for now)
app.get('/api/user/liked-videos', (req, res) => {
    console.log('❤️ Liked videos request: Returning empty array');
    res.json([]);
});

// Get favorites (empty for now)
app.get('/api/user/favorites', (req, res) => {
    console.log('⭐ Favorites request: Returning empty array');
    res.json([]);
});

// Get following list (empty for now)
app.get('/api/user/following', (req, res) => {
    console.log('👥 Following request: Returning empty array');
    res.json([]);
});

// Get followers list (empty for now)
app.get('/api/user/followers', (req, res) => {
    console.log('👥 Followers request: Returning empty array');
    res.json([]);
});

// Simple like endpoint for testing
// Simple in-memory storage for likes (for development)
const likeStorage = new Map();

app.post('/like', (req, res) => {
    const { videoId, userId } = req.body;
    console.log(`💖 Like request: videoId=${videoId}, userId=${userId}`);
    
    // Create a unique key for this user-video combination
    const likeKey = `${videoId}_${userId || 'anonymous'}`;
    
    // Toggle like status
    const currentlyLiked = likeStorage.has(likeKey);
    const newLikedState = !currentlyLiked;
    
    if (newLikedState) {
        likeStorage.set(likeKey, true);
    } else {
        likeStorage.delete(likeKey);
    }
    
    // Count total likes for this video
    let likeCount = 0;
    for (const key of likeStorage.keys()) {
        if (key.startsWith(videoId + '_')) {
            likeCount++;
        }
    }
    
    console.log(`💖 ${newLikedState ? 'Liked' : 'Unliked'} video ${videoId}, new count: ${likeCount}`);
    
    res.json({
        message: newLikedState ? 'Video liked' : 'Video unliked',
        liked: newLikedState,
        likeCount: likeCount
    });
});

// Like status endpoint for testing
app.get('/api/videos/:videoId/like-status', (req, res) => {
    const { videoId } = req.params;
    const userId = 'anonymous'; // For development, use anonymous user
    console.log(`📊 Like status request: videoId=${videoId}`);
    
    // Check if this user has liked this video
    const likeKey = `${videoId}_${userId}`;
    const isLiked = likeStorage.has(likeKey);
    
    // Count total likes for this video
    let likeCount = 0;
    for (const key of likeStorage.keys()) {
        if (key.startsWith(videoId + '_')) {
            likeCount++;
        }
    }
    
    res.json({
        liked: isLiked,
        likeCount: likeCount
    });
});

// Follow/unfollow users
app.post('/api/user/follow/:userId', authMiddleware, (req, res) => {
    res.json({ message: 'Followed successfully' });
});

app.post('/api/user/unfollow/:userId', authMiddleware, (req, res) => {
    res.json({ message: 'Unfollowed successfully' });
});

// Get following feed (empty for now)
app.get('/api/feed/following', (req, res) => {
    console.log('📱 Following feed request: Returning empty array');
    res.json([]);
});

// Catch all route - serve index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server with proper error handling
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`VIB3 server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    console.log(`Visit http://localhost:${PORT} to view the app`);
});

// Handle server errors
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});