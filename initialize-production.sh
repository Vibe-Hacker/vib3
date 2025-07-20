#!/bin/bash

echo "🚀 VIB3 Production Initialization Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# 1. MongoDB Initialization
echo -e "\n${YELLOW}1. Initializing MongoDB...${NC}"

# Create MongoDB initialization script
cat > /tmp/mongo-init.js << 'EOF'
// Switch to vib3 database
use vib3;

// Create collections with validators
db.createCollection("users", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["email", "username", "password"],
         properties: {
            email: {
               bsonType: "string",
               pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
            },
            username: {
               bsonType: "string",
               minLength: 3,
               maxLength: 30
            }
         }
      }
   }
});

db.createCollection("videos", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["userId", "url", "title"],
         properties: {
            userId: { bsonType: "objectId" },
            title: { bsonType: "string" },
            url: { bsonType: "string" }
         }
      }
   }
});

// Create indexes for performance
print("Creating indexes...");

// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

// Video indexes
db.videos.createIndex({ userId: 1, createdAt: -1 });
db.videos.createIndex({ createdAt: -1 });
db.videos.createIndex({ likes: -1, createdAt: -1 });
db.videos.createIndex({ views: -1, createdAt: -1 });
db.videos.createIndex({ "hashtags": 1 });
db.videos.createIndex({ 
    title: "text", 
    description: "text" 
}, {
    weights: {
        title: 10,
        description: 5
    }
});

// Comments indexes
db.comments.createIndex({ videoId: 1, createdAt: -1 });
db.comments.createIndex({ userId: 1, createdAt: -1 });

// Analytics indexes
db.analytics.createIndex({ userId: 1, eventType: 1, timestamp: -1 });
db.analytics.createIndex({ videoId: 1, eventType: 1, timestamp: -1 });
db.analytics.createIndex({ timestamp: -1 });
db.analytics.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL

// Notifications indexes
db.notifications.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ userId: 1, read: 1 });
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days TTL

// Sessions indexes
db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours TTL

// Relationships indexes
db.follows.createIndex({ followerId: 1, followingId: 1 }, { unique: true });
db.follows.createIndex({ followingId: 1, createdAt: -1 });
db.follows.createIndex({ followerId: 1, createdAt: -1 });

db.blocks.createIndex({ blockerId: 1, blockedId: 1 }, { unique: true });

print("✓ MongoDB initialized successfully!");
EOF

# Run MongoDB initialization
if command -v mongo &> /dev/null; then
    mongo --eval "db.version()" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        mongo < /tmp/mongo-init.js
        check_status "MongoDB initialization"
    else
        echo -e "${YELLOW}⚠ MongoDB not accessible locally, skipping initialization${NC}"
    fi
else
    echo -e "${YELLOW}⚠ MongoDB client not installed${NC}"
fi

# 2. Redis Configuration
echo -e "\n${YELLOW}2. Configuring Redis...${NC}"

# Create Redis configuration
cat > /tmp/redis-vib3.conf << 'EOF'
# VIB3 Redis Configuration

# Network
bind 127.0.0.1
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300

# General
daemonize yes
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16

# Snapshotting
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# Memory Management
maxmemory 4gb
maxmemory-policy allkeys-lru
maxmemory-samples 5

# Append Only File
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Slow Log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Advanced Config
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
EOF

# Apply Redis configuration if Redis is installed
if command -v redis-server &> /dev/null; then
    sudo cp /tmp/redis-vib3.conf /etc/redis/redis-vib3.conf
    sudo systemctl restart redis
    check_status "Redis configuration"
else
    echo -e "${YELLOW}⚠ Redis not installed${NC}"
fi

# 3. Environment Variables Setup
echo -e "\n${YELLOW}3. Setting up environment variables...${NC}"

# Generate secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)
REFRESH_SECRET=$(openssl rand -base64 32)

# Create comprehensive .env file
cat > /opt/vib3/.env << EOF
# Environment
NODE_ENV=production
PORT=3000
API_GATEWAY_PORT=4000

# MongoDB
MONGODB_URI=mongodb+srv://vib3user:vib3123@cluster0.mongodb.net/vib3?retryWrites=true&w=majority
# For local MongoDB replica set:
# MONGODB_URI=mongodb://localhost:27017,localhost:27018,localhost:27019/vib3?replicaSet=rs0

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
ENABLE_CACHE=true
CACHE_TTL=3600

# JWT Secrets
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
REFRESH_SECRET=$REFRESH_SECRET
REFRESH_EXPIRES_IN=30d

# DigitalOcean Spaces
DO_SPACES_KEY=DO00RUBQWDCCVRFEWBFF
DO_SPACES_SECRET=05J/3Y+QIh5a83Eag5rFxnp4RNhNOqfwVNUjbKNuqn8
DO_SPACES_BUCKET=vib3-videos
DO_SPACES_REGION=nyc3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_CDN_ENDPOINT=https://vib3-videos.nyc3.cdn.digitaloceanspaces.com

# CDN Configuration
CDN_ENABLED=true
CDN_BASE_URL=https://vib3-videos.nyc3.cdn.digitaloceanspaces.com
CDN_CACHE_CONTROL=public, max-age=31536000

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
UPLOAD_RATE_LIMIT_MAX=10
AUTH_RATE_LIMIT_MAX=20

# Microservices URLs (internal)
AUTH_SERVICE_URL=http://localhost:3001
VIDEO_SERVICE_URL=http://localhost:3002
USER_SERVICE_URL=http://localhost:3003
RECOMMENDATION_SERVICE_URL=http://localhost:3004
ANALYTICS_SERVICE_URL=http://localhost:3005
NOTIFICATION_SERVICE_URL=http://localhost:3006

# Message Queue
RABBITMQ_URL=amqp://localhost
BULL_REDIS_URL=redis://localhost:6379

# Email Service (optional)
EMAIL_ENABLED=false
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password

# Push Notifications (optional)
PUSH_ENABLED=false
# FCM_SERVER_KEY=your-firebase-server-key
# EXPO_PUSH_TOKEN=your-expo-push-token

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
SENTRY_DSN=

# Security
CORS_ORIGIN=*
HELMET_ENABLED=true
COMPRESSION_ENABLED=true

# Video Processing
VIDEO_UPLOAD_SIZE_LIMIT=512MB
VIDEO_PROCESSING_CONCURRENCY=3
VIDEO_QUALITIES=360p,480p,720p,1080p
THUMBNAIL_SIZES=small:120x120,medium:320x320,large:640x640

# ML/Recommendation Settings
ML_ENABLED=true
RECOMMENDATION_UPDATE_INTERVAL=3600000
TRENDING_WINDOW_HOURS=24
TRENDING_MIN_VIEWS=100
EOF

check_status "Environment variables created"

# 4. DigitalOcean Spaces CDN Setup
echo -e "\n${YELLOW}4. Configuring DigitalOcean Spaces CDN...${NC}"

cat > /tmp/enable-cdn.sh << 'EOF'
#!/bin/bash

# This needs to be run from a machine with doctl configured
# Install doctl: https://docs.digitalocean.com/reference/doctl/how-to/install/

SPACE_NAME="vib3-videos"
REGION="nyc3"

echo "Enabling CDN for $SPACE_NAME..."

# Check if Space exists
if doctl spaces list | grep -q $SPACE_NAME; then
    echo "✓ Space exists"
    
    # Enable CDN (this is done through the DigitalOcean console)
    echo "Please enable CDN manually:"
    echo "1. Go to https://cloud.digitalocean.com/spaces"
    echo "2. Click on '$SPACE_NAME'"
    echo "3. Go to Settings tab"
    echo "4. Click 'Enable CDN'"
    echo "5. Your CDN endpoint will be: https://$SPACE_NAME.$REGION.cdn.digitaloceanspaces.com"
else
    echo "✗ Space $SPACE_NAME not found"
fi

# Configure CORS for the Space
cat > cors-config.json << 'CORS'
{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }]
}
CORS

echo "CORS configuration created in cors-config.json"
echo "Apply it using s3cmd or the DigitalOcean console"
EOF

chmod +x /tmp/enable-cdn.sh
echo -e "${GREEN}✓ CDN setup script created at /tmp/enable-cdn.sh${NC}"

# 5. Initialize Database Schema
echo -e "\n${YELLOW}5. Creating database seed data...${NC}"

cat > /tmp/seed-data.js << 'EOF'
// VIB3 Seed Data Script
use vib3;

// Create admin user
const adminUser = {
    username: "admin",
    email: "admin@vib3.app",
    password: "$2b$10$YourHashedPasswordHere", // Change this!
    role: "admin",
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
};

