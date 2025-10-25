const { MongoClient, ObjectId } = require('mongodb');

const mongoUri = process.env.DATABASE_URL || 'mongodb+srv://vib3app:Vib3Pass2025@cluster0.y06bp.mongodb.net/vib3?retryWrites=true&w=majority';

(async () => {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db('vib3');

    console.log('Restoring deleted videos for tmc363@gmail.com (oldergenx)...\n');

    const userId = '685387affa53455d5a791b1b';

    // Count deleted videos for this user
    const deletedCount = await db.collection('videos').countDocuments({
        userId: userId,
        status: 'deleted'
    });

    console.log(`Found ${deletedCount} deleted videos for user ${userId}`);

    // Update all deleted videos to active
    const result = await db.collection('videos').updateMany(
        {
            userId: userId,
            status: 'deleted'
        },
        {
            $set: { status: 'active' }
        }
    );

    console.log(`✅ Restored ${result.modifiedCount} videos`);

    // Also set status for videos without status field
    const noStatusCount = await db.collection('videos').countDocuments({
        userId: userId,
        status: { $exists: false }
    });

    console.log(`\nFound ${noStatusCount} videos without status field`);

    const result2 = await db.collection('videos').updateMany(
        {
            userId: userId,
            status: { $exists: false }
        },
        {
            $set: { status: 'active' }
        }
    );

    console.log(`✅ Set status for ${result2.modifiedCount} videos`);

    // Verify final count
    const activeCount = await db.collection('videos').countDocuments({
        userId: userId,
        status: { $ne: 'deleted' }
    });

    console.log(`\n📊 Total active videos for user now: ${activeCount}`);

    await client.close();
})();
