#!/usr/bin/env node

// Grok-Claude Bridge - Allows Claude to use Grok for development
// This script acts as a command-line interface that Claude can call

const https = require('https');

const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_BASE_URL = 'api.x.ai';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_BASE_URL = 'api.anthropic.com';

async function callClaude(prompt, systemPrompt = null) {
    const messages = [];
    
    messages.push({
        role: 'user',
        content: prompt
    });

    const data = JSON.stringify({
        model: 'claude-3-opus-20240229',
        messages: messages,
        system: systemPrompt || 'You are a helpful AI assistant for the VIB3 project.',
        max_tokens: 4096,
        temperature: 0.7
    });

    const options = {
        hostname: CLAUDE_BASE_URL,
        port: 443,
        path: '/v1/messages',
        method: 'POST',
        headers: {
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (res.statusCode !== 200) {
                        console.error('Claude API Error:', parsed);
                        reject(new Error(`Claude API returned ${res.statusCode}: ${responseData}`));
                        return;
                    }
                    if (parsed.content && parsed.content[0]) {
                        resolve(parsed.content[0].text);
                    } else {
                        console.error('Unexpected response:', responseData);
                        reject(new Error('Invalid response from Claude'));
                    }
                } catch (error) {
                    console.error('Parse error:', responseData);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

async function callGrok(prompt, systemPrompt = null) {
    const messages = [];
    
    if (systemPrompt) {
        messages.push({
            role: 'system',
            content: systemPrompt
        });
    }
    
    messages.push({
        role: 'user',
        content: prompt
    });

    const data = JSON.stringify({
        messages: messages,
        model: 'grok-2-1212',
        stream: false,
        temperature: 0.7
    });

    const options = {
        hostname: GROK_BASE_URL,
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROK_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (res.statusCode !== 200) {
                        console.error('Grok API Error:', parsed);
                        reject(new Error(`Grok API returned ${res.statusCode}: ${responseData}`));
                        return;
                    }
                    if (parsed.choices && parsed.choices[0]) {
                        resolve(parsed.choices[0].message.content);
                    } else {
                        console.error('Unexpected response:', responseData);
                        reject(new Error('Invalid response from Grok'));
                    }
                } catch (error) {
                    console.error('Parse error:', responseData);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// Parse command line arguments
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.log('Usage: node grok-claude-bridge.js <command> [options]');
        console.log('Commands:');
        console.log('  generate-code <feature> <context> [--model grok|claude]');
        console.log('  fix-bug <error> <code> [--model grok|claude]');
        console.log('  plan-feature <feature> <requirements> [--model grok|claude]');
        console.log('  review-code <code> <purpose> [--model grok|claude]');
        console.log('  suggest-query <description> <collection> [--model grok|claude]');
        console.log('  bridge <prompt> - Send to Grok and then refine with Claude');
        console.log('\nDefaults to Grok unless --model claude is specified');
        process.exit(1);
    }

    try {
        let result;
        
        // Check for --model flag
        const modelIndex = args.indexOf('--model');
        const useModel = modelIndex !== -1 && args[modelIndex + 1] ? args[modelIndex + 1] : 'grok';
        
        // Remove model flag from args for cleaner parsing
        if (modelIndex !== -1) {
            args.splice(modelIndex, 2);
        }
        
        const apiCall = useModel === 'claude' ? callClaude : callGrok;

        switch (command) {
            case 'generate-code': {
                const feature = args[1];
                const context = args[2] || '';
                const systemPrompt = 'You are a senior developer for VIB3, a TikTok-like video platform. Generate production-ready JavaScript code following the project conventions: vanilla JavaScript (no ES6 modules), MongoDB for database, global functions.';
                const prompt = `Generate code for: ${feature}\n\nContext: ${context}`;
                result = await apiCall(prompt, systemPrompt);
                break;
            }

            case 'fix-bug': {
                const error = args[1];
                const code = args[2] || '';
                const systemPrompt = 'You are a debugging expert for VIB3. Analyze the bug and provide a detailed fix with explanation.';
                const prompt = `Bug: ${error}\n\nCode:\n${code}`;
                result = await apiCall(prompt, systemPrompt);
                break;
            }

            case 'plan-feature': {
                const feature = args[1];
                const requirements = args[2] || '';
                const systemPrompt = 'You are a software architect for VIB3. Create detailed implementation plans with step-by-step instructions.';
                const prompt = `Plan implementation for: ${feature}\n\nRequirements: ${requirements}`;
                result = await apiCall(prompt, systemPrompt);
                break;
            }

            case 'review-code': {
                const code = args[1];
                const purpose = args[2] || 'general review';
                const systemPrompt = 'You are a code reviewer for VIB3. Review code for bugs, security issues, performance problems, and best practices.';
                const prompt = `Review this code:\n\n${code}\n\nPurpose: ${purpose}`;
                result = await apiCall(prompt, systemPrompt);
                break;
            }

            case 'suggest-query': {
                const description = args[1];
                const collection = args[2] || 'videos';
                const systemPrompt = 'You are a MongoDB expert for VIB3. Generate optimal MongoDB queries and aggregation pipelines.';
                const prompt = `Generate MongoDB query for: ${description}\n\nCollection: ${collection}`;
                result = await apiCall(prompt, systemPrompt);
                break;
            }
            
            case 'bridge': {
                const prompt = args.slice(1).join(' ');
                console.log('Getting initial response from Grok...\n');
                const grokResponse = await callGrok(prompt);
                console.log('Grok Response:\n', grokResponse);
                console.log('\n\nRefining with Claude...\n');
                const claudePrompt = `Please review and enhance this response from Grok:\n\nOriginal Question: ${prompt}\n\nGrok's Response:\n${grokResponse}\n\nPlease provide an improved or refined answer.`;
                result = await callClaude(claudePrompt);
                console.log('Claude Refinement:\n');
                break;
            }

            default:
                console.error(`Unknown command: ${command}`);
                process.exit(1);
        }

        console.log(result);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Handle direct prompts via stdin
if (process.argv.length === 2) {
    let input = '';
    
    process.stdin.on('data', (chunk) => {
        input += chunk;
    });
    
    process.stdin.on('end', async () => {
        try {
            const prompt = input.trim();
            if (prompt) {
                const result = await callGrok(prompt);
                console.log(result);
            }
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    });
} else {
    main();
}