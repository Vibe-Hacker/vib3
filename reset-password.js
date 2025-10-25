const { MongoClient } = require('mongodb');
const crypto = require('crypto');

// MongoDB connection string from environment
const mongoUri = process.env.DATABASE_URL || 'mongodb+srv://vib3app:Vib3Pass2025@cluster0.y06bp.mongodb.net/vib3?retryWrites=true&w=majority';

async function resetPassword(email, newPassword) {
    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db('vib3');

        // Find user
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            console.log(`❌ User not found: ${email}`);
            return;
        }

        console.log(`✅ Found user: ${user.username} (${user.email})`);
        console.log(`   Current password hash: ${user.password.substring(0, 16)}...`);

        // Hash new password
        const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

        console.log(`   New password hash: ${hashedPassword.substring(0, 16)}...`);

        // Update password
        const result = await db.collection('users').updateOne(
            { email },
            { $set: { password: hashedPassword, updatedAt: new Date() } }
        );

        if (result.modifiedCount === 1) {
            console.log(`✅ Password reset successful for ${email}`);
            console.log(`   New password: ${newPassword}`);
        } else {
            console.log(`❌ Failed to update password`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

// Get email and password from command line or use hardcoded for tmc363
const email = process.argv[2] || 'tmc363@gmail.com';
const newPassword = process.argv[3] || 'P0pp0p25!';

if (!email || !newPassword) {
    console.log('Usage: node reset-password.js <email> <new-password>');
    console.log('Example: node reset-password.js tmc363@gmail.com P0pp0p25!');
    process.exit(1);
}

console.log(`Resetting password for ${email}`);
console.log(`New password will be: ${newPassword}`);
console.log(`SHA256 hash will be: ${crypto.createHash('sha256').update(newPassword).digest('hex')}`);

resetPassword(email, newPassword);
