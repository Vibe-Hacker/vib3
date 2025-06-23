const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const path = require('path');
const crypto = require('crypto');
const VideoProcessor = require('./video-processor');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Session management (simple in-memory for now)
const sessions = new Map();

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'www')));

// DigitalOcean Spaces configuration
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
    region: process.env.DO_SPACES_REGION || 'nyc3'
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'vib3-videos';

// Initialize video processor
const videoProcessor = new VideoProcessor();

// Engagement-based ranking algorithm for For You feed
async function applyEngagementRanking(videos, db) {
    console.log(`📊 Calculating engagement scores for ${videos.length} videos`);
    
    // Calculate engagement metrics for each video
    for (const video of videos) {
        try {
            // Get engagement data
            const likeCount = await db.collection('likes').countDocuments({ videoId: video._id.toString() });
            const commentCount = await db.collection('comments').countDocuments({ videoId: video._id.toString() });
            const shareCount = await db.collection('shares').countDocuments({ videoId: video._id.toString() });
            const views = video.views || 0;
            
            // Time factors
            const now = new Date();
            const createdAt = new Date(video.createdAt);
            const hoursOld = (now - createdAt) / (1000 * 60 * 60);
            const daysOld = hoursOld / 24;
            
            // Engagement ratios (prevent division by zero)
            const likeRate = views > 0 ? likeCount / views : 0;
            const commentRate = views > 0 ? commentCount / views : 0;
            const shareRate = views > 0 ? shareCount / views : 0;
            
            // View velocity (views per hour)
            const viewVelocity = hoursOld > 0 ? views / hoursOld : views;
            
            // Recency decay (newer content gets higher score)
            const recencyBoost = Math.exp(-daysOld / 3); // Decays over ~3 days
            
            // Engagement score calculation
            let engagementScore = 0;
            
            // Base engagement (40% of score)
            engagementScore += (likeRate * 100) * 0.25;        // Like engagement
            engagementScore += (commentRate * 200) * 0.10;     // Comment engagement (worth 2x likes)
            engagementScore += (shareRate * 300) * 0.05;       // Share engagement (worth 3x likes)
            
            // View velocity (30% of score)
            engagementScore += Math.log(viewVelocity + 1) * 0.30;
            
            // Recency boost (20% of score)
            engagementScore += recencyBoost * 0.20;
            
            // Total engagement boost (10% of score)
            const totalEngagement = likeCount + commentCount + shareCount;
            engagementScore += Math.log(totalEngagement + 1) * 0.10;
            
            // Store metrics on video object
            video.engagementScore = engagementScore;
            video.likeCount = likeCount;
            video.commentCount = commentCount;
            video.shareCount = shareCount;
            video.likeRate = likeRate;
            video.commentRate = commentRate;
            video.viewVelocity = viewVelocity;
            video.hoursOld = hoursOld;
            
            if (video.title && video.title.includes('test')) {
                console.log(`📈 ${video.title}: score=${engagementScore.toFixed(2)}, likes=${likeCount}, views=${views}, velocity=${viewVelocity.toFixed(1)}/hr`);
            }
            
        } catch (error) {
            console.error('Error calculating engagement for video:', video._id, error);
            video.engagementScore = 0;
            video.likeCount = 0;
            video.commentCount = 0;
            video.shareCount = 0;
        }
    }
    
    // Sort by engagement score (highest first)
    videos.sort((a, b) => b.engagementScore - a.engagementScore);
    
    // Log detailed algorithm performance
    const topVideos = videos.slice(0, 5);
    console.log('📊 Algorithm Performance:');
    console.log(`   📈 Top 5 engagement scores: ${topVideos.map(v => v.engagementScore?.toFixed(2)).join(', ')}`);
    console.log('   🎯 Top ranked videos:');
    topVideos.forEach((video, index) => {
        console.log(`     ${index + 1}. "${video.title || 'Untitled'}" - Score: ${video.engagementScore?.toFixed(2)} (${video.likeCount}❤️ ${video.commentCount}💬 ${video.views || 0}👁️ ${video.hoursOld?.toFixed(1)}hrs old)`);
    });
    
    // Performance metrics
    const avgEngagement = videos.reduce((sum, v) => sum + (v.engagementScore || 0), 0) / videos.length;
    const highEngagementVideos = videos.filter(v => (v.engagementScore || 0) > avgEngagement).length;
    const recentVideos = videos.filter(v => (v.hoursOld || 0) < 24).length;
    
    console.log(`   📊 Algorithm stats: avgScore=${avgEngagement.toFixed(2)}, highEngagement=${highEngagementVideos}/${videos.length}, recent24h=${recentVideos}/${videos.length}`);
    
    return videos;
}

// Configure multer for video uploads with enhanced format support
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit for 4K videos
    },
    fileFilter: (req, file, cb) => {
        // Accept all common video formats - we'll convert them to standard MP4
        const allowedTypes = [
            'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
            'video/3gpp', 'video/x-flv', 'video/x-ms-wmv', 'video/x-msvideo',
            'video/avi', 'video/mov', 'video/mkv', 'video/x-matroska'
        ];
        if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Please upload a video file.'));
        }
    }
});

// MongoDB connection
const { MongoClient, ObjectId } = require('mongodb');
let db = null;
let client = null;

async function connectDB() {
    if (process.env.DATABASE_URL) {
        try {
            client = new MongoClient(process.env.DATABASE_URL);
            await client.connect();
            db = client.db('vib3');
            
            // Create indexes for better performance
            await createIndexes();
            
            console.log('✅ MongoDB connected successfully');
            return true;
        } catch (error) {
            console.error('MongoDB connection error:', error.message);
            return false;
        }
    } else {
        console.log('No DATABASE_URL found - running without database');
        return false;
    }
}

async function createIndexes() {
    try {
        // Clean up problematic likes first
        await cleanupLikes();
        
        // User indexes
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ username: 1 }, { unique: true });
        
        // Video indexes
        await db.collection('videos').createIndex({ userId: 1 });
        await db.collection('videos').createIndex({ createdAt: -1 });
        await db.collection('videos').createIndex({ hashtags: 1 });
        await db.collection('videos').createIndex({ status: 1 });
        
        // Posts indexes (for photos and slideshows)
        await db.collection('posts').createIndex({ userId: 1 });
        await db.collection('posts').createIndex({ createdAt: -1 });
        await db.collection('posts').createIndex({ type: 1 });
        await db.collection('posts').createIndex({ hashtags: 1 });
        await db.collection('posts').createIndex({ status: 1 });
        
        // Social indexes (only video likes for now)
        await db.collection('likes').createIndex({ videoId: 1, userId: 1 }, { unique: true });
        await db.collection('comments').createIndex({ videoId: 1, createdAt: -1 });
        await db.collection('comments').createIndex({ postId: 1, createdAt: -1 });
        await db.collection('follows').createIndex({ followerId: 1, followingId: 1 }, { unique: true });
        
        console.log('✅ Database indexes created');
    } catch (error) {
        console.error('Index creation error:', error.message);
    }
}

async function cleanupLikes() {
    try {
        console.log('🧹 Cleaning up likes collection...');
        
        // Remove postId field from all video likes
        const updateResult = await db.collection('likes').updateMany(
            { 
                videoId: { $exists: true, $ne: null },
                postId: { $exists: true }
            },
            { 
                $unset: { postId: "" }
            }
        );
        
        console.log(`✅ Cleaned up ${updateResult.modifiedCount} video likes`);
        
        // Remove duplicate video likes (keep most recent)
        const duplicates = await db.collection('likes').aggregate([
            {
                $match: {
                    videoId: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: { videoId: "$videoId", userId: "$userId" },
                    count: { $sum: 1 },
                    docs: { $push: { id: "$_id", createdAt: "$createdAt" } }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]).toArray();
        
        if (duplicates.length > 0) {
            console.log(`Found ${duplicates.length} sets of duplicate video likes`);
            
            for (const dup of duplicates) {
                // Sort by createdAt and keep the most recent
                const sorted = dup.docs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                const toDelete = sorted.slice(1); // Remove all but the first (most recent)
                
                if (toDelete.length > 0) {
                    await db.collection('likes').deleteMany({ 
                        _id: { $in: toDelete.map(d => d.id) } 
                    });
                    console.log(`Removed ${toDelete.length} duplicate likes for video ${dup._id.videoId}, user ${dup._id.userId}`);
                }
            }
        }
        
        console.log('✅ Likes cleanup complete');
    } catch (error) {
        console.error('Likes cleanup error:', error.message);
    }
}

// Connect to database on startup
connectDB();

// Helper function to create session
function createSession(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { userId, createdAt: Date.now() });
    return token;
}

// Auth middleware
function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || !sessions.has(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    req.user = sessions.get(token);
    next();
}

// API Routes

// Debug: Check database content
app.get('/api/debug/videos', async (req, res) => {
    if (!db) {
        return res.json({ error: 'Database not connected' });
    }
    
    try {
        const totalVideos = await db.collection('videos').countDocuments();
        const activeVideos = await db.collection('videos').countDocuments({ status: { $ne: 'deleted' } });
        const deletedVideos = await db.collection('videos').countDocuments({ status: 'deleted' });
        const allVideos = await db.collection('videos').find({}).limit(5).toArray();
        
        res.json({
            totalVideos,
            activeVideos,
            deletedVideos,
            sampleVideos: allVideos.map(v => ({
                id: v._id,
                title: v.title,
                status: v.status,
                userId: v.userId
            }))
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    const dbConnected = db !== null;
    const spacesConfigured = !!(process.env.DO_SPACES_KEY && process.env.DO_SPACES_SECRET);
    res.json({ 
        status: 'ok',
        version: 'Fixed like API duplicate key error - build 627076c',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        database: dbConnected ? 'connected' : 'not connected',
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'not configured',
        storage: spacesConfigured ? 'configured' : 'not configured'
    });
});

// App info
app.get('/api/info', (req, res) => {
    res.json({
        name: 'VIB3',
        version: '1.0.0',
        description: 'Vertical video social app',
        database: 'MongoDB',
        storage: 'DigitalOcean Spaces',
        features: ['auth', 'videos', 'social']
    });
});

// Database test
app.get('/api/database/test', async (req, res) => {
    if (!db) {
        return res.json({ 
            connected: false, 
            message: 'Database not connected',
            configured: !!process.env.DATABASE_URL 
        });
    }
    
    try {
        await db.admin().ping();
        const collections = await db.listCollections().toArray();
        
        res.json({ 
            connected: true, 
            message: 'MongoDB connected successfully',
            database: db.databaseName,
            collections: collections.map(c => c.name),
            configured: true
        });
    } catch (error) {
        res.json({ 
            connected: false, 
            message: error.message,
            configured: true 
        });
    }
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, password, and username required' });
    }
    
    try {
        // Check if user exists
        const existingUser = await db.collection('users').findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password (simple for demo - use bcrypt in production)
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        
        // Create user
        const user = {
            email,
            username,
            password: hashedPassword,
            displayName: username,
            bio: '',
            profileImage: '',
            followers: 0,
            following: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await db.collection('users').insertOne(user);
        user._id = result.insertedId;
        
        // Create session
        const token = createSession(user._id.toString());
        
        // Remove password from response
        delete user.password;
        
        res.json({ 
            message: 'Registration successful',
            user,
            token
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    try {
        // Hash password
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        
        // Find user
        const user = await db.collection('users').findOne({ 
            email,
            password: hashedPassword
        });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Create session
        const token = createSession(user._id.toString());
        
        // Remove password from response
        delete user.password;
        
        res.json({ 
            message: 'Login successful',
            user,
            token
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
app.get('/api/auth/me', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    try {
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.user.userId) },
            { projection: { password: 0 } }
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ user });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Logout
app.post('/api/auth/logout', requireAuth, (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    sessions.delete(token);
    res.json({ message: 'Logged out successfully' });
});

// Get all videos (feed)
app.get('/api/videos', async (req, res) => {
    console.log('API /videos called with query:', req.query);
    console.log('Database connected:', !!db);
    
    if (!db) {
        console.log('No database connection, returning empty');
        return res.json({ videos: [] });
    }
    
    try {
        const { limit = 10, skip = 0, page = 1, userId, feed } = req.query;
        
        // Calculate skip based on page if provided
        const actualSkip = page > 1 ? (parseInt(page) - 1) * parseInt(limit) : parseInt(skip);
        
        // Test database connection first
        await db.admin().ping();
        console.log('Database ping successful');
        
        // Implement different feed algorithms based on feed type
        let videos = [];
        let query = {};
        let sortOptions = {};
        
        // Get current user info for personalization
        const currentUserId = req.headers.authorization ? 
            sessions.get(req.headers.authorization.replace('Bearer ', ''))?.userId : null;
        
        console.log(`Processing ${feed} feed for user: ${currentUserId || 'anonymous'}`);
        
        switch(feed) {
            case 'foryou':
                // For You: Personalized algorithm based on interests and trends
                console.log('🎯 For You Algorithm: Personalized content');
                // For You feed should show ALL users' videos, not filtered by userId
                query = { status: { $ne: 'deleted' } };
                // Mix of popular and recent content with engagement weighting
                videos = await db.collection('videos')
                    .find(query)
                    .sort({ createdAt: -1 }) // Start with recent, we'll shuffle for algorithm effect
                    .skip(actualSkip)
                    .limit(parseInt(limit))
                    .toArray();
                break;
                
            case 'following':
                // Following: Videos from accounts user follows
                console.log('👥 Following Algorithm: From followed accounts');
                if (currentUserId) {
                    // Get list of users this person follows
                    const following = await db.collection('follows')
                        .find({ followerId: currentUserId })
                        .toArray();
                    const followingIds = following.map(f => f.followingId);
                    
                    console.log(`User ${currentUserId} follows ${followingIds.length} accounts`);
                    
                    if (followingIds.length > 0) {
                        query = { userId: { $in: followingIds }, status: { $ne: 'deleted' } };
                        videos = await db.collection('videos')
                            .find(query)
                            .sort({ createdAt: -1 })
                            .skip(actualSkip)
                            .limit(parseInt(limit))
                            .toArray();
                        console.log(`Found ${videos.length} videos from followed accounts`);
                    } else {
                        // User follows no one - return empty
                        console.log('User follows no accounts - returning empty following feed');
                        videos = [];
                    }
                } else {
                    // Not logged in - return empty 
                    console.log('Not logged in - returning empty following feed');
                    videos = [];
                }
                break;
                
            case 'explore':
                // Explore: Trending, popular, hashtag-driven content
                console.log('🔥 Explore Algorithm: Trending and popular content');
                // Explore feed should show ALL users' videos, not filtered by userId
                query = { status: { $ne: 'deleted' } };
                // Sort by engagement metrics and recent activity
                videos = await db.collection('videos')
                    .find(query)
                    .sort({ 
                        createdAt: -1,  // Recent content first
                        // We'll add engagement sorting in the processing below
                    })
                    .skip(actualSkip)
                    .limit(parseInt(limit) * 2) // Get more to filter for trending
                    .toArray();
                    
                // Shuffle for diversity in explore feed
                videos = videos.sort(() => Math.random() - 0.5).slice(0, parseInt(limit));
                break;
                
            case 'friends':
                // Friends: Content from friends/contacts
                console.log('👫 Friends Algorithm: From friend connections');
                if (currentUserId) {
                    // Get mutual follows (friends)
                    const userFollowing = await db.collection('follows')
                        .find({ followerId: currentUserId })
                        .toArray();
                    const userFollowers = await db.collection('follows')
                        .find({ followingId: currentUserId })
                        .toArray();
                        
                    const followingIds = userFollowing.map(f => f.followingId);
                    const followerIds = userFollowers.map(f => f.followerId);
                    
                    // Find mutual friends (people who follow each other)
                    const friendIds = followingIds.filter(id => followerIds.includes(id));
                    
                    console.log(`User ${currentUserId} has ${friendIds.length} mutual friends`);
                    
                    if (friendIds.length > 0) {
                        query = { userId: { $in: friendIds }, status: { $ne: 'deleted' } };
                        videos = await db.collection('videos')
                            .find(query)
                            .sort({ createdAt: -1 })
                            .skip(actualSkip)
                            .limit(parseInt(limit))
                            .toArray();
                        console.log(`Found ${videos.length} videos from friends`);
                    } else {
                        // No mutual friends - return empty
                        console.log('User has no mutual friends - returning empty friends feed');
                        videos = [];
                    }
                } else {
                    // Not logged in - return empty
                    console.log('Not logged in - returning empty friends feed');
                    videos = [];
                }
                break;
                
            default:
                // For You algorithm with engagement-based ranking
                console.log('🤖 For You Algorithm: Engagement-based ranking');
                query = { status: { $ne: 'deleted' } };
                
                // Get more videos than needed for better ranking algorithm
                const algorithmLimit = Math.max(parseInt(limit) * 3, 50);
                videos = await db.collection('videos')
                    .find(query)
                    .sort({ createdAt: -1 })
                    .limit(algorithmLimit)
                    .toArray();
                
                // Apply engagement-based ranking
                videos = await applyEngagementRanking(videos, db);
                
                // Apply pagination after ranking
                const startIndex = actualSkip;
                const endIndex = startIndex + parseInt(limit);
                videos = videos.slice(startIndex, endIndex);
        }
            
        console.log(`Fetching page ${page}, skip: ${actualSkip}, limit: ${limit}`);
        
        console.log('Found videos in database:', videos.length);
        
        // Handle empty feeds properly based on type
        if (videos.length === 0) {
            // Following and Friends should stay empty if user has no connections
            if (feed === 'following' || feed === 'friends') {
                console.log(`No content for ${feed} feed - user has no connections`);
                return res.json({ videos: [] });
            }
            
            // For You and Explore should only be empty on page 1 if no videos exist
            if (page == 1) {
                console.log('No videos in database for page 1, returning empty');
                return res.json({ videos: [] });
            }
        }
        
        // If no videos in database, return empty array for all pages and feeds
        if (videos.length === 0) {
            console.log(`No videos in database for ${feed} page ${page}, returning empty array`);
            return res.json({ videos: [] });
        }
        
        // Get user info for each video
        for (const video of videos) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(video.userId) },
                    { projection: { password: 0 } }
                );
                
                if (user) {
                    video.user = user;
                    video.username = user.username || user.displayName || 'anonymous';
                } else {
                    // User not found in database
                    video.user = { 
                        username: 'deleted_user', 
                        displayName: 'Deleted User', 
                        _id: video.userId,
                        profilePicture: '👤'
                    };
                    video.username = 'deleted_user';
                }
                
                // Get like count
                video.likeCount = await db.collection('likes').countDocuments({ videoId: video._id.toString() });
                
                // Get comment count
                video.commentCount = await db.collection('comments').countDocuments({ videoId: video._id.toString() });
                
                // Get share count (create shares collection if needed)
                video.shareCount = await db.collection('shares').countDocuments({ videoId: video._id.toString() });
                
                // Add feed metadata without changing titles
                video.feedType = feed;
                
            } catch (userError) {
                console.error('Error getting user info for video:', video._id, userError);
                // Set default user info if error
                video.user = { 
                    username: 'anonymous', 
                    displayName: 'Anonymous User', 
                    _id: 'unknown',
                    profilePicture: '👤'
                };
                video.username = 'anonymous';
                video.likeCount = 0;
                video.commentCount = 0;
            }
        }
        
        console.log(`📤 Sending ${videos.length} videos for page ${page}`);
        res.json({ videos });
        
    } catch (error) {
        console.error('Get videos error:', error);
        console.log('Database error, returning empty');
        // Return empty instead of sample data
        res.json({ videos: [] });
    }
});

// Upload and process video file to DigitalOcean Spaces
app.post('/api/upload/video', requireAuth, upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No video file provided',
                code: 'NO_FILE'
            });
        }

        const { title, description, username, userId } = req.body;
        if (!title) {
            return res.status(400).json({ 
                error: 'Video title is required',
                code: 'NO_TITLE'
            });
        }

        console.log(`🎬 Processing video upload: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);

        // Check for bypass flag for development/testing
        const bypassProcessing = req.body.bypassProcessing === 'true' || process.env.BYPASS_VIDEO_PROCESSING === 'true';
        
        let conversionResult;
        
        if (bypassProcessing) {
            console.log('⚡ BYPASSING video processing for speed');
            conversionResult = {
                success: true,
                buffer: req.file.buffer,
                originalSize: req.file.size,
                convertedSize: req.file.size,
                skipped: true,
                bypassed: true
            };
        } else {
            // Step 1: Validate video file
            console.log('📋 Step 1: Validating video...');
            const validation = await videoProcessor.validateVideo(req.file.buffer, req.file.originalname);
            if (!validation.valid) {
                return res.status(400).json({ 
                    error: `Video validation failed: ${validation.error}`,
                    code: 'VALIDATION_FAILED',
                    details: validation.error
                });
            }

            console.log('✅ Video validation passed');

            // Step 2: Convert video to standard H.264 MP4
            console.log('📋 Step 2: Converting video to standard MP4...');
            conversionResult = await videoProcessor.convertToStandardMp4(req.file.buffer, req.file.originalname);
        }
        
        let finalBuffer, finalMimeType, processingInfo;
        
        if (conversionResult.success) {
            if (conversionResult.bypassed) {
                console.log('⚡ Video processing bypassed for speed');
                finalBuffer = conversionResult.buffer;
                finalMimeType = req.file.mimetype;
                processingInfo = {
                    converted: false,
                    bypassed: true,
                    originalSize: conversionResult.originalSize,
                    convertedSize: conversionResult.convertedSize
                };
            } else {
                console.log('✅ Video conversion successful');
                finalBuffer = conversionResult.buffer;
                finalMimeType = 'video/mp4';
                processingInfo = {
                    converted: true,
                    skipped: conversionResult.skipped || false,
                    originalSize: conversionResult.originalSize,
                    convertedSize: conversionResult.convertedSize,
                    compressionRatio: (conversionResult.originalSize / conversionResult.convertedSize).toFixed(2),
                    videoInfo: conversionResult.videoInfo
                };
            }
        } else {
            console.log('⚠️ Video conversion failed, using original file');
            finalBuffer = conversionResult.originalBuffer;
            finalMimeType = req.file.mimetype;
            processingInfo = {
                converted: false,
                error: conversionResult.error,
                originalSize: req.file.size
            };
        }

        // Step 3: Generate unique filename (always .mp4 for converted videos)
        const fileExtension = conversionResult.success ? '.mp4' : path.extname(req.file.originalname);
        const fileName = `videos/${Date.now()}-${crypto.randomBytes(16).toString('hex')}${fileExtension}`;

        console.log('📋 Step 3: Uploading to DigitalOcean Spaces...');

        // Step 4: Upload to DigitalOcean Spaces
        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: finalBuffer,
            ContentType: finalMimeType,
            ACL: 'public-read',
            Metadata: {
                'original-filename': req.file.originalname,
                'processed': conversionResult.success.toString(),
                'upload-timestamp': Date.now().toString()
            }
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        let videoUrl = uploadResult.Location;
        
        // Normalize URL format for DigitalOcean Spaces
        if (videoUrl && !videoUrl.startsWith('https://')) {
            // Ensure proper HTTPS URL format
            videoUrl = `https://${BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com'}/${fileName}`;
        }

        console.log('✅ Upload completed to:', videoUrl);

        // Step 5: Save to database with processing information
        let videoRecord = null;
        if (db) {
            const video = {
                userId: req.user.userId || userId,
                username: username || 'unknown',
                title,
                description: description || '',
                videoUrl,
                fileName,
                originalFilename: req.file.originalname,
                fileSize: finalBuffer.length,
                originalFileSize: req.file.size,
                mimeType: finalMimeType,
                originalMimeType: req.file.mimetype,
                processed: conversionResult.success,
                processingInfo: processingInfo,
                views: 0,
                likes: [],
                comments: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await db.collection('videos').insertOne(video);
            video._id = result.insertedId;
            videoRecord = video;
            
            console.log('✅ Video record saved to database');
        }

        // Step 6: Return success response with detailed information
        res.json({
            success: true,
            message: 'Video uploaded and processed successfully',
            videoUrl,
            video: videoRecord,
            processing: {
                converted: conversionResult.success,
                skipped: conversionResult.skipped || false,
                originalSize: req.file.size,
                finalSize: finalBuffer.length,
                sizeSaved: req.file.size - finalBuffer.length,
                format: conversionResult.success ? 'H.264 MP4' : 'Original format',
                quality: conversionResult.success ? 'Optimized for web streaming' : 'Original quality'
            }
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        
        // Enhanced error reporting
        let errorCode = 'UNKNOWN_ERROR';
        let userMessage = 'Upload failed. Please try again.';
        
        if (error.message.includes('ENOENT')) {
            errorCode = 'FFMPEG_NOT_FOUND';
            userMessage = 'Video processing is temporarily unavailable. Please try again later.';
        } else if (error.message.includes('Invalid')) {
            errorCode = 'INVALID_VIDEO';
            userMessage = 'The video file appears to be corrupted or in an unsupported format.';
        } else if (error.message.includes('size')) {
            errorCode = 'FILE_TOO_LARGE';
            userMessage = 'Video file is too large. Please upload a file smaller than 500MB.';
        } else if (error.message.includes('duration')) {
            errorCode = 'VIDEO_TOO_LONG';
            userMessage = 'Video is too long. Please upload a video shorter than 3 minutes.';
        }
        
        res.status(500).json({ 
            error: userMessage,
            code: errorCode,
            technical: error.message // For debugging
        });
    }
});

// Upload video (metadata only - for external URLs)
app.post('/api/videos', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { title, description, videoUrl, thumbnailUrl, duration, hashtags, privacy = 'public' } = req.body;
    
    if (!title || !videoUrl) {
        return res.status(400).json({ error: 'Title and video URL required' });
    }
    
    try {
        // Parse hashtags
        let parsedHashtags = [];
        if (hashtags) {
            if (typeof hashtags === 'string') {
                parsedHashtags = hashtags.split(',').map(tag => tag.trim()).filter(tag => tag);
            } else if (Array.isArray(hashtags)) {
                parsedHashtags = hashtags;
            }
        }

        const video = {
            userId: req.user.userId,
            title,
            description: description || '',
            videoUrl,
            thumbnailUrl: thumbnailUrl || '',
            duration: duration || 0,
            hashtags: parsedHashtags,
            privacy,
            views: 0,
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await db.collection('videos').insertOne(video);
        video._id = result.insertedId;
        
        res.json({ 
            message: 'Video uploaded successfully',
            video
        });
        
    } catch (error) {
        console.error('Upload video error:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});

// Get posts (photos, slideshows, mixed content)
app.get('/api/posts', async (req, res) => {
    if (!db) {
        return res.json({ posts: [] });
    }
    
    try {
        const { limit = 10, skip = 0, page = 1, userId, type } = req.query;
        const actualSkip = page > 1 ? (parseInt(page) - 1) * parseInt(limit) : parseInt(skip);
        
        let query = { status: 'published' };
        if (userId) query.userId = userId;
        if (type) query.type = type;
        
        const posts = await db.collection('posts')
            .find(query)
            .sort({ createdAt: -1 })
            .skip(actualSkip)
            .limit(parseInt(limit))
            .toArray();
        
        // Get user info for each post
        for (const post of posts) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(post.userId) },
                    { projection: { password: 0 } }
                );
                
                if (user) {
                    post.user = user;
                    post.username = user.username || user.displayName || 'anonymous';
                } else {
                    // User not found in database
                    post.user = { 
                        username: 'deleted_user', 
                        displayName: 'Deleted User', 
                        _id: post.userId,
                        profilePicture: '👤'
                    };
                    post.username = 'deleted_user';
                }
                
                // Get engagement counts
                post.likeCount = await db.collection('likes').countDocuments({ postId: post._id.toString() });
                post.commentCount = await db.collection('comments').countDocuments({ postId: post._id.toString() });
            } catch (userError) {
                console.error('Error getting user info for post:', post._id, userError);
                post.user = { 
                    username: 'anonymous', 
                    displayName: 'Anonymous User', 
                    _id: 'unknown',
                    profilePicture: '👤'
                };
                post.username = 'anonymous';
                post.likeCount = 0;
                post.commentCount = 0;
            }
        }
        
        res.json({ posts });
        
    } catch (error) {
        console.error('Get posts error:', error);
        res.json({ posts: [] });
    }
});

// Get user's videos for profile page
app.get('/api/user/videos', async (req, res) => {
    if (!db) {
        return res.json({ videos: [] });
    }
    
    try {
        const { userId, limit = 20, skip = 0, page = 1 } = req.query;
        const actualSkip = page > 1 ? (parseInt(page) - 1) * parseInt(limit) : parseInt(skip);
        
        // Get current user from auth token if no userId provided
        let targetUserId = userId;
        if (!targetUserId && req.headers.authorization) {
            const token = req.headers.authorization.replace('Bearer ', '');
            const session = sessions.get(token);
            if (session) {
                targetUserId = session.userId;
            }
        }
        
        if (!targetUserId) {
            return res.status(400).json({ error: 'User ID required' });
        }
        
        console.log(`Getting videos for user: ${targetUserId}`);
        
        const videos = await db.collection('videos')
            .find({ userId: targetUserId, status: { $ne: 'deleted' } })
            .sort({ createdAt: -1 })
            .skip(actualSkip)
            .limit(parseInt(limit))
            .toArray();
        
        console.log(`Found ${videos.length} videos for user ${targetUserId}`);
        
        // Get user info and engagement counts for each video
        for (const video of videos) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(video.userId) },
                    { projection: { password: 0 } }
                );
                
                if (user) {
                    video.user = user;
                    video.username = user.username || user.displayName || 'anonymous';
                } else {
                    // User not found in database
                    video.user = { 
                        username: 'deleted_user', 
                        displayName: 'Deleted User', 
                        _id: video.userId,
                        profilePicture: '👤'
                    };
                    video.username = 'deleted_user';
                }
                
                // Get engagement counts
                video.likeCount = await db.collection('likes').countDocuments({ videoId: video._id.toString() });
                video.commentCount = await db.collection('comments').countDocuments({ videoId: video._id.toString() });
                video.views = video.views || 0;
            } catch (userError) {
                console.error('Error getting user info for video:', video._id, userError);
                video.user = { 
                    username: 'anonymous', 
                    displayName: 'Anonymous User', 
                    _id: 'unknown',
                    profilePicture: '👤'
                };
                video.username = 'anonymous';
                video.likeCount = 0;
                video.commentCount = 0;
                video.views = 0;
            }
        }
        
        res.json({ videos });
        
    } catch (error) {
        console.error('Get user videos error:', error);
        res.json({ videos: [] });
    }
});

