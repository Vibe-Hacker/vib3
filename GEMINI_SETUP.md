# Gemini AI Terminal Setup for VIB3

A command-line interface to chat with Google's Gemini AI for coding assistance on the VIB3 project.

## Setup Instructions

### 1. Get Your Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### 2. Set Environment Variable

**Option A: Persistent (Recommended)**
```cmd
setx GEMINI_API_KEY "your-api-key-here"
```
Then **close and reopen** your terminal for the change to take effect.

**Option B: Temporary (Current Session Only)**
```cmd
set GEMINI_API_KEY=your-api-key-here
```

**PowerShell:**
```powershell
$env:GEMINI_API_KEY="your-api-key-here"
```

### 3. Run Gemini CLI

From the VIB3 directory:

```cmd
gemini
```

Or directly with Node:

```cmd
node gemini-cli.js
```

## Features

### Interactive Chat
Just type your questions and press Enter. Gemini maintains conversation context.

### Commands

- `/exit` or `/quit` - Exit the chat
- `/clear` - Clear conversation history
- `/save` - Save conversation to a text file
- `/file <path>` - Analyze a file from your project
- `/help` - Show help message

### Example Usage

```
💎 You: How can I optimize Flutter video playback?

🤔 Gemini is thinking...

💎 Gemini:
Here are some strategies to optimize Flutter video playback:

1. Use video_player with caching...
2. Implement lazy loading...
[... detailed response ...]
```

### Analyze Project Files

```
💎 You: /file vib3_app/lib/main.dart
```

Gemini will analyze the file and provide insights, suggestions, and potential issues.

## Tips

1. **Be Specific**: Ask detailed questions about your code
2. **Share Context**: Mention the VIB3 project and Flutter when relevant
3. **Use /file**: Analyze specific files for targeted advice
4. **Save Important Chats**: Use `/save` to keep useful conversations

## Troubleshooting

### "GEMINI_API_KEY not set" error

Make sure you:
1. Set the environment variable correctly
2. **Reopened your terminal** after using `setx`
3. Used the correct command for your shell (CMD vs PowerShell)

### API Key Invalid

- Verify the API key is correct (no extra spaces)
- Check that the API is enabled in your Google Cloud Console
- Ensure you're using a valid Gemini API key (not a different Google API key)

## Cost

Gemini API has a generous free tier:
- 60 requests per minute
- 1,500 requests per day
- Rate limits may apply

Check current pricing: https://ai.google.dev/pricing

## Privacy

- Conversations are stored locally in memory during the session
- Use `/save` to export conversations to text files
- No data is sent to any server except Google's Gemini API
