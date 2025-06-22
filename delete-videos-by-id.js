// Simple script to delete specific videos from MongoDB by their IDs
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function deleteVideosByIds() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not found in environment variables');
        console.log('Please set DATABASE_URL in your .env file or environment');
        process.exit(1);
    }

    // Add the video IDs you want to delete here
    // You can find these IDs in your browser console when viewing the videos
    const videoIdsToDelete = [
        // Example: '685837f73698d9a7698433ed',
        // Add more IDs here, one per line
    ];

    if (videoIdsToDelete.length === 0) {
        console.log('❌ No video IDs specified!');
        console.log('\nTo use this script:');
        console.log('1. Open this file in an editor');
        console.log('2. Add video IDs to the videoIdsToDelete array');
        console.log('3. Run the script again with: node delete-videos-by-id.js');
        console.log('\nExample:');
        console.log("const videoIdsToDelete = [");
        console.log("    '685837f73698d9a7698433ed',");
        console.log("    '685838b2a698d9a7698433ef'");
        console.log("];");
        process.exit(1);
    }

    const client = new MongoClient(process.env.DATABASE_URL);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db('vib3');
        
        console.log(`\n🗑️  Preparing to delete ${videoIdsToDelete.length} videos...`);
        
        for (const videoId of videoIdsToDelete) {
            try {
                // Get video info first
                const video = await db.collection('videos').findOne({ 
                    _id: new ObjectId(videoId) 
                });
                
                if (!video) {
                    console.log(`⚠️  Video ${videoId} not found in database`);
                    continue;
                }
                
                console.log(`\n📹 Video: ${video.title || 'Untitled'}`);
                console.log(`   Created: ${video.createdAt}`);
                console.log(`   Status: ${video.status || 'unknown'}`);
                
                // Mark as deleted (soft delete)
                const result = await db.collection('videos').updateOne(
                    { _id: new ObjectId(videoId) },
                    { 
                        $set: { 
                            status: 'deleted',
                            deletedAt: new Date(),
                            deletedReason: 'Manual cleanup'
                        }
                    }
                );
                
                if (result.modifiedCount > 0) {
                    console.log(`✅ Marked as deleted`);
                    
                    // Clean up related data
                    const likes = await db.collection('likes').deleteMany({ 
                        videoId: videoId 
                    });
                    const comments = await db.collection('comments').deleteMany({ 
                        videoId: videoId 
                    });
                    const views = await db.collection('views').deleteMany({ 
                        videoId: videoId 
                    });
                    
                    console.log(`   Removed ${likes.deletedCount} likes`);
                    console.log(`   Removed ${comments.deletedCount} comments`);
                    console.log(`   Removed ${views.deletedCount} views`);
                }
                
            } catch (error) {
                console.error(`❌ Error deleting video ${videoId}:`, error.message);
            }
        }
        
        console.log('\n✅ Cleanup complete!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run the script
deleteVideosByIds();