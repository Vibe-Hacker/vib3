#!/bin/bash

# SSH to production and fix auth routes
ssh -o StrictHostKeyChecking=no root@138.197.89.163 << 'EOF'
cd /opt/vib3

# Backup current server
cp server-optimized.js server-optimized.js.backup

# Add proper auth routes to server-optimized.js
cat > auth-fix.js << 'AUTHFIX'
// Find the line with auth routes and replace with working implementation
const authRoutes = `
// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password and username are required' });
    }
    
    const db = await connectDB();
    
    // Check if user exists
    const existingUser = await db.collection('users').findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      email,
      password: hashedPassword,
      username,
      profilePicture: 'https://i.pravatar.cc/300',
      bio: '',
      followers: [],
      following: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(user);
    user._id = result.insertedId;
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const db = await connectDB();
    
    // Find user
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});
`;

console.log(authRoutes);
AUTHFIX

# Update server-optimized.js with proper auth routes
sed -i '/\/\/ Auth routes/,/^});$/c\
// Auth routes\
app.post("/api/auth/register", async (req, res) => {\
  try {\
    const { email, password, username } = req.body;\
    \
    if (!email || !password || !username) {\
      return res.status(400).json({ error: "Email, password and username are required" });\
    }\
    \
    const db = await connectDB();\
    \
    const existingUser = await db.collection("users").findOne({ \
      $or: [{ email }, { username }] \
    });\
    \
    if (existingUser) {\
      return res.status(400).json({ error: "User already exists" });\
    }\
    \
    const hashedPassword = await bcrypt.hash(password, 10);\
    \
    const user = {\
      email,\
      password: hashedPassword,\
      username,\
      profilePicture: "https://i.pravatar.cc/300",\
      bio: "",\
      followers: [],\
      following: [],\
      createdAt: new Date(),\
      updatedAt: new Date()\
    };\
    \
    const result = await db.collection("users").insertOne(user);\
    user._id = result.insertedId;\
    \
    const token = jwt.sign(\
      { userId: user._id, email: user.email },\
      JWT_SECRET,\
      { expiresIn: "7d" }\
    );\
    \
    res.json({\
      token,\
      user: {\
        id: user._id,\
        email: user.email,\
        username: user.username,\
        profilePicture: user.profilePicture,\
        bio: user.bio\
      }\
    });\
  } catch (error) {\
    console.error("Registration error:", error);\
    res.status(500).json({ error: "Failed to register user" });\
  }\
});\
\
app.post("/api/auth/login", async (req, res) => {\
  try {\
    const { email, password } = req.body;\
    \
    if (!email || !password) {\
      return res.status(400).json({ error: "Email and password are required" });\
    }\
    \
    const db = await connectDB();\
    \
    const user = await db.collection("users").findOne({ email });\
    if (!user) {\
      return res.status(401).json({ error: "Invalid credentials" });\
    }\
    \
    const isValid = await bcrypt.compare(password, user.password);\
    if (!isValid) {\
      return res.status(401).json({ error: "Invalid credentials" });\
    }\
    \
    const token = jwt.sign(\
      { userId: user._id, email: user.email },\
      JWT_SECRET,\
      { expiresIn: "7d" }\
    );\
    \
    res.json({\
      token,\
      user: {\
        id: user._id,\
        email: user.email,\
        username: user.username,\
        profilePicture: user.profilePicture,\
        bio: user.bio\
      }\
    });\
  } catch (error) {\
    console.error("Login error:", error);\
    res.status(500).json({ error: "Login failed" });\
  }\
});' server-optimized.js

# Restart PM2
pm2 restart vib3-optimized
pm2 logs vib3-optimized --lines 20

echo "Auth routes fixed and server restarted"
EOF