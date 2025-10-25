# Deploy App 2 Backend to DigitalOcean - Step by Step

## 🎯 Goal: Get your App 2 backend running on DigitalOcean

**Time needed:** 30 minutes
**Cost:** $12-24/month

---

## Before You Start

✅ Make sure you have:
- [ ] DigitalOcean account (sign up at digitalocean.com)
- [ ] GitHub account
- [ ] MongoDB connection string ready (from Atlas or DO)
- [ ] Spaces API keys (from Spaces setup)

---

## Step 1: Push Backend Code to GitHub

### 1.1 Check Current Status

Open Command Prompt and run:
```cmd
cd C:\Users\VIBE\Desktop\VIB3
git status
```

### 1.2 Commit Any Changes

If you see modified files:
```cmd
git add .
git commit -m "Prepare backend for DigitalOcean deployment"
```

### 1.3 Check Remote Repository

```cmd
git remote -v
```

You should see: `https://github.com/Vibe-Hacker/vib3.git`

### 1.4 Push to GitHub

```cmd
git push origin main
```

**✅ Done!** Your code is now on GitHub.

---

## Step 2: Create DigitalOcean App

### 2.1 Open DigitalOcean Console

Go to: https://cloud.digitalocean.com/apps

Click: **"Create App"**

### 2.2 Connect GitHub

1. Choose **"GitHub"** as source
2. Click **"Manage Access"** (if needed)
3. Authorize DigitalOcean to access GitHub
4. Select repository: **"vib3"**
5. Select branch: **"main"**
6. Click **"Next"**

### 2.3 Configure Resources

**Source Directory:** Leave as `/` (root)

**Environment:** Node.js (should auto-detect)

**Build Command:**
```
npm install
```

**Run Command:**
```
npm start
```

Click **"Next"**

### 2.4 Choose Plan

**Recommended:** Professional - Basic ($12/month)
- 1 GB RAM
- 1 vCPU
- Good for video processing

**Or:** Basic ($5/month) for testing

Click **"Next"**

### 2.5 Name Your App

**App Name:** `vib3-backend-app2`

**Region:** New York (closest to your Spaces)

Click **"Next"**

---

## Step 3: Set Environment Variables

### 3.1 Click "Environment Variables"

In the app creation wizard, look for "App-Level Environment Variables"

### 3.2 Add These Variables (one by one):

Click **"Edit"** and add each variable:

```bash
NODE_ENV=production

PORT=8080

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vib3_app2_prod
# ⬆️ Get this from MongoDB Atlas or DO Managed Database

GROK_API_KEY=<your-grok-api-key>
# ⬆️ Get from xAI console (https://console.x.ai)

AWS_ACCESS_KEY_ID=<your-spaces-access-key>
# ⬆️ From Spaces setup

AWS_SECRET_ACCESS_KEY=<your-spaces-secret-key>
# ⬆️ From Spaces setup

AWS_S3_BUCKET=vib3-app2-media

AWS_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com

AWS_REGION=nyc3

JWT_SECRET=<generate-a-random-string-here>
# ⬆️ Use a password generator for this

SESSION_SECRET=<generate-another-random-string>
# ⬆️ Different from JWT_SECRET

ALLOWED_ORIGINS=*

ENABLE_VIDEO_PROCESSING=true

ENABLE_AI_FEATURES=true

MAX_VIDEO_SIZE_MB=500
```

**Important Notes:**
- Replace `<placeholders>` with actual values
- Don't include the comments (# lines)
- Generate strong random strings for secrets

Click **"Save"**

---

## Step 4: Review and Deploy

### 4.1 Review Settings

Check everything looks correct:
- Source: GitHub/vib3/main
- Build: npm install && npm start
- Environment variables: Added
- Plan: Professional Basic ($12/mo)

### 4.2 Click "Create Resources"

DigitalOcean will now:
1. Clone your repo
2. Build your app
3. Deploy it
4. Give you a URL

**Wait 5-10 minutes for deployment...**

---

## Step 5: Get Your App URL

### 5.1 Once Deployed

You'll see: `https://vib3-backend-app2-xxxxx.ondigitalocean.app`

Copy this URL!

### 5.2 Test Backend

Open browser and go to:
```
https://your-app-url/health
```

You should see:
```json
{
  "status": "OK",
  "timestamp": "2025-10-25T..."
}
```

**✅ Backend is live!**

---

## Step 6: Update Flutter App

### 6.1 Edit App 2 .env File

Open: `C:\Users\VIBE\Desktop\VIB3\vib3_app\.env`

Update these lines:
```bash
BACKEND_URL=https://vib3-backend-app2-xxxxx.ondigitalocean.app
API_BASE_URL=https://vib3-backend-app2-xxxxx.ondigitalocean.app/api
WEBSOCKET_URL=wss://vib3-backend-app2-xxxxx.ondigitalocean.app/ws
```

**Save the file**

### 6.2 Test Flutter App

```cmd
cd C:\Users\VIBE\Desktop\VIB3\vib3_app
flutter run
```

Try uploading a video - it should now go to your DigitalOcean backend!

---

## Step 7: (Optional) Add Custom Domain

If you own `vib3app.net`:

### 7.1 In DigitalOcean App Settings

1. Click your app
2. Go to "Settings" → "Domains"
3. Click "Add Domain"
4. Enter: `vib3app.net`

### 7.2 Update DNS

At your domain registrar (GoDaddy, Namecheap, etc.):

Add these records:
```
Type: CNAME
Name: @
Value: vib3-backend-app2-xxxxx.ondigitalocean.app
```

```
Type: CNAME
Name: api
Value: vib3-backend-app2-xxxxx.ondigitalocean.app
```

Wait 10-30 minutes for DNS propagation.

Then your backend will be at: `https://vib3app.net`

---

## ✅ Deployment Complete!

Your App 2 backend is now:
- ✅ Running on DigitalOcean
- ✅ Connected to MongoDB
- ✅ Using Spaces for media storage
- ✅ Accessible via HTTPS
- ✅ Auto-deploying on Git push

---

## Troubleshooting

### Build Failed?

1. Go to app → Activity → Build Logs
2. Look for errors
3. Common issues:
   - Wrong Node version (need 18+)
   - Missing dependencies
   - Typo in package.json

### Can't Connect to MongoDB?

1. Check connection string format
2. Verify IP whitelist (add 0.0.0.0/0)
3. Test connection string locally first

### Video Upload Not Working?

1. Verify Spaces keys are correct
2. Check CORS is configured
3. Look at Runtime Logs in DO console

---

## Next Steps

1. ✅ Deploy App 2 backend (you just did this!)
2. 🔄 Update App 1 backend environment variables
3. 🔄 Test both apps thoroughly
4. 🔄 Build production APKs
5. 🔄 Submit to app stores

---

**Need help? Check the full deployment guide or ask for assistance!**
