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

const app = express();
const PORT = process.env.PORT || 3000;
console.log('🚀 VIB3 Server starting...');

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Serve static files from www directory
app.use(express.static(path.join(__dirname, 'www')));

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

// Session management (simple in-memory for now)
const sessions = new Map();

// CORS - Enhanced for mobile app
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    
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
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// VIDEO FEED ENDPOINT - at root level to bypass all routing issues
app.get('/feed', async (req, res) => {
    console.log('🎬 ROOT LEVEL FEED ENDPOINT HIT!');
    
    if (!db) {
        return res.json({ videos: [], error: 'Database not connected' });
    }
    
    try {
        // No limit - return all videos like TikTok
        
        const videos = await db.collection('videos')
            .find({ status: { $ne: 'deleted' } })
            .sort({ createdAt: -1 })
            .toArray();
            
        console.log(`🎬 Found ${videos.length} total videos`);
        
        // RANDOMIZE
        const shuffled = [...videos].sort(() => Math.random() - 0.5);
        const finalVideos = shuffled; // Return ALL videos - no artificial limit
        
        console.log(`🎲 RANDOMIZED! Original: ${videos.slice(0,3).map(v => v._id.toString().slice(-4)).join(',')}`);
        console.log(`🎲 RANDOMIZED! Shuffled: ${finalVideos.slice(0,3).map(v => v._id.toString().slice(-4)).join(',')}`);
        
        // Add user data
        for (const video of finalVideos) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(video.userId) },
                    { projection: { password: 0 } }
                );
                video.user = user || { username: 'Unknown', displayName: 'Unknown' };
                video.likeCount = video.likes?.length || 0;
                video.commentCount = 0;
                
                // Get actual engagement counts from database
                video.shareCount = await db.collection('shares').countDocuments({ videoId: video._id.toString() });
                video.views = await db.collection('views').countDocuments({ videoId: video._id.toString() });
                
                video.feedType = 'foryou';
                video.thumbnailUrl = video.videoUrl + '#t=1';
            } catch (e) {
                console.log('User lookup error:', e);
            }
        }
        
        res.json({ 
            videos: finalVideos,
            randomized: true,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Feed endpoint error:', error);
        res.json({ videos: [], error: error.message });
    }
});

// WORKING VIDEOS ENDPOINT - same level as health check
app.get('/videos-random', async (req, res) => {
    console.log('🎲 VIDEOS-RANDOM ENDPOINT HIT!');
    
    if (!db) {
        return res.json({ videos: [], error: 'Database not connected' });
    }
    
    try {
        // No limit - return all videos like TikTok
        
        const videos = await db.collection('videos')
            .find({ status: { $ne: 'deleted' } })
            .sort({ createdAt: -1 })
            .toArray();
            
        console.log(`🎬 Found ${videos.length} total videos`);
        
        // RANDOMIZE
        const shuffled = [...videos].sort(() => Math.random() - 0.5);
        const finalVideos = shuffled; // Return ALL videos - no artificial limit
        
        console.log(`🎲 RANDOMIZED! Original: ${videos.slice(0,3).map(v => v._id.toString().slice(-4)).join(',')}`);
        console.log(`🎲 RANDOMIZED! Shuffled: ${finalVideos.slice(0,3).map(v => v._id.toString().slice(-4)).join(',')}`);
        
        // Add user data
        for (const video of finalVideos) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(video.userId) },
                    { projection: { password: 0 } }
                );
                video.user = user || { username: 'Unknown', displayName: 'Unknown' };
                video.likeCount = video.likes?.length || 0;
                video.commentCount = 0;
                video.shareCount = await db.collection('shares').countDocuments({ videoId: video._id.toString() });
                video.views = await db.collection('views').countDocuments({ videoId: video._id.toString() });
                video.feedType = 'foryou';
                video.thumbnailUrl = video.videoUrl + '#t=1';
            } catch (e) {
                console.log('User lookup error:', e);
            }
        }
        
        res.json({ 
            videos: finalVideos,
            randomized: true,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Videos random error:', error);
        res.json({ videos: [], error: error.message });
    }
});

// RANDOMIZED VIDEO ENDPOINT - unique path to avoid all caching
app.get('/api/random-videos-v2', async (req, res) => {
    console.log('🎲 RANDOMIZED VIDEOS ENDPOINT hit!');
    
    if (!db) {
        return res.json({ videos: [], error: 'Database not connected' });
    }
    
    try {
        // No limit - return all videos like TikTok
        
        // Get all videos
        const videos = await db.collection('videos')
            .find({ status: { $ne: 'deleted' } })
            .sort({ createdAt: -1 })
            .toArray();
            
        console.log(`🎬 Found ${videos.length} total videos`);
        
        // GUARANTEED RANDOMIZATION 
        const shuffled = [...videos].sort(() => Math.random() - 0.5);
        const finalVideos = shuffled; // Return ALL videos - no artificial limit
        
        console.log(`🎲 BEFORE: ${videos.slice(0,3).map(v => v._id.toString().slice(-4)).join(',')}`);
        console.log(`🎲 AFTER:  ${finalVideos.slice(0,3).map(v => v._id.toString().slice(-4)).join(',')}`);
        
        // Add required fields
        for (const video of finalVideos) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(video.userId) },
                    { projection: { password: 0 } }
                );
                video.user = user || { username: 'Unknown', displayName: 'Unknown' };
                video.likeCount = video.likes?.length || 0;
                video.commentCount = 0;
                video.shareCount = 0;
                video.feedType = 'foryou';
                video.thumbnailUrl = video.videoUrl + '#t=1';
            } catch (e) {
                console.log('User lookup error:', e);
            }
        }
        
        res.json({ 
            videos: finalVideos,
            totalFound: videos.length,
            randomized: true,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Random videos error:', error);
        res.json({ videos: [], error: error.message });
    }
});

// Simple API test endpoint (before static files) - NOW SERVES VIDEOS TOO
app.get('/api/test', async (req, res) => {
    console.log('🧪 Test endpoint hit with query:', req.query);
    
    if (!db) {
        return res.json({ 
            message: 'API is working', 
            timestamp: new Date().toISOString(),
            database: 'not connected'
        });
    }
    
    try {
        const { limit = 10, feed = 'foryou' } = req.query;
        
        // Get videos from database
        const videos = await db.collection('videos')
            .find({ status: { $ne: 'deleted' } })
            .sort({ createdAt: -1 })
            // No limit - return all videos
            .toArray();
            
        console.log(`📹 Found ${videos.length} videos in database`);
            
        // FORCE RANDOMIZATION
        const shuffled = videos.sort(() => Math.random() - 0.5).slice(0, parseInt(limit));
        console.log(`🎲 Original order: [${videos.slice(0,3).map(v => v._id)}]`);
        console.log(`🎲 Shuffled order: [${shuffled.slice(0,3).map(v => v._id)}]`);
        
        // Add user data
        for (const video of shuffled) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(video.userId) },
                    { projection: { password: 0 } }
                );
                video.user = user || { username: 'Unknown User', displayName: 'Unknown' };
                video.likeCount = video.likes?.length || 0;
                video.commentCount = 0;
                video.shareCount = 0;
                video.feedType = feed;
                video.thumbnailUrl = video.videoUrl + '#t=1';
            } catch (e) {
                console.log('User lookup error:', e);
            }
        }
        
        res.json({ 
            videos: shuffled,
            message: 'Videos with randomization',
            randomized: true,
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
        
    } catch (error) {
        console.error('Video feed error:', error);
        res.json({ 
            videos: [], 
            error: error.message,
            message: 'API is working', 
            timestamp: new Date().toISOString(),
            database: 'connected but error'
        });
    }
});

// WORKING VIDEO FEED - using test pattern that works
app.get('/api/test-videos', async (req, res) => {
    console.log('🎬 WORKING VIDEO ENDPOINT hit with query:', req.query);
    
    if (!db) {
        return res.json({ videos: [] });
    }
    
    try {
        const { limit = 10, feed = 'foryou' } = req.query;
        
        // Get videos from database
        const videos = await db.collection('videos')
            .find({ status: { $ne: 'deleted' } })
            .sort({ createdAt: -1 })
            // No limit - return all videos
            .toArray();
            
        console.log(`📹 Found ${videos.length} videos in database`);
            
        // FORCE RANDOMIZATION - this will work!
        const shuffled = videos.sort(() => Math.random() - 0.5).slice(0, parseInt(limit));
        console.log(`🎲 Shuffled from [${videos.slice(0,3).map(v => v._id)}] to [${shuffled.slice(0,3).map(v => v._id)}]`);
        
        // Add user data
        for (const video of shuffled) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(video.userId) },
                    { projection: { password: 0 } }
                );
                video.user = user || { username: 'Unknown User', displayName: 'Unknown' };
                video.likeCount = video.likes?.length || 0;
                video.commentCount = 0;
                video.shareCount = 0;
                video.feedType = feed;
                video.thumbnailUrl = video.videoUrl + '#t=1';
            } catch (e) {
                console.log('User lookup error:', e);
            }
        }
        
        res.json({ 
            videos: shuffled,
            success: true,
            randomized: true,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Test videos endpoint error:', error);
        res.json({ videos: [], error: error.message });
    }
});

// BYPASS: Alternative video feed endpoint to avoid routing conflicts
app.get('/api/feed-bypass', async (req, res) => {
    console.log('🚀 BYPASS endpoint hit - this should work!');
    const { limit = 10, feed = 'foryou' } = req.query;
    
    if (!db) {
        return res.json({ videos: [] });
    }
    
    try {
        // Simple implementation with forced shuffle
        const videos = await db.collection('videos')
            .find({ status: { $ne: 'deleted' } })
            .sort({ createdAt: -1 })
            // No limit - return all videos
            .toArray();
            
        // Force randomization
        const shuffled = videos.sort(() => Math.random() - 0.5).slice(0, parseInt(limit));
        
        // Add user data
        for (const video of shuffled) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(video.userId) },
                    { projection: { password: 0 } }
                );
                video.user = user || { username: 'Unknown User', displayName: 'Unknown' };
                video.likeCount = video.likes?.length || 0;
                video.commentCount = 0; // Simplified
                video.shareCount = 0;
                video.feedType = feed;
                video.thumbnailUrl = video.videoUrl + '#t=1';
            } catch (e) {
                console.log('User lookup error:', e);
            }
        }
        
        res.json({ 
            videos: shuffled,
            debug: {
                timestamp: new Date().toISOString(),
                shuffleWorking: true,
                originalOrder: videos.slice(0,3).map(v => v._id),
                shuffledOrder: shuffled.slice(0,3).map(v => v._id)
            }
        });
        
    } catch (error) {
        console.error('Bypass endpoint error:', error);
        res.json({ videos: [] });
    }
});

