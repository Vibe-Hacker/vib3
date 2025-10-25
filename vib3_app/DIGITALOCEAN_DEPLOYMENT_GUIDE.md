# DigitalOcean Deployment Guide - App 2 (vib3)

## Current Status

**App Name:** vib3 (Full-Stack App)
**Flutter App:** C:\Users\VIBE\Desktop\VIB3\vib3_app
**Backend:** C:\Users\VIBE\Desktop\VIB3\server.js (Node.js/Express)
**Current URL:** https://vib3app.net
**Type:** Full-stack with microservices architecture

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         App 2: vib3 (Flutter)                   │
│         Location: Desktop\VIB3\vib3_app         │
└─────────────────┬───────────────────────────────┘
                  │
                  │ API Calls
                  ↓
┌─────────────────────────────────────────────────┐
│    Backend API (Node.js/Express)                │
│    Location: Desktop\VIB3\server.js             │
│    URL: vib3app.net (needs DO deployment)       │
│    Features:                                     │
│    - Video processing (FFmpeg)                  │
│    - Grok AI integration                        │
│    - AR/ML features                             │
│    - Microservices architecture                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────┐
│         MongoDB Database                         │
│         Database: vib3_app2_prod                │
└─────────────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────┐
│    DigitalOcean Spaces (CDN)                    │
│    Bucket: vib3-app2-media                      │
└─────────────────────────────────────────────────┘
```

---

## What You Have (Backend Features)

Your backend (C:\Users\VIBE\Desktop\VIB3\server.js) includes:

✅ **Core Features:**
- Express.js API server
- MongoDB integration
- AWS S3/Spaces integration
- Video processing with FFmpeg
- Session management
- CORS configured for mobile apps

✅ **Advanced Features:**
- Grok AI task manager
- Video proxy for CORS bypass
- Microservices architecture
- Health check endpoints
- Password reset system

✅ **Dependencies:**
- Google Generative AI
- TensorFlow.js
- Elasticsearch
- Bull (job queues)
- Redis/IORedis
- KafkaJS
- WebSocket support

---

## Step-by-Step DigitalOcean Deployment

### Step 1: Prepare Backend for Deployment

#### 1.1 Create Git Repository (if not exists)

```bash
cd C:\Users\VIBE\Desktop\VIB3

# Initialize git (if not done)
git init
git branch -M main

# Create .gitignore
echo node_modules/ > .gitignore
echo .env >> .gitignore
echo temp/ >> .gitignore
echo *.log >> .gitignore

# Add files
git add .
git commit -m "Initial commit - VIB3 backend"

# Push to GitHub
git remote add origin https://github.com/Vibe-Hacker/vib3-backend.git
git push -u origin main
```

#### 1.2 Create .env.production

Create `C:\Users\VIBE\Desktop\VIB3\.env.production`:

```bash
# App Configuration
NODE_ENV=production
PORT=8080
APP_NAME=vib3_backend

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vib3_app2_prod

# Grok AI
GROK_API_KEY=<your-grok-key>

# AWS/DigitalOcean Spaces
AWS_ACCESS_KEY_ID=<your-do-spaces-key>
AWS_SECRET_ACCESS_KEY=<your-do-spaces-secret>
AWS_REGION=nyc3
AWS_S3_BUCKET=vib3-app2-media
AWS_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Storage
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=vib3-app2-media
DO_SPACES_REGION=nyc3

# Authentication
JWT_SECRET=<generate-strong-secret>
SESSION_SECRET=<generate-strong-secret>

# Email (for password reset)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=<your-smtp-user>
SMTP_PASS=<your-smtp-pass>
EMAIL_FROM=noreply@vib3app.net

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379

# CORS
ALLOWED_ORIGINS=*

