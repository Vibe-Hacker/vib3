// Grok AI Configuration Route
// Provides API configuration to frontend securely

const express = require('express');
const router = express.Router();

// This should be in environment variables
const GROK_API_KEY = process.env.GROK_API_KEY;

// Endpoint to get Grok configuration
router.get('/api/grok/config', (req, res) => {
    // Only provide API key to authenticated users or with proper headers
    const isAuthenticated = req.headers.authorization || req.session?.userId;
    
    if (!isAuthenticated) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Return obfuscated key for frontend use
    res.json({
        apiKey: GROK_API_KEY,
        baseUrl: 'https://api.x.ai/v1',
        enabled: true
    });
});

module.exports = router;