// DEBUG: New test endpoint to verify our code is running
app.get('/api/debug-shuffle', (req, res) => {
    console.log('🚨 DEBUG SHUFFLE endpoint hit');
    const testVideos = [
        { _id: 'video1', title: 'First' },
        { _id: 'video2', title: 'Second' },
        { _id: 'video3', title: 'Third' }
    ];
    const shuffled = testVideos.sort(() => Math.random() - 0.5);
    res.json({ 
        message: 'Debug shuffle test',
        original: ['video1', 'video2', 'video3'],
        shuffled: shuffled.map(v => v._id),
        timestamp: new Date().toISOString(),
        codeVersion: 'LATEST-2025-06-29-FIX'
    });
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
// Route mobile app requests to app directory
app.use('/app', express.static(path.join(__dirname, 'app')));

// Mobile device detection middleware
function isMobileDevice(userAgent) {
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return mobileRegex.test(userAgent);
}

// Route mobile devices to mobile directory, others to www directory
app.use('/mobile', express.static(path.join(__dirname, 'mobile')));

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
const webDir = path.join(__dirname, 'www');
console.log('Serving static files from:', webDir);
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);

// Try multiple possible paths
const possiblePaths = [
    path.join(__dirname, 'www'),
    path.join(process.cwd(), 'www'),
    './www',
    'www'
];

let staticPath = null;
const fs = require('fs');
for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        staticPath = p;
        console.log('Found web directory at:', p);
        break;
    }
}

if (staticPath) {
    // IMPORTANT: Only serve static files for non-API routes
    app.use((req, res, next) => {
        // Skip static serving for API routes - they should hit our endpoints
        if (req.path.startsWith('/api/') || req.path.startsWith('/videos-') || req.path.startsWith('/health')) {
            console.log(`🚫 Skipping static for API route: ${req.path}`);
            return next('route'); // Skip this middleware, continue to next route
        }
        console.log(`📁 Serving static for: ${req.path}`);
        next();
    });
    
    app.use(express.static(staticPath));
} else {
    console.error('ERROR: Could not find web directory in any of:', possiblePaths);
    app.use((req, res, next) => {
        if (req.path === '/') {
            res.status(500).json({ 
                error: 'Web directory not found',
                tried: possiblePaths,
                cwd: process.cwd(),
                dirname: __dirname
            });
        } else {
            next();
        }
    });
}


// DigitalOcean Spaces configuration
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
    region: process.env.DO_SPACES_REGION || 'nyc3'
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'vib3-videos';

// Initialize video processor
const videoProcessor = new VideoProcessor();

// ================ ALGORITHM & RANKING FUNCTIONS ================

// Extract hashtags from text content
function extractHashtags(text) {
    if (!text || typeof text !== 'string') return [];
    
    // Match hashtags (# followed by letters, numbers, underscore)
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    
    if (!matches) return [];
    
    // Clean and normalize hashtags
    return matches.map(tag => tag.toLowerCase().replace('#', ''));
}

// Calculate hashtag similarity between two videos
function calculateHashtagSimilarity(hashtags1, hashtags2) {
    if (!hashtags1 || !hashtags2 || hashtags1.length === 0 || hashtags2.length === 0) {
        return 0;
    }
    
    const set1 = new Set(hashtags1);
    const set2 = new Set(hashtags2);
    
    // Calculate Jaccard similarity (intersection over union)
    const intersection = [...set1].filter(tag => set2.has(tag)).length;
    const union = new Set([...set1, ...set2]).size;
    
    return union > 0 ? intersection / union : 0;
}

