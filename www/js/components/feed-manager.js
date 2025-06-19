// Feed manager module
import { db } from '../firebase-init.js';

class FeedManager {
    constructor() {
        this.isLoadingMore = false;
        this.feedOffset = 0;
        this.init();
    }

    init() {
        console.log('Feed manager initializing...');
        this.setupGlobalFeedFunctions();
    }

    setupGlobalFeedFunctions() {
        // Global feed loading functions
        window.loadAllVideosForFeed = () => this.loadAllVideosForFeed();
        window.loadFollowingFeed = () => this.loadFollowingFeed();
        window.loadDiscoverFeed = () => this.loadDiscoverFeed();
        window.createVideoItemWithUserData = (videoData, videoId, badgeType = null) => 
            this.createVideoItemWithUserData(videoData, videoId, badgeType);
    }

    // Load all videos for the main feed
    async loadAllVideosForFeed() {
        // Show loading state
        if (window.loadingManager) {
            window.loadingManager.showVideoLoading();
        }
        
        try {
            const q = window.query(window.collection(db, 'videos'));
            const querySnapshot = await window.getDocs(q);
            
            const foryouFeed = document.getElementById('foryouFeed');
            
            // Clear existing videos to prevent duplicates
            foryouFeed.innerHTML = '';
            
            if (querySnapshot.empty) {
                // Show empty state when no videos are found
                foryouFeed.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: calc(100vh - 120px); text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                        <div style="font-size: 72px; margin-bottom: 30px;">📱</div>
                        <h2 style="font-size: 24px; margin-bottom: 15px; color: var(--text-primary);">No videos yet!</h2>
                        <p style="font-size: 16px; margin-bottom: 30px; max-width: 300px; line-height: 1.5;">Be the first to share something amazing with the VIB3 community.</p>
                        <button onclick="showUploadModal()" style="padding: 15px 30px; background: var(--accent-primary); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: bold; cursor: pointer; transition: transform 0.2s ease;">
                            📹 Upload First Video
                        </button>
                    </div>
                `;
                return;
            }
            
            if (!querySnapshot.empty) {
                const foryouFeed = document.getElementById('foryouFeed');
                
                // Keep the existing welcome videos and add user videos after
                const videoPromises = [];
                querySnapshot.forEach((doc) => {
                    const videoData = doc.data();
                    const videoId = doc.id;
                    videoPromises.push(this.createVideoItemWithUserData(videoData, videoId));
                });
                
                // Process all videos with proper user data
                Promise.all(videoPromises).then(async videoItems => {
                    // First, add all videos to the DOM
                    videoItems.forEach(videoItem => {
                        if (videoItem) {
                            foryouFeed.appendChild(videoItem);
                        }
                    });
                    
                    // Then, get unique user IDs and initialize follow buttons for each user
                    const uniqueUserIds = new Set();
                    videoItems.forEach(videoItem => {
                        if (videoItem && window.currentUser) {
                            const userId = videoItem.dataset.userId;
                            if (userId !== window.currentUser.uid) {
                                uniqueUserIds.add(userId);
                            }
                        }
                    });
                    
                    // Initialize follow buttons for each unique user (this will update ALL their buttons)
                    for (const userId of uniqueUserIds) {
                        if (window.initializeAllFollowButtonsForUser) {
                            await window.initializeAllFollowButtonsForUser(userId);
                        }
                    }
                    
                    // Load profile pictures for all users
                    if (window.loadAllUsersProfilePics) {
                        await window.loadAllUsersProfilePics();
                    }
                });
            }
            
            // Hide loading state
            if (window.loadingManager) {
                window.loadingManager.hide('video');
            }
        } catch (error) {
            console.error('Error loading feed:', error);
            
            // Hide loading state on error
            if (window.loadingManager) {
                window.loadingManager.hide('video');
            }
        }
    }

    // Load following feed
    async loadFollowingFeed() {
        if (!window.currentUser) {
            const followingFeed = document.getElementById('followingFeed');
            followingFeed.innerHTML = `
                <div style="text-align: center; padding: 80px 20px; color: rgba(255,255,255,0.7);">
                    <div style="font-size: 72px; margin-bottom: 30px;">🔑</div>
                    <h2 style="margin-bottom: 20px; font-size: 28px;">Login to see following!</h2>
                    <p style="font-size: 18px; margin-bottom: 30px; line-height: 1.5;">
                        Sign in to see videos from people you follow
                    </p>
                    <button onclick="showLogin()" style="padding: 15px 30px; font-size: 18px; background: linear-gradient(45deg, #ff006e, #8338ec); color: white; border: none; border-radius: 25px; cursor: pointer;">
                        Login
                    </button>
                </div>
            `;
            return;
        }

        try {
            const followingFeed = document.getElementById('followingFeed');
            followingFeed.innerHTML = '<div class="feed-loading">Loading following videos...</div>';

            // Get list of users the current user is following
            const followingQuery = window.query(
                window.collection(db, 'following'),
                window.where('followerId', '==', window.currentUser.uid)
            );
            const followingSnapshot = await window.getDocs(followingQuery);
            
            if (followingSnapshot.empty) {
                followingFeed.innerHTML = `
                    <div style="text-align: center; padding: 80px 20px; color: rgba(255,255,255,0.7);">
                        <div style="font-size: 72px; margin-bottom: 30px;">👥</div>
                        <h2 style="margin-bottom: 20px; font-size: 28px;">No one followed yet!</h2>
                        <p style="font-size: 18px; margin-bottom: 30px; line-height: 1.5;">
                            Start following creators to see their videos here.
                        </p>
                        <button onclick="switchFeedTab('foryou')" style="padding: 15px 30px; font-size: 18px; background: linear-gradient(45deg, #ff006e, #8338ec); color: white; border: none; border-radius: 25px; cursor: pointer;">
                            Discover Videos
                        </button>
                    </div>
                `;
                return;
            }

            // Get array of followed user IDs
            const followedUserIds = [];
            followingSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.followingId) {
                    followedUserIds.push(data.followingId);
                }
            });

            console.log('Following users:', followedUserIds);

            if (followedUserIds.length === 0) {
                followingFeed.innerHTML = `
                    <div style="text-align: center; padding: 80px 20px; color: rgba(255,255,255,0.7);">
                        <div style="font-size: 72px; margin-bottom: 30px;">📱</div>
                        <h2 style="margin-bottom: 20px; font-size: 28px;">No videos yet!</h2>
                        <p style="font-size: 18px; margin-bottom: 30px; line-height: 1.5;">
                            People you follow haven't posted anything yet.
                        </p>
                        <button onclick="switchFeedTab('foryou')" style="padding: 15px 30px; font-size: 18px; background: linear-gradient(45deg, #ff006e, #8338ec); color: white; border: none; border-radius: 25px; cursor: pointer;">
                            Browse All Videos
                        </button>
                    </div>
                `;
                return;
            }

            // Get videos from followed users
            const videosQuery = window.query(
                window.collection(db, 'videos'),
                window.where('userId', 'in', followedUserIds)
            );
            const videosSnapshot = await window.getDocs(videosQuery);

            if (videosSnapshot.empty) {
                followingFeed.innerHTML = `
                    <div style="text-align: center; padding: 80px 20px; color: rgba(255,255,255,0.7);">
                        <div style="font-size: 72px; margin-bottom: 30px;">📱</div>
                        <h2 style="margin-bottom: 20px; font-size: 28px;">No new videos!</h2>
                        <p style="font-size: 18px; margin-bottom: 30px; line-height: 1.5;">
                            People you follow haven't posted anything yet.
                        </p>
                        <button onclick="switchFeedTab('foryou')" style="padding: 15px 30px; font-size: 18px; background: linear-gradient(45deg, #ff006e, #8338ec); color: white; border: none; border-radius: 25px; cursor: pointer;">
                            Browse All Videos
                        </button>
                    </div>
                `;
                return;
            }

            // Clear feed and add new videos
            followingFeed.innerHTML = '';

            // Process videos with user data
            const videoPromises = [];
            videosSnapshot.forEach((doc) => {
                const videoData = doc.data();
                const videoId = doc.id;
                videoPromises.push(this.createVideoItemWithUserData(videoData, videoId, 'following'));
            });

            // Add videos to feed
            Promise.all(videoPromises).then(async videoItems => {
                videoItems.forEach(videoItem => {
                    if (videoItem) {
                        followingFeed.appendChild(videoItem);
                    }
                });

                // Initialize follow buttons and profile pictures
                const uniqueUserIds = new Set();
                videoItems.forEach(videoItem => {
                    if (videoItem && window.currentUser) {
                        const userId = videoItem.dataset.userId;
                        if (userId !== window.currentUser.uid) {
                            uniqueUserIds.add(userId);
                        }
                    }
                });

                for (const userId of uniqueUserIds) {
                    if (window.initializeAllFollowButtonsForUser) {
                        await window.initializeAllFollowButtonsForUser(userId);
                    }
                }

                if (window.loadAllUsersProfilePics) {
                    await window.loadAllUsersProfilePics();
                }
            });

        } catch (error) {
            console.error('Error loading following feed:', error);
            const followingFeed = document.getElementById('followingFeed');
            followingFeed.innerHTML = `
                <div style="text-align: center; padding: 80px 20px; color: rgba(255,255,255,0.7);">
                    <div style="font-size: 72px; margin-bottom: 30px;">❌</div>
                    <h2 style="margin-bottom: 20px; font-size: 28px;">Error loading videos</h2>
                    <p style="font-size: 18px; margin-bottom: 30px; line-height: 1.5;">
                        Something went wrong. Please try again.
                    </p>
                    <button onclick="loadFollowingFeed()" style="padding: 15px 30px; font-size: 18px; background: linear-gradient(45deg, #ff006e, #8338ec); color: white; border: none; border-radius: 25px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Load discover feed with trending videos and search functionality
    async loadDiscoverFeed() {
        try {
            const discoverFeed = document.getElementById('discoverFeed');
            if (!discoverFeed) return;

            discoverFeed.innerHTML = '<div class="feed-loading">Loading trending videos...</div>';

            // Get all videos
            const videosQuery = window.query(window.collection(db, 'videos'));
            const videosSnapshot = await window.getDocs(videosQuery);

            if (videosSnapshot.empty) {
                discoverFeed.innerHTML = `
                    <div style="text-align: center; padding: 80px 20px; color: rgba(255,255,255,0.7);">
                        <div style="font-size: 72px; margin-bottom: 30px;">📹</div>
                        <h2 style="margin-bottom: 20px; font-size: 28px;">No videos yet!</h2>
                        <p style="font-size: 18px; margin-bottom: 30px; line-height: 1.5;">
                            Be the first to share something amazing.
                        </p>
                        <button onclick="showUploadModal()" style="padding: 15px 30px; font-size: 18px; background: linear-gradient(45deg, #ff006e, #8338ec); color: white; border: none; border-radius: 25px; cursor: pointer;">
                            Upload First Video
                        </button>
                    </div>
                `;
                return;
            }

            // Convert to array and sort by engagement (likes + comments + shares + views)
            const videos = [];
            videosSnapshot.forEach((doc) => {
                const videoData = doc.data();
                const engagement = (videoData.likes?.length || 0) + 
                                (videoData.comments?.length || 0) + 
                                (videoData.shares || 0) + 
                                (videoData.views || 0);
                videos.push({ 
                    id: doc.id, 
                    ...videoData, 
                    engagementScore: engagement 
                });
            });

            // Sort by engagement score (trending)
            videos.sort((a, b) => b.engagementScore - a.engagementScore);

            // Clear feed
            discoverFeed.innerHTML = '';

            // Process videos with user data
            const videoPromises = videos.map(videoData => 
                this.createVideoItemWithUserData(videoData, videoData.id, 'discover')
            );

            // Add videos to feed
            Promise.all(videoPromises).then(async videoItems => {
                videoItems.forEach(videoItem => {
                    if (videoItem) {
                        discoverFeed.appendChild(videoItem);
                    }
                });

                // Initialize follow buttons and profile pictures
                const uniqueUserIds = new Set();
                videoItems.forEach(videoItem => {
                    if (videoItem && window.currentUser) {
                        const userId = videoItem.dataset.userId;
                        if (userId !== window.currentUser.uid) {
                            uniqueUserIds.add(userId);
                        }
                    }
                });

                for (const userId of uniqueUserIds) {
                    if (window.initializeAllFollowButtonsForUser) {
                        await window.initializeAllFollowButtonsForUser(userId);
                    }
                }

                if (window.loadAllUsersProfilePics) {
                    await window.loadAllUsersProfilePics();
                }
            });

        } catch (error) {
            console.error('Error loading discover feed:', error);
            const discoverFeed = document.getElementById('discoverFeed');
            if (discoverFeed) {
                discoverFeed.innerHTML = `
                    <div style="text-align: center; padding: 80px 20px; color: rgba(255,255,255,0.7);">
                        <div style="font-size: 72px; margin-bottom: 30px;">❌</div>
                        <h2 style="margin-bottom: 20px; font-size: 28px;">Error loading videos</h2>
                        <p style="font-size: 18px; margin-bottom: 30px; line-height: 1.5;">
                            Something went wrong. Please try again.
                        </p>
                        <button onclick="loadDiscoverFeed()" style="padding: 15px 30px; font-size: 18px; background: linear-gradient(45deg, #ff006e, #8338ec); color: white; border: none; border-radius: 25px; cursor: pointer;">
                            Retry
                        </button>
                    </div>
                `;
            }
        }
    }

    // Create video item with proper user data
    async createVideoItemWithUserData(videoData, videoId, badgeType = null) {
        try {
            // Get user data from Firestore
            const userQuery = window.query(window.collection(db, 'users'), window.where('uid', '==', videoData.userId));
            const userSnapshot = await window.getDocs(userQuery);
            
            let userData = { displayName: 'Unknown User', username: 'unknown' };
            if (!userSnapshot.empty) {
                userData = userSnapshot.docs[0].data();
            }

            const username = userData.displayName || userData.username || 'Unknown User';
            
            // Use video manager to create the video item if available
            if (window.videoManager && window.videoManager.createVideoItem) {
                return window.videoManager.createVideoItem(
                    { ...videoData, id: videoId }, 
                    userData, 
                    username
                );
            }

            // Fallback: create basic video item structure
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';
            videoItem.dataset.videoId = videoId;
            videoItem.dataset.userId = videoData.userId;
            
            videoItem.innerHTML = `
                <div class="video-container" onclick="toggleVideoPlayback(this)">
                    <video class="video-element" loop playsinline preload="metadata" src="${videoData.videoUrl}" onloadedmetadata="handleVideoMetadata(this)"></video>
                    <div class="video-info">
                        <div class="username">${username}</div>
                        <div class="description">${videoData.description || 'No description'}</div>
                    </div>
                </div>
            `;
            
            return videoItem;
            
        } catch (error) {
            console.error('Error creating video item:', error);
            return null;
        }
    }
}

// Initialize feed manager
const feedManager = new FeedManager();

// Make feed manager globally available
window.feedManager = feedManager;

export default FeedManager;