#!/usr/bin/env node

const { GoogleGenerativeAI } = require('@google/generative-ai');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Get API key from environment variable
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('\n❌ ERROR: GEMINI_API_KEY environment variable not set!');
  console.error('\nTo set it up:');
  console.error('1. Get your API key from: https://makersuite.google.com/app/apikey');
  console.error('2. Set environment variable:');
  console.error('   Windows CMD: setx GEMINI_API_KEY "your-api-key-here"');
  console.error('   Windows PowerShell: $env:GEMINI_API_KEY="your-api-key-here"');
  console.error('   Linux/Mac: export GEMINI_API_KEY="your-api-key-here"\n');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '\n💎 You: '
});

let conversationHistory = [];

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║         Gemini AI Terminal - VIB3 Project Helper        ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('\nCommands:');
console.log('  /exit or /quit  - Exit the chat');
console.log('  /clear          - Clear conversation history');
console.log('  /save           - Save conversation to file');
console.log('  /file <path>    - Analyze a file from the project');
console.log('  /help           - Show this help message');
console.log('\nType your message and press Enter to chat with Gemini.\n');

rl.prompt();

rl.on('line', async (line) => {
  const input = line.trim();

  // Handle commands
  if (input === '/exit' || input === '/quit') {
    console.log('\n👋 Goodbye!\n');
    rl.close();
    return;
  }

  if (input === '/clear') {
    conversationHistory = [];
    console.log('\n✅ Conversation history cleared.\n');
    rl.prompt();
    return;
  }

  if (input === '/help') {
    console.log('\nCommands:');
    console.log('  /exit or /quit  - Exit the chat');
    console.log('  /clear          - Clear conversation history');
    console.log('  /save           - Save conversation to file');
    console.log('  /file <path>    - Analyze a file from the project');
    console.log('  /help           - Show this help message\n');
    rl.prompt();
    return;
  }

  if (input === '/save') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `gemini-conversation-${timestamp}.txt`;
    const content = conversationHistory.map(msg =>
      `${msg.role === 'user' ? 'You' : 'Gemini'}: ${msg.content}`
    ).join('\n\n');

    fs.writeFileSync(filename, content);
    console.log(`\n✅ Conversation saved to: ${filename}\n`);
    rl.prompt();
    return;
  }

  if (input.startsWith('/file ')) {
    const filePath = input.substring(6).trim();
    try {
      const fullPath = path.resolve(filePath);
      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      const prompt = `Please analyze this file from the VIB3 project:\n\nFile: ${filePath}\n\n\`\`\`\n${fileContent}\n\`\`\`\n\nProvide insights about the code, potential issues, and suggestions for improvement.`;

      console.log('\n🤔 Gemini is analyzing the file...\n');
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      console.log(`\n💎 Gemini:\n${response}\n`);

      conversationHistory.push({ role: 'user', content: prompt });
      conversationHistory.push({ role: 'assistant', content: response });
    } catch (error) {
      console.error(`\n❌ Error reading file: ${error.message}\n`);
    }
    rl.prompt();
    return;
  }

  if (!input) {
    rl.prompt();
    return;
  }

  // Send message to Gemini
  try {
    console.log('\n🤔 Gemini is thinking...\n');

    // Build conversation context
    const contextPrompt = conversationHistory.length > 0
      ? conversationHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n\n') + '\n\nUser: ' + input
      : input;

    const result = await model.generateContent(contextPrompt);
    const response = result.response.text();

    console.log(`💎 Gemini:\n${response}\n`);

    // Save to history
    conversationHistory.push({ role: 'user', content: input });
    conversationHistory.push({ role: 'assistant', content: response });

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
  }

  rl.prompt();
});

rl.on('close', () => {
  console.log('\n👋 Gemini CLI closed.\n');
  process.exit(0);
});