# Features
ENABLE_VIDEO_PROCESSING=true
ENABLE_AI_FEATURES=true
MAX_VIDEO_SIZE_MB=500
```

---

### Step 2: Deploy Backend to DigitalOcean App Platform

#### 2.1 Go to DigitalOcean Console

1. Visit: https://cloud.digitalocean.com/apps
2. Click "Create App"

#### 2.2 Connect GitHub Repository

- **Source:** GitHub
- **Repository:** vib3-backend (your backend repo)
- **Branch:** main
- **Autodeploy:** ✅ Enabled
- **Source Directory:** / (root)

#### 2.3 Configure Build Settings

```yaml
Name: vib3-backend-app2
Environment: Node.js

Build Command: npm install
Run Command: npm start

Dockerfile: (leave empty - using buildpack)
```

#### 2.4 Set Environment Variables

In the DigitalOcean console, add ALL variables from `.env.production`:

```bash
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://...
GROK_API_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
# ... (all variables from above)
```

**Important:**
- Don't include quotes around values
- One variable per line
- Use the exact names from your code

#### 2.5 Choose Resources

**Plan Options:**
- **Basic ($5/mo):** 512 MB RAM, 1 vCPU - Good for testing
- **Professional ($12/mo):** 1 GB RAM, 1 vCPU - Recommended for production
- **Professional ($24/mo):** 2 GB RAM, 1 vCPU - For video processing

**Recommendation:** Start with $12/month, scale up if needed

#### 2.6 Add Domain (Optional)

If you own `vib3app.net`:

1. In DigitalOcean App settings → Domains
2. Add domain: `vib3app.net`
3. Add DNS records at your domain registrar:
   ```
   Type: CNAME
   Name: @ (or vib3app.net)
   Value: <your-app-url>.ondigitalocean.app
   ```

4. Add API subdomain:
   ```
   Type: CNAME
   Name: api
   Value: <your-app-url>.ondigitalocean.app
   ```

#### 2.7 Deploy

1. Click "Create Resources"
2. Wait 5-10 minutes for deployment
3. Your app will be available at:
   - `https://<your-app-name>.ondigitalocean.app`
   - `https://vib3app.net` (if domain configured)

---

### Step 3: Create MongoDB Database

#### Option A: MongoDB Atlas (Recommended - Free Tier Available)

1. Go to: https://cloud.mongodb.com
2. Create free cluster
3. Database name: `vib3_app2_prod`
4. Get connection string
5. Whitelist DigitalOcean IPs (or allow all: 0.0.0.0/0)
6. Update `MONGODB_URI` in DigitalOcean app env vars

#### Option B: DigitalOcean Managed Database

1. Go to: https://cloud.digitalocean.com/databases
2. Create MongoDB cluster
3. Plan: Basic ($15/month)
4. Database: `vib3_app2_prod`
5. Get connection string
6. Add to trusted sources: DigitalOcean App Platform
7. Update `MONGODB_URI` in app env vars

---

### Step 4: Create DigitalOcean Spaces for Media

#### 4.1 Create Space

1. Go to: https://cloud.digitalocean.com/spaces
2. Click "Create Space"
3. Settings:
   - **Name:** `vib3-app2-media`
   - **Region:** NYC3 (or closest to users)
   - **Enable CDN:** ✅ Yes
   - **File Listing:** Private

#### 4.2 Configure CORS

Click "Settings" → "CORS Configurations" → Add:

```json
{
  "CORSConfiguration": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000,
    "ExposeHeaders": ["ETag", "Content-Length"]
  }]
}
```

#### 4.3 Generate API Keys

1. Go to: API → Spaces Keys
2. Click "Generate New Key"
3. Name: `vib3-app2-backend`
4. Save:
   - **Access Key ID**
   - **Secret Access Key**

#### 4.4 Update Backend Environment

In DigitalOcean App settings, update:

```bash
AWS_ACCESS_KEY_ID=<your-spaces-access-key>
AWS_SECRET_ACCESS_KEY=<your-spaces-secret-key>
AWS_S3_BUCKET=vib3-app2-media
DO_SPACES_BUCKET=vib3-app2-media
```

#### 4.5 Note CDN URL

