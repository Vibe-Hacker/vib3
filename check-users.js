const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const MONGODB_URI = 'mongodb+srv://vibeadmin:P0pp0p25!@cluster0.y06bp.mongodb.net/vib3?retryWrites=true&w=majority&appName=Cluster0';

async function checkUsers() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('vib3');
        
        // Get all users
        const users = await db.collection('users').find({}).limit(5).toArray();
        console.log('\nExisting users:');
        users.forEach(user => {
            console.log(`- ${user.email} (${user.username})`);
        });
        
        // Test password hash
        const testPassword = 'test123';
        const sha256Hash = crypto.createHash('sha256').update(testPassword).digest('hex');
        console.log('\nSHA256 hash of "test123":', sha256Hash);
        
        // Check if test user exists
        const testUser = await db.collection('users').findOne({ email: 'test@test.com' });
        if (testUser) {
            console.log('\nTest user found:', testUser.email);
            console.log('Password hash matches:', testUser.password === sha256Hash);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkUsers();