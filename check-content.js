const { MongoClient } = require('mongodb');

// MongoDB connection string
const mongoUri = process.env.DATABASE_URL || 'mongodb+srv://vib3app:Vib3Pass2025@cluster0.y06bp.mongodb.net/vib3?retryWrites=true&w=majority';

async function checkContent() {
    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db('vib3');

        // Count users
        const totalUsers = await db.collection('users').countDocuments();
        console.log(`📊 Total Users: ${totalUsers}`);

        // Get users with post counts
        const users = await db.collection('users').find({}).sort({ postsCount: -1 }).limit(10).toArray();
        console.log('\n👥 Top Users by Post Count:');
        users.forEach(user => {
            console.log(`   ${user.username} (@${user.email}): ${user.postsCount || 0} posts, ${user.followersCount || 0} followers`);
        });

        // Count videos
        const totalVideos = await db.collection('videos').countDocuments();
        console.log(`\n🎥 Total Videos: ${totalVideos}`);

        // Get videos by user
        const videosByUser = await db.collection('videos').aggregate([
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]).toArray();

        console.log('\n🎬 Videos by User:');
        for (const group of videosByUser) {
            // Try to find user by matching userId as string
            const user = await db.collection('users').findOne({
                $or: [
                    { _id: group._id },
                    { id: group._id }
                ]
            });
            const username = user ? user.username : group._id.substring(0, 10) + '...';
            console.log(`   ${username}: ${group.count} videos`);
        }

        // Get sample of recent videos
        const recentVideos = await db.collection('videos').find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        console.log('\n📹 Recent Videos:');
        for (const video of recentVideos) {
            // Try to find user by matching userId
            const user = await db.collection('users').findOne({
                $or: [
                    { _id: video.userId },
                    { id: video.userId }
                ]
            });
            const username = user ? user.username : (video.userId ? video.userId.substring(0, 10) + '...' : 'Unknown');
            const title = video.title || video.description || video.caption || 'Untitled';
            const titleShort = title.length > 50 ? title.substring(0, 50) + '...' : title;
            console.log(`   "${titleShort}" by ${username}`);
            console.log(`      Likes: ${video.likes || 0}, Views: ${video.views || 0}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

checkContent();