// Delete user video
app.delete('/api/videos/:videoId', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { videoId } = req.params;
    const userId = req.user.userId;
    
    try {
        console.log(`User ${userId} requesting to delete video ${videoId}`);
        
        // First, verify the video exists and belongs to the user
        const video = await db.collection('videos').findOne({ 
            _id: new ObjectId(videoId),
            userId: userId
        });
        
        if (!video) {
            return res.status(404).json({ error: 'Video not found or you do not have permission to delete it' });
        }
        
        console.log(`Deleting video: ${video.title || 'Untitled'} by user ${userId}`);
        
        // Soft delete - mark as deleted instead of removing completely
        const result = await db.collection('videos').updateOne(
            { _id: new ObjectId(videoId) },
            { 
                $set: { 
                    status: 'deleted',
                    deletedAt: new Date()
                }
            }
        );
        
        if (result.modifiedCount === 1) {
            console.log(`✅ Video ${videoId} marked as deleted`);
            
            // Also delete related data (likes, comments, etc.)
            await Promise.all([
                db.collection('likes').deleteMany({ videoId: videoId }),
                db.collection('comments').deleteMany({ videoId: videoId }),
                db.collection('views').deleteMany({ videoId: videoId })
            ]);
            
            console.log(`✅ Deleted related data for video ${videoId}`);
            
            res.json({ 
                message: 'Video deleted successfully',
                videoId: videoId
            });
        } else {
            res.status(500).json({ error: 'Failed to delete video' });
        }
        
    } catch (error) {
        console.error('Delete video error:', error);
        res.status(500).json({ error: 'Failed to delete video' });
    }
});

// Get user profile data
app.get('/api/user/profile', async (req, res) => {
    if (!db) {
        return res.json({ 
            user: {
                _id: 'default',
                username: 'anonymous',
                displayName: 'VIB3 User',
                email: 'user@vib3.com',
                bio: 'Welcome to VIB3!',
                profilePicture: '👤'
            }
        });
    }
    
    try {
        const { userId } = req.query;
        
        // Get current user from auth token if no userId provided
        let targetUserId = userId;
        if (!targetUserId && req.headers.authorization) {
            const token = req.headers.authorization.replace('Bearer ', '');
            const session = sessions.get(token);
            if (session) {
                targetUserId = session.userId;
            }
        }
        
        if (!targetUserId) {
            return res.status(400).json({ error: 'User ID required' });
        }
        
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(targetUserId) },
            { projection: { password: 0 } }
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ user });
        
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
});

// Configure multer for profile image uploads
const profileImageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for profile images
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
        }
    }
});

// Upload profile image
app.post('/api/user/profile-image', requireAuth, profileImageUpload.single('profileImage'), async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }

    try {
        const userId = req.user.userId;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        console.log(`🖼️ Uploading profile image for user ${userId}:`, {
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype
        });

        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const fileName = `profile-${userId}-${Date.now()}${fileExtension}`;
        const key = `profile-images/${fileName}`;

        // Upload to DigitalOcean Spaces
        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read'
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        const profileImageUrl = uploadResult.Location;

        console.log(`✅ Profile image uploaded successfully:`, profileImageUrl);

        // Update user profile in database
        const updateResult = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { 
                $set: { 
                    profileImage: profileImageUrl,
                    profilePicture: null, // Clear emoji if switching to image
                    updatedAt: new Date()
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
            success: true,
            profilePictureUrl: profileImageUrl,
            message: 'Profile image updated successfully'
        });

    } catch (error) {
        console.error('Profile image upload error:', error);
        res.status(500).json({ error: 'Failed to upload profile image' });
    }
});

// Update user profile (for text fields like bio, username, emoji profile pictures)
app.put('/api/user/profile', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }

    try {
        const userId = req.user.userId;
        const updates = req.body;

        // Validate allowed fields
        const allowedFields = ['bio', 'username', 'displayName', 'profilePicture'];
        const validUpdates = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                validUpdates[field] = updates[field];
            }
        }

        // If setting emoji profile picture, clear the image
        if (validUpdates.profilePicture) {
            validUpdates.profileImage = null;
        }

        if (Object.keys(validUpdates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        validUpdates.updatedAt = new Date();

        console.log(`👤 Updating profile for user ${userId}:`, validUpdates);

        const updateResult = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: validUpdates }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
            success: true,
            updates: validUpdates,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get user stats (followers, following, likes)
app.get('/api/user/stats', async (req, res) => {
    console.log('📊 User stats request:', {
        hasAuth: !!req.headers.authorization,
        userId: req.query.userId,
        dbConnected: !!db
    });
    
    if (!db) {
        console.log('📊 No DB connection, returning zeros');
        return res.json({ 
            followers: 0,
            following: 0,
            likes: 0,
            videoCount: 0
        });
    }
    
    try {
        const { userId } = req.query;
        
        // Get current user from auth token if no userId provided
        let targetUserId = userId;
        if (!targetUserId && req.headers.authorization) {
            const token = req.headers.authorization.replace('Bearer ', '');
            const session = sessions.get(token);
            if (session) {
                targetUserId = session.userId;
                console.log('📊 Using authenticated user ID:', targetUserId);
            }
        }
        
        if (!targetUserId) {
            console.log('📊 No user ID found, returning error');
            return res.status(400).json({ error: 'User ID required' });
        }
        
        // Get stats from different collections
        const [followers, following, userVideos] = await Promise.all([
            db.collection('follows').countDocuments({ followingId: targetUserId }),
            db.collection('follows').countDocuments({ followerId: targetUserId }),
            db.collection('videos').find({ userId: targetUserId, status: { $ne: 'deleted' } }).toArray()
        ]);
        
        // Count total likes on user's videos
        let totalLikes = 0;
        for (const video of userVideos) {
            const likes = await db.collection('likes').countDocuments({ videoId: video._id.toString() });
            totalLikes += likes;
        }
        
        const stats = {
            followers,
            following,
            likes: totalLikes,
            videoCount: userVideos.length
        };
        
        console.log('📊 Calculated stats for user', targetUserId, ':', stats);
        
        res.json(stats);
        
    } catch (error) {
        console.error('Get user stats error:', error);
        res.json({ 
            stats: {
                followers: 0,
                following: 0,
                likes: 0,
                videoCount: 0
            }
        });
    }
});

// Get combined feed (videos and posts)
app.get('/api/feed/combined', async (req, res) => {
    if (!db) {
        return res.json({ feed: [] });
    }
    
    try {
        const { limit = 10, skip = 0, page = 1, userId } = req.query;
        const actualSkip = page > 1 ? (parseInt(page) - 1) * parseInt(limit) : parseInt(skip);
        
        let query = { status: 'published' };
        if (userId) query.userId = userId;
        
        // Get videos and posts separately, then combine
        const [videos, posts] = await Promise.all([
            db.collection('videos').find(query).sort({ createdAt: -1 }).toArray(),
            db.collection('posts').find(query).sort({ createdAt: -1 }).toArray()
        ]);
        
        // Combine and sort by creation date
        const combined = [...videos.map(v => ({ ...v, contentType: 'video' })), 
                          ...posts.map(p => ({ ...p, contentType: 'post' }))]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(actualSkip, actualSkip + parseInt(limit));
        
        // Get user info for each item
        for (const item of combined) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(item.userId) },
                    { projection: { password: 0 } }
                );
                
                if (user) {
                    item.user = user;
                    item.username = user.username || user.displayName || 'anonymous';
                } else {
                    // User not found in database
                    item.user = { 
                        username: 'deleted_user', 
                        displayName: 'Deleted User', 
                        _id: item.userId,
                        profilePicture: '👤'
                    };
                    item.username = 'deleted_user';
                }
                
                // Get engagement counts
                const collection = item.contentType === 'video' ? 'videos' : 'posts';
                const idField = item.contentType === 'video' ? 'videoId' : 'postId';
                item.likeCount = await db.collection('likes').countDocuments({ [idField]: item._id.toString() });
                item.commentCount = await db.collection('comments').countDocuments({ [idField]: item._id.toString() });
            } catch (userError) {
                console.error('Error getting user info for feed item:', item._id, userError);
                item.user = { 
                    username: 'anonymous', 
                    displayName: 'Anonymous User', 
                    _id: 'unknown',
                    profilePicture: '👤'
                };
                item.username = 'anonymous';
                item.likeCount = 0;
                item.commentCount = 0;
            }
        }
        
        res.json({ feed: combined });
        
    } catch (error) {
        console.error('Get combined feed error:', error);
        res.json({ feed: [] });
    }
});

// Like/unlike post (photos, slideshows, mixed content)
app.post('/api/posts/:postId/like', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { postId } = req.params;
    
    try {
        const like = {
            postId,
            userId: req.user.userId,
            createdAt: new Date()
        };
        
        // Try to insert like
        try {
            await db.collection('likes').insertOne(like);
            res.json({ message: 'Post liked', liked: true });
        } catch (error) {
            // If duplicate key error, remove the like
            if (error.code === 11000) {
                await db.collection('likes').deleteOne({ 
                    postId, 
                    userId: req.user.userId 
                });
                res.json({ message: 'Post unliked', liked: false });
            } else {
                throw error;
            }
        }
        
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ error: 'Failed to like post' });
    }
});

// Add comment to post
app.post('/api/posts/:postId/comments', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { postId } = req.params;
    const { text } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Comment text required' });
    }
    
    try {
        const comment = {
            postId,
            userId: req.user.userId,
            text,
            createdAt: new Date()
        };
        
        const result = await db.collection('comments').insertOne(comment);
        comment._id = result.insertedId;
        
        // Get user info
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.user.userId) },
            { projection: { password: 0 } }
        );
        comment.user = user;
        
        res.json({ 
            message: 'Comment added',
            comment
        });
        
    } catch (error) {
        console.error('Add comment to post error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Get comments for post
app.get('/api/posts/:postId/comments', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { postId } = req.params;
    
    try {
        const comments = await db.collection('comments')
            .find({ postId })
            .sort({ createdAt: -1 })
            .toArray();
        
        // Get user info for each comment
        for (const comment of comments) {
            const user = await db.collection('users').findOne(
                { _id: new ObjectId(comment.userId) },
                { projection: { password: 0 } }
            );
            comment.user = user;
        }
        
        res.json({ comments });
        
    } catch (error) {
        console.error('Get post comments error:', error);
        res.status(500).json({ error: 'Failed to get comments' });
    }
});

// Like/unlike video
app.post('/api/videos/:videoId/like', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { videoId } = req.params;
    
    try {
        const like = {
            videoId,
            userId: req.user.userId,
            createdAt: new Date()
        };
        
        // Try to insert like
        try {
            await db.collection('likes').insertOne(like);
            
            // Get updated like count
            const likeCount = await db.collection('likes').countDocuments({ videoId });
            
            res.json({ 
                message: 'Video liked', 
                liked: true, 
                likeCount 
            });
        } catch (error) {
            // If duplicate key error, remove the like
            if (error.code === 11000) {
                await db.collection('likes').deleteOne({ 
                    videoId, 
                    userId: req.user.userId 
                });
                
                // Get updated like count
                const likeCount = await db.collection('likes').countDocuments({ videoId });
                
                res.json({ 
                    message: 'Video unliked', 
                    liked: false, 
                    likeCount 
                });
            } else {
                throw error;
            }
        }
        
    } catch (error) {
        console.error('Like video error:', error);
        res.status(500).json({ error: 'Failed to like video' });
    }
});

// Simple like endpoint as specified
app.post('/like', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { videoId, userId } = req.body;
    
    // Use authenticated user ID if not provided
    const actualUserId = userId || req.user.userId;
    
    // Validate required fields
    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
    }
    
    if (!actualUserId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    
    console.log(`💖 Like request: videoId=${videoId}, userId=${actualUserId}`);
    console.log(`💖 SERVER VERSION: Fixed duplicate key error - using empty string for postId`);
    
    try {
        // Check if like already exists (handle both null and empty string postId)
        const existingLike = await db.collection('likes').findOne({ 
            videoId: videoId.toString(), 
            userId: actualUserId.toString()
        });
        
        console.log(`💖 Existing like found: ${!!existingLike}`);
        
        if (existingLike) {
            // Unlike - remove the like (handle both null and empty string postId)
            const deleteResult = await db.collection('likes').deleteOne({ 
                videoId: videoId.toString(), 
                userId: actualUserId.toString()
            });
            
            console.log(`💖 Delete result: ${deleteResult.deletedCount} likes removed`);
            
            // Get updated like count (count video likes only)
            const likeCount = await db.collection('likes').countDocuments({ 
                videoId: videoId.toString()
            });
            
            console.log(`💖 Unliked video ${videoId}, new count: ${likeCount}`);
            
            res.json({ 
                message: 'Video unliked', 
                liked: false, 
                likeCount 
            });
        } else {
            // Like - add new like  
            // Don't include postId for video likes - only for post likes
            const like = {
                videoId: videoId.toString(),
                userId: actualUserId.toString(),
                createdAt: new Date()
            };
            
            try {
                const insertResult = await db.collection('likes').insertOne(like);
                console.log(`💖 Insert result: ${insertResult.insertedId}`);
                
                // Get updated like count (count video likes only)
                const likeCount = await db.collection('likes').countDocuments({ 
                    videoId: videoId.toString()
                });
                
                console.log(`💖 Liked video ${videoId}, new count: ${likeCount}`);
                
                res.json({ 
                    message: 'Video liked', 
                    liked: true, 
                    likeCount 
                });
            } catch (insertError) {
                // Handle duplicate key errors specifically
                if (insertError.code === 11000) {
                    console.log(`💖 Duplicate key error on insert, checking existing like...`);
                    
                    // Check if there's already a like for this video
                    const existingVideoLike = await db.collection('likes').findOne({ 
                        videoId: videoId.toString(), 
                        userId: actualUserId.toString()
                    });
                    
                    if (existingVideoLike) {
                        console.log(`💖 Found existing video like, treating as already liked`);
                        const likeCount = await db.collection('likes').countDocuments({ 
                            videoId: videoId.toString()
                        });
                        res.json({ 
                            message: 'Video already liked', 
                            liked: true, 
                            likeCount 
                        });
                    } else {
                        console.error(`💖 Duplicate key error but no existing video like found:`, insertError);
                        throw insertError;
                    }
                } else {
                    throw insertError;
                }
            }
        }
        
    } catch (error) {
        console.error('Like video error:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            videoId,
            userId: actualUserId
        });
        res.status(500).json({ 
            error: 'Failed to like video',
            details: error.message 
        });
    }
});

// Get like status for a video
app.get('/api/videos/:videoId/like-status', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { videoId } = req.params;
    const userId = req.user.userId;
    
    try {
        // Ensure string types for consistency and handle video likes
        const like = await db.collection('likes').findOne({ 
            videoId: videoId.toString(), 
            userId: userId.toString()
        });
        const likeCount = await db.collection('likes').countDocuments({ 
            videoId: videoId.toString()
        });
        
        res.json({ 
            liked: !!like, 
            likeCount 
        });
        
    } catch (error) {
        console.error('Get like status error:', error);
        res.status(500).json({ error: 'Failed to get like status' });
    }
});

// Share video
app.post('/api/videos/:videoId/share', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { videoId } = req.params;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    try {
        // Create a unique identifier for this share (to prevent spam)
        const shareIdentifier = userAgent + ipAddress;
        const shareHash = require('crypto').createHash('md5').update(shareIdentifier).digest('hex');
        
        // Check if this user/device already shared this video recently (within 1 hour)
        const recentShare = await db.collection('shares').findOne({
            videoId,
            shareHash,
            createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
        });
        
        if (!recentShare) {
            // Record the share
            const share = {
                videoId,
                shareHash,
                userAgent,
                createdAt: new Date()
            };
            
            await db.collection('shares').insertOne(share);
        }
        
        // Return current share count
        const shareCount = await db.collection('shares').countDocuments({ videoId });
        res.json({ message: 'Share recorded', shareCount });
        
    } catch (error) {
        console.error('Share video error:', error);
        res.status(500).json({ error: 'Failed to record share' });
    }
});

// Add comment
app.post('/api/videos/:videoId/comments', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { videoId } = req.params;
    const { text } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Comment text required' });
    }
    
    try {
        const comment = {
            videoId,
            userId: req.user.userId,
            text,
            createdAt: new Date()
        };
        
        const result = await db.collection('comments').insertOne(comment);
        comment._id = result.insertedId;
        
        // Get user info
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.user.userId) },
            { projection: { password: 0 } }
        );
        comment.user = user;
        
        res.json({ 
            message: 'Comment added',
            comment
        });
        
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Get comments for video
app.get('/api/videos/:videoId/comments', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { videoId } = req.params;
    
    try {
        const comments = await db.collection('comments')
            .find({ videoId })
            .sort({ createdAt: -1 })
            .toArray();
        
        // Get user info for each comment
        for (const comment of comments) {
            const user = await db.collection('users').findOne(
                { _id: new ObjectId(comment.userId) },
                { projection: { password: 0 } }
            );
            comment.user = user;
        }
        
        res.json({ comments });
        
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Failed to get comments' });
    }
});

// Follow/unfollow user
app.post('/api/users/:userId/follow', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { userId } = req.params;
    
    if (userId === req.user.userId) {
        return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    try {
        const follow = {
            followerId: req.user.userId,
            followingId: userId,
            createdAt: new Date()
        };
        
        // Try to insert follow
        try {
            await db.collection('follows').insertOne(follow);
            
            // Update follower counts
            await db.collection('users').updateOne(
                { _id: new ObjectId(req.user.userId) },
                { $inc: { following: 1 } }
            );
            await db.collection('users').updateOne(
                { _id: new ObjectId(userId) },
                { $inc: { followers: 1 } }
            );
            
            res.json({ message: 'User followed', following: true });
        } catch (error) {
            // If duplicate key error, remove the follow
            if (error.code === 11000) {
                await db.collection('follows').deleteOne({ 
                    followerId: req.user.userId,
                    followingId: userId
                });
                
                // Update follower counts
                await db.collection('users').updateOne(
                    { _id: new ObjectId(req.user.userId) },
                    { $inc: { following: -1 } }
                );
                await db.collection('users').updateOne(
                    { _id: new ObjectId(userId) },
                    { $inc: { followers: -1 } }
                );
                
                res.json({ message: 'User unfollowed', following: false });
            } else {
                throw error;
            }
        }
        
    } catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({ error: 'Failed to follow user' });
    }
});

// Unfollow user
app.post('/api/users/:userId/unfollow', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { userId } = req.params;
    
    try {
        // Remove follow
        const result = await db.collection('follows').deleteOne({ 
            followerId: req.user.userId,
            followingId: userId
        });
        
        if (result.deletedCount > 0) {
            // Update follower counts
            await db.collection('users').updateOne(
                { _id: new ObjectId(req.user.userId) },
                { $inc: { following: -1 } }
            );
            await db.collection('users').updateOne(
                { _id: new ObjectId(userId) },
                { $inc: { followers: -1 } }
            );
            
            res.json({ message: 'User unfollowed', following: false });
        } else {
            res.json({ message: 'Not following this user', following: false });
        }
        
    } catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({ error: 'Failed to unfollow user' });
    }
});

// Get current user's following list
app.get('/api/user/following', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    try {
        const follows = await db.collection('follows')
            .find({ followerId: req.user.userId })
            .toArray();
        
        // Get user details for each followed user
        const followingIds = follows.map(f => new ObjectId(f.followingId));
        const users = await db.collection('users')
            .find({ _id: { $in: followingIds } })
            .project({ password: 0 })
            .toArray();
        
        res.json(users);
        
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ error: 'Failed to get following list' });
    }
});

// Get user profile
app.get('/api/users/:userId', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { userId } = req.params;
    
    try {
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0 } }
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get stats
        const stats = {
            followers: await db.collection('follows').countDocuments({ followingId: userId }),
            following: await db.collection('follows').countDocuments({ followerId: userId }),
            likes: await db.collection('likes').countDocuments({ userId: userId }),
            videos: await db.collection('videos').countDocuments({ userId: userId, status: { $ne: 'deleted' } })
        };
        
        // Add stats to user object
        user.stats = stats;
        
        res.json(user);
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Search users
app.get('/api/search/users', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { q } = req.query;
    
    if (!q) {
        return res.status(400).json({ error: 'Search query required' });
    }
    
    try {
        const users = await db.collection('users')
            .find({
                $or: [
                    { username: { $regex: q, $options: 'i' } },
                    { displayName: { $regex: q, $options: 'i' } }
                ]
            })
            .project({ password: 0 })
            .limit(20)
            .toArray();
        
        res.json({ users });
        
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Search posts and videos
app.get('/api/search/content', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { q, type = 'all' } = req.query;
    
    if (!q) {
        return res.status(400).json({ error: 'Search query required' });
    }
    
    try {
        const searchQuery = {
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { hashtags: { $regex: q, $options: 'i' } }
            ],
            status: 'published'
        };
        
        let results = [];
        
        if (type === 'all' || type === 'videos') {
            const videos = await db.collection('videos')
                .find(searchQuery)
                .limit(10)
                .toArray();
            results.push(...videos.map(v => ({ ...v, contentType: 'video' })));
        }
        
        if (type === 'all' || type === 'posts') {
            const posts = await db.collection('posts')
                .find(searchQuery)
                .limit(10)
                .toArray();
            results.push(...posts.map(p => ({ ...p, contentType: 'post' })));
        }
        
        // Sort by relevance and date
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Get user info for each result
        for (const item of results) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(item.userId) },
                    { projection: { password: 0 } }
                );
                
                if (user) {
                    item.user = user;
                    item.username = user.username || user.displayName || 'anonymous';
                } else {
                    // User not found in database
                    item.user = { 
                        username: 'deleted_user', 
                        displayName: 'Deleted User', 
                        _id: item.userId,
                        profilePicture: '👤'
                    };
                    item.username = 'deleted_user';
                }
            } catch (userError) {
                item.user = { 
                    username: 'anonymous', 
                    displayName: 'Anonymous User',
                    _id: 'unknown',
                    profilePicture: '👤'
                };
                item.username = 'anonymous';
            }
        }
        
        res.json({ content: results.slice(0, 20) });
        
    } catch (error) {
        console.error('Search content error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Validate uploaded files
app.post('/api/upload/validate', requireAuth, upload.array('files', 35), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files provided for validation' });
        }
        
        const videoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/mov'];
        const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
        
        const validationResults = req.files.map((file, index) => {
            const isVideo = videoTypes.includes(file.mimetype);
            const isImage = imageTypes.includes(file.mimetype);
            const isValid = isVideo || isImage;
            
            // Check file size limits
            const maxVideoSize = 100 * 1024 * 1024; // 100MB
            const maxImageSize = 25 * 1024 * 1024;  // 25MB
            const sizeValid = isVideo ? file.size <= maxVideoSize : file.size <= maxImageSize;
            
            return {
                index,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                type: isVideo ? 'video' : isImage ? 'image' : 'unknown',
                valid: isValid && sizeValid,
                errors: [
                    ...(!isValid ? ['Invalid file type'] : []),
                    ...(!sizeValid ? ['File size exceeds limit'] : [])
                ]
            };
        });
        
        const validFiles = validationResults.filter(f => f.valid);
        const invalidFiles = validationResults.filter(f => !f.valid);
        
        res.json({
            message: 'File validation complete',
            totalFiles: req.files.length,
            validFiles: validFiles.length,
            invalidFiles: invalidFiles.length,
            results: validationResults,
            canProceed: invalidFiles.length === 0
        });
        
    } catch (error) {
        console.error('File validation error:', error);
        res.status(500).json({ error: 'Validation failed: ' + error.message });
    }
});

// Serve the lightweight frontend by default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

// Serve original app on /app route
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index-heavy.html'));
});

// Catch all route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

// ================ ADMIN CLEANUP ENDPOINTS ================

// Cleanup all videos (database + storage)
app.delete('/api/admin/cleanup/videos', async (req, res) => {
    try {
        console.log('🧹 ADMIN: Starting complete video cleanup...');
        
        let deletedVideos = 0;
        let deletedFiles = 0;
        let errors = [];
        
        if (db) {
            // Get all videos from database
            const videos = await db.collection('videos').find({}).toArray();
            console.log(`Found ${videos.length} videos in database`);
            
            // Delete video files from Digital Ocean Spaces
            for (const video of videos) {
                if (video.fileName || video.videoUrl) {
                    try {
                        // Extract file path from URL or use fileName directly
                        let filePath = video.fileName;
                        if (!filePath && video.videoUrl) {
                            const url = new URL(video.videoUrl);
                            filePath = url.pathname.substring(1); // Remove leading slash
                        }
                        
                        if (filePath) {
                            console.log(`Deleting file: ${filePath}`);
                            await s3.deleteObject({
                                Bucket: BUCKET_NAME,
                                Key: filePath
                            }).promise();
                            deletedFiles++;
                        }
                    } catch (fileError) {
                        console.error(`Failed to delete file for video ${video._id}:`, fileError.message);
                        errors.push(`File deletion failed for ${video._id}: ${fileError.message}`);
                    }
                }
            }
            
            // Delete all video records from database
            const deleteResult = await db.collection('videos').deleteMany({});
            deletedVideos = deleteResult.deletedCount;
            console.log(`Deleted ${deletedVideos} videos from database`);
            
            // Clean up related data
            const likesResult = await db.collection('likes').deleteMany({});
            const commentsResult = await db.collection('comments').deleteMany({});
            const viewsResult = await db.collection('views').deleteMany({});
            
            console.log(`Cleaned up ${likesResult.deletedCount} likes, ${commentsResult.deletedCount} comments, ${viewsResult.deletedCount} views`);
        }
        
        // Also cleanup orphaned files in videos/ directory
        try {
            console.log('🧹 Cleaning up orphaned files in videos/ directory...');
            const listParams = {
                Bucket: BUCKET_NAME,
                Prefix: 'videos/'
            };
            
            const objects = await s3.listObjectsV2(listParams).promise();
            console.log(`Found ${objects.Contents?.length || 0} files in videos/ directory`);
            
            if (objects.Contents && objects.Contents.length > 0) {
                const deleteParams = {
                    Bucket: BUCKET_NAME,
                    Delete: {
                        Objects: objects.Contents.map(obj => ({ Key: obj.Key }))
                    }
                };
                
                const deleteResult = await s3.deleteObjects(deleteParams).promise();
                const additionalDeleted = deleteResult.Deleted?.length || 0;
                deletedFiles += additionalDeleted;
                console.log(`Deleted ${additionalDeleted} additional orphaned files`);
            }
        } catch (cleanupError) {
            console.error('Error cleaning up orphaned files:', cleanupError.message);
            errors.push(`Orphaned file cleanup failed: ${cleanupError.message}`);
        }
        
        const result = {
            success: true,
            message: 'Video cleanup completed',
            statistics: {
                videosDeleted: deletedVideos,
                filesDeleted: deletedFiles,
                errors: errors.length
            },
            errors: errors.length > 0 ? errors : undefined
        };
        
        console.log('✅ Video cleanup completed:', result.statistics);
        res.json(result);
        
    } catch (error) {
        console.error('❌ Video cleanup failed:', error);
        res.status(500).json({ 
            success: false,
            error: 'Cleanup failed', 
            details: error.message 
        });
    }
});

// Cleanup all posts/photos (database + storage)
app.delete('/api/admin/cleanup/posts', async (req, res) => {
    try {
        console.log('🧹 ADMIN: Starting complete posts cleanup...');
        
        let deletedPosts = 0;
        let deletedFiles = 0;
        let errors = [];
        
        if (db) {
            // Get all posts from database
            const posts = await db.collection('posts').find({}).toArray();
            console.log(`Found ${posts.length} posts in database`);
            
            // Delete image files from Digital Ocean Spaces
            for (const post of posts) {
                if (post.images && Array.isArray(post.images)) {
                    for (const image of post.images) {
                        try {
                            let filePath = image.fileName;
                            if (!filePath && image.url) {
                                const url = new URL(image.url);
                                filePath = url.pathname.substring(1);
                            }
                            
                            if (filePath) {
                                console.log(`Deleting image: ${filePath}`);
                                await s3.deleteObject({
                                    Bucket: BUCKET_NAME,
                                    Key: filePath
                                }).promise();
                                deletedFiles++;
                            }
                        } catch (fileError) {
                            console.error(`Failed to delete image for post ${post._id}:`, fileError.message);
                            errors.push(`Image deletion failed for ${post._id}: ${fileError.message}`);
                        }
                    }
                }
            }
            
            // Delete all post records
            const deleteResult = await db.collection('posts').deleteMany({});
            deletedPosts = deleteResult.deletedCount;
            console.log(`Deleted ${deletedPosts} posts from database`);
        }
        
        const result = {
            success: true,
            message: 'Posts cleanup completed',
            statistics: {
                postsDeleted: deletedPosts,
                filesDeleted: deletedFiles,
                errors: errors.length
            },
            errors: errors.length > 0 ? errors : undefined
        };
        
        console.log('✅ Posts cleanup completed:', result.statistics);
        res.json(result);
        
    } catch (error) {
        console.error('❌ Posts cleanup failed:', error);
        res.status(500).json({ 
            success: false,
            error: 'Posts cleanup failed', 
            details: error.message 
        });
    }
});

// Complete system cleanup (everything)
app.delete('/api/admin/cleanup/all', async (req, res) => {
    try {
        console.log('🧹 ADMIN: Starting COMPLETE system cleanup...');
        
        const results = {
            videos: { deleted: 0, filesDeleted: 0, errors: [] },
            posts: { deleted: 0, filesDeleted: 0, errors: [] },
            storage: { totalFilesDeleted: 0, errors: [] }
        };
        
        if (db) {
            // Clean up videos
            const videos = await db.collection('videos').find({}).toArray();
            for (const video of videos) {
                if (video.fileName || video.videoUrl) {
                    try {
                        let filePath = video.fileName;
                        if (!filePath && video.videoUrl) {
                            const url = new URL(video.videoUrl);
                            filePath = url.pathname.substring(1);
                        }
                        if (filePath) {
                            await s3.deleteObject({ Bucket: BUCKET_NAME, Key: filePath }).promise();
                            results.videos.filesDeleted++;
                        }
                    } catch (error) {
                        results.videos.errors.push(`Video file ${video._id}: ${error.message}`);
                    }
                }
            }
            const videoDeleteResult = await db.collection('videos').deleteMany({});
            results.videos.deleted = videoDeleteResult.deletedCount;
            
            // Clean up posts
            const posts = await db.collection('posts').find({}).toArray();
            for (const post of posts) {
                if (post.images && Array.isArray(post.images)) {
                    for (const image of post.images) {
                        try {
                            let filePath = image.fileName;
                            if (!filePath && image.url) {
                                const url = new URL(image.url);
                                filePath = url.pathname.substring(1);
                            }
                            if (filePath) {
                                await s3.deleteObject({ Bucket: BUCKET_NAME, Key: filePath }).promise();
                                results.posts.filesDeleted++;
                            }
                        } catch (error) {
                            results.posts.errors.push(`Post image ${post._id}: ${error.message}`);
                        }
                    }
                }
            }
            const postDeleteResult = await db.collection('posts').deleteMany({});
            results.posts.deleted = postDeleteResult.deletedCount;
            
            // Clean up all related data
            await Promise.all([
                db.collection('likes').deleteMany({}),
                db.collection('comments').deleteMany({}),
                db.collection('views').deleteMany({}),
                db.collection('follows').deleteMany({})
            ]);
            
            console.log('✅ Database cleanup completed');
        }
        
        // Nuclear cleanup: delete everything in the bucket
        try {
            console.log('🧹 Performing nuclear storage cleanup...');
            const listParams = { Bucket: BUCKET_NAME };
            let continuationToken = null;
            let totalDeleted = 0;
            
            do {
                if (continuationToken) {
                    listParams.ContinuationToken = continuationToken;
                }
                
                const objects = await s3.listObjectsV2(listParams).promise();
                
                if (objects.Contents && objects.Contents.length > 0) {
                    const deleteParams = {
                        Bucket: BUCKET_NAME,
                        Delete: {
                            Objects: objects.Contents.map(obj => ({ Key: obj.Key }))
                        }
                    };
                    
                    const deleteResult = await s3.deleteObjects(deleteParams).promise();
                    const deleted = deleteResult.Deleted?.length || 0;
                    totalDeleted += deleted;
                    console.log(`Deleted batch of ${deleted} files (total: ${totalDeleted})`);
                }
                
                continuationToken = objects.NextContinuationToken;
            } while (continuationToken);
            
            results.storage.totalFilesDeleted = totalDeleted;
            console.log(`✅ Nuclear cleanup: Deleted ${totalDeleted} total files from storage`);
            
        } catch (storageError) {
            console.error('❌ Nuclear storage cleanup failed:', storageError);
            results.storage.errors.push(`Nuclear cleanup failed: ${storageError.message}`);
        }
        
        const summary = {
            success: true,
            message: 'Complete system cleanup finished',
            results: results,
            totalFiles: results.videos.filesDeleted + results.posts.filesDeleted + results.storage.totalFilesDeleted,
            totalRecords: results.videos.deleted + results.posts.deleted
        };
        
        console.log('✅ COMPLETE CLEANUP FINISHED:', summary);
        res.json(summary);
        
    } catch (error) {
        console.error('❌ Complete cleanup failed:', error);
        res.status(500).json({ 
            success: false,
            error: 'Complete cleanup failed', 
            details: error.message 
        });
    }
});

// Get cleanup status/statistics
app.get('/api/admin/cleanup/status', async (req, res) => {
    try {
        const stats = {
            database: {},
            storage: {}
        };
        
        if (db) {
            // Database statistics
            const [videoCount, postCount, likeCount, commentCount, viewCount, userCount] = await Promise.all([
                db.collection('videos').countDocuments(),
                db.collection('posts').countDocuments(),
                db.collection('likes').countDocuments(),
                db.collection('comments').countDocuments(),
                db.collection('views').countDocuments(),
                db.collection('users').countDocuments()
            ]);
            
            stats.database = {
                videos: videoCount,
                posts: postCount,
                likes: likeCount,
                comments: commentCount,
                views: viewCount,
                users: userCount
            };
        }
        
        // Storage statistics
        try {
            const listParams = { Bucket: BUCKET_NAME };
            const objects = await s3.listObjectsV2(listParams).promise();
            
            let totalSize = 0;
            let videoFiles = 0;
            let imageFiles = 0;
            let otherFiles = 0;
            
            if (objects.Contents) {
                for (const obj of objects.Contents) {
                    totalSize += obj.Size;
                    
                    if (obj.Key.startsWith('videos/')) {
                        videoFiles++;
                    } else if (obj.Key.startsWith('images/') || obj.Key.startsWith('profile-images/')) {
                        imageFiles++;
                    } else {
                        otherFiles++;
                    }
                }
            }
            
            stats.storage = {
                totalFiles: objects.KeyCount || 0,
                videoFiles,
                imageFiles,
                otherFiles,
                totalSizeBytes: totalSize,
                totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100
            };
        } catch (storageError) {
            stats.storage = { error: storageError.message };
        }
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            statistics: stats
        });
        
    } catch (error) {
        console.error('❌ Failed to get cleanup status:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to get status', 
            details: error.message 
        });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!', memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB' });
});

// Nuclear likes reset endpoint
app.post('/api/admin/reset-likes', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    try {
        console.log('💥 NUCLEAR RESET: Completely resetting likes collection...');
        
        // Drop the entire collection and all its indexes
        await db.collection('likes').drop().catch(() => {
            console.log('Collection already dropped or doesnt exist');
        });
        
        // Create fresh collection with only video likes index
        await db.collection('likes').createIndex({ videoId: 1, userId: 1 }, { unique: true });
        
        console.log('✅ Likes collection completely reset with clean indexes');
        
        res.json({ 
            message: 'Nuclear reset complete - all likes deleted, clean indexes created',
            warning: 'All existing likes have been removed'
        });
        
    } catch (error) {
        console.error('Nuclear reset error:', error);
        res.status(500).json({ error: 'Reset failed', details: error.message });
    }
});

// Manual cleanup endpoint (temporary)
app.post('/api/admin/cleanup-likes', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    try {
        console.log('🧹 Aggressive likes cleanup requested...');
        
        // First, backup the current likes
        const allLikes = await db.collection('likes').find({}).toArray();
        console.log(`Found ${allLikes.length} total likes to process`);
        
        // Drop the entire likes collection to avoid index conflicts
        console.log('💥 Dropping likes collection...');
        await db.collection('likes').drop().catch(() => {
            console.log('Collection already dropped or doesnt exist');
        });
        
        // Recreate likes collection with clean data
        console.log('🔄 Recreating likes collection...');
        const cleanLikes = new Map();
        
        // Process each like, keeping only the most recent for each video/user combo
        for (const like of allLikes) {
            if (like.videoId) {
                // This is a video like
                const key = `${like.videoId}_${like.userId}`;
                const existingLike = cleanLikes.get(key);
                
                if (!existingLike || new Date(like.createdAt || 0) > new Date(existingLike.createdAt || 0)) {
                    // Keep this like (it's newer or first one)
                    cleanLikes.set(key, {
                        videoId: like.videoId.toString(),
                        userId: like.userId.toString(),
                        createdAt: like.createdAt || new Date()
                        // Note: no postId field for video likes
                    });
                }
            } else if (like.postId) {
                // This is a post like, keep as-is
                const key = `post_${like.postId}_${like.userId}`;
                cleanLikes.set(key, like);
            }
        }
        
        // Insert clean likes
        const cleanLikesArray = Array.from(cleanLikes.values());
        if (cleanLikesArray.length > 0) {
            await db.collection('likes').insertMany(cleanLikesArray);
        }
        
        // Recreate indexes (only video likes index for now)
        await db.collection('likes').createIndex({ videoId: 1, userId: 1 }, { unique: true });
        
        console.log(`✅ Cleanup complete: ${allLikes.length} → ${cleanLikesArray.length} likes`);
        
        res.json({ 
            message: 'Aggressive cleanup complete',
            originalCount: allLikes.length,
            cleanCount: cleanLikesArray.length,
            duplicatesRemoved: allLikes.length - cleanLikesArray.length
        });
        
    } catch (error) {
        console.error('Aggressive cleanup error:', error);
        res.status(500).json({ error: 'Cleanup failed', details: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Algorithm analytics endpoint
app.get('/api/analytics/algorithm', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }

    try {
        console.log('📊 Generating algorithm analytics...');
        
        // Get recent videos for analysis
        const videos = await db.collection('videos')
            .find({ status: { $ne: 'deleted' } })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();

        // Apply engagement ranking to get scores
        const rankedVideos = await applyEngagementRanking([...videos], db);
        
        // Calculate performance metrics
        const now = new Date();
        const analytics = {
            totalVideos: videos.length,
            algorithmVersion: '1.0.0-engagement',
            timestamp: now.toISOString(),
            
            // Engagement distribution
            engagementStats: {
                avgScore: rankedVideos.reduce((sum, v) => sum + (v.engagementScore || 0), 0) / rankedVideos.length,
                maxScore: Math.max(...rankedVideos.map(v => v.engagementScore || 0)),
                minScore: Math.min(...rankedVideos.map(v => v.engagementScore || 0)),
                highEngagementCount: rankedVideos.filter(v => (v.engagementScore || 0) > 1.0).length
            },
            
            // Content freshness
            freshnessStats: {
                last24h: rankedVideos.filter(v => (v.hoursOld || 0) < 24).length,
                last7days: rankedVideos.filter(v => (v.hoursOld || 0) < 168).length,
                avgAgeHours: rankedVideos.reduce((sum, v) => sum + (v.hoursOld || 0), 0) / rankedVideos.length
            },
            
            // Engagement metrics
            totalEngagement: {
                totalLikes: rankedVideos.reduce((sum, v) => sum + (v.likeCount || 0), 0),
                totalComments: rankedVideos.reduce((sum, v) => sum + (v.commentCount || 0), 0),
                totalViews: rankedVideos.reduce((sum, v) => sum + (v.views || 0), 0),
                avgLikeRate: rankedVideos.reduce((sum, v) => sum + (v.likeRate || 0), 0) / rankedVideos.length
            },
            
            // Top performing content
            topVideos: rankedVideos.slice(0, 10).map(v => ({
                id: v._id,
                title: v.title || 'Untitled',
                engagementScore: parseFloat((v.engagementScore || 0).toFixed(2)),
                likes: v.likeCount || 0,
                comments: v.commentCount || 0,
                views: v.views || 0,
                hoursOld: parseFloat((v.hoursOld || 0).toFixed(1)),
                likeRate: parseFloat((v.likeRate || 0).toFixed(4))
            })),
            
            // Algorithm effectiveness indicators
            diversity: {
                uniqueCreators: new Set(rankedVideos.map(v => v.userId)).size,
                contentSpread: rankedVideos.slice(0, 10).map(v => v.userId).length === new Set(rankedVideos.slice(0, 10).map(v => v.userId)).size ? 'good' : 'needs_improvement'
            }
        };
        
        console.log('✅ Algorithm analytics generated');
        res.json(analytics);
        
    } catch (error) {
        console.error('❌ Algorithm analytics error:', error);
        res.status(500).json({ error: 'Failed to generate analytics' });
    }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`VIB3 Full server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    console.log(`Database: ${process.env.DATABASE_URL ? 'MongoDB configured' : 'No database configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        if (client) client.close();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        if (client) client.close();
        process.exit(0);
    });
});