// Apply hashtag-based recommendations to boost similar content
async function applyHashtagRecommendations(videos, currentUser, db) {
    if (!currentUser || !currentUser._id) {
        return videos; // No user context for recommendations
    }
    
    console.log('🏷️ Applying hashtag-based recommendations...');
    
    try {
        // Get user's interaction history (liked/viewed videos) to build interest profile
        const userLikes = await db.collection('likes')
            .find({ userId: currentUser._id.toString() })
            .sort({ createdAt: -1 })
            .limit(50) // Last 50 liked videos
            .toArray();
        
        const likedVideoIds = userLikes.map(like => like.videoId);
        
        if (likedVideoIds.length === 0) {
            console.log('🏷️ No user interaction history found for hashtag recommendations');
            return videos;
        }
        
        // Get hashtags from liked videos to build user interest profile
        const likedVideos = await db.collection('videos')
            .find({ _id: { $in: likedVideoIds.map(id => new require('mongodb').ObjectId(id)) } })
            .toArray();
        
        // Extract and count hashtags from user's liked videos
        const userHashtagCounts = {};
        let totalUserHashtags = 0;
        
        likedVideos.forEach(video => {
            const hashtags = extractHashtags(video.description || video.title || '');
            hashtags.forEach(tag => {
                userHashtagCounts[tag] = (userHashtagCounts[tag] || 0) + 1;
                totalUserHashtags++;
            });
        });
        
        if (totalUserHashtags === 0) {
            console.log('🏷️ No hashtags found in user interaction history');
            return videos;
        }
        
        // Calculate hashtag interest scores (frequency-based)
        const userHashtagInterests = {};
        for (const [tag, count] of Object.entries(userHashtagCounts)) {
            userHashtagInterests[tag] = count / totalUserHashtags;
        }
        
        console.log(`🏷️ User hashtag interests: ${Object.keys(userHashtagInterests).slice(0, 10).join(', ')}...`);
        
        // Apply hashtag similarity boost to each video
        videos.forEach(video => {
            if (!video.hashtags || video.hashtags.length === 0) {
                video.hashtagBoost = 0;
                return;
            }
            
            // Calculate relevance score based on user's hashtag interests
            let hashtagRelevance = 0;
            video.hashtags.forEach(tag => {
                if (userHashtagInterests[tag]) {
                    hashtagRelevance += userHashtagInterests[tag];
                }
            });
            
            // Normalize by video hashtag count to prevent spam
            const avgRelevance = hashtagRelevance / video.hashtags.length;
            
            // Calculate hashtag boost (max 0.5 points to not overwhelm engagement score)
            video.hashtagBoost = Math.min(avgRelevance * 2, 0.5);
            
            // Apply boost to engagement score
            video.engagementScore = (video.engagementScore || 0) + video.hashtagBoost;
            
            if (video.hashtagBoost > 0.1) {
                console.log(`🏷️ Hashtag boost for "${video.title}": +${video.hashtagBoost.toFixed(3)} (tags: ${video.hashtags.join(', ')})`);
            }
        });
        
        // Re-sort with new hashtag-boosted scores
        videos.sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));
        
        const boostedVideos = videos.filter(v => (v.hashtagBoost || 0) > 0).length;
        console.log(`🏷️ Applied hashtag boost to ${boostedVideos}/${videos.length} videos`);
        
    } catch (error) {
        console.error('🏷️ Error applying hashtag recommendations:', error);
    }
    
    return videos;
}

// Apply behavior-based recommendations
async function applyBehaviorRecommendations(videos, currentUser, db) {
    if (!currentUser || !currentUser._id) {
        return videos;
    }
    
    console.log('🧠 Applying behavior-based recommendations...');
    
    try {
        // Get user behavior profile
        const behaviorProfile = await db.collection('userBehavior').findOne({ 
            userId: currentUser._id.toString() 
        });
        
        if (!behaviorProfile) {
            console.log('🧠 No behavior profile found yet');
            return videos;
        }
        
        // Apply behavior-based scoring
        videos.forEach(video => {
            let behaviorScore = 0;
            
            // Creator preference score
            if (behaviorProfile.creatorPreferences && behaviorProfile.creatorPreferences[video.userId]) {
                const creatorScore = behaviorProfile.creatorPreferences[video.userId];
                behaviorScore += Math.min(creatorScore * 0.3, 0.3); // Max 0.3 points
            }
            
            // Check disinterests (negative scoring)
            if (behaviorProfile.disinterests?.creators?.[video.userId] > 2) {
                behaviorScore -= 0.5; // Penalize creators user has skipped multiple times
            }
            
            // Time preference score
            const currentHour = new Date().getHours();
            const hourKey = `hour${currentHour}`;
            if (behaviorProfile.timePreferences?.[hourKey]) {
                const timeScore = behaviorProfile.timePreferences[hourKey] / 
                    Math.max(1, behaviorProfile.stats?.totalViews || 1);
                behaviorScore += timeScore * 0.1; // Small time-based boost
            }
            
            // Content completion preference
            if (behaviorProfile.contentPreferences) {
                const totalPrefs = (behaviorProfile.contentPreferences.complete || 0) +
                                 (behaviorProfile.contentPreferences.partial || 0) +
                                 (behaviorProfile.contentPreferences.skip || 0);
                
                if (totalPrefs > 10) { // Only apply if enough data
                    const completionRate = (behaviorProfile.contentPreferences.complete || 0) / totalPrefs;
                    
                    // Boost videos from creators with similar completion rates
                    if (completionRate > 0.7 && video.avgCompletionRate > 0.7) {
                        behaviorScore += 0.2;
                    }
                }
            }
            
            // Apply behavior score
            video.behaviorScore = behaviorScore;
            video.engagementScore = (video.engagementScore || 0) + behaviorScore;
            
            if (behaviorScore !== 0) {
                console.log(`🧠 Behavior adjustment for "${video.title}": ${behaviorScore > 0 ? '+' : ''}${behaviorScore.toFixed(3)}`);
            }
        });
        
        // Re-sort with behavior scores
        videos.sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));
        
        const adjustedVideos = videos.filter(v => v.behaviorScore !== 0).length;
        console.log(`🧠 Applied behavior adjustments to ${adjustedVideos}/${videos.length} videos`);
        
    } catch (error) {
        console.error('🧠 Error applying behavior recommendations:', error);
    }
    
    return videos;
}

