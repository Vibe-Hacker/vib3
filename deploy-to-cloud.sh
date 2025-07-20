#!/bin/bash

# VIB3 Cloud Deployment Script
# This script will deploy the microservices architecture to your existing DigitalOcean infrastructure

echo "🚀 VIB3 Cloud Deployment Script"
echo "================================"

# Check if we have required environment variables
if [ -z "$DO_AUTH_TOKEN" ]; then
    echo "❌ Please set DO_AUTH_TOKEN environment variable"
    echo "Get your token from: https://cloud.digitalocean.com/account/api/tokens"
    exit 1
fi

# Function to deploy to DigitalOcean App Platform
deploy_to_app_platform() {
    echo "📦 Creating App Platform specification..."
    
    cat > .do/app.yaml << 'EOF'
spec:
  name: vib3-platform
  region: nyc
  services:
  
  # API Gateway
  - name: api-gateway
    github:
      repo: Vibe-Hacker/vib3
      branch: main
      deploy_on_push: true
    source_dir: /microservices/api-gateway
    dockerfile_path: Dockerfile
    http_port: 4000
    instance_count: 2
    instance_size_slug: basic-xs
    routes:
      - path: /
    envs:
    - key: NODE_ENV
      value: production
    - key: REDIS_HOST
      value: ${redis.HOSTNAME}
    - key: REDIS_PORT
      value: ${redis.PORT}
    
  # Auth Service
  - name: auth-service
    github:
      repo: Vibe-Hacker/vib3
      branch: main
    source_dir: /microservices/auth-service
    dockerfile_path: Dockerfile
    http_port: 3001
    instance_count: 2
    instance_size_slug: basic-xs
    envs:
    - key: NODE_ENV
      value: production
    - key: MONGODB_URI
      value: ${mongodb.DATABASE_URL}
    - key: REDIS_HOST
      value: ${redis.HOSTNAME}
    - key: JWT_SECRET
      type: SECRET
      value: "your-jwt-secret-here"
    
  # Video Service
  - name: video-service
    github:
      repo: Vibe-Hacker/vib3
      branch: main
    source_dir: /microservices/video-service
    dockerfile_path: Dockerfile
    http_port: 3002
    instance_count: 3
    instance_size_slug: basic-s
    envs:
    - key: NODE_ENV
      value: production
    - key: MONGODB_URI
      value: ${mongodb.DATABASE_URL}
    - key: DO_SPACES_KEY
      type: SECRET
    - key: DO_SPACES_SECRET
      type: SECRET
    - key: DO_SPACES_BUCKET
      value: vib3-videos
    
  # Video Workers
  workers:
  - name: video-worker
    github:
      repo: Vibe-Hacker/vib3
      branch: main
    source_dir: /microservices/video-service
    dockerfile_path: Dockerfile
    run_command: npm run worker
    instance_count: 3
    instance_size_slug: basic-s
    envs:
    - key: NODE_ENV
      value: production
    - key: RABBITMQ_URL
      value: ${rabbitmq.URL}
      
  # User Service
  - name: user-service
    github:
      repo: Vibe-Hacker/vib3
      branch: main
    source_dir: /microservices/user-service
    dockerfile_path: Dockerfile
    http_port: 3003
    instance_count: 2
    instance_size_slug: basic-xs
    envs:
    - key: NODE_ENV
      value: production
    - key: MONGODB_URI
      value: ${mongodb.DATABASE_URL}
      
  # Analytics Service
  - name: analytics-service
    github:
      repo: Vibe-Hacker/vib3
      branch: main
    source_dir: /microservices/analytics-service
    dockerfile_path: Dockerfile
    http_port: 3005
    instance_count: 2
    instance_size_slug: basic-xs
    envs:
    - key: NODE_ENV
      value: production
    - key: MONGODB_URI
      value: ${mongodb.DATABASE_URL}
    - key: ELASTICSEARCH_URL
      value: ${elasticsearch.URL}
      
  # Notification Service
  - name: notification-service
    github:
      repo: Vibe-Hacker/vib3
      branch: main
    source_dir: /microservices/notification-service
    dockerfile_path: Dockerfile
    http_port: 3006
    instance_count: 2
    instance_size_slug: basic-xs
    envs:
    - key: NODE_ENV
      value: production
    - key: MONGODB_URI
      value: ${mongodb.DATABASE_URL}
      
  # Recommendation Service
  - name: recommendation-service
    github:
      repo: Vibe-Hacker/vib3
      branch: main
    source_dir: /microservices/recommendation-service
    dockerfile_path: Dockerfile
    http_port: 3004
    instance_count: 2
    instance_size_slug: basic-s
    envs:
    - key: NODE_ENV
      value: production
    - key: MONGODB_URI
      value: ${mongodb.DATABASE_URL}

  # Databases
  databases:
  - name: mongodb
    engine: MONGODB
    production: true
    cluster_name: vib3-mongo-cluster
    size: db-s-2vcpu-4gb
    
  - name: redis
    engine: REDIS
    production: true
    cluster_name: vib3-redis-cluster
    size: db-s-1vcpu-1gb
    
  - name: elasticsearch
    engine: ELASTICSEARCH
    production: true
    cluster_name: vib3-es-cluster
    size: db-s-2vcpu-4gb
EOF

    echo "✅ App specification created"
    
    # Create the app
    echo "🚀 Creating DigitalOcean App..."
    doctl apps create --spec .do/app.yaml
}

