#!/bin/bash

echo "🌐 VIB3 Domain Setup Script"
echo "=========================="

# Get domain name
read -p "Enter your domain name (e.g., vib3.app): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ Domain name is required!"
    exit 1
fi

echo ""
echo "Setting up domain: $DOMAIN"
echo ""

# Update Nginx configuration
echo "📝 Updating Nginx configuration..."

sudo tee /etc/nginx/sites-available/vib3 > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN api.$DOMAIN;
    client_max_body_size 512M;

    # API Gateway
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 3600s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:4000/health;
        access_log off;
    }

    # Main app
    location / {
        # First try API gateway, fallback to main app
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}

# Redirect www to non-www
server {
    listen 80;
    server_name www.$DOMAIN;
    return 301 \$scheme://$DOMAIN\$request_uri;
}

# API subdomain
server {
    listen 80;
    server_name api.$DOMAIN;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration valid"
    sudo systemctl reload nginx
else
    echo "❌ Nginx configuration error!"
    exit 1
fi

# Update environment variables
echo "🔧 Updating environment variables..."

cd /opt/vib3

# Backup current .env
cp .env .env.backup

# Update .env with domain
cat >> .env << EOF

# Domain Configuration
DOMAIN=$DOMAIN
API_URL=https://api.$DOMAIN
APP_URL=https://$DOMAIN
CDN_URL=https://cdn.$DOMAIN

# Update CORS
CORS_ORIGIN=https://$DOMAIN,https://www.$DOMAIN,http://localhost:3000
EOF

# Install Certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Get SSL certificate
echo ""
echo "🔒 Setting up SSL certificate..."
echo "This will request a certificate for:"
echo "  - $DOMAIN"
echo "  - www.$DOMAIN"
echo "  - api.$DOMAIN"
echo ""

sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN -d api.$DOMAIN

# Restart services
echo "🔄 Restarting services..."
pm2 restart all

# Create DNS info file
cat > ~/dns-setup.txt << EOF
DNS Records to Add in DigitalOcean:

Type  | Hostname | Value                                    | TTL
------|----------|------------------------------------------|------
A     | @        | $(curl -s ifconfig.me)                  | 3600
A     | www      | $(curl -s ifconfig.me)                  | 3600
A     | api      | $(curl -s ifconfig.me)                  | 3600
CNAME | cdn      | vib3-videos.nyc3.cdn.digitaloceanspaces.com. | 3600

Add these at: https://cloud.digitalocean.com/networking/domains
EOF

echo ""
echo "✅ Domain setup complete!"
echo ""
echo "📋 DNS records saved to: ~/dns-setup.txt"
echo ""
echo "Your sites will be available at:"
echo "  🌐 https://$DOMAIN"
echo "  🚀 https://api.$DOMAIN"
echo "  📦 https://cdn.$DOMAIN"
echo ""
echo "⏰ Note: DNS propagation can take up to 48 hours"
echo ""
echo "📱 Update your Flutter app with:"
echo "  API URL: https://api.$DOMAIN"
echo "  CDN URL: https://cdn.$DOMAIN"