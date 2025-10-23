// Advanced video upload route with multi-resolution and HLS support
// To be integrated into server.js

async function advancedVideoUpload(req, res) {
    try {
        const videoFile = req.files?.video?.[0];
        const thumbnailFile = req.files?.thumbnail?.[0];
        
        if (!videoFile) {
            return res.status(400).json({ 
                error: 'No video file provided',
                code: 'NO_FILE'
            });
        }

        const { description, privacy, allowComments, allowDuet, allowStitch, hashtags, musicName, isFrontCamera } = req.body;

        console.log(`🎬 Advanced video processing: ${videoFile.originalname} (${(videoFile.size / 1024 / 1024).toFixed(2)}MB)`);
        
        // Process video with advanced processor
        const processingResult = await advancedProcessor.processVideo(videoFile.buffer, videoFile.originalname, { isFrontCamera: isFrontCamera === 'true' });
        
        if (!processingResult.success) {
            throw new Error('Video processing failed');
        }
        
        console.log('✅ Video processing complete:', {
            processId: processingResult.processId,
            resolutions: processingResult.resolutions.map(r => r.resolution),
            hls: !!processingResult.hls
        });
        
        // Upload all video resolutions to DigitalOcean Spaces
        const uploadedResolutions = [];
        
        for (const resolution of processingResult.resolutions) {
            try {
                const videoBuffer = await fs.readFile(resolution.path);
                const videoKey = `videos/${processingResult.processId}/${resolution.resolution}.mp4`;
                
                const uploadParams = {
                    Bucket: BUCKET_NAME,
                    Key: videoKey,
                    Body: videoBuffer,
                    ContentType: 'video/mp4',
                    ACL: 'public-read',
                    Metadata: {
                        resolution: resolution.resolution,
                        width: resolution.width.toString(),
                        height: resolution.height.toString(),
                        bitrate: resolution.bitrate
                    }
                };
                
                const uploadResult = await s3.upload(uploadParams).promise();
                
                uploadedResolutions.push({
                    resolution: resolution.resolution,
                    url: uploadResult.Location,
                    width: resolution.width,
                    height: resolution.height,
                    bitrate: resolution.bitrate,
                    size: resolution.size
                });
                
                console.log(`✅ Uploaded ${resolution.resolution} to: ${uploadResult.Location}`);
            } catch (uploadError) {
                console.error(`❌ Failed to upload ${resolution.resolution}:`, uploadError);
            }
        }
        
        // Upload HLS files
        let hlsUrl = null;
        if (processingResult.hls) {
            try {
                // Upload HLS master playlist
                const masterPlaylist = await fs.readFile(processingResult.hls.masterPlaylist);
                const masterKey = `videos/${processingResult.processId}/hls/master.m3u8`;
                
                await s3.upload({
                    Bucket: BUCKET_NAME,
                    Key: masterKey,
                    Body: masterPlaylist,
                    ContentType: 'application/x-mpegURL',
                    ACL: 'public-read'
                }).promise();
                
                hlsUrl = `https://${BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com'}/${masterKey}`;
                
                // Upload HLS segments for each resolution
                const hlsDir = processingResult.hls.directory;
                const resolutionDirs = await fs.readdir(hlsDir);
                
                for (const resDir of resolutionDirs) {
                    const resPath = path.join(hlsDir, resDir);
                    const files = await fs.readdir(resPath);
                    
                    for (const file of files) {
                        const filePath = path.join(resPath, file);
                        const fileContent = await fs.readFile(filePath);
                        const fileKey = `videos/${processingResult.processId}/hls/${resDir}/${file}`;
                        
                        await s3.upload({
                            Bucket: BUCKET_NAME,
                            Key: fileKey,
                            Body: fileContent,
                            ContentType: file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T',
                            ACL: 'public-read'
                        }).promise();
                    }
                }
                
                console.log('✅ HLS files uploaded');
            } catch (hlsError) {
                console.error('❌ HLS upload failed:', hlsError);
            }
        }
        
        // Upload thumbnail
        let thumbnailUrl = null;
        if (processingResult.thumbnail) {
            try {
                const thumbnailBuffer = await fs.readFile(processingResult.thumbnail);
                const thumbnailKey = `videos/${processingResult.processId}/thumbnail.jpg`;
                
                const thumbResult = await s3.upload({
                    Bucket: BUCKET_NAME,
                    Key: thumbnailKey,
                    Body: thumbnailBuffer,
                    ContentType: 'image/jpeg',
                    ACL: 'public-read'
                }).promise();
                
                thumbnailUrl = thumbResult.Location;
                console.log('✅ Thumbnail uploaded');
            } catch (thumbError) {
                console.error('❌ Thumbnail upload failed:', thumbError);
            }
        }
        
        // Use highest quality as primary URL
        const primaryVideo = uploadedResolutions.find(r => r.resolution === '1080p') || 
                            uploadedResolutions.find(r => r.resolution === '720p') || 
                            uploadedResolutions[0];
        
        // Save to database
        let videoRecord = null;
        if (db) {
            const video = {
                userId: req.user.userId,
                username: req.user.username || 'unknown',
                description: description || '',
                videoUrl: primaryVideo.url,
                thumbnailUrl: thumbnailUrl || '',
                processId: processingResult.processId,
                resolutions: uploadedResolutions,
                hlsUrl: hlsUrl,
                originalFilename: videoFile.originalname,
                fileSize: videoFile.size,
                processingInfo: {
                    success: true,
                    resolutionsGenerated: uploadedResolutions.length,
                    hasHLS: !!hlsUrl,
                    videoInfo: processingResult.originalInfo
                },
                privacy: privacy || 'public',
                allowComments: allowComments === 'true',
                allowDuet: allowDuet === 'true',
                allowStitch: allowStitch === 'true',
                hashtags: hashtags ? hashtags.split(' ').map(tag => tag.trim()).filter(tag => tag) : [],
                musicName: musicName || '',
                views: 0,
                likes: 0,
                comments: 0,
                shares: 0,
                status: 'published',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await db.collection('videos').insertOne(video);
            video._id = result.insertedId;
            videoRecord = video;
            
            console.log('✅ Video record saved to database');
        }
        
        // Clean up local files
        await advancedProcessor.cleanup(processingResult.processId);
        
        res.status(201).json({
            success: true,
            video: videoRecord,
            processingInfo: {
                resolutions: uploadedResolutions,
                hlsUrl: hlsUrl,
                thumbnailUrl: thumbnailUrl
            }
        });

    } catch (error) {
        console.error('❌ Advanced video upload error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to process and upload video',
            details: error.message
        });
    }
}

// Add this route to your server.js:
// app.post('/api/videos/upload-advanced', requireAuth, upload.fields([
//     { name: 'video', maxCount: 1 },
//     { name: 'thumbnail', maxCount: 1 }
// ]), advancedVideoUpload);