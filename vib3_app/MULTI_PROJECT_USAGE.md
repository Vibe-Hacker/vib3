# Multi-Project Autocoder - Usage Guide

## Setup Complete!

The autocoder is now configured to work across **all your projects**.

## How It Works Now

### Before (ROOT_ONLY=1)
- ❌ Confined to one project folder
- ❌ Can't work on different VIB3 locations
- ❌ Can't access files outside project

### After (ROOT_ONLY=0)
- ✅ Works in any directory
- ✅ Can work on D:\VIB3_Project\vib3app1
- ✅ Can work on C:\Users\VIBE\Desktop\VIB3\vib3_app
- ✅ Can work on multiple projects in one session
- ✅ Can access any file on your system

## Usage Methods

### Method 1: Navigate Then Run
```cmd
REM Work on project 1
cd D:\VIB3_Project\vib3app1
python vib3_autocoder.py "Fix the camera issue"

REM Work on project 2
cd C:\Users\VIBE\Desktop\VIB3\vib3_app
python vib3_autocoder.py "Add like animation"
```

### Method 2: Set PROJECT_ROOT Environment Variable
```cmd
REM Set which project to work on
set PROJECT_ROOT=D:\VIB3_Project\vib3app1
python vib3_autocoder.py "Fix camera"

REM Switch to different project
set PROJECT_ROOT=C:\Users\VIBE\Desktop\VIB3\vib3_app
python vib3_autocoder.py "Add feature"
```

### Method 3: Universal Autocoder (from anywhere)
```cmd
REM Install universal version (one time)
copy vib3_autocoder.py %USERPROFILE%\autocoder\autocoder.py

REM Then from any directory:
cd D:\VIB3_Project\vib3app1
python %USERPROFILE%\autocoder\autocoder.py "Your goal"
```

## Example: Work on Both VIB3 Locations

### Fix Camera in Project 1
```cmd
cd D:\VIB3_Project\vib3app1
python vib3_autocoder.py "Fix the front-facing camera initialization issue"
```

**What it will do:**
- Search D:\VIB3_Project\vib3app1 for camera files
- Read and analyze the code
- Make fixes
- Backup to D:\VIB3_Project\vib3app1\.vib3_backups
- Commit to git in that project

### Sync Changes to Project 2
```cmd
cd C:\Users\VIBE\Desktop\VIB3\vib3_app
python vib3_autocoder.py "Apply the camera fix from D:\VIB3_Project\vib3app1"
```

**What it will do:**
- With ROOT_ONLY=0, it can read files from D:\VIB3_Project\vib3app1
- Copy the fix to C:\Users\VIBE\Desktop\VIB3\vib3_app
- Backup and commit in the second project

## Advanced: Cross-Project Tasks

### Sync Two Projects
```cmd
cd C:\Users\VIBE\Desktop\VIB3\vib3_app
python vib3_autocoder.py "Compare this project with D:\VIB3_Project\vib3app1 and identify differences in the camera implementation"
```

### Merge Changes
```cmd
cd D:\VIB3_Project\vib3app1
python vib3_autocoder.py "Merge improvements from C:\Users\VIBE\Desktop\VIB3\vib3_app into this project"
```

## Safety Features Still Active

Even with ROOT_ONLY=0:
- ✅ All changes backed up
- ✅ All changes committed to git
- ✅ Full logging
- ✅ Step/time caps
- ✅ Dangerous command blocking (rm -rf /, format, etc.)
- ✅ Unified diffs for review

## Review Changes

### Check What Changed in Project 1
```cmd
cd D:\VIB3_Project\vib3app1
type .vib3_autocoder.log
git log autocoder/vib3
git diff master..autocoder/vib3
```

### Check What Changed in Project 2
```cmd
cd C:\Users\VIBE\Desktop\VIB3\vib3_app
type .vib3_autocoder.log
git log autocoder/vib3
git diff master..autocoder/vib3
```

## Configuration

Current settings (system-wide):
- `GPT_MODEL=gpt-5`
- `ROOT_ONLY=0` ← Multi-project mode
- `AUTO_APPLY=1` ← Auto-applies changes
- `AUTO_RUN=1` ← Auto-runs commands
- `MAX_STEPS=80`
- `MAX_MINUTES=45`

### To Revert to Single-Project Mode
```cmd
setx ROOT_ONLY 1
```
(Open NEW command prompt after)

## Example Goals

### Single Project Goals
```cmd
cd D:\VIB3_Project\vib3app1
python vib3_autocoder.py "Fix all flutter analyze warnings"
python vib3_autocoder.py "Optimize video playback performance"
python vib3_autocoder.py "Add error handling to camera initialization"
```

### Multi-Project Goals
```cmd
cd D:\VIB3_Project\vib3app1
python vib3_autocoder.py "Synchronize the camera implementation with C:\Users\VIBE\Desktop\VIB3\vib3_app"

cd C:\Users\VIBE\Desktop\VIB3\vib3_app
python vib3_autocoder.py "Copy the video processing improvements from D:\VIB3_Project\vib3app1"
```

## Tips

1. **Always cd to your main project first** - The autocoder uses the current directory as PROJECT_ROOT

2. **Use specific paths in goals** - When referencing other projects, use full paths:
   - Good: "Compare with D:\VIB3_Project\vib3app1"
   - Bad: "Compare with other project"

3. **Check logs in each project** - Each project gets its own `.vib3_autocoder.log`

4. **Review before merging** - Check diffs with `git diff` before merging the autocoder branch

5. **Use git branches** - The autocoder creates `autocoder/vib3` branches - review and merge separately

## Now You Can Work Across All Projects!

The autocoder can now:
- Work on any project directory
- Access files across projects
- Help synchronize changes
- Operate on multiple codebases

Just cd to your project and run it!
