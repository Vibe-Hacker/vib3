// Recommendation Engine Endpoints for VIB3
const { ObjectId } = require('mongodb');

// Export a function that adds recommendation endpoints to the Express app
module.exports = function(app, db) {
    
    // Track video view with watch time
    app.post('/api/analytics/video-view', async (req, res) => {
        try {
            const { videoId, userId, watchTime, completed } = req.body;
            
            // Record the view with timestamp
            await db.collection('video_views').insertOne({
                videoId,
                userId,
                watchTime: watchTime || 0,
                completed: completed || false,
                timestamp: new Date(),
                sessionId: req.headers['x-session-id'] || null
            });
            
            // Update video metrics
            await db.collection('video_metrics').updateOne(
                { videoId },
                {
                    $inc: {
                        views: 1,
                        totalWatchTime: watchTime || 0,
                        completions: completed ? 1 : 0
                    },
                    $set: { lastUpdated: new Date() }
                },
                { upsert: true }
            );
            
            // Update user interaction history
            await db.collection('user_interactions').insertOne({
                userId,
                videoId,
                action: 'view',
                watchTime,
                completed,
                timestamp: new Date()
            });
            
            res.json({ success: true });
        } catch (error) {
            console.error('Error tracking video view:', error);
            res.status(500).json({ error: 'Failed to track view' });
        }
    });
    
    // Track user interactions (like, comment, share, follow)
    app.post('/api/analytics/interaction', async (req, res) => {
        try {
            const { userId, videoId, action, value } = req.body;
            
            // Record the interaction
            await db.collection('user_interactions').insertOne({
                userId,
                videoId,
                action, // 'like', 'comment', 'share', 'follow', 'skip'
                value: value || 1,
                timestamp: new Date()
            });
            
            // Update video metrics based on action
            const metricUpdate = {};
            switch (action) {
                case 'like':
                    metricUpdate.likes = 1;
                    break;
                case 'comment':
                    metricUpdate.comments = 1;
                    break;
                case 'share':
                    metricUpdate.shares = 1;
                    break;
            }
            
            if (Object.keys(metricUpdate).length > 0) {
                await db.collection('video_metrics').updateOne(
                    { videoId },
                    {
                        $inc: metricUpdate,
                        $set: { lastUpdated: new Date() }
                    },
                    { upsert: true }
                );
            }
            
            // Update user preferences based on video metadata
            if (action !== 'skip') {
                const video = await db.collection('videos').findOne({ _id: new ObjectId(videoId) });
                if (video) {
                    await updateUserPreferences(db, userId, video, action);
                }
            }
            
            res.json({ success: true });
        } catch (error) {
            console.error('Error tracking interaction:', error);
            res.status(500).json({ error: 'Failed to track interaction' });
        }
    });
    
    // Get personalized video recommendations
    app.get('/api/videos/foryou/:userId', async (req, res) => {
        try {
            const { userId } = req.params;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            
            // Get user preferences
            const userPrefs = await db.collection('user_preferences').findOne({ userId });
            
            // Get all candidate videos
            let candidateVideos = await db.collection('videos')
                .find({ status: { $ne: 'deleted' } })
                .sort({ createdAt: -1 })
                .limit(200) // Get more candidates for scoring
                .toArray();
            
            // Score videos based on user preferences
            let scoredVideos = await scoreVideosForUser(db, userId, candidateVideos, userPrefs);
            
            // Mix in some random videos for exploration (10%)
            const explorationCount = Math.ceil(limit * 0.1);
            const recommendedCount = limit - explorationCount;
            
            // Get top scored videos
            const recommendedVideos = scoredVideos.slice(offset, offset + recommendedCount);
            
            // Get random videos for exploration
            const remainingVideos = candidateVideos.filter(v => 
                !recommendedVideos.find(r => r._id.toString() === v._id.toString())
            );
            const explorationVideos = remainingVideos
                .sort(() => Math.random() - 0.5)
                .slice(0, explorationCount);
            
            // Combine and shuffle slightly
            let finalVideos = [...recommendedVideos, ...explorationVideos];
            
            // Add user data and metrics to videos
            for (const video of finalVideos) {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(video.userId) },
                    { projection: { password: 0 } }
                );
                video.user = user || { username: 'Unknown' };
                video.likeCount = video.likes?.length || 0;
                video.views = await db.collection('video_views').countDocuments({ videoId: video._id.toString() });
            }
            
            res.json({ 
                videos: finalVideos,
                algorithm: 'personalized',
                userId: userId
            });
            
        } catch (error) {
            console.error('Error getting personalized videos:', error);
            // Fallback to regular feed
            const videos = await db.collection('videos')
                .find({ status: { $ne: 'deleted' } })
                .sort({ createdAt: -1 })
                .toArray();
            res.json({ videos, algorithm: 'fallback' });
        }
    });
    
    // Get video metrics
    app.get('/api/analytics/video/:videoId', async (req, res) => {
        try {
            const { videoId } = req.params;
            
            const metrics = await db.collection('video_metrics').findOne({ videoId });
            const views = await db.collection('video_views').find({ videoId }).toArray();
            
            // Calculate average watch time
            const totalWatchTime = views.reduce((sum, view) => sum + (view.watchTime || 0), 0);
            const avgWatchTime = views.length > 0 ? totalWatchTime / views.length : 0;
            
            res.json({
                videoId,
                views: metrics?.views || 0,
                likes: metrics?.likes || 0,
                comments: metrics?.comments || 0,
                shares: metrics?.shares || 0,
                completions: metrics?.completions || 0,
                avgWatchTime,
                completionRate: metrics?.views > 0 ? (metrics.completions / metrics.views) * 100 : 0
            });
            
        } catch (error) {
            console.error('Error getting video metrics:', error);
            res.status(500).json({ error: 'Failed to get metrics' });
        }
    });
    
    // Helper function to update user preferences
    async function updateUserPreferences(db, userId, video, interaction) {
        const weight = getInteractionWeight(interaction);
        
        const updates = {
            $inc: {},
            $set: { lastUpdated: new Date() }
        };
        
        // Update category preference
        if (video.category) {
            updates.$inc[`categories.${video.category}`] = weight;
        }
        
        // Update hashtag preferences
        if (video.hashtags && Array.isArray(video.hashtags)) {
            video.hashtags.forEach(tag => {
                updates.$inc[`hashtags.${tag}`] = weight * 0.5;
            });
        }
        
        // Update creator preference
        updates.$inc[`creators.${video.userId}`] = weight * 0.7;
        
        // Update sound preference
        if (video.soundId) {
            updates.$inc[`sounds.${video.soundId}`] = weight * 0.3;
        }
        
        await db.collection('user_preferences').updateOne(
            { userId },
            updates,
            { upsert: true }
        );
    }
    
    // Helper function to get interaction weight
    function getInteractionWeight(interaction) {
        switch (interaction) {
            case 'view': return 0.1;
            case 'like': return 0.3;
            case 'comment': return 0.4;
            case 'share': return 0.5;
            case 'follow': return 0.7;
            case 'skip': return -0.3;
            default: return 0.1;
        }
    }
    
    // Helper function to score videos for a user
    async function scoreVideosForUser(db, userId, videos, userPrefs) {
        const scoredVideos = [];
        
        for (const video of videos) {
            let score = 0.5; // Base score
            
            if (userPrefs) {
                // Category preference
                if (video.category && userPrefs.categories?.[video.category]) {
                    score += userPrefs.categories[video.category] * 0.3;
                }
                
                // Hashtag preferences
                if (video.hashtags && userPrefs.hashtags) {
                    let hashtagScore = 0;
                    let matchCount = 0;
                    video.hashtags.forEach(tag => {
                        if (userPrefs.hashtags[tag]) {
                            hashtagScore += userPrefs.hashtags[tag];
                            matchCount++;
                        }
                    });
                    if (matchCount > 0) {
                        score += (hashtagScore / matchCount) * 0.2;
                    }
                }
                
                // Creator preference
                if (userPrefs.creators?.[video.userId]) {
                    score += userPrefs.creators[video.userId] * 0.4;
                }
            }
            
            // Get video metrics for engagement score
            const metrics = await db.collection('video_metrics').findOne({ videoId: video._id.toString() });
            if (metrics) {
                const engagementRate = metrics.views > 0 
                    ? ((metrics.likes + metrics.comments + metrics.shares) / metrics.views)
                    : 0;
                score += engagementRate * 0.3;
            }
            
            // Freshness bonus (newer videos get a slight boost)
            const ageInDays = (Date.now() - new Date(video.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            const freshnessScore = Math.max(0, 1 - (ageInDays / 30)); // Decay over 30 days
            score += freshnessScore * 0.1;
            
            // Add score to video
            video.recommendationScore = Math.min(1, Math.max(0, score));
            scoredVideos.push(video);
        }
        
        // Sort by score descending
        scoredVideos.sort((a, b) => b.recommendationScore - a.recommendationScore);
        
        return scoredVideos;
    }
    
    // Create indexes for performance
    async function createRecommendationIndexes() {
        if (!db) {
            console.log('⏳ Database not connected yet, skipping recommendation indexes');
            return;
        }
        
        try {
            // Video views indexes
            await db.collection('video_views').createIndex({ videoId: 1 });
            await db.collection('video_views').createIndex({ userId: 1 });
            await db.collection('video_views').createIndex({ timestamp: -1 });
            
            // User interactions indexes
            await db.collection('user_interactions').createIndex({ userId: 1 });
            await db.collection('user_interactions').createIndex({ videoId: 1 });
            await db.collection('user_interactions').createIndex({ timestamp: -1 });
            await db.collection('user_interactions').createIndex({ userId: 1, action: 1 });
            
            // Video metrics indexes
            await db.collection('video_metrics').createIndex({ videoId: 1 }, { unique: true });
            await db.collection('video_metrics').createIndex({ views: -1 });
            
            // User preferences indexes
            await db.collection('user_preferences').createIndex({ userId: 1 }, { unique: true });
            
            console.log('✅ Recommendation indexes created');
        } catch (error) {
            console.error('Error creating recommendation indexes:', error);
        }
    }
    
    // Call this when the module is loaded (but check if db exists first)
    if (db) {
        createRecommendationIndexes();
    }
};