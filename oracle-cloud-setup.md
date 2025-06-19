# VIB3 Oracle Cloud Deployment Guide

## Prerequisites
- Oracle Cloud account with active tenancy
- SSH key pair for VM access
- Domain name (optional, for custom domain)

## Step 1: Create Oracle Cloud VM Instance

1. Log into Oracle Cloud Console
2. Navigate to Compute > Instances
3. Click "Create Instance"
4. Configure:
   - Name: `vib3-server`
   - Image: Ubuntu 22.04 LTS
   - Shape: VM.Standard.E2.1.Micro (Always Free eligible)
   - Networking: Create new VCN or use existing
   - Add SSH key: Upload your public key
5. Click "Create"

## Step 2: Configure Security Rules

1. Go to Networking > Virtual Cloud Networks
2. Select your VCN > Security Lists
3. Add Ingress Rules:
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 3000 (Node.js app)
   - Port 22 (SSH) - should already exist

## Step 3: Connect to Your Instance

```bash
ssh -i /path/to/your/private-key ubuntu@<your-instance-public-ip>
```

## Step 4: Run Setup Script

Once connected, run:

```bash
# Download and run setup script
wget https://raw.githubusercontent.com/yourusername/vib3/main/setup-oracle.sh
chmod +x setup-oracle.sh
./setup-oracle.sh
```

Or manually:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Clone your repository
cd /home/ubuntu
git clone https://github.com/yourusername/vib3.git
cd vib3

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
nano .env  # Edit with your Firebase credentials
```

## Step 5: Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/vib3
```

Add the configuration from `nginx.conf` file.

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/vib3 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 6: Start Application with PM2

```bash
cd /home/ubuntu/vib3
pm2 start server.js --name vib3
pm2 save
pm2 startup
```

## Step 7: Configure Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Step 8: SSL Certificate (Optional)

For HTTPS with Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Updating the Application

To update VIB3 after making changes:

```bash
cd /home/ubuntu/vib3
git pull
npm install
pm2 restart vib3
```

## Monitoring

View logs:
```bash
pm2 logs vib3
```

Check status:
```bash
pm2 status
```

## Troubleshooting

1. **Can't connect to instance**: Check security rules and SSH key
2. **502 Bad Gateway**: Check if Node.js app is running with `pm2 status`
3. **Permission denied**: Use `sudo` for system commands
4. **App crashes**: Check logs with `pm2 logs vib3`