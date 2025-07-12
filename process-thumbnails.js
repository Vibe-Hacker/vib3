// Script to process thumbnails for existing videos
// Run this after the server is deployed with FFmpeg support

const https = require('https');

// Configuration
const SERVER_URL = 'https://vib3-production.up.railway.app'; // Update this with your actual server URL
const AUTH_TOKEN = ''; // You'll need to get this from logging into the app

async function getAuthToken() {
    // First, try to login to get a token
    const loginData = JSON.stringify({
        email: 'admin@vib3.com', // Update with your admin credentials
        password: 'your-password' // Update with your admin password
    });

    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        };

        const req = https.request(`${SERVER_URL}/api/auth/login`, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.token) {
                        console.log('✅ Login successful');
                        resolve(response.token);
                    } else {
                        reject(new Error('No token in response'));
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

async function processThumbnails(token) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const req = https.request(`${SERVER_URL}/api/admin/process-thumbnails`, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('📸 Thumbnail processing response:', response);
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function checkVideoStatus() {
    return new Promise((resolve, reject) => {
        const req = https.get(`${SERVER_URL}/api/videos/random`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    const videos = response.videos || [];
                    const withThumbnails = videos.filter(v => v.thumbnailUrl && !v.thumbnailUrl.includes('#t='));
                    const withoutThumbnails = videos.filter(v => !v.thumbnailUrl || v.thumbnailUrl.includes('#t='));
                    
                    console.log(`\n📊 Video Status:`);
                    console.log(`Total videos: ${videos.length}`);
                    console.log(`With thumbnails: ${withThumbnails.length}`);
                    console.log(`Without thumbnails: ${withoutThumbnails.length}`);
                    
                    if (withoutThumbnails.length > 0) {
                        console.log(`\n🎬 Videos needing thumbnails:`);
                        withoutThumbnails.slice(0, 5).forEach(v => {
                            console.log(`- ${v._id}: ${v.description || 'No description'}`);
                        });
                        if (withoutThumbnails.length > 5) {
                            console.log(`... and ${withoutThumbnails.length - 5} more`);
                        }
                    }
                    
                    resolve({ total: videos.length, needThumbnails: withoutThumbnails.length });
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
    });
}

async function main() {
    console.log('🚀 VIB3 Thumbnail Processor');
    console.log('==========================\n');

    if (!AUTH_TOKEN) {
        console.log('❌ Please update the AUTH_TOKEN in this script');
        console.log('You can get it by:');
        console.log('1. Login to your VIB3 app');
        console.log('2. Open browser dev tools (F12)');
        console.log('3. Go to Network tab');
        console.log('4. Look for any API request');
        console.log('5. Copy the Authorization header value (after "Bearer ")');
        return;
    }

    try {
        // Check current status
        console.log('📊 Checking current video status...');
        const status = await checkVideoStatus();
        
        if (status.needThumbnails === 0) {
            console.log('\n✅ All videos already have thumbnails!');
            return;
        }

        console.log(`\n🎬 Starting thumbnail generation for ${status.needThumbnails} videos...`);
        console.log('This will run in the background on the server.\n');

        // Process thumbnails
        const result = await processThumbnails(AUTH_TOKEN);
        console.log('\n✅ Thumbnail processing started successfully!');
        console.log('The server is now generating thumbnails in the background.');
        console.log('This may take several minutes depending on the number of videos.');
        console.log('\nCheck the server logs for progress updates.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Make sure the server URL is correct');
        console.log('2. Verify your auth token is valid');
        console.log('3. Check that the server is running');
    }
}

// Alternative: Direct database processing (if you have direct MongoDB access)
async function directDatabaseProcess() {
    const { MongoClient } = require('mongodb');
    const ffmpeg = require('fluent-ffmpeg');
    const AWS = require('aws-sdk');
    
    // MongoDB connection
    const client = new MongoClient(process.env.DATABASE_URL || 'mongodb+srv://vib3user:vib3123@vib3cluster.mongodb.net/vib3?retryWrites=true&w=majority');
    
    try {
        await client.connect();
        const db = client.db('vib3');
        
        // Configure S3
        const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
        const s3 = new AWS.S3({
            endpoint: spacesEndpoint,
            accessKeyId: process.env.DO_SPACES_KEY || 'DO00RUBQWDCCVRFEWBFF',
            secretAccessKey: process.env.DO_SPACES_SECRET || '05J/3Y+QIh5a83Eag5rFxnp4RNhNOqfwVNUjbKNuqn8'
        });
        
        // Find videos without thumbnails
        const videos = await db.collection('videos').find({ 
            $or: [
                { thumbnailUrl: null },
                { thumbnailUrl: { $exists: false } },
                { thumbnailUrl: '' }
            ]
        }).toArray();
        
        console.log(`Found ${videos.length} videos without thumbnails`);
        
        // Process each video
        for (const video of videos) {
            console.log(`Processing ${video._id}...`);
            // Thumbnail generation logic here
        }
        
    } finally {
        await client.close();
    }
}

// Run the appropriate method
if (require.main === module) {
    // Check if we're running locally with database access
    if (process.env.DATABASE_URL) {
        console.log('Running direct database processing...');
        directDatabaseProcess().catch(console.error);
    } else {
        // Use API method
        main();
    }
}

module.exports = { processThumbnails, checkVideoStatus };