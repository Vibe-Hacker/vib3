const https = require('https');

console.log('Checking VIB3 server status and version...\n');

// Check health endpoint
https.get('https://vib3-web-75tal.ondigitalocean.app/api/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const health = JSON.parse(data);
        console.log('✅ Server Status:', health.status);
        console.log('📦 Version:', health.version);
        console.log('⏰ Uptime:', Math.floor(health.uptime / 3600), 'hours');
        console.log('💾 Memory:', health.memory);
        console.log('🗄️  Database:', health.database);
        
        // Check if thumbnail endpoint exists
        console.log('\nChecking for thumbnail endpoint...');
        https.get('https://vib3-web-75tal.ondigitalocean.app/api/admin/process-thumbnails', (res) => {
            if (res.statusCode === 401) {
                console.log('✅ Thumbnail endpoint exists! (requires auth)');
                console.log('\n🎉 Your server has the latest code!');
            } else if (res.statusCode === 404) {
                console.log('❌ Thumbnail endpoint not found');
                console.log('\n⚠️  Server needs to be updated. Options:');
                console.log('1. Wait for auto-deployment from GitHub (check DigitalOcean dashboard)');
                console.log('2. Manually trigger deployment in DigitalOcean App Platform');
                console.log('3. SSH into server and run: git pull && npm install && pm2 restart all');
            }
        }).on('error', console.error);
    });
}).on('error', console.error);