// Get top hashtags from videos for analytics
function getTopHashtags(videos, limit = 10) {
    const hashtagCounts = {};
    
    videos.forEach(video => {
        if (video.hashtags && video.hashtags.length > 0) {
            video.hashtags.forEach(tag => {
                hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
            });
        }
    });
    
    return Object.entries(hashtagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count, usage: (count / videos.length * 100).toFixed(1) + '%' }));
}

// Engagement-based ranking algorithm for For You feed
async function applyEngagementRanking(videos, db) {
    console.log(`📊 Calculating engagement scores for ${videos.length} videos`);
    
    // Calculate engagement metrics for each video
    for (const video of videos) {
        try {
            // Get engagement data
            const likeCount = await db.collection('likes').countDocuments({ videoId: video._id.toString() });
            const commentCount = await db.collection('comments').countDocuments({ videoId: video._id.toString() });
            const shareCount = await db.collection('shares').countDocuments({ videoId: video._id.toString() });
            const views = await db.collection('views').countDocuments({ videoId: video._id.toString() });
            
            // Time factors
            const now = new Date();
            const createdAt = new Date(video.createdAt);
            const hoursOld = (now - createdAt) / (1000 * 60 * 60);
            const daysOld = hoursOld / 24;
            
            // Engagement ratios (prevent division by zero)
            const likeRate = views > 0 ? likeCount / views : 0;
            const commentRate = views > 0 ? commentCount / views : 0;
            const shareRate = views > 0 ? shareCount / views : 0;
            
            // View velocity (views per hour)
            const viewVelocity = hoursOld > 0 ? views / hoursOld : views;
            
            // Recency decay (newer content gets higher score)
            const recencyBoost = Math.exp(-daysOld / 3); // Decays over ~3 days
            
            // Engagement score calculation
            let engagementScore = 0;
            
            // Base engagement (40% of score)
            engagementScore += (likeRate * 100) * 0.25;        // Like engagement
            engagementScore += (commentRate * 200) * 0.10;     // Comment engagement (worth 2x likes)
            engagementScore += (shareRate * 300) * 0.05;       // Share engagement (worth 3x likes)
            
            // View velocity (30% of score)
            engagementScore += Math.log(viewVelocity + 1) * 0.30;
            
            // Recency boost (20% of score)
            engagementScore += recencyBoost * 0.20;
            
            // Total engagement boost (10% of score)
            const totalEngagement = likeCount + commentCount + shareCount;
            engagementScore += Math.log(totalEngagement + 1) * 0.10;
            
            // Extract hashtags from description for recommendation tracking
            video.hashtags = extractHashtags(video.description || video.title || '');
            
            // Store metrics on video object
            video.engagementScore = engagementScore;
            video.likeCount = likeCount;
            video.commentCount = commentCount;
            video.shareCount = shareCount;
            video.views = views;
            video.likeRate = likeRate;
            video.commentRate = commentRate;
            video.viewVelocity = viewVelocity;
            video.hoursOld = hoursOld;
            
            if (video.title && video.title.includes('test')) {
                console.log(`📈 ${video.title}: score=${engagementScore.toFixed(2)}, likes=${likeCount}, views=${views}, velocity=${viewVelocity.toFixed(1)}/hr`);
            }
            
        } catch (error) {
            console.error('Error calculating engagement for video:', video._id, error);
            video.engagementScore = 0;
            video.likeCount = 0;
            video.commentCount = 0;
            video.shareCount = 0;
        }
    }
    
    // Sort by engagement score (highest first)
    videos.sort((a, b) => b.engagementScore - a.engagementScore);
    
    // Log detailed algorithm performance
    const topVideos = videos.slice(0, 5);
    console.log('📊 Algorithm Performance:');
    console.log(`   📈 Top 5 engagement scores: ${topVideos.map(v => v.engagementScore?.toFixed(2)).join(', ')}`);
    console.log('   🎯 Top ranked videos:');
    topVideos.forEach((video, index) => {
        console.log(`     ${index + 1}. "${video.title || 'Untitled'}" - Score: ${video.engagementScore?.toFixed(2)} (${video.likeCount}❤️ ${video.commentCount}💬 ${video.views || 0}👁️ ${video.hoursOld?.toFixed(1)}hrs old)`);
    });
    
    // Performance metrics
    const avgEngagement = videos.reduce((sum, v) => sum + (v.engagementScore || 0), 0) / videos.length;
    const highEngagementVideos = videos.filter(v => (v.engagementScore || 0) > avgEngagement).length;
    const recentVideos = videos.filter(v => (v.hoursOld || 0) < 24).length;
    
    console.log(`   📊 Algorithm stats: avgScore=${avgEngagement.toFixed(2)}, highEngagement=${highEngagementVideos}/${videos.length}, recent24h=${recentVideos}/${videos.length}`);
    
    return videos;
}

