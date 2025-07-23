// Grok Development Assistant API Routes
// Provides endpoints for AI-assisted development

const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// Initialize Grok API
const GROK_API_KEY = process.env.GROK_API_KEY || 'your-grok-api-key-here';
const GROK_BASE_URL = 'https://api.x.ai/v1';

// Helper function to make Grok requests
async function callGrok(messages, temperature = 0.7) {
    const response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROK_API_KEY}`,
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

// Code generation endpoint
router.post('/api/grok/generate-code', async (req, res) => {
    try {
        const { feature, context, language = 'javascript' } = req.body;

        const messages = [
            {
                role: 'system',
                content: `You are a senior developer for VIB3, a TikTok-like video platform. Generate production-ready ${language} code following the project's conventions. Use vanilla JavaScript (no ES6 modules), MongoDB for database, and maintain the existing architecture.`
            },
            {
                role: 'user',
                content: `Generate code for: ${feature}\n\nContext: ${context || 'No additional context provided'}`
            }
        ];

        const code = await callGrok(messages, 0.7);
        
        res.json({
            success: true,
            code: code,
            feature: feature
        });
    } catch (error) {
        console.error('Error generating code:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bug analysis and fix endpoint
router.post('/api/grok/analyze-bug', async (req, res) => {
    try {
        const { error, stackTrace, code, context } = req.body;

        const messages = [
            {
                role: 'system',
                content: 'You are a debugging expert for VIB3. Analyze the bug and provide a detailed fix with explanation. Focus on the root cause and provide working code.'
            },
            {
                role: 'user',
                content: `Bug: ${error}\n\nStack Trace:\n${stackTrace}\n\nRelevant Code:\n${code}\n\nContext: ${context || 'No additional context'}`
            }
        ];

        const analysis = await callGrok(messages, 0.6);
        
        res.json({
            success: true,
            analysis: analysis,
            error: error
        });
    } catch (error) {
        console.error('Error analyzing bug:', error);
        res.status(500).json({ error: error.message });
    }
});

// Feature planning endpoint
router.post('/api/grok/plan-feature', async (req, res) => {
    try {
        const { feature, requirements, existingCode } = req.body;

        const messages = [
            {
                role: 'system',
                content: 'You are a software architect for VIB3. Create detailed implementation plans with step-by-step instructions, required files, and code structure. Consider existing architecture and best practices.'
            },
            {
                role: 'user',
                content: `Plan implementation for: ${feature}\n\nRequirements:\n${requirements}\n\nExisting Code Base Info:\n${existingCode || 'Standard VIB3 architecture'}`
            }
        ];

        const plan = await callGrok(messages, 0.7);
        
        res.json({
            success: true,
            plan: plan,
            feature: feature
        });
    } catch (error) {
        console.error('Error planning feature:', error);
        res.status(500).json({ error: error.message });
    }
});

// Code review endpoint
router.post('/api/grok/review-code', async (req, res) => {
    try {
        const { code, purpose, type = 'general' } = req.body;

        const messages = [
            {
                role: 'system',
                content: 'You are a code reviewer for VIB3. Review code for bugs, security issues, performance problems, and best practices. Provide specific suggestions with code examples.'
            },
            {
                role: 'user',
                content: `Review this ${type} code:\n\n${code}\n\nPurpose: ${purpose}`
            }
        ];

        const review = await callGrok(messages, 0.6);
        
        res.json({
            success: true,
            review: review,
            type: type
        });
    } catch (error) {
        console.error('Error reviewing code:', error);
        res.status(500).json({ error: error.message });
    }
});

// Architecture suggestion endpoint
router.post('/api/grok/suggest-architecture', async (req, res) => {
    try {
        const { problem, constraints, currentSetup } = req.body;

        const messages = [
            {
                role: 'system',
                content: 'You are a system architect for VIB3. Suggest architectural improvements and solutions that fit with the existing MongoDB/Node.js/vanilla JS stack. Provide practical, implementable solutions.'
            },
            {
                role: 'user',
                content: `Problem: ${problem}\n\nConstraints: ${constraints}\n\nCurrent Setup: ${currentSetup || 'Standard VIB3 architecture'}`
            }
        ];

        const suggestion = await callGrok(messages, 0.7);
        
        res.json({
            success: true,
            suggestion: suggestion,
            problem: problem
        });
    } catch (error) {
        console.error('Error suggesting architecture:', error);
        res.status(500).json({ error: error.message });
    }
});

// Database query helper endpoint
router.post('/api/grok/help-query', async (req, res) => {
    try {
        const { description, collection, expectedResult } = req.body;

        const messages = [
            {
                role: 'system',
                content: 'You are a MongoDB expert for VIB3. Generate optimal MongoDB queries and aggregation pipelines. Provide both the query and explanation of how it works.'
            },
            {
                role: 'user',
                content: `Generate MongoDB query for: ${description}\n\nCollection: ${collection}\n\nExpected Result: ${expectedResult}`
            }
        ];

        const query = await callGrok(messages, 0.6);
        
        res.json({
            success: true,
            query: query,
            description: description
        });
    } catch (error) {
        console.error('Error generating query:', error);
        res.status(500).json({ error: error.message });
    }
});

// Task automation endpoint
router.post('/api/grok/automate-task', async (req, res) => {
    try {
        const { task, files, targetResult } = req.body;

        const messages = [
            {
                role: 'system',
                content: 'You are an automation expert for VIB3. Create scripts and code to automate repetitive tasks. Provide complete, runnable solutions with clear instructions.'
            },
            {
                role: 'user',
                content: `Automate this task: ${task}\n\nFiles involved: ${files}\n\nDesired outcome: ${targetResult}`
            }
        ];

        const automation = await callGrok(messages, 0.7);
        
        res.json({
            success: true,
            automation: automation,
            task: task
        });
    } catch (error) {
        console.error('Error automating task:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;