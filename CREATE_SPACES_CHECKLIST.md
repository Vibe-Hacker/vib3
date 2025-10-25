# DigitalOcean Spaces Setup - Interactive Checklist

## 🎯 Goal: Create both Spaces buckets for media storage

Follow these steps **exactly** - I'll walk you through each one!

---

## Step 1: Open DigitalOcean Spaces

**Action:** Click this link (or copy to browser):
```
https://cloud.digitalocean.com/spaces
```

✅ Check when done: [ ]

---

## Step 2: Create Space for App 1

**Action:** Click the **"Create Space"** button

Fill in these details:
```
Datacenter Region:    New York (NYC3)
Enable CDN:           ✅ YES (check the box)
Space Name:           vib3-app1-media
File Listing:         Restrict File Listing (Private)
```

**Click "Create Space"**

✅ Check when done: [ ]

---

## Step 3: Create Space for App 2

**Action:** Click **"Create Space"** again

Fill in these details:
```
Datacenter Region:    New York (NYC3)
Enable CDN:           ✅ YES (check the box)
Space Name:           vib3-app2-media
File Listing:         Restrict File Listing (Private)
```

**Click "Create Space"**

✅ Check when done: [ ]

---

## Step 4: Configure CORS for App 1

**Action:**
1. Click on **vib3-app1-media** space
2. Click **"Settings"** tab
3. Scroll to **"CORS Configurations"**
4. Click **"Add"** or **"Edit"**

**Paste this configuration:**
```json
[{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3000
}]
```

**Click "Save"**

✅ Check when done: [ ]

---

## Step 5: Configure CORS for App 2

**Action:**
1. Go back to Spaces list
2. Click on **vib3-app2-media** space
3. Click **"Settings"** tab
4. Scroll to **"CORS Configurations"**
5. Click **"Add"** or **"Edit"**

**Paste the SAME configuration:**
```json
[{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3000
}]
```

**Click "Save"**

✅ Check when done: [ ]

---

## Step 6: Generate API Keys

**Action:** Click this link:
```
https://cloud.digitalocean.com/account/api/tokens
```

1. Click the **"Spaces Keys"** tab
2. Click **"Generate New Key"**
3. Enter name: `vib3-apps-backend`
4. Click **"Generate Key"**

**⚠️ IMPORTANT:** Copy these values RIGHT NOW (you only see them once!):

```
Access Key ID:     _____________________
Secret Access Key: _____________________
```

**Save them in a text file immediately!**

✅ Check when done: [ ]

---

## Step 7: Note Your CDN URLs

Your CDN URLs are automatically created:

**App 1:**
```
https://vib3-app1-media.nyc3.cdn.digitaloceanspaces.com
```

**App 2:**
```
https://vib3-app2-media.nyc3.cdn.digitaloceanspaces.com
```

✅ Check when done: [ ]

---

## ✅ You're Done with Spaces Setup!

Now you need to add these keys to your backends:

### For App 1 Backend:
Go to: https://cloud.digitalocean.com/apps → vib3-backend-u8zjk → Settings → Environment Variables

Add:
```
DO_SPACES_KEY=<your-access-key-from-step-6>
DO_SPACES_SECRET=<your-secret-key-from-step-6>
DO_SPACES_BUCKET=vib3-app1-media
DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
```

### For App 2 Backend (after you deploy it):
Add to environment variables:
```
AWS_ACCESS_KEY_ID=<your-access-key-from-step-6>
AWS_SECRET_ACCESS_KEY=<your-secret-key-from-step-6>
AWS_S3_BUCKET=vib3-app2-media
AWS_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
AWS_REGION=nyc3
```

---

## 🎉 Spaces Setup Complete!

Total time: ~10 minutes
Cost: $5/month per space ($10/month total)

Next step: Set up MongoDB databases!
