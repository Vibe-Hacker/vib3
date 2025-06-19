const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function runLargePrompt() {
  const fileContent = fs.readFileSync('/mnt/c/Users/VIBE/Desktop/VIB3/vib3_cli.py', 'utf8');
  const stream = await client.messages.create({
    model: 'claude-3-7-sonnet-20241022',
    max_tokens: 128000,
    stream: true,
    messages: [{
      role: 'user',
      content: `Analyze the following file and provide detailed improvements:\n${fileContent}`
    }],
    headers: {
      'anthropic-beta': 'output-128k-2025-02-19' // Beta header for 128K output
    },
  });
  
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      process.stdout.write(chunk.delta.text);
    }
  }
}

runLargePrompt();