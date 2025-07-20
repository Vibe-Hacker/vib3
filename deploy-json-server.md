# Deploy JSON-Only Server to Production

The current server is returning HTML which breaks the Flutter app. This new server returns ONLY JSON for ALL endpoints.

## Steps to deploy:

### 1. Copy the new server file to your production server:

First, on your local machine:
```bash
scp server-json-only.js root@138.197.89.163:/opt/vib3/
```

### 2. SSH into your server:
```bash
ssh root@138.197.89.163
```

### 3. Navigate to VIB3 directory:
```bash
cd /opt/vib3
```

### 4. Stop current server:
```bash
pm2 stop all
pm2 delete all
```

### 5. Start the JSON-only server:
```bash
pm2 start server-json-only.js --name vib3-api
pm2 save
pm2 startup
```

### 6. Test that it returns JSON:
```bash
# Test root endpoint (should return JSON)
curl http://localhost:3000/

# Test health endpoint (should return JSON)
curl http://localhost:3000/health

# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tmc363@gmail.com","password":"your-password"}'
```

### 7. Check logs:
```bash
pm2 logs vib3-api --lines 100
```

## Key differences in this server:
- Root route `/` returns JSON: `{"message":"VIB3 API Server","status":"running","version":"1.0.0"}`
- Health route `/health` returns JSON: `{"status":"ok","timestamp":"...","database":true}`
- ALL routes return JSON, no HTML anywhere
- 404 errors return JSON: `{"error":"Not found","path":"...","method":"..."}`
- Server errors return JSON: `{"error":"Internal server error","message":"..."}`

## After deployment, test from your local machine:
```bash
# Should see JSON responses:
curl https://vib3app.net/
curl https://vib3app.net/health
```

This will fix the HTML response issue that's preventing your Flutter app from working.