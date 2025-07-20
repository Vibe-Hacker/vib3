const { exec } = require('child_process');
const fs = require('fs');

// Create the auth fix script
const authFixScript = `
#!/bin/bash
cd /opt/vib3

# Create a new auth-enabled server file
cat > server-auth-fixed.js << 'EOF'
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

// Root route
app.get('/', (req, res) => {
    res.send('<h1>VIB3 API Server</h1><p>API is running</p>');
});

// Health check
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
            \\$or: [{ email }, { username }] 
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

// Start server
app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});
EOF

# Update PM2 config to use new server
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'vib3-production',
    script: './server-auth-fixed.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'mongodb+srv://vibeadmin:P0pp0p25!@cluster0.y06bp.mongodb.net/vib3?retryWrites=true&w=majority&appName=Cluster0',
      JWT_SECRET: 'your-secret-key-here'
    }
  }]
};
EOF

# Stop all PM2 processes
pm2 stop all

# Start new server
pm2 start ecosystem.config.js
pm2 save
pm2 logs vib3-production --lines 50
`;

// Write the script
fs.writeFileSync('deploy-fix.sh', authFixScript);

// Copy to server and execute
const sshCommand = `scp -o StrictHostKeyChecking=no deploy-fix.sh root@138.197.89.163:/tmp/deploy-fix.sh && ssh -o StrictHostKeyChecking=no root@138.197.89.163 'bash /tmp/deploy-fix.sh'`;

console.log('Deploying auth fix to production...');
exec(sshCommand, (error, stdout, stderr) => {
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Output:', stdout);
    if (stderr) console.error('Stderr:', stderr);
    
    // Test the login endpoint
    setTimeout(() => {
        console.log('\nTesting login endpoint...');
        exec(`curl -X POST https://vib3app.net/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test123"}'`, (err, out) => {
            console.log('Login test result:', out);
        });
    }, 5000);
});