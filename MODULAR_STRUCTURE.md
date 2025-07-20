# VIB3 Modular Structure

## Overview

VIB3's codebase has been modularized to prevent breaking changes when updating different parts of the system. This document outlines the new structure and how to work with it.

## Directory Structure

```
VIB3/
├── config/                 # Configuration files
│   └── video-config.js    # Video processing settings
├── constants/             # Application-wide constants
│   └── index.js          # All constants and magic numbers
├── middleware/            # Express middleware
│   └── auth.js           # Authentication middleware
├── routes/                # API route handlers
│   └── video-routes.js   # Video upload/processing routes
├── services/              # Business logic
│   └── (to be added)     # Service modules
├── uploads/               # User uploads (git-ignored)
│   └── videos/           # Video files and variants
└── temp/                  # Temporary processing files
```

## Key Modules

### 1. Configuration (`/config/`)

**Purpose**: Centralize all configuration to prevent hardcoded values in code.

**Files**:
- `video-config.js` - Video processing settings, quality presets, upload limits

**Usage**:
```javascript
const videoConfig = require('./config/video-config');
const maxSize = videoConfig.UPLOAD_LIMITS.maxFileSize;
```

### 2. Constants (`/constants/`)

**Purpose**: Single source of truth for all application constants.

**What's included**:
- Collection names
- Error codes
- API limits
- Feature flags
- Security settings

**Usage**:
```javascript
const constants = require('./constants');
const collection = db.collection(constants.COLLECTIONS.VIDEOS);
```

### 3. Middleware (`/middleware/`)

**Purpose**: Reusable request processing logic.

**Current middleware**:
- `auth.js` - Authentication and session management

**Usage**:
```javascript
const { requireAuth } = require('./middleware/auth');
app.post('/api/protected', requireAuth, handler);
```

### 4. Routes (`/routes/`)

**Purpose**: Organize API endpoints by feature area.

**Current routes**:
- `video-routes.js` - All video upload and processing endpoints

**Usage**:
```javascript
const { initializeVideoRoutes } = require('./routes/video-routes');
const videoRouter = initializeVideoRoutes({ db, s3, videoProcessor });
app.use('/api/videos', videoRouter);
```

## Benefits of This Structure

1. **Isolation**: Changes to video processing won't affect auth or other features
2. **Testability**: Each module can be tested independently
3. **Reusability**: Middleware and services can be used across routes
4. **Maintainability**: Easy to find and update specific functionality
5. **Scalability**: New features can be added as new modules

## Working with the Modular Structure

### Adding a New Feature

1. Create configuration in `/config/`
2. Add constants to `/constants/index.js`
3. Create service logic in `/services/`
4. Create routes in `/routes/`
5. Use existing middleware or create new ones

### Modifying Existing Features

1. Check if it's configuration - update `/config/`
2. Check if it's a constant - update `/constants/`
3. Find the relevant route file
4. Update only that module

### Example: Adding a New Endpoint

```javascript
// 1. Add to constants/index.js
COLLECTIONS: {
    // ...
    PLAYLISTS: 'playlists'
}

// 2. Create routes/playlist-routes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const constants = require('../constants');

router.post('/create', requireAuth, async (req, res) => {
    // Implementation
});

module.exports = router;

// 3. Add to server.js
app.use('/api/playlists', require('./routes/playlist-routes'));
```

## Migration Status

### ✅ Completed
- Video configuration extracted
- Constants centralized
- Authentication middleware modularized
- Video routes separated

### 🔄 In Progress
- Database models
- Service layer
- Additional middleware

### 📋 TODO
- User routes
- Feed routes
- Analytics routes
- Search functionality
- Admin routes

## Best Practices

1. **Never hardcode values** - Use constants or config
2. **Keep routes thin** - Business logic goes in services
3. **Reuse middleware** - Don't duplicate auth checks
4. **Document changes** - Update this file when adding modules
5. **Test in isolation** - Each module should work independently

## Environment Variables

The modular structure respects these environment variables:

```bash
# Features
ENABLE_MULTI_QUALITY=true  # Enable multi-quality video processing

# Bypass flags
BYPASS_VIDEO_PROCESSING=true  # Skip video processing for testing

# Admin
ADMIN_USER_IDS=userId1,userId2  # Comma-separated admin user IDs
```

## Troubleshooting

### Module not found errors
- Check relative paths (use `../` for parent directory)
- Ensure module.exports is correct

### Configuration not loading
- Check if config file exists
- Verify require path is correct

### Middleware not working
- Ensure middleware is applied before routes
- Check middleware order (auth should be early)

### Routes not accessible
- Verify route is mounted in server.js
- Check route path and method match request