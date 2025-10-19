// Grok Task Manager - Automated AI Assistant for VIB3
// This runs server-side to handle background AI tasks

const { ObjectId } = require('mongodb');

class GrokTaskManager {
    constructor(db) {
        this.db = db;
        this.apiKey = process.env.GROK_API_KEY;
        this.baseUrl = 'https://api.x.ai/v1';
        this.taskQueue = [];
        this.isProcessing = false;
    }

    async makeGrokRequest(messages, temperature = 0.7) {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messages,
                model: 'grok-beta',
                stream: false,
                temperature: temperature,
            })
        });

        if (!response.ok) {
            throw new Error(`Grok API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // Automated Tasks

    async autoEnhanceNewVideos() {
        if (!this.db) return;
        if (!this.apiKey) {
            console.log('⚠️ Grok API key not configured, skipping video enhancement');
            return;
        }

        try {
            // Find videos without enhanced titles/descriptions
            const videos = await this.db.collection('videos')
                .find({
                    aiEnhanced: { $ne: true },
                    status: { $ne: 'deleted' }
                })
                .limit(10)
                .toArray();

            for (const video of videos) {
                await this.enhanceVideoContent(video);
            }
        } catch (error) {
            console.error('Error auto-enhancing videos:', error);
        }
    }

    async enhanceVideoContent(video) {
        try {
            const messages = [
                {
                    role: 'system',
                    content: 'You are a content optimization expert for VIB3. Enhance video titles and descriptions to be more engaging while keeping them authentic. Respond in JSON format with keys: "title", "description", "hashtags" (array).'
                },
                {
                    role: 'user',
                    content: `Enhance this video:\nTitle: ${video.title || 'Untitled'}\nDescription: ${video.description || 'No description'}`
                }
            ];

            const result = await this.makeGrokRequest(messages, 0.7);
            const enhanced = JSON.parse(result);

            // Update video with enhanced content
            await this.db.collection('videos').updateOne(
                { _id: video._id },
                {
                    $set: {
                        enhancedTitle: enhanced.title,
                        enhancedDescription: enhanced.description,
                        aiHashtags: enhanced.hashtags,
                        aiEnhanced: true,
                        aiEnhancedAt: new Date()
                    }
                }
            );

            console.log(`✨ Enhanced video ${video._id}: ${enhanced.title}`);
        } catch (error) {
            console.error(`Error enhancing video ${video._id}:`, error);
        }
    }

    async generateTrendingContent() {
        if (!this.apiKey) {
            console.log('⚠️ Grok API key not configured, skipping trend generation');
            return;
        }

        try {
            const messages = [
                {
                    role: 'system',
                    content: 'You are a trend analyst for VIB3. Analyze current trends and generate content suggestions. Return JSON with keys: "trending_topics" (array), "content_ideas" (array), "hashtags" (array), "best_posting_times" (array).'
                },
                {
                    role: 'user',
                    content: 'What are the current trending topics and content ideas for a video platform?'
                }
            ];

            const result = await this.makeGrokRequest(messages, 0.8);
            const trends = JSON.parse(result);

            // Store trending data
            await this.db.collection('ai_trends').insertOne({
                ...trends,
                generatedAt: new Date(),
                type: 'daily_trends'
            });

            console.log('📈 Generated daily trends');
            return trends;
        } catch (error) {
            console.error('Error generating trends:', error);
        }
    }

    async moderateContent(contentId, contentType = 'comment') {
        try {
            const collection = contentType === 'comment' ? 'comments' : 'videos';
            const content = await this.db.collection(collection).findOne({ _id: new ObjectId(contentId) });
            
            if (!content) return;

            const messages = [
                {
                    role: 'system',
                    content: 'You are a content moderator for VIB3. Analyze content for policy violations. Return JSON with keys: "safe" (boolean), "issues" (array of strings), "severity" (low/medium/high), "action" (none/flag/remove).'
                },
                {
                    role: 'user',
                    content: `Moderate this ${contentType}: "${content.text || content.description || content.title}"`
                }
            ];

            const result = await this.makeGrokRequest(messages, 0.3);
            const moderation = JSON.parse(result);

            // Update content with moderation result
            await this.db.collection(collection).updateOne(
                { _id: content._id },
                {
                    $set: {
                        moderation: moderation,
                        moderatedAt: new Date()
                    }
                }
            );

            if (moderation.action === 'remove') {
                await this.db.collection(collection).updateOne(
                    { _id: content._id },
                    { $set: { status: 'removed', removedReason: moderation.issues } }
                );
            }

            console.log(`🛡️ Moderated ${contentType} ${contentId}: ${moderation.action}`);
        } catch (error) {
            console.error(`Error moderating ${contentType} ${contentId}:`, error);
        }
    }

    async generatePersonalizedRecommendations(userId) {
        try {
            const user = await this.db.collection('users').findOne({ _id: new ObjectId(userId) });
            const userHistory = await this.db.collection('user_interactions')
                .find({ userId })
                .sort({ timestamp: -1 })
                .limit(50)
                .toArray();

            const messages = [
                {
                    role: 'system',
                    content: 'You are a recommendation engine for VIB3. Based on user history, suggest content categories and creators. Return JSON with keys: "categories" (array), "suggested_creators" (array), "content_themes" (array).'
                },
                {
                    role: 'user',
                    content: `User interests based on history: ${JSON.stringify(userHistory.slice(0, 10))}`
                }
            ];

            const result = await this.makeGrokRequest(messages, 0.6);
            const recommendations = JSON.parse(result);

            // Store recommendations
            await this.db.collection('user_recommendations').updateOne(
                { userId },
                {
                    $set: {
                        ...recommendations,
                        generatedAt: new Date()
                    }
                },
                { upsert: true }
            );

            console.log(`🎯 Generated recommendations for user ${userId}`);
            return recommendations;
        } catch (error) {
            console.error(`Error generating recommendations for ${userId}:`, error);
        }
    }

    // Background task runner
    async startBackgroundTasks() {
        console.log('🤖 Starting Grok background tasks...');
        
        // Run tasks periodically
        setInterval(() => this.autoEnhanceNewVideos(), 5 * 60 * 1000); // Every 5 minutes
        setInterval(() => this.generateTrendingContent(), 60 * 60 * 1000); // Every hour
        
        // Initial run
        this.autoEnhanceNewVideos();
        this.generateTrendingContent();
    }

    // API endpoints for manual triggers
    setupEndpoints(app) {
        // Enhance specific video
        app.post('/api/ai/enhance-video/:videoId', async (req, res) => {
            try {
                const video = await this.db.collection('videos').findOne({ 
                    _id: new ObjectId(req.params.videoId) 
                });
                
                if (!video) {
                    return res.status(404).json({ error: 'Video not found' });
                }
                
                await this.enhanceVideoContent(video);
                res.json({ success: true, message: 'Video enhanced' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Get trending content
        app.get('/api/ai/trends', async (req, res) => {
            try {
                const trends = await this.db.collection('ai_trends')
                    .findOne({}, { sort: { generatedAt: -1 } });
                    
                res.json(trends || await this.generateTrendingContent());
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Moderate content
        app.post('/api/ai/moderate', async (req, res) => {
            try {
                const { contentId, contentType } = req.body;
                await this.moderateContent(contentId, contentType);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Get personalized recommendations
        app.get('/api/ai/recommendations/:userId', async (req, res) => {
            try {
                const recommendations = await this.generatePersonalizedRecommendations(req.params.userId);
                res.json(recommendations);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
}

module.exports = GrokTaskManager;