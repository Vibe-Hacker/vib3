# VIB3 Master Coder - Following GPT-5 Official Instructions

## What This Is

This is the **official GPT-5 autonomous agent pattern** adapted for your VIB3 Flutter project. It's based on GPT-5's own "Master Coder" instructions.

## Key Features

### 1. Autonomous Agent Loop
- **Plan → Execute → Observe → Critic** cycle
- Keeps iterating until goal achieved or capped
- Maintains a running task queue

### 2. Intelligent File Search
- Indexes all files in your project
- Semantic search to find relevant code by concept
- Automatically discovers related files

### 3. Flutter/Android Integration
- Built-in `flutter_build` tool
- Built-in `flutter_analyze` tool
- Built-in `adb_logcat` tool for Android logs
- Knows about Dart, Kotlin, Gradle, YAML

### 4. Safety & Tracking
- **Auto-backup**: Every file edit backed up to `.vib3_backups/`
- **Auto-commit**: Changes committed to git branch `autocoder/vib3`
- **Unified diffs**: See exactly what changed
- **Full logging**: Everything logged to `.vib3_autocoder.log`
- **Safety guards**: Blocks destructive commands like `rm -rf /`

### 5. Watchdogs
- **Step cap**: MAX_STEPS=80 (won't run forever)
- **Time cap**: MAX_MINUTES=45 (won't run for hours)
- **Root confinement**: ROOT_ONLY=1 (can't escape project folder)
- **Failure suppression**: Stops repeating identical failures

## How to Set Up

### Step 1: Run Setup
Double-click **`VIB3_Autocoder_Setup.bat`**

This will:
- Install required packages (openai, regex, tiktoken)
- Set environment variables:
  - `OPENAI_API_KEY=sk-proj-...`
  - `GPT_MODEL=gpt-5`
  - `AUTO_APPLY=1` (auto-apply file writes)
  - `AUTO_RUN=1` (auto-run commands)
  - `MAX_STEPS=80`
  - `MAX_MINUTES=45`
  - `ROOT_ONLY=1`

**IMPORTANT:** After setup, you MUST open a NEW command prompt for environment variables to take effect!

### Step 2: Create Desktop Shortcut
```cmd
powershell -ExecutionPolicy Bypass -File create_vib3_autocoder_shortcut.ps1
```

## How to Use

### Option 1: Desktop Shortcut
1. Double-click **"VIB3 Autocoder"** on desktop
2. Enter your goal (e.g., "Fix the front-facing camera issue")
3. Press Enter and watch GPT-5 work!

### Option 2: Command Line
```cmd
cd C:\Users\VIBE\Desktop\VIB3\vib3_app
python vib3_autocoder.py "Fix the front-facing camera issue"
```

## What GPT-5 Will Do

Example goal: **"Fix the front-facing camera issue"**

1. **PLAN**: "I'll search for camera-related files, read the implementation, identify the issue"
2. **ACTION**: Uses `search_files` to find camera code
3. **ACTION**: Uses `read_file` to read EnhancedCameraScreen
4. **OBSERVATION**: "The front camera initialization is missing proper lens direction check"
5. **PLAN**: "I'll modify the camera controller initialization"
6. **ACTION**: Uses `write_file` to fix the issue
7. **OBSERVATION**: "File written and backed up"
8. **ACTION**: Uses `flutter_analyze` to check for errors
9. **OBSERVATION**: "Analysis passed"
10. **ACTION**: Uses `flutter_build` to test compilation
11. **OBSERVATION**: "Build succeeded"
12. **PLAN**: "Task complete - front camera fix applied and verified"

## Tools Available to GPT-5

1. **list_dir** - Browse directories
2. **read_file** - Read any text file (Dart, Kotlin, YAML, etc.)
3. **write_file** - Edit/create files (auto-backed up, auto-committed)
4. **run_cmd** - Execute any shell command
5. **search_files** - Find files by concept/name
6. **flutter_build** - Build debug APK
7. **flutter_analyze** - Run static analysis
8. **adb_logcat** - Get Android logs

## Configuration Options

You can adjust these by running `setx` commands:

```cmd
REM Use GPT-5 Mini (faster, cheaper)
setx GPT_MODEL gpt-5-mini

REM Increase iteration cap
setx MAX_STEPS 120

REM Increase time limit
setx MAX_MINUTES 60

REM Disable auto-apply (review changes first)
setx AUTO_APPLY 0

REM Disable auto-run (approve commands first)
setx AUTO_RUN 0

REM Allow access outside project (dangerous!)
setx ROOT_ONLY 0
```

Remember to open a NEW command prompt after `setx`!

## Example Goals

### Fix Camera Issue
```cmd
python vib3_autocoder.py "Fix the front-facing camera initialization issue"
```

### Analyze Project
```cmd
python vib3_autocoder.py "Analyze the VIB3 project structure and identify potential issues"
```

### Add Feature
```cmd
python vib3_autocoder.py "Add a like animation when users double-tap videos"
```

### Debug Build
```cmd
python vib3_autocoder.py "Fix all Flutter analyzer warnings and build errors"
```

### Improve Performance
```cmd
python vib3_autocoder.py "Analyze video playback performance and optimize it"
```

## Reviewing Changes

### Check What Changed
```cmd
REM View the log
type .vib3_autocoder.log

REM View backups
dir .vib3_backups

REM View git commits
git log autocoder/vib3

REM See diffs
git diff master..autocoder/vib3
```

### Merge Changes
```cmd
REM If you like the changes:
git checkout master
git merge autocoder/vib3

REM If you don't:
git branch -D autocoder/vib3
```

## The Difference from Previous Versions

| Feature | Simple | Assistant | **Autocoder** |
|---------|--------|-----------|--------------|
| Conversational | ✅ | ✅ | ❌ (autonomous) |
| File access | ❌ | ✅ | ✅ |
| Autonomous loop | ❌ | ❌ | **✅** |
| Task queue | ❌ | ❌ | **✅** |
| Semantic search | ❌ | ❌ | **✅** |
| Auto-backup | ❌ | ✅ | **✅** |
| Auto-commit | ❌ | ❌ | **✅** |
| Flutter tools | ❌ | ❌ | **✅** |
| Watchdogs | ❌ | ❌ | **✅** |

## How It's Different from "gpt5_assistant.py"

**gpt5_assistant.py** (conversational):
- You chat back and forth
- It waits for your input after each response
- Like Claude Code - interactive

**vib3_autocoder.py** (autonomous):
- You give it a goal and it runs until done
- Plan → Execute → Observe loop
- Keeps track of sub-tasks
- Iterates until goal achieved
- Like having an autonomous developer

Both use the same tools, but different interaction models!

## Troubleshooting

### "OPENAI_API_KEY not set"
Run `VIB3_Autocoder_Setup.bat` again, then open a NEW command prompt.

### "Module not found: openai"
```cmd
pip install --upgrade openai regex tiktoken
```

### Agent gets stuck in a loop
- Check `.vib3_autocoder.log` to see what it's doing
- Lower `MAX_STEPS` or `MAX_MINUTES`
- Give it a more specific goal

### Changes not applying
- Check if `AUTO_APPLY=1` is set
- Check `.vib3_backups/` to see if backups are being created
- Check logs for errors

### Agent too cautious
```cmd
setx AUTO_RUN 1
setx AUTO_APPLY 1
```

## This is GPT-5's Official Pattern!

This code follows the exact structure from GPT-5's own documentation:
- Responses API with tools
- Plan → Execute → Observe loop
- Persistent task queue
- Semantic file search
- Auto-backup and git integration
- Watchdog protections

It's the "Master Coder" pattern, adapted for Flutter/Android/VIB3!
