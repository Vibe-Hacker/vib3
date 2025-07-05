# VIB3 Web Frontend Deployment

## How to Deploy Web Frontend Separately on Railway

### Step 1: Create New Railway Project
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your VIB3 repository
5. **IMPORTANT**: Set the root directory to `/web`

### Step 2: Configure Environment
In Railway settings, add these:
- **Root Directory**: `/web`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step 3: Update Backend CORS
Make sure your backend server.js allows the new web URL:
```javascript
app.use((req, res, next) => {
    const allowedOrigins = [
        'http://localhost:3000',
        'https://vib3-web.up.railway.app', // Your new web URL
        'https://vib3-production.up.railway.app' // Keep old one for compatibility
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    // ... rest of CORS config
});
```

### Step 4: Update config.js
Change the API_URL in `/web/config.js` to point to your backend:
```javascript
API_URL: 'https://vib3-production.up.railway.app'
```

## Benefits:
1. ✅ No more cached vib3-complete.js issues
2. ✅ Web and app stay synced through shared backend
3. ✅ Can update web without touching backend
4. ✅ Backend remains stable for mobile app
5. ✅ Likes, comments, users all shared between platforms

## Architecture:
```
┌─────────────┐     ┌─────────────┐
│  Web App    │     │ Mobile App  │
│  (New Railway) │     │             │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └───────┬───────────┘
               │
       ┌───────▼───────┐
       │   Backend API  │
       │ (Current Railway) │
       └───────┬───────┘
               │
       ┌───────▼───────┐
       │    MongoDB    │
       └───────────────┘
```