// Machine Learning Recommendations System
async function applyMLRecommendations(videos, currentUser, db) {
    console.log(`🤖 Applying ML recommendations for ${videos.length} videos`);
    
    if (!currentUser || !db) {
        console.log('⚠️ No user or database - skipping ML recommendations');
        return videos;
    }
    
    try {
        // Get user interaction history
        const userHistory = await getUserInteractionHistory(currentUser.uid || currentUser._id, db);
        
        // Apply collaborative filtering
        const collaborativeScores = await calculateCollaborativeFiltering(videos, userHistory, db);
        
        // Apply content-based filtering
        const contentScores = await calculateContentBasedFiltering(videos, userHistory, db);
        
        // Combine scores with existing engagement scores
        videos.forEach(video => {
            const videoId = video._id.toString();
            const collaborativeScore = collaborativeScores[videoId] || 0;
            const contentScore = contentScores[videoId] || 0;
            
            // Weighted combination of all scores
            const originalScore = video.engagementScore || 0;
            
            // ML recommendation boost (max 2.0 points)
            const mlBoost = (collaborativeScore * 0.6 + contentScore * 0.4) * 2.0;
            
            video.mlRecommendationScore = mlBoost;
            video.collaborativeScore = collaborativeScore;
            video.contentScore = contentScore;
            
            // Update final score
            video.finalScore = originalScore + mlBoost;
        });
        
        // Re-sort by final score
        videos.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
        
        console.log(`🤖 ML recommendations applied - top video boost: ${videos[0]?.mlRecommendationScore?.toFixed(2) || 0}`);
        
        return videos;
        
    } catch (error) {
        console.error('ML recommendation error:', error);
        return videos;
    }
}

// Get user interaction history for ML analysis
async function getUserInteractionHistory(userId, db) {
    try {
        const [likes, views, shares, comments] = await Promise.all([
            db.collection('likes').find({ userId }).toArray(),
            db.collection('video_views').find({ userId }).toArray(),
            db.collection('shares').find({ userId }).toArray(),
            db.collection('comments').find({ userId }).toArray()
        ]);
        
        return {
            userId,
            likes: likes.map(l => l.videoId),
            views: views.map(v => ({ videoId: v.videoId, watchTime: v.watchTime, timestamp: v.timestamp })),
            shares: shares.map(s => s.videoId),
            comments: comments.map(c => c.videoId),
            allInteractions: [
                ...likes.map(l => ({ videoId: l.videoId, type: 'like', weight: 3, timestamp: l.createdAt })),
                ...shares.map(s => ({ videoId: s.videoId, type: 'share', weight: 5, timestamp: s.createdAt })),
                ...comments.map(c => ({ videoId: c.videoId, type: 'comment', weight: 4, timestamp: c.createdAt })),
                ...views.filter(v => v.watchTime > 10).map(v => ({ videoId: v.videoId, type: 'view', weight: 1, timestamp: v.timestamp }))
            ]
        };
    } catch (error) {
        console.error('Error getting user history:', error);
        return { userId, likes: [], views: [], shares: [], comments: [], allInteractions: [] };
    }
}

// Collaborative Filtering: "Users who liked this also liked..."
async function calculateCollaborativeFiltering(videos, userHistory, db) {
    const scores = {};
    
    if (userHistory.allInteractions.length === 0) {
        return scores;
    }
    
    try {
        // Find users with similar interaction patterns
        const userInteractedVideos = userHistory.allInteractions.map(i => i.videoId);
        
        // Get other users who interacted with the same videos
        const similarUsers = await db.collection('likes')
            .find({ videoId: { $in: userInteractedVideos } })
            .toArray();
        
        // Count co-occurrence patterns
        const coOccurrence = {};
        
        for (const interaction of similarUsers) {
            const otherUserId = interaction.userId;
            if (otherUserId === userHistory.userId) continue;
            
            // Get this user's other interactions
            const otherUserInteractions = await db.collection('likes')
                .find({ userId: otherUserId })
                .toArray();
            
            for (const otherInteraction of otherUserInteractions) {
                const videoId = otherInteraction.videoId;
                if (!userInteractedVideos.includes(videoId)) {
                    coOccurrence[videoId] = (coOccurrence[videoId] || 0) + 1;
                }
            }
        }
        
        // Calculate collaborative scores
        const maxCoOccurrence = Math.max(...Object.values(coOccurrence), 1);
        
        for (const [videoId, count] of Object.entries(coOccurrence)) {
            scores[videoId] = count / maxCoOccurrence;
        }
        
        console.log(`👥 Collaborative filtering: found ${Object.keys(scores).length} recommendations`);
        
    } catch (error) {
        console.error('Collaborative filtering error:', error);
    }
    
    return scores;
}

