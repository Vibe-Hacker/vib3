const { MongoClient, ObjectId } = require('mongodb');

const mongoUri = process.env.DATABASE_URL || 'mongodb+srv://vib3app:Vib3Pass2025@cluster0.y06bp.mongodb.net/vib3?retryWrites=true&w=majority';

(async () => {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db('vib3');

    console.log('Looking up users by ID:\n');

    // Check user 685387affa53455d5a791b1b
    const user1 = await db.collection('users').findOne({ _id: new ObjectId('685387affa53455d5a791b1b') });
    if (user1) {
        console.log('User ID: 685387affa53455d5a791b1b');
        console.log(`  Username: ${user1.username}`);
        console.log(`  Email: ${user1.email}`);
        console.log(`  Display Name: ${user1.displayName}`);
        console.log(`  Posts: ${user1.postsCount || 0}`);
        console.log(`  Followers: ${user1.followersCount || 0}`);
    }

    console.log();

    // Check user 6857468c0a
    const user2 = await db.collection('users').findOne({ _id: new ObjectId('6857468c0afa24ede7d75b59') });
    if (user2) {
        console.log('User ID: 6857468c0afa24ede7d75b59');
        console.log(`  Username: ${user2.username}`);
        console.log(`  Email: ${user2.email}`);
        console.log(`  Display Name: ${user2.displayName}`);
        console.log(`  Posts: ${user2.postsCount || 0}`);
        console.log(`  Followers: ${user2.followersCount || 0}`);
    }

    // Count videos for each user
    console.log('\nVideo counts from database:');
    const video1 = await db.collection('videos').countDocuments({ userId: '685387affa53455d5a791b1b' });
    const video2 = await db.collection('videos').countDocuments({ userId: '6857468c0afa24ede7d75b59' });
    console.log(`  685387affa53455d5a791b1b: ${video1} videos`);
    console.log(`  6857468c0afa24ede7d75b59: ${video2} videos`);

    await client.close();
})();
