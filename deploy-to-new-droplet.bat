@echo off
echo ====================================
echo VIB3 NEW DROPLET DEPLOYMENT
echo ====================================
echo.
echo This script will deploy VIB3 to your new DigitalOcean Droplet
echo.

set /p DROPLET_IP="Enter your new Droplet IP address: "

if "%DROPLET_IP%"=="" (
    echo ERROR: Droplet IP is required!
    pause
    exit /b 1
)

echo.
echo Deploying to new droplet at %DROPLET_IP%...
echo.

REM Create comprehensive deployment script
(
echo #!/bin/bash
echo # VIB3 Complete Droplet Setup
echo set -e
echo.
echo echo "====================================="
echo echo "VIB3 PRODUCTION DEPLOYMENT"
echo echo "====================================="
echo echo ""
echo echo "Setting up brand new DigitalOcean Droplet..."
echo echo ""
echo.
echo # 1. Update system
echo echo "[1/10] Updating system packages..."
echo sudo apt update
echo sudo apt upgrade -y
echo.
echo # 2. Install essential packages
echo echo "[2/10] Installing essential packages..."
echo sudo apt install -y curl wget git build-essential
echo.
echo # 3. Install Node.js 18
echo echo "[3/10] Installing Node.js 18..."
echo curl -fsSL https://deb.nodesource.com/setup_18.x ^| sudo -E bash -
echo sudo apt-get install -y nodejs
echo node --version
echo npm --version
echo.
echo # 4. Install Redis
echo echo "[4/10] Installing and configuring Redis..."
echo sudo apt-get install -y redis-server
echo.
echo # Configure Redis for production
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
echo stop-writes-on-bgsave-error yes
echo rdbcompression yes
echo rdbchecksum yes
echo dbfilename dump.rdb
echo dir /var/lib/redis
echo maxmemory 1gb
echo maxmemory-policy allkeys-lru
echo appendonly yes
echo appendfilename "appendonly.aof"
echo appendfsync everysec
echo REDIS
echo.
echo sudo systemctl restart redis
echo sudo systemctl enable redis
echo redis-cli ping
echo.
echo # 5. Install PM2
echo echo "[5/10] Installing PM2..."
echo sudo npm install -g pm2
echo pm2 --version
echo.
echo # 6. Install Nginx
echo echo "[6/10] Installing and configuring Nginx..."
echo sudo apt-get install -y nginx
echo.
echo # 7. Clone VIB3 repository
echo echo "[7/10] Cloning VIB3 repository..."
echo cd /opt
echo git clone https://github.com/Vibe-Hacker/vib3.git
echo cd vib3
echo.
echo # 8. Create environment configuration
echo echo "[8/10] Creating environment configuration..."
echo JWT_SECRET=$(openssl rand -base64 32^)
echo REFRESH_SECRET=$(openssl rand -base64 32^)
echo.
echo cat ^> .env ^<^< 'ENV'
echo # Environment
echo NODE_ENV=production
echo PORT=3000
echo API_GATEWAY_PORT=4000
echo.
echo # Server Info
echo SERVER_IP=%DROPLET_IP%
echo.
echo # MongoDB Atlas
echo MONGODB_URI=mongodb+srv://vib3user:vib3123@cluster0.mongodb.net/vib3?retryWrites=true^&w=majority
echo.
echo # Redis
echo REDIS_HOST=localhost
echo REDIS_PORT=6379
echo REDIS_URL=redis://localhost:6379
echo ENABLE_CACHE=true
echo CACHE_TTL=3600
echo.
echo # JWT Secrets
echo JWT_SECRET=$JWT_SECRET
echo JWT_EXPIRES_IN=7d
echo REFRESH_SECRET=$REFRESH_SECRET
echo REFRESH_EXPIRES_IN=30d
echo.
echo # DigitalOcean Spaces
echo DO_SPACES_KEY=DO00RUBQWDCCVRFEWBFF
echo DO_SPACES_SECRET=05J/3Y+QIh5a83Eag5rFxnp4RNhNOqfwVNUjbKNuqn8
echo DO_SPACES_BUCKET=vib3-videos
echo DO_SPACES_REGION=nyc3
echo DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
echo CDN_URL=https://vib3-videos.nyc3.cdn.digitaloceanspaces.com
echo.
echo # Rate Limiting
echo RATE_LIMIT_WINDOW_MS=60000
echo RATE_LIMIT_MAX_REQUESTS=100
echo UPLOAD_RATE_LIMIT_MAX=10
echo AUTH_RATE_LIMIT_MAX=20
echo.
echo # Microservices URLs
echo AUTH_SERVICE_URL=http://localhost:3001
echo VIDEO_SERVICE_URL=http://localhost:3002
echo USER_SERVICE_URL=http://localhost:3003
echo RECOMMENDATION_SERVICE_URL=http://localhost:3004
echo ANALYTICS_SERVICE_URL=http://localhost:3005
echo NOTIFICATION_SERVICE_URL=http://localhost:3006
echo ENV
echo.
echo echo "JWT_SECRET: $JWT_SECRET" ^> /opt/vib3/jwt-secret.txt
echo echo "REFRESH_SECRET: $REFRESH_SECRET" ^>^> /opt/vib3/jwt-secret.txt
echo chmod 600 /opt/vib3/jwt-secret.txt
echo.
echo # 9. Install dependencies
echo echo "[9/10] Installing dependencies..."
echo npm install --production
echo.
echo # Install dependencies for each microservice
echo for service in microservices/*/; do
echo     if [ -d "$service" ]; then
echo         echo "Installing dependencies for $service..."
echo         (cd "$service" ^&^& npm install --production^)
echo     fi
echo done
echo.
echo # 10. Configure Nginx
echo echo "[10/10] Configuring Nginx..."
echo sudo tee /etc/nginx/sites-available/vib3 ^> /dev/null ^<^< 'NGINX'
echo server {
echo     listen 80;
echo     server_name %DROPLET_IP%;
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
echo         proxy_read_timeout 300s;
echo         proxy_connect_timeout 300s;
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
echo         proxy_read_timeout 3600s;
echo     }
echo.
echo     # Health check endpoint
echo     location /health {
echo         proxy_pass http://localhost:4000/health;
echo         access_log off;
echo     }
echo.
echo     # Main app (if running monolith)
echo     location / {
echo         proxy_pass http://localhost:3000;
echo         proxy_http_version 1.1;
echo         proxy_set_header Upgrade \$http_upgrade;
echo         proxy_set_header Connection 'upgrade';
echo         proxy_set_header Host \$host;
echo         proxy_cache_bypass \$http_upgrade;
echo     }
echo }
echo NGINX
echo.
echo sudo ln -sf /etc/nginx/sites-available/vib3 /etc/nginx/sites-enabled/
echo sudo rm -f /etc/nginx/sites-enabled/default
echo sudo nginx -t
echo sudo systemctl restart nginx
echo sudo systemctl enable nginx
echo.
echo # Configure firewall
echo echo "Configuring firewall..."
echo sudo ufw allow 22/tcp
echo sudo ufw allow 80/tcp
echo sudo ufw allow 443/tcp
echo sudo ufw allow 3000/tcp
echo sudo ufw allow 4000/tcp
echo sudo ufw --force enable
echo.
echo # Start all services
echo echo "Starting VIB3 services..."
echo cd /opt/vib3
echo.
echo # Create PM2 ecosystem file
echo cat ^> ecosystem.config.js ^<^< 'PM2'
echo module.exports = {
echo   apps: [
echo     {
echo       name: 'api-gateway',
echo       script: './microservices/api-gateway/src/index.js',
echo       instances: 2,
echo       exec_mode: 'cluster',
echo       env: {
echo         PORT: 4000,
echo         NODE_ENV: 'production'
echo       },
echo       error_file: 'logs/api-gateway-error.log',
echo       out_file: 'logs/api-gateway-out.log'
echo     },
echo     {
echo       name: 'auth-service',
echo       script: './microservices/auth-service/src/index.js',
echo       instances: 2,
echo       exec_mode: 'cluster',
echo       env: {
echo         PORT: 3001,
echo         NODE_ENV: 'production'
echo       }
echo     },
echo     {
echo       name: 'video-service',
echo       script: './microservices/video-service/src/index.js',
echo       instances: 2,
echo       exec_mode: 'cluster',
echo       env: {
echo         PORT: 3002,
echo         NODE_ENV: 'production'
echo       }
echo     },
echo     {
echo       name: 'user-service',
echo       script: './microservices/user-service/src/index.js',
echo       instances: 2,
echo       exec_mode: 'cluster',
echo       env: {
echo         PORT: 3003,
echo         NODE_ENV: 'production'
echo       }
echo     },
echo     {
echo       name: 'analytics-service',
echo       script: './microservices/analytics-service/src/index.js',
echo       instances: 1,
echo       env: {
echo         PORT: 3005,
echo         NODE_ENV: 'production'
echo       }
echo     },
echo     {
echo       name: 'notification-service',
echo       script: './microservices/notification-service/src/index.js',
echo       instances: 1,
echo       env: {
echo         PORT: 3006,
echo         NODE_ENV: 'production'
echo       }
echo     },
echo     {
echo       name: 'recommendation-service',
echo       script: './microservices/recommendation-service/src/index.js',
echo       instances: 1,
echo       env: {
echo         PORT: 3004,
echo         NODE_ENV: 'production'
echo       }
echo     }
echo   ]
echo };
echo PM2
echo.
echo # Start with PM2
echo pm2 start ecosystem.config.js
echo pm2 save
echo pm2 startup systemd -u root --hp /root
echo.
echo # Create health check script
echo cat ^> /opt/vib3/check-health.sh ^<^< 'HEALTH'
echo #!/bin/bash
echo echo "VIB3 Health Check"
echo echo "================="
echo echo ""
echo echo "Services Status:"
echo pm2 list
echo echo ""
echo echo "API Gateway Health:"
echo curl -s http://localhost:4000/health ^|^| echo "Not responding"
echo echo ""
echo echo "Redis Status:"
echo redis-cli ping
echo echo ""
echo echo "Nginx Status:"
echo systemctl is-active nginx
echo echo ""
echo echo "Memory Usage:"
echo free -h
echo echo ""
echo echo "Disk Usage:"
echo df -h /
echo HEALTH
echo chmod +x /opt/vib3/check-health.sh
echo.
echo # Run health check
echo echo ""
echo echo "====================================="
echo echo "DEPLOYMENT COMPLETE!"
echo echo "====================================="
echo echo ""
echo /opt/vib3/check-health.sh
echo echo ""
echo echo "Your VIB3 platform is now live at:"
echo echo "http://%DROPLET_IP%"
echo echo ""
echo echo "API Gateway:"
echo echo "http://%DROPLET_IP%:4000"
echo echo ""
echo echo "To monitor services:"
echo echo "pm2 monit"
echo echo ""
echo echo "To view logs:"
echo echo "pm2 logs"
echo echo ""
echo echo "Your JWT secrets are saved in:"
echo echo "/opt/vib3/jwt-secret.txt"
echo echo ""
echo cat /opt/vib3/jwt-secret.txt
) > deploy-script.sh

echo.
echo Uploading deployment script to droplet...
echo.

REM Upload and execute
scp deploy-script.sh root@%DROPLET_IP%:/tmp/ 2>nul
if errorlevel 1 (
    echo.
    echo If this is your first connection, you may see a fingerprint warning.
    echo Type 'yes' to continue when prompted.
    echo.
    scp deploy-script.sh root@%DROPLET_IP%:/tmp/
)

echo.
echo Executing deployment script...
echo This will take 5-10 minutes to complete...
echo.

ssh root@%DROPLET_IP% "chmod +x /tmp/deploy-script.sh && /tmp/deploy-script.sh"

REM Cleanup
del deploy-script.sh

echo.
echo ====================================
echo DEPLOYMENT COMPLETE!
echo ====================================
echo.
echo Your VIB3 microservices are now running on:
echo.
echo Main URL: http://%DROPLET_IP%
echo API Gateway: http://%DROPLET_IP%:4000
echo.
echo Next steps:
echo.
echo 1. Update your Flutter app:
echo    - Go to Settings - Server Settings
echo    - Enter IP: %DROPLET_IP%
echo    - Enable "Use Microservices"
echo    - Test connection
echo.
echo 2. Enable CDN on DigitalOcean Spaces:
echo    - Go to: https://cloud.digitalocean.com/spaces
echo    - Click on 'vib3-videos'
echo    - Settings - Enable CDN
echo.
echo 3. Test your endpoints:
echo    - Health: http://%DROPLET_IP%:4000/health
echo    - API: http://%DROPLET_IP%:4000/api
echo.
echo 4. Monitor performance:
echo    ssh root@%DROPLET_IP% "pm2 monit"
echo.
pause