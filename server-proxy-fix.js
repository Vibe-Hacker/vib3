
// Video proxy endpoint for CORS issues
app.get('/api/proxy/video', async (req, res) => {
    const videoUrl = req.query.url;
    
    if (!videoUrl) {
        return res.status(400).json({ error: 'No video URL provided' });
    }
    
    try {
        // Set proper headers for video streaming
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        
        // Pipe the video from the source
        const response = await fetch(videoUrl);
        const stream = response.body;
        stream.pipe(res);
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to proxy video' });
    }
});
