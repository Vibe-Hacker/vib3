#!/bin/bash

# VIB3 Oracle Cloud Setup Script
# Run this on your Oracle Cloud Ubuntu instance

echo "==================================="
echo "VIB3 Oracle Cloud Setup Script"
echo "==================================="

# Update system packages
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
echo "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node installation
echo "Node.js version:"
node --version
echo "npm version:"
npm --version

# Install PM2 for process management
echo "Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "Installing Nginx..."
sudo apt install -y nginx

# Install Git
echo "Installing Git..."
sudo apt install -y git

# Create app directory
echo "Creating application directory..."
sudo mkdir -p /var/www/vib3
sudo chown -R $USER:$USER /var/www/vib3

# Clone repository (you'll need to update this with your repo URL)
echo "Please enter your VIB3 repository URL:"
read REPO_URL

if [ ! -z "$REPO_URL" ]; then
    cd /var/www
    git clone $REPO_URL vib3
    cd vib3
    
    # Install dependencies
    echo "Installing Node.js dependencies..."
    npm install
    
    # Create environment file
    echo "Creating environment configuration file..."
    if [ ! -f .env ]; then
        cp .env.example .env 2>/dev/null || touch .env
        echo "Please edit /var/www/vib3/.env with your Firebase credentials"
    fi
else
    echo "No repository URL provided. Please manually clone your repository to /var/www/vib3"
fi

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
echo "y" | sudo ufw enable

# Create systemd service for PM2
echo "Setting up PM2 startup..."
pm2 startup systemd -u $USER --hp /home/$USER
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

echo "==================================="
echo "Setup Complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Edit /var/www/vib3/.env with your Firebase credentials"
echo "2. Configure Nginx using the provided nginx.conf"
echo "3. Start the application with: cd /var/www/vib3 && pm2 start server.js --name vib3"
echo "4. Save PM2 config with: pm2 save"
echo ""
echo "For SSL setup, run:"
echo "sudo apt install certbot python3-certbot-nginx"
echo "sudo certbot --nginx -d yourdomain.com"