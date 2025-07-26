// AI Bridge Service - Unified interface for AI providers (Grok, Claude, etc.)

const fetch = require('node-fetch');

class AIBridge {
    constructor() {
        this.providers = {
            grok: {
                apiKey: process.env.GROK_API_KEY,
                baseUrl: 'https://api.x.ai',
                model: 'grok-2-1212'
            },
            claude: {
                apiKey: process.env.CLAUDE_API_KEY,
                baseUrl: process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com/v1',
                model: 'claude-3-opus-20240229'
            }
        };
    }

    async callGrok(prompt, systemPrompt = null, options = {}) {
        const { apiKey, baseUrl, model } = this.providers.grok;
        
        if (!apiKey) {
            throw new Error('Grok API key not configured');
        }

        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: messages,
                model: options.model || model,
                stream: false,
                temperature: options.temperature || 0.7
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Grok API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async callClaude(prompt, systemPrompt = null, options = {}) {
        const { apiKey, baseUrl, model } = this.providers.claude;
        
        if (!apiKey) {
            throw new Error('Claude API key not configured');
        }

        const body = {
            model: options.model || model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options.maxTokens || 4096,
            temperature: options.temperature || 0.7
        };
        
        if (systemPrompt) {
            body.system = systemPrompt;
        }

        const response = await fetch(`${baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Claude API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async call(provider, prompt, systemPrompt = null, options = {}) {
        switch (provider.toLowerCase()) {
            case 'grok':
                return this.callGrok(prompt, systemPrompt, options);
            case 'claude':
                return this.callClaude(prompt, systemPrompt, options);
            default:
                throw new Error(`Unknown AI provider: ${provider}`);
        }
    }

    async bridge(prompt, options = {}) {
        // First get response from Grok
        const grokResponse = await this.callGrok(prompt, options.grokSystemPrompt);
        
        // Then refine with Claude
        const claudePrompt = `Please review and enhance this response from Grok:\n\nOriginal Question: ${prompt}\n\nGrok's Response:\n${grokResponse}\n\nPlease provide an improved or refined answer.`;
        const claudeResponse = await this.callClaude(claudePrompt, options.claudeSystemPrompt);
        
        return {
            grok: grokResponse,
            claude: claudeResponse,
            final: claudeResponse // Claude's refinement is the final response
        };
    }

    // Specialized methods for VIB3 project
    async generateCode(feature, context = '', provider = 'grok') {
        const systemPrompt = 'You are a senior developer for VIB3, a TikTok-like video platform. Generate production-ready JavaScript code following the project conventions: vanilla JavaScript (no ES6 modules), MongoDB for database, global functions.';
        const prompt = `Generate code for: ${feature}\n\nContext: ${context}`;
        return this.call(provider, prompt, systemPrompt);
    }

    async fixBug(error, code = '', provider = 'grok') {
        const systemPrompt = 'You are a debugging expert for VIB3. Analyze the bug and provide a detailed fix with explanation.';
        const prompt = `Bug: ${error}\n\nCode:\n${code}`;
        return this.call(provider, prompt, systemPrompt);
    }

    async planFeature(feature, requirements = '', provider = 'grok') {
        const systemPrompt = 'You are a software architect for VIB3. Create detailed implementation plans with step-by-step instructions.';
        const prompt = `Plan implementation for: ${feature}\n\nRequirements: ${requirements}`;
        return this.call(provider, prompt, systemPrompt);
    }

    async reviewCode(code, purpose = 'general review', provider = 'grok') {
        const systemPrompt = 'You are a code reviewer for VIB3. Review code for bugs, security issues, performance problems, and best practices.';
        const prompt = `Review this code:\n\n${code}\n\nPurpose: ${purpose}`;
        return this.call(provider, prompt, systemPrompt);
    }

    async generateQuery(description, collection = 'videos', provider = 'grok') {
        const systemPrompt = 'You are a MongoDB expert for VIB3. Generate optimal MongoDB queries and aggregation pipelines.';
        const prompt = `Generate MongoDB query for: ${description}\n\nCollection: ${collection}`;
        return this.call(provider, prompt, systemPrompt);
    }
}

module.exports = new AIBridge();