const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// MongoDB connection
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb+srv://vibeadmin:P0pp0p25!@cluster0.y06bp.mongodb.net/vib3?retryWrites=true&w=majority&appName=Cluster0';
let db = null;

// Connect to MongoDB
async function connectDB() {
    if (db) return db;
    
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('Connected to MongoDB Atlas');
        db = client.db('vib3');
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

// Initialize database connection
connectDB().catch(console.error);

// Middleware
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create session helper
function createSession(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Root route - RETURNS JSON
app.get('/', (req, res) => {
    res.json({ 
        message: 'VIB3 API Server',
        status: 'running',
        version: '1.0.0'
    });
});

// Health check - RETURNS JSON
app.get('/health', async (req, res) => {
    const dbConnected = db !== null;
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: dbConnected
    });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, password, and username required' });
    }
    
    try {
        const database = await connectDB();
        
        // Check if user exists
        const existingUser = await database.collection('users').findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password using SHA256 (to match existing users)
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        
        // Create user
        const user = {
            email,
            username,
            password: hashedPassword,
            displayName: username,
            bio: '',
            profileImage: 'https://i.pravatar.cc/300',
            followers: 0,
            following: 0,
            totalLikes: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await database.collection('users').insertOne(user);
        user._id = result.insertedId;
        
        // Create token
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

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    try {
        const database = await connectDB();
        
        // Hash password using SHA256 (to match existing users)
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        
        // Find user
        const user = await database.collection('users').findOne({ 
            email,
            password: hashedPassword
        });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Create token
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
app.get('/api/auth/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const database = await connectDB();
        
        const user = await database.collection('users').findOne({ 
            _id: new ObjectId(decoded.userId) 
        });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        delete user.password;
        res.json(user);
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Video routes
app.get('/api/videos', async (req, res) => {
    try {
        const database = await connectDB();
        const { limit = 20, page = 0 } = req.query;
        
        const videos = await database.collection('videos')
            .find({})
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(page) * parseInt(limit))
            .toArray();
        
        res.json({ videos });
    } catch (error) {
        console.error('Get videos error:', error);
        res.status(500).json({ error: 'Failed to get videos' });
    }
});

app.get('/api/videos/following', async (req, res) => {
    try {
        const database = await connectDB();
        const { limit = 20, page = 0 } = req.query;
        
        // For now, return all videos (can be filtered by following later)
        const videos = await database.collection('videos')
            .find({})
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(page) * parseInt(limit))
            .toArray();
        
        res.json({ videos });
    } catch (error) {
        console.error('Get following videos error:', error);
        res.status(500).json({ error: 'Failed to get videos' });
    }
});

app.post('/api/videos/:videoId/like', async (req, res) => {
    try {
        const database = await connectDB();
        const videoId = req.params.videoId;
        
        // For now, just return success
        res.json({ success: true, liked: true });
    } catch (error) {
        console.error('Like video error:', error);
        res.status(500).json({ error: 'Failed to like video' });
    }
});

app.delete('/api/videos/:videoId/like', async (req, res) => {
    try {
        const database = await connectDB();
        const videoId = req.params.videoId;
        
        // For now, just return success
        res.json({ success: true, liked: false });
    } catch (error) {
        console.error('Unlike video error:', error);
        res.status(500).json({ error: 'Failed to unlike video' });
    }
});

app.post('/api/videos/:videoId/view', async (req, res) => {
    try {
        res.json({ success: true });
    } catch (error) {
        console.error('View video error:', error);
        res.status(500).json({ error: 'Failed to update view count' });
    }
});

// User routes
app.get('/api/users/:userId', async (req, res) => {
    try {
        const database = await connectDB();
        const user = await database.collection('users').findOne({ 
            _id: new ObjectId(req.params.userId) 
        });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        delete user.password;
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

app.get('/api/users/:userId/videos', async (req, res) => {
    try {
        const database = await connectDB();
        const videos = await database.collection('videos')
            .find({ userId: req.params.userId })
            .sort({ createdAt: -1 })
            .toArray();
        
        res.json({ videos });
    } catch (error) {
        console.error('Get user videos error:', error);
        res.status(500).json({ error: 'Failed to get user videos' });
    }
});

// Catch all route - RETURNS JSON
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handling - RETURNS JSON
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} - ALL JSON RESPONSES`);
});