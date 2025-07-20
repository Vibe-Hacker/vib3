const https = require('https');

console.log('🚀 Forcing VIB3 Web Backend Redeployment...\n');

console.log('To manually trigger deployment:');
console.log('1. Go to: https://cloud.digitalocean.com/apps');
console.log('2. Click on "vib3-web"');
console.log('3. Click "Deploy" button\n');

console.log('The deployment will:');
console.log('- Pull latest code from GitHub (with thumbnail generation)');
console.log('- Install dependencies');
console.log('- Restart the server');
console.log('- Take about 5-10 minutes\n');

console.log('After deployment completes, run:');
console.log('node run-thumbnail-fix.js\n');

// Check current deployment
https.get('https://vib3-web-75tal.ondigitalocean.app/api/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const health = JSON.parse(data);
        console.log('Current server status:');
        console.log('- Version:', health.version);
        console.log('- Started:', new Date(health.timestamp).toLocaleString());
        
        if (health.version.includes('2025-07-12')) {
            console.log('\n⚠️  Server is running old code from July 12');
            console.log('📌 Needs update to get thumbnail generation features');
        }
    });
}).on('error', console.error);