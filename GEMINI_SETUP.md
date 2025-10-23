# Gemini AI Setup for VIB3

Three ways to use Gemini AI for coding on the VIB3 project.

---

## 1. Gemini CLI (Command-Line Coding Assistant) - INSTALLED ✅

**Google's official CLI - works exactly like Claude Code!**

### What It Does
- Terminal-based coding assistant (just like `claude` command)
- Edits files, creates features, fixes bugs
- Reads your entire codebase
- Uses Gemini 2.5 Pro with 1M token context

### Installation
Already installed via:
```bash
npm install -g @google/gemini-cli
```

Version: **0.10.0** ✅

### How to Use

**Start Gemini CLI:**
```cmd
gemini
```

First time you'll see authentication options:
- **Option 1 (Recommended)**: Login with Google (FREE - 1,000 req/day)
- **Option 2**: Use API key from Google AI Studio

**Example Usage:**
```
$ gemini
> fix the front camera mirroring issue
> add a new feature for video effects
> explain how the video upload works
```

### Commands
- Type your request and press Enter
- Gemini will read/edit files automatically
- Exit with `Ctrl+C` or type `/exit`

---

## 2. Gemini Code Assist (VS Code Extension)

Works inside VS Code with AI code completion and inline generation.

### Installation

1. Open VS Code
2. Press `Ctrl+Shift+X` (Extensions)
3. Search: **"Gemini Code Assist"**
4. Click Install
5. Sign in with Google
6. Start using (FREE)

### Features

- **Agent Mode**: Multi-file task completion
- **Code Completion**: Tab to accept suggestions
- **Inline Generation**: `Ctrl+I` for code prompts
- **Context-Aware**: Analyzes entire codebase

---

## 3. Simple Gemini Chat (Terminal Window)

Basic chat interface I built earlier (not a coding assistant).

### How to Use

**Desktop Shortcut:**
- Double-click **"Gemini AI"** icon on desktop

**Or via Command:**
```cmd
cd C:\Users\VIBE\Desktop\VIB3
gemini-cli
```
(Note: This uses the `gemini-cli.js` file, NOT the official Google Gemini CLI above)

### Features
- `/file <path>` - Analyze a file
- `/save` - Save conversation
- `/clear` - Clear history
- `/exit` - Quit

---

## Comparison

| Feature | Gemini CLI (Official) | Gemini Code Assist | Simple Chat |
|---------|----------------------|-------------------|-------------|
| **Command** | `gemini` | Inside VS Code | Desktop shortcut |
| **Type** | Like Claude Code | VS Code Extension | Basic chat |
| **Edits Files** | ✅ Yes | ✅ Yes | ❌ No |
| **Codebase Aware** | ✅ Yes | ✅ Yes | ❌ No |
| **Best For** | Command-line coding | IDE coding | Quick questions |

---

## Recommendation

**For coding (like Claude Code):** Use **Gemini CLI** (`gemini` command)

**For VS Code integration:** Use **Gemini Code Assist** extension

**For quick chat:** Use desktop shortcut

---

## Links

- Gemini CLI GitHub: https://github.com/google-gemini/gemini-cli
- Gemini Code Assist Docs: https://developers.google.com/gemini-code-assist
- Get API Key: https://makersuite.google.com/app/apikey
