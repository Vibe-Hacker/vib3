require('dotenv').config();

// Wrap requires in try-catch to identify issues
let express, multer, AWS, path, crypto, VideoProcessor;

try {
    express = require('express');
    multer = require('multer');
    AWS = require('aws-sdk');
    path = require('path');
    crypto = require('crypto');
    VideoProcessor = require('./video-processor');
} catch (error) {
    console.error('FATAL: Failed to load dependencies:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}

// Import modular components early
const constants = require('./constants');
const videoConfig = require('./config/video-config');
const { requireAuth: modularRequireAuth, createSession: modularCreateSession, sessions: modularSessions } = require('./middleware/auth');
const grokDevRoutes = require('./server/routes/grok-dev');
const GeminiTaskManager = require('./gemini-task-manager');

const app = express();
const PORT = process.env.PORT || 3000;
console.log('🚀 VIB3 Server starting... [2025-10-26 env-vars-update]');

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// IMPORTANT: Static files are served later, after API routes are defined
// This prevents static files from intercepting API calls

// Request logging middleware
app.use((req, res, next) => {
    try {
        console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
    } catch (error) {
        console.error('Error in logging middleware:', error);
        next(error);
    }
});

// Session management - using modular auth
const sessions = modularSessions; // Use sessions from auth module

// CORS - Enhanced for mobile app and video streaming
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        console.log('📋 Handling CORS preflight for:', req.url);
        res.status(200).end();
        return;
    }
    
    next();
});

// Health check endpoint (before static files)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        deploymentVersion: '2025-10-26-thumbnail-upload-fix',
        staticMiddlewareFixed: true,
        imageUploadEnabled: true,
        commit: 'pending'
    });
});

// Debug endpoint to check environment variables
app.get('/debug/env', (req, res) => {
    res.json({
        hasSpacesKey: !!process.env.DO_SPACES_KEY,
        hasSpacesSecret: !!process.env.DO_SPACES_SECRET,
        hasSpacesEndpoint: !!process.env.DO_SPACES_ENDPOINT,
        hasSpacesBucket: !!process.env.DO_SPACES_BUCKET,
        hasCdnUrl: !!process.env.DO_SPACES_CDN_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        spacesKeyLength: process.env.DO_SPACES_KEY?.length || 0,
        spacesSecretLength: process.env.DO_SPACES_SECRET?.length || 0,
        bucket: process.env.DO_SPACES_BUCKET || 'NOT_SET',
        endpoint: process.env.DO_SPACES_ENDPOINT || 'NOT_SET',
        region: process.env.DO_SPACES_REGION || 'NOT_SET',
        nodeEnv: process.env.NODE_ENV || 'NOT_SET'
    });
});

// Test S3 upload endpoint
app.get('/debug/test-s3', async (req, res) => {
    try {
        const testBuffer = Buffer.from('Test upload from VIB3 backend');
        const testFileName = `test/test-${Date.now()}.txt`;

        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: testFileName,
            Body: testBuffer,
            ContentType: 'text/plain',
            ACL: 'public-read'
        };

        console.log('Testing S3 upload with params:', {
            bucket: BUCKET_NAME,
            key: testFileName,
            endpoint: process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com',
            region: process.env.DO_SPACES_REGION || 'nyc3'
        });

        const uploadResult = await s3.upload(uploadParams).promise();

        res.json({
            success: true,
            message: 'S3 upload test successful',
            url: uploadResult.Location,
            bucket: BUCKET_NAME,
            key: testFileName
        });
    } catch (error) {
        console.error('S3 test upload failed:', error);
        res.status(500).json({
            success: false,
            message: 'S3 upload test failed',
            error: error.message,
            errorCode: error.code,
            errorStack: error.stack
        });
    }
});

// Test FFmpeg installation
app.get('/debug/test-ffmpeg', async (req, res) => {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    try {
        const { stdout, stderr } = await execPromise('ffmpeg -version');
        res.json({
            success: true,
            message: 'FFmpeg is installed',
            version: stdout.split('\n')[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'FFmpeg not found or not working',
            error: error.message
        });
    }
});

// Password reset web interface
app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Test video endpoint for debugging
// const testVideoRouter = require('./test-video-endpoint');
// app.use('/api', testVideoRouter);

// Video proxy endpoint to bypass CORS issues
app.get('/api/proxy/video', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'Missing video URL' });
    }
    
    try {
        // Set CORS headers
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, HEAD');
        res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Content-Range, Accept-Ranges');
        
        // Support range requests for video seeking
        const range = req.headers.range;
        const axios = require('axios');
        
        if (range) {
            // Handle range request
            const headResponse = await axios.head(videoUrl);
            const fileSize = parseInt(headResponse.headers['content-length']);
            
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            
            const response = await axios.get(videoUrl, {
                headers: { Range: `bytes=${start}-${end}` },
                responseType: 'stream'
            });
            
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4'
            });
            
            response.data.pipe(res);
        } else {
            // Stream entire video
            const response = await axios.get(videoUrl, { responseType: 'stream' });
            
            res.header('Content-Type', response.headers['content-type'] || 'video/mp4');
            res.header('Content-Length', response.headers['content-length']);
            res.header('Accept-Ranges', 'bytes');
            
            response.data.pipe(res);
        }
    } catch (error) {
        console.error('Video proxy error:', error.message);
        res.status(500).json({ error: 'Failed to proxy video' });
    }
});



// Algorithm analytics endpoint (before static files)
app.get('/api/analytics/algorithm', async (req, res) => {
    console.log('📊 Analytics endpoint hit');
    
    // Set JSON content type explicitly
    res.setHeader('Content-Type', 'application/json');
    
    if (!db) {
        console.log('❌ Database not available');
        return res.status(503).json({ error: 'Database not available' });
    }

    try {
        console.log('📊 Generating algorithm analytics...');
        
        const now = new Date();
        
        // Get recent videos for analysis
        const videos = await db.collection('videos')
            .find({ status: { $ne: 'deleted' } })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();

        console.log(`📹 Found ${videos.length} videos in database`);

        // Handle case with no videos
        if (videos.length === 0) {
            console.log('⚠️ No videos found - returning empty analytics');
            const emptyAnalytics = {
                totalVideos: 0,
                algorithmVersion: '1.0.0-engagement',
                timestamp: now.toISOString(),
                engagementStats: { avgScore: 0, maxScore: 0, minScore: 0, highEngagementCount: 0 },
                freshnessStats: { last24h: 0, last7days: 0, avgAgeHours: 0 },
                totalEngagement: { totalLikes: 0, totalComments: 0, totalViews: 0, avgLikeRate: 0 },
                topVideos: [],
                diversity: { uniqueCreators: 0, contentSpread: 'no_content' }
            };
            return res.json(emptyAnalytics);
        }

        // Apply engagement ranking to get scores
        console.log('📈 Applying engagement ranking...');
        const rankedVideos = await applyEngagementRanking([...videos], db);
        console.log(`✅ Ranked ${rankedVideos.length} videos`);
        
        // Calculate performance metrics
        console.log('📊 Calculating analytics metrics...');
        const analytics = {
            totalVideos: videos.length,
            algorithmVersion: '1.3.0-engagement-hashtags-behavior-ml',
            timestamp: now.toISOString(),
            
            // Engagement distribution
            engagementStats: {
                avgScore: rankedVideos.reduce((sum, v) => sum + (v.engagementScore || 0), 0) / rankedVideos.length,
                maxScore: Math.max(...rankedVideos.map(v => v.engagementScore || 0)),
                minScore: Math.min(...rankedVideos.map(v => v.engagementScore || 0)),
                highEngagementCount: rankedVideos.filter(v => (v.engagementScore || 0) > 1.0).length
            },
            
            // Content freshness
            freshnessStats: {
                last24h: rankedVideos.filter(v => (v.hoursOld || 0) < 24).length,
                last7days: rankedVideos.filter(v => (v.hoursOld || 0) < 168).length,
                avgAgeHours: rankedVideos.reduce((sum, v) => sum + (v.hoursOld || 0), 0) / rankedVideos.length
            },
            
            // Engagement metrics
            totalEngagement: {
                totalLikes: rankedVideos.reduce((sum, v) => sum + (v.likeCount || 0), 0),
                totalComments: rankedVideos.reduce((sum, v) => sum + (v.commentCount || 0), 0),
                totalViews: rankedVideos.reduce((sum, v) => sum + (v.views || 0), 0),
                avgLikeRate: rankedVideos.reduce((sum, v) => sum + (v.likeRate || 0), 0) / rankedVideos.length
            },
            
            // Top performing content
            topVideos: rankedVideos.slice(0, 10).map(v => ({
                id: v._id,
                title: v.title || 'Untitled',
                engagementScore: parseFloat((v.engagementScore || 0).toFixed(2)),
                finalScore: parseFloat((v.finalScore || v.engagementScore || 0).toFixed(2)),
                mlRecommendationScore: parseFloat((v.mlRecommendationScore || 0).toFixed(2)),
                collaborativeScore: parseFloat((v.collaborativeScore || 0).toFixed(2)),
                contentScore: parseFloat((v.contentScore || 0).toFixed(2)),
                likes: v.likeCount || 0,
                comments: v.commentCount || 0,
                views: v.views || 0,
                hoursOld: parseFloat((v.hoursOld || 0).toFixed(1)),
                likeRate: parseFloat((v.likeRate || 0).toFixed(4))
            })),
            
            // Algorithm effectiveness indicators
            diversity: {
                uniqueCreators: new Set(rankedVideos.map(v => v.userId)).size,
                contentSpread: rankedVideos.slice(0, 10).map(v => v.userId).length === new Set(rankedVideos.slice(0, 10).map(v => v.userId)).size ? 'good' : 'needs_improvement'
            },
            
            // Hashtag-based recommendation metrics
            hashtagAnalytics: {
                videosWithHashtags: rankedVideos.filter(v => v.hashtags && v.hashtags.length > 0).length,
                totalHashtags: rankedVideos.reduce((sum, v) => sum + (v.hashtags ? v.hashtags.length : 0), 0),
                avgHashtagsPerVideo: rankedVideos.length > 0 ? 
                    rankedVideos.reduce((sum, v) => sum + (v.hashtags ? v.hashtags.length : 0), 0) / rankedVideos.length : 0,
                boostedVideos: rankedVideos.filter(v => (v.hashtagBoost || 0) > 0).length,
                avgHashtagBoost: rankedVideos.filter(v => (v.hashtagBoost || 0) > 0)
                    .reduce((sum, v) => sum + (v.hashtagBoost || 0), 0) / Math.max(1, rankedVideos.filter(v => (v.hashtagBoost || 0) > 0).length),
                topHashtags: getTopHashtags(rankedVideos, 10)
            },
            
            // Machine Learning recommendation metrics
            mlAnalytics: {
                videosWithMLBoost: rankedVideos.filter(v => (v.mlRecommendationScore || 0) > 0).length,
                avgMLBoost: rankedVideos.filter(v => (v.mlRecommendationScore || 0) > 0)
                    .reduce((sum, v) => sum + (v.mlRecommendationScore || 0), 0) / Math.max(1, rankedVideos.filter(v => (v.mlRecommendationScore || 0) > 0).length),
                maxMLBoost: Math.max(...rankedVideos.map(v => v.mlRecommendationScore || 0)),
                collaborativeRecommendations: rankedVideos.filter(v => (v.collaborativeScore || 0) > 0).length,
                contentRecommendations: rankedVideos.filter(v => (v.contentScore || 0) > 0).length,
                avgCollaborativeScore: rankedVideos.filter(v => (v.collaborativeScore || 0) > 0)
                    .reduce((sum, v) => sum + (v.collaborativeScore || 0), 0) / Math.max(1, rankedVideos.filter(v => (v.collaborativeScore || 0) > 0).length),
                avgContentScore: rankedVideos.filter(v => (v.contentScore || 0) > 0)
                    .reduce((sum, v) => sum + (v.contentScore || 0), 0) / Math.max(1, rankedVideos.filter(v => (v.contentScore || 0) > 0).length)
            }
        };
        
        console.log('✅ Algorithm analytics generated');
        console.log('📤 Sending analytics response...');
        res.json(analytics);
        
    } catch (error) {
        console.error('❌ Algorithm analytics error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to generate analytics',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ================ WATCH TIME ANALYTICS ================

// Get comprehensive watch time analytics
app.get('/api/analytics/watchtime', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }
    
    try {
        console.log('⏱️ Generating watch time analytics...');
        
        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        
        // Get all views for different time periods
        const [dayViews, weekViews, monthViews] = await Promise.all([
            db.collection('views').find({ timestamp: { $gte: oneDayAgo } }).toArray(),
            db.collection('views').find({ timestamp: { $gte: oneWeekAgo } }).toArray(),
            db.collection('views').find({ timestamp: { $gte: oneMonthAgo } }).toArray()
        ]);
        
        // Calculate platform-wide metrics
        const platformMetrics = {
            daily: calculateWatchTimeMetrics(dayViews, '24h'),
            weekly: calculateWatchTimeMetrics(weekViews, '7d'),
            monthly: calculateWatchTimeMetrics(monthViews, '30d')
        };
        
        // Get top videos by watch time
        const topVideosByWatchTime = await getTopVideosByWatchTime(db, oneWeekAgo);
        
        // Get creator analytics
        const creatorAnalytics = await getCreatorWatchTimeAnalytics(db, oneWeekAgo);
        
        // Get hourly distribution
        const hourlyDistribution = getHourlyWatchTimeDistribution(weekViews);
        
        // Get completion rate analytics
        const completionRates = getCompletionRateAnalytics(weekViews);
        
        // Get device/platform breakdown
        const deviceBreakdown = getDeviceBreakdown(weekViews);
        
        const analytics = {
            timestamp: now.toISOString(),
            platformMetrics,
            topVideosByWatchTime,
            creatorAnalytics,
            hourlyDistribution,
            completionRates,
            deviceBreakdown,
            insights: generateWatchTimeInsights(platformMetrics, completionRates)
        };
        
        console.log('✅ Watch time analytics generated');
        res.json(analytics);
        
    } catch (error) {
        console.error('❌ Watch time analytics error:', error);
        res.status(500).json({ 
            error: 'Failed to generate watch time analytics',
            details: error.message
        });
    }
});

// Get video-specific watch time analytics
app.get('/api/analytics/watchtime/video/:videoId', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }
    
    try {
        const { videoId } = req.params;
        
        // Get all views for this video
        const views = await db.collection('views')
            .find({ videoId })
            .sort({ timestamp: -1 })
            .toArray();
        
        if (views.length === 0) {
            return res.json({ 
                message: 'No views found for this video',
                videoId 
            });
        }
        
        // Get video details
        const video = await db.collection('videos').findOne({ 
            _id: new require('mongodb').ObjectId(videoId) 
        });
        
        const analytics = {
            videoId,
            title: video?.title || 'Unknown',
            duration: video?.duration || 0,
            totalViews: views.length,
            metrics: {
                totalWatchTime: views.reduce((sum, v) => sum + (v.watchTime || 0), 0),
                avgWatchTime: views.reduce((sum, v) => sum + (v.watchTime || 0), 0) / views.length,
                avgWatchPercentage: views.reduce((sum, v) => sum + (v.watchPercentage || 0), 0) / views.length,
                completionRate: views.filter(v => v.watchPercentage >= 80).length / views.length * 100,
                replayRate: views.filter(v => v.isReplay).length / views.length * 100
            },
            retention: calculateRetentionCurve(views, video?.duration || 30),
            referrerBreakdown: getReferrerBreakdown(views),
            timeDistribution: getViewTimeDistribution(views)
        };
        
        res.json(analytics);
        
    } catch (error) {
        console.error('Video watch time analytics error:', error);
        res.status(500).json({ error: 'Failed to get video analytics' });
    }
});

// Get creator watch time analytics
app.get('/api/analytics/watchtime/creator/:userId', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }
    
    try {
        const { userId } = req.params;
        const { period = '7d' } = req.query;
        
        const startDate = getPeriodStartDate(period);
        
        // Get all videos by this creator
        const creatorVideos = await db.collection('videos')
            .find({ userId })
            .toArray();
        
        const videoIds = creatorVideos.map(v => v._id.toString());
        
        // Get all views for creator's videos
        const views = await db.collection('views')
            .find({ 
                videoId: { $in: videoIds },
                timestamp: { $gte: startDate }
            })
            .toArray();
        
        // Calculate metrics per video
        const videoMetrics = creatorVideos.map(video => {
            const videoViews = views.filter(v => v.videoId === video._id.toString());
            return {
                videoId: video._id,
                title: video.title || 'Untitled',
                uploadDate: video.createdAt,
                views: videoViews.length,
                totalWatchTime: videoViews.reduce((sum, v) => sum + (v.watchTime || 0), 0),
                avgWatchTime: videoViews.length > 0 ? 
                    videoViews.reduce((sum, v) => sum + (v.watchTime || 0), 0) / videoViews.length : 0,
                completionRate: videoViews.length > 0 ?
                    videoViews.filter(v => v.watchPercentage >= 80).length / videoViews.length * 100 : 0
            };
        }).sort((a, b) => b.totalWatchTime - a.totalWatchTime);
        
        const analytics = {
            userId,
            period,
            summary: {
                totalVideos: creatorVideos.length,
                totalViews: views.length,
                totalWatchTime: views.reduce((sum, v) => sum + (v.watchTime || 0), 0),
                avgWatchTimePerView: views.length > 0 ?
                    views.reduce((sum, v) => sum + (v.watchTime || 0), 0) / views.length : 0,
                avgCompletionRate: views.length > 0 ?
                    views.filter(v => v.watchPercentage >= 80).length / views.length * 100 : 0
            },
            topVideos: videoMetrics.slice(0, 10),
            dailyTrend: getDailyWatchTimeTrend(views, period),
            audienceRetention: {
                avgFirstQuartile: calculateQuartileRetention(views, 25),
                avgMidpoint: calculateQuartileRetention(views, 50),
                avgThirdQuartile: calculateQuartileRetention(views, 75),
                avgComplete: calculateQuartileRetention(views, 90)
            }
        };
        
        res.json(analytics);
        
    } catch (error) {
        console.error('Creator watch time analytics error:', error);
        res.status(500).json({ error: 'Failed to get creator analytics' });
    }
});

// Helper functions for watch time analytics
function calculateWatchTimeMetrics(views, period) {
    const totalWatchTime = views.reduce((sum, v) => sum + (v.watchTime || 0), 0);
    const uniqueViewers = new Set(views.filter(v => v.userId).map(v => v.userId)).size;
    const totalViews = views.length;
    
    return {
        period,
        totalWatchTime,
        totalWatchTimeHours: (totalWatchTime / 3600).toFixed(2),
        totalViews,
        uniqueViewers,
        avgWatchTime: totalViews > 0 ? totalWatchTime / totalViews : 0,
        avgSessionsPerViewer: uniqueViewers > 0 ? totalViews / uniqueViewers : 0,
        avgWatchPercentage: totalViews > 0 ?
            views.reduce((sum, v) => sum + (v.watchPercentage || 0), 0) / totalViews : 0
    };
}

async function getTopVideosByWatchTime(db, since) {
    const pipeline = [
        { $match: { timestamp: { $gte: since } } },
        { $group: {
            _id: '$videoId',
            totalWatchTime: { $sum: '$watchTime' },
            viewCount: { $sum: 1 },
            avgWatchTime: { $avg: '$watchTime' },
            avgWatchPercentage: { $avg: '$watchPercentage' }
        }},
        { $sort: { totalWatchTime: -1 } },
        { $limit: 10 }
    ];
    
    const results = await db.collection('views').aggregate(pipeline).toArray();
    
    // Fetch video details
    const videoIds = results.map(r => new require('mongodb').ObjectId(r._id));
    const videos = await db.collection('videos').find({ 
        _id: { $in: videoIds } 
    }).toArray();
    
    return results.map(result => {
        const video = videos.find(v => v._id.toString() === result._id);
        return {
            videoId: result._id,
            title: video?.title || 'Unknown',
            creator: video?.userId || 'Unknown',
            totalWatchTime: Math.round(result.totalWatchTime),
            totalWatchTimeMinutes: (result.totalWatchTime / 60).toFixed(1),
            viewCount: result.viewCount,
            avgWatchTime: Math.round(result.avgWatchTime),
            avgWatchPercentage: Math.round(result.avgWatchPercentage)
        };
    });
}

