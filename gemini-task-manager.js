// Gemini Task Manager - Automated AI Assistant for VIB3
const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiTaskManager {
    constructor(db) {
        this.db = db;
        this.apiKey = process.env.GEMINI_API_KEY;
        this.genAI = new GoogleGenerativeAI(this.apiKey);
    }

    async makeGeminiRequest(prompt) {
        const model = this.genAI.getGenerativeModel({ model: "gemini-pro"});
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    }

    async enhanceVideoContent(video) {
        try {
            const prompt = `Enhance this video content to be more engaging and viral for a TikTok-style platform called VIB3. Provide a catchy title, a compelling description, and a list of relevant hashtags. Respond in JSON format with keys: "title", "description", "hashtags" (array of strings).\n\nOriginal Title: ${video.title || 'Untitled'}\nOriginal Description: ${video.description || 'No description'}`;

            const result = await this.makeGeminiRequest(prompt);
            const enhanced = JSON.parse(result);

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
        try {
            const searchResults = await this.google_web_search({ query: 'current trending topics for short-form video' });
            const trendingTopics = searchResults.map(r => r.title).join(', ');

            const prompt = `You are a trend analyst for VIB3, a TikTok-style video platform. Based on the following trending topics, generate content ideas, hashtags, and best posting times. Respond in JSON format with keys: "trending_topics" (array of strings), "content_ideas" (array of strings), "hashtags" (array of strings), "best_posting_times" (array of strings).\n\nTrending Topics: ${trendingTopics}`;

            const result = await this.makeGeminiRequest(prompt);
            const trends = JSON.parse(result);

            await this.db.collection('ai_trends').insertOne({
                ...trends,
                generatedAt: new Date(),
                type: 'daily_trends'
            });

            console.log('📈 Generated daily trends with Gemini');
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

            const prompt = `You are a content moderator for VIB3, a TikTok-style video platform. Analyze the following content for policy violations (hate speech, violence, etc.). Respond in JSON format with keys: "safe" (boolean), "issues" (array of strings), "severity" (low/medium/high), "action" (none/flag/remove).\n\nContent to moderate: "${content.text || content.description || content.title}"`

            const result = await this.makeGeminiRequest(prompt);
            const moderation = JSON.parse(result);

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

    async startBackgroundTasks() {
        console.log('🤖 Starting Gemini background tasks...');
        
        // Run tasks periodically
        setInterval(() => this.autoEnhanceNewVideos(), 5 * 60 * 1000); // Every 5 minutes
        setInterval(() => this.generateTrendingContent(), 60 * 60 * 1000); // Every hour
        
        // Initial run
        this.autoEnhanceNewVideos();
        this.generateTrendingContent();
    }

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
    }
}

module.exports = GeminiTaskManager;