Your CDN URL will be:
```
https://vib3-app2-media.nyc3.cdn.digitaloceanspaces.com
```

---

### Step 5: Update Flutter App Configuration

Update `C:\Users\VIBE\Desktop\VIB3\vib3_app\.env`:

```bash
APP_NAME=vib3_app2
APP_ENV=production

# Backend (update with your DigitalOcean app URL)
BACKEND_URL=https://<your-app>.ondigitalocean.app
API_BASE_URL=https://<your-app>.ondigitalocean.app/api
WEBSOCKET_URL=wss://<your-app>.ondigitalocean.app/ws

# Or if using custom domain:
BACKEND_URL=https://vib3app.net
API_BASE_URL=https://api.vib3app.net
WEBSOCKET_URL=wss://vib3app.net/ws

# Database
MONGODB_DATABASE_NAME=vib3_app2_prod

# AI
GROK_API_KEY=<your-grok-key>

# Storage
DO_SPACES_BUCKET=vib3-app2-media
CDN_BASE_URL=https://vib3-app2-media.nyc3.cdn.digitaloceanspaces.com

# App Identifiers
ANDROID_PACKAGE_NAME=com.vib3.vib3app2
IOS_BUNDLE_ID=com.vib3.vib3app2
```

---

## Deployment Checklist

### Backend ✅
- [ ] Code pushed to GitHub repository
- [ ] DigitalOcean App created and connected to repo
- [ ] All environment variables configured
- [ ] App deployed successfully
- [ ] Health endpoint accessible: `/health`
- [ ] Custom domain configured (optional)

### Database ✅
- [ ] MongoDB cluster created (Atlas or DO)
- [ ] Database `vib3_app2_prod` created
- [ ] Connection string added to backend
- [ ] IP whitelist configured
- [ ] Test connection successful

### Storage ✅
- [ ] Spaces bucket `vib3-app2-media` created
- [ ] CDN enabled
- [ ] CORS policy configured
- [ ] API keys generated
- [ ] Keys added to backend environment
- [ ] Test upload successful

### Flutter App ✅
- [ ] `.env` updated with production URLs
- [ ] API calls tested
- [ ] Video upload tested
- [ ] Video playback tested
- [ ] APK built for release

### Testing ✅
- [ ] Backend health check: `curl https://your-app/health`
- [ ] API endpoints working
- [ ] Video upload working
- [ ] Video playback from CDN working
- [ ] Grok AI features working
- [ ] Authentication working

---

## Environment Variables Reference

### Required for Backend Deployment

```bash
# Essential
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://...

# Storage (AWS SDK compatible)
AWS_ACCESS_KEY_ID=<spaces-key>
AWS_SECRET_ACCESS_KEY=<spaces-secret>
AWS_REGION=nyc3
AWS_S3_BUCKET=vib3-app2-media
AWS_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Authentication
JWT_SECRET=<strong-random-string>

# AI
GROK_API_KEY=<your-grok-key>

# Optional
REDIS_URL=redis://...
SMTP_HOST=smtp.sendgrid.net
```

---

## Cost Estimate (DigitalOcean)

| Resource | Plan | Cost/Month |
|----------|------|------------|
| App Platform | Professional (1GB) | $12 |
| MongoDB | Basic (1GB) | $15 |
| Spaces (50GB + CDN) | Standard | $5 |
| **Total** | | **$32** |

**Savings Options:**
- Use MongoDB Atlas free tier: Save $15/month
- Use Basic App Platform: Save $7/month
- Minimum cost: **$10/month** (Basic + Spaces + Free MongoDB)

---

## Testing Your Deployment

### 1. Test Backend Health

```bash
curl https://your-app.ondigitalocean.app/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-25T...",
  "deploymentVersion": "...",
  "staticMiddlewareFixed": true
}
```

### 2. Test Video Upload

```bash
curl -X POST https://your-app.ondigitalocean.app/api/videos/upload \
  -H "Content-Type: multipart/form-data" \
  -F "video=@test-video.mp4"
```

### 3. Test from Flutter App

Build and run your Flutter app:
```bash
cd C:\Users\VIBE\Desktop\VIB3\vib3_app
flutter run --release
```

---

## Troubleshooting

### Backend won't deploy

**Check build logs:**
1. Go to App → Activity → Build Logs
2. Look for errors in npm install or npm start

**Common issues:**
- Missing dependencies in package.json
- Wrong Node.js version (needs >=18.0.0)
- Environment variables not set

**Fix:**
```bash
# Ensure package.json has correct engines
"engines": {
  "node": ">=18.0.0",
  "npm": ">=8.0.0"
}
```

### Video upload fails

**Check:**
- Spaces API keys are correct
- CORS policy allows your domain
- Bucket permissions
- File size limits (update MAX_VIDEO_SIZE_MB)

**Test Spaces access:**
```bash
# Using AWS CLI
aws s3 ls s3://vib3-app2-media --endpoint-url=https://nyc3.digitaloceanspaces.com
```

### MongoDB connection fails

**Check:**
- Connection string format is correct
- Database name matches (vib3_app2_prod)
- IP whitelist includes DigitalOcean
- Username/password are correct

**Test connection:**
```bash
mongosh "mongodb+srv://user:pass@cluster/vib3_app2_prod"
```

### App can't reach backend

**Check:**
- BACKEND_URL in Flutter .env is correct
- Backend CORS allows mobile app origins
- Backend is actually running (check health endpoint)
- No typos in URLs

---

## Scaling & Performance

### When to Scale Up

Scale when you see:
- High CPU usage (>80%)
- High memory usage (>80%)
- Slow response times
- Request queuing

### How to Scale

**Vertical Scaling (More Power):**
1. Go to App Settings
2. Change instance size: 512MB → 1GB → 2GB
3. Redeploy

**Horizontal Scaling (More Instances):**
1. Go to App Settings → Components
2. Increase instance count: 1 → 2 → 3
3. Load balancer automatically configured

---

## Monitoring

### DigitalOcean Monitoring

1. Go to App → Insights
2. View:
   - Request rate
   - Response time
   - Error rate
   - CPU/Memory usage

### Application Logs

```bash
# View live logs
doctl apps logs <app-id> --follow

# Or in console
App → Runtime Logs
```

### Health Checks

Set up uptime monitoring:
- UptimeRobot (free)
- Monitor: `https://your-app/health`
- Alert if down for >5 minutes

---

## Security Best Practices

### ✅ DO:
- Use environment variables for secrets
- Enable HTTPS (automatic with DO)
- Use strong JWT secrets
- Whitelist MongoDB IPs
- Use private Spaces buckets
- Enable rate limiting
- Validate file uploads

### ❌ DON'T:
- Commit .env files
- Use weak passwords
- Allow all origins in CORS (in production)
- Skip input validation
- Store passwords in plain text
- Expose internal APIs publicly

---

## Next Steps

1. ✅ Push backend code to GitHub
2. ✅ Create DigitalOcean App
3. ✅ Configure environment variables
4. ✅ Create MongoDB database
5. ✅ Create Spaces bucket
6. ✅ Deploy and test
7. ✅ Update Flutter app .env
8. ✅ Build and test Flutter app
9. 🔄 Submit to app stores

---

## Useful Commands

```bash
# Build Flutter app
flutter build apk --release

# Test backend locally
cd C:\Users\VIBE\Desktop\VIB3
npm start

# Check DigitalOcean app status
doctl apps list

# View app logs
doctl apps logs <app-id>

# Restart app
doctl apps restart <app-id>
```

---

## Support Resources

- **DigitalOcean Docs:** https://docs.digitalocean.com
- **DigitalOcean Support:** https://www.digitalocean.com/support
- **Community:** https://www.digitalocean.com/community
- **Status Page:** https://status.digitalocean.com

---

**Your App 2 deployment is ready to go! 🚀**
