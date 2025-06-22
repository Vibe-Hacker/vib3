const { MongoClient } = require('mongodb');
require('dotenv').config();

async function inspectDatabase() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ No DATABASE_URL environment variable found');
        console.log('Please set DATABASE_URL in your .env file or environment');
        process.exit(1);
    }

    let client;
    
    try {
        console.log('🔍 Connecting to MongoDB...');
        client = new MongoClient(process.env.DATABASE_URL);
        await client.connect();
        
        const db = client.db('vib3');
        console.log('✅ Connected to VIB3 database\n');
        
        // Get collection stats
        const collections = await db.listCollections().toArray();
        console.log('📊 Collections found:', collections.map(c => c.name).join(', '));
        
        // Count documents in videos collection
        const videoCount = await db.collection('videos').countDocuments();
        console.log(`\n📹 Total videos in database: ${videoCount}`);
        
        if (videoCount > 0) {
            // Get all videos with their details
            console.log('\n🎬 Video Details:');
            console.log('================');
            
            const videos = await db.collection('videos').find({}).toArray();
            
            videos.forEach((video, index) => {
                console.log(`\n${index + 1}. Video ID: ${video._id}`);
                console.log(`   Title: ${video.title || 'No title'}`);
                console.log(`   Description: ${video.description || 'No description'}`);
                console.log(`   Video URL: ${video.videoUrl || 'No URL'}`);
                console.log(`   Status: ${video.status || 'No status'}`);
                console.log(`   User ID: ${video.userId || 'No user ID'}`);
                console.log(`   Created: ${video.createdAt || 'No date'}`);
                console.log(`   Views: ${video.views || 0}`);
                console.log(`   Hashtags: ${video.hashtags ? video.hashtags.join(', ') : 'None'}`);
                
                // Check if this looks like a test video
                const isTestVideo = 
                    (video.title && video.title.toLowerCase().includes('test')) ||
                    (video.description && video.description.toLowerCase().includes('test')) ||
                    (video.title && video.title.toLowerCase().includes('sample')) ||
                    (video.description && video.description.toLowerCase().includes('sample')) ||
                    (video.title && video.title.toLowerCase().includes('demo')) ||
                    (video.videoUrl && video.videoUrl.includes('sample')) ||
                    (video.videoUrl && video.videoUrl.includes('test'));
                
                if (isTestVideo) {
                    console.log('   ⚠️  APPEARS TO BE A TEST VIDEO');
                }
                
                // Check if video URL is accessible
                if (video.videoUrl) {
                    if (video.videoUrl.includes('vib3-videos.nyc3.digitaloceanspaces.com')) {
                        console.log('   📍 DigitalOcean Spaces URL detected');
                    } else if (video.videoUrl.startsWith('http')) {
                        console.log('   📍 External URL detected');
                    } else {
                        console.log('   ❓ Unknown URL format');
                    }
                }
            });
            
            // Look for patterns in video URLs
            console.log('\n📊 Video URL Analysis:');
            console.log('=====================');
            
            const urlPatterns = {};
            videos.forEach(video => {
                if (video.videoUrl) {
                    try {
                        const url = new URL(video.videoUrl);
                        const domain = url.hostname;
                        urlPatterns[domain] = (urlPatterns[domain] || 0) + 1;
                    } catch (e) {
                        urlPatterns['invalid'] = (urlPatterns['invalid'] || 0) + 1;
                    }
                }
            });
            
            Object.entries(urlPatterns).forEach(([domain, count]) => {
                console.log(`${domain}: ${count} videos`);
            });
            
            // Check for videos with missing files (potential 403 errors)
            console.log('\n🔍 Checking for potentially broken videos:');
            console.log('=========================================');
            
            const potentiallyBroken = videos.filter(video => {
                if (!video.videoUrl) return true;
                
                // Check for test/sample URLs that might be broken
                const suspiciousPatterns = [
                    'sample-video',
                    'test-video',
                    'demo-video',
                    'placeholder',
                    'example.com',
                    'localhost'
                ];
                
                return suspiciousPatterns.some(pattern => 
                    video.videoUrl.toLowerCase().includes(pattern)
                );
            });
            
            if (potentiallyBroken.length > 0) {
                console.log(`Found ${potentiallyBroken.length} potentially broken videos:`);
                potentiallyBroken.forEach(video => {
                    console.log(`- ${video._id}: ${video.title || 'Untitled'} (${video.videoUrl || 'No URL'})`);
                });
            } else {
                console.log('No obviously broken videos found');
            }
            
            // Get user information for videos
            console.log('\n👤 User Analysis:');
            console.log('=================');
            
            const userIds = [...new Set(videos.map(v => v.userId).filter(Boolean))];
            console.log(`Unique users with videos: ${userIds.length}`);
            
            for (const userId of userIds) {
                const user = await db.collection('users').findOne({ _id: new MongoClient.ObjectId(userId) });
                const userVideos = videos.filter(v => v.userId === userId);
                console.log(`\nUser ${userId}:`);
                console.log(`  Username: ${user ? user.username : 'User not found'}`);
                console.log(`  Email: ${user ? user.email : 'N/A'}`);
                console.log(`  Videos: ${userVideos.length}`);
                console.log(`  Video titles: ${userVideos.map(v => v.title || 'Untitled').join(', ')}`);
            }
            
        } else {
            console.log('\n✅ No videos found in the database');
        }
        
        // Check for any test data indicators
        console.log('\n🔍 Searching for test data indicators...');
        console.log('======================================');
        
        const testUsers = await db.collection('users').find({
            $or: [
                { username: /test/i },
                { email: /test/i },
                { username: /demo/i },
                { email: /demo/i },
                { username: /sample/i }
            ]
        }).toArray();
        
        if (testUsers.length > 0) {
            console.log(`Found ${testUsers.length} test users:`);
            testUsers.forEach(user => {
                console.log(`- ${user.username} (${user.email})`);
            });
        } else {
            console.log('No test users found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        if (client) {
            await client.close();
            console.log('\n✅ Database connection closed');
        }
    }
}

// Run the inspection
inspectDatabase();