# VIB3 DigitalOcean Setup Guide

This guide will help you deploy VIB3 to DigitalOcean using their App Platform, Spaces, and managed databases.

## Prerequisites

1. **DigitalOcean Account**: Sign up at https://digitalocean.com
2. **GitHub Account**: Your code needs to be in a GitHub repository
3. **Domain** (optional): For custom domain setup

## Quick Start

Run the deployment command:
```bash
vib3 deploy web digitalocean --env prod
```

## Manual Setup Steps

### 1. Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial VIB3 commit"
git remote add origin https://github.com/YOUR_USERNAME/vib3.git
git push -u origin main
```

### 2. Create DigitalOcean App

1. Go to https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Choose **"GitHub"** as source
4. Select your `vib3` repository
5. Configure the web service:
   - **Name**: `vib3-web`
   - **Source Directory**: `/` (root)
   - **Build Command**: `npm install`
   - **Run Command**: `node server.js`
   - **HTTP Port**: `3000`
   - **Environment**: `Node.js`

6. Add static site component:
   - **Name**: `vib3-frontend`
   - **Source Directory**: `/www`
   - **Build Command**: (leave empty)

### 3. Setup Spaces for Video Storage

1. Go to https://cloud.digitalocean.com/spaces
2. Click **"Create a Space"**
3. Configure:
   - **Name**: `vib3-prod-videos`
   - **Region**: Choose closest to your users
   - **CDN**: Enable
   - **File Listing**: Restricted
4. Note the endpoint URL (e.g., `nyc3.digitaloceanspaces.com`)

### 4. Create Database

1. Go to https://cloud.digitalocean.com/databases
2. Click **"Create Database"**
3. Configure:
   - **Engine**: PostgreSQL
   - **Name**: `vib3-prod-db`
   - **Plan**: Basic ($15/month)
   - **Region**: Same as your app
4. Note the connection string

### 5. Setup API Keys

1. Go to https://cloud.digitalocean.com/account/api/tokens
2. Click **"Generate New Token"**
3. Name: `VIB3 Spaces Access`
4. Scopes: Read and Write
5. Save the **Key** and **Secret**

### 6. Configure Environment Variables

In your App Platform app settings, add these environment variables:

```
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
DO_SPACES_KEY=your_spaces_key
DO_SPACES_SECRET=your_spaces_secret
DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=vib3-prod-videos
FIREBASE_API_KEY=your_firebase_key
FIREBASE_PROJECT_ID=your_firebase_project
```

### 7. Custom Domain (Optional)

1. Go to https://cloud.digitalocean.com/networking/domains
2. Add your domain
3. Update your app settings to use the custom domain
4. SSL will be automatically configured

## Cost Breakdown

| Service | Cost | Description |
|---------|------|-------------|
| App Platform | $12-25/month | Web app hosting |
| Database | $15/month | PostgreSQL managed database |
| Spaces | $5/month | 250GB storage + CDN |
| **Total** | **$32-45/month** | Full stack hosting |

## Deployment Commands

```bash
# Deploy to production
vib3 deploy web digitalocean --env prod

# Deploy to staging
vib3 deploy web digitalocean --env staging

# Check deployment status
vib3 deploy status --provider digitalocean

# Configure deployment settings
vib3 deploy config set --key do_region --value nyc3
```

## Monitoring & Scaling

- **Metrics**: Available in DO dashboard
- **Logs**: Real-time logs in App Platform
- **Scaling**: Auto-scaling based on CPU/memory
- **Alerts**: Set up email/Slack notifications

## Next Steps

1. **Setup CI/CD**: Auto-deploy on git push
2. **Add Monitoring**: Setup uptime monitoring
3. **Backup Strategy**: Database automated backups
4. **CDN Optimization**: Configure cache headers
5. **Security**: Setup firewall rules

## Troubleshooting

### App Won't Start
- Check logs in App Platform dashboard
- Verify environment variables
- Ensure `package.json` has correct start script

### Video Upload Issues
- Verify Spaces credentials
- Check CORS settings on Space
- Ensure proper permissions

### Database Connection
- Verify DATABASE_URL format
- Check IP allowlist settings
- Test connection from app logs

## Support

- **DigitalOcean Docs**: https://docs.digitalocean.com/
- **Community**: https://www.digitalocean.com/community/
- **Support**: Available through DO dashboard