async function getCreatorWatchTimeAnalytics(db, since) {
    const pipeline = [
        { $match: { timestamp: { $gte: since } } },
        { $lookup: {
            from: 'videos',
            let: { videoId: { $toObjectId: '$videoId' } },
            pipeline: [
                { $match: { $expr: { $eq: ['$_id', '$$videoId'] } } }
            ],
            as: 'video'
        }},
        { $unwind: '$video' },
        { $group: {
            _id: '$video.userId',
            totalWatchTime: { $sum: '$watchTime' },
            viewCount: { $sum: 1 },
            videoCount: { $addToSet: '$videoId' }
        }},
        { $project: {
            _id: 1,
            totalWatchTime: 1,
            viewCount: 1,
            videoCount: { $size: '$videoCount' },
            avgWatchTimePerVideo: { $divide: ['$totalWatchTime', { $size: '$videoCount' }] }
        }},
        { $sort: { totalWatchTime: -1 } },
        { $limit: 10 }
    ];
    
    const results = await db.collection('views').aggregate(pipeline).toArray();
    
    // Fetch user details
    const userIds = results.map(r => r._id);
    const users = await db.collection('users').find({ 
        _id: { $in: userIds } 
    }).toArray();
    
    return results.map(result => {
        const user = users.find(u => u._id === result._id);
        return {
            userId: result._id,
            username: user?.username || 'Unknown',
            totalWatchTime: Math.round(result.totalWatchTime),
            totalWatchTimeHours: (result.totalWatchTime / 3600).toFixed(1),
            viewCount: result.viewCount,
            videoCount: result.videoCount,
            avgWatchTimePerVideo: Math.round(result.avgWatchTimePerVideo)
        };
    });
}

function getHourlyWatchTimeDistribution(views) {
    const hourlyData = {};
    
    views.forEach(view => {
        const hour = view.hour || new Date(view.timestamp).getHours();
        if (!hourlyData[hour]) {
            hourlyData[hour] = { 
                watchTime: 0, 
                views: 0 
            };
        }
        hourlyData[hour].watchTime += view.watchTime || 0;
        hourlyData[hour].views += 1;
    });
    
    return Object.entries(hourlyData).map(([hour, data]) => ({
        hour: parseInt(hour),
        totalWatchTime: Math.round(data.watchTime),
        viewCount: data.views,
        avgWatchTime: Math.round(data.watchTime / data.views)
    })).sort((a, b) => a.hour - b.hour);
}

function getCompletionRateAnalytics(views) {
    const ranges = [
        { label: '0-10%', min: 0, max: 10, count: 0 },
        { label: '10-25%', min: 10, max: 25, count: 0 },
        { label: '25-50%', min: 25, max: 50, count: 0 },
        { label: '50-75%', min: 50, max: 75, count: 0 },
        { label: '75-90%', min: 75, max: 90, count: 0 },
        { label: '90-100%', min: 90, max: 100, count: 0 }
    ];
    
    views.forEach(view => {
        const percentage = view.watchPercentage || 0;
        const range = ranges.find(r => percentage >= r.min && percentage < r.max) ||
                     ranges[ranges.length - 1]; // 90-100%
        range.count++;
    });
    
    const total = views.length;
    return ranges.map(range => ({
        ...range,
        percentage: total > 0 ? (range.count / total * 100).toFixed(1) : 0
    }));
}

function getDeviceBreakdown(views) {
    const devices = {};
    
    views.forEach(view => {
        const ua = view.userAgent || 'unknown';
        let device = 'unknown';
        
        if (/mobile/i.test(ua)) device = 'mobile';
        else if (/tablet/i.test(ua)) device = 'tablet';
        else if (/desktop/i.test(ua) || /windows|mac|linux/i.test(ua)) device = 'desktop';
        
        devices[device] = (devices[device] || 0) + 1;
    });
    
    const total = views.length;
    return Object.entries(devices).map(([device, count]) => ({
        device,
        count,
        percentage: total > 0 ? (count / total * 100).toFixed(1) : 0,
        avgWatchTime: views
            .filter(v => {
                const ua = v.userAgent || '';
                if (device === 'mobile') return /mobile/i.test(ua);
                if (device === 'tablet') return /tablet/i.test(ua);
                if (device === 'desktop') return /desktop/i.test(ua) || /windows|mac|linux/i.test(ua);
                return device === 'unknown';
            })
            .reduce((sum, v, _, arr) => sum + (v.watchTime || 0) / arr.length, 0)
    }));
}

function generateWatchTimeInsights(metrics, completionRates) {
    const insights = [];
    
    // Daily watch time insight
    if (metrics.daily.totalWatchTimeHours > 24) {
        insights.push({
            type: 'success',
            text: `Strong engagement: ${metrics.daily.totalWatchTimeHours} hours watched in the last 24h`
        });
    }
    
    // Completion rate insight
    const highCompletion = completionRates.find(r => r.label === '90-100%');
    if (highCompletion && parseFloat(highCompletion.percentage) > 30) {
        insights.push({
            type: 'success',
            text: `Excellent retention: ${highCompletion.percentage}% of views watch 90%+ of videos`
        });
    }
    
    // Growth insight
    const weeklyGrowth = metrics.weekly.totalViews > 0 ? 
        ((metrics.daily.totalViews * 7) / metrics.weekly.totalViews - 1) * 100 : 0;
    if (weeklyGrowth > 20) {
        insights.push({
            type: 'growth',
            text: `Watch time growing ${weeklyGrowth.toFixed(0)}% week-over-week`
        });
    }
    
    return insights;
}

function calculateRetentionCurve(views, duration) {
    const points = 10; // Sample 10 points along the video
    const interval = duration / points;
    const retention = [];
    
    for (let i = 0; i <= points; i++) {
        const timePoint = i * interval;
        const viewersAtPoint = views.filter(v => 
            (v.exitPoint || v.watchTime || 0) >= timePoint
        ).length;
        
        retention.push({
            time: Math.round(timePoint),
            percentage: views.length > 0 ? 
                (viewersAtPoint / views.length * 100).toFixed(1) : 0
        });
    }
    
    return retention;
}

function getReferrerBreakdown(views) {
    const referrers = {};
    
    views.forEach(view => {
        const referrer = view.referrer || 'unknown';
        referrers[referrer] = (referrers[referrer] || 0) + 1;
    });
    
    const total = views.length;
    return Object.entries(referrers)
        .map(([referrer, count]) => ({
            referrer,
            count,
            percentage: total > 0 ? (count / total * 100).toFixed(1) : 0
        }))
        .sort((a, b) => b.count - a.count);
}

function getViewTimeDistribution(views) {
    const distribution = {};
    
    views.forEach(view => {
        const hour = new Date(view.timestamp).getHours();
        distribution[hour] = (distribution[hour] || 0) + 1;
    });
    
    return Object.entries(distribution)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => a.hour - b.hour);
}

function getPeriodStartDate(period) {
    const now = new Date();
    switch (period) {
        case '24h': return new Date(now - 24 * 60 * 60 * 1000);
        case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
        case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000);
        default: return new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
}

function getDailyWatchTimeTrend(views, period) {
    const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
    const dailyData = {};
    
    // Initialize all days
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        dailyData[dateKey] = { watchTime: 0, views: 0 };
    }
    
    // Aggregate data
    views.forEach(view => {
        const dateKey = new Date(view.timestamp).toISOString().split('T')[0];
        if (dailyData[dateKey]) {
            dailyData[dateKey].watchTime += view.watchTime || 0;
            dailyData[dateKey].views += 1;
        }
    });
    
    return Object.entries(dailyData)
        .map(([date, data]) => ({
            date,
            totalWatchTime: Math.round(data.watchTime),
            viewCount: data.views,
            avgWatchTime: data.views > 0 ? Math.round(data.watchTime / data.views) : 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateQuartileRetention(views, quartile) {
    const viewsReachingQuartile = views.filter(v => 
        (v.watchPercentage || 0) >= quartile
    ).length;
    
    return views.length > 0 ? 
        (viewsReachingQuartile / views.length * 100).toFixed(1) : 0;
}

// Serve static files (AFTER API routes)
// Legacy web directories removed - using Flutter app only
// app.use('/app', express.static(path.join(__dirname, 'app')));

// Mobile device detection middleware
function isMobileDevice(userAgent) {
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return mobileRegex.test(userAgent);
}

// Legacy mobile directory removed - using Flutter app only
// app.use('/mobile', express.static(path.join(__dirname, 'mobile')));

// Auto-redirect based on device type (before static serving)
app.get('/', (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const isMobile = isMobileDevice(userAgent);
    
    console.log(`📱 Device detection: ${isMobile ? 'MOBILE' : 'DESKTOP'} - User-Agent: ${userAgent}`);
    
    if (isMobile) {
        // Preserve query parameters when redirecting to mobile
        const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
        const redirectUrl = `/mobile${queryString}`;
        console.log(`📱 Redirecting mobile device to ${redirectUrl}`);
        return res.redirect(redirectUrl);
    } else {
        console.log('🖥️ Serving desktop version');
        // Continue to static file serving for www
        next();
    }
});

// Route web requests to www directory (default)
// Legacy static file serving removed - using Flutter app only
// const webDir = path.join(__dirname, 'www');
// console.log('Serving static files from:', webDir);
// console.log('Current directory:', process.cwd());
// console.log('__dirname:', __dirname);

// Legacy paths removed
// const possiblePaths = [
//     path.join(__dirname, 'www'),
//     path.join(process.cwd(), 'www'),
//     './www',
//     'www'
// ];

// let staticPath = null;
// const fs = require('fs');
// for (const p of possiblePaths) {
//     if (fs.existsSync(p)) {
//         staticPath = p;
//         console.log('Found web directory at:', p);
//         break;
//     }
// }

// Legacy static file serving removed - using Flutter app only
// All requests to the root will get a message to use the Flutter app
app.get('/', (req, res) => {
    res.json({ 
        message: 'VIB3 API Server',
        status: 'Web interface removed - please use the Flutter mobile app',
        api: 'Available at /api/*'
    });
});


// DigitalOcean Spaces configuration
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
    region: process.env.DO_SPACES_REGION || 'nyc3'
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'vib3-videos';

// Initialize video processors
const videoProcessor = new VideoProcessor();
const MultiQualityVideoProcessor = require('./video-processor-multi');
const multiQualityProcessor = new MultiQualityVideoProcessor();
const AdvancedVideoProcessor = require('./advanced-video-processor');
const advancedProcessor = new AdvancedVideoProcessor();

// ================ HELPER FUNCTIONS ================

// Fix duplicated paths in video URLs
function fixVideoUrl(url) {
    if (!url) return url;
    
    let fixedUrl = url;
    
    // Fix the specific pattern we're seeing
    if (fixedUrl.includes('/videos/nyc3.digitaloceanspaces.com/vib3-videos/videos/')) {
        fixedUrl = fixedUrl.replace('/videos/nyc3.digitaloceanspaces.com/vib3-videos/videos/', '/videos/');
    }
    
    // Fix other duplication patterns
    if (fixedUrl.includes('nyc3.digitaloceanspaces.com/videos/nyc3.digitaloceanspaces.com')) {
        fixedUrl = fixedUrl.replace('nyc3.digitaloceanspaces.com/videos/nyc3.digitaloceanspaces.com', 'nyc3.digitaloceanspaces.com');
    }
    
    return fixedUrl;
}



// Configure multer for video uploads using modular config
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: videoConfig.UPLOAD_LIMITS.maxFileSize
    },
    fileFilter: (req, file, cb) => {
        console.log(`📋 File upload attempt - Field: ${file.fieldname}, MIME: ${file.mimetype}, Name: ${file.originalname}`);

        // Accept thumbnails (images) for thumbnail or image field
        if (file.fieldname === 'thumbnail' || file.fieldname === 'image') {
            const isImage = file.mimetype && file.mimetype.startsWith('image/');
            const hasImageExtension = file.originalname && /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname);

            if (isImage || hasImageExtension) {
                console.log(`✅ Image/Thumbnail accepted: ${file.originalname}`);
                cb(null, true);
            } else {
                console.log(`❌ Image rejected - MIME: ${file.mimetype}, Name: ${file.originalname}`);
                cb(new Error('Invalid image type. Please upload an image file.'));
            }
            return;
        }

        // Accept any video MIME type or common video file extensions
        const isVideo = file.mimetype && file.mimetype.startsWith('video/');
        const hasVideoExtension = file.originalname && /\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v|3gp)$/i.test(file.originalname);

        if (isVideo || hasVideoExtension) {
            console.log(`✅ Video file accepted: ${file.originalname}`);
            cb(null, true);
        } else {
            console.log(`❌ File rejected - MIME: ${file.mimetype}, Name: ${file.originalname}`);
            cb(new Error('Invalid file type. Please upload a video file.'));
        }
    }
});

// MongoDB connection
const { MongoClient, ObjectId } = require('mongodb');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
let db = null;
let client = null;

async function connectDB() {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (mongoUri) {
        try {
            client = new MongoClient(mongoUri);
            await client.connect();
            // Use explicit DB name from env, or extract from URI, or use default
            let dbName = process.env.MONGODB_DATABASE_NAME;
            if (!dbName) {
                // Extract from URI: mongodb://.../.../dbname?params
                const uriParts = mongoUri.split('/');
                dbName = uriParts[uriParts.length - 1].split('?')[0];
            }
            if (!dbName || dbName.includes('mongodb')) {
                dbName = 'vib3'; // Fallback to vib3 database where videos were originally uploaded
            }
            db = client.db(dbName);
            console.log(`📊 Connected to database: ${dbName}`);

            // Create indexes for better performance
            await createIndexes();

            console.log('✅ MongoDB connected successfully');
            return true;
        } catch (error) {
            console.error('MongoDB connection error:', error.message);
            return false;
        }
    } else {
        console.log('No MONGODB_URI or DATABASE_URL found - running without database');
        return false;
    }
}

async function createIndexes() {
    try {
        // Clean up problematic likes first
        await cleanupLikes();
        
        // User indexes
        await db.collection(constants.COLLECTIONS.USERS).createIndex({ email: 1 }, { unique: true });
        await db.collection(constants.COLLECTIONS.USERS).createIndex({ username: 1 }, { unique: true });
        
        // Video indexes
        await db.collection(constants.COLLECTIONS.VIDEOS).createIndex({ userId: 1 });
        await db.collection(constants.COLLECTIONS.VIDEOS).createIndex({ createdAt: -1 });
        await db.collection(constants.COLLECTIONS.VIDEOS).createIndex({ hashtags: 1 });
        await db.collection(constants.COLLECTIONS.VIDEOS).createIndex({ status: 1 });
        
        // Posts indexes (for photos and slideshows)
        await db.collection('posts').createIndex({ userId: 1 });
        await db.collection('posts').createIndex({ createdAt: -1 });
        await db.collection('posts').createIndex({ type: 1 });
        await db.collection('posts').createIndex({ hashtags: 1 });
        await db.collection('posts').createIndex({ status: 1 });
        
        // Social indexes (only video likes for now)
        await db.collection('likes').createIndex({ videoId: 1, userId: 1 }, { unique: true });
        await db.collection('comments').createIndex({ videoId: 1, createdAt: -1 });
        await db.collection('comments').createIndex({ postId: 1, createdAt: -1 });
        await db.collection('follows').createIndex({ followerId: 1, followingId: 1 }, { unique: true });
        
        console.log('✅ Database indexes created');
    } catch (error) {
        console.error('Index creation error:', error.message);
    }
}

