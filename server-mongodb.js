const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

// MongoDB connection (when DATABASE_URL is added)
let db = null;
if (process.env.DATABASE_URL) {
    // MongoDB connection will go here
    console.log('MongoDB connection configured');
} else {
    console.log('No DATABASE_URL found - running without database');
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        database: process.env.DATABASE_URL ? 'configured' : 'not configured'
    });
});

// App info
app.get('/api/info', (req, res) => {
    res.json({
        name: 'VIB3',
        version: '1.0.0',
        description: 'TikTok-style video social app',
        database: 'MongoDB',
        storage: 'DigitalOcean Spaces'
    });
});

// Auth endpoints (simple, no Firebase)
app.post('/api/auth/register', (req, res) => {
    // Simple registration endpoint
    res.json({ message: 'Registration endpoint ready', database: !!process.env.DATABASE_URL });
});

app.post('/api/auth/login', (req, res) => {
    // Simple login endpoint  
    res.json({ message: 'Login endpoint ready', database: !!process.env.DATABASE_URL });
});

// Video endpoints
app.get('/api/videos', (req, res) => {
    // Get videos from MongoDB
    res.json({ videos: [], message: 'Videos endpoint ready' });
});

app.post('/api/videos', (req, res) => {
    // Upload video metadata to MongoDB
    res.json({ message: 'Video upload endpoint ready' });
});

// User endpoints  
app.get('/api/users/:id', (req, res) => {
    res.json({ message: 'User profile endpoint ready' });
});

// Serve the lightweight frontend by default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index-lite.html'));
});

// Serve original app on /app route (for testing)
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

// Catch all route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index-lite.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!', memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`VIB3 MongoDB server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    console.log(`Database: ${process.env.DATABASE_URL ? 'MongoDB configured' : 'No database configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        if (db) db.close();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        if (db) db.close();
        process.exit(0);
    });
});