// Cleanup script for removing orphaned videos from MongoDB
// Videos that were deleted from Digital Ocean but still exist in MongoDB

const { MongoClient, ObjectId } = require('mongodb');
const AWS = require('aws-sdk');
require('dotenv').config();

// Digital Ocean Spaces configuration
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
    region: process.env.DO_SPACES_REGION || 'nyc3'
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'vib3-videos';

async function cleanupOrphanedVideos() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not found in environment variables');
        process.exit(1);
    }

    const client = new MongoClient(process.env.DATABASE_URL);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db('vib3');
        const videosCollection = db.collection('videos');
        
        // Get all videos that are NOT marked as deleted
        const videos = await videosCollection.find({ 
            status: { $ne: 'deleted' } 
        }).toArray();
        
        console.log(`\n📊 Found ${videos.length} active videos in MongoDB\n`);
        
        const orphanedVideos = [];
        let checkedCount = 0;
        
        // Check each video to see if it exists in Digital Ocean
        for (const video of videos) {
            checkedCount++;
            process.stdout.write(`\rChecking video ${checkedCount}/${videos.length}...`);
            
            if (!video.videoUrl) {
                console.log(`\n⚠️  Video ${video._id} has no URL`);
                orphanedVideos.push(video);
                continue;
            }
            
            // Extract the key from the video URL
            const urlParts = video.videoUrl.split('/');
            const key = urlParts.slice(-2).join('/'); // Get last 2 parts (videos/filename)
            
            try {
                // Check if the file exists in Digital Ocean
                await s3.headObject({
                    Bucket: BUCKET_NAME,
                    Key: key
                }).promise();
                
                // File exists, skip
            } catch (error) {
                if (error.code === 'NotFound') {
                    console.log(`\n❌ Video not found in Digital Ocean: ${video.title || 'Untitled'} (${video._id})`);
                    orphanedVideos.push(video);
                }
            }
        }
        
        console.log(`\n\n📊 Summary:`);
        console.log(`- Total active videos in MongoDB: ${videos.length}`);
        console.log(`- Orphaned videos (not in Digital Ocean): ${orphanedVideos.length}`);
        
        if (orphanedVideos.length > 0) {
            console.log('\n🗑️  Orphaned videos to be cleaned up:');
            orphanedVideos.forEach((video, index) => {
                console.log(`${index + 1}. ${video.title || 'Untitled'} (ID: ${video._id})`);
                console.log(`   URL: ${video.videoUrl}`);
                console.log(`   Created: ${video.createdAt}`);
            });
            
            // Ask for confirmation
            console.log('\n⚠️  Do you want to mark these videos as deleted in MongoDB?');
            console.log('This will remove them from your feed but keep the records for reference.');
            console.log('Type "yes" to confirm, or press Ctrl+C to cancel:\n');
            
            // Wait for user input
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            readline.question('> ', async (answer) => {
                if (answer.toLowerCase() === 'yes') {
                    console.log('\n🔄 Marking orphaned videos as deleted...');
                    
                    for (const video of orphanedVideos) {
                        await videosCollection.updateOne(
                            { _id: video._id },
                            { 
                                $set: { 
                                    status: 'deleted',
                                    deletedAt: new Date(),
                                    deletedReason: 'File not found in Digital Ocean Spaces'
                                }
                            }
                        );
                        console.log(`✅ Marked as deleted: ${video.title || 'Untitled'}`);
                    }
                    
                    console.log('\n✅ Cleanup complete! The videos have been marked as deleted.');
                    console.log('They will no longer appear in your feed.');
                    
                    // Also clean up related data
                    console.log('\n🔄 Cleaning up related data (likes, comments, views)...');
                    const videoIds = orphanedVideos.map(v => v._id.toString());
                    
                    const likesResult = await db.collection('likes').deleteMany({ 
                        videoId: { $in: videoIds } 
                    });
                    const commentsResult = await db.collection('comments').deleteMany({ 
                        videoId: { $in: videoIds } 
                    });
                    const viewsResult = await db.collection('views').deleteMany({ 
                        videoId: { $in: videoIds } 
                    });
                    
                    console.log(`✅ Deleted ${likesResult.deletedCount} likes`);
                    console.log(`✅ Deleted ${commentsResult.deletedCount} comments`);
                    console.log(`✅ Deleted ${viewsResult.deletedCount} views`);
                    
                } else {
                    console.log('\n❌ Cleanup cancelled.');
                }
                
                readline.close();
                await client.close();
                process.exit(0);
            });
            
        } else {
            console.log('\n✅ No orphaned videos found! Your database is clean.');
            await client.close();
            process.exit(0);
        }
        
    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        await client.close();
        process.exit(1);
    }
}

// Run the cleanup
cleanupOrphanedVideos();