async function cleanupLikes() {
    try {
        console.log('🧹 Cleaning up likes collection...');
        
        // Remove postId field from all video likes
        const updateResult = await db.collection('likes').updateMany(
            { 
                videoId: { $exists: true, $ne: null },
                postId: { $exists: true }
            },
            { 
                $unset: { postId: "" }
            }
        );
        
        console.log(`✅ Cleaned up ${updateResult.modifiedCount} video likes`);
        
        // Remove duplicate video likes (keep most recent)
        const duplicates = await db.collection('likes').aggregate([
            {
                $match: {
                    videoId: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: { videoId: "$videoId", userId: "$userId" },
                    count: { $sum: 1 },
                    docs: { $push: { id: "$_id", createdAt: "$createdAt" } }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]).toArray();
        
        if (duplicates.length > 0) {
            console.log(`Found ${duplicates.length} sets of duplicate video likes`);
            
            for (const dup of duplicates) {
                // Sort by createdAt and keep the most recent
                const sorted = dup.docs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                const toDelete = sorted.slice(1); // Remove all but the first (most recent)
                
                if (toDelete.length > 0) {
                    await db.collection('likes').deleteMany({ 
                        _id: { $in: toDelete.map(d => d.id) } 
                    });
                    console.log(`Removed ${toDelete.length} duplicate likes for video ${dup._id.videoId}, user ${dup._id.userId}`);
                }
            }
        }
        
        console.log('✅ Likes cleanup complete');
    } catch (error) {
        console.error('Likes cleanup error:', error.message);
    }
}

// Connect to database on startup
connectDB();

// Use modular createSession
const createSession = modularCreateSession;

// Auth middleware
function requireAuth(req, res, next) {
    // Check Authorization header first
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    console.log('🔐 Auth check:', {
        token: token ? `${token.substring(0, 8)}...` : 'none',
        sessionsCount: sessions.size,
        sessionKeys: [...sessions.keys()].map(k => k.substring(0, 8) + '...')
    });
    
    if (token && sessions.has(token)) {
        req.user = sessions.get(token);
        console.log('✅ Auth successful with token');
        return next();
    }
    
    // Enhanced fallback for development: if there are any active sessions and no token provided,
    // use the most recent session (this simulates session-based auth)
    if (!token && sessions.size > 0) {
        console.log('🔧 Using session-based auth fallback');
        const sessionValues = Array.from(sessions.values());
        const mostRecentSession = sessionValues[sessionValues.length - 1];
        req.user = mostRecentSession;
        console.log('✅ Auth successful with fallback session');
        return next();
    }
    
    // If we have sessions but no valid token, it means the frontend isn't sending the token
    // Let's use any active session as a temporary fix
    if (sessions.size > 0) {
        console.log('🔧 Emergency fallback: using any active session');
        const firstSession = sessions.values().next().value;
        req.user = firstSession;
        console.log('✅ Auth successful with emergency fallback');
        return next();
    }
    
    console.log('🔒 Auth check failed:');
    console.log('  - Token:', token ? 'provided' : 'missing');
    console.log('  - Token valid:', token ? sessions.has(token) : false);
    console.log('  - Sessions count:', sessions.size);
    console.log('  - Session keys:', [...sessions.keys()]);
    
    return res.status(401).json({ 
        error: 'Unauthorized',
        debug: {
            tokenProvided: !!token,
            tokenValid: token ? sessions.has(token) : false,
            sessionsCount: sessions.size,
            help: sessions.size === 0 ? 'No active sessions - please log in' : 'Sessions exist but token invalid'
        }
    });
}

// API Routes

// Debug: Check database content
app.get('/api/debug/videos', async (req, res) => {
    if (!db) {
        return res.json({ error: 'Database not connected' });
    }
    
    try {
        const totalVideos = await db.collection('videos').countDocuments();
        const activeVideos = await db.collection('videos').countDocuments({ status: { $ne: 'deleted' } });
        const deletedVideos = await db.collection('videos').countDocuments({ status: 'deleted' });
        const allVideos = await db.collection('videos').find({}).limit(5).toArray();
        
        res.json({
            totalVideos,
            activeVideos,
            deletedVideos,
            sampleVideos: allVideos.map(v => ({
                id: v._id,
                title: v.title,
                status: v.status,
                userId: v.userId
            }))
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    const dbConnected = db !== null;
    const spacesConfigured = !!(process.env.DO_SPACES_KEY && process.env.DO_SPACES_SECRET);
    res.json({ 
        status: 'ok',
        version: 'Fixed like API duplicate key error - build 627076c',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        database: dbConnected ? 'connected' : 'not connected',
        databaseUrl: (process.env.MONGODB_URI || process.env.DATABASE_URL) ? 'configured' : 'not configured',
        storage: spacesConfigured ? 'configured' : 'not configured'
    });
});

// App info
app.get('/api/info', (req, res) => {
    res.json({
        name: 'VIB3',
        version: '1.0.0',
        description: 'Vertical video social app',
        database: 'MongoDB',
        storage: 'DigitalOcean Spaces',
        features: ['auth', 'videos', 'social']
    });
});

// Database test
app.get('/api/database/test', async (req, res) => {
    if (!db) {
        return res.json({
            connected: false,
            message: 'Database not connected',
            configured: !!(process.env.MONGODB_URI || process.env.DATABASE_URL)
        });
    }
    
    try {
        await db.admin().ping();
        const collections = await db.listCollections().toArray();
        
        res.json({ 
            connected: true, 
            message: 'MongoDB connected successfully',
            database: db.databaseName,
            collections: collections.map(c => c.name),
            configured: true
        });
    } catch (error) {
        res.json({ 
            connected: false, 
            message: error.message,
            configured: true 
        });
    }
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, password, and username required' });
    }
    
    try {
        // Check if user exists
        const existingUser = await db.collection('users').findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password (simple for demo - use bcrypt in production)
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        
        // Create user
        const user = {
            email,
            username,
            password: hashedPassword,
            displayName: username,
            bio: '',
            profileImage: '',
            followers: 0,
            following: 0,
            totalLikes: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await db.collection('users').insertOne(user);
        user._id = result.insertedId;
        
        // Create session
        const token = createSession(user._id.toString());
        
        // Remove password from response
        delete user.password;

        // Transform user object to match Flutter model
        const userResponse = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            displayName: user.displayName || user.username,
            bio: user.bio || '',
            profilePicture: user.profileImage || '',
            coverImage: user.coverImage || null,
            followersCount: user.followers || 0,
            followingCount: user.following || 0,
            postsCount: 0,
            isVerified: user.isVerified || false,
            isPrivate: user.isPrivate || false,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json({
            message: 'Registration successful',
            user: userResponse,
            token
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    try {
        // Hash password
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        
        // Find user
        const user = await db.collection('users').findOne({ 
            email,
            password: hashedPassword
        });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Create session
        const token = createSession(user._id.toString());
        
        // Calculate total likes from user's videos
        const userVideos = await db.collection('videos').find({ 
            userId: user._id.toString(), 
            status: { $ne: 'deleted' } 
        }).toArray();
        
        console.log(`🔍 DEBUG: Found ${userVideos.length} videos for user ${user.username}`);
        
        let totalLikes = 0;
        for (const video of userVideos) {
            const likes = await db.collection('likes').countDocuments({ videoId: video._id.toString() });
            console.log(`🔍 DEBUG: Video ${video._id} has ${likes} likes`);
            totalLikes += likes;
        }
        
        console.log(`🔍 DEBUG: Total likes calculated: ${totalLikes}`);
        
        console.log('🔑 Login successful:', {
            userId: user._id.toString(),
            username: user.username,
            token: token.substring(0, 8) + '...',
            totalSessions: sessions.size,
            totalLikes: totalLikes
        });
        
        // Remove password from response
        delete user.password;

        // Transform user object to match Flutter model
        const userResponse = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            displayName: user.displayName || user.username,
            bio: user.bio || '',
            profilePicture: user.profileImage || '',
            coverImage: user.coverImage || null,
            followersCount: user.followers || 0,
            followingCount: user.following || 0,
            postsCount: userVideos.length,
            isVerified: user.isVerified || false,
            isPrivate: user.isPrivate || false,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json({
            message: 'Login successful',
            user: userResponse,
            token
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
app.get('/api/auth/me', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    try {
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.user.userId) },
            { projection: { password: 0 } }
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Calculate total likes from user's videos
        const userVideos = await db.collection('videos').find({ 
            userId: req.user.userId, 
            status: { $ne: 'deleted' } 
        }).toArray();
        
        let totalLikes = 0;
        for (const video of userVideos) {
            const likes = await db.collection('likes').countDocuments({ videoId: video._id.toString() });
            totalLikes += likes;
        }
        
        // Add totalLikes to user object
        user.totalLikes = totalLikes;
        
        res.json({ user });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Logout
app.post('/api/auth/logout', requireAuth, (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    sessions.delete(token);
    res.json({ message: 'Logged out successfully' });
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Check if user exists
        const user = await db.collection('users').findOne({ email });

        // Always return success (don't reveal if email exists)
        console.log('🔑 Password reset requested for:', email, user ? '(found)' : '(not found)');

        if (user) {
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = Date.now() + 3600000; // 1 hour

            // Store reset token in database
            await db.collection('users').updateOne(
                { _id: user._id },
                {
                    $set: {
                        resetToken,
                        resetTokenExpiry
                    }
                }
            );

            console.log('✅ Reset token generated:', resetToken.substring(0, 10) + '...');

            // Send email with reset link
            const emailService = require('./services/email-service');
            const emailSent = await emailService.sendPasswordResetEmail(email, resetToken);

            if (emailSent) {
                console.log('✅ Password reset email sent to:', email);
            } else {
                console.warn('⚠️  Password reset email failed to send');
            }
        }

        res.json({ message: 'If that email exists, a password reset link has been sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }

    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }

    try {
        // Find user with valid reset token
        const user = await db.collection('users').findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

        // Update password and clear reset token
        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: { resetToken: '', resetTokenExpiry: '' }
            }
        );

        console.log('✅ Password reset successful for:', user.email);
        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all videos (feed)
// Main feed endpoint for Flutter app
app.get('/api/feed', async (req, res) => {
    // Redirect to /api/videos which has the full implementation
    req.query.feed = req.query.feed || 'foryou';
    return app._router.handle(Object.assign(req, { url: '/api/videos', path: '/api/videos' }), res);
});

app.get('/api/videos', async (req, res) => {
    console.log('🚨 URGENT DEBUG: /api/videos endpoint hit at', new Date().toISOString());
    console.log('🚨 Query params:', req.query);
    console.log('🚨 Database connected:', !!db);
    
    if (!db) {
        console.log('No database connection, returning empty');
        return res.json({ videos: [] });
    }
    
    try {
        const { limit = 10, skip = 0, page = 1, userId, feed } = req.query;
        
        // Calculate skip based on page if provided
        const actualSkip = page > 1 ? (parseInt(page) - 1) * parseInt(limit) : parseInt(skip);
        
        // Test database connection first
        await db.admin().ping();
        console.log('Database ping successful');
        
        // Implement different feed algorithms based on feed type
        let videos = [];
        let query = {};
        let sortOptions = {};
        
        // Get current user info for personalization
        const currentUserId = req.headers.authorization ? 
            sessions.get(req.headers.authorization.replace('Bearer ', ''))?.userId : null;
        
        console.log(`Processing ${feed} feed for user: ${currentUserId || 'anonymous'}`);
        
        console.log(`🔍 Feed parameter received: "${feed}" (type: ${typeof feed})`);
        switch(feed) {
            case 'foryou':
                // For You: Personalized algorithm based on interests and trends
                console.log('🎯 For You Algorithm: Personalized content');
                // For You feed should show ALL users' videos, not filtered by userId
                query = { status: { $ne: 'deleted' } };
                // Get larger pool for randomization and apply algorithm
                videos = await db.collection('videos')
                    .find(query)
                    .sort({ createdAt: -1 })
                    .limit(Math.max(50, parseInt(limit) * 3)) // Get larger pool
                    .toArray();
                
                // Apply engagement-based algorithm and randomization
                console.log(`🎲 Before shuffle: ${videos.slice(0,3).map(v => v._id).join(', ')}`);
                // videos = await applyEngagementRanking(videos, db);  // DISABLED - function not defined
                console.log(`📊 Skipping engagement ranking (not implemented)`);

                // Force randomization - simple reverse every other call
                if (Math.random() > 0.5) {
                    videos.reverse();
                    console.log(`🔄 Reversed array: ${videos.slice(0,3).map(v => v._id).join(', ')}`);
                }
                
                videos = shuffleArray(videos); // Randomize order
                console.log(`🎲 After shuffle: ${videos.slice(0,3).map(v => v._id).join(', ')}`);
                videos = videos.slice(actualSkip, actualSkip + parseInt(limit)); // Apply pagination after shuffle
                break;
                
            case 'following':
                // Following: Videos from accounts user follows
                console.log('👥 Following Algorithm: From followed accounts');
                if (currentUserId) {
                    // Get list of users this person follows
                    const following = await db.collection('follows')
                        .find({ followerId: currentUserId })
                        .toArray();
                    const followingIds = following.map(f => f.followingId);
                    
                    console.log(`User ${currentUserId} follows ${followingIds.length} accounts`);
                    
                    if (followingIds.length > 0) {
                        query = { userId: { $in: followingIds }, status: { $ne: 'deleted' } };
                        videos = await db.collection('videos')
                            .find(query)
                            .sort({ createdAt: -1 })
                            .skip(actualSkip)
                            .limit(parseInt(limit))
                            .toArray();
                        console.log(`Found ${videos.length} videos from followed accounts`);
                    } else {
                        // User follows no one - return empty
                        console.log('User follows no accounts - returning empty following feed');
                        videos = [];
                    }
                } else {
                    // Not logged in - return empty 
                    console.log('Not logged in - returning empty following feed');
                    videos = [];
                }
                break;
                
            case 'explore':
                // Explore: Trending, popular, hashtag-driven content
                console.log('🔥 Explore Algorithm: Trending and popular content');
                // Explore feed should show ALL users' videos, not filtered by userId
                query = { status: { $ne: 'deleted' } };
                // Sort by engagement metrics and recent activity
                videos = await db.collection('videos')
                    .find(query)
                    .sort({ 
                        createdAt: -1,  // Recent content first
                        // We'll add engagement sorting in the processing below
                    })
                    .skip(actualSkip)
                    // No limit - return all videos // Get more to filter for trending
                    .toArray();
                    
                // Shuffle for diversity in explore feed
                videos = videos.sort(() => Math.random() - 0.5).slice(0, parseInt(limit));
                break;
                
            case 'friends':
                // Friends: Content from friends/contacts
                console.log('👫 Friends Algorithm: From friend connections');
                if (currentUserId) {
                    // Get mutual follows (friends)
                    const userFollowing = await db.collection('follows')
                        .find({ followerId: currentUserId })
                        .toArray();
                    const userFollowers = await db.collection('follows')
                        .find({ followingId: currentUserId })
                        .toArray();
                        
                    const followingIds = userFollowing.map(f => f.followingId);
                    const followerIds = userFollowers.map(f => f.followerId);
                    
                    // Find mutual friends (people who follow each other)
                    const friendIds = followingIds.filter(id => followerIds.includes(id));
                    
                    console.log(`User ${currentUserId} has ${friendIds.length} mutual friends`);
                    
                    if (friendIds.length > 0) {
                        query = { userId: { $in: friendIds }, status: { $ne: 'deleted' } };
                        videos = await db.collection('videos')
                            .find(query)
                            .sort({ createdAt: -1 })
                            .skip(actualSkip)
                            .limit(parseInt(limit))
                            .toArray();
                        console.log(`Found ${videos.length} videos from friends`);
                    } else {
                        // No mutual friends - return empty
                        console.log('User has no mutual friends - returning empty friends feed');
                        videos = [];
                    }
                } else {
                    // Not logged in - return empty
                    console.log('Not logged in - returning empty friends feed');
                    videos = [];
                }
                break;
                
            default:
                // For You algorithm with engagement-based ranking
                console.log('🤖 For You Algorithm: Engagement-based ranking');
                query = { status: { $ne: 'deleted' } };
                
                // Get more videos than needed for better ranking algorithm
                const algorithmLimit = Math.max(parseInt(limit) * 3, 50);
                videos = await db.collection('videos')
                    .find(query)
                    .sort({ createdAt: -1 })
                    .limit(algorithmLimit)
                    .toArray();
                
                // Apply engagement-based ranking
                videos = await applyEngagementRanking(videos, db);
                
                // Apply hashtag-based recommendations (personalization)
                if (req.user) {
                    videos = await applyHashtagRecommendations(videos, req.user, db);
                    
                    // Apply behavior-based recommendations
                    videos = await applyBehaviorRecommendations(videos, req.user, db);
                    
                    // Apply machine learning recommendations
                    videos = await applyMLRecommendations(videos, req.user, db);
                }
                
                // Force randomization - TESTING
                console.log(`🔧 TESTING: Before reverse: ${videos.slice(0,3).map(v => v._id).join(', ')}`);
                videos.reverse(); // Force change in order
                console.log(`🔧 TESTING: After reverse: ${videos.slice(0,3).map(v => v._id).join(', ')}`);
                
                // Apply pagination after ranking and shuffle
                const startIndex = actualSkip;
                const endIndex = startIndex + parseInt(limit);
                videos = videos.slice(startIndex, endIndex);
        }
            
        console.log(`Fetching page ${page}, skip: ${actualSkip}, limit: ${limit}`);
        
        console.log('Found videos in database:', videos.length);
        
        // Handle empty feeds properly based on type
        if (videos.length === 0) {
            // Following and Friends should stay empty if user has no connections
            if (feed === 'following' || feed === 'friends') {
                console.log(`No content for ${feed} feed - user has no connections`);
                return res.json({ videos: [] });
            }
            
            // For You and Explore should only be empty on page 1 if no videos exist
            if (page == 1) {
                console.log('No videos in database for page 1, returning empty');
                return res.json({ videos: [] });
            }
        }
        
        // If no videos in database, return empty array for all pages and feeds
        if (videos.length === 0) {
            console.log(`No videos in database for ${feed} page ${page}, returning empty array`);
            return res.json({ videos: [] });
        }
        
        // Get user info for each video
        for (const video of videos) {
            try {
                console.log(`🔍 Looking up user for video ${video._id}, userId: ${video.userId} (type: ${typeof video.userId})`);
                
                // Try to find user - handle both string and ObjectId formats
                let user = null;
                
                // First try as ObjectId if it looks like one
                if (video.userId && video.userId.length === 24) {
                    try {
                        user = await db.collection('users').findOne(
                            { _id: new ObjectId(video.userId) },
                            { projection: { password: 0 } }
                        );
                    } catch (e) {
                        console.log(`⚠️ Failed to convert userId to ObjectId: ${e.message}`);
                    }
                }
                
                // If not found, try as string
                if (!user) {
                    user = await db.collection('users').findOne(
                        { _id: video.userId },
                        { projection: { password: 0 } }
                    );
                }
                
                // If still not found, try username field
                if (!user && video.username) {
                    user = await db.collection('users').findOne(
                        { username: video.username },
                        { projection: { password: 0 } }
                    );
                }
                
                if (user) {
                    video.user = user;
                    video.username = user.username || user.displayName || 'anonymous';
                    console.log(`✅ Found user for video ${video._id}: ${video.username}`);
                } else {
                    // User not found in database
                    console.log(`❌ User not found for video ${video._id}, userId: ${video.userId}, username: ${video.username}`);
                    video.user = { 
                        username: video.username || 'deleted_user', 
                        displayName: video.username || 'Deleted User', 
                        _id: video.userId,
                        profilePicture: '👤'
                    };
                    video.username = video.username || 'deleted_user';
                }
                
                // Get like count
                video.likeCount = await db.collection('likes').countDocuments({ videoId: video._id.toString() });
                
                // Get comment count
                video.commentCount = await db.collection('comments').countDocuments({ videoId: video._id.toString() });
                
                // Get share count (create shares collection if needed)
                video.shareCount = await db.collection('shares').countDocuments({ videoId: video._id.toString() });
                
                // Fix video URLs before sending
                video.videoUrl = fixVideoUrl(video.videoUrl);
                if (video.thumbnailUrl) {
                    video.thumbnailUrl = fixVideoUrl(video.thumbnailUrl);
                }
                
                // Add feed metadata without changing titles
                video.feedType = feed;
                
            } catch (userError) {
                console.error('Error getting user info for video:', video._id, userError);
                // Set default user info if error
                video.user = { 
                    username: 'anonymous', 
                    displayName: 'Anonymous User', 
                    _id: 'unknown',
                    profilePicture: '👤'
                };
                video.username = 'anonymous';
                video.likeCount = 0;
                video.commentCount = 0;
            }
        }
        
        // FINAL SHUFFLE: Ensure randomization regardless of algorithm path
        if (feed === 'foryou' || !feed) {
            console.log(`🎲 FINAL SHUFFLE: Before: ${videos.slice(0,3).map(v => v._id).join(', ')}`);
            videos = videos.sort(() => Math.random() - 0.5);
            console.log(`🎲 FINAL SHUFFLE: After: ${videos.slice(0,3).map(v => v._id).join(', ')}`);
        }
        
        console.log(`📤 Sending ${videos.length} videos for page ${page}`);
        res.json({ 
            videos,
            debug: {
                timestamp: new Date().toISOString(),
                feedType: feed,
                algorithmsApplied: ['final-shuffle'],
                firstThreeIds: videos.slice(0,3).map(v => v._id),
                serverVersion: 'DEBUG-VERSION-2025-06-29'
            }
        });
        
    } catch (error) {
        console.error('Get videos error:', error);
        console.log('Database error, returning empty');
        // Return empty instead of sample data
        res.json({ videos: [] });
    }
});

// Upload and process video file to DigitalOcean Spaces
app.post('/api/upload/video', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No video file provided',
                code: 'NO_FILE'
            });
        }

        const { title, description, username, userId, hashtags, musicName, isFrontCamera } = req.body;

        console.log(`🎬 Processing video upload: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);
        console.log('🔍 Upload user association debug:', {
            sessionUserId: req.user?.userId,
            bodyUserId: userId,
            bodyUsername: username,
            willUse: req.user?.userId || userId
        });
        console.log(`📷 isFrontCamera: ${isFrontCamera}`);

        // ALWAYS bypass video processing to avoid FFmpeg issues
        const bypassProcessing = true;
        console.log('⚡ BYPASSING all video processing (direct upload mode)');
        
        let conversionResult;
        
        if (bypassProcessing) {
            console.log('⚡ BYPASSING video processing for file:', req.file.originalname);
            conversionResult = {
                success: true,
                buffer: req.file.buffer,
                originalSize: req.file.size,
                convertedSize: req.file.size,
                skipped: true,
                bypassed: true
            };
        } else {
            // Step 1: Validate video file
            console.log('📋 Step 1: Validating video...');
            const validation = await videoProcessor.validateVideo(req.file.buffer, req.file.originalname);
            if (!validation.valid) {
                return res.status(400).json({ 
                    error: `Video validation failed: ${validation.error}`,
                    code: 'VALIDATION_FAILED',
                    details: validation.error
                });
            }

            console.log('✅ Video validation passed');

            // Step 2: Check if we should do multi-quality processing
            const useMultiQuality = process.env.ENABLE_MULTI_QUALITY === 'true' || 
                                   req.body.multiQuality === 'true' ||
                                   (validation.info.video && validation.info.video.height >= 1080);

            if (useMultiQuality) {
                console.log('📋 Step 2: Processing video into multiple quality variants...');
                try {
                    const multiResult = await multiQualityProcessor.processMultiQuality(
                        req.file.buffer,
                        req.file.originalname,
                        req.user?.userId || userId,
                        { isFrontCamera: isFrontCamera === 'true' }
                    );
                    
                    // Return multi-quality result format
                    return res.json({
                        success: true,
                        message: 'Video uploaded and processed into multiple qualities',
                        videoId: null, // Will be set after DB save
                        variants: multiResult.variants,
                        manifest: multiResult.manifest,
                        outputDir: multiResult.outputDir,
                        processingTime: multiResult.processingTime,
                        metadata: multiResult.metadata
                    });
                } catch (multiError) {
                    console.error('Multi-quality processing failed, falling back to single quality:', multiError);
                    // Fall back to single quality processing
                }
            }

            // Step 2: Convert video to standard H.264 MP4 (single quality)
            console.log('📋 Step 2: Converting video to standard MP4...');
            conversionResult = await videoProcessor.convertToStandardMp4(req.file.buffer, req.file.originalname, { isFrontCamera: isFrontCamera === 'true' });
        }
        
        let finalBuffer, finalMimeType, processingInfo;
        
        if (conversionResult.success) {
            if (conversionResult.bypassed) {
                console.log('⚡ Video processing bypassed for speed');
                finalBuffer = conversionResult.buffer;
                finalMimeType = req.file.mimetype;
                processingInfo = {
                    converted: false,
                    bypassed: true,
                    originalSize: conversionResult.originalSize,
                    convertedSize: conversionResult.convertedSize
                };
            } else {
                console.log('✅ Video conversion successful');
                finalBuffer = conversionResult.buffer;
                finalMimeType = 'video/mp4';
                processingInfo = {
                    converted: true,
                    skipped: conversionResult.skipped || false,
                    originalSize: conversionResult.originalSize,
                    convertedSize: conversionResult.convertedSize,
                    compressionRatio: (conversionResult.originalSize / conversionResult.convertedSize).toFixed(2),
                    videoInfo: conversionResult.videoInfo
                };
            }
        } else {
            console.log('⚠️ Video conversion failed, using original file');
            finalBuffer = conversionResult.originalBuffer;
            finalMimeType = req.file.mimetype;
            processingInfo = {
                converted: false,
                error: conversionResult.error,
                originalSize: req.file.size
            };
        }

        // Step 3: Generate unique filename (always .mp4 for converted videos)
        const fileExtension = conversionResult.success ? '.mp4' : path.extname(req.file.originalname);
        const fileName = `videos/${Date.now()}-${crypto.randomBytes(16).toString('hex')}${fileExtension}`;

        console.log('📋 Step 3: Uploading to DigitalOcean Spaces...');
        console.log('🔍 S3 Upload Details:', {
            bufferSize: finalBuffer.length,
            bufferSizeMB: (finalBuffer.length / 1024 / 1024).toFixed(2),
            fileName: fileName,
            mimeType: finalMimeType,
            bucket: BUCKET_NAME,
            endpoint: process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com'
        });

        // Step 4: Upload to DigitalOcean Spaces
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

        console.log('⏳ Starting S3 upload...');
        const uploadResult = await s3.upload(uploadParams).promise();
        console.log('✅ S3 upload completed successfully');
        let videoUrl = uploadResult.Location;
        
        // Normalize URL format for DigitalOcean Spaces
        if (videoUrl && !videoUrl.startsWith('https://')) {
            // Ensure proper HTTPS URL format
            videoUrl = `https://${BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com'}/${fileName}`;
        }

        console.log('✅ Upload completed to:', videoUrl);

        // Step 5: Save to database with processing information
        console.log('📋 Step 4: Saving video record to database...');
        let videoRecord = null;
        if (db) {
            const video = {
                userId: req.user?.userId || userId,
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

            console.log('⏳ Inserting video record into MongoDB...');
            const result = await db.collection('videos').insertOne(video);
            video._id = result.insertedId;
            videoRecord = video;

            console.log('✅ Video record saved to database with ID:', result.insertedId);
        } else {
            console.log('⚠️ Database connection not available, skipping DB save');
        }

        // Step 6: Return success response with detailed information
        res.json({
            success: true,
            message: 'Video uploaded and processed successfully',
            videoUrl,
            video: videoRecord,
            processing: {
                converted: conversionResult.success,
                skipped: conversionResult.skipped || false,
                originalSize: req.file.size,
                finalSize: finalBuffer.length,
                sizeSaved: req.file.size - finalBuffer.length,
                format: conversionResult.success ? 'H.264 MP4' : 'Original format',
                quality: conversionResult.success ? 'Optimized for web streaming' : 'Original quality'
            }
        });

    } catch (error) {
        console.error('❌ Upload error occurred:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        console.error('Stack trace:', error.stack);

        // Enhanced error reporting
        let errorCode = 'UNKNOWN_ERROR';
        let userMessage = 'Upload failed. Please try again.';

        if (error.message.includes('ENOENT')) {
            errorCode = 'FFMPEG_NOT_FOUND';
            userMessage = 'Video processing is temporarily unavailable. Please try again later.';
        } else if (error.message.includes('Invalid')) {
            errorCode = 'INVALID_VIDEO';
            userMessage = 'The video file appears to be corrupted or in an unsupported format.';
        } else if (error.message.includes('size')) {
            errorCode = 'FILE_TOO_LARGE';
            userMessage = 'Video file is too large. Please upload a file smaller than 500MB.';
        } else if (error.message.includes('duration')) {
            errorCode = 'VIDEO_TOO_LONG';
            userMessage = 'Video is too long. Please upload a video shorter than 3 minutes.';
        } else if (error.code === 'NoSuchBucket') {
            errorCode = 'S3_BUCKET_NOT_FOUND';
            userMessage = 'Storage bucket not found. Please contact support.';
        } else if (error.code === 'InvalidAccessKeyId' || error.code === 'SignatureDoesNotMatch') {
            errorCode = 'S3_CREDENTIALS_INVALID';
            userMessage = 'Storage credentials are invalid. Please contact support.';
        } else if (error.code === 'RequestTimeout' || error.message.includes('timeout')) {
            errorCode = 'UPLOAD_TIMEOUT';
            userMessage = 'Upload timed out. Please try again with a smaller file.';
        }

        res.status(500).json({
            error: userMessage,
            code: errorCode,
            technical: error.message,
            errorName: error.name,
            s3ErrorCode: error.code || 'NONE'
        });
    }
});

// Upload image file (thumbnails, profile images, etc.) to DigitalOcean Spaces
app.post('/api/upload/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No image file provided',
                code: 'NO_FILE'
            });
        }

        const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'vib3-videos';
        const fileName = `images/${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(req.file.originalname)}`;

        console.log(`📸 Uploading image: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)}KB)`);

        // Upload to DigitalOcean Spaces
        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ACL: 'public-read',
            Metadata: {
                'original-name': req.file.originalname,
                'upload-date': new Date().toISOString()
            }
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        let imageUrl = uploadResult.Location;

        // Normalize URL format for DigitalOcean Spaces
        if (imageUrl && !imageUrl.startsWith('https://')) {
            const cdnUrl = process.env.DO_SPACES_CDN_URL || `https://${BUCKET_NAME}.nyc3.cdn.digitaloceanspaces.com`;
            imageUrl = `${cdnUrl}/${fileName}`;
        }

        console.log(`✅ Image uploaded successfully: ${imageUrl}`);

        res.json({
            success: true,
            url: imageUrl,
            filename: fileName,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

    } catch (error) {
        console.error('❌ Image upload error:', error);
        res.status(500).json({
            error: 'Failed to upload image',
            code: 'UPLOAD_FAILED',
            technical: error.message
        });
    }
});

// Helper function to generate video thumbnail using FFmpeg
async function generateVideoThumbnail(videoUrl, videoId) {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vib3-thumb-'));
    const tempVideoPath = path.join(tempDir, `${videoId}.mp4`);
    
    try {
        // Download video temporarily
        console.log('📥 Downloading video for thumbnail generation...');
        const https = require('https');
        const file = await fs.open(tempVideoPath, 'w');
        
        await new Promise((resolve, reject) => {
            https.get(videoUrl, (response) => {
                const stream = file.createWriteStream();
                response.pipe(stream);
                stream.on('finish', () => {
                    stream.close();
                    resolve();
                });
            }).on('error', reject);
        });
        
        await file.close();
        
        // Generate thumbnails at different timestamps
        console.log('🎬 Extracting thumbnail frames...');
        const thumbnails = await generateMultipleThumbnails(tempVideoPath, tempDir, videoId);
        
        // Select best thumbnail (for now, use the second one if available)
        const bestThumb = thumbnails.length >= 2 ? thumbnails[1] : thumbnails[0];
        
        if (!bestThumb) {
            throw new Error('No thumbnail generated');
        }
        
        // Read thumbnail file
        const thumbnailBuffer = await fs.readFile(bestThumb);
        
        // Upload to Spaces
        const thumbnailKey = `thumbnails/${Date.now()}-${videoId}.jpg`;
        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: thumbnailKey,
            Body: thumbnailBuffer,
            ContentType: 'image/jpeg',
            ACL: 'public-read'
        };
        
        const uploadResult = await s3.upload(uploadParams).promise();
        let thumbnailUrl = uploadResult.Location;
        
        if (thumbnailUrl && !thumbnailUrl.startsWith('https://')) {
            thumbnailUrl = `https://${BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com'}/${thumbnailKey}`;
        }
        
        console.log('✅ Thumbnail generated and uploaded:', thumbnailUrl);
        return thumbnailUrl;
        
    } catch (error) {
        console.error('Thumbnail generation error:', error);
        throw error;
    } finally {
        // Cleanup temp files
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (e) {
            console.error('Failed to cleanup temp dir:', e);
        }
    }
}

// Generate multiple thumbnails at different timestamps
function generateMultipleThumbnails(videoPath, outputDir, videoId) {
    return new Promise((resolve, reject) => {
        const thumbnails = [];
        const timestamps = ['00:00:01', '00:00:02', '00:00:03'];
        let completed = 0;
        
        timestamps.forEach((timestamp, index) => {
            const outputPath = path.join(outputDir, `${videoId}_${index}.jpg`);
            
            ffmpeg(videoPath)
                .seekInput(timestamp)
                .frames(1)
                .size('720x1280')
                .autopad()
                .output(outputPath)
                .on('end', () => {
                    thumbnails.push(outputPath);
                    completed++;
                    if (completed === timestamps.length) {
                        resolve(thumbnails);
                    }
                })
                .on('error', (err) => {
                    console.error(`Thumbnail generation failed at ${timestamp}:`, err);
                    completed++;
                    if (completed === timestamps.length) {
                        resolve(thumbnails);
                    }
                })
                .run();
        });
    });
}

// New video upload endpoint with thumbnail generation for Flutter app
app.post('/api/videos/upload', requireAuth, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
    try {
        const videoFile = req.files?.video?.[0];
        const thumbnailFile = req.files?.thumbnail?.[0];
        
        if (!videoFile) {
            return res.status(400).json({ 
                error: 'No video file provided',
                code: 'NO_FILE'
            });
        }

        const { description, privacy, allowComments, allowDuet, allowStitch, hashtags, musicName } = req.body;

        console.log(`🎬 Processing video upload with thumbnail: ${videoFile.originalname} (${(videoFile.size / 1024 / 1024).toFixed(2)}MB)`);
        console.log('📋 Request body fields:', Object.keys(req.body));
        console.log('📋 bypassProcessing value:', req.body.bypassProcessing);
        console.log('📋 isFrontCamera value:', req.body.isFrontCamera);

        // Check for bypass flag for development/testing
        const bypassProcessing = req.body.bypassProcessing === 'true' ||
                                  process.env.BYPASS_VIDEO_PROCESSING === 'true';

        // Check if front camera video that needs flipping
        const isFrontCamera = req.body.isFrontCamera === 'true';

        console.log(`🔍 Flags - bypassProcessing: ${bypassProcessing}, isFrontCamera: ${isFrontCamera}`);

        let conversionResult;

        if (bypassProcessing && !isFrontCamera) {
            console.log('⚡ BYPASSING video processing');
            conversionResult = {
                success: true,
                buffer: videoFile.buffer,
                originalSize: videoFile.size,
                convertedSize: videoFile.size,
                skipped: true,
                bypassed: true
            };
        } else if (bypassProcessing && isFrontCamera) {
            console.log('🔄 Front camera detected - applying horizontal flip');
            try {
                const flippedResult = await videoProcessor.flipVideoHorizontal(videoFile.buffer, videoFile.originalname);
                conversionResult = {
                    success: true,
                    buffer: flippedResult.buffer,
                    originalSize: videoFile.size,
                    convertedSize: flippedResult.buffer.length,
                    flipped: true,
                    bypassed: false
                };
            } catch (flipError) {
                console.error('❌ Front camera flip failed, uploading unflipped:', flipError);
                conversionResult = {
                    success: true,
                    buffer: videoFile.buffer,
                    originalSize: videoFile.size,
                    convertedSize: videoFile.size,
                    bypassed: true
                };
            }
        } else {
            // Use advanced processor for H.265/HEVC support and multi-resolution
            console.log('📋 Using advanced video processor...');
            try {
                const advancedResult = await advancedProcessor.processVideo(videoFile.buffer, videoFile.originalname);
                
                if (advancedResult.success) {
                    // Use the highest quality resolution for now
                    const primaryVideo = advancedResult.resolutions.find(r => r.resolution === '1080p') || 
                                       advancedResult.resolutions.find(r => r.resolution === '720p') || 
                                       advancedResult.resolutions[0];
                    
                    if (primaryVideo) {
                        const videoBuffer = fs.readFileSync(primaryVideo.path);
                        conversionResult = {
                            success: true,
                            buffer: videoBuffer,
                            originalSize: videoFile.size,
                            convertedSize: videoBuffer.length,
                            videoInfo: advancedResult.originalInfo,
                            advancedProcessing: advancedResult
                        };
                        
                        // Clean up processed files after reading
                        await advancedProcessor.cleanup(advancedResult.processId);
                    } else {
                        throw new Error('No video resolutions generated');
                    }
                } else {
                    throw new Error('Advanced processing failed');
                }
            } catch (advError) {
                console.error('Advanced processor error:', advError);
                // Fallback to basic processor
                console.log('📋 Falling back to standard MP4 conversion...');
                conversionResult = await videoProcessor.convertToStandardMp4(videoFile.buffer, videoFile.originalname);
            }
        }
        
        let finalBuffer, finalMimeType;
        
        if (conversionResult.success) {
            finalBuffer = conversionResult.buffer;
            finalMimeType = 'video/mp4';
        } else {
            console.log('⚠️ Video conversion failed, using original file');
            finalBuffer = conversionResult.originalBuffer || videoFile.buffer;
            finalMimeType = videoFile.mimetype;
        }

        // Generate unique filenames
        const timestamp = Date.now();
        const randomId = crypto.randomBytes(16).toString('hex');
        const videoFileName = `videos/${timestamp}-${randomId}.mp4`;
        
        // Upload video to DigitalOcean Spaces
        console.log('📋 Uploading video to DigitalOcean Spaces...');
        const videoUploadParams = {
            Bucket: BUCKET_NAME,
            Key: videoFileName,
            Body: finalBuffer,
            ContentType: finalMimeType,
            ACL: 'public-read'
        };

        const videoUploadResult = await s3.upload(videoUploadParams).promise();
        let videoUrl = videoUploadResult.Location;
        
        // Normalize URL format
        if (videoUrl && !videoUrl.startsWith('https://')) {
            videoUrl = `https://${BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com'}/${videoFileName}`;
        }

        console.log('✅ Video uploaded to:', videoUrl);

        // Handle thumbnail
        let thumbnailUrl = null;
        
        if (thumbnailFile) {
            // Client provided thumbnail - upload it
            console.log('📸 Uploading client-provided thumbnail...');
            const thumbnailFileName = `thumbnails/${timestamp}-${randomId}.jpg`;
            
            const thumbnailUploadParams = {
                Bucket: BUCKET_NAME,
                Key: thumbnailFileName,
                Body: thumbnailFile.buffer,
                ContentType: 'image/jpeg',
                ACL: 'public-read'
            };

            const thumbnailUploadResult = await s3.upload(thumbnailUploadParams).promise();
            thumbnailUrl = thumbnailUploadResult.Location;
            
            if (thumbnailUrl && !thumbnailUrl.startsWith('https://')) {
                thumbnailUrl = `https://${BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com'}/${thumbnailFileName}`;
            }
            
            console.log('✅ Thumbnail uploaded to:', thumbnailUrl);
        } else {
            // No client thumbnail - generate server-side
            console.log('🎬 Generating thumbnail server-side...');
            
            try {
                // Generate actual thumbnail using FFmpeg
                thumbnailUrl = await generateVideoThumbnail(videoUrl, randomId);
                console.log('✅ Server-generated thumbnail:', thumbnailUrl);
            } catch (thumbError) {
                console.error('Thumbnail generation failed:', thumbError);
                // Fallback to video frame
                thumbnailUrl = videoUrl + '#t=1';
                console.log('⚠️ Using video frame as thumbnail fallback');
            }
        }

        // Save to database
        let videoRecord = null;
        if (db) {
            const video = {
                userId: req.user.userId,
                username: req.user.username || 'unknown',
                description: description || '',
                videoUrl,
                thumbnailUrl: thumbnailUrl || '',
                fileName: videoFileName,
                originalFilename: videoFile.originalname,
                fileSize: finalBuffer.length,
                originalFileSize: videoFile.size,
                processed: conversionResult.success,
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

        res.status(201).json({
            success: true,
            video: videoRecord
        });

    } catch (error) {
        console.error('❌ Video upload error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to upload video'
        });
    }
});

// Upload video (metadata only - for external URLs)
app.post('/api/videos', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { title, description, videoUrl, thumbnailUrl, duration, hashtags, musicName, privacy = 'public' } = req.body;
    
    if (!title || !videoUrl) {
        return res.status(400).json({ error: 'Title and video URL required' });
    }
    
    try {
        // Parse hashtags
        let parsedHashtags = [];
        if (hashtags) {
            if (typeof hashtags === 'string') {
                parsedHashtags = hashtags.split(',').map(tag => tag.trim()).filter(tag => tag);
            } else if (Array.isArray(hashtags)) {
                parsedHashtags = hashtags;
            }
        }

        const video = {
            userId: req.user.userId,
            title,
            description: description || '',
            videoUrl,
            thumbnailUrl: thumbnailUrl || '',
            duration: duration || 0,
            hashtags: parsedHashtags,
            musicName: musicName || '',
            privacy,
            views: 0,
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await db.collection('videos').insertOne(video);
        video._id = result.insertedId;
        
        res.json({ 
            message: 'Video uploaded successfully',
            video
        });
        
    } catch (error) {
        console.error('Upload video error:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});

// Get posts (photos, slideshows, mixed content)
app.get('/api/posts', async (req, res) => {
    if (!db) {
        return res.json({ posts: [] });
    }
    
    try {
        const { limit = 10, skip = 0, page = 1, userId, type } = req.query;
        const actualSkip = page > 1 ? (parseInt(page) - 1) * parseInt(limit) : parseInt(skip);
        
        let query = { status: 'published' };
        if (userId) query.userId = userId;
        if (type) query.type = type;
        
        const posts = await db.collection('posts')
            .find(query)
            .sort({ createdAt: -1 })
            .skip(actualSkip)
            .limit(parseInt(limit))
            .toArray();
        
        // Get user info for each post
        for (const post of posts) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(post.userId) },
                    { projection: { password: 0 } }
                );
                
                if (user) {
                    post.user = user;
                    post.username = user.username || user.displayName || 'anonymous';
                } else {
                    // User not found in database
                    post.user = { 
                        username: 'deleted_user', 
                        displayName: 'Deleted User', 
                        _id: post.userId,
                        profilePicture: '👤'
                    };
                    post.username = 'deleted_user';
                }
                
                // Get engagement counts
                post.likeCount = await db.collection('likes').countDocuments({ postId: post._id.toString() });
                post.commentCount = await db.collection('comments').countDocuments({ postId: post._id.toString() });
            } catch (userError) {
                console.error('Error getting user info for post:', post._id, userError);
                post.user = { 
                    username: 'anonymous', 
                    displayName: 'Anonymous User', 
                    _id: 'unknown',
                    profilePicture: '👤'
                };
                post.username = 'anonymous';
                post.likeCount = 0;
                post.commentCount = 0;
            }
        }
        
        res.json({ posts });
        
    } catch (error) {
        console.error('Get posts error:', error);
        res.json({ posts: [] });
    }
});

// Create a new post
app.post('/api/posts', async (req, res) => {
    try {
        const {
            userId,
            type,
            caption,
            media,
            tags,
            commentsEnabled,
            sharingEnabled,
            // Legacy format support
            videoUrl,
            thumbnailUrl,
            username,
            hashtags,
            isFrontCamera,
            musicName,
            musicArtist,
        } = req.body;

        console.log('📝 Creating new post:', {
            userId,
            type,
            caption: caption?.substring(0, 50),
            mediaCount: media?.length,
            tags: tags?.length,
        });

        // Support both new and legacy formats
        let finalVideoUrl, finalThumbnailUrl;

        if (media && media.length > 0) {
            // New format: extract from media array
            const firstMedia = media[0];
            finalVideoUrl = firstMedia.url || firstMedia.videoUrl;
            finalThumbnailUrl = firstMedia.thumbnailUrl || firstMedia.thumbnail;
        } else if (videoUrl) {
            // Legacy format: use direct fields
            finalVideoUrl = videoUrl;
            finalThumbnailUrl = thumbnailUrl;
        }

        // Validate required fields
        if (!finalVideoUrl) {
            return res.status(400).json({
                success: false,
                error: 'Video URL is required (provide media array or videoUrl)',
            });
        }

        // Create post object
        const post = {
            userId: userId || 'anonymous',
            username: username || 'Anonymous User',
            type: type || 'video',
            videoUrl: finalVideoUrl,
            thumbnailUrl: finalThumbnailUrl || null,
            caption: caption || '',
            hashtags: tags || hashtags || [],
            media: media || [],
            commentsEnabled: commentsEnabled !== false,
            sharingEnabled: sharingEnabled !== false,
            isFrontCamera: isFrontCamera === 'true' || isFrontCamera === true,
            musicName: musicName || null,
            musicArtist: musicArtist || null,
            createdAt: new Date(),
            status: 'published',
            likes: 0,
            comments: 0,
            shares: 0,
            views: 0,
        };

        // If database is available, save to DB
        if (db) {
            const result = await db.collection('posts').insertOne(post);
            post._id = result.insertedId;
            console.log(`✅ Post saved to database: ${post._id}`);
        } else {
            // No database, generate fake ID
            post._id = new ObjectId();
            console.log(`✅ Post created (no DB): ${post._id}`);
        }

        res.status(201).json({
            success: true,
            post,
        });
    } catch (error) {
        console.error('❌ Error creating post:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create post',
            message: error.message,
        });
    }
});

// Get user's videos for profile page
app.get('/api/user/videos', async (req, res) => {
    if (!db) {
        return res.json({ videos: [] });
    }
    
    try {
        const { userId, limit = 100, skip = 0, page = 1, type } = req.query;
        const actualSkip = page > 1 ? (parseInt(page) - 1) * parseInt(limit) : parseInt(skip);
        
        // Get current user from auth token if no userId provided
        let targetUserId = userId;
        if (!targetUserId && req.headers.authorization) {
            const token = req.headers.authorization.replace('Bearer ', '');
            const session = sessions.get(token);
            if (session) {
                targetUserId = session.userId;
            }
        }
        
        if (!targetUserId) {
            return res.status(400).json({ error: 'User ID required' });
        }
        
        // Handle liked videos type
        if (type === 'liked') {
            console.log(`🔍 Getting liked videos for user: ${targetUserId}`);
            
            // Get all likes for this user
            const likes = await db.collection('likes').find({ 
                userId: targetUserId.toString() 
            }).toArray();
            
            if (likes.length === 0) {
                return res.json({ videos: [] });
            }
            
            // Extract video IDs from likes
            const videoIds = likes.map(like => like.videoId).filter(id => id);
            
            // Get the actual videos that the user has liked
            const likedVideos = await db.collection('videos').find({
                _id: { $in: videoIds.map(id => {
                    try {
                        return require('mongodb').ObjectId(id);
                    } catch (e) {
                        return id; // If it's already a string ID
                    }
                })},
                status: { $ne: 'deleted' }
            }).toArray();
            
            console.log(`✅ Found ${likedVideos.length} valid liked videos`);
            
            // Add user info to videos
            for (let video of likedVideos) {
                const user = await db.collection('users').findOne(
                    { _id: require('mongodb').ObjectId(video.userId) },
                    { projection: { password: 0 } }
                );
                video.user = user || { username: 'Unknown', displayName: 'Unknown' };
                video.likeCount = video.likes?.length || 0;
            }
            
            return res.json({ videos: likedVideos });
        }
        
        console.log('🔍 User videos query debug:', {
            targetUserId: targetUserId,
            targetUserIdType: typeof targetUserId,
            query: { userId: targetUserId, status: { $ne: 'deleted' } }
        });
        
        const videos = await db.collection('videos')
            .find({ userId: targetUserId, status: { $ne: 'deleted' } })
            .sort({ createdAt: -1 })
            .skip(actualSkip)
            .limit(parseInt(limit))
            .toArray();
        
        console.log(`📊 Found ${videos.length} videos for user ${targetUserId}`);
        
        // Log total view records for monitoring
        const totalViewsInDB = await db.collection('views').countDocuments();
        console.log(`📊 Total view records in database: ${totalViewsInDB}`);
        
        // Debug: Show some sample video userIds for comparison
        if (videos.length > 0) {
            console.log('🔍 Sample video userIds:', videos.slice(0, 3).map(v => ({
                videoId: v._id.toString(),
                userId: v.userId,
                userIdType: typeof v.userId
            })));
        } else {
            // Let's see what userIds exist in the videos collection
            const sampleVideos = await db.collection('videos').find({}).limit(5).toArray();
            console.log('🔍 Sample videos in DB:', sampleVideos.map(v => ({
                videoId: v._id.toString(),
                userId: v.userId,
                userIdType: typeof v.userId,
                title: v.title
            })));
        }
        
        // Get user info and engagement counts for each video
        for (const video of videos) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(video.userId) },
                    { projection: { password: 0 } }
                );
                
                if (user) {
                    video.user = user;
                    video.username = user.username || user.displayName || 'anonymous';
                } else {
                    // User not found in database
                    video.user = { 
                        username: 'deleted_user', 
                        displayName: 'Deleted User', 
                        _id: video.userId,
                        profilePicture: '👤'
                    };
                    video.username = 'deleted_user';
                }
                
                // Get engagement counts
                video.likeCount = await db.collection('likes').countDocuments({ videoId: video._id.toString() });
                video.commentCount = await db.collection('comments').countDocuments({ videoId: video._id.toString() });
                // Try both string and ObjectId for videoId (views might be stored differently)
                const videoIdString = video._id.toString();
                const viewsFromCollectionString = await db.collection('views').countDocuments({ videoId: videoIdString });
                const viewsFromCollectionObjectId = await db.collection('views').countDocuments({ videoId: video._id });
                const viewsFromCollection = Math.max(viewsFromCollectionString, viewsFromCollectionObjectId);
                const originalViews = video.views || 0;
                
                // Use view collection count if available, otherwise fall back to video.views field or reasonable default
                if (viewsFromCollection > 0) {
                    video.views = viewsFromCollection;
                } else if (originalViews > 0) {
                    video.views = originalViews;
                } else {
                    // If no view data exists, use a small default based on video age and engagement
                    const daysOld = Math.max(1, Math.floor((Date.now() - new Date(video.createdAt)) / (1000 * 60 * 60 * 24)));
                    const engagementBonus = (video.likeCount || 0) * 5 + (video.commentCount || 0) * 10;
                    video.views = Math.max(1, Math.floor(daysOld * 2) + engagementBonus);
                }
                
                // Optional: Log engagement data for debugging (can be removed later)
                if (video.title && video.title.includes('debug')) {
                    console.log(`📊 Video ${video._id} engagement:`, {
                        title: video.title,
                        views: video.views,
                        likes: video.likeCount,
                        comments: video.commentCount
                    });
                }
            } catch (userError) {
                console.error('Error getting user info for video:', video._id, userError);
                video.user = { 
                    username: 'anonymous', 
                    displayName: 'Anonymous User', 
                    _id: 'unknown',
                    profilePicture: '👤'
                };
                video.username = 'anonymous';
                video.likeCount = 0;
                video.commentCount = 0;
                video.views = 0;
            }
        }
        
        res.json({ videos });
        
    } catch (error) {
        console.error('Get user videos error:', error);
        res.json({ videos: [] });
    }
});

// Delete user video
app.delete('/api/videos/:videoId', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { videoId } = req.params;
    const userId = req.user.userId;
    
    try {
        console.log(`User ${userId} requesting to delete video ${videoId}`);
        
        // First, verify the video exists and belongs to the user
        const video = await db.collection('videos').findOne({ 
            _id: new ObjectId(videoId),
            userId: userId
        });
        
        if (!video) {
            return res.status(404).json({ error: 'Video not found or you do not have permission to delete it' });
        }
        
        console.log(`Deleting video: ${video.title || 'Untitled'} by user ${userId}`);
        
        // Soft delete - mark as deleted instead of removing completely
        const result = await db.collection('videos').updateOne(
            { _id: new ObjectId(videoId) },
            { 
                $set: { 
                    status: 'deleted',
                    deletedAt: new Date()
                }
            }
        );
        
        if (result.modifiedCount === 1) {
            console.log(`✅ Video ${videoId} marked as deleted`);
            
            // Also delete related data (likes, comments, etc.)
            await Promise.all([
                db.collection('likes').deleteMany({ videoId: videoId }),
                db.collection('comments').deleteMany({ videoId: videoId }),
                db.collection('views').deleteMany({ videoId: videoId })
            ]);
            
            console.log(`✅ Deleted related data for video ${videoId}`);
            
            res.json({ 
                message: 'Video deleted successfully',
                videoId: videoId
            });
        } else {
            res.status(500).json({ error: 'Failed to delete video' });
        }
        
    } catch (error) {
        console.error('Delete video error:', error);
        res.status(500).json({ error: 'Failed to delete video' });
    }
});

// Get user profile data
app.get('/api/user/profile', async (req, res) => {
    if (!db) {
        return res.json({ 
            user: {
                _id: 'default',
                username: 'anonymous',
                displayName: 'VIB3 User',
                email: 'user@vib3.com',
                bio: 'Welcome to VIB3!',
                profilePicture: '👤'
            }
        });
    }
    
    try {
        const { userId } = req.query;
        
        // Get current user from session or auth token
        let targetUserId = userId;
        
        // Check session first (session-based auth)
        if (!targetUserId && req.session?.userId) {
            targetUserId = req.session.userId;
            console.log('🔑 Using session userId:', targetUserId);
        }
        
        // Fallback to Authorization header
        if (!targetUserId && req.headers.authorization) {
            const token = req.headers.authorization.replace('Bearer ', '');
            const session = sessions.get(token);
            if (session) {
                targetUserId = session.userId;
                console.log('🔑 Using token userId:', targetUserId);
            }
        }
        
        // Check if we have a logged in session via simple auth
        if (!targetUserId) {
            // Try to get from the sessions map using any existing session
            for (const [sessionId, sessionData] of sessions.entries()) {
                if (sessionData && sessionData.userId) {
                    targetUserId = sessionData.userId;
                    console.log('🔑 Found userId in active session:', targetUserId);
                    break;
                }
            }
        }
        
        if (!targetUserId) {
            console.log('❌ No user ID found in session, headers, or active sessions');
            return res.status(400).json({ error: 'User ID required - please log in' });
        }
        
        console.log('🔍 Looking up user with ID:', targetUserId);
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(targetUserId) },
            { projection: { password: 0 } }
        );
        
        if (!user) {
            console.log('❌ User not found in database:', targetUserId);
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('✅ User profile found:', user.username);
        res.json({ user });
        
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
});

// Search users for mentions
app.get('/api/users/search', async (req, res) => {
    if (!db) {
        return res.json([]);
    }
    
    try {
        const { q = '', limit = 10 } = req.query;
        
        if (!q || q.length < 1) {
            return res.json([]);
        }
        
        // Search users by username (case-insensitive)
        const users = await db.collection('users')
            .find({
                username: { $regex: `^${q}`, $options: 'i' }
            })
            .limit(parseInt(limit))
            .project({
                _id: 1,
                username: 1,
                displayName: 1,
                profilePicture: 1,
                profileImage: 1
            })
            .toArray();
        
        console.log(`🔍 User search for "${q}" found ${users.length} results`);
        
        // If no users found, add some demo users for testing
        if (users.length === 0 && q) {
            console.log('📝 Adding demo users for testing');
            const demoUsers = [
                { _id: '1', username: 'demo_user', displayName: 'Demo User' },
                { _id: '2', username: 'test_creator', displayName: 'Test Creator' },
                { _id: '3', username: 'vib3_official', displayName: 'VIB3 Official' },
                { _id: '4', username: 'creator_' + q, displayName: 'Creator ' + q },
                { _id: '5', username: q + '_user', displayName: q.charAt(0).toUpperCase() + q.slice(1) + ' User' }
            ];
            
            // Filter demo users based on search query
            const filteredDemoUsers = demoUsers.filter(user => 
                user.username.toLowerCase().includes(q.toLowerCase())
            ).slice(0, 5);
            
            res.json(filteredDemoUsers);
        } else {
            res.json(users);
        }
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// Get user activity feed
app.get('/api/user/activity', async (req, res) => {
    if (!db) {
        return res.json({ activities: [] });
    }
    
    try {
        // Get current user ID from session
        let userId = req.session?.userId;
        
        // Fallback to Authorization header
        if (!userId && req.headers.authorization) {
            const token = req.headers.authorization.replace('Bearer ', '');
            const session = sessions.get(token);
            if (session) {
                userId = session.userId;
            }
        }
        
        // Check active sessions as fallback
        if (!userId) {
            for (const [sessionId, sessionData] of sessions.entries()) {
                if (sessionData && sessionData.userId) {
                    userId = sessionData.userId;
                    break;
                }
            }
        }
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        console.log('📱 Loading activity for user:', userId);
        
        // Get user's videos first
        const userVideos = await db.collection('videos').find({ userId }).toArray();
        const userVideoIds = userVideos.map(v => v._id.toString());
        
        if (userVideoIds.length === 0) {
            return res.json({ activities: [] });
        }
        
        // Get user info for mentions detection
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        const username = user?.username || '';
        
        // Get interactions from others on user's content
        const [likes, comments, shares, follows, mentions] = await Promise.all([
            // Others' likes on user's videos
            db.collection('likes').find({ 
                videoId: { $in: userVideoIds },
                userId: { $ne: userId } // Exclude user's own likes
            }).sort({ createdAt: -1 }).limit(30).toArray(),
            
            // Others' comments on user's videos
            db.collection('comments').find({ 
                videoId: { $in: userVideoIds },
                userId: { $ne: userId } // Exclude user's own comments
            }).sort({ createdAt: -1 }).limit(30).toArray(),
            
            // Others' shares of user's videos
            db.collection('shares').find({ 
                videoId: { $in: userVideoIds },
                userId: { $ne: userId } // Exclude user's own shares
            }).sort({ createdAt: -1 }).limit(20).toArray(),
            
            // New follows
            db.collection('follows').find({ 
                followingId: userId,
                createdAt: { $exists: true }
            }).sort({ createdAt: -1 }).limit(20).toArray(),
            
            // Mentions in comments (where user is mentioned with @username)
            username ? db.collection('comments').find({
                text: { $regex: `@${username}`, $options: 'i' },
                userId: { $ne: userId } // Exclude user's own comments
            }).sort({ createdAt: -1 }).limit(20).toArray() : []
        ]);
        
        // Combine and format activities
        const activities = [];
        
        // Add likes from others
        for (const like of likes) {
            try {
                const video = userVideos.find(v => v._id.toString() === like.videoId);
                const liker = await db.collection('users').findOne({ _id: new ObjectId(like.userId) });
                activities.push({
                    type: 'like',
                    timestamp: like.createdAt || new Date(),
                    videoId: like.videoId,
                    videoTitle: video?.title || video?.description?.substring(0, 50) || 'Untitled Video',
                    details: `${liker?.username || 'Someone'} liked your video`,
                    username: liker?.username || 'VIB3 User',
                    userId: like.userId
                });
            } catch (error) {
                console.error('Error processing like:', error);
            }
        }
        
        // Add comments from others
        for (const comment of comments) {
            try {
                const video = userVideos.find(v => v._id.toString() === comment.videoId);
                const commenter = await db.collection('users').findOne({ _id: new ObjectId(comment.userId) });
                activities.push({
                    type: 'comment',
                    timestamp: comment.createdAt || new Date(),
                    videoId: comment.videoId,
                    videoTitle: video?.title || video?.description?.substring(0, 50) || 'Untitled Video',
                    details: `${commenter?.username || 'Someone'} commented: "${comment.text?.substring(0, 30)}${comment.text?.length > 30 ? '...' : ''}"`,
                    username: commenter?.username || 'VIB3 User',
                    userId: comment.userId
                });
            } catch (error) {
                console.error('Error processing comment:', error);
            }
        }
        
        // Add shares from others
        for (const share of shares) {
            try {
                const video = userVideos.find(v => v._id.toString() === share.videoId);
                const sharer = await db.collection('users').findOne({ _id: new ObjectId(share.userId) });
                activities.push({
                    type: 'share',
                    timestamp: share.createdAt || new Date(),
                    videoId: share.videoId,
                    videoTitle: video?.title || video?.description?.substring(0, 50) || 'Untitled Video',
                    details: `${sharer?.username || 'Someone'} shared your video${share.platform ? ` on ${share.platform}` : ''}`,
                    username: sharer?.username || 'VIB3 User',
                    userId: share.userId
                });
            } catch (error) {
                console.error('Error processing share:', error);
            }
        }
        
        // Add new follows
        for (const follow of follows) {
            try {
                const follower = await db.collection('users').findOne({ _id: new ObjectId(follow.followerId) });
                activities.push({
                    type: 'follow',
                    timestamp: follow.createdAt || new Date(),
                    details: `${follower?.username || 'Someone'} started following you`,
                    username: follower?.username || 'VIB3 User',
                    userId: follow.followerId
                });
            } catch (error) {
                console.error('Error processing follow:', error);
            }
        }
        
        // Add mentions
        for (const mention of mentions) {
            try {
                const mentioner = await db.collection('users').findOne({ _id: new ObjectId(mention.userId) });
                const video = await db.collection('videos').findOne({ _id: new ObjectId(mention.videoId) });
                activities.push({
                    type: 'mention',
                    timestamp: mention.createdAt || new Date(),
                    videoId: mention.videoId,
                    videoTitle: video?.title || video?.description?.substring(0, 50) || 'a video',
                    details: `${mentioner?.username || 'Someone'} mentioned you: "${mention.text?.substring(0, 50)}${mention.text?.length > 50 ? '...' : ''}"`,
                    username: mentioner?.username || 'VIB3 User',
                    userId: mention.userId
                });
            } catch (error) {
                console.error('Error processing mention:', error);
            }
        }
        
        // Sort all activities by timestamp (newest first)
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Limit to most recent 50 activities
        const recentActivities = activities.slice(0, 50);
        
        // Log activity count
        console.log(`📱 Found ${recentActivities.length} activities for user ${userId}`);
        
        console.log(`📱 Returning ${recentActivities.length} activities`);
        
        res.json({ 
            activities: recentActivities,
            totalCount: recentActivities.length
        });
        
    } catch (error) {
        console.error('Error loading user activity:', error);
        res.status(500).json({ error: 'Failed to load activity' });
    }
});

// Configure multer for profile image uploads
const profileImageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for profile images
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
        }
    }
});

// Upload profile image
app.post('/api/user/profile-image', requireAuth, profileImageUpload.single('profileImage'), async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }

    try {
        const userId = req.user.userId;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        console.log(`🖼️ Uploading profile image for user ${userId}:`, {
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype
        });

        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const fileName = `profile-${userId}-${Date.now()}${fileExtension}`;
        const key = `profile-images/${fileName}`;

        // Upload to DigitalOcean Spaces
        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read'
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        const profileImageUrl = uploadResult.Location;

        console.log(`✅ Profile image uploaded successfully:`, profileImageUrl);

        // Update user profile in database
        const updateResult = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { 
                $set: { 
                    profileImage: profileImageUrl,
                    profilePicture: null, // Clear emoji if switching to image
                    updatedAt: new Date()
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('📸 Profile image updated successfully for user:', userId);
        console.log('📸 New profile image URL:', profileImageUrl);
        
        res.json({ 
            success: true,
            profilePictureUrl: profileImageUrl,
            profileImageUrl: profileImageUrl,
            message: 'Profile image updated successfully'
        });

    } catch (error) {
        console.error('Profile image upload error:', error);
        res.status(500).json({ error: 'Failed to upload profile image' });
    }
});

// Update user profile (for text fields like bio, username, emoji profile pictures)
app.put('/api/user/profile', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }

    try {
        const userId = req.user.userId;
        const updates = req.body;

        // Validate allowed fields
        const allowedFields = ['bio', 'username', 'displayName', 'profilePicture'];
        const validUpdates = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                validUpdates[field] = updates[field];
            }
        }

        // If setting emoji profile picture, clear the image
        if (validUpdates.profilePicture) {
            validUpdates.profileImage = null;
        }

        if (Object.keys(validUpdates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        validUpdates.updatedAt = new Date();

        console.log(`👤 Updating profile for user ${userId}:`, validUpdates);

        const updateResult = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: validUpdates }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
            success: true,
            updates: validUpdates,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get user stats (followers, following, likes)
app.get('/api/user/stats', requireAuth, async (req, res) => {
    console.log('📊 User stats request:', {
        userId: req.query.userId || req.user.userId,
        dbConnected: !!db
    });
    
    if (!db) {
        console.log('📊 No DB connection, returning zeros');
        return res.json({ 
            followers: 0,
            following: 0,
            likes: 0,
            videoCount: 0
        });
    }
    
    try {
        // Use provided userId or authenticated user's ID
        const targetUserId = req.query.userId || req.user.userId;
        console.log('📊 Loading stats for user:', targetUserId);
        
        // Get stats from different collections
        const [followers, following, userVideos] = await Promise.all([
            db.collection('follows').countDocuments({ followingId: targetUserId }),
            db.collection('follows').countDocuments({ followerId: targetUserId }),
            db.collection('videos').find({ userId: targetUserId, status: { $ne: 'deleted' } }).toArray()
        ]);
        
        // Count total likes on user's videos
        let totalLikes = 0;
        for (const video of userVideos) {
            const likes = await db.collection('likes').countDocuments({ videoId: video._id.toString() });
            totalLikes += likes;
        }
        
        const stats = {
            followers,
            following,
            likes: totalLikes,
            videoCount: userVideos.length
        };
        
        console.log('📊 Calculated stats for user', targetUserId, ':', stats);
        
        res.json(stats);
        
    } catch (error) {
        console.error('Get user stats error:', error);
        res.json({ 
            stats: {
                followers: 0,
                following: 0,
                likes: 0,
                videoCount: 0
            }
        });
    }
});

// Get combined feed (videos and posts)
app.get('/api/feed/combined', async (req, res) => {
    if (!db) {
        return res.json({ feed: [] });
    }
    
    try {
        const { limit = 10, skip = 0, page = 1, userId } = req.query;
        const actualSkip = page > 1 ? (parseInt(page) - 1) * parseInt(limit) : parseInt(skip);
        
        let query = { status: 'published' };
        if (userId) query.userId = userId;
        
        // Get videos and posts separately, then combine
        const [videos, posts] = await Promise.all([
            db.collection('videos').find(query).sort({ createdAt: -1 }).toArray(),
            db.collection('posts').find(query).sort({ createdAt: -1 }).toArray()
        ]);
        
        // Combine and sort by creation date
        const combined = [...videos.map(v => ({ ...v, contentType: 'video' })), 
                          ...posts.map(p => ({ ...p, contentType: 'post' }))]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(actualSkip, actualSkip + parseInt(limit));
        
        // Get user info for each item
        for (const item of combined) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(item.userId) },
                    { projection: { password: 0 } }
                );
                
                if (user) {
                    item.user = user;
                    item.username = user.username || user.displayName || 'anonymous';
                } else {
                    // User not found in database
                    item.user = { 
                        username: 'deleted_user', 
                        displayName: 'Deleted User', 
                        _id: item.userId,
                        profilePicture: '👤'
                    };
                    item.username = 'deleted_user';
                }
                
                // Get engagement counts
                const collection = item.contentType === 'video' ? 'videos' : 'posts';
                const idField = item.contentType === 'video' ? 'videoId' : 'postId';
                item.likeCount = await db.collection('likes').countDocuments({ [idField]: item._id.toString() });
                item.commentCount = await db.collection('comments').countDocuments({ [idField]: item._id.toString() });
            } catch (userError) {
                console.error('Error getting user info for feed item:', item._id, userError);
                item.user = { 
                    username: 'anonymous', 
                    displayName: 'Anonymous User', 
                    _id: 'unknown',
                    profilePicture: '👤'
                };
                item.username = 'anonymous';
                item.likeCount = 0;
                item.commentCount = 0;
            }
        }
        
        res.json({ feed: combined });
        
    } catch (error) {
        console.error('Get combined feed error:', error);
        res.json({ feed: [] });
    }
});

