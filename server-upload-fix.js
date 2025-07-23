
// Enhanced video upload with proper URL generation
app.post('/api/upload/video', requireAuth, upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No video file provided' });
    }

    try {
        const userId = req.userId;
        const videoId = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();
        
        // Create proper file path
        const fileName = `${userId}_${videoId}_${timestamp}.mp4`;
        const key = `videos/${userId}/${fileName}`;
        
        // Upload to DigitalOcean Spaces
        const params = {
            Bucket: process.env.DO_SPACES_BUCKET || 'vib3-videos',
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype || 'video/mp4',
            ACL: 'public-read',
            CacheControl: 'max-age=31536000'
        };
        
        const uploadResult = await s3.upload(params).promise();
        
        // Generate the correct public URL
        const videoUrl = uploadResult.Location || 
            `https://${params.Bucket}.nyc3.digitaloceanspaces.com/${key}`;
        
        // Save video metadata to database
        if (db) {
            const video = {
                _id: new ObjectId(),
                videoId: videoId,
                userId: userId,
                url: videoUrl,
                originalUrl: videoUrl,
                thumbnail: `${videoUrl}?thumbnail=true`,
                title: req.body.title || '',
                description: req.body.description || '',
                duration: parseInt(req.body.duration) || 0,
                createdAt: new Date(),
                status: 'active',
                views: 0,
                likes: 0,
                comments: 0
            };
            
            await db.collection('videos').insertOne(video);
            
            res.json({
                success: true,
                video: {
                    id: video._id,
                    videoId: video.videoId,
                    url: video.url,
                    thumbnail: video.thumbnail
                }
            });
        } else {
            res.json({
                success: true,
                url: videoUrl,
                videoId: videoId
            });
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});