# Function to set up existing droplet
setup_existing_droplet() {
    echo "📦 Setting up services on existing droplet..."
    
    # Create setup script
    cat > setup-server.sh << 'SCRIPT'
#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Install Redis
sudo apt install -y redis-server

# Configure Redis for production
sudo sed -i 's/supervised no/supervised systemd/g' /etc/redis/redis.conf
sudo sed -i 's/# maxmemory <bytes>/maxmemory 2gb/g' /etc/redis/redis.conf
sudo sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/g' /etc/redis/redis.conf

# Install RabbitMQ
curl -fsSL https://github.com/rabbitmq/signing-keys/releases/download/2.0/rabbitmq-release-signing-key.asc | sudo apt-key add -
sudo apt install -y rabbitmq-server
sudo systemctl enable rabbitmq-server

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

# Start services
sudo systemctl start mongod
sudo systemctl start redis
sudo systemctl start rabbitmq-server
sudo systemctl start nginx

# Enable services
sudo systemctl enable mongod
sudo systemctl enable redis
sudo systemctl enable rabbitmq-server
sudo systemctl enable nginx

echo "✅ Server setup complete!"
SCRIPT

    echo "📤 Uploading setup script to server..."
    
    # Get droplet IP
    DROPLET_IP=$(doctl compute droplet list --format "Name,PublicIPv4" --no-header | grep "vib3" | awk '{print $2}')
    
    if [ -z "$DROPLET_IP" ]; then
        echo "❌ Could not find VIB3 droplet. Please provide the IP address:"
        read DROPLET_IP
    fi
    
    echo "🔗 Connecting to $DROPLET_IP..."
    
    # Copy and execute setup script
    scp setup-server.sh root@$DROPLET_IP:/tmp/
    ssh root@$DROPLET_IP "chmod +x /tmp/setup-server.sh && /tmp/setup-server.sh"
    
    # Deploy the application
    deploy_to_droplet $DROPLET_IP
}