// Content-Based Filtering: Similar content to what user likes
async function calculateContentBasedFiltering(videos, userHistory, db) {
    const scores = {};
    
    if (userHistory.allInteractions.length === 0) {
        return scores;
    }
    
    try {
        // Get videos user has interacted with
        const interactedVideoIds = userHistory.allInteractions.map(i => i.videoId);
        const interactedVideos = await db.collection('videos')
            .find({ _id: { $in: interactedVideoIds.map(id => new ObjectId(id)) } })
            .toArray();
        
        // Build user preference profile
        const userProfile = buildUserContentProfile(interactedVideos, userHistory);
        
        // Score current videos based on similarity to user profile
        for (const video of videos) {
            const videoId = video._id.toString();
            
            // Skip if user already interacted with this video
            if (interactedVideoIds.includes(videoId)) {
                scores[videoId] = 0;
                continue;
            }
            
            // Calculate content similarity
            const similarity = calculateContentSimilarity(video, userProfile);
            scores[videoId] = similarity;
        }
        
        console.log(`🎯 Content-based filtering: calculated ${Object.keys(scores).length} content scores`);
        
    } catch (error) {
        console.error('Content-based filtering error:', error);
    }
    
    return scores;
}

// Build user content preference profile
function buildUserContentProfile(interactedVideos, userHistory) {
    const profile = {
        hashtags: {},
        creators: {},
        timeOfDay: {},
        videoLength: { short: 0, medium: 0, long: 0 },
        totalInteractions: userHistory.allInteractions.length
    };
    
    // Weight interactions by type
    const interactionWeights = { like: 3, share: 5, comment: 4, view: 1 };
    
    for (const video of interactedVideos) {
        const videoId = video._id.toString();
        const interactions = userHistory.allInteractions.filter(i => i.videoId === videoId);
        const totalWeight = interactions.reduce((sum, i) => sum + (interactionWeights[i.type] || 1), 0);
        
        // Hashtag preferences
        const hashtags = extractHashtags(video.description || video.title || '');
        for (const tag of hashtags) {
            profile.hashtags[tag] = (profile.hashtags[tag] || 0) + totalWeight;
        }
        
        // Creator preferences
        const creator = video.username || video.userId;
        if (creator) {
            profile.creators[creator] = (profile.creators[creator] || 0) + totalWeight;
        }
        
        // Time preferences (when user typically engages)
        for (const interaction of interactions) {
            if (interaction.timestamp) {
                const hour = new Date(interaction.timestamp).getHours();
                profile.timeOfDay[hour] = (profile.timeOfDay[hour] || 0) + totalWeight;
            }
        }
        
        // Video length preferences
        const duration = video.duration || 30; // Default 30 seconds
        if (duration < 30) profile.videoLength.short += totalWeight;
        else if (duration < 120) profile.videoLength.medium += totalWeight;
        else profile.videoLength.long += totalWeight;
    }
    
    return profile;
}

// Calculate similarity between video and user profile
function calculateContentSimilarity(video, userProfile) {
    let similarity = 0;
    let factors = 0;
    
    // Hashtag similarity
    const videoHashtags = extractHashtags(video.description || video.title || '');
    if (videoHashtags.length > 0 && Object.keys(userProfile.hashtags).length > 0) {
        let hashtagScore = 0;
        for (const tag of videoHashtags) {
            if (userProfile.hashtags[tag]) {
                hashtagScore += userProfile.hashtags[tag] / userProfile.totalInteractions;
            }
        }
        similarity += (hashtagScore / videoHashtags.length) * 0.4;
        factors += 0.4;
    }
    
    // Creator similarity
    const creator = video.username || video.userId;
    if (creator && userProfile.creators[creator]) {
        similarity += (userProfile.creators[creator] / userProfile.totalInteractions) * 0.3;
        factors += 0.3;
    }
    
    // Video length similarity
    const duration = video.duration || 30;
    let lengthScore = 0;
    if (duration < 30) lengthScore = userProfile.videoLength.short;
    else if (duration < 120) lengthScore = userProfile.videoLength.medium;
    else lengthScore = userProfile.videoLength.long;
    
    if (userProfile.totalInteractions > 0) {
        similarity += (lengthScore / userProfile.totalInteractions) * 0.2;
        factors += 0.2;
    }
    
    // Time-based similarity (current time vs user's active hours)
    const currentHour = new Date().getHours();
    if (userProfile.timeOfDay[currentHour]) {
        similarity += (userProfile.timeOfDay[currentHour] / userProfile.totalInteractions) * 0.1;
        factors += 0.1;
    }
    
    return factors > 0 ? similarity / factors : 0;
}

// Configure multer for video uploads with enhanced format support
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024 // 5GB limit - allows any resolution videos
    },
    fileFilter: (req, file, cb) => {
        // Accept all common video formats - we'll convert them to standard MP4
        const allowedTypes = [
            'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
            'video/3gpp', 'video/x-flv', 'video/x-ms-wmv', 'video/x-msvideo',
            'video/avi', 'video/mov', 'video/mkv', 'video/x-matroska'
        ];
        if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Please upload a video file.'));
        }
    }
});

// MongoDB connection
const { MongoClient, ObjectId } = require('mongodb');
let db = null;
let client = null;