// Create demo users
const demoUsers = [
    {
        username: "demo_user1",
        email: "demo1@vib3.app",
        password: "$2b$10$YourHashedPasswordHere",
        bio: "Welcome to my VIB3 profile!",
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        username: "demo_user2",
        email: "demo2@vib3.app", 
        password: "$2b$10$YourHashedPasswordHere",
        bio: "Creating amazing content!",
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Insert users if they don't exist
db.users.insertOne(adminUser);
demoUsers.forEach(user => db.users.insertOne(user));

print("✓ Seed data created");
EOF

# 6. SSL Certificate Setup
echo -e "\n${YELLOW}6. SSL Certificate Setup...${NC}"

cat > /tmp/setup-ssl.sh << 'EOF'
#!/bin/bash

# Install Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
echo "To get SSL certificate, run:"
echo "sudo certbot --nginx -d your-domain.com -d www.your-domain.com"
echo ""
echo "For auto-renewal, add to crontab:"
echo "0 0 * * 0 certbot renew --quiet"
EOF

chmod +x /tmp/setup-ssl.sh

# 7. Create startup script
echo -e "\n${YELLOW}7. Creating startup script...${NC}"

cat > /opt/vib3/start-production.sh << 'EOF'
#!/bin/bash

echo "Starting VIB3 Production Services..."

# Load environment variables
source /opt/vib3/.env

# Start Redis if not running
sudo systemctl start redis

# Start MongoDB if local
if [ -f /usr/bin/mongod ]; then
    sudo systemctl start mongod
fi

# Start RabbitMQ if installed
if command -v rabbitmq-server &> /dev/null; then
    sudo systemctl start rabbitmq-server
fi

# Start microservices with PM2
cd /opt/vib3

# Delete any existing PM2 processes
pm2 delete all 2>/dev/null || true

# Start all services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup

echo "✓ All services started!"
echo ""
echo "Check status: pm2 status"
echo "View logs: pm2 logs"
echo "Monitor: pm2 monit"
EOF

chmod +x /opt/vib3/start-production.sh

# 8. Create health check script
echo -e "\n${YELLOW}8. Creating health check script...${NC}"

cat > /opt/vib3/health-check.sh << 'EOF'
#!/bin/bash

echo "🏥 VIB3 Health Check"
echo "==================="

# Check Redis
echo -n "Redis: "
redis-cli ping > /dev/null 2>&1 && echo "✓ Running" || echo "✗ Not running"

# Check MongoDB
echo -n "MongoDB: "
mongo --eval "db.version()" > /dev/null 2>&1 && echo "✓ Running" || echo "✗ Not running"

# Check API Gateway
echo -n "API Gateway: "
curl -s http://localhost:4000/health > /dev/null && echo "✓ Running" || echo "✗ Not running"

# Check microservices
services=("auth:3001" "video:3002" "user:3003" "analytics:3005" "notification:3006" "recommendation:3004")
for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    echo -n "$name service: "
    curl -s http://localhost:$port/health > /dev/null && echo "✓ Running" || echo "✗ Not running"
done

# Check PM2 processes
echo ""
echo "PM2 Processes:"
pm2 list

# Check disk space
echo ""
echo "Disk Space:"
df -h | grep -E '^/dev/'

# Check memory
echo ""
echo "Memory Usage:"
free -h
EOF

chmod +x /opt/vib3/health-check.sh

# Final summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ VIB3 Production Initialization Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Enable CDN on DigitalOcean Spaces:"
echo "   - Go to: https://cloud.digitalocean.com/spaces"
echo "   - Click on 'vib3-videos' → Settings → Enable CDN"
echo ""
echo "2. Start all services:"
echo "   cd /opt/vib3 && ./start-production.sh"
echo ""
echo "3. Set up SSL certificate:"
echo "   /tmp/setup-ssl.sh"
echo ""
echo "4. Configure DNS:"
echo "   - Point your domain to your server IP"
echo ""
echo "5. Run health check:"
echo "   /opt/vib3/health-check.sh"
echo ""
echo -e "${YELLOW}Important files created:${NC}"
echo "- /opt/vib3/.env (environment variables)"
echo "- /opt/vib3/start-production.sh (startup script)"
echo "- /opt/vib3/health-check.sh (health check)"
echo "- /tmp/enable-cdn.sh (CDN setup)"
echo "- /tmp/setup-ssl.sh (SSL setup)"
echo ""
echo -e "${GREEN}Your JWT Secret: $JWT_SECRET${NC}"
echo -e "${RED}⚠ Save this JWT secret securely!${NC}"