// Script to fix duplicated paths in video URLs

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const mongoUrl = process.env.MONGODB_URI || 'mongodb+srv://vibeboss:P0pp0p25!@cluster0.lquhg.mongodb.net/vib3?retryWrites=true&w=majority';

async function fixVideoUrls() {
    const client = new MongoClient(mongoUrl);
    
    try {
        console.log('🔗 Connecting to MongoDB...');
        await client.connect();
        const db = client.db('vib3');
        const videosCollection = db.collection('videos');
        
        // Find all videos with problematic URLs
        const videos = await videosCollection.find({
            videoUrl: { $regex: 'nyc3.digitaloceanspaces.com/videos/nyc3.digitaloceanspaces.com' }
        }).toArray();
        
        console.log(`📹 Found ${videos.length} videos with duplicated URLs`);
        
        let fixedCount = 0;
        
        for (const video of videos) {
            const originalUrl = video.videoUrl;
            let fixedUrl = originalUrl;
            
            // Fix the duplicated path
            if (fixedUrl.includes('/videos/nyc3.digitaloceanspaces.com/vib3-videos/videos/')) {
                fixedUrl = fixedUrl.replace('/videos/nyc3.digitaloceanspaces.com/vib3-videos/videos/', '/videos/');
            } else if (fixedUrl.includes('nyc3.digitaloceanspaces.com/videos/nyc3.digitaloceanspaces.com')) {
                fixedUrl = fixedUrl.replace('nyc3.digitaloceanspaces.com/videos/nyc3.digitaloceanspaces.com', 'nyc3.digitaloceanspaces.com');
            }
            
            if (originalUrl !== fixedUrl) {
                console.log(`\n🔧 Fixing video ${video._id}`);
                console.log(`   From: ${originalUrl}`);
                console.log(`   To:   ${fixedUrl}`);
                
                // Update the video URL
                await videosCollection.updateOne(
                    { _id: video._id },
                    { $set: { videoUrl: fixedUrl } }
                );
                
                fixedCount++;
            }
        }
        
        console.log(`\n✅ Fixed ${fixedCount} video URLs`);
        
        // Also check for thumbnail URLs
        const videosWithBadThumbnails = await videosCollection.find({
            thumbnailUrl: { $regex: 'nyc3.digitaloceanspaces.com/videos/nyc3.digitaloceanspaces.com' }
        }).toArray();
        
        console.log(`\n📸 Found ${videosWithBadThumbnails.length} videos with duplicated thumbnail URLs`);
        
        let fixedThumbnailCount = 0;
        
        for (const video of videosWithBadThumbnails) {
            const originalUrl = video.thumbnailUrl;
            let fixedUrl = originalUrl;
            
            // Fix the duplicated path
            if (fixedUrl.includes('/videos/nyc3.digitaloceanspaces.com/vib3-videos/videos/')) {
                fixedUrl = fixedUrl.replace('/videos/nyc3.digitaloceanspaces.com/vib3-videos/videos/', '/videos/');
            } else if (fixedUrl.includes('nyc3.digitaloceanspaces.com/videos/nyc3.digitaloceanspaces.com')) {
                fixedUrl = fixedUrl.replace('nyc3.digitaloceanspaces.com/videos/nyc3.digitaloceanspaces.com', 'nyc3.digitaloceanspaces.com');
            }
            
            if (originalUrl !== fixedUrl) {
                console.log(`\n🔧 Fixing thumbnail for video ${video._id}`);
                console.log(`   From: ${originalUrl}`);
                console.log(`   To:   ${fixedUrl}`);
                
                // Update the thumbnail URL
                await videosCollection.updateOne(
                    { _id: video._id },
                    { $set: { thumbnailUrl: fixedUrl } }
                );
                
                fixedThumbnailCount++;
            }
        }
        
        console.log(`\n✅ Fixed ${fixedThumbnailCount} thumbnail URLs`);
        
        // Show a sample of fixed videos
        console.log('\n📊 Sample of fixed videos:');
        const sampleVideos = await videosCollection.find({}).limit(5).toArray();
        sampleVideos.forEach((video, i) => {
            console.log(`\nVideo ${i + 1}:`);
            console.log(`  URL: ${video.videoUrl}`);
            if (video.thumbnailUrl) {
                console.log(`  Thumbnail: ${video.thumbnailUrl}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n🔒 Database connection closed');
    }
}

// Run the fix
fixVideoUrls().catch(console.error);