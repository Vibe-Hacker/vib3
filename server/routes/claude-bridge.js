const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const auth = require('../../middleware/auth');

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_BASE_URL = process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com/v1';

// Middleware to ensure Claude API key is configured
const checkClaudeConfig = (req, res, next) => {
    if (!CLAUDE_API_KEY) {
        return res.status(500).json({ error: 'Claude API not configured' });
    }
    next();
};

// Helper function to call Claude API
async function callClaudeAPI(prompt, systemPrompt = null, options = {}) {
    const messages = [{
        role: 'user',
        content: prompt
    }];

    const body = {
        model: options.model || 'claude-3-opus-20240229',
        messages: messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
    };
    
    if (systemPrompt) {
        body.system = systemPrompt;
    }

    const response = await fetch(`${CLAUDE_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
            'x-api-key': CLAUDE_API_KEY,
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

// Generate code endpoint
router.post('/generate-code', auth, checkClaudeConfig, async (req, res) => {
    try {
        const { feature, context } = req.body;
        
        if (!feature) {
            return res.status(400).json({ error: 'Feature description is required' });
        }

        const systemPrompt = 'You are a senior developer for VIB3, a TikTok-like video platform. Generate production-ready JavaScript code following the project conventions: vanilla JavaScript (no ES6 modules), MongoDB for database, global functions.';
        const prompt = `Generate code for: ${feature}\n\nContext: ${context || ''}`;

        const result = await callClaudeAPI(prompt, systemPrompt);
        res.json({ code: result });
    } catch (error) {
        console.error('Claude generate-code error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Analyze bug endpoint
router.post('/analyze-bug', auth, checkClaudeConfig, async (req, res) => {
    try {
        const { error, code, context } = req.body;
        
        if (!error) {
            return res.status(400).json({ error: 'Error description is required' });
        }

        const systemPrompt = 'You are a debugging expert for VIB3. Analyze the bug and provide a detailed fix with explanation.';
        const prompt = `Bug: ${error}\n\nCode:\n${code || ''}\n\nContext: ${context || ''}`;

        const result = await callClaudeAPI(prompt, systemPrompt);
        res.json({ analysis: result });
    } catch (error) {
        console.error('Claude analyze-bug error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Plan feature endpoint
router.post('/plan-feature', auth, checkClaudeConfig, async (req, res) => {
    try {
        const { feature, requirements } = req.body;
        
        if (!feature) {
            return res.status(400).json({ error: 'Feature description is required' });
        }

        const systemPrompt = 'You are a software architect for VIB3. Create detailed implementation plans with step-by-step instructions.';
        const prompt = `Plan implementation for: ${feature}\n\nRequirements: ${requirements || ''}`;

        const result = await callClaudeAPI(prompt, systemPrompt);
        res.json({ plan: result });
    } catch (error) {
        console.error('Claude plan-feature error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Review code endpoint
router.post('/review-code', auth, checkClaudeConfig, async (req, res) => {
    try {
        const { code, purpose } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }

        const systemPrompt = 'You are a code reviewer for VIB3. Review code for bugs, security issues, performance problems, and best practices.';
        const prompt = `Review this code:\n\n${code}\n\nPurpose: ${purpose || 'general review'}`;

        const result = await callClaudeAPI(prompt, systemPrompt);
        res.json({ review: result });
    } catch (error) {
        console.error('Claude review-code error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate MongoDB query endpoint
router.post('/generate-query', auth, checkClaudeConfig, async (req, res) => {
    try {
        const { description, collection } = req.body;
        
        if (!description) {
            return res.status(400).json({ error: 'Query description is required' });
        }

        const systemPrompt = 'You are a MongoDB expert for VIB3. Generate optimal MongoDB queries and aggregation pipelines.';
        const prompt = `Generate MongoDB query for: ${description}\n\nCollection: ${collection || 'videos'}`;

        const result = await callClaudeAPI(prompt, systemPrompt);
        res.json({ query: result });
    } catch (error) {
        console.error('Claude generate-query error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bridge endpoint - uses both Grok and Claude
router.post('/bridge', auth, checkClaudeConfig, async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // First call Grok
        const grokResponse = await fetch(`${req.protocol}://${req.get('host')}/api/grok/general`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization
            },
            body: JSON.stringify({ prompt })
        });

        if (!grokResponse.ok) {
            throw new Error('Failed to get Grok response');
        }

        const grokData = await grokResponse.json();
        const grokResult = grokData.response;

        // Then refine with Claude
        const claudePrompt = `Please review and enhance this response from Grok:\n\nOriginal Question: ${prompt}\n\nGrok's Response:\n${grokResult}\n\nPlease provide an improved or refined answer.`;
        const claudeResult = await callClaudeAPI(claudePrompt);

        res.json({
            grokResponse: grokResult,
            claudeRefinement: claudeResult
        });
    } catch (error) {
        console.error('Claude bridge error:', error);
        res.status(500).json({ error: error.message });
    }
});

// General purpose endpoint
router.post('/general', auth, checkClaudeConfig, async (req, res) => {
    try {
        const { prompt, systemPrompt, options } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const result = await callClaudeAPI(prompt, systemPrompt, options || {});
        res.json({ response: result });
    } catch (error) {
        console.error('Claude general error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;