# Function to deploy to droplet
deploy_to_droplet() {
    local DROPLET_IP=$1
    
    echo "📦 Deploying VIB3 to droplet..."
    
    # Create deployment script
    cat > deploy-vib3.sh << 'DEPLOY'
#!/bin/bash

# Clone or update repository
if [ -d "/opt/vib3" ]; then
    cd /opt/vib3
    git pull origin main
else
    cd /opt
    git clone https://github.com/Vibe-Hacker/vib3.git
    cd vib3
fi

# Create environment file
cat > .env << 'ENV'
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/vib3
REDIS_URL=redis://localhost:6379
JWT_SECRET=$(openssl rand -base64 32)
DO_SPACES_KEY=${DO_SPACES_KEY}
DO_SPACES_SECRET=${DO_SPACES_SECRET}
DO_SPACES_BUCKET=vib3-videos
CDN_URL=https://vib3-videos.nyc3.cdn.digitaloceanspaces.com
ENV

# Install dependencies for each service
for service in microservices/*; do
    if [ -d "$service" ]; then
        echo "Installing dependencies for $service..."
        cd $service
        npm install --production
        cd ../..
    fi
done

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'PM2'
module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: './microservices/api-gateway/src/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        PORT: 4000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'auth-service',
      script: './microservices/auth-service/src/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'video-service',
      script: './microservices/video-service/src/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        PORT: 3002,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'video-worker',
      script: './microservices/video-service/src/worker.js',
      instances: 3,
      exec_mode: 'cluster'
    },
    {
      name: 'user-service',
      script: './microservices/user-service/src/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        PORT: 3003,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'analytics-service',
      script: './microservices/analytics-service/src/index.js',
      instances: 1,
      env: {
        PORT: 3005,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'notification-service',
      script: './microservices/notification-service/src/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        PORT: 3006,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'recommendation-service',
      script: './microservices/recommendation-service/src/index.js',
      instances: 1,
      env: {
        PORT: 3004,
        NODE_ENV: 'production'
      }
    }
  ]
};
PM2

# Start all services with PM2
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
sudo cp infrastructure/nginx/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment complete!"
DEPLOY

    # Copy and execute deployment script
    scp deploy-vib3.sh root@$DROPLET_IP:/tmp/
    ssh root@$DROPLET_IP "chmod +x /tmp/deploy-vib3.sh && /tmp/deploy-vib3.sh"
    
    echo "✅ VIB3 deployed successfully!"
    echo "🌐 Access your application at: http://$DROPLET_IP"
}

# Function to set up CDN
setup_cdn() {
    echo "🌐 Setting up CDN with DigitalOcean Spaces..."
    
    # Create Spaces CDN configuration
    cat > setup-cdn.sh << 'CDN'
#!/bin/bash

# Enable CDN for existing Space
SPACE_NAME="vib3-videos"
REGION="nyc3"

# Check if Space exists
if doctl compute cdn list | grep -q $SPACE_NAME; then
    echo "CDN already enabled for $SPACE_NAME"
else
    echo "Enabling CDN for $SPACE_NAME..."
    doctl compute cdn create --domain $SPACE_NAME.$REGION.cdn.digitaloceanspaces.com
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

# Apply CORS configuration
s3cmd --access_key=$DO_SPACES_KEY --secret_key=$DO_SPACES_SECRET \
      --host=$REGION.digitaloceanspaces.com \
      --host-bucket="%(bucket)s.$REGION.digitaloceanspaces.com" \
      setcors cors-config.json s3://$SPACE_NAME

echo "✅ CDN configuration complete!"
CDN

    bash setup-cdn.sh
}

# Main menu
echo ""
echo "Choose deployment option:"
echo "1. Deploy to DigitalOcean App Platform (Recommended for new setup)"
echo "2. Deploy to existing DigitalOcean Droplet"
echo "3. Set up CDN only"
echo "4. Full automated deployment (App Platform + CDN)"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        deploy_to_app_platform
        ;;
    2)
        setup_existing_droplet
        ;;
    3)
        setup_cdn
        ;;
    4)
        deploy_to_app_platform
        setup_cdn
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process completed!"
echo ""
echo "Next steps:"
echo "1. Update your DNS records to point to the new services"
echo "2. Configure SSL certificates"
echo "3. Set up monitoring alerts"
echo "4. Update your Flutter app to use the new API endpoints"