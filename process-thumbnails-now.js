#!/usr/bin/env node

// Simple script to trigger thumbnail processing on VIB3 server
// Run this to process existing videos that don't have thumbnails

const https = require('https');

// IMPORTANT: Update these values
const SERVER_URL = 'https://vib3-bpfzf.ondigitalocean.app'; // Your DigitalOcean app URL
const EMAIL = 'your-admin-email@example.com'; // Your admin email
const PASSWORD = 'your-admin-password'; // Your admin password

async function login() {
    const loginData = JSON.stringify({ email: EMAIL, password: PASSWORD });
    
    return new Promise((resolve, reject) => {
        const url = new URL(`${SERVER_URL}/api/auth/login`);
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.token) {
                        console.log('✅ Login successful');
                        resolve(response.token);
                    } else {
                        reject(new Error(`Login failed: ${data}`));
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(loginData);
        req.end();
    });
}

async function triggerProcessing(token) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SERVER_URL}/api/admin/process-thumbnails`);
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 201) {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch {
                        resolve({ message: data });
                    }
                } else {
                    reject(new Error(`Server returned ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function checkVideoStatus(token) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SERVER_URL}/api/videos/random`);
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    const videos = response.videos || [];
                    const withoutThumbnails = videos.filter(v => 
                        !v.thumbnailUrl || 
                        v.thumbnailUrl === '' || 
                        v.thumbnailUrl.includes('#t=')
                    );
                    
                    console.log(`\n📊 Video Status:`);
                    console.log(`Total videos: ${videos.length}`);
                    console.log(`Videos without proper thumbnails: ${withoutThumbnails.length}`);
                    
                    if (withoutThumbnails.length > 0) {
                        console.log(`\n🎬 Videos needing thumbnails:`);
                        withoutThumbnails.forEach(v => {
                            console.log(`- ${v._id}: ${v.description || 'No description'}`);
                        });
                    }
                    
                    resolve(withoutThumbnails.length);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function main() {
    console.log('🚀 VIB3 Thumbnail Processing');
    console.log('============================\n');
    
    if (EMAIL === 'your-admin-email@example.com' || PASSWORD === 'your-admin-password') {
        console.log('❌ Please update EMAIL and PASSWORD in this script!');
        console.log('Edit the file and set your actual admin credentials.');
        return;
    }
    
    try {
        console.log('🔑 Logging in...');
        const token = await login();
        
        console.log('📊 Checking current status...');
        const needsThumbnails = await checkVideoStatus(token);
        
        if (needsThumbnails === 0) {
            console.log('\n✅ All videos already have proper thumbnails!');
            return;
        }
        
        console.log(`\n🎬 Triggering thumbnail generation for ${needsThumbnails} videos...`);
        const result = await triggerProcessing(token);
        
        console.log('\n✅ Thumbnail processing started!');
        console.log('Response:', result);
        console.log('\nThe server is now generating thumbnails in the background.');
        console.log('This may take a few minutes. Check back in 5-10 minutes.');
        console.log('\nTo check progress, run this script again.');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\nPossible issues:');
        console.log('1. Wrong email/password');
        console.log('2. Server URL is incorrect');
        console.log('3. Server is not running');
        console.log('4. FFmpeg not installed on server yet');
    }
}

// Alternative: Direct API call with curl command
console.log('\n📝 Alternative method - Use curl directly:');
console.log('1. First login to get token:');
console.log(`curl -X POST ${SERVER_URL}/api/auth/login \\`);
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"email":"your-email","password":"your-password"}\'');
console.log('\n2. Then trigger processing with the token:');
console.log(`curl -X POST ${SERVER_URL}/api/admin/process-thumbnails \\`);
console.log('  -H "Authorization: Bearer YOUR_TOKEN_HERE"');
console.log('\n---\n');

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}