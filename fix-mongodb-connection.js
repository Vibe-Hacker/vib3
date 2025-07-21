// Script to fix MongoDB connection issues
require('dotenv').config();

const dns = require('dns');
const { MongoClient } = require('mongodb');

async function testConnection() {
    console.log('🔍 Testing MongoDB connection...\n');
    
    const srvUrl = process.env.DATABASE_URL || 'mongodb+srv://vib3user:vib3123@cluster0.mongodb.net/vib3?retryWrites=true&w=majority';
    console.log('Current DATABASE_URL:', srvUrl);
    
    // Extract cluster name from SRV URL
    const match = srvUrl.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)/);
    if (!match) {
        console.error('❌ Invalid MongoDB SRV URL format');
        return;
    }
    
    const [, username, password, cluster, dbAndParams] = match;
    console.log('\n📊 Connection details:');
    console.log('- Username:', username);
    console.log('- Password:', password.replace(/./g, '*'));
    console.log('- Cluster:', cluster);
    console.log('- Database:', dbAndParams);
    
    // Try to resolve SRV records
    console.log('\n🌐 Testing DNS resolution...');
    try {
        await new Promise((resolve, reject) => {
            dns.resolveSrv(`_mongodb._tcp.${cluster}`, (err, addresses) => {
                if (err) {
                    console.error('❌ SRV resolution failed:', err.message);
                    reject(err);
                } else {
                    console.log('✅ SRV records found:', addresses.length);
                    addresses.forEach((addr, i) => {
                        console.log(`   ${i + 1}. ${addr.name}:${addr.port} (priority: ${addr.priority}, weight: ${addr.weight})`);
                    });
                    resolve(addresses);
                }
            });
        });
    } catch (error) {
        console.log('\n💡 SRV resolution failed. This is common on some servers.');
        console.log('   You may need to use a standard connection string instead.\n');
        
        // Provide standard connection string format
        console.log('🔧 Try using this standard connection format in your .env file:\n');
        console.log(`DATABASE_URL=mongodb://${username}:${password}@cluster0-shard-00-00.mongodb.net:27017,cluster0-shard-00-01.mongodb.net:27017,cluster0-shard-00-02.mongodb.net:27017/${dbAndParams}&ssl=true&authSource=admin`);
        console.log('\n📝 Note: Replace the shard URLs with your actual MongoDB Atlas shard addresses.');
        console.log('   You can find these in your MongoDB Atlas cluster connection settings.\n');
    }
    
    // Try to connect with current URL
    console.log('🔌 Attempting to connect with current URL...');
    try {
        const client = new MongoClient(srvUrl, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        
        await client.connect();
        console.log('✅ Connection successful!');
        
        // Test database access
        const db = client.db();
        const collections = await db.listCollections().toArray();
        console.log(`📦 Found ${collections.length} collections:`, collections.map(c => c.name).join(', '));
        
        await client.close();
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        
        if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
            console.log('\n🔍 This appears to be a DNS resolution issue.');
            console.log('   Your server cannot resolve MongoDB Atlas SRV records.\n');
            
            console.log('📋 Solutions:');
            console.log('   1. Use a standard connection string (shown above)');
            console.log('   2. Ensure your server can resolve external DNS');
            console.log('   3. Check if your server has DNS restrictions');
            console.log('   4. Try using 8.8.8.8 or 1.1.1.1 as DNS servers\n');
        }
    }
}

// Alternative: Get standard connection string from MongoDB Atlas
console.log('=====================================');
console.log('🔗 MONGODB CONNECTION TROUBLESHOOTER');
console.log('=====================================\n');

testConnection().catch(console.error);