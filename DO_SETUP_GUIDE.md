# Digital Ocean App Platform Setup Guide

## Problem
The VIB3 mobile app cannot log in or create accounts because the production backend is missing MongoDB database configuration.

## Solution
Configure environment variables in the Digital Ocean App Platform dashboard.

## Steps to Fix

### 1. Access Digital Ocean App Platform
1. Go to https://cloud.digitalocean.com/apps
2. Sign in with your Digital Ocean account
3. Find and click on your app: **vib3-backend** or **vib3-web-75tal**

### 2. Add Environment Variables
1. Click on the **Settings** tab
2. Scroll down to find **App-Level Environment Variables** or **Component-Level Environment Variables**
3. Click **Edit** button
4. Add the following variables (get values from `.env` file in project root):

| Variable Name | Value | Source |
|--------------|-------|--------|
| `DATABASE_URL` | `mongodb+srv://vib3user:vib3123@cluster0.mongodb.net/vib3?retryWrites=true&w=majority` | From `.env` file |
| `JWT_SECRET` | `f2374c7e425b3918fb72f70d18b6272b85c02361a6c0ce5962c7371dadb44fce` | From `.env` file or generate new |
| `DO_SPACES_KEY` | `DO00RUBQWDCCVRFEWBFF` | From `.env` file |
| `DO_SPACES_SECRET` | `05J/3Y+QIh5a83Eag5rFxnp4RNhNOqfwVNUjbKNuqn8` | From `.env` file |
| `DO_SPACES_BUCKET` | `vib3-videos` | From `.env` file |
| `DO_SPACES_REGION` | `nyc3` | From `.env` file |
| `GROK_API_KEY` | (optional) | From `.env` file |

### 3. Save and Redeploy
1. Click **Save** to apply the changes
2. The app will automatically redeploy
3. Wait 3-5 minutes for deployment to complete

### 4. Verify Fix
Test the endpoints to verify they work:

```bash
# Test health endpoint (should return OK)
curl https://vib3-web-75tal.ondigitalocean.app/health

# Test signup (should create a new user)
curl -X POST https://vib3-web-75tal.ondigitalocean.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"Test123!"}'

# Test login (should return user and token)
curl -X POST https://vib3-web-75tal.ondigitalocean.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

## Alternative: Using GitHub Secrets (For Auto-Deployment)

If you want environment variables to be set automatically on deployment via GitHub:

1. **DO NOT commit secrets to the repository** (GitHub blocks this for security)
2. Instead, configure them once in the DO dashboard as shown above
3. They will persist across deployments

## Security Notes

- Never commit the `.env` file or secrets to GitHub
- The `.env` file is in `.gitignore` for security
- Environment variables in DO dashboard are encrypted at rest
- Rotate JWT_SECRET and database passwords regularly for security

## Current Status

- ✅ Flutter app config updated to use production URLs
- ✅ `app.yaml` updated with deployment instructions
- ⚠️ **ACTION REQUIRED**: Add environment variables in DO dashboard
- ⏳ Mobile app ready to test after environment variables are configured

## Testing the Mobile App

After configuring the environment variables:

1. Rebuild the Flutter app:
   ```bash
   cd vib3_app
   flutter build apk --debug
   ```

2. Install on Android device:
   ```bash
   adb install build/app/outputs/flutter-apk/app-debug.apk
   ```

3. Try creating a new account in the app
4. Verify you can log in with the created account

## Contact & Support

If you encounter issues:
1. Check DO deployment logs in the app dashboard
2. Verify MongoDB Atlas cluster is running and accessible
3. Ensure all environment variables are correctly set
4. Test endpoints using curl commands above
