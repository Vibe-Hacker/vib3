const { MongoClient } = require('mongodb');

const mongoUri = process.env.DATABASE_URL || 'mongodb+srv://vib3app:Vib3Pass2025@cluster0.y06bp.mongodb.net/vib3?retryWrites=true&w=majority';

(async () => {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db('vib3');

    console.log('Checking video status fields:\n');

    // Count total videos
    const totalVideos = await db.collection('videos').countDocuments();
    console.log(`Total videos in database: ${totalVideos}`);

    // Count videos by status
    const statusCounts = await db.collection('videos').aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]).toArray();

    console.log('\nVideos by status:');
    statusCounts.forEach(s => {
        console.log(`  ${s._id || 'undefined/null'}: ${s.count} videos`);
    });

    // Count active videos (not deleted)
    const activeVideos = await db.collection('videos').countDocuments({
        status: { $ne: 'deleted' }
    });
    console.log(`\nActive videos (status != 'deleted'): ${activeVideos}`);

    // Check if status field exists
    const videosWithoutStatus = await db.collection('videos').countDocuments({
        status: { $exists: false }
    });
    console.log(`Videos without status field: ${videosWithoutStatus}`);

    // Sample of video data
    const sampleVideos = await db.collection('videos').find({}).limit(5).toArray();
    console.log('\nSample video data:');
    sampleVideos.forEach((v, i) => {
        console.log(`${i + 1}. ID: ${v._id}`);
        console.log(`   userId: ${v.userId}`);
        console.log(`   title: ${v.title || v.description || 'Untitled'}`);
        console.log(`   status: ${v.status || 'undefined'}`);
        console.log(`   url: ${v.url ? 'present' : 'missing'}`);
        console.log();
    });

    await client.close();
})();
