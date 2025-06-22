// Script to list all videos in MongoDB with their status
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function listAllVideos() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not found in environment variables');
        process.exit(1);
    }

    const client = new MongoClient(process.env.DATABASE_URL);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');
        
        const db = client.db('vib3');
        
        // Get counts
        const totalCount = await db.collection('videos').countDocuments();
        const activeCount = await db.collection('videos').countDocuments({ 
            status: { $ne: 'deleted' } 
        });
        const deletedCount = await db.collection('videos').countDocuments({ 
            status: 'deleted' 
        });
        
        console.log('📊 Video Statistics:');
        console.log(`- Total videos: ${totalCount}`);
        console.log(`- Active videos: ${activeCount}`);
        console.log(`- Deleted videos: ${deletedCount}`);
        console.log('\n' + '='.repeat(80) + '\n');
        
        // Get all videos
        const videos = await db.collection('videos')
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
        
        console.log('📹 All Videos:\n');
        
        videos.forEach((video, index) => {
            const status = video.status || 'active';
            const statusEmoji = status === 'deleted' ? '🗑️' : '✅';
            
            console.log(`${index + 1}. ${statusEmoji} ${video.title || 'Untitled Video'}`);
            console.log(`   ID: ${video._id}`);
            console.log(`   Created: ${video.createdAt}`);
            console.log(`   Status: ${status}`);
            console.log(`   URL: ${video.videoUrl || 'No URL'}`);
            
            if (video.deletedAt) {
                console.log(`   Deleted: ${video.deletedAt}`);
                console.log(`   Reason: ${video.deletedReason || 'Unknown'}`);
            }
            
            console.log('   ' + '-'.repeat(60));
        });
        
        console.log('\n📝 To delete specific videos:');
        console.log('1. Copy the video IDs from above');
        console.log('2. Edit delete-videos-by-id.js');
        console.log('3. Add the IDs to the videoIdsToDelete array');
        console.log('4. Run: node delete-videos-by-id.js');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n👋 Done!');
    }
}

// Run the script
listAllVideos();