const https = require('https');

async function processThumbnails() {
    try {
        // Step 1: Login
        console.log('🔑 Logging in...');
        const loginData = JSON.stringify({
            email: 'tmc363@gmail.com',
            password: 'P0pp0p25!'
        });

        const loginResponse = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'vib3-web-75tal.ondigitalocean.app',
                path: '/api/auth/login',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': loginData.length
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error(`Failed to parse: ${data}`));
                    }
                });
            });
            req.on('error', reject);
            req.write(loginData);
            req.end();
        });

        if (!loginResponse.token) {
            throw new Error('Login failed: ' + JSON.stringify(loginResponse));
        }

        console.log('✅ Login successful!');

        // Step 2: Trigger thumbnail processing
        console.log('🎬 Triggering thumbnail processing...');
        const processResponse = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'vib3-web-75tal.ondigitalocean.app',
                path: '/api/admin/process-thumbnails',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${loginResponse.token}`
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({ statusCode: res.statusCode, data });
                });
            });
            req.on('error', reject);
            req.end();
        });

        if (processResponse.statusCode === 404) {
            console.log(`\n❌ Endpoint not found (404)`);
            console.log('The server hasn\'t updated with the new code yet.');
            console.log('\nPossible solutions:');
            console.log('1. Wait 5 more minutes for deployment to fully propagate');
            console.log('2. Try clearing Cloudflare cache in DigitalOcean dashboard');
            console.log('3. The deployment might need to be triggered again');
        } else if (processResponse.statusCode === 401) {
            console.log(`\n❌ Authentication required (401)`);
            console.log('Token might be invalid. Try logging in again.');
        } else if (processResponse.statusCode === 200 || processResponse.statusCode === 201) {
            console.log(`\n✅ Success! Response: ${processResponse.data}`);
            console.log('\n🎉 Thumbnail processing started!');
            console.log('The server is now generating thumbnails in the background.');
            console.log('Check your app in 5-10 minutes to see the new thumbnails.');
        } else {
            console.log(`\n⚠️ Unexpected response: ${processResponse.statusCode}`);
            console.log(`Response: ${processResponse.data}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

processThumbnails();