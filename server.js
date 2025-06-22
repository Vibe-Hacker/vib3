const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Optimize for low memory
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from www directory
app.use(express.static(path.join(__dirname, 'www')));

// CORS headers for API endpoints and video content
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    // Special CORS headers for video content
    if (req.path.includes('/videos/') || req.headers.accept?.includes('video/')) {
        res.header('Cross-Origin-Resource-Policy', 'cross-origin');
        res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
        res.header('Access-Control-Allow-Credentials', 'false');
    }
    
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

// Sample videos for explore page (different creators)
const mockVideos = [
    {
        _id: 'explore1',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        user: { 
            _id: 'creator1',
            username: 'dancequeen23', 
            displayName: 'Maya Chen',
            profilePicture: '💃' 
        },
        title: 'Summer dance vibes! ☀️',
        description: 'New choreography to my favorite song #dance #summer',
        likeCount: 1200,
        commentCount: 45,
        shareCount: 23,
        uploadDate: new Date('2024-01-01'),
        duration: 60,
        views: 15600
    },
    {
        _id: 'explore2',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        user: { 
            _id: 'creator2',
            username: 'artlife_alex', 
            displayName: 'Alex Rivera',
            profilePicture: '🎨' 
        },
        title: 'Digital art speedrun',
        description: 'Creating art in 60 seconds #art #digital #creative',
        likeCount: 890,
        commentCount: 67,
        shareCount: 34,
        uploadDate: new Date('2024-01-02'),
        duration: 45,
        views: 8900
    },
    {
        _id: 'explore3',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        user: { 
            _id: 'creator3',
            username: 'cookingjake', 
            displayName: 'Jake Martinez',
            profilePicture: '👨‍🍳' 
        },
        title: 'Quick pasta recipe!',
        description: '5-minute dinner hack that will change your life #cooking #pasta',
        likeCount: 2300,
        commentCount: 156,
        shareCount: 89,
        uploadDate: new Date('2024-01-03'),
        duration: 30,
        views: 23400
    },
    {
        _id: 'explore4',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
        user: { 
            _id: 'creator4',
            username: 'fitness_sarah', 
            displayName: 'Sarah Johnson',
            profilePicture: '💪' 
        },
        title: 'Morning workout routine',
        description: 'Start your day right with this 10-min workout #fitness #morning',
        likeCount: 567,
        commentCount: 43,
        shareCount: 28,
        uploadDate: new Date('2024-01-04'),
        duration: 25,
        views: 7800
    },
    {
        _id: 'explore5',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        user: { 
            _id: 'creator5',
            username: 'tech_tom', 
            displayName: 'Tom Wilson',
            profilePicture: '💻' 
        },
        title: 'iPhone 15 hidden features',
        description: 'Mind-blowing features you never knew existed #tech #iphone',
        likeCount: 4500,
        commentCount: 234,
        shareCount: 167,
        uploadDate: new Date('2024-01-05'),
        duration: 180,
        views: 45600
    },
    {
        _id: 'explore6',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        user: { 
            _id: 'creator6',
            username: 'fashionista_em', 
            displayName: 'Emma Style',
            profilePicture: '👗' 
        },
        title: 'Outfit of the day',
        description: 'Affordable fall looks under $50 #fashion #ootd #style',
        likeCount: 890,
        commentCount: 76,
        shareCount: 45,
        uploadDate: new Date('2024-01-06'),
        duration: 60,
        views: 12300
    }
];

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
    
    // Return test videos for debugging video playback
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const pageVideos = mockVideos.slice(startIndex, endIndex);
    
    console.log(`📦 Returning ${pageVideos.length} test videos for page ${page}`);
    
    res.json({
        videos: pageVideos,
        page: page,
        hasMore: endIndex < mockVideos.length,
        totalCount: mockVideos.length
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

// Video proxy endpoint to serve videos without CORS issues
app.get('/api/video-proxy/:filename', async (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        console.log(`🎬 Proxying video: ${filename}`);
        
        // For now, just redirect to the original URL since we don't have DigitalOcean config here
        // This would need to be updated with actual DigitalOcean Spaces integration
        const videoUrl = `https://vib3-videos.nyc3.digitaloceanspaces.com/${filename}`;
        
        // Set proper headers for video streaming
        res.set({
            'Content-Type': 'video/mp4',
            'Accept-Ranges': 'bytes',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Range, Content-Type',
            'Cache-Control': 'public, max-age=31536000'
        });
        
        // Handle OPTIONS preflight request
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        
        // Redirect to actual video URL for now
        res.redirect(videoUrl);
        
    } catch (error) {
        console.error('Video proxy error:', error);
        res.status(404).json({ error: 'Video not found' });
    }
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