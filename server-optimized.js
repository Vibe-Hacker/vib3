const express = require('express');
const path = require('path');

// Force garbage collection every 30 seconds if available
if (global.gc) {
    setInterval(() => {
        global.gc();
    }, 30000);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Ultra-low memory settings
app.use(express.json({ 
    limit: '1mb',
    parameterLimit: 100,
    depth: 10
}));
app.use(express.urlencoded({ 
    extended: false, 
    limit: '1mb',
    parameterLimit: 100,
    depth: 10
}));

// Disable X-Powered-By header
app.disable('x-powered-by');

// Basic security headers
app.use((req, res, next) => {
    res.removeHeader('X-Powered-By');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
});

// CORS headers for API endpoints
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Memory monitoring endpoint
app.get('/api/memory', (req, res) => {
    const memUsage = process.memoryUsage();
    res.json({
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
        uptime: Math.round(process.uptime()) + ' seconds'
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    res.json({ 
        status: heapUsedMB > 400 ? 'warning' : 'ok',
        memory: heapUsedMB + ' MB',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API endpoint for app info
app.get('/api/info', (req, res) => {
    res.json({
        name: 'VIB3',
        version: '1.0.0',
        description: 'TikTok-style video social app',
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
    });
});

// Serve static files with caching
app.use(express.static(path.join(__dirname, 'www'), {
    maxAge: '1d',
    etag: false,
    lastModified: false
}));

// Catch all route - serve index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'), {
        maxAge: '1h',
        etag: false,
        lastModified: false
    });
});

// Memory leak prevention - limit request size and timeout
app.use((req, res, next) => {
    req.setTimeout(30000, () => {
        res.status(408).send('Request Timeout');
    });
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    
    // Force garbage collection on errors if available
    if (global.gc) {
        global.gc();
    }
    
    res.status(500).json({ error: 'Server error', memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB' });
});

// Start server with proper error handling and memory monitoring
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`VIB3 optimized server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Initial memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    
    // Log memory usage every 5 minutes
    setInterval(() => {
        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        console.log(`Memory usage: ${heapUsedMB} MB (RSS: ${Math.round(memUsage.rss / 1024 / 1024)} MB)`);
        
        // Force restart if memory usage is too high
        if (heapUsedMB > 450) {
            console.log('Memory usage too high, forcing garbage collection...');
            if (global.gc) {
                global.gc();
            }
        }
        
        if (heapUsedMB > 500) {
            console.log('Memory usage critical, shutting down gracefully...');
            process.exit(1);
        }
    }, 300000); // 5 minutes
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

// Graceful shutdown handlers
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

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});