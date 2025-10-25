const { MongoClient } = require('mongodb');

const mongoUri = process.env.DATABASE_URL || 'mongodb+srv://vib3app:Vib3Pass2025@cluster0.y06bp.mongodb.net/vib3?retryWrites=true&w=majority';

(async () => {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db('vib3');

    console.log('Updating video thumbnails...\n');

    // Find videos without thumbnailUrl
    const videosWithoutThumbnails = await db.collection('videos').countDocuments({
        $or: [
            { thumbnailUrl: null },
            { thumbnailUrl: { $exists: false } },
            { thumbnailUrl: '' }
        ]
    });

    console.log(`Found ${videosWithoutThumbnails} videos without thumbnails`);

    // Update all videos to have a thumbnail URL (use video URL + #t=0.5 for frame at 0.5 seconds)
    // This works with HTML5 video elements to show a frame from the video
    const result = await db.collection('videos').updateMany(
        {
            $or: [
                { thumbnailUrl: null },
                { thumbnailUrl: { $exists: false } },
                { thumbnailUrl: '' }
            ],
            videoUrl: { $exists: true, $ne: null, $ne: '' }
        },
        [
            {
                $set: {
                    thumbnailUrl: { $concat: ['$videoUrl', '#t=0.5'] }
                }
            }
        ]
    );

    console.log(`\n✅ Updated ${result.modifiedCount} video thumbnails`);

    // Verify
    const sampleVideos = await db.collection('videos').find({}).limit(3).toArray();
    console.log('\nSample videos after update:');
    sampleVideos.forEach((v, i) => {
        console.log(`${i + 1}. ID: ${v._id}`);
        console.log(`   videoUrl: ${v.videoUrl}`);
        console.log(`   thumbnailUrl: ${v.thumbnailUrl}`);
        console.log();
    });

    await client.close();
})();
