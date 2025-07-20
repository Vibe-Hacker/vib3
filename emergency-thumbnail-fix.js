// Emergency fix to update thumbnail URLs directly
// This is a temporary solution until server deployment works

const https = require('https');

async function updateThumbnails() {
    try {
        // Login first
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
            throw new Error('Login failed');
        }

        console.log('✅ Login successful!');
        
        // Get videos to check which ones need thumbnails
        console.log('\n📊 Fetching videos...');
        const videosResponse = await new Promise((resolve, reject) => {
            https.get({
                hostname: 'vib3-web-75tal.ondigitalocean.app',
                path: '/api/videos/random',
                headers: {
                    'Authorization': `Bearer ${loginResponse.token}`
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve(JSON.parse(data));
                });
            }).on('error', reject);
        });

        const videos = videosResponse.videos || [];
        const videosNeedingThumbnails = videos.filter(v => 
            !v.thumbnailUrl || 
            v.thumbnailUrl === '' || 
            v.thumbnailUrl.includes('#t=')
        );

        console.log(`Found ${videos.length} total videos`);
        console.log(`${videosNeedingThumbnails.length} videos need thumbnails\n`);

        if (videosNeedingThumbnails.length > 0) {
            console.log('Videos without proper thumbnails:');
            videosNeedingThumbnails.forEach((v, i) => {
                console.log(`${i + 1}. ${v._id}: ${v.description || 'No description'}`);
                console.log(`   Video URL: ${v.videoUrl}`);
                console.log(`   Current thumbnail: ${v.thumbnailUrl || 'none'}\n`);
            });

            console.log('\n📌 TEMPORARY SOLUTION:');
            console.log('Since the server endpoint is not deployed yet, here\'s what to do:\n');
            
            console.log('1. IMMEDIATE FIX - Generate static thumbnails:');
            console.log('   For each video above, I can generate a thumbnail URL using the video URL.');
            console.log('   These will be placeholder thumbnails but better than nothing.\n');
            
            console.log('2. WAIT FOR DEPLOYMENT:');
            console.log('   Check DigitalOcean dashboard in 5-10 minutes');
            console.log('   The new deployment should include FFmpeg support\n');
            
            console.log('3. MANUAL OVERRIDE:');
            console.log('   As a last resort, we can manually set thumbnail URLs in the database');
            
            // Generate thumbnail URLs based on video URLs
            console.log('\n🎨 Generated thumbnail URLs for manual update:');
            videosNeedingThumbnails.forEach((v, i) => {
                // Extract video filename and create thumbnail path
                const videoPath = v.videoUrl.split('/').pop();
                const thumbnailName = videoPath.replace('.mp4', '.jpg');
                const suggestedThumbnailUrl = v.videoUrl.replace('/videos/', '/thumbnails/').replace('.mp4', '.jpg');
                console.log(`\n${i + 1}. Video ${v._id}:`);
                console.log(`   Suggested thumbnail: ${suggestedThumbnailUrl}`);
            });
        } else {
            console.log('✅ All videos have thumbnails!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

updateThumbnails();