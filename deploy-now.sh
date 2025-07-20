#!/bin/bash

echo "🚀 VIB3 Quick Deployment Script"
echo "================================"

# Get server IP
if [ -z "$1" ]; then
    echo "Please provide your server IP:"
    echo "Usage: ./deploy-now.sh YOUR_SERVER_IP"
    exit 1
fi

SERVER_IP=$1

echo "📦 Creating deployment package..."

# Create a deployment directory with only necessary files
rm -rf .deploy-package
mkdir -p .deploy-package

# Copy essential files and directories
cp -r microservices .deploy-package/
cp -r shared .deploy-package/
cp -r infrastructure .deploy-package/
cp -r config .deploy-package/
cp -r constants .deploy-package/
cp -r middleware .deploy-package/
cp -r routes .deploy-package/
cp -r server .deploy-package/
cp -r www .deploy-package/
cp package*.json .deploy-package/
cp docker-compose.yml .deploy-package/
cp .env.example .deploy-package/
cp README-ARCHITECTURE.md .deploy-package/
cp server.js .deploy-package/ 2>/dev/null || true

echo "📤 Uploading to server..."

# Create deployment script
cat > .deploy-package/install-on-server.sh << 'SCRIPT'
#!/bin/bash

echo "🔧 Installing VIB3 on server..."

# Update system
sudo apt update

# Install Node.js 18 if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install PM2 globally
sudo npm install -g pm2

# Install Redis
if ! command -v redis-server &> /dev/null; then
    sudo apt install -y redis-server
    sudo systemctl start redis
    sudo systemctl enable redis
fi

# Configure Redis for production
sudo sed -i 's/supervised no/supervised systemd/g' /etc/redis/redis.conf || true
sudo sed -i 's/# maxmemory <bytes>/maxmemory 2gb/g' /etc/redis/redis.conf || true
sudo sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/g' /etc/redis/redis.conf || true
sudo systemctl restart redis

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please edit .env file with your credentials"
fi

# Stop existing services
pm2 delete all 2>/dev/null || true

# Start services with PM2
echo "🚀 Starting services..."

# Start main server first (backwards compatibility)
if [ -f server.js ]; then
    pm2 start server.js --name vib3-main -i max
fi

# Start microservices
pm2 start microservices/api-gateway/src/index.js --name api-gateway -i 2
pm2 start microservices/auth-service/src/index.js --name auth-service -i 2
pm2 start microservices/video-service/src/index.js --name video-service -i 2
pm2 start microservices/user-service/src/index.js --name user-service -i 2
pm2 start microservices/analytics-service/src/index.js --name analytics-service
pm2 start microservices/notification-service/src/index.js --name notification-service -i 2
pm2 start microservices/recommendation-service/src/index.js --name recommendation-service

# Save PM2 configuration
pm2 save
pm2 startup

echo "✅ Installation complete!"
echo ""
echo "📊 Check service status:"
echo "pm2 status"
echo ""
echo "📝 View logs:"
echo "pm2 logs"
echo ""
echo "🔧 Edit configuration:"
echo "nano .env"
echo ""
echo "🌐 Your services are available at:"
echo "API Gateway: http://$(hostname -I | awk '{print $1}'):4000"
echo "Main App: http://$(hostname -I | awk '{print $1}'):3000"
SCRIPT

chmod +x .deploy-package/install-on-server.sh

# Upload to server
echo "🔗 Connecting to $SERVER_IP..."
ssh root@$SERVER_IP "mkdir -p /opt/vib3-new"
scp -r .deploy-package/* root@$SERVER_IP:/opt/vib3-new/

# Execute installation
echo "🚀 Running installation..."
ssh root@$SERVER_IP "cd /opt/vib3-new && bash install-on-server.sh"

# Cleanup
rm -rf .deploy-package

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access your application at:"
echo "   API Gateway: http://$SERVER_IP:4000"
echo "   Main App: http://$SERVER_IP:3000"
echo ""
echo "📊 Monitor services:"
echo "   ssh root@$SERVER_IP"
echo "   pm2 status"
echo ""
echo "⚡ Quick performance boost:"
echo "   The Redis cache is already improving performance!"
echo "   Enable CDN on your DigitalOcean Spaces for video delivery."