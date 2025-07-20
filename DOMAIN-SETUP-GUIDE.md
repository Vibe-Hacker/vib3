# 🌐 VIB3 Domain Setup Guide

## Prerequisites
- ✅ Droplet created and running
- ✅ CDN enabled on DigitalOcean Spaces
- ✅ Domain name purchased (e.g., vib3.app, yourdomain.com)

## Step 1: Point Your Domain to DigitalOcean

### If you bought domain from DigitalOcean:
1. Go to: https://cloud.digitalocean.com/networking/domains
2. It's already connected!

### If you bought domain elsewhere (GoDaddy, Namecheap, etc.):
1. Log into your domain registrar
2. Find "DNS Settings" or "Nameservers"
3. Change nameservers to:
   ```
   ns1.digitalocean.com
   ns2.digitalocean.com
   ns3.digitalocean.com
   ```
4. Save changes (takes 1-48 hours to propagate)

## Step 2: Add Domain to DigitalOcean

1. Go to: https://cloud.digitalocean.com/networking/domains
2. Click "Add Domain"
3. Enter your domain: `yourdomain.com`
4. Select your Droplet from the dropdown
5. Click "Add Domain"

## Step 3: Configure DNS Records

DigitalOcean will automatically create some records. Add/verify these:

### Essential Records:

| Type | Hostname | Value | TTL |
|------|----------|-------|-----|
| A | @ | YOUR_DROPLET_IP | 3600 |
| A | www | YOUR_DROPLET_IP | 3600 |
| A | api | YOUR_DROPLET_IP | 3600 |
| CNAME | cdn | vib3-videos.nyc3.cdn.digitaloceanspaces.com. | 3600 |

### How to add:
1. Click "Create new record"
2. Choose record type
3. Enter values
4. Click "Create"

## Step 4: Update Nginx for Your Domain

SSH into your droplet and update Nginx:

```bash
ssh root@YOUR_DROPLET_IP
```

Edit Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/vib3
```

Replace the server block with:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com api.yourdomain.com;
    client_max_body_size 512M;

    # API Gateway
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Main app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save and test:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5: Set Up SSL Certificate (HTTPS)

Install Certbot:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

Get SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

Follow prompts:
- Enter email
- Agree to terms
- Choose redirect (option 2)

## Step 6: Update Your App Configuration

### Update environment variables:
```bash
cd /opt/vib3
nano .env
```

Add/update:
```env
# Domain Configuration
DOMAIN=yourdomain.com
API_URL=https://api.yourdomain.com
APP_URL=https://yourdomain.com
CDN_URL=https://cdn.yourdomain.com

# Update CORS
CORS_ORIGIN=https://yourdomain.com,http://localhost:3000
```

Restart services:
```bash
pm2 restart all
```

### Update Flutter app:
```dart
// lib/config/api_config.dart
class ApiConfig {
  // Update these with your domain
  static const String apiGatewayUrl = 'https://api.yourdomain.com';
  static const String cdnBaseUrl = 'https://cdn.yourdomain.com';
  
  // For development, still use IP
  static const String devServerIp = 'YOUR_DROPLET_IP';
}
```

## Step 7: Configure CDN Domain (Optional)

For cleaner CDN URLs:

1. Go to DigitalOcean Spaces
2. Click on "vib3-videos"
3. Settings → Add custom subdomain
4. Enter: `cdn.yourdomain.com`
5. Add CNAME record in DNS

## Your Final URLs

After setup, you'll have:
- 🌐 Main App: `https://yourdomain.com`
- 🚀 API: `https://api.yourdomain.com`
- 📦 CDN: `https://cdn.yourdomain.com`
- 🔒 All with SSL/HTTPS!

## Testing Your Domain

1. **Test DNS propagation**:
   ```bash
   nslookup yourdomain.com
   ping yourdomain.com
   ```

2. **Test in browser**:
   - https://yourdomain.com (main app)
   - https://api.yourdomain.com/health (API health)

3. **Test SSL**:
   - https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com

## Auto-Renew SSL Certificate

Add to crontab:
```bash
sudo crontab -e
```

Add line:
```
0 0 * * 0 certbot renew --quiet
```

## Troubleshooting

### DNS not working?
- Wait up to 48 hours for propagation
- Check nameservers are correct
- Verify A records point to correct IP

### SSL certificate issues?
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

### Site not loading?
```bash
# Check services
pm2 status
sudo systemctl status nginx

# Check firewall
sudo ufw status

# Check logs
pm2 logs
sudo tail -f /var/log/nginx/error.log
```

## Mobile App Updates

Update your Flutter app to use the domain:

```dart
// lib/config/app_config.dart
class AppConfig {
  static const String productionUrl = 'https://api.yourdomain.com';
  static const String cdnUrl = 'https://cdn.yourdomain.com';
  
  // Auto-detect environment
  static String get baseUrl {
    if (kReleaseMode) {
      return productionUrl;
    }
    return 'http://localhost:4000'; // Development
  }
}
```

## Final Checklist

- [ ] Domain pointing to DigitalOcean nameservers
- [ ] A records created for @, www, api
- [ ] CNAME record for cdn
- [ ] Nginx updated with domain
- [ ] SSL certificate installed
- [ ] Environment variables updated
- [ ] Flutter app updated
- [ ] All services restarted
- [ ] Everything tested

Your VIB3 platform is now professionally deployed with a custom domain! 🎉