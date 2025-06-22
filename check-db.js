const { MongoClient } = require('mongodb');
const url = process.env.DATABASE_URL;
if (!url) {
  console.log('No DATABASE_URL set');
  process.exit(1);
}

async function checkData() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db('vib3');
    
    // Get unique user IDs from videos
    const uniqueUsers = await db.collection('videos').distinct('userId', { status: { $ne: 'deleted' } });
    console.log('Unique users with videos:', uniqueUsers.length);
    console.log('User IDs:', uniqueUsers);
    
    // Get sample videos from different users
    const videos = await db.collection('videos').find({ status: { $ne: 'deleted' } }).limit(10).toArray();
    console.log('\nSample videos:');
    videos.forEach(v => {
      console.log({
        title: v.title,
        userId: v.userId,
        createdAt: v.createdAt,
        videoUrl: v.videoUrl ? 'Present' : 'Missing'
      });
    });
    
    // Check user collection
    const users = await db.collection('users').find({}).toArray();
    console.log('\nTotal users in database:', users.length);
    users.forEach(u => {
      console.log({
        id: u._id.toString(),
        username: u.username,
        email: u.email
      });
    });
    
  } finally {
    await client.close();
  }
}

checkData().catch(console.error);