// Direct MongoDB script to mark videos for re-upload
// This will help identify which videos need thumbnails

const { MongoClient } = require('mongodb');

const DATABASE_URL = 'mongodb+srv://vib3user:vib3123@vib3cluster.mongodb.net/vib3?retryWrites=true&w=majority';

async function checkVideos() {
    const client = new MongoClient(DATABASE_URL);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB directly\n');
        
        const db = client.db('vib3');
        
        // Find videos without proper thumbnails
        const videosWithoutThumbnails = await db.collection('videos').find({
            $or: [
                { thumbnailUrl: null },
                { thumbnailUrl: { $exists: false } },
                { thumbnailUrl: '' },
                { thumbnailUrl: { $regex: '#t=' } }
            ]
        }).toArray();
        
        console.log(`Found ${videosWithoutThumbnails.length} videos without proper thumbnails:\n`);
        
        videosWithoutThumbnails.forEach((video, index) => {
            console.log(`${index + 1}. Video ID: ${video._id}`);
            console.log(`   Description: ${video.description || 'No description'}`);
            console.log(`   Current thumbnail: ${video.thumbnailUrl || 'none'}`);
            console.log(`   Video URL: ${video.videoUrl}`);
            console.log('');
        });
        
        if (videosWithoutThumbnails.length > 0) {
            console.log('\n💡 Since the server endpoint isn\'t available yet, here are your options:\n');
            console.log('Option 1: Re-upload these 4 videos through the app (recommended)');
            console.log('         - The new upload process will generate thumbnails automatically\n');
            
            console.log('Option 2: Wait for the DigitalOcean deployment to complete');
            console.log('         - Check build logs in DigitalOcean dashboard');
            console.log('         - May need to remove FFmpeg from build command if it\'s failing\n');
            
            console.log('Option 3: Update thumbnails manually in MongoDB');
            console.log('         - I can help generate update commands if needed');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.close();
    }
}

checkVideos();