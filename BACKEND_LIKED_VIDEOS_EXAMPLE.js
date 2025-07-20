// Example Node.js/Express endpoint for liked videos
// Add this to your backend server

app.get('/api/user/liked-videos', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // From JWT token
    
    // Find all videos that this user has liked
    // This depends on your database schema
    
    // Option 1: If you have a separate likes table
    const likedVideos = await db.query(`
      SELECT v.* FROM videos v
      INNER JOIN likes l ON v.id = l.video_id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `, [userId]);
    
    // Option 2: If likes are stored as array in video document (MongoDB)
    // const likedVideos = await Video.find({ likes: userId });
    
    // Option 3: If you have a user_liked_videos collection
    // const userLikes = await UserLikes.findOne({ userId });
    // const videoIds = userLikes ? userLikes.videoIds : [];
    // const likedVideos = await Video.find({ _id: { $in: videoIds } });
    
    res.json({ videos: likedVideos });
    
  } catch (error) {
    console.error('Error fetching liked videos:', error);
    res.status(500).json({ error: 'Failed to fetch liked videos' });
  }
});

// Middleware function for authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}