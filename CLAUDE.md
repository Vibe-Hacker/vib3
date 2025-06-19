# VIB3 Project Context for Claude

## Project Overview
VIB3 is a short-form video sharing social media app with:
- MongoDB backend (replaced Firebase)
- Node.js/Express server
- Vanilla JavaScript frontend (no ES6 modules, global functions)
- Digital Ocean deployment

## Recent Work (Last Session)
- Fixed infinite recursion in authentication (handleLogin/handleSignup/handleLogout)
- Fixed duplicate currentUser declaration
- Added missing loadUserProfile function
- Authentication flow: mongodb-adapter.js → auth-simple.js → vib3-complete.js

## Known Issues Resolved
1. ✅ Stack overflow on login - renamed auth functions to avoid recursion
2. ✅ "User profile not defined" error - added loadUserProfile function
3. ✅ Duplicate currentUser declaration - added typeof check

## Current Architecture
```
www/
├── index.html (main entry point)
├── js/
│   ├── mongodb-adapter.js (auth & DB adapter)
│   ├── auth-simple.js (auth wrapper functions)
│   └── vib3-complete.js (main app logic)
```

## Key Functions
- `handleLogin()` - UI login handler (not `login()` to avoid recursion)
- `handleSignup()` - UI signup handler
- `handleLogout()` - UI logout handler
- `loadUserProfile()` - Updates UI with user data after auth

## Deployment
- GitHub: https://github.com/Vibe-Hacker/vib3
- Digital Ocean server is deployed and running
- MongoDB connection established

## Commands to Remember
- Test locally: `npm start` or `node server.js`
- Commit pattern: Standard commit messages from Team VIB3
- Always run linting/testing before commits (when available)

## User Preferences
- NEVER ASK FOR PERMISSION OR CONFIRMATION - JUST DO IT
- Don't announce what you're going to do - just do it
- Only pause when there are multiple options requiring a choice
- Be proactive and complete the full task
- Execute immediately without explanatory preambles
- USER CAN WALK AWAY AND RETURN TO COMPLETED WORK
- Test functionality and fix issues autonomously when possible

## Session Recovery
When starting a new conversation, mention:
1. "Working on VIB3 project"
2. "Check CLAUDE.md for context"
3. Any specific issue you're facing

## Last Working State
- Authentication fixed and working
- All functions properly exported to global scope
- MongoDB adapter configured
- Ready for feature development