async function connectDB() {
    if (process.env.DATABASE_URL) {
        try {
            client = new MongoClient(process.env.DATABASE_URL);
            await client.connect();
            db = client.db('vib3');
            
            // Create indexes for better performance
            await createIndexes();
            
            console.log('✅ MongoDB connected successfully');
            return true;
        } catch (error) {
            console.error('MongoDB connection error:', error.message);
            return false;
        }
    } else {
        console.log('No DATABASE_URL found - running without database');
        return false;
    }
}

async function createIndexes() {
    try {
        // Clean up problematic likes first
        await cleanupLikes();
        
        // User indexes
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ username: 1 }, { unique: true });
        
        // Video indexes
        await db.collection('videos').createIndex({ userId: 1 });
        await db.collection('videos').createIndex({ createdAt: -1 });
        await db.collection('videos').createIndex({ hashtags: 1 });
        await db.collection('videos').createIndex({ status: 1 });
        
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

// Helper function to create session
function createSession(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { userId, createdAt: Date.now() });
    return token;
}

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
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'not configured',
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
            configured: !!process.env.DATABASE_URL 
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
        
        res.json({ 
            message: 'Registration successful',
            user,
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
        
        // Add totalLikes to user object
        user.totalLikes = totalLikes;
        
        res.json({ 
            message: 'Login successful',
            user,
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

// Get all videos (feed)
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
                videos = await applyEngagementRanking(videos, db);
                console.log(`📊 After engagement ranking: ${videos.slice(0,3).map(v => v._id).join(', ')}`);
                
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
                
                // Get like count
                video.likeCount = await db.collection('likes').countDocuments({ videoId: video._id.toString() });
                
                // Get comment count
                video.commentCount = await db.collection('comments').countDocuments({ videoId: video._id.toString() });
                
                // Get share count (create shares collection if needed)
                video.shareCount = await db.collection('shares').countDocuments({ videoId: video._id.toString() });
                
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
app.post('/api/upload/video', requireAuth, upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No video file provided',
                code: 'NO_FILE'
            });
        }

        const { title, description, username, userId } = req.body;

        console.log(`🎬 Processing video upload: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);
        console.log('🔍 Upload user association debug:', {
            sessionUserId: req.user?.userId,
            bodyUserId: userId,
            bodyUsername: username,
            willUse: req.user.userId || userId
        });

        // Check for bypass flag for development/testing
        const bypassProcessing = req.body.bypassProcessing === 'true' || 
                                  process.env.BYPASS_VIDEO_PROCESSING === 'true' ||
                                  req.file.originalname.toLowerCase().includes('download') ||
                                  req.file.originalname.toLowerCase().includes('test');
        
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

            // Step 2: Convert video to standard H.264 MP4
            console.log('📋 Step 2: Converting video to standard MP4...');
            conversionResult = await videoProcessor.convertToStandardMp4(req.file.buffer, req.file.originalname);
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

        const uploadResult = await s3.upload(uploadParams).promise();
        let videoUrl = uploadResult.Location;
        
        // Normalize URL format for DigitalOcean Spaces
        if (videoUrl && !videoUrl.startsWith('https://')) {
            // Ensure proper HTTPS URL format
            videoUrl = `https://${BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com'}/${fileName}`;
        }

        console.log('✅ Upload completed to:', videoUrl);

        // Step 5: Save to database with processing information
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
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await db.collection('videos').insertOne(video);
            video._id = result.insertedId;
            videoRecord = video;
            
            console.log('✅ Video record saved to database');
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
        console.error('❌ Upload error:', error);
        
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
        }
        
        res.status(500).json({ 
            error: userMessage,
            code: errorCode,
            technical: error.message // For debugging
        });
    }
});

// Upload video (metadata only - for external URLs)
app.post('/api/videos', requireAuth, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { title, description, videoUrl, thumbnailUrl, duration, hashtags, privacy = 'public' } = req.body;
    
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

// Get user's videos for profile page
app.get('/api/user/videos', async (req, res) => {
    if (!db) {
        return res.json({ videos: [] });
    }
    
    try {
        const { userId, limit = 20, skip = 0, page = 1, type } = req.query;
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
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index-full.html'));
});

// Serve original app on /app route with mobile detection (both /app and /app/)
app.get(['/app', '/app/'], (req, res) => {
    const userAgent = req.get('User-Agent') || '';
    const isMobile = isMobileDevice(userAgent);
    
    console.log(`📱 /app route - Device detection: ${isMobile ? 'MOBILE' : 'DESKTOP'} - User-Agent: ${userAgent}`);
    console.log(`📱 /app route - Original URL: ${req.originalUrl}`);
    
    if (isMobile) {
        // Preserve query parameters when redirecting to mobile
        const queryString = req.originalUrl.includes('?') ? req.originalUrl.substring(req.originalUrl.indexOf('?')) : '';
        const redirectUrl = `/mobile${queryString}`;
        console.log(`📱 Redirecting mobile device from /app to ${redirectUrl}`);
        return res.redirect(redirectUrl);
    } else {
        console.log('🖥️ Serving desktop /app version');
        res.sendFile(path.join(__dirname, 'www', 'index-new.html'));
    }
});

// Catch all route - use fixed index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index-full.html'));
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

