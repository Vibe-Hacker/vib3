// Script to fix the likes collection indexes
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixLikesIndex() {
    // Use Railway production MongoDB connection
    const RAILWAY_DB_URL = 'https://vib3-production.up.railway.app/db-direct';
    const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017/vib3');
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db('vib3');
        
        // First, let's see what's in the likes collection
        console.log('\n📊 Analyzing likes collection...');
        
        const totalLikes = await db.collection('likes').countDocuments();
        const videoLikes = await db.collection('likes').countDocuments({ 
            videoId: { $exists: true, $ne: null } 
        });
        const postLikes = await db.collection('likes').countDocuments({ 
            postId: { $exists: true, $ne: null } 
        });
        const problematicLikes = await db.collection('likes').countDocuments({ 
            $or: [
                { postId: null },
                { postId: '' }
            ]
        });
        
        console.log(`Total likes: ${totalLikes}`);
        console.log(`Video likes: ${videoLikes}`);
        console.log(`Post likes: ${postLikes}`);
        console.log(`Problematic likes (null/empty postId): ${problematicLikes}`);
        
        // Remove the postId field from all video likes
        console.log('\n🔧 Fixing video likes...');
        const updateResult = await db.collection('likes').updateMany(
            { 
                videoId: { $exists: true, $ne: null },
                $or: [
                    { postId: { $exists: true } },
                    { postId: null },
                    { postId: '' }
                ]
            },
            { 
                $unset: { postId: "" }
            }
        );
        
        console.log(`✅ Updated ${updateResult.modifiedCount} video likes to remove postId field`);
        
        // Check for and remove duplicate video likes
        console.log('\n🔍 Checking for duplicate video likes...');
        const duplicates = await db.collection('likes').aggregate([
            {
                $match: {
                    videoId: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: { videoId: "$videoId", userId: "$userId" },
                    count: { $sum: 1 },
                    ids: { $push: "$_id" }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]).toArray();
        
        if (duplicates.length > 0) {
            console.log(`Found ${duplicates.length} duplicate video likes`);
            
            for (const dup of duplicates) {
                // Keep the first one, delete the rest
                const idsToDelete = dup.ids.slice(1);
                await db.collection('likes').deleteMany({ 
                    _id: { $in: idsToDelete } 
                });
                console.log(`Removed ${idsToDelete.length} duplicates for video ${dup._id.videoId}, user ${dup._id.userId}`);
            }
        } else {
            console.log('✅ No duplicate video likes found');
        }
        
        // List current indexes
        console.log('\n📋 Current indexes:');
        const indexes = await db.collection('likes').listIndexes().toArray();
        indexes.forEach(index => {
            console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
        });
        
        console.log('\n✅ Likes collection cleanup complete!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n👋 Done!');
    }
}

// Run the script
fixLikesIndex();