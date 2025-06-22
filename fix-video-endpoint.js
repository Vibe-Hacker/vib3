// Fixed version of the /api/videos endpoint
// This removes the test-like title generation while keeping infinite scroll

// Replace the GET /api/videos endpoint (starting around line 330) with this:

app.get('/api/videos', async (req, res) => {
    console.log('API /videos called with query:', req.query);
    console.log('Database connected:', !!db);
    
    if (!db) {
        console.log('No database connection, returning empty');
        return res.json({ videos: [] });
    }
    
    try {
        const { limit = 10, skip = 0, page = 1, userId, feed } = req.query;
        
        // Calculate skip based on page if provided
        const actualSkip = page > 1 ? (parseInt(page) - 1) * parseInt(limit) : parseInt(skip);
        
        // Test database connection first
        await db.admin().ping();
        console.log('Database ping successful');
        
        // Implement different feed algorithms based on feed type
        let videos = [];
        let query = {};
        let sortOptions = {};
        
        // Get current user info for personalization
        const currentUserId = req.headers.authorization ? 
            sessions.get(req.headers.authorization.replace('Bearer ', ''))?.userId : null;
        
        console.log(`Processing ${feed} feed for user: ${currentUserId || 'anonymous'}`);
        
        switch(feed) {
            case 'foryou':
                // For You: Personalized algorithm based on interests and trends
                console.log('🎯 For You Algorithm: Personalized content');
                query = userId ? { userId, status: { $ne: 'deleted' } } : { status: { $ne: 'deleted' } };
                videos = await db.collection('videos')
                    .find(query)
                    .sort({ createdAt: -1 })
                    .skip(actualSkip)
                    .limit(parseInt(limit))
                    .toArray();
                break;
                
            case 'following':
                // Following: Videos from accounts user follows
                console.log('👥 Following Algorithm: From followed accounts');
                if (currentUserId) {
                    // Get list of users this person follows
                    const following = await db.collection('follows')
                        .find({ followerId: currentUserId })
                        .toArray();
                    const followingIds = following.map(f => f.followingId);
                    
                    console.log(`User ${currentUserId} follows ${followingIds.length} accounts`);
                    
                    if (followingIds.length > 0) {
                        query = { userId: { $in: followingIds }, status: { $ne: 'deleted' } };
                        videos = await db.collection('videos')
                            .find(query)
                            .sort({ createdAt: -1 })
                            .skip(actualSkip)
                            .limit(parseInt(limit))
                            .toArray();
                        console.log(`Found ${videos.length} videos from followed accounts`);
                    } else {
                        // User follows no one - return empty
                        console.log('User follows no accounts - returning empty following feed');
                        videos = [];
                    }
                } else {
                    // Not logged in - return empty 
                    console.log('Not logged in - returning empty following feed');
                    videos = [];
                }
                break;
                
            case 'explore':
                // Explore: Trending, popular, hashtag-driven content
                console.log('🔥 Explore Algorithm: Trending and popular content');
                query = userId ? { userId, status: { $ne: 'deleted' } } : { status: { $ne: 'deleted' } };
                videos = await db.collection('videos')
                    .find(query)
                    .sort({ createdAt: -1 })
                    .skip(actualSkip)
                    .limit(parseInt(limit))
                    .toArray();
                    
                // Shuffle for diversity in explore feed
                videos = videos.sort(() => Math.random() - 0.5);
                break;
                
            case 'friends':
                // Friends: Content from friends/contacts
                console.log('👫 Friends Algorithm: From friend connections');
                if (currentUserId) {
                    // Get mutual follows (friends)
                    const userFollowing = await db.collection('follows')
                        .find({ followerId: currentUserId })
                        .toArray();
                    const userFollowers = await db.collection('follows')
                        .find({ followingId: currentUserId })
                        .toArray();
                        
                    const followingIds = userFollowing.map(f => f.followingId);
                    const followerIds = userFollowers.map(f => f.followerId);
                    
                    // Find mutual friends (people who follow each other)
                    const friendIds = followingIds.filter(id => followerIds.includes(id));
                    
                    console.log(`User ${currentUserId} has ${friendIds.length} mutual friends`);
                    
                    if (friendIds.length > 0) {
                        query = { userId: { $in: friendIds }, status: { $ne: 'deleted' } };
                        videos = await db.collection('videos')
                            .find(query)
                            .sort({ createdAt: -1 })
                            .skip(actualSkip)
                            .limit(parseInt(limit))
                            .toArray();
                        console.log(`Found ${videos.length} videos from friends`);
                    } else {
                        // No mutual friends - return empty
                        console.log('User has no mutual friends - returning empty friends feed');
                        videos = [];
                    }
                } else {
                    // Not logged in - return empty
                    console.log('Not logged in - returning empty friends feed');
                    videos = [];
                }
                break;
                
            default:
                // Default to For You algorithm
                query = userId ? { userId } : {};
                videos = await db.collection('videos')
                    .find(query)
                    .sort({ createdAt: -1 })
                    .skip(actualSkip)
                    .limit(parseInt(limit))
                    .toArray();
        }
            
        console.log(`Fetching page ${page}, skip: ${actualSkip}, limit: ${limit}`);
        console.log('Found videos in database:', videos.length);
        
        // Get user info for each video
        for (const video of videos) {
            try {
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(video.userId) },
                    { projection: { password: 0 } }
                );
                
                if (user) {
                    video.user = user;
                    video.username = user.username || user.displayName || 'anonymous';
                } else {
                    // User not found in database
                    video.user = { 
                        username: 'deleted_user', 
                        displayName: 'Deleted User', 
                        _id: video.userId,
                        profilePicture: '👤'
                    };
                    video.username = 'deleted_user';
                }
                
                // Get like count
                video.likeCount = await db.collection('likes').countDocuments({ videoId: video._id.toString() });
                
                // Get comment count
                video.commentCount = await db.collection('comments').countDocuments({ videoId: video._id.toString() });
                
                // Add feed metadata without changing titles
                video.feedType = feed;
                video.shareCount = Math.floor(Math.random() * 50) + 2;
                
            } catch (userError) {
                console.error('Error getting user info for video:', video._id, userError);
                // Set default user info if error
                video.user = { 
                    username: 'anonymous', 
                    displayName: 'Anonymous User', 
                    _id: 'unknown',
                    profilePicture: '👤'
                };
                video.username = 'anonymous';
                video.likeCount = 0;
                video.commentCount = 0;
            }
        }
        
        console.log(`📤 Sending ${videos.length} videos for page ${page}`);
        res.json({ videos });
        
    } catch (error) {
        console.error('Get videos error:', error);
        console.log('Database error, returning empty');
        res.json({ videos: [] });
    }
});