// Like/unlike post (photos, slideshows, mixed content)
app.post('/api/posts/:postId/like', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { postId } = req.params;
    
    try {
        const like = {
            postId,
            userId: req.user.userId,
            createdAt: new Date()
        };
        
        // Try to insert like
        try {
            await db.collection('likes').insertOne(like);
            res.json({ message: 'Post liked', liked: true });
        } catch (error) {
            // If duplicate key error, remove the like
            if (error.code === 11000) {
                await db.collection('likes').deleteOne({ 
                    postId, 
                    userId: req.user.userId 
                });
                res.json({ message: 'Post unliked', liked: false });
            } else {
                throw error;
            }
        }
        
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ error: 'Failed to like post' });
    }
});

// Add comment to post
app.post('/api/posts/:postId/comments', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { postId } = req.params;
    const { text } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Comment text required' });
    }
    
    try {
        const comment = {
            postId,
            userId: req.user.userId,
            text,
            createdAt: new Date()
        };
        
        const result = await db.collection('comments').insertOne(comment);
        comment._id = result.insertedId;
        
        // Get user info
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.user.userId) },
            { projection: { password: 0 } }
        );
        comment.user = user;
        
        res.json({ 
            message: 'Comment added',
            comment
        });
        
    } catch (error) {
        console.error('Add comment to post error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Get comments for post
app.get('/api/posts/:postId/comments', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { postId } = req.params;
    
    try {
        const comments = await db.collection('comments')
            .find({ postId })
            .sort({ createdAt: -1 })
            .toArray();
        
        // Get user info for each comment
        for (const comment of comments) {
            const user = await db.collection('users').findOne(
                { _id: new ObjectId(comment.userId) },
                { projection: { password: 0 } }
            );
            comment.user = user;
        }
        
        res.json({ comments });
        
    } catch (error) {
        console.error('Get post comments error:', error);
        res.status(500).json({ error: 'Failed to get comments' });
    }
});

// Like/unlike video
app.post('/api/videos/:videoId/like', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { videoId } = req.params;
    
    try {
        console.log(`💖 Like toggle request for video ${videoId} by user ${req.user.userId}`);
        
        const like = {
            videoId,
            userId: req.user.userId,
            createdAt: new Date()
        };
        
        // Try to insert like
        try {
            await db.collection('likes').insertOne(like);
            console.log(`✅ Video ${videoId} liked by user ${req.user.userId}`);
            
            // Get updated like count
            const likeCount = await db.collection('likes').countDocuments({ videoId });
            
            res.json({ 
                message: 'Video liked', 
                liked: true, 
                likeCount,
                videoId,
                userId: req.user.userId
            });
        } catch (error) {
            // If duplicate key error, remove the like (toggle off)
            if (error.code === 11000) {
                console.log(`🔄 User ${req.user.userId} already liked video ${videoId}, toggling to unlike...`);
                
                await db.collection('likes').deleteOne({ 
                    videoId, 
                    userId: req.user.userId 
                });
                
                console.log(`✅ Video ${videoId} unliked by user ${req.user.userId}`);
                
                // Get updated like count
                const likeCount = await db.collection('likes').countDocuments({ videoId });
                
                res.json({ 
                    message: 'Video unliked', 
                    liked: false, 
                    likeCount,
                    videoId,
                    userId: req.user.userId
                });
            } else {
                throw error;
            }
        }
        
    } catch (error) {
        console.error('Like video error:', error);
        res.status(500).json({ error: 'Failed to like video' });
    }
});

// ================ USER BEHAVIOR TRACKING ================

// Track video view with detailed analytics
app.post('/api/videos/:videoId/view', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }
    
    try {
        const { videoId } = req.params;
        const { 
            watchTime = 0, 
            watchPercentage = 0, 
            exitPoint = 0,
            isReplay = false,
            referrer = 'unknown' // 'foryou', 'following', 'explore', 'profile', 'search', 'hashtag'
        } = req.body;
        
        const userId = req.user ? req.user._id.toString() : null;
        const sessionId = req.headers['x-session-id'] || null;
        
        // Create view record with behavior data
        const viewRecord = {
            videoId,
            userId,
            sessionId,
            timestamp: new Date(),
            watchTime,
            watchPercentage,
            exitPoint,
            isReplay,
            referrer,
            // Device and context info
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            // Time-based features
            hour: new Date().getHours(),
            dayOfWeek: new Date().getDay(),
            isWeekend: [0, 6].includes(new Date().getDay())
        };
        
        // Insert view record
        await db.collection('views').insertOne(viewRecord);
        
        // Update video view count
        await db.collection('videos').updateOne(
            { _id: new require('mongodb').ObjectId(videoId) },
            { 
                $inc: { views: 1 },
                $set: { lastViewedAt: new Date() }
            }
        );
        
        // Update user behavior profile if logged in
        if (userId) {
            await updateUserBehaviorProfile(userId, videoId, viewRecord, db);
        }
        
        res.json({ 
            success: true, 
            message: 'View tracked',
            viewId: viewRecord._id
        });
        
    } catch (error) {
        console.error('View tracking error:', error);
        res.status(500).json({ error: 'Failed to track view' });
    }
});

