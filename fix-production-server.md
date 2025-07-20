# Fix Production Server Auth

The production server is running the wrong server file. Follow these steps to fix it:

## 1. SSH into your server:
```bash
ssh root@138.197.89.163
```

## 2. Navigate to the VIB3 directory:
```bash
cd /opt/vib3
```

## 3. Check which server is running:
```bash
pm2 list
```

## 4. Stop the current server:
```bash
pm2 stop all
```

## 5. Start the correct server with auth routes:
```bash
pm2 start server.js --name vib3-production
pm2 save
```

## 6. Check the logs to ensure it's running:
```bash
pm2 logs vib3-production --lines 50
```

## 7. Test the login endpoint:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tmc363@gmail.com","password":"[your-password]"}'
```

## Important Notes:
- The server.js file already has the correct auth routes (lines 2169-2227 for register, 2230-2285 for login)
- It uses SHA256 hashing for passwords (not bcrypt)
- Make sure MongoDB connection string is correct in the environment

## If server.js has missing dependencies:
Run these commands to install them:
```bash
npm install express mongodb cors multer jsonwebtoken
```

Then restart with PM2.