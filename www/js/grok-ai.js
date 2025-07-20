// Grok AI Integration for VIB3
// Provides AI-powered content assistance

class VIB3GrokAI {
    constructor() {
        // API key should be provided by backend for security
        this.apiKey = window.GROK_API_KEY || 'your-grok-api-key-here';
        this.baseUrl = 'https://api.x.ai/v1';
        this.isEnabled = true;
    }

    async makeGrokRequest(messages, temperature = 0.7) {
        try {
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
        } catch (error) {
            console.error('Grok API error:', error);
            throw error;
        }
    }

    async generateVideoDescription(videoContext) {
        const messages = [
            {
                role: 'system',
                content: 'You are a creative content assistant for VIB3, a TikTok-style video platform. Generate engaging, trendy video descriptions that are catchy and use relevant hashtags. Keep it under 150 characters.'
            },
            {
                role: 'user',
                content: `Generate a creative description for this video: ${videoContext}`
            }
        ];

        try {
            return await this.makeGrokRequest(messages, 0.8);
        } catch (error) {
            return 'Check out this amazing video! 🔥 #VIB3 #Trending #Viral';
        }
    }

    async generateHashtags(videoContent) {
        const messages = [
            {
                role: 'system',
                content: 'You are a hashtag specialist for VIB3. Generate 5-8 relevant, trending hashtags for video content. Return only hashtags separated by spaces, starting with #. Include #VIB3 as the first hashtag.'
            },
            {
                role: 'user',
                content: `Generate hashtags for: ${videoContent}`
            }
        ];

        try {
            const result = await this.makeGrokRequest(messages, 0.6);
            return result.split(' ').filter(tag => tag.startsWith('#')).slice(0, 8);
        } catch (error) {
            return ['#VIB3', '#Trending', '#Viral', '#ForYou', '#Content'];
        }
    }

    async enhanceVideoTitle(originalTitle) {
        const messages = [
            {
                role: 'system',
                content: 'You are a content optimization expert for VIB3. Make video titles more engaging and clickable while keeping them authentic. Maximum 60 characters. Make it catchy but not clickbait.'
            },
            {
                role: 'user',
                content: `Enhance this video title: "${originalTitle}"`
            }
        ];

        try {
            return await this.makeGrokRequest(messages, 0.7);
        } catch (error) {
            return originalTitle;
        }
    }

    async generateCommentReply(originalComment, userContext = '') {
        const messages = [
            {
                role: 'system',
                content: 'You are a friendly VIB3 user. Generate a casual, engaging reply to comments. Keep it short (under 50 words), fun, and authentic. Use emojis sparingly. Be positive and encouraging.'
            },
            {
                role: 'user',
                content: `Reply to this comment: "${originalComment}" ${userContext ? `(Context: ${userContext})` : ''}`
            }
        ];

        try {
            return await this.makeGrokRequest(messages, 0.7);
        } catch (error) {
            return 'Thanks for watching! 😊';
        }
    }

    async getContentInsights(videoDescription, views, likes, comments) {
        const messages = [
            {
                role: 'system',
                content: 'You are a VIB3 analytics expert. Analyze video performance and provide insights in JSON format with keys: "performance_score" (1-10), "suggestions" (array of 2-3 tips), "trending_potential" (low/medium/high), "engagement_rate" (calculated percentage).'
            },
            {
                role: 'user',
                content: `Analyze this video: "${videoDescription}" - Views: ${views}, Likes: ${likes}, Comments: ${comments}`
            }
        ];

        try {
            const result = await this.makeGrokRequest(messages, 0.5);
            return JSON.parse(result);
        } catch (error) {
            const engagementRate = views > 0 ? ((likes + comments) / views * 100).toFixed(1) : 0;
            return {
                performance_score: Math.min(10, Math.max(1, Math.floor(likes / Math.max(1, views / 100)))),
                suggestions: [
                    'Post at peak hours (7-9 PM)',
                    'Use trending hashtags',
                    'Engage with comments quickly'
                ],
                trending_potential: engagementRate > 5 ? 'high' : engagementRate > 2 ? 'medium' : 'low',
                engagement_rate: `${engagementRate}%`
            };
        }
    }

    async generateVideoIdeas(userInterests = 'trending content') {
        const messages = [
            {
                role: 'system',
                content: 'You are a creative content strategist for VIB3. Generate 5 unique, trendy video ideas that could go viral. Each idea should be one short sentence. Focus on current trends and engaging content.'
            },
            {
                role: 'user',
                content: `Generate video ideas for someone interested in: ${userInterests}`
            }
        ];

        try {
            const result = await this.makeGrokRequest(messages, 0.9);
            return result.split('\n').filter(line => line.trim()).slice(0, 5);
        } catch (error) {
            return [
                'Create a "day in my life" video with trending music',
                'Show a quick tutorial for something you love',
                'Film a transformation or before/after',
                'Share your reaction to a viral trend',
                'Make a "things I wish I knew" video'
            ];
        }
    }

    // UI Integration Methods
    addAIAssistantToUpload() {
        const uploadModal = document.querySelector('.upload-modal');
        if (!uploadModal) return;

        const aiAssistantHTML = `
            <div class="grok-ai-assistant" style="
                background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
                border: 1px solid rgba(0, 206, 209, 0.3);
                border-radius: 12px;
                padding: 16px;
                margin-top: 16px;
            ">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <div style="
                        width: 24px; height: 24px;
                        background: linear-gradient(45deg, #00CED1, #1E90FF);
                        border-radius: 6px;
                        display: flex; align-items: center; justify-content: center;
                        margin-right: 8px;
                    ">
                        ✨
                    </div>
                    <span style="color: white; font-weight: bold; font-size: 14px;">
                        Grok AI Assistant
                    </span>
                </div>
                
                <div class="ai-buttons" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="ai-btn" data-action="description" style="
                        background: rgba(0, 206, 209, 0.2);
                        border: 1px solid #00CED1;
                        color: white;
                        padding: 6px 12px;
                        border-radius: 16px;
                        font-size: 11px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    ">
                        📝 Generate Description
                    </button>
                    <button class="ai-btn" data-action="hashtags" style="
                        background: rgba(0, 206, 209, 0.2);
                        border: 1px solid #00CED1;
                        color: white;
                        padding: 6px 12px;
                        border-radius: 16px;
                        font-size: 11px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    ">
                        🏷️ Generate Hashtags
                    </button>
                    <button class="ai-btn" data-action="enhance" style="
                        background: rgba(0, 206, 209, 0.2);
                        border: 1px solid #00CED1;
                        color: white;
                        padding: 6px 12px;
                        border-radius: 16px;
                        font-size: 11px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    ">
                        ✨ Enhance Title
                    </button>
                    <button class="ai-btn" data-action="ideas" style="
                        background: rgba(0, 206, 209, 0.2);
                        border: 1px solid #00CED1;
                        color: white;
                        padding: 6px 12px;
                        border-radius: 16px;
                        font-size: 11px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    ">
                        💡 Video Ideas
                    </button>
                </div>
                
                <div class="ai-results" style="margin-top: 12px; display: none;">
                    <div class="ai-output" style="
                        background: rgba(0, 0, 0, 0.3);
                        border: 1px solid rgba(0, 206, 209, 0.2);
                        border-radius: 8px;
                        padding: 8px;
                        color: white;
                        font-size: 12px;
                        white-space: pre-wrap;
                    "></div>
                </div>
            </div>
        `;

        uploadModal.insertAdjacentHTML('beforeend', aiAssistantHTML);
        this.attachAIEventListeners();
    }

    attachAIEventListeners() {
        document.querySelectorAll('.ai-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const action = e.target.dataset.action;
                const btn = e.target;
                const originalText = btn.textContent;
                
                btn.textContent = '⏳ Generating...';
                btn.disabled = true;

                try {
                    await this.handleAIAction(action);
                } catch (error) {
                    console.error('AI action error:', error);
                } finally {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            });
        });
    }

    async handleAIAction(action) {
        const titleInput = document.querySelector('input[placeholder*="title"]') || document.querySelector('#video-title');
        const descInput = document.querySelector('textarea[placeholder*="description"]') || document.querySelector('#video-description');
        const resultsDiv = document.querySelector('.ai-output');
        
        let result = '';
        
        switch (action) {
            case 'description':
                const context = titleInput?.value || 'video content';
                result = await this.generateVideoDescription(context);
                if (descInput) descInput.value = result;
                break;
                
            case 'hashtags':
                const content = descInput?.value || titleInput?.value || 'trending content';
                const hashtags = await this.generateHashtags(content);
                result = hashtags.join(' ');
                if (descInput) descInput.value += '\n\n' + result;
                break;
                
            case 'enhance':
                const originalTitle = titleInput?.value || 'My Video';
                result = await this.enhanceVideoTitle(originalTitle);
                if (titleInput) titleInput.value = result;
                break;
                
            case 'ideas':
                const ideas = await this.generateVideoIdeas();
                result = ideas.join('\n• ');
                result = '💡 Video Ideas:\n• ' + result;
                break;
        }
        
        if (resultsDiv) {
            resultsDiv.textContent = result;
            resultsDiv.parentElement.style.display = 'block';
        }
    }

    // Add insights to video pages
    async addInsightsToVideo(videoElement, videoData) {
        if (!videoData) return;
        
        const insights = await this.getContentInsights(
            videoData.description || '',
            videoData.views || 0,
            videoData.likes || 0,
            videoData.comments || 0
        );
        
        const insightsHTML = `
            <div class="grok-insights" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid rgba(0, 206, 209, 0.3);
                border-radius: 8px;
                padding: 8px;
                font-size: 10px;
                color: white;
                max-width: 150px;
            ">
                <div style="font-weight: bold; margin-bottom: 4px;">📊 AI Insights</div>
                <div>Score: ${insights.performance_score}/10</div>
                <div>Trending: ${insights.trending_potential}</div>
                <div>Engagement: ${insights.engagement_rate}</div>
            </div>
        `;
        
        videoElement.style.position = 'relative';
        videoElement.insertAdjacentHTML('beforeend', insightsHTML);
    }
}

// Initialize Grok AI
window.grokAI = new VIB3GrokAI();

// Auto-integrate when upload modal opens
document.addEventListener('DOMContentLoaded', () => {
    // Watch for upload modal
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.classList && node.classList.contains('upload-modal')) {
                    setTimeout(() => window.grokAI.addAIAssistantToUpload(), 100);
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
});

console.log('🤖 Grok AI Assistant loaded for VIB3');