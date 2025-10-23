// Simple script to delete specific videos from MongoDB by their IDs
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function deleteVideosByIds() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not found in environment variables');
        console.log('Please set DATABASE_URL in your .env file or environment');
        process.exit(1);
    }

    // The first two arguments are 'node' and the script name, so we slice them off
    const videoIdsToDelete = process.argv.slice(2);

    if (videoIdsToDelete.length === 0) {
        console.log('❌ No video IDs provided!');
        console.log('Usage: node delete-videos-by-id.js <video_id_1> <video_id_2> ...');
        process.exit(1);
    }

    const client = new MongoClient(process.env.DATABASE_URL);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db();
        const videoCollectionName = process.env.VIDEO_COLLECTION || 'videos';
        const likesCollectionName = process.env.LIKES_COLLECTION || 'likes';
        const commentsCollectionName = process.env.COMMENTS_COLLECTION || 'comments';
        const viewsCollectionName = process.env.VIEWS_COLLECTION || 'views';

        console.log(`\n🗑️  Preparing to delete ${videoIdsToDelete.length} videos...`);
        
        for (const videoId of videoIdsToDelete) {
            try {
                // Get video info first
                const video = await db.collection(videoCollectionName).findOne({ 
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
                const result = await db.collection(videoCollectionName).updateOne(
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
                    const likes = await db.collection(likesCollectionName).deleteMany({ 
                        videoId: videoId 
                    });
                    const comments = await db.collection(commentsCollectionName).deleteMany({ 
                        videoId: videoId 
                    });
                    const views = await db.collection(viewsCollectionName).deleteMany({ 
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