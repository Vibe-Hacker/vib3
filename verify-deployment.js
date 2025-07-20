const https = require('https');

console.log('🔍 Verifying VIB3 Deployment\n');

// Check DigitalOcean
console.log('1. DigitalOcean Server (Currently Active):');
https.get('https://vib3-web-75tal.ondigitalocean.app/api/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const health = JSON.parse(data);
        console.log('   Status:', health.status);
        console.log('   Version:', health.version);
        console.log('   Database:', health.database);
        console.log('   ✅ This is your active server\n');
    });
}).on('error', err => console.log('   ❌ Error:', err.message));

// Check Railway (should be down)
console.log('2. Railway Server (Should be inactive):');
https.get('https://vib3-production.up.railway.app/api/health', (res) => {
    console.log('   Status Code:', res.statusCode);
    if (res.statusCode === 502) {
        console.log('   ✅ Railway is properly disconnected\n');
    }
}).on('error', err => console.log('   ✅ Railway is offline (good)\n'));

// Check what's in the deployed server
setTimeout(() => {
    console.log('3. Checking deployed endpoints on DigitalOcean:');
    
    const endpoints = [
        { path: '/api/upload/video', method: 'POST', name: 'Old upload endpoint' },
        { path: '/api/videos/upload', method: 'POST', name: 'New upload endpoint' },
        { path: '/api/admin/process-thumbnails', method: 'POST', name: 'Thumbnail processor' }
    ];
    
    endpoints.forEach(endpoint => {
        const req = https.request({
            hostname: 'vib3-web-75tal.ondigitalocean.app',
            path: endpoint.path,
            method: endpoint.method,
            headers: { 'Content-Length': 0 }
        }, (res) => {
            console.log(`   ${endpoint.name}: ${res.statusCode === 404 ? '❌ Not found' : '✅ Exists (status ' + res.statusCode + ')'}`);
        });
        req.on('error', console.error);
        req.end();
    });
}, 1000);