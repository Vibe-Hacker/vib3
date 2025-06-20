const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const path = require('path');
const crypto = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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
const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
    region: process.env.SPACES_REGION || 'nyc3'
});

const BUCKET_NAME = process.env.SPACES_BUCKET || 'vib3-videos';

// MongoDB connection
let db = null;
let client = null;

async function connectDB() {
    if (process.env.DATABASE_URL) {
        try {
            client = new MongoClient(process.env.DATABASE_URL);
            await client.connect();
            db = client.db('vib3');
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

connectDB();

// Session management
const sessions = new Map();

function createSession(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { userId, createdAt: Date.now() });
    return token;
}

function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || !sessions.has(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    req.user = sessions.get(token);
    next();
}

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

// Health check
app.get('/api/health', async (req, res) => {
    const dbConnected = db !== null;
    const spacesConfigured = !!(process.env.SPACES_KEY && process.env.SPACES_SECRET);
    
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        database: dbConnected ? 'connected' : 'not connected',
        storage: spacesConfigured ? 'configured' : 'not configured'
    });
});

// Video upload endpoint
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
                likes: 0,
                comments: 0,
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

// Get videos endpoint
app.get('/api/videos', async (req, res) => {
    if (!db) {
        // Return sample data if no database
        return res.json({
            videos: [
                {
                    _id: 'sample1',
                    title: 'Sample Video',
                    description: 'This is a sample video',
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                    user: { username: 'demo', displayName: 'Demo User' },
                    likes: 42,
                    comments: 5,
                    createdAt: new Date()
                }
            ]
        });
    }

    try {
        const { limit = 10, skip = 0 } = req.query;
        
        const videos = await db.collection('videos')
            .find({})
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .toArray();

        // Get user info for each video
        for (const video of videos) {
            const user = await db.collection('users').findOne(
                { _id: new ObjectId(video.userId) },
                { projection: { password: 0 } }
            );
            video.user = user;
        }

        res.json({ videos });

    } catch (error) {
        console.error('Get videos error:', error);
        res.status(500).json({ error: 'Failed to get videos' });
    }
});

// Auth endpoints (simplified)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    if (!db) {
        // Demo mode - create session for any login
        const token = createSession('demo-user');
        return res.json({
            message: 'Login successful (demo mode)',
            user: { _id: 'demo-user', email, displayName: 'Demo User' },
            token
        });
    }

    try {
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const user = await db.collection('users').findOne({ email, password: hashedPassword });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = createSession(user._id.toString());
        delete user.password;
        
        res.json({ message: 'Login successful', user, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, password, and username required' });
    }

    if (!db) {
        // Demo mode
        const token = createSession('demo-user');
        return res.json({
            message: 'Registration successful (demo mode)',
            user: { _id: 'demo-user', email, username, displayName: username },
            token
        });
    }

    try {
        const existingUser = await db.collection('users').findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const user = {
            email, username, password: hashedPassword, displayName: username,
            bio: '', profileImage: '', followers: 0, following: 0,
            createdAt: new Date(), updatedAt: new Date()
        };

        const result = await db.collection('users').insertOne(user);
        user._id = result.insertedId;
        const token = createSession(user._id.toString());
        delete user.password;
        
        res.json({ message: 'Registration successful', user, token });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Catch all route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 VIB3 Upload Server running on port ${PORT}`);
    console.log(`💾 Database: ${db ? 'Connected' : 'Not connected'}`);
    console.log(`☁️ Storage: ${process.env.SPACES_KEY ? 'DigitalOcean Spaces configured' : 'No storage configured'}`);
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