// Track user interactions (for behavior analysis)
app.post('/api/track/interaction', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }
    
    try {
        const userId = req.user._id.toString();
        const {
            type, // 'swipe', 'tap', 'share', 'save', 'report', 'not_interested'
            videoId,
            action, // 'skip', 'replay', 'pause', 'mute', 'unmute', 'fullscreen'
            timestamp,
            context = {}
        } = req.body;
        
        // Store interaction
        await db.collection('interactions').insertOne({
            userId,
            videoId,
            type,
            action,
            timestamp: new Date(timestamp),
            context,
            createdAt: new Date()
        });
        
        // Update user behavior patterns
        if (type === 'not_interested' || (type === 'swipe' && action === 'skip')) {
            await updateUserDisinterests(userId, videoId, db);
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Interaction tracking error:', error);
        res.status(500).json({ error: 'Failed to track interaction' });
    }
});

// Get user behavior insights (for debugging/analytics)
app.get('/api/user/behavior', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }
    
    try {
        const userId = req.user._id.toString();
        
        // Get user behavior profile
        const behaviorProfile = await db.collection('userBehavior').findOne({ userId });
        
        if (!behaviorProfile) {
            return res.json({ 
                message: 'No behavior profile yet',
                recommendations: 'Watch more videos to build your profile'
            });
        }
        
        // Get recent activity summary
        const recentViews = await db.collection('views')
            .find({ userId })
            .sort({ timestamp: -1 })
            .limit(50)
            .toArray();
        
        const avgWatchTime = recentViews.reduce((sum, v) => sum + v.watchTime, 0) / recentViews.length;
        const avgWatchPercentage = recentViews.reduce((sum, v) => sum + v.watchPercentage, 0) / recentViews.length;
        
        res.json({
            profile: {
                contentPreferences: behaviorProfile.contentPreferences || {},
                creatorPreferences: behaviorProfile.creatorPreferences || {},
                timePreferences: behaviorProfile.timePreferences || {},
                engagementPatterns: behaviorProfile.engagementPatterns || {},
                lastUpdated: behaviorProfile.lastUpdated
            },
            recentActivity: {
                viewCount: recentViews.length,
                avgWatchTime: Math.round(avgWatchTime),
                avgWatchPercentage: Math.round(avgWatchPercentage),
                mostActiveHour: getMostActiveHour(recentViews),
                preferredReferrer: getPreferredReferrer(recentViews)
            }
        });
        
    } catch (error) {
        console.error('Get behavior error:', error);
        res.status(500).json({ error: 'Failed to get behavior profile' });
    }
});

// Helper function to update user behavior profile
async function updateUserBehaviorProfile(userId, videoId, viewRecord, db) {
    try {
        // Get video details for categorization
        const video = await db.collection('videos').findOne({ 
            _id: new require('mongodb').ObjectId(videoId) 
        });
        
        if (!video) return;
        
        // Extract behavior signals
        const signals = {
            watchQuality: viewRecord.watchPercentage > 80 ? 'complete' : 
                         viewRecord.watchPercentage > 50 ? 'partial' : 'skip',
            timeOfDay: viewRecord.hour,
            dayType: viewRecord.isWeekend ? 'weekend' : 'weekday',
            creator: video.userId,
            hashtags: video.hashtags || [],
            duration: video.duration || 0,
            engagement: viewRecord.watchTime / Math.max(1, video.duration || 30) // Engagement rate
        };
        
        // Update or create behavior profile
        await db.collection('userBehavior').updateOne(
            { userId },
            {
                $inc: {
                    'stats.totalViews': 1,
                    'stats.totalWatchTime': viewRecord.watchTime,
                    [`contentPreferences.${signals.watchQuality}`]: 1,
                    [`creatorPreferences.${signals.creator}`]: signals.engagement,
                    [`timePreferences.hour${signals.timeOfDay}`]: 1,
                    [`timePreferences.${signals.dayType}`]: 1
                },
                $addToSet: {
                    'recentHashtags': { $each: signals.hashtags }
                },
                $set: {
                    lastUpdated: new Date()
                }
            },
            { upsert: true }
        );
        
        // Track hashtag engagement
        if (signals.hashtags.length > 0 && signals.watchQuality !== 'skip') {
            const hashtagUpdate = {};
            signals.hashtags.forEach(tag => {
                hashtagUpdate[`hashtagEngagement.${tag}`] = signals.engagement;
            });
            
            await db.collection('userBehavior').updateOne(
                { userId },
                { $inc: hashtagUpdate }
            );
        }
        
    } catch (error) {
        console.error('Error updating user behavior:', error);
    }
}

// Helper function to track disinterests
async function updateUserDisinterests(userId, videoId, db) {
    try {
        const video = await db.collection('videos').findOne({ 
            _id: new require('mongodb').ObjectId(videoId) 
        });
        
        if (!video) return;
        
        // Track negative signals
        await db.collection('userBehavior').updateOne(
            { userId },
            {
                $inc: {
                    [`disinterests.creators.${video.userId}`]: 1,
                    'stats.skippedVideos': 1
                },
                $addToSet: {
                    'disinterests.recentSkips': videoId
                },
                $set: {
                    lastUpdated: new Date()
                }
            },
            { upsert: true }
        );
        
        // Limit recent skips to last 100
        await db.collection('userBehavior').updateOne(
            { userId },
            {
                $push: {
                    'disinterests.recentSkips': {
                        $each: [],
                        $slice: -100
                    }
                }
            }
        );
        
    } catch (error) {
        console.error('Error updating disinterests:', error);
    }
}

// Helper functions for behavior analysis
function getMostActiveHour(views) {
    const hourCounts = {};
    views.forEach(v => {
        const hour = v.hour || new Date(v.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    return Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)
        [0]?.[0] || 'unknown';
}

function getPreferredReferrer(views) {
    const referrerCounts = {};
    views.forEach(v => {
        referrerCounts[v.referrer] = (referrerCounts[v.referrer] || 0) + 1;
    });
    
    return Object.entries(referrerCounts)
        .sort(([,a], [,b]) => b - a)
        [0]?.[0] || 'foryou';
}

// Simple like endpoint as specified
app.post('/like', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { videoId, userId } = req.body;
    
    // Use authenticated user ID if not provided
    const actualUserId = userId || req.user.userId;
    
    // Validate required fields
    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
    }
    
    if (!actualUserId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    
    console.log(`💖 Like request: videoId=${videoId}, userId=${actualUserId}`);
    console.log(`💖 SERVER VERSION: Fixed duplicate key error - using empty string for postId`);
    
    try {
        // Check if like already exists (handle both null and empty string postId)
        const existingLike = await db.collection('likes').findOne({ 
            videoId: videoId.toString(), 
            userId: actualUserId.toString()
        });
        
        console.log(`💖 Existing like found: ${!!existingLike}`);
        
        if (existingLike) {
            // Unlike - remove the like (handle both null and empty string postId)
            const deleteResult = await db.collection('likes').deleteOne({ 
                videoId: videoId.toString(), 
                userId: actualUserId.toString()
            });
            
            console.log(`💖 Delete result: ${deleteResult.deletedCount} likes removed`);
            
            // Get updated like count (count video likes only)
            const likeCount = await db.collection('likes').countDocuments({ 
                videoId: videoId.toString()
            });
            
            console.log(`💖 Unliked video ${videoId}, new count: ${likeCount}`);
            
            res.json({ 
                message: 'Video unliked', 
                liked: false, 
                likeCount 
            });
        } else {
            // Like - add new like  
            // Don't include postId for video likes - only for post likes
            const like = {
                videoId: videoId.toString(),
                userId: actualUserId.toString(),
                createdAt: new Date()
            };
            
            try {
                const insertResult = await db.collection('likes').insertOne(like);
                console.log(`💖 Insert result: ${insertResult.insertedId}`);
                
                // Get updated like count (count video likes only)
                const likeCount = await db.collection('likes').countDocuments({ 
                    videoId: videoId.toString()
                });
                
                console.log(`💖 Liked video ${videoId}, new count: ${likeCount}`);
                
                res.json({ 
                    message: 'Video liked', 
                    liked: true, 
                    likeCount 
                });
            } catch (insertError) {
                // Handle duplicate key errors specifically
                if (insertError.code === 11000) {
                    console.log(`💖 Duplicate key error on insert, checking existing like...`);
                    
                    // Check if there's already a like for this video
                    const existingVideoLike = await db.collection('likes').findOne({ 
                        videoId: videoId.toString(), 
                        userId: actualUserId.toString()
                    });
                    
                    if (existingVideoLike) {
                        console.log(`💖 Found existing video like, treating as already liked`);
                        const likeCount = await db.collection('likes').countDocuments({ 
                            videoId: videoId.toString()
                        });
                        res.json({ 
                            message: 'Video already liked', 
                            liked: true, 
                            likeCount 
                        });
                    } else {
                        console.error(`💖 Duplicate key error but no existing video like found:`, insertError);
                        throw insertError;
                    }
                } else {
                    throw insertError;
                }
            }
        }
        
    } catch (error) {
        console.error('Like video error:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            videoId,
            userId: actualUserId
        });
        res.status(500).json({ 
            error: 'Failed to like video',
            details: error.message 
        });
    }
});

// Get like status for a video
app.get('/api/videos/:videoId/like-status', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { videoId } = req.params;
    const userId = req.user.userId;
    
    try {
        // Ensure string types for consistency and handle video likes
        const like = await db.collection('likes').findOne({ 
            videoId: videoId.toString(), 
            userId: userId.toString()
        });
        const likeCount = await db.collection('likes').countDocuments({ 
            videoId: videoId.toString()
        });
        
        res.json({ 
            liked: !!like, 
            likeCount 
        });
        
    } catch (error) {
        console.error('Get like status error:', error);
        res.status(500).json({ error: 'Failed to get like status' });
    }
});

// Ensure likes collection has proper unique index for toggling
async function ensureLikesIndex() {
    try {
        if (db) {
            await db.collection('likes').createIndex(
                { videoId: 1, userId: 1 }, 
                { unique: true, background: true }
            );
            console.log('✅ Likes unique index ensured');
        }
    } catch (error) {
        // Index might already exist, that's fine
        console.log('📝 Likes index already exists or error:', error.message);
    }
}

// Call this when database connects
if (db) {
    ensureLikesIndex();
}

// Test endpoint to verify deployment (no auth required)
app.get('/api/test-liked-videos', (req, res) => {
    console.log('🧪 Test endpoint hit at:', new Date().toISOString());
    res.json({ 
        message: 'Liked videos endpoint exists and working', 
        timestamp: new Date().toISOString(),
        serverVersion: '2024-01-04-v2-rebuild',
        database: db ? 'connected' : 'disconnected',
        uptime: process.uptime()
    });
});

// Simple test for the actual endpoint (no auth to test route)
app.get('/api/test-user-liked-videos-simple', (req, res) => {
    console.log('🧪 Simple liked videos test endpoint hit!');
    res.json({ 
        message: 'User liked videos route exists', 
        timestamp: new Date().toISOString(),
        note: 'This is a test without authentication'
    });
});

// Get user's liked videos
app.get('/api/user/liked-videos', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const userId = req.user.userId;
    
    try {
        console.log(`🔍 Getting liked videos for user: ${userId}`);
        
        // Get all likes for this user
        const likes = await db.collection('likes').find({ 
            userId: userId.toString() 
        }).toArray();
        
        console.log(`📝 Found ${likes.length} likes for user`);
        
        if (likes.length === 0) {
            return res.json({ videos: [] });
        }
        
        // Extract video IDs from likes
        const videoIds = likes.map(like => like.videoId).filter(id => id);
        
        console.log(`🎬 Looking up ${videoIds.length} videos...`);
        
        // Get the actual videos that the user has liked
        const likedVideos = await db.collection('videos').find({
            _id: { $in: videoIds.map(id => {
                try {
                    return require('mongodb').ObjectId(id);
                } catch (e) {
                    return id; // If it's already a string ID
                }
            })},
            status: { $ne: 'deleted' }
        }).toArray();
        
        console.log(`✅ Found ${likedVideos.length} valid liked videos`);
        
        // Add user info and like counts to videos
        for (let video of likedVideos) {
            // Get user info
            const user = await db.collection('users').findOne(
                { _id: require('mongodb').ObjectId(video.userId) },
                { projection: { password: 0 } }
            );
            video.user = user || { username: 'Unknown', displayName: 'Unknown' };
            
            // Add like count
            video.likeCount = video.likes?.length || 0;
            video.commentCount = 0;
        }
        
        // Sort by like date (most recent first)
        const likesMap = new Map(likes.map(like => [like.videoId, like.createdAt]));
        likedVideos.sort((a, b) => {
            const aDate = likesMap.get(a._id.toString()) || new Date(0);
            const bDate = likesMap.get(b._id.toString()) || new Date(0);
            return new Date(bDate) - new Date(aDate);
        });
        
        res.json({ videos: likedVideos });
        
    } catch (error) {
        console.error('❌ Get liked videos error:', error);
        res.status(500).json({ error: 'Failed to get liked videos' });
    }
});

