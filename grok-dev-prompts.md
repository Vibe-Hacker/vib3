# Grok Development Assistant - Example Prompts

## How to Use Grok to Build VIB3 Features

### 1. Feature Implementation
**Example**: "I want to add a video recommendation algorithm"

```javascript
// Ask Grok:
Feature: Video recommendation algorithm
Context: VIB3 is a TikTok-like app using MongoDB, Node.js, vanilla JS. Need to recommend videos based on user behavior.

// Grok will generate:
- Algorithm implementation
- Database schema updates
- API endpoints
- Frontend integration code
```

### 2. Bug Fixing
**Example**: "Video feed not loading"

```javascript
// Provide to Grok:
Error: Cannot read property 'map' of undefined
Stack trace: at loadVideoFeed (feed.js:45)
Code: videos.map(video => createVideoElement(video))

// Grok will analyze and provide:
- Root cause analysis
- Fixed code with null checks
- Prevention strategies
```

### 3. Performance Optimization
**Example**: "Make video loading faster"

```javascript
// Ask Grok:
Problem: Videos take 3-5 seconds to load
Current setup: Loading all video data at once from MongoDB
Constraints: Using vanilla JS, no frameworks

// Grok will suggest:
- Pagination implementation
- Lazy loading strategy
- Caching mechanisms
- Database query optimization
```

### 4. New Feature Planning
**Example**: "Add live streaming capability"

```javascript
// Request from Grok:
Feature: Live streaming for VIB3
Requirements: 
- Real-time video broadcasting
- Chat functionality
- Viewer count
- Mobile support

// Grok will provide:
- Architecture design
- Technology recommendations
- Step-by-step implementation plan
- Required dependencies
```

### 5. Database Optimization
**Example**: "Optimize video queries"

```javascript
// Ask Grok:
Description: Find videos by hashtags and sort by views, limit 20
Collection: videos
Expected: Fast query for feed algorithm

// Grok will generate:
- Optimized MongoDB query
- Index recommendations
- Aggregation pipeline if needed
```

## Quick Start Commands

### Generate a Complete Feature
```
Feature: Duet videos (side-by-side recording)
Context: Users should be able to record alongside existing videos
```

### Fix Common Issues
```
Bug: Upload fails for videos over 50MB
Stack: PayloadTooLargeError
Code: [paste your upload handler]
```

### Improve Existing Code
```
Review this code for performance:
[paste your video processing code]
Purpose: Process uploaded videos
Type: performance
```

### Architecture Decisions
```
Problem: Need to handle 100k concurrent users
Constraints: Limited to 3 servers, MongoDB Atlas
Current: Single Node.js server
```

## Pro Tips

1. **Be Specific**: The more context you provide, the better Grok's suggestions
2. **Include Constraints**: Mention tech stack limitations (vanilla JS, no React, etc.)
3. **Provide Examples**: Show existing code patterns from your codebase
4. **Ask for Explanations**: Grok can explain why certain approaches are better

## Common VIB3 Tasks

### Add New API Endpoint
```
Generate code for: User blocking feature
Context: Users should be able to block other users, blocked users' content hidden
```

### Mobile App Integration
```
Generate code for: Flutter video feed widget
Context: Need to display videos from /api/feed endpoint with swipe navigation
```

### Analytics Implementation
```
Generate code for: Video engagement tracking
Context: Track watch time, completion rate, replays per video
```

### Security Enhancement
```
Review code for: Authentication system
Purpose: Find security vulnerabilities
Type: security
```

## Integration with Existing Code

Always mention:
- "VIB3 uses vanilla JavaScript (no ES6 modules)"
- "MongoDB for database"
- "Global functions, not module exports"
- "Mobile app is Flutter"

This ensures Grok generates compatible code!