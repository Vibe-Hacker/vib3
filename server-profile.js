const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'vib3-secret-key-2024';

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'www')));

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
            
            // Create indexes
            await db.collection('users').createIndex({ email: 1 }, { unique: true });
            await db.collection('users').createIndex({ username: 1 }, { unique: true });
            await db.collection('videos').createIndex({ userId: 1 });
            await db.collection('videos').createIndex({ createdAt: -1 });
            
            return true;
        } catch (error) {
            console.error('MongoDB connection error:', error.message);
            return false;
        }
    }
    return false;
}

// Connect to database on startup
connectDB();

// Auth middleware
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        req.user = user;
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// === AUTH ENDPOINTS ===

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        
        if (!db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        // Check if user exists
        const existingUser = await db.collection('users').findOne({
            $or: [{ email }, { username }]
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = {
            email,
            username,
            password: hashedPassword,
            bio: 'Welcome to my VIB3!',
            profilePicture: '👤',
            stats: {
                following: 0,
                followers: 0,
                likes: 0,
                videos: 0
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await db.collection('users').insertOne(user);
        
        // Generate token
        const token = jwt.sign({ userId: result.insertedId }, JWT_SECRET);
        
        delete user.password;
        res.json({ token, user });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        // Find user
        const user = await db.collection('users').findOne({ email });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        
        delete user.password;
        res.json({ token, user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
    const user = { ...req.user };
    delete user.password;
    res.json({ user });
});

app.post('/api/auth/logout', authMiddleware, async (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// === USER PROFILE ENDPOINTS ===

app.get('/api/user/profile', authMiddleware, async (req, res) => {
    try {
        const user = { ...req.user };
        delete user.password;
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

app.put('/api/user/profile', authMiddleware, async (req, res) => {
    try {
        const updates = {};
        const allowedFields = ['username', 'bio', 'profilePicture', 'displayName', 'website'];
        
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }
        
        // Check username availability
        if (updates.username && updates.username !== req.user.username) {
            const existing = await db.collection('users').findOne({ username: updates.username });
            if (existing) {
                return res.status(400).json({ error: 'Username already taken' });
            }
        }
        
        updates.updatedAt = new Date();
        
        await db.collection('users').updateOne(
            { _id: new ObjectId(req.userId) },
            { $set: updates }
        );
        
        res.json({ message: 'Profile updated', updates });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.get('/api/user/stats', authMiddleware, async (req, res) => {
    try {
        const stats = {
            following: await db.collection('follows').countDocuments({ followerId: req.userId }),
            followers: await db.collection('follows').countDocuments({ followingId: req.userId }),
            likes: await db.collection('likes').countDocuments({ userId: req.userId }),
            videos: await db.collection('videos').countDocuments({ userId: req.userId })
        };
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// === VIDEO ENDPOINTS ===

app.get('/api/user/videos', authMiddleware, async (req, res) => {
    try {
        const videos = await db.collection('videos')
            .find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();
        
        res.json(videos);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get videos' });
    }
});

app.get('/api/user/liked-videos', authMiddleware, async (req, res) => {
    try {
        const likes = await db.collection('likes')
            .find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();
        
        const videoIds = likes.map(like => new ObjectId(like.videoId));
        const videos = await db.collection('videos')
            .find({ _id: { $in: videoIds } })
            .toArray();
        
        res.json(videos);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get liked videos' });
    }
});

app.get('/api/user/favorites', authMiddleware, async (req, res) => {
    try {
        const favorites = await db.collection('favorites')
            .find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();
        
        const videoIds = favorites.map(fav => new ObjectId(fav.videoId));
        const videos = await db.collection('videos')
            .find({ _id: { $in: videoIds } })
            .toArray();
        
        res.json(videos);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get favorites' });
    }
});

// === SOCIAL ENDPOINTS ===

app.get('/api/user/following', authMiddleware, async (req, res) => {
    try {
        const follows = await db.collection('follows')
            .find({ followerId: req.userId })
            .toArray();
        
        const userIds = follows.map(f => new ObjectId(f.followingId));
        const users = await db.collection('users')
            .find({ _id: { $in: userIds } })
            .project({ password: 0 })
            .toArray();
        
        // Mark which users are being followed
        const followedIds = new Set(follows.map(f => f.followingId));
        users.forEach(user => {
            user.isFollowing = followedIds.has(user._id.toString());
        });
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get following' });
    }
});

app.get('/api/user/followers', authMiddleware, async (req, res) => {
    try {
        const follows = await db.collection('follows')
            .find({ followingId: req.userId })
            .toArray();
        
        const userIds = follows.map(f => new ObjectId(f.followerId));
        const users = await db.collection('users')
            .find({ _id: { $in: userIds } })
            .project({ password: 0 })
            .toArray();
        
        // Check if current user follows them back
        const myFollowing = await db.collection('follows')
            .find({ followerId: req.userId })
            .toArray();
        
        const followingIds = new Set(myFollowing.map(f => f.followingId));
        users.forEach(user => {
            user.isFollowing = followingIds.has(user._id.toString());
        });
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get followers' });
    }
});

app.post('/api/user/follow/:userId', authMiddleware, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        
        if (targetUserId === req.userId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }
        
        // Check if already following
        const existing = await db.collection('follows').findOne({
            followerId: req.userId,
            followingId: targetUserId
        });
        
        if (existing) {
            return res.status(400).json({ error: 'Already following' });
        }
        
        // Create follow
        await db.collection('follows').insertOne({
            followerId: req.userId,
            followingId: targetUserId,
            createdAt: new Date()
        });
        
        res.json({ message: 'Followed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to follow' });
    }
});

app.post('/api/user/unfollow/:userId', authMiddleware, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        
        await db.collection('follows').deleteOne({
            followerId: req.userId,
            followingId: targetUserId
        });
        
        res.json({ message: 'Unfollowed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to unfollow' });
    }
});

// === FEED ENDPOINTS ===

app.get('/api/feed/following', authMiddleware, async (req, res) => {
    try {
        // Get users I follow
        const follows = await db.collection('follows')
            .find({ followerId: req.userId })
            .toArray();
        
        const followingIds = follows.map(f => f.followingId);
        
        // Get their recent videos
        const videos = await db.collection('videos')
            .find({ userId: { $in: followingIds } })
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();
        
        // Get user info for each video
        const userIds = [...new Set(videos.map(v => v.userId))];
        const users = await db.collection('users')
            .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
            .project({ password: 0 })
            .toArray();
        
        const userMap = {};
        users.forEach(user => {
            userMap[user._id.toString()] = user;
        });
        
        // Attach user info to videos
        videos.forEach(video => {
            video.user = userMap[video.userId];
        });
        
        res.json(videos);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get following feed' });
    }
});

// === HEALTH & INFO ===

app.get('/api/health', async (req, res) => {
    const dbConnected = db !== null;
    res.json({ 
        status: 'ok',
        server: 'profile-mongodb',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        database: dbConnected ? 'connected' : 'not connected'
    });
});

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`VIB3 server running on port ${PORT}`);
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