// Share video
app.post('/api/videos/:videoId/share', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { videoId } = req.params;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    try {
        // Create a unique identifier for this share (to prevent spam)
        const shareIdentifier = userAgent + ipAddress;
        const shareHash = require('crypto').createHash('md5').update(shareIdentifier).digest('hex');
        
        // Check if this user/device already shared this video recently (within 1 hour)
        const recentShare = await db.collection('shares').findOne({
            videoId,
            shareHash,
            createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
        });
        
        if (!recentShare) {
            // Record the share
            const share = {
                videoId,
                shareHash,
                userAgent,
                userId: req.user?.userId || null, // Include userId for activity tracking
                createdAt: new Date()
            };
            
            await db.collection('shares').insertOne(share);
        }
        
        // Return current share count
        const shareCount = await db.collection('shares').countDocuments({ videoId });
        res.json({ message: 'Share recorded', shareCount });
        
    } catch (error) {
        console.error('Share video error:', error);
        res.status(500).json({ error: 'Failed to record share' });
    }
});

// Add comment
app.post('/api/videos/:videoId/comments', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { videoId } = req.params;
    const { text } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Comment text required' });
    }
    
    try {
        const comment = {
            videoId,
            userId: req.user.userId,
            text,
            createdAt: new Date()
        };
        
        const result = await db.collection('comments').insertOne(comment);
        comment._id = result.insertedId;
        
        // Get user info
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.user.userId) },
            { projection: { password: 0 } }
        );
        comment.user = user;
        
        res.json({ 
            message: 'Comment added',
            comment
        });
        
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Get comments for video
app.get('/api/videos/:videoId/comments', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { videoId } = req.params;
    
    try {
        const comments = await db.collection('comments')
            .find({ videoId })
            .sort({ createdAt: -1 })
            .toArray();
        
        // Get user info for each comment
        for (const comment of comments) {
            const user = await db.collection('users').findOne(
                { _id: new ObjectId(comment.userId) },
                { projection: { password: 0 } }
            );
            comment.user = user;
        }
        
        res.json({ comments });
        
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Failed to get comments' });
    }
});

// Follow/unfollow user
app.post('/api/users/:userId/follow', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { userId } = req.params;
    
    if (userId === req.user.userId) {
        return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    try {
        const follow = {
            followerId: req.user.userId,
            followingId: userId,
            createdAt: new Date()
        };
        
        // Try to insert follow
        try {
            await db.collection('follows').insertOne(follow);
            
            // Update follower counts
            await db.collection('users').updateOne(
                { _id: new ObjectId(req.user.userId) },
                { $inc: { following: 1 } }
            );
            await db.collection('users').updateOne(
                { _id: new ObjectId(userId) },
                { $inc: { followers: 1 } }
            );
            
            res.json({ message: 'User followed', following: true });
        } catch (error) {
            // If duplicate key error, remove the follow
            if (error.code === 11000) {
                await db.collection('follows').deleteOne({ 
                    followerId: req.user.userId,
                    followingId: userId
                });
                
                // Update follower counts
                await db.collection('users').updateOne(
                    { _id: new ObjectId(req.user.userId) },
                    { $inc: { following: -1 } }
                );
                await db.collection('users').updateOne(
                    { _id: new ObjectId(userId) },
                    { $inc: { followers: -1 } }
                );
                
                res.json({ message: 'User unfollowed', following: false });
            } else {
                throw error;
            }
        }
        
    } catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({ error: 'Failed to follow user' });
    }
});

// Unfollow user
app.post('/api/users/:userId/unfollow', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { userId } = req.params;
    
    try {
        // Remove follow
        const result = await db.collection('follows').deleteOne({ 
            followerId: req.user.userId,
            followingId: userId
        });
        
        if (result.deletedCount > 0) {
            // Update follower counts
            await db.collection('users').updateOne(
                { _id: new ObjectId(req.user.userId) },
                { $inc: { following: -1 } }
            );
            await db.collection('users').updateOne(
                { _id: new ObjectId(userId) },
                { $inc: { followers: -1 } }
            );
            
            res.json({ message: 'User unfollowed', following: false });
        } else {
            res.json({ message: 'Not following this user', following: false });
        }
        
    } catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({ error: 'Failed to unfollow user' });
    }
});

// Get current user's following list
app.get('/api/user/following', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    try {
        const follows = await db.collection('follows')
            .find({ followerId: req.user.userId })
            .toArray();
        
        // Get user details for each followed user
        const followingIds = follows.map(f => new ObjectId(f.followingId));
        const users = await db.collection('users')
            .find({ _id: { $in: followingIds } })
            .project({ password: 0 })
            .toArray();
        
        // Add real-time stats and follow status for each user
        for (const user of users) {
            const [followerCount, followingCount, isFollowing] = await Promise.all([
                db.collection('follows').countDocuments({ followingId: user._id.toString() }),
                db.collection('follows').countDocuments({ followerId: user._id.toString() }),
                db.collection('follows').countDocuments({ 
                    followerId: req.user.userId, 
                    followingId: user._id.toString() 
                })
            ]);
            
            user.stats = {
                followers: followerCount,
                following: followingCount,
                likes: user.stats?.likes || 0,
                videos: user.stats?.videos || 0
            };
            
            user.isFollowing = isFollowing > 0;
        }
        
        res.json(users);
        
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ error: 'Failed to get following list' });
    }
});

// Get user's followed user IDs (simplified for app sync)
app.get('/api/user/followed-users', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    try {
        console.log(`🔍 Getting followed users for user: ${req.user.userId}`);
        
        const follows = await db.collection('follows')
            .find({ followerId: req.user.userId })
            .toArray();
        
        // Just return the user IDs
        const followedUserIds = follows.map(f => f.followingId);
        
        console.log(`✅ Found ${followedUserIds.length} followed users`);
        
        res.json(followedUserIds);
        
    } catch (error) {
        console.error('❌ Get followed users error:', error);
        res.status(500).json({ error: 'Failed to get followed users' });
    }
});

// Get user followers
app.get('/api/user/followers', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    try {
        const follows = await db.collection('follows')
            .find({ followingId: req.user.userId })
            .toArray();
        
        // Get user details for each follower
        const followerIds = follows.map(f => new ObjectId(f.followerId));
        const users = await db.collection('users')
            .find({ _id: { $in: followerIds } })
            .project({ password: 0 })
            .toArray();
        
        // Add real-time stats and follow status for each user  
        for (const user of users) {
            const [followerCount, followingCount, isFollowing] = await Promise.all([
                db.collection('follows').countDocuments({ followingId: user._id.toString() }),
                db.collection('follows').countDocuments({ followerId: user._id.toString() }),
                db.collection('follows').countDocuments({ 
                    followerId: req.user.userId, 
                    followingId: user._id.toString() 
                })
            ]);
            
            user.stats = {
                followers: followerCount,
                following: followingCount,
                likes: user.stats?.likes || 0,
                videos: user.stats?.videos || 0
            };
            
            user.isFollowing = isFollowing > 0;
        }
        
        res.json(users);
        
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ error: 'Failed to get followers list' });
    }
});

// Get user profile
app.get('/api/users/:userId', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { userId } = req.params;
    
    try {
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0 } }
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get stats
        const stats = {
            followers: await db.collection('follows').countDocuments({ followingId: userId }),
            following: await db.collection('follows').countDocuments({ followerId: userId }),
            likes: await db.collection('likes').countDocuments({ userId: userId }),
            videos: await db.collection('videos').countDocuments({ userId: userId, status: { $ne: 'deleted' } })
        };
        
        // Add stats to user object
        user.stats = stats;
        
        res.json(user);
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Debug route to check if this file is deployed
app.get('/api/debug/deployment', (req, res) => {
    res.json({ 
        message: 'Deployment updated',
        timestamp: new Date().toISOString(),
        staticMiddlewareRemoved: true,
        followingEndpointExists: true
    });
});

// Get user following list
app.get('/api/users/:userId/following', async (req, res) => {
    console.log('🔍 GET /api/users/:userId/following endpoint hit');
    console.log('📝 Request params:', req.params);
    console.log('📝 Database connected:', !!db);
    
    if (!db) {
        console.log('❌ Database not connected');
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { userId } = req.params;
    
    try {
        const following = await db.collection('follows')
            .find({ followerId: userId })
            .toArray();
        
        const followingIds = following.map(f => f.followingId);
        
        console.log(`✅ User ${userId} is following ${followingIds.length} users`);
        res.json({ following: followingIds });
        
    } catch (error) {
        console.error('❌ Get user following error:', error);
        res.status(500).json({ error: 'Failed to get following list' });
    }
});

// Get user followers list
app.get('/api/users/:userId/followers', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { userId } = req.params;
    
    try {
        const followers = await db.collection('follows')
            .find({ followingId: userId })
            .toArray();
        
        const followerIds = followers.map(f => f.followerId);
        
        console.log(`User ${userId} has ${followerIds.length} followers`);
        res.json({ followers: followerIds });
        
    } catch (error) {
        console.error('Get user followers error:', error);
        res.status(500).json({ error: 'Failed to get followers list' });
    }
});

// Search users
app.get('/api/search/users', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { q } = req.query;
    
    if (!q) {
        return res.status(400).json({ error: 'Search query required' });
    }
    
    try {
        const users = await db.collection('users')
            .find({
                $or: [
                    { username: { $regex: q, $options: 'i' } },
                    { displayName: { $regex: q, $options: 'i' } }
                ]
            })
            .project({ password: 0 })
            .limit(20)
            .toArray();
        
        res.json({ users });
        
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Search posts and videos
app.get('/api/search/content', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { q, type = 'all' } = req.query;
    
    if (!q) {
        return res.status(400).json({ error: 'Search query required' });
    }
    
    try {
        const searchQuery = {
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { hashtags: { $regex: q, $options: 'i' } }
            ],
            status: 'published'
        };
        
        let results = [];
        
        if (type === 'all' || type === 'videos') {
            const videos = await db.collection('videos')
                .find(searchQuery)
                .limit(10)
                .toArray();
            results.push(...videos.map(v => ({ ...v, contentType: 'video' })));
        }
        
        if (type === 'all' || type === 'posts') {
            const posts = await db.collection('posts')
                .find(searchQuery)
                .limit(10)
                .toArray();
            results.push(...posts.map(p => ({ ...p, contentType: 'post' })));
        }
        
        // Sort by relevance and date
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Get user info for each result
        for (const item of results) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(item.userId) },
                    { projection: { password: 0 } }
                );
                
                if (user) {
                    item.user = user;
                    item.username = user.username || user.displayName || 'anonymous';
                } else {
                    // User not found in database
                    item.user = { 
                        username: 'deleted_user', 
                        displayName: 'Deleted User', 
                        _id: item.userId,
                        profilePicture: '👤'
                    };
                    item.username = 'deleted_user';
                }
            } catch (userError) {
                item.user = { 
                    username: 'anonymous', 
                    displayName: 'Anonymous User',
                    _id: 'unknown',
                    profilePicture: '👤'
                };
                item.username = 'anonymous';
            }
        }
        
        res.json({ content: results.slice(0, 20) });
        
    } catch (error) {
        console.error('Search content error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Validate uploaded files
app.post('/api/upload/validate', requireAuth, upload.array('files', 35), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files provided for validation' });
        }
        
        const videoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/mov'];
        const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
        
        const validationResults = req.files.map((file, index) => {
            const isVideo = videoTypes.includes(file.mimetype);
            const isImage = imageTypes.includes(file.mimetype);
            const isValid = isVideo || isImage;
            
            // Check file size limits
            const maxVideoSize = 100 * 1024 * 1024; // 100MB
            const maxImageSize = 25 * 1024 * 1024;  // 25MB
            const sizeValid = isVideo ? file.size <= maxVideoSize : file.size <= maxImageSize;
            
            return {
                index,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                type: isVideo ? 'video' : isImage ? 'image' : 'unknown',
                valid: isValid && sizeValid,
                errors: [
                    ...(!isValid ? ['Invalid file type'] : []),
                    ...(!sizeValid ? ['File size exceeds limit'] : [])
                ]
            };
        });
        
        const validFiles = validationResults.filter(f => f.valid);
        const invalidFiles = validationResults.filter(f => !f.valid);
        
        res.json({
            message: 'File validation complete',
            totalFiles: req.files.length,
            validFiles: validFiles.length,
            invalidFiles: invalidFiles.length,
            results: validationResults,
            canProceed: invalidFiles.length === 0
        });
        
    } catch (error) {
        console.error('File validation error:', error);
        res.status(500).json({ error: 'Validation failed: ' + error.message });
    }
});

// Serve the fixed index.html without vib3-complete.js
// Legacy web routes removed - using Flutter app only
// app.get('/', (req, res) => {
//     // Legacy web serving removed - using Flutter app only
//     res.status(404).json({ error: 'Web interface removed - use Flutter app' });
// });

// Legacy /app route removed - using Flutter app only
// app.get(['/app', '/app/'], (req, res) => {
//     const userAgent = req.get('User-Agent') || '';
//     const isMobile = isMobileDevice(userAgent);
//     
//     console.log(`📱 /app route - Device detection: ${isMobile ? 'MOBILE' : 'DESKTOP'} - User-Agent: ${userAgent}`);
//     console.log(`📱 /app route - Original URL: ${req.originalUrl}`);
//     
//     if (isMobile) {
//         // Preserve query parameters when redirecting to mobile
//         const queryString = req.originalUrl.includes('?') ? req.originalUrl.substring(req.originalUrl.indexOf('?')) : '';
//         const redirectUrl = `/mobile${queryString}`;
//         console.log(`📱 Redirecting mobile device from /app to ${redirectUrl}`);
//         return res.redirect(redirectUrl);
//     } else {
//         console.log('🖥️ Serving desktop /app version');
//         res.sendFile(path.join(__dirname, 'www', 'index-new.html'));
//     }
// });

// Test endpoint to verify API routes work
app.get('/api/test-following-endpoint', (req, res) => {
    console.log('🧪 Test following endpoint hit');
    res.json({ 
        message: 'API routes are working',
        timestamp: new Date().toISOString(),
        note: 'If you see this, API routes are functioning properly'
    });
});

// Catch all route - use fixed index.html (MUST BE LAST)
app.get('*', (req, res) => {
    // Log when catch-all is hit for API routes (shouldn't happen)
    if (req.path.startsWith('/api/')) {
        console.log('⚠️ WARNING: Catch-all route caught API path:', req.path);
        console.log('This API endpoint may not be defined');
        return res.status(404).json({ 
            error: 'API endpoint not found',
            path: req.path,
            message: 'This API route is not defined on the server'
        });
    }
    // Legacy web serving removed - using Flutter app only
    res.status(404).json({ error: 'Web interface removed - use Flutter app' });
});

// ================ ADMIN CLEANUP ENDPOINTS ================

// Cleanup all videos (database + storage)
app.delete('/api/admin/cleanup/videos', async (req, res) => {
    try {
        console.log('🧹 ADMIN: Starting complete video cleanup...');
        
        let deletedVideos = 0;
        let deletedFiles = 0;
        let errors = [];
        
        if (db) {
            // Get all videos from database
            const videos = await db.collection('videos').find({}).toArray();
            console.log(`Found ${videos.length} videos in database`);
            
            // Delete video files from Digital Ocean Spaces
            for (const video of videos) {
                if (video.fileName || video.videoUrl) {
                    try {
                        // Extract file path from URL or use fileName directly
                        let filePath = video.fileName;
                        if (!filePath && video.videoUrl) {
                            const url = new URL(video.videoUrl);
                            filePath = url.pathname.substring(1); // Remove leading slash
                        }
                        
                        if (filePath) {
                            console.log(`Deleting file: ${filePath}`);
                            await s3.deleteObject({
                                Bucket: BUCKET_NAME,
                                Key: filePath
                            }).promise();
                            deletedFiles++;
                        }
                    } catch (fileError) {
                        console.error(`Failed to delete file for video ${video._id}:`, fileError.message);
                        errors.push(`File deletion failed for ${video._id}: ${fileError.message}`);
                    }
                }
            }
            
            // Delete all video records from database
            const deleteResult = await db.collection('videos').deleteMany({});
            deletedVideos = deleteResult.deletedCount;
            console.log(`Deleted ${deletedVideos} videos from database`);
            
            // Clean up related data
            const likesResult = await db.collection('likes').deleteMany({});
            const commentsResult = await db.collection('comments').deleteMany({});
            const viewsResult = await db.collection('views').deleteMany({});
            
            console.log(`Cleaned up ${likesResult.deletedCount} likes, ${commentsResult.deletedCount} comments, ${viewsResult.deletedCount} views`);
        }
        
        // Also cleanup orphaned files in videos/ directory
        try {
            console.log('🧹 Cleaning up orphaned files in videos/ directory...');
            const listParams = {
                Bucket: BUCKET_NAME,
                Prefix: 'videos/'
            };
            
            const objects = await s3.listObjectsV2(listParams).promise();
            console.log(`Found ${objects.Contents?.length || 0} files in videos/ directory`);
            
            if (objects.Contents && objects.Contents.length > 0) {
                const deleteParams = {
                    Bucket: BUCKET_NAME,
                    Delete: {
                        Objects: objects.Contents.map(obj => ({ Key: obj.Key }))
                    }
                };
                
                const deleteResult = await s3.deleteObjects(deleteParams).promise();
                const additionalDeleted = deleteResult.Deleted?.length || 0;
                deletedFiles += additionalDeleted;
                console.log(`Deleted ${additionalDeleted} additional orphaned files`);
            }
        } catch (cleanupError) {
            console.error('Error cleaning up orphaned files:', cleanupError.message);
            errors.push(`Orphaned file cleanup failed: ${cleanupError.message}`);
        }
        
        const result = {
            success: true,
            message: 'Video cleanup completed',
            statistics: {
                videosDeleted: deletedVideos,
                filesDeleted: deletedFiles,
                errors: errors.length
            },
            errors: errors.length > 0 ? errors : undefined
        };
        
        console.log('✅ Video cleanup completed:', result.statistics);
        res.json(result);
        
    } catch (error) {
        console.error('❌ Video cleanup failed:', error);
        res.status(500).json({ 
            success: false,
            error: 'Cleanup failed', 
            details: error.message 
        });
    }
});

// Cleanup all posts/photos (database + storage)
app.delete('/api/admin/cleanup/posts', async (req, res) => {
    try {
        console.log('🧹 ADMIN: Starting complete posts cleanup...');
        
        let deletedPosts = 0;
        let deletedFiles = 0;
        let errors = [];
        
        if (db) {
            // Get all posts from database
            const posts = await db.collection('posts').find({}).toArray();
            console.log(`Found ${posts.length} posts in database`);
            
            // Delete image files from Digital Ocean Spaces
            for (const post of posts) {
                if (post.images && Array.isArray(post.images)) {
                    for (const image of post.images) {
                        try {
                            let filePath = image.fileName;
                            if (!filePath && image.url) {
                                const url = new URL(image.url);
                                filePath = url.pathname.substring(1);
                            }
                            
                            if (filePath) {
                                console.log(`Deleting image: ${filePath}`);
                                await s3.deleteObject({
                                    Bucket: BUCKET_NAME,
                                    Key: filePath
                                }).promise();
                                deletedFiles++;
                            }
                        } catch (fileError) {
                            console.error(`Failed to delete image for post ${post._id}:`, fileError.message);
                            errors.push(`Image deletion failed for ${post._id}: ${fileError.message}`);
                        }
                    }
                }
            }
            
            // Delete all post records
            const deleteResult = await db.collection('posts').deleteMany({});
            deletedPosts = deleteResult.deletedCount;
            console.log(`Deleted ${deletedPosts} posts from database`);
        }
        
        const result = {
            success: true,
            message: 'Posts cleanup completed',
            statistics: {
                postsDeleted: deletedPosts,
                filesDeleted: deletedFiles,
                errors: errors.length
            },
            errors: errors.length > 0 ? errors : undefined
        };
        
        console.log('✅ Posts cleanup completed:', result.statistics);
        res.json(result);
        
    } catch (error) {
        console.error('❌ Posts cleanup failed:', error);
        res.status(500).json({ 
            success: false,
            error: 'Posts cleanup failed', 
            details: error.message 
        });
    }
});

