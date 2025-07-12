#!/usr/bin/env node

// Script to trigger thumbnail processing for existing VIB3 videos
// This connects directly to your MongoDB and triggers the processing

const https = require('https');
const { MongoClient } = require('mongodb');

// Configuration
const DATABASE_URL = 'mongodb+srv://vib3user:vib3123@vib3cluster.mongodb.net/vib3?retryWrites=true&w=majority';

async function checkVideoStatus() {
    const client = new MongoClient(DATABASE_URL);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db('vib3');
        
        // Count videos
        const totalVideos = await db.collection('videos').countDocuments();
        const videosWithoutThumbnails = await db.collection('videos').countDocuments({
            $or: [
                { thumbnailUrl: null },
                { thumbnailUrl: { $exists: false } },
                { thumbnailUrl: '' },
                { thumbnailUrl: { $regex: '#t=' } } // Videos using frame fallback
            ]
        });
        
        console.log('\n📊 Video Status:');
        console.log(`Total videos: ${totalVideos}`);
        console.log(`Videos with proper thumbnails: ${totalVideos - videosWithoutThumbnails}`);
        console.log(`Videos needing thumbnails: ${videosWithoutThumbnails}`);
        
        // Show sample of videos needing thumbnails
        if (videosWithoutThumbnails > 0) {
            const samples = await db.collection('videos').find({
                $or: [
                    { thumbnailUrl: null },
                    { thumbnailUrl: { $exists: false } },
                    { thumbnailUrl: '' },
                    { thumbnailUrl: { $regex: '#t=' } }
                ]
            }).limit(5).toArray();
            
            console.log('\n🎬 Sample videos needing thumbnails:');
            samples.forEach(video => {
                console.log(`- ${video._id}: ${video.description || 'No description'} (${video.thumbnailUrl || 'no thumbnail'})`);
            });
        }
        
        return { totalVideos, videosWithoutThumbnails };
        
    } finally {
        await client.close();
    }
}

async function triggerProcessing(serverUrl, authToken) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(`${serverUrl}/api/admin/process-thumbnails`, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode === 200 || res.statusCode === 201) {
                        const response = JSON.parse(data);
                        resolve(response);
                    } else {
                        reject(new Error(`Server returned ${res.statusCode}: ${data}`));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function getAuthToken(serverUrl, email, password) {
    const loginData = JSON.stringify({ email, password });
    
    return new Promise((resolve, reject) => {
        const url = new URL(`${serverUrl}/api/auth/login`);
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        };

        const req = (url.protocol === 'https:' ? https : require('http')).request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.token) {
                        resolve(response.token);
                    } else {
                        reject(new Error('No token in login response'));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.write(loginData);
        req.end();
    });
}

async function main() {
    console.log('🚀 VIB3 Thumbnail Processing Trigger');
    console.log('====================================\n');
    
    // Get server URL from command line or use default
    const serverUrl = process.argv[2] || 'https://vib3-bpfzf.ondigitalocean.app';
    console.log(`Server URL: ${serverUrl}`);
    
    try {
        // First check database status
        console.log('\n📊 Checking database status...');
        const status = await checkVideoStatus();
        
        if (status.videosWithoutThumbnails === 0) {
            console.log('\n✅ All videos already have proper thumbnails!');
            return;
        }
        
        // Get login credentials
        console.log('\n🔐 Login required to trigger processing');
        console.log('Please provide admin credentials:');
        
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const email = await new Promise(resolve => {
            readline.question('Email: ', resolve);
        });
        
        const password = await new Promise(resolve => {
            readline.question('Password: ', resolve);
        });
        
        readline.close();
        
        console.log('\n🔑 Logging in...');
        const token = await getAuthToken(serverUrl, email, password);
        console.log('✅ Login successful');
        
        console.log('\n🎬 Triggering thumbnail processing...');
        const result = await triggerProcessing(serverUrl, token);
        
        console.log('\n✅ Processing triggered successfully!');
        console.log('Response:', result);
        console.log('\nThe server is now generating thumbnails in the background.');
        console.log('This process may take several minutes depending on the number of videos.');
        console.log('\nYou can check the server logs or run this script again to see progress.');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Make sure the server URL is correct');
        console.log('2. Verify your login credentials');
        console.log('3. Check that the server is running and accessible');
        console.log('4. Ensure FFmpeg is installed on the server');
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { checkVideoStatus, triggerProcessing };