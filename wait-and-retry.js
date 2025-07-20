const https = require('https');

console.log('⏰ Waiting 2 minutes for deployment to fully propagate...\n');
console.log('DigitalOcean deployments can take a few minutes to:');
console.log('1. Build the new code');
console.log('2. Install FFmpeg');
console.log('3. Replace the old server instances');
console.log('4. Clear CDN caches\n');

// Check server status every 30 seconds
let attempts = 0;
const maxAttempts = 4;

function checkServer() {
    attempts++;
    console.log(`\nAttempt ${attempts}/${maxAttempts} - Checking server...`);
    
    https.get('https://vib3-web-75tal.ondigitalocean.app/api/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const health = JSON.parse(data);
            console.log(`Server version: ${health.version}`);
            console.log(`Uptime: ${Math.floor(health.uptime)} seconds`);
            
            // Check if thumbnail endpoint exists
            const req = https.request({
                hostname: 'vib3-web-75tal.ondigitalocean.app',
                path: '/api/admin/process-thumbnails',
                method: 'POST',
                headers: { 'Authorization': 'Bearer test' }
            }, (res) => {
                if (res.statusCode === 401) {
                    console.log('✅ Thumbnail endpoint is now available!');
                    console.log('\nRun this command to fix your thumbnails:');
                    console.log('node run-thumbnail-fix.js');
                } else if (res.statusCode === 404) {
                    console.log('❌ Thumbnail endpoint not found yet');
                    if (attempts < maxAttempts) {
                        console.log('Waiting 30 more seconds...');
                        setTimeout(checkServer, 30000);
                    } else {
                        console.log('\n⚠️ Deployment seems stuck. Try:');
                        console.log('1. Go to DigitalOcean dashboard');
                        console.log('2. Check the build logs for errors');
                        console.log('3. Click "Deploy" again if needed');
                    }
                }
            });
            req.on('error', console.error);
            req.end();
        });
    }).on('error', console.error);
}

// Start checking
checkServer();