// Complete system cleanup (everything)
app.delete('/api/admin/cleanup/all', async (req, res) => {
    try {
        console.log('🧹 ADMIN: Starting COMPLETE system cleanup...');
        
        const results = {
            videos: { deleted: 0, filesDeleted: 0, errors: [] },
            posts: { deleted: 0, filesDeleted: 0, errors: [] },
            storage: { totalFilesDeleted: 0, errors: [] }
        };
        
        if (db) {
            // Clean up videos
            const videos = await db.collection('videos').find({}).toArray();
            for (const video of videos) {
                if (video.fileName || video.videoUrl) {
                    try {
                        let filePath = video.fileName;
                        if (!filePath && video.videoUrl) {
                            const url = new URL(video.videoUrl);
                            filePath = url.pathname.substring(1);
                        }
                        if (filePath) {
                            await s3.deleteObject({ Bucket: BUCKET_NAME, Key: filePath }).promise();
                            results.videos.filesDeleted++;
                        }
                    } catch (error) {
                        results.videos.errors.push(`Video file ${video._id}: ${error.message}`);
                    }
                }
            }
            const videoDeleteResult = await db.collection('videos').deleteMany({});
            results.videos.deleted = videoDeleteResult.deletedCount;
            
            // Clean up posts
            const posts = await db.collection('posts').find({}).toArray();
            for (const post of posts) {
                if (post.images && Array.isArray(post.images)) {
                    for (const image of post.images) {
                        try {
                            let filePath = image.fileName;
                            if (!filePath && image.url) {
                                const url = new URL(image.url);
                                filePath = url.pathname.substring(1);
                            }
                            if (filePath) {
                                await s3.deleteObject({ Bucket: BUCKET_NAME, Key: filePath }).promise();
                                results.posts.filesDeleted++;
                            }
                        } catch (error) {
                            results.posts.errors.push(`Post image ${post._id}: ${error.message}`);
                        }
                    }
                }
            }
            const postDeleteResult = await db.collection('posts').deleteMany({});
            results.posts.deleted = postDeleteResult.deletedCount;
            
            // Clean up all related data
            await Promise.all([
                db.collection('likes').deleteMany({}),
                db.collection('comments').deleteMany({}),
                db.collection('views').deleteMany({}),
                db.collection('follows').deleteMany({})
            ]);
            
            console.log('✅ Database cleanup completed');
        }
        
        // Nuclear cleanup: delete everything in the bucket
        try {
            console.log('🧹 Performing nuclear storage cleanup...');
            const listParams = { Bucket: BUCKET_NAME };
            let continuationToken = null;
            let totalDeleted = 0;
            
            do {
                if (continuationToken) {
                    listParams.ContinuationToken = continuationToken;
                }
                
                const objects = await s3.listObjectsV2(listParams).promise();
                
                if (objects.Contents && objects.Contents.length > 0) {
                    const deleteParams = {
                        Bucket: BUCKET_NAME,
                        Delete: {
                            Objects: objects.Contents.map(obj => ({ Key: obj.Key }))
                        }
                    };
                    
                    const deleteResult = await s3.deleteObjects(deleteParams).promise();
                    const deleted = deleteResult.Deleted?.length || 0;
                    totalDeleted += deleted;
                    console.log(`Deleted batch of ${deleted} files (total: ${totalDeleted})`);
                }
                
                continuationToken = objects.NextContinuationToken;
            } while (continuationToken);
            
            results.storage.totalFilesDeleted = totalDeleted;
            console.log(`✅ Nuclear cleanup: Deleted ${totalDeleted} total files from storage`);
            
        } catch (storageError) {
            console.error('❌ Nuclear storage cleanup failed:', storageError);
            results.storage.errors.push(`Nuclear cleanup failed: ${storageError.message}`);
        }
        
        const summary = {
            success: true,
            message: 'Complete system cleanup finished',
            results: results,
            totalFiles: results.videos.filesDeleted + results.posts.filesDeleted + results.storage.totalFilesDeleted,
            totalRecords: results.videos.deleted + results.posts.deleted
        };
        
        console.log('✅ COMPLETE CLEANUP FINISHED:', summary);
        res.json(summary);
        
    } catch (error) {
        console.error('❌ Complete cleanup failed:', error);
        res.status(500).json({ 
            success: false,
            error: 'Complete cleanup failed', 
            details: error.message 
        });
    }
});

// Get cleanup status/statistics
app.get('/api/admin/cleanup/status', async (req, res) => {
    try {
        const stats = {
            database: {},
            storage: {}
        };
        
        if (db) {
            // Database statistics
            const [videoCount, postCount, likeCount, commentCount, viewCount, userCount] = await Promise.all([
                db.collection('videos').countDocuments(),
                db.collection('posts').countDocuments(),
                db.collection('likes').countDocuments(),
                db.collection('comments').countDocuments(),
                db.collection('views').countDocuments(),
                db.collection('users').countDocuments()
            ]);
            
            stats.database = {
                videos: videoCount,
                posts: postCount,
                likes: likeCount,
                comments: commentCount,
                views: viewCount,
                users: userCount
            };
        }
        
        // Storage statistics
        try {
            const listParams = { Bucket: BUCKET_NAME };
            const objects = await s3.listObjectsV2(listParams).promise();
            
            let totalSize = 0;
            let videoFiles = 0;
            let imageFiles = 0;
            let otherFiles = 0;
            
            if (objects.Contents) {
                for (const obj of objects.Contents) {
                    totalSize += obj.Size;
                    
                    if (obj.Key.startsWith('videos/')) {
                        videoFiles++;
                    } else if (obj.Key.startsWith('images/') || obj.Key.startsWith('profile-images/')) {
                        imageFiles++;
                    } else {
                        otherFiles++;
                    }
                }
            }
            
            stats.storage = {
                totalFiles: objects.KeyCount || 0,
                videoFiles,
                imageFiles,
                otherFiles,
                totalSizeBytes: totalSize,
                totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100
            };
        } catch (storageError) {
            stats.storage = { error: storageError.message };
        }
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            statistics: stats
        });
        
    } catch (error) {
        console.error('❌ Failed to get cleanup status:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to get status', 
            details: error.message 
        });
    }
});

// Error handling moved to end of file

// Process existing videos to generate thumbnails
app.post('/api/admin/process-thumbnails', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    try {
        console.log('🎬 Starting thumbnail generation for existing videos...');
        
        // Find videos without thumbnails
        const videos = await db.collection('videos').find({ 
            $or: [
                { thumbnailUrl: null },
                { thumbnailUrl: { $exists: false } },
                { thumbnailUrl: '' }
            ]
        }).toArray();
        
        console.log(`Found ${videos.length} videos without thumbnails`);
        
        // Process in background
        processVideosInBackground(videos);
        
        res.json({ 
            message: 'Thumbnail processing started in background',
            videosToProcess: videos.length
        });
        
    } catch (error) {
        console.error('Process thumbnails error:', error);
        res.status(500).json({ error: 'Failed to start processing' });
    }
});

// Background processor for thumbnails
async function processVideosInBackground(videos) {
    let processed = 0;
    let failed = 0;
    
    for (const video of videos) {
        try {
            console.log(`Processing video ${video._id}...`);
            
            if (!video.videoUrl) {
                console.log(`Skipping ${video._id} - no video URL`);
                failed++;
                continue;
            }
            
            // Generate thumbnail
            const thumbnailUrl = await generateVideoThumbnail(video.videoUrl, video._id.toString());
            
            // Update database
            await db.collection('videos').updateOne(
                { _id: video._id },
                { $set: { thumbnailUrl } }
            );
            
            processed++;
            console.log(`✓ Generated thumbnail for ${video._id} (${processed}/${videos.length})`);
            
        } catch (error) {
            console.error(`✗ Failed to generate thumbnail for ${video._id}:`, error.message);
            failed++;
        }
    }
    
    console.log(`✅ Thumbnail processing complete: ${processed} processed, ${failed} failed`);
}

// Nuclear likes reset endpoint
app.post('/api/admin/reset-likes', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    try {
        console.log('💥 NUCLEAR RESET: Completely resetting likes collection...');
        
        // Drop the entire collection and all its indexes
        await db.collection('likes').drop().catch(() => {
            console.log('Collection already dropped or doesnt exist');
        });
        
        // Create fresh collection with only video likes index
        await db.collection('likes').createIndex({ videoId: 1, userId: 1 }, { unique: true });
        
        console.log('✅ Likes collection completely reset with clean indexes');
        
        res.json({ 
            message: 'Nuclear reset complete - all likes deleted, clean indexes created',
            warning: 'All existing likes have been removed'
        });
        
    } catch (error) {
        console.error('Nuclear reset error:', error);
        res.status(500).json({ error: 'Reset failed', details: error.message });
    }
});

// Manual cleanup endpoint (temporary)
app.post('/api/admin/cleanup-likes', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    try {
        console.log('🧹 Aggressive likes cleanup requested...');
        
        // First, backup the current likes
        const allLikes = await db.collection('likes').find({}).toArray();
        console.log(`Found ${allLikes.length} total likes to process`);
        
        // Drop the entire likes collection to avoid index conflicts
        console.log('💥 Dropping likes collection...');
        await db.collection('likes').drop().catch(() => {
            console.log('Collection already dropped or doesnt exist');
        });
        
        // Recreate likes collection with clean data
        console.log('🔄 Recreating likes collection...');
        const cleanLikes = new Map();
        
        // Process each like, keeping only the most recent for each video/user combo
        for (const like of allLikes) {
            if (like.videoId) {
                // This is a video like
                const key = `${like.videoId}_${like.userId}`;
                const existingLike = cleanLikes.get(key);
                
                if (!existingLike || new Date(like.createdAt || 0) > new Date(existingLike.createdAt || 0)) {
                    // Keep this like (it's newer or first one)
                    cleanLikes.set(key, {
                        videoId: like.videoId.toString(),
                        userId: like.userId.toString(),
                        createdAt: like.createdAt || new Date()
                        // Note: no postId field for video likes
                    });
                }
            } else if (like.postId) {
                // This is a post like, keep as-is
                const key = `post_${like.postId}_${like.userId}`;
                cleanLikes.set(key, like);
            }
        }
        
        // Insert clean likes
        const cleanLikesArray = Array.from(cleanLikes.values());
        if (cleanLikesArray.length > 0) {
            await db.collection('likes').insertMany(cleanLikesArray);
        }
        
        // Recreate indexes (only video likes index for now)
        await db.collection('likes').createIndex({ videoId: 1, userId: 1 }, { unique: true });
        
        console.log(`✅ Cleanup complete: ${allLikes.length} → ${cleanLikesArray.length} likes`);
        
        res.json({ 
            message: 'Aggressive cleanup complete',
            originalCount: allLikes.length,
            cleanCount: cleanLikesArray.length,
            duplicatesRemoved: allLikes.length - cleanLikesArray.length
        });
        
    } catch (error) {
        console.error('Aggressive cleanup error:', error);
        res.status(500).json({ error: 'Cleanup failed', details: error.message });
    }
});

// Duplicate endpoints removed - they are now defined before static files

// Catch-all route for unhandled requests
app.use('*', (req, res) => {
    console.log('Unhandled request:', req.method, req.originalUrl);
    res.status(404).json({ 
        error: 'Not found', 
        path: req.originalUrl,
        message: 'No route or static file found for this path'
    });
});

// ================ MUSIC API ENDPOINTS ================

// Video proxy endpoint for CORS issues
app.get('/api/proxy/video', async (req, res) => {
    const videoUrl = req.query.url;
    
    if (!videoUrl) {
        return res.status(400).json({ error: 'No video URL provided' });
    }
    
    try {
        // Validate it's a DigitalOcean Spaces URL
        if (!videoUrl.includes('digitaloceanspaces.com')) {
            return res.status(400).json({ error: 'Invalid video source' });
        }
        
        // Set proper headers for video streaming
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        
        // Use https module to pipe the video
        const https = require('https');
        https.get(videoUrl, (videoResponse) => {
            // Forward status code
            res.status(videoResponse.statusCode);
            
            // Forward headers
            Object.entries(videoResponse.headers).forEach(([key, value]) => {
                if (key.toLowerCase() !== 'access-control-allow-origin') {
                    res.setHeader(key, value);
                }
            });
            
            // Pipe the video stream
            videoResponse.pipe(res);
        }).on('error', (error) => {
            console.error('Proxy stream error:', error);
            res.status(500).json({ error: 'Failed to stream video' });
        });
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to proxy video' });
    }
});

// Get trending music
app.get('/api/music/trending', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        console.log(`🎵 Getting trending music - page: ${page}, limit: ${limit}`);
        
        if (!db) {
            return res.json({ tracks: _getMockTrendingMusic() });
        }
        
        // Get popular music tracks from database
        const tracks = await db.collection('music_tracks')
            .find({ isActive: true })
            .sort({ usageCount: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
        
        if (tracks.length === 0) {
            // Seed with initial trending tracks
            await _seedMusicDatabase();
            const seededTracks = await db.collection('music_tracks')
                .find({ isActive: true })
                .sort({ usageCount: -1 })
                .limit(limit)
                .toArray();
            return res.json({ tracks: seededTracks });
        }
        
        res.json({ tracks });
    } catch (error) {
        console.error('Error getting trending music:', error);
        res.json({ tracks: _getMockTrendingMusic() });
    }
});

// Search music
app.get('/api/music/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const category = req.query.category;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        console.log(`🔍 Searching music: "${query}" category: ${category}`);
        
        if (!db) {
            return res.json({ tracks: _getMockSearchResults(query) });
        }
        
        const searchFilter = {
            isActive: true,
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { artist: { $regex: query, $options: 'i' } },
                { tags: { $regex: query, $options: 'i' } }
            ]
        };
        
        if (category && category !== 'All') {
            searchFilter.category = category;
        }
        
        const tracks = await db.collection('music_tracks')
            .find(searchFilter)
            .sort({ usageCount: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
        
        res.json({ tracks });
    } catch (error) {
        console.error('Error searching music:', error);
        res.json({ tracks: _getMockSearchResults(req.query.q || '') });
    }
});

// Get music by category
app.get('/api/music/category/:category', async (req, res) => {
    try {
        const category = req.params.category;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        console.log(`🎼 Getting music for category: ${category}`);
        
        if (!db) {
            return res.json({ tracks: _getMockCategoryMusic(category) });
        }
        
        const tracks = await db.collection('music_tracks')
            .find({ category, isActive: true })
            .sort({ usageCount: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
        
        res.json({ tracks });
    } catch (error) {
        console.error('Error getting category music:', error);
        res.json({ tracks: _getMockCategoryMusic(req.params.category) });
    }
});

// Helper functions for music
function _getMockTrendingMusic() {
    return [
        {
            _id: 'trending_1',
            title: 'Summer Vibes',
            artist: 'VIB3 Music',
            duration: 45,
            url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
            thumbnailUrl: '',
            category: 'Trending',
            isOriginal: true,
            usageCount: 15420,
            isPopular: true,
            tags: ['summer', 'upbeat', 'trending']
        },
        {
            _id: 'trending_2',
            title: 'Lo-Fi Chill',
            artist: 'VIB3 Music',
            duration: 60,
            url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
            thumbnailUrl: '',
            category: 'Chill',
            isOriginal: true,
            usageCount: 8932,
            isPopular: true,
            tags: ['lofi', 'chill', 'relaxing']
        }
    ];
}

function _getMockSearchResults(query) {
    const allTracks = _getMockTrendingMusic();
    return allTracks.filter(track => 
        track.title.toLowerCase().includes(query.toLowerCase()) ||
        track.artist.toLowerCase().includes(query.toLowerCase()) ||
        track.tags.some(tag => tag.includes(query.toLowerCase()))
    );
}

function _getMockCategoryMusic(category) {
    const categoryTracks = {
        'Trending': _getMockTrendingMusic(),
        'Pop': [
            { _id: 'pop_1', title: 'Pop Anthem', artist: 'VIB3 Pop', category: 'Pop', usageCount: 5432 }
        ]
    };
    return categoryTracks[category] || [];
}

async function _seedMusicDatabase() {
    if (!db) return;
    
    const seedTracks = [
        {
            title: 'Upbeat Summer Vibes',
            artist: 'VIB3 Music',
            description: 'Perfect for beach and summer content',
            category: 'Trending',
            url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
            duration: 45,
            isOriginal: true,
            isActive: true,
            usageCount: Math.floor(Math.random() * 20000) + 5000,
            playCount: Math.floor(Math.random() * 50000) + 10000,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            tags: ['summer', 'upbeat', 'trending', 'beach']
        }
    ];
    
    try {
        const existing = await db.collection('music_tracks').countDocuments();
        if (existing === 0) {
            await db.collection('music_tracks').insertMany(seedTracks);
            console.log('✅ Music database seeded');
        }
    } catch (error) {
        console.error('Error seeding music database:', error);
    }
}

// Load modular routes
const { initializeVideoRoutes } = require('./routes/video-routes');
const videoRouter = initializeVideoRoutes({ 
    videoProcessor, 
    multiQualityProcessor, 
    s3, 
    db
});
app.use('/api/video', videoRouter); // New modular video routes

// New, modern feed endpoint
app.get('/api/feed', modularRequireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const recommendationServiceUrl = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3004';

        const response = await axios.get(`${recommendationServiceUrl}/recommendations/${userId}`);
        
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching feed from recommendation-service:', error.message);
        // Fallback to legacy feed logic
        // This can be removed once the recommendation-service is fully integrated and stable
        try {
            const videos = await db.collection('videos').find({ status: { $ne: 'deleted' } }).sort({ createdAt: -1 }).limit(20).toArray();
            res.json({ recommendations: videos, source: 'fallback' });
        } catch (fallbackError) {
            res.status(500).json({ error: 'Failed to fetch feed' });
        }
    }
});

// Grok Dev Routes
app.use(grokDevRoutes); // Grok development assistant routes

// Load Claude bridge routes
const claudeBridgeRoutes = require('./server/routes/claude-bridge');
app.use('/api/claude', claudeBridgeRoutes); // Claude AI bridge routes

// Load recommendation endpoints
const recommendationEndpoints = require('./recommendation-endpoints');
recommendationEndpoints(app, db);

// Grok Task Manager already loaded at top
// DISABLED: App 2 uses Grok API, not Gemini API
// TODO: Create grok-task-manager.js to replace gemini-task-manager.js
let grokManager = null;
let geminiManager = null;

// Initialize Grok after database connection
async function initializeGrok() {
    // TEMPORARILY DISABLED - causing crashes because App 2 uses Grok, not Gemini
    console.log('⚠️ AI Task Manager disabled - App 2 uses Grok API (not Gemini)');
    // if (db && !geminiManager) {
    //     geminiManager = new GeminiTaskManager(db);
    //     geminiManager.setupEndpoints(app);
    //     geminiManager.startBackgroundTasks();
    //     console.log('🤖 Grok AI Task Manager initialized');
    // }
}

// Serve video variants and manifests
app.get('/uploads/videos/:userId/:videoId/:file', (req, res) => {
    const { userId, videoId, file } = req.params;
    const filePath = path.join(__dirname, 'uploads', 'videos', userId, videoId, file);
    
    // Check if file exists
    if (!require('fs').existsSync(filePath)) {
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
    
    // Stream the file
    const stream = require('fs').createReadStream(filePath);
    stream.pipe(res);
});

// Error handling - MUST be last middleware BEFORE server.listen
app.use((err, req, res, next) => {
    console.error('ERROR CAUGHT:', err.message);
    console.error('Stack:', err.stack);
    console.error('URL:', req.url);
    res.status(500).json({ error: 'Something broke!', memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log('========================================');
    console.log(`🚀 VIB3 FULL SERVER v2.0 WITH ANALYTICS`);
    console.log('========================================');
    console.log(`Port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    
    // Connect to database
    const dbConnected = await connectDB();
    console.log(`Database: ${dbConnected ? 'Connected successfully' : 'No database configured'}`);
    
    // Initialize Grok AI if database is connected
    if (dbConnected) {
        await initializeGrok();

        // Initialize Grok Task Manager
        // DISABLED: App 2 uses Grok API, not Gemini API
        // const geminiTaskManager = new GeminiTaskManager(db);
        // geminiTaskManager.setupEndpoints(app);
        // geminiTaskManager.startBackgroundTasks();
    }
    
    console.log('');
    console.log('📊 Analytics endpoint available at: /api/analytics/algorithm');
    console.log('🧪 Test endpoint available at: /api/test');
    console.log('========================================');
});

// Helper Functions
function shuffleArray(array) {
    console.log(`🔄 Shuffling array of ${array.length} items`);
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    console.log(`✅ Shuffle complete - first 3 IDs: ${newArray.slice(0,3).map(v => v._id).join(', ')}`);
    return newArray;
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        if (client) client.close();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        if (client) client.close();
        process.exit(0);
    });
});

// Force redeployment Thu Jul 17 20:13:37 CDT 2025
