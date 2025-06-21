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
        
        // Social indexes
        await db.collection('likes').createIndex({ videoId: 1, userId: 1 }, { unique: true });
        await db.collection('comments').createIndex({ videoId: 1, createdAt: -1 });
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
        
        const query = userId ? { userId } : {};
        
        const videos = await db.collection('videos')
            .find(query)
            .sort({ createdAt: -1 })
            .skip(actualSkip)
            .limit(parseInt(limit))
            .toArray();
            
        console.log(`Fetching page ${page}, skip: ${actualSkip}, limit: ${limit}`);
        
        console.log('Found videos in database:', videos.length);
        
        // If no videos in database, return empty
        if (videos.length === 0) {
            console.log('No videos in database, returning empty');
            return res.json({ videos: [] });
        }
        
        // For infinite scroll, generate videos on-demand for any page
        const paginatedVideos = [];
        const requestedLimit = parseInt(limit);
        
        for (let i = 0; i < requestedLimit; i++) {
            const baseVideoIndex = i % videos.length;
            const baseVideo = videos[baseVideoIndex];
            const cycleNumber = Math.floor((actualSkip + i) / videos.length);
            
            const generatedVideo = {
                ...baseVideo,
                _id: `${baseVideo._id}_gen_${actualSkip + i}`,
                title: `${baseVideo.title || 'Video'} (Cycle ${cycleNumber + 1})`,
                username: baseVideo.user?.username || 'user',
                likeCount: Math.floor(Math.random() * 2000) + 100,
                commentCount: Math.floor(Math.random() * 200) + 10,
                duplicated: true,
                cycleNumber: cycleNumber + 1,
                position: actualSkip + i + 1,
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
    
    const { title, description, videoUrl, thumbnailUrl, duration } = req.body;
    
    if (!title || !videoUrl) {
        return res.status(400).json({ error: 'Title and video URL required' });
    }
    
    try {
        const video = {
            userId: req.user.userId,
            title,
            description: description || '',
            videoUrl,
            thumbnailUrl: thumbnailUrl || '',
            duration: duration || 0,
            views: 0,
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