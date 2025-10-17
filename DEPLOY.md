# VIB3 Backend Deployment Guide

## DigitalOcean App Platform Deployment

### Prerequisites
1. DigitalOcean account
2. MongoDB Atlas cluster (or DigitalOcean managed MongoDB)
3. GitHub repo connected: https://github.com/Vibe-Hacker/vib3

### Quick Deploy via UI

1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Select "GitHub" as source
4. Choose repository: `Vibe-Hacker/vib3`
5. Branch: `main`
6. Auto-deploy: Enable
7. Source directory: `/` (root)
8. Build command: `npm install`
9. Run command: `node server.js`
10. HTTP port: `3000`
11. Instance type: Basic (512MB RAM minimum recommended)

### Environment Variables to Configure

In the DigitalOcean App Platform UI, add these as encrypted environment variables:

**Required:**
- `MONGODB_URI` - Your MongoDB connection string
  - Example: `mongodb+srv://vib3user:password@cluster0.mongodb.net/vib3?retryWrites=true&w=majority`
- `JWT_SECRET` - Secret key for JWT tokens (generate a random 64-character string)
- `DO_SPACES_KEY` - Your DigitalOcean Spaces access key (see .env file)
- `DO_SPACES_SECRET` - Your DigitalOcean Spaces secret key (see .env file)

**Optional (for AI features):**
- `GROK_API_KEY` - Your xAI Grok API key (see .env file for value)
- `CLAUDE_API_KEY` - Your Claude AI API key (if using Claude features)

**Auto-set:**
- `NODE_ENV=production`
- `PORT=3000`
- `DO_SPACES_BUCKET=vib3-videos`
- `DO_SPACES_REGION=nyc3`
- `CLAUDE_BASE_URL=https://api.anthropic.com/v1`

### MongoDB Setup

If you don't have MongoDB yet:

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Database: `vib3`
4. Create user: `vib3user` with strong password
5. Whitelist IP: `0.0.0.0/0` (allows DigitalOcean to connect)
6. Get connection string from "Connect" button
7. Add to DigitalOcean as `MONGODB_URI` environment variable

### After Deployment

1. Your backend will be available at: `https://[your-app-name]-xxxxx.ondigitalocean.app`
2. Update Flutter app's `api_config.dart` to use this URL
3. Test endpoints:
   - Health check: `GET https://your-app/api/health`
   - Test endpoint: `GET https://your-app/api/test`

### Update Flutter App

Edit `D:\VIB3_Project\vib3app1\lib\core\config\api_config.dart`:

```dart
class ApiConfig {
  static const String baseUrl = 'https://[your-app-name]-xxxxx.ondigitalocean.app/api';
  static const String wsUrl = 'wss://[your-app-name]-xxxxx.ondigitalocean.app';
  // ...
}
```

### Monitoring

- View logs in DigitalOcean App Platform console
- Monitor performance and errors
- Auto-deploys on push to `main` branch

### Troubleshooting

**App won't start:**
- Check MongoDB connection string is correct
- Ensure JWT_SECRET is set
- Check logs for specific errors

**Database connection failed:**
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Test connection string locally first
- Check username/password are correct

**API endpoints return 404:**
- Ensure app is running on port 3000
- Check routes are properly configured in server.js
- Verify baseUrl in Flutter app includes `/api`
