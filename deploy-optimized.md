# VIB3 Optimized Deployment Guide for DigitalOcean

## Memory Optimizations Made

1. **Server Optimizations:**
   - Created `server-optimized.js` with memory limits
   - Added garbage collection every 30 seconds
   - Memory monitoring and automatic restart at 500MB
   - Reduced request payload limits to 1MB
   - Added request timeouts to prevent memory leaks

2. **Client Optimizations:**
   - Created `index-optimized.html` for lightweight loading
   - Created `css/minimal.css` combining all critical styles
   - Added client-side memory monitoring
   - Lazy loading with fallback to minimal version

3. **Node.js Memory Flags:**
   - `--max-old-space-size=384` (limits heap to 384MB)
   - `--gc-interval=100` (more frequent garbage collection)

## Deployment Steps

### 1. Update your GitHub repository:
```bash
git add .
git commit -m "Add memory optimizations for DigitalOcean deployment"
git push origin main
```

### 2. DigitalOcean App Platform Settings:
- **Run Command:** `npm start`
- **Build Command:** `npm install --production`
- **Instance Size:** Keep at 512MB or 1GB (not 2GB - the optimization should work with less)
- **Environment Variables:**
  - `NODE_ENV=production`
  - `NODE_OPTIONS=--max-old-space-size=384`

### 3. Alternative: Use Minimal Server:
If still having issues, change the run command to:
```
npm run start:minimal
```

## Memory Monitoring Endpoints

Once deployed, you can monitor memory usage:
- `/api/health` - Server health check
- `/api/memory` - Detailed memory usage
- The optimized HTML shows real-time memory in top-right corner

## Expected Memory Usage
- Server: 30-80MB (optimized) vs 200-500MB (original)
- Client: 20-50MB (minimal CSS) vs 100-200MB (full CSS imports)

## Troubleshooting

### If still crashing:
1. Check logs in DigitalOcean dashboard
2. Visit `/api/memory` endpoint to see actual usage
3. Use the minimal server: change package.json start script to `node server-minimal.js`
4. Reduce instance size to 512MB to force better memory management

### For MongoDB connection:
Add to your environment variables:
- `MONGODB_URI=your_connection_string`
- `MONGODB_OPTIONS={"maxPoolSize": 5, "serverSelectionTimeoutMS": 5000}`

The optimized server will automatically handle MongoDB connections with memory limits.