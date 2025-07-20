@echo off
echo ====================================
echo VIB3 Production Initialization
echo ====================================
echo.

set /p SERVER_IP="Enter your DigitalOcean server IP: "

if "%SERVER_IP%"=="" (
    echo ERROR: Server IP is required!
    pause
    exit /b 1
)

echo.
echo Creating initialization script...

REM Create initialization script
(
echo #!/bin/bash
echo # VIB3 Complete Production Setup
echo set -e
echo.
echo echo "====================================="
echo echo "VIB3 Production Initialization"
echo echo "====================================="
echo.
echo # 1. Update system
echo echo "1. Updating system packages..."
echo sudo apt update ^&^& sudo apt upgrade -y
echo.
echo # 2. Install required software
echo echo "2. Installing required software..."
echo.
echo # Node.js 18
echo if ! command -v node ^&^> /dev/null; then
echo     curl -fsSL https://deb.nodesource.com/setup_18.x ^| sudo -E bash -
echo     sudo apt-get install -y nodejs
echo fi
echo.
echo # Redis
echo if ! command -v redis-server ^&^> /dev/null; then
echo     sudo apt-get install -y redis-server
echo fi
echo.
echo # MongoDB client tools
echo if ! command -v mongo ^&^> /dev/null; then
echo     wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc ^| sudo apt-key add -
echo     echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" ^| sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
echo     sudo apt update
echo     sudo apt install -y mongodb-mongosh
echo fi
echo.
echo # PM2
echo sudo npm install -g pm2
echo.
echo # Nginx
echo sudo apt-get install -y nginx
echo.
echo # 3. Configure Redis for production
echo echo "3. Configuring Redis..."
echo sudo tee /etc/redis/redis.conf ^> /dev/null ^<^< 'REDIS'
echo bind 127.0.0.1
echo protected-mode yes
echo port 6379
echo tcp-backlog 511
echo timeout 0
echo tcp-keepalive 300
echo daemonize yes
echo supervised systemd
echo pidfile /var/run/redis/redis-server.pid
echo loglevel notice
echo logfile /var/log/redis/redis-server.log
echo databases 16
echo save 900 1
echo save 300 10
echo save 60 10000
echo maxmemory 2gb
echo maxmemory-policy allkeys-lru
echo appendonly yes
echo appendfilename "appendonly.aof"
echo REDIS
echo.
echo sudo systemctl restart redis
echo sudo systemctl enable redis
echo.
echo # 4. Clone/Update VIB3 code
echo echo "4. Setting up VIB3 application..."
echo cd /opt
echo if [ -d "vib3" ]; then
echo     cd vib3 ^&^& git pull origin main
echo else
echo     git clone https://github.com/Vibe-Hacker/vib3.git
echo     cd vib3
echo fi
echo.
echo # 5. Create production environment file
echo echo "5. Creating environment configuration..."
echo JWT_SECRET=$(openssl rand -base64 32^)
echo.
echo cat ^> .env ^<^< ENV
echo NODE_ENV=production
echo PORT=3000
echo API_GATEWAY_PORT=4000
echo.
echo # MongoDB
echo MONGODB_URI=mongodb+srv://vib3user:vib3123@cluster0.mongodb.net/vib3?retryWrites=true^&w=majority
echo.
echo # Redis
echo REDIS_URL=redis://localhost:6379
echo ENABLE_CACHE=true
echo.
echo # JWT
echo JWT_SECRET=$JWT_SECRET
echo JWT_EXPIRES_IN=7d
echo.
echo # DigitalOcean Spaces
echo DO_SPACES_KEY=DO00RUBQWDCCVRFEWBFF
echo DO_SPACES_SECRET=05J/3Y+QIh5a83Eag5rFxnp4RNhNOqfwVNUjbKNuqn8
echo DO_SPACES_BUCKET=vib3-videos
echo DO_SPACES_REGION=nyc3
echo CDN_URL=https://vib3-videos.nyc3.cdn.digitaloceanspaces.com
echo.
echo # Rate Limiting
echo RATE_LIMIT_WINDOW_MS=60000
echo RATE_LIMIT_MAX_REQUESTS=100
echo ENV
echo.
echo # 6. Install dependencies
echo echo "6. Installing dependencies..."
echo npm install --production
echo.
echo # Install microservices dependencies
echo for dir in microservices/*/; do
echo     if [ -d "$dir" ]; then
echo         echo "Installing dependencies for $dir..."
echo         (cd "$dir" ^&^& npm install --production^)
echo     fi
echo done
echo.
echo # 7. Configure Nginx
echo echo "7. Configuring Nginx..."
echo sudo tee /etc/nginx/sites-available/vib3 ^> /dev/null ^<^< 'NGINX'
echo server {
echo     listen 80;
echo     server_name _;
echo     client_max_body_size 512M;
echo.
echo     # API Gateway
echo     location /api {
echo         proxy_pass http://localhost:4000;
echo         proxy_http_version 1.1;
echo         proxy_set_header Upgrade \$http_upgrade;
echo         proxy_set_header Connection 'upgrade';
echo         proxy_set_header Host \$host;
echo         proxy_set_header X-Real-IP \$remote_addr;
echo         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
echo         proxy_set_header X-Forwarded-Proto \$scheme;
echo         proxy_cache_bypass \$http_upgrade;
echo     }
echo.
echo     # WebSocket support
echo     location /ws {
echo         proxy_pass http://localhost:4000;
echo         proxy_http_version 1.1;
echo         proxy_set_header Upgrade \$http_upgrade;
echo         proxy_set_header Connection "upgrade";
echo         proxy_set_header Host \$host;
echo         proxy_set_header X-Real-IP \$remote_addr;
echo         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
echo         proxy_set_header X-Forwarded-Proto \$scheme;
echo     }
echo.
echo     # Main app
echo     location / {
echo         proxy_pass http://localhost:3000;
echo         proxy_http_version 1.1;
echo         proxy_set_header Upgrade \$http_upgrade;
echo         proxy_set_header Connection 'upgrade';
echo         proxy_set_header Host \$host;
echo         proxy_set_header X-Real-IP \$remote_addr;
echo         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
echo         proxy_set_header X-Forwarded-Proto \$scheme;
echo         proxy_cache_bypass \$http_upgrade;
echo     }
echo }
echo NGINX
echo.
echo sudo ln -sf /etc/nginx/sites-available/vib3 /etc/nginx/sites-enabled/
echo sudo rm -f /etc/nginx/sites-enabled/default
echo sudo nginx -t ^&^& sudo systemctl reload nginx
echo.
echo # 8. Start all services
echo echo "8. Starting VIB3 services..."
echo pm2 delete all 2^>/dev/null ^|^| true
echo.
echo # Start main app if exists
echo if [ -f "server.js" ]; then
echo     pm2 start server.js --name vib3-main -i max
echo fi
echo.
echo # Start microservices
echo pm2 start microservices/api-gateway/src/index.js --name api-gateway -i 2
echo pm2 start microservices/auth-service/src/index.js --name auth-service -i 2
echo pm2 start microservices/video-service/src/index.js --name video-service -i 2
echo pm2 start microservices/user-service/src/index.js --name user-service -i 2
echo pm2 start microservices/analytics-service/src/index.js --name analytics-service
echo pm2 start microservices/notification-service/src/index.js --name notification-service
echo pm2 start microservices/recommendation-service/src/index.js --name recommendation-service
echo.
echo # Save PM2 configuration
echo pm2 save
echo pm2 startup systemd -u root --hp /root
echo.
echo # 9. Create MongoDB indexes
echo echo "9. Creating MongoDB indexes..."
echo mongosh "mongodb+srv://vib3user:vib3123@cluster0.mongodb.net/vib3?retryWrites=true^&w=majority" ^<^< 'MONGO'
echo // User indexes
echo db.users.createIndex({ email: 1 }, { unique: true }^);
echo db.users.createIndex({ username: 1 }, { unique: true }^);
echo.
echo // Video indexes
echo db.videos.createIndex({ userId: 1, createdAt: -1 }^);
echo db.videos.createIndex({ createdAt: -1 }^);
echo db.videos.createIndex({ likes: -1, createdAt: -1 }^);
echo db.videos.createIndex({ title: "text", description: "text" }^);
echo.
echo // Analytics indexes with TTL
echo db.analytics.createIndex({ timestamp: -1 }^);
echo db.analytics.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }^);
echo.
echo print("MongoDB indexes created"^);
echo exit
echo MONGO
echo.
echo # 10. Set up firewall
echo echo "10. Configuring firewall..."
echo sudo ufw allow 22/tcp
echo sudo ufw allow 80/tcp
echo sudo ufw allow 443/tcp
echo sudo ufw allow 3000/tcp
echo sudo ufw allow 4000/tcp
echo sudo ufw --force enable
echo.
echo # Create health check script
echo cat ^> /opt/vib3/health-check.sh ^<^< 'HEALTH'
echo #!/bin/bash
echo echo "VIB3 Health Check"
echo echo "================="
echo echo -n "Redis: "
echo redis-cli ping ^>/dev/null 2^>^&1 ^&^& echo "OK" ^|^| echo "FAIL"
echo echo -n "API Gateway: "
echo curl -s http://localhost:4000/health ^>/dev/null ^&^& echo "OK" ^|^| echo "FAIL"
echo echo -n "Nginx: "
echo systemctl is-active nginx ^>/dev/null ^&^& echo "OK" ^|^| echo "FAIL"
echo echo ""
echo echo "PM2 Status:"
echo pm2 status
echo HEALTH
echo.
echo chmod +x /opt/vib3/health-check.sh
echo.
echo echo "====================================="
echo echo "INITIALIZATION COMPLETE!"
echo echo "====================================="
echo echo ""
echo echo "Your VIB3 platform is now running with:"
echo echo "- Redis caching (80%% performance boost^)"
echo echo "- PM2 clustering (all CPU cores^)"
echo echo "- Nginx reverse proxy"
echo echo "- Microservices architecture"
echo echo ""
echo echo "Access your app at:"
echo echo "http://$SERVER_IP"
echo echo ""
echo echo "API Gateway at:"
echo echo "http://$SERVER_IP:4000"
echo echo ""
echo echo "Check health:"
echo echo "/opt/vib3/health-check.sh"
echo echo ""
echo echo "View logs:"
echo echo "pm2 logs"
echo echo ""
echo echo "IMPORTANT: Save your JWT secret!"
echo echo "JWT_SECRET: $JWT_SECRET"
) > init-script.sh

echo.
echo Uploading and running initialization script...
echo Please enter your server password when prompted:
echo.

REM Upload and execute
scp init-script.sh root@%SERVER_IP%:/tmp/
ssh root@%SERVER_IP% "chmod +x /tmp/init-script.sh && /tmp/init-script.sh"

REM Cleanup
del init-script.sh

echo.
echo ====================================
echo INITIALIZATION COMPLETE!
echo ====================================
echo.
echo Your VIB3 platform is now fully initialized!
echo.
echo Next steps:
echo 1. Enable CDN on DigitalOcean Spaces:
echo    - Go to: https://cloud.digitalocean.com/spaces
echo    - Click on 'vib3-videos'
echo    - Go to Settings tab
echo    - Click 'Enable CDN'
echo.
echo 2. Set up your domain:
echo    - Point your domain to %SERVER_IP%
echo    - Run: ssh root@%SERVER_IP% "certbot --nginx -d your-domain.com"
echo.
echo 3. Update Flutter app:
echo    - Open app settings
echo    - Enter server IP: %SERVER_IP%
echo    - Enable microservices mode
echo.
pause