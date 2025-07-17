// Test endpoint to serve sample videos for debugging
const express = require('express');
const router = express.Router();

// Sample video data with working test videos
const testVideos = [
    {
        _id: '1',
        userId: 'test-user-1',
        videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
        title: 'Test Video 1 - Big Buck Bunny',
        description: 'Sample video for testing #test #video',
        likes: [],
        createdAt: new Date(),
        user: {
            _id: 'test-user-1',
            username: 'testuser1',
            displayName: 'Test User 1',
            profilePicture: '👤'
        }
    },
    {
        _id: '2',
        userId: 'test-user-2',
        videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
        title: 'Test Video 2 - Sample',
        description: 'Another test video #sample #testing',
        likes: [],
        createdAt: new Date(),
        user: {
            _id: 'test-user-2',
            username: 'testuser2',
            displayName: 'Test User 2',
            profilePicture: '👤'
        }
    },
    {
        _id: '3',
        userId: 'test-user-3',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        title: 'Test Video 3 - For Bigger Blazes',
        description: 'Google sample video #google #sample',
        likes: [],
        createdAt: new Date(),
        user: {
            _id: 'test-user-3',
            username: 'testuser3',
            displayName: 'Test User 3',
            profilePicture: '👤'
        }
    }
];

// Add test video endpoint
router.get('/test-videos', (req, res) => {
    const videos = testVideos.map(v => ({
        ...v,
        likeCount: v.likes.length,
        commentCount: 0,
        shareCount: 0,
        feedType: 'foryou',
        thumbnailUrl: v.videoUrl + '#t=1'
    }));
    
    res.json({ 
        videos: videos,
        totalFound: videos.length,
        isTestData: true,
        message: 'Using test videos for debugging'
    });
});

module.exports = router;