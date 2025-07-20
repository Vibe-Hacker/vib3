const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://vibeadmin:P0pp0p25!@cluster0.y06bp.mongodb.net/vib3?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  profilePicture: { type: String, default: '' },
  bio: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

async function fixAuth() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', userSchema);

    // Create a test user
    const testEmail = 'test@test.com';
    const testPassword = 'test123';
    const testUsername = 'testuser';

    // Check if user exists
    let user = await User.findOne({ email: testEmail });
    
    if (!user) {
      // Create new user
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      user = new User({
        email: testEmail,
        password: hashedPassword,
        username: testUsername,
        profilePicture: 'https://i.pravatar.cc/300',
        bio: 'Test user account'
      });
      await user.save();
      console.log('Test user created');
    } else {
      // Update existing user's password
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      user.password = hashedPassword;
      await user.save();
      console.log('Test user password updated');
    }

    // Test login
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log('Password validation:', isValid);

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('Generated token:', token);

    // Close connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAuth();