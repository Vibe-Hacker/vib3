const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const path = require('path');
const crypto = require('crypto');

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

// Configure multer for video uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only MP4, MOV, AVI, and WebM are allowed.'));
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
        
        // Social indexes
        await db.collection('likes').createIndex({ videoId: 1, userId: 1 }, { unique: true });
        await db.collection('likes').createIndex({ postId: 1, userId: 1 }, { unique: true });
        await db.collection('comments').createIndex({ videoId: 1, createdAt: -1 });
        await db.collection('comments').createIndex({ postId: 1, createdAt: -1 });
        await db.collection('follows').createIndex({ followerId: 1, followingId: 1 }, { unique: true });
        
        console.log('✅ Database indexes created');
    } catch (error) {
        console.error('Index creation error:', error.message);
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

// Health check
app.get('/api/health', async (req, res) => {
    const dbConnected = db !== null;
    const spacesConfigured = !!(process.env.DO_SPACES_KEY && process.env.DO_SPACES_SECRET);
    res.json({ 
        status: 'ok',
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
                query = userId ? { userId, status: { $ne: 'deleted' } } : { status: { $ne: 'deleted' } };
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
                query = userId ? { userId, status: { $ne: 'deleted' } } : { status: { $ne: 'deleted' } };
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
                // Default to For You algorithm
                query = userId ? { userId } : {};
                videos = await db.collection('videos')
                    .find(query)
                    .sort({ createdAt: -1 })
                    .skip(actualSkip)
                    .limit(parseInt(limit))
                    .toArray();
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
        
        // If no videos but page > 1, generate content based on feed type (only For You and Explore)
        if (videos.length === 0 && page > 1 && (feed === 'foryou' || feed === 'explore')) {
            console.log(`No videos in database but generating for ${feed} page ${page}`);
            
            // Generate different content based on feed type
            switch(feed) {
                case 'foryou':
                    videos = [
                        {
                            _id: 'foryou_1',
                            title: 'Trending Dance Challenge',
                            description: 'Join the viral dance trend! #DanceChallenge #Trending',
                            videoUrl: 'https://vib3-videos.nyc3.digitaloceanspaces.com/videos/2025-06-20/55502f40/c375c631-24b9-428c-aa84-3ce7ed64aa10.mp4',
                            user: { username: 'trendsetter' },
                            hashtags: ['#DanceChallenge', '#Trending'],
                            createdAt: new Date()
                        },
                        {
                            _id: 'foryou_2',
                            title: 'Life Hack You Need to Know',
                            description: 'This will change your life! #LifeHack #Viral',
                            videoUrl: 'https://vib3-videos.nyc3.digitaloceanspaces.com/videos/2025-06-20/55502f40/aa32b9a1-1c55-4748-b0dd-e40058ffdf3f.mp4',
                            user: { username: 'lifehacker' },
                            hashtags: ['#LifeHack', '#Viral'],
                            createdAt: new Date()
                        },
                        {
                            _id: 'foryou_3',
                            title: 'Aesthetic Daily Routine',
                            description: 'Get ready with me! #GRWM #Aesthetic',
                            videoUrl: 'https://vib3-videos.nyc3.digitaloceanspaces.com/videos/2025-06-20/55502f40/5eaa3855-51d1-4d65-84bd-b667460ab0f3.mp4',
                            user: { username: 'aesthetic_vibes' },
                            hashtags: ['#GRWM', '#Aesthetic'],
                            createdAt: new Date()
                        }
                    ];
                    break;
                    
                case 'following':
                    videos = [
                        {
                            _id: 'following_1',
                            title: 'Update from @friend1',
                            description: 'What I did today! Miss you all 💕',
                            videoUrl: 'https://vib3-videos.nyc3.digitaloceanspaces.com/videos/2025-06-20/55502f40/c375c631-24b9-428c-aa84-3ce7ed64aa10.mp4',
                            user: { username: 'friend1' },
                            createdAt: new Date()
                        },
                        {
                            _id: 'following_2',
                            title: 'Quick Update',
                            description: 'Just finished my workout! 💪',
                            videoUrl: 'https://vib3-videos.nyc3.digitaloceanspaces.com/videos/2025-06-20/55502f40/aa32b9a1-1c55-4748-b0dd-e40058ffdf3f.mp4',
                            user: { username: 'fitness_friend' },
                            createdAt: new Date()
                        }
                    ];
                    break;
                    
                case 'explore':
                    videos = [
                        {
                            _id: 'explore_1',
                            title: 'Viral Cooking Hack',
                            description: 'This cooking trick is everywhere! #Cooking #Viral #FoodHack',
                            videoUrl: 'https://vib3-videos.nyc3.digitaloceanspaces.com/videos/2025-06-20/55502f40/c375c631-24b9-428c-aa84-3ce7ed64aa10.mp4',
                            user: { username: 'chef_master' },
                            hashtags: ['#Cooking', '#Viral', '#FoodHack'],
                            createdAt: new Date()
                        },
                        {
                            _id: 'explore_2',
                            title: 'Travel Destination Trending',
                            description: 'Everyone is going here! #Travel #Trending #Paradise',
                            videoUrl: 'https://vib3-videos.nyc3.digitaloceanspaces.com/videos/2025-06-20/55502f40/aa32b9a1-1c55-4748-b0dd-e40058ffdf3f.mp4',
                            user: { username: 'wanderlust' },
                            hashtags: ['#Travel', '#Trending', '#Paradise'],
                            createdAt: new Date()
                        },
                        {
                            _id: 'explore_3',
                            title: 'Music Challenge Going Viral',
                            description: 'New sound alert! 🎵 #Music #Challenge #NewSound',
                            videoUrl: 'https://vib3-videos.nyc3.digitaloceanspaces.com/videos/2025-06-20/55502f40/5eaa3855-51d1-4d65-84bd-b667460ab0f3.mp4',
                            user: { username: 'music_creator' },
                            hashtags: ['#Music', '#Challenge', '#NewSound'],
                            createdAt: new Date()
                        }
                    ];
                    break;
                    
                case 'friends':
                    videos = [
                        {
                            _id: 'friends_1',
                            title: 'Hanging with the Squad',
                            description: 'Best friends forever! 👯‍♀️',
                            videoUrl: 'https://vib3-videos.nyc3.digitaloceanspaces.com/videos/2025-06-20/55502f40/c375c631-24b9-428c-aa84-3ce7ed64aa10.mp4',
                            user: { username: 'bestie1' },
                            createdAt: new Date()
                        },
                        {
                            _id: 'friends_2',
                            title: 'Friend Group Adventures',
                            description: 'Making memories with my people ✨',
                            videoUrl: 'https://vib3-videos.nyc3.digitaloceanspaces.com/videos/2025-06-20/55502f40/aa32b9a1-1c55-4748-b0dd-e40058ffdf3f.mp4',
                            user: { username: 'squad_leader' },
                            createdAt: new Date()
                        }
                    ];
                    break;
                    
                default:
                    videos = [
                        {
                            _id: 'default_1',
                            title: 'Discover VIB3',
                            description: 'Welcome to VIB3! Create amazing content',
                            videoUrl: 'https://vib3-videos.nyc3.digitaloceanspaces.com/videos/2025-06-20/55502f40/c375c631-24b9-428c-aa84-3ce7ed64aa10.mp4',
                            user: { username: 'vib3official' },
                            createdAt: new Date()
                        }
                    ];
            }
        }
        
        // For infinite scroll, generate videos on-demand for any page
        const paginatedVideos = [];
        const requestedLimit = parseInt(limit);
        
        for (let i = 0; i < requestedLimit; i++) {
            const baseVideoIndex = i % videos.length;
            const baseVideo = videos[baseVideoIndex];
            const cycleNumber = Math.floor((actualSkip + i) / videos.length);
            
            // Generate feed-specific metadata
            let feedTitle = baseVideo.title || 'Video';
            let feedDescription = baseVideo.description || '';
            let engagementMultiplier = 1;
            
            switch(feed) {
                case 'foryou':
                    engagementMultiplier = 1.5; // Higher engagement for algorithmic content
                    feedTitle = baseVideo.title || `Trending Video #${actualSkip + i + 1}`;
                    break;
                case 'following':
                    engagementMultiplier = 0.8; // More personal, less viral
                    feedTitle = baseVideo.title || `Update from ${baseVideo.user?.username || 'friend'}`;
                    break;
                case 'explore':
                    engagementMultiplier = 2.0; // Highest engagement for trending
                    feedTitle = baseVideo.title || `Viral Trending #${actualSkip + i + 1}`;
                    break;
                case 'friends':
                    engagementMultiplier = 0.6; // More intimate friend content
                    feedTitle = baseVideo.title || `${baseVideo.user?.username || 'friend'}'s moment`;
                    break;
            }
            
            const generatedVideo = {
                ...baseVideo,
                _id: `${baseVideo._id}_gen_${actualSkip + i}`,
                title: feedTitle,
                description: feedDescription,
                username: baseVideo.user?.username || 'user',
                likeCount: Math.floor(Math.random() * 1000 * engagementMultiplier) + 50,
                commentCount: Math.floor(Math.random() * 100 * engagementMultiplier) + 5,
                shareCount: Math.floor(Math.random() * 50 * engagementMultiplier) + 2,
                duplicated: true,
                cycleNumber: cycleNumber + 1,
                position: actualSkip + i + 1,
                feedType: feed,
                hashtags: baseVideo.hashtags || [],
                // Ensure video URL is preserved from base video
                videoUrl: baseVideo.videoUrl
            };
            
            paginatedVideos.push(generatedVideo);
        }
        
        console.log(`Generated ${paginatedVideos.length} videos for page ${page} (positions ${actualSkip + 1}-${actualSkip + requestedLimit})`);
        
        // Debug: Check if we have any videos to process
        if (paginatedVideos.length === 0) {
            console.log(`⚠️ No videos generated for page ${page}, actualSkip: ${actualSkip}, requestedLimit: ${requestedLimit}, originalVideos: ${videos.length}`);
            return res.json({ videos: [] });
        }
        
        // Get user info for each video
        for (const video of paginatedVideos) {
            // Skip user lookup for duplicated videos
            if (video.duplicated) {
                video.username = video.user?.username || 'user';
                video.likeCount = Math.floor(Math.random() * 1000);
                video.commentCount = Math.floor(Math.random() * 100);
                continue;
            }
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(video.userId) },
                    { projection: { password: 0 } }
                );
                video.user = user;
                
                // Get like count
                video.likeCount = await db.collection('likes').countDocuments({ videoId: video._id.toString() });
                
                // Get comment count
                video.commentCount = await db.collection('comments').countDocuments({ videoId: video._id.toString() });
            } catch (userError) {
                console.error('Error getting user info for video:', video._id, userError);
                // Set default user info if error
                video.user = { username: 'unknown', displayName: 'Unknown User', _id: 'unknown' };
                video.likeCount = 0;
                video.commentCount = 0;
            }
        }
        
        console.log(`📤 Sending ${paginatedVideos.length} videos for page ${page}`);
        res.json({ videos: paginatedVideos });
        
    } catch (error) {
        console.error('Get videos error:', error);
        console.log('Database error, returning empty');
        // Return empty instead of sample data
        res.json({ videos: [] });
    }
});

// Upload video file to DigitalOcean Spaces
app.post('/api/upload/video', requireAuth, upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const { title, description } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Video title is required' });
        }

        // Generate unique filename
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `videos/${Date.now()}-${crypto.randomBytes(16).toString('hex')}${fileExtension}`;

        // Upload to DigitalOcean Spaces
        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ACL: 'public-read'
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        const videoUrl = uploadResult.Location;

        // Save to database if connected
        let videoRecord = null;
        if (db) {
            const video = {
                userId: req.user.userId,
                title,
                description: description || '',
                videoUrl,
                fileName,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                views: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await db.collection('videos').insertOne(video);
            video._id = result.insertedId;
            videoRecord = video;
        }

        res.json({
            message: 'Video uploaded successfully',
            videoUrl,
            video: videoRecord
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed: ' + error.message });
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
                post.user = user;
                
                // Get engagement counts
                post.likeCount = await db.collection('likes').countDocuments({ postId: post._id.toString() });
                post.commentCount = await db.collection('comments').countDocuments({ postId: post._id.toString() });
            } catch (userError) {
                console.error('Error getting user info for post:', post._id, userError);
                post.user = { username: 'unknown', displayName: 'Unknown User', _id: 'unknown' };
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
                video.user = user;
                
                // Get engagement counts
                video.likeCount = await db.collection('likes').countDocuments({ videoId: video._id.toString() });
                video.commentCount = await db.collection('comments').countDocuments({ videoId: video._id.toString() });
                video.views = video.views || 0;
            } catch (userError) {
                console.error('Error getting user info for video:', video._id, userError);
                video.user = { username: 'unknown', displayName: 'Unknown User', _id: 'unknown' };
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
                username: 'user',
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
    if (!db) {
        return res.json({ 
            stats: {
                followers: 0,
                following: 0,
                likes: 0,
                videoCount: 0
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
        
        res.json({ stats });
        
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
                item.user = user;
                
                // Get engagement counts
                const collection = item.contentType === 'video' ? 'videos' : 'posts';
                const idField = item.contentType === 'video' ? 'videoId' : 'postId';
                item.likeCount = await db.collection('likes').countDocuments({ [idField]: item._id.toString() });
                item.commentCount = await db.collection('comments').countDocuments({ [idField]: item._id.toString() });
            } catch (userError) {
                console.error('Error getting user info for feed item:', item._id, userError);
                item.user = { username: 'unknown', displayName: 'Unknown User', _id: 'unknown' };
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
            res.json({ message: 'Video liked', liked: true });
        } catch (error) {
            // If duplicate key error, remove the like
            if (error.code === 11000) {
                await db.collection('likes').deleteOne({ 
                    videoId, 
                    userId: req.user.userId 
                });
                res.json({ message: 'Video unliked', liked: false });
            } else {
                throw error;
            }
        }
        
    } catch (error) {
        console.error('Like video error:', error);
        res.status(500).json({ error: 'Failed to like video' });
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
        
        // Get video count
        user.videoCount = await db.collection('videos').countDocuments({ userId });
        
        res.json({ user });
        
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
                item.user = user;
            } catch (userError) {
                item.user = { username: 'unknown', displayName: 'Unknown User' };
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