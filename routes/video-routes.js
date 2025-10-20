// Video Routes Module
// Handles all video-related endpoints including upload, processing, and serving

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const videoConfig = require('../config/video-config');

// Initialize processors (these will be injected from server.js)
let videoProcessor = null;
let multiQualityProcessor = null;
let s3 = null;
let db = null;

// Configure multer for video uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: videoConfig.UPLOAD_LIMITS.maxFileSize
    },
    fileFilter: (req, file, cb) => {
        if (videoConfig.SUPPORTED_FORMATS.input.includes(file.mimetype) || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Please upload a video file.'));
        }
    }
});

// Initialize route with dependencies
function initializeVideoRoutes(dependencies) {
    videoProcessor = dependencies.videoProcessor;
    multiQualityProcessor = dependencies.multiQualityProcessor;
    s3 = dependencies.s3;
    db = dependencies.db;
    
    return router;
}

// Helper function to check if multi-quality should be used
function shouldUseMultiQuality(req, videoInfo) {
    return videoConfig.FEATURES.multiQuality || 
           req.body.multiQuality === 'true' ||
           (videoInfo.video && videoInfo.video.height >= videoConfig.PROCESSING.autoMultiQualityThreshold);
}

// Main video upload endpoint
router.post('/upload', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No video file provided',
                code: 'NO_FILE'
            });
        }

        const { title, description, username, userId, hashtags, musicName } = req.body;
        const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'vib3-videos';

        console.log(`🎬 Processing video upload: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);
        console.log('📋 Request body fields:', Object.keys(req.body));
        console.log('📋 bypassProcessing value:', req.body.bypassProcessing);
        console.log('📋 isFrontCamera value:', req.body.isFrontCamera);

        // Check for bypass flag
        const bypassProcessing = req.body.bypassProcessing === 'true' ||
                                process.env.BYPASS_VIDEO_PROCESSING === 'true' ||
                                req.file.originalname.toLowerCase().includes('download') ||
                                req.file.originalname.toLowerCase().includes('test');

        // Check if front camera video that needs flipping
        const isFrontCamera = req.body.isFrontCamera === 'true';

        console.log(`🔍 Flags - bypassProcessing: ${bypassProcessing}, isFrontCamera: ${isFrontCamera}`);

        let conversionResult;

        if (bypassProcessing && !isFrontCamera) {
            console.log('⚡ BYPASSING video processing');
            conversionResult = {
                success: true,
                buffer: req.file.buffer,
                originalSize: req.file.size,
                convertedSize: req.file.size,
                skipped: true,
                bypassed: true
            };
        } else if (bypassProcessing && isFrontCamera) {
            console.log('🔄 Front camera detected - applying horizontal flip');
            try {
                const flippedResult = await videoProcessor.flipVideoHorizontal(req.file.buffer, req.file.originalname);
                conversionResult = {
                    success: true,
                    buffer: flippedResult.buffer,
                    originalSize: req.file.size,
                    convertedSize: flippedResult.buffer.length,
                    flipped: true,
                    bypassed: false
                };
            } catch (flipError) {
                console.error('❌ Front camera flip failed, uploading unflipped:', flipError);
                conversionResult = {
                    success: true,
                    buffer: req.file.buffer,
                    originalSize: req.file.size,
                    convertedSize: req.file.size,
                    bypassed: true
                };
            }
        } else {
            // Validate video
            console.log('📋 Validating video...');
            const validation = await videoProcessor.validateVideo(req.file.buffer, req.file.originalname);
            if (!validation.valid) {
                return res.status(400).json({ 
                    error: `Video validation failed: ${validation.error}`,
                    code: 'VALIDATION_FAILED',
                    details: validation.error
                });
            }

            console.log('✅ Video validation passed');

            // Check if we should do multi-quality processing
            if (shouldUseMultiQuality(req, validation.info)) {
                console.log('📋 Processing video into multiple quality variants...');
                try {
                    const multiResult = await multiQualityProcessor.processMultiQuality(
                        req.file.buffer, 
                        req.file.originalname,
                        req.user.userId || userId
                    );
                    
                    // Save to database
                    let videoRecord = null;
                    if (db) {
                        const video = {
                            userId: req.user.userId || userId,
                            username: username || 'unknown',
                            title,
                            description: description || '',
                            variants: multiResult.variants,
                            manifest: multiResult.manifest,
                            outputDir: multiResult.outputDir,
                            processingTime: multiResult.processingTime,
                            metadata: multiResult.metadata,
                            hashtags: hashtags ? (Array.isArray(hashtags) ? hashtags : hashtags.split(',').map(tag => tag.trim()).filter(tag => tag)) : [],
                            musicName: musicName || '',
                            createdAt: new Date(),
                            updatedAt: new Date()
                        };
                        
                        const result = await db.collection('videos').insertOne(video);
                        videoRecord = { ...video, _id: result.insertedId };
                    }
                    
                    return res.json({
                        success: true,
                        message: 'Video uploaded and processed into multiple qualities',
                        videoId: videoRecord?._id,
                        variants: multiResult.variants,
                        manifest: multiResult.manifest,
                        outputDir: multiResult.outputDir,
                        processingTime: multiResult.processingTime,
                        metadata: multiResult.metadata
                    });
                } catch (multiError) {
                    console.error('Multi-quality processing failed, falling back to single quality:', multiError);
                }
            }

            // Single quality processing
            console.log('📋 Converting video to standard MP4...');
            conversionResult = await videoProcessor.convertToStandardMp4(req.file.buffer, req.file.originalname);
        }
        
        // Handle single quality upload to S3
        let finalBuffer, finalMimeType, processingInfo;
        
        if (conversionResult.success) {
            finalBuffer = conversionResult.buffer;
            finalMimeType = conversionResult.bypassed ? req.file.mimetype : 'video/mp4';
            processingInfo = {
                converted: !conversionResult.bypassed,
                skipped: conversionResult.skipped || false,
                bypassed: conversionResult.bypassed || false,
                originalSize: conversionResult.originalSize,
                convertedSize: conversionResult.convertedSize,
                compressionRatio: conversionResult.originalSize ? 
                    (conversionResult.originalSize / conversionResult.convertedSize).toFixed(2) : 1,
                videoInfo: conversionResult.videoInfo
            };
        } else {
            console.log('⚠️ Video conversion failed, using original file');
            finalBuffer = conversionResult.originalBuffer || req.file.buffer;
            finalMimeType = req.file.mimetype;
            processingInfo = {
                converted: false,
                error: conversionResult.error,
                originalSize: req.file.size
            };
        }

        // Generate filename
        const fileExtension = conversionResult.success && !conversionResult.bypassed ? '.mp4' : path.extname(req.file.originalname);
        const fileName = `videos/${Date.now()}-${crypto.randomBytes(16).toString('hex')}${fileExtension}`;

        console.log('📋 Uploading to DigitalOcean Spaces...');

        // Upload to S3
        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: finalBuffer,
            ContentType: finalMimeType,
            ACL: 'public-read',
            Metadata: {
                'original-filename': req.file.originalname,
                'processed': conversionResult.success.toString(),
                'upload-timestamp': Date.now().toString()
            }
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        let videoUrl = uploadResult.Location;
        
        // Normalize URL format
        if (videoUrl && !videoUrl.startsWith('https://')) {
            videoUrl = `https://${BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com'}/${fileName}`;
        }

        console.log('✅ Upload completed to:', videoUrl);

        // Save to database
        let videoRecord = null;
        if (db) {
            const video = {
                userId: req.user.userId || userId,
                username: username || 'unknown',
                title,
                description: description || '',
                videoUrl,
                fileName,
                originalFilename: req.file.originalname,
                fileSize: finalBuffer.length,
                originalFileSize: req.file.size,
                mimeType: finalMimeType,
                originalMimeType: req.file.mimetype,
                processed: conversionResult.success,
                processingInfo: processingInfo,
                views: 0,
                likes: [],
                comments: [],
                hashtags: hashtags ? (Array.isArray(hashtags) ? hashtags : hashtags.split(',').map(tag => tag.trim()).filter(tag => tag)) : [],
                musicName: musicName || '',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await db.collection('videos').insertOne(video);
            videoRecord = { ...video, _id: result.insertedId };
        }

        res.json({
            success: true,
            message: 'Video uploaded successfully',
            videoId: videoRecord?._id,
            videoUrl,
            processingInfo
        });
        
    } catch (error) {
        console.error('Video upload error:', error);
        res.status(500).json({ 
            error: 'Failed to upload video',
            details: error.message 
        });
    }
});

// Serve video variants and manifests
router.get('/variants/:userId/:videoId/:file', (req, res) => {
    const { userId, videoId, file } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', 'videos', userId, videoId, file);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Video variant not found' });
    }
    
    // Set appropriate content type
    let contentType = 'video/mp4';
    if (file.endsWith('.json')) {
        contentType = 'application/json';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Handle range requests for video streaming
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const stream = fs.createReadStream(filePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
        };
        res.writeHead(206, head);
        stream.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': contentType,
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }
});

// Get video processing status
router.get('/processing-status/:videoId', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const video = await db.collection('videos').findOne({ 
            _id: new require('mongodb').ObjectId(req.params.videoId) 
        });
        
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        
        res.json({
            videoId: video._id,
            status: video.processingInfo?.converted ? 'completed' : 'pending',
            processingInfo: video.processingInfo,
            variants: video.variants || null,
            manifest: video.manifest || null
        });
    } catch (error) {
        console.error('Error checking processing status:', error);
        res.status(500).json({ error: 'Failed to check status' });
    }
});

module.exports = { initializeVideoRoutes, router };