# VIB3 Oracle Cloud Quick Start Guide

## 🚀 Quick Setup Steps

### 1. Create Oracle Cloud VM
- Go to [Oracle Cloud Console](https://cloud.oracle.com)
- Create Ubuntu 22.04 instance (VM.Standard.E2.1.Micro for free tier)
- Add your SSH public key during creation

### 2. Configure Network Security
In your VCN Security List, add ingress rules for:
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 3000 (Node.js)

### 3. Connect to Your Instance
```bash
ssh -i ~/.ssh/your-key ubuntu@<instance-ip>
```

### 4. Quick Install
```bash
# Download and run setup script
curl -O https://raw.githubusercontent.com/yourusername/vib3/main/setup-oracle.sh
chmod +x setup-oracle.sh
./setup-oracle.sh
```

### 5. Configure Firebase
Edit the environment file with your Firebase credentials:
```bash
nano /var/www/vib3/.env
```

Add your Firebase config from Firebase Console > Project Settings.

### 6. Setup Nginx
```bash
# Copy nginx config
sudo cp /var/www/vib3/nginx.conf /etc/nginx/sites-available/vib3

# Update server_name in the config
sudo nano /etc/nginx/sites-available/vib3
# Replace your-domain.com with your domain or instance IP

# Enable site
sudo ln -s /etc/nginx/sites-available/vib3 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Start VIB3
```bash
cd /var/www/vib3
pm2 start pm2.config.js
pm2 save
```

### 8. Access Your App
Visit: `http://<your-instance-ip>`

## 📝 Important Commands

**Check app status:**
```bash
pm2 status
```

**View logs:**
```bash
pm2 logs vib3
```

**Restart app:**
```bash
pm2 restart vib3
```

**Update app:**
```bash
cd /var/www/vib3
git pull
npm install
pm2 restart vib3
```

## 🔒 SSL Setup (Optional)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🆘 Troubleshooting

**Can't access the app?**
- Check Oracle Cloud security rules
- Verify Nginx is running: `sudo systemctl status nginx`
- Check app is running: `pm2 status`

**502 Bad Gateway?**
- App might not be running: `pm2 start vib3`
- Check logs: `pm2 logs vib3`

**Need help?**
- Check full guide: `oracle-cloud-setup.md`
- View server logs: `sudo journalctl -xe`