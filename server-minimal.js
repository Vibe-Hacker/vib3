const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from www directory
app.use(express.static(path.join(__dirname, 'www')));

// Serve lightweight version by default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index-lite.html'));
});

// API endpoints for testing
app.get('/api/info', (req, res) => {
    res.json({
        name: 'VIB3',
        version: '1.0.0',
        status: 'running',
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        memory: process.memoryUsage(),
        uptime: process.uptime()
    });
});

app.listen(PORT, () => {
    console.log(`Minimal VIB3 server running on port ${PORT}`);
    console.log(`Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
});