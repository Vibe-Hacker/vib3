const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://vibeadmin:P0pp0p25!@cluster0.y06bp.mongodb.net/vib3?retryWrites=true&w=majority&appName=Cluster0';

async function deleteTestUser() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('vib3');
        
        // Delete test user
        const result = await db.collection('users').deleteOne({ email: 'test@test.com' });
        console.log('Deleted test user:', result.deletedCount);
        
        // Verify remaining users
        const users = await db.collection('users').find({}).toArray();
        console.log('\nRemaining users:');
        users.forEach(user => {
            console.log(`- ${user.email} (${user.username})`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

deleteTestUser();