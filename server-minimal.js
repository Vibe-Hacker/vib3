const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Absolute minimal server
app.get('/', (req, res) => {
    res.send(`
        <h1>VIB3 Test Server</h1>
        <p>Server is running!</p>
        <p>Environment: ${process.env.NODE_ENV}</p>
        <p>Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB</p>
        <p>Time: ${new Date().toISOString()}</p>
    `);
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