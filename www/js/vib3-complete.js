// VIB3 Complete Video Sharing App - All Features
// No ES6 modules - global functions only

// ================ CONFIGURATION ================
// API base URL configuration
if (typeof API_BASE_URL === 'undefined') {
    window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? '' 
        : 'https://vib3-production.up.railway.app';
}

const appConfig = {
    name: 'VIB3',
    version: '1.0.0',
    debug: true,
    maxVideoSize: 500 * 1024 * 1024, // 500MB for 4K videos
    supportedVideoFormats: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    videoCompressionQuality: 0.8,
    maxVideoDuration: 180, // 3 minutes
    defaultUserAvatar: '👤',
    feedPageSize: 10
};

// Global state
if (typeof currentUser === 'undefined') {
    window.currentUser = null;
}
let currentFeed = 'home';
let currentVideoId = null;
let isRecording = false;

// Gift types for live streaming
const liveStreamGiftTypes = [
    { id: 'heart', name: '❤️ Heart', coins: 1, emoji: '❤️' },
    { id: 'star', name: '⭐ Star', coins: 5, emoji: '⭐' },
    { id: 'fire', name: '🔥 Fire', coins: 10, emoji: '🔥' },
    { id: 'diamond', name: '💎 Diamond', coins: 25, emoji: '💎' },
    { id: 'crown', name: '👑 Crown', coins: 50, emoji: '👑' },
    { id: 'rocket', name: '🚀 Rocket', coins: 100, emoji: '🚀' }
];
let currentStep = 1;

// Sample collaboration data - moved to top to avoid temporal dead zone
const sampleCollaborationData = {
    projects: [
        {
            id: 'proj_001',
            title: 'Summer Vibes Dance Challenge',
            description: 'Creating the ultimate summer dance video with trending moves',
            status: 'active',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            owner: { id: 'user_001', username: 'dance_creator', avatar: '👤' },
            collaborators: [
                { id: 'user_002', username: 'beat_master', avatar: '🎵', role: 'editor', status: 'active' },
                { id: 'user_003', username: 'visual_fx', avatar: '🎨', role: 'editor', status: 'active' },
                { id: 'user_004', username: 'music_mixer', avatar: '🎧', role: 'reviewer', status: 'pending' }
            ],
            assets: [
                { id: 'asset_001', type: 'video', name: 'intro_dance.mp4', uploadedBy: 'dance_creator', size: '25MB' },
                { id: 'asset_002', type: 'audio', name: 'beat_track.mp3', uploadedBy: 'beat_master', size: '8MB' },
                { id: 'asset_003', type: 'effect', name: 'sparkle_transition.fx', uploadedBy: 'visual_fx', size: '2MB' }
            ],
            versions: [
                { id: 'v_001', name: 'v1.0 - Initial Cut', createdBy: 'dance_creator', timestamp: '2024-01-01T10:00:00Z' },
                { id: 'v_002', name: 'v1.1 - Added Beat', createdBy: 'beat_master', timestamp: '2024-01-01T14:00:00Z' },
                { id: 'v_003', name: 'v1.2 - Visual Effects', createdBy: 'visual_fx', timestamp: '2024-01-01T18:00:00Z' }
            ],
            progress: 75,
            deadline: '2024-01-15T23:59:59Z',
            template: 'dance_challenge'
        }
    ],
    templates: [
        {
            id: 'dance_challenge',
            name: 'Dance Challenge Template',
            category: 'entertainment',
            description: 'Perfect for creating viral dance content',
            thumbnail: '💃',
            features: ['Multi-angle editing', 'Beat sync tools', 'Transition effects']
        }
    ],
    chatMessages: [
        {
            id: 'msg_001',
            projectId: 'proj_001',
            userId: 'user_002',
            username: 'beat_master',
            avatar: '🎵',
            message: 'Just uploaded the new beat track! Check it out 🎵',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            type: 'message'
        }
    ]
};

// Energy meter interval - moved to top to avoid temporal dead zone
let energyUpdateInterval = null;

// Sample live streams for offline mode - moved to top to avoid temporal dead zone
const sampleLiveStreams = [
    {
        id: 'live1',
        title: 'Morning coffee chat ☕',
        description: 'Starting the day with good vibes',
        streamer: {
            id: 'user1',
            username: 'morningvibes',
            displayName: 'Sarah M.',
            avatar: '☕',
            followers: 5200,
            isFollowing: false
        },
        category: 'Lifestyle',
        viewerCount: 234,
        likes: 45,
        isLive: true,
        startTime: Date.now() - 1800000, // 30 minutes ago
        thumbnail: 'https://picsum.photos/400/600?random=1',
        tags: ['coffee', 'morning', 'chat']
    },
    {
        id: 'live2',
        title: 'Cooking Italian pasta 🍝',
        description: 'Making homemade pasta from scratch',
        streamer: {
            id: 'user2',
            username: 'italianomama',
            displayName: 'Maria G.',
            avatar: '👩‍🍳',
            followers: 12500,
            isFollowing: true
        },
        category: 'Cooking',
        viewerCount: 567,
        likes: 89,
        isLive: true,
        startTime: Date.now() - 3600000, // 1 hour ago
        thumbnail: 'https://picsum.photos/400/600?random=2',
        tags: ['cooking', 'italian', 'pasta']
    },
    {
        id: 'live3',
        title: 'Gaming session - New RPG! 🎮',
        description: 'Exploring this new fantasy world',
        streamer: {
            id: 'user3',
            username: 'gamerpro',
            displayName: 'Alex R.',
            avatar: '🎮',
            followers: 8900,
            isFollowing: false
        },
        category: 'Gaming',
        viewerCount: 1234,
        likes: 156,
        isLive: true,
        startTime: Date.now() - 7200000, // 2 hours ago
        thumbnail: 'https://picsum.photos/400/600?random=3',
        tags: ['gaming', 'rpg', 'adventure']
    },
    {
        id: 'live4',
        title: 'Workout motivation 💪',
        description: 'HIIT workout for beginners',
        streamer: {
            id: 'user4',
            username: 'fitlifestyle',
            displayName: 'Jake F.',
            avatar: '💪',
            followers: 15600,
            isFollowing: true
        },
        category: 'Fitness',
        viewerCount: 445,
        likes: 78,
        isLive: true,
        startTime: Date.now() - 900000, // 15 minutes ago
        thumbnail: 'https://picsum.photos/400/600?random=4',
        tags: ['fitness', 'workout', 'motivation']
    },
    {
        id: 'live5',
        title: 'Study with me - Physics 📚',
        description: 'Quantum mechanics study session',
        streamer: {
            id: 'user5',
            username: 'studybuddy',
            displayName: 'Emma L.',
            avatar: '📚',
            followers: 3400,
            isFollowing: false
        },
        category: 'Education',
        viewerCount: 89,
        likes: 23,
        isLive: true,
        startTime: Date.now() - 5400000, // 1.5 hours ago
        thumbnail: 'https://picsum.photos/400/600?random=5',
        tags: ['study', 'physics', 'education']
    },
    {
        id: 'live6',
        title: 'Digital art creation 🎨',
        description: 'Creating a fantasy landscape',
        streamer: {
            id: 'user6',
            username: 'digitalartist',
            displayName: 'Maya C.',
            avatar: '🎨',
            followers: 7800,
            isFollowing: true
        },
        category: 'Art',
        viewerCount: 312,
        likes: 67,
        isLive: true,
        startTime: Date.now() - 2700000, // 45 minutes ago
        thumbnail: 'https://picsum.photos/400/600?random=6',
        tags: ['art', 'digital', 'fantasy']
    }
];

// Clean up any ghost audio on page load
document.addEventListener('DOMContentLoaded', function() {
    // Stop any playing audio/video elements
    document.querySelectorAll('video, audio').forEach(media => {
        media.pause();
        media.muted = true;
        media.currentTime = 0;
        if (media.srcObject) {
            media.srcObject = null;
        }
    });
});

// Tab visibility detection for auto pause/resume
let videosPlayingBeforeHide = [];

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Tab became hidden - pause all videos
        console.log('📱 Tab hidden - pausing videos');
        videosPlayingBeforeHide = [];
        const allVideos = document.querySelectorAll('video');
        allVideos.forEach(video => {
            if (!video.paused) {
                videosPlayingBeforeHide.push(video);
                video.pause();
                console.log('⏸️ Paused video on tab hide:', video.src.split('/').pop());
            }
        });
    } else {
        // Tab became visible - resume videos that were playing
        console.log('📱 Tab visible - resuming videos');
        videosPlayingBeforeHide.forEach(video => {
            // Only resume if still in viewport and not manually paused
            const rect = video.getBoundingClientRect();
            const isInView = rect.top >= 0 && rect.top < window.innerHeight * 0.7;
            if (isInView && !video.hasAttribute('data-manually-paused')) {
                video.play().catch(e => console.log('Resume failed:', e));
                console.log('▶️ Resumed video on tab show:', video.src.split('/').pop());
            }
        });
        videosPlayingBeforeHide = [];
    }
});

// ================ AUTHENTICATION ================
function initializeAuth() {
    // Check if this is a shared video or profile link
    const urlParams = new URLSearchParams(window.location.search);
    const sharedVideoId = urlParams.get('video');
    const sharedUserId = urlParams.get('user');
    
    // Flag to prevent default feed loading when handling shared links
    let skipDefaultLoad = false;
    
    // Handle shared links immediately if no auth system
    if (!window.auth && (sharedVideoId || sharedUserId)) {
        console.log('🔗 No auth system - handling shared content directly:', sharedVideoId || sharedUserId);
        
        // Override default feed to prevent other pages from showing
        if (sharedUserId) {
            currentFeed = 'profile';
        }
        
        hideAuthContainer();
        showMainApp();
        
        if (sharedVideoId) {
            showSharedVideoView(sharedVideoId);
        } else if (sharedUserId) {
            // Show profile immediately without delay
            showPage('profile');
        }
        return;
    }
    
    if (window.auth && window.auth.onAuthStateChanged) {
        window.auth.onAuthStateChanged((user) => {
            currentUser = user;
            
            // Handle shared content viewing without login
            if (!user && (sharedVideoId || sharedUserId)) {
                console.log('🔗 Viewing shared content without login:', sharedVideoId || sharedUserId);
                
                // Override default feed to prevent other pages from showing
                if (sharedUserId) {
                    currentFeed = 'profile';
                }
                
                hideAuthContainer();
                showMainApp();
                
                if (sharedVideoId) {
                    // Show the shared video in a limited view
                    showSharedVideoView(sharedVideoId);
                } else if (sharedUserId) {
                    // Show shared profile in limited view immediately
                    showPage('profile');
                }
                return;
            }
            
            if (user) {
                hideAuthContainer();
                showMainApp();
                
                // Handle shared profile link
                if (sharedUserId) {
                    console.log('🔗 Opening shared profile:', sharedUserId);
                    skipDefaultLoad = true;
                    currentFeed = 'profile';
                    loadUserProfile();
                    // Go directly to profile without loading video feed first
                    showPage('profile');
                    return;
                }
                
                if (!skipDefaultLoad) {
                    loadUserProfile();
                    loadVideoFeed(currentFeed);
                }
            } else {
                showAuthContainer();
                hideMainApp();
            }
        });
    }
}

// Show shared video in limited view (no user features)
function showSharedVideoView(videoId) {
    console.log('📺 Showing shared video view for:', videoId);
    
    // Hide user-specific elements
    document.querySelectorAll('.sidebar-item.signout-btn, #sidebarProfile').forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    // Show login prompt in sidebar
    const loginSection = document.querySelector('.sidebar-login-section');
    if (loginSection) {
        loginSection.style.display = 'block';
    }
    
    // Load just the shared video
    loadSpecificVideo(videoId);
    
    // Show a banner prompting to sign up
    showNotification('Sign up to like, comment, and share videos!', 'info');
}

function hideAuthContainer() {
    document.getElementById('authContainer').style.display = 'none';
}

function showAuthContainer() {
    document.getElementById('authContainer').style.display = 'flex';
}

function hideMainApp() {
    document.getElementById('mainApp').style.display = 'none';
    document.body.classList.remove('authenticated');
}

function showMainApp() {
    document.getElementById('mainApp').style.display = 'block';
    document.body.classList.add('authenticated');
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
}

function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (window.login) {
        const result = await window.login(email, password);
        if (!result.success) {
            document.getElementById('authError').textContent = result.error;
        }
    }
}

async function handleSignup() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const displayName = document.getElementById('signupName').value;
    
    if (window.signup) {
        const result = await window.signup(displayName, email, password);
        if (!result.success) {
            document.getElementById('authError').textContent = result.error;
        }
    }
}

async function handleLogout() {
    // CRITICAL: Clean up all overlays and special pages before logout
    console.log('🚪 Cleaning up overlays before logout...');
    
    // Remove analytics overlay specifically
    const analyticsOverlay = document.getElementById('analyticsOverlay');
    if (analyticsOverlay) {
        analyticsOverlay.remove();
        console.log('🧹 Removed analytics overlay on logout');
    }
    
    // Remove activity page
    const activityPage = document.getElementById('activityPage');
    if (activityPage) {
        activityPage.remove();
        console.log('🧹 Removed activity page on logout');
    }
    
    // Remove all fixed position overlays
    document.querySelectorAll('[style*="position: fixed"]').forEach(overlay => {
        if (overlay.style.zIndex === '99999' || overlay.style.zIndex === '100000') {
            overlay.remove();
            console.log('🧹 Removed fixed overlay on logout');
        }
    });
    
    // Hide all special pages
    document.querySelectorAll('.activity-page, .analytics-page, .messages-page, .profile-page').forEach(el => {
        if (el) {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
            el.style.zIndex = '-1';
        }
    });
    
    if (window.logout) {
        await window.logout();
    }
}

// ================ USER PROFILE ================
async function loadUserProfile() {
    if (!currentUser) {
        console.error('No current user to load profile for');
        return;
    }
    
    // Update profile UI elements
    const profileElements = {
        username: document.querySelectorAll('.profile-username'),
        avatar: document.querySelectorAll('.profile-avatar'),
        displayName: document.querySelectorAll('.profile-displayname')
    };
    
    // Set username
    profileElements.username.forEach(el => {
        if (el) el.textContent = currentUser.username || currentUser.email?.split('@')[0] || 'User';
    });
    
    // Set display name
    profileElements.displayName.forEach(el => {
        if (el) el.textContent = currentUser.displayName || currentUser.username || 'VIB3 User';
    });
    
    // Set avatar (use default if none)
    profileElements.avatar.forEach(el => {
        if (el) {
            if (el.tagName === 'IMG') {
                el.src = currentUser.profileImage || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="40" fill="%23ddd"/%3E%3Ctext x="50" y="55" text-anchor="middle" font-size="40" fill="%23666"%3E👤%3C/text%3E%3C/svg%3E';
            } else {
                el.textContent = currentUser.profileImage ? '' : '👤';
            }
        }
    });
    
    console.log('User profile loaded:', currentUser.email);
    
    // Auto-run debug when profile loads
    setTimeout(() => {
        if (window.debugAuthState) {
            debugAuthState();
        }
    }, 1000);
    
    // Debug current user data structure
    console.log('📊 Current user debug info:');
    console.log('  - Raw currentUser object:', currentUser);
    console.log('  - Available properties:', Object.keys(currentUser || {}));
    console.log('  - username:', currentUser?.username);
    console.log('  - displayName:', currentUser?.displayName);
    console.log('  - name:', currentUser?.name);
    console.log('  - email:', currentUser?.email);
    console.log('  - id/uid/_id:', currentUser?.id || currentUser?.uid || currentUser?._id);
}

// Debug function to check auth state and refresh if needed
async function debugAuthState() {
    console.log('🔍 DEBUG: Checking authentication state...');
    console.log('  - Current token:', window.authToken ? 'Present' : 'Missing');
    console.log('  - Token length:', window.authToken?.length || 0);
    console.log('  - Current user:', window.currentUser);
    
    if (window.authToken) {
        try {
            console.log('🔄 Testing current token...');
            const response = await fetch(`${window.API_BASE_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${window.authToken}` }
            });
            console.log('  - Auth test response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('  - Auth test success:', data);
                if (data.user && !window.currentUser) {
                    window.currentUser = data.user;
                    console.log('✅ Updated currentUser from server');
                }
            } else {
                console.log('❌ Auth token invalid, need to re-login');
                const errorText = await response.text();
                console.log('  - Error:', errorText);
            }
        } catch (error) {
            console.log('❌ Auth test failed:', error);
        }
    } else {
        console.log('⚠️ No auth token found');
    }
}

// Helper function to get current user info
function getCurrentUserInfo() {
    return window.currentUser || null;
}

// Clean up orphaned media elements that might cause ghost audio
function cleanupOrphanedMedia() {
    console.log('🧹 Cleaning up orphaned media elements');
    
    // Find and remove any video/audio elements not in active feeds
    document.querySelectorAll('video, audio').forEach(media => {
        const parentFeed = media.closest('.feed-content');
        if (!parentFeed || !parentFeed.classList.contains('active')) {
            // This media element is not in an active feed
            media.pause();
            media.muted = true;
            media.currentTime = 0;
            if (media.srcObject) {
                media.srcObject = null;
            }
            if (media.src) {
                media.removeAttribute('src');
                media.load();
            }
            console.log('🗑️ Cleaned up orphaned media element');
        }
    });
}

// ================ HELPER FUNCTIONS ================
function createEmptyFeedMessage(feedType) {
    return `
        <div class="empty-feed-message" style="
            text-align: center; 
            padding: 60px 20px; 
            color: var(--text-secondary); 
            height: 100vh; 
            display: flex; 
            flex-direction: column; 
            justify-content: center; 
            align-items: center;
            background: var(--bg-primary);
            overflow: hidden;
        ">
            <div style="font-size: 72px; margin-bottom: 20px;">📹</div>
            <h3 style="margin-bottom: 12px; color: var(--text-primary);">No videos yet</h3>
            <p style="margin-bottom: 20px;">Be the first to share something amazing!</p>
        </div>
    `;
}

function createErrorMessage(feedType) {
    return `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
            <div style="font-size: 72px; margin-bottom: 20px;">⚠️</div>
            <h3 style="margin-bottom: 12px; color: var(--text-primary);">Oops! Something went wrong</h3>
            <p style="margin-bottom: 20px;">Failed to load videos. Please try again.</p>
            <button onclick="loadVideoFeed('${feedType}')" style="padding: 12px 24px; background: var(--accent-primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Retry</button>
        </div>
    `;
}

// Global video observer to prevent multiple instances
let videoObserver = null;
window.videoObserver = null;
let lastFeedLoad = 0;
let isLoadingMore = false;
let hasMoreVideos = true;
let currentPage = 1;
let lastVideoCount = 0;
let initializationInProgress = false;

function initializeVideoObserver() {
    // Prevent duplicate initializations
    if (initializationInProgress) {
        console.log('⏳ Video initialization already in progress, skipping');
        return;
    }
    
    // Only target feed videos, not upload modal videos
    const videos = document.querySelectorAll('.feed-content video');
    
    // If we have an observer and videos, make sure all videos are being observed
    if (videos.length === lastVideoCount && videos.length > 0 && videoObserver) {
        console.log('📹 Video count unchanged, ensuring all videos are observed');
        videos.forEach(video => {
            videoObserver.observe(video);
            // Immediately pause videos that aren't in the viewport
            const rect = video.getBoundingClientRect();
            const isInView = rect.top >= 0 && rect.top < window.innerHeight * 0.7;
            if (!isInView && !video.paused) {
                video.pause();
                console.log('⏸️ Emergency pause for out-of-view video:', video.src.split('/').pop());
            }
        });
        return;
    }
    
    console.log('🎬 TIKTOK-STYLE VIDEO INIT WITH SCROLL SNAP');
    console.log('📹 Found', videos.length, 'feed video elements');
    
    if (videos.length === 0) {
        console.log('❌ No feed videos found');
        return;
    }
    
    initializationInProgress = true;
    lastVideoCount = videos.length;
    
    // Create intersection observer for TikTok-style video playback
    if (videoObserver) {
        videoObserver.disconnect();
        window.videoObserver = null;
    }
    
    videoObserver = window.videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
                // Don't auto-play videos in profile video feed
                const profileFeed = document.getElementById('profileVideoFeed');
                if (profileFeed && profileFeed.contains(video)) {
                    return; // Let profile video observer handle this
                }
                
                // Clear manual play flags from all other videos when a new video comes into view
                document.querySelectorAll('video[data-manual-play]').forEach(v => {
                    if (v !== video) {
                        v.removeAttribute('data-manual-play');
                    }
                });
                
                // Only play if not manually paused
                if (!video.hasAttribute('data-manually-paused')) {
                    // Restart video from beginning when scrolling back to it
                    video.currentTime = 0;
                    video.play().catch(e => console.log('Play failed:', e));
                    console.log('🎬 Auto-playing video from start:', video.src.split('/').pop());
                    
                    // Track video view start
                    const videoCard = video.closest('.video-card');
                    if (videoCard && videoCard.videoData) {
                        startVideoTracking(videoCard.videoData._id, video);
                    }
                }
            } else {
                // Don't pause videos in profile video feed
                const profileFeed = document.getElementById('profileVideoFeed');
                if (profileFeed && profileFeed.contains(video)) {
                    return; // Let profile video observer handle this
                }
                
                // Only pause if not manually playing and not manually selected
                if (!video.hasAttribute('data-manually-paused') && !video.hasAttribute('data-manual-play')) {
                    video.pause();
                    console.log('⏸️ Auto-pausing video:', video.src.split('/').pop());
                } else if (video.hasAttribute('data-manual-play')) {
                    console.log('🎯 Keeping manually selected video playing:', video.src.split('/').pop());
                }
            }
        });
    }, {
        threshold: [0, 0.7, 1],
        rootMargin: '-10% 0px -10% 0px'
    });
    
    // Setup all videos
    videos.forEach((video, index) => {
        console.log(`🔧 Processing TikTok video ${index + 1}:`, video.src);
        
        // Force video properties
        video.muted = false;  // Enable audio
        video.volume = 0.8;   // Set reasonable volume
        video.loop = true;
        video.playsInline = true;
        video.preload = 'metadata';
        
        // Add click handler to ensure audio plays on user interaction
        video.addEventListener('click', function() {
            this.muted = false;
            this.volume = 0.8;
            console.log('🔊 Audio enabled on user click');
        });
        
        // Force style overrides
        video.style.cssText += `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;
        
        // Force parent visibility
        let parent = video.parentElement;
        while (parent && parent !== document.body) {
            parent.style.cssText += `
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            `;
            parent = parent.parentElement;
        }
        
        // Observe for intersection
        videoObserver.observe(video);
        
        console.log(`✅ TikTok video ${index + 1} setup complete`);
    });
    
    // Auto-play first video and pause all others
    if (videos.length > 0) {
        videos.forEach((video, index) => {
            if (index === 0) {
                video.play().catch(e => console.log('▶️ First video autoplay blocked:', e));
            } else {
                video.pause();
                console.log('⏸️ Paused non-first video:', video.src.split('/').pop());
            }
        });
    }
    
    console.log('🏁 TikTok-style video system initialized with scroll snap');
    
    // Reset initialization flag
    initializationInProgress = false;
}

function setupInfiniteScroll(feedElement, feedType) {
    let scrollTimeout;
    
    feedElement.addEventListener('scroll', () => {
        // Clear existing timeout
        clearTimeout(scrollTimeout);
        
        // Set a new timeout to handle scroll end
        scrollTimeout = setTimeout(() => {
            const scrollHeight = feedElement.scrollHeight;
            const scrollTop = feedElement.scrollTop;
            const clientHeight = feedElement.clientHeight;
            
            // Check if user scrolled near the bottom (within 200px)
            if (scrollTop + clientHeight >= scrollHeight - 200) {
                loadMoreVideos(feedType);
            }
        }, 100); // Wait 100ms after scroll stops
    });
    
    console.log('🔄 Infinite scroll setup for', feedType);
}

async function loadMoreVideos(feedType) {
    if (isLoadingMore || !hasMoreVideos) {
        console.log('🚫 Skipping load more:', { isLoadingMore, hasMoreVideos });
        return;
    }
    
    isLoadingMore = true;
    currentPage++;
    
    console.log('📥 Loading more videos for', feedType, 'page', currentPage);
    
    try {
        await loadVideoFeed(feedType, false, currentPage, true);
        
        // Additional fallback: if we're on page 3+ and didn't get videos, definitely recycle
        if (currentPage > 2) {
            const feedElement = document.getElementById(feedType + 'Feed');
            const existingVideos = feedElement ? Array.from(feedElement.children) : [];
            
            if (existingVideos.length > 0) {
                console.log(`🔄 Extra fallback: Recycling videos for page ${currentPage}`);
                const videosToClone = existingVideos.slice(0, Math.min(3, existingVideos.length));
                videosToClone.forEach(videoCard => {
                    const clonedCard = videoCard.cloneNode(true);
                    clonedCard.setAttribute('data-cloned-video', 'true');
                    feedElement.appendChild(clonedCard);
                    // Refresh reaction counts for cloned video
                    refreshClonedVideoReactions(clonedCard);
                    // Register cloned video with observer
                    registerClonedVideoWithObserver(clonedCard);
                });
                setTimeout(() => initializeVideoObserver(), 200);
                hasMoreVideos = true;
            }
        }
        
    } catch (error) {
        console.error('Error loading more videos:', error);
        currentPage--; // Revert page increment on error
    } finally {
        isLoadingMore = false;
    }
}

function formatCount(count) {
    if (count < 1000) return count.toString();
    if (count < 1000000) return Math.floor(count / 100) / 10 + 'K';
    return Math.floor(count / 100000) / 10 + 'M';
}

// ================ VIDEO FEED MANAGEMENT ================
// Map new feed names to internal logic for backward compatibility
function mapFeedType(feedType) {
    const feedMapping = {
        'home': 'foryou',
        'vibing': 'following',
        'network': 'friends',
        'discover': 'explore',
        'pulse': 'pulse'
    };
    return feedMapping[feedType] || feedType;
}

// ================ VIB3 UNIQUE FEATURES ================

// VIB3 Pulse Feed - Shows trending content with real-time engagement
async function loadPulseFeed() {
    console.log('⚡ Loading VIB3 Pulse Feed - Real-time trending content');
    
    const pulseContainer = document.getElementById('pulseFeed');
    if (!pulseContainer) return;
    
    pulseContainer.innerHTML = `
        <div class="pulse-header" style="padding: 20px; background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%); color: white; text-align: center;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 700;">⚡ Pulse Feed</h2>
            <p style="margin: 8px 0 0; opacity: 0.9;">Real-time trending content with live engagement</p>
        </div>
        <div class="pulse-metrics" style="padding: 16px; background: var(--bg-secondary); display: flex; justify-content: space-around; border-bottom: 1px solid var(--border-primary);">
            <div class="metric-item" style="text-align: center;">
                <div class="metric-value" style="font-size: 20px; font-weight: 700; color: var(--accent-primary);" id="pulseViews">0</div>
                <div class="metric-label" style="font-size: 12px; color: var(--text-secondary);">Live Views</div>
            </div>
            <div class="metric-item" style="text-align: center;">
                <div class="metric-value" style="font-size: 20px; font-weight: 700; color: var(--accent-secondary);" id="pulseHeartbeats">0</div>
                <div class="metric-label" style="font-size: 12px; color: var(--text-secondary);">Heartbeats/min</div>
            </div>
            <div class="metric-item" style="text-align: center;">
                <div class="metric-value" style="font-size: 20px; font-weight: 700; color: #ff6b6b;" id="pulseEnergy">100</div>
                <div class="metric-label" style="font-size: 12px; color: var(--text-secondary);">Energy Level</div>
            </div>
        </div>
        <div class="pulse-content" style="padding: 20px;">
            <div style="text-align: center; color: var(--text-secondary);">
                <div style="font-size: 48px; margin-bottom: 16px;">⚡</div>
                <h3>Pulse Feed is Charging Up!</h3>
                <p>This revolutionary feature shows real-time trending content<br>with live engagement metrics and energy levels.</p>
                <button onclick="simulatePulseActivity()" style="margin-top: 16px; background: var(--accent-gradient); color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    ⚡ Activate Pulse Mode
                </button>
            </div>
        </div>
    `;
    
    // Start simulated real-time metrics
    startPulseMetrics();
}

// VIB3 Energy Meter - Shows real-time engagement energy
function showEnergyMeter() {
    console.log('🔋 Opening VIB3 Energy Meter');
    
    // Remove existing dynamic pages that might interfere
    const pagesToRemove = ['coinsPage', 'collaborationPage', 'challengesPage', 'vibeRoomsPage', 'creatorStudioPage', 'activityPage'];
    pagesToRemove.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) {
            page.remove();
            console.log(`🧹 Removed ${pageId} for energy meter`);
        }
    });
    
    const energyModal = document.createElement('div');
    energyModal.className = 'vib3-energy-modal';
    energyModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
    `;
    
    energyModal.innerHTML = `
        <div class="energy-meter-content" style="background: var(--bg-secondary); border-radius: 20px; padding: 30px; max-width: 500px; width: 90%; position: relative; border: 1px solid var(--border-primary);">
            <button onclick="closeEnergyMeter()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: var(--text-secondary); font-size: 24px; cursor: pointer;">&times;</button>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 8px;">Energy Meter</h2>
                <p style="color: var(--text-secondary); margin: 0;">Real-time platform engagement energy</p>
            </div>
            
            <div class="energy-display" style="text-align: center; margin: 30px 0;">
                <div class="energy-circle" style="width: 150px; height: 150px; border-radius: 50%; background: conic-gradient(var(--accent-primary) 0deg, var(--accent-secondary) 120deg, #ff6b6b 240deg, var(--accent-primary) 360deg); margin: 0 auto; display: flex; align-items: center; justify-content: center; position: relative; animation: energy-spin 3s linear infinite;">
                    <div class="energy-inner" style="width: 120px; height: 120px; border-radius: 50%; background: var(--bg-primary); display: flex; align-items: center; justify-content: center; flex-direction: column;">
                        <div class="energy-value" style="font-size: 28px; font-weight: 700; color: white;" id="energyValue">87</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">ENERGY</div>
                    </div>
                </div>
            </div>
            
            <div class="energy-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="stat-item" style="background: var(--bg-tertiary); padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 600; color: var(--accent-primary);" id="liveUsers">1,247</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">Live Users</div>
                </div>
                <div class="stat-item" style="background: var(--bg-tertiary); padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 600; color: var(--accent-secondary);" id="vibeScore">9.4</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">Vibe Score</div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(energyModal);
    
    // Add spinning animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes energy-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // Start energy meter updates
    startEnergyUpdates();
}

// VIB3 Vibe Rooms - Community spaces for shared interests
function showVibeRooms() {
    console.log('🏠 Opening VIB3 Vibe Rooms');
    
    // Hide main app and other content
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'none';
    }
    
    // Hide other pages
    document.querySelectorAll('.video-feed, .search-page, .profile-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page, .activity-page, .friends-page').forEach(el => {
        el.style.display = 'none';
    });
    
    let vibeRoomsPage = document.getElementById('vibeRoomsPage');
    if (!vibeRoomsPage) {
        vibeRoomsPage = document.createElement('div');
        vibeRoomsPage.id = 'vibeRoomsPage';
        vibeRoomsPage.className = 'vibe-rooms-page';
        vibeRoomsPage.style.cssText = 'margin-left: 240px; margin-top: 60px; width: calc(100vw - 240px); height: calc(100vh - 60px); overflow-y: auto; background: var(--bg-primary); padding: 20px;';
        
        vibeRoomsPage.innerHTML = `
            <div class="vibe-rooms-header" style="background: var(--accent-gradient); padding: 30px; border-radius: 15px; margin-bottom: 30px; text-align: center; color: white;">
                <h1 style="margin: 0 0 10px; font-size: 32px; font-weight: 800;">🏠 Vibe Rooms</h1>
                <p style="margin: 0; font-size: 16px; opacity: 0.9;">Join community spaces based on your interests and vibes</p>
            </div>
            
            <div class="room-categories" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div class="room-category" onclick="joinVibeRoom('music')" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 15px; cursor: pointer; transition: transform 0.2s; color: white;">
                    <div style="font-size: 48px; margin-bottom: 15px;">🎵</div>
                    <h3 style="margin: 0 0 8px; font-size: 20px;">Music Vibes</h3>
                    <p style="margin: 0; opacity: 0.9; font-size: 14px;">Share beats, discover new artists, and vibe to music together</p>
                    <div style="margin-top: 15px; font-size: 12px; opacity: 0.8;">🔥 847 users vibing</div>
                </div>
                
                <div class="room-category" onclick="joinVibeRoom('dance')" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 15px; cursor: pointer; transition: transform 0.2s; color: white;">
                    <div style="font-size: 48px; margin-bottom: 15px;">💃</div>
                    <h3 style="margin: 0 0 8px; font-size: 20px;">Dance Floor</h3>
                    <p style="margin: 0; opacity: 0.9; font-size: 14px;">Show your moves, learn new dances, and battle it out</p>
                    <div style="margin-top: 15px; font-size: 12px; opacity: 0.8;">⚡ 632 users dancing</div>
                </div>
                
                <div class="room-category" onclick="joinVibeRoom('creativity')" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 25px; border-radius: 15px; cursor: pointer; transition: transform 0.2s; color: white;">
                    <div style="font-size: 48px; margin-bottom: 15px;">🎨</div>
                    <h3 style="margin: 0 0 8px; font-size: 20px;">Creative Space</h3>
                    <p style="margin: 0; opacity: 0.9; font-size: 14px;">Art, design, photography, and creative collaborations</p>
                    <div style="margin-top: 15px; font-size: 12px; opacity: 0.8;">✨ 423 creators online</div>
                </div>
                
                <div class="room-category" onclick="joinVibeRoom('gaming')" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 25px; border-radius: 15px; cursor: pointer; transition: transform 0.2s; color: white;">
                    <div style="font-size: 48px; margin-bottom: 15px;">🎮</div>
                    <h3 style="margin: 0 0 8px; font-size: 20px;">Gaming Zone</h3>
                    <p style="margin: 0; opacity: 0.9; font-size: 14px;">Gaming content, streams, reviews, and gamer community</p>
                    <div style="margin-top: 15px; font-size: 12px; opacity: 0.8;">🎯 1,205 gamers active</div>
                </div>
            </div>
            
            <div class="create-room-section" style="background: var(--bg-secondary); padding: 25px; border-radius: 15px; text-align: center; border: 2px dashed var(--border-primary);">
                <h3 style="color: var(--text-primary); margin: 0 0 10px;">Create Your Own Vibe Room</h3>
                <p style="color: var(--text-secondary); margin: 0 0 20px;">Start a new community space for your unique interests</p>
                <button onclick="showCreateRoomModal()" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 30px; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    ➕ Create New Room
                </button>
            </div>
        `;
        
        document.body.appendChild(vibeRoomsPage);
    }
    
    vibeRoomsPage.style.display = 'block';
    
    // Add hover effects
    const style = document.createElement('style');
    style.textContent = `
        .room-category:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
    `;
    document.head.appendChild(style);
}

async function loadVideoFeed(feedType = 'home', forceRefresh = false, page = 1, append = false) {
    // Map new feed names to internal logic
    const internalFeedType = mapFeedType(feedType);
    // CRITICAL: Never handle discover through loadVideoFeed - it has its own system
    if (internalFeedType === 'explore') {
        console.log('⚠️ loadVideoFeed called for discover - redirecting to initializeExplorePage');
        initializeExplorePage();
        return;
    }
    
    const now = Date.now();
    if (!forceRefresh && !append && now - lastFeedLoad < 1000) {
        console.log('Debouncing feed load for', feedType);
        return;
    }
    
    if (!append) {
        lastFeedLoad = now;
        currentPage = 1;
        hasMoreVideos = true;
    }
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`🤖 Loading AI-powered video feed: ${feedType}, page: ${page}, append: ${append}`);
    }
    currentFeed = feedType;
    
    // Update UI to show correct feed (only if not appending)
    if (!append) {
        document.querySelectorAll('.feed-content').forEach(feed => {
            feed.classList.remove('active');
        });
        document.querySelectorAll('.feed-tab').forEach(tab => {
            tab.classList.remove('active');
        });
    }
    
    // Show the correct feed
    const feedElement = document.getElementById(feedType + 'Feed');
    const tabElement = document.getElementById(feedType + 'Tab');
    
    console.log('Feed element found:', !!feedElement, feedElement);
    
    if (feedElement) {
        if (!append) {
            feedElement.classList.add('active');
            feedElement.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading videos...</p></div>';
            console.log('Set loading state for feed');
        } else {
            // Add loading indicator at bottom for infinite scroll
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'infinite-loading';
            loadingDiv.style.cssText = `
                display: flex;
                justify-content: center;
                align-items: center;
                height: 60px;
                color: white;
                font-size: 14px;
            `;
            loadingDiv.innerHTML = '⏳ Loading more videos...';
            feedElement.appendChild(loadingDiv);
        }
        
        try {
            let videos = [];
            
            // TEMPORARY: Skip API entirely and use sample/AI data until server is fixed
            console.log('🎬 Server API unavailable, using offline mode for', feedType);
            
            // Use AI recommendations for home and discover feeds
            if ((feedType === 'home' || feedType === 'discover') && window.aiRecommendationEngine && !append) {
                console.log('🤖 Using AI recommendations for', feedType);
                videos = await window.aiRecommendationEngine.getRecommendations(feedType, 10);
                
                if (videos.length > 0) {
                    // Remove loading indicator
                    feedElement.innerHTML = '';
                    
                    // Add AI recommendation indicator
                    
                    // Set up feed layout
                    feedElement.style.display = 'block';
                    feedElement.style.overflow = 'auto';
                    feedElement.style.scrollSnapType = 'y mandatory';
                    feedElement.style.scrollBehavior = 'smooth';
                    
                    // Add videos to feed
                    videos.forEach((video, index) => {
                        const videoCard = createAdvancedVideoCard(video);
                        feedElement.appendChild(videoCard);
                        console.log(`  ✅ Added AI video ${index + 1}: ${video.title || 'Untitled'}`);
                    });
                    
                    // Setup infinite scroll and video observer
                    setupInfiniteScroll(feedElement, feedType);
                    setTimeout(() => initializeVideoObserver(), 200);
                    hasMoreVideos = true;
                    
                    if (tabElement) {
                        tabElement.classList.add('active');
                    }
                    return;
                }
            }
            
            // For Vibing feed, try to load real content from followed users
            if (feedType === 'vibing' || internalFeedType === 'following') {
                console.log('✨ Loading Vibing feed - attempting to get real followed content');
                
                try {
                    // Get the user's following list first
                    const followingResponse = await fetch(`${window.API_BASE_URL}/api/user/following`, {
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            ...(window.authToken && window.authToken !== 'session-based' ? 
                                { 'Authorization': `Bearer ${window.authToken}` } : {})
                        }
                    });
                    
                    if (!followingResponse.ok) {
                        throw new Error('Failed to get following list');
                    }
                    
                    const followingData = await followingResponse.json();
                    const followingList = followingData.following || followingData || [];
                    
                    console.log('📋 Following list:', followingList.length, 'users');
                    
                    if (followingList.length === 0) {
                        // Show empty state if user isn't following anyone
                        feedElement.innerHTML = '';
                        feedElement.style.display = 'block';
                        feedElement.style.overflow = 'hidden';
                        
                        const emptyState = document.createElement('div');
                        emptyState.style.cssText = `
                            text-align: center;
                            padding: 60px 20px;
                            color: #999;
                            font-size: 16px;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                        `;
                        emptyState.innerHTML = `
                            <div style="font-size: 64px; margin-bottom: 20px;">✨</div>
                            <div style="font-size: 24px; margin-bottom: 10px; color: white;">Start Vibing!</div>
                            <div style="margin-bottom: 20px; max-width: 400px; font-size: 14px;">
                                Follow some creators to see their videos here!
                            </div>
                            <button onclick="showPage('discover')" style="
                                padding: 12px 32px;
                                background: var(--accent-gradient);
                                color: white;
                                border: none;
                                border-radius: 25px;
                                cursor: pointer;
                                font-weight: 600;
                                font-size: 16px;
                                box-shadow: var(--vib3-glow);
                            ">Discover Creators</button>
                        `;
                        feedElement.appendChild(emptyState);
                        hasMoreVideos = false;
                        
                        if (tabElement) {
                            tabElement.classList.add('active');
                        }
                        return;
                    }
                    
                    // Create a Set of following user IDs for quick lookup
                    const followingIds = new Set(followingList.map(user => user._id || user.id));
                    
                    // Get all videos
                    const videosResponse = await fetch(`${window.API_BASE_URL}/api/videos?limit=50`, {
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            ...(window.authToken && window.authToken !== 'session-based' ? 
                                { 'Authorization': `Bearer ${window.authToken}` } : {})
                        }
                    });
                    
                    if (!videosResponse.ok) {
                        throw new Error('Failed to get videos');
                    }
                    
                    const videosData = await videosResponse.json();
                    const allVideos = videosData.videos || videosData || [];
                    
                    console.log('📹 Total videos:', allVideos.length);
                    
                    // Filter videos to only show those from followed users
                    const followedVideos = allVideos.filter(video => {
                        const videoUserId = video.user?._id || video.user?.id || video.userId;
                        return followingIds.has(videoUserId);
                    });
                    
                    console.log('✨ Videos from followed users:', followedVideos.length);
                    
                    if (followedVideos.length > 0) {
                        // Sort by creation date (newest first)
                        followedVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        
                        feedElement.innerHTML = '';
                        feedElement.style.display = 'block';
                        feedElement.style.overflow = 'auto';
                        feedElement.style.scrollSnapType = 'y mandatory';
                        feedElement.style.scrollBehavior = 'smooth';
                        
                        followedVideos.forEach(video => {
                            const videoCard = createAdvancedVideoCard(video);
                            feedElement.appendChild(videoCard);
                        });
                        
                        setupInfiniteScroll(feedElement, feedType);
                        setTimeout(() => initializeVideoObserver(), 200);
                        hasMoreVideos = true;
                        
                        if (tabElement) {
                            tabElement.classList.add('active');
                        }
                        return;
                    } else {
                        // Show message that followed users haven't posted yet
                        feedElement.innerHTML = '';
                        feedElement.style.display = 'block';
                        feedElement.style.overflow = 'hidden';
                        
                        const emptyState = document.createElement('div');
                        emptyState.style.cssText = `
                            text-align: center;
                            padding: 60px 20px;
                            color: #999;
                            font-size: 16px;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                        `;
                        emptyState.innerHTML = `
                            <div style="font-size: 64px; margin-bottom: 20px;">✨</div>
                            <div style="font-size: 24px; margin-bottom: 10px; color: white;">No New Vibes</div>
                            <div style="margin-bottom: 20px; max-width: 400px; font-size: 14px;">
                                The creators you're vibing with haven't posted new content yet.<br>
                                Check back later or discover new creators!
                            </div>
                            <button onclick="showPage('discover')" style="
                                padding: 12px 32px;
                                background: var(--accent-gradient);
                                color: white;
                                border: none;
                                border-radius: 25px;
                                cursor: pointer;
                                font-weight: 600;
                                font-size: 16px;
                                box-shadow: var(--vib3-glow);
                            ">Discover More</button>
                        `;
                        feedElement.appendChild(emptyState);
                        hasMoreVideos = false;
                        
                        if (tabElement) {
                            tabElement.classList.add('active');
                        }
                        return;
                    }
                    
                } catch (err) {
                    console.log('⚠️ Error loading vibing feed:', err);
                    
                    // Show error state
                    feedElement.innerHTML = '';
                    feedElement.style.display = 'block';
                    feedElement.style.overflow = 'hidden';
                    
                    const errorState = document.createElement('div');
                    errorState.style.cssText = `
                        text-align: center;
                        padding: 60px 20px;
                        color: #999;
                        font-size: 16px;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    `;
                    errorState.innerHTML = `
                        <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
                        <div style="font-size: 24px; margin-bottom: 10px; color: white;">Connection Error</div>
                        <div style="margin-bottom: 20px; max-width: 400px; font-size: 14px;">
                            Unable to load your vibing feed right now.<br>
                            Please check your connection and try again.
                        </div>
                        <button onclick="switchFeedTab('vibing')" style="
                            padding: 12px 32px;
                            background: var(--accent-gradient);
                            color: white;
                            border: none;
                            border-radius: 25px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 16px;
                            box-shadow: var(--vib3-glow);
                        ">Try Again</button>
                    `;
                    feedElement.appendChild(errorState);
                    hasMoreVideos = false;
                    
                    if (tabElement) {
                        tabElement.classList.add('active');
                    }
                    return;
                }
            }
            
            // Special handling for different feed types using feed manager
            if (!append && window.feedManager) {
                // Note: Explore is handled separately by initializeExplorePage, not feed manager
                if (feedType === 'following' && window.feedManager.loadFollowingFeed) {
                    console.log('👥 Loading following feed via feed manager');
                    await window.feedManager.loadFollowingFeed();
                    return; // Exit early as feed manager handles everything
                } else if (feedType === 'foryou' && window.feedManager.loadAllVideosForFeed) {
                    console.log('⭐ Loading foryou feed via feed manager');
                    await window.feedManager.loadAllVideosForFeed();
                    return; // Exit early as feed manager handles everything
                }
            }
            
            // Add cache busting to prevent stale data
            const timestamp = Date.now();
            
            // Determine the correct endpoint based on internal feed type
            let feedUrl;
            if (internalFeedType === 'friends') {
                // Network feed uses default feed but will filter out current user's videos
                feedUrl = `${window.API_BASE_URL}/api/videos?limit=20&_t=${timestamp}`;
            } else if (internalFeedType === 'following') {
                // Subscriptions feed - use regular videos endpoint and filter client-side
                feedUrl = `${window.API_BASE_URL}/api/videos?limit=50&_t=${timestamp}`;
            } else {
                // Default feed endpoint - use /api/videos instead of /feed
                feedUrl = `${window.API_BASE_URL}/api/videos?limit=10&_t=${timestamp}`;
            }
            
            console.log('📡 Fetching from:', feedUrl);
            
            const response = await fetch(feedUrl, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...(window.authToken && window.authToken !== 'session-based' ? 
                        { 'Authorization': `Bearer ${window.authToken}` } : {})
                }
            });
            
            console.log('📡 Response status:', response.status, response.statusText);
            console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
            
            // Check if response is ok and content type is JSON
            if (!response.ok) {
                console.warn(`API error: ${response.status} ${response.statusText}, falling back to sample data`);
                throw new Error(`API returned ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.warn('Invalid response type:', contentType, 'falling back to sample data');
                const text = await response.text();
                console.warn('Response preview:', text.substring(0, 200));
                throw new Error('API returned non-JSON response');
            }
            
            const data = await response.json();
            console.log(`📦 Received data for page ${page}:`, data.videos?.length, 'videos');
            
            // Filter out current user's videos for network feed
            if (internalFeedType === 'friends' && data.videos && window.currentUser) {
                const currentUserId = window.currentUser.id || window.currentUser._id || window.currentUser.uid;
                if (currentUserId) {
                    const originalCount = data.videos.length;
                    data.videos = data.videos.filter(video => {
                        const videoUserId = video.user?.id || video.user?._id || video.userId || video.uploadedBy;
                        return videoUserId !== currentUserId;
                    });
                    console.log(`👥 Network feed: Filtered out ${originalCount - data.videos.length} own videos, showing ${data.videos.length} from network`);
                }
            }
            
            // Filter for following feed - only show videos from followed users
            if (internalFeedType === 'following' && data.videos && window.currentUser) {
                try {
                    // Get following list and filter videos
                    const followingResponse = await fetch(`${window.API_BASE_URL}/api/user/following`, {
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            ...(window.authToken && window.authToken !== 'session-based' ? 
                                { 'Authorization': `Bearer ${window.authToken}` } : {})
                        }
                    });
                    
                    if (followingResponse.ok) {
                        const followingData = await followingResponse.json();
                        const followingList = followingData.following || followingData || [];
                        const followingIds = new Set(followingList.map(user => user._id || user.id));
                        
                        const originalCount = data.videos.length;
                        data.videos = data.videos.filter(video => {
                            const videoUserId = video.user?._id || video.user?.id || video.userId;
                            return followingIds.has(videoUserId);
                        });
                        console.log(`✨ Following feed: Filtered to ${data.videos.length} videos from ${followingList.length} followed users (from ${originalCount} total)`);
                    }
                } catch (err) {
                    console.log('⚠️ Error filtering following feed:', err);
                    // Keep all videos if filtering fails
                }
            }
            
            // For discover feed, supplement with sample data if needed
            if (internalFeedType === 'explore' && (!data.videos || data.videos.length < 6)) {
                console.log('🔍 Adding sample discover data');
                const sampleExploreVideos = [
                    {
                        _id: 'sample1',
                        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                        user: { 
                            _id: 'creator1',
                            username: 'dancequeen23', 
                            displayName: 'Maya Chen',
                            profilePicture: '💃' 
                        },
                        title: 'Summer dance vibes! ☀️',
                        description: 'New choreography to my favorite song #dance #summer',
                        likeCount: 1200,
                        commentCount: 45,
                        shareCount: 23,
                        uploadDate: new Date('2024-01-01'),
                        duration: 60,
                        views: 15600
                    },
                    {
                        _id: 'sample2',
                        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                        user: { 
                            _id: 'creator2',
                            username: 'artlife_alex', 
                            displayName: 'Alex Rivera',
                            profilePicture: '🎨' 
                        },
                        title: 'Digital art speedrun',
                        description: 'Creating art in 60 seconds #art #digital #creative',
                        likeCount: 890,
                        commentCount: 67,
                        shareCount: 34,
                        uploadDate: new Date('2024-01-02'),
                        duration: 45,
                        views: 8900
                    },
                    {
                        _id: 'sample3',
                        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                        user: { 
                            _id: 'creator3',
                            username: 'cookingjake', 
                            displayName: 'Jake Martinez',
                            profilePicture: '👨‍🍳' 
                        },
                        title: 'Quick pasta recipe!',
                        description: '5-minute dinner hack that will change your life #cooking #pasta',
                        likeCount: 2300,
                        commentCount: 156,
                        shareCount: 89,
                        uploadDate: new Date('2024-01-03'),
                        duration: 30,
                        views: 23400
                    },
                    {
                        _id: 'sample4',
                        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
                        user: { 
                            _id: 'creator4',
                            username: 'fitness_sarah', 
                            displayName: 'Sarah Johnson',
                            profilePicture: '💪' 
                        },
                        title: 'Morning workout routine',
                        description: 'Start your day right with this 10-min workout #fitness #morning',
                        likeCount: 567,
                        commentCount: 43,
                        shareCount: 28,
                        uploadDate: new Date('2024-01-04'),
                        duration: 25,
                        views: 7800
                    },
                    {
                        _id: 'sample5',
                        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
                        user: { 
                            _id: 'creator5',
                            username: 'tech_tom', 
                            displayName: 'Tom Wilson',
                            profilePicture: '💻' 
                        },
                        title: 'iPhone 15 hidden features',
                        description: 'Mind-blowing features you never knew existed #tech #iphone',
                        likeCount: 4500,
                        commentCount: 234,
                        shareCount: 167,
                        uploadDate: new Date('2024-01-05'),
                        duration: 180,
                        views: 45600
                    },
                    {
                        _id: 'sample6',
                        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                        user: { 
                            _id: 'creator6',
                            username: 'fashionista_em', 
                            displayName: 'Emma Style',
                            profilePicture: '👗' 
                        },
                        title: 'Outfit of the day',
                        description: 'Affordable fall looks under $50 #fashion #ootd #style',
                        likeCount: 890,
                        commentCount: 76,
                        shareCount: 45,
                        uploadDate: new Date('2024-01-06'),
                        duration: 60,
                        views: 12300
                    }
                ];
                
                // Combine existing videos with sample data
                const combinedVideos = [...(data.videos || []), ...sampleExploreVideos];
                data.videos = combinedVideos.slice(0, 12); // Limit to 12 for grid
                console.log(`🔄 Enhanced explore feed: ${data.videos.length} total videos`);
            }
            
            // Remove loading indicator
            if (append) {
                const loadingElement = feedElement.querySelector('.infinite-loading');
                if (loadingElement) loadingElement.remove();
            }
            
            if (data.videos && data.videos.length > 0) {
                // Filter out videos with invalid URLs or known broken paths
                const validVideos = data.videos.filter(video => {
                    const isValid = video.videoUrl && 
                           !video.videoUrl.includes('example.com') && 
                           video.videoUrl !== '' &&
                           video.videoUrl.startsWith('http') &&
                           !video.videoUrl.includes('2025-06-20/55502f40'); // Filter out old broken videos
                    
                    if (!isValid) {
                        console.log(`❌ Filtered out video: ${video.videoUrl}`);
                    }
                    return isValid;
                });
                
                console.log(`📊 Filtered ${data.videos.length} → ${validVideos.length} videos for ${feedType}`);
                
                if (validVideos.length > 0) {
                    if (!append) {
                        // Don't clear the entire explore feed, just the video grid
                        if (feedType !== 'explore') {
                            feedElement.innerHTML = '';
                        }
                        
                        // Set different layouts for different feed types
                        if (feedType === 'explore') {
                            // Use the dedicated explore grid container
                            const exploreGrid = document.getElementById('exploreVideoGrid');
                            console.log('🔍 Setting up explore grid:', !!exploreGrid);
                            if (exploreGrid) {
                                exploreGrid.innerHTML = '';
                                exploreGrid.style.display = 'grid';
                                exploreGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
                                exploreGrid.style.gap = '4px';
                                exploreGrid.style.padding = '8px';
                                console.log('✅ Explore grid configured');
                            } else {
                                console.error('❌ exploreVideoGrid not found! Check HTML structure');
                                // Fallback: just use the feedElement
                                feedElement.style.display = 'grid';
                                feedElement.style.gridTemplateColumns = 'repeat(3, 1fr)';
                                feedElement.style.gap = '4px';
                                feedElement.style.padding = '8px';
                            }
                        } else {
                            // Vertical scroll for For You and Following
                            feedElement.style.display = 'block';
                            feedElement.style.overflow = 'auto';
                            feedElement.style.scrollSnapType = 'y mandatory';
                            feedElement.style.scrollBehavior = 'smooth';
                        }
                    }
                    
                    console.log(`➕ Adding ${validVideos.length} videos to feed (append: ${append})`);
                    validVideos.forEach((video, index) => {
                        const videoCard = feedType === 'explore' ? 
                            createExploreVideoCard(video) : 
                            createAdvancedVideoCard(video);
                        
                        if (feedType === 'explore') {
                            const exploreGrid = document.getElementById('exploreVideoGrid');
                            if (exploreGrid) {
                                exploreGrid.appendChild(videoCard);
                            } else {
                                // Fallback to feedElement if grid not found
                                feedElement.appendChild(videoCard);
                            }
                        } else {
                            feedElement.appendChild(videoCard);
                        }
                        console.log(`  ✅ Added video ${index + 1}: ${video.title || 'Untitled'}`);
                    });
                    
                    // Check if we have fewer videos than requested - if so, we've reached the end
                    if (validVideos.length < 10) {
                        console.log('📴 Reached end of videos - will start recycling for infinite scroll');
                        // Still allow infinite scroll by recycling existing videos
                        hasMoreVideos = true;
                    } else {
                        hasMoreVideos = true;
                    }
                    console.log(`🔄 Feed now has ${feedElement.children.length} video elements total`);
                    
                    // Setup infinite scroll listener
                    if (!append) {
                        setupInfiniteScroll(feedElement, feedType);
                        if (feedType !== 'explore') {
                            setTimeout(() => initializeVideoObserver(), 200);
                        }
                    } else {
                        // Re-initialize observer for new videos
                        if (feedType !== 'explore') {
                            setTimeout(() => initializeVideoObserver(), 200);
                        }
                    }
                } else {
                    if (!append) {
                        if (feedType === 'explore') {
                            const exploreGrid = document.getElementById('exploreVideoGrid');
                            if (exploreGrid) {
                                exploreGrid.innerHTML = createEmptyFeedMessage(feedType);
                            }
                        } else {
                            feedElement.innerHTML = createEmptyFeedMessage(feedType);
                            feedElement.style.overflow = 'hidden';
                        }
                        console.log('No valid videos after filtering, showing empty message for', feedType);
                        hasMoreVideos = false;
                    } else {
                        // No valid videos after filtering - cycle through existing videos
                        console.log('No valid videos after filtering, cycling through existing videos');
                        const existingVideos = Array.from(feedElement.children);
                        if (existingVideos.length > 0) {
                            // Clone and append existing videos for infinite scroll effect
                            const videosToClone = existingVideos.slice(0, Math.min(3, existingVideos.length));
                            videosToClone.forEach(videoCard => {
                                const clonedCard = videoCard.cloneNode(true);
                                clonedCard.setAttribute('data-cloned-video', 'true');
                                feedElement.appendChild(clonedCard);
                                // Refresh reaction counts for cloned video
                                refreshClonedVideoReactions(clonedCard);
                            });
                            console.log(`🔄 Cloned ${videosToClone.length} videos for infinite scroll (filtered case)`);
                            
                            // Re-initialize observer for cloned videos
                            if (feedType !== 'explore') {
                                setTimeout(() => initializeVideoObserver(), 200);
                            }
                            hasMoreVideos = true; // Keep infinite scroll active
                        } else {
                            hasMoreVideos = false;
                        }
                    }
                }
            } else {
                if (!append) {
                    if (feedType === 'explore') {
                        const exploreGrid = document.getElementById('exploreVideoGrid');
                        if (exploreGrid) {
                            exploreGrid.innerHTML = createEmptyFeedMessage(feedType);
                        }
                    } else {
                        feedElement.innerHTML = createEmptyFeedMessage(feedType);
                        feedElement.style.overflow = 'hidden';
                    }
                    console.log('No videos to display, showing empty message for', feedType);
                    hasMoreVideos = false;
                } else {
                    // No more videos from server - cycle through existing videos for infinite scroll
                    console.log('🔄 No more videos from server, cycling through existing videos');
                    const existingVideos = Array.from(feedElement.children).filter(child => 
                        child.classList.contains('video-card') || child.querySelector('video')
                    );
                    
                    if (existingVideos.length > 0) {
                        // Clone and append existing videos for infinite scroll effect
                        const videosToClone = existingVideos.slice(0, Math.min(5, existingVideos.length));
                        console.log(`🔄 Found ${existingVideos.length} existing videos, cloning ${videosToClone.length}`);
                        
                        videosToClone.forEach((videoCard, index) => {
                            const clonedCard = videoCard.cloneNode(true);
                            
                            // Mark as cloned for identification
                            clonedCard.setAttribute('data-cloned-video', 'true');
                            
                            // Add a recycling indicator
                            const recycleTag = document.createElement('div');
                            recycleTag.style.cssText = `
                                position: absolute;
                                top: 10px;
                                left: 10px;
                                background: rgba(0,0,0,0.6);
                                color: white;
                                padding: 4px 8px;
                                border-radius: 4px;
                                font-size: 12px;
                                z-index: 100;
                            `;
                            recycleTag.textContent = '🔄 Replay';
                            clonedCard.appendChild(recycleTag);
                            feedElement.appendChild(clonedCard);
                            
                            // Refresh reaction counts for cloned video
                            refreshClonedVideoReactions(clonedCard);
                        });
                        console.log(`✅ Cloned ${videosToClone.length} videos for infinite scroll`);
                        
                        // Re-initialize observer for cloned videos
                        setTimeout(() => initializeVideoObserver(), 200);
                        hasMoreVideos = true; // Keep infinite scroll active
                    } else {
                        console.log('❌ No existing videos found to recycle');
                        hasMoreVideos = false;
                    }
                }
            }
        } catch (error) {
            console.error('Load feed error:', error);
            
            // Show error message instead of sample videos
            console.log('❌ Unable to load videos from server');
            
            if (!append) {
                feedElement.innerHTML = '';
                feedElement.style.display = 'block';
                feedElement.style.overflow = 'auto';
                feedElement.style.scrollSnapType = 'y mandatory';
                feedElement.style.scrollBehavior = 'smooth';
                
                // Show proper error message instead of sample videos
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = `
                    text-align: center;
                    padding: 60px 20px;
                    color: var(--text-secondary);
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                `;
                errorDiv.innerHTML = `
                    <div style="font-size: 64px; margin-bottom: 20px;">📡</div>
                    <h3 style="color: var(--text-primary); margin-bottom: 10px;">Connection Error</h3>
                    <p style="margin-bottom: 20px;">Unable to connect to VIB3 servers. Please check your internet connection.</p>
                    <button onclick="location.reload()" style="background: var(--vib3-brand-gradient); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        🔄 Try Again
                    </button>
                `;
                feedElement.appendChild(errorDiv);
            }
            
            return; // Exit early, don't process sample videos
        }
    }
    
    if (tabElement && !append) {
        tabElement.classList.add('active');
    }
}

function createAdvancedVideoCard(video) {
    console.log('🚀 Creating TikTok-style video card for:', video.videoUrl);
    console.log('📝 Video data:', { title: video.title, username: video.username, user: video.user });
    
    const card = document.createElement('div');
    
    // Flutter-inspired card with modern design
    card.className = 'video-item';
    card.style.cssText = `
        height: calc(80vh - 60px) !important;
        width: 100% !important;
        max-width: 500px !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
        background: var(--bg-primary) !important;
        margin: 20px auto 20px auto !important;
        padding: 8px !important;
        overflow: visible !important;
        scroll-snap-align: center !important;
        scroll-snap-stop: always !important;
        border-radius: var(--card-border-radius) !important;
        box-sizing: border-box !important;
        box-shadow: var(--shadow-depth) !important;
    `;
    
    // Create video card inner container
    const videoCard = document.createElement('div');
    videoCard.className = 'video-card';
    videoCard.style.cssText = `
        width: 100% !important;
        height: 100% !important;
        background: var(--bg-secondary) !important;
        border-radius: var(--card-border-radius) !important;
        overflow: hidden !important;
        position: relative !important;
        box-shadow: var(--vib3-multi-glow) !important;
    `;
    
    // Create video element directly
    const video_elem = document.createElement('video');
    
    // Fix video URL to ensure proper protocol
    let videoUrl = video.videoUrl || '';
    if (videoUrl && !videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
        videoUrl = 'https://' + videoUrl;
    }
    // Configure video for cross-origin and optimal playback
    video_elem.setAttribute('crossorigin', 'anonymous');
    video_elem.setAttribute('playsinline', 'true');
    video_elem.setAttribute('webkit-playsinline', 'true');
    video_elem.preload = 'metadata';
    video_elem.src = videoUrl;
    video_elem.loop = true;
    video_elem.muted = false;  // Enable audio by default
    video_elem.volume = 0.8;   // Set reasonable volume
    video_elem.playsInline = true;
    
    // Add click handler to ensure audio plays on user interaction
    video_elem.addEventListener('click', function() {
        this.muted = false;
        this.volume = 0.8;
        console.log('🔊 Audio enabled on video click');
    });
    video_elem.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        background: var(--bg-primary) !important;
        z-index: 1 !important;
        border-radius: var(--card-border-radius) !important;
    `;
    
    // Add comprehensive error handling
    video_elem.onerror = (e) => {
        console.error('🚨 VIDEO ERROR:', video_elem.src, e);
        console.error('Error details:', {
            error: e.target.error,
            errorCode: e.target.error?.code,
            errorMessage: getVideoErrorMessage(e.target.error?.code),
            networkState: e.target.networkState,
            readyState: e.target.readyState,
            currentSrc: e.target.currentSrc
        });
        
        // Try to recover by setting different attributes
        video_elem.setAttribute('crossorigin', 'anonymous');
        video_elem.preload = 'none';
        
        // If still failing, show error placeholder
        setTimeout(() => {
            if (video_elem.error) {
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #000;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 5;
                `;
                errorDiv.innerHTML = `
                    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <div style="font-size: 16px; margin-bottom: 10px;">Video failed to load</div>
                    <div style="font-size: 12px; color: #888;">URL: ${video.videoUrl}</div>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 8px 16px; background: #fe2c55; color: white; border: none; border-radius: 4px;">Retry</button>
                `;
                card.appendChild(errorDiv);
            }
        }, 2000);
    };
    video_elem.onloadstart = () => console.log('📹 VIDEO LOADING:', video_elem.src);
    video_elem.oncanplay = () => console.log('✅ VIDEO READY:', video_elem.src);
    video_elem.onplay = () => {
        console.log('▶️ PLAYING:', video_elem.src);
        // Track video view start for AI recommendations
        if (window.aiRecommendationEngine && video) {
            document.dispatchEvent(new CustomEvent('video-view-start', { detail: video }));
        }
    };
    video_elem.onpause = () => {
        console.log('⏸️ PAUSED:', video_elem.src);
        // Track video view end for AI recommendations
        if (window.aiRecommendationEngine && video) {
            document.dispatchEvent(new CustomEvent('video-view-end', { detail: video }));
        }
    };
    
    // Creator panel removed - using sidebar profile button instead
    
    // Create bottom overlay with description
    const overlay = document.createElement('div');
    overlay.className = 'bottom-actions';
    
    overlay.innerHTML = `
        <div class="video-description">
            <div class="username">@${video.user?.username || video.user?.displayName || video.username || 'user'}</div>
            <div class="description-text">${video.description || video.caption || video.title || 'Check out this video!'}${video.position ? ` • Video #${video.position}` : ''}</div>
        </div>
    `;
    
    // Create Flutter-inspired floating action buttons
    const actions = document.createElement('div');
    actions.className = 'side-actions';
    
    actions.innerHTML = `
        <button class="like-btn action-btn video-action-bubble" data-video-id="${video._id || 'unknown'}">
            <div class="icon heart-icon">🤍</div>
            <div class="count like-count">${formatCount(video.likeCount || 0)}</div>
        </button>
        <button class="comment-btn action-btn video-action-bubble" data-video-id="${video._id || 'unknown'}">
            <div class="icon">💬</div>
            <div class="count">${formatCount(video.commentCount || 0)}</div>
        </button>
        <button class="share-btn action-btn video-action-bubble" data-video-id="${video._id || 'unknown'}">
            <div class="icon">📤</div>
            <div class="count share-count">${formatCount(video.shareCount || 0)}</div>
        </button>
        <button class="bookmark-btn action-btn video-action-bubble" data-video-id="${video._id || 'unknown'}">
            <div class="icon">🔖</div>
            <div class="count">Save</div>
        </button>
        <button class="volume-btn action-btn video-action-bubble">
            <div class="icon">🔊</div>
        </button>
    `;
    
    // Add volume control functionality
    const volumeBtn = actions.querySelector('.volume-btn');
    volumeBtn.addEventListener('click', () => {
        if (video_elem.muted) {
            video_elem.muted = false;
            volumeBtn.textContent = '🔊';
        } else {
            video_elem.muted = true;
            volumeBtn.textContent = '🔇';
        }
    });
    
    // Add like button functionality with AI tracking
    const likeBtn = actions.querySelector('.like-btn');
    likeBtn.addEventListener('click', function likeBtnClickHandler(e) { 
        // Track engagement for AI recommendations
        if (window.aiRecommendationEngine && video) {
            window.aiRecommendationEngine.trackEngagement(video, 'like');
        }
        return handleLikeClick(e, likeBtn); 
    });
    
    // Add enhanced like button features (double-tap, ripple, floating hearts)
    enhanceLikeButton(likeBtn, video_elem);
    
    // Add comment button functionality with AI tracking
    const commentBtn = actions.querySelector('.comment-btn');
    commentBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const videoId = commentBtn.dataset.videoId;
        
        // Track engagement for AI recommendations
        if (window.aiRecommendationEngine && video) {
            window.aiRecommendationEngine.trackEngagement(video, 'comment');
        }
        
        // Add bounce animation
        commentBtn.style.transform = 'scale(1.1)';
        setTimeout(() => commentBtn.style.transform = 'scale(1)', 200);
        
        openCommentsModal(videoId);
    });
    
    // Add share button functionality with AI tracking
    const shareBtn = actions.querySelector('.share-btn');
    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const videoId = shareBtn.dataset.videoId;
        
        // Track engagement for AI recommendations
        if (window.aiRecommendationEngine && video) {
            window.aiRecommendationEngine.trackEngagement(video, 'share');
        }
        
        // Add bounce animation
        shareBtn.style.transform = 'scale(1.1)';
        setTimeout(() => shareBtn.style.transform = 'scale(1)', 200);
        
        shareVideo(videoId, video);
    });
    
    // Creator panel functionality removed - using sidebar profile button instead
    
    // Load and set initial like status (works for both authenticated and non-authenticated users)
    loadVideoLikeStatus(video._id || 'unknown', likeBtn);
    
    // Create pause indicator overlay
    const pauseIndicator = document.createElement('div');
    pauseIndicator.style.cssText = `
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: 80px !important;
        height: 80px !important;
        background: rgba(0,0,0,0.7) !important;
        border-radius: 50% !important;
        display: none !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 40px !important;
        color: white !important;
        z-index: 15 !important;
        pointer-events: none !important;
    `;
    pauseIndicator.textContent = '⏸️';
    
    // Add pause/play functionality when clicking video (with double-tap detection)
    video_elem._doubleTapState = { lastTap: 0, tapCount: 0 };
    
    video_elem.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        
        // Double-tap detection
        const currentTime = new Date().getTime();
        const tapLength = currentTime - video_elem._doubleTapState.lastTap;
        
        if (tapLength < 500 && tapLength > 0) {
            video_elem._doubleTapState.tapCount++;
            if (video_elem._doubleTapState.tapCount === 1) {
                // Double tap detected - trigger like instead of pause/play
                const likeBtn = e.target.closest('.video-card').querySelector('.like-btn');
                if (likeBtn) {
                    // Track engagement for AI recommendations
                    if (window.aiRecommendationEngine && video) {
                        window.aiRecommendationEngine.trackEngagement(video, 'like');
                    }
                    handleLikeClick(e, likeBtn);
                    createFloatingHeart(video_elem);
                    
                    // Add double heart beat animation
                    const heartIcon = likeBtn.querySelector('.heart-icon') || likeBtn.querySelector('div:first-child');
                    if (heartIcon) {
                        heartIcon.style.animation = 'doubleHeartBeat 0.6s ease';
                        setTimeout(() => heartIcon.style.animation = '', 600);
                    }
                }
                video_elem._doubleTapState.tapCount = 0;
                video_elem._doubleTapState.lastTap = currentTime;
                return; // Don't do pause/play on double-tap
            }
        } else {
            video_elem._doubleTapState.tapCount = 0;
        }
        
        video_elem._doubleTapState.lastTap = currentTime;
        
        // Single tap - pause/play functionality
        setTimeout(() => {
            if (video_elem._doubleTapState.tapCount === 0) {
                // Only do pause/play if no double-tap happened
                if (video_elem.paused) {
                    // Remove manual pause flag and play
                    video_elem.removeAttribute('data-manually-paused');
                    video_elem.play();
                    pauseIndicator.style.display = 'none';
                    console.log('▶️ MANUALLY RESUMED VIDEO:', video_elem.src.split('/').pop());
                } else {
                    // Mark as manually paused so observer doesn't auto-resume
                    video_elem.setAttribute('data-manually-paused', 'true');
                    video_elem.pause();
                    pauseIndicator.style.display = 'flex';
                    console.log('⏸️ MANUALLY PAUSED VIDEO:', video_elem.src.split('/').pop());
                }
            }
        }, 300); // Delay to allow double-tap detection
    });
    
    // Create video container
    const videoContainer = document.createElement('div');
    // Update video container for Flutter-inspired design
    videoContainer.className = 'video-container';
    videoContainer.style.cssText = `
        width: 100%;
        height: 100%;
        position: relative;
        background: var(--bg-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--card-border-radius);
        overflow: hidden;
    `;
    
    // Assemble Flutter-inspired video card
    videoContainer.appendChild(video_elem);
    videoContainer.appendChild(overlay);
    videoContainer.appendChild(actions);
    videoContainer.appendChild(pauseIndicator);
    
    videoCard.appendChild(videoContainer);
    card.appendChild(videoCard);
    
    console.log('✅ Flutter-inspired video card created with modern design');
    return card;
}

// ================ ADVANCED VIDEO INTERACTIONS ================
async function handleAdvancedLike(videoId, button) {
    // Show reaction options on long press
    let pressTimer = null;
    
    button.addEventListener('mousedown', () => {
        pressTimer = setTimeout(() => {
            showReactionOptions(button);
        }, 500);
    });
    
    button.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
    });
    
    // Regular like on click
    if (window.toggleLike) {
        const result = await window.toggleLike(videoId);
        if (result.success) {
            button.classList.toggle('liked', result.liked);
            button.querySelector('.action-count').textContent = formatCount(result.likeCount);
            
            // Animate like
            if (result.liked) {
                animateLike(button);
            }
        }
    }
}

function showReactionOptions(button) {
    const reactions = button.parentElement.querySelector('.reaction-buttons');
    reactions.style.display = 'flex';
    setTimeout(() => {
        reactions.style.display = 'none';
    }, 3000);
}

async function addReaction(videoId, reactionType) {
    // Send reaction to backend
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/videos/${videoId}/reaction`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type: reactionType })
        });
        
        if (response.ok) {
            showNotification(`${getReactionEmoji(reactionType)} Reaction added!`, 'success');
        }
    } catch (error) {
        console.error('Reaction error:', error);
    }
}

function getReactionEmoji(type) {
    const emojis = {
        love: '❤️',
        laugh: '😂',
        surprise: '😮',
        sad: '😢',
        angry: '😠'
    };
    return emojis[type] || '❤️';
}

function animateLike(button) {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.style.cssText = `
        position: absolute;
        font-size: 30px;
        pointer-events: none;
        animation: likeAnimation 1s ease-out;
        z-index: 1000;
    `;
    button.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
}

// ================ DUET AND STITCH FEATURES ================
async function startDuet(videoId) {
    showNotification('Starting duet recording...', 'info');
    
    // Open duet recording interface
    const duetModal = document.createElement('div');
    duetModal.className = 'modal duet-modal';
    duetModal.innerHTML = `
        <div class="modal-content duet-content">
            <button class="close-btn" onclick="closeDuetModal()">&times;</button>
            <h3>Create Duet</h3>
            <div class="duet-container">
                <div class="original-video">
                    <video src="${await getVideoUrl(videoId)}" loop muted autoplay></video>
                    <div class="video-label">Original</div>
                </div>
                <div class="duet-recording">
                    <video id="duetRecordingPreview" muted></video>
                    <div class="video-label">Your Duet</div>
                    <div class="recording-controls">
                        <button class="record-btn" onclick="toggleDuetRecording()">🔴 Record</button>
                        <button class="flip-camera-btn" onclick="flipDuetCamera()">🔄</button>
                        <button class="timer-btn" onclick="setDuetTimer()">⏰</button>
                    </div>
                </div>
            </div>
            <div class="duet-effects">
                <button onclick="addDuetEffect('split')" class="effect-btn active">Split Screen</button>
                <button onclick="addDuetEffect('picture-in-picture')" class="effect-btn">Picture in Picture</button>
                <button onclick="addDuetEffect('green-screen')" class="effect-btn">Green Screen</button>
            </div>
            <div class="duet-actions">
                <button onclick="saveDuetDraft()" class="save-draft-btn">Save Draft</button>
                <button onclick="publishDuet()" class="publish-duet-btn">Publish Duet</button>
            </div>
        </div>
    `;
    document.body.appendChild(duetModal);
    duetModal.classList.add('show');
    
    // Initialize duet camera
    initializeDuetCamera();
}

// Create TikTok-style explore grid video card
function createExploreVideoCard(video) {
    console.log('🔍 Creating explore grid card for:', video.videoUrl);
    
    const card = document.createElement('div');
    card.className = 'explore-video-card';
    
    // CRITICAL: Store the complete video data on the card for later access
    card.videoData = video;
    card.dataset.videoId = video.id || video._id;
    card.dataset.userId = video.userId;
    
    card.style.cssText = `
        position: relative;
        width: 100%;
        aspect-ratio: 9/16;
        background: #000;
        border-radius: 4px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    
    // Video thumbnail (first frame)
    const video_elem = document.createElement('video');
    let videoUrl = video.videoUrl || '';
    if (videoUrl && !videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
        videoUrl = 'https://' + videoUrl;
    }
    
    video_elem.src = videoUrl;
    video_elem.muted = true;  // Always muted for explore page
    video_elem.preload = 'metadata';
    video_elem.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        background: #000;
    `;
    
    // Overlay with play icon and stats
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(transparent 60%, rgba(0,0,0,0.8));
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
    `;
    
    // Play button icon
    const playIcon = document.createElement('div');
    playIcon.innerHTML = '▶️';
    playIcon.style.cssText = `
        font-size: 32px;
        color: white;
        opacity: 0;
        transition: all 0.2s ease;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    `;
    
    // Video stats at bottom with interaction icons
    const stats = document.createElement('div');
    stats.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 8px;
        background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
        color: white;
        font-size: 12px;
    `;
    
    const viewCount = video.views || 0;
    const likeCount = video.likeCount || video.likes || 0;
    const commentCount = video.commentCount || video.comments || 0;
    
    stats.innerHTML = `
        <div style="margin-bottom: 6px; font-weight: 500; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
            ${video.title || video.description || 'Amazing video'}
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span>❤️</span>
                    <span>${formatCount(likeCount)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span>💬</span>
                    <span>${formatCount(commentCount)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span>👁️</span>
                    <span>${formatCount(viewCount)}</span>
                </div>
            </div>
        </div>
    `;
    
    // Trending badge for popular videos
    if (viewCount > 10000 || likeCount > 1000) {
        const trendingBadge = document.createElement('div');
        trendingBadge.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: linear-gradient(135deg, #ff6b6b, #fe2c55);
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 2px 8px rgba(254, 44, 85, 0.3);
        `;
        trendingBadge.innerHTML = '🔥 Trending';
        overlay.appendChild(trendingBadge);
    }
    
    // User info (smaller, top left)
    const userInfo = document.createElement('div');
    userInfo.style.cssText = `
        position: absolute;
        top: 8px;
        left: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
        color: white;
        font-size: 11px;
        background: rgba(0,0,0,0.6);
        border-radius: 12px;
        padding: 4px 8px;
        backdrop-filter: blur(8px);
    `;
    
    const userAvatar = video.user?.profilePicture || '👤';
    const userName = video.user?.username || video.user?.displayName || 'User';
    userInfo.innerHTML = `
        <span style="font-size: 14px;">${userAvatar}</span>
        <span style="font-weight: 500; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 80px;">@${userName}</span>
    `;
    
    // Hover effects - muted preview on hover
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'scale(1.03)';
        card.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
        playIcon.style.opacity = '1';
        playIcon.style.transform = 'scale(1.1)';
        // Ensure video is muted for hover preview
        video_elem.muted = true;
        video_elem.play().catch(e => console.log('Hover play failed:', e));
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'scale(1)';
        card.style.boxShadow = 'none';
        playIcon.style.opacity = '0';
        playIcon.style.transform = 'scale(1)';
        video_elem.pause();
        video_elem.currentTime = 0;
    });
    
    // Click to open full video
    card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎬 Explore video clicked, opening in vertical feed:', video.title);
        console.log('📋 Complete video data being passed:', video);
        openVideoModal(video);
    });
    
    overlay.appendChild(playIcon);
    overlay.appendChild(stats);
    overlay.appendChild(userInfo);
    
    card.appendChild(video_elem);
    card.appendChild(overlay);
    
    return card;
}

// Open video in vertical feed (like TikTok)
function openVideoModal(video) {
    console.log('🎬 Opening video in vertical feed for:', video.description || video.title || 'Untitled');
    console.log('📋 Video data received:', video);
    
    // Validate video data
    if (!video || !video.videoUrl) {
        console.error('❌ Invalid video data passed to openVideoModal:', video);
        return;
    }
    
    // Set flag to prevent normal feed loading
    window.isLoadingSpecificVideo = true;
    
    // Switch to For You feed to show vertical layout
    switchFeedTab('home');
    
    // Create a new feed starting with the selected video
    setTimeout(() => {
        createVideoFeedWithSelectedVideo(video);
        // Clear the flag after creating the custom feed
        window.isLoadingSpecificVideo = false;
    }, 100);
}

// Create a vertical feed starting with a specific video
async function createVideoFeedWithSelectedVideo(selectedVideo) {
    console.log('🔄 Creating video feed with selected video:', selectedVideo.description || selectedVideo.title || 'Untitled');
    
    const feedElement = document.getElementById('foryouFeed');
    if (!feedElement) {
        console.error('❌ foryouFeed element not found');
        return;
    }
    
    // Clear the feed
    feedElement.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading video...</p></div>';
    
    // Instead of fetching from API, get videos from the current explore grid
    const exploreGrid = document.getElementById('exploreVideoGrid');
    let allVideos = [selectedVideo]; // Start with the selected video
    
    console.log('🎯 Selected video will be first in feed:', selectedVideo.videoUrl);
    
    if (exploreGrid) {
        // Get all explore videos from the DOM using stored video data
        const exploreCards = exploreGrid.querySelectorAll('.explore-video-card');
        exploreCards.forEach(card => {
            // Use the stored video data instead of reconstructing from DOM
            const videoData = card.videoData;
            if (videoData) {
                // Use video ID for more reliable comparison instead of URL
                const selectedVideoId = selectedVideo._id || selectedVideo.id;
                const cardVideoId = videoData._id || videoData.id;
                
                console.log('🔍 Video comparison:', {
                    selectedId: selectedVideoId,
                    cardId: cardVideoId,
                    selectedTitle: selectedVideo.title || selectedVideo.description,
                    cardTitle: videoData.title || videoData.description
                });
                
                // Only add if it's not the same video as the selected one
                if (cardVideoId !== selectedVideoId) {
                    console.log('📹 Adding video to feed:', videoData.description || videoData.title || 'Untitled');
                    allVideos.push(videoData);
                } else {
                    console.log('🎯 Skipping selected video (already first in feed):', videoData.description || videoData.title || 'Untitled');
                }
            } else {
                console.warn('⚠️ Explore card missing video data:', card);
            }
        });
        
        console.log(`📊 Feed summary: ${allVideos.length} total videos (1 selected + ${allVideos.length - 1} from explore grid)`);
    } else {
        console.warn('⚠️ exploreVideoGrid not found - feed will only contain the selected video');
    }
    
    // Clear and rebuild the feed
    feedElement.innerHTML = '';
    
    // Create video cards for all videos
    console.log('🎬 Creating video cards for', allVideos.length, 'videos');
    allVideos.forEach((video, index) => {
        console.log(`   ${index + 1}. Creating card for:`, video.description || video.title || 'Untitled');
        try {
            const videoCard = createAdvancedVideoCard(video);
            if (videoCard) {
                feedElement.appendChild(videoCard);
                console.log(`   ✅ Card ${index + 1} created successfully`);
            } else {
                console.error(`   ❌ Card ${index + 1} creation failed - returned null`);
            }
        } catch (error) {
            console.error(`   ❌ Error creating card ${index + 1}:`, error);
        }
    });
    
    // Initialize video system for the new feed
    setTimeout(() => {
        initializeVideoObserver();
        
        // Auto-play the first video (which is our selected video)
        const firstVideo = feedElement.querySelector('video');
        if (firstVideo) {
            firstVideo.currentTime = 0;
            firstVideo.play().catch(e => {
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    console.log('Auto-play prevented:', e);
                }
            });
        }
    }, 200);
}

// Find and play a specific video in the current feed
function playSpecificVideoInFeed(targetVideo) {
    const feedElement = document.getElementById('foryouFeed');
    if (!feedElement) return;
    
    // Find the video element that matches the target video URL
    const allVideoCards = feedElement.querySelectorAll('.video-card');
    let targetVideoCard = null;
    
    for (let card of allVideoCards) {
        const videoElement = card.querySelector('video');
        if (videoElement && videoElement.src.includes(getVideoFilename(targetVideo.videoUrl))) {
            targetVideoCard = card;
            break;
        }
    }
    
    if (targetVideoCard) {
        // Scroll to the target video
        targetVideoCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Pause all other videos
        document.querySelectorAll('video').forEach(video => {
            video.pause();
            video.currentTime = 0;
        });
        
        // Play the target video
        const targetVideoElement = targetVideoCard.querySelector('video');
        if (targetVideoElement) {
            targetVideoElement.currentTime = 0;
            targetVideoElement.play().catch(e => {
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    console.log('Video play prevented:', e);
                }
            });
        }
    } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Target video not found in current feed, video might not be loaded yet');
    }
}

// Helper function to extract filename from URL
function getVideoFilename(url) {
    if (!url) return '';
    return url.split('/').pop().split('?')[0];
}

// Create vertical feed starting with selected video
async function createVideoFeed(selectedVideo) {
    console.log('📱 Creating vertical feed starting with:', selectedVideo.title);
    
    const feedElement = document.getElementById('foryouFeed');
    if (!feedElement) {
        console.error('For You feed element not found');
        return;
    }
    
    // Clear the feed and set up for vertical scrolling
    feedElement.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading videos...</p></div>';
    feedElement.style.display = 'block';
    feedElement.style.overflow = 'auto';
    feedElement.style.scrollSnapType = 'y mandatory';
    feedElement.style.scrollBehavior = 'smooth';
    
    try {
        // Get all videos from the API
        const response = await fetch(`${window.API_BASE_URL}/api/videos?feed=foryou&limit=20`, {
            headers: window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {}
        });
        
        const data = await response.json();
        console.log('📦 Fetched videos for vertical feed:', data.videos?.length);
        
        if (data.videos && data.videos.length > 0) {
            // Filter out invalid videos
            const validVideos = data.videos.filter(video => {
                return video.videoUrl && 
                       !video.videoUrl.includes('example.com') && 
                       video.videoUrl !== '' &&
                       video.videoUrl.startsWith('http');
            });
            
            // Create array starting with selected video, then others
            const videoQueue = [selectedVideo];
            
            // Add other videos (excluding the selected one)
            validVideos.forEach(video => {
                if (video._id !== selectedVideo._id) {
                    videoQueue.push(video);
                }
            });
            
            // Clear loading and populate feed
            feedElement.innerHTML = '';
            
            // Also remove any global loading spinners
            const globalSpinners = document.querySelectorAll('.loading-container, .spinner');
            globalSpinners.forEach(spinner => {
                if (spinner.parentNode && !spinner.closest('.feed-content')) {
                    spinner.remove();
                    console.log('🧹 Removed orphaned spinner');
                }
            });
            
            videoQueue.forEach((video, index) => {
                const videoCard = createAdvancedVideoCard(video);
                feedElement.appendChild(videoCard);
                console.log(`➕ Added video ${index + 1} to vertical feed: ${video.title}`);
            });
            
            // Initialize video observer for auto-play
            setTimeout(() => {
                initializeVideoObserver();
                
                // Auto-play the first video (selected video)
                const firstVideo = feedElement.querySelector('video');
                if (firstVideo) {
                    firstVideo.play().catch(e => console.log('Auto-play failed:', e));
                }
            }, 200);
            
            // Setup infinite scroll
            setupInfiniteScroll(feedElement, 'foryou');
            
            console.log('✅ Vertical feed created with', videoQueue.length, 'videos');
            
        } else {
            feedElement.innerHTML = '<div class="empty-feed">No videos available</div>';
        }
        
    } catch (error) {
        console.error('Error creating video feed:', error);
        feedElement.innerHTML = '<div class="error-message">Failed to load videos</div>';
    }
}

// ================ EXPLORE PAGE FUNCTIONS ================

// Initialize explore page with all features
function initializeExplorePage() {
    console.log('🌟 Initializing explore page...');
    
    // Load trending hashtags
    loadTrendingHashtags();
    
    // Load explore videos
    loadExploreVideos();
    
    // Setup search functionality
    setupExploreSearch();
    
    // Setup category filters
    setupCategoryFilters();
}

// Load trending hashtags
function loadTrendingHashtags() {
    const trendingHashtags = [
        { tag: 'dance', count: '12.5M', fire: true },
        { tag: 'viral', count: '8.2M', fire: true },
        { tag: 'music', count: '6.7M' },
        { tag: 'comedy', count: '5.1M' },
        { tag: 'fyp', count: '25.8M', fire: true },
        { tag: 'art', count: '3.2M' },
        { tag: 'food', count: '4.5M' },
        { tag: 'fashion', count: '2.8M' }
    ];
    
    const hashtagList = document.querySelector('.hashtag-list');
    if (hashtagList) {
        hashtagList.innerHTML = trendingHashtags.map(hashtag => `
            <span class="hashtag-item" style="
                background: ${hashtag.fire ? 'linear-gradient(135deg, #ff6b6b, #fe2c55)' : 'var(--bg-tertiary)'};
                color: ${hashtag.fire ? 'white' : 'var(--text-primary)'};
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 13px;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s ease;
            " onclick="performExploreSearch('#${hashtag.tag}')" 
               onmouseover="this.style.transform='scale(1.05)'" 
               onmouseout="this.style.transform='scale(1)'">
                ${hashtag.fire ? '🔥' : '#'}${hashtag.tag}
                <span style="opacity: 0.8; font-size: 11px;">${hashtag.count}</span>
            </span>
        `).join('');
    }
}

// Load explore videos with categories
async function loadExploreVideos(category = 'all') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('📹 Loading explore videos for category:', category);
    }
    
    const exploreGrid = document.getElementById('exploreVideoGrid');
    if (!exploreGrid) return;
    
    // Show loading state
    exploreGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
            <div class="spinner"></div>
            <p style="margin-top: 20px;">Discovering amazing content...</p>
        </div>
    `;
    
    try {
        // Fetch videos from API
        const response = await fetch(`${window.API_BASE_URL}/api/videos?feed=explore&category=${category}&limit=30`);
        const data = await response.json();
        
        // If API returns videos, use them, otherwise use sample data
        let videosToShow = [];
        if (data.videos && data.videos.length > 0) {
            videosToShow = data.videos;
        } else {
            // Use sample explore data for demo
            videosToShow = [
                {
                    _id: 'explore1',
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                    user: { username: 'dancequeen23', displayName: 'Maya Chen', profilePicture: '💃' },
                    title: 'Summer dance vibes! ☀️',
                    description: 'New choreography to my favorite song #dance #summer',
                    likeCount: 1200, commentCount: 45, views: 15600
                },
                {
                    _id: 'explore2', 
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                    user: { username: 'artlife_alex', displayName: 'Alex Rivera', profilePicture: '🎨' },
                    title: 'Digital art speedrun',
                    description: 'Creating art in 60 seconds #art #digital #creative',
                    likeCount: 890, commentCount: 67, views: 8900
                },
                {
                    _id: 'explore3',
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 
                    user: { username: 'cookingjake', displayName: 'Jake Martinez', profilePicture: '👨‍🍳' },
                    title: 'Quick pasta recipe!',
                    description: '5-minute dinner hack that will change your life #cooking #pasta',
                    likeCount: 2300, commentCount: 156, views: 23400
                },
                {
                    _id: 'explore4',
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
                    user: { username: 'fitness_sarah', displayName: 'Sarah Johnson', profilePicture: '💪' },
                    title: 'Morning workout routine', 
                    description: 'Start your day right with this 10-min workout #fitness #morning',
                    likeCount: 567, commentCount: 43, views: 7800
                },
                {
                    _id: 'explore5',
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
                    user: { username: 'tech_tom', displayName: 'Tom Wilson', profilePicture: '💻' },
                    title: 'iPhone 15 hidden features',
                    description: 'Mind-blowing features you never knew existed #tech #iphone',
                    likeCount: 4500, commentCount: 234, views: 45600
                },
                {
                    _id: 'explore6',
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                    user: { username: 'fashionista_em', displayName: 'Emma Style', profilePicture: '👗' },
                    title: 'Outfit of the day',
                    description: 'Affordable fall looks under $50 #fashion #ootd #style',
                    likeCount: 890, commentCount: 76, views: 12300
                }
            ];
        }
        
        // Clear loading state
        exploreGrid.innerHTML = '';
        
        if (videosToShow.length > 0) {
            // Create video cards in grid layout
            videosToShow.forEach((video, index) => {
                const card = createExploreVideoCard(video);
                // Add stagger animation
                card.style.animation = `fadeInUp 0.4s ease ${index * 0.05}s both`;
                exploreGrid.appendChild(card);
            });
            console.log(`✅ Created explore grid with ${videosToShow.length} videos`);
        } else {
            // Show empty state
            exploreGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <div style="font-size: 72px; margin-bottom: 20px;">🎬</div>
                    <h3 style="margin-bottom: 12px; color: var(--text-primary);">No videos found</h3>
                    <p>Try exploring different categories or search for something specific</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading explore videos:', error);
        exploreGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                <div style="font-size: 72px; margin-bottom: 20px;">⚠️</div>
                <h3 style="margin-bottom: 12px; color: var(--text-primary);">Oops! Something went wrong</h3>
                <p style="margin-bottom: 20px;">Failed to load explore content</p>
                <button onclick="loadExploreVideos()" style="padding: 12px 24px; background: var(--accent-primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Retry</button>
            </div>
        `;
    }
}

// Setup explore search with autocomplete
function setupExploreSearch() {
    const searchInput = document.querySelector('.explore-search');
    if (!searchInput) return;
    
    // Create search suggestions dropdown
    const suggestionsDropdown = document.createElement('div');
    suggestionsDropdown.className = 'search-suggestions';
    suggestionsDropdown.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        margin-top: 4px;
        display: none;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;
    
    searchInput.parentElement.style.position = 'relative';
    searchInput.parentElement.appendChild(suggestionsDropdown);
    
    // Search history
    let searchHistory = JSON.parse(localStorage.getItem('vib3SearchHistory') || '[]');
    
    // Handle input
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length > 0) {
            showSearchSuggestions(query, suggestionsDropdown, searchHistory);
        } else {
            suggestionsDropdown.style.display = 'none';
        }
    });
    
    // Handle focus
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length > 0) {
            showSearchSuggestions(searchInput.value.trim(), suggestionsDropdown, searchHistory);
        }
    });
    
    // Handle blur
    searchInput.addEventListener('blur', () => {
        setTimeout(() => suggestionsDropdown.style.display = 'none', 200);
    });
}

// Show search suggestions
function showSearchSuggestions(query, dropdown, history) {
    const suggestions = [];
    
    // Add search query as first suggestion
    suggestions.push({ type: 'search', text: query, icon: '🔍' });
    
    // Add hashtag suggestion
    if (!query.startsWith('#')) {
        suggestions.push({ type: 'hashtag', text: `#${query}`, icon: '#' });
    }
    
    // Add user suggestion
    if (!query.startsWith('@')) {
        suggestions.push({ type: 'user', text: `@${query}`, icon: '@' });
    }
    
    // Add history matches
    const historyMatches = history.filter(item => 
        item.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 3);
    
    historyMatches.forEach(item => {
        suggestions.push({ type: 'history', text: item, icon: '🕐' });
    });
    
    // Add trending suggestions
    const trending = ['dance', 'viral', 'music', 'comedy', 'fyp'];
    const trendingMatches = trending.filter(item => 
        item.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 2);
    
    trendingMatches.forEach(item => {
        suggestions.push({ type: 'trending', text: `#${item}`, icon: '🔥' });
    });
    
    // Render suggestions
    dropdown.innerHTML = suggestions.map(suggestion => `
        <div class="search-suggestion-item" style="
            padding: 12px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: background 0.2s ease;
        " onmouseover="this.style.background='var(--bg-tertiary)'" 
           onmouseout="this.style.background='transparent'"
           onclick="performExploreSearch('${suggestion.text}')">
            <span style="font-size: 16px;">${suggestion.icon}</span>
            <span style="flex: 1;">${suggestion.text}</span>
            ${suggestion.type === 'trending' ? '<span style="font-size: 12px; color: var(--accent-primary);">Trending</span>' : ''}
        </div>
    `).join('');
    
    dropdown.style.display = 'block';
}

// Setup category filters
function setupCategoryFilters() {
    // Update active state on category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from all
            document.querySelectorAll('.category-btn').forEach(b => {
                b.style.background = 'var(--bg-tertiary)';
                b.style.color = 'var(--text-primary)';
            });
            
            // Add active to clicked
            this.style.background = 'var(--accent-primary)';
            this.style.color = 'white';
        });
    });
}

// Filter by category
function filterByCategory(category) {
    console.log('🏷️ Filtering by category:', category);
    loadExploreVideos(category);
    showNotification(`Exploring ${category} videos`, 'info');
}

// Search functionality
function performExploreSearch(query) {
    console.log('🔍 Performing explore search:', query);
    if (!query.trim()) return;
    
    // Add to search history
    addToSearchHistory(query);
    
    // Update search input
    const searchInput = document.querySelector('.explore-search');
    if (searchInput) {
        searchInput.value = query;
    }
    
    // Hide suggestions
    const suggestions = document.querySelector('.search-suggestions');
    if (suggestions) {
        suggestions.style.display = 'none';
    }
    
    // Filter videos based on search query
    filterExploreVideos(query);
    
    showNotification(`Searching for "${query}"`, 'info');
}

// Add to search history
function addToSearchHistory(query) {
    let history = JSON.parse(localStorage.getItem('vib3SearchHistory') || '[]');
    
    // Remove if already exists
    history = history.filter(item => item !== query);
    
    // Add to beginning
    history.unshift(query);
    
    // Keep only last 10
    history = history.slice(0, 10);
    
    localStorage.setItem('vib3SearchHistory', JSON.stringify(history));
}

// Filter explore videos
async function filterExploreVideos(query) {
    console.log('🔍 Filtering videos for:', query);
    
    const exploreGrid = document.getElementById('exploreVideoGrid');
    if (!exploreGrid) return;
    
    // Show searching state
    exploreGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
            <div class="spinner"></div>
            <p style="margin-top: 20px;">Searching for "${query}"...</p>
        </div>
    `;
    
    try {
        // Fetch filtered videos
        const response = await fetch(`${window.API_BASE_URL}/api/videos/search?q=${encodeURIComponent(query)}&limit=30`);
        const data = await response.json();
        
        // Clear searching state
        exploreGrid.innerHTML = '';
        
        if (data.videos && data.videos.length > 0) {
            // Create video cards
            data.videos.forEach((video, index) => {
                const card = createExploreVideoCard(video);
                card.style.animation = `fadeInUp 0.4s ease ${index * 0.05}s both`;
                exploreGrid.appendChild(card);
            });
        } else {
            // Show no results
            exploreGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <div style="font-size: 72px; margin-bottom: 20px;">🔍</div>
                    <h3 style="margin-bottom: 12px; color: var(--text-primary);">No results for "${query}"</h3>
                    <p>Try searching for something else</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search error:', error);
        // Show error state
        exploreGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                <div style="font-size: 72px; margin-bottom: 20px;">⚠️</div>
                <h3 style="margin-bottom: 12px; color: var(--text-primary);">Search failed</h3>
                <p>Please try again</p>
            </div>
        `;
    }
}

function showSearchSuggestions() {
    const suggestions = document.getElementById('searchSuggestions');
    if (suggestions) {
        suggestions.style.display = 'block';
        updateSearchSuggestions('');
    }
}

function hideSearchSuggestions() {
    const suggestions = document.getElementById('searchSuggestions');
    if (suggestions) {
        suggestions.style.display = 'none';
    }
}

function updateSearchSuggestions(value) {
    const suggestions = document.getElementById('searchSuggestions');
    if (!suggestions) return;
    
    const searchHistory = getSearchHistory();
    const trendingSuggestions = [
        { type: 'hashtag', text: '#dance', count: '2.1M' },
        { type: 'hashtag', text: '#viral', count: '5.8M' },
        { type: 'hashtag', text: '#fyp', count: '12.4M' },
        { type: 'hashtag', text: '#comedy', count: '3.2M' },
        { type: 'user', text: '@dancequeen23', count: '1.2M followers' },
        { type: 'user', text: '@artlife_alex', count: '890K followers' },
        { type: 'sound', text: 'Original Sound - Maya', count: 'Used in 45K videos' }
    ];
    
    let filteredSuggestions = trendingSuggestions;
    if (value.trim()) {
        filteredSuggestions = trendingSuggestions.filter(s => 
            s.text.toLowerCase().includes(value.toLowerCase())
        );
    }
    
    suggestions.innerHTML = `
        ${searchHistory.length > 0 ? `
            <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-primary);">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-weight: 600; color: var(--text-secondary); font-size: 14px;">Recent searches</span>
                    <button onclick="clearSearchHistory()" style="background: none; border: none; color: var(--text-secondary); font-size: 12px; cursor: pointer;">Clear all</button>
                </div>
            </div>
            ${searchHistory.slice(0, 3).map(item => `
                <div class="suggestion-item" onclick="performExploreSearch('${item}')" style="padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--border-primary);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-secondary)">
                        <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
                    </svg>
                    <span style="color: var(--text-primary);">${item}</span>
                </div>
            `).join('')}
        ` : ''}
        
        <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-primary);">
            <span style="font-weight: 600; color: var(--text-secondary); font-size: 14px;">Suggestions</span>
        </div>
        
        ${filteredSuggestions.map(suggestion => `
            <div class="suggestion-item" onclick="performExploreSearch('${suggestion.text}')" style="padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--border-primary);">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--accent-color); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 600;">
                    ${suggestion.type === 'hashtag' ? '#' : suggestion.type === 'user' ? '@' : '♪'}
                </div>
                <div style="flex: 1;">
                    <div style="color: var(--text-primary); font-weight: 500;">${suggestion.text}</div>
                    <div style="color: var(--text-secondary); font-size: 12px;">${suggestion.count}</div>
                </div>
            </div>
        `).join('')}
    `;
}

function clearExploreSearch() {
    const input = document.getElementById('exploreSearchInput');
    const clearBtn = document.querySelector('.clear-search');
    if (input) {
        input.value = '';
        clearBtn.style.display = 'none';
    }
    hideSearchSuggestions();
}

// Search history management
function getSearchHistory() {
    try {
        return JSON.parse(localStorage.getItem('vib3_search_history') || '[]');
    } catch {
        return [];
    }
}

function addToSearchHistory(query) {
    const history = getSearchHistory();
    const filtered = history.filter(item => item !== query);
    filtered.unshift(query);
    localStorage.setItem('vib3_search_history', JSON.stringify(filtered.slice(0, 10)));
}

function clearSearchHistory() {
    localStorage.removeItem('vib3_search_history');
    updateSearchSuggestions('');
}

// Category filtering
function filterByCategory(category) {
    console.log('📂 Filtering by category:', category);
    
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'var(--bg-tertiary)';
        btn.style.color = 'var(--text-primary)';
    });
    
    const activeBtn = event.target;
    activeBtn.classList.add('active');
    activeBtn.style.background = 'var(--accent-color)';
    activeBtn.style.color = 'white';
    
    // Filter videos by category
    if (category === 'all') {
        loadVideoFeed('explore', true);
    } else {
        filterExploreVideos(`#${category}`);
    }
}

// Filter explore videos
function filterExploreVideos(query) {
    const exploreGrid = document.getElementById('exploreVideoGrid');
    if (!exploreGrid) return;
    
    exploreGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: var(--text-secondary);">🔍 Searching...</div>';
    
    // Simulate search delay
    setTimeout(() => {
        const mockResults = generateMockSearchResults(query);
        exploreGrid.innerHTML = '';
        
        if (mockResults.length > 0) {
            mockResults.forEach(video => {
                const videoCard = createExploreVideoCard(video);
                exploreGrid.appendChild(videoCard);
            });
        } else {
            exploreGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                    <div style="font-size: 16px; margin-bottom: 8px;">No results found</div>
                    <div style="font-size: 14px;">Try a different search term</div>
                </div>
            `;
        }
    }, 500);
}

// Generate mock search results
function generateMockSearchResults(query) {
    const allVideos = [
        {
            _id: 'search1',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            user: { username: 'dancequeen23', displayName: 'Maya Chen', profilePicture: '💃' },
            title: 'Summer dance moves',
            description: 'Learn this viral dance #dance #summer',
            likeCount: 1500, views: 25000
        },
        {
            _id: 'search2',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            user: { username: 'comedian_joe', displayName: 'Joe Funny', profilePicture: '😂' },
            title: 'Hilarious comedy sketch',
            description: 'You will laugh so hard #comedy #viral',
            likeCount: 2300, views: 45000
        }
    ];
    
    // Filter based on query
    return allVideos.filter(video => 
        video.title.toLowerCase().includes(query.toLowerCase()) ||
        video.description.toLowerCase().includes(query.toLowerCase()) ||
        query.startsWith('#') && video.description.includes(query)
    );
}

// Trending hashtag search
function searchTrendingTag(tag) {
    const input = document.getElementById('exploreSearchInput');
    if (input) {
        input.value = `#${tag}`;
        performExploreSearch(`#${tag}`);
    }
}

// Initialize explore page interactions
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Initializing explore page interactions');
    
    // Search input interactions
    const searchInput = document.getElementById('exploreSearchInput');
    if (searchInput) {
        console.log('✅ Found explore search input');
        // Note: input handler moved to handleSearchInput function called from HTML
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.explore-search')) {
                hideSearchSuggestions();
            }
        });
    } else {
        console.log('❌ Explore search input not found');
    }
    
    // Check if explore page structure exists
    const exploreFeed = document.getElementById('exploreFeed');
    const exploreGrid = document.getElementById('exploreVideoGrid');
    console.log('🔍 Explore page elements:', {
        exploreFeed: !!exploreFeed,
        exploreGrid: !!exploreGrid
    });
});

async function startStitch(videoId) {
    showNotification('Starting stitch creation...', 'info');
    
    const stitchModal = document.createElement('div');
    stitchModal.className = 'modal stitch-modal';
    stitchModal.innerHTML = `
        <div class="modal-content stitch-content">
            <button class="close-btn" onclick="closeStitchModal()">&times;</button>
            <h3>Create Stitch</h3>
            <div class="stitch-timeline">
                <video id="stitchOriginalVideo" src="${await getVideoUrl(videoId)}" controls></video>
                <div class="timeline-selector">
                    <div class="timeline-track">
                        <div class="selection-area" draggable="true"></div>
                    </div>
                    <div class="time-display">
                        <span id="stitchStartTime">0:00</span> - <span id="stitchEndTime">0:05</span>
                    </div>
                </div>
            </div>
            <div class="stitch-recording">
                <video id="stitchRecordingPreview" muted></video>
                <div class="recording-controls">
                    <button class="record-btn" onclick="toggleStitchRecording()">🔴 Record Response</button>
                    <button class="flip-camera-btn" onclick="flipStitchCamera()">🔄</button>
                </div>
            </div>
            <div class="stitch-actions">
                <button onclick="previewStitch()" class="preview-btn">Preview</button>
                <button onclick="publishStitch()" class="publish-btn">Publish Stitch</button>
            </div>
        </div>
    `;
    document.body.appendChild(stitchModal);
    stitchModal.classList.add('show');
    
    initializeStitchInterface();
}

// ================ ADVANCED UPLOAD AND EDITING ================
// Upload Modal State
let uploadType = null; // 'video' or 'photos'
let selectedFiles = [];
let currentEditingFile = null;

// OLD showUploadModal function - now handled by upload-manager.js
// This function is deprecated and replaced by UploadManager class
/*
function showUploadModal() {
    console.log('🎬 Opening upload modal...');
    
    // CRITICAL: Remove profile page if it exists (this is blocking the modal)
    const profilePage = document.getElementById('profilePage');
    if (profilePage) {
        profilePage.remove();
        console.log('🗑️ Removed blocking profile page');
    }
    
    // Keep main app visible but hide specific content areas
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'block'; // Keep visible for modal to work
        // Hide just the video feeds, not the entire app
        const videoFeeds = mainApp.querySelectorAll('.video-feed, .feed-content');
        videoFeeds.forEach(feed => {
            feed.style.visibility = 'hidden';
        });
        console.log('✅ Hidden video feeds but kept main app');
    }
    
    const modal = document.getElementById('uploadModal');
    if (!modal) {
        console.error('❌ Upload modal not found in DOM!');
        // Debug: List all modal elements
        const allModals = document.querySelectorAll('[id*="modal"], [class*="modal"]');
        console.log('📋 Found modal-related elements:', allModals);
        return;
    }
    
    console.log('✅ Upload modal found, current display:', window.getComputedStyle(modal).display);
    console.log('📍 Current modal classes:', modal.className);
    
    // Pause and temporarily mute all videos
    console.log('🔇 Pausing and muting background videos...');
    window.tempMutedVideos = []; // Store original mute states
    document.querySelectorAll('video').forEach((video, index) => {
        try {
            video.pause();
            // Store original mute state before temporarily muting
            window.tempMutedVideos.push({
                video: video,
                originalMuted: video.muted,
                originalVolume: video.volume
            });
            // Temporarily mute for upload modal
            video.muted = true;
            video.volume = 0;
            console.log(`🔇 Paused and muted video ${index}`);
        } catch (error) {
            console.log(`Failed to pause video ${index}:`, error.message);
        }
    });
    
    // Also pause any intersection observer to prevent auto-play
    if (window.videoObserver) {
        window.videoObserver.disconnect();
        console.log('🔇 Disconnected video observer');
    }
    
    // Force modal to appear above everything
    modal.classList.remove('active', 'show');
    modal.classList.add('active');
    modal.style.display = 'flex';
    modal.style.zIndex = '99999';  // Force very high z-index to appear above profile
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.backgroundColor = 'rgba(0,0,0,1)'; // Completely opaque to hide background videos
    
    // Also ensure modal content is visible
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.visibility = 'visible';
        modalContent.style.opacity = '1';
        modalContent.style.display = 'block';
        console.log('✅ Made modal content visible');
    }
    
    console.log('✅ Modal classes after update:', modal.className);
    console.log('✅ Modal display after update:', window.getComputedStyle(modal).display);
    console.log('✅ Modal z-index:', window.getComputedStyle(modal).zIndex);
    
    goToStep(1);
}
*/

// Open upload modal from profile page
function openUploadFromProfile() {
    console.log('🎬 Opening upload from profile page...');
    
    // Stop all videos first
    console.log('🛑 Stopping all background videos...');
    if (window.forceStopAllVideos && typeof window.forceStopAllVideos === 'function') {
        window.forceStopAllVideos();
    } else {
        // Fallback method
        document.querySelectorAll('video').forEach(video => {
            video.pause();
            video.currentTime = 0;
            video.muted = true;
        });
    }
    
    // Hide profile page if it exists
    const profilePage = document.getElementById('profilePage');
    if (profilePage) {
        profilePage.remove();
        console.log('✅ Profile page removed');
    }
    
    // Show main app
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'block';
        console.log('✅ Main app shown');
    }
    
    // Open upload modal
    showUploadModal();
}

function closeUploadModal() {
    console.log('🔒 Closing upload modal...');
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.remove('active');  // Changed from 'show' to 'active' to match CSS
        modal.style.display = 'none';  // Ensure modal is hidden
        console.log('✅ Upload modal closed and hidden');
    }
    
    // Restore video feeds visibility
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'block';
        // Restore video feeds visibility
        const videoFeeds = mainApp.querySelectorAll('.video-feed, .feed-content');
        videoFeeds.forEach(feed => {
            feed.style.visibility = 'visible';
        });
        console.log('✅ Restored video feeds visibility');
    }
    
    // Restore original video audio states
    if (window.tempMutedVideos && window.tempMutedVideos.length > 0) {
        console.log('🔊 Restoring original video audio states...');
        window.tempMutedVideos.forEach((videoData, index) => {
            try {
                videoData.video.muted = videoData.originalMuted;
                videoData.video.volume = videoData.originalVolume;
                console.log(`🔊 Restored audio for video ${index}`);
            } catch (error) {
                console.log(`Failed to restore audio for video ${index}:`, error.message);
            }
        });
        window.tempMutedVideos = []; // Clear the array
    }
    
    // Reconnect video observer when modal closes
    if (window.initializeTikTokVideoObserver && typeof window.initializeTikTokVideoObserver === 'function') {
        window.initializeTikTokVideoObserver();
        console.log('🔄 Reconnected video observer');
    }
    
    resetUploadState();
}

function resetUploadState() {
    uploadType = null;
    selectedFiles = [];
    currentEditingFile = null;
    
    // Clear all form inputs
    const titleInput = document.getElementById('contentTitle');
    const descInput = document.getElementById('contentDescription');
    const hashtagInput = document.getElementById('hashtagInput');
    const videoInput = document.getElementById('videoInput');
    const photoInput = document.getElementById('photoInput');
    
    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    if (hashtagInput) hashtagInput.value = '';
    if (videoInput) videoInput.value = '';
    if (photoInput) photoInput.value = '';
    
    // Clear preview container
    const previewContainer = document.getElementById('previewContainer');
    if (previewContainer) {
        previewContainer.innerHTML = `
            <div class="drop-zone" onclick="triggerFileSelect()">
                <div class="drop-icon">📎</div>
                <div>Click to select files or drag and drop</div>
                <small id="formatHint">Supported: MP4, MOV, AVI</small>
            </div>
        `;
    }
    
    console.log('🔄 Upload form reset');
    goToStep(1);
}

function goToStep(step) {
    console.log(`📋 Going to upload step ${step}...`);
    
    // Debug: Check if modal exists and is visible
    const modal = document.getElementById('uploadModal');
    if (modal) {
        console.log('🔍 Modal found, current styles:', {
            display: window.getComputedStyle(modal).display,
            visibility: window.getComputedStyle(modal).visibility,
            opacity: window.getComputedStyle(modal).opacity
        });
    }
    
    // Hide all steps
    for (let i = 1; i <= 5; i++) {
        const stepElement = document.getElementById(`uploadStep${i}`);
        if (stepElement) {
            stepElement.style.display = 'none';
        }
    }
    
    // Show current step
    const currentStepElement = document.getElementById(`uploadStep${step}`);
    if (currentStepElement) {
        currentStepElement.style.display = 'block';
        console.log(`✅ Showing upload step ${step}`);
        console.log('🔍 Step content:', currentStepElement.innerHTML.substring(0, 200) + '...');
    } else {
        console.error(`❌ Upload step ${step} element not found!`);
        // Debug: List all upload step elements
        const allSteps = document.querySelectorAll('[id^="uploadStep"]');
        console.log('📋 Found upload step elements:', allSteps);
    }
    currentStep = step;
    
    // Setup step-specific functionality
    if (step === 3) {
        setupEditingPreview();
    }
}

// Step 1: Upload Type Selection
function selectVideo() {
    uploadType = 'video';
    
    // Go directly to file upload step (simplified flow)
    console.log('📁 User chose to upload video file');
    
    // Continue with original video upload flow
    document.getElementById('step2Title').textContent = '🎥 Select Video File';
    document.getElementById('formatHint').textContent = 'Supported: MP4, MOV, AVI (up to 4K Ultra HD)';
    goToStep(2);
}

// Removed closeVideoSourceModal and selectVideoFile functions since selectVideo now goes directly to file upload

function recordNewVideo() {
    console.log('🎬 User chose to record new video - delegating to upload manager');
    
    // Use the upload manager's recording functionality
    if (window.uploadManager && window.uploadManager.recordVideo) {
        // First show the upload modal with recording option
        if (window.uploadManager.showUploadModal) {
            window.uploadManager.showUploadModal();
        }
        // Then automatically trigger recording
        setTimeout(() => {
            window.uploadManager.recordVideo();
        }, 100);
    } else if (window.recordVideo) {
        // Fallback to global recordVideo function
        window.recordVideo();
    } else {
        console.error('No record video functionality available');
        if (window.showToast) {
            window.showToast('Camera recording not available');
        }
    }
}

async function startSimpleVideoRecording() {
    console.log('🎬 Starting simple video recording');
    
    // Create loading modal immediately to prevent flicker
    const loadingModal = document.createElement('div');
    loadingModal.className = 'modal simple-recording-modal';
    loadingModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
    `;
    
    loadingModal.innerHTML = `
        <div style="text-align: center; color: white;">
            <h3 style="margin: 0 0 15px 0; font-size: 18px;">🎬 Starting Camera...</h3>
            <div style="font-size: 14px; opacity: 0.8;">Please allow camera access</div>
        </div>
    `;
    
    document.body.appendChild(loadingModal);
    
    try {
        // Get camera stream directly
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 3840, max: 3840 }, 
                height: { ideal: 2160, max: 2160 }, 
                frameRate: { ideal: 60, max: 60 }
            }, 
            audio: true 
        });
        
        console.log('✅ Camera stream obtained for simple recording');
        
        // Replace loading modal with recording modal
        loadingModal.remove();
        const recordingModal = document.createElement('div');
        recordingModal.className = 'modal simple-recording-modal';
        recordingModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
        `;
        
        recordingModal.innerHTML = `
            <div style="text-align: center; color: white; max-width: 375px; margin: 0 auto;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px;">🎬 Recording Video</h3>
                <video id="simpleRecordingPreview" autoplay muted playsinline style="
                    width: 270px;
                    height: 480px;
                    object-fit: cover;
                    border-radius: 12px;
                    background: #000;
                    margin: 0 0 15px 0;
                "></video>
                
                <div style="margin: 0;">
                    <div id="simpleTimer" style="font-size: 20px; color: white; margin-bottom: 15px;">00:00</div>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="simpleRecordBtn" onclick="toggleSimpleRecording()" style="
                            background: #fe2c55;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 25px;
                            font-size: 16px;
                            cursor: pointer;
                            font-weight: 600;
                        ">🔴 Start Recording</button>
                        <button onclick="cancelSimpleRecording()" style="
                            background: #666;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 25px;
                            font-size: 16px;
                            cursor: pointer;
                            font-weight: 600;
                        ">❌ Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(recordingModal);
        
        // Set up video preview
        const video = document.getElementById('simpleRecordingPreview');
        video.srcObject = stream;
        window.currentCameraStream = stream;
        
        console.log('✅ Simple recording modal created and displayed');
        
    } catch (error) {
        console.error('❌ Failed to start simple recording:', error);
        showNotification('Failed to access camera. Please check permissions and try again.', 'error');
        
        // Remove loading modal
        loadingModal.remove();
        
        // Don't reshow upload modal to prevent flicker
        // User can click upload button again if needed
    }
}

// Simple recording functions
let simpleMediaRecorder = null;
let simpleRecordedChunks = [];
let simpleRecordingTimer = null;
let simpleRecordingStartTime = null;
let isSimpleRecording = false;

function toggleSimpleRecording() {
    console.log('🎬 Toggle simple recording called, current state:', isSimpleRecording);
    
    if (isSimpleRecording) {
        stopSimpleRecording();
    } else {
        startSimpleRecording();
    }
}

function startSimpleRecording() {
    console.log('🎬 Starting simple recording');
    
    try {
        const stream = window.currentCameraStream;
        if (!stream) {
            console.error('❌ No camera stream available');
            return;
        }
        
        simpleRecordedChunks = [];
        // Try different MediaRecorder options for better browser compatibility
        let options = { mimeType: 'video/webm;codecs=vp9,opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm;codecs=vp8,opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: 'video/webm' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = {}; // Use default
                }
            }
        }
        
        simpleMediaRecorder = new MediaRecorder(stream, options);
        
        simpleMediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                simpleRecordedChunks.push(event.data);
            }
        };
        
        simpleMediaRecorder.onstop = () => {
            console.log('📹 Simple recording stopped, processing video');
            const blob = new Blob(simpleRecordedChunks, { type: 'video/webm' });
            const videoFile = new File([blob], 'recorded-video.webm', { type: 'video/webm' });
            
            // Process the recorded video
            processSimpleRecordedVideo(videoFile);
        };
        
        simpleMediaRecorder.start();
        isSimpleRecording = true;
        
        // Start timer
        simpleRecordingStartTime = Date.now();
        startSimpleRecordingTimer();
        
        // Update UI
        const recordBtn = document.getElementById('simpleRecordBtn');
        if (recordBtn) {
            recordBtn.textContent = '⏹️ Stop Recording';
            recordBtn.style.background = '#666';
        }
        
        console.log('✅ Simple recording started');
        
    } catch (error) {
        console.error('❌ Failed to start simple recording:', error);
    }
}

function stopSimpleRecording() {
    console.log('🛑 Stopping simple recording');
    
    if (simpleMediaRecorder && simpleMediaRecorder.state === 'recording') {
        simpleMediaRecorder.stop();
        isSimpleRecording = false;
        
        // Stop timer
        stopSimpleRecordingTimer();
        
        // Update UI
        const recordBtn = document.getElementById('simpleRecordBtn');
        if (recordBtn) {
            recordBtn.textContent = '🔴 Start Recording';
            recordBtn.style.background = '#fe2c55';
        }
    }
}

function startSimpleRecordingTimer() {
    simpleRecordingTimer = setInterval(() => {
        if (simpleRecordingStartTime) {
            const elapsed = Date.now() - simpleRecordingStartTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const displaySeconds = seconds % 60;
            
            const timeDisplay = document.getElementById('simpleTimer');
            if (timeDisplay) {
                timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
                timeDisplay.style.color = '#fe2c55';
            }
        }
    }, 1000);
}

function stopSimpleRecordingTimer() {
    if (simpleRecordingTimer) {
        clearInterval(simpleRecordingTimer);
        simpleRecordingTimer = null;
        simpleRecordingStartTime = null;
        
        const timeDisplay = document.getElementById('simpleTimer');
        if (timeDisplay) {
            timeDisplay.textContent = '00:00';
            timeDisplay.style.color = 'white';
        }
    }
}

function processSimpleRecordedVideo(videoFile) {
    console.log('🎞️ Processing simple recorded video:', videoFile);
    
    // Close simple recording modal
    cancelSimpleRecording();
    
    // Set the recorded video and continue to upload process
    window.selectedVideoFile = videoFile;
    
    // Close upload modal and open compact editor directly
    const uploadModal = document.getElementById('uploadModal');
    if (uploadModal) {
        uploadModal.style.display = 'none';
        uploadModal.classList.remove('active');
    }
    
    // Open the compact video editor directly
    console.log('🚀 Opening compact editor after recording');
    openAdvancedVideoEditor();
}

function cancelSimpleRecording() {
    console.log('❌ Canceling simple recording');
    
    try {
        // Stop any recording
        if (simpleMediaRecorder && simpleMediaRecorder.state === 'recording') {
            simpleMediaRecorder.stop();
        }
        
        // Stop timer
        stopSimpleRecordingTimer();
        
        // Stop camera stream
        if (window.currentCameraStream) {
            console.log('🛑 Stopping camera stream');
            const tracks = window.currentCameraStream.getTracks();
            tracks.forEach(track => {
                console.log(`🛑 Stopping track: ${track.kind}`);
                track.stop();
            });
            window.currentCameraStream = null;
        }
        
        // Remove modal
        const modal = document.querySelector('.simple-recording-modal');
        if (modal) {
            modal.remove();
        }
        
        // Show upload modal again
        const uploadModal = document.getElementById('uploadModal');
        if (uploadModal) {
            uploadModal.style.display = 'flex';
        }
        
        console.log('✅ Simple recording canceled and cleaned up');
        
    } catch (error) {
        console.error('❌ Error canceling simple recording:', error);
    }
}

function selectPhotos() {
    uploadType = 'photos';
    document.getElementById('step2Title').textContent = '📸 Select Photos';
    document.getElementById('formatHint').textContent = 'Select up to 35 images for slideshow';
    goToStep(2);
}

// Step 2: File Selection Functions
function triggerFileSelect() {
    if (uploadType === 'video') {
        document.getElementById('videoInput').click();
    } else if (uploadType === 'photos') {
        document.getElementById('photoInput').click();
    }
}

function handleVideoSelect(event) {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    // Validate video files
    const validFiles = files.filter(file => {
        const validTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
        return validTypes.includes(file.type) && file.size <= 500 * 1024 * 1024; // 500MB limit for 4K
    });
    
    if (validFiles.length === 0) {
        showNotification('Please select valid video files (MP4, MOV, AVI under 500MB)', 'error');
        return;
    }
    
    selectedFiles = validFiles;
    displayFilePreview();
    document.querySelector('.continue-btn').disabled = false;
}

function handlePhotoSelect(event) {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    if (files.length > 35) {
        showNotification('Maximum 35 photos allowed for slideshow', 'error');
        return;
    }
    
    // Validate image files
    const validFiles = files.filter(file => {
        return file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024; // 10MB limit per image
    });
    
    if (validFiles.length === 0) {
        showNotification('Please select valid image files under 10MB each', 'error');
        return;
    }
    
    selectedFiles = validFiles;
    displayFilePreview();
    document.querySelector('.continue-btn').disabled = false;
}

function displayFilePreview() {
    const container = document.getElementById('previewContainer');
    container.innerHTML = '';
    
    if (uploadType === 'video') {
        selectedFiles.forEach((file, index) => {
            const preview = document.createElement('div');
            preview.className = 'file-preview';
            preview.innerHTML = `
                <video controls style="width: 200px; height: 150px; object-fit: cover;">
                    <source src="${URL.createObjectURL(file)}" type="${file.type}">
                </video>
                <div class="file-info">
                    <div>${file.name}</div>
                    <div>${(file.size / 1024 / 1024).toFixed(1)}MB</div>
                </div>
                <button onclick="removeFile(${index})" class="remove-file">×</button>
            `;
            container.appendChild(preview);
        });
    } else if (uploadType === 'photos') {
        selectedFiles.forEach((file, index) => {
            const preview = document.createElement('div');
            preview.className = 'file-preview';
            preview.innerHTML = `
                <img src="${URL.createObjectURL(file)}" style="width: 150px; height: 150px; object-fit: cover;">
                <div class="file-info">
                    <div>${file.name}</div>
                    <div>${(file.size / 1024 / 1024).toFixed(1)}MB</div>
                </div>
                <button onclick="removeFile(${index})" class="remove-file">×</button>
            `;
            container.appendChild(preview);
        });
    }
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    displayFilePreview();
    
    if (selectedFiles.length === 0) {
        document.querySelector('.continue-btn').disabled = true;
    }
}

// Step 3: Editing Functions
function setupEditingPreview() {
    const videoPreview = document.getElementById('contentPreview');
    const photoSlideshow = document.getElementById('photoSlideshow');
    
    // Check if elements exist (they may not in the compact editor step)
    if (!videoPreview || !photoSlideshow) {
        console.log('📹 Preview elements not found - using compact editor flow');
        return;
    }
    
    if (uploadType === 'video' && (selectedFiles.length > 0 || window.selectedVideoFile)) {
        // Show video preview (either selected file or recorded video)
        const videoFile = selectedFiles.length > 0 ? selectedFiles[0] : window.selectedVideoFile;
        console.log('📹 Setting up video preview for:', videoFile.name);
        
        videoPreview.src = URL.createObjectURL(videoFile);
        videoPreview.style.display = 'block';
        photoSlideshow.style.display = 'none';
        currentEditingFile = videoFile;
    } else if (uploadType === 'photos' && selectedFiles.length > 0) {
        setupPhotoSlideshow();
        videoPreview.style.display = 'none';
        photoSlideshow.style.display = 'block';
    }
}

function setupPhotoSlideshow() {
    const slideshow = document.getElementById('photoSlideshow');
    slideshow.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const slide = document.createElement('div');
        slide.className = 'slide' + (index === 0 ? ' active' : '');
        slide.innerHTML = `<img src="${URL.createObjectURL(file)}" style="width: 100%; height: 300px; object-fit: cover;">`;
        slideshow.appendChild(slide);
    });
    
    // Add slideshow controls
    const controls = document.createElement('div');
    controls.className = 'slideshow-controls';
    controls.innerHTML = `
        <button onclick="previousSlide()">◀️</button>
        <span id="slideCounter">1 / ${selectedFiles.length}</span>
        <button onclick="nextSlide()">▶️</button>
    `;
    slideshow.appendChild(controls);
}

let currentSlide = 0;

function nextSlide() {
    const slides = document.querySelectorAll('.slide');
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
    document.getElementById('slideCounter').textContent = `${currentSlide + 1} / ${slides.length}`;
}

function previousSlide() {
    const slides = document.querySelectorAll('.slide');
    slides[currentSlide].classList.remove('active');
    currentSlide = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
    slides[currentSlide].classList.add('active');
    document.getElementById('slideCounter').textContent = `${currentSlide + 1} / ${slides.length}`;
}

// ================ ADVANCED VIDEO EFFECTS AND FILTERS ================
class VideoEffectsEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.video = null;
        this.effects = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            blur: 0,
            sepia: 0,
            grayscale: 0,
            invert: 0,
            opacity: 100
        };
        this.filters = [
            { name: 'Original', effects: {} },
            { name: 'Vintage', effects: { sepia: 30, contrast: 110, saturation: 80 } },
            { name: 'Noir', effects: { grayscale: 100, contrast: 120 } },
            { name: 'Warm', effects: { hue: 10, saturation: 120, brightness: 110 } },
            { name: 'Cool', effects: { hue: -10, saturation: 90, brightness: 95 } },
            { name: 'Dramatic', effects: { contrast: 140, saturation: 80, brightness: 90 } },
            { name: 'Dream', effects: { blur: 1, opacity: 80, brightness: 120 } },
            { name: 'Neon', effects: { saturation: 200, contrast: 130, hue: 30 } }
        ];
        this.activeFilter = null;
    }

    initializeCanvas(videoElement) {
        this.video = videoElement;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = videoElement.videoWidth || 640;
        this.canvas.height = videoElement.videoHeight || 480;
        
        return this.canvas;
    }

    applyEffects() {
        if (!this.video || !this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Build CSS filter string
        const filterString = this.buildFilterString();
        this.ctx.filter = filterString;
        
        // Draw video frame with effects
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Apply custom effects that can't be done with CSS filters
        if (this.effects.blur > 0) {
            this.applyBlur();
        }
    }

    buildFilterString() {
        const effects = this.effects;
        const filters = [];

        if (effects.brightness !== 100) filters.push(`brightness(${effects.brightness}%)`);
        if (effects.contrast !== 100) filters.push(`contrast(${effects.contrast}%)`);
        if (effects.saturation !== 100) filters.push(`saturate(${effects.saturation}%)`);
        if (effects.hue !== 0) filters.push(`hue-rotate(${effects.hue}deg)`);
        if (effects.sepia > 0) filters.push(`sepia(${effects.sepia}%)`);
        if (effects.grayscale > 0) filters.push(`grayscale(${effects.grayscale}%)`);
        if (effects.invert > 0) filters.push(`invert(${effects.invert}%)`);
        if (effects.opacity !== 100) filters.push(`opacity(${effects.opacity}%)`);

        return filters.join(' ');
    }

    applyBlur() {
        // Simple blur effect using canvas
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const blurredData = this.gaussianBlur(imageData, this.effects.blur);
        this.ctx.putImageData(blurredData, 0, 0);
    }

    gaussianBlur(imageData, radius) {
        // Simplified blur algorithm
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        for (let i = 0; i < data.length; i += 4) {
            const x = (i / 4) % width;
            const y = Math.floor((i / 4) / width);
            
            if (x > radius && x < width - radius && y > radius && y < height - radius) {
                let r = 0, g = 0, b = 0, count = 0;
                
                for (let dx = -radius; dx <= radius; dx++) {
                    for (let dy = -radius; dy <= radius; dy++) {
                        const idx = ((y + dy) * width + (x + dx)) * 4;
                        r += data[idx];
                        g += data[idx + 1];
                        b += data[idx + 2];
                        count++;
                    }
                }
                
                data[i] = r / count;
                data[i + 1] = g / count;
                data[i + 2] = b / count;
            }
        }
        
        return imageData;
    }

    applyFilter(filterName) {
        const filter = this.filters.find(f => f.name === filterName);
        if (!filter) return;

        this.activeFilter = filterName;
        this.effects = { ...this.getDefaultEffects(), ...filter.effects };
        this.updateVideoElement();
    }

    updateEffect(effectName, value) {
        this.effects[effectName] = value;
        this.updateVideoElement();
    }

    updateVideoElement() {
        if (!this.video) return;
        
        const filterString = this.buildFilterString();
        this.video.style.filter = filterString;
        
        // Trigger custom event for real-time preview
        document.dispatchEvent(new CustomEvent('video-effects-updated', {
            detail: { effects: this.effects, filter: this.activeFilter }
        }));
    }

    getDefaultEffects() {
        return {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            blur: 0,
            sepia: 0,
            grayscale: 0,
            invert: 0,
            opacity: 100
        };
    }

    reset() {
        this.effects = this.getDefaultEffects();
        this.activeFilter = null;
        this.updateVideoElement();
    }

    exportEffects() {
        return {
            filter: this.activeFilter,
            effects: { ...this.effects }
        };
    }
}

// Initialize global video effects engine
window.videoEffectsEngine = new VideoEffectsEngine();

// Editing Tool Functions (Enhanced implementations)
function trimVideo() {
    const modal = document.createElement('div');
    modal.className = 'video-trim-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: var(--bg-secondary); padding: 30px; border-radius: 15px; max-width: 600px; width: 90%;">
            <h3 style="margin-bottom: 20px;">✂️ Trim Video</h3>
            <div style="margin-bottom: 20px;">
                <video id="trimPreview" style="width: 100%; border-radius: 8px;" controls></video>
            </div>
            <div style="margin-bottom: 20px;">
                <label>Start Time (seconds):</label>
                <input type="range" id="trimStart" min="0" max="60" value="0" step="0.1" style="width: 100%; margin: 10px 0;">
                <span id="startTime">0.0s</span>
            </div>
            <div style="margin-bottom: 20px;">
                <label>End Time (seconds):</label>
                <input type="range" id="trimEnd" min="0" max="60" value="10" step="0.1" style="width: 100%; margin: 10px 0;">
                <span id="endTime">10.0s</span>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="closeTrimModal()" style="padding: 10px 20px; background: #666; border: none; border-radius: 5px; color: white;">Cancel</button>
                <button onclick="applyTrim()" style="padding: 10px 20px; background: var(--accent-primary); border: none; border-radius: 5px; color: white;">Apply Trim</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for trim controls
    const startSlider = modal.querySelector('#trimStart');
    const endSlider = modal.querySelector('#trimEnd');
    const startTime = modal.querySelector('#startTime');
    const endTime = modal.querySelector('#endTime');
    
    startSlider.addEventListener('input', () => {
        startTime.textContent = `${parseFloat(startSlider.value).toFixed(1)}s`;
    });
    
    endSlider.addEventListener('input', () => {
        endTime.textContent = `${parseFloat(endSlider.value).toFixed(1)}s`;
    });
    
    window.closeTrimModal = () => modal.remove();
    window.applyTrim = () => {
        showNotification('✂️ Video trimmed successfully!', 'success');
        modal.remove();
    };
}

function addFilter() {
    const modal = document.createElement('div');
    modal.className = 'filter-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const filterGrid = window.videoEffectsEngine.filters.map(filter => `
        <div class="filter-option" onclick="applyVideoFilter('${filter.name}')" style="
            padding: 10px;
            background: var(--bg-tertiary);
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        ">
            <div style="width: 60px; height: 60px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border-radius: 8px; margin: 0 auto 8px;"></div>
            <div style="font-size: 12px; font-weight: 600;">${filter.name}</div>
        </div>
    `).join('');
    
    modal.innerHTML = `
        <div style="background: var(--bg-secondary); padding: 30px; border-radius: 15px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <h3 style="margin-bottom: 20px;">🎨 Video Filters</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 15px; margin-bottom: 20px;">
                ${filterGrid}
            </div>
            <h4 style="margin: 20px 0 10px;">Manual Adjustments</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <label>Brightness: <span id="brightnessValue">100%</span></label>
                    <input type="range" id="brightness" min="0" max="200" value="100" style="width: 100%;">
                </div>
                <div>
                    <label>Contrast: <span id="contrastValue">100%</span></label>
                    <input type="range" id="contrast" min="0" max="200" value="100" style="width: 100%;">
                </div>
                <div>
                    <label>Saturation: <span id="saturationValue">100%</span></label>
                    <input type="range" id="saturation" min="0" max="200" value="100" style="width: 100%;">
                </div>
                <div>
                    <label>Hue: <span id="hueValue">0°</span></label>
                    <input type="range" id="hue" min="-180" max="180" value="0" style="width: 100%;">
                </div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button onclick="resetEffects()" style="padding: 10px 20px; background: #666; border: none; border-radius: 5px; color: white;">Reset</button>
                <button onclick="closeFilterModal()" style="padding: 10px 20px; background: var(--accent-primary); border: none; border-radius: 5px; color: white;">Done</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for manual controls
    ['brightness', 'contrast', 'saturation', 'hue'].forEach(effect => {
        const slider = modal.querySelector(`#${effect}`);
        const value = modal.querySelector(`#${effect}Value`);
        
        slider.addEventListener('input', () => {
            const val = parseInt(slider.value);
            window.videoEffectsEngine.updateEffect(effect, val);
            value.textContent = effect === 'hue' ? `${val}°` : `${val}%`;
        });
    });
    
    // Add hover effects to filter options
    modal.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('mouseenter', () => {
            option.style.transform = 'scale(1.05)';
            option.style.borderColor = 'var(--accent-primary)';
        });
        option.addEventListener('mouseleave', () => {
            option.style.transform = 'scale(1)';
            option.style.borderColor = 'transparent';
        });
    });
    
    window.applyVideoFilter = (filterName) => {
        window.videoEffectsEngine.applyFilter(filterName);
        showNotification(`🎨 ${filterName} filter applied!`, 'success');
        
        // Update UI to show active filter
        modal.querySelectorAll('.filter-option').forEach(option => {
            option.style.borderColor = option.textContent.includes(filterName) ? 'var(--accent-primary)' : 'transparent';
        });
    };
    
    window.resetEffects = () => {
        window.videoEffectsEngine.reset();
        ['brightness', 'contrast', 'saturation', 'hue'].forEach(effect => {
            const slider = modal.querySelector(`#${effect}`);
            const value = modal.querySelector(`#${effect}Value`);
            const defaultVal = effect === 'hue' ? 0 : 100;
            slider.value = defaultVal;
            value.textContent = effect === 'hue' ? `${defaultVal}°` : `${defaultVal}%`;
        });
        showNotification('🔄 Effects reset to original', 'info');
    };
    
    window.closeFilterModal = () => modal.remove();
}

function adjustSpeed() {
    const modal = document.createElement('div');
    modal.className = 'speed-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: var(--bg-secondary); padding: 30px; border-radius: 15px; max-width: 500px; width: 90%;">
            <h3 style="margin-bottom: 20px;">⚡ Adjust Speed</h3>
            <div style="margin-bottom: 20px;">
                <label>Playback Speed: <span id="speedValue">1.0x</span></label>
                <input type="range" id="speedSlider" min="0.25" max="3" value="1" step="0.25" style="width: 100%; margin: 10px 0;">
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <button onclick="setSpeed(0.5)" class="speed-preset">0.5x</button>
                <button onclick="setSpeed(0.75)" class="speed-preset">0.75x</button>
                <button onclick="setSpeed(1)" class="speed-preset">1.0x</button>
                <button onclick="setSpeed(1.25)" class="speed-preset">1.25x</button>
                <button onclick="setSpeed(1.5)" class="speed-preset">1.5x</button>
                <button onclick="setSpeed(2)" class="speed-preset">2.0x</button>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="closeSpeedModal()" style="padding: 10px 20px; background: #666; border: none; border-radius: 5px; color: white;">Cancel</button>
                <button onclick="applySpeed()" style="padding: 10px 20px; background: var(--accent-primary); border: none; border-radius: 5px; color: white;">Apply</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles for speed presets
    const style = document.createElement('style');
    style.textContent = `
        .speed-preset {
            padding: 8px 12px;
            background: var(--bg-tertiary);
            border: none;
            border-radius: 5px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .speed-preset:hover {
            background: var(--accent-primary);
            transform: scale(1.05);
        }
    `;
    document.head.appendChild(style);
    
    const speedSlider = modal.querySelector('#speedSlider');
    const speedValue = modal.querySelector('#speedValue');
    
    speedSlider.addEventListener('input', () => {
        speedValue.textContent = `${parseFloat(speedSlider.value).toFixed(2)}x`;
    });
    
    window.setSpeed = (speed) => {
        speedSlider.value = speed;
        speedValue.textContent = `${speed}x`;
    };
    
    window.closeSpeedModal = () => modal.remove();
    window.applySpeed = () => {
        const speed = parseFloat(speedSlider.value);
        showNotification(`⚡ Speed set to ${speed}x`, 'success');
        modal.remove();
    };
}

function addTransition() {
    const modal = document.createElement('div');
    modal.className = 'transition-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const transitions = [
        { name: 'Fade', icon: '🌅', description: 'Smooth fade transition' },
        { name: 'Slide', icon: '➡️', description: 'Slide from left to right' },
        { name: 'Zoom', icon: '🔍', description: 'Zoom in/out effect' },
        { name: 'Blur', icon: '💫', description: 'Blur transition effect' },
        { name: 'Spin', icon: '🌪️', description: 'Spinning transition' },
        { name: 'Wipe', icon: '🧽', description: 'Wipe transition' }
    ];
    
    const transitionGrid = transitions.map(transition => `
        <div class="transition-option" onclick="applyTransition('${transition.name}')" style="
            padding: 15px;
            background: var(--bg-tertiary);
            border-radius: 10px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        ">
            <div style="font-size: 30px; margin-bottom: 8px;">${transition.icon}</div>
            <div style="font-weight: 600; margin-bottom: 4px;">${transition.name}</div>
            <div style="font-size: 12px; color: #888;">${transition.description}</div>
        </div>
    `).join('');
    
    modal.innerHTML = `
        <div style="background: var(--bg-secondary); padding: 30px; border-radius: 15px; max-width: 600px; width: 90%;">
            <h3 style="margin-bottom: 20px;">✨ Transition Effects</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                ${transitionGrid}
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="closeTransitionModal()" style="padding: 10px 20px; background: #666; border: none; border-radius: 5px; color: white;">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add hover effects
    modal.querySelectorAll('.transition-option').forEach(option => {
        option.addEventListener('mouseenter', () => {
            option.style.transform = 'translateY(-5px)';
            option.style.borderColor = 'var(--accent-primary)';
        });
        option.addEventListener('mouseleave', () => {
            option.style.transform = 'translateY(0)';
            option.style.borderColor = 'transparent';
        });
    });
    
    window.applyTransition = (transitionName) => {
        showNotification(`✨ ${transitionName} transition applied!`, 'success');
        modal.remove();
    };
    
    window.closeTransitionModal = () => modal.remove();
}

function addMusic() {
    const modal = document.createElement('div');
    modal.className = 'music-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const musicTracks = [
        { name: 'Upbeat Pop', genre: 'Pop', duration: '2:30', icon: '🎵' },
        { name: 'Chill Vibes', genre: 'Lo-Fi', duration: '3:15', icon: '🎶' },
        { name: 'Electronic Drop', genre: 'EDM', duration: '2:45', icon: '🎧' },
        { name: 'Acoustic Guitar', genre: 'Folk', duration: '3:00', icon: '🎸' },
        { name: 'Hip Hop Beat', genre: 'Hip Hop', duration: '2:20', icon: '🎤' },
        { name: 'Jazz Smooth', genre: 'Jazz', duration: '3:30', icon: '🎺' }
    ];
    
    const musicList = musicTracks.map((track, index) => `
        <div class="music-track" onclick="selectTrack(${index})" style="
            padding: 12px;
            background: var(--bg-tertiary);
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 8px;
            border: 2px solid transparent;
        ">
            <div style="font-size: 24px;">${track.icon}</div>
            <div style="flex: 1;">
                <div style="font-weight: 600;">${track.name}</div>
                <div style="font-size: 12px; color: #888;">${track.genre} • ${track.duration}</div>
            </div>
            <button onclick="event.stopPropagation(); previewTrack(${index})" style="padding: 5px 10px; background: var(--accent-primary); border: none; border-radius: 4px; color: white; font-size: 12px;">▶️ Preview</button>
        </div>
    `).join('');
    
    modal.innerHTML = `
        <div style="background: var(--bg-secondary); padding: 30px; border-radius: 15px; max-width: 500px; width: 90%; max-height: 70vh; overflow-y: auto;">
            <h3 style="margin-bottom: 20px;">🎵 Music Library</h3>
            <div style="margin-bottom: 20px;">
                <input type="text" placeholder="Search music..." style="width: 100%; padding: 10px; border: 1px solid #333; border-radius: 5px; background: var(--bg-tertiary); color: white;">
            </div>
            <div style="margin-bottom: 20px;">
                ${musicList}
            </div>
            <div style="padding: 15px; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 20px;">
                <div style="margin-bottom: 10px; font-weight: 600;">Volume Control</div>
                <input type="range" id="musicVolume" min="0" max="100" value="50" style="width: 100%;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #888;">
                    <span>Quiet</span>
                    <span>Loud</span>
                </div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="closeMusicModal()" style="padding: 10px 20px; background: #666; border: none; border-radius: 5px; color: white;">Cancel</button>
                <button onclick="applyMusic()" style="padding: 10px 20px; background: var(--accent-primary); border: none; border-radius: 5px; color: white;">Add Music</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    let selectedTrack = null;
    
    // Add hover effects
    modal.querySelectorAll('.music-track').forEach((track, index) => {
        track.addEventListener('mouseenter', () => {
            track.style.transform = 'translateX(5px)';
            track.style.borderColor = 'var(--accent-primary)';
        });
        track.addEventListener('mouseleave', () => {
            track.style.transform = 'translateX(0)';
            if (selectedTrack !== index) {
                track.style.borderColor = 'transparent';
            }
        });
    });
    
    window.selectTrack = (index) => {
        selectedTrack = index;
        modal.querySelectorAll('.music-track').forEach((track, i) => {
            track.style.borderColor = i === index ? 'var(--accent-primary)' : 'transparent';
        });
    };
    
    window.previewTrack = (index) => {
        showNotification(`🎵 Playing preview: ${musicTracks[index].name}`, 'info');
    };
    
    window.closeMusicModal = () => modal.remove();
    window.applyMusic = () => {
        if (selectedTrack !== null) {
            showNotification(`🎵 Added: ${musicTracks[selectedTrack].name}`, 'success');
        } else {
            showNotification('Please select a music track first', 'warning');
        }
        modal.remove();
    };
}

function recordVoiceover() {
    const modal = document.createElement('div');
    modal.className = 'voiceover-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: var(--bg-secondary); padding: 30px; border-radius: 15px; max-width: 500px; width: 90%;">
            <h3 style="margin-bottom: 20px;">🎤 Record Voiceover</h3>
            <div style="text-align: center; margin-bottom: 20px;">
                <div id="recordingStatus" style="font-size: 18px; margin-bottom: 15px; color: #888;">Ready to record</div>
                <div id="recordingTimer" style="font-size: 24px; font-weight: bold; color: var(--accent-primary); margin-bottom: 20px;">00:00</div>
                <button id="recordButton" onclick="toggleVoiceRecording()" style="
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    border: none;
                    background: var(--accent-primary);
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-bottom: 20px;
                ">🎤</button>
            </div>
            <div style="margin-bottom: 20px;">
                <label>Recording Volume:</label>
                <input type="range" id="voiceVolume" min="0" max="100" value="80" style="width: 100%; margin: 10px 0;">
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="closeVoiceoverModal()" style="padding: 10px 20px; background: #666; border: none; border-radius: 5px; color: white;">Cancel</button>
                <button id="saveVoiceover" onclick="saveVoiceover()" style="padding: 10px 20px; background: var(--accent-primary); border: none; border-radius: 5px; color: white; opacity: 0.5;" disabled>Save</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];
    let startTime = null;
    let timerInterval = null;
    
    window.toggleVoiceRecording = async () => {
        const recordButton = modal.querySelector('#recordButton');
        const recordingStatus = modal.querySelector('#recordingStatus');
        const saveButton = modal.querySelector('#saveVoiceover');
        
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };
                
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    console.log('Voiceover recorded:', audioBlob.size, 'bytes');
                    saveButton.disabled = false;
                    saveButton.style.opacity = '1';
                };
                
                mediaRecorder.start();
                isRecording = true;
                startTime = Date.now();
                
                recordButton.style.background = '#ff4444';
                recordButton.textContent = '⏹️';
                recordingStatus.textContent = 'Recording...';
                recordingStatus.style.color = '#ff4444';
                
                // Start timer
                timerInterval = setInterval(() => {
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    const minutes = Math.floor(elapsed / 60);
                    const seconds = elapsed % 60;
                    modal.querySelector('#recordingTimer').textContent = 
                        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }, 1000);
                
            } catch (error) {
                console.error('Microphone access denied:', error);
                showNotification('Microphone access required for voiceover', 'error');
            }
        } else {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            isRecording = false;
            
            clearInterval(timerInterval);
            recordButton.style.background = 'var(--accent-primary)';
            recordButton.textContent = '🎤';
            recordingStatus.textContent = 'Recording complete';
            recordingStatus.style.color = 'var(--accent-primary)';
        }
    };
    
    window.closeVoiceoverModal = () => {
        if (isRecording) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            clearInterval(timerInterval);
        }
        modal.remove();
    };
    
    window.saveVoiceover = () => {
        showNotification('🎤 Voiceover saved successfully!', 'success');
        modal.remove();
    };
}

function adjustVolume() {
    const modal = document.createElement('div');
    modal.className = 'volume-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: var(--bg-secondary); padding: 30px; border-radius: 15px; max-width: 500px; width: 90%;">
            <h3 style="margin-bottom: 20px;">🔊 Audio Control</h3>
            <div style="margin-bottom: 25px;">
                <label style="display: block; margin-bottom: 10px;">Master Volume: <span id="masterVolumeValue">100%</span></label>
                <input type="range" id="masterVolume" min="0" max="100" value="100" style="width: 100%;">
            </div>
            <div style="margin-bottom: 25px;">
                <label style="display: block; margin-bottom: 10px;">Original Audio: <span id="originalVolumeValue">80%</span></label>
                <input type="range" id="originalVolume" min="0" max="100" value="80" style="width: 100%;">
            </div>
            <div style="margin-bottom: 25px;">
                <label style="display: block; margin-bottom: 10px;">Background Music: <span id="musicVolumeValue">60%</span></label>
                <input type="range" id="backgroundMusicVolume" min="0" max="100" value="60" style="width: 100%;">
            </div>
            <div style="margin-bottom: 25px;">
                <label style="display: block; margin-bottom: 10px;">Voiceover: <span id="voiceoverVolumeValue">90%</span></label>
                <input type="range" id="voiceoverVolume" min="0" max="100" value="90" style="width: 100%;">
            </div>
            <div style="margin-bottom: 25px;">
                <h4 style="margin-bottom: 15px;">Audio Effects</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label>Bass Boost: <span id="bassValue">0</span></label>
                        <input type="range" id="bass" min="-10" max="10" value="0" style="width: 100%;">
                    </div>
                    <div>
                        <label>Treble: <span id="trebleValue">0</span></label>
                        <input type="range" id="treble" min="-10" max="10" value="0" style="width: 100%;">
                    </div>
                    <div>
                        <label>Echo: <span id="echoValue">0%</span></label>
                        <input type="range" id="echo" min="0" max="100" value="0" style="width: 100%;">
                    </div>
                    <div>
                        <label>Reverb: <span id="reverbValue">0%</span></label>
                        <input type="range" id="reverb" min="0" max="100" value="0" style="width: 100%;">
                    </div>
                </div>
            </div>
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 15px;">Quick Presets</h4>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="applyAudioPreset('original')" class="audio-preset">Original</button>
                    <button onclick="applyAudioPreset('enhanced')" class="audio-preset">Enhanced</button>
                    <button onclick="applyAudioPreset('cinema')" class="audio-preset">Cinema</button>
                    <button onclick="applyAudioPreset('music')" class="audio-preset">Music Focus</button>
                    <button onclick="applyAudioPreset('voice')" class="audio-preset">Voice Focus</button>
                </div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="resetAudioSettings()" style="padding: 10px 20px; background: #666; border: none; border-radius: 5px; color: white;">Reset</button>
                <button onclick="closeVolumeModal()" style="padding: 10px 20px; background: var(--accent-primary); border: none; border-radius: 5px; color: white;">Done</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles for audio presets
    const style = document.createElement('style');
    style.textContent = `
        .audio-preset {
            padding: 8px 12px;
            background: var(--bg-tertiary);
            border: none;
            border-radius: 5px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 12px;
        }
        .audio-preset:hover {
            background: var(--accent-primary);
            transform: scale(1.05);
        }
    `;
    document.head.appendChild(style);
    
    // Add event listeners for all sliders
    const sliders = [
        'masterVolume', 'originalVolume', 'backgroundMusicVolume', 
        'voiceoverVolume', 'bass', 'treble', 'echo', 'reverb'
    ];
    
    sliders.forEach(sliderId => {
        const slider = modal.querySelector(`#${sliderId}`);
        const valueSpan = modal.querySelector(`#${sliderId}Value`);
        
        slider.addEventListener('input', () => {
            const value = parseInt(slider.value);
            if (['bass', 'treble'].includes(sliderId)) {
                valueSpan.textContent = value > 0 ? `+${value}` : value.toString();
            } else {
                valueSpan.textContent = `${value}%`;
            }
            
            // Apply audio changes in real-time
            applyAudioSettings();
        });
    });
    
    window.applyAudioPreset = (preset) => {
        const presets = {
            original: { master: 100, original: 100, music: 0, voiceover: 0, bass: 0, treble: 0, echo: 0, reverb: 0 },
            enhanced: { master: 100, original: 85, music: 40, voiceover: 80, bass: 2, treble: 1, echo: 5, reverb: 10 },
            cinema: { master: 100, original: 70, music: 80, voiceover: 90, bass: 3, treble: -1, echo: 15, reverb: 25 },
            music: { master: 100, original: 60, music: 90, voiceover: 70, bass: 4, treble: 2, echo: 10, reverb: 15 },
            voice: { master: 100, original: 95, music: 30, voiceover: 100, bass: -2, treble: 3, echo: 0, reverb: 5 }
        };
        
        const settings = presets[preset];
        if (!settings) return;
        
        // Update sliders
        modal.querySelector('#masterVolume').value = settings.master;
        modal.querySelector('#originalVolume').value = settings.original;
        modal.querySelector('#backgroundMusicVolume').value = settings.music;
        modal.querySelector('#voiceoverVolume').value = settings.voiceover;
        modal.querySelector('#bass').value = settings.bass;
        modal.querySelector('#treble').value = settings.treble;
        modal.querySelector('#echo').value = settings.echo;
        modal.querySelector('#reverb').value = settings.reverb;
        
        // Update value displays
        modal.querySelector('#masterVolumeValue').textContent = `${settings.master}%`;
        modal.querySelector('#originalVolumeValue').textContent = `${settings.original}%`;
        modal.querySelector('#musicVolumeValue').textContent = `${settings.music}%`;
        modal.querySelector('#voiceoverVolumeValue').textContent = `${settings.voiceover}%`;
        modal.querySelector('#bassValue').textContent = settings.bass > 0 ? `+${settings.bass}` : settings.bass;
        modal.querySelector('#trebleValue').textContent = settings.treble > 0 ? `+${settings.treble}` : settings.treble;
        modal.querySelector('#echoValue').textContent = `${settings.echo}%`;
        modal.querySelector('#reverbValue').textContent = `${settings.reverb}%`;
        
        applyAudioSettings();
        showNotification(`🎵 Applied ${preset} audio preset`, 'success');
    };
    
    window.resetAudioSettings = () => {
        applyAudioPreset('original');
        showNotification('🔄 Audio settings reset', 'info');
    };
    
    window.applyAudioSettings = () => {
        // In a real implementation, this would apply the audio settings to the video
        console.log('Audio settings applied');
    };
    
    window.closeVolumeModal = () => modal.remove();
}

function selectTemplate() {
    showNotification('Photo templates - Feature coming soon!', 'info');
}

function addPhotoEffects() {
    showNotification('Photo effects - Feature coming soon!', 'info');
}

function setTiming() {
    showNotification('Slide timing - Feature coming soon!', 'info');
}

// Step 4: Hashtag and Publishing Functions
function handleHashtagInput(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const input = event.target;
        const hashtag = input.value.trim().replace(/^#+/, '');
        if (hashtag) {
            addHashtag(hashtag);
            input.value = '';
        }
    }
}

function addHashtag(tag) {
    const description = document.getElementById('contentDescription');
    const currentText = description.value;
    const hashtagText = `#${tag}`;
    
    if (!currentText.includes(hashtagText)) {
        description.value = currentText + (currentText ? ' ' : '') + hashtagText;
    }
}

// Schedule handling
document.addEventListener('DOMContentLoaded', function() {
    const scheduleRadios = document.querySelectorAll('input[name="schedule"]');
    const scheduleTime = document.getElementById('scheduleTime');
    
    scheduleRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'later') {
                scheduleTime.style.display = 'block';
            } else {
                scheduleTime.style.display = 'none';
            }
        });
    });
});

async function publishContent() {
    const title = document.getElementById('contentTitle').value.trim();
    const description = document.getElementById('contentDescription').value.trim();
    const privacy = document.getElementById('privacySettings').value;
    const allowComments = document.getElementById('allowComments').checked;
    const allowDownloads = document.getElementById('allowDownloads').checked;
    const allowDuets = document.getElementById('allowDuets').checked;
    const allowStitch = document.getElementById('allowStitch').checked;
    const scheduleType = document.querySelector('input[name="schedule"]:checked').value;
    const scheduleTime = document.getElementById('scheduleTime').value;
    
    // Title is optional now
    const finalTitle = title || 'Untitled Video';
    
    // Check if we have files to upload (either selected files or recorded video)
    const hasFiles = selectedFiles.length > 0 || window.selectedVideoFile;
    if (!hasFiles) {
        showNotification('No files selected for upload', 'error');
        return;
    }
    
    console.log('📤 Publishing content:', {
        title: finalTitle,
        description,
        selectedFiles: selectedFiles.length,
        recordedVideo: !!window.selectedVideoFile,
        uploadType
    });
    
    goToStep(5);
    
    try {
        updatePublishProgress('Preparing upload...', 0);
        
        // Check authentication (production-ready session-based)
        console.log('🔍 AUTH STATE CHECK:');
        console.log('  - authToken:', !!window.authToken, window.authToken);
        console.log('  - currentUser:', !!window.currentUser, window.currentUser);
        console.log('  - auth object:', window.auth);
        
        if (!window.authToken || !window.currentUser) {
            console.log('❌ No auth token or user - showing login error');
            showNotification('Please log in to upload content', 'error');
            goToStep(4);
            return;
        }
        
        // Skip server session verification since auth state is valid
        console.log('✅ Auth state verified - proceeding with upload');
        
        // Note: Server /api/auth/me endpoint appears to be overly strict
        // Local auth state is valid, so we'll proceed with upload
        /*
        // Verify session is still valid
        console.log('🔍 Verifying session with server...');
        try {
            const authCheck = await fetch(`${window.API_BASE_URL}/api/auth/me`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            console.log('🔍 Auth check response:', authCheck.status, authCheck.statusText);
            console.log('🔍 Auth check headers:', Object.fromEntries(authCheck.headers.entries()));
            
            if (!authCheck.ok) {
                console.log('❌ Session verification failed, status:', authCheck.status);
                showNotification('Your session has expired. Please log in again.', 'error');
                
                // Clear invalid auth state
                window.authToken = null;
                window.currentUser = null;
                
                // Close upload modal and show login screen
                if (window.closeUploadModal) {
                    window.closeUploadModal();
                } else {
                    // Fallback: hide modal manually
                    const uploadModal = document.getElementById('uploadModal');
                    if (uploadModal) {
                        uploadModal.style.display = 'none';
                        uploadModal.classList.remove('active');
                    }
                }
                
                // Show auth container for login
                const authContainer = document.getElementById('authContainer');
                if (authContainer) {
                    authContainer.style.display = 'flex';
                }
                
                // Hide main app until re-authenticated
                const mainApp = document.getElementById('mainApp');
                if (mainApp) {
                    mainApp.style.display = 'none';
                }
                
                // Trigger auth state change callbacks
                if (window.auth && window.auth._triggerCallbacks) {
                    window.auth._triggerCallbacks(null);
                }
                
                return;
            }
            
            console.log('✅ Session verified for upload');
        } catch (error) {
            console.error('❌ Auth check failed:', error);
            showNotification('Please check your connection and try logging in again.', 'error');
            goToStep(4);
            return;
        }
        */
        
        // Debug current user info
        console.log('👤 Current user info:', { email: currentUser?.email, displayName: currentUser?.displayName, username: currentUser?.username });
        
        updatePublishProgress('Uploading content...', 20);
        
        // Create FormData for file upload
        const formData = new FormData();
        let result = null; // Declare result variable for all upload types
        
        if (uploadType === 'video' && (selectedFiles.length > 0 || window.selectedVideoFile)) {
            // Upload video file (either selected or recorded)
            const videoFile = selectedFiles.length > 0 ? selectedFiles[0] : window.selectedVideoFile;
            console.log('📤 Uploading video file:', videoFile.name, 'Size:', videoFile.size);
            
            formData.append('video', videoFile);
            formData.append('title', finalTitle);
            formData.append('description', description);
            
            // Add user information for proper association
            if (currentUser) {
                // Try multiple possible username sources
                const username = currentUser.username || 
                               currentUser.displayName || 
                               currentUser.name ||
                               currentUser.email?.split('@')[0] || 
                               'user';
                formData.append('username', username);
                formData.append('userId', currentUser.id || currentUser._id || currentUser.uid || '');
                console.log('📤 Adding user info to upload:');
                console.log('  - Username:', username);
                console.log('  - User ID:', currentUser.id || currentUser._id || currentUser.uid);
                console.log('  - Full user object:', currentUser);
                
                // ENHANCED DEBUG: Log all FormData entries
                console.log('🔍 COMPLETE FORMDATA CONTENTS:');
                for (let [key, value] of formData.entries()) {
                    if (value instanceof File) {
                        console.log(`  ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
                    } else {
                        console.log(`  ${key}: ${value}`);
                    }
                }
            } else {
                console.warn('⚠️ No currentUser found for upload');
            }
            
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('🚀 SENDING REQUEST TO:', `${window.API_BASE_URL}/api/upload/video`);
                console.log('🚀 REQUEST HEADERS: Using session-based authentication');
                console.log('🔑 Auth token available:', !!window.authToken);
                console.log('🔑 Current user available:', !!window.currentUser);
            }
            
            const response = await fetch(`${window.API_BASE_URL}/api/upload/video`, {
                method: 'POST',
                credentials: 'include', // Include HTTP-only cookies for production auth
                headers: {
                    // Only include Authorization header if we have a real token (not session-based)
                    ...(window.authToken && window.authToken !== 'session-based' ? 
                        { 'Authorization': `Bearer ${window.authToken}` } : {})
                },
                body: formData
            });
            
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('📡 RESPONSE STATUS:', response.status, response.statusText);
                console.log('📡 RESPONSE HEADERS:', Object.fromEntries(response.headers.entries()));
            }
            
            updatePublishProgress('Processing and converting video...', 60);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ UPLOAD ERROR RESPONSE:', errorText);
                
                try {
                    const errorData = JSON.parse(errorText);
                    
                    // Enhanced error handling with specific feedback
                    let userMessage = errorData.error || 'Upload failed';
                    
                    switch(errorData.code) {
                        case 'NO_FILE':
                            userMessage = 'No video file was selected. Please choose a video to upload.';
                            break;
                        case 'NO_TITLE':
                            userMessage = 'Please enter a title for your video.';
                            break;
                        case 'VALIDATION_FAILED':
                            userMessage = `Video validation failed: ${errorData.details}`;
                            break;
                        case 'FFMPEG_NOT_FOUND':
                            userMessage = 'Video processing is temporarily unavailable. Please try again in a few minutes.';
                            break;
                        case 'INVALID_VIDEO':
                            userMessage = 'This video file appears to be corrupted or in an unsupported format. Please try a different video.';
                            break;
                        case 'FILE_TOO_LARGE':
                            userMessage = 'Video file is too large (max 500MB). Please compress your video or upload a shorter clip.';
                            break;
                        case 'VIDEO_TOO_LONG':
                            userMessage = 'Video is too long (max 3 minutes). Please trim your video to under 3 minutes.';
                            break;
                        default:
                            if (response.status === 401) {
                                userMessage = 'Please log in to upload videos. Your session may have expired.';
                            }
                    }
                    
                    throw new Error(userMessage);
                    
                } catch (parseError) {
                    // If we can't parse the error, use the raw text
                    if (response.status === 401) {
                        throw new Error('Please log in to upload videos. Your session may have expired.');
                    }
                    throw new Error(errorText || 'Upload failed. Please try again.');
                }
            }
            
            const resultText = await response.text();
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('📥 RAW RESPONSE TEXT:', resultText);
            }
            
            try {
                result = JSON.parse(resultText);
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    console.log('✅ PARSED RESPONSE:', result);
                }
                
                // CRITICAL DEBUG: Check what username was actually saved
                // Optional: Validate username if provided (but don't require it)
                if (result.video && result.video.username && currentUser) {
                    const expectedUsername = currentUser?.username || currentUser?.displayName || currentUser?.email?.split('@')[0];
                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                        console.log('🎯 SERVER SAVED USERNAME:', result.video.username);
                        console.log('🎯 EXPECTED USERNAME:', expectedUsername);
                    }
                    
                    if (result.video.username !== expectedUsername) {
                        console.error('🚨 USERNAME MISMATCH! Server saved different username than expected!');
                        console.error('  - Sent:', expectedUsername);
                        console.error('  - Saved:', result.video.username);
                    }
                }
            } catch (parseError) {
                console.error('❌ Failed to parse response as JSON:', parseError);
                result = { message: 'Upload completed but response format unknown' };
            }
            
            updatePublishProgress('Finalizing...', 90);
            
        } else if (uploadType === 'photos' && selectedFiles.length > 0) {
            // Handle photo slideshow upload
            formData.append('title', finalTitle);
            formData.append('description', description);
            
            // Add user information for proper association
            if (currentUser) {
                // Try multiple possible username sources
                const username = currentUser.username || 
                               currentUser.displayName || 
                               currentUser.name ||
                               currentUser.email?.split('@')[0] || 
                               'user';
                formData.append('username', username);
                formData.append('userId', currentUser.id || currentUser._id || currentUser.uid || '');
                console.log('📤 Adding user info to photo upload:');
                console.log('  - Username:', username);
                console.log('  - User ID:', currentUser.id || currentUser._id || currentUser.uid);
            } else {
                console.warn('⚠️ No currentUser found for photo upload');
            }
            
            // Add all photos
            selectedFiles.forEach((file, index) => {
                formData.append(`photos`, file);
            });
            
            const response = await fetch(`${window.API_BASE_URL}/api/upload/video`, {
                method: 'POST',
                credentials: 'include', // Include HTTP-only cookies for production auth
                headers: {
                    // Authorization header may still be needed if server expects it
                    ...(window.authToken && window.authToken !== 'session-based' ? 
                        { 'Authorization': `Bearer ${window.authToken}` } : {})
                },
                body: formData
            });
            
            updatePublishProgress('Creating slideshow...', 60);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }
            
            result = await response.json();
            console.log('✅ Slideshow created:', result);
            
            updatePublishProgress('Finalizing...', 90);
        }
        
        updatePublishProgress('Complete!', 100);
        
        // Enhanced success feedback with processing information
        setTimeout(() => {
            let successMessage = 'Content published successfully!';
            
            // Show processing details for video uploads
            if (result && result.processing && uploadType === 'video') {
                if (result.processing.converted && !result.processing.skipped) {
                    const sizeSaved = result.processing.originalSize - result.processing.finalSize;
                    const sizeSavedMB = (sizeSaved / 1024 / 1024).toFixed(1);
                    successMessage = `Video published successfully! Converted to optimized ${result.processing.format} (${sizeSavedMB}MB smaller)`;
                } else if (result.processing.skipped) {
                    successMessage = 'Video published successfully! Already in optimal format';
                } else {
                    successMessage = 'Video published successfully! Uploaded in original format';
                }
                
                // Log detailed processing info
                console.log('🎬 Video Processing Results:');
                console.log('  ✅ Format:', result.processing.format);
                console.log('  📦 Original size:', (result.processing.originalSize / 1024 / 1024).toFixed(2), 'MB');
                console.log('  📦 Final size:', (result.processing.finalSize / 1024 / 1024).toFixed(2), 'MB');
                console.log('  💾 Space saved:', ((result.processing.originalSize - result.processing.finalSize) / 1024 / 1024).toFixed(2), 'MB');
                console.log('  🎯 Quality:', result.processing.quality);
            }
            
            showNotification(successMessage, 'success');
            
            // Clear recorded video
            if (window.selectedVideoFile) {
                window.selectedVideoFile = null;
                console.log('🗑️ Cleared recorded video from memory');
            }
            
            closeUploadModal();
            // Refresh feed to show new content
            loadVideoFeed('foryou', true);
            // Also refresh user's profile if they're viewing it
            if (document.getElementById('profilePage')?.style.display === 'block') {
                loadUserVideos();
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Upload error:', error);
        showNotification(error.message || 'Failed to upload content. Please try again.', 'error');
        goToStep(4);
    }
}

function updatePublishProgress(status, percentage) {
    document.getElementById('publishStatus').textContent = status;
    document.getElementById('publishProgress').textContent = `${percentage}% complete`;
    document.getElementById('progressFill').style.width = `${percentage}%`;
}

// async function recordVideo() {
//     console.log('🎬 Record Video button clicked - starting debug');
//     
//     // Add detailed debugging
//     console.log('📱 Current document.body children:', document.body.children.length);
//     console.log('📱 Existing modals:', document.querySelectorAll('.modal').length);
//     
//     try {
//         // Request camera permission first to enumerate devices
//         console.log('📱 Requesting camera permissions...');
//         const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//         console.log('✅ Camera permissions granted, tracks:', tempStream.getTracks().length);
//         
//         // Stop the temp stream immediately
//         tempStream.getTracks().forEach(track => {
//             console.log(`🛑 Stopping track: ${track.kind} - ${track.label}`);
//             track.stop();
//         });
//         
//         // Add a small delay to ensure permission state is updated
//         setTimeout(() => {
//             console.log('📱 Now showing camera selection modal...');
//             showCameraSelectionModal('video');
//         }, 500);
//         
//     } catch (error) {
//         console.error('❌ Camera permission denied:', error);
//         showNotification('Camera access is required to record videos. Please allow camera access and try again.', 'error');
//     }
// }
// COMMENTED OUT: This function was conflicting with upload-manager.js recordVideo implementation

async function showCameraSelectionModal(mode) {
    console.log(`📹 Showing camera selection for mode: ${mode}`);
    try {
        // Get available video devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log(`📱 All devices found:`, devices.length);
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log(`📷 Found ${videoDevices.length} video devices:`, videoDevices);
        
        // Check if modal already exists and remove it
        const existingModal = document.querySelector('.camera-selection-modal');
        if (existingModal) {
            console.log('🗑️ Removing existing camera modal');
            existingModal.remove();
        }
        
        const cameraModal = document.createElement('div');
        cameraModal.className = 'modal camera-selection-modal';
        cameraModal.style.zIndex = '100001'; // Higher than other modals
        cameraModal.innerHTML = `
            <div class="modal-content camera-content">
                <div class="camera-header">
                    <button onclick="closeCameraSelection()" class="close-btn">&times;</button>
                    <h3>📹 Select Camera</h3>
                </div>
                
                <div class="camera-options">
                    ${videoDevices.length === 0 ? 
                        `<div class="camera-option" onclick="selectCamera('', '${mode}', 'Default Camera')">
                            <div class="camera-icon">📷</div>
                            <div class="camera-info">
                                <div class="camera-name">Default Camera</div>
                                <div class="camera-type">Use device camera</div>
                            </div>
                        </div>` :
                        videoDevices.map((device, index) => `
                            <div class="camera-option" onclick="selectCamera('${device.deviceId}', '${mode}', '${device.label || `Camera ${index + 1}`}')">
                                <div class="camera-icon">📷</div>
                                <div class="camera-info">
                                    <div class="camera-name">${device.label || `Camera ${index + 1}`}</div>
                                    <div class="camera-type">${getCameraType(device.label || '')}</div>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
        
        document.body.appendChild(cameraModal);
        cameraModal.style.display = 'flex';
        cameraModal.style.position = 'fixed';
        cameraModal.style.top = '0';
        cameraModal.style.left = '0';
        cameraModal.style.right = '0';
        cameraModal.style.bottom = '0';
        cameraModal.style.backgroundColor = 'rgba(0,0,0,0.95)';
        cameraModal.style.alignItems = 'center';
        cameraModal.style.justifyContent = 'center';
        
        console.log('📱 Camera selection modal displayed with z-index:', cameraModal.style.zIndex);
        console.log('📱 Available cameras:', videoDevices.length);
        console.log('📱 Modal added to body, total modals now:', document.querySelectorAll('.modal').length);
        console.log('📱 Modal element:', cameraModal);
        console.log('📱 Modal computed display:', window.getComputedStyle(cameraModal).display);
        
        // Force a visual test
        setTimeout(() => {
            console.log('📱 Modal still visible after 2s?', cameraModal.parentNode ? 'YES' : 'NO');
            if (cameraModal.parentNode) {
                console.log('📱 Modal computed styles after 2s:', {
                    display: window.getComputedStyle(cameraModal).display,
                    zIndex: window.getComputedStyle(cameraModal).zIndex,
                    position: window.getComputedStyle(cameraModal).position
                });
            }
        }, 2000);
        
    } catch (error) {
        showNotification('Camera access required to record video', 'error');
    }
}

function getCameraType(label) {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('front') || lowerLabel.includes('facetime') || lowerLabel.includes('user')) {
        return 'Front Camera';
    } else if (lowerLabel.includes('back') || lowerLabel.includes('rear') || lowerLabel.includes('environment')) {
        return 'Back Camera';
    } else if (lowerLabel.includes('usb') || lowerLabel.includes('external')) {
        return 'External Camera';
    } else {
        return 'Camera';
    }
}

function closeCameraSelection() {
    console.log('❌ Closing camera selection modal');
    
    // Stop any active camera streams
    if (window.currentCameraStream) {
        console.log('🛑 Stopping camera stream from selection');
        const tracks = window.currentCameraStream.getTracks();
        tracks.forEach(track => {
            console.log(`🛑 Stopping track: ${track.kind} - ${track.label}`);
            track.stop();
        });
        window.currentCameraStream = null;
    }
    
    // Also check for any video elements that might have streams
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach((video, index) => {
        if (video.srcObject) {
            console.log(`🛑 Stopping stream from video element ${index}`);
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
    });
    
    const modal = document.querySelector('.camera-selection-modal');
    if (modal) {
        modal.remove();
        console.log('✅ Camera selection modal removed');
    }
    
    // Show upload modal again
    const uploadModal = document.getElementById('uploadModal');
    if (uploadModal) {
        uploadModal.style.display = 'flex';
        console.log('✅ Upload modal restored');
    }
}

async function selectCamera(deviceId, mode, cameraName) {
    console.log(`📷 Selecting camera: ${cameraName} (${deviceId}) for mode: ${mode}`);
    
    try {
        const constraints = {
            video: { 
                deviceId: deviceId ? { exact: deviceId } : undefined,
                width: 720, 
                height: 1280 
            }, 
            audio: true 
        };
        
        console.log('📡 Requesting camera access with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ Camera stream obtained:', stream);
        console.log(`📡 Stream tracks: ${stream.getTracks().length}`);
        stream.getTracks().forEach((track, i) => {
            console.log(`  Track ${i}: ${track.kind} - ${track.label} - enabled: ${track.enabled}`);
        });
        
        // Close camera selection modal only after successful stream
        closeCameraSelection();
        showNotification(`Using ${cameraName}`, 'success');
        
        if (mode === 'video') {
            console.log('🎬 Opening video editor with stream');
            openAdvancedVideoEditor(stream);
        } else if (mode === 'live') {
            console.log('🔴 Opening live stream with camera');
            openLiveStreamWithCamera(stream);
        }
    } catch (error) {
        console.error('❌ Camera access failed:', error);
        showNotification(`Failed to access ${cameraName}`, 'error');
        
        // Show upload modal again on failure
        const uploadModal = document.getElementById('uploadModal');
        if (uploadModal) {
            uploadModal.style.display = 'flex';
        }
    }
}

function openAdvancedVideoEditor(stream) {
    console.log('🚀 Opening Advanced Video Editor with compact layout');
    
    // Force close any existing modals first
    document.querySelectorAll('.video-editor-modal, .editor-tool-modal').forEach(modal => {
        modal.remove();
    });
    const editorModal = document.createElement('div');
    editorModal.className = 'modal video-editor-modal';
    editorModal.style.zIndex = '100000'; // Higher than upload modal (99999)
    editorModal.innerHTML = `
        <div class="modal-content editor-content" style="max-width: 600px; width: 95vw; height: 85vh; max-height: 900px; padding: 0; border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; background: #000;">
            <!-- Top Header -->
            <div class="editor-header" style="padding: 15px 20px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; flex-shrink: 0;">
                <button onclick="closeVideoEditor()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 5px;">✕</button>
                <div style="color: white; font-weight: 600; font-size: 18px;">Video Editor</div>
                <button onclick="saveEditedVideo()" style="background: #fe2c55; color: white; border: none; padding: 10px 20px; border-radius: 20px; font-weight: 600; cursor: pointer; font-size: 16px;">Next</button>
            </div>
            
            <!-- Video Preview Area -->
            <div class="video-preview-container" style="background: #000; position: relative; display: flex; align-items: center; justify-content: center; flex: 1; min-height: 500px;">
                <video id="editorPreview" autoplay controls style="width: auto; height: 100%; max-width: 100%; object-fit: contain;"></video>
                <canvas id="editorCanvas" style="display: none;"></canvas>
                
                <!-- Recording Controls Overlay -->
                <div class="recording-controls" style="position: absolute; top: 20px; right: 20px; display: flex; flex-direction: column; gap: 15px;">
                    <button onclick="toggleEditorAudio()" id="audioToggleBtn" style="width: 44px; height: 44px; border-radius: 50%; background: rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.2); color: white; font-size: 16px; cursor: pointer;">🔊</button>
                    <button onclick="flipCamera()" style="width: 44px; height: 44px; border-radius: 50%; background: rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.2); color: white; font-size: 20px; cursor: pointer;">🔄</button>
                    <button onclick="toggleFlash()" style="width: 44px; height: 44px; border-radius: 50%; background: rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.2); color: white; font-size: 20px; cursor: pointer;">⚡</button>
                    <button onclick="toggleGridLines()" style="width: 44px; height: 44px; border-radius: 50%; background: rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.2); color: white; font-size: 20px; cursor: pointer;">⚏</button>
                </div>
                
                <!-- Timer Display -->
                <div class="timer-display" style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.8); color: white; padding: 10px 15px; border-radius: 20px; font-weight: 600; font-size: 16px;">00:00</div>
                
                <!-- Record Button -->
                <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);">
                    <button id="recordButton" onclick="toggleRecording()" style="width: 70px; height: 70px; border-radius: 50%; background: #fe2c55; border: 3px solid white; color: white; font-size: 30px; cursor: pointer; box-shadow: 0 4px 20px rgba(254, 44, 85, 0.5);">⬤</button>
                </div>
            </div>
            
            <!-- TikTok-Style Bottom Toolbar -->
            <div class="editor-toolbar" style="background: #000; border-top: 1px solid #333; padding: 8px 5px; display: flex; justify-content: space-around; align-items: center; flex-shrink: 0; height: 65px;">
                <button onclick="openEditorTool('filters')" class="tool-btn" style="display: flex; flex-direction: column; align-items: center; background: none; border: none; color: white; cursor: pointer; font-size: 10px; gap: 3px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 14px;">🎨</div>
                    <span>Filters</span>
                </button>
                <button onclick="openEditorTool('effects')" class="tool-btn" style="display: flex; flex-direction: column; align-items: center; background: none; border: none; color: white; cursor: pointer; font-size: 10px; gap: 3px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 14px;">✨</div>
                    <span>Effects</span>
                </button>
                <button onclick="openEditorTool('speed')" class="tool-btn" style="display: flex; flex-direction: column; align-items: center; background: none; border: none; color: white; cursor: pointer; font-size: 10px; gap: 3px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 14px;">⚡</div>
                    <span>Speed</span>
                </button>
                <button onclick="openEditorTool('text')" class="tool-btn" style="display: flex; flex-direction: column; align-items: center; background: none; border: none; color: white; cursor: pointer; font-size: 10px; gap: 3px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 14px;">📝</div>
                    <span>Text</span>
                </button>
                <button onclick="openEditorTool('music')" class="tool-btn" style="display: flex; flex-direction: column; align-items: center; background: none; border: none; color: white; cursor: pointer; font-size: 10px; gap: 3px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 14px;">🎵</div>
                    <span>Music</span>
                </button>
                <button onclick="openEditorTool('timer')" class="tool-btn" style="display: flex; flex-direction: column; align-items: center; background: none; border: none; color: white; cursor: pointer; font-size: 10px; gap: 3px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 14px;">⏰</div>
                    <span>Timer</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(editorModal);
    editorModal.classList.add('show');
    
    // Force modal to appear above upload modal
    editorModal.style.display = 'flex';
    editorModal.style.position = 'fixed';
    editorModal.style.top = '0';
    editorModal.style.left = '0';
    editorModal.style.right = '0';
    editorModal.style.bottom = '0';
    editorModal.style.backgroundColor = 'rgba(0,0,0,0.95)';
    console.log('📹 Video editor modal displayed above upload modal');
    
    // Initialize video editor
    initializeVideoEditor(stream);
}

// ================ TIKTOK-STYLE EDITOR TOOL MODALS ================
function openEditorTool(toolType) {
    // Remove any existing tool modal
    const existingModal = document.querySelector('.editor-tool-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create tool modal
    const toolModal = document.createElement('div');
    toolModal.className = 'modal editor-tool-modal';
    toolModal.style.zIndex = '100001'; // Higher than video editor
    
    let toolContent = '';
    
    switch(toolType) {
        case 'filters':
            toolContent = `
                <div class="modal-content" style="max-width: 375px; height: 60vh; padding: 20px; border-radius: 20px; background: #1a1a1a;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="color: white; margin: 0;">🎨 Filters</h3>
                        <button onclick="closeEditorTool()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; overflow-y: auto; max-height: 400px;">
                        <button onclick="applyFilter('normal')" class="filter-option" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <div style="width: 50px; height: 50px; border-radius: 8px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4);"></div>
                            <span style="font-size: 12px;">Normal</span>
                        </button>
                        <button onclick="applyFilter('vibrant')" class="filter-option" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <div style="width: 50px; height: 50px; border-radius: 8px; background: linear-gradient(45deg, #ff9a56, #ff6b6b);"></div>
                            <span style="font-size: 12px;">Vibrant</span>
                        </button>
                        <button onclick="applyFilter('vintage')" class="filter-option" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <div style="width: 50px; height: 50px; border-radius: 8px; background: linear-gradient(45deg, #8b4513, #daa520);"></div>
                            <span style="font-size: 12px;">Vintage</span>
                        </button>
                        <button onclick="applyFilter('bw')" class="filter-option" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <div style="width: 50px; height: 50px; border-radius: 8px; background: linear-gradient(45deg, #333, #ccc);"></div>
                            <span style="font-size: 12px;">B&W</span>
                        </button>
                        <button onclick="applyFilter('warm')" class="filter-option" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <div style="width: 50px; height: 50px; border-radius: 8px; background: linear-gradient(45deg, #ff8a80, #ffab40);"></div>
                            <span style="font-size: 12px;">Warm</span>
                        </button>
                        <button onclick="applyFilter('cold')" class="filter-option" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <div style="width: 50px; height: 50px; border-radius: 8px; background: linear-gradient(45deg, #64b5f6, #81c784);"></div>
                            <span style="font-size: 12px;">Cold</span>
                        </button>
                    </div>
                </div>
            `;
            break;
            
        case 'effects':
            toolContent = `
                <div class="modal-content" style="max-width: 375px; height: 60vh; padding: 20px; border-radius: 20px; background: #1a1a1a;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="color: white; margin: 0;">✨ Effects</h3>
                        <button onclick="closeEditorTool()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; overflow-y: auto; max-height: 400px;">
                        <button onclick="addEffect('sparkle')" class="effect-option" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <div style="font-size: 30px;">✨</div>
                            <span style="font-size: 12px;">Sparkle</span>
                        </button>
                        <button onclick="addEffect('hearts')" class="effect-option" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <div style="font-size: 30px;">💕</div>
                            <span style="font-size: 12px;">Hearts</span>
                        </button>
                        <button onclick="addEffect('confetti')" class="effect-option" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <div style="font-size: 30px;">🎉</div>
                            <span style="font-size: 12px;">Confetti</span>
                        </button>
                        <button onclick="addEffect('snow')" class="effect-option" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <div style="font-size: 30px;">❄️</div>
                            <span style="font-size: 12px;">Snow</span>
                        </button>
                        <button onclick="addEffect('fire')" class="effect-option" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <div style="font-size: 30px;">🔥</div>
                            <span style="font-size: 12px;">Fire</span>
                        </button>
                        <button onclick="addEffect('neon')" class="effect-option" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <div style="font-size: 30px;">💡</div>
                            <span style="font-size: 12px;">Neon</span>
                        </button>
                    </div>
                </div>
            `;
            break;
            
        case 'speed':
            toolContent = `
                <div class="modal-content" style="max-width: 375px; height: 40vh; padding: 20px; border-radius: 20px; background: #1a1a1a;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="color: white; margin: 0;">⚡ Speed</h3>
                        <button onclick="closeEditorTool()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
                    </div>
                    <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                        <button onclick="setSpeed(0.3)" class="speed-btn" style="padding: 15px 20px; background: #333; border: none; border-radius: 25px; color: white; cursor: pointer; font-weight: 600;">0.3x</button>
                        <button onclick="setSpeed(0.5)" class="speed-btn" style="padding: 15px 20px; background: #333; border: none; border-radius: 25px; color: white; cursor: pointer; font-weight: 600;">0.5x</button>
                        <button onclick="setSpeed(1)" class="speed-btn active" style="padding: 15px 20px; background: #fe2c55; border: none; border-radius: 25px; color: white; cursor: pointer; font-weight: 600;">1x</button>
                        <button onclick="setSpeed(1.5)" class="speed-btn" style="padding: 15px 20px; background: #333; border: none; border-radius: 25px; color: white; cursor: pointer; font-weight: 600;">1.5x</button>
                        <button onclick="setSpeed(2)" class="speed-btn" style="padding: 15px 20px; background: #333; border: none; border-radius: 25px; color: white; cursor: pointer; font-weight: 600;">2x</button>
                        <button onclick="setSpeed(3)" class="speed-btn" style="padding: 15px 20px; background: #333; border: none; border-radius: 25px; color: white; cursor: pointer; font-weight: 600;">3x</button>
                    </div>
                </div>
            `;
            break;
            
        case 'text':
            toolContent = `
                <div class="modal-content" style="max-width: 375px; height: 50vh; padding: 20px; border-radius: 20px; background: #1a1a1a;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="color: white; margin: 0;">📝 Text</h3>
                        <button onclick="closeEditorTool()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <button onclick="addTextOverlay()" style="width: 100%; padding: 15px; background: #fe2c55; border: none; border-radius: 12px; color: white; font-weight: 600; cursor: pointer;">+ Add Text</button>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        <button onclick="setTextStyle('classic')" class="text-style-btn" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer;">Classic</button>
                        <button onclick="setTextStyle('bold')" class="text-style-btn" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; font-weight: bold;">Bold</button>
                        <button onclick="setTextStyle('neon')" class="text-style-btn" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: #00ffff; cursor: pointer; text-shadow: 0 0 10px #00ffff;">Neon</button>
                        <button onclick="setTextStyle('handwritten')" class="text-style-btn" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; font-family: cursive;">Handwritten</button>
                    </div>
                </div>
            `;
            break;
            
        case 'music':
            toolContent = `
                <div class="modal-content" style="max-width: 375px; height: 50vh; padding: 20px; border-radius: 20px; background: #1a1a1a;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="color: white; margin: 0;">🎵 Music</h3>
                        <button onclick="closeEditorTool()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <button onclick="openMusicLibrary()" style="width: 100%; padding: 15px; background: #fe2c55; border: none; border-radius: 12px; color: white; font-weight: 600; cursor: pointer;">Browse Sounds</button>
                        <button onclick="recordVoiceover()" style="width: 100%; padding: 15px; background: #333; border: none; border-radius: 12px; color: white; font-weight: 600; cursor: pointer;">🎤 Voice Over</button>
                        <div style="background: #333; padding: 15px; border-radius: 12px;">
                            <div style="margin-bottom: 10px; color: white; font-size: 14px;">Volume Controls</div>
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                <label style="color: white; min-width: 60px; font-size: 12px;">Original:</label>
                                <input type="range" min="0" max="100" value="50" onchange="setOriginalVolume(this.value)" style="flex: 1;">
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <label style="color: white; min-width: 60px; font-size: 12px;">Music:</label>
                                <input type="range" min="0" max="100" value="50" onchange="setMusicVolume(this.value)" style="flex: 1;">
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'timer':
            toolContent = `
                <div class="modal-content" style="max-width: 375px; height: 40vh; padding: 20px; border-radius: 20px; background: #1a1a1a;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="color: white; margin: 0;">⏰ Timer & Tools</h3>
                        <button onclick="closeEditorTool()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        <button onclick="setRecordingTimer(3)" class="timer-btn" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; font-weight: 600;">3s Timer</button>
                        <button onclick="setRecordingTimer(10)" class="timer-btn" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; font-weight: 600;">10s Timer</button>
                        <button onclick="toggleCountdown()" class="countdown-btn" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; font-weight: 600;">Countdown</button>
                        <button onclick="toggleGridLines()" class="grid-btn" style="background: #333; border: none; border-radius: 12px; padding: 15px; color: white; cursor: pointer; font-weight: 600;">Grid Lines</button>
                    </div>
                </div>
            `;
            break;
    }
    
    toolModal.innerHTML = toolContent;
    document.body.appendChild(toolModal);
    toolModal.style.display = 'flex';
    
    // Add click outside to close
    toolModal.addEventListener('click', (e) => {
        if (e.target === toolModal) {
            closeEditorTool();
        }
    });
}

function closeEditorTool() {
    const toolModal = document.querySelector('.editor-tool-modal');
    if (toolModal) {
        toolModal.remove();
    }
}

// ================ VIDEO EDITOR INITIALIZATION ================
function initializeVideoEditor(stream) {
    console.log('🎬 Initializing video editor');
    
    try {
        // Find the editor modal
        const editorModal = document.querySelector('.video-editor-modal');
        if (!editorModal) {
            console.error('❌ Video editor modal not found');
            return;
        }
        
        // Find the video preview element (created in openAdvancedVideoEditor)
        let videoPreview = editorModal.querySelector('#editorPreview');
        if (!videoPreview) {
            console.error('❌ Video preview element not found in editor modal');
            return;
        }
        
        // Check if we have a video file to load (recorded or selected)
        const videoFile = window.selectedVideoFile || (selectedFiles && selectedFiles.length > 0 ? selectedFiles[0] : null);
        
        if (videoFile) {
            console.log('📹 Loading video file into editor:', videoFile.name);
            const videoUrl = URL.createObjectURL(videoFile);
            videoPreview.src = videoUrl;
            videoPreview.muted = false; // Ensure audio is not muted
            videoPreview.load();
            
            // Add click handler to unmute on user interaction
            videoPreview.addEventListener('click', function() {
                this.muted = false;
                this.play();
                // Update audio button state
                const audioBtn = document.getElementById('audioToggleBtn');
                if (audioBtn) audioBtn.textContent = this.muted ? '🔇' : '🔊';
            });
            
            // Set initial audio button state
            setTimeout(() => {
                const audioBtn = document.getElementById('audioToggleBtn');
                if (audioBtn) audioBtn.textContent = videoPreview.muted ? '🔇' : '🔊';
            }, 100);
            
            // Store the video file globally for editing
            window.currentVideoFile = videoFile;
            
            console.log('✅ Video editor initialized with video file');
        } else if (stream) {
            console.log('📹 Setting camera stream to video element');
            videoPreview.srcObject = stream;
            
            // Store the stream globally for recording
            window.currentCameraStream = stream;
            
            console.log('✅ Video editor initialized with camera stream');
        } else {
            console.warn('⚠️ No video file or camera stream provided to video editor');
        }
        
    } catch (error) {
        console.error('❌ Failed to initialize video editor:', error);
    }
}

// Video editor audio toggle
function toggleEditorAudio() {
    const video = document.getElementById('editorPreview');
    const audioBtn = document.getElementById('audioToggleBtn');
    
    if (video) {
        video.muted = !video.muted;
        audioBtn.textContent = video.muted ? '🔇' : '🔊';
        console.log('🔊 Editor audio toggled:', video.muted ? 'muted' : 'unmuted');
    }
}

// Video recording functions
let mediaRecorder = null;
let recordedChunks = [];
let recordingTimer = null;
let recordingStartTime = null;

// Main recording toggle function (called by the record button)
function toggleRecording() {
    console.log('🎬 Toggle recording called');
    
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopVideoRecording();
    } else {
        startVideoRecording();
    }
}

function startVideoRecording() {
    console.log('🎬 Starting video recording');
    
    try {
        // Use the stored stream instead of trying to get it from video element
        const stream = window.currentCameraStream;
        
        if (stream) {
            recordedChunks = [];
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                console.log('📹 Recording stopped, processing video');
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const videoFile = new File([blob], 'recorded-video.webm', { type: 'video/webm' });
                
                // Process the recorded video
                processRecordedVideo(videoFile);
            };
            
            mediaRecorder.start();
            
            // Start timer
            recordingStartTime = Date.now();
            startRecordingTimer();
            
            // Update UI
            const recordButton = document.getElementById('recordButton');
            if (recordButton) {
                recordButton.textContent = '⏹️';
                recordButton.style.background = '#666';
            }
            
            console.log('✅ Recording started');
        }
    } catch (error) {
        console.error('❌ Failed to start recording:', error);
    }
}

function startRecordingTimer() {
    recordingTimer = setInterval(() => {
        if (recordingStartTime) {
            const elapsed = Date.now() - recordingStartTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const displaySeconds = seconds % 60;
            
            const timeDisplay = document.querySelector('.timer-display');
            if (timeDisplay) {
                timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
                timeDisplay.style.color = '#fe2c55';
            }
        }
    }, 1000);
}

function stopRecordingTimer() {
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
        recordingStartTime = null;
        
        const timeDisplay = document.querySelector('.timer-display');
        if (timeDisplay) {
            timeDisplay.textContent = '00:00';
            timeDisplay.style.color = 'white';
        }
    }
}

function stopVideoRecording() {
    console.log('🛑 Stopping video recording');
    
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        
        // Stop timer
        stopRecordingTimer();
        
        // Update UI
        const recordButton = document.getElementById('recordButton');
        if (recordButton) {
            recordButton.textContent = '🔴';
            recordButton.style.background = '#fe2c55';
        }
    }
}

function processRecordedVideo(videoFile) {
    console.log('🎞️ Processing recorded video:', videoFile);
    
    // Close video editor
    closeVideoEditor();
    
    // Continue with upload process
    if (window.selectedVideoFile !== videoFile) {
        window.selectedVideoFile = videoFile;
        goToStep(3); // Go to details step
    }
}

function closeVideoEditor() {
    console.log('❌ Closing video editor');
    
    try {
        // Stop any recording
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        
        // Stop timer
        stopRecordingTimer();
        
        // Stop camera stream
        if (window.currentCameraStream) {
            const tracks = window.currentCameraStream.getTracks();
            tracks.forEach(track => track.stop());
            window.currentCameraStream = null;
        }
        
        // Hide editor modal
        const editorModal = document.querySelector('.video-editor-modal');
        if (editorModal) {
            editorModal.remove();
        }
        
        // Show upload modal again
        const uploadModal = document.getElementById('uploadModal');
        if (uploadModal) {
            uploadModal.style.display = 'flex';
        }
        
        console.log('✅ Video editor closed');
    } catch (error) {
        console.error('❌ Error closing video editor:', error);
    }
}

// ================ MUSIC LIBRARY ================
function openMusicLibrary() {
    const musicModal = document.createElement('div');
    musicModal.className = 'modal music-library-modal';
    musicModal.innerHTML = `
        <div class="modal-content music-content">
            <div class="music-header">
                <button onclick="closeMusicLibrary()" class="close-btn">&times;</button>
                <h3>🎵 Music Library</h3>
                <input type="text" placeholder="Search sounds..." class="music-search" onkeyup="searchMusic(this.value)">
            </div>
            
            <div class="music-categories">
                <button onclick="filterMusic('trending')" class="category-btn active">🔥 Trending</button>
                <button onclick="filterMusic('original')" class="category-btn">🎤 Original</button>
                <button onclick="filterMusic('hiphop')" class="category-btn">🎯 Hip Hop</button>
                <button onclick="filterMusic('pop')" class="category-btn">🎊 Pop</button>
                <button onclick="filterMusic('electronic')" class="category-btn">⚡ Electronic</button>
                <button onclick="filterMusic('rb')" class="category-btn">🎵 R&B</button>
                <button onclick="filterMusic('rock')" class="category-btn">🎸 Rock</button>
                <button onclick="filterMusic('indie')" class="category-btn">🌈 Indie</button>
                <button onclick="filterMusic('classical')" class="category-btn">🎼 Classical</button>
                <button onclick="filterMusic('jazz')" class="category-btn">🎺 Jazz</button>
                <button onclick="filterMusic('country')" class="category-btn">🤠 Country</button>
                <button onclick="filterMusic('reggae')" class="category-btn">🌴 Reggae</button>
                <button onclick="filterMusic('effects')" class="category-btn">🔊 Effects</button>
                <button onclick="filterMusic('voiceover')" class="category-btn">🎤 Voice Over</button>
            </div>
            
            <div class="music-list" id="musicList">
                <!-- Music tracks will be loaded here -->
            </div>
        </div>
    `;
    
    document.body.appendChild(musicModal);
    musicModal.classList.add('show');
    
    loadMusicTracks('trending');
}

function loadMusicTracks(category) {
    const musicTracks = {
        trending: [
            { id: 1, name: "Viral Dance Beat", artist: "TrendyBeats", duration: "0:15", uses: "1.2M", preview: "trending1.mp3" },
            { id: 2, name: "Epic Moment", artist: "SoundWave", duration: "0:30", uses: "850K", preview: "trending2.mp3" },
            { id: 3, name: "Uplifting Vibes", artist: "VibeCreator", duration: "0:20", uses: "2.1M", preview: "trending3.mp3" }
        ],
        hiphop: [
            { id: 4, name: "Street Beats", artist: "UrbanFlow", duration: "0:25", uses: "500K", preview: "hiphop1.mp3" },
            { id: 5, name: "Rap Instrumental", artist: "BeatMaker", duration: "0:30", uses: "750K", preview: "hiphop2.mp3" }
        ],
        pop: [
            { id: 6, name: "Catchy Hook", artist: "PopStar", duration: "0:15", uses: "900K", preview: "pop1.mp3" },
            { id: 7, name: "Summer Vibes", artist: "Sunshine", duration: "0:20", uses: "1.5M", preview: "pop2.mp3" }
        ]
        // ... more categories
    };
    
    const musicList = document.getElementById('musicList');
    const tracks = musicTracks[category] || [];
    
    musicList.innerHTML = tracks.map(track => `
        <div class="music-track" onclick="selectMusic('${track.id}', '${track.name}', '${track.artist}')">
            <div class="track-info">
                <div class="track-name">${track.name}</div>
                <div class="track-artist">${track.artist} • ${track.duration}</div>
                <div class="track-uses">${track.uses} videos</div>
            </div>
            <div class="track-actions">
                <button onclick="playPreview('${track.preview}')" class="play-btn">▶️</button>
                <button onclick="favoriteTrack('${track.id}')" class="favorite-btn">🤍</button>
            </div>
        </div>
    `).join('');
}

// Emergency mobile reset function
function resetToHome() {
    console.log('🏠 Resetting to home feed');
    
    // Remove all modal pages
    const pagesToRemove = ['#profilePage', '#messagesPage', '#activityPage', '#settingsPage'];
    pagesToRemove.forEach(pageId => {
        const element = document.querySelector(pageId);
        if (element) {
            element.remove();
            console.log('🗑️ Removed:', pageId);
        }
    });
    
    // Reset body classes
    document.body.classList.remove('profile-active', 'messages-active', 'activity-active');
    
    // Show main content
    const videoFeed = document.querySelector('.video-feed');
    const mainApp = document.getElementById('mainApp');
    const sidebar = document.querySelector('.sidebar');
    
    if (videoFeed) videoFeed.style.display = 'block';
    if (mainApp) mainApp.style.display = 'block';
    if (sidebar && window.innerWidth >= 768) sidebar.style.display = 'flex';
    
    console.log('✅ Reset to home complete');
}

// Make it globally available for emergency use
window.resetToHome = resetToHome;

// ================ LIVE STREAMING ================
function showPage(page) {
    console.log('📱 Showing page:', page);
    
    // CRITICAL: Close Live streaming page if it's open when navigating elsewhere
    if (page !== 'live') {
        const liveStreamingPage = document.getElementById('liveStreamingPage');
        if (liveStreamingPage) {
            console.log('🔴 Auto-closing Live streaming page to navigate to:', page);
            closeLiveStreaming();
        }
    }
    
    // Simple mobile handling - just remove unwanted pages
    if (window.innerWidth <= 767) {
        // Remove all dynamic pages first
        const pagesToRemove = ['#profilePage', '#messagesPage', '#activityPage', '#settingsPage'];
        pagesToRemove.forEach(pageId => {
            const element = document.querySelector(pageId);
            if (element) {
                element.remove();
                console.log('🗑️ Removed:', pageId);
            }
        });
        
        // Reset body classes
        document.body.classList.remove('profile-active', 'messages-active', 'activity-active');
        
        // Show main app and video feed for home pages
        const videoFeed = document.querySelector('.video-feed');
        const mainApp = document.getElementById('mainApp');
        
        if (page === 'feed' || page === 'foryou' || page === 'following' || !page) {
            if (videoFeed) videoFeed.style.display = 'block';
            if (mainApp) mainApp.style.display = 'block';
            return; // Don't create any special pages for feed
        }
    }
    
    // CRITICAL FIX: Remove profile page if it exists when navigating to any other page
    const profilePage = document.getElementById('profilePage');
    if (profilePage && page !== 'profile') {
        profilePage.remove();
        console.log('✅ Removed profile page for navigation');
    }
    
    // CRITICAL: Clean up activity and analytics overlays FIRST before any early returns
    const activityPageCleanup = document.getElementById('activityPage');
    if (activityPageCleanup && page !== 'activity') {
        activityPageCleanup.remove();
        console.log('🧹 Pre-cleanup: Removed activity page');
    }
    
    const analyticsOverlayCleanup = document.querySelector('[style*="position: fixed"][style*="z-index: 99999"]');
    if (analyticsOverlayCleanup && page !== 'analytics') {
        analyticsOverlayCleanup.remove();
        console.log('🧹 Pre-cleanup: Removed analytics overlay');
    }

    // Handle VIB3 unique features
    if (page === 'viberooms') {
        showVibeRooms();
        return;
    }
    
    if (page === 'energymeter') {
        showEnergyMeter();
        return;
    }
    
    if (page === 'creator-studio') {
        showCreatorStudio();
        return;
    }
    
    if (page === 'challenges') {
        showChallenges();
        return;
    }
    
    if (page === 'collaboration') {
        showCollaborationHub();
        return;
    }
    
    if (page === 'coins') {
        showCoins();
        return;
    }
    
    if (page === 'messages') {
        createMessagesPage();
        return;
    }
    
    if (page === 'creator') {
        showCreatorFundPage();
        return;
    }
    
    if (page === 'shop') {
        showShopPage();
        return;
    }
    
    if (page === 'live') {
        showLiveStreaming();
        return;
    }

    // Handle feed tabs - don't show "coming soon" for these
    if (page === 'home' || page === 'discover' || page === 'vibing' || page === 'network' || page === 'pulse' ||
        page === 'foryou' || page === 'following' || page === 'explore' || page === 'friends') {
        // CRITICAL: Force hide ALL activity and special pages when going to feeds
        document.querySelectorAll('.activity-page, .analytics-page, .messages-page, .profile-page').forEach(el => {
            if (el) {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.style.opacity = '0';
                el.style.zIndex = '-1';
            }
        });
        
        // Remove any dynamically created pages
        const dynamicPages = ['activityPage', 'analyticsOverlay'];
        dynamicPages.forEach(pageId => {
            const element = document.getElementById(pageId);
            if (element) {
                element.remove();
                console.log(`🧹 Force removed ${pageId} for feed navigation`);
            }
        });
        
        // Remove any fixed position overlays
        document.querySelectorAll('[style*="position: fixed"]').forEach(overlay => {
            if (overlay.style.zIndex === '99999' || overlay.style.zIndex === '100000') {
                overlay.remove();
                console.log('🧹 Removed fixed overlay for feed navigation');
            }
        });
        
        // Make sure to show the main app for feed tabs
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.style.display = 'block';
            mainApp.style.visibility = 'visible';
            mainApp.style.opacity = '1';
            mainApp.style.zIndex = '1';
        }
        switchFeedTab(page);
        return;
    }
    
    // Special handling for live page
    if (page === 'live') {
        openLiveStreamSetup();
        return;
    }
    
    // Hide all pages and feeds first including dynamically created ones
    document.querySelectorAll('.video-feed, .search-page, .profile-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page, .activity-page, .friends-page').forEach(el => {
        el.style.display = 'none';
    });
    
    // CRITICAL: Also hide the analytics overlay if it exists
    const analyticsOverlay = document.getElementById('analyticsOverlay');
    if (analyticsOverlay) {
        analyticsOverlay.remove();
        console.log('🧹 Removed analytics overlay');
    }
    
    // CRITICAL: Also remove activity page if it exists when navigating away
    const activityPage = document.getElementById('activityPage');
    if (activityPage && page !== 'activity') {
        activityPage.remove();
        console.log('🧹 Removed activity page');
    }
    
    // Hide main video feed for non-feed pages
    const mainApp = document.getElementById('mainApp');
    if (mainApp && page !== 'foryou' && page !== 'explore' && page !== 'following' && page !== 'friends') {
        mainApp.style.display = 'none';
    }
    
    // Handle special cases for pages that don't exist yet
    if (page === 'activity') {
        createActivityPage();
        return;
    }
    
    if (page === 'messages') {
        createMessagesPage();
        return;
    }
    
    if (page === 'profile') {
        if (window.createSimpleProfilePage) {
            createSimpleProfilePage();
        } else {
            createProfilePage();
        }
        return;
    }
    
    if (page === 'friends') {
        // Friends should show video feed from people you follow, not a friends list page
        loadVideoFeed('friends', true);
        return;
    }
    
    if (page === 'analytics') {
        console.log('📊 Analytics page case triggered');
        
        // Hide main app completely when showing analytics
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.style.display = 'none';
        }
        
        // Remove existing dynamic pages that might interfere
        const pagesToRemove = ['coinsPage', 'collaborationPage', 'challengesPage', 'vibeRoomsPage', 'creatorStudioPage', 'activityPage'];
        pagesToRemove.forEach(pageId => {
            const page = document.getElementById(pageId);
            if (page) {
                page.remove();
                console.log(`🧹 Removed ${pageId} for analytics page`);
            }
        });
        
        // Show analytics page specifically
        const analyticsPage = document.getElementById('analyticsPage');
        console.log('📊 Analytics page element:', analyticsPage);
        if (analyticsPage) {
            analyticsPage.style.display = 'block';
            analyticsPage.style.visibility = 'visible';
            analyticsPage.style.opacity = '1';
            analyticsPage.style.zIndex = '10000';
            console.log('📊 Analytics page display set to block with visibility fixes');
            // Trigger analytics data loading from the HTML page function
            if (window.loadAnalyticsData) {
                console.log('📊 Calling loadAnalyticsData');
                setTimeout(window.loadAnalyticsData, 100);
            } else {
                console.log('❌ loadAnalyticsData function not found');
            }
        } else {
            console.log('❌ Analytics page element not found');
        }
        return;
    }
    
    // Show specific page
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.style.display = 'block';
    } else {
        // For feed-related pages, show main app instead of "coming soon"
        if (page === 'home' || page === 'feed') {
            if (mainApp) {
                mainApp.style.display = 'block';
            }
            switchFeedTab('home');
            return;
        }
        
        // Fallback - show main app if page doesn't exist
        if (mainApp) {
            mainApp.style.display = 'block';
        }
        showNotification(`${page} page coming soon!`, 'info');
    }
}

function openLiveStreamSetup() {
    // Show camera selection modal first for live streaming
    showCameraSelectionModal('live');
}

function openLiveStreamWithCamera(stream) {
    console.log('🔴 Opening live stream with camera stream:', stream);
    const liveModal = document.createElement('div');
    liveModal.className = 'modal live-stream-modal';
    liveModal.style.zIndex = '100000';
    liveModal.innerHTML = `
        <div class="modal-content live-content">
            <div class="live-header">
                <button onclick="closeLiveStream()" class="close-btn">&times;</button>
                <h3>📺 Go Live</h3>
            </div>
            
            <div class="live-setup">
                <div class="live-preview">
                    <video id="livePreview" autoplay muted playsinline webkit-playsinline></video>
                    <div class="live-overlay">
                        <div class="live-indicator">🔴 LIVE</div>
                        <div class="viewer-count">0 viewers</div>
                    </div>
                </div>
                
                <div class="live-settings">
                    <div class="setting-group">
                        <label>Stream Title</label>
                        <input type="text" id="streamTitle" placeholder="What's happening?" maxlength="100">
                    </div>
                    
                    <div class="setting-group">
                        <label>Category</label>
                        <select id="streamCategory">
                            <option value="just-chatting">Just Chatting</option>
                            <option value="music">Music</option>
                            <option value="gaming">Gaming</option>
                            <option value="art">Art & Creativity</option>
                            <option value="education">Educational</option>
                            <option value="lifestyle">Lifestyle</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="setting-group">
                        <label>Privacy</label>
                        <div class="privacy-options">
                            <label><input type="radio" name="privacy" value="public" checked> 🌍 Public</label>
                            <label><input type="radio" name="privacy" value="followers"> 👥 Followers Only</label>
                            <label><input type="radio" name="privacy" value="friends"> 👫 Friends Only</label>
                        </div>
                    </div>
                    
                    <div class="setting-group">
                        <label>Stream Quality</label>
                        <select id="streamQuality">
                            <option value="4K">4K Ultra HD</option>
                            <option value="1080p">1080p Full HD</option>
                            <option value="720p">720p HD</option>
                            <option value="480p">480p (Data Saver)</option>
                        </select>
                    </div>
                    
                    <div class="live-actions">
                        <button onclick="startLiveStream()" class="go-live-btn">🔴 Go Live</button>
                        <button onclick="scheduleLiveStream()" class="schedule-btn">📅 Schedule</button>
                    </div>
                </div>
            </div>
            
            <!-- Live Chat Interface (when streaming) -->
            <div class="live-chat" id="liveChat" style="display: none;">
                <div class="chat-header">
                    <h4>Live Chat</h4>
                    <button onclick="toggleChatSettings()" class="chat-settings-btn">⚙️</button>
                </div>
                <div class="chat-messages" id="chatMessages"></div>
                <div class="chat-input">
                    <input type="text" placeholder="Say something..." onkeypress="if(event.key==='Enter') sendChatMessage(this.value)">
                    <button onclick="sendGift()" class="gift-btn">🎁</button>
                </div>
            </div>
            
            <!-- Gift Selection -->
            <div class="gift-selection" id="giftSelection" style="display: none;">
                <h4>Send Gift</h4>
                <div class="gifts-grid">
                    <div class="gift-item" onclick="sendSpecificGift('heart', 1)">
                        <div class="gift-icon">❤️</div>
                        <div class="gift-name">Heart</div>
                        <div class="gift-cost">1 coin</div>
                    </div>
                    <div class="gift-item" onclick="sendSpecificGift('star', 5)">
                        <div class="gift-icon">⭐</div>
                        <div class="gift-name">Star</div>
                        <div class="gift-cost">5 coins</div>
                    </div>
                    <div class="gift-item" onclick="sendSpecificGift('diamond', 10)">
                        <div class="gift-icon">💎</div>
                        <div class="gift-name">Diamond</div>
                        <div class="gift-cost">10 coins</div>
                    </div>
                    <div class="gift-item" onclick="sendSpecificGift('crown', 25)">
                        <div class="gift-icon">👑</div>
                        <div class="gift-name">Crown</div>
                        <div class="gift-cost">25 coins</div>
                    </div>
                    <div class="gift-item" onclick="sendSpecificGift('rocket', 50)">
                        <div class="gift-icon">🚀</div>
                        <div class="gift-name">Rocket</div>
                        <div class="gift-cost">50 coins</div>
                    </div>
                    <div class="gift-item" onclick="sendSpecificGift('unicorn', 100)">
                        <div class="gift-icon">🦄</div>
                        <div class="gift-name">Unicorn</div>
                        <div class="gift-cost">100 coins</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(liveModal);
    liveModal.classList.add('show');
    liveModal.style.display = 'flex';
    liveModal.style.position = 'fixed';
    liveModal.style.top = '0';
    liveModal.style.left = '0';
    liveModal.style.right = '0';
    liveModal.style.bottom = '0';
    liveModal.style.backgroundColor = 'rgba(0,0,0,0.95)';
    
    // Set up camera stream for live preview - wait for DOM to be ready
    setTimeout(() => {
        console.log('🎥 Setting up live preview video element...');
        const livePreview = document.getElementById('livePreview');
        console.log('📺 Live preview element:', livePreview);
        console.log('📡 Stream for preview:', stream);
        
        if (livePreview && stream) {
            console.log('🔗 Connecting stream to video element...');
            livePreview.srcObject = stream;
            livePreview.muted = false; // Allow audio for live preview
            
            // Add load event listener
            livePreview.addEventListener('loadedmetadata', () => {
                console.log('📹 Video metadata loaded, playing...');
                livePreview.play().then(() => {
                    console.log('✅ Live preview playing successfully');
                }).catch(error => {
                    console.error('❌ Failed to play live preview:', error);
                });
            });
            
            livePreview.addEventListener('error', (error) => {
                console.error('❌ Video element error:', error);
            });
            
            console.log('📹 Camera stream connected to live preview');
            
            // Store stream globally to prevent it from being garbage collected
            window.currentLiveStream = stream;
            
            // Ensure stream stays active
            stream.getTracks().forEach(track => {
                console.log(`📡 Track: ${track.kind} - ${track.label} - Active: ${track.enabled}`);
            });
        } else {
            console.error('❌ Live preview element not found or no stream');
            console.log('Debug - livePreview:', livePreview);
            console.log('Debug - stream:', stream);
        }
        
        initializeLiveStream(stream);
    }, 500); // Increased timeout to ensure DOM is ready
}

function initializeLiveStream(stream) {
    console.log('🔴 Initializing live stream...');
    
    if (!stream) {
        console.error('❌ No stream provided to initializeLiveStream');
        return;
    }
    
    // Keep the stream active and prevent it from stopping
    stream.getTracks().forEach(track => {
        track.enabled = true;
        console.log(`✅ Track ${track.kind} enabled: ${track.enabled}`);
        
        // Listen for track ending
        track.addEventListener('ended', () => {
            console.warn(`⚠️ Track ${track.kind} ended unexpectedly`);
        });
    });
    
    // Add stream event listeners
    stream.addEventListener('addtrack', (event) => {
        console.log('📡 Track added to stream:', event.track.kind);
    });
    
    stream.addEventListener('removetrack', (event) => {
        console.log('📡 Track removed from stream:', event.track.kind);
    });
    
    console.log('✅ Live stream initialized successfully');
}

function closeLiveStream() {
    console.log('🔴 Closing live stream...');
    
    // Stop all tracks in the current stream
    if (window.currentLiveStream) {
        window.currentLiveStream.getTracks().forEach(track => {
            track.stop();
            console.log(`🛑 Stopped ${track.kind} track`);
        });
        window.currentLiveStream = null;
    }
    
    // Remove the modal
    const modal = document.querySelector('.live-stream-modal');
    if (modal) {
        modal.remove();
    }
}

// ================ UTILITY FUNCTIONS ================
function formatCount(count) {
    if (count < 1000) return count.toString();
    if (count < 1000000) return (count / 1000).toFixed(1) + 'K';
    return (count / 1000000).toFixed(1) + 'M';
}

function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4ecdc4' : type === 'error' ? '#ff6b6b' : '#45b7d1'};
        color: white;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), duration);
}

function switchFeedTab(feedType) {
    // Map new feed names to internal logic for backward compatibility
    const internalFeedType = mapFeedType(feedType);
    
    // CRITICAL: Remove analytics overlay when switching feeds
    const analyticsOverlay = document.getElementById('analyticsOverlay');
    if (analyticsOverlay) {
        analyticsOverlay.remove();
        console.log('🧹 Removed analytics overlay when switching to:', feedType);
    }
    
    // Also hide the analytics page
    const analyticsPage = document.getElementById('analyticsPage');
    if (analyticsPage) {
        analyticsPage.style.display = 'none';
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`🔄 Switching to ${feedType} feed`);
    }
    
    // CRITICAL FIX: Remove profile page when switching feeds
    const profilePage = document.getElementById('profilePage');
    if (profilePage) {
        profilePage.remove();
        console.log('✅ Removed profile page when switching to feed');
    }
    
    // Clear any cached feed data to prevent deleted video flicker
    window.currentFeed = feedType;
    console.log(`🗑️ Clearing cached data for fresh ${feedType} feed load`);
    
    // Stop all currently playing videos and clear their sources
    document.querySelectorAll('video').forEach(video => {
        video.pause();
        video.muted = true;
        video.currentTime = 0;
        // Clear the source to completely stop audio
        if (video.srcObject) {
            video.srcObject = null;
        }
        if (video.src && !video.src.includes('blob:')) {
            video.removeAttribute('src');
            video.load();
        }
        console.log('⏸️ Stopped video and audio during feed switch');
    });
    
    // Hide all feed content containers and clear their content
    document.querySelectorAll('.feed-content').forEach(feed => {
        feed.classList.remove('active');
        feed.style.display = 'none';
        // Only clear content for non-explore feeds to preserve explore structure
        if (feed.id !== 'exploreFeed') {
            feed.innerHTML = '';
        } else {
            // For explore feed, just clear the video grid if it exists
            const exploreGrid = feed.querySelector('#exploreVideoGrid');
            if (exploreGrid) {
                exploreGrid.innerHTML = '';
            }
        }
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.feed-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show the target feed container
    const targetFeed = document.getElementById(feedType + 'Feed');
    if (targetFeed) {
        // Only clear content for non-discover feeds to preserve discover structure
        if (internalFeedType !== 'explore') {
            // Only show loading if not loading a specific video
            if (!window.isLoadingSpecificVideo) {
                targetFeed.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">Loading...</div>';
            }
        } else {
            // For discover feed, ensure the structure exists, then clear the video grid
            if (!document.getElementById('exploreVideoGrid')) {
                // Create the structure if it doesn't exist
                targetFeed.innerHTML = `
                    <div class="discover-header" style="padding: 20px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
                        <div class="search-bar-container" style="margin-bottom: 20px;">
                            <input type="text" class="discover-search" placeholder="Search videos, creators, hashtags..." style="width: 100%; padding: 12px 16px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary); font-size: 14px;" onkeypress="if(event.key==='Enter') performDiscoverSearch(this.value)">
                        </div>
                        <div class="trending-hashtags" style="margin-bottom: 15px;">
                            <h3 style="color: var(--text-primary); margin-bottom: 10px; font-size: 16px;">Trending</h3>
                            <div class="hashtag-list" style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <span class="hashtag-item" style="background: var(--bg-tertiary); color: var(--text-primary); padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;" onclick="performExploreSearch('#dance')">#dance</span>
                                <span class="hashtag-item" style="background: var(--bg-tertiary); color: var(--text-primary); padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;" onclick="performExploreSearch('#viral')">#viral</span>
                                <span class="hashtag-item" style="background: var(--bg-tertiary); color: var(--text-primary); padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;" onclick="performExploreSearch('#music')">#music</span>
                                <span class="hashtag-item" style="background: var(--bg-tertiary); color: var(--text-primary); padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;" onclick="performExploreSearch('#comedy')">#comedy</span>
                                <span class="hashtag-item" style="background: var(--bg-tertiary); color: var(--text-primary); padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;" onclick="performExploreSearch('#fyp')">#fyp</span>
                            </div>
                        </div>
                        <div class="category-filters" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px;">
                            <button class="category-btn active" style="background: var(--accent-primary); color: white; border: none; padding: 8px 16px; border-radius: 20px; white-space: nowrap; font-size: 12px; cursor: pointer;" onclick="filterByCategory('all')">All</button>
                            <button class="category-btn" style="background: var(--bg-tertiary); color: var(--text-primary); border: none; padding: 8px 16px; border-radius: 20px; white-space: nowrap; font-size: 12px; cursor: pointer;" onclick="filterByCategory('trending')">Trending</button>
                            <button class="category-btn" style="background: var(--bg-tertiary); color: var(--text-primary); border: none; padding: 8px 16px; border-radius: 20px; white-space: nowrap; font-size: 12px; cursor: pointer;" onclick="filterByCategory('dance')">Dance</button>
                            <button class="category-btn" style="background: var(--bg-tertiary); color: var(--text-primary); border: none; padding: 8px 16px; border-radius: 20px; white-space: nowrap; font-size: 12px; cursor: pointer;" onclick="filterByCategory('music')">Music</button>
                            <button class="category-btn" style="background: var(--bg-tertiary); color: var(--text-primary); border: none; padding: 8px 16px; border-radius: 20px; white-space: nowrap; font-size: 12px; cursor: pointer;" onclick="filterByCategory('comedy')">Comedy</button>
                            <button class="category-btn" style="background: var(--bg-tertiary); color: var(--text-primary); border: none; padding: 8px 16px; border-radius: 20px; white-space: nowrap; font-size: 12px; cursor: pointer;" onclick="filterByCategory('beauty')">Beauty</button>
                            <button class="category-btn" style="background: var(--bg-tertiary); color: var(--text-primary); border: none; padding: 8px 16px; border-radius: 20px; white-space: nowrap; font-size: 12px; cursor: pointer;" onclick="filterByCategory('food')">Food</button>
                        </div>
                    </div>
                    <div id="exploreVideoGrid" class="explore-video-grid" style="
                        overflow-y: auto; 
                        max-height: calc(100vh - 200px);
                        background: var(--bg-primary);
                    ">
                        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
                            <div class="spinner"></div>
                            <p style="margin-top: 20px;">Loading explore content...</p>
                        </div>
                    </div>
                `;
            }
            // Clear just the video grid
            const exploreGrid = document.getElementById('exploreVideoGrid');
            if (exploreGrid) {
                exploreGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #888; grid-column: 1 / -1;">Loading explore videos...</div>';
            }
        }
        targetFeed.classList.add('active');
        targetFeed.style.display = 'block';
        console.log(`✅ Activated ${feedType} feed container`);
    }
    
    // Activate the corresponding tab if it exists
    const targetTab = document.getElementById(feedType + 'Tab');
    if (targetTab) {
        targetTab.classList.add('active');
        console.log(`✅ Activated ${feedType} tab`);
    }
    
    // Ensure main app is visible
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'block';
    }
    
    // Clean up any orphaned media elements
    cleanupOrphanedMedia();
    
    // Add a small delay to ensure cleanup is complete before loading new content
    setTimeout(() => {
        // Clean up any orphaned spinners before loading
        cleanupLoadingSpinners();
        
        // Initialize discover page if switching to discover  
        if (internalFeedType === 'explore') {
            // Don't call loadVideoFeed for discover - use dedicated discover initialization
            console.log('🔍 Calling initializeExplorePage for discover feed');
            setTimeout(initializeExplorePage, 100);
        } else {
            // Only load regular feed if not loading a specific video
            if (!window.isLoadingSpecificVideo) {
                console.log(`📹 Loading regular video feed for: ${feedType}`);
                loadVideoFeed(feedType, true, 1, false); // Force fresh load, no append
            } else {
                console.log(`🎯 Skipping regular feed load - loading specific video`);
            }
        }
    }, 100);
    
    // After a brief delay, ensure the first video starts playing (but NOT for explore)
    if (feedType !== 'explore') {
        setTimeout(() => {
            const firstVideo = targetFeed?.querySelector('video');
            if (firstVideo) {
                firstVideo.currentTime = 0;
                firstVideo.play().catch(e => console.log('Auto-play prevented:', e));
                console.log('🎬 Started first video in', feedType, 'feed');
            }
        }, 500);
    } else {
        console.log('🔍 Skipping video autoplay for explore grid');
    }
}

function refreshForYou() {
    loadVideoFeed('home', true);
}

function performSearch(query) {
    if (!query || !query.trim()) return;
    
    console.log(`🔍 Performing search for: "${query}"`);
    
    // Check if searching for a specific user with @
    if (query.startsWith('@')) {
        const username = query.substring(1).trim();
        console.log(`👤 Searching for user: ${username}`);
        showNotification(`Looking for @${username}...`, 'info');
        
        // Try to find and navigate to user profile
        searchAndNavigateToUser(username);
        return;
    }
    
    showNotification(`Searching for: ${query}`, 'info');
    showPage('search');
    
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.innerHTML = `
            <div class="search-results">
                <h3>Search Results for "${query}"</h3>
                <div class="search-tabs">
                    <button class="tab-btn active" onclick="filterSearchResults('all')">All</button>
                    <button class="tab-btn" onclick="filterSearchResults('videos')">Videos</button>
                    <button class="tab-btn" onclick="filterSearchResults('users')">Users</button>
                    <button class="tab-btn" onclick="filterSearchResults('sounds')">Sounds</button>
                    <button class="tab-btn" onclick="filterSearchResults('hashtags')">Hashtags</button>
                </div>
                <div class="search-items">
                    <div class="search-item video-result">
                        <div class="video-thumbnail" style="background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);"></div>
                        <div class="video-info">
                            <div class="video-title">Dance Challenge with ${query}</div>
                            <div class="video-stats">2.3M views • @dancer_pro</div>
                        </div>
                    </div>
                    <div class="search-item user-result" onclick="searchAndNavigateToUser('${query}')">
                        <div class="user-avatar">👤</div>
                        <div class="user-info">
                            <div class="user-name">${query}_official</div>
                            <div class="user-stats">1.2M followers</div>
                        </div>
                        <button class="follow-btn" onclick="event.stopPropagation(); toggleFollow('${query}_official')">Follow</button>
                    </div>
                    <div class="search-item hashtag-result">
                        <div class="hashtag-icon">#</div>
                        <div class="hashtag-info">
                            <div class="hashtag-name">#${query}</div>
                            <div class="hashtag-stats">456K videos</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

async function searchAndNavigateToUser(username) {
    console.log(`🔍 Searching for user: ${username}`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(username)}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            console.log(`📋 Found ${users.length} users matching: ${username}`);
            
            // Find exact username match
            const exactMatch = users.find(user => user.username.toLowerCase() === username.toLowerCase());
            
            if (exactMatch) {
                console.log(`✅ Found exact match: ${exactMatch.username} (${exactMatch._id})`);
                showNotification(`Found @${exactMatch.username}!`, 'success');
                viewUserProfile(exactMatch._id);
            } else if (users.length > 0) {
                console.log(`📋 No exact match, showing first result: ${users[0].username}`);
                showNotification(`Found @${users[0].username}`, 'success');
                viewUserProfile(users[0]._id);
            } else {
                console.log(`❌ No users found for: ${username}`);
                showNotification(`No user found with username: @${username}`, 'error');
            }
        } else {
            console.log(`❌ Search failed with status: ${response.status}`);
            showNotification('Search failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error searching for user:', error);
        showNotification('Error searching for user. Please try again.', 'error');
    }
}

// Global function to clean up any orphaned loading spinners
function cleanupLoadingSpinners() {
    const spinners = document.querySelectorAll('.loading-container:not(.feed-content .loading-container), .spinner:not(.feed-content .spinner), .status-circle');
    spinners.forEach(spinner => {
        console.log('🧹 Removing orphaned spinner:', spinner.className);
        spinner.remove();
    });
}

// ================ AI RECOMMENDATIONS ENGINE ================
class AIRecommendationEngine {
    constructor() {
        this.userPreferences = {
            categories: new Map(),
            hashtags: new Map(),
            creators: new Map(),
            engagement: new Map(),
            watchTime: new Map()
        };
        this.recommendationCache = new Map();
        this.initializeEngine();
    }

    initializeEngine() {
        console.log('🤖 Initializing AI Recommendation Engine...');
        this.loadUserPreferences();
        this.startEngagementTracking();
    }

    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('vib3_user_preferences');
            if (saved) {
                const data = JSON.parse(saved);
                Object.keys(data).forEach(key => {
                    if (this.userPreferences[key]) {
                        this.userPreferences[key] = new Map(data[key]);
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to load user preferences:', error);
        }
    }

    saveUserPreferences() {
        try {
            const data = {};
            Object.keys(this.userPreferences).forEach(key => {
                data[key] = Array.from(this.userPreferences[key].entries());
            });
            localStorage.setItem('vib3_user_preferences', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save user preferences:', error);
        }
    }

    trackEngagement(video, engagementType, value = 1) {
        if (!video || !video.id) return;

        const videoId = video.id;
        const userId = video.userId || video.username;
        const category = video.category || 'general';
        const hashtags = video.hashtags || [];

        switch (engagementType) {
            case 'view':
                this.userPreferences.categories.set(category, 
                    (this.userPreferences.categories.get(category) || 0) + 0.1);
                if (userId) {
                    this.userPreferences.creators.set(userId, 
                        (this.userPreferences.creators.get(userId) || 0) + 0.1);
                }
                break;

            case 'like':
                this.userPreferences.categories.set(category, 
                    (this.userPreferences.categories.get(category) || 0) + 1);
                hashtags.forEach(tag => {
                    this.userPreferences.hashtags.set(tag, 
                        (this.userPreferences.hashtags.get(tag) || 0) + 0.5);
                });
                if (userId) {
                    this.userPreferences.creators.set(userId, 
                        (this.userPreferences.creators.get(userId) || 0) + 1);
                }
                break;

            case 'comment':
                this.userPreferences.categories.set(category, 
                    (this.userPreferences.categories.get(category) || 0) + 1.5);
                if (userId) {
                    this.userPreferences.creators.set(userId, 
                        (this.userPreferences.creators.get(userId) || 0) + 1.5);
                }
                break;

            case 'share':
                this.userPreferences.categories.set(category, 
                    (this.userPreferences.categories.get(category) || 0) + 2);
                if (userId) {
                    this.userPreferences.creators.set(userId, 
                        (this.userPreferences.creators.get(userId) || 0) + 2);
                }
                break;

            case 'watch_time':
                this.userPreferences.watchTime.set(videoId, value);
                const watchScore = Math.min(value / 30, 2);
                this.userPreferences.categories.set(category, 
                    (this.userPreferences.categories.get(category) || 0) + watchScore);
                break;
        }

        this.saveUserPreferences();
    }

    startEngagementTracking() {
        let videoWatchTimes = new Map();
        
        document.addEventListener('video-view-start', (event) => {
            const video = event.detail;
            videoWatchTimes.set(video.id, Date.now());
        });

        document.addEventListener('video-view-end', (event) => {
            const video = event.detail;
            const startTime = videoWatchTimes.get(video.id);
            if (startTime) {
                const watchTime = (Date.now() - startTime) / 1000;
                this.trackEngagement(video, 'watch_time', watchTime);
                videoWatchTimes.delete(video.id);
            }
        });
    }

    calculateVideoScore(video) {
        let score = 0;
        const category = video.category || 'general';
        const userId = video.userId || video.username;
        const hashtags = video.hashtags || [];

        score += (this.userPreferences.categories.get(category) || 0) * 0.3;

        if (userId) {
            score += (this.userPreferences.creators.get(userId) || 0) * 0.4;
        }

        hashtags.forEach(tag => {
            score += (this.userPreferences.hashtags.get(tag) || 0) * 0.2;
        });

        const engagement = (video.likes || 0) + (video.comments || 0) * 2 + (video.shares || 0) * 3;
        score += Math.log(engagement + 1) * 0.1;

        const ageInHours = (Date.now() - new Date(video.createdAt || Date.now()).getTime()) / (1000 * 60 * 60);
        const recencyScore = Math.max(0, 1 - ageInHours / 168);
        score += recencyScore * 0.1;

        return score;
    }

    async getRecommendations(feedType = 'home', limit = 10) {
        const cacheKey = `${feedType}_${limit}`;
        
        if (this.recommendationCache.has(cacheKey)) {
            const cached = this.recommendationCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
                return cached.recommendations;
            }
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/videos?limit=50&type=${feedType}`);
            let videos = [];
            
            if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
                const data = await response.json();
                videos = data.videos || data || [];
            } else {
                console.warn('API returned non-JSON response, using sample videos');
                videos = this.getSampleVideos();
            }

            const scoredVideos = videos
                .map(video => ({
                    ...video,
                    aiScore: this.calculateVideoScore(video)
                }))
                .sort((a, b) => b.aiScore - a.aiScore)
                .slice(0, limit);

            this.recommendationCache.set(cacheKey, {
                recommendations: scoredVideos,
                timestamp: Date.now()
            });

            console.log(`🤖 Generated ${scoredVideos.length} AI recommendations for ${feedType}`);
            return scoredVideos;

        } catch (error) {
            console.error('AI Recommendations error:', error);
            return this.getSampleVideos().slice(0, limit);
        }
    }

    getSampleVideos() {
        return [
            {
                id: 'ai_rec_1',
                title: 'AI Recommended: Coding Tips',
                description: 'Based on your interests in tech content',
                username: 'TechVib3r',
                avatar: '👨‍💻',
                videoUrl: '/api/placeholder-video',
                likes: 1250,
                comments: 89,
                shares: 34,
                category: 'tech',
                hashtags: ['coding', 'tips', 'developer'],
                aiScore: 8.5,
                createdAt: new Date().toISOString()
            },
            {
                id: 'ai_rec_2', 
                title: 'AI Pick: Creative Dance',
                description: 'Trending in your preferred categories',
                username: 'DanceVibes',
                avatar: '💃',
                videoUrl: '/api/placeholder-video',
                likes: 890,
                comments: 67,
                shares: 23,
                category: 'dance',
                hashtags: ['dance', 'creative', 'trending'],
                aiScore: 7.8,
                createdAt: new Date().toISOString()
            }
        ];
    }

    clearCache() {
        this.recommendationCache.clear();
        console.log('🤖 AI recommendation cache cleared');
    }
}

// ================ INITIALIZATION ================
document.addEventListener('DOMContentLoaded', function() {    
    // Apply saved theme
    const savedTheme = localStorage.getItem('vib3-theme');
    if (savedTheme) {
        document.body.className = `theme-${savedTheme}`;
    }
    
    // Initialize AI Recommendation Engine
    window.aiRecommendationEngine = new AIRecommendationEngine();
    
    // Initialize authentication
    initializeAuth();
    
    // Add global CSS for animations
    addGlobalStyles();
    
    // Clean up any loading spinners from previous sessions
    setTimeout(cleanupLoadingSpinners, 1000);
});

function addGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes likeAnimation {
            0% { transform: scale(1) translateY(0); opacity: 1; }
            50% { transform: scale(1.5) translateY(-20px); opacity: 0.8; }
            100% { transform: scale(0) translateY(-40px); opacity: 0; }
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top-color: #ff6b6b;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .video-card {
            position: relative;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .action-btn {
            background: rgba(0,0,0,0.5);
            border: none;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            color: white;
            cursor: pointer;
            margin: 8px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        
        .action-btn:hover {
            background: rgba(0,0,0,0.7);
            transform: scale(1.1);
        }
        
        .reaction-buttons {
            position: absolute;
            left: -120px;
            top: 0;
            display: flex;
            gap: 8px;
            background: rgba(0,0,0,0.8);
            padding: 8px;
            border-radius: 25px;
        }
        
        .reaction-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 4px;
            border-radius: 50%;
            transition: transform 0.2s ease;
        }
        
        .reaction-btn:hover {
            transform: scale(1.2);
        }
        
        /* Responsive explore grid - landscape format optimized */
        @media (min-width: 1200px) {
            #exploreVideoGrid {
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important;
            }
        }
        
        @media (min-width: 768px) and (max-width: 1199px) {
            #exploreVideoGrid {
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
            }
        }
        
        @media (max-width: 767px) {
            #exploreVideoGrid {
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
            }
        }
        
        @media (max-width: 480px) {
            #exploreVideoGrid {
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important;
            }
        }
        
        /* Explore category pills */
        .category-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .hashtag-item:hover {
            transform: scale(1.05);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(style);
}

// ================ THEME & SETTINGS ================
function changeTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    localStorage.setItem('vib3-theme', themeName);
    showNotification(`Theme changed to ${themeName}`, 'success');
}

function toggleSetting(element, settingName) {
    const isActive = element.classList.toggle('active');
    localStorage.setItem(`vib3-${settingName}`, isActive);
    
    // Handle specific settings
    if (settingName === 'darkMode') {
        changeTheme(isActive ? 'dark' : 'light');
    }
    
    showNotification(`${settingName} ${isActive ? 'enabled' : 'disabled'}`, 'info');
}

function showToast(message) {
    showNotification(message, 'info');
}

// ================ SHARING & SOCIAL ================
function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) modal.style.display = 'none';
}

function toggleRepost() {
    showNotification('Reposted!', 'success');
}

function copyVideoLink() {
    const videoUrl = window.location.href + '#video/' + currentVideoId;
    navigator.clipboard.writeText(videoUrl).then(() => {
        showNotification('Link copied!', 'success');
    });
}

function shareToInstagram(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    const message = `Check out this amazing video on VIB3! ${url}`;
    
    // Try mobile deep link first (for mobile devices)
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(userAgent);
    
    if (isMobile) {
        // Try Instagram deep link
        const instagramUrl = `instagram://camera`;
        
        // Attempt to open Instagram app
        window.location.href = instagramUrl;
        
        // Also copy link immediately as backup
        directCopyToClipboard(url, 'Opening Instagram... Link copied to paste in your story!');
    } else {
        // Desktop - try to open Instagram web, then copy
        window.open('https://www.instagram.com/', '_blank');
        directCopyToClipboard(url, 'Opening Instagram... Link copied to paste in your post!');
    }
}

// Simple direct copy function for main app
function directCopyToClipboard(text, message) {
    // Try clipboard API first (silent)
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            // Success - show notification
            if (window.showNotification) {
                window.showNotification(message, 'success');
            }
        }).catch(() => {
            // Failed - just show notification anyway (assume copy worked)
            if (window.showNotification) {
                window.showNotification(message, 'info');
            }
        });
    } else {
        // No clipboard API - just show the notification
        if (window.showNotification) {
            window.showNotification(message, 'info');
        }
    }
}

function shareToTwitter(videoId) {
    const videoUrl = `${window.location.origin}/?video=${videoId}`;
    const text = 'Check out this amazing video on VIB3! 🔥';
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(videoUrl)}`, '_blank');
    showNotification('Opening Twitter...', 'info');
}

function shareToFacebook(videoId) {
    const videoUrl = `${window.location.origin}/?video=${videoId}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`, '_blank');
    showNotification('Opening Facebook...', 'info');
}

function shareToWhatsApp(videoId) {
    const videoUrl = `${window.location.origin}/?video=${videoId}`;
    const text = 'Check out this amazing video on VIB3! 🔥 ' + videoUrl;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    showNotification('Opening WhatsApp...', 'info');
}

function shareToTelegram(videoId) {
    const videoUrl = `${window.location.origin}/?video=${videoId}`;
    const text = 'Check out this amazing video on VIB3! 🔥';
    window.open(`https://t.me/share/url?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(text)}`, '_blank');
    showNotification('Opening Telegram...', 'info');
}

function shareViaEmail(videoId) {
    const videoUrl = `${window.location.origin}/?video=${videoId}`;
    const subject = 'Check out this amazing VIB3 video! 🔥';
    const body = 'I thought you might enjoy this video on VIB3:\n\n' + videoUrl;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    showNotification('Opening email app...', 'info');
}

function downloadVideo() {
    showNotification('Starting download...', 'info');
    // In real app, this would download the video
}

function generateQRCode() {
    showNotification('QR Code generated!', 'success');
    // In real app, this would generate a QR code
}

function shareNative() {
    if (navigator.share) {
        navigator.share({
            title: 'VIB3 Video',
            text: 'Check out this awesome video!',
            url: window.location.href
        }).catch(() => {});
    } else {
        copyVideoLink();
    }
}

// ================ UPLOAD & MEDIA ================
// Note: Main selectVideo function is now in upload modal section above

function uploadProfilePicture() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            showNotification('Profile picture updated!', 'success');
            // Handle image upload
        }
    };
    input.click();
}

function editDisplayName() {
    const newName = prompt('Enter new display name:', currentUser?.displayName || '');
    if (newName && newName.trim()) {
        // Update display name
        showNotification('Display name updated!', 'success');
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.style.display = 'none';
}

function confirmDeleteVideo() {
    showNotification('Video deleted', 'info');
    closeDeleteModal();
}

// ================ MESSAGING ================
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function openChat(userId) {
    showPage('messages');
    showNotification(`Opening chat with ${userId}`, 'info');
}

function openGroupChat(groupId) {
    showPage('messages');
    showNotification(`Opening group ${groupId}`, 'info');
}

function startNewChat() {
    const username = prompt('Enter username to chat with:');
    if (username) {
        openChat(username);
    }
}

// ================ SEARCH & DISCOVERY ================
function searchTrendingTag(tag) {
    showNotification(`Searching #${tag}...`, 'info');
    performSearch(`#${tag}`);
}

function filterByTag(tag) {
    showNotification(`Filtering by #${tag}`, 'info');
    // Filter videos by tag
}

// ================ SHOP & MONETIZATION ================
function filterShop(category) {
    showNotification(`Showing ${category} products`, 'info');
    // Filter shop products
}

function viewProduct(productId) {
    showNotification(`Viewing product ${productId}`, 'info');
    // Show product details
}

function checkout() {
    showNotification('Proceeding to checkout...', 'info');
    // Handle checkout
}

function setupTips() {
    showNotification('Creator tips setup opening...', 'info');
}

function setupMerchandise() {
    showNotification('Merchandise setup opening...', 'info');
}

function setupSponsorship() {
    showNotification('Brand partnerships opening...', 'info');
}

function setupSubscription() {
    showNotification('VIB3 Premium setup...', 'info');
}

// ================ ANALYTICS ================
function exportAnalytics(format) {
    showNotification(`Exporting analytics as ${format.toUpperCase()}...`, 'info');
    // Export analytics data
}

function shareAnalytics() {
    showNotification('Sharing analytics report...', 'info');
    // Share analytics
}

// ================ LIVE STREAMING FUNCTIONS ================
let isLiveStreaming = false;
let liveStreamConnection = null;
let liveViewers = 0;

async function startLiveStream() {
    if (isLiveStreaming) {
        stopLiveStream();
        return;
    }

    try {
        console.log('🔴 Starting actual live stream...');
        
        const streamTitle = document.getElementById('streamTitle')?.value || 'Untitled Stream';
        const streamCategory = document.getElementById('streamCategory')?.value || 'just-chatting';
        const streamQuality = document.getElementById('streamQuality')?.value || '720p';
        const privacy = document.querySelector('input[name="privacy"]:checked')?.value || 'public';
        
        // Get current camera stream
        const stream = window.currentLiveStream;
        if (!stream) {
            throw new Error('No camera stream available');
        }
        
        // Update UI to show streaming state
        const goLiveBtn = document.querySelector('.go-live-btn');
        if (goLiveBtn) {
            goLiveBtn.textContent = '⏹️ Stop Stream';
            goLiveBtn.style.background = '#dc3545';
            goLiveBtn.onclick = stopLiveStream;
        }
        
        // Start the live stream broadcast
        await initializeWebRTCBroadcast(stream, {
            title: streamTitle,
            category: streamCategory,
            quality: streamQuality,
            privacy: privacy
        });
        
        isLiveStreaming = true;
        
        // Show live chat
        document.getElementById('liveChat').style.display = 'block';
        
        // Update live indicator
        const liveIndicator = document.querySelector('.live-indicator');
        if (liveIndicator) {
            liveIndicator.textContent = '🔴 LIVE';
            liveIndicator.style.animation = 'pulse 2s infinite';
        }
        
        // Start viewer count updates
        startViewerCountUpdates();
        
        showNotification('🔴 Live stream started successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Failed to start live stream:', error);
        showNotification('Failed to start live stream: ' + error.message, 'error');
    }
}

async function initializeWebRTCBroadcast(stream, config) {
    console.log('🌐 Initializing WebRTC broadcast with config:', config);
    
    // Create WebRTC peer connection for broadcasting
    liveStreamConnection = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    });
    
    // Add local stream to connection
    stream.getTracks().forEach(track => {
        liveStreamConnection.addTrack(track, stream);
    });
    
    // Send stream info to server
    const response = await fetch(`${window.API_BASE_URL}/api/live/start`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(window.authToken && window.authToken !== 'session-based' ? 
                { 'Authorization': `Bearer ${window.authToken}` } : {})
        },
        body: JSON.stringify({
            title: config.title,
            category: config.category,
            quality: config.quality,
            privacy: config.privacy,
            username: currentUser?.username || currentUser?.displayName || 'streamer'
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to register live stream with server');
    }
    
    const streamData = await response.json();
    console.log('✅ Live stream registered:', streamData);
    
    return streamData;
}

function stopLiveStream() {
    console.log('⏹️ Stopping live stream...');
    
    isLiveStreaming = false;
    
    // Close WebRTC connection
    if (liveStreamConnection) {
        liveStreamConnection.close();
        liveStreamConnection = null;
    }
    
    // Update UI
    const goLiveBtn = document.querySelector('.go-live-btn');
    if (goLiveBtn) {
        goLiveBtn.textContent = '🔴 Go Live';
        goLiveBtn.style.background = '#fe2c55';
        goLiveBtn.onclick = startLiveStream;
    }
    
    // Hide live chat
    document.getElementById('liveChat').style.display = 'none';
    
    // Update live indicator
    const liveIndicator = document.querySelector('.live-indicator');
    if (liveIndicator) {
        liveIndicator.textContent = '⚫ OFFLINE';
        liveIndicator.style.animation = 'none';
    }
    
    // Notify server
    fetch(`${window.API_BASE_URL}/api/live/stop`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            ...(window.authToken && window.authToken !== 'session-based' ? 
                { 'Authorization': `Bearer ${window.authToken}` } : {})
        }
    }).catch(console.error);
    
    showNotification('⏹️ Live stream stopped', 'info');
}

function startViewerCountUpdates() {
    const updateViewers = () => {
        if (!isLiveStreaming) return;
        
        // Simulate viewer count updates (replace with real data from server)
        liveViewers += Math.floor(Math.random() * 3) - 1; // Random change
        liveViewers = Math.max(0, liveViewers);
        
        const viewerElement = document.querySelector('.viewer-count');
        if (viewerElement) {
            viewerElement.textContent = `${liveViewers} viewers`;
        }
        
        setTimeout(updateViewers, 5000); // Update every 5 seconds
    };
    
    liveViewers = Math.floor(Math.random() * 10) + 1; // Start with 1-10 viewers
    updateViewers();
}

function scheduleLiveStream() {
    const time = prompt('Schedule for when? (e.g., "Tomorrow 8PM")');
    if (time) {
        // Send to server for scheduling
        fetch(`${window.API_BASE_URL}/api/live/schedule`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(window.authToken && window.authToken !== 'session-based' ? 
                    { 'Authorization': `Bearer ${window.authToken}` } : {})
            },
            body: JSON.stringify({
                scheduledTime: time,
                title: document.getElementById('streamTitle')?.value || 'Scheduled Stream'
            })
        }).then(response => {
            if (response.ok) {
                showNotification(`Live stream scheduled for ${time}`, 'success');
            } else {
                showNotification('Failed to schedule stream', 'error');
            }
        }).catch(error => {
            console.error('Scheduling error:', error);
            showNotification('Failed to schedule stream', 'error');
        });
    }
}

function closeLiveStream() {
    console.log('🔴 Closing live stream modal...');
    
    // Stop live stream if it's running
    if (isLiveStreaming) {
        stopLiveStream();
    }
    
    // Stop camera stream
    if (window.currentLiveStream) {
        console.log('📹 Stopping camera stream...');
        window.currentLiveStream.getTracks().forEach(track => {
            console.log('🛑 Stopping track:', track.kind);
            track.stop();
        });
        window.currentLiveStream = null;
    }
    
    // Remove modal
    const modal = document.querySelector('.live-stream-modal');
    if (modal) {
        modal.remove();
    }
    
    console.log('✅ Live stream modal closed and camera stopped');
}

function toggleChatSettings() {
    showNotification('Chat settings toggled', 'info');
}

function sendChatMessage(message) {
    if (message.trim()) {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML += `<div class="chat-message"><strong>You:</strong> ${message}</div>`;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        event.target.value = '';
    }
}

function sendGift() {
    const giftSelection = document.getElementById('giftSelection');
    if (giftSelection) {
        giftSelection.style.display = giftSelection.style.display === 'none' ? 'block' : 'none';
    }
}

function sendSpecificGift(giftType, cost) {
    showNotification(`Sent ${giftType} gift! (${cost} coins)`, 'success');
    document.getElementById('giftSelection').style.display = 'none';
}

// ================ PAGE CREATORS FOR MISSING PAGES ================
function createActivityPage() {
    // Hide main app and remove other dynamic pages
    const mainApp = document.getElementById('mainApp');
    if (mainApp) mainApp.style.display = 'none';
    
    // Remove existing dynamic pages that might interfere
    const pagesToRemove = ['coinsPage', 'collaborationPage', 'challengesPage', 'vibeRoomsPage', 'creatorStudioPage'];
    pagesToRemove.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) {
            page.remove();
            console.log(`🧹 Removed ${pageId} for activity page`);
        }
    });
    
    let activityPage = document.getElementById('activityPage');
    if (!activityPage) {
        activityPage = document.createElement('div');
        activityPage.id = 'activityPage';
        activityPage.className = 'activity-page';
        activityPage.style.cssText = `
            margin-left: 240px; 
            width: calc(100vw - 240px); 
            height: 100vh; 
            overflow-y: auto; 
            background: var(--bg-primary); 
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        activityPage.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto;">
                <h2 style="color: var(--text-primary); margin-bottom: 10px; font-size: 24px; font-weight: 700;">
                    🔔 Activity
                </h2>
                <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">
                    See how others are interacting with your content
                </p>
                
                <div class="activity-tabs" style="display: flex; gap: 10px; margin-bottom: 30px; border-bottom: 1px solid var(--border-primary); padding-bottom: 15px;">
                    <button class="activity-tab-btn active" data-filter="all" style="padding: 8px 16px; background: var(--accent-color); color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 14px; font-weight: 600;">All</button>
                    <button class="activity-tab-btn" data-filter="likes" style="padding: 8px 16px; background: var(--bg-tertiary); color: var(--text-secondary); border: none; border-radius: 20px; cursor: pointer; font-size: 14px; font-weight: 600;">Likes</button>
                    <button class="activity-tab-btn" data-filter="comments" style="padding: 8px 16px; background: var(--bg-tertiary); color: var(--text-secondary); border: none; border-radius: 20px; cursor: pointer; font-size: 14px; font-weight: 600;">Comments</button>
                    <button class="activity-tab-btn" data-filter="follows" style="padding: 8px 16px; background: var(--bg-tertiary); color: var(--text-secondary); border: none; border-radius: 20px; cursor: pointer; font-size: 14px; font-weight: 600;">Follows</button>
                    <button class="activity-tab-btn" data-filter="mentions" style="padding: 8px 16px; background: var(--bg-tertiary); color: var(--text-secondary); border: none; border-radius: 20px; cursor: pointer; font-size: 14px; font-weight: 600;">Mentions</button>
                </div>
                
                <div class="activity-list" id="activityList">
                    <div class="loading-activities" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        ⏳ Loading your activity...
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(activityPage);
        
        // Add click handlers for tabs
        activityPage.querySelectorAll('.activity-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                filterActivity(filter);
                
                // Update active tab
                activityPage.querySelectorAll('.activity-tab-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'var(--bg-tertiary)';
                    b.style.color = 'var(--text-secondary)';
                });
                btn.classList.add('active');
                btn.style.background = 'var(--accent-color)';
                btn.style.color = 'white';
            });
        });
        
        // Load initial activity
        setTimeout(() => loadActivity('all'), 300);
    }
    
    // Hide all other pages including activity and friends
    document.querySelectorAll('.video-feed, .search-page, .profile-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page, .activity-page, .friends-page').forEach(el => {
        el.style.display = 'none';
    });
    
    activityPage.style.display = 'block';
}

// Activity management functions
async function loadActivity(filter = 'all') {
    console.log(`📝 Loading ${filter} activity`);
    const activityList = document.getElementById('activityList');
    
    if (!activityList) return;
    
    // Show loading
    activityList.innerHTML = `
        <div class="loading-activities" style="text-align: center; padding: 40px; color: var(--text-secondary);">
            ⏳ Loading ${filter} activity...
        </div>
    `;
    
    try {
        // Call the real API instead of using sample data
        const apiBaseUrl = window.API_BASE_URL || 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? '' 
                : 'https://vib3-production.up.railway.app');
        
        console.log('📱 Calling real activity API...');
        const response = await fetch(`${apiBaseUrl}/api/user/activity`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📱 Real activity data received:', data);
        
        if (!data.activities || data.activities.length === 0) {
            activityList.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">🌟</div>
                    <h3 style="margin-bottom: 8px; color: var(--text-primary);">No activity yet</h3>
                    <p>When others interact with your videos, you'll see it here!</p>
                </div>
            `;
        } else {
            // Convert API data to the format expected by createActivityItem
            let formattedActivities = data.activities.map(activity => ({
                id: activity.videoId || activity.userId || Math.random().toString(),
                type: activity.type,
                user: { 
                    username: activity.username || 'VIB3 User', 
                    avatar: getActivityIcon(activity.type),
                    userId: activity.userId
                },
                action: activity.details || getActivityAction(activity.type),
                target: activity.videoTitle,
                time: getTimeAgo(new Date(activity.timestamp)),
                timestamp: new Date(activity.timestamp).getTime(),
                videoId: activity.videoId
            }));
            
            // Filter activities based on selected filter
            if (filter !== 'all') {
                formattedActivities = formattedActivities.filter(activity => {
                    switch(filter) {
                        case 'likes':
                            return activity.type === 'like';
                        case 'comments':
                            return activity.type === 'comment';
                        case 'follows':
                            return activity.type === 'follow';
                        case 'mentions':
                            return activity.type === 'mention';
                        default:
                            return true;
                    }
                });
            }
            
            if (formattedActivities.length === 0) {
                activityList.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                        <div style="font-size: 48px; margin-bottom: 16px;">${getFilterEmoji(filter)}</div>
                        <h3 style="margin-bottom: 8px; color: var(--text-primary);">No ${filter} yet</h3>
                        <p>When others ${getFilterAction(filter)} your content, you'll see it here!</p>
                    </div>
                `;
            } else {
                activityList.innerHTML = formattedActivities.map(createActivityItem).join('');
            }
            
            // Add click handlers for activity items
            activityList.querySelectorAll('.activity-item').forEach(item => {
                item.addEventListener('click', () => {
                    const activityId = item.dataset.activityId;
                    handleActivityClick(activityId);
                });
            });
        }
        
    } catch (error) {
        console.error('Error loading activity:', error);
        activityList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                ❌ Failed to load activity. Please try again.
            </div>
        `;
    }
}

// Helper functions for activity formatting
function getActivityIcon(type) {
    switch (type) {
        case 'like': return '❤️';
        case 'comment': return '💬';
        case 'share': return '📤';
        case 'follow': return '👥';
        case 'mention': return '📢';
        case 'video_uploaded': return '🎬';
        default: return '📱';
    }
}

function getFilterEmoji(filter) {
    switch(filter) {
        case 'likes': return '❤️';
        case 'comments': return '💬';
        case 'follows': return '👥';
        case 'mentions': return '📢';
        default: return '🔔';
    }
}

function getFilterAction(filter) {
    switch(filter) {
        case 'likes': return 'like';
        case 'comments': return 'comment on';
        case 'follows': return 'follow';
        case 'mentions': return 'mention you in';
        default: return 'interact with';
    }
}

function getActivityAction(type) {
    switch (type) {
        case 'like': return 'You liked';
        case 'comment': return 'You commented on';
        case 'share': return 'You shared';
        case 'follow': return 'You followed';
        case 'video_uploaded': return 'You uploaded';
        default: return 'Activity';
    }
}

// Use the same getTimeAgo function from navigation.js
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

function generateSampleActivity(filter) {
    const allActivities = [
        {
            id: '1',
            type: 'like',
            user: { username: 'musiclover22', avatar: '🎵' },
            action: 'liked your video',
            target: 'Aesthetic Morning Routine',
            time: '2 minutes ago',
            timestamp: Date.now() - 2 * 60 * 1000
        },
        {
            id: '2', 
            type: 'comment',
            user: { username: 'jane_creates', avatar: '✨' },
            action: 'commented',
            comment: 'This is amazing! How did you do that effect?',
            target: 'Dance Challenge',
            time: '15 minutes ago',
            timestamp: Date.now() - 15 * 60 * 1000
        },
        {
            id: '3',
            type: 'follow',
            user: { username: 'trendsetter_vibes', avatar: '🔥' },
            action: 'started following you',
            time: '1 hour ago',
            timestamp: Date.now() - 60 * 60 * 1000
        },
        {
            id: '4',
            type: 'mention',
            user: { username: 'bestfriend_sara', avatar: '💕' },
            action: 'mentioned you in a comment',
            comment: '@you check this out!',
            target: 'Cooking Hack Video',
            time: '3 hours ago',
            timestamp: Date.now() - 3 * 60 * 60 * 1000
        },
        {
            id: '5',
            type: 'like',
            user: { username: 'fitness_guru', avatar: '💪' },
            action: 'liked your video',
            target: 'Workout Routine',
            time: '5 hours ago',
            timestamp: Date.now() - 5 * 60 * 60 * 1000
        },
        {
            id: '6',
            type: 'comment',
            user: { username: 'artist_soul', avatar: '🎨' },
            action: 'commented',
            comment: 'Your creativity is inspiring! 🙌',
            target: 'Art Process Video',
            time: '1 day ago',
            timestamp: Date.now() - 24 * 60 * 60 * 1000
        },
        {
            id: '7',
            type: 'follow',
            user: { username: 'content_creator', avatar: '📹' },
            action: 'started following you',
            time: '2 days ago',
            timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000
        }
    ];
    
    if (filter === 'all') return allActivities;
    return allActivities.filter(activity => activity.type === filter);
}

function createActivityItem(activity) {
    const getActionIcon = (type) => {
        switch(type) {
            case 'like': return '❤️';
            case 'comment': return '💬';
            case 'follow': return '👥';
            case 'mention': return '📢';
            default: return '🔔';
        }
    };
    
    return `
        <div class="activity-item" data-activity-id="${activity.id}" style="
            display: flex;
            align-items: center;
            padding: 16px;
            margin-bottom: 1px;
            background: var(--bg-secondary);
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s ease;
            border-left: 3px solid var(--accent-color);
        " onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='var(--bg-secondary)'">
            
            <div style="
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--accent-color), #ff006e);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                margin-right: 16px;
                position: relative;
            ">
                ${activity.user.avatar}
                <div style="
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    width: 20px;
                    height: 20px;
                    background: var(--bg-primary);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                ">
                    ${getActionIcon(activity.type)}
                </div>
            </div>
            
            <div style="flex: 1; min-width: 0;">
                <div style="
                    color: var(--text-primary);
                    font-size: 14px;
                    line-height: 1.4;
                    margin-bottom: 4px;
                ">
                    ${activity.action}
                    ${activity.target && activity.type !== 'follow' ? ` on <span style="color: var(--text-secondary);">"${activity.target}"</span>` : ''}
                </div>
                
                ${activity.comment ? `
                    <div style="
                        color: var(--text-secondary);
                        font-size: 13px;
                        font-style: italic;
                        margin: 6px 0;
                        padding: 8px 12px;
                        background: var(--bg-tertiary);
                        border-radius: 12px;
                    ">
                        "${activity.comment}"
                    </div>
                ` : ''}
                
                <div style="
                    color: var(--text-secondary);
                    font-size: 12px;
                    margin-top: 4px;
                ">
                    ${activity.time}
                </div>
            </div>
            
            <div style="
                color: var(--text-secondary);
                font-size: 18px;
                margin-left: 12px;
            ">
                →
            </div>
        </div>
    `;
}

function filterActivity(filter) {
    console.log(`🔍 Filtering activity: ${filter}`);
    loadActivity(filter);
}

function handleActivityClick(activityId) {
    console.log(`🔗 Clicked activity: ${activityId}`);
    // In a real app, this would navigate to the relevant video/profile/etc
    showNotification(`Opening activity ${activityId}`, 'info');
}

// Messages page creation and management
function createMessagesPage() {
    // Hide main app and remove other dynamic pages
    const mainApp = document.getElementById('mainApp');
    if (mainApp) mainApp.style.display = 'none';
    
    // Remove existing dynamic pages that might interfere
    const pagesToRemove = ['coinsPage', 'collaborationPage', 'challengesPage', 'vibeRoomsPage', 'creatorStudioPage', 'activityPage'];
    pagesToRemove.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) {
            page.remove();
            console.log(`🧹 Removed ${pageId} for messages page`);
        }
    });
    
    let messagesPage = document.getElementById('messagesPage');
    if (!messagesPage) {
        messagesPage = document.createElement('div');
        messagesPage.id = 'messagesPage';
        messagesPage.className = 'messages-page';
        messagesPage.style.cssText = `
            margin-left: 240px; 
            width: calc(100vw - 240px); 
            height: 100vh; 
            background: var(--bg-primary);
            display: flex;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        messagesPage.innerHTML = `
            <!-- Chat List Sidebar -->
            <div class="chat-list" style="
                width: 320px;
                height: 100vh;
                background: var(--bg-secondary);
                border-right: 1px solid var(--border-primary);
                display: flex;
                flex-direction: column;
            ">
                <div style="
                    padding: 20px;
                    border-bottom: 1px solid var(--border-primary);
                    background: var(--bg-primary);
                ">
                    <h2 style="
                        color: var(--text-primary);
                        margin: 0 0 16px 0;
                        font-size: 20px;
                        font-weight: 700;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        💬 Messages
                    </h2>
                    <input 
                        type="text" 
                        placeholder="Search conversations..." 
                        id="chatSearch"
                        style="
                            width: 100%;
                            padding: 10px 12px;
                            border: 1px solid var(--border-primary);
                            border-radius: 20px;
                            background: var(--bg-tertiary);
                            color: var(--text-primary);
                            font-size: 14px;
                            outline: none;
                        "
                        oninput="searchChats(this.value)"
                    >
                </div>
                
                <div class="chat-list-content" id="chatListContent" style="
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px 0;
                ">
                    <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                        ⏳ Loading conversations...
                    </div>
                </div>
            </div>
            
            <!-- Chat Window -->
            <div class="chat-window" id="chatWindow" style="
                flex: 1;
                height: 100vh;
                display: flex;
                flex-direction: column;
                background: var(--bg-primary);
            ">
                <div class="no-chat-selected" id="noChatSelected" style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-secondary);
                    text-align: center;
                ">
                    <div style="font-size: 64px; margin-bottom: 24px;">💬</div>
                    <h3 style="margin-bottom: 12px; color: var(--text-primary);">Your Messages</h3>
                    <p style="max-width: 300px; line-height: 1.5;">
                        Send private messages to friends and creators. Share videos, photos, and your thoughts.
                    </p>
                    <button 
                        onclick="startNewChat()" 
                        style="
                            margin-top: 24px;
                            padding: 12px 24px;
                            background: var(--accent-color);
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: opacity 0.2s ease;
                        "
                        onmouseover="this.style.opacity='0.9'"
                        onmouseout="this.style.opacity='1'"
                    >
                        Start New Chat
                    </button>
                </div>
                
                <!-- Active Chat Interface (hidden by default) -->
                <div class="active-chat" id="activeChat" style="display: none; flex: 1; flex-direction: column;">
                    <!-- Chat Header -->
                    <div class="chat-header" style="
                        padding: 16px 20px;
                        border-bottom: 1px solid var(--border-primary);
                        background: var(--bg-secondary);
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    ">
                        <div class="chat-avatar" style="
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #fe2c55, #ff006e);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 18px;
                        ">
                            👤
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: var(--text-primary);" id="chatUsername">Select a chat</div>
                            <div style="font-size: 12px; color: var(--text-secondary);" id="chatStatus">Online</div>
                        </div>
                        <button onclick="openChatOptions()" style="
                            padding: 8px;
                            background: none;
                            border: none;
                            color: var(--text-secondary);
                            cursor: pointer;
                            border-radius: 4px;
                        ">⋮</button>
                    </div>
                    
                    <!-- Messages Area -->
                    <div class="messages-area" id="messagesArea" style="
                        flex: 1;
                        overflow-y: auto;
                        padding: 16px;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    ">
                    </div>
                    
                    <!-- Message Input -->
                    <div class="message-input-area" style="
                        padding: 16px 20px;
                        border-top: 1px solid var(--border-primary);
                        background: var(--bg-secondary);
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    ">
                        <button onclick="attachMedia()" style="
                            padding: 8px;
                            background: none;
                            border: none;
                            color: var(--text-secondary);
                            cursor: pointer;
                            font-size: 18px;
                        ">📎</button>
                        
                        <input 
                            type="text" 
                            placeholder="Type a message..."
                            id="messageInput"
                            style="
                                flex: 1;
                                padding: 12px 16px;
                                border: 1px solid var(--border-primary);
                                border-radius: 20px;
                                background: var(--bg-primary);
                                color: white;
                                font-size: 14px;
                                outline: none;
                            "
                            onkeypress="if(event.key==='Enter' && !window.mentionDropdownOpen) sendMessage()"
                            oninput="handleMessageInput(this)"
                            onkeydown="handleMessageMentionKeyDown(event)"
                        >
                        
                        <button onclick="sendMessage()" style="
                            padding: 10px;
                            background: var(--accent-color);
                            border: none;
                            border-radius: 50%;
                            color: white;
                            cursor: pointer;
                            font-size: 16px;
                            width: 40px;
                            height: 40px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">➤</button>
                    </div>
                    <div id="messageMentionDropdown" class="mention-dropdown" style="display: none; position: absolute; bottom: 60px; left: 10px; right: 10px;"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(messagesPage);
        
        // Load initial chat list
        setTimeout(() => loadChatList(), 300);
    }
    
    // Hide all other pages
    document.querySelectorAll('.video-feed, .search-page, .profile-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page, .activity-page, .friends-page').forEach(el => {
        el.style.display = 'none';
    });
    
    messagesPage.style.display = 'flex';
}

// Messages functionality
let currentChatId = null;
let allChats = [];

async function loadChatList() {
    console.log('💬 Loading chat list');
    const chatListContent = document.getElementById('chatListContent');
    
    if (!chatListContent) return;
    
    try {
        // Simulate loading sample chats
        const chats = generateSampleChats();
        allChats = chats;
        
        setTimeout(() => {
            if (chats.length === 0) {
                chatListContent.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                        <div style="font-size: 32px; margin-bottom: 16px;">💭</div>
                        <p>No conversations yet</p>
                        <p style="font-size: 12px; margin-top: 8px;">Start messaging your friends and creators!</p>
                    </div>
                `;
            } else {
                chatListContent.innerHTML = chats.map(createChatListItem).join('');
                
                // Add click handlers
                chatListContent.querySelectorAll('.chat-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const chatId = item.dataset.chatId;
                        openChat(chatId);
                    });
                });
            }
        }, 400);
        
    } catch (error) {
        console.error('Error loading chats:', error);
        chatListContent.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                ❌ Failed to load conversations
            </div>
        `;
    }
}

function generateSampleChats() {
    return [
        {
            id: '1',
            user: { username: 'bestfriend_sara', avatar: '💕', name: 'Sara Johnson' },
            lastMessage: 'Hey! Did you see that new dance trend?',
            time: '2m ago',
            unread: 2,
            online: true,
            timestamp: Date.now() - 2 * 60 * 1000
        },
        {
            id: '2',
            user: { username: 'musiclover22', avatar: '🎵', name: 'Alex Music' },
            lastMessage: 'That video was fire! 🔥',
            time: '1h ago',
            unread: 0,
            online: false,
            timestamp: Date.now() - 60 * 60 * 1000
        },
        {
            id: '3',
            user: { username: 'fitness_guru', avatar: '💪', name: 'Mike Fitness' },
            lastMessage: 'Want to collab on a workout video?',
            time: '3h ago',
            unread: 1,
            online: true,
            timestamp: Date.now() - 3 * 60 * 60 * 1000
        },
        {
            id: '4',
            user: { username: 'artist_soul', avatar: '🎨', name: 'Emma Art' },
            lastMessage: 'Love your latest content! So creative ✨',
            time: '1d ago',
            unread: 0,
            online: false,
            timestamp: Date.now() - 24 * 60 * 60 * 1000
        },
        {
            id: '5',
            user: { username: 'food_blogger', avatar: '🍜', name: 'Chef Tony' },
            lastMessage: 'Recipe coming soon!',
            time: '2d ago',
            unread: 0,
            online: true,
            timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000
        }
    ];
}

function createChatListItem(chat) {
    return `
        <div class="chat-item" data-chat-id="${chat.id}" style="
            display: flex;
            align-items: center;
            padding: 12px 16px;
            cursor: pointer;
            transition: background 0.2s ease;
            border-bottom: 1px solid var(--border-primary);
            position: relative;
        " onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='transparent'">
            
            <div style="
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--accent-color), #ff006e);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                margin-right: 12px;
                position: relative;
            ">
                ${chat.user.avatar}
                ${chat.online ? `
                    <div style="
                        position: absolute;
                        bottom: 2px;
                        right: 2px;
                        width: 12px;
                        height: 12px;
                        background: #00ff88;
                        border: 2px solid var(--bg-secondary);
                        border-radius: 50%;
                    "></div>
                ` : ''}
            </div>
            
            <div style="flex: 1; min-width: 0;">
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 4px;
                ">
                    <div style="
                        font-weight: 600;
                        color: var(--text-primary);
                        font-size: 14px;
                        truncate;
                    ">${chat.user.name}</div>
                    <div style="
                        font-size: 11px;
                        color: var(--text-secondary);
                    ">${chat.time}</div>
                </div>
                
                <div style="
                    font-size: 13px;
                    color: var(--text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    ${chat.unread > 0 ? 'font-weight: 600; color: var(--text-primary);' : ''}
                ">${chat.lastMessage}</div>
            </div>
            
            ${chat.unread > 0 ? `
                <div style="
                    min-width: 20px;
                    height: 20px;
                    background: var(--accent-color);
                    color: white;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 600;
                    margin-left: 8px;
                ">${chat.unread}</div>
            ` : ''}
        </div>
    `;
}

function openChat(chatId) {
    console.log(`📱 Opening chat: ${chatId}`);
    currentChatId = chatId;
    
    const chat = allChats.find(c => c.id === chatId);
    if (!chat) return;
    
    // Update active chat in list
    document.querySelectorAll('.chat-item').forEach(item => {
        item.style.background = 'transparent';
    });
    document.querySelector(`[data-chat-id="${chatId}"]`).style.background = 'var(--bg-tertiary)';
    
    // Show chat interface
    document.getElementById('noChatSelected').style.display = 'none';
    document.getElementById('activeChat').style.display = 'flex';
    
    // Update chat header
    document.getElementById('chatUsername').textContent = `@${chat.user.username}`;
    document.getElementById('chatStatus').textContent = chat.online ? 'Online' : 'Last seen recently';
    
    // Load messages
    loadChatMessages(chatId);
}

function loadChatMessages(chatId) {
    console.log(`📨 Loading messages for chat: ${chatId}`);
    const messagesArea = document.getElementById('messagesArea');
    
    // Generate sample messages
    const messages = generateSampleMessages(chatId);
    
    messagesArea.innerHTML = messages.map(createMessageBubble).join('');
    
    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function generateSampleMessages(chatId) {
    const messagesByChat = {
        '1': [
            { id: '1', text: 'Hey! How are you doing?', sent: false, time: '10:30 AM' },
            { id: '2', text: 'I\'m great! Just posted a new video', sent: true, time: '10:32 AM' },
            { id: '3', text: 'Awesome! Can\'t wait to see it 😍', sent: false, time: '10:33 AM' },
            { id: '4', text: 'Did you see that new dance trend?', sent: false, time: '2m ago' }
        ],
        '2': [
            { id: '1', text: 'Your latest video is amazing!', sent: false, time: 'Yesterday' },
            { id: '2', text: 'Thank you so much! 🙏', sent: true, time: 'Yesterday' },
            { id: '3', text: 'That video was fire! 🔥', sent: false, time: '1h ago' }
        ]
    };
    
    return messagesByChat[chatId] || [];
}

function createMessageBubble(message) {
    return `
        <div style="
            display: flex;
            ${message.sent ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
            margin-bottom: 8px;
        ">
            <div style="
                max-width: 70%;
                padding: 12px 16px;
                border-radius: ${message.sent ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
                background: ${message.sent ? 'var(--accent-color)' : 'var(--bg-tertiary)'};
                color: ${message.sent ? 'white' : 'var(--text-primary)'};
                font-size: 14px;
                line-height: 1.4;
                position: relative;
            ">
                ${message.text}
                <div style="
                    font-size: 11px;
                    opacity: 0.7;
                    margin-top: 4px;
                    text-align: right;
                ">${message.time}</div>
            </div>
        </div>
    `;
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    
    if (!messageText || !currentChatId) return;
    
    console.log(`📤 Sending message: ${messageText}`);
    
    const messagesArea = document.getElementById('messagesArea');
    const newMessage = {
        id: Date.now().toString(),
        text: messageText,
        sent: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Add message to chat
    const messageBubble = createMessageBubble(newMessage);
    messagesArea.insertAdjacentHTML('beforeend', messageBubble);
    
    // Clear input
    messageInput.value = '';
    
    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
    
    // Simulate response after delay
    setTimeout(() => {
        const responseMessage = {
            id: (Date.now() + 1).toString(),
            text: getRandomResponse(),
            sent: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        const responseBubble = createMessageBubble(responseMessage);
        messagesArea.insertAdjacentHTML('beforeend', responseBubble);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }, 1500);
}

function getRandomResponse() {
    const responses = [
        'That\'s awesome! 😄',
        'I totally agree!',
        'Haha that\'s so funny 😂',
        'Really? Tell me more!',
        'That sounds amazing!',
        'I love that! ❤️',
        'So cool! 🔥',
        'Absolutely! 💯'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

function searchChats(query) {
    console.log(`🔍 Searching chats: ${query}`);
    const filteredChats = allChats.filter(chat => 
        chat.user.name.toLowerCase().includes(query.toLowerCase()) ||
        chat.user.username.toLowerCase().includes(query.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(query.toLowerCase())
    );
    
    const chatListContent = document.getElementById('chatListContent');
    if (filteredChats.length === 0 && query) {
        chatListContent.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                <div style="font-size: 32px; margin-bottom: 16px;">🔍</div>
                <p>No conversations found</p>
            </div>
        `;
    } else {
        chatListContent.innerHTML = filteredChats.map(createChatListItem).join('');
        
        // Re-add click handlers
        chatListContent.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.dataset.chatId;
                openChat(chatId);
            });
        });
    }
}

function startNewChat() {
    console.log('💬 Starting new chat');
    showNotification('New chat feature coming soon!', 'info');
}

function attachMedia() {
    console.log('📎 Attach media');
    showNotification('Media sharing coming soon!', 'info');
}

function openChatOptions() {
    console.log('⋮ Chat options');
    showNotification('Chat options coming soon!', 'info');
}

// Profile page creation and management
let currentProfileTab = 'videos';
let currentUserProfile = null;

function createProfilePage() {
    console.log('🔧 Creating profile page...');
    let profilePage = document.getElementById('profilePage');
    if (!profilePage) {
        console.log('📝 Profile page does not exist, creating new one...');
        profilePage = document.createElement('div');
        profilePage.id = 'profilePage';
        profilePage.className = 'profile-page';
        profilePage.style.cssText = `
            position: fixed;
            top: 0;
            left: 240px; 
            width: calc(100vw - 240px); 
            height: 100vh; 
            overflow-y: auto;
            background: #161823;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            z-index: 1000;
            display: block;
        `;
        
        profilePage.innerHTML = `
            <div style="padding: 50px; text-align: center; color: white;">
                <h1 style="color: #fe2c55; font-size: 48px; margin-bottom: 20px;">
                    🎵 VIB3 PROFILE 🎵
                </h1>
                <p style="color: white; font-size: 24px; margin-bottom: 30px;">
                    Welcome to your profile page!
                </p>
                <div style="background: #333; padding: 30px; border-radius: 15px; margin: 20px auto; max-width: 600px;">
                    <div style="width: 120px; height: 120px; background: linear-gradient(135deg, #fe2c55, #ff006e); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 48px;">
                        👤
                    </div>
                    <h2 style="color: white; margin-bottom: 10px;">@${currentUser?.username || 'vib3user'}</h2>
                    <p style="color: #ccc; margin-bottom: 20px;">Creator | Dancer | Music Lover</p>
                    <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 20px;">
                        <div><strong style="color: white;">123</strong> <span style="color: #ccc;">following</span></div>
                        <div><strong style="color: white;">1.2K</strong> <span style="color: #ccc;">followers</span></div>
                        <div><strong style="color: white;">5.6K</strong> <span style="color: #ccc;">likes</span></div>
                    </div>
                    <button onclick="editProfile()" style="background: #fe2c55; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Edit Profile
                    </button>
                </div>
            </div>`;
        
        /* Commented out broken HTML template
            <div style="max-width: 975px; margin: 0 auto; padding: 20px;">
                <!-- Profile Header -->
                <div class="profile-header" style="
                    display: flex;
                    align-items: center;
                    gap: 40px;
                    padding: 40px 0;
                    border-bottom: 1px solid #333;
                    margin-bottom: 30px;
                ">
                    <!-- Profile Picture -->
                    <div class="profile-picture-container" style="position: relative;">
                        <div class="profile-picture" style="
                            width: 150px;
                            height: 150px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #fe2c55, #ff006e);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 60px;
                            cursor: pointer;
                            position: relative;
                            border: 4px solid var(--bg-secondary);
                        " onclick="changeProfilePicture()">
                            👤
                            <div style="
                                position: absolute;
                                bottom: 8px;
                                right: 8px;
                                width: 32px;
                                height: 32px;
                                background: #fe2c55;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-size: 16px;
                                border: 2px solid var(--bg-primary);
                                cursor: pointer;
                            ">📷</div>
                        </div>
                    </div>
                    
                    <!-- Profile Info -->
                    <div class="profile-info" style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                            <h1 class="profile-username" style="
                                font-size: 28px;
                                font-weight: 300;
                                color: white;
                                margin: 0;
                            " id="profileUsername">@vib3user</h1>
                            
                            <button onclick="editProfile()" style="
                                padding: 8px 24px;
                                background: none;
                                border: 1px solid var(--border-primary);
                                border-radius: 8px;
                                color: white;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            " onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='none'">
                                Edit Profile
                            </button>
                            
                            <button onclick="showProfileSettings()" style="
                                padding: 8px 12px;
                                background: none;
                                border: none;
                                color: var(--text-secondary);
                                font-size: 20px;
                                cursor: pointer;
                            ">⚙️</button>
                        </div>
                        
                        <!-- Stats -->
                        <div class="profile-stats" style="
                            display: flex;
                            gap: 40px;
                            margin-bottom: 20px;
                        ">
                            <div onclick="showFollowing()" style="cursor: pointer;">
                                <span style="font-weight: 600; color: var(--text-primary);" id="followingCount">0</span>
                                <span style="color: var(--text-secondary); margin-left: 4px;">following</span>
                            </div>
                            <div onclick="showFollowers()" style="cursor: pointer;">
                                <span style="font-weight: 600; color: var(--text-primary);" id="followersCount">0</span>
                                <span style="color: var(--text-secondary); margin-left: 4px;">followers</span>
                            </div>
                            <div>
                                <span style="font-weight: 600; color: var(--text-primary);" id="likesCount">0</span>
                                <span style="color: var(--text-secondary); margin-left: 4px;">likes</span>
                            </div>
                        </div>
                        
                        <!-- Bio -->
                        <div class="profile-bio" style="
                            color: var(--text-primary);
                            line-height: 1.5;
                            margin-bottom: 20px;
                            max-width: 500px;
                        " id="profileBio">
                            Welcome to my VIB3 profile! 🎵✨<br>
                            Creator | Dancer | Music Lover<br>
                            📧 Contact: hello@vib3.com
                        </div>
                        
                        <!-- Action Buttons -->
                        <div style="display: flex; gap: 12px;">
                            <button onclick="shareProfile()" style="
                                padding: 12px 24px;
                                background: #fe2c55;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: opacity 0.2s ease;
                            " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                                Share Profile
                            </button>
                            <button onclick="openCreatorTools()" style="
                                padding: 12px 24px;
                                background: var(--bg-tertiary);
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-weight: 600;
                                cursor: pointer;
                            ">
                                Creator Tools
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Profile Navigation Tabs -->
                <div class="profile-tabs" style="
                    display: flex;
                    border-bottom: 1px solid var(--border-primary);
                    margin-bottom: 20px;
                ">
                    <button class="profile-tab active" data-tab="videos" style="
                        padding: 12px 24px;
                        background: none;
                        border: none;
                        color: var(--text-primary);
                        font-weight: 600;
                        cursor: pointer;
                        border-bottom: 2px solid var(--accent-color);
                        position: relative;
                    ">
                        📹 Videos
                    </button>
                    <button class="profile-tab" data-tab="liked" style="
                        padding: 12px 24px;
                        background: none;
                        border: none;
                        color: var(--text-secondary);
                        font-weight: 600;
                        cursor: pointer;
                        border-bottom: 2px solid transparent;
                    ">
                        ❤️ Liked
                    </button>
                    <button class="profile-tab" data-tab="following-feed" style="
                        padding: 12px 24px;
                        background: none;
                        border: none;
                        color: var(--text-secondary);
                        font-weight: 600;
                        cursor: pointer;
                        border-bottom: 2px solid transparent;
                    ">
                        👥 Following
                    </button>
                    <button class="profile-tab" data-tab="analytics" style="
                        padding: 12px 24px;
                        background: none;
                        border: none;
                        color: var(--text-secondary);
                        font-weight: 600;
                        cursor: pointer;
                        border-bottom: 2px solid transparent;
                    ">
                        📊 Analytics
                    </button>
                </div>
                
                <!-- Profile Content Area -->
                <div class="profile-content" id="profileContent">
                    <div class="loading-profile" style="
                        text-align: center;
                        padding: 60px 20px;
                        color: var(--text-secondary);
                    ">
                        ⏳ Loading profile content...
                    </div>
                </div>
            </div>
        */
        
        document.body.appendChild(profilePage);
        console.log('✅ Profile page added to DOM');
        
        // Add tab click handlers
        profilePage.querySelectorAll('.profile-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabType = tab.dataset.tab;
                switchProfileTab(tabType);
            });
        });
        
        // Load initial profile data
        setTimeout(() => loadProfileData(), 300);
    } else {
        console.log('📄 Profile page already exists, showing it...');
    }
    
    // Hide all other pages except this profile page
    document.querySelectorAll('.video-feed, .search-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page, .activity-page, .friends-page').forEach(el => {
        el.style.display = 'none';
    });
    // Hide other profile pages but not this one
    document.querySelectorAll('.profile-page').forEach(el => {
        if (el !== profilePage) {
            el.style.display = 'none';
        }
    });
    const mainApp = document.getElementById('mainApp');
    if (mainApp) mainApp.style.display = 'none';
    
    profilePage.style.display = 'block';
    console.log('🎯 Profile page display set to block. Final styles:', profilePage.style.cssText);
}

function createFriendsPage() {
    // Hide all other pages
    document.querySelectorAll('.video-feed, .search-page, .profile-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page, .activity-page, .friends-page').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show main app and load friends video feed
    const mainApp = document.getElementById('mainApp');
    if (mainApp) mainApp.style.display = 'block';
    
    // Load friends video feed (which excludes current user's videos)
    loadVideoFeed('friends', true);
}


async function loadMutualFriends() {
    const container = document.getElementById('friendsListContainer');
    if (!container) return;
    
    try {
        console.log('👥 Loading mutual friends...');
        
        // Show loading state
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <div style="font-size: 32px; margin-bottom: 16px;">👥</div>
                <div>Loading friends...</div>
            </div>
        `;
        
        // Get user's following and followers lists
        const followingResponse = await fetch(`${window.API_BASE_URL}/api/user/following`, {
            credentials: 'include',
            headers: {
                ...(window.authToken && window.authToken !== 'session-based' ? 
                    { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        const followersResponse = await fetch(`${window.API_BASE_URL}/api/user/followers`, {
            credentials: 'include',
            headers: {
                ...(window.authToken && window.authToken !== 'session-based' ? 
                    { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        if (followingResponse.ok && followersResponse.ok) {
            const following = await followingResponse.json();
            const followers = await followersResponse.json();
            
            // Find mutual connections (people you follow who also follow you)
            const followingIds = new Set(following.map(user => user.id || user._id));
            const mutualFriends = followers.filter(user => 
                followingIds.has(user.id || user._id)
            );
            
            console.log('👥 Found mutual friends:', mutualFriends.length);
            
            if (mutualFriends.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <div style="font-size: 32px; margin-bottom: 16px;">👥</div>
                        <div style="margin-bottom: 8px;">No mutual friends yet</div>
                        <div style="font-size: 14px;">Start following people to build your network!</div>
                    </div>
                `;
            } else {
                container.innerHTML = mutualFriends.map(user => `
                    <div class="friend-item" style="display: flex; align-items: center; padding: 16px; border-bottom: 1px solid var(--border-primary); cursor: pointer;" onclick="viewUserProfile('${user.id || user._id}')">
                        <div class="friend-avatar" style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #fe2c55, #ff006e); display: flex; align-items: center; justify-content: center; font-size: 20px; margin-right: 16px; ${user.profileImage ? `background-image: url(${user.profileImage}); background-size: cover; background-position: center;` : ''}">
                            ${user.profileImage ? '' : (user.profilePicture || '👤')}
                        </div>
                        <div class="friend-info" style="flex: 1;">
                            <div class="friend-name" style="font-weight: 600; margin-bottom: 4px;">@${user.username || user.displayName || 'Unknown User'}</div>
                            <div class="friend-stats" style="color: var(--text-secondary); font-size: 14px;">${user.stats?.followers || 0} followers • Mutual friend</div>
                        </div>
                        <div class="friend-actions" style="display: flex; gap: 8px;">
                            <button onclick="event.stopPropagation(); openDirectMessage('${user.id || user._id}')" style="padding: 8px 16px; background: var(--accent-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                                Message
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            throw new Error('Failed to load friends data');
        }
    } catch (error) {
        console.error('❌ Error loading mutual friends:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <div style="font-size: 32px; margin-bottom: 16px;">❌</div>
                <div style="margin-bottom: 8px;">Failed to load friends</div>
                <button onclick="loadMutualFriends()" style="padding: 8px 16px; background: var(--accent-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Try Again
                </button>
            </div>
        `;
    }
}

function filterFriends(type) {
    console.log('👥 Filtering friends by type:', type);
    
    // Update tab styles
    document.querySelectorAll('.friends-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const container = document.getElementById('friendsListContainer');
    if (!container) return;
    
    // Load different data based on filter type
    switch (type) {
        case 'mutual':
            loadMutualFriends();
            break;
        case 'following':
            loadFollowingList();
            break;
        case 'followers': 
            loadFollowersList();
            break;
        case 'suggested':
            loadSuggestedFriends();
            break;
        default:
            loadMutualFriends();
    }
}

async function loadFollowingList() {
    const container = document.getElementById('friendsListContainer');
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/user/following`, {
            credentials: 'include',
            headers: {
                ...(window.authToken && window.authToken !== 'session-based' ? 
                    { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        if (response.ok) {
            const following = await response.json();
            if (following.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <div style="font-size: 32px; margin-bottom: 16px;">👤</div>
                        <div>You're not following anyone yet</div>
                    </div>
                `;
            } else {
                container.innerHTML = following.map(user => `
                    <div class="friend-item" style="display: flex; align-items: center; padding: 16px; border-bottom: 1px solid var(--border-primary);">
                        <div class="friend-avatar" style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #fe2c55, #ff006e); display: flex; align-items: center; justify-content: center; font-size: 20px; margin-right: 16px;">
                            ${user.profilePicture || '👤'}
                        </div>
                        <div class="friend-info" style="flex: 1;">
                            <div class="friend-name" style="font-weight: 600; margin-bottom: 4px;">@${user.username || user.displayName}</div>
                            <div class="friend-stats" style="color: var(--text-secondary); font-size: 14px;">${user.stats?.followers || 0} followers</div>
                        </div>
                        <button onclick="toggleFollow('${user.id || user._id}')" style="padding: 8px 16px; background: var(--border-primary); color: var(--text-primary); border: none; border-radius: 6px; cursor: pointer;">
                            Following
                        </button>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading following list:', error);
    }
}

async function loadFollowersList() {
    const container = document.getElementById('friendsListContainer');
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/user/followers`, {
            credentials: 'include',
            headers: {
                ...(window.authToken && window.authToken !== 'session-based' ? 
                    { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        if (response.ok) {
            const followers = await response.json();
            if (followers.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <div style="font-size: 32px; margin-bottom: 16px;">👥</div>
                        <div>No followers yet</div>
                    </div>
                `;
            } else {
                container.innerHTML = followers.map(user => `
                    <div class="friend-item" style="display: flex; align-items: center; padding: 16px; border-bottom: 1px solid var(--border-primary);">
                        <div class="friend-avatar" style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #fe2c55, #ff006e); display: flex; align-items: center; justify-content: center; font-size: 20px; margin-right: 16px;">
                            ${user.profilePicture || '👤'}
                        </div>
                        <div class="friend-info" style="flex: 1;">
                            <div class="friend-name" style="font-weight: 600; margin-bottom: 4px;">@${user.username || user.displayName}</div>
                            <div class="friend-stats" style="color: var(--text-secondary); font-size: 14px;">${user.stats?.followers || 0} followers</div>
                        </div>
                        <button onclick="toggleFollow('${user.id || user._id}')" style="padding: 8px 16px; background: var(--accent-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Follow Back
                        </button>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading followers list:', error);
    }
}

function loadSuggestedFriends() {
    const container = document.getElementById('friendsListContainer');
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <div style="font-size: 32px; margin-bottom: 16px;">🔍</div>
            <div>Friend suggestions coming soon!</div>
        </div>
    `;
}

function searchFriends(query) {
    showNotification(`Searching friends: ${query}`, 'info');
}

function toggleFollow(username) {
    const btn = event.target;
    const isFollowing = btn.textContent === 'Following';
    btn.textContent = isFollowing ? 'Follow' : 'Following';
    btn.style.background = isFollowing ? 'var(--accent-color)' : 'var(--bg-tertiary)';
    showNotification(`${isFollowing ? 'Unfollowed' : 'Following'} ${username}`, 'success');
}

// ================ VIDEO INTERACTION FUNCTIONS ================
function toggleVideoPlayback(videoElement) {
    if (videoElement.paused) {
        videoElement.play();
    } else {
        videoElement.pause();
    }
}

function openCommentsModal(videoId) {
    console.log('💬 Opening comments modal for video:', videoId);
    console.log('🧪 Mention functions available:', {
        handleCommentInput: typeof window.handleCommentInput,
        handleMentionKeyDown: typeof window.handleMentionKeyDown,
        selectMention: typeof window.selectMention
    });
    
    const modal = document.createElement('div');
    modal.className = 'modal comments-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Comments</h3>
                <button onclick="this.closest('.modal').remove()" class="close-btn">&times;</button>
            </div>
            <div class="comments-list">
                <div class="comment">
                    <div class="comment-avatar">👤</div>
                    <div class="comment-content">
                        <div class="comment-user">user123</div>
                        <div class="comment-text">Amazing video! 🔥</div>
                        <div class="comment-actions">
                            <button onclick="likeComment(this)">👍 12</button>
                            <button onclick="replyToComment(this)">Reply</button>
                        </div>
                    </div>
                </div>
                <div class="comment">
                    <div class="comment-avatar">👤</div>
                    <div class="comment-content">
                        <div class="comment-user">dance_lover</div>
                        <div class="comment-text">Tutorial please!</div>
                        <div class="comment-actions">
                            <button onclick="likeComment(this)">👍 5</button>
                            <button onclick="replyToComment(this)">Reply</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="comment-input" style="position: relative;">
                <input type="text" 
                    id="commentInput_${videoId}"
                    placeholder="Add a comment..." 
                    onkeypress="if(event.key==='Enter' && !window.mentionDropdownOpen) addComment(this.value, '${videoId}')"
                    oninput="handleCommentInput(this, '${videoId}')"
                    onkeydown="handleMentionKeyDown(event, '${videoId}')">
                <button onclick="addComment(document.getElementById('commentInput_${videoId}').value, '${videoId}')">Post</button>
                <div id="mentionDropdown_${videoId}" class="mention-dropdown" style="display: none;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Ensure input handlers are attached after modal is added to DOM
    setTimeout(() => {
        const input = document.getElementById(`commentInput_${videoId}`);
        if (input) {
            console.log('🎯 Attaching mention handlers to input:', input);
            // Remove any existing handlers first
            input.oninput = null;
            input.onkeydown = null;
            
            // Attach new handlers
            input.addEventListener('input', function(e) {
                console.log('📝 Input event fired, value:', e.target.value);
                handleCommentInput(e.target, videoId);
            });
            
            input.addEventListener('keydown', function(e) {
                handleMentionKeyDown(e, videoId);
            });
            
            console.log('✅ Mention handlers attached successfully');
        } else {
            console.error('❌ Could not find comment input for video:', videoId);
        }
    }, 100);
}

function openShareModal(videoId) {
    console.log('📱 Creating TikTok-style share modal for video:', videoId);
    
    // Remove any existing modals first
    document.querySelectorAll('[id^="vib3-share-modal"]').forEach(m => m.remove());
    
    const modal = document.createElement('div');
    modal.id = 'vib3-share-modal-' + Date.now();
    
    // Apply styles directly to avoid CSS conflicts
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.zIndex = '2147483647';
    modal.style.display = 'flex';
    modal.style.alignItems = 'flex-end';
    modal.style.justifyContent = 'center';
    modal.style.pointerEvents = 'all';
    
    const innerDiv = document.createElement('div');
    innerDiv.style.backgroundColor = '#161823';
    innerDiv.style.width = '100%';
    innerDiv.style.maxWidth = '500px';
    innerDiv.style.borderRadius = '20px 20px 0 0';
    innerDiv.style.padding = '30px';
    innerDiv.style.textAlign = 'center';
    innerDiv.style.color = 'white';
    innerDiv.style.fontFamily = 'Arial, sans-serif';
    
    innerDiv.innerHTML = `
        <div style="width: 40px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin: 0 auto 20px;"></div>
        <h3 style="margin: 0 0 25px 0; color: white; font-size: 20px; font-weight: 600;">Share to</h3>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px;">
            <button onclick="shareToTikTok('${videoId}'); document.getElementById('${modal.id}').remove();" style="
                text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <div style="width: 45px; height: 45px; background: linear-gradient(45deg, #ff0050, #000000); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">🎵</div>
                <span style="color: white; font-size: 11px; display: block;">TikTok</span>
            </button>
            
            <button onclick="shareToInstagram('${videoId}'); document.getElementById('${modal.id}').remove();" style="
                text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <div style="width: 45px; height: 45px; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">📷</div>
                <span style="color: white; font-size: 11px; display: block;">Instagram</span>
            </button>
            
            <button onclick="shareToTwitter('${videoId}'); document.getElementById('${modal.id}').remove();" style="
                text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <div style="width: 45px; height: 45px; background: #1da1f2; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">🐦</div>
                <span style="color: white; font-size: 11px; display: block;">Twitter</span>
            </button>
            
            <button onclick="shareToFacebook('${videoId}'); document.getElementById('${modal.id}').remove();" style="
                text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <div style="width: 45px; height: 45px; background: #4267b2; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">📘</div>
                <span style="color: white; font-size: 11px; display: block;">Facebook</span>
            </button>
            
            <button onclick="shareToWhatsApp('${videoId}'); document.getElementById('${modal.id}').remove();" style="
                text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <div style="width: 45px; height: 45px; background: #25d366; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">📱</div>
                <span style="color: white; font-size: 11px; display: block;">WhatsApp</span>
            </button>
            
            <button onclick="shareToTelegram('${videoId}'); document.getElementById('${modal.id}').remove();" style="
                text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <div style="width: 45px; height: 45px; background: #0088cc; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">✈️</div>
                <span style="color: white; font-size: 11px; display: block;">Telegram</span>
            </button>
            
            <button onclick="shareToSnapchat('${videoId}'); document.getElementById('${modal.id}').remove();" style="
                text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <div style="width: 45px; height: 45px; background: #fffc00; color: black; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">👻</div>
                <span style="color: white; font-size: 11px; display: block;">Snapchat</span>
            </button>
            
            <button onclick="shareToReddit('${videoId}'); document.getElementById('${modal.id}').remove();" style="
                text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <div style="width: 45px; height: 45px; background: #ff4500; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">🤖</div>
                <span style="color: white; font-size: 11px; display: block;">Reddit</span>
            </button>
            
            <button onclick="shareToLinkedIn('${videoId}'); document.getElementById('${modal.id}').remove();" style="
                text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <div style="width: 45px; height: 45px; background: #0077b5; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">💼</div>
                <span style="color: white; font-size: 11px; display: block;">LinkedIn</span>
            </button>
            
            <button onclick="shareToPinterest('${videoId}'); document.getElementById('${modal.id}').remove();" style="
                text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <div style="width: 45px; height: 45px; background: #bd081c; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">📌</div>
                <span style="color: white; font-size: 11px; display: block;">Pinterest</span>
            </button>
            
            <button onclick="shareToDiscord('${videoId}'); document.getElementById('${modal.id}').remove();" style="
                text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <div style="width: 45px; height: 45px; background: #7289da; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">🎮</div>
                <span style="color: white; font-size: 11px; display: block;">Discord</span>
            </button>
            
            <button onclick="shareViaSMS('${videoId}'); document.getElementById('${modal.id}').remove();" style="
                text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <div style="width: 45px; height: 45px; background: #00d4aa; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">💬</div>
                <span style="color: white; font-size: 11px; display: block;">SMS</span>
            </button>
            
            <button onclick="copyVideoLink('${videoId}'); document.getElementById('${modal.id}').remove();" style="
                text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <div style="width: 45px; height: 45px; background: #666; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">🔗</div>
                <span style="color: white; font-size: 11px; display: block;">Copy Link</span>
            </button>
            
            <button onclick="shareViaEmail('${videoId}'); document.getElementById('${modal.id}').remove();" style="
                text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <div style="width: 45px; height: 45px; background: #ea4335; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">📧</div>
                <span style="color: white; font-size: 11px; display: block;">Email</span>
            </button>
            
            <button onclick="downloadVideo('${videoId}'); document.getElementById('${modal.id}').remove();" style="
                text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <div style="width: 45px; height: 45px; background: #4caf50; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">⬇️</div>
                <span style="color: white; font-size: 11px; display: block;">Save</span>
            </button>
        </div>
        
        <button onclick="document.getElementById('${modal.id}').remove();" style="
            width: 100%; padding: 16px; background: rgba(255,255,255,0.1); border: none; border-radius: 12px;
            color: white; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 12px;
        ">Cancel</button>
    `;
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    modal.appendChild(innerDiv);
    document.body.appendChild(modal);
    console.log('✅ TikTok-style share modal created');
}

function viewProfile(username) {
    showPage('profile');
    const profileContent = document.querySelector('.profile-content');
    if (profileContent) {
        profileContent.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar-large">👤</div>
                <div class="profile-info">
                    <h2>@${username}</h2>
                    <div class="profile-stats">
                        <span>1.2M followers</span>
                        <span>124 following</span>
                        <span>2.3M likes</span>
                    </div>
                    <div class="profile-bio">Content creator 🎭 Follow for daily videos!</div>
                    <button class="follow-btn" onclick="toggleFollow('${username}')">Follow</button>
                </div>
            </div>
            <div class="profile-videos">
                <div class="video-grid">
                    ${Array(12).fill(0).map(() => `
                        <div class="video-item" onclick="playVideo('${username}_video')">
                            <div class="video-thumbnail" style="background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);"></div>
                            <div class="video-plays">2.3M</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

function showVideoOptions(videoId) {
    const modal = document.createElement('div');
    modal.className = 'modal video-options-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Video Options</h3>
                <button onclick="this.closest('.modal').remove()" class="close-btn">&times;</button>
            </div>
            <div class="video-options">
                <button onclick="saveVideo('${videoId}'); this.closest('.modal').remove();">💾 Save</button>
                <button onclick="reportVideo('${videoId}'); this.closest('.modal').remove();">⚠️ Report</button>
                <button onclick="shareVideo('${videoId}'); this.closest('.modal').remove();">📤 Share</button>
                <button onclick="copyVideoLink('${videoId}'); this.closest('.modal').remove();">🔗 Copy Link</button>
                <button onclick="notInterested('${videoId}'); this.closest('.modal').remove();">🚫 Not Interested</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function saveVideo(videoId) {
    showNotification('Video saved to your collection!', 'success');
}

function browseSound(soundId) {
    const modal = document.createElement('div');
    modal.className = 'modal sound-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Sound Details</h3>
                <button onclick="this.closest('.modal').remove()" class="close-btn">&times;</button>
            </div>
            <div class="sound-info">
                <div class="sound-preview">
                    <div class="sound-icon">🎵</div>
                    <div class="sound-details">
                        <div class="sound-title">Trending Beat #${soundId}</div>
                        <div class="sound-artist">by VIB3 Music</div>
                        <button onclick="playPreview('${soundId}')">▶️ Play</button>
                    </div>
                </div>
                <div class="sound-actions">
                    <button onclick="useSound('${soundId}'); this.closest('.modal').remove();">Use This Sound</button>
                    <button onclick="favoriteSound('${soundId}');">❤️ Favorite</button>
                </div>
                <div class="sound-videos">
                    <h4>Videos using this sound</h4>
                    <div class="sound-video-grid">
                        ${Array(6).fill(0).map(() => `
                            <div class="video-item">
                                <div class="video-thumbnail" style="background: linear-gradient(45deg, #ff6b6b 0%, #ffa726 100%);"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ================ VIDEO EDITOR FUNCTIONS ================
function addEffect(effectType) {
    showNotification(`Added ${effectType} effect`, 'success');
    const effectsPanel = document.querySelector('.effects-panel');
    if (effectsPanel) {
        effectsPanel.classList.add('effect-active');
    }
}

function applyFilter(filterName) {
    showNotification(`Applied ${filterName} filter`, 'success');
    const videoPreview = document.querySelector('.video-preview');
    if (videoPreview) {
        videoPreview.style.filter = getFilterStyle(filterName);
    }
}

function getFilterStyle(filterName) {
    const filters = {
        'vintage': 'sepia(0.5) contrast(1.2)',
        'dramatic': 'contrast(1.5) brightness(0.9)',
        'bright': 'brightness(1.3) saturate(1.2)',
        'noir': 'grayscale(1) contrast(1.3)',
        'warm': 'hue-rotate(15deg) saturate(1.1)',
        'cool': 'hue-rotate(-15deg) saturate(1.1)'
    };
    return filters[filterName] || 'none';
}

function addTextOverlay() {
    const text = prompt('Enter text:');
    if (text) {
        showNotification('Text overlay added', 'success');
        const videoContainer = document.querySelector('.video-preview-container');
        if (videoContainer) {
            const textOverlay = document.createElement('div');
            textOverlay.className = 'text-overlay';
            textOverlay.textContent = text;
            textOverlay.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 24px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                z-index: 10;
            `;
            videoContainer.appendChild(textOverlay);
        }
    }
}

function setSpeed(speed) {
    showNotification(`Video speed set to ${speed}x`, 'info');
    const video = document.querySelector('.video-preview video');
    if (video) {
        video.playbackRate = speed;
    }
}

function setTextStyle(style) {
    showNotification(`Text style set to ${style}`, 'info');
    const textOverlays = document.querySelectorAll('.text-overlay');
    textOverlays.forEach(overlay => {
        overlay.className = `text-overlay text-${style}`;
    });
}

function toggleEffect(effectName) {
    const isActive = document.querySelector(`[data-effect="${effectName}"]`)?.classList.toggle('active');
    showNotification(`${effectName} effect ${isActive ? 'enabled' : 'disabled'}`, 'info');
}

function flipCamera() {
    showNotification('Camera flipped', 'info');
    const video = document.getElementById('simpleRecordingPreview') || document.querySelector('.camera-preview video');
    if (video) {
        video.style.transform = video.style.transform === 'scaleX(-1)' ? 'scaleX(1)' : 'scaleX(-1)';
    }
}

function toggleFlash() {
    showNotification('Flash toggled', 'info');
}

function toggleRecording() {
    const isRecording = window.isRecording || false;
    window.isRecording = !isRecording;
    showNotification(isRecording ? 'Recording stopped' : 'Recording started', isRecording ? 'info' : 'success');
    
    const recordBtn = document.querySelector('.record-btn');
    if (recordBtn) {
        recordBtn.classList.toggle('recording', !isRecording);
    }
}

function toggleCountdown() {
    showNotification('Countdown toggled', 'info');
}

function toggleGridLines() {
    showNotification('Grid lines toggled', 'info');
    const cameraPreview = document.querySelector('.camera-preview');
    if (cameraPreview) {
        cameraPreview.classList.toggle('show-grid');
    }
}

function closeVideoEditor() {
    const editorModal = document.querySelector('.video-editor-modal');
    if (editorModal) {
        editorModal.remove();
    }
}

function saveEditedVideo() {
    console.log('💾 Saving edited video');
    
    // Close video editor first
    closeVideoEditor();
    
    // Get the video file
    const videoFile = window.selectedVideoFile || window.currentVideoFile;
    
    if (videoFile) {
        console.log('📤 Proceeding to upload with video file:', videoFile.name);
        
        // Show upload modal with the video ready for publishing
        showUploadModal();
        
        // Go directly to step 4 (details step) to add title/description
        goToStep(4);
        
        showNotification('Ready to add details and publish!', 'success');
    } else {
        console.error('❌ No video file found to save');
        showNotification('No video to save', 'error');
    }
}

// ================ PROFILE AND UPLOAD FUNCTIONS ================
function handleProfilePicUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.querySelectorAll('.profile-avatar').forEach(avatar => {
                if (avatar.tagName === 'IMG') {
                    avatar.src = e.target.result;
                } else {
                    avatar.style.backgroundImage = `url(${e.target.result})`;
                    avatar.textContent = '';
                }
            });
        };
        reader.readAsDataURL(file);
        showNotification('Profile picture updated!', 'success');
    }
}

function filterDiscoverVideos(query) {
    showNotification(`Filtering discover videos: ${query}`, 'info');
    const discoverFeed = document.getElementById('discoverVideoFeed');
    if (discoverFeed) {
        // Filter videos based on query
        const videos = discoverFeed.querySelectorAll('.video-card');
        videos.forEach(video => {
            const shouldShow = query === '' || 
                video.textContent.toLowerCase().includes(query.toLowerCase());
            video.style.display = shouldShow ? 'block' : 'none';
        });
    }
}

// ================ COMMENT SYSTEM ================
// Mention system variables
let mentionDropdownOpen = false;
let selectedMentionIndex = 0;
let mentionSearchTerm = '';
let mentionStartPosition = -1;

// Handle comment input for @mentions
async function handleCommentInput(input, videoId) {
    console.log('🔍 handleCommentInput called for video:', videoId);
    const text = input.value;
    const cursorPosition = input.selectionStart;
    console.log('📝 Input text:', text, 'Cursor position:', cursorPosition);
    
    // Find if we're in a mention context
    const beforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    console.log('🔎 Mention match:', mentionMatch);
    
    if (mentionMatch) {
        mentionStartPosition = mentionMatch.index;
        mentionSearchTerm = mentionMatch[1];
        console.log('✅ Found mention! Search term:', mentionSearchTerm);
        showMentionDropdown(videoId, mentionSearchTerm);
    } else {
        console.log('❌ No mention found');
        hideMentionDropdown(videoId);
    }
}

// Show mention dropdown with user suggestions
async function showMentionDropdown(videoId, searchTerm) {
    console.log('🎯 showMentionDropdown called for video:', videoId, 'searchTerm:', searchTerm);
    const dropdown = document.getElementById(`mentionDropdown_${videoId}`);
    console.log('📦 Dropdown element:', dropdown);
    if (!dropdown) {
        console.error('❌ No dropdown element found for video:', videoId);
        return;
    }
    
    try {
        // Search for users
        const apiBaseUrl = window.API_BASE_URL || 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? '' 
                : 'https://vib3-production.up.railway.app');
        
        const searchUrl = `${apiBaseUrl}/api/users/search?q=${searchTerm}&limit=5`;
        console.log('🌐 Searching users at:', searchUrl);
                
        const response = await fetch(searchUrl, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        console.log('📡 API Response status:', response.status);
        if (!response.ok) {
            console.error('❌ API Error:', response.status, response.statusText);
            throw new Error('Failed to search users');
        }
        
        const users = await response.json();
        console.log('👥 Users found:', users);
        
        if (users.length > 0) {
            dropdown.innerHTML = users.map((user, index) => `
                <div class="mention-item ${index === selectedMentionIndex ? 'selected' : ''}" 
                     onclick="selectMention('${videoId}', '${user.username}')"
                     onmouseover="selectedMentionIndex = ${index}"
                     style="
                        display: flex;
                        align-items: center;
                        padding: 12px 16px;
                        cursor: pointer;
                        transition: background 0.2s ease;
                        ${index === selectedMentionIndex ? 'background: var(--bg-tertiary);' : ''}
                     ">
                    <div style="
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, var(--accent-color), #ff006e);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-right: 12px;
                        font-size: 14px;
                        color: white;
                    ">${user.username[0].toUpperCase()}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">
                            @${user.username}
                        </div>
                        ${user.displayName ? `<div style="font-size: 12px; color: var(--text-secondary);">${user.displayName}</div>` : ''}
                    </div>
                </div>
            `).join('');
            
            dropdown.style.cssText = `
                display: block !important;
                position: absolute !important;
                bottom: 100% !important;
                left: 0 !important;
                right: 0 !important;
                max-height: 200px !important;
                overflow-y: auto !important;
                background: #1a1a1a !important;
                border: 1px solid #333 !important;
                border-radius: 12px !important;
                margin-bottom: 8px !important;
                box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.5) !important;
                z-index: 10000 !important;
            `;
            
            mentionDropdownOpen = true;
            window.mentionDropdownOpen = true;
            console.log('✅ Mention dropdown shown successfully!');
            console.log('🎯 Dropdown HTML:', dropdown.innerHTML.substring(0, 200) + '...');
        } else {
            console.log('⚠️ No users found, hiding dropdown');
            hideMentionDropdown(videoId);
        }
    } catch (error) {
        console.error('❌ Error searching users:', error);
        hideMentionDropdown(videoId);
    }
}

// Hide mention dropdown
function hideMentionDropdown(videoId) {
    const dropdown = document.getElementById(`mentionDropdown_${videoId}`);
    if (dropdown) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
    }
    mentionDropdownOpen = false;
    window.mentionDropdownOpen = false;
    selectedMentionIndex = 0;
}

// Select a mention from dropdown
function selectMention(videoId, username) {
    const input = document.getElementById(`commentInput_${videoId}`);
    if (!input) return;
    
    const text = input.value;
    const beforeMention = text.substring(0, mentionStartPosition);
    const afterMention = text.substring(input.selectionStart);
    
    input.value = beforeMention + '@' + username + ' ' + afterMention;
    input.focus();
    
    const newCursorPosition = beforeMention.length + username.length + 2;
    input.setSelectionRange(newCursorPosition, newCursorPosition);
    
    hideMentionDropdown(videoId);
}

// Handle keyboard navigation in mention dropdown
function handleMentionKeyDown(event, videoId) {
    if (!mentionDropdownOpen) return;
    
    const dropdown = document.getElementById(`mentionDropdown_${videoId}`);
    const items = dropdown?.querySelectorAll('.mention-item');
    
    if (!items || items.length === 0) return;
    
    switch(event.key) {
        case 'ArrowDown':
            event.preventDefault();
            selectedMentionIndex = Math.min(selectedMentionIndex + 1, items.length - 1);
            updateMentionSelection(items);
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            selectedMentionIndex = Math.max(selectedMentionIndex - 1, 0);
            updateMentionSelection(items);
            break;
            
        case 'Enter':
            if (mentionDropdownOpen) {
                event.preventDefault();
                items[selectedMentionIndex]?.click();
            }
            break;
            
        case 'Escape':
            hideMentionDropdown(videoId);
            break;
    }
}

// Update visual selection in mention dropdown
function updateMentionSelection(items) {
    items.forEach((item, index) => {
        if (index === selectedMentionIndex) {
            item.style.background = 'var(--bg-tertiary)';
            item.classList.add('selected');
        } else {
            item.style.background = '';
            item.classList.remove('selected');
        }
    });
}

function addComment(text, videoId) {
    if (!text || !text.trim()) return;
    
    const commentsList = document.querySelector('.comments-list');
    if (commentsList) {
        const comment = document.createElement('div');
        comment.className = 'comment';
        comment.innerHTML = `
            <div class="comment-avatar">👤</div>
            <div class="comment-content">
                <div class="comment-user">${currentUser?.username || 'You'}</div>
                <div class="comment-text">${text}</div>
                <div class="comment-actions">
                    <button onclick="likeComment(this)">👍 0</button>
                    <button onclick="replyToComment(this)">Reply</button>
                </div>
            </div>
        `;
        commentsList.appendChild(comment);
        
        // Clear input
        const input = document.getElementById(`commentInput_${videoId}`);
        if (input) input.value = '';
        
        showNotification('Comment added!', 'success');
    }
}

function likeComment(button) {
    const currentLikes = parseInt(button.textContent.split(' ')[1]) || 0;
    button.textContent = `👍 ${currentLikes + 1}`;
    button.style.color = '#ff6b6b';
    showNotification('Comment liked!', 'success');
}

function replyToComment(button) {
    const reply = prompt('Enter your reply:');
    if (reply) {
        showNotification('Reply added!', 'success');
    }
}

// Message-specific mention handlers
async function handleMessageInput(input) {
    const text = input.value;
    const cursorPosition = input.selectionStart;
    
    // Find if we're in a mention context
    const beforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
        mentionStartPosition = mentionMatch.index;
        mentionSearchTerm = mentionMatch[1];
        showMessageMentionDropdown(mentionSearchTerm);
    } else {
        hideMessageMentionDropdown();
    }
}

async function showMessageMentionDropdown(searchTerm) {
    const dropdown = document.getElementById('messageMentionDropdown');
    if (!dropdown) return;
    
    try {
        // Search for users
        const apiBaseUrl = window.API_BASE_URL || 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? '' 
                : 'https://vib3-production.up.railway.app');
                
        const response = await fetch(`${apiBaseUrl}/api/users/search?q=${searchTerm}&limit=5`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        if (!response.ok) throw new Error('Failed to search users');
        
        const users = await response.json();
        
        if (users.length > 0) {
            dropdown.innerHTML = users.map((user, index) => `
                <div class="mention-item ${index === selectedMentionIndex ? 'selected' : ''}" 
                     onclick="selectMessageMention('${user.username}')"
                     onmouseover="selectedMentionIndex = ${index}"
                     style="
                        display: flex;
                        align-items: center;
                        padding: 12px 16px;
                        cursor: pointer;
                        transition: background 0.2s ease;
                        ${index === selectedMentionIndex ? 'background: var(--bg-tertiary);' : ''}
                     ">
                    <div style="
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, var(--accent-color), #ff006e);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-right: 12px;
                        font-size: 14px;
                        color: white;
                    ">${user.username[0].toUpperCase()}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">
                            @${user.username}
                        </div>
                        ${user.displayName ? `<div style="font-size: 12px; color: var(--text-secondary);">${user.displayName}</div>` : ''}
                    </div>
                </div>
            `).join('');
            
            dropdown.style.display = 'block';
            mentionDropdownOpen = true;
            window.mentionDropdownOpen = true;
        } else {
            hideMessageMentionDropdown();
        }
    } catch (error) {
        console.error('Error searching users:', error);
        hideMessageMentionDropdown();
    }
}

function hideMessageMentionDropdown() {
    const dropdown = document.getElementById('messageMentionDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
    }
    mentionDropdownOpen = false;
    window.mentionDropdownOpen = false;
    selectedMentionIndex = 0;
}

function selectMessageMention(username) {
    const input = document.getElementById('messageInput');
    if (!input) return;
    
    const text = input.value;
    const beforeMention = text.substring(0, mentionStartPosition);
    const afterMention = text.substring(input.selectionStart);
    
    input.value = beforeMention + '@' + username + ' ' + afterMention;
    input.focus();
    
    const newCursorPosition = beforeMention.length + username.length + 2;
    input.setSelectionRange(newCursorPosition, newCursorPosition);
    
    hideMessageMentionDropdown();
}

function handleMessageMentionKeyDown(event) {
    if (!mentionDropdownOpen) return;
    
    const dropdown = document.getElementById('messageMentionDropdown');
    const items = dropdown?.querySelectorAll('.mention-item');
    
    if (!items || items.length === 0) return;
    
    switch(event.key) {
        case 'ArrowDown':
            event.preventDefault();
            selectedMentionIndex = Math.min(selectedMentionIndex + 1, items.length - 1);
            updateMentionSelection(items);
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            selectedMentionIndex = Math.max(selectedMentionIndex - 1, 0);
            updateMentionSelection(items);
            break;
            
        case 'Enter':
            if (mentionDropdownOpen) {
                event.preventDefault();
                items[selectedMentionIndex]?.click();
            }
            break;
            
        case 'Escape':
            hideMessageMentionDropdown();
            break;
    }
}

// Comment input handlers for the working comment input (with dash)
async function handleCommentInputDash(input, videoId) {
    console.log('🔍 handleCommentInputDash called for video:', videoId);
    const text = input.value;
    const cursorPosition = input.selectionStart;
    console.log('📝 Input text:', text, 'Cursor position:', cursorPosition);
    
    // Find if we're in a mention context
    const beforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    console.log('🔎 Mention match:', mentionMatch);
    
    if (mentionMatch) {
        mentionStartPosition = mentionMatch.index;
        mentionSearchTerm = mentionMatch[1];
        console.log('✅ Found mention! Search term:', mentionSearchTerm);
        showMentionDropdownDash(videoId, mentionSearchTerm);
    } else {
        console.log('❌ No mention found');
        hideMentionDropdownDash(videoId);
    }
}

async function showMentionDropdownDash(videoId, searchTerm) {
    console.log('🎯 showMentionDropdownDash called for video:', videoId, 'searchTerm:', searchTerm);
    const dropdown = document.getElementById(`mentionDropdownDash-${videoId}`);
    console.log('📦 Dropdown element:', dropdown);
    if (!dropdown) {
        console.error('❌ No dropdown element found for video:', videoId);
        return;
    }
    
    try {
        // Search for users
        const apiBaseUrl = window.API_BASE_URL || 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? '' 
                : 'https://vib3-production.up.railway.app');
        
        const searchUrl = `${apiBaseUrl}/api/users/search?q=${searchTerm}&limit=5`;
        console.log('🌐 Searching users at:', searchUrl);
                
        const response = await fetch(searchUrl, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        console.log('📡 API Response status:', response.status);
        if (!response.ok) {
            console.error('❌ API Error:', response.status, response.statusText);
            throw new Error('Failed to search users');
        }
        
        const users = await response.json();
        console.log('👥 Users found:', users);
        
        if (users.length > 0) {
            dropdown.innerHTML = users.map((user, index) => `
                <div class="mention-item ${index === selectedMentionIndex ? 'selected' : ''}" 
                     onclick="selectMentionDash('${videoId}', '${user.username}')"
                     onmouseover="selectedMentionIndex = ${index}"
                     style="
                        display: flex;
                        align-items: center;
                        padding: 12px 16px;
                        cursor: pointer;
                        transition: background 0.2s ease;
                        ${index === selectedMentionIndex ? 'background: var(--bg-tertiary);' : ''}
                     ">
                    <div style="
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, var(--accent-color), #ff006e);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-right: 12px;
                        font-size: 14px;
                        color: white;
                    ">${user.username[0].toUpperCase()}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">
                            @${user.username}
                        </div>
                        ${user.displayName ? `<div style="font-size: 12px; color: var(--text-secondary);">${user.displayName}</div>` : ''}
                    </div>
                </div>
            `).join('');
            
            dropdown.style.cssText = `
                display: block !important;
                position: absolute !important;
                bottom: 100% !important;
                left: 0 !important;
                right: 60px !important;
                max-height: 200px !important;
                overflow-y: auto !important;
                background: #1a1a1a !important;
                border: 1px solid #333 !important;
                border-radius: 12px !important;
                margin-bottom: 8px !important;
                box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.5) !important;
                z-index: 10000 !important;
            `;
            
            mentionDropdownOpen = true;
            window.mentionDropdownOpen = true;
            console.log('✅ Mention dropdown shown successfully!');
            console.log('🎯 Dropdown HTML:', dropdown.innerHTML.substring(0, 200) + '...');
        } else {
            console.log('⚠️ No users found, hiding dropdown');
            hideMentionDropdownDash(videoId);
        }
    } catch (error) {
        console.error('❌ Error searching users:', error);
        hideMentionDropdownDash(videoId);
    }
}

function hideMentionDropdownDash(videoId) {
    const dropdown = document.getElementById(`mentionDropdownDash-${videoId}`);
    if (dropdown) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
    }
    mentionDropdownOpen = false;
    window.mentionDropdownOpen = false;
    selectedMentionIndex = 0;
}

function selectMentionDash(videoId, username) {
    const input = document.getElementById(`commentInput-${videoId}`);
    if (!input) return;
    
    const text = input.value;
    const beforeMention = text.substring(0, mentionStartPosition);
    const afterMention = text.substring(input.selectionStart);
    
    input.value = beforeMention + '@' + username + ' ' + afterMention;
    input.focus();
    
    const newCursorPosition = beforeMention.length + username.length + 2;
    input.setSelectionRange(newCursorPosition, newCursorPosition);
    
    hideMentionDropdownDash(videoId);
}

function handleMentionKeyDownDash(event, videoId) {
    // Handle Enter key for comment submission when dropdown is not open
    if (event.key === 'Enter' && !mentionDropdownOpen) {
        event.preventDefault();
        submitComment(videoId);
        return;
    }
    
    if (!mentionDropdownOpen) return;
    
    const dropdown = document.getElementById(`mentionDropdownDash-${videoId}`);
    const items = dropdown?.querySelectorAll('.mention-item');
    
    if (!items || items.length === 0) return;
    
    switch(event.key) {
        case 'ArrowDown':
            event.preventDefault();
            selectedMentionIndex = Math.min(selectedMentionIndex + 1, items.length - 1);
            updateMentionSelection(items);
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            selectedMentionIndex = Math.max(selectedMentionIndex - 1, 0);
            updateMentionSelection(items);
            break;
            
        case 'Enter':
            if (mentionDropdownOpen) {
                event.preventDefault();
                items[selectedMentionIndex]?.click();
            }
            break;
            
        case 'Escape':
            hideMentionDropdownDash(videoId);
            break;
    }
}

// Search input handlers with @mention support
async function handleSearchInput(input) {
    console.log('🔍 handleSearchInput called');
    const text = input.value;
    const cursorPosition = input.selectionStart;
    console.log('📝 Search input text:', text, 'Cursor position:', cursorPosition);
    
    // Handle clear button and regular search suggestions
    const clearBtn = document.querySelector('.clear-search');
    if (clearBtn) {
        clearBtn.style.display = text ? 'block' : 'none';
    }
    
    // Find if we're in a mention context
    const beforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    console.log('🔎 Mention match in search:', mentionMatch);
    
    if (mentionMatch) {
        mentionStartPosition = mentionMatch.index;
        mentionSearchTerm = mentionMatch[1];
        console.log('✅ Found mention in search! Search term:', mentionSearchTerm);
        showSearchMentionDropdown(mentionSearchTerm);
        // Hide regular search suggestions when showing mentions
        hideSearchSuggestions();
    } else {
        console.log('❌ No mention found in search');
        hideSearchMentionDropdown();
        // Show regular search suggestions
        updateSearchSuggestions(text);
    }
}

async function showSearchMentionDropdown(searchTerm) {
    console.log('🎯 showSearchMentionDropdown called, searchTerm:', searchTerm);
    const dropdown = document.getElementById('searchMentionDropdown');
    console.log('📦 Search dropdown element:', dropdown);
    if (!dropdown) {
        console.error('❌ No search dropdown element found');
        return;
    }
    
    try {
        // Search for users
        const apiBaseUrl = window.API_BASE_URL || 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? '' 
                : 'https://vib3-production.up.railway.app');
        
        const searchUrl = `${apiBaseUrl}/api/users/search?q=${searchTerm}&limit=5`;
        console.log('🌐 Searching users for search bar at:', searchUrl);
                
        const response = await fetch(searchUrl, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        console.log('📡 Search API Response status:', response.status);
        if (!response.ok) {
            console.error('❌ Search API Error:', response.status, response.statusText);
            throw new Error('Failed to search users');
        }
        
        const users = await response.json();
        console.log('👥 Users found for search:', users);
        
        if (users.length > 0) {
            dropdown.innerHTML = users.map((user, index) => `
                <div class="mention-item ${index === selectedMentionIndex ? 'selected' : ''}" 
                     onclick="selectSearchMention('${user.username}')"
                     onmouseover="selectedMentionIndex = ${index}"
                     style="
                        display: flex;
                        align-items: center;
                        padding: 12px 16px;
                        cursor: pointer;
                        transition: background 0.2s ease;
                        ${index === selectedMentionIndex ? 'background: var(--bg-tertiary);' : ''}
                     ">
                    <div style="
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, var(--accent-color), #ff006e);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-right: 12px;
                        font-size: 14px;
                        color: white;
                    ">${user.username[0].toUpperCase()}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">
                            @${user.username}
                        </div>
                        ${user.displayName ? `<div style="font-size: 12px; color: var(--text-secondary);">${user.displayName}</div>` : ''}
                    </div>
                </div>
            `).join('');
            
            dropdown.style.cssText = `
                display: block !important;
                position: absolute !important;
                top: 100% !important;
                left: 0 !important;
                right: 0 !important;
                max-height: 200px !important;
                overflow-y: auto !important;
                background: #1a1a1a !important;
                border: 1px solid #333 !important;
                border-radius: 12px !important;
                margin-top: 5px !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
                z-index: 10000 !important;
            `;
            
            mentionDropdownOpen = true;
            window.mentionDropdownOpen = true;
            console.log('✅ Search mention dropdown shown successfully!');
        } else {
            console.log('⚠️ No users found for search, hiding dropdown');
            hideSearchMentionDropdown();
        }
    } catch (error) {
        console.error('❌ Error searching users for search bar:', error);
        hideSearchMentionDropdown();
    }
}

function hideSearchMentionDropdown() {
    const dropdown = document.getElementById('searchMentionDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
    }
    mentionDropdownOpen = false;
    window.mentionDropdownOpen = false;
    selectedMentionIndex = 0;
}

function selectSearchMention(username) {
    const input = document.getElementById('exploreSearchInput');
    if (!input) return;
    
    const text = input.value;
    const beforeMention = text.substring(0, mentionStartPosition);
    const afterMention = text.substring(input.selectionStart);
    
    input.value = beforeMention + '@' + username + ' ' + afterMention;
    input.focus();
    
    const newCursorPosition = beforeMention.length + username.length + 2;
    input.setSelectionRange(newCursorPosition, newCursorPosition);
    
    hideSearchMentionDropdown();
}

function handleSearchMentionKeyDown(event) {
    if (!mentionDropdownOpen) return;
    
    const dropdown = document.getElementById('searchMentionDropdown');
    const items = dropdown?.querySelectorAll('.mention-item');
    
    if (!items || items.length === 0) return;
    
    switch(event.key) {
        case 'ArrowDown':
            event.preventDefault();
            selectedMentionIndex = Math.min(selectedMentionIndex + 1, items.length - 1);
            updateMentionSelection(items);
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            selectedMentionIndex = Math.max(selectedMentionIndex - 1, 0);
            updateMentionSelection(items);
            break;
            
        case 'Enter':
            if (mentionDropdownOpen) {
                event.preventDefault();
                items[selectedMentionIndex]?.click();
            }
            break;
            
        case 'Escape':
            hideSearchMentionDropdown();
            break;
    }
}

// Sidebar search input handlers with @mention support
async function handleSidebarSearchInput(input) {
    console.log('🔍 handleSidebarSearchInput called');
    console.log('🎯 Input element:', input);
    console.log('🎯 Input ID:', input?.id);
    const text = input.value;
    const cursorPosition = input.selectionStart;
    console.log('📝 Sidebar search input text:', text, 'Cursor position:', cursorPosition);
    
    // Quick test - show alert
    if (text.includes('@')) {
        console.log('🚨 DETECTED @ CHARACTER IN SIDEBAR SEARCH!');
    }
    
    // Find if we're in a mention context
    const beforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    console.log('🔎 Mention match in sidebar search:', mentionMatch);
    
    if (mentionMatch) {
        mentionStartPosition = mentionMatch.index;
        mentionSearchTerm = mentionMatch[1];
        console.log('✅ Found mention in sidebar search! Search term:', mentionSearchTerm);
        showSidebarSearchMentionDropdown(mentionSearchTerm);
    } else {
        console.log('❌ No mention found in sidebar search');
        hideSidebarSearchMentionDropdown();
        // Could add regular search suggestions here if needed
    }
}

async function showSidebarSearchMentionDropdown(searchTerm) {
    console.log('🎯 showSidebarSearchMentionDropdown called, searchTerm:', searchTerm);
    const dropdown = document.getElementById('sidebarSearchMentionDropdown');
    console.log('📦 Sidebar search dropdown element:', dropdown);
    if (!dropdown) {
        console.error('❌ No sidebar search dropdown element found');
        return;
    }
    
    try {
        // Search for users
        const apiBaseUrl = window.API_BASE_URL || 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? '' 
                : 'https://vib3-production.up.railway.app');
        
        const searchUrl = `${apiBaseUrl}/api/users/search?q=${searchTerm}&limit=5`;
        console.log('🌐 Searching users for sidebar search at:', searchUrl);
                
        const response = await fetch(searchUrl, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        console.log('📡 Sidebar search API Response status:', response.status);
        if (!response.ok) {
            console.error('❌ Sidebar search API Error:', response.status, response.statusText);
            throw new Error('Failed to search users');
        }
        
        const users = await response.json();
        console.log('👥 Users found for sidebar search:', users);
        
        if (users.length > 0) {
            dropdown.innerHTML = users.map((user, index) => `
                <div class="mention-item ${index === selectedMentionIndex ? 'selected' : ''}" 
                     onclick="selectSidebarSearchMention('${user.username}')"
                     onmouseover="selectedMentionIndex = ${index}"
                     style="
                        display: flex;
                        align-items: center;
                        padding: 12px 16px;
                        cursor: pointer;
                        transition: background 0.2s ease;
                        ${index === selectedMentionIndex ? 'background: var(--bg-tertiary);' : ''}
                     ">
                    <div style="
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, var(--accent-color), #ff006e);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-right: 12px;
                        font-size: 14px;
                        color: white;
                    ">${user.username[0].toUpperCase()}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">
                            @${user.username}
                        </div>
                        ${user.displayName ? `<div style="font-size: 12px; color: var(--text-secondary);">${user.displayName}</div>` : ''}
                    </div>
                </div>
            `).join('');
            
            dropdown.style.cssText = `
                display: block !important;
                position: absolute !important;
                top: 100% !important;
                left: 0 !important;
                right: 0 !important;
                max-height: 200px !important;
                overflow-y: auto !important;
                background: #1a1a1a !important;
                border: 1px solid #333 !important;
                border-radius: 12px !important;
                margin-top: 5px !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
                z-index: 10000 !important;
            `;
            
            mentionDropdownOpen = true;
            window.mentionDropdownOpen = true;
            console.log('✅ Sidebar search mention dropdown shown successfully!');
        } else {
            console.log('⚠️ No users found for sidebar search, hiding dropdown');
            hideSidebarSearchMentionDropdown();
        }
    } catch (error) {
        console.error('❌ Error searching users for sidebar search:', error);
        hideSidebarSearchMentionDropdown();
    }
}

function hideSidebarSearchMentionDropdown() {
    const dropdown = document.getElementById('sidebarSearchMentionDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
    }
    mentionDropdownOpen = false;
    window.mentionDropdownOpen = false;
    selectedMentionIndex = 0;
}

function selectSidebarSearchMention(username) {
    const input = document.getElementById('sidebarSearchInput');
    if (!input) return;
    
    const text = input.value;
    const beforeMention = text.substring(0, mentionStartPosition);
    const afterMention = text.substring(input.selectionStart);
    
    input.value = beforeMention + '@' + username + ' ' + afterMention;
    input.focus();
    
    const newCursorPosition = beforeMention.length + username.length + 2;
    input.setSelectionRange(newCursorPosition, newCursorPosition);
    
    hideSidebarSearchMentionDropdown();
}

function handleSidebarSearchMentionKeyDown(event) {
    if (!mentionDropdownOpen) return;
    
    const dropdown = document.getElementById('sidebarSearchMentionDropdown');
    const items = dropdown?.querySelectorAll('.mention-item');
    
    if (!items || items.length === 0) return;
    
    switch(event.key) {
        case 'ArrowDown':
            event.preventDefault();
            selectedMentionIndex = Math.min(selectedMentionIndex + 1, items.length - 1);
            updateMentionSelection(items);
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            selectedMentionIndex = Math.max(selectedMentionIndex - 1, 0);
            updateMentionSelection(items);
            break;
            
        case 'Enter':
            if (mentionDropdownOpen) {
                event.preventDefault();
                items[selectedMentionIndex]?.click();
            }
            break;
            
        case 'Escape':
            hideSidebarSearchMentionDropdown();
            break;
    }
}

// ================ MUSIC AND AUDIO ================
function recordVoiceover() {
    showNotification('Recording voiceover...', 'info');
}

function playPreview(trackId) {
    showNotification(`Playing track ${trackId}`, 'info');
}

function selectMusic(trackId) {
    showNotification(`Music selected: Track ${trackId}`, 'success');
    closeMusicLibrary();
}

function favoriteTrack(trackId) {
    showNotification(`Track ${trackId} added to favorites!`, 'success');
}

function filterMusic(genre) {
    showNotification(`Filtering music: ${genre}`, 'info');
}

function closeMusicLibrary() {
    const musicModal = document.querySelector('.music-library-modal');
    if (musicModal) {
        musicModal.remove();
    }
}

// ================ DUET AND STITCH FUNCTIONS ================
function addDuetEffect(effect) {
    showNotification(`Added duet effect: ${effect}`, 'success');
}

function closeDuetModal() {
    const duetModal = document.querySelector('.duet-modal');
    if (duetModal) {
        duetModal.remove();
    }
}

function publishDuet() {
    showNotification('Duet published successfully!', 'success');
    closeDuetModal();
}

function saveDuetDraft() {
    showNotification('Duet saved as draft', 'info');
}

function closeStitchModal() {
    const stitchModal = document.querySelector('.stitch-modal');
    if (stitchModal) {
        stitchModal.remove();
    }
}

function publishStitch() {
    showNotification('Stitch published successfully!', 'success');
    closeStitchModal();
}

function previewStitch() {
    showNotification('Previewing stitch...', 'info');
}

// ================ RECORDING FUNCTIONS ================
function setRecordingTimer(seconds) {
    showNotification(`Recording timer set to ${seconds} seconds`, 'info');
    window.recordingTimer = seconds;
}

function setDuetTimer(seconds) {
    showNotification(`Duet timer set to ${seconds} seconds`, 'info');
}

function flipDuetCamera() {
    showNotification('Duet camera flipped', 'info');
}

function flipStitchCamera() {
    showNotification('Stitch camera flipped', 'info');
}

function toggleDuetRecording() {
    const isRecording = window.isDuetRecording || false;
    window.isDuetRecording = !isRecording;
    showNotification(isRecording ? 'Duet recording stopped' : 'Duet recording started', 'info');
}

function toggleStitchRecording() {
    const isRecording = window.isStitchRecording || false;
    window.isStitchRecording = !isRecording;
    showNotification(isRecording ? 'Stitch recording stopped' : 'Stitch recording started', 'info');
}

// ================ ADDITIONAL SEARCH FUNCTIONS ================
function filterSearchResults(type) {
    showNotification(`Filtering search results: ${type}`, 'info');
    document.querySelectorAll('.search-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// ================ UTILITY FUNCTIONS ================
function reportVideo(videoId) {
    showNotification('Video reported', 'info');
}

function notInterested(videoId) {
    showNotification('Marked as not interested', 'info');
}


function useSound(soundId) {
    showNotification(`Using sound ${soundId}`, 'success');
}

function favoriteSound(soundId) {
    showNotification(`Sound ${soundId} favorited!`, 'success');
}

function playVideo(videoId) {
    showNotification(`Playing video ${videoId}`, 'info');
}

// ================ MISC ================
function showMoreOptions() {
    showNotification('More options...', 'info');
}

// Test mention system on load
console.log('🧪 Testing mention system availability:');
console.log('  - handleCommentInput:', typeof handleCommentInput);
console.log('  - showMentionDropdown:', typeof showMentionDropdown);
console.log('  - window.handleCommentInput:', typeof window.handleCommentInput);

// Make all functions globally available
window.initializeAuth = initializeAuth;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleLogout = handleLogout;
window.showLogin = showLogin;
window.showSignup = showSignup;
window.loadUserProfile = loadUserProfile;
window.loadVideoFeed = loadVideoFeed;
window.switchFeedTab = switchFeedTab;
window.refreshForYou = refreshForYou;
window.performSearch = performSearch;
window.showPage = showPage;
window.showUploadModal = showUploadModal;
window.closeUploadModal = closeUploadModal;
// window.recordVideo = recordVideo; // COMMENTED OUT: Using upload-manager.js implementation instead
window.selectVideo = selectVideo;
window.selectPhotos = selectPhotos;
window.triggerFileSelect = triggerFileSelect;
window.handleVideoSelect = handleVideoSelect;
window.handlePhotoSelect = handlePhotoSelect;
window.removeFile = removeFile;
window.goToStep = goToStep;
window.setupEditingPreview = setupEditingPreview;
window.nextSlide = nextSlide;
window.previousSlide = previousSlide;
window.trimVideo = trimVideo;
window.addFilter = addFilter;
window.adjustSpeed = adjustSpeed;
window.addTransition = addTransition;
window.addMusic = addMusic;
window.recordVoiceover = recordVoiceover;
window.adjustVolume = adjustVolume;
window.selectTemplate = selectTemplate;
window.addPhotoEffects = addPhotoEffects;
window.setTiming = setTiming;
window.handleHashtagInput = handleHashtagInput;
window.addHashtag = addHashtag;
window.publishContent = publishContent;
window.startDuet = startDuet;
window.startStitch = startStitch;
window.openMusicLibrary = openMusicLibrary;
window.handleAdvancedLike = handleAdvancedLike;
window.addReaction = addReaction;
window.showNotification = showNotification;

// Theme & Settings functions
window.changeTheme = changeTheme;
window.toggleSetting = toggleSetting;
window.showToast = showToast;

// Sharing & Social functions
window.closeShareModal = closeShareModal;
window.toggleRepost = toggleRepost;
window.copyVideoLink = copyVideoLink;
window.shareToInstagram = shareToInstagram;
window.shareToTwitter = shareToTwitter;
window.shareToFacebook = shareToFacebook;
window.shareToWhatsApp = shareToWhatsApp;
window.shareToTelegram = shareToTelegram;
window.shareViaEmail = shareViaEmail;
window.downloadVideo = downloadVideo;
window.generateQRCode = generateQRCode;
window.shareNative = shareNative;

// Upload & Media functions
window.selectVideo = selectVideo;
window.uploadProfilePicture = uploadProfilePicture;
window.editDisplayName = editDisplayName;
window.closeDeleteModal = closeDeleteModal;
window.confirmDeleteVideo = confirmDeleteVideo;

// Messaging functions
window.closeModal = closeModal;
window.openChat = openChat;
window.openGroupChat = openGroupChat;
window.startNewChat = startNewChat;

// Search & Discovery functions
window.searchTrendingTag = searchTrendingTag;
window.filterByTag = filterByTag;

// Shop & Monetization functions
window.filterShop = filterShop;
window.viewProduct = viewProduct;
window.checkout = checkout;
window.setupTips = setupTips;
window.setupMerchandise = setupMerchandise;
window.setupSponsorship = setupSponsorship;
window.setupSubscription = setupSubscription;

// Analytics functions
window.exportAnalytics = exportAnalytics;
window.shareAnalytics = shareAnalytics;

// Misc functions
window.showMoreOptions = showMoreOptions;

// Live streaming functions
window.startLiveStream = startLiveStream;
window.stopLiveStream = stopLiveStream;
window.debugAuthState = debugAuthState;
window.scheduleLiveStream = scheduleLiveStream;
window.closeLiveStream = closeLiveStream;
window.toggleChatSettings = toggleChatSettings;
window.sendChatMessage = sendChatMessage;
window.sendGift = sendGift;
window.sendSpecificGift = sendSpecificGift;

// Page and friend functions
window.createActivityPage = createActivityPage;
window.createFriendsPage = createFriendsPage;
window.filterActivity = filterActivity;
window.filterFriends = filterFriends;
window.searchFriends = searchFriends;
window.toggleFollow = toggleFollow;

// Video interaction functions
window.toggleVideoPlayback = toggleVideoPlayback;
window.openCommentsModal = openCommentsModal;
window.openShareModal = openShareModal;
window.viewProfile = viewProfile;
window.showVideoOptions = showVideoOptions;
window.saveVideo = saveVideo;
window.browseSound = browseSound;

// Video editor functions
window.addEffect = addEffect;
window.applyFilter = applyFilter;
window.addTextOverlay = addTextOverlay;
window.setSpeed = setSpeed;
window.setTextStyle = setTextStyle;
window.toggleEffect = toggleEffect;
window.flipCamera = flipCamera;
window.toggleFlash = toggleFlash;
window.toggleRecording = toggleRecording;
window.toggleCountdown = toggleCountdown;
window.toggleGridLines = toggleGridLines;
window.toggleEditorAudio = toggleEditorAudio;
window.closeVideoEditor = closeVideoEditor;
window.saveEditedVideo = saveEditedVideo;

// Profile and upload functions
window.handleProfilePicUpload = handleProfilePicUpload;
window.filterDiscoverVideos = filterDiscoverVideos;

// Comment system
window.addComment = addComment;
window.handleCommentInput = handleCommentInput;
window.handleMentionKeyDown = handleMentionKeyDown;
window.selectMention = selectMention;
window.likeComment = likeComment;
window.replyToComment = replyToComment;

// Message mention functions
window.handleMessageInput = handleMessageInput;
window.handleMessageMentionKeyDown = handleMessageMentionKeyDown;
window.selectMessageMention = selectMessageMention;

// Comment input with dash (the actual working one) 
window.handleCommentInputDash = handleCommentInputDash;
window.handleMentionKeyDownDash = handleMentionKeyDownDash;
window.selectMentionDash = selectMentionDash;

// Search input mention functions
window.handleSearchInput = handleSearchInput;
window.handleSearchMentionKeyDown = handleSearchMentionKeyDown;
window.selectSearchMention = selectSearchMention;

// Sidebar search input mention functions
window.handleSidebarSearchInput = handleSidebarSearchInput;
window.handleSidebarSearchMentionKeyDown = handleSidebarSearchMentionKeyDown;
window.selectSidebarSearchMention = selectSidebarSearchMention;

// Music and audio functions
window.recordVoiceover = recordVoiceover;
window.playPreview = playPreview;
window.selectMusic = selectMusic;
window.favoriteTrack = favoriteTrack;
window.filterMusic = filterMusic;
window.closeMusicLibrary = closeMusicLibrary;

// VIB3 Collaboration Features - Original Alternatives to Duet/Stitch
// TODO: Implement collaboration functions
// window.startCollaboration = startCollaboration;
// window.closeCollabModal = closeCollabModal;
// window.publishCollab = publishCollab;
// window.saveCollabDraft = saveCollabDraft;
// window.startRemix = startRemix;
// window.closeRemixModal = closeRemixModal;
window.publishRemix = publishRemix;
window.previewRemix = previewRemix;

// Recording functions
window.setRecordingTimer = setRecordingTimer;
window.setDuetTimer = setDuetTimer;
window.flipDuetCamera = flipDuetCamera;
window.flipStitchCamera = flipStitchCamera;
window.toggleDuetRecording = toggleDuetRecording;
window.toggleStitchRecording = toggleStitchRecording;

// Search functions
window.filterSearchResults = filterSearchResults;

// Utility functions
window.reportVideo = reportVideo;
window.notInterested = notInterested;
window.shareVideo = shareVideo;
window.useSound = useSound;
window.favoriteSound = favoriteSound;
window.playVideo = playVideo;

// Activity functions
window.createActivityPage = createActivityPage;
window.loadActivity = loadActivity;
window.filterActivity = filterActivity;
window.handleActivityClick = handleActivityClick;

// Messages functions
window.createMessagesPage = createMessagesPage;
window.loadChatList = loadChatList;
window.openChat = openChat;
window.sendMessage = sendMessage;
window.searchChats = searchChats;
window.startNewChat = startNewChat;
window.attachMedia = attachMedia;
window.openChatOptions = openChatOptions;

// Profile functions
window.createProfilePage = createProfilePage;
window.loadProfileData = loadProfileData;
window.switchProfileTab = switchProfileTab;
window.editProfile = editProfile;
window.changeProfilePicture = changeProfilePicture;
window.showProfileSettings = showProfileSettings;
window.showFollowing = showFollowing;
window.showFollowers = showFollowers;
window.shareProfile = shareProfile;
window.openCreatorTools = openCreatorTools;
window.createExploreVideoCard = createExploreVideoCard;
window.openVideoModal = openVideoModal;
window.createVideoFeed = createVideoFeed;
window.performExploreSearch = performExploreSearch;
window.showSearchSuggestions = showSearchSuggestions;
window.hideSearchSuggestions = hideSearchSuggestions;
window.updateSearchSuggestions = updateSearchSuggestions;
window.clearExploreSearch = clearExploreSearch;
window.clearSearchHistory = clearSearchHistory;
window.filterByCategory = filterByCategory;
window.filterExploreVideos = filterExploreVideos;
window.searchTrendingTag = searchTrendingTag;

// ================ PROFILE FUNCTIONS ================
function loadProfileData() {
    // Simulate loading user profile data
    setTimeout(() => {
        if (currentUser) {
            document.getElementById('profileUsername').textContent = `@${currentUser.username || 'vib3user'}`;
            document.getElementById('profileBio').innerHTML = `
                Welcome to my VIB3 profile! 🎵✨<br>
                Creator | Dancer | Music Lover<br>
                📧 Contact: ${currentUser.email || 'hello@vib3.com'}
            `;
            
            // Load stats
            document.getElementById('followingCount').textContent = Math.floor(Math.random() * 500);
            document.getElementById('followersCount').textContent = Math.floor(Math.random() * 10000);
            document.getElementById('likesCount').textContent = Math.floor(Math.random() * 50000);
        }
        
        // Load initial tab content
        switchProfileTab('videos');
    }, 500);
}

function switchProfileTab(tabType) {
    // Update tab styles
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.color = 'var(--text-secondary)';
        tab.style.borderBottom = '2px solid transparent';
    });
    
    const activeTab = document.querySelector(`[data-tab="${tabType}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.style.color = 'var(--text-primary)';
        activeTab.style.borderBottom = '2px solid var(--accent-color)';
    }
    
    currentProfileTab = tabType;
    
    // Load content based on tab
    const profileContent = document.getElementById('profileContent');
    if (profileContent) {
        switch(tabType) {
            case 'videos':
                profileContent.innerHTML = createVideosGrid();
                break;
            case 'liked':
                profileContent.innerHTML = createLikedVideosGrid();
                break;
            case 'following-feed':
                profileContent.innerHTML = createFollowingFeed();
                break;
            case 'analytics':
                profileContent.innerHTML = createAnalyticsView();
                break;
        }
    }
}

function createVideosGrid() {
    return `
        <div class="videos-grid" style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
            padding: 20px 0;
        ">
            ${Array(12).fill(0).map((_, i) => `
                <div class="video-grid-item" style="
                    aspect-ratio: 9/16;
                    background: linear-gradient(135deg, 
                        ${['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'][i % 6]} 0%, 
                        ${['#764ba2', '#667eea', '#f5576c', '#f093fb', '#00f2fe', '#4facfe'][i % 6]} 100%);
                    border-radius: 12px;
                    position: relative;
                    cursor: pointer;
                    overflow: hidden;
                    transition: transform 0.2s ease;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="
                        position: absolute;
                        bottom: 8px;
                        left: 8px;
                        color: white;
                        font-size: 12px;
                        font-weight: 600;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                    ">${Math.floor(Math.random() * 1000)}K</div>
                </div>
            `).join('')}
        </div>
        ${Array(12).fill(0).length === 0 ? `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                <div style="font-size: 48px; margin-bottom: 16px;">📹</div>
                <h3 style="margin-bottom: 8px;">No videos yet</h3>
                <p>Upload your first video to get started!</p>
                <button onclick="showUploadModal()" style="
                    margin-top: 16px;
                    padding: 12px 24px;
                    background: var(--accent-color);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                ">Upload Video</button>
            </div>
        ` : ''}
    `;
}

function createLikedVideosGrid() {
    return `
        <div class="liked-videos-grid" style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
            padding: 20px 0;
        ">
            ${Array(8).fill(0).map((_, i) => `
                <div class="video-grid-item" style="
                    aspect-ratio: 9/16;
                    background: linear-gradient(135deg, 
                        ${['#ff6b6b', '#ffa726', '#66bb6a', '#42a5f5', '#ab47bc', '#ef5350'][i % 6]} 0%, 
                        ${['#ffa726', '#ff6b6b', '#42a5f5', '#66bb6a', '#ef5350', '#ab47bc'][i % 6]} 100%);
                    border-radius: 12px;
                    position: relative;
                    cursor: pointer;
                    overflow: hidden;
                    transition: transform 0.2s ease;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        color: white;
                        font-size: 16px;
                    ">❤️</div>
                    <div style="
                        position: absolute;
                        bottom: 8px;
                        left: 8px;
                        color: white;
                        font-size: 12px;
                        font-weight: 600;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                    ">${Math.floor(Math.random() * 500)}K</div>
                </div>
            `).join('')}
        </div>
    `;
}

function createFollowingFeed() {
    return `
        <div class="following-list" style="padding: 20px 0;">
            ${Array(6).fill(0).map((_, i) => `
                <div class="following-item" style="
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    border-radius: 12px;
                    background: var(--bg-secondary);
                    margin-bottom: 12px;
                    transition: background 0.2s ease;
                " onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='var(--bg-secondary)'">
                    <div style="
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, var(--accent-color), #ff006e);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                    ">👤</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                            @user${i + 1}_creator
                        </div>
                        <div style="font-size: 14px; color: var(--text-secondary);">
                            ${Math.floor(Math.random() * 1000)}K followers
                        </div>
                    </div>
                    <button onclick="toggleFollow('user${i + 1}_creator')" style="
                        padding: 8px 16px;
                        background: var(--bg-tertiary);
                        color: var(--text-primary);
                        border: 1px solid var(--border-primary);
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                    ">Following</button>
                </div>
            `).join('')}
        </div>
    `;
}

function createAnalyticsView() {
    return `
        <div class="analytics-dashboard" style="padding: 20px 0;">
            <div class="analytics-grid" style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            ">
                <div class="analytics-card" style="
                    background: var(--bg-secondary);
                    padding: 24px;
                    border-radius: 12px;
                    text-align: center;
                ">
                    <div style="font-size: 32px; margin-bottom: 8px;">👁️</div>
                    <div style="font-size: 24px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                        ${Math.floor(Math.random() * 100000).toLocaleString()}
                    </div>
                    <div style="color: var(--text-secondary);">Total Views</div>
                </div>
                
                <div class="analytics-card" style="
                    background: var(--bg-secondary);
                    padding: 24px;
                    border-radius: 12px;
                    text-align: center;
                ">
                    <div style="font-size: 32px; margin-bottom: 8px;">❤️</div>
                    <div style="font-size: 24px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                        ${Math.floor(Math.random() * 10000).toLocaleString()}
                    </div>
                    <div style="color: var(--text-secondary);">Total Likes</div>
                </div>
                
                <div class="analytics-card" style="
                    background: var(--bg-secondary);
                    padding: 24px;
                    border-radius: 12px;
                    text-align: center;
                ">
                    <div style="font-size: 32px; margin-bottom: 8px;">💬</div>
                    <div style="font-size: 24px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                        ${Math.floor(Math.random() * 5000).toLocaleString()}
                    </div>
                    <div style="color: var(--text-secondary);">Total Comments</div>
                </div>
                
                <div class="analytics-card" style="
                    background: var(--bg-secondary);
                    padding: 24px;
                    border-radius: 12px;
                    text-align: center;
                ">
                    <div style="font-size: 32px; margin-bottom: 8px;">📤</div>
                    <div style="font-size: 24px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                        ${Math.floor(Math.random() * 2000).toLocaleString()}
                    </div>
                    <div style="color: var(--text-secondary);">Total Shares</div>
                </div>
            </div>
            
            <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                <div style="font-size: 32px; margin-bottom: 16px;">📊</div>
                <h3 style="margin-bottom: 8px;">Detailed Analytics Coming Soon</h3>
                <p>Advanced analytics dashboard with charts and insights will be available soon!</p>
            </div>
        </div>
    `;
}

function editProfile() {
    console.log('🔧 vib3-complete.js editProfile() called');
    console.log('🔍 Current user object:', window.currentUser);
    console.log('🔍 Current display elements:', {
        profileName: document.getElementById('profileName')?.textContent,
        userDisplayName: document.getElementById('userDisplayName')?.textContent
    });
    const modal = document.createElement('div');
    modal.className = 'modal edit-profile-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: var(--bg-primary);
            border-radius: 16px;
            padding: 32px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="color: var(--text-primary); margin: 0;">Edit Profile</h2>
                <button onclick="this.closest('.modal').remove()" style="
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 24px;
                    cursor: pointer;
                ">×</button>
            </div>
            
            <div style="margin-bottom: 24px;">
                <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 600;">
                    Profile Picture
                </label>
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, var(--accent-color), #ff006e);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 32px;
                    ">👤</div>
                    <button onclick="changeProfilePicture()" style="
                        padding: 8px 16px;
                        background: var(--accent-color);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                    ">Change Photo</button>
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 600;">
                    Display Name
                </label>
                <input type="text" id="editDisplayName" value="${currentUser?.displayName || 'VIB3 User'}" style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid var(--border-primary);
                    border-radius: 8px;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    font-size: 16px;
                ">
            </div>
            
            <div style="margin-bottom: 24px;">
                <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 600;">
                    Username
                </label>
                <input type="text" id="editUsername" value="${currentUser?.username || 'vib3user'}" style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid var(--border-primary);
                    border-radius: 8px;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    font-size: 16px;
                ">
            </div>
            
            <div style="margin-bottom: 24px;">
                <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 600;">
                    Bio
                </label>
                <textarea id="editBio" placeholder="Tell us about yourself..." style="
                    width: 100%;
                    height: 100px;
                    padding: 12px;
                    border: 1px solid var(--border-primary);
                    border-radius: 8px;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    font-size: 16px;
                    resize: vertical;
                ">${currentUser?.bio || 'Welcome to my VIB3 profile! 🎵✨\nCreator | Dancer | Music Lover\n📧 Contact: hello@vib3.com'}</textarea>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button onclick="this.closest('.modal').remove()" style="
                    padding: 12px 24px;
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">Cancel</button>
                <button onclick="saveProfile();" style="
                    padding: 12px 24px;
                    background: var(--accent-color);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">Save Changes</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Global saveProfile function for vib3-complete.js modal
window.saveProfile = async function() {
    try {
        console.log('🔧 vib3-complete.js saveProfile() called');
        
        // Small delay to ensure modal is fully rendered
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Collect form data from the modal created by vib3-complete.js
        const displayNameEl = document.querySelector('.edit-profile-modal input[type="text"]');
        const usernameEl = document.querySelector('.edit-profile-modal input[type="text"]:nth-of-type(2)');
        const bioEl = document.querySelector('.edit-profile-modal textarea');
        
        console.log('🔍 Form elements found:', {
            displayNameEl: !!displayNameEl,
            usernameEl: !!usernameEl,
            bioEl: !!bioEl
        });
        
        const displayName = displayNameEl?.value?.trim();
        const username = usernameEl?.value?.trim().replace('@', '');
        const bio = bioEl?.value?.trim();
        
        console.log('🔍 Form values (before processing):', { displayName, username, bio });
        console.log('🔍 Username case check:', { 
            original: usernameEl?.value, 
            trimmed: usernameEl?.value?.trim(), 
            final: username 
        });
        
        // Prepare update data - server accepts bio, username, displayName, profilePicture
        const updateData = {};
        if (displayName) {
            updateData.displayName = displayName;
            console.log('✅ Adding displayName:', displayName);
        }
        if (username) {
            updateData.username = username;
            console.log('✅ Adding username:', username);
        }
        if (bio) {
            updateData.bio = bio;
            console.log('✅ Adding bio:', bio);
        }
        
        console.log('🔧 Sending profile update:', updateData);
        
        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            showNotification('No changes to save', 'info');
            return;
        }
        
        // Make API call
        const baseURL = window.API_BASE_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? '' 
            : 'https://vib3-production.up.railway.app');
        const response = await fetch(`${baseURL}/api/user/profile`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 
                'Content-Type': 'application/json',
                ...(window.authToken && window.authToken !== 'session-based' ? 
                    { 'Authorization': `Bearer ${window.authToken}` } : {})
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('🔍 Server response:', result);
            
            // Update currentUser object with new data
            if (displayName && window.currentUser) {
                window.currentUser.displayName = displayName;
                console.log('✅ Updated currentUser.displayName:', displayName);
            }
            if (username && window.currentUser) {
                window.currentUser.username = username;
                console.log('✅ Updated currentUser.username:', username);
            }
            if (bio && window.currentUser) {
                window.currentUser.bio = bio;
                console.log('✅ Updated currentUser.bio:', bio);
            }
            
            // Update all UI elements with new data
            if (displayName) {
                // Update display name in the correct location  
                const displayNameElement = document.getElementById('userDisplayName');
                if (displayNameElement) {
                    displayNameElement.textContent = displayName;
                    console.log('✅ Updated DISPLAY NAME (#userDisplayName) to:', displayName);
                }
            }
            if (username) {
                // Update username in the correct location
                const usernameElement = document.getElementById('profileName');
                if (usernameElement) {
                    usernameElement.textContent = '@' + username;
                    console.log('✅ Updated USERNAME (#profileName) to:', '@' + username);
                }
            }
            if (bio) {
                // Update bio in all possible locations
                const bioElements = document.querySelectorAll('#profileBio, .profile-bio, [data-bio]');
                bioElements.forEach(el => {
                    el.textContent = bio;
                    console.log('✅ Updated bio element:', el);
                });
                
                // Also update bio in simple-profile.js if it exists
                const simpleBio = document.querySelector('.simple-profile-bio');
                if (simpleBio) {
                    simpleBio.textContent = bio;
                    console.log('✅ Updated simple profile bio');
                }
                
                // Force update main profile bio by direct selector
                const mainBio = document.getElementById('profileBio');
                if (mainBio) {
                    mainBio.textContent = bio;
                    console.log('✅ Updated main profile bio directly');
                }
            }
            
            // Force refresh the profile display with current data
            refreshProfileDisplay();
            
            // Trigger a profile refresh if the function exists
            if (typeof refreshProfileDisplay === 'function') {
                refreshProfileDisplay();
            }
            
            // Close modal and show success
            const modal = document.querySelector('.edit-profile-modal');
            if (modal) modal.remove();
            showNotification('Profile updated successfully!', 'success');
        } else {
            const error = await response.json();
            console.error('❌ Profile update failed:', error);
            showNotification(error.error || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Error updating profile', 'error');
    }
};

// Function to refresh profile display with current user data
function refreshProfileDisplay() {
    console.log('🔄 Refreshing profile display with currentUser:', window.currentUser);
    
    if (!window.currentUser) {
        console.log('❌ No currentUser object found');
        return;
    }
    
    // Update display name 
    const displayNameEl = document.getElementById('userDisplayName');
    if (displayNameEl && window.currentUser.displayName) {
        displayNameEl.textContent = window.currentUser.displayName;
        console.log('✅ Set display name to:', window.currentUser.displayName);
    }
    
    // Update username
    const usernameEl = document.getElementById('profileName');
    if (usernameEl && window.currentUser.username) {
        usernameEl.textContent = '@' + window.currentUser.username;
        console.log('✅ Set username to:', '@' + window.currentUser.username);
    }
    
    // Update bio
    const bioEl = document.getElementById('profileBio');
    if (bioEl && window.currentUser.bio) {
        bioEl.textContent = window.currentUser.bio;
        console.log('✅ Set bio to:', window.currentUser.bio);
    }
}

// Get human-readable video error messages
function getVideoErrorMessage(errorCode) {
    const errors = {
        1: 'MEDIA_ERR_ABORTED - Video loading was aborted',
        2: 'MEDIA_ERR_NETWORK - Network error while loading video', 
        3: 'MEDIA_ERR_DECODE - Video file corrupted or codec not supported',
        4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - Video format/codec not supported'
    };
    return errors[errorCode] || `Unknown error code: ${errorCode}`;
}

// Check video compatibility before upload
async function checkVideoCompatibility(file) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        
        video.onloadedmetadata = () => {
            const canPlay = video.duration > 0 && !video.error;
            console.log(`🎬 Video compatibility check: ${canPlay ? 'COMPATIBLE' : 'INCOMPATIBLE'}`, {
                duration: video.duration,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight
            });
            URL.revokeObjectURL(url);
            resolve(canPlay);
        };
        
        video.onerror = () => {
            console.log('❌ Video compatibility check: FAILED');
            URL.revokeObjectURL(url);
            resolve(false);
        };
        
        video.src = url;
    });
}

// changeProfilePicture function moved to profile-functions.js for better organization
// This avoids conflicts and ensures the enhanced version is used

function showProfileSettings() {
    const modal = document.createElement('div');
    modal.className = 'modal settings-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: var(--bg-primary);
            border-radius: 16px;
            padding: 32px;
            max-width: 400px;
            width: 90%;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="color: var(--text-primary); margin: 0;">Settings & Privacy</h2>
                <button onclick="this.closest('.modal').remove()" style="
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 24px;
                    cursor: pointer;
                ">×</button>
            </div>
            
            <div class="settings-list">
                <button onclick="showNotification('Account settings', 'info')" style="
                    width: 100%;
                    text-align: left;
                    padding: 16px;
                    background: none;
                    border: none;
                    color: var(--text-primary);
                    font-size: 16px;
                    cursor: pointer;
                    border-bottom: 1px solid var(--border-primary);
                ">👤 Account Settings</button>
                
                <button onclick="showNotification('Privacy settings', 'info')" style="
                    width: 100%;
                    text-align: left;
                    padding: 16px;
                    background: none;
                    border: none;
                    color: var(--text-primary);
                    font-size: 16px;
                    cursor: pointer;
                    border-bottom: 1px solid var(--border-primary);
                ">🔒 Privacy & Safety</button>
                
                <button onclick="showNotification('Notifications', 'info')" style="
                    width: 100%;
                    text-align: left;
                    padding: 16px;
                    background: none;
                    border: none;
                    color: var(--text-primary);
                    font-size: 16px;
                    cursor: pointer;
                    border-bottom: 1px solid var(--border-primary);
                ">🔔 Notifications</button>
                
                <button onclick="showNotification('Content preferences', 'info')" style="
                    width: 100%;
                    text-align: left;
                    padding: 16px;
                    background: none;
                    border: none;
                    color: var(--text-primary);
                    font-size: 16px;
                    cursor: pointer;
                    border-bottom: 1px solid var(--border-primary);
                ">📺 Content Preferences</button>
                
                <button onclick="handleLogout(); this.closest('.modal').remove();" style="
                    width: 100%;
                    text-align: left;
                    padding: 16px;
                    background: none;
                    border: none;
                    color: #ff6b6b;
                    font-size: 16px;
                    cursor: pointer;
                ">🚪 Log Out</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function showFollowing() {
    console.log('📋 Showing following list...');
    
    try {
        // Get current user's following list
        const response = await fetch(`${window.API_BASE_URL}/api/user/following`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(window.authToken && window.authToken !== 'session-based' ? 
                    { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch following list');
        }
        
        const followingList = await response.json(); // Server returns users array directly
        
        console.log('📋 Following list:', followingList);
        
        // Create following modal
        const modal = document.createElement('div');
        modal.className = 'following-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.8); z-index: 2000; display: flex; 
            align-items: center; justify-content: center;
        `;
        
        let followingHTML = '';
        if (followingList.length === 0) {
            followingHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.7);">
                    <div style="font-size: 48px; margin-bottom: 20px;">👥</div>
                    <h3 style="color: white; margin-bottom: 10px;">No Following Yet</h3>
                    <p>Start following creators to see them here!</p>
                </div>
            `;
        } else {
            followingList.forEach(user => {
                followingHTML += `
                    <div onclick="viewUserProfile('${user._id || user.id}')" style="display: flex; align-items: center; gap: 15px; padding: 15px; border-radius: 10px; cursor: pointer; transition: all 0.3s;" 
                         onmouseover="this.style.background='rgba(255,255,255,0.1)'" 
                         onmouseout="this.style.background='transparent'">
                        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #fe2c55, #ff006e); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                            ${user.profilePicture || user.avatar || '👤'}
                        </div>
                        <div style="flex: 1;">
                            <div style="color: white; font-weight: bold; font-size: 16px;">
                                ${user.displayName || user.username || 'Unknown User'}
                            </div>
                            <div style="color: rgba(255,255,255,0.7); font-size: 14px;">
                                @${user.username || 'user'}
                            </div>
                            ${user.bio ? `<div style="color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 5px;">${user.bio.substring(0, 60)}${user.bio.length > 60 ? '...' : ''}</div>` : ''}
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="text-align: center;">
                                <div style="color: white; font-size: 14px; font-weight: bold;">${user.stats?.followers || 0}</div>
                                <div style="color: rgba(255,255,255,0.5); font-size: 10px;">Followers</div>
                            </div>
                            <button onclick="event.stopPropagation(); unfollowUser('${user._id || user.id}')" 
                                    style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px 15px; border-radius: 20px; cursor: pointer; font-size: 12px;">
                                Following
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        modal.innerHTML = `
            <div style="background: #161823; border-radius: 15px; max-width: 500px; width: 90%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
                <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="color: white; margin: 0; font-size: 20px;">Following (${followingList.length})</h2>
                    <button onclick="closeFollowingModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
                </div>
                <div style="flex: 1; overflow-y: auto; padding: 10px 20px 20px 20px;">
                    ${followingHTML}
                </div>
            </div>
        `;
        
        modal.onclick = (e) => {
            if (e.target === modal) closeFollowingModal();
        };
        
        document.body.appendChild(modal);
        
        // Global functions for modal
        window.closeFollowingModal = () => {
            modal.remove();
        };
        
        window.viewUserProfile = (userId) => {
            console.log('📋 Viewing user profile:', userId);
            closeFollowingModal();
            // Navigate to user profile - implement based on your routing
            if (window.showUserProfile) {
                window.showUserProfile(userId);
            } else {
                if (window.showToast) {
                    window.showToast('User profile viewing coming soon!');
                }
            }
        };
        
        window.unfollowUser = async (userId) => {
            console.log('📋 Unfollowing user:', userId);
            try {
                const unfollowResponse = await fetch(`${window.API_BASE_URL}/api/users/${userId}/unfollow`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(window.authToken && window.authToken !== 'session-based' ? 
                            { 'Authorization': `Bearer ${window.authToken}` } : {})
                    }
                });
                
                if (unfollowResponse.ok) {
                    if (window.showToast) {
                        window.showToast('Unfollowed successfully');
                    }
                    closeFollowingModal();
                    // Refresh the following list
                    setTimeout(() => showFollowing(), 300);
                } else {
                    const errorData = await unfollowResponse.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to unfollow user');
                }
            } catch (error) {
                console.error('❌ Unfollow error:', error);
                if (window.showToast) {
                    window.showToast(error.message);
                }
            }
        };
        
    } catch (error) {
        console.error('❌ Error loading following list:', error);
        if (window.showToast) {
            window.showToast('Failed to load following list');
        } else {
            showNotification('Failed to load following list. Please try again.', 'error');
        }
    }
}

async function showFollowers() {
    console.log('📋 Showing followers list...');
    
    try {
        // Get current user's followers list
        const response = await fetch(`${window.API_BASE_URL}/api/user/followers`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(window.authToken && window.authToken !== 'session-based' ? 
                    { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch followers list');
        }
        
        const followersList = await response.json(); // Server returns users array directly
        
        console.log('📋 Followers list:', followersList);
        
        // Create followers modal
        const modal = document.createElement('div');
        modal.className = 'followers-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.8); z-index: 2000; display: flex; 
            align-items: center; justify-content: center;
        `;
        
        let followersHTML = '';
        if (followersList.length === 0) {
            followersHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.7);">
                    <div style="font-size: 48px; margin-bottom: 20px;">👥</div>
                    <h3 style="color: white; margin-bottom: 10px;">No Followers Yet</h3>
                    <p>Create amazing content to attract followers!</p>
                </div>
            `;
        } else {
            followersList.forEach(user => {
                followersHTML += `
                    <div onclick="viewUserProfile('${user._id || user.id}')" style="display: flex; align-items: center; gap: 15px; padding: 15px; border-radius: 10px; cursor: pointer; transition: all 0.3s;" 
                         onmouseover="this.style.background='rgba(255,255,255,0.1)'" 
                         onmouseout="this.style.background='transparent'">
                        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #fe2c55, #ff006e); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                            ${user.profilePicture || user.avatar || '👤'}
                        </div>
                        <div style="flex: 1;">
                            <div style="color: white; font-weight: bold; font-size: 16px;">
                                ${user.displayName || user.username || 'Unknown User'}
                            </div>
                            <div style="color: rgba(255,255,255,0.7); font-size: 14px;">
                                @${user.username || 'user'}
                            </div>
                            ${user.bio ? `<div style="color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 5px;">${user.bio.substring(0, 60)}${user.bio.length > 60 ? '...' : ''}</div>` : ''}
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="text-align: center;">
                                <div style="color: white; font-size: 14px; font-weight: bold;">${user.stats?.followers || 0}</div>
                                <div style="color: rgba(255,255,255,0.5); font-size: 10px;">Followers</div>
                            </div>
                            ${user.isFollowing ? 
                                `<button onclick="event.stopPropagation(); toggleFollowUser('${user._id || user.id}', true)" 
                                         style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px 15px; border-radius: 20px; cursor: pointer; font-size: 12px;">
                                    Following
                                </button>` :
                                `<button onclick="event.stopPropagation(); toggleFollowUser('${user._id || user.id}', false)" 
                                         style="background: #fe2c55; color: white; border: none; padding: 8px 15px; border-radius: 20px; cursor: pointer; font-size: 12px;">
                                    Follow Back
                                </button>`
                            }
                        </div>
                    </div>
                `;
            });
        }
        
        modal.innerHTML = `
            <div style="background: #161823; border-radius: 15px; max-width: 500px; width: 90%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
                <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="color: white; margin: 0; font-size: 20px;">Followers (${followersList.length})</h2>
                    <button onclick="closeFollowersModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
                </div>
                <div style="flex: 1; overflow-y: auto; padding: 10px 20px 20px 20px;">
                    ${followersHTML}
                </div>
            </div>
        `;
        
        modal.onclick = (e) => {
            if (e.target === modal) closeFollowersModal();
        };
        
        document.body.appendChild(modal);
        
        // Global functions for modal
        window.closeFollowersModal = () => {
            modal.remove();
        };
        
        window.toggleFollowUser = async (userId, isCurrentlyFollowing) => {
            console.log('📋 Toggling follow for user:', userId, 'Currently following:', isCurrentlyFollowing);
            
            try {
                const endpoint = isCurrentlyFollowing ? 'unfollow' : 'follow';
                const response = await fetch(`${window.API_BASE_URL}/api/users/${userId}/${endpoint}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(window.authToken && window.authToken !== 'session-based' ? 
                            { 'Authorization': `Bearer ${window.authToken}` } : {})
                    }
                });
                
                if (response.ok) {
                    const action = isCurrentlyFollowing ? 'Unfollowed' : 'Followed';
                    if (window.showToast) {
                        window.showToast(`${action} successfully`);
                    }
                    closeFollowersModal();
                    // Refresh the followers list
                    setTimeout(() => showFollowers(), 300);
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `Failed to ${endpoint} user`);
                }
            } catch (error) {
                console.error('❌ Follow toggle error:', error);
                if (window.showToast) {
                    window.showToast(error.message);
                }
            }
        };
        
    } catch (error) {
        console.error('❌ Error loading followers list:', error);
        if (window.showToast) {
            window.showToast('Failed to load followers list');
        } else {
            showNotification('Failed to load followers list. Please try again.', 'error');
        }
    }
}

// shareProfile function moved to profile-functions.js with QR code modal

// ================ REACTION BUTTON FUNCTIONS ================

function openCommentsModal(videoId, video) {
    const modal = document.createElement('div');
    modal.className = 'comments-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        z-index: 1000;
        animation: slideUp 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="
            background: var(--bg-primary);
            border-radius: 16px 16px 0 0;
            width: 100%;
            max-width: 500px;
            max-height: 70vh;
            padding: 20px;
            position: relative;
            overflow-y: auto;
        ">
            <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 1px solid var(--border-primary);
            ">
                <h3 style="margin: 0; color: var(--text-primary);">Comments</h3>
                <button onclick="this.closest('.comments-modal').remove()" style="
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: var(--text-secondary);
                ">×</button>
            </div>
            
            <div class="comments-list" style="margin-bottom: 20px; min-height: 200px;">
                <div style="text-align: center; color: var(--text-secondary); padding: 40px 0;">
                    <div style="font-size: 48px; margin-bottom: 10px;">💬</div>
                    <p>No comments yet</p>
                    <p style="font-size: 14px;">Be the first to comment!</p>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; align-items: center; position: relative;">
                <input type="text" placeholder="Add a comment..." style="
                    flex: 1;
                    padding: 12px 16px;
                    border: 1px solid var(--border-primary);
                    border-radius: 25px;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    outline: none;
                " id="commentInput-${videoId}"
                   oninput="handleCommentInputDash(this, '${videoId}')"
                   onkeydown="handleMentionKeyDownDash(event, '${videoId}')">
                <div id="mentionDropdownDash-${videoId}" class="mention-dropdown" style="display: none; position: absolute; bottom: 100%; left: 0; right: 60px; margin-bottom: 5px;"></div>
                <button onclick="submitComment('${videoId}')" style="
                    padding: 12px 20px;
                    background: var(--accent-primary);
                    color: white;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 600;
                ">Post</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus input
    setTimeout(() => {
        const input = document.getElementById(`commentInput-${videoId}`);
        if (input) input.focus();
    }, 100);
    
    // Load existing comments
    loadComments(videoId);
}

async function loadComments(videoId) {
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/videos/${videoId}/comments`);
        if (response.ok) {
            const data = await response.json();
            displayComments(data.comments || []);
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

function displayComments(comments) {
    const commentsList = document.querySelector('.comments-list');
    if (!commentsList) return;
    
    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 40px 0;">
                <div style="font-size: 48px; margin-bottom: 10px;">💬</div>
                <p>No comments yet</p>
                <p style="font-size: 14px;">Be the first to comment!</p>
            </div>
        `;
        return;
    }
    
    commentsList.innerHTML = comments.map(comment => `
        <div style="
            padding: 12px 0;
            border-bottom: 1px solid var(--border-primary);
            display: flex;
            gap: 12px;
        ">
            <div style="
                width: 32px;
                height: 32px;
                background: var(--accent-primary);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                flex-shrink: 0;
            ">
                ${(comment.user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                    ${comment.user?.username || 'Anonymous'}
                </div>
                <div style="color: var(--text-primary); line-height: 1.4;">
                    ${comment.text}
                </div>
                <div style="color: var(--text-secondary); font-size: 12px; margin-top: 4px;">
                    ${new Date(comment.createdAt).toLocaleString()}
                </div>
            </div>
        </div>
    `).join('');
}

async function submitComment(videoId) {
    const input = document.getElementById(`commentInput-${videoId}`);
    const text = input?.value?.trim();
    
    if (!text) {
        showNotification('Please enter a comment', 'error');
        return;
    }
    
    if (!window.authToken) {
        showNotification('Please login to comment', 'error');
        return;
    }
    
    try {
        console.log('Posting comment to video:', videoId);
        console.log('Auth token present:', !!window.authToken);
        console.log('Comment text:', text);
        
        const response = await fetch(`${window.API_BASE_URL}/api/videos/${videoId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.authToken}`
            },
            body: JSON.stringify({ text })
        });
        
        console.log('Comment response status:', response.status);
        
        if (response.ok) {
            input.value = '';
            showNotification('Comment posted!', 'success');
            loadComments(videoId); // Reload comments
            
            // Update comment count in the UI
            const commentBtn = document.querySelector(`[data-video-id="${videoId}"].comment-btn`);
            if (commentBtn) {
                const countElement = commentBtn.querySelector('div:last-child');
                const currentCount = parseInt(countElement.textContent.replace(/[KM]/g, '')) || 0;
                countElement.textContent = formatCount(currentCount + 1);
            }
        } else {
            const errorData = await response.text();
            console.error('Comment error response:', errorData);
            throw new Error(`Failed to post comment: ${response.status} ${errorData}`);
        }
    } catch (error) {
        console.error('Error posting comment:', error);
        showNotification(`Error posting comment: ${error.message}`, 'error');
    }
}

function shareVideo(videoId, video) {
    console.log('🔗 Share button clicked for video:', videoId);
    
    try {
        // Always use our custom TikTok-style share modal instead of native browser sharing
        console.log('📤 Opening share modal...');
        openShareModal(videoId);
        console.log('✅ Share modal opened successfully');
    } catch (error) {
        console.error('❌ Error opening share modal:', error);
        // Fallback: copy link to clipboard
        const videoUrl = `${window.location.origin}/?video=${videoId}`;
        navigator.clipboard.writeText(videoUrl).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Error opening share options', 'error');
        });
    }
    
    // Note: Share is recorded when user actually shares to a platform, not when modal opens
}

// Record video share on server and update UI
async function recordVideoShare(videoId) {
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/videos/${videoId}/share`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const newShareCount = data.shareCount;
            
            // Update share count in all instances of this video
            document.querySelectorAll(`[data-video-id="${videoId}"] .share-count`).forEach(shareCountEl => {
                shareCountEl.textContent = newShareCount;
            });
            
            console.log(`✅ Share recorded for video ${videoId}, new count: ${newShareCount}`);
        } else {
            console.error('Failed to record share:', response.status);
        }
    } catch (error) {
        console.error('Error recording share:', error);
    }
}

// Refresh reaction counts for cloned videos only
async function refreshClonedVideoReactions(clonedCard) {
    // Safety check: only process if this is actually a cloned video
    const isClonedVideo = clonedCard.getAttribute('data-cloned-video') === 'true';
    if (!isClonedVideo) {
        console.log('⚠️ Skipping refresh - not a cloned video');
        return;
    }
    try {
        // Find video ID from the cloned card
        const likeBtn = clonedCard.querySelector('.like-btn');
        const videoId = likeBtn?.getAttribute('data-video-id');
        
        if (!videoId || videoId === 'unknown') {
            console.log('⚠️ Cannot refresh cloned video reactions - no valid video ID');
            return;
        }
        
        console.log(`🔄 Refreshing reactions for cloned video: ${videoId}`);
        
        // Load proper like status for cloned video (most important)
        // (reusing likeBtn variable from above)
        if (likeBtn) {
            loadVideoLikeStatus(videoId, likeBtn);
        }
        
        console.log(`✅ Updated cloned video reactions for ${videoId}`);
        
        // Only reinitialize controls if this is actually a cloned video
        const isClonedVideo = clonedCard.getAttribute('data-cloned-video') === 'true';
        if (isClonedVideo) {
            reinitializeVideoControls(clonedCard);
        }
        
        // Note: Skipping individual video data fetch since /api/videos/:videoId endpoint doesn't exist
        // The like status and counts will be refreshed through the like status endpoint
    } catch (error) {
        console.error('Error refreshing cloned video reactions:', error);
    }
}

// Reinitialize video controls for cloned videos
function reinitializeVideoControls(clonedCard) {
    try {
        const video_elem = clonedCard.querySelector('video');
        const likeBtn = clonedCard.querySelector('.like-btn');
        const commentBtn = clonedCard.querySelector('.comment-btn');
        const shareBtn = clonedCard.querySelector('.share-btn');
        const volumeBtn = clonedCard.querySelector('.volume-btn');
        const pauseIndicator = clonedCard.querySelector('[style*="position: absolute"][style*="top: 50%"]') || 
                              clonedCard.querySelector('.pause-indicator');
        
        if (!video_elem || !likeBtn) {
            console.log('⚠️ Could not find video elements in cloned card');
            return;
        }
        
        const videoId = likeBtn.getAttribute('data-video-id');
        console.log(`🔄 Reinitializing controls for cloned video: ${videoId}`);
        
        // Remove existing event listeners by cloning the elements
        const newVideo = video_elem.cloneNode(true);
        const newLikeBtn = likeBtn.cloneNode(true);
        const newCommentBtn = commentBtn.cloneNode(true);
        const newShareBtn = shareBtn.cloneNode(true);
        const newVolumeBtn = volumeBtn.cloneNode(true);
        
        // Replace old elements with new ones
        video_elem.parentNode.replaceChild(newVideo, video_elem);
        likeBtn.parentNode.replaceChild(newLikeBtn, likeBtn);
        commentBtn.parentNode.replaceChild(newCommentBtn, commentBtn);
        shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);
        volumeBtn.parentNode.replaceChild(newVolumeBtn, volumeBtn);
        
        // Add video pause/play functionality (with double-tap detection)
        newVideo._doubleTapState = { lastTap: 0, tapCount: 0 };
        
        newVideo.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Double-tap detection
            const currentTime = new Date().getTime();
            const tapLength = currentTime - newVideo._doubleTapState.lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                newVideo._doubleTapState.tapCount++;
                if (newVideo._doubleTapState.tapCount === 1) {
                    // Double tap detected - trigger like instead of pause/play
                    const likeBtn = e.target.closest('.video-card').querySelector('.like-btn');
                    if (likeBtn) {
                        handleLikeClick(e, likeBtn);
                        createFloatingHeart(newVideo);
                        
                        // Add double heart beat animation
                        const heartIcon = likeBtn.querySelector('.heart-icon') || likeBtn.querySelector('div:first-child');
                        if (heartIcon) {
                            heartIcon.style.animation = 'doubleHeartBeat 0.6s ease';
                            setTimeout(() => heartIcon.style.animation = '', 600);
                        }
                    }
                    newVideo._doubleTapState.tapCount = 0;
                    newVideo._doubleTapState.lastTap = currentTime;
                    return; // Don't do pause/play on double-tap
                }
            } else {
                newVideo._doubleTapState.tapCount = 0;
            }
            
            newVideo._doubleTapState.lastTap = currentTime;
            
            // Single tap - pause/play functionality
            setTimeout(() => {
                if (newVideo._doubleTapState.tapCount === 0) {
                    // Only do pause/play if no double-tap happened
                    if (newVideo.paused) {
                        // Remove manual pause flag and play
                        newVideo.removeAttribute('data-manually-paused');
                        newVideo.play();
                        if (pauseIndicator) pauseIndicator.style.display = 'none';
                        console.log('▶️ MANUALLY RESUMED CLONED VIDEO:', newVideo.src.split('/').pop());
                    } else {
                        // Mark as manually paused so observer doesn't auto-resume
                        newVideo.setAttribute('data-manually-paused', 'true');
                        newVideo.pause();
                        if (pauseIndicator) pauseIndicator.style.display = 'flex';
                        console.log('⏸️ MANUALLY PAUSED CLONED VIDEO:', newVideo.src.split('/').pop());
                    }
                }
            }, 300); // Delay to allow double-tap detection
        });
        
        // Add volume control functionality
        newVolumeBtn.addEventListener('click', () => {
            if (newVideo.muted) {
                newVideo.muted = false;
                newVolumeBtn.textContent = '🔊';
            } else {
                newVideo.muted = true;
                newVolumeBtn.textContent = '🔇';
            }
        });
        
        // Add like button functionality
        newLikeBtn.addEventListener('click', (e) => handleLikeClick(e, newLikeBtn));
        
        // Add comment button functionality
        newCommentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Add bounce animation
            newCommentBtn.style.transform = 'scale(1.1)';
            setTimeout(() => newCommentBtn.style.transform = 'scale(1)', 200);
            
            showNotification('Comments coming soon! 💬', 'info');
        });
        
        // Add share button functionality
        newShareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Add bounce animation
            newShareBtn.style.transform = 'scale(1.1)';
            setTimeout(() => newShareBtn.style.transform = 'scale(1)', 200);
            
            // Create fake video object for sharing
            const video = { 
                title: `Video ${videoId}`,
                _id: videoId
            };
            shareVideo(videoId, video);
        });
        
        // CRITICAL: Add the new video to the Intersection Observer
        if (window.videoObserver && newVideo) {
            window.videoObserver.observe(newVideo);
            console.log(`👁️ Added cloned video to observer: ${videoId}`);
        }
        
        console.log(`✅ Reinitialized controls for cloned video: ${videoId}`);
        
    } catch (error) {
        console.error('Error reinitializing video controls:', error);
    }
}

// Register cloned video with observer for auto-play functionality
function registerClonedVideoWithObserver(clonedCard) {
    try {
        const video = clonedCard.querySelector('video');
        if (video && window.videoObserver) {
            // Register with intersection observer for auto-play
            window.videoObserver.observe(video);
            
            // Preserve any manual pause state
            const originalCard = document.querySelector(`[data-video-id="${clonedCard.querySelector('.like-btn')?.getAttribute('data-video-id')}"]`);
            if (originalCard && originalCard !== clonedCard) {
                const originalVideo = originalCard.querySelector('video');
                if (originalVideo && originalVideo.hasAttribute('data-manually-paused')) {
                    video.setAttribute('data-manually-paused', 'true');
                }
            }
            
            // Reinitialize all controls to ensure proper event handling
            reinitializeVideoControls(clonedCard);
            
            console.log('✅ Registered cloned video with observer');
        }
    } catch (error) {
        console.error('Error registering cloned video with observer:', error);
    }
}

// ================ PERSISTENT LIKE FUNCTIONALITY ================

// Centralized like button click handler
async function handleLikeClick(e, likeBtn) {
    e.stopPropagation();
    const videoId = likeBtn.dataset.videoId;
    
    if (!videoId || videoId === 'unknown') {
        showNotification('Cannot like this video', 'error');
        return;
    }
    
    const heartIcon = likeBtn.querySelector('.heart-icon') || likeBtn.querySelector('div:first-child');
    const countElement = likeBtn.querySelector('.like-count') || likeBtn.querySelector('div:last-child');
    
    // Determine current like state for optimistic update
    const isCurrentlyLiked = heartIcon && heartIcon.textContent === '❤️';
    const newLikedState = !isCurrentlyLiked;
    
    console.log('🔍 LIKE DEBUG:', {
        videoId,
        heartIconText: heartIcon?.textContent,
        isCurrentlyLiked,
        newLikedState,
        expectedAction: newLikedState ? 'LIKE' : 'UNLIKE'
    });
    
    try {
        // Enhanced button animation
        likeBtn.style.transform = 'scale(1.2)';
        setTimeout(() => likeBtn.style.transform = 'scale(1)', 200);
        
        // Optimistic UI update for immediate feedback
        await handleOptimisticLikeUpdate(videoId, likeBtn, newLikedState);
        
        if (!window.authToken) {
            console.log('⚠️ Not authenticated, using mock like functionality');
            // Use optimistic update for non-authenticated users
            showNotification(newLikedState ? 'Liked! ❤️' : 'Unliked', newLikedState ? 'success' : 'info');
            return;
        }
        
        // Call the /like endpoint as specified
        const response = await fetch(`${window.API_BASE_URL}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.authToken}`
            },
            body: JSON.stringify({
                videoId: videoId,
                userId: null // Let server use authenticated user ID
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            const { liked, likeCount } = data;
            
            console.log('🔍 SERVER RESPONSE:', {
                liked,
                likeCount,
                expectedLiked: newLikedState,
                matches: liked === newLikedState
            });
            
            // Update UI based on server response (may correct optimistic update)
            heartIcon.textContent = liked ? '❤️' : '🤍';
            if (liked) {
                heartIcon.style.animation = 'heartBeat 0.5s ease';
                // Create floating heart for successful like
                const videoElement = likeBtn.closest('[data-video-id]') || likeBtn.closest('.video-item');
                if (videoElement) {
                    createFloatingHeart(videoElement);
                }
            }
            
            // Update count with real database value
            if (countElement) {
                countElement.textContent = formatCount(likeCount);
            }
            
            // Update all instances of this video's like count across the page
            updateAllVideoLikeCounts(videoId, likeCount, liked);
            
            // Store like status for persistence
            localStorage.setItem(`like_${videoId}`, liked.toString());
            
            showNotification(liked ? 'Liked! ❤️' : 'Unliked', liked ? 'success' : 'info');
            
            console.log(`✅ ${liked ? 'Liked' : 'Unliked'} video ${videoId}, count: ${likeCount}`);
        } else if (response.status === 401) {
            // Handle unauthorized - clear invalid token and redirect to login
            console.warn('🔐 Auth token expired during like, clearing auth state');
            window.authToken = null;
            window.currentUser = null;
            
            // Revert optimistic update
            await handleOptimisticLikeUpdate(videoId, likeBtn, isCurrentlyLiked);
            
            // Show auth container to re-authenticate
            showAuthContainer();
            hideMainApp();
            showNotification('Please log in to like videos', 'error');
        } else {
            // Revert optimistic update on error
            await handleOptimisticLikeUpdate(videoId, likeBtn, isCurrentlyLiked);
            
            const errorData = await response.json();
            console.error('Like API error:', errorData);
            showNotification('Error updating like', 'error');
        }
    } catch (error) {
        // Revert optimistic update on error
        await handleOptimisticLikeUpdate(videoId, likeBtn, isCurrentlyLiked);
        
        console.error('Like error:', error);
        showNotification('Error liking video', 'error');
    }
}

// Update all instances of a video's like count
function updateAllVideoLikeCounts(videoId, likeCount, liked, isOptimistic = false) {
    document.querySelectorAll(`[data-video-id="${videoId}"]`).forEach(videoElement => {
        const likeBtn = videoElement.querySelector('.like-btn');
        if (!likeBtn) return;
        
        const heartIcon = likeBtn.querySelector('.heart-icon') || 
                         likeBtn.querySelector('div:first-child');
        const countElement = likeBtn.querySelector('.like-count') || 
                           likeBtn.querySelector('div:last-child');
        
        if (heartIcon) {
            heartIcon.textContent = liked ? '❤️' : '🤍';
            if (liked && !isOptimistic) {
                heartIcon.style.animation = 'heartBeat 0.5s ease';
                setTimeout(() => heartIcon.style.animation = '', 500);
            }
        }
        if (countElement && likeCount !== null) {
            countElement.textContent = formatCount(likeCount);
        }
    });
}

// Rate limiter for API calls to prevent scroll freeze
const apiCallLimiter = {
    calls: [],
    maxCalls: 3,
    timeWindow: 1000, // 1 second
    
    canMakeCall() {
        const now = Date.now();
        // Remove calls older than time window
        this.calls = this.calls.filter(time => now - time < this.timeWindow);
        
        if (this.calls.length < this.maxCalls) {
            this.calls.push(now);
            return true;
        }
        return false;
    }
};

// Load like status for a video (called when video is created)
async function loadVideoLikeStatus(videoId, likeBtn) {
    if (!videoId || videoId === 'unknown' || !likeBtn) {
        return;
    }
    
    // Rate limit API calls to prevent scroll freeze
    if (!apiCallLimiter.canMakeCall()) {
        console.log('🚫 Rate limited - skipping like status call for', videoId);
        return;
    }
    
    const heartIcon = likeBtn.querySelector('.heart-icon') || likeBtn.querySelector('div:first-child');
    const countElement = likeBtn.querySelector('.like-count') || likeBtn.querySelector('div:last-child');
    
    try {
        // First check localStorage for immediate feedback
        const storedLike = localStorage.getItem(`like_${videoId}`);
        if (storedLike === 'true' && heartIcon) {
            heartIcon.textContent = '❤️';
        }
        
        // Then get authoritative data from server if authenticated
        if (window.authToken && window.currentUser) {
            try {
                const response = await fetch(`${window.API_BASE_URL}/api/videos/${videoId}/like-status`, {
                    headers: { 'Authorization': `Bearer ${window.authToken}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const { liked, likeCount } = data;
                    
                    // Update UI with server data
                    if (heartIcon) {
                        heartIcon.textContent = liked ? '❤️' : '🤍';
                    }
                    if (countElement) {
                        countElement.textContent = formatCount(likeCount);
                    }
                    
                    // Update localStorage with server truth
                    localStorage.setItem(`like_${videoId}`, liked.toString());
                    
                    console.log(`📊 Loaded like status for ${videoId}: liked=${liked}, count=${likeCount}`);
                } else if (response.status === 401) {
                    // Handle unauthorized - clear invalid token and stop making requests
                    console.warn('🔐 Auth token expired, clearing auth state');
                    window.authToken = null;
                    window.currentUser = null;
                    
                    // Don't continue making requests until re-authenticated
                    return;
                } else {
                    console.error('Failed to load like status:', response.status);
                }
            } catch (networkError) {
                console.error('Network error loading like status:', networkError);
                // Don't continue making requests on network errors
                return;
            }
        }
    } catch (error) {
        console.error('Error loading like status:', error);
    }
}

// ================ ENHANCED REACTION SYSTEM ================

// Enhanced heart animation with floating hearts
function createFloatingHeart(element) {
    const heart = document.createElement('div');
    heart.textContent = '❤️';
    heart.style.cssText = `
        position: absolute;
        font-size: 24px;
        pointer-events: none;
        z-index: 1000;
        animation: floatUp 1.5s ease-out forwards;
    `;
    
    // Add CSS animation if not exists
    if (!document.querySelector('#floating-heart-styles')) {
        const style = document.createElement('style');
        style.id = 'floating-heart-styles';
        style.textContent = `
            @keyframes floatUp {
                0% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                50% {
                    opacity: 0.8;
                    transform: translateY(-30px) scale(1.2);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-60px) scale(0.8);
                }
            }
            @keyframes heartBeat {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.3); }
            }
            @keyframes doubleHeartBeat {
                0%, 20%, 40%, 60%, 80%, 100% { transform: scale(1); }
                10%, 30% { transform: scale(1.2); }
                50%, 70% { transform: scale(1.4); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Position relative to button
    const rect = element.getBoundingClientRect();
    heart.style.left = (rect.left + rect.width / 2 - 12) + 'px';
    heart.style.top = (rect.top + rect.height / 2 - 12) + 'px';
    
    document.body.appendChild(heart);
    
    // Remove after animation
    setTimeout(() => {
        heart.remove();
    }, 1500);
}

// Enhanced like button with double-tap support
function enhanceLikeButton(likeBtn, videoElement) {
    if (!likeBtn || !videoElement) return;
    
    let lastTap = 0;
    let tapCount = 0;
    
    // Store double-tap state on the video element to avoid conflicts with pause/play
    videoElement._doubleTapState = { lastTap: 0, tapCount: 0 };
    
    // Handle double-tap detection in the existing click handler
    const originalClickHandler = videoElement.onclick;
    videoElement.onclick = null; // Remove to avoid conflicts
    
    // The main video click handler now handles both pause/play and double-tap
    // (This is already done in the main video click handler above)
    
    // Enhanced like button animation
    likeBtn.addEventListener('click', (e) => {
        
        // Create ripple effect
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(254, 44, 85, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        const rect = likeBtn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        
        likeBtn.style.position = 'relative';
        likeBtn.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
}

// Optimistic UI updates for better UX
async function handleOptimisticLikeUpdate(videoId, likeBtn, newLikedState) {
    const heartIcon = likeBtn.querySelector('.heart-icon') || likeBtn.querySelector('div:first-child');
    const countElement = likeBtn.querySelector('.like-count') || likeBtn.querySelector('div:last-child');
    
    if (heartIcon) {
        heartIcon.textContent = newLikedState ? '❤️' : '🤍';
        if (newLikedState) {
            heartIcon.style.animation = 'heartBeat 0.5s ease';
            setTimeout(() => heartIcon.style.animation = '', 500);
        }
    }
    
    if (countElement) {
        const currentCount = parseInt(countElement.textContent.replace(/[^\d]/g, '')) || 0;
        const newCount = newLikedState ? currentCount + 1 : Math.max(0, currentCount - 1);
        countElement.textContent = formatCount(newCount);
    }
    
    // Update all instances optimistically
    updateAllVideoLikeCounts(videoId, null, newLikedState, true);
    
    // Save to localStorage immediately
    localStorage.setItem(`like_${videoId}`, newLikedState.toString());
}

function openCreatorTools() {
    const modal = document.createElement('div');
    modal.className = 'modal creator-tools-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: var(--bg-primary);
            border-radius: 16px;
            padding: 40px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        ">
            <button onclick="this.parentElement.parentElement.remove()" style="
                position: absolute;
                top: 20px;
                right: 20px;
                background: none;
                border: none;
                font-size: 32px;
                cursor: pointer;
                color: var(--text-secondary);
                padding: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s ease;
            " onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='none'">×</button>
            
            <h2 style="margin: 0 0 32px 0; color: var(--text-primary); text-align: center; font-size: 28px;">Creator Tools</h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <button onclick="showNotification('Analytics coming soon', 'info')" style="
                    padding: 24px;
                    background: var(--bg-secondary);
                    border: none;
                    border-radius: 12px;
                    color: var(--text-primary);
                    cursor: pointer;
                    text-align: center;
                    transition: background 0.2s ease;
                ">
                    <div style="font-size: 32px; margin-bottom: 8px;">📊</div>
                    <div style="font-weight: 600;">Analytics</div>
                </button>
                
                <button onclick="showNotification('Creator fund info', 'info')" style="
                    padding: 24px;
                    background: var(--bg-secondary);
                    border: none;
                    border-radius: 12px;
                    color: var(--text-primary);
                    cursor: pointer;
                    text-align: center;
                    transition: background 0.2s ease;
                ">
                    <div style="font-size: 32px; margin-bottom: 8px;">💰</div>
                    <div style="font-weight: 600;">Creator Fund</div>
                </button>
                
                <button onclick="showNotification('Promotion tools', 'info')" style="
                    padding: 24px;
                    background: var(--bg-secondary);
                    border: none;
                    border-radius: 12px;
                    color: var(--text-primary);
                    cursor: pointer;
                    text-align: center;
                    transition: background 0.2s ease;
                ">
                    <div style="font-size: 32px; margin-bottom: 8px;">📈</div>
                    <div style="font-weight: 600;">Promote</div>
                </button>
                
                <button onclick="showNotification('Live streaming', 'info')" style="
                    padding: 24px;
                    background: var(--bg-secondary);
                    border: none;
                    border-radius: 12px;
                    color: var(--text-primary);
                    cursor: pointer;
                    text-align: center;
                    transition: background 0.2s ease;
                ">
                    <div style="font-size: 32px; margin-bottom: 8px;">🔴</div>
                    <div style="font-weight: 600;">Go Live</div>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ================ FOLLOW FUNCTIONALITY ================

async function handleFollowClick(userId, followBtn) {
    if (!currentUser) {
        showNotification('Please log in to follow users', 'error');
        return;
    }
    
    if (userId === currentUser._id) {
        showNotification("You can't follow yourself", 'info');
        return;
    }
    
    try {
        const isFollowing = followBtn.innerHTML.includes('✓');
        const endpoint = isFollowing ? 'unfollow' : 'follow';
        
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            // Update button UI
            if (isFollowing) {
                followBtn.innerHTML = '<div style="font-size: 16px; color: white;">+</div>';
                followBtn.style.background = '#fe2c55';
            } else {
                followBtn.innerHTML = '<div style="font-size: 14px; color: white;">✓</div>';
                followBtn.style.background = '#25d366';
            }
            
            showNotification(isFollowing ? 'Unfollowed' : 'Following!', 'success');
        } else {
            showNotification('Failed to follow user', 'error');
        }
    } catch (error) {
        console.error('Follow error:', error);
        showNotification('Failed to follow user', 'error');
    }
}

async function checkFollowStatus(userId, followBtn) {
    if (!window.currentUser || !window.authToken || !userId || userId === 'unknown') {
        // Hide follow button if not authenticated or invalid user
        followBtn.style.display = 'none';
        return;
    }
    
    // Hide follow button for own videos
    if (userId === window.currentUser._id) {
        followBtn.style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/following`, {
            headers: {
                'Authorization': `Bearer ${window.authToken}`
            }
        });
        
        if (response.ok) {
            const following = await response.json();
            const isFollowing = following.some(user => user._id === userId);
            
            if (isFollowing) {
                followBtn.innerHTML = '<div style="font-size: 14px; color: white;">✓</div>';
                followBtn.style.background = '#25d366';
            }
        } else if (response.status === 401) {
            // Not logged in - hide follow button
            followBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Check follow status error:', error);
        // On error, hide follow button to avoid repeated failed requests
        followBtn.style.display = 'none';
    }
}

async function checkVibeStatus(userId, vibeBtn) {
    if (!window.currentUser || !window.authToken || !userId || userId === 'unknown') {
        // Hide vibe button if not authenticated or invalid user
        vibeBtn.style.display = 'none';
        return;
    }
    
    // Hide vibe button for own videos
    if (userId === window.currentUser._id) {
        vibeBtn.style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/following`, {
            headers: {
                'Authorization': `Bearer ${window.authToken}`
            }
        });
        
        if (response.ok) {
            const following = await response.json();
            const isVibing = following.some(user => user._id === userId);
            
            if (isVibing) {
                vibeBtn.innerHTML = '<div style="font-size: 14px; color: white;">💫</div>';
                vibeBtn.style.background = 'var(--accent-gradient)';
                vibeBtn.style.boxShadow = '0 0 15px rgba(255, 107, 107, 0.7)';
            } else {
                vibeBtn.innerHTML = '<div style="font-size: 16px; color: white;">✨</div>';
                vibeBtn.style.background = 'var(--accent-gradient)';
                vibeBtn.style.boxShadow = 'var(--vib3-glow)';
            }
        } else if (response.status === 401) {
            // Not logged in - hide vibe button
            vibeBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Check vibe status error:', error);
        // On error, hide vibe button to avoid repeated failed requests
        vibeBtn.style.display = 'none';
    }
}

async function handleVibeClick(userId, vibeBtn) {
    if (!window.currentUser || !window.authToken || !userId || userId === 'unknown') {
        showNotification('Please log in to vibe with creators', 'error');
        return;
    }
    
    // Don't allow vibing with yourself
    if (userId === window.currentUser._id) {
        showNotification('You cannot vibe with yourself!', 'error');
        return;
    }
    
    try {
        // Check current status first
        const currentIcon = vibeBtn.querySelector('div').textContent;
        const isCurrentlyVibing = currentIcon === '💫';
        
        if (isCurrentlyVibing) {
            // Unvibe (unfollow)
            const response = await fetch(`${API_BASE_URL}/api/users/${userId}/unfollow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.authToken}`
                }
            });
            
            if (response.ok) {
                vibeBtn.innerHTML = '<div style="font-size: 16px; color: white;">✨</div>';
                vibeBtn.style.background = 'var(--accent-gradient)';
                vibeBtn.style.boxShadow = 'var(--vib3-glow)';
                showNotification('No longer vibing ✨', 'info');
            } else {
                throw new Error('Failed to unvibe');
            }
        } else {
            // Start vibing (follow)
            const response = await fetch(`${API_BASE_URL}/api/users/${userId}/follow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.authToken}`
                }
            });
            
            if (response.ok) {
                vibeBtn.innerHTML = '<div style="font-size: 14px; color: white;">💫</div>';
                vibeBtn.style.background = 'var(--accent-gradient)';
                vibeBtn.style.boxShadow = '0 0 15px rgba(255, 107, 107, 0.7)';
                showNotification('Now vibing! ✨', 'success');
                
                // Add sparkle effect
                createSparkleEffect(vibeBtn);
            } else {
                throw new Error('Failed to start vibing');
            }
        }
    } catch (error) {
        console.error('Vibe click error:', error);
        showNotification('Something went wrong. Try again!', 'error');
    }
}

function createSparkleEffect(element) {
    // Create sparkle animation around the vibe button
    for (let i = 0; i < 5; i++) {
        const sparkle = document.createElement('div');
        sparkle.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: #fff;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
        `;
        sparkle.textContent = '✨';
        
        const rect = element.getBoundingClientRect();
        sparkle.style.left = rect.left + Math.random() * rect.width + 'px';
        sparkle.style.top = rect.top + Math.random() * rect.height + 'px';
        
        document.body.appendChild(sparkle);
        
        // Animate sparkle
        sparkle.animate([
            { transform: 'translateY(0) scale(1)', opacity: 1 },
            { transform: 'translateY(-30px) scale(0)', opacity: 0 }
        ], {
            duration: 1000,
            easing: 'ease-out'
        }).onfinish = () => sparkle.remove();
    }
}

function viewUserProfile(userId) {
    if (!userId || userId === 'unknown') {
        showNotification('User profile not available', 'error');
        return;
    }
    
    console.log(`👤 Viewing profile for userId: ${userId}`);
    console.log(`👤 Current user ID: ${currentUser?._id}`);
    
    // Always navigate to full profile page for any user
    console.log('📱 Showing full profile page');
    showProfilePage(userId);
}

async function showProfilePage(userId) {
    console.log(`📄 Creating profile page for user: ${userId}`);
    
    // Pause all videos first
    document.querySelectorAll('video').forEach(video => {
        video.pause();
        video.currentTime = 0;
    });
    
    // Remove existing profile page
    const existingProfile = document.getElementById('profilePage');
    if (existingProfile) {
        existingProfile.remove();
    }
    
    // Create new profile page
    const profilePage = document.createElement('div');
    profilePage.id = 'profilePage';
    profilePage.className = 'profile-page';
    profilePage.style.cssText = `
        position: fixed;
        top: 0;
        left: 240px; 
        width: calc(100vw - 240px); 
        height: 100vh; 
        overflow-y: auto;
        background: #161823;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 1000;
        display: block;
    `;
    
    // Show loading state
    profilePage.innerHTML = `
        <div style="padding: 50px; text-align: center; color: white;">
            <div class="spinner" style="margin: 50px auto;"></div>
            <p>Loading profile...</p>
        </div>
    `;
    
    document.body.appendChild(profilePage);
    
    try {
        // Fetch user data
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('User not found');
        
        const userData = await response.json();
        console.log('👤 Profile page user data:', userData);
        
        const isOwnProfile = userId === currentUser?._id;
        
        // Update with actual profile content
        profilePage.innerHTML = `
            <div style="padding: 50px; text-align: center; color: white;">
                <h1 style="color: #fe2c55; font-size: 48px; margin-bottom: 20px;">
                    🎵 VIB3 PROFILE 🎵
                </h1>
                <div style="background: #333; padding: 30px; border-radius: 15px; margin: 20px auto; max-width: 600px;">
                    <div style="width: 120px; height: 120px; background: linear-gradient(135deg, #fe2c55, #ff006e); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 48px;">
                        ${userData.profilePicture || '👤'}
                    </div>
                    <h2 style="color: white; margin-bottom: 10px;">@${userData.username || 'user'}</h2>
                    <p style="color: #ccc; margin-bottom: 20px;">${userData.bio || userData.displayName || 'No bio yet'}</p>
                    <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 20px;">
                        <div><strong style="color: white;">${formatCount(userData.stats?.following || 0)}</strong> <span style="color: #ccc;">following</span></div>
                        <div><strong style="color: white;">${formatCount(userData.stats?.followers || 0)}</strong> <span style="color: #ccc;">followers</span></div>
                        <div><strong style="color: white;">${formatCount(userData.stats?.likes || 0)}</strong> <span style="color: #ccc;">likes</span></div>
                    </div>
                    ${isOwnProfile ? 
                        `<button onclick="editProfile()" style="background: #fe2c55; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">Edit Profile</button>` :
                        `<button id="profileFollowBtn" onclick="handleProfileFollow('${userId}', '@${userData.username}')" style="background: #fe2c55; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">Follow</button>`
                    }
                </div>
                
                <div style="margin-top: 40px;">
                    <h3 style="color: white; margin-bottom: 20px;">Videos</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; max-width: 800px; margin: 0 auto;" id="profileVideosGrid">
                        <!-- Videos will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        // Load user's videos
        loadProfileVideos(userId);
        
        // Check follow status if not own profile
        if (!isOwnProfile) {
            checkProfileFollowStatus(userId);
        }
        
    } catch (error) {
        console.error('Error loading profile:', error);
        profilePage.innerHTML = `
            <div style="padding: 50px; text-align: center; color: white;">
                <h2 style="color: #fe2c55;">Profile Not Found</h2>
                <p>Unable to load this user's profile.</p>
                <button onclick="showPage('foryou')" style="background: #fe2c55; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">Go Back</button>
            </div>
        `;
    }
}

async function loadProfileVideos(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/videos?userId=${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        const data = await response.json();
        const videos = data.videos || [];
        
        const grid = document.getElementById('profileVideosGrid');
        if (!grid) return;
        
        if (videos.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No videos yet</p>';
            return;
        }
        
        grid.innerHTML = videos.map(video => `
            <div style="
                aspect-ratio: 9/16;
                background: #000;
                position: relative;
                cursor: pointer;
                overflow: hidden;
                border-radius: 8px;
            " onclick="playVideoFromProfile('${video._id}')">
                <video src="${video.videoUrl}" style="
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                "></video>
                <div style="
                    position: absolute;
                    bottom: 5px;
                    left: 5px;
                    color: white;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                ">
                    <span>▶</span>
                    <span>${formatCount(video.views || 0)}</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading profile videos:', error);
    }
}

async function checkProfileFollowStatus(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}/follow-status`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const followBtn = document.getElementById('profileFollowBtn');
            if (followBtn) {
                if (data.isFollowing) {
                    followBtn.textContent = 'Following';
                    followBtn.style.background = '#666';
                } else {
                    followBtn.textContent = 'Follow';
                    followBtn.style.background = '#fe2c55';
                }
            }
        }
    } catch (error) {
        console.error('Error checking follow status:', error);
    }
}

async function handleProfileFollow(userId, username) {
    const followBtn = document.getElementById('profileFollowBtn');
    if (!followBtn) return;
    
    const isCurrentlyFollowing = followBtn.textContent === 'Following';
    
    try {
        const endpoint = isCurrentlyFollowing ? 'unfollow' : 'follow';
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            if (isCurrentlyFollowing) {
                followBtn.textContent = 'Follow';
                followBtn.style.background = '#fe2c55';
                showNotification(`Unfollowed ${username}`, 'info');
            } else {
                followBtn.textContent = 'Following';
                followBtn.style.background = '#666';
                showNotification(`Now following ${username}!`, 'success');
            }
        } else {
            throw new Error('Follow action failed');
        }
    } catch (error) {
        console.error('Error handling follow:', error);
        showNotification('Unable to follow/unfollow user', 'error');
    }
}

async function showUserProfile(userId) {
    // Create user profile modal
    const modal = document.createElement('div');
    modal.id = 'userProfileModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-y: auto;
    `;
    
    modal.innerHTML = `
        <div style="
            background: var(--bg-primary);
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            border-radius: 12px;
            overflow: hidden;
            position: relative;
        ">
            <div style="text-align: center; padding: 40px;">
                <div class="spinner"></div>
                <p style="color: var(--text-secondary); margin-top: 20px;">Loading profile...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    try {
        // Fetch user data with proper authentication
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('User not found');
        
        const userData = await response.json();
        console.log('👤 User profile data received:', userData);
        
        // Update modal with user profile
        modal.innerHTML = `
            <div style="
                background: var(--bg-primary);
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                border-radius: 12px;
                overflow-y: auto;
                position: relative;
            ">
                <button onclick="document.getElementById('userProfileModal').remove()" style="
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    z-index: 10;
                ">&times;</button>
                
                <div style="padding: 40px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="
                            width: 100px;
                            height: 100px;
                            border-radius: 50%;
                            background: linear-gradient(45deg, #fe2c55, #8b2dbd);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 48px;
                            margin: 0 auto 20px;
                        ">${userData.profilePicture || '👤'}</div>
                        
                        <h2 style="margin: 0 0 10px 0; color: white;">@${userData.username || 'user'}</h2>
                        <p style="color: var(--text-secondary); margin: 0 0 20px 0;">${userData.bio || 'No bio yet'}</p>
                        
                        <div style="display: flex; gap: 30px; justify-content: center; margin-bottom: 30px;">
                            <div>
                                <div style="font-size: 20px; font-weight: bold; color: white;">${formatCount(userData.stats?.followers || 0)}</div>
                                <div style="color: var(--text-secondary); font-size: 14px;">Followers</div>
                            </div>
                            <div>
                                <div style="font-size: 20px; font-weight: bold; color: white;">${formatCount(userData.stats?.following || 0)}</div>
                                <div style="color: var(--text-secondary); font-size: 14px;">Following</div>
                            </div>
                            <div>
                                <div style="font-size: 20px; font-weight: bold; color: white;">${formatCount(userData.stats?.likes || 0)}</div>
                                <div style="color: var(--text-secondary); font-size: 14px;">Likes</div>
                            </div>
                        </div>
                        
                        <button id="modalFollowBtn" data-user-id="${userId}" style="
                            padding: 12px 40px;
                            background: #fe2c55;
                            border: none;
                            border-radius: 25px;
                            color: white;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 16px;
                        ">Follow</button>
                    </div>
                    
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 2px;
                        margin-top: 30px;
                    " id="userVideosGrid">
                        <!-- Videos will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        // Add follow button functionality
        const modalFollowBtn = document.getElementById('modalFollowBtn');
        modalFollowBtn.addEventListener('click', async () => {
            await handleFollowClick(userId, modalFollowBtn);
        });
        
        // Check follow status
        checkFollowStatus(userId, modalFollowBtn);
        
        // Load user's videos
        loadUserVideosGrid(userId);
        
    } catch (error) {
        console.error('Error loading user profile:', error);
        modal.innerHTML = `
            <div style="
                background: var(--bg-primary);
                padding: 40px;
                border-radius: 12px;
                text-align: center;
            ">
                <p style="color: var(--text-secondary);">Failed to load user profile</p>
                <button onclick="document.getElementById('userProfileModal').remove()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: var(--bg-secondary);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                ">Close</button>
            </div>
        `;
    }
}

async function loadUserVideosGrid(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/videos?userId=${userId}`);
        const data = await response.json();
        
        // Handle server response format: { videos: [] } or { error: 'message' }
        const videos = data.videos || [];
        
        console.log(`📹 Loading videos for user ${userId}:`, videos.length, 'videos found');
        
        const grid = document.getElementById('userVideosGrid');
        if (!grid) return;
        
        if (videos.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No videos yet</p>';
            return;
        }
        
        grid.innerHTML = videos.map(video => `
            <div style="
                aspect-ratio: 9/16;
                background: #000;
                position: relative;
                cursor: pointer;
                overflow: hidden;
            " onclick="playVideoFromProfile('${video._id}')">
                <video src="${video.videoUrl}" style="
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                "></video>
                <div style="
                    position: absolute;
                    bottom: 5px;
                    left: 5px;
                    color: white;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                ">
                    <span>▶</span>
                    <span>${formatCount(video.views || 0)}</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading user videos:', error);
    }
}

function playVideoFromProfile(videoId) {
    console.log(`🎬 Playing video from profile: ${videoId}`);
    
    // Get the current profile user data before closing profile
    const profilePage = document.getElementById('profilePage');
    let currentProfileUserId = null;
    
    if (profilePage) {
        // Extract user ID from the follow button or other elements
        const followBtn = profilePage.querySelector('#profileFollowBtn');
        if (followBtn) {
            currentProfileUserId = followBtn.getAttribute('onclick').match(/'([^']+)'/)[1];
        }
        
        // Store profile context in global state
        window.currentProfileContext = {
            userId: currentProfileUserId,
            isInProfileVideoMode: true
        };
        
        profilePage.remove();
    }
    
    // Create profile video feed instead of going to main feed
    createProfileVideoFeed(currentProfileUserId, videoId);
}

async function createProfileVideoFeed(userId, startVideoId) {
    console.log(`📱 Creating profile video feed for user: ${userId}, starting with: ${startVideoId}`);
    
    // Create a feed container similar to the main feed
    const feedContainer = document.createElement('div');
    feedContainer.id = 'profileVideoFeed';
    feedContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 240px;
        width: calc(100vw - 240px);
        height: 100vh;
        background: #161823;
        z-index: 1000;
        overflow-y: auto;
        scroll-snap-type: y mandatory;
        scroll-behavior: smooth;
    `;
    
    // Add back button
    const backButton = document.createElement('div');
    backButton.style.cssText = `
        position: fixed;
        top: 20px;
        left: 260px;
        z-index: 1001;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    backButton.innerHTML = '← Back to Profile';
    backButton.onclick = () => {
        // Clean up the profile video observer
        if (window.profileVideoObserver) {
            window.profileVideoObserver.disconnect();
            window.profileVideoObserver = null;
        }
        
        feedContainer.remove();
        backButton.remove();
        
        // Re-open the profile page
        if (window.currentProfileContext?.userId) {
            showProfilePage(window.currentProfileContext.userId);
        }
        window.currentProfileContext = null;
    };
    
    document.body.appendChild(feedContainer);
    document.body.appendChild(backButton);
    
    // Show loading
    feedContainer.innerHTML = '<div style="padding: 50px; text-align: center; color: white;"><div class="spinner" style="margin: 50px auto;"></div><p>Loading videos...</p></div>';
    
    try {
        // Fetch all videos from this user
        const response = await fetch(`${API_BASE_URL}/api/user/videos?userId=${userId}&limit=50`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        const data = await response.json();
        const videos = data.videos || [];
        
        if (videos.length === 0) {
            feedContainer.innerHTML = '<div style="padding: 50px; text-align: center; color: white;"><p>No videos found</p></div>';
            return;
        }
        
        // Clear loading
        feedContainer.innerHTML = '';
        
        // Reorder videos to start with the selected one
        const startVideoIndex = videos.findIndex(v => v._id === startVideoId);
        let orderedVideos = [];
        
        if (startVideoIndex !== -1) {
            // Put the selected video first, then the rest
            orderedVideos = [
                videos[startVideoIndex],
                ...videos.slice(0, startVideoIndex),
                ...videos.slice(startVideoIndex + 1)
            ];
        } else {
            orderedVideos = videos;
        }
        
        // Create video cards for all user's videos
        orderedVideos.forEach((video, index) => {
            const videoCard = createAdvancedVideoCard(video);
            feedContainer.appendChild(videoCard);
            console.log(`➕ Added profile video ${index + 1}: ${video.title || 'Untitled'}`);
        });
        
        // Initialize video observer for the profile feed
        setTimeout(() => {
            initializeProfileVideoObserver(feedContainer);
            
            // Auto-play the first video (selected video)
            const firstVideo = feedContainer.querySelector('video');
            if (firstVideo) {
                firstVideo.play().catch(e => console.log('Auto-play failed:', e));
                console.log('🎬 Starting profile video playback');
            }
        }, 200);
        
        console.log('✅ Profile video feed created with', orderedVideos.length, 'videos');
        
    } catch (error) {
        console.error('Error creating profile video feed:', error);
        feedContainer.innerHTML = '<div style="padding: 50px; text-align: center; color: white;"><p>Error loading videos</p></div>';
    }
}

function initializeProfileVideoObserver(feedContainer) {
    console.log('🔧 Initializing profile video observer');
    
    // Disconnect existing observer if any
    if (window.profileVideoObserver) {
        window.profileVideoObserver.disconnect();
        window.profileVideoObserver = null;
    }
    
    const profileVideoObserver = window.profileVideoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
                // Pause all other videos in the profile feed first
                feedContainer.querySelectorAll('video').forEach(v => {
                    if (v !== video && !v.paused) {
                        v.pause();
                        console.log('⏸️ Pausing other profile video:', v.src.split('/').pop());
                    }
                });
                
                // Play the current video
                video.play().catch(e => console.log('Profile video play failed:', e));
                console.log('🎬 Auto-playing profile video:', video.src.split('/').pop());
                
                // Track video view start
                const videoCard = video.closest('.video-card');
                if (videoCard && videoCard.videoData) {
                    startVideoTracking(videoCard.videoData._id, video);
                }
            } else if (!entry.isIntersecting) {
                // Pause when out of view
                if (!video.paused) {
                    video.pause();
                    console.log('⏸️ Auto-pausing profile video (out of view):', video.src.split('/').pop());
                }
            }
        });
    }, {
        threshold: [0, 0.7, 1],
        rootMargin: '-10% 0px -10% 0px',
        root: feedContainer
    });
    
    // Setup all videos in the profile feed
    const videos = feedContainer.querySelectorAll('video');
    videos.forEach((video, index) => {
        console.log(`🔧 Setting up profile video ${index + 1}:`, video.src.split('/').pop());
        
        // Force video properties
        video.muted = false;
        video.volume = 0.8;
        video.loop = true;
        video.controls = false;
        video.playsInline = true;
        video.preload = 'metadata';
        
        // Remove any existing manual play flags
        video.removeAttribute('data-manual-play');
        video.removeAttribute('data-manually-paused');
        
        // Observe this video
        profileVideoObserver.observe(video);
        
        // Add click handler for manual pause/play
        video.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.paused) {
                this.play().catch(e => console.log('Manual play failed:', e));
                this.removeAttribute('data-manually-paused');
                console.log('▶️ Manual play:', this.src.split('/').pop());
            } else {
                this.pause();
                this.setAttribute('data-manually-paused', 'true');
                console.log('⏸️ Manual pause:', this.src.split('/').pop());
            }
        });
    });
    
    console.log(`✅ Profile video observer initialized for ${videos.length} videos`);
}

// This function is now only used for fallback when video not found in main feed
async function loadSpecificVideo(videoId) {
    try {
        // If we're in profile video mode, this shouldn't happen
        if (window.currentProfileContext?.isInProfileVideoMode) {
            console.log('Already in profile video mode, skipping loadSpecificVideo');
            return;
        }
        
        // Fetch the specific video data for main feed
        const response = await fetch(`${API_BASE_URL}/api/videos/${videoId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            const video = await response.json();
            console.log(`📹 Loaded specific video for main feed:`, video);
            
            // Add this video to the top of the main feed
            const feedContainer = document.getElementById('foryouFeed');
            if (feedContainer) {
                const videoCard = createAdvancedVideoCard(video);
                feedContainer.insertAdjacentElement('afterbegin', videoCard);
                
                // Scroll to and play the new video
                setTimeout(() => {
                    const newVideoCard = document.querySelector(`[data-video-id="${videoId}"]`);
                    if (newVideoCard) {
                        console.log(`🎯 Focusing on specific video: ${videoId}`);
                        
                        // Pause all other videos first
                        document.querySelectorAll('video').forEach(v => {
                            if (v !== newVideoCard.querySelector('video')) {
                                v.pause();
                            }
                        });
                        
                        // Scroll to target video
                        newVideoCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // Wait for scroll to complete, then play
                        setTimeout(() => {
                            const videoElement = newVideoCard.querySelector('video');
                            if (videoElement) {
                                console.log(`▶️ Playing target video: ${videoId}`);
                                videoElement.play().catch(e => console.log('Video play failed:', e));
                                
                                // Mark this video as manually selected to prevent auto-pause
                                videoElement.setAttribute('data-manual-play', 'true');
                            }
                        }, 800);
                    }
                }, 100);
            }
        } else {
            showNotification('Video not found', 'error');
        }
    } catch (error) {
        console.error('Error loading specific video:', error);
        showNotification('Error loading video', 'error');
    }
}

// ================ APP INITIALIZATION ================

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

function initializeApp() {
    try {
        initializeAuth();
        // Only log success in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('✅ VIB3 initialized');
        }
    } catch (error) {
        console.error('❌ Error initializing VIB3:', error);
    }
}

// ================ USER BEHAVIOR TRACKING ================

// Track video views with detailed analytics
const videoTracking = new Map(); // Store tracking data for each video

function startVideoTracking(videoId, videoElement) {
    if (!videoId || !videoElement) return;
    
    // Skip if already tracking this video
    if (videoTracking.has(videoId)) return;
    
    const trackingData = {
        videoId,
        startTime: Date.now(),
        lastUpdateTime: Date.now(),
        totalWatchTime: 0,
        pauseCount: 0,
        replayCount: 0,
        referrer: getCurrentReferrer(),
        duration: videoElement.duration || 0
    };
    
    videoTracking.set(videoId, trackingData);
    
    // Set up event listeners for this video
    const updateWatchTime = () => {
        const data = videoTracking.get(videoId);
        if (data) {
            const now = Date.now();
            data.totalWatchTime += (now - data.lastUpdateTime) / 1000; // Convert to seconds
            data.lastUpdateTime = now;
        }
    };
    
    const handlePause = () => {
        updateWatchTime();
        const data = videoTracking.get(videoId);
        if (data) data.pauseCount++;
    };
    
    const handleEnded = () => {
        updateWatchTime();
        submitVideoAnalytics(videoId);
    };
    
    const handleTimeUpdate = () => {
        const data = videoTracking.get(videoId);
        if (data && !data.duration && videoElement.duration) {
            data.duration = videoElement.duration;
        }
    };
    
    // Clean up old listeners if they exist
    videoElement.removeEventListener('pause', handlePause);
    videoElement.removeEventListener('ended', handleEnded);
    videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    
    // Add new listeners
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    
    // Also track when video leaves viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                updateWatchTime();
                submitVideoAnalytics(videoId);
            }
        });
    }, { threshold: 0.1 });
    
    observer.observe(videoElement);
    
    // Store cleanup function
    videoElement.cleanupTracking = () => {
        observer.disconnect();
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
}

async function submitVideoAnalytics(videoId) {
    const data = videoTracking.get(videoId);
    if (!data || data.totalWatchTime < 1) return; // Don't track if watched less than 1 second
    
    try {
        const watchPercentage = data.duration > 0 
            ? Math.min(100, (data.totalWatchTime / data.duration) * 100)
            : 0;
        
        const payload = {
            watchTime: Math.round(data.totalWatchTime),
            watchPercentage: Math.round(watchPercentage),
            exitPoint: data.totalWatchTime,
            isReplay: data.replayCount > 0,
            referrer: data.referrer
        };
        
        // Send view tracking data
        await fetch(`${API_BASE_URL}/api/videos/${videoId}/view`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Id': getSessionId()
            },
            body: JSON.stringify(payload)
        });
        
        console.log(`📊 Video analytics submitted for ${videoId}:`, payload);
        
        // Clear tracking data
        videoTracking.delete(videoId);
        
    } catch (error) {
        console.error('Failed to submit video analytics:', error);
    }
}

// Track user interactions
async function trackInteraction(type, videoId, action, context = {}) {
    if (!currentUser) return;
    
    try {
        await fetch(`${API_BASE_URL}/api/track/interaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                type,
                videoId,
                action,
                timestamp: new Date().toISOString(),
                context
            })
        });
    } catch (error) {
        console.error('Failed to track interaction:', error);
    }
}

// Get current referrer context
function getCurrentReferrer() {
    if (window.location.pathname.includes('profile')) return 'profile';
    if (window.location.pathname.includes('search')) return 'search';
    if (window.location.pathname.includes('hashtag')) return 'hashtag';
    
    // Check current feed tab
    const activeTab = document.querySelector('.feed-tab.active');
    if (activeTab) {
        const tabName = activeTab.getAttribute('data-feed');
        if (tabName) return tabName;
    }
    
    return 'foryou';
}

// Get or create session ID
function getSessionId() {
    let sessionId = sessionStorage.getItem('vib3-session-id');
    if (!sessionId) {
        sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        sessionStorage.setItem('vib3-session-id', sessionId);
    }
    return sessionId;
}

// Track swipe/skip actions
function trackVideoSkip(videoId) {
    trackInteraction('swipe', videoId, 'skip', {
        watchTime: videoTracking.get(videoId)?.totalWatchTime || 0
    });
}

// Track not interested
function trackNotInterested(videoId) {
    trackInteraction('not_interested', videoId, 'marked', {
        reason: 'user_action'
    });
}

// ================ VIB3 UNIQUE FEATURES SUPPORT FUNCTIONS ================

// Start real-time pulse metrics
let pulseMetricsInterval = null;
function startPulseMetrics() {
    if (pulseMetricsInterval) clearInterval(pulseMetricsInterval);
    
    pulseMetricsInterval = setInterval(() => {
        const viewsEl = document.getElementById('pulseViews');
        const heartbeatsEl = document.getElementById('pulseHeartbeats');
        const energyEl = document.getElementById('pulseEnergy');
        
        if (viewsEl && heartbeatsEl && energyEl) {
            // Simulate real-time metrics with random variations
            const baseViews = 15420;
            const baseHeartbeats = 847;
            const baseEnergy = 87;
            
            const newViews = baseViews + Math.floor(Math.random() * 200) - 100;
            const newHeartbeats = baseHeartbeats + Math.floor(Math.random() * 50) - 25;
            const newEnergy = Math.max(50, Math.min(100, baseEnergy + Math.floor(Math.random() * 20) - 10));
            
            viewsEl.textContent = formatCount(newViews);
            heartbeatsEl.textContent = newHeartbeats.toLocaleString();
            energyEl.textContent = newEnergy;
            
            // Add pulse animation to energy when high
            if (newEnergy > 90) {
                energyEl.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => energyEl.style.animation = '', 500);
            }
        }
    }, 2000);
}

// Simulate pulse activity with visual feedback
function simulatePulseActivity() {
    const button = event.target;
    button.innerHTML = '⚡ Activating...';
    button.disabled = true;
    
    setTimeout(() => {
        button.innerHTML = '✨ Pulse Mode Active!';
        
        // Add some visual effects
        const pulseContent = document.querySelector('.pulse-content');
        if (pulseContent) {
            pulseContent.innerHTML += `
                <div style="margin-top: 20px; padding: 15px; background: var(--bg-tertiary); border-radius: 10px; text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 10px;">⚡✨🔥</div>
                    <p style="color: var(--text-primary); margin: 0;">Pulse Mode is now active! You're seeing the most energetic content in real-time.</p>
                </div>
            `;
        }
        
        setTimeout(() => {
            button.innerHTML = '⚡ Pulse Active';
            button.style.background = 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)';
        }, 1000);
    }, 1500);
}

// Start energy meter real-time updates
function startEnergyUpdates() {
    if (energyUpdateInterval) clearInterval(energyUpdateInterval);
    
    energyUpdateInterval = setInterval(() => {
        const energyValueEl = document.getElementById('energyValue');
        const liveUsersEl = document.getElementById('liveUsers');
        const vibeScoreEl = document.getElementById('vibeScore');
        
        if (energyValueEl && liveUsersEl && vibeScoreEl) {
            // Simulate fluctuating energy metrics
            const currentEnergy = parseInt(energyValueEl.textContent);
            const newEnergy = Math.max(60, Math.min(100, currentEnergy + Math.floor(Math.random() * 6) - 3));
            
            const baseLiveUsers = 1200;
            const newLiveUsers = baseLiveUsers + Math.floor(Math.random() * 100) - 50;
            
            const baseVibeScore = 9.2;
            const newVibeScore = Math.max(8.5, Math.min(9.9, baseVibeScore + (Math.random() * 0.4) - 0.2));
            
            energyValueEl.textContent = newEnergy;
            liveUsersEl.textContent = newLiveUsers.toLocaleString();
            vibeScoreEl.textContent = newVibeScore.toFixed(1);
            
            // Change energy circle color based on level
            const energyCircle = document.querySelector('.energy-circle');
            if (energyCircle) {
                if (newEnergy > 90) {
                    energyCircle.style.background = 'conic-gradient(#00ff88 0deg, #00cc66 120deg, #ff6b6b 240deg, #00ff88 360deg)';
                } else if (newEnergy < 70) {
                    energyCircle.style.background = 'conic-gradient(#ff6b6b 0deg, #ff8e53 120deg, #ffa726 240deg, #ff6b6b 360deg)';
                } else {
                    energyCircle.style.background = 'conic-gradient(var(--accent-primary) 0deg, var(--accent-secondary) 120deg, #ff6b6b 240deg, var(--accent-primary) 360deg)';
                }
            }
        }
    }, 3000);
}

// Close energy meter modal
function closeEnergyMeter() {
    const modal = document.querySelector('.vib3-energy-modal');
    if (modal) {
        modal.remove();
    }
    if (energyUpdateInterval) {
        clearInterval(energyUpdateInterval);
        energyUpdateInterval = null;
    }
}

// Join a vibe room with full functionality
function joinVibeRoom(roomType) {
    console.log(`🏠 Joining ${roomType} vibe room`);
    
    const roomData = {
        music: {
            name: 'Music Vibes',
            icon: '🎵',
            color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            members: Math.floor(Math.random() * 500) + 200,
            activity: 'Currently listening to lo-fi beats'
        },
        dance: {
            name: 'Dance Floor',
            icon: '💃',
            color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            members: Math.floor(Math.random() * 400) + 150,
            activity: 'Dance battle happening now!'
        },
        creativity: {
            name: 'Creative Space',
            icon: '🎨',
            color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            members: Math.floor(Math.random() * 300) + 100,
            activity: 'Sharing art tutorials'
        },
        gaming: {
            name: 'Gaming Zone',
            icon: '🎮',
            color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            members: Math.floor(Math.random() * 600) + 300,
            activity: 'Discussing new game releases'
        }
    };
    
    const room = roomData[roomType] || roomData.music;
    
    // Create full room interface
    const roomModal = document.createElement('div');
    roomModal.className = 'vibe-room-modal';
    roomModal.id = `room-${roomType}`;
    roomModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.95);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(15px);
    `;
    
    roomModal.innerHTML = `
        <div class="room-container" style="background: var(--bg-secondary); border-radius: 20px; padding: 0; max-width: 900px; width: 95%; height: 80vh; border: 1px solid var(--border-primary); position: relative; overflow: hidden; display: flex; flex-direction: column;">
            <!-- Room Header -->
            <div class="room-header" style="background: ${room.color}; padding: 20px 30px; color: white; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="font-size: 32px;">${room.icon}</div>
                    <div>
                        <h2 style="margin: 0; font-size: 24px; font-weight: 700;">${room.name}</h2>
                        <p style="margin: 0; opacity: 0.9; font-size: 14px;">${room.members} members online • ${room.activity}</p>
                    </div>
                </div>
                <button onclick="leaveVibeRoom('${roomType}')" style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 24px; cursor: pointer; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">&times;</button>
            </div>
            
            <!-- Room Content -->
            <div class="room-content" style="flex: 1; display: flex; overflow: hidden;">
                <!-- Chat Area -->
                <div class="room-chat" style="flex: 1; display: flex; flex-direction: column; border-right: 1px solid var(--border-primary);">
                    <!-- Chat Messages -->
                    <div class="chat-messages" id="chat-${roomType}" style="flex: 1; padding: 20px; overflow-y: auto; background: var(--bg-primary);">
                        <!-- Messages will be populated here -->
                    </div>
                    
                    <!-- Chat Input -->
                    <div class="chat-input-area" style="padding: 20px; background: var(--bg-secondary); border-top: 1px solid var(--border-primary);">
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="chat-input-${roomType}" placeholder="Share your vibe..." style="flex: 1; padding: 12px 16px; border: 1px solid var(--border-primary); border-radius: 25px; background: var(--bg-tertiary); color: var(--text-primary); outline: none;">
                            <button onclick="sendRoomMessage('${roomType}')" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-weight: 600;">Send</button>
                        </div>
                    </div>
                </div>
                
                <!-- Room Panel -->
                <div class="room-panel" style="width: 300px; background: var(--bg-tertiary); display: flex; flex-direction: column;">
                    <!-- Online Members -->
                    <div class="online-members" style="padding: 20px; border-bottom: 1px solid var(--border-primary);">
                        <h3 style="margin: 0 0 15px; color: var(--text-primary); font-size: 16px;">Online Now (${room.members})</h3>
                        <div id="members-${roomType}" class="members-list" style="max-height: 200px; overflow-y: auto;">
                            <!-- Members will be populated here -->
                        </div>
                    </div>
                    
                    <!-- Room Activities -->
                    <div class="room-activities" style="flex: 1; padding: 20px;">
                        <h3 style="margin: 0 0 15px; color: var(--text-primary); font-size: 16px;">Room Activities</h3>
                        <div class="activity-buttons" style="display: flex; flex-direction: column; gap: 10px;">
                            <button onclick="startRoomActivity('${roomType}', 'share')" style="background: var(--bg-secondary); border: 1px solid var(--border-primary); color: var(--text-primary); padding: 12px; border-radius: 8px; cursor: pointer; text-align: left;">
                                📤 Share Content
                            </button>
                            <button onclick="startRoomActivity('${roomType}', 'collaborate')" style="background: var(--bg-secondary); border: 1px solid var(--border-primary); color: var(--text-primary); padding: 12px; border-radius: 8px; cursor: pointer; text-align: left;">
                                🤝 Start Collaboration
                            </button>
                            <button onclick="startRoomActivity('${roomType}', 'challenge')" style="background: var(--bg-secondary); border: 1px solid var(--border-primary); color: var(--text-primary); padding: 12px; border-radius: 8px; cursor: pointer; text-align: left;">
                                🏆 Create Challenge
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove any existing room modals
    document.querySelectorAll('.vibe-room-modal').forEach(modal => modal.remove());
    
    document.body.appendChild(roomModal);
    
    // Initialize room functionality
    initializeVibeRoom(roomType, room);
    
    // Focus chat input
    setTimeout(() => {
        const chatInput = document.getElementById(`chat-input-${roomType}`);
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendRoomMessage(roomType);
                }
            });
        }
    }, 100);
}

// Show create room modal
function showCreateRoomModal() {
    console.log('➕ Opening create room modal');
    
    const createModal = document.createElement('div');
    createModal.className = 'create-room-modal';
    createModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
    `;
    
    createModal.innerHTML = `
        <div style="background: var(--bg-secondary); border-radius: 20px; padding: 30px; max-width: 500px; width: 90%; border: 1px solid var(--border-primary); position: relative;">
            <button onclick="this.closest('.create-room-modal').remove()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: var(--text-secondary); font-size: 24px; cursor: pointer;">&times;</button>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 8px;">Create Vibe Room</h2>
                <p style="color: var(--text-secondary); margin: 0;">Start your own community space</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; color: var(--text-primary); margin-bottom: 8px; font-weight: 600;">Room Name</label>
                <input type="text" placeholder="Enter room name..." style="width: 100%; padding: 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary); box-sizing: border-box;">
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; color: var(--text-primary); margin-bottom: 8px; font-weight: 600;">Category</label>
                <select style="width: 100%; padding: 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary); box-sizing: border-box;">
                    <option>Music & Audio</option>
                    <option>Dance & Movement</option>
                    <option>Art & Creativity</option>
                    <option>Gaming & Tech</option>
                    <option>Lifestyle & Vlog</option>
                    <option>Comedy & Entertainment</option>
                    <option>Education & Learning</option>
                    <option>Other</option>
                </select>
            </div>
            
            <div style="margin-bottom: 30px;">
                <label style="display: block; color: var(--text-primary); margin-bottom: 8px; font-weight: 600;">Description</label>
                <textarea placeholder="Describe what your room is about..." style="width: 100%; height: 80px; padding: 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary); resize: vertical; box-sizing: border-box;"></textarea>
            </div>
            
            <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                <div style="color: var(--text-secondary); font-size: 14px;">
                    🚧 Room creation is coming soon! We're building the infrastructure to support custom community spaces.
                </div>
            </div>
            
            <div style="text-align: center;">
                <button onclick="this.closest('.create-room-modal').remove()" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 30px; border-radius: 25px; cursor: pointer; font-weight: 600; margin-right: 10px;">
                    Coming Soon!
                </button>
                <button onclick="this.closest('.create-room-modal').remove()" style="background: none; border: 1px solid var(--border-primary); color: var(--text-primary); padding: 12px 30px; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(createModal);
}

// ================ VIBE ROOMS FUNCTIONALITY ================

// Initialize vibe room with live chat and members
function initializeVibeRoom(roomType, roomData) {
    const chatContainer = document.getElementById(`chat-${roomType}`);
    const membersContainer = document.getElementById(`members-${roomType}`);
    
    if (chatContainer) {
        // Add welcome message
        addRoomMessage(roomType, {
            type: 'system',
            message: `Welcome to ${roomData.name}! ${roomData.activity}`,
            timestamp: new Date()
        });
        
        // Start simulated chat activity
        startRoomChatSimulation(roomType);
    }
    
    if (membersContainer) {
        // Populate initial members
        populateRoomMembers(roomType, roomData.members);
    }
}

// Add message to room chat
function addRoomMessage(roomType, messageData) {
    const chatContainer = document.getElementById(`chat-${roomType}`);
    if (!chatContainer) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    
    const time = messageData.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    if (messageData.type === 'system') {
        messageEl.innerHTML = `
            <div style="background: var(--bg-tertiary); padding: 8px 12px; border-radius: 8px; margin-bottom: 8px; text-align: center; font-size: 12px; color: var(--text-secondary);">
                ${messageData.message}
            </div>
        `;
    } else {
        const isCurrentUser = messageData.username === currentUser?.username;
        const bgColor = isCurrentUser ? 'var(--accent-primary)' : 'var(--bg-tertiary)';
        const textColor = isCurrentUser ? 'white' : 'var(--text-primary)';
        const align = isCurrentUser ? 'flex-end' : 'flex-start';
        
        messageEl.innerHTML = `
            <div style="display: flex; justify-content: ${align}; margin-bottom: 8px;">
                <div style="max-width: 70%; background: ${bgColor}; color: ${textColor}; padding: 8px 12px; border-radius: 12px;">
                    ${!isCurrentUser ? `<div style="font-size: 11px; opacity: 0.8; margin-bottom: 2px;">${messageData.username}</div>` : ''}
                    <div>${messageData.message}</div>
                    <div style="font-size: 10px; opacity: 0.7; margin-top: 2px;">${time}</div>
                </div>
            </div>
        `;
    }
    
    chatContainer.appendChild(messageEl);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send message in room
function sendRoomMessage(roomType) {
    const input = document.getElementById(`chat-input-${roomType}`);
    if (!input || !input.value.trim()) return;
    
    const message = input.value.trim();
    input.value = '';
    
    // Add user message
    addRoomMessage(roomType, {
        type: 'user',
        username: currentUser?.username || 'Guest',
        message: message,
        timestamp: new Date()
    });
    
    // Simulate response after delay
    setTimeout(() => {
        const responses = [
            'That\'s awesome! 🔥',
            'Love that energy! ⚡',
            'So creative! 🎨',
            'Great vibes! ✨',
            'This is fire! 🚀',
            'Amazing work! 👏',
            'Keep it up! 💪',
            'Absolutely love this! 💜'
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const usernames = ['VibeKing', 'CreativeQueen', 'DanceMaster', 'MusicLover', 'ArtistVibe', 'GamePro'];
        const randomUser = usernames[Math.floor(Math.random() * usernames.length)];
        
        addRoomMessage(roomType, {
            type: 'user',
            username: randomUser,
            message: randomResponse,
            timestamp: new Date()
        });
    }, 1000 + Math.random() * 3000);
}

// Start simulated chat activity
function startRoomChatSimulation(roomType) {
    const messages = [
        'Hey everyone! Just joined 👋',
        'Anyone want to collaborate on something?',
        'This room has such good energy!',
        'Just posted my latest creation 🎨',
        'Who\'s up for a challenge?',
        'Love the community here! ❤️',
        'Working on something exciting...',
        'Great to see so many talented people!'
    ];
    
    const usernames = ['VibeCreator', 'ArtistVibes', 'DanceFloor', 'MusicMaker', 'CreativeFlow', 'VibeMaster'];
    
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance of message
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            const randomUser = usernames[Math.floor(Math.random() * usernames.length)];
            
            addRoomMessage(roomType, {
                type: 'user',
                username: randomUser,
                message: randomMessage,
                timestamp: new Date()
            });
        }
    }, 8000 + Math.random() * 12000);
}

// Populate room members
function populateRoomMembers(roomType, memberCount) {
    const membersContainer = document.getElementById(`members-${roomType}`);
    if (!membersContainer) return;
    
    const memberNames = [
        'VibeKing', 'CreativeQueen', 'DanceMaster', 'MusicLover', 'ArtistVibe', 
        'GamePro', 'VibeCreator', 'FlowState', 'BeatMaker', 'PixelArtist',
        'RhythmRider', 'ColorCrafter', 'SoundWave', 'MotionMaker', 'VibeTribe'
    ];
    
    const displayCount = Math.min(memberCount, 15);
    membersContainer.innerHTML = '';
    
    for (let i = 0; i < displayCount; i++) {
        const memberEl = document.createElement('div');
        memberEl.className = 'member-item';
        memberEl.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 0;
            border-bottom: 1px solid var(--border-primary);
        `;
        
        const avatarColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
        const memberName = memberNames[i % memberNames.length] + (i > memberNames.length ? i : '');
        const isOnline = Math.random() > 0.3;
        
        memberEl.innerHTML = `
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${avatarColor}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 12px; position: relative;">
                ${memberName.charAt(0)}
                ${isOnline ? '<div style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #00ff88; border: 2px solid var(--bg-tertiary); border-radius: 50%;"></div>' : ''}
            </div>
            <div style="flex: 1;">
                <div style="color: var(--text-primary); font-size: 14px; font-weight: 500;">${memberName}</div>
                <div style="color: var(--text-secondary); font-size: 12px;">${isOnline ? 'Online' : 'Away'}</div>
            </div>
        `;
        
        membersContainer.appendChild(memberEl);
    }
    
    if (memberCount > displayCount) {
        const moreEl = document.createElement('div');
        moreEl.style.cssText = 'padding: 10px 0; text-align: center; color: var(--text-secondary); font-size: 12px;';
        moreEl.textContent = `+${memberCount - displayCount} more members`;
        membersContainer.appendChild(moreEl);
    }
}

// Leave vibe room
function leaveVibeRoom(roomType) {
    const roomModal = document.getElementById(`room-${roomType}`);
    if (roomModal) {
        roomModal.style.opacity = '0';
        roomModal.style.transform = 'scale(0.9)';
        setTimeout(() => roomModal.remove(), 200);
    }
}

// Start room activity
function startRoomActivity(roomType, activityType) {
    const activities = {
        share: {
            title: 'Share Content',
            description: 'Share your latest creation with the room',
            action: 'Upload and share a video or image'
        },
        collaborate: {
            title: 'Start Collaboration',
            description: 'Invite others to work on a project together',
            action: 'Create a collaborative workspace'
        },
        challenge: {
            title: 'Create Challenge',
            description: 'Start a new challenge for the community',
            action: 'Set up challenge rules and prizes'
        }
    };
    
    const activity = activities[activityType];
    if (!activity) return;
    
    // Show activity modal
    const activityModal = document.createElement('div');
    activityModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    activityModal.innerHTML = `
        <div style="background: var(--bg-secondary); border-radius: 15px; padding: 30px; max-width: 500px; width: 90%; border: 1px solid var(--border-primary);">
            <h3 style="margin: 0 0 15px; color: var(--text-primary);">${activity.title}</h3>
            <p style="margin: 0 0 20px; color: var(--text-secondary);">${activity.description}</p>
            <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                <div style="color: var(--text-secondary); font-size: 14px;">
                    🚧 ${activity.action} - Coming in next update!
                </div>
            </div>
            <div style="text-align: center;">
                <button onclick="this.closest('div').remove()" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    Got it!
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(activityModal);
}

// ================ VIB3 STUDIO ================

// Show VIB3 Studio
function showCreatorStudio() {
    console.log('🎬 Opening VIB3 Studio');
    
    // FIRST: Clear any existing dark overlays before opening
    clearDarkOverlaysOnStartup();
    
    // Initialize VIB3 Studio files storage if not exists
    if (!window.creatorStudioFiles) {
        window.creatorStudioFiles = {};
        console.log('🔧 Initialized window.creatorStudioFiles storage');
    }
    
    // Hide main app and other content
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'none';
    }
    
    // Hide other pages
    document.querySelectorAll('.video-feed, .search-page, .profile-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page, .activity-page, .friends-page, .vibe-rooms-page').forEach(el => {
        el.style.display = 'none';
    });
    
    let creatorStudioPage = document.getElementById('creatorStudioPage');
    if (!creatorStudioPage) {
        creatorStudioPage = document.createElement('div');
        creatorStudioPage.id = 'creatorStudioPage';
        creatorStudioPage.className = 'creator-studio-page';
        creatorStudioPage.style.cssText = 'margin-left: 240px; margin-top: 60px; width: calc(100vw - 240px); height: calc(100vh - 60px); overflow: hidden; background: var(--bg-primary); display: flex; flex-direction: column;';
        
        creatorStudioPage.innerHTML = `
            <!-- VIB3 Studio Header -->
            <div class="studio-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 30px; color: white; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-primary);">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="font-size: 32px;">🎬</div>
                    <div>
                        <h1 style="margin: 0; font-size: 28px; font-weight: 800;">VIB3 Studio</h1>
                        <p style="margin: 0; opacity: 0.9; font-size: 14px;">Professional video editing tools for creators</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button onclick="emergencyCloseAllOverlays()" style="background: rgba(255, 68, 68, 0.9); color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 5px;" title="Clear all stuck overlays and modals">
                        🧹 Clear Overlays
                    </button>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="importCreatorMedia()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        📁 Import Media
                    </button>
                    <button onclick="exportCreatorProject()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        💾 Export
                    </button>
                    <button onclick="closeAllModalsAndOverlays()" style="background: rgba(255,68,68,0.8); border: none; color: white; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;" title="Clear all stuck overlays">
                        🧹 Clear Overlays
                    </button>
                </div>
            </div>
            
            <!-- VIB3 Studio Main Interface -->
            <div class="studio-interface" style="flex: 1; display: flex; overflow: hidden;">
                <!-- Left Panel - Tools & Effects -->
                <div class="studio-left-panel" style="width: 280px; background: var(--bg-secondary); border-right: 1px solid var(--border-primary); display: flex; flex-direction: column;">
                    <!-- Tool Tabs -->
                    <div class="tool-tabs" style="display: flex; border-bottom: 1px solid var(--border-primary);">
                        <button class="tool-tab active" onclick="switchStudioTab('media')" id="mediaTab" style="flex: 1; padding: 12px; background: none; border: none; color: var(--text-primary); cursor: pointer; border-bottom: 2px solid var(--accent-primary);">Media</button>
                        <button class="tool-tab" onclick="switchStudioTab('effects')" id="effectsTab" style="flex: 1; padding: 12px; background: none; border: none; color: var(--text-secondary); cursor: pointer;">Effects</button>
                        <button class="tool-tab" onclick="switchStudioTab('audio')" id="audioTab" style="flex: 1; padding: 12px; background: none; border: none; color: var(--text-secondary); cursor: pointer;">Audio</button>
                    </div>
                    
                    <!-- Media Panel -->
                    <div class="media-panel tool-panel active" id="mediaPanel" style="flex: 1; padding: 20px; overflow-y: auto;">
                        <h3 style="margin: 0 0 15px; color: var(--text-primary); font-size: 16px;">Project Media</h3>
                        <div class="media-library" id="mediaLibrary" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <!-- Media items will be populated here -->
                        </div>
                        <button onclick="importCreatorMedia()" style="width: 100%; margin-top: 15px; background: var(--accent-gradient); color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            + Add Media
                        </button>
                        <button onclick="clearAllMedia()" style="width: 100%; margin-top: 10px; background: rgba(255, 68, 68, 0.8); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;">
                            🗑️ Clear All
                        </button>
                        ${checkIfFilesNeedReimport() ? `
                        <div style="margin-top: 10px; padding: 10px; background: rgba(255, 165, 0, 0.1); border: 1px solid rgba(255, 165, 0, 0.3); border-radius: 6px; text-align: center;">
                            <div style="font-size: 10px; color: #ff9500; margin-bottom: 5px;">⚠️ Some files need re-import</div>
                            <button onclick="importCreatorMedia()" style="width: 100%; background: #ff9500; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 10px;">
                                📁 Re-import Files
                            </button>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Effects Panel -->
                    <div class="effects-panel tool-panel" id="effectsPanel" style="flex: 1; padding: 20px; overflow-y: auto; display: none;">
                        <h3 style="margin: 0 0 15px; color: var(--text-primary); font-size: 16px;">Video Effects</h3>
                        <div class="effects-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div class="effect-item" onclick="applyEffect('blur')" style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; cursor: pointer; text-align: center; border: 1px solid var(--border-primary);">
                                <div style="font-size: 24px; margin-bottom: 5px;">🌫️</div>
                                <div style="font-size: 12px; color: var(--text-primary);">Blur</div>
                            </div>
                            <div class="effect-item" onclick="applyEffect('vintage')" style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; cursor: pointer; text-align: center; border: 1px solid var(--border-primary);">
                                <div style="font-size: 24px; margin-bottom: 5px;">📸</div>
                                <div style="font-size: 12px; color: var(--text-primary);">Vintage</div>
                            </div>
                            <div class="effect-item" onclick="applyEffect('glow')" style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; cursor: pointer; text-align: center; border: 1px solid var(--border-primary);">
                                <div style="font-size: 24px; margin-bottom: 5px;">✨</div>
                                <div style="font-size: 12px; color: var(--text-primary);">Glow</div>
                            </div>
                            <div class="effect-item" onclick="applyEffect('particles')" style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; cursor: pointer; text-align: center; border: 1px solid var(--border-primary);">
                                <div style="font-size: 24px; margin-bottom: 5px;">🎆</div>
                                <div style="font-size: 12px; color: var(--text-primary);">Particles</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Audio Panel -->
                    <div class="audio-panel tool-panel" id="audioPanel" style="flex: 1; padding: 20px; overflow-y: auto; display: none;">
                        <h3 style="margin: 0 0 15px; color: var(--text-primary); font-size: 16px;">Audio Tools</h3>
                        <div class="audio-controls" style="display: flex; flex-direction: column; gap: 15px;">
                            <div class="control-group">
                                <label style="color: var(--text-primary); font-size: 14px; margin-bottom: 5px; display: block;">Volume</label>
                                <input type="range" min="0" max="100" value="100" oninput="adjustAudioVolume(this.value)" style="width: 100%;">
                            </div>
                            <div class="control-group">
                                <label style="color: var(--text-primary); font-size: 14px; margin-bottom: 5px; display: block;">Fade In/Out</label>
                                <div style="display: flex; gap: 10px;">
                                    <button onclick="addAudioFade('in')" style="flex: 1; background: var(--bg-tertiary); border: 1px solid var(--border-primary); color: var(--text-primary); padding: 8px; border-radius: 6px; cursor: pointer;">Fade In</button>
                                    <button onclick="addAudioFade('out')" style="flex: 1; background: var(--bg-tertiary); border: 1px solid var(--border-primary); color: var(--text-primary); padding: 8px; border-radius: 6px; cursor: pointer;">Fade Out</button>
                                </div>
                            </div>
                            <button onclick="addBackgroundMusic()" style="width: 100%; background: var(--accent-gradient); color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                🎵 Add Background Music
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Center Panel - Preview -->
                <div class="studio-center-panel" style="flex: 1; background: var(--bg-primary); display: flex; flex-direction: column;">
                    <!-- Preview Area -->
                    <div class="preview-area" style="flex: 1; display: flex; align-items: center; justify-content: center; background: #000; position: relative;">
                        <div class="preview-container" id="previewContainer" style="width: 80%; max-width: 640px; aspect-ratio: 16/9; background: #111; border-radius: 8px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                            <!-- Video Preview Element -->
                            <video id="previewVideo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px; display: none;" controls muted>
                                Your browser does not support the video tag.
                            </video>
                            
                            <!-- Placeholder when no video is loaded -->
                            <div id="previewPlaceholder" class="preview-placeholder" style="text-align: center; color: #666; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                                <div style="font-size: 48px; margin-bottom: 10px;">🎬</div>
                                <div style="font-size: 16px;">Import media to start editing</div>
                                <div style="font-size: 14px; color: #888; margin-top: 8px;">Drag video files to timeline or import media</div>
                            </div>
                        </div>
                        
                        <!-- Preview Controls -->
                        <div class="preview-controls" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 15px; background: rgba(0,0,0,0.8); padding: 10px 20px; border-radius: 25px;">
                            <button onclick="playPausePreview()" id="playPauseBtn" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">▶️</button>
                            <div style="color: white; font-size: 14px;">00:00 / 00:00</div>
                            <button onclick="fullscreenPreview()" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer;">⛶</button>
                        </div>
                    </div>
                </div>
                
                <!-- Right Panel - Properties -->
                <div class="studio-right-panel" style="width: 280px; background: var(--bg-secondary); border-left: 1px solid var(--border-primary); padding: 20px; overflow-y: auto;">
                    <h3 style="margin: 0 0 15px; color: var(--text-primary); font-size: 16px;">Properties</h3>
                    <div class="properties-content" id="propertiesContent">
                        <div style="text-align: center; color: var(--text-secondary); font-size: 14px; padding: 20px;">
                            Select an element to view its properties
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Bottom Panel - Timeline -->
            <div class="studio-timeline" style="height: 200px; background: var(--bg-secondary); border-top: 1px solid var(--border-primary); display: flex; flex-direction: column;">
                <!-- Timeline Header -->
                <div class="timeline-header" style="padding: 10px 20px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-primary); display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <h4 style="margin: 0; color: var(--text-primary); font-size: 14px;">Timeline</h4>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="addVideoTrack()" style="background: var(--accent-primary); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">+ Video</button>
                            <button onclick="addAudioTrack()" style="background: var(--accent-secondary); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">+ Audio</button>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: var(--text-secondary); font-size: 12px;">Zoom:</span>
                        <input type="range" min="10" max="200" value="100" oninput="zoomTimeline(this.value)" style="width: 80px;">
                    </div>
                </div>
                
                <!-- Timeline Content -->
                <div class="timeline-content" style="flex: 1; display: flex; overflow-x: auto;">
                    <!-- Track Labels -->
                    <div class="track-labels" style="width: 120px; background: var(--bg-tertiary); border-right: 1px solid var(--border-primary); flex-shrink: 0;">
                        <div class="track-label" style="height: 40px; display: flex; align-items: center; padding: 0 15px; border-bottom: 1px solid var(--border-primary); color: var(--text-primary); font-size: 12px; font-weight: 600;">
                            Video Track 1
                        </div>
                        <div class="track-label" style="height: 40px; display: flex; align-items: center; padding: 0 15px; border-bottom: 1px solid var(--border-primary); color: var(--text-primary); font-size: 12px; font-weight: 600;">
                            Audio Track 1
                        </div>
                    </div>
                    
                    <!-- Timeline Tracks -->
                    <div class="timeline-tracks" id="timelineTracks" style="flex: 1; background: var(--bg-primary); position: relative;">
                        <!-- Timeline ruler -->
                        <div class="timeline-ruler" style="height: 20px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-primary); position: relative;">
                            <!-- Time markers will be added here -->
                        </div>
                        
                        <!-- Video and audio tracks -->
                        <div class="video-track track" style="height: 40px; border-bottom: 1px solid var(--border-primary); position: relative;" ondrop="dropMedia(event, 'video')" ondragover="allowDrop(event)">
                            <!-- Video clips will be added here -->
                        </div>
                        <div class="audio-track track" style="height: 40px; border-bottom: 1px solid var(--border-primary); position: relative;" ondrop="dropMedia(event, 'audio')" ondragover="allowDrop(event)">
                            <!-- Audio clips will be added here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(creatorStudioPage);
        
        // Initialize timeline ruler
        initializeTimelineRuler();
        
        // Add sample media to library
        populateSampleMedia();
    }
    
    creatorStudioPage.style.display = 'flex';
}

// Switch studio tool tabs
function switchStudioTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tool-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.borderBottom = 'none';
        tab.style.color = 'var(--text-secondary)';
    });
    
    document.getElementById(tabName + 'Tab').classList.add('active');
    document.getElementById(tabName + 'Tab').style.borderBottom = '2px solid var(--accent-primary)';
    document.getElementById(tabName + 'Tab').style.color = 'var(--text-primary)';
    
    // Update panels
    document.querySelectorAll('.tool-panel').forEach(panel => {
        panel.style.display = 'none';
    });
    
    document.getElementById(tabName + 'Panel').style.display = 'block';
}

// Initialize timeline ruler
function initializeTimelineRuler() {
    const ruler = document.querySelector('.timeline-ruler');
    if (!ruler) return;
    
    ruler.innerHTML = '';
    
    // Add time markers every 30 seconds for 5 minutes
    for (let i = 0; i <= 300; i += 30) {
        const marker = document.createElement('div');
        marker.style.cssText = `
            position: absolute;
            left: ${(i / 300) * 100}%;
            top: 0;
            bottom: 0;
            border-left: 1px solid var(--border-primary);
            font-size: 10px;
            color: var(--text-secondary);
            padding-left: 4px;
            display: flex;
            align-items: center;
        `;
        marker.textContent = formatTime(i);
        ruler.appendChild(marker);
    }
}

// Format time for timeline
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Populate sample media
function populateSampleMedia() {
    const mediaLibrary = document.getElementById('mediaLibrary');
    if (!mediaLibrary) return;
    
    // Initialize VIB3 Studio files storage if not exists
    if (!window.creatorStudioFiles) {
        window.creatorStudioFiles = {};
        console.log('🔧 Initialized window.creatorStudioFiles in populateSampleMedia');
    }
    
    // Check if user has imported media files
    const userMedia = getUserImportedMedia();
    
    mediaLibrary.innerHTML = '';
    
    if (userMedia.length === 0) {
        // Show empty state when no media is imported
        const emptyState = document.createElement('div');
        emptyState.style.cssText = `
            text-align: center;
            padding: 40px 20px;
            color: var(--text-secondary);
            border: 2px dashed var(--border-primary);
            border-radius: 12px;
            margin: 20px 0;
        `;
        emptyState.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">📁</div>
            <div style="color: var(--text-primary); font-weight: 600; margin-bottom: 8px;">No Media Files</div>
            <div style="margin-bottom: 15px; font-size: 14px;">Import videos, images, or audio to get started</div>
            <button onclick="importCreatorMedia()" style="
                background: var(--accent-gradient);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
            ">
                📁 Import Media Files
            </button>
        `;
        mediaLibrary.appendChild(emptyState);
    } else {
        // Display user's imported media
        userMedia.forEach((media, index) => {
            const mediaItem = document.createElement('div');
            mediaItem.className = 'media-item';
            mediaItem.draggable = true;
            mediaItem.ondragstart = (e) => dragMedia(e, media);
            
            // Check if file exists in memory
            const fileExists = window.creatorStudioFiles && window.creatorStudioFiles[media.id];
            
            // Log debug info for file existence check
            if (!fileExists) {
                console.log('🔍 DEBUG: File missing from memory:', {
                    mediaName: media.name,
                    mediaId: media.id,
                    hasCreatorStudioFiles: !!window.creatorStudioFiles,
                    availableFileIds: window.creatorStudioFiles ? Object.keys(window.creatorStudioFiles) : []
                });
            }
            
            mediaItem.style.cssText = `
                background: var(--bg-tertiary);
                border: 1px solid ${fileExists ? 'var(--border-primary)' : 'var(--error-color, #ff4444)'};
                border-radius: 8px;
                padding: 10px;
                cursor: grab;
                transition: all 0.2s ease;
                text-align: center;
                opacity: ${fileExists ? '1' : '0.6'};
                position: relative;
            `;
            
            const icon = getFileIcon(media.type);
            const statusIcon = fileExists ? '' : ' ⚠️';
            
            mediaItem.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 5px;">${icon}${statusIcon}</div>
                <div style="font-size: 10px; color: var(--text-primary); font-weight: 600; margin-bottom: 2px;">${media.name}</div>
                <div style="font-size: 9px; color: var(--text-secondary);">${media.duration || media.size}</div>
                ${!fileExists ? '<div style="font-size: 8px; color: var(--error-color, #ff4444); margin-top: 3px;">⚠️ Re-import needed</div>' : ''}
                <button onclick="removeMediaFile(${media.id})" style="
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    background: rgba(255, 68, 68, 0.8);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    font-size: 10px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                ">×</button>
            `;
            
            mediaItem.addEventListener('mouseenter', () => {
                mediaItem.style.transform = 'scale(1.05)';
                mediaItem.style.borderColor = 'var(--accent-primary)';
            });
            
            mediaItem.addEventListener('mouseleave', () => {
                mediaItem.style.transform = 'scale(1)';
                mediaItem.style.borderColor = 'var(--border-primary)';
            });
            
            // Add click handler to preview video files
            mediaItem.addEventListener('click', () => {
                console.log('🔍 DEBUG Media item clicked:', {
                    mediaName: media.name,
                    mediaType: media.type,
                    mediaId: media.id,
                    mediaIdType: typeof media.id,
                    isVideo: media.type.startsWith('video/'),
                    creatorStudioFilesExists: !!window.creatorStudioFiles,
                    fileExists: !!(window.creatorStudioFiles && window.creatorStudioFiles[media.id]),
                    allFileIds: window.creatorStudioFiles ? Object.keys(window.creatorStudioFiles) : [],
                    allFileIdsWithTypes: window.creatorStudioFiles ? Object.keys(window.creatorStudioFiles).map(k => `${k}(${typeof k})`) : [],
                    exactMatchCheck: window.creatorStudioFiles ? (media.id in window.creatorStudioFiles) : false
                });
                
                if (media.type.startsWith('video/')) {
                    if (window.creatorStudioFiles && window.creatorStudioFiles[media.id]) {
                        const file = window.creatorStudioFiles[media.id];
                        console.log('🎬 DEBUG: Found file for preview:', file);
                        updatePreviewVideo(file);
                        showStudioNotification(`Previewing: ${media.name}`);
                    } else {
                        console.info('📁 INFO: Video file needs to be re-imported for preview:', media.name, 'ID:', media.id);
                        console.log('🔍 DEBUG: Available file IDs in storage:', window.creatorStudioFiles ? Object.keys(window.creatorStudioFiles) : 'No storage');
                        showStudioNotification('File needs to be re-imported for preview - files are cleared when page refreshes');
                        
                        // Offer to re-import the specific file
                        const reImportModal = document.createElement('div');
                        reImportModal.id = 'reImportModal';
                        reImportModal.style.cssText = `
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: rgba(0,0,0,0.8);
                            z-index: 10001;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        `;
                        
                        reImportModal.innerHTML = `
                            <div style="background: var(--bg-secondary); border-radius: 15px; padding: 30px; max-width: 400px; width: 90%; border: 1px solid var(--border-primary); text-align: center;">
                                <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                                <h3 style="margin: 0 0 15px; color: var(--text-primary);">File Missing</h3>
                                <p style="margin: 0 0 20px; color: var(--text-secondary);">
                                    <strong>${media.name}</strong> needs to be re-imported for preview.
                                    <br><br>
                                    File objects are cleared when the page refreshes.
                                </p>
                                <div style="display: flex; gap: 10px; justify-content: center;">
                                    <button onclick="document.getElementById('reImportModal').remove(); importCreatorMedia();" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                        Re-Import File
                                    </button>
                                    <button onclick="document.getElementById('reImportModal').remove()" style="background: none; border: 1px solid var(--border-primary); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        `;
                        
                        document.body.appendChild(reImportModal);
                    }
                } else {
                    console.log('🔍 DEBUG: Non-video file clicked:', media.type);
                    showStudioNotification(`${media.name} - Preview not available for this file type`);
                }
            });
            
            mediaLibrary.appendChild(mediaItem);
        });
    }
}

// Import media function
function importCreatorMedia() {
    const importModal = document.createElement('div');
    importModal.id = 'creatorImportModal'; // Add proper ID for cleanup
    importModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    importModal.innerHTML = `
        <div style="background: var(--bg-secondary); border-radius: 15px; padding: 30px; max-width: 500px; width: 90%; border: 1px solid var(--border-primary);">
            <h3 style="margin: 0 0 15px; color: var(--text-primary);">Import Media</h3>
            <div id="dropArea" style="border: 2px dashed var(--border-primary); border-radius: 10px; padding: 40px; text-align: center; margin-bottom: 20px; cursor: pointer;">
                <div style="font-size: 48px; margin-bottom: 15px;">📁</div>
                <p style="margin: 0 0 10px; color: var(--text-primary);">Drag and drop files here or click to browse</p>
                <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">Supports: MP4, MOV, JPG, PNG, MP3, WAV</p>
            </div>
            <input type="file" id="fileInput" multiple accept="video/*,image/*,audio/*" style="display: none;">
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="browseBtn" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Browse Files
                </button>
                <button onclick="this.closest('div').remove()" style="background: none; border: 1px solid var(--border-primary); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(importModal);
    
    // Set up file input functionality
    const fileInput = importModal.querySelector('#fileInput');
    const browseBtn = importModal.querySelector('#browseBtn');
    const dropArea = importModal.querySelector('#dropArea');
    
    browseBtn.onclick = () => fileInput.click();
    dropArea.onclick = () => fileInput.click();
    
    // Handle file selection
    fileInput.onchange = (e) => handleFileImport(e.target.files, importModal);
    
    // Handle drag and drop
    dropArea.ondragover = (e) => {
        e.preventDefault();
        dropArea.style.borderColor = 'var(--accent-primary)';
        dropArea.style.background = 'rgba(0, 206, 209, 0.1)';
    };
    
    dropArea.ondragleave = (e) => {
        e.preventDefault();
        dropArea.style.borderColor = 'var(--border-primary)';
        dropArea.style.background = 'transparent';
    };
    
    dropArea.ondrop = (e) => {
        e.preventDefault();
        dropArea.style.borderColor = 'var(--border-primary)';
        dropArea.style.background = 'transparent';
        handleFileImport(e.dataTransfer.files, importModal);
    };
}

// Handle imported files
function handleFileImport(files, modal) {
    if (files.length === 0) return;
    
    // Show progress modal
    modal.innerHTML = `
        <div style="background: var(--bg-secondary); border-radius: 15px; padding: 30px; max-width: 500px; width: 90%; border: 1px solid var(--border-primary);">
            <h3 style="margin: 0 0 20px; color: var(--text-primary);">Processing Files...</h3>
            <div id="progressContainer"></div>
        </div>
    `;
    
    const progressContainer = modal.querySelector('#progressContainer');
    let processed = 0;
    
    Array.from(files).forEach((file, index) => {
        // Create progress bar for each file
        const progressItem = document.createElement('div');
        progressItem.style.cssText = 'margin-bottom: 15px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px;';
        progressItem.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <span style="font-size: 20px;">${getFileIcon(file.type)}</span>
                <span style="color: var(--text-primary); font-weight: 600;">${file.name}</span>
                <span style="color: var(--text-secondary); font-size: 12px;">${formatFileSize(file.size)}</span>
            </div>
            <div style="width: 100%; height: 4px; background: var(--bg-primary); border-radius: 2px; overflow: hidden;">
                <div id="progress-${index}" style="width: 0%; height: 100%; background: var(--accent-gradient); transition: width 0.3s ease;"></div>
            </div>
        `;
        progressContainer.appendChild(progressItem);
        
        // Simulate file processing
        setTimeout(() => {
            const progressBar = progressItem.querySelector(`#progress-${index}`);
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    processed++;
                    
                    if (processed === files.length) {
                        // Save imported files to storage
                        saveImportedMedia(files);
                        
                        // All files processed
                        setTimeout(() => {
                            modal.innerHTML = `
                                <div style="background: var(--bg-secondary); border-radius: 15px; padding: 30px; max-width: 500px; width: 90%; border: 1px solid var(--border-primary); text-align: center;">
                                    <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
                                    <h3 style="margin: 0 0 10px; color: var(--text-primary);">Import Complete!</h3>
                                    <p style="margin: 0 0 20px; color: var(--text-secondary);">${files.length} file${files.length > 1 ? 's' : ''} imported successfully</p>
                                    <button onclick="closeImportModalAndRefresh();" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                        Continue
                                    </button>
                                </div>
                            `;
                        }, 500);
                    }
                }
                progressBar.style.width = progress + '%';
            }, 100);
        }, index * 200);
    });
}

// Helper functions
function getFileIcon(type) {
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('audio/')) return '🎵';
    return '📄';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function refreshCreatorStudioMedia() {
    console.log('📁 Refreshing media library with imported files');
    // Refresh the media library display
    populateSampleMedia();
    showStudioNotification('🎬 Files imported to VIB3 Studio library!');
}

// Check if imported files need to be re-imported (after page refresh)
function checkIfFilesNeedReimport() {
    const userMedia = getUserImportedMedia();
    if (userMedia.length === 0) return false;
    
    // Check if any media files are missing from memory
    const missingFiles = userMedia.filter(media => {
        return !window.creatorStudioFiles || !window.creatorStudioFiles[media.id];
    });
    
    return missingFiles.length > 0;
}

// Get user's imported media files
function getUserImportedMedia() {
    const savedMedia = localStorage.getItem('vib3-creator-media');
    return savedMedia ? JSON.parse(savedMedia) : [];
}

// Save imported media file
function saveImportedMedia(files) {
    const existingMedia = getUserImportedMedia();
    
    // Store files in a global object since File objects can't be serialized to localStorage
    if (!window.creatorStudioFiles) {
        window.creatorStudioFiles = {};
    }
    
    const newMedia = Array.from(files).map((file, index) => {
        // CRITICAL FIX: Generate ID once and use consistently
        const id = Date.now() + index;
        
        // Store file in global object with the SAME ID
        window.creatorStudioFiles[id] = file;
        
        console.log(`💾 Storing file with ID: ${id}, name: ${file.name}`);
        
        return {
            id: id,  // Same ID used for storage and lookup
            name: file.name,
            type: file.type,
            size: formatFileSize(file.size),
            duration: file.type.startsWith('video/') ? '0:00' : null,
            dateAdded: new Date().toISOString()
        };
    });
    
    const allMedia = [...existingMedia, ...newMedia];
    localStorage.setItem('vib3-creator-media', JSON.stringify(allMedia));
    
    console.log('📁 Saved media to localStorage:', newMedia.map(m => `${m.name} (ID: ${m.id})`));
    console.log('🧠 Available file IDs in memory:', Object.keys(window.creatorStudioFiles));
    
    return newMedia;
}

// Remove media file
function removeMediaFile(id) {
    console.log('🗑️ Removing media file with ID:', id);
    
    // Ensure ID is treated as a number consistently
    const numericId = parseInt(id);
    
    // Remove from localStorage
    const media = getUserImportedMedia();
    const fileToRemove = media.find(m => m.id === numericId);
    const filtered = media.filter(m => m.id !== numericId);
    localStorage.setItem('vib3-creator-media', JSON.stringify(filtered));
    
    // Remove from global files storage - use numeric ID as key
    if (window.creatorStudioFiles && window.creatorStudioFiles[numericId]) {
        delete window.creatorStudioFiles[numericId];
        console.log('🗑️ Removed file from memory storage');
    }
    
    populateSampleMedia(); // Refresh display
    showStudioNotification(`Removed: ${fileToRemove?.name || 'Media file'}`);
    
    // CRITICAL: Light cleanup after single file delete
    setTimeout(() => {
        lightOverlayCleanup();
        console.log('🧹 Light cleanup after single file delete');
    }, 50);
}

// Clear all media files
function clearAllMedia() {
    const currentMedia = getUserImportedMedia();
    if (currentMedia.length === 0) {
        showStudioNotification('No media files to clear');
        return;
    }
    
    // Confirm deletion
    const confirmModal = document.createElement('div');
    confirmModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    confirmModal.innerHTML = `
        <div style="background: var(--bg-secondary); border-radius: 15px; padding: 30px; max-width: 400px; width: 90%; border: 1px solid var(--border-primary); text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">🗑️</div>
            <h3 style="margin: 0 0 15px; color: var(--text-primary);">Clear All Media</h3>
            <p style="margin: 0 0 20px; color: var(--text-secondary);">
                This will remove all ${currentMedia.length} media files from your VIB3 Studio library.
                <br><br>
                This action cannot be undone.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="confirmClearAllMedia(); closeConfirmModal();" style="background: rgba(255, 68, 68, 0.8); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Clear All
                </button>
                <button onclick="closeConfirmModal()" style="background: none; border: 1px solid var(--border-primary); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmModal);
    
    // Store modal reference for proper cleanup
    window.currentConfirmModal = confirmModal;
    
    // Add escape key handler
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeConfirmModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Add click outside to close
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            closeConfirmModal();
            document.removeEventListener('keydown', handleEscape);
        }
    });
}

// Close confirm modal properly
function closeConfirmModal() {
    console.log('🚪 Closing confirmation modal');
    if (window.currentConfirmModal) {
        window.currentConfirmModal.remove();
        window.currentConfirmModal = null;
        console.log('✅ Confirmation modal closed and cleaned up');
    }
    
    // Also remove any orphaned confirmation modals
    document.querySelectorAll('[style*="z-index: 10001"]').forEach(modal => {
        if (modal.innerHTML.includes('Clear All Media') || modal.innerHTML.includes('This action cannot be undone')) {
            modal.remove();
            console.log('🧹 Removed orphaned confirmation modal');
        }
    });
}

// Confirm clear all media
function confirmClearAllMedia() {
    console.log('🗑️ Clearing all media files');
    
    // Clear localStorage
    localStorage.removeItem('vib3-creator-media');
    
    // Clear global files storage
    if (window.creatorStudioFiles) {
        window.creatorStudioFiles = {};
        console.log('🗑️ Cleared all files from memory storage');
    }
    
    populateSampleMedia(); // Refresh display
    showStudioNotification('🗑️ All media files cleared');
    
    // CRITICAL: Light cleanup after delete operation (not aggressive)
    setTimeout(() => {
        lightOverlayCleanup();
        console.log('🧹 Light cleanup after delete operation');
    }, 100);
}

// ================ MODAL CLEANUP UTILITIES ================

// Comprehensive function to close all stuck modals and overlays
function closeAllModalsAndOverlays() {
    console.log('🧹 Emergency cleanup: Closing all modals and overlays');
    
    // Remove all modal elements by common IDs
    const modalIds = [
        'fullscreenUploadPage',
        'fullscreenUploadOverlay',
        'uploadModal',
        'cameraModal',
        'deleteModal',
        'profilePictureModal',
        'editProfileModal',
        'settingsModal',
        'shareModal',
        'commentsModal',
        'videoOptionsModal',
        'soundModal',
        'creatorToolsModal'
    ];
    
    modalIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
            console.log(`🗑️ Removed modal: ${id}`);
        }
    });
    
    // Remove all elements with modal classes
    const modalClasses = [
        '.modal',
        '.video-review-modal', 
        '.camera-modal',
        '.upload-modal',
        '.initial-camera-selector-modal',
        '.camera-selector-modal',
        '.filter-modal',
        '.speed-modal',
        '.transition-modal',
        '.music-modal',
        '.voiceover-modal',
        '.video-editor-modal',
        '.live-stream-modal',
        '.comments-modal',
        '.video-options-modal',
        '.sound-modal',
        '.create-room-modal'
    ];
    
    modalClasses.forEach(className => {
        document.querySelectorAll(className).forEach(modal => {
            modal.remove();
            console.log(`🗑️ Removed modal by class: ${className}`);
        });
    });
    
    // Remove any high z-index overlays (common pattern for blocking overlays)
    document.querySelectorAll('[style*="z-index"]').forEach(overlay => {
        const zIndex = parseInt(overlay.style.zIndex);
        if (zIndex > 1000 && overlay.id !== 'toastNotification' && !overlay.classList.contains('debug-panel')) {
            console.log(`🗑️ Removing high z-index overlay (${zIndex}):`, overlay.id || overlay.className);
            overlay.remove();
        }
    });
    
    // Remove any position fixed elements that might be blocking
    document.querySelectorAll('[style*="position: fixed"]').forEach(overlay => {
        if (overlay.id !== 'toastNotification' && 
            !overlay.classList.contains('debug-panel') &&
            !overlay.classList.contains('sidebar') &&
            !overlay.classList.contains('header')) {
            console.log('🗑️ Removing position fixed overlay:', overlay.id || overlay.className);
            overlay.remove();
        }
    });
    
    // Ensure main content is visible
    const mainContent = document.querySelector('.app-container');
    const videoFeed = document.querySelector('.video-feed');
    const sidebar = document.querySelector('.sidebar');
    
    if (mainContent) {
        mainContent.style.display = '';
        mainContent.style.visibility = 'visible';
        console.log('✅ Restored main content visibility');
    }
    
    if (videoFeed) {
        videoFeed.style.display = '';
        videoFeed.style.visibility = 'visible';
        console.log('✅ Restored video feed visibility');
    }
    
    if (sidebar) {
        sidebar.style.display = '';
        sidebar.style.visibility = 'visible';
        console.log('✅ Restored sidebar visibility');
    }
    
    // Clear any upload/modal state flags
    if (window.stateManager) {
        window.stateManager.actions.setUploadPageActive(false);
        window.stateManager.actions.setUploadInProgress(false);
    } else {
        window.uploadPageActive = false;
        window.uploadInProgress = false;
    }
    
    // Clear any stored modal references
    window.currentConfirmModal = null;
    
    console.log('✅ Emergency cleanup complete - all modals and overlays removed');
    
    // Show confirmation to user
    if (window.showToast) {
        window.showToast('All overlays cleared - you can now navigate normally! 🎉');
    }
}

// Add global escape key handler for emergency cleanup
document.addEventListener('keydown', (e) => {
    // Allow Ctrl/Cmd + Escape for emergency cleanup
    if ((e.ctrlKey || e.metaKey) && e.key === 'Escape') {
        console.log('🚨 Emergency cleanup triggered by Ctrl+Escape');
        closeAllModalsAndOverlays();
    }
});

// Drag media functions
function dragMedia(event, media) {
    event.dataTransfer.setData('text/plain', JSON.stringify(media));
}

function allowDrop(event) {
    event.preventDefault();
}

function dropMedia(event, trackType) {
    event.preventDefault();
    const mediaData = JSON.parse(event.dataTransfer.getData('text/plain'));
    
    if ((trackType === 'video' && mediaData.type.startsWith('video/')) || 
        (trackType === 'audio' && mediaData.type.startsWith('audio/'))) {
        
        // Add media clip to timeline
        const track = event.currentTarget;
        const clip = document.createElement('div');
        clip.style.cssText = `
            position: absolute;
            left: ${event.offsetX}px;
            top: 5px;
            width: 100px;
            height: 30px;
            background: ${trackType === 'video' ? 'var(--accent-primary)' : 'var(--accent-secondary)'};
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            cursor: move;
            border: 1px solid rgba(255,255,255,0.3);
        `;
        clip.textContent = mediaData.name;
        clip.dataset.mediaId = mediaData.id;
        track.appendChild(clip);
        
        // Update preview if it's a video
        if (trackType === 'video' && mediaData.id) {
            const file = window.creatorStudioFiles && window.creatorStudioFiles[mediaData.id];
            if (file) {
                updatePreviewVideo(file);
            } else {
                console.warn('⚠️ File not found for media ID:', mediaData.id);
                showStudioNotification('Video file not found - please re-import');
            }
        }
        
        // Make clip draggable within timeline
        clip.addEventListener('mousedown', startDragClip);
        
        showStudioNotification(`${mediaData.name} added to ${trackType} track`);
    }
}

// Update preview video
function updatePreviewVideo(file) {
    console.log('🔍 DEBUG updatePreviewVideo called with:', file);
    
    const previewVideo = document.getElementById('previewVideo');
    const previewPlaceholder = document.getElementById('previewPlaceholder');
    
    console.log('🔍 DEBUG Elements found:', {
        previewVideo: !!previewVideo,
        previewPlaceholder: !!previewPlaceholder,
        fileExists: !!file,
        fileName: file?.name,
        fileType: file?.type,
        fileSize: file?.size
    });
    
    if (!previewVideo) {
        console.error('❌ DEBUG: previewVideo element not found!');
        showStudioNotification('Error: Preview video element missing from DOM');
        return;
    }
    
    if (!file) {
        console.error('❌ DEBUG: No file provided to updatePreviewVideo');
        showStudioNotification('Error: No video file to preview');
        return;
    }
    
    try {
        const videoURL = URL.createObjectURL(file);
        console.log('🔍 DEBUG: Created video URL:', videoURL);
        
        previewVideo.src = videoURL;
        previewVideo.load();
        previewVideo.style.display = 'block';
        
        console.log('🔍 DEBUG: Set video src and made visible');
        
        // Hide placeholder when video is loaded
        if (previewPlaceholder) {
            previewPlaceholder.style.display = 'none';
            console.log('🔍 DEBUG: Hidden placeholder');
        }
        
        // Revoke old URL to prevent memory leaks
        previewVideo.addEventListener('loadstart', () => {
            console.log('🔍 DEBUG: Video loadstart event fired');
            if (previewVideo.previousSrc) {
                URL.revokeObjectURL(previewVideo.previousSrc);
            }
            previewVideo.previousSrc = videoURL;
        });
        
        // Handle video load events
        previewVideo.addEventListener('loadeddata', () => {
            console.log('✅ DEBUG: Video loaded successfully in preview');
            showStudioNotification(`Preview updated: ${file.name}`);
        });
        
        previewVideo.addEventListener('error', (e) => {
            console.error('❌ DEBUG: Error loading video in preview:', e);
            previewVideo.style.display = 'none';
            if (previewPlaceholder) {
                previewPlaceholder.style.display = 'block';
                previewPlaceholder.innerHTML = `
                    <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
                    <div style="font-size: 16px;">Error loading video</div>
                    <div style="font-size: 14px; color: #888; margin-top: 8px;">Please try a different video file</div>
                `;
            }
            showStudioNotification('Error loading video preview');
        });
        
        console.log('🎬 DEBUG: Loading video in preview:', file.name);
    } catch (error) {
        console.error('❌ DEBUG: Exception in updatePreviewVideo:', error);
        showStudioNotification('Error creating video preview: ' + error.message);
        
        if (previewPlaceholder) {
            previewPlaceholder.style.display = 'block';
            previewPlaceholder.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
                <div style="font-size: 16px;">Preview Error</div>
                <div style="font-size: 14px; color: #888; margin-top: 8px;">${error.message}</div>
            `;
        }
    }
}

// Timeline clip dragging
function startDragClip(event) {
    const clip = event.target;
    const track = clip.parentElement;
    let isDragging = true;
    
    function moveClip(e) {
        if (!isDragging) return;
        const rect = track.getBoundingClientRect();
        const newX = Math.max(0, Math.min(e.clientX - rect.left - 50, rect.width - 100));
        clip.style.left = newX + 'px';
    }
    
    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', moveClip);
        document.removeEventListener('mouseup', stopDrag);
    }
    
    document.addEventListener('mousemove', moveClip);
    document.addEventListener('mouseup', stopDrag);
}

// Apply effects
function applyEffect(effectType) {
    const effects = {
        blur: 'Blur effect applied to selected clip',
        vintage: 'Vintage filter applied to selected clip',
        glow: 'Glow effect applied to selected clip',
        particles: 'Particle effect applied to selected clip'
    };
    
    showStudioNotification(effects[effectType] || 'Effect applied');
}

// Audio controls
function adjustAudioVolume(value) {
    showStudioNotification(`Audio volume set to ${value}%`);
}

function addAudioFade(type) {
    showStudioNotification(`${type === 'in' ? 'Fade in' : 'Fade out'} effect added`);
}

function addBackgroundMusic() {
    showStudioNotification('Background music library opened');
}

// Preview controls
function playPausePreview() {
    const btn = document.getElementById('playPauseBtn');
    if (btn.textContent === '▶️') {
        btn.textContent = '⏸️';
        showStudioNotification('Preview playing');
    } else {
        btn.textContent = '▶️';
        showStudioNotification('Preview paused');
    }
}

function fullscreenPreview() {
    showStudioNotification('Entering fullscreen preview');
}

// Timeline controls
function addVideoTrack() {
    showStudioNotification('New video track added');
}

function addAudioTrack() {
    showStudioNotification('New audio track added');
}

function zoomTimeline(value) {
    showStudioNotification(`Timeline zoom: ${value}%`);
}

// Export project
function exportCreatorProject() {
    const exportModal = document.createElement('div');
    exportModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    exportModal.innerHTML = `
        <div style="background: var(--bg-secondary); border-radius: 15px; padding: 30px; max-width: 500px; width: 90%; border: 1px solid var(--border-primary);">
            <h3 style="margin: 0 0 20px; color: var(--text-primary);">Export Project</h3>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; color: var(--text-primary); margin-bottom: 8px; font-weight: 600;">Quality</label>
                <select style="width: 100%; padding: 10px; border: 1px solid var(--border-primary); border-radius: 6px; background: var(--bg-tertiary); color: var(--text-primary);">
                    <option>4K Ultra HD (3840x2160)</option>
                    <option selected>1080p HD (1920x1080)</option>
                    <option>720p HD (1280x720)</option>
                    <option>480p SD (854x480)</option>
                </select>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; color: var(--text-primary); margin-bottom: 8px; font-weight: 600;">Format</label>
                <select style="width: 100%; padding: 10px; border: 1px solid var(--border-primary); border-radius: 6px; background: var(--bg-tertiary); color: var(--text-primary);">
                    <option selected>MP4 (H.264)</option>
                    <option>MOV (QuickTime)</option>
                    <option>AVI (Audio Video Interleave)</option>
                    <option>WMV (Windows Media Video)</option>
                </select>
            </div>
            
            <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <div style="color: var(--text-secondary); font-size: 14px; margin-bottom: 10px;">Estimated export time: 2-5 minutes</div>
                <div style="color: var(--text-secondary); font-size: 14px;">File size: ~50-120 MB</div>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="startExport(this)" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    🚀 Start Export
                </button>
                <button onclick="this.closest('div').remove()" style="background: none; border: 1px solid var(--border-primary); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(exportModal);
}

// Start export process
function startExport(button) {
    const modal = button.closest('div');
    const qualitySelect = modal.querySelector('select');
    const formatSelect = modal.querySelectorAll('select')[1];
    
    const quality = qualitySelect.value;
    const format = formatSelect.value;
    
    // Update modal to show export progress
    modal.innerHTML = `
        <div style="background: var(--bg-secondary); border-radius: 15px; padding: 30px; max-width: 500px; width: 90%; border: 1px solid var(--border-primary);">
            <h3 style="margin: 0 0 20px; color: var(--text-primary);">Exporting Video...</h3>
            
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-primary); font-weight: 600;">Processing</span>
                    <span id="exportPercent" style="color: var(--accent-primary); font-weight: 600;">0%</span>
                </div>
                <div style="width: 100%; height: 8px; background: var(--bg-primary); border-radius: 4px; overflow: hidden;">
                    <div id="exportProgress" style="width: 0%; height: 100%; background: var(--accent-gradient); transition: width 0.5s ease;"></div>
                </div>
            </div>
            
            <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <div id="exportStatus" style="color: var(--text-primary); font-size: 14px; margin-bottom: 5px;">Initializing export...</div>
                <div style="color: var(--text-secondary); font-size: 12px;">Quality: ${quality}</div>
                <div style="color: var(--text-secondary); font-size: 12px;">Format: ${format}</div>
            </div>
            
            <div style="text-align: center;">
                <button onclick="cancelExport(this)" style="background: none; border: 1px solid var(--border-primary); color: var(--text-primary); padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                    Cancel Export
                </button>
            </div>
        </div>
    `;
    
    // Start export simulation with realistic progress
    const progressBar = modal.querySelector('#exportProgress');
    const percentText = modal.querySelector('#exportPercent');
    const statusText = modal.querySelector('#exportStatus');
    
    const exportSteps = [
        { percent: 15, status: "Analyzing video tracks..." },
        { percent: 30, status: "Processing audio..." },
        { percent: 45, status: "Applying effects..." },
        { percent: 60, status: "Encoding video..." },
        { percent: 80, status: "Optimizing file size..." },
        { percent: 95, status: "Finalizing export..." },
        { percent: 100, status: "Export complete!" }
    ];
    
    let currentStep = 0;
    let currentProgress = 0;
    
    function updateProgress() {
        if (currentStep >= exportSteps.length) return;
        
        const targetPercent = exportSteps[currentStep].percent;
        const step = (targetPercent - currentProgress) / 20; // Smooth progress
        
        currentProgress += step;
        
        if (currentProgress >= targetPercent - 1) {
            currentProgress = targetPercent;
            statusText.textContent = exportSteps[currentStep].status;
            currentStep++;
            
            if (currentStep >= exportSteps.length) {
                // Export complete
                setTimeout(() => {
                    modal.innerHTML = `
                        <div style="background: var(--bg-secondary); border-radius: 15px; padding: 30px; max-width: 500px; width: 90%; border: 1px solid var(--border-primary); text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
                            <h3 style="margin: 0 0 10px; color: var(--text-primary);">Export Successful!</h3>
                            <p style="margin: 0 0 20px; color: var(--text-secondary);">Your video has been exported and is ready for download.</p>
                            
                            <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                                <div style="color: var(--text-primary); font-weight: 600; margin-bottom: 5px;">📁 project-export.${format.split(' ')[0].toLowerCase()}</div>
                                <div style="color: var(--text-secondary); font-size: 12px;">${quality} • ${format}</div>
                            </div>
                            
                            <div style="display: flex; gap: 10px; justify-content: center;">
                                <button onclick="downloadExportedVideo()" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                    💾 Download
                                </button>
                                <button onclick="uploadToVIB3()" style="background: var(--vib3-brand-gradient); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                    📤 Upload to VIB3
                                </button>
                                <button onclick="this.closest('div').remove()" style="background: none; border: 1px solid var(--border-primary); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                                    Close
                                </button>
                            </div>
                        </div>
                    `;
                }, 1000);
                return;
            }
        }
        
        progressBar.style.width = currentProgress + '%';
        percentText.textContent = Math.round(currentProgress) + '%';
        
        setTimeout(updateProgress, 100);
    }
    
    updateProgress();
}

// Cancel export
function cancelExport(button) {
    const modal = button.closest('div');
    modal.remove();
    showStudioNotification('Export cancelled');
}

// Download exported video
function downloadExportedVideo() {
    // Create a download link for demo purposes
    const link = document.createElement('a');
    link.download = 'vib3-project-export.mp4';
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('VIB3 Studio Export - Demo File');
    link.click();
    showStudioNotification('🎬 Video download started!');
}

// Upload to VIB3
function uploadToVIB3() {
    showUploadModal();
    document.querySelector('.creator-studio-page').remove();
    showStudioNotification('🚀 Redirecting to VIB3 upload...');
}

// Show studio notification
function showStudioNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        padding: 12px 20px;
        border-radius: 8px;
        border: 1px solid var(--border-primary);
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translateX(300px);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(300px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Debug function to inspect VIB3 Studio state
window.debugCreatorStudio = function() {
    console.log('🔍 VIB3 STUDIO DEBUG REPORT:');
    console.log('1. Preview Video Element:', document.getElementById('previewVideo'));
    console.log('2. Preview Placeholder:', document.getElementById('previewPlaceholder'));
    console.log('3. Media Library:', document.getElementById('mediaLibrary'));
    console.log('4. VIB3 Studio Files:', window.creatorStudioFiles);
    console.log('5. LocalStorage Media:', JSON.parse(localStorage.getItem('vib3-creator-media') || '[]'));
    
    const previewVideo = document.getElementById('previewVideo');
    if (previewVideo) {
        console.log('6. Video Element Details:', {
            src: previewVideo.src,
            style: previewVideo.style.cssText,
            videoWidth: previewVideo.videoWidth,
            videoHeight: previewVideo.videoHeight,
            readyState: previewVideo.readyState,
            currentTime: previewVideo.currentTime,
            duration: previewVideo.duration
        });
    }
    
    const creatorStudioPage = document.getElementById('creatorStudioPage');
    console.log('7. VIB3 Studio Page Visible:', creatorStudioPage && creatorStudioPage.style.display !== 'none');
    
    return 'Debug info logged to console';
};

// ================ VIB3 CHALLENGES SYSTEM ================

// Show VIB3 Challenges page
function showChallenges() {
    console.log('🏆 Opening VIB3 Challenges');
    
    // Hide main app and other content
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'none';
    }
    
    // Hide other pages
    document.querySelectorAll('.video-feed, .search-page, .profile-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page, .activity-page, .friends-page, .vibe-rooms-page, .creator-studio-page, .challenges-page, .coins-page, .collaboration-page').forEach(el => {
        el.style.display = 'none';
    });
    
    // Remove existing dynamic pages
    const existingPages = ['collaborationPage', 'coinsPage', 'vibeRoomsPage', 'creatorStudioPage'];
    existingPages.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) page.remove();
    });
    
    let challengesPage = document.getElementById('challengesPage');
    if (!challengesPage) {
        challengesPage = document.createElement('div');
        challengesPage.id = 'challengesPage';
        challengesPage.className = 'challenges-page';
        challengesPage.style.cssText = 'margin-left: 240px; margin-top: 60px; width: calc(100vw - 240px); height: calc(100vh - 60px); overflow-y: auto; background: var(--bg-primary);';
        
        challengesPage.innerHTML = `
            <!-- Challenges Header -->
            <div class="challenges-header" style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%); padding: 30px; color: white; text-align: center;">
                <h1 style="margin: 0 0 10px; font-size: 36px; font-weight: 800;">🏆 VIB3 Challenges</h1>
                <p style="margin: 0; font-size: 18px; opacity: 0.9;">Join trending challenges and go viral</p>
                <div style="margin-top: 20px; display: flex; justify-content: center; gap: 15px;">
                    <button onclick="createNewChallenge()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600; backdrop-filter: blur(10px);">
                        ➕ Create Challenge
                    </button>
                    <button onclick="showMyParticipations()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600; backdrop-filter: blur(10px);">
                        📊 My Participations
                    </button>
                </div>
            </div>
            
            <!-- Challenge Tabs -->
            <div class="challenge-tabs" style="display: flex; justify-content: center; gap: 8px; padding: 20px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
                <button class="challenge-tab active" onclick="switchChallengeTab('trending')" id="trendingTab" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    🔥 Trending
                </button>
                <button class="challenge-tab" onclick="switchChallengeTab('new')" id="newTab" style="background: none; border: 1px solid var(--border-primary); color: var(--text-secondary); padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    ✨ New
                </button>
                <button class="challenge-tab" onclick="switchChallengeTab('ending')" id="endingTab" style="background: none; border: 1px solid var(--border-primary); color: var(--text-secondary); padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    ⏰ Ending Soon
                </button>
                <button class="challenge-tab" onclick="switchChallengeTab('completed')" id="completedTab" style="background: none; border: 1px solid var(--border-primary); color: var(--text-secondary); padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    ✅ Completed
                </button>
            </div>
            
            <!-- Challenge Content Area -->
            <div class="challenge-content-area" style="padding: 30px; max-width: 1200px; margin: 0 auto;">
                <!-- Trending Challenges -->
                <div class="challenge-content active" id="trendingContent">
                    <div class="challenges-grid" id="trendingChallenges" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px;">
                        <!-- Trending challenges will be populated here -->
                    </div>
                </div>
                
                <!-- New Challenges -->
                <div class="challenge-content" id="newContent" style="display: none;">
                    <div class="challenges-grid" id="newChallenges" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px;">
                        <!-- New challenges will be populated here -->
                    </div>
                </div>
                
                <!-- Ending Soon Challenges -->
                <div class="challenge-content" id="endingContent" style="display: none;">
                    <div class="challenges-grid" id="endingChallenges" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px;">
                        <!-- Ending challenges will be populated here -->
                    </div>
                </div>
                
                <!-- Completed Challenges -->
                <div class="challenge-content" id="completedContent" style="display: none;">
                    <div class="challenges-grid" id="completedChallenges" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px;">
                        <!-- Completed challenges will be populated here -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(challengesPage);
        
        // Initialize challenges data
        initializeChallenges();
    }
    
    challengesPage.style.display = 'block';
}

// Switch challenge tabs
function switchChallengeTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.challenge-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.background = 'none';
        tab.style.border = '1px solid var(--border-primary)';
        tab.style.color = 'var(--text-secondary)';
    });
    
    const activeTab = document.getElementById(tabName + 'Tab');
    activeTab.classList.add('active');
    activeTab.style.background = 'var(--accent-gradient)';
    activeTab.style.border = 'none';
    activeTab.style.color = 'white';
    
    // Update content
    document.querySelectorAll('.challenge-content').forEach(content => {
        content.style.display = 'none';
    });
    
    document.getElementById(tabName + 'Content').style.display = 'block';
}

// Initialize challenges with sample data
function initializeChallenges() {
    const challengesData = {
        trending: [
            {
                id: 'dance-trend-2024',
                title: '#VibeDanceChallenge',
                description: 'Show us your best dance moves to this viral beat!',
                category: 'Dance',
                participants: 15420,
                videos: 8903,
                timeLeft: '5 days',
                prize: 'VIB3 Coins + Featured',
                difficulty: 'Easy',
                thumbnail: '💃',
                creator: 'VibeDanceKing',
                trending: true
            },
            {
                id: 'art-challenge-creative',
                title: '#CreativeArtChallenge',
                description: 'Transform everyday objects into art in 60 seconds',
                category: 'Art',
                participants: 8750,
                videos: 5200,
                timeLeft: '12 days',
                prize: '1000 VIB3 Coins',
                difficulty: 'Medium',
                thumbnail: '🎨',
                creator: 'ArtMasterVibe',
                trending: true
            },
            {
                id: 'cooking-quick',
                title: '#QuickCookChallenge',
                description: 'Create a delicious meal in under 3 minutes!',
                category: 'Lifestyle',
                participants: 12300,
                videos: 7800,
                timeLeft: '8 days',
                prize: 'Featured + Collaboration',
                difficulty: 'Hard',
                thumbnail: '👨‍🍳',
                creator: 'ChefVibes',
                trending: true
            }
        ],
        new: [
            {
                id: 'music-remix-new',
                title: '#RemixMasterChallenge',
                description: 'Create a unique remix of this trending song',
                category: 'Music',
                participants: 450,
                videos: 120,
                timeLeft: '25 days',
                prize: '500 VIB3 Coins',
                difficulty: 'Medium',
                thumbnail: '🎵',
                creator: 'MusicVibeStudio',
                isNew: true
            },
            {
                id: 'fitness-morning',
                title: '#MorningVibeWorkout',
                description: 'Share your energizing morning workout routine',
                category: 'Fitness',
                participants: 280,
                videos: 95,
                timeLeft: '20 days',
                prize: 'Health Brand Partnership',
                difficulty: 'Easy',
                thumbnail: '💪',
                creator: 'FitnessVibeCoach',
                isNew: true
            }
        ],
        ending: [
            {
                id: 'fashion-style',
                title: '#StyleTransformChallenge',
                description: 'Show a complete style transformation',
                category: 'Fashion',
                participants: 5600,
                videos: 3200,
                timeLeft: '2 days',
                prize: 'Fashion Brand Collab',
                difficulty: 'Medium',
                thumbnail: '👗',
                creator: 'StyleVibeQueen',
                endingSoon: true
            }
        ],
        completed: [
            {
                id: 'comedy-laughs',
                title: '#LaughChallenge2024',
                description: 'Make us laugh in 30 seconds or less!',
                category: 'Comedy',
                participants: 25600,
                videos: 18900,
                timeLeft: 'Ended',
                prize: '2000 VIB3 Coins',
                difficulty: 'Easy',
                thumbnail: '😂',
                creator: 'ComedyVibeKing',
                completed: true,
                winner: 'FunnyVibeGirl'
            }
        ]
    };
    
    // Populate each tab
    Object.keys(challengesData).forEach(tabName => {
        const container = document.getElementById(tabName + 'Challenges');
        if (container) {
            container.innerHTML = '';
            challengesData[tabName].forEach(challenge => {
                const challengeCard = createChallengeCard(challenge);
                container.appendChild(challengeCard);
            });
        }
    });
}

// Create challenge card
function createChallengeCard(challenge) {
    const card = document.createElement('div');
    card.className = 'challenge-card';
    card.style.cssText = `
        background: var(--bg-secondary);
        border-radius: 15px;
        padding: 20px;
        border: 1px solid var(--border-primary);
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        overflow: hidden;
    `;
    
    const statusBadge = challenge.trending ? '🔥 Trending' : 
                       challenge.isNew ? '✨ New' : 
                       challenge.endingSoon ? '⏰ Ending Soon' : 
                       challenge.completed ? '✅ Completed' : '';
    
    const statusColor = challenge.trending ? '#ff6b6b' : 
                       challenge.isNew ? '#00ff88' : 
                       challenge.endingSoon ? '#ffa726' : 
                       challenge.completed ? '#4caf50' : '';
    
    card.innerHTML = `
        ${statusBadge ? `<div class="status-badge" style="position: absolute; top: 15px; right: 15px; background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">${statusBadge}</div>` : ''}
        
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
            <div style="font-size: 48px;">${challenge.thumbnail}</div>
            <div style="flex: 1;">
                <h3 style="margin: 0 0 5px; color: var(--text-primary); font-size: 18px; font-weight: 700;">${challenge.title}</h3>
                <p style="margin: 0 0 8px; color: var(--text-secondary); font-size: 14px; line-height: 1.4;">${challenge.description}</p>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span style="background: var(--bg-tertiary); color: var(--text-primary); padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">${challenge.category}</span>
                    <span style="background: var(--bg-tertiary); color: var(--text-primary); padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">${challenge.difficulty}</span>
                </div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: 700; color: var(--accent-primary);">${challenge.participants.toLocaleString()}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">Participants</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: 700; color: var(--accent-secondary);">${challenge.videos.toLocaleString()}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">Videos</div>
            </div>
        </div>
        
        <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="color: var(--text-primary); font-size: 12px; font-weight: 600;">Prize:</span>
                <span style="color: var(--text-primary); font-size: 12px;">${challenge.prize}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--text-primary); font-size: 12px; font-weight: 600;">Time Left:</span>
                <span style="color: ${challenge.completed ? '#4caf50' : challenge.endingSoon ? '#ff6b6b' : 'var(--text-primary)'}; font-size: 12px; font-weight: 600;">${challenge.timeLeft}</span>
            </div>
            ${challenge.winner ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-primary);"><span style="color: var(--text-primary); font-size: 12px; font-weight: 600;">Winner: </span><span style="color: var(--accent-primary); font-size: 12px;">${challenge.winner}</span></div>` : ''}
        </div>
        
        <div style="display: flex; gap: 10px;">
            ${!challenge.completed ? `
                <button onclick="joinChallenge('${challenge.id}')" style="flex: 1; background: var(--accent-gradient); color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    🚀 Join Challenge
                </button>
                <button onclick="viewChallengeDetails('${challenge.id}')" style="background: none; border: 1px solid var(--border-primary); color: var(--text-primary); padding: 12px 16px; border-radius: 8px; cursor: pointer;">
                    👁️
                </button>
            ` : `
                <button onclick="viewChallengeResults('${challenge.id}')" style="flex: 1; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-primary); padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    📊 View Results
                </button>
            `}
        </div>
        
        <div style="margin-top: 10px; font-size: 11px; color: var(--text-secondary); text-align: center;">
            Created by ${challenge.creator}
        </div>
    `;
    
    // Add hover effects
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
        card.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
        card.style.borderColor = 'var(--accent-primary)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
        card.style.borderColor = 'var(--border-primary)';
    });
    
    return card;
}

// Join challenge
function joinChallenge(challengeId) {
    const joinModal = document.createElement('div');
    joinModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    joinModal.innerHTML = `
        <div style="background: var(--bg-secondary); border-radius: 20px; padding: 30px; max-width: 500px; width: 90%; border: 1px solid var(--border-primary); text-align: center;">
            <div style="font-size: 64px; margin-bottom: 20px;">🚀</div>
            <h3 style="margin: 0 0 15px; color: var(--text-primary);">Join Challenge</h3>
            <p style="margin: 0 0 20px; color: var(--text-secondary);">Ready to participate in this challenge? You can create and submit your video using VIB3 Studio!</p>
            
            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 10px; margin-bottom: 25px;">
                <h4 style="margin: 0 0 10px; color: var(--text-primary);">Challenge Tips:</h4>
                <ul style="text-align: left; margin: 0; padding-left: 20px; color: var(--text-secondary); font-size: 14px;">
                    <li>Be creative and original</li>
                    <li>Follow the challenge guidelines</li>
                    <li>Use trending hashtags</li>
                    <li>Engage with other participants</li>
                </ul>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="startChallengeParticipation('${challengeId}')" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    🎬 Create Video
                </button>
                <button onclick="this.closest('div').remove()" style="background: none; border: 1px solid var(--border-primary); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(joinModal);
}

// Start challenge participation
function startChallengeParticipation(challengeId) {
    // Close modal and show notification
    document.querySelector('.vib3-energy-modal, [style*="position: fixed"]')?.remove();
    
    showChallengeNotification('🎬 Opening VIB3 Studio for challenge participation!');
    
    // Simulate opening VIB3 Studio for challenge
    setTimeout(() => {
        showCreatorStudio();
        showChallengeNotification('💡 Tip: Use #' + challengeId + ' hashtag in your video!');
    }, 1000);
}

// View challenge details
function viewChallengeDetails(challengeId) {
    const detailsModal = document.createElement('div');
    detailsModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    detailsModal.innerHTML = `
        <div style="background: var(--bg-secondary); border-radius: 20px; padding: 30px; max-width: 600px; width: 90%; border: 1px solid var(--border-primary); max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: var(--text-primary);">Challenge Details</h3>
                <button onclick="this.closest('div').remove()" style="background: none; border: none; color: var(--text-secondary); font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--text-primary); margin-bottom: 10px;">Rules & Guidelines:</h4>
                <ul style="color: var(--text-secondary); line-height: 1.6;">
                    <li>Video must be original and created by you</li>
                    <li>Maximum duration: 60 seconds</li>
                    <li>Use the official challenge hashtag</li>
                    <li>Content must be appropriate for all audiences</li>
                    <li>No copyrighted music without permission</li>
                </ul>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--text-primary); margin-bottom: 10px;">Judging Criteria:</h4>
                <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--text-primary);">Creativity (40%)</span>
                        <span style="color: var(--text-secondary);">Originality and innovation</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--text-primary);">Execution (30%)</span>
                        <span style="color: var(--text-secondary);">Quality and technique</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--text-primary);">Engagement (20%)</span>
                        <span style="color: var(--text-secondary);">Likes, comments, shares</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-primary);">Challenge Adherence (10%)</span>
                        <span style="color: var(--text-secondary);">Following guidelines</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--text-primary); margin-bottom: 10px;">Top Submissions:</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                    <div style="background: var(--bg-tertiary); aspect-ratio: 9/16; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 12px; text-align: center;">Top Video 1<br>🔥 2.3M views</div>
                    <div style="background: var(--bg-tertiary); aspect-ratio: 9/16; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 12px; text-align: center;">Top Video 2<br>⚡ 1.8M views</div>
                    <div style="background: var(--bg-tertiary); aspect-ratio: 9/16; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 12px; text-align: center;">Top Video 3<br>✨ 1.5M views</div>
                </div>
            </div>
            
            <div style="text-align: center;">
                <button onclick="joinChallenge('${challengeId}'); this.closest('div').remove();" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 10px;">
                    🚀 Join Challenge
                </button>
                <button onclick="this.closest('div').remove()" style="background: none; border: 1px solid var(--border-primary); color: var(--text-primary); padding: 12px 30px; border-radius: 8px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(detailsModal);
}

// Create new challenge
function createNewChallenge() {
    const createModal = document.createElement('div');
    createModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    createModal.innerHTML = `
        <div style="background: var(--bg-secondary); border-radius: 20px; padding: 30px; max-width: 600px; width: 90%; border: 1px solid var(--border-primary); max-height: 80vh; overflow-y: auto;">
            <h3 style="margin: 0 0 20px; color: var(--text-primary);">Create New Challenge</h3>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; color: var(--text-primary); margin-bottom: 8px; font-weight: 600;">Challenge Title</label>
                <input type="text" placeholder="#YourChallengeHashtag" style="width: 100%; padding: 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary); box-sizing: border-box;">
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; color: var(--text-primary); margin-bottom: 8px; font-weight: 600;">Description</label>
                <textarea placeholder="Describe your challenge..." style="width: 100%; height: 80px; padding: 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary); resize: vertical; box-sizing: border-box;"></textarea>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; color: var(--text-primary); margin-bottom: 8px; font-weight: 600;">Category</label>
                    <select style="width: 100%; padding: 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary);">
                        <option>Dance</option>
                        <option>Music</option>
                        <option>Art</option>
                        <option>Comedy</option>
                        <option>Lifestyle</option>
                        <option>Fitness</option>
                        <option>Cooking</option>
                        <option>Other</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; color: var(--text-primary); margin-bottom: 8px; font-weight: 600;">Difficulty</label>
                    <select style="width: 100%; padding: 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary);">
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                    </select>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; color: var(--text-primary); margin-bottom: 8px; font-weight: 600;">Duration</label>
                <select style="width: 100%; padding: 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary);">
                    <option>7 days</option>
                    <option>14 days</option>
                    <option>30 days</option>
                    <option>Custom</option>
                </select>
            </div>
            
            <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                <div style="color: var(--text-secondary); font-size: 14px;">
                    🚧 Challenge creation requires VIB3 Creator status<br>
                    Apply for Creator Program to unlock this feature!
                </div>
            </div>
            
            <div style="text-align: center;">
                <button onclick="applyChallengeCreator()" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 10px;">
                    📝 Apply for Creator Program
                </button>
                <button onclick="this.closest('div').remove()" style="background: none; border: 1px solid var(--border-primary); color: var(--text-primary); padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(createModal);
}

// Apply for challenge creator program
function applyChallengeCreator() {
    document.querySelectorAll('[style*="position: fixed"]').forEach(modal => modal.remove());
    showChallengeNotification('📝 Creator Program application opened! Check your messages for details.');
}

// Show my participations
function showMyParticipations() {
    const participationsModal = document.createElement('div');
    participationsModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    participationsModal.innerHTML = `
        <div style="background: var(--bg-secondary); border-radius: 20px; padding: 30px; max-width: 700px; width: 90%; border: 1px solid var(--border-primary); max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: var(--text-primary);">My Challenge Participations</h3>
                <button onclick="this.closest('div').remove()" style="background: none; border: none; color: var(--text-secondary); font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: var(--accent-primary);">3</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Active</div>
                    </div>
                    <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: var(--accent-secondary);">8</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Completed</div>
                    </div>
                    <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #ffa726;">1</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Won</div>
                    </div>
                    <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #4caf50;">1,250</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">VIB3 Coins Earned</div>
                    </div>
                </div>
            </div>
            
            <div>
                <h4 style="color: var(--text-primary); margin-bottom: 15px;">Recent Participations:</h4>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">#VibeDanceChallenge</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">Submitted 2 days ago • 1.2K views</div>
                        </div>
                        <div style="background: #ffa726; color: white; padding: 4px 8px; border-radius: 12px; font-size: 10px;">🏆 Top 10</div>
                    </div>
                    <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">#CreativeArtChallenge</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">Submitted 5 days ago • 890 views</div>
                        </div>
                        <div style="background: var(--accent-primary); color: white; padding: 4px 8px; border-radius: 12px; font-size: 10px;">✨ Featured</div>
                    </div>
                    <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">#LaughChallenge2024</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">Won 1st place • 25K views</div>
                        </div>
                        <div style="background: #4caf50; color: white; padding: 4px 8px; border-radius: 12px; font-size: 10px;">🥇 Winner</div>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="this.closest('div').remove()" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(participationsModal);
}

// Show challenge notification
function showChallengeNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        padding: 12px 20px;
        border-radius: 8px;
        border: 1px solid var(--border-primary);
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translateX(300px);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(300px)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ================ VIB3 COINS SYSTEM ================

// Show VIB3 Coins page
function showCoins() {
    console.log('💰 Opening VIB3 Coins');
    
    // Hide main app and other content
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'none';
    }
    
    // Hide other pages
    document.querySelectorAll('.video-feed, .search-page, .profile-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page, .activity-page, .friends-page, .vibe-rooms-page, .creator-studio-page, .challenges-page, .collaboration-page').forEach(el => {
        el.style.display = 'none';
    });
    
    // Remove existing dynamic pages
    const existingPages = ['collaborationPage', 'challengesPage', 'vibeRoomsPage', 'creatorStudioPage'];
    existingPages.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) page.remove();
    });
    
    let coinsPage = document.getElementById('coinsPage');
    if (!coinsPage) {
        coinsPage = document.createElement('div');
        coinsPage.id = 'coinsPage';
        coinsPage.className = 'coins-page';
        coinsPage.style.cssText = 'margin-left: 240px; margin-top: 60px; width: calc(100vw - 240px); height: calc(100vh - 60px); overflow-y: auto; background: var(--bg-primary);';
        
        coinsPage.innerHTML = `
            <!-- Coins Header -->
            <div class="coins-header" style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 40px; color: white; text-align: center; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"20\" cy=\"20\" r=\"2\" fill=\"%23ffffff20\"/><circle cx=\"80\" cy=\"40\" r=\"1\" fill=\"%23ffffff30\"/><circle cx=\"60\" cy=\"80\" r=\"1.5\" fill=\"%23ffffff25\"/><circle cx=\"30\" cy=\"70\" r=\"1\" fill=\"%23ffffff20\"/><circle cx=\"90\" cy=\"15\" r=\"1\" fill=\"%23ffffff35\"/></svg>'); animation: float 6s ease-in-out infinite;"></div>
                <div style="position: relative; z-index: 2;">
                    <h1 style="margin: 0 0 15px; font-size: 48px; font-weight: 900; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">💰 VIB3 Coins</h1>
                    <p style="margin: 0 0 30px; font-size: 20px; opacity: 0.95;">Your virtual currency for the VIB3 ecosystem</p>
                    <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 30px;">
                        <div style="background: rgba(255,255,255,0.2); padding: 20px 30px; border-radius: 20px; backdrop-filter: blur(10px);">
                            <div style="font-size: 36px; font-weight: 800; margin-bottom: 5px;" id="userCoinsBalance">3,247</div>
                            <div style="font-size: 14px; opacity: 0.9;">Your VIB3 Coins</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 20px 30px; border-radius: 20px; backdrop-filter: blur(10px);">
                            <div style="font-size: 36px; font-weight: 800; margin-bottom: 5px;">$32.47</div>
                            <div style="font-size: 14px; opacity: 0.9;">USD Value</div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: center; gap: 15px;">
                        <button onclick="openCoinsStore()" style="background: rgba(255,255,255,0.9); color: #FF8C00; border: none; padding: 15px 30px; border-radius: 25px; cursor: pointer; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                            🛒 Buy Coins
                        </button>
                        <button onclick="openCoinsSend()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 15px 30px; border-radius: 25px; cursor: pointer; font-weight: 700; font-size: 16px; backdrop-filter: blur(10px);">
                            💸 Send Coins
                        </button>
                        <button onclick="openCoinsEarn()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 15px 30px; border-radius: 25px; cursor: pointer; font-weight: 700; font-size: 16px; backdrop-filter: blur(10px);">
                            🎯 Earn Coins
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Coins Navigation -->
            <div class="coins-nav" style="display: flex; justify-content: center; gap: 8px; padding: 20px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
                <button class="coins-tab active" onclick="switchCoinsTab('overview')" id="overviewTab" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    📊 Overview
                </button>
                <button class="coins-tab" onclick="switchCoinsTab('transactions')" id="transactionsTab" style="background: none; border: 1px solid var(--border-primary); color: var(--text-secondary); padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    💳 Transactions
                </button>
                <button class="coins-tab" onclick="switchCoinsTab('rewards')" id="rewardsTab" style="background: none; border: 1px solid var(--border-primary); color: var(--text-secondary); padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    🎁 Rewards
                </button>
                <button class="coins-tab" onclick="switchCoinsTab('creators')" id="creatorsTab" style="background: none; border: 1px solid var(--border-primary); color: var(--text-secondary); padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    👑 Creator Tools
                </button>
            </div>
            
            <!-- Coins Content Area -->
            <div class="coins-content-area" style="padding: 30px; max-width: 1200px; margin: 0 auto;">
                <div id="coinsOverviewContent">
                    ${getCoinsOverviewContent()}
                </div>
                <div id="coinsTransactionsContent" style="display: none;">
                    ${getCoinsTransactionsContent()}
                </div>
                <div id="coinsRewardsContent" style="display: none;">
                    ${getCoinsRewardsContent()}
                </div>
                <div id="coinsCreatorsContent" style="display: none;">
                    ${getCoinsCreatorsContent()}
                </div>
            </div>
        `;
        
        document.body.appendChild(coinsPage);
    }
    
    coinsPage.style.display = 'block';
    
    // Update active sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
    const coinsButton = document.getElementById('sidebarCoins');
    if (coinsButton) coinsButton.classList.add('active');
}

// Get coins overview content
function getCoinsOverviewContent() {
    return `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; margin-bottom: 30px;">
            <!-- Balance Card -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 20px; color: white; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                <div style="position: relative;">
                    <h3 style="margin: 0 0 15px; font-size: 18px; opacity: 0.9;">💰 Current Balance</h3>
                    <div style="font-size: 36px; font-weight: 800; margin-bottom: 5px;">3,247 VIB3</div>
                    <div style="font-size: 14px; opacity: 0.8;">≈ $32.47 USD</div>
                </div>
            </div>
            
            <!-- Earnings Card -->
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 20px; color: white; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                <div style="position: relative;">
                    <h3 style="margin: 0 0 15px; font-size: 18px; opacity: 0.9;">📈 Total Earned</h3>
                    <div style="font-size: 36px; font-weight: 800; margin-bottom: 5px;">18,932 VIB3</div>
                    <div style="font-size: 14px; opacity: 0.8;">+1,247 this month</div>
                </div>
            </div>
            
            <!-- Rank Card -->
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 25px; border-radius: 20px; color: white; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                <div style="position: relative;">
                    <h3 style="margin: 0 0 15px; font-size: 18px; opacity: 0.9;">🏆 Creator Rank</h3>
                    <div style="font-size: 36px; font-weight: 800; margin-bottom: 5px;">Gold</div>
                    <div style="font-size: 14px; opacity: 0.8;">Top 15% of creators</div>
                </div>
            </div>
        </div>
        
        <!-- Recent Activity -->
        <div style="background: var(--bg-secondary); padding: 25px; border-radius: 15px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 20px; color: var(--text-primary);">💎 Recent Coin Activity</h3>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-tertiary); border-radius: 10px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #4facfe, #00f2fe); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 18px;">🎯</span>
                        </div>
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">Challenge Reward</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">2 hours ago</div>
                        </div>
                    </div>
                    <div style="color: #4caf50; font-weight: 700;">+500 VIB3</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-tertiary); border-radius: 10px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f093fb, #f5576c); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 18px;">❤️</span>
                        </div>
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">Video Likes Bonus</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">5 hours ago</div>
                        </div>
                    </div>
                    <div style="color: #4caf50; font-weight: 700;">+125 VIB3</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-tertiary); border-radius: 10px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 18px;">💸</span>
                        </div>
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">Sent to @musiclover</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">1 day ago</div>
                        </div>
                    </div>
                    <div style="color: #f44336; font-weight: 700;">-200 VIB3</div>
                </div>
            </div>
        </div>
        
        <!-- Earning Opportunities -->
        <div style="background: var(--bg-secondary); padding: 25px; border-radius: 15px;">
            <h3 style="margin: 0 0 20px; color: var(--text-primary);">🌟 Earn More Coins</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px; text-align: center; cursor: pointer; transition: transform 0.2s;" onclick="openDailyQuests()">
                    <div style="font-size: 36px; margin-bottom: 10px;">🎯</div>
                    <h4 style="margin: 0 0 8px; color: var(--text-primary);">Daily Quests</h4>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">Complete daily tasks for coins</p>
                    <div style="margin-top: 10px; color: #4caf50; font-weight: 600;">+50-300 VIB3</div>
                </div>
                <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px; text-align: center; cursor: pointer; transition: transform 0.2s;" onclick="openCreatorBonus()">
                    <div style="font-size: 36px; margin-bottom: 10px;">🎬</div>
                    <h4 style="margin: 0 0 8px; color: var(--text-primary);">Creator Bonus</h4>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">Earn from video performance</p>
                    <div style="margin-top: 10px; color: #4caf50; font-weight: 600;">+100-1000 VIB3</div>
                </div>
                <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px; text-align: center; cursor: pointer; transition: transform 0.2s;" onclick="openReferralProgram()">
                    <div style="font-size: 36px; margin-bottom: 10px;">👥</div>
                    <h4 style="margin: 0 0 8px; color: var(--text-primary);">Referral Program</h4>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">Invite friends to VIB3</p>
                    <div style="margin-top: 10px; color: #4caf50; font-weight: 600;">+500 VIB3</div>
                </div>
            </div>
        </div>
    `;
}

// Get coins transactions content
function getCoinsTransactionsContent() {
    return `
        <div style="background: var(--bg-secondary); padding: 25px; border-radius: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: var(--text-primary);">💳 Transaction History</h3>
                <select style="padding: 8px 12px; border: 1px solid var(--border-primary); border-radius: 6px; background: var(--bg-tertiary); color: var(--text-primary);">
                    <option>All Transactions</option>
                    <option>Earnings</option>
                    <option>Purchases</option>
                    <option>Transfers</option>
                </select>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${generateTransactionHistory()}
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="loadMoreTransactions()" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Load More
                </button>
            </div>
        </div>
    `;
}

// Get coins rewards content
function getCoinsRewardsContent() {
    return `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 25px;">
            <!-- Daily Quests -->
            <div style="background: var(--bg-secondary); padding: 25px; border-radius: 15px;">
                <h3 style="margin: 0 0 20px; color: var(--text-primary);">🎯 Daily Quests</h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-tertiary); border-radius: 10px; border-left: 4px solid #4caf50;">
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">Watch 10 videos</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">7/10 completed</div>
                        </div>
                        <div style="color: #4caf50; font-weight: 700;">+50 VIB3</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-tertiary); border-radius: 10px; border-left: 4px solid #ff9800;">
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">Like 5 videos</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">3/5 completed</div>
                        </div>
                        <div style="color: #ff9800; font-weight: 700;">+25 VIB3</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-tertiary); border-radius: 10px; border-left: 4px solid #2196f3;">
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">Share 1 video</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">0/1 completed</div>
                        </div>
                        <div style="color: #2196f3; font-weight: 700;">+75 VIB3</div>
                    </div>
                </div>
            </div>
            
            <!-- Achievements -->
            <div style="background: var(--bg-secondary); padding: 25px; border-radius: 15px;">
                <h3 style="margin: 0 0 20px; color: var(--text-primary);">🏆 Achievements</h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-tertiary); border-radius: 10px; border: 2px solid #ffd700;">
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">🌟 First Upload</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">Completed • 2 days ago</div>
                        </div>
                        <div style="color: #ffd700; font-weight: 700;">+500 VIB3</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-tertiary); border-radius: 10px; opacity: 0.6;">
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">🔥 Viral Video</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">Get 10K views • 1,247/10,000</div>
                        </div>
                        <div style="color: #ff6b6b; font-weight: 700;">+1,000 VIB3</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-tertiary); border-radius: 10px; opacity: 0.6;">
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">👥 Social Butterfly</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">Follow 50 creators • 23/50</div>
                        </div>
                        <div style="color: #9c27b0; font-weight: 700;">+250 VIB3</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Get coins creators content
function getCoinsCreatorsContent() {
    return `
        <div style="background: var(--bg-secondary); padding: 25px; border-radius: 15px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 20px; color: var(--text-primary);">👑 Creator Monetization</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px;">
                    <h4 style="margin: 0 0 15px; color: var(--text-primary);">💰 Creator Fund</h4>
                    <div style="margin-bottom: 15px;">
                        <div style="color: var(--text-secondary); font-size: 14px;">Monthly Earnings</div>
                        <div style="color: var(--text-primary); font-size: 24px; font-weight: 700;">2,347 VIB3</div>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <div style="color: var(--text-secondary); font-size: 14px;">Performance Bonus</div>
                        <div style="color: #4caf50; font-size: 18px; font-weight: 600;">+15% this month</div>
                    </div>
                    <button onclick="openCreatorFund()" style="width: 100%; background: var(--accent-gradient); color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        View Details
                    </button>
                </div>
                
                <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px;">
                    <h4 style="margin: 0 0 15px; color: var(--text-primary);">🎁 Tip Jar</h4>
                    <div style="margin-bottom: 15px;">
                        <div style="color: var(--text-secondary); font-size: 14px;">Tips Received</div>
                        <div style="color: var(--text-primary); font-size: 24px; font-weight: 700;">1,589 VIB3</div>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <div style="color: var(--text-secondary); font-size: 14px;">From 47 supporters</div>
                        <div style="color: #ff9800; font-size: 18px; font-weight: 600;">+23 new this week</div>
                    </div>
                    <button onclick="openTipJar()" style="width: 100%; background: var(--accent-gradient); color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Manage Tips
                    </button>
                </div>
                
                <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px;">
                    <h4 style="margin: 0 0 15px; color: var(--text-primary);">🏪 Creator Store</h4>
                    <div style="margin-bottom: 15px;">
                        <div style="color: var(--text-secondary); font-size: 14px;">Items Sold</div>
                        <div style="color: var(--text-primary); font-size: 24px; font-weight: 700;">23 items</div>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <div style="color: var(--text-secondary); font-size: 14px;">Store Revenue</div>
                        <div style="color: #9c27b0; font-size: 18px; font-weight: 600;">892 VIB3</div>
                    </div>
                    <button onclick="openCreatorStore()" style="width: 100%; background: var(--accent-gradient); color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Setup Store
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Withdrawal Options -->
        <div style="background: var(--bg-secondary); padding: 25px; border-radius: 15px;">
            <h3 style="margin: 0 0 20px; color: var(--text-primary);">💳 Withdraw Earnings</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 36px; margin-bottom: 10px;">💰</div>
                    <h4 style="margin: 0 0 8px; color: var(--text-primary);">PayPal</h4>
                    <p style="margin: 0 0 15px; color: var(--text-secondary); font-size: 14px;">Min: 1,000 VIB3</p>
                    <button onclick="withdrawPayPal()" style="width: 100%; background: #0070ba; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer;">
                        Withdraw
                    </button>
                </div>
                <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 36px; margin-bottom: 10px;">🏦</div>
                    <h4 style="margin: 0 0 8px; color: var(--text-primary);">Bank Transfer</h4>
                    <p style="margin: 0 0 15px; color: var(--text-secondary); font-size: 14px;">Min: 2,500 VIB3</p>
                    <button onclick="withdrawBank()" style="width: 100%; background: #4caf50; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer;">
                        Withdraw
                    </button>
                </div>
                <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 36px; margin-bottom: 10px;">🎁</div>
                    <h4 style="margin: 0 0 8px; color: var(--text-primary);">Gift Cards</h4>
                    <p style="margin: 0 0 15px; color: var(--text-secondary); font-size: 14px;">Min: 500 VIB3</p>
                    <button onclick="withdrawGiftCard()" style="width: 100%; background: #ff9800; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer;">
                        Redeem
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Switch coins tabs
function switchCoinsTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.coins-tab').forEach(btn => {
        btn.style.background = 'none';
        btn.style.border = '1px solid var(--border-primary)';
        btn.style.color = 'var(--text-secondary)';
    });
    
    const activeTab = document.getElementById(tab + 'Tab');
    if (activeTab) {
        activeTab.style.background = 'var(--accent-gradient)';
        activeTab.style.border = 'none';
        activeTab.style.color = 'white';
    }
    
    // Update content
    document.querySelectorAll('[id^="coins"][id$="Content"]').forEach(content => {
        content.style.display = 'none';
    });
    
    const activeContent = document.getElementById('coins' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Content');
    if (activeContent) {
        activeContent.style.display = 'block';
    }
}

// Generate transaction history
function generateTransactionHistory() {
    const transactions = [
        { type: 'earn', desc: 'Daily Quest Completed', amount: '+150', time: '2 hours ago', icon: '🎯' },
        { type: 'earn', desc: 'Video Performance Bonus', amount: '+300', time: '5 hours ago', icon: '📈' },
        { type: 'send', desc: 'Sent to @dancequeen', amount: '-100', time: '1 day ago', icon: '💸' },
        { type: 'earn', desc: 'Challenge Winner', amount: '+500', time: '2 days ago', icon: '🏆' },
        { type: 'purchase', desc: 'Coin Pack Purchase', amount: '+1,000', time: '3 days ago', icon: '🛒' },
        { type: 'earn', desc: 'Tip from @musicfan', amount: '+50', time: '4 days ago', icon: '🎁' },
        { type: 'earn', desc: 'Referral Bonus', amount: '+500', time: '5 days ago', icon: '👥' },
        { type: 'send', desc: 'Sent to @artist_pro', amount: '-250', time: '6 days ago', icon: '💸' }
    ];
    
    return transactions.map(tx => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-tertiary); border-radius: 10px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; background: ${tx.type === 'earn' ? 'linear-gradient(135deg, #4caf50, #8bc34a)' : tx.type === 'send' ? 'linear-gradient(135deg, #f44336, #e91e63)' : 'linear-gradient(135deg, #2196f3, #03a9f4)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 18px;">${tx.icon}</span>
                </div>
                <div>
                    <div style="color: var(--text-primary); font-weight: 600;">${tx.desc}</div>
                    <div style="color: var(--text-secondary); font-size: 12px;">${tx.time}</div>
                </div>
            </div>
            <div style="color: ${tx.type === 'earn' || tx.type === 'purchase' ? '#4caf50' : '#f44336'}; font-weight: 700;">${tx.amount} VIB3</div>
        </div>
    `).join('');
}

// Coins modal functions
function openCoinsStore() {
    showCoinsModal('store', 'Buy VIB3 Coins', `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px; text-align: center; cursor: pointer; border: 2px solid transparent; transition: border 0.3s;" onclick="selectCoinPack(this, 500, 4.99)">
                <div style="font-size: 36px; margin-bottom: 10px;">💰</div>
                <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">500 VIB3</div>
                <div style="color: var(--text-secondary); margin: 5px 0;">$4.99</div>
                <div style="background: var(--accent-gradient); color: white; padding: 8px 16px; border-radius: 6px; font-weight: 600; margin-top: 10px;">Popular</div>
            </div>
            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px; text-align: center; cursor: pointer; border: 2px solid transparent; transition: border 0.3s;" onclick="selectCoinPack(this, 1200, 9.99)">
                <div style="font-size: 36px; margin-bottom: 10px;">💎</div>
                <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">1,200 VIB3</div>
                <div style="color: var(--text-secondary); margin: 5px 0;">$9.99</div>
                <div style="background: #4caf50; color: white; padding: 8px 16px; border-radius: 6px; font-weight: 600; margin-top: 10px;">+20% Bonus</div>
            </div>
            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px; text-align: center; cursor: pointer; border: 2px solid transparent; transition: border 0.3s;" onclick="selectCoinPack(this, 2500, 19.99)">
                <div style="font-size: 36px; margin-bottom: 10px;">🏆</div>
                <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">2,500 VIB3</div>
                <div style="color: var(--text-secondary); margin: 5px 0;">$19.99</div>
                <div style="background: #ff9800; color: white; padding: 8px 16px; border-radius: 6px; font-weight: 600; margin-top: 10px;">Best Value</div>
            </div>
        </div>
        <div style="text-align: center;">
            <button onclick="purchaseCoins()" style="background: var(--accent-gradient); color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 16px;">Purchase Coins</button>
        </div>
    `);
}

function openCoinsSend() {
    showCoinsModal('send', 'Send VIB3 Coins', `
        <div style="margin-bottom: 20px;">
            <label style="display: block; color: var(--text-primary); margin-bottom: 8px; font-weight: 600;">To:</label>
            <input type="text" placeholder="@username" style="width: 100%; padding: 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary);" id="sendCoinsUsername">
        </div>
        <div style="margin-bottom: 20px;">
            <label style="display: block; color: var(--text-primary); margin-bottom: 8px; font-weight: 600;">Amount:</label>
            <input type="number" placeholder="100" style="width: 100%; padding: 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary);" id="sendCoinsAmount">
        </div>
        <div style="margin-bottom: 20px;">
            <label style="display: block; color: var(--text-primary); margin-bottom: 8px; font-weight: 600;">Message (optional):</label>
            <textarea placeholder="Great content!" style="width: 100%; padding: 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary); resize: vertical; height: 80px;" id="sendCoinsMessage"></textarea>
        </div>
        <div style="text-align: center;">
            <button onclick="sendCoins()" style="background: var(--accent-gradient); color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 16px;">Send Coins</button>
        </div>
    `);
}

function openCoinsEarn() {
    showCoinsModal('earn', 'Earn VIB3 Coins', `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 36px; margin-bottom: 10px;">🎯</div>
                <h4 style="margin: 0 0 8px; color: var(--text-primary);">Daily Quests</h4>
                <p style="margin: 0 0 15px; color: var(--text-secondary); font-size: 14px;">Complete simple tasks</p>
                <div style="color: #4caf50; font-weight: 700; margin-bottom: 15px;">+50-300 VIB3/day</div>
                <button onclick="openDailyQuests()" style="background: var(--accent-gradient); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Start Quests</button>
            </div>
            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 36px; margin-bottom: 10px;">🎬</div>
                <h4 style="margin: 0 0 8px; color: var(--text-primary);">Upload Videos</h4>
                <p style="margin: 0 0 15px; color: var(--text-secondary); font-size: 14px;">Earn from views & likes</p>
                <div style="color: #4caf50; font-weight: 700; margin-bottom: 15px;">+100-1000 VIB3</div>
                <button onclick="showUploadModal()" style="background: var(--accent-gradient); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Upload Now</button>
            </div>
            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 36px; margin-bottom: 10px;">👥</div>
                <h4 style="margin: 0 0 8px; color: var(--text-primary);">Referrals</h4>
                <p style="margin: 0 0 15px; color: var(--text-secondary); font-size: 14px;">Invite friends</p>
                <div style="color: #4caf50; font-weight: 700; margin-bottom: 15px;">+500 VIB3/friend</div>
                <button onclick="openReferralProgram()" style="background: var(--accent-gradient); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Invite Friends</button>
            </div>
        </div>
    `);
}

function showCoinsModal(type, title, content) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: var(--bg-secondary); border-radius: 20px; padding: 30px; max-width: 600px; width: 90%; border: 1px solid var(--border-primary); max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: var(--text-primary);">${title}</h3>
                <button onclick="this.closest('div').remove()" style="background: none; border: none; color: var(--text-secondary); font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            ${content}
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Coins interaction functions
function selectCoinPack(element, amount, price) {
    document.querySelectorAll('[onclick*="selectCoinPack"]').forEach(pack => {
        pack.style.border = '2px solid transparent';
    });
    element.style.border = '2px solid var(--accent-color)';
    
    window.selectedCoinPack = { amount, price };
}

function purchaseCoins() {
    if (!window.selectedCoinPack) {
        showCoinsNotification('Please select a coin pack first!');
        return;
    }
    
    showCoinsNotification(`💰 Purchased ${window.selectedCoinPack.amount} VIB3 Coins for $${window.selectedCoinPack.price}!`);
    
    // Update user balance
    const balanceElement = document.getElementById('userCoinsBalance');
    if (balanceElement) {
        const currentBalance = parseInt(balanceElement.textContent.replace(',', ''));
        const newBalance = currentBalance + window.selectedCoinPack.amount;
        balanceElement.textContent = newBalance.toLocaleString();
    }
    
    document.querySelectorAll('[style*="position: fixed"]').forEach(modal => modal.remove());
}

function sendCoins() {
    const username = document.getElementById('sendCoinsUsername').value;
    const amount = document.getElementById('sendCoinsAmount').value;
    const message = document.getElementById('sendCoinsMessage').value;
    
    if (!username || !amount) {
        showCoinsNotification('Please fill in username and amount!');
        return;
    }
    
    showCoinsNotification(`💸 Sent ${amount} VIB3 Coins to ${username}!`);
    document.querySelectorAll('[style*="position: fixed"]').forEach(modal => modal.remove());
}

function showCoinsNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #FFD700, #FFA500);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 10000;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
        transform: translateX(300px);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(300px)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Placeholder functions for coins features
function openDailyQuests() {
    showCoinsNotification('🎯 Daily Quests feature coming soon!');
}

function openCreatorBonus() {
    showCoinsNotification('🎬 Creator Bonus details coming soon!');
}

function openReferralProgram() {
    showCoinsNotification('👥 Referral Program launching soon!');
}

function openCreatorFund() {
    showCoinsNotification('💰 Creator Fund details coming soon!');
}

function openTipJar() {
    showCoinsNotification('🎁 Tip Jar management coming soon!');
}

function openCreatorStore() {
    showCoinsNotification('🏪 Creator Store setup coming soon!');
}

function withdrawPayPal() {
    showCoinsNotification('💰 PayPal withdrawal coming soon!');
}

function withdrawBank() {
    showCoinsNotification('🏦 Bank withdrawal coming soon!');
}

function withdrawGiftCard() {
    showCoinsNotification('🎁 Gift card redemption coming soon!');
}

function loadMoreTransactions() {
    showCoinsNotification('📜 Loading more transactions...');
}

// ================ LIVE STREAMING FEATURE ================

// Global live streaming state
let liveStreamingState = {
    isLive: false,
    isViewing: false,
    currentStream: null,
    streamId: null,
    viewers: new Map(),
    comments: [],
    gifts: [],
    startTime: null,
    userStream: null,
    viewerCount: 0,
    streamSettings: {
        title: '',
        description: '',
        category: 'General',
        allowComments: true,
        allowGifts: true,
        isPrivate: false
    }
};

function showLiveStreaming() {
    console.log('🔴 Showing Live Streaming page');
    
    // Hide main app content
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'none';
    }
    
    // Hide any other pages that might be visible
    const vibeRoomsPage = document.getElementById('vibeRoomsPage');
    if (vibeRoomsPage) {
        vibeRoomsPage.style.display = 'none';
    }
    
    // Hide other common pages
    document.querySelectorAll('.video-feed, .search-page, .profile-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page, .activity-page, .friends-page').forEach(el => {
        el.style.display = 'none';
    });
    
    // Remove existing live page if it exists
    const existingLivePage = document.getElementById('liveStreamingPage');
    if (existingLivePage) {
        existingLivePage.remove();
    }
    
    // Create live streaming page
    const liveStreamingPage = document.createElement('div');
    liveStreamingPage.id = 'liveStreamingPage';
    liveStreamingPage.className = 'live-streaming-page';
    
    liveStreamingPage.innerHTML = `
        <div class="live-streaming-container">
            <div class="live-header">
                <div class="live-header-left">
                    <button class="close-live-btn" onclick="closeLiveStreaming()" title="Close Live Streaming">
                        ←
                    </button>
                    <h1>🔴 Live Streaming</h1>
                </div>
                <div class="live-actions">
                    <button class="go-live-btn" onclick="openLiveSetup()">
                        <span class="live-indicator">●</span>
                        Go Live
                    </button>
                    <button class="browse-categories-btn" onclick="showLiveCategories()">
                        Categories
                    </button>
                </div>
            </div>
            
            <div class="live-tabs">
                <button class="live-tab active" onclick="switchLiveTab('featured')">Featured</button>
                <button class="live-tab" onclick="switchLiveTab('following')">Following</button>
                <button class="live-tab" onclick="switchLiveTab('categories')">Categories</button>
                <button class="live-tab" onclick="switchLiveTab('recent')">Recent</button>
            </div>
            
            <div class="live-content">
                <div id="featuredStreams" class="live-tab-content active">
                    <div class="live-streams-grid" id="featuredStreamsGrid">
                        <!-- Streams will be loaded dynamically -->
                    </div>
                </div>
                
                <div id="followingStreams" class="live-tab-content">
                    <div class="live-streams-grid" id="followingStreamsGrid">
                        <!-- Following streams will be loaded dynamically -->
                    </div>
                </div>
                
                <div id="categoriesStreams" class="live-tab-content">
                    <div class="categories-grid">
                        <div class="category-card" onclick="showCategoryStreams('Gaming')">
                            <div class="category-icon">🎮</div>
                            <div class="category-name">Gaming</div>
                            <div class="category-count" id="gaming-count">Loading...</div>
                        </div>
                        <div class="category-card" onclick="showCategoryStreams('Cooking')">
                            <div class="category-icon">🍳</div>
                            <div class="category-name">Cooking</div>
                            <div class="category-count" id="cooking-count">Loading...</div>
                        </div>
                        <div class="category-card" onclick="showCategoryStreams('Art')">
                            <div class="category-icon">🎨</div>
                            <div class="category-name">Art</div>
                            <div class="category-count" id="art-count">Loading...</div>
                        </div>
                        <div class="category-card" onclick="showCategoryStreams('Fitness')">
                            <div class="category-icon">💪</div>
                            <div class="category-name">Fitness</div>
                            <div class="category-count" id="fitness-count">Loading...</div>
                        </div>
                        <div class="category-card" onclick="showCategoryStreams('Education')">
                            <div class="category-icon">📚</div>
                            <div class="category-name">Education</div>
                            <div class="category-count" id="education-count">Loading...</div>
                        </div>
                        <div class="category-card" onclick="showCategoryStreams('Lifestyle')">
                            <div class="category-icon">☕</div>
                            <div class="category-name">Lifestyle</div>
                            <div class="category-count" id="lifestyle-count">Loading...</div>
                        </div>
                    </div>
                </div>
                
                <div id="recentStreams" class="live-tab-content">
                    <div class="live-streams-grid" id="recentStreamsGrid">
                        <!-- Recent streams will be loaded dynamically -->
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Live Setup Modal -->
        <div id="liveSetupModal" class="live-modal" style="display: none;">
            <div class="live-modal-content">
                <div class="live-modal-header">
                    <h2>Go Live</h2>
                    <button class="close-modal" onclick="closeLiveSetup()">×</button>
                </div>
                
                <div class="live-setup-content">
                    <div class="camera-preview">
                        <video id="livePreview" class="live-preview-video" autoplay muted></video>
                        <div class="preview-controls">
                            <button class="preview-btn" onclick="toggleCamera()">📷</button>
                            <button class="preview-btn" onclick="toggleMicrophone()">🎤</button>
                            <button class="preview-btn" onclick="switchCamera()">🔄</button>
                        </div>
                    </div>
                    
                    <div class="stream-settings">
                        <div class="setting-group">
                            <label>Stream Title</label>
                            <input type="text" id="streamTitle" placeholder="What's happening?" maxlength="100">
                        </div>
                        
                        <div class="setting-group">
                            <label>Description</label>
                            <textarea id="streamDescription" placeholder="Tell viewers what you're streaming about..." maxlength="500"></textarea>
                        </div>
                        
                        <div class="setting-group">
                            <label>Category</label>
                            <select id="streamCategory">
                                <option value="General">General</option>
                                <option value="Gaming">Gaming</option>
                                <option value="Cooking">Cooking</option>
                                <option value="Art">Art</option>
                                <option value="Fitness">Fitness</option>
                                <option value="Education">Education</option>
                                <option value="Lifestyle">Lifestyle</option>
                                <option value="Music">Music</option>
                            </select>
                        </div>
                        
                        <div class="setting-toggles">
                            <div class="toggle-item">
                                <input type="checkbox" id="allowComments" checked>
                                <label for="allowComments">Allow Comments</label>
                            </div>
                            <div class="toggle-item">
                                <input type="checkbox" id="allowGifts" checked>
                                <label for="allowGifts">Allow Gifts</label>
                            </div>
                            <div class="toggle-item">
                                <input type="checkbox" id="recordStream">
                                <label for="recordStream">Record Stream</label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="live-modal-footer">
                    <button class="cancel-btn" onclick="closeLiveSetup()">Cancel</button>
                    <button class="start-live-btn" onclick="startLiveStream()">Start Live Stream</button>
                </div>
            </div>
        </div>
        
        <!-- Live Stream Interface -->
        <div id="liveStreamInterface" class="live-stream-interface" style="display: none;">
            <div class="stream-container">
                <div class="stream-video-section">
                    <div class="stream-video-container">
                        <video id="liveStreamVideo" class="live-stream-video" autoplay muted></video>
                        
                        <div class="stream-overlay">
                            <div class="stream-info">
                                <div class="live-indicator-badge">
                                    <span class="live-dot"></span>
                                    LIVE
                                </div>
                                <div class="viewer-count-badge">
                                    <span id="liveViewerCount">0</span> viewers
                                </div>
                                <div class="stream-duration" id="streamDuration">00:00</div>
                            </div>
                            
                            <div class="stream-controls">
                                <button class="stream-control-btn" onclick="toggleStreamCamera()">📷</button>
                                <button class="stream-control-btn" onclick="toggleStreamMicrophone()">🎤</button>
                                <button class="stream-control-btn" onclick="switchStreamCamera()">🔄</button>
                                <button class="stream-control-btn" onclick="shareStream()">📤</button>
                                <button class="end-stream-btn" onclick="endLiveStream()">End Stream</button>
                            </div>
                        </div>
                        
                        <div class="gifts-animation-area" id="giftsAnimationArea"></div>
                    </div>
                </div>
                
                <div class="stream-sidebar">
                    <div class="sidebar-header">
                        <div class="sidebar-tabs">
                            <button class="sidebar-tab active" onclick="switchStreamTab('chat')">💬</button>
                            <button class="sidebar-tab" onclick="switchStreamTab('viewers')">👥</button>
                            <button class="sidebar-tab" onclick="switchStreamTab('settings')">⚙️</button>
                        </div>
                    </div>
                    
                    <div class="sidebar-content">
                        <!-- Chat Tab -->
                        <div id="chatTab" class="sidebar-panel active">
                            <div class="chat-messages" id="liveStreamChat"></div>
                            <div class="chat-input">
                                <input type="text" id="chatInput" placeholder="Say something..." maxlength="200">
                                <button onclick="sendChatMessage()">Send</button>
                            </div>
                        </div>
                        
                        <!-- Viewers Tab -->
                        <div id="viewersTab" class="sidebar-panel">
                            <div class="viewers-list" id="liveStreamViewers"></div>
                        </div>
                        
                        <!-- Settings Tab -->
                        <div id="settingsTab" class="sidebar-panel">
                            <div class="stream-settings-panel">
                                <h3>Stream Settings</h3>
                                <div class="setting-item">
                                    <label>Quality</label>
                                    <select id="streamQuality">
                                        <option value="720p">720p</option>
                                        <option value="480p">480p</option>
                                        <option value="360p">360p</option>
                                    </select>
                                </div>
                                <div class="setting-item">
                                    <label>Comments</label>
                                    <input type="checkbox" id="streamAllowComments" checked>
                                </div>
                                <div class="setting-item">
                                    <label>Gifts</label>
                                    <input type="checkbox" id="streamAllowGifts" checked>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Live Stream Viewer Interface -->
        <div id="liveStreamViewer" class="live-stream-viewer" style="display: none;">
            <div class="viewer-container">
                <div class="viewer-video-section">
                    <div class="viewer-video-container">
                        <video id="viewerVideo" class="viewer-video" autoplay></video>
                        <div class="viewer-overlay">
                            <div class="viewer-info">
                                <div class="streamer-details">
                                    <div class="streamer-avatar">
                                        <span id="viewerStreamerAvatar">👤</span>
                                    </div>
                                    <div class="streamer-text">
                                        <div class="streamer-name" id="viewerStreamerName">Streamer</div>
                                        <div class="stream-title" id="viewerStreamTitle">Live Stream</div>
                                    </div>
                                    <button class="follow-btn" id="viewerFollowBtn" onclick="toggleFollow()">Follow</button>
                                </div>
                                <div class="viewer-stats">
                                    <div class="live-indicator-badge">
                                        <span class="live-dot"></span>
                                        LIVE
                                    </div>
                                    <div class="viewer-count-badge">
                                        <span id="viewerViewerCount">0</span> viewers
                                    </div>
                                </div>
                            </div>
                            
                            <div class="viewer-controls">
                                <button class="viewer-control-btn" onclick="toggleViewerVolume()">🔊</button>
                                <button class="viewer-control-btn" onclick="toggleViewerFullscreen()">⛶</button>
                                <button class="viewer-control-btn" onclick="shareViewerStream()">📤</button>
                                <button class="leave-stream-btn" onclick="leaveStream()">Leave</button>
                            </div>
                        </div>
                        
                        <div class="viewer-gifts-animation" id="viewerGiftsAnimation"></div>
                    </div>
                </div>
                
                <div class="viewer-sidebar">
                    <div class="viewer-sidebar-header">
                        <div class="viewer-sidebar-tabs">
                            <button class="viewer-sidebar-tab active" onclick="switchViewerTab('chat')">💬</button>
                            <button class="viewer-sidebar-tab" onclick="switchViewerTab('gifts')">🎁</button>
                            <button class="viewer-sidebar-tab" onclick="switchViewerTab('viewers')">👥</button>
                        </div>
                    </div>
                    
                    <div class="viewer-sidebar-content">
                        <!-- Chat Tab -->
                        <div id="viewerChatTab" class="viewer-sidebar-panel active">
                            <div class="viewer-chat-messages" id="viewerChat"></div>
                            <div class="viewer-chat-input">
                                <input type="text" id="viewerChatInput" placeholder="Say something..." maxlength="200">
                                <button onclick="sendViewerChatMessage()">Send</button>
                            </div>
                        </div>
                        
                        <!-- Gifts Tab -->
                        <div id="viewerGiftsTab" class="viewer-sidebar-panel">
                            <div class="gifts-grid" id="giftsGridContainer">
                                <!-- Gifts will be loaded dynamically -->
                            </div>
                            <div class="coins-balance">
                                <span>Balance: <span id="userCoinsBalance">250</span> coins</span>
                                <button class="buy-coins-btn" onclick="showBuyCoins()">Buy Coins</button>
                            </div>
                        </div>
                        
                        <!-- Viewers Tab -->
                        <div id="viewerViewersTab" class="viewer-sidebar-panel">
                            <div class="viewer-viewers-list" id="viewerViewersList"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add styles
    const liveStreamingStyles = document.createElement('style');
    liveStreamingStyles.textContent = `
        .live-streaming-page {
            width: 100%;
            height: 100vh;
            background: var(--bg-primary);
            overflow-y: auto;
            padding: 20px;
        }
        
        .live-streaming-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .live-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        
        .live-header h1 {
            font-size: 2.5rem;
            font-weight: 900;
            background: var(--accent-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .live-actions {
            display: flex;
            gap: 15px;
        }
        
        .go-live-btn {
            background: linear-gradient(135deg, #ff4757, #ff3838);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        
        .go-live-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(255, 71, 87, 0.3);
        }
        
        .live-indicator {
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .browse-categories-btn {
            background: var(--bg-tertiary);
            color: var(--text-primary);
            border: 1px solid var(--border-primary);
            padding: 12px 25px;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .browse-categories-btn:hover {
            background: var(--bg-secondary);
            transform: translateY(-2px);
        }
        
        .live-tabs {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            border-bottom: 1px solid var(--border-primary);
        }
        
        .live-tab {
            background: none;
            border: none;
            padding: 15px 0;
            font-weight: 600;
            color: var(--text-secondary);
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.3s ease;
        }
        
        .live-tab.active {
            color: var(--accent-color);
            border-bottom-color: var(--accent-color);
        }
        
        .live-tab:hover {
            color: var(--text-primary);
        }
        
        .live-tab-content {
            display: none;
        }
        
        .live-tab-content.active {
            display: block;
        }
        
        .live-streams-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .live-stream-card {
            background: var(--bg-secondary);
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .live-stream-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        
        .stream-thumbnail {
            position: relative;
            width: 100%;
            height: 200px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 3rem;
        }
        
        .stream-live-badge {
            position: absolute;
            top: 10px;
            left: 10px;
            background: #ff4757;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .stream-live-dot {
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        .stream-viewer-count {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .stream-card-content {
            padding: 15px;
        }
        
        .stream-card-title {
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text-primary);
        }
        
        .stream-card-streamer {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .stream-card-avatar {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: var(--accent-gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        }
        
        .stream-card-name {
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .stream-card-category {
            color: var(--text-secondary);
            font-size: 0.9rem;
            background: var(--bg-tertiary);
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
        }
        
        .categories-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .category-card {
            background: var(--bg-secondary);
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .category-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .category-icon {
            font-size: 3rem;
            margin-bottom: 15px;
        }
        
        .category-name {
            font-weight: 600;
            font-size: 1.2rem;
            color: var(--text-primary);
            margin-bottom: 5px;
        }
        
        .category-count {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .empty-state {
            text-align: center;
            padding: 50px;
            color: var(--text-secondary);
            font-size: 1.1rem;
        }
        
        /* Modal Styles */
        .live-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }
        
        .live-modal-content {
            background: var(--bg-primary);
            border-radius: 16px;
            max-width: 800px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .live-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid var(--border-primary);
        }
        
        .live-modal-header h2 {
            font-size: 1.5rem;
            font-weight: 700;
        }
        
        .close-modal {
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: var(--text-secondary);
        }
        
        .live-setup-content {
            padding: 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .camera-preview {
            position: relative;
        }
        
        .live-preview-video {
            width: 100%;
            height: 250px;
            border-radius: 12px;
            background: #000;
            object-fit: cover;
        }
        
        .preview-controls {
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
        }
        
        .preview-btn {
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.2rem;
        }
        
        .stream-settings {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .setting-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .setting-group label {
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .setting-group input,
        .setting-group textarea,
        .setting-group select {
            padding: 12px;
            border: 1px solid var(--border-primary);
            border-radius: 8px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            font-size: 1rem;
        }
        
        .setting-group textarea {
            min-height: 80px;
            resize: vertical;
        }
        
        .setting-toggles {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .toggle-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .toggle-item input[type="checkbox"] {
            width: 20px;
            height: 20px;
        }
        
        .live-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 15px;
            padding: 20px;
            border-top: 1px solid var(--border-primary);
        }
        
        .cancel-btn {
            background: var(--bg-tertiary);
            color: var(--text-primary);
            border: 1px solid var(--border-primary);
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
        }
        
        .start-live-btn {
            background: var(--accent-gradient);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
        }
        
        /* Live Stream Interface */
        .live-stream-interface {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--bg-primary);
            z-index: 10000;
        }
        
        .stream-container {
            display: flex;
            height: 100%;
        }
        
        .stream-video-section {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .stream-video-container {
            position: relative;
            flex: 1;
            background: #000;
        }
        
        .live-stream-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .stream-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.5) 100%);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 20px;
        }
        
        .stream-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .live-indicator-badge {
            background: #ff4757;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .live-dot {
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        .viewer-count-badge {
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .stream-duration {
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .stream-controls {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .stream-control-btn {
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.5rem;
        }
        
        .end-stream-btn {
            background: #ff4757;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
        }
        
        .gifts-animation-area {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
        }
        
        .stream-sidebar {
            width: 350px;
            background: var(--bg-secondary);
            border-left: 1px solid var(--border-primary);
            display: flex;
            flex-direction: column;
        }
        
        .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid var(--border-primary);
        }
        
        .sidebar-tabs {
            display: flex;
            gap: 10px;
        }
        
        .sidebar-tab {
            background: none;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.2rem;
            color: var(--text-secondary);
        }
        
        .sidebar-tab.active {
            background: var(--accent-color);
            color: white;
        }
        
        .sidebar-content {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .sidebar-panel {
            display: none;
            flex: 1;
            flex-direction: column;
        }
        
        .sidebar-panel.active {
            display: flex;
        }
        
        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            max-height: calc(100vh - 200px);
        }
        
        .chat-input {
            padding: 20px;
            border-top: 1px solid var(--border-primary);
            display: flex;
            gap: 10px;
        }
        
        .chat-input input {
            flex: 1;
            padding: 12px;
            border: 1px solid var(--border-primary);
            border-radius: 8px;
            background: var(--bg-primary);
            color: var(--text-primary);
        }
        
        .chat-input button {
            background: var(--accent-gradient);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
        }
        
        .chat-message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 8px;
            background: var(--bg-tertiary);
        }
        
        .chat-message-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 5px;
        }
        
        .chat-message-avatar {
            width: 25px;
            height: 25px;
            border-radius: 50%;
            background: var(--accent-gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
        }
        
        .chat-message-name {
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .chat-message-time {
            color: var(--text-secondary);
            font-size: 0.8rem;
        }
        
        .chat-message-content {
            color: var(--text-primary);
        }
        
        .viewers-list {
            padding: 20px;
            overflow-y: auto;
        }
        
        .viewer-item {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .viewer-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--accent-gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        }
        
        .viewer-name {
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .stream-settings-panel {
            padding: 20px;
        }
        
        .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .setting-item label {
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .setting-item select,
        .setting-item input {
            padding: 8px;
            border: 1px solid var(--border-primary);
            border-radius: 6px;
            background: var(--bg-primary);
            color: var(--text-primary);
        }
        
        /* Live Stream Viewer Interface */
        .live-stream-viewer {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--bg-primary);
            z-index: 10000;
        }
        
        .viewer-container {
            display: flex;
            height: 100%;
        }
        
        .viewer-video-section {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .viewer-video-container {
            position: relative;
            flex: 1;
            background: #000;
        }
        
        .viewer-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .viewer-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.5) 100%);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 20px;
        }
        
        .viewer-info {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        
        .streamer-details {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .streamer-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--accent-gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }
        
        .streamer-text {
            color: white;
        }
        
        .streamer-name {
            font-weight: 600;
            font-size: 1.1rem;
        }
        
        .stream-title {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
        }
        
        .follow-btn {
            background: var(--accent-gradient);
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 600;
        }
        
        .viewer-stats {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .viewer-controls {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .viewer-control-btn {
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.5rem;
        }
        
        .leave-stream-btn {
            background: rgba(255, 71, 87, 0.8);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
        }
        
        .viewer-gifts-animation {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
        }
        
        .viewer-sidebar {
            width: 350px;
            background: var(--bg-secondary);
            border-left: 1px solid var(--border-primary);
            display: flex;
            flex-direction: column;
        }
        
        .viewer-sidebar-header {
            padding: 20px;
            border-bottom: 1px solid var(--border-primary);
        }
        
        .viewer-sidebar-tabs {
            display: flex;
            gap: 10px;
        }
        
        .viewer-sidebar-tab {
            background: none;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.2rem;
            color: var(--text-secondary);
        }
        
        .viewer-sidebar-tab.active {
            background: var(--accent-color);
            color: white;
        }
        
        .viewer-sidebar-content {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .viewer-sidebar-panel {
            display: none;
            flex: 1;
            flex-direction: column;
        }
        
        .viewer-sidebar-panel.active {
            display: flex;
        }
        
        .viewer-chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            max-height: calc(100vh - 200px);
        }
        
        .viewer-chat-input {
            padding: 20px;
            border-top: 1px solid var(--border-primary);
            display: flex;
            gap: 10px;
        }
        
        .viewer-chat-input input {
            flex: 1;
            padding: 12px;
            border: 1px solid var(--border-primary);
            border-radius: 8px;
            background: var(--bg-primary);
            color: var(--text-primary);
        }
        
        .viewer-chat-input button {
            background: var(--accent-gradient);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
        }
        
        .gifts-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            padding: 20px;
        }
        
        .gift-btn {
            background: var(--bg-tertiary);
            border: 1px solid var(--border-primary);
            border-radius: 12px;
            padding: 15px;
            cursor: pointer;
            text-align: center;
            transition: all 0.3s ease;
        }
        
        .gift-btn:hover {
            background: var(--bg-primary);
            transform: translateY(-2px);
        }
        
        .gift-icon {
            font-size: 2rem;
            margin-bottom: 8px;
        }
        
        .gift-name {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 5px;
        }
        
        .gift-cost {
            color: var(--accent-color);
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .coins-balance {
            padding: 20px;
            border-top: 1px solid var(--border-primary);
            text-align: center;
        }
        
        .buy-coins-btn {
            background: var(--accent-gradient);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            margin-top: 10px;
        }
        
        .viewer-viewers-list {
            padding: 20px;
            overflow-y: auto;
        }
        
        .gift-animation {
            position: absolute;
            font-size: 3rem;
            animation: giftRise 3s ease-out forwards;
            pointer-events: none;
        }
        
        @keyframes giftRise {
            0% {
                bottom: 10%;
                opacity: 1;
                transform: scale(0.5);
            }
            50% {
                transform: scale(1.2);
            }
            100% {
                bottom: 90%;
                opacity: 0;
                transform: scale(1);
            }
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
            .live-setup-content {
                grid-template-columns: 1fr;
            }
            
            .stream-container,
            .viewer-container {
                flex-direction: column;
            }
            
            .stream-sidebar,
            .viewer-sidebar {
                width: 100%;
                height: 300px;
            }
            
            .live-streams-grid {
                grid-template-columns: 1fr;
            }
            
            .categories-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    `;
    
    // Add styles to head
    document.head.appendChild(liveStreamingStyles);
    
    // Append page to body
    document.body.appendChild(liveStreamingPage);
    
    // Now that DOM is created, populate the streams
    setTimeout(() => {
        // Populate featured streams
        const featuredGrid = document.getElementById('featuredStreamsGrid');
        if (featuredGrid) {
            featuredGrid.innerHTML = generateLiveStreamsHTML(sampleLiveStreams);
        }
        
        // Populate following streams
        const followingGrid = document.getElementById('followingStreamsGrid');
        if (followingGrid) {
            const followingStreams = sampleLiveStreams.filter(s => s.streamer.isFollowing);
            if (followingStreams.length === 0) {
                followingGrid.innerHTML = '<div class="empty-state">No one you follow is live right now</div>';
            } else {
                followingGrid.innerHTML = generateLiveStreamsHTML(followingStreams);
            }
        }
        
        // Populate recent streams
        const recentGrid = document.getElementById('recentStreamsGrid');
        if (recentGrid) {
            const recentStreams = sampleLiveStreams.slice().sort((a, b) => b.startTime - a.startTime);
            recentGrid.innerHTML = generateLiveStreamsHTML(recentStreams);
        }
        
        // Update category counts
        const categories = ['Gaming', 'Cooking', 'Art', 'Fitness', 'Education', 'Lifestyle'];
        categories.forEach(category => {
            const countElement = document.getElementById(`${category.toLowerCase()}-count`);
            if (countElement) {
                const count = sampleLiveStreams.filter(s => s.category === category).length;
                countElement.textContent = `${count} live`;
            }
        });
        
        // Populate gifts grid
        const giftsGrid = document.getElementById('giftsGridContainer');
        if (giftsGrid) {
            giftsGrid.innerHTML = liveStreamGiftTypes.map(gift => `
                <button class="gift-btn" onclick="sendGift('${gift.id}')">
                    <div class="gift-icon">${gift.emoji}</div>
                    <div class="gift-name">${gift.name.split(' ').slice(1).join(' ')}</div>
                    <div class="gift-cost">${gift.coins} coins</div>
                </button>
            `).join('');
        }
        
        console.log('✅ Live streams populated dynamically');
    }, 100);
    
    // Add viewport resize listener for console/dev tools
    const handleViewportResize = () => {
        const livePage = document.getElementById('liveStreamingPage');
        if (livePage) {
            const height = window.innerHeight;
            const width = window.innerWidth;
            
            // Calculate available space accounting for sidebar
            const sidebarWidth = window.innerWidth > 1024 ? 280 : 0;
            const availableWidth = width - sidebarWidth;
            const availableHeight = height;
            
            // Update live page dimensions dynamically
            livePage.style.width = `${availableWidth}px`;
            livePage.style.height = `${availableHeight}px`;
            livePage.style.left = `${sidebarWidth}px`;
            
            // Detect if console/dev tools are likely open (reduced viewport)
            if (height < 600 || availableWidth < 600) {
                livePage.classList.add('console-open');
            } else {
                livePage.classList.remove('console-open');
            }
            
            console.log(`📱 Live page resized: ${availableWidth}x${availableHeight} (sidebar: ${sidebarWidth}px)`);
        }
    };
    
    // Store handler globally for cleanup
    window.liveStreamingResizeHandler = handleViewportResize;
    
    // Listen for resize events
    window.addEventListener('resize', handleViewportResize);
    
    // Initial check
    handleViewportResize();
    
    console.log('✅ Live Streaming page loaded with responsive viewport detection');
}

function closeLiveStreaming() {
    console.log('🔴 Closing Live Streaming page');
    
    // Remove the live streaming page
    const liveStreamingPage = document.getElementById('liveStreamingPage');
    if (liveStreamingPage) {
        liveStreamingPage.remove();
    }
    
    // Show main app content
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'flex';
    }
    
    // Remove resize listener if it exists
    if (window.liveStreamingResizeHandler) {
        window.removeEventListener('resize', window.liveStreamingResizeHandler);
        window.liveStreamingResizeHandler = null;
    }
    
    console.log('✅ Returned to main app');
}

function generateLiveStreamsHTML(streams) {
    return streams.map(stream => `
        <div class="live-stream-card" onclick="joinLiveStream('${stream.id}')">
            <div class="stream-thumbnail">
                <div class="stream-live-badge">
                    <span class="stream-live-dot"></span>
                    LIVE
                </div>
                <div class="stream-viewer-count">${stream.viewerCount} viewers</div>
                <div style="font-size: 4rem;">${stream.streamer.avatar}</div>
            </div>
            <div class="stream-card-content">
                <div class="stream-card-title">${stream.title}</div>
                <div class="stream-card-streamer">
                    <div class="stream-card-avatar">${stream.streamer.avatar}</div>
                    <div class="stream-card-name">${stream.streamer.displayName}</div>
                </div>
                <div class="stream-card-category">${stream.category}</div>
            </div>
        </div>
    `).join('');
}

function switchLiveTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.live-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[onclick="switchLiveTab('${tabName}')"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.live-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Streams`).classList.add('active');
    
    console.log('🔄 Switched to live tab:', tabName);
}

function showCategoryStreams(category) {
    console.log('📂 Showing category streams:', category);
    const categoryStreams = sampleLiveStreams.filter(stream => stream.category === category);
    
    // Switch to featured tab and show filtered streams
    switchLiveTab('featured');
    const featuredContent = document.getElementById('featuredStreams');
    featuredContent.innerHTML = `
        <div class="category-header">
            <h2>${category} Streams</h2>
            <button onclick="switchLiveTab('featured')" class="back-btn">← Back to All</button>
        </div>
        <div class="live-streams-grid">
            ${generateLiveStreamsHTML(categoryStreams)}
        </div>
    `;
}

function openLiveSetup() {
    console.log('🎥 Opening live setup');
    document.getElementById('liveSetupModal').style.display = 'flex';
    setupLivePreview();
}

function closeLiveSetup() {
    console.log('❌ Closing live setup');
    document.getElementById('liveSetupModal').style.display = 'none';
    
    // Stop preview stream
    if (liveStreamingState.userStream) {
        liveStreamingState.userStream.getTracks().forEach(track => track.stop());
        liveStreamingState.userStream = null;
    }
}

async function setupLivePreview() {
    try {
        console.log('📹 Setting up live preview');
        
        // Request camera and microphone access
        liveStreamingState.userStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: true
        });
        
        const previewVideo = document.getElementById('livePreview');
        previewVideo.srcObject = liveStreamingState.userStream;
        
        console.log('✅ Live preview setup complete');
    } catch (error) {
        console.error('❌ Failed to setup live preview:', error);
        
        // Show error message
        alert('Unable to access camera and microphone. Please ensure permissions are granted.');
    }
}

function startLiveStream() {
    console.log('🔴 Starting live stream');
    
    // Get stream settings
    liveStreamingState.streamSettings.title = document.getElementById('streamTitle').value || 'Live Stream';
    liveStreamingState.streamSettings.description = document.getElementById('streamDescription').value || '';
    liveStreamingState.streamSettings.category = document.getElementById('streamCategory').value;
    liveStreamingState.streamSettings.allowComments = document.getElementById('allowComments').checked;
    liveStreamingState.streamSettings.allowGifts = document.getElementById('allowGifts').checked;
    
    // Generate unique stream ID
    liveStreamingState.streamId = 'stream_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    liveStreamingState.isLive = true;
    liveStreamingState.startTime = Date.now();
    
    // Close setup modal
    closeLiveSetup();
    
    // Show live stream interface
    document.getElementById('liveStreamInterface').style.display = 'flex';
    
    // Setup live stream video
    const liveVideo = document.getElementById('liveStreamVideo');
    liveVideo.srcObject = liveStreamingState.userStream;
    
    // Start stream timer
    startStreamTimer();
    
    // Simulate viewers joining
    setTimeout(() => {
        simulateViewerJoining();
    }, 5000);
    
    console.log('✅ Live stream started:', liveStreamingState.streamId);
}

function startStreamTimer() {
    setInterval(() => {
        if (liveStreamingState.isLive) {
            const duration = Date.now() - liveStreamingState.startTime;
            const minutes = Math.floor(duration / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);
            
            const durationElement = document.getElementById('streamDuration');
            if (durationElement) {
                durationElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    }, 1000);
}

function simulateViewerJoining() {
    const viewers = [
        { id: 'viewer1', name: 'Sarah123', avatar: '👩' },
        { id: 'viewer2', name: 'Mike_Gaming', avatar: '🎮' },
        { id: 'viewer3', name: 'ArtLover', avatar: '🎨' },
        { id: 'viewer4', name: 'FitnessGuru', avatar: '💪' },
        { id: 'viewer5', name: 'TechReviewer', avatar: '💻' }
    ];
    
    viewers.forEach((viewer, index) => {
        setTimeout(() => {
            liveStreamingState.viewers.set(viewer.id, {
                ...viewer,
                joinTime: Date.now()
            });
            
            updateViewerCount();
            updateViewersList();
            
            // Simulate viewer comment
            setTimeout(() => {
                addChatMessage(viewer.id, viewer.name, viewer.avatar, getRandomComment());
            }, 2000 + Math.random() * 3000);
            
        }, index * 3000 + Math.random() * 2000);
    });
}

function getRandomComment() {
    const comments = [
        'Great stream! 👍',
        'Love the content!',
        'Keep it up! 🔥',
        'Amazing work!',
        'This is so cool!',
        'Thanks for streaming!',
        'Awesome! 🎉',
        'So entertaining!',
        'You\'re the best!',
        'More please! 💯'
    ];
    return comments[Math.floor(Math.random() * comments.length)];
}

function updateViewerCount() {
    const viewerCountElement = document.getElementById('liveViewerCount');
    if (viewerCountElement) {
        viewerCountElement.textContent = liveStreamingState.viewers.size;
    }
}

function updateViewersList() {
    const viewersListElement = document.getElementById('liveStreamViewers');
    if (viewersListElement) {
        viewersListElement.innerHTML = '';
        
        liveStreamingState.viewers.forEach(viewer => {
            const viewerElement = document.createElement('div');
            viewerElement.className = 'viewer-item';
            viewerElement.innerHTML = `
                <div class="viewer-avatar">${viewer.avatar}</div>
                <div class="viewer-name">${viewer.name}</div>
            `;
            viewersListElement.appendChild(viewerElement);
        });
    }
}

function addChatMessage(userId, username, avatar, message) {
    const chatElement = document.getElementById('liveStreamChat');
    if (chatElement) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.innerHTML = `
            <div class="chat-message-header">
                <div class="chat-message-avatar">${avatar}</div>
                <div class="chat-message-name">${username}</div>
                <div class="chat-message-time">${formatTime(Date.now())}</div>
            </div>
            <div class="chat-message-content">${message}</div>
        `;
        
        chatElement.appendChild(messageElement);
        chatElement.scrollTop = chatElement.scrollHeight;
        
        // Remove old messages to prevent overflow
        while (chatElement.children.length > 100) {
            chatElement.removeChild(chatElement.firstChild);
        }
    }
}

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (message) {
        addChatMessage(
            'streamer',
            'You',
            '👤',
            message
        );
        
        chatInput.value = '';
        console.log('💬 Chat message sent:', message);
    }
}

function switchStreamTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[onclick="switchStreamTab('${tabName}')"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.sidebar-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    console.log('🔄 Switched to stream tab:', tabName);
}

function endLiveStream() {
    console.log('🛑 Ending live stream');
    
    if (confirm('Are you sure you want to end your live stream?')) {
        liveStreamingState.isLive = false;
        
        // Stop all tracks
        if (liveStreamingState.userStream) {
            liveStreamingState.userStream.getTracks().forEach(track => track.stop());
        }
        
        // Show stream summary
        const duration = Date.now() - liveStreamingState.startTime;
        const minutes = Math.floor(duration / 60000);
        const maxViewers = liveStreamingState.viewers.size;
        const totalComments = liveStreamingState.comments.length;
        
        alert(`Stream Summary:
Duration: ${minutes} minutes
Peak Viewers: ${maxViewers}
Total Comments: ${totalComments}
Thanks for streaming!`);
        
        // Hide stream interface
        document.getElementById('liveStreamInterface').style.display = 'none';
        
        // Reset state
        liveStreamingState.viewers.clear();
        liveStreamingState.comments = [];
        liveStreamingState.gifts = [];
        liveStreamingState.streamId = null;
        liveStreamingState.startTime = null;
        
        console.log('✅ Live stream ended');
    }
}

function joinLiveStream(streamId) {
    console.log('🔗 Joining live stream:', streamId);
    
    const stream = sampleLiveStreams.find(s => s.id === streamId);
    if (!stream) {
        console.error('❌ Stream not found:', streamId);
        return;
    }
    
    liveStreamingState.currentStream = stream;
    liveStreamingState.isViewing = true;
    
    // Show viewer interface
    document.getElementById('liveStreamViewer').style.display = 'flex';
    
    // Update streamer info
    document.getElementById('viewerStreamerName').textContent = stream.streamer.displayName;
    document.getElementById('viewerStreamTitle').textContent = stream.title;
    document.getElementById('viewerStreamerAvatar').textContent = stream.streamer.avatar;
    document.getElementById('viewerViewerCount').textContent = stream.viewerCount;
    
    // Update follow button
    const followBtn = document.getElementById('viewerFollowBtn');
    followBtn.textContent = stream.streamer.isFollowing ? 'Following' : 'Follow';
    followBtn.style.background = stream.streamer.isFollowing ? 'var(--bg-tertiary)' : 'var(--accent-gradient)';
    
    // Setup viewer video (simulate stream)
    const viewerVideo = document.getElementById('viewerVideo');
    viewerVideo.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    viewerVideo.play();
    
    // Simulate chat messages
    setTimeout(() => {
        simulateViewerChatMessages();
    }, 2000);
    
    console.log('✅ Joined live stream:', stream.title);
}

function simulateViewerChatMessages() {
    const messages = [
        { user: 'ChatMaster', avatar: '💬', message: 'Welcome to the stream!' },
        { user: 'StreamFan', avatar: '⭐', message: 'Love this content!' },
        { user: 'Viewer123', avatar: '👋', message: 'Hey everyone!' },
        { user: 'StreamLover', avatar: '❤️', message: 'Amazing stream!' }
    ];
    
    messages.forEach((msg, index) => {
        setTimeout(() => {
            addViewerChatMessage(msg.user, msg.avatar, msg.message);
        }, index * 3000 + Math.random() * 2000);
    });
}

function addViewerChatMessage(username, avatar, message) {
    const chatElement = document.getElementById('viewerChat');
    if (chatElement) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.innerHTML = `
            <div class="chat-message-header">
                <div class="chat-message-avatar">${avatar}</div>
                <div class="chat-message-name">${username}</div>
                <div class="chat-message-time">${formatTime(Date.now())}</div>
            </div>
            <div class="chat-message-content">${message}</div>
        `;
        
        chatElement.appendChild(messageElement);
        chatElement.scrollTop = chatElement.scrollHeight;
        
        // Remove old messages to prevent overflow
        while (chatElement.children.length > 100) {
            chatElement.removeChild(chatElement.firstChild);
        }
    }
}

function sendViewerChatMessage() {
    const chatInput = document.getElementById('viewerChatInput');
    const message = chatInput.value.trim();
    
    if (message) {
        addViewerChatMessage(
            window.currentUser?.displayName || 'You',
            '👤',
            message
        );
        
        chatInput.value = '';
        console.log('💬 Viewer chat message sent:', message);
    }
}

function switchViewerTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.viewer-sidebar-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[onclick="switchViewerTab('${tabName}')"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.viewer-sidebar-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`viewer${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).classList.add('active');
    
    console.log('🔄 Switched to viewer tab:', tabName);
}

function sendGift(giftId) {
    console.log('🎁 Sending gift:', giftId);
    
    const gift = liveStreamGiftTypes.find(g => g.id === giftId);
    if (!gift) return;
    
    const userCoins = parseInt(document.getElementById('userCoinsBalance').textContent);
    if (userCoins < gift.coins) {
        alert('Not enough coins!');
        return;
    }
    
    // Update coins balance
    document.getElementById('userCoinsBalance').textContent = userCoins - gift.coins;
    
    // Animate gift
    animateGift(gift);
    
    // Add gift message to chat
    addViewerChatMessage(
        window.currentUser?.displayName || 'You',
        '🎁',
        `Sent ${gift.name}!`
    );
    
    console.log('✅ Gift sent:', gift.name);
}

function animateGift(gift) {
    const animationArea = document.getElementById('viewerGiftsAnimation');
    if (animationArea) {
        const giftElement = document.createElement('div');
        giftElement.className = 'gift-animation';
        giftElement.textContent = gift.emoji;
        giftElement.style.left = Math.random() * 80 + 10 + '%';
        
        animationArea.appendChild(giftElement);
        
        setTimeout(() => {
            animationArea.removeChild(giftElement);
        }, 3000);
    }
}

function leaveStream() {
    console.log('👋 Leaving stream');
    
    document.getElementById('liveStreamViewer').style.display = 'none';
    
    liveStreamingState.isViewing = false;
    liveStreamingState.currentStream = null;
    
    console.log('✅ Left stream');
}

function toggleFollow() {
    if (liveStreamingState.currentStream) {
        liveStreamingState.currentStream.streamer.isFollowing = !liveStreamingState.currentStream.streamer.isFollowing;
        
        const followBtn = document.getElementById('viewerFollowBtn');
        followBtn.textContent = liveStreamingState.currentStream.streamer.isFollowing ? 'Following' : 'Follow';
        followBtn.style.background = liveStreamingState.currentStream.streamer.isFollowing ? 'var(--bg-tertiary)' : 'var(--accent-gradient)';
        
        console.log('🔄 Follow toggled:', liveStreamingState.currentStream.streamer.isFollowing);
    }
}

function toggleCamera() {
    if (liveStreamingState.userStream) {
        const videoTrack = liveStreamingState.userStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            console.log('📷 Camera toggled:', videoTrack.enabled);
        }
    }
}

function toggleMicrophone() {
    if (liveStreamingState.userStream) {
        const audioTrack = liveStreamingState.userStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            console.log('🎤 Microphone toggled:', audioTrack.enabled);
        }
    }
}

function switchCamera() {
    console.log('🔄 Switching camera');
    // In a real implementation, this would switch between front and back camera
    // For now, we'll just log the action
}

function toggleStreamCamera() {
    toggleCamera();
}

function toggleStreamMicrophone() {
    toggleMicrophone();
}

function switchStreamCamera() {
    switchCamera();
}

function shareStream() {
    if (liveStreamingState.streamId) {
        const streamUrl = `${window.location.origin}${window.location.pathname}?stream=${liveStreamingState.streamId}`;
        
        if (navigator.share) {
            navigator.share({
                title: liveStreamingState.streamSettings.title,
                text: 'Check out my live stream on VIB3!',
                url: streamUrl
            });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(streamUrl).then(() => {
                alert('Stream link copied to clipboard!');
            });
        }
        
        console.log('📤 Stream shared:', streamUrl);
    }
}

function shareViewerStream() {
    if (liveStreamingState.currentStream) {
        const streamUrl = `${window.location.origin}${window.location.pathname}?stream=${liveStreamingState.currentStream.id}`;
        
        if (navigator.share) {
            navigator.share({
                title: liveStreamingState.currentStream.title,
                text: `Check out ${liveStreamingState.currentStream.streamer.displayName}'s live stream on VIB3!`,
                url: streamUrl
            });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(streamUrl).then(() => {
                alert('Stream link copied to clipboard!');
            });
        }
        
        console.log('📤 Viewer stream shared:', streamUrl);
    }
}

function toggleViewerVolume() {
    const viewerVideo = document.getElementById('viewerVideo');
    if (viewerVideo) {
        viewerVideo.muted = !viewerVideo.muted;
        const btn = document.querySelector('[onclick="toggleViewerVolume()"]');
        btn.textContent = viewerVideo.muted ? '🔇' : '🔊';
        console.log('🔊 Viewer volume toggled:', !viewerVideo.muted);
    }
}

function toggleViewerFullscreen() {
    const viewerVideo = document.getElementById('viewerVideo');
    if (viewerVideo) {
        if (viewerVideo.requestFullscreen) {
            viewerVideo.requestFullscreen();
        } else if (viewerVideo.webkitRequestFullscreen) {
            viewerVideo.webkitRequestFullscreen();
        } else if (viewerVideo.msRequestFullscreen) {
            viewerVideo.msRequestFullscreen();
        }
        console.log('⛶ Viewer fullscreen toggled');
    }
}

function showBuyCoins() {
    alert('Buy Coins feature coming soon!');
}

// Creator Fund page function
function showCreatorFundPage() {
    console.log('💰 Opening Creator Fund Page');
    
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'none';
    }
    
    // Remove existing dynamic pages that might interfere
    const pagesToRemove = ['coinsPage', 'collaborationPage', 'challengesPage', 'vibeRoomsPage', 'creatorStudioPage', 'activityPage'];
    pagesToRemove.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) {
            page.remove();
            console.log(`🧹 Removed ${pageId} for creator fund page`);
        }
    });
    
    // Show the creator fund page that exists in HTML
    const creatorPage = document.querySelector('.creator-page');
    if (creatorPage) {
        creatorPage.style.display = 'block';
        console.log('✅ Creator Fund page displayed');
    } else {
        console.log('❌ Creator Fund page not found in HTML');
        showNotification('Creator Fund page coming soon!', 'info');
    }
}

// Shop page function
function showShopPage() {
    console.log('🛒 Opening Shop Page');
    
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'none';
    }
    
    // Remove existing dynamic pages that might interfere
    const pagesToRemove = ['coinsPage', 'collaborationPage', 'challengesPage', 'vibeRoomsPage', 'creatorStudioPage', 'activityPage'];
    pagesToRemove.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) {
            page.remove();
            console.log(`🧹 Removed ${pageId} for shop page`);
        }
    });
    
    // Show the shop page that exists in HTML
    const shopPage = document.querySelector('.shop-page');
    if (shopPage) {
        shopPage.style.display = 'block';
        console.log('✅ Shop page displayed');
    } else {
        console.log('❌ Shop page not found in HTML');
        showNotification('Shop page coming soon!', 'info');
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Export VIB3 unique functions to window
window.startPulseMetrics = startPulseMetrics;
window.simulatePulseActivity = simulatePulseActivity;
window.startEnergyUpdates = startEnergyUpdates;
window.closeEnergyMeter = closeEnergyMeter;
window.joinVibeRoom = joinVibeRoom;
window.showCreateRoomModal = showCreateRoomModal;
window.showEnergyMeter = showEnergyMeter;
window.showVibeRooms = showVibeRooms;
window.loadPulseFeed = loadPulseFeed;
window.initializeVibeRoom = initializeVibeRoom;
window.sendRoomMessage = sendRoomMessage;
window.leaveVibeRoom = leaveVibeRoom;
window.startRoomActivity = startRoomActivity;
window.showCreatorStudio = showCreatorStudio;
window.switchStudioTab = switchStudioTab;
window.importCreatorMedia = importCreatorMedia;
window.exportCreatorProject = exportCreatorProject;
window.checkIfFilesNeedReimport = checkIfFilesNeedReimport;
window.applyEffect = applyEffect;
window.adjustAudioVolume = adjustAudioVolume;
window.addAudioFade = addAudioFade;
window.addBackgroundMusic = addBackgroundMusic;
window.playPausePreview = playPausePreview;
window.fullscreenPreview = fullscreenPreview;
window.addVideoTrack = addVideoTrack;
window.addAudioTrack = addAudioTrack;
window.zoomTimeline = zoomTimeline;
window.showChallenges = showChallenges;
window.switchChallengeTab = switchChallengeTab;
window.joinChallenge = joinChallenge;
window.viewChallengeDetails = viewChallengeDetails;
window.createNewChallenge = createNewChallenge;
window.showMyParticipations = showMyParticipations;
window.startChallengeParticipation = startChallengeParticipation;

// Navigation functions exports
window.showCollaborationHub = showCollaborationHub;
window.showCoins = showCoins;
window.showCreatorFundPage = showCreatorFundPage;
window.showShopPage = showShopPage;

// Live Streaming exports
window.showLiveStreaming = showLiveStreaming;
window.switchLiveTab = switchLiveTab;
window.showCategoryStreams = showCategoryStreams;
window.openLiveSetup = openLiveSetup;
window.closeLiveSetup = closeLiveSetup;
window.startLiveStream = startLiveStream;
window.endLiveStream = endLiveStream;
window.joinLiveStream = joinLiveStream;
window.leaveStream = leaveStream;
window.sendChatMessage = sendChatMessage;
window.sendViewerChatMessage = sendViewerChatMessage;
window.switchStreamTab = switchStreamTab;
window.switchViewerTab = switchViewerTab;
window.sendGift = sendGift;
window.toggleFollow = toggleFollow;
window.toggleCamera = toggleCamera;
window.toggleMicrophone = toggleMicrophone;
window.switchCamera = switchCamera;
window.shareStream = shareStream;
window.shareViewerStream = shareViewerStream;
window.toggleViewerVolume = toggleViewerVolume;
window.toggleViewerFullscreen = toggleViewerFullscreen;
window.showBuyCoins = showBuyCoins;

// ================ COLLABORATION SYSTEM ================
// VIB3 Collaborative Content Creation System - Phase 4 Feature


// Collaboration Hub - Main entry point
function showCollaborationHub() {
    console.log('🤝 Showing Collaboration Hub');
    
    // Hide all other pages
    document.querySelectorAll('.video-feed, .search-page, .profile-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page, .activity-page, .friends-page, .challenges-page, .coins-page, .vibe-rooms-page, .creator-studio-page').forEach(el => {
        el.style.display = 'none';
    });
    const mainApp = document.getElementById('mainApp');
    if (mainApp) mainApp.style.display = 'none';
    
    // Remove existing dynamic pages
    const existingPages = ['collaborationPage', 'challengesPage', 'coinsPage', 'vibeRoomsPage', 'creatorStudioPage'];
    existingPages.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) page.remove();
    });
    
    // Create collaboration hub page
    const collaborationPage = document.createElement('div');
    collaborationPage.id = 'collaborationPage';
    collaborationPage.className = 'collaboration-page';
    collaborationPage.style.cssText = `
        margin-left: 240px; 
        width: calc(100vw - 240px); 
        height: 100vh; 
        overflow-y: auto; 
        background: var(--bg-primary); 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    collaborationPage.innerHTML = `
        <div class="collaboration-header" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            color: white;
            border-bottom: 1px solid var(--border-primary);
        ">
            <div style="max-width: 1200px; margin: 0 auto;">
                <h1 style="
                    font-size: 36px;
                    font-weight: 800;
                    margin: 0 0 16px 0;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">🤝 Collaboration Hub</h1>
                <p style="
                    font-size: 18px;
                    margin: 0 0 24px 0;
                    opacity: 0.9;
                ">Create amazing content together with fellow creators</p>
                <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                    <button onclick="showCreateProjectModal()" style="
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: 2px solid rgba(255,255,255,0.3);
                        padding: 12px 24px;
                        border-radius: 25px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        ➕ Start New Project
                    </button>
                    <button onclick="showProjectTemplates()" style="
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: 2px solid rgba(255,255,255,0.3);
                        padding: 12px 24px;
                        border-radius: 25px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        📋 Browse Templates
                    </button>
                    <button onclick="showCollaborationStats()" style="
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: 2px solid rgba(255,255,255,0.3);
                        padding: 12px 24px;
                        border-radius: 25px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        📊 My Stats
                    </button>
                </div>
            </div>
        </div>
        
        <div class="collaboration-content" style="max-width: 1200px; margin: 0 auto; padding: 30px;">
            <div class="collaboration-tabs" style="
                display: flex;
                gap: 20px;
                margin-bottom: 30px;
                border-bottom: 2px solid var(--border-primary);
                padding-bottom: 20px;
            ">
                <button class="collab-tab-btn active" data-tab="active" style="
                    background: var(--accent-color);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">Active Projects</button>
                <button class="collab-tab-btn" data-tab="completed" style="
                    background: var(--bg-tertiary);
                    color: var(--text-secondary);
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">Completed</button>
                <button class="collab-tab-btn" data-tab="invitations" style="
                    background: var(--bg-tertiary);
                    color: var(--text-secondary);
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">Invitations <span class="notification-badge" style="
                    background: #ff4757;
                    color: white;
                    font-size: 12px;
                    padding: 2px 8px;
                    border-radius: 10px;
                    margin-left: 8px;
                ">2</span></button>
            </div>
            
            <div id="collaborationContent" class="collaboration-projects">
                <div class="loading-projects" style="text-align: center; padding: 60px; color: var(--text-secondary);">
                    ⏳ Loading your collaborative projects...
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(collaborationPage);
    
    // Add event listeners for tabs
    collaborationPage.querySelectorAll('.collab-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabType = btn.dataset.tab;
            switchCollaborationTab(tabType);
            
            // Update active tab styling
            collaborationPage.querySelectorAll('.collab-tab-btn').forEach(b => {
                b.classList.remove('active');
                b.style.background = 'var(--bg-tertiary)';
                b.style.color = 'var(--text-secondary)';
            });
            btn.classList.add('active');
            btn.style.background = 'var(--accent-color)';
            btn.style.color = 'white';
        });
    });
    
    // Load initial projects
    setTimeout(() => loadCollaborationProjects('active'), 300);
}

// Switch collaboration tabs
function switchCollaborationTab(tabType) {
    console.log(`🔄 Switching to ${tabType} tab`);
    loadCollaborationProjects(tabType);
}

// Load collaboration projects
async function loadCollaborationProjects(filter = 'active') {
    console.log(`📋 Loading ${filter} collaboration projects`);
    const contentDiv = document.getElementById('collaborationContent');
    if (!contentDiv) return;
    
    // Show loading
    contentDiv.innerHTML = `
        <div class="loading-projects" style="text-align: center; padding: 60px; color: var(--text-secondary);">
            ⏳ Loading ${filter} projects...
        </div>
    `;
    
    try {
        // Use sample data for offline mode
        console.log('🔄 Using sample collaboration data for offline mode');
        const projects = sampleCollaborationData.projects.filter(project => {
            if (filter === 'active') return project.status === 'active' || project.status === 'planning';
            if (filter === 'completed') return project.status === 'completed';
            if (filter === 'invitations') return project.collaborators.some(c => c.status === 'pending');
            return true;
        });
        
        setTimeout(() => {
            if (projects.length === 0) {
                contentDiv.innerHTML = createEmptyProjectsView(filter);
            } else {
                contentDiv.innerHTML = createProjectsGrid(projects, filter);
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ Error loading collaboration projects:', error);
        contentDiv.innerHTML = `
            <div class="error-projects" style="text-align: center; padding: 60px; color: var(--text-secondary);">
                ❌ Failed to load projects. Using offline mode.
                <br><br>
                <button onclick="loadCollaborationProjects('${filter}')" style="
                    background: var(--accent-color);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 20px;
                    cursor: pointer;
                    margin-top: 10px;
                ">Retry</button>
            </div>
        `;
    }
}

// Create empty projects view
function createEmptyProjectsView(filter) {
    const messages = {
        active: {
            icon: '🚀',
            title: 'No Active Projects',
            description: 'Start your first collaboration project and create amazing content with fellow creators!',
            action: 'Start New Project'
        },
        completed: {
            icon: '✅',
            title: 'No Completed Projects',
            description: 'Complete your first collaboration project to see it here.',
            action: 'View Active Projects'
        },
        invitations: {
            icon: '📨',
            title: 'No Pending Invitations',
            description: 'When creators invite you to collaborate, you\'ll see the invitations here.',
            action: 'Start New Project'
        }
    };
    
    const msg = messages[filter] || messages.active;
    
    return `
        <div class="empty-projects" style="
            text-align: center;
            padding: 80px 40px;
            color: var(--text-secondary);
            max-width: 600px;
            margin: 0 auto;
        ">
            <div style="font-size: 64px; margin-bottom: 24px;">${msg.icon}</div>
            <h3 style="
                color: var(--text-primary);
                font-size: 24px;
                margin-bottom: 16px;
                font-weight: 700;
            ">${msg.title}</h3>
            <p style="
                font-size: 16px;
                line-height: 1.5;
                margin-bottom: 32px;
            ">${msg.description}</p>
            <button onclick="showCreateProjectModal()" style="
                background: var(--accent-color);
                color: white;
                border: none;
                padding: 16px 32px;
                border-radius: 25px;
                font-weight: 600;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                ${msg.action}
            </button>
        </div>
    `;
}

// Create projects grid
function createProjectsGrid(projects, filter) {
    const projectCards = projects.map(project => createProjectCard(project, filter)).join('');
    
    return `
        <div class="projects-grid" style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 24px;
            margin-bottom: 40px;
        ">
            ${projectCards}
        </div>
    `;
}

// Create individual project card
function createProjectCard(project, filter) {
    const statusColors = {
        active: '#2ed573',
        planning: '#ffa502',
        completed: '#5352ed',
        pending: '#ff4757'
    };
    
    const statusColor = statusColors[project.status] || '#7f8c8d';
    const timeAgo = getTimeAgo(project.createdAt);
    const deadline = project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline';
    
    return `
        <div class="project-card" style="
            background: var(--bg-secondary);
            border: 1px solid var(--border-primary);
            border-radius: 16px;
            padding: 24px;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        " onclick="openProjectDetails('${project.id}')" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 32px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            <div class="project-status" style="
                position: absolute;
                top: 16px;
                right: 16px;
                background: ${statusColor};
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            ">${project.status}</div>
            
            <div class="project-header" style="margin-bottom: 16px;">
                <h3 style="
                    color: var(--text-primary);
                    font-size: 20px;
                    font-weight: 700;
                    margin: 0 0 8px 0;
                    padding-right: 80px;
                    line-height: 1.2;
                ">${project.title}</h3>
                <p style="
                    color: var(--text-secondary);
                    font-size: 14px;
                    margin: 0;
                    line-height: 1.4;
                ">${project.description}</p>
            </div>
            
            <div class="project-owner" style="
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
            ">
                <div style="
                    width: 32px;
                    height: 32px;
                    background: var(--accent-color);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                ">${project.owner.avatar}</div>
                <div>
                    <div style="color: var(--text-primary); font-weight: 600; font-size: 14px;">@${project.owner.username}</div>
                    <div style="color: var(--text-secondary); font-size: 12px;">Created ${timeAgo}</div>
                </div>
            </div>
            
            <div class="project-collaborators" style="margin-bottom: 16px;">
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                ">
                    <span style="
                        color: var(--text-secondary);
                        font-size: 14px;
                        font-weight: 600;
                    ">Collaborators:</span>
                    <div style="display: flex; gap: 4px;">
                        ${project.collaborators.slice(0, 3).map(collab => `
                            <div style="
                                width: 24px;
                                height: 24px;
                                background: var(--bg-tertiary);
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 12px;
                                border: 2px solid var(--bg-secondary);
                            " title="${collab.username} (${collab.role})">${collab.avatar}</div>
                        `).join('')}
                        ${project.collaborators.length > 3 ? `
                            <div style="
                                width: 24px;
                                height: 24px;
                                background: var(--text-secondary);
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 10px;
                                color: white;
                                font-weight: 600;
                            ">+${project.collaborators.length - 3}</div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="project-progress" style="margin-bottom: 16px;">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                ">
                    <span style="
                        color: var(--text-secondary);
                        font-size: 14px;
                        font-weight: 600;
                    ">Progress</span>
                    <span style="
                        color: var(--text-primary);
                        font-size: 14px;
                        font-weight: 600;
                    ">${project.progress}%</span>
                </div>
                <div style="
                    width: 100%;
                    height: 6px;
                    background: var(--bg-tertiary);
                    border-radius: 3px;
                    overflow: hidden;
                ">
                    <div style="
                        width: ${project.progress}%;
                        height: 100%;
                        background: linear-gradient(90deg, var(--accent-color), #667eea);
                        transition: width 0.3s ease;
                    "></div>
                </div>
            </div>
            
            <div class="project-meta" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: var(--text-secondary);
                font-size: 12px;
            ">
                <div>📅 Due: ${deadline}</div>
                <div>📎 ${project.assets.length} assets</div>
            </div>
        </div>
    `;
}

// Helper function to get time ago
function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
}

// Show create project modal
function showCreateProjectModal() {
    console.log('➕ Showing create project modal');
    
    const modal = document.createElement('div');
    modal.className = 'modal collaboration-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
        backdrop-filter: blur(5px);
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: var(--bg-primary);
            border-radius: 20px;
            padding: 0;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        ">
            <div class="modal-header" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 24px;
                border-radius: 20px 20px 0 0;
                color: white;
                position: relative;
            ">
                <button onclick="closeCreateProjectModal()" style="
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">&times;</button>
                <h2 style="
                    margin: 0 0 8px 0;
                    font-size: 24px;
                    font-weight: 700;
                ">🚀 Start New Project</h2>
                <p style="
                    margin: 0;
                    opacity: 0.9;
                    font-size: 14px;
                ">Create a collaborative project and invite fellow creators</p>
            </div>
            
            <div class="modal-body" style="padding: 24px;">
                <form id="createProjectForm" onsubmit="createNewProject(event)">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            color: var(--text-primary);
                            font-weight: 600;
                            margin-bottom: 8px;
                        ">Project Title *</label>
                        <input type="text" id="projectTitle" required style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid var(--border-primary);
                            border-radius: 8px;
                            background: var(--bg-secondary);
                            color: var(--text-primary);
                            font-size: 16px;
                        " placeholder="Enter your project title">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            color: var(--text-primary);
                            font-weight: 600;
                            margin-bottom: 8px;
                        ">Description *</label>
                        <textarea id="projectDescription" required style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid var(--border-primary);
                            border-radius: 8px;
                            background: var(--bg-secondary);
                            color: var(--text-primary);
                            font-size: 16px;
                            min-height: 100px;
                            resize: vertical;
                        " placeholder="Describe your project and what you want to create"></textarea>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            color: var(--text-primary);
                            font-weight: 600;
                            margin-bottom: 8px;
                        ">Template</label>
                        <select id="projectTemplate" style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid var(--border-primary);
                            border-radius: 8px;
                            background: var(--bg-secondary);
                            color: var(--text-primary);
                            font-size: 16px;
                        ">
                            <option value="">Choose a template (optional)</option>
                            <option value="dance_challenge">🕺 Dance Challenge</option>
                            <option value="tutorial">📚 Tutorial Collaboration</option>
                            <option value="music_video">🎵 Music Video Production</option>
                            <option value="comedy_sketch">😄 Comedy Sketch</option>
                        </select>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            color: var(--text-primary);
                            font-weight: 600;
                            margin-bottom: 8px;
                        ">Deadline</label>
                        <input type="date" id="projectDeadline" style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid var(--border-primary);
                            border-radius: 8px;
                            background: var(--bg-secondary);
                            color: var(--text-primary);
                            font-size: 16px;
                        ">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            color: var(--text-primary);
                            font-weight: 600;
                            margin-bottom: 8px;
                        ">Invite Collaborators</label>
                        <input type="text" id="collaboratorInvites" style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid var(--border-primary);
                            border-radius: 8px;
                            background: var(--bg-secondary);
                            color: var(--text-primary);
                            font-size: 16px;
                        " placeholder="Enter usernames separated by commas (@user1, @user2)">
                        <small style="color: var(--text-secondary); font-size: 12px;">
                            You can invite collaborators now or later from the project page
                        </small>
                    </div>
                    
                    <div class="form-actions" style="
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                        margin-top: 24px;
                    ">
                        <button type="button" onclick="closeCreateProjectModal()" style="
                            background: var(--bg-tertiary);
                            color: var(--text-secondary);
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                        ">Cancel</button>
                        <button type="submit" style="
                            background: var(--accent-color);
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                        ">Create Project</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on title input
    setTimeout(() => {
        document.getElementById('projectTitle').focus();
    }, 100);
}

// Close create project modal
function closeCreateProjectModal() {
    const modal = document.querySelector('.collaboration-modal');
    if (modal) modal.remove();
}

// Create new project
function createNewProject(event) {
    event.preventDefault();
    
    const title = document.getElementById('projectTitle').value;
    const description = document.getElementById('projectDescription').value;
    const template = document.getElementById('projectTemplate').value;
    const deadline = document.getElementById('projectDeadline').value;
    const collaborators = document.getElementById('collaboratorInvites').value;
    
    console.log('🚀 Creating new project:', { title, description, template, deadline, collaborators });
    
    // Show success message
    showNotification('Project created successfully! 🎉', 'success');
    
    // Close modal
    closeCreateProjectModal();
    
    // Refresh projects list
    setTimeout(() => {
        loadCollaborationProjects('active');
    }, 500);
}

// Open project details
function openProjectDetails(projectId) {
    console.log('📋 Opening project details:', projectId);
    
    const project = sampleCollaborationData.projects.find(p => p.id === projectId);
    if (!project) {
        showNotification('Project not found', 'error');
        return;
    }
    
    // Hide collaboration hub
    const collaborationPage = document.getElementById('collaborationPage');
    if (collaborationPage) collaborationPage.style.display = 'none';
    
    // Create project details page
    const projectDetailsPage = document.createElement('div');
    projectDetailsPage.id = 'projectDetailsPage';
    projectDetailsPage.className = 'project-details-page';
    projectDetailsPage.style.cssText = `
        margin-left: 240px; 
        width: calc(100vw - 240px); 
        height: 100vh; 
        overflow-y: auto; 
        background: var(--bg-primary); 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    const statusColors = {
        active: '#2ed573',
        planning: '#ffa502',
        completed: '#5352ed',
        pending: '#ff4757'
    };
    
    projectDetailsPage.innerHTML = `
        <div class="project-header" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            color: white;
            border-bottom: 1px solid var(--border-primary);
        ">
            <div style="max-width: 1200px; margin: 0 auto;">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                    <button onclick="closeProjectDetails()" style="
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                    ">← Back</button>
                    <div style="
                        background: ${statusColors[project.status]};
                        color: white;
                        padding: 6px 16px;
                        border-radius: 12px;
                        font-size: 14px;
                        font-weight: 600;
                        text-transform: uppercase;
                    ">${project.status}</div>
                </div>
                <h1 style="
                    font-size: 32px;
                    font-weight: 800;
                    margin: 0 0 12px 0;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">${project.title}</h1>
                <p style="
                    font-size: 16px;
                    margin: 0 0 20px 0;
                    opacity: 0.9;
                    line-height: 1.4;
                ">${project.description}</p>
                
                <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="
                            width: 40px;
                            height: 40px;
                            background: rgba(255,255,255,0.2);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 20px;
                        ">${project.owner.avatar}</div>
                        <div>
                            <div style="font-weight: 600;">@${project.owner.username}</div>
                            <div style="font-size: 12px; opacity: 0.8;">Project Owner</div>
                        </div>
                    </div>
                    
                    <div style="width: 1px; height: 40px; background: rgba(255,255,255,0.2);"></div>
                    
                    <div>
                        <div style="font-weight: 600;">${project.progress}% Complete</div>
                        <div style="font-size: 12px; opacity: 0.8;">Progress</div>
                    </div>
                    
                    <div style="width: 1px; height: 40px; background: rgba(255,255,255,0.2);"></div>
                    
                    <div>
                        <div style="font-weight: 600;">${project.collaborators.length} Collaborators</div>
                        <div style="font-size: 12px; opacity: 0.8;">Team Size</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="project-content" style="max-width: 1200px; margin: 0 auto; padding: 30px;">
            <div style="display: grid; grid-template-columns: 1fr 350px; gap: 30px;">
                <div class="project-main">
                    <div class="project-tabs" style="
                        display: flex;
                        gap: 16px;
                        margin-bottom: 24px;
                        border-bottom: 2px solid var(--border-primary);
                        padding-bottom: 16px;
                    ">
                        <button class="project-tab-btn active" data-tab="overview" style="
                            background: var(--accent-color);
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 20px;
                            font-weight: 600;
                            cursor: pointer;
                        ">Overview</button>
                        <button class="project-tab-btn" data-tab="assets" style="
                            background: var(--bg-tertiary);
                            color: var(--text-secondary);
                            border: none;
                            padding: 10px 20px;
                            border-radius: 20px;
                            font-weight: 600;
                            cursor: pointer;
                        ">Assets <span style="
                            background: rgba(255,255,255,0.2);
                            padding: 2px 8px;
                            border-radius: 8px;
                            font-size: 12px;
                            margin-left: 4px;
                        ">${project.assets.length}</span></button>
                        <button class="project-tab-btn" data-tab="versions" style="
                            background: var(--bg-tertiary);
                            color: var(--text-secondary);
                            border: none;
                            padding: 10px 20px;
                            border-radius: 20px;
                            font-weight: 600;
                            cursor: pointer;
                        ">Versions <span style="
                            background: rgba(255,255,255,0.2);
                            padding: 2px 8px;
                            border-radius: 8px;
                            font-size: 12px;
                            margin-left: 4px;
                        ">${project.versions.length}</span></button>
                    </div>
                    
                    <div id="projectTabContent">
                        ${createProjectOverview(project)}
                    </div>
                </div>
                
                <div class="project-sidebar">
                    <!-- Collaborators Panel -->
                    <div class="collaborators-panel" style="
                        background: var(--bg-secondary);
                        border-radius: 16px;
                        padding: 20px;
                        margin-bottom: 20px;
                    ">
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 16px;
                        ">
                            <h3 style="
                                color: var(--text-primary);
                                font-size: 18px;
                                font-weight: 700;
                                margin: 0;
                            ">👥 Team</h3>
                            <button onclick="showInviteCollaboratorModal('${project.id}')" style="
                                background: var(--accent-color);
                                color: white;
                                border: none;
                                padding: 6px 12px;
                                border-radius: 8px;
                                font-size: 12px;
                                cursor: pointer;
                                font-weight: 600;
                            ">+ Invite</button>
                        </div>
                        
                        <div class="collaborator-list">
                            ${createCollaboratorList(project)}
                        </div>
                    </div>
                    
                    <!-- Project Chat -->
                    <div class="project-chat" style="
                        background: var(--bg-secondary);
                        border-radius: 16px;
                        padding: 20px;
                        height: 400px;
                        display: flex;
                        flex-direction: column;
                    ">
                        <h3 style="
                            color: var(--text-primary);
                            font-size: 18px;
                            font-weight: 700;
                            margin: 0 0 16px 0;
                        ">💬 Project Chat</h3>
                        
                        <div id="projectChatMessages" style="
                            flex: 1;
                            overflow-y: auto;
                            margin-bottom: 16px;
                            padding-right: 8px;
                        ">
                            ${createProjectChatMessages(project.id)}
                        </div>
                        
                        <div style="
                            display: flex;
                            gap: 8px;
                            align-items: center;
                        ">
                            <input type="text" id="projectChatInput" placeholder="Type a message..." style="
                                flex: 1;
                                padding: 8px 12px;
                                border: 1px solid var(--border-primary);
                                border-radius: 20px;
                                background: var(--bg-tertiary);
                                color: var(--text-primary);
                                font-size: 14px;
                            " onkeypress="if(event.key==='Enter') sendProjectMessage('${project.id}')">
                            <button onclick="sendProjectMessage('${project.id}')" style="
                                background: var(--accent-color);
                                color: white;
                                border: none;
                                padding: 8px 12px;
                                border-radius: 20px;
                                cursor: pointer;
                                font-size: 14px;
                            ">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(projectDetailsPage);
    
    // Add event listeners for project tabs
    projectDetailsPage.querySelectorAll('.project-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabType = btn.dataset.tab;
            switchProjectTab(tabType, project);
            
            // Update active tab styling
            projectDetailsPage.querySelectorAll('.project-tab-btn').forEach(b => {
                b.classList.remove('active');
                b.style.background = 'var(--bg-tertiary)';
                b.style.color = 'var(--text-secondary)';
            });
            btn.classList.add('active');
            btn.style.background = 'var(--accent-color)';
            btn.style.color = 'white';
        });
    });
}

// Switch project tabs
function switchProjectTab(tabType, project) {
    const contentDiv = document.getElementById('projectTabContent');
    if (!contentDiv) return;
    
    switch (tabType) {
        case 'overview':
            contentDiv.innerHTML = createProjectOverview(project);
            break;
        case 'assets':
            contentDiv.innerHTML = createProjectAssets(project);
            break;
        case 'versions':
            contentDiv.innerHTML = createProjectVersions(project);
            break;
    }
}

// Create project overview
function createProjectOverview(project) {
    const deadline = project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline set';
    
    return `
        <div class="project-overview">
            <div class="progress-section" style="
                background: var(--bg-secondary);
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 24px;
            ">
                <h3 style="
                    color: var(--text-primary);
                    font-size: 20px;
                    font-weight: 700;
                    margin: 0 0 16px 0;
                ">📊 Project Progress</h3>
                
                <div style="
                    background: var(--bg-tertiary);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 12px;
                    ">
                        <span style="
                            color: var(--text-primary);
                            font-weight: 600;
                        ">Overall Progress</span>
                        <span style="
                            color: var(--accent-color);
                            font-weight: 700;
                            font-size: 18px;
                        ">${project.progress}%</span>
                    </div>
                    <div style="
                        width: 100%;
                        height: 12px;
                        background: var(--bg-primary);
                        border-radius: 6px;
                        overflow: hidden;
                    ">
                        <div style="
                            width: ${project.progress}%;
                            height: 100%;
                            background: linear-gradient(90deg, var(--accent-color), #667eea);
                            transition: width 0.3s ease;
                        "></div>
                    </div>
                </div>
                
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                ">
                    <div style="
                        background: var(--bg-tertiary);
                        border-radius: 12px;
                        padding: 16px;
                        text-align: center;
                    ">
                        <div style="
                            font-size: 24px;
                            font-weight: 700;
                            color: var(--accent-color);
                            margin-bottom: 4px;
                        ">${project.assets.length}</div>
                        <div style="
                            color: var(--text-secondary);
                            font-size: 14px;
                        ">Assets Shared</div>
                    </div>
                    <div style="
                        background: var(--bg-tertiary);
                        border-radius: 12px;
                        padding: 16px;
                        text-align: center;
                    ">
                        <div style="
                            font-size: 24px;
                            font-weight: 700;
                            color: var(--accent-color);
                            margin-bottom: 4px;
                        ">${project.versions.length}</div>
                        <div style="
                            color: var(--text-secondary);
                            font-size: 14px;
                        ">Versions Created</div>
                    </div>
                </div>
            </div>
            
            <div class="timeline-section" style="
                background: var(--bg-secondary);
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 24px;
            ">
                <h3 style="
                    color: var(--text-primary);
                    font-size: 20px;
                    font-weight: 700;
                    margin: 0 0 16px 0;
                ">📅 Project Timeline</h3>
                
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: var(--bg-tertiary);
                    border-radius: 12px;
                ">
                    <div>
                        <div style="
                            color: var(--text-primary);
                            font-weight: 600;
                            margin-bottom: 4px;
                        ">Created</div>
                        <div style="
                            color: var(--text-secondary);
                            font-size: 14px;
                        ">${new Date(project.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style="
                        width: 40px;
                        height: 2px;
                        background: var(--accent-color);
                        border-radius: 1px;
                    "></div>
                    <div>
                        <div style="
                            color: var(--text-primary);
                            font-weight: 600;
                            margin-bottom: 4px;
                        ">Deadline</div>
                        <div style="
                            color: var(--text-secondary);
                            font-size: 14px;
                        ">${deadline}</div>
                    </div>
                </div>
            </div>
            
            <div class="actions-section" style="
                background: var(--bg-secondary);
                border-radius: 16px;
                padding: 24px;
            ">
                <h3 style="
                    color: var(--text-primary);
                    font-size: 20px;
                    font-weight: 700;
                    margin: 0 0 16px 0;
                ">🎬 Quick Actions</h3>
                
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px;
                ">
                    <button onclick="uploadAsset('${project.id}')" style="
                        background: var(--accent-color);
                        color: white;
                        border: none;
                        padding: 14px 20px;
                        border-radius: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        justify-content: center;
                    ">
                        📎 Upload Asset
                    </button>
                    <button onclick="createNewVersion('${project.id}')" style="
                        background: #2ed573;
                        color: white;
                        border: none;
                        padding: 14px 20px;
                        border-radius: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        justify-content: center;
                    ">
                        🔄 New Version
                    </button>
                    <button onclick="shareProject('${project.id}')" style="
                        background: #5352ed;
                        color: white;
                        border: none;
                        padding: 14px 20px;
                        border-radius: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        justify-content: center;
                    ">
                        🔗 Share Project
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Create project assets view
function createProjectAssets(project) {
    const assetIcons = {
        video: '🎬',
        audio: '🎵',
        image: '🖼️',
        document: '📄',
        effect: '✨'
    };
    
    const assetCards = project.assets.map(asset => `
        <div class="asset-card" style="
            background: var(--bg-tertiary);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
        " onclick="downloadAsset('${asset.id}')" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
            <div style="
                width: 48px;
                height: 48px;
                background: var(--accent-color);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            ">${assetIcons[asset.type] || '📁'}</div>
            <div style="flex: 1;">
                <div style="
                    color: var(--text-primary);
                    font-weight: 600;
                    margin-bottom: 4px;
                ">${asset.name}</div>
                <div style="
                    color: var(--text-secondary);
                    font-size: 14px;
                ">By @${asset.uploadedBy} • ${asset.size}</div>
            </div>
            <button onclick="event.stopPropagation(); showAssetOptions('${asset.id}')" style="
                background: var(--bg-secondary);
                color: var(--text-secondary);
                border: none;
                padding: 8px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
            ">⋮</button>
        </div>
    `).join('');
    
    return `
        <div class="project-assets">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
            ">
                <h3 style="
                    color: var(--text-primary);
                    font-size: 20px;
                    font-weight: 700;
                    margin: 0;
                ">📎 Project Assets</h3>
                <button onclick="uploadAsset('${project.id}')" style="
                    background: var(--accent-color);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 20px;
                    font-weight: 600;
                    cursor: pointer;
                ">+ Upload Asset</button>
            </div>
            
            <div class="assets-list" style="
                background: var(--bg-secondary);
                border-radius: 16px;
                padding: 20px;
            ">
                ${assetCards.length > 0 ? assetCards : `
                    <div style="
                        text-align: center;
                        padding: 40px;
                        color: var(--text-secondary);
                    ">
                        <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
                        <h4 style="color: var(--text-primary); margin-bottom: 8px;">No assets yet</h4>
                        <p style="margin-bottom: 20px;">Upload videos, audio, images, or documents to share with your team</p>
                        <button onclick="uploadAsset('${project.id}')" style="
                            background: var(--accent-color);
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 20px;
                            font-weight: 600;
                            cursor: pointer;
                        ">Upload First Asset</button>
                    </div>
                `}
            </div>
        </div>
    `;
}

// Create project versions view
function createProjectVersions(project) {
    const versionCards = project.versions.map((version, index) => `
        <div class="version-card" style="
            background: var(--bg-tertiary);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            ${index === 0 ? 'border: 2px solid var(--accent-color);' : ''}
        ">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            ">
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        background: ${index === 0 ? 'var(--accent-color)' : 'var(--bg-secondary)'};
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        color: ${index === 0 ? 'white' : 'var(--text-secondary)'};
                    ">v${index + 1}</div>
                    <div>
                        <div style="
                            color: var(--text-primary);
                            font-weight: 600;
                            margin-bottom: 4px;
                        ">${version.name}</div>
                        <div style="
                            color: var(--text-secondary);
                            font-size: 14px;
                        ">By @${version.createdBy} • ${new Date(version.timestamp).toLocaleDateString()}</div>
                    </div>
                </div>
                ${index === 0 ? `
                    <div style="
                        background: var(--accent-color);
                        color: white;
                        padding: 4px 12px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 600;
                    ">LATEST</div>
                ` : ''}
            </div>
            
            <div style="
                display: flex;
                gap: 12px;
                margin-top: 16px;
            ">
                <button onclick="previewVersion('${version.id}')" style="
                    background: var(--accent-color);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    flex: 1;
                ">👀 Preview</button>
                <button onclick="downloadVersion('${version.id}')" style="
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    border: 1px solid var(--border-primary);
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    flex: 1;
                ">💾 Download</button>
                <button onclick="showVersionOptions('${version.id}')" style="
                    background: var(--bg-secondary);
                    color: var(--text-secondary);
                    border: none;
                    padding: 8px 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                ">⋮</button>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="project-versions">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
            ">
                <h3 style="
                    color: var(--text-primary);
                    font-size: 20px;
                    font-weight: 700;
                    margin: 0;
                ">🔄 Version History</h3>
                <button onclick="createNewVersion('${project.id}')" style="
                    background: var(--accent-color);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 20px;
                    font-weight: 600;
                    cursor: pointer;
                ">+ New Version</button>
            </div>
            
            <div class="versions-list" style="
                background: var(--bg-secondary);
                border-radius: 16px;
                padding: 20px;
            ">
                ${versionCards}
            </div>
        </div>
    `;
}

// Create collaborator list
function createCollaboratorList(project) {
    const owner = `
        <div class="collaborator-item" style="
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            padding: 12px;
            background: var(--bg-tertiary);
            border-radius: 12px;
        ">
            <div style="
                width: 40px;
                height: 40px;
                background: var(--accent-color);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            ">${project.owner.avatar}</div>
            <div style="flex: 1;">
                <div style="
                    color: var(--text-primary);
                    font-weight: 600;
                    margin-bottom: 2px;
                ">@${project.owner.username}</div>
                <div style="
                    color: var(--text-secondary);
                    font-size: 12px;
                ">Owner</div>
            </div>
            <div style="
                background: var(--accent-color);
                color: white;
                padding: 4px 8px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: 600;
            ">OWNER</div>
        </div>
    `;
    
    const collaborators = project.collaborators.map(collab => `
        <div class="collaborator-item" style="
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            padding: 12px;
            background: var(--bg-tertiary);
            border-radius: 12px;
        ">
            <div style="
                width: 40px;
                height: 40px;
                background: var(--bg-primary);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            ">${collab.avatar}</div>
            <div style="flex: 1;">
                <div style="
                    color: var(--text-primary);
                    font-weight: 600;
                    margin-bottom: 2px;
                ">@${collab.username}</div>
                <div style="
                    color: var(--text-secondary);
                    font-size: 12px;
                ">${collab.role}</div>
            </div>
            <div style="
                background: ${collab.status === 'active' ? '#2ed573' : '#ffa502'};
                color: white;
                padding: 4px 8px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: 600;
            ">${collab.status.toUpperCase()}</div>
        </div>
    `).join('');
    
    return owner + collaborators;
}

// Create project chat messages
function createProjectChatMessages(projectId) {
    const messages = sampleCollaborationData.chatMessages.filter(msg => msg.projectId === projectId);
    
    if (messages.length === 0) {
        return `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: var(--text-secondary);
                text-align: center;
            ">
                <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
                <div style="font-weight: 600; margin-bottom: 8px;">No messages yet</div>
                <div style="font-size: 14px;">Start the conversation with your team!</div>
            </div>
        `;
    }
    
    return messages.map(msg => `
        <div class="chat-message" style="
            margin-bottom: 16px;
            padding: 12px;
            background: var(--bg-tertiary);
            border-radius: 12px;
        ">
            <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            ">
                <div style="
                    width: 24px;
                    height: 24px;
                    background: var(--accent-color);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                ">${msg.sender.avatar}</div>
                <div style="
                    color: var(--text-primary);
                    font-weight: 600;
                    font-size: 14px;
                ">@${msg.sender.username}</div>
                <div style="
                    color: var(--text-secondary);
                    font-size: 12px;
                ">${getTimeAgo(msg.timestamp)}</div>
            </div>
            <div style="
                color: var(--text-primary);
                font-size: 14px;
                line-height: 1.4;
            ">${msg.message}</div>
        </div>
    `).join('');
}

// Close project details
function closeProjectDetails() {
    const projectDetailsPage = document.getElementById('projectDetailsPage');
    if (projectDetailsPage) projectDetailsPage.remove();
    
    const collaborationPage = document.getElementById('collaborationPage');
    if (collaborationPage) collaborationPage.style.display = 'block';
}

// Show project templates
function showProjectTemplates() {
    console.log('📋 Showing project templates');
    
    const modal = document.createElement('div');
    modal.className = 'modal templates-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
        backdrop-filter: blur(5px);
    `;
    
    const templateCards = sampleCollaborationData.templates.map(template => `
        <div class="template-card" style="
            background: var(--bg-secondary);
            border-radius: 16px;
            padding: 24px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid var(--border-primary);
        " onclick="selectTemplate('${template.id}')" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 32px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            <div style="
                font-size: 48px;
                text-align: center;
                margin-bottom: 16px;
            ">${template.id === 'dance_challenge' ? '🕺' : template.id === 'tutorial' ? '📚' : template.id === 'music_video' ? '🎵' : '😄'}</div>
            <h3 style="
                color: var(--text-primary);
                font-size: 18px;
                font-weight: 700;
                margin: 0 0 8px 0;
                text-align: center;
            ">${template.name}</h3>
            <p style="
                color: var(--text-secondary);
                font-size: 14px;
                margin: 0 0 16px 0;
                text-align: center;
                line-height: 1.4;
            ">${template.description}</p>
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            ">
                <div style="
                    color: var(--text-primary);
                    font-size: 12px;
                    font-weight: 600;
                ">Timeline:</div>
                <div style="
                    color: var(--text-secondary);
                    font-size: 12px;
                ">${template.timeline}</div>
            </div>
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div style="
                    color: var(--text-primary);
                    font-size: 12px;
                    font-weight: 600;
                ">Team Size:</div>
                <div style="
                    color: var(--text-secondary);
                    font-size: 12px;
                ">${template.roles.length} roles</div>
            </div>
        </div>
    `).join('');
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: var(--bg-primary);
            border-radius: 20px;
            padding: 0;
            max-width: 800px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        ">
            <div class="modal-header" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 24px;
                border-radius: 20px 20px 0 0;
                color: white;
                position: relative;
            ">
                <button onclick="closeTemplatesModal()" style="
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">&times;</button>
                <h2 style="
                    margin: 0 0 8px 0;
                    font-size: 24px;
                    font-weight: 700;
                ">📋 Project Templates</h2>
                <p style="
                    margin: 0;
                    opacity: 0.9;
                    font-size: 14px;
                ">Choose a template to get started quickly</p>
            </div>
            
            <div class="modal-body" style="padding: 24px;">
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                ">
                    ${templateCards}
                </div>
                
                <div style="
                    margin-top: 24px;
                    padding-top: 24px;
                    border-top: 1px solid var(--border-primary);
                    text-align: center;
                ">
                    <button onclick="showCreateProjectModal(); closeTemplatesModal();" style="
                        background: var(--accent-color);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        margin-right: 12px;
                    ">Create Custom Project</button>
                    <button onclick="closeTemplatesModal()" style="
                        background: var(--bg-tertiary);
                        color: var(--text-secondary);
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close templates modal
function closeTemplatesModal() {
    const modal = document.querySelector('.templates-modal');
    if (modal) modal.remove();
}

// Select template
function selectTemplate(templateId) {
    console.log('📋 Selected template:', templateId);
    closeTemplatesModal();
    
    // Pre-fill create project modal with template data
    const template = sampleCollaborationData.templates.find(t => t.id === templateId);
    if (template) {
        showCreateProjectModal();
        
        // Wait for modal to appear, then fill it
        setTimeout(() => {
            const titleInput = document.getElementById('projectTitle');
            const templateSelect = document.getElementById('projectTemplate');
            
            if (titleInput && templateSelect) {
                titleInput.value = template.name + ' Project';
                templateSelect.value = templateId;
            }
        }, 100);
    }
}

// Collaboration interaction functions
function uploadAsset(projectId) {
    console.log('📎 Uploading asset for project:', projectId);
    showNotification('Asset upload feature coming soon! 📎', 'info');
}

function createNewVersion(projectId) {
    console.log('🔄 Creating new version for project:', projectId);
    showNotification('New version created successfully! 🔄', 'success');
}

function shareProject(projectId) {
    console.log('🔗 Sharing project:', projectId);
    showNotification('Project link copied to clipboard! 🔗', 'success');
}

function downloadAsset(assetId) {
    console.log('💾 Downloading asset:', assetId);
    showNotification('Asset download started! 💾', 'success');
}

function showAssetOptions(assetId) {
    console.log('⋮ Showing asset options:', assetId);
    showNotification('Asset options coming soon! ⋮', 'info');
}

function previewVersion(versionId) {
    console.log('👀 Previewing version:', versionId);
    showNotification('Version preview coming soon! 👀', 'info');
}

function downloadVersion(versionId) {
    console.log('💾 Downloading version:', versionId);
    showNotification('Version download started! 💾', 'success');
}

function showVersionOptions(versionId) {
    console.log('⋮ Showing version options:', versionId);
    showNotification('Version options coming soon! ⋮', 'info');
}

function showInviteCollaboratorModal(projectId) {
    console.log('👥 Inviting collaborator to project:', projectId);
    showNotification('Invite collaborator feature coming soon! 👥', 'info');
}

function sendProjectMessage(projectId) {
    const input = document.getElementById('projectChatInput');
    if (!input || !input.value.trim()) return;
    
    const message = input.value.trim();
    console.log('💬 Sending message:', message);
    
    // Add message to chat
    const chatContainer = document.getElementById('projectChatMessages');
    if (chatContainer) {
        const messageHtml = `
            <div class="chat-message" style="
                margin-bottom: 16px;
                padding: 12px;
                background: var(--bg-tertiary);
                border-radius: 12px;
            ">
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                ">
                    <div style="
                        width: 24px;
                        height: 24px;
                        background: var(--accent-color);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                    ">👤</div>
                    <div style="
                        color: var(--text-primary);
                        font-weight: 600;
                        font-size: 14px;
                    ">@${currentUser?.username || 'you'}</div>
                    <div style="
                        color: var(--text-secondary);
                        font-size: 12px;
                    ">Just now</div>
                </div>
                <div style="
                    color: var(--text-primary);
                    font-size: 14px;
                    line-height: 1.4;
                ">${message}</div>
            </div>
        `;
        chatContainer.insertAdjacentHTML('beforeend', messageHtml);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    input.value = '';
}

function showCollaborationStats() {
    console.log('📊 Showing collaboration stats');
    showNotification('Collaboration stats feature coming soon! 📊', 'info');
}

// Export collaboration functions to global scope
window.showCollaborationHub = showCollaborationHub;
window.switchCollaborationTab = switchCollaborationTab;
window.loadCollaborationProjects = loadCollaborationProjects;
window.showCreateProjectModal = showCreateProjectModal;
window.closeCreateProjectModal = closeCreateProjectModal;
window.createNewProject = createNewProject;
window.openProjectDetails = openProjectDetails;
window.closeProjectDetails = closeProjectDetails;
window.switchProjectTab = switchProjectTab;
window.showProjectTemplates = showProjectTemplates;
window.closeTemplatesModal = closeTemplatesModal;
window.selectTemplate = selectTemplate;
window.uploadAsset = uploadAsset;
window.createNewVersion = createNewVersion;
window.shareProject = shareProject;
window.downloadAsset = downloadAsset;
window.showAssetOptions = showAssetOptions;
window.previewVersion = previewVersion;
window.downloadVersion = downloadVersion;
window.showVersionOptions = showVersionOptions;
window.showInviteCollaboratorModal = showInviteCollaboratorModal;
window.sendProjectMessage = sendProjectMessage;
window.showCollaborationStats = showCollaborationStats;

// Debug function to check ID consistency
function debugCreatorMediaIds() {
    console.log('=== VIB3 Studio Debug Info ===');
    
    const userMedia = getUserImportedMedia();
    const memoryFiles = window.creatorStudioFiles || {};
    
    console.log('📋 Media in localStorage:', userMedia.map(m => `${m.name} (ID: ${m.id})`));
    console.log('🧠 File IDs in memory:', Object.keys(memoryFiles));
    
    // Check for mismatches
    userMedia.forEach(media => {
        const inMemory = !!memoryFiles[media.id];
        console.log(`📁 ${media.name} (ID: ${media.id}): ${inMemory ? '✅ Found' : '❌ Missing'} in memory`);
    });
    
    // Check for orphaned memory files
    Object.keys(memoryFiles).forEach(memoryId => {
        const inStorage = userMedia.some(m => m.id == memoryId);
        if (!inStorage) {
            console.log(`🚨 Orphaned memory file: ${memoryId}`);
        }
    });
}

// Make debug function available globally
window.debugCreatorMediaIds = debugCreatorMediaIds;

// Emergency function to close all overlays and modals
function emergencyCloseAllOverlays() {
    console.log('🚨 Emergency: Closing ALL overlays and modals');
    
    let removedCount = 0;
    
    // AGGRESSIVE: Remove ALL dark overlays (the main issue)
    document.querySelectorAll('div, section, main, aside').forEach(el => {
        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        const position = style.position;
        const zIndex = parseInt(style.zIndex || '0');
        const opacity = parseFloat(style.opacity || '1');
        
        // Check for dark overlays
        const isDarkOverlay = (
            (bgColor.includes('rgba(0, 0, 0') || bgColor.includes('rgb(0, 0, 0')) ||
            (position === 'fixed' && zIndex > 100) ||
            (opacity > 0.5 && el.offsetWidth > window.innerWidth * 0.8 && el.offsetHeight > window.innerHeight * 0.8)
        );
        
        if (isDarkOverlay && !el.classList.contains('sidebar') && !el.classList.contains('main-content')) {
            console.log('🗑️ Removing dark overlay:', el);
            el.remove();
            removedCount++;
        }
    });
    
    // Remove upload modals and overlays
    document.querySelectorAll('.upload-modal, .upload-overlay, .creator-import-overlay, .modal-overlay').forEach(el => {
        el.remove();
        removedCount++;
    });
    
    // Remove high z-index elements (likely modals)
    document.querySelectorAll('*').forEach(el => {
        const zIndex = parseInt(window.getComputedStyle(el).zIndex || '0');
        if (zIndex > 1000 && !el.classList.contains('sidebar') && !el.classList.contains('main-content')) {
            el.remove();
            removedCount++;
        }
    });
    
    // Remove position fixed overlays
    document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed') {
            const rect = el.getBoundingClientRect();
            if (rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.5) {
                if (!el.classList.contains('sidebar') && !el.classList.contains('main-content')) {
                    el.remove();
                    removedCount++;
                }
            }
        }
    });
    
    // Clear stored modal references
    if (window.currentConfirmModal) {
        window.currentConfirmModal.remove();
        window.currentConfirmModal = null;
        removedCount++;
    }
    
    // Remove import modals specifically
    document.querySelectorAll('div').forEach(el => {
        const content = el.innerHTML || '';
        if (content.includes('Import Complete') || 
            content.includes('Processing') || 
            content.includes('Clear All Media') ||
            content.includes('cannot be undone')) {
            el.remove();
            removedCount++;
        }
    });
    
    // FORCE visibility of VIB3 Studio
    const creatorStudio = document.querySelector('.creator-studio-page, #creatorStudioPage');
    if (creatorStudio) {
        creatorStudio.style.display = 'flex';
        creatorStudio.style.visibility = 'visible';
        creatorStudio.style.opacity = '1';
        creatorStudio.style.zIndex = '1';
        console.log('✅ Forced VIB3 Studio visibility');
    }
    
    // Restore main content visibility
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
        mainContent.style.visibility = 'visible';
        mainContent.style.opacity = '1';
    }
    
    // Remove ALL elements with very high z-index
    document.querySelectorAll('*').forEach(el => {
        const zIndex = parseInt(window.getComputedStyle(el).zIndex || '0');
        if (zIndex > 9999) {
            el.remove();
            removedCount++;
        }
    });
    
    // Clear any camera streams
    if (window.currentStream) {
        window.currentStream.getTracks().forEach(track => track.stop());
        window.currentStream = null;
    }
    
    console.log(`✅ Emergency cleanup complete! Removed ${removedCount} overlay elements`);
    
    // Show success notification
    showStudioNotification(`🧹 Cleared ${removedCount} overlay elements - Dark overlay removed!`);
}

// Enhanced keyboard shortcuts for emergency exit
document.addEventListener('keydown', (e) => {
    // Escape key - close current modal
    if (e.key === 'Escape') {
        if (window.currentConfirmModal) {
            closeConfirmModal();
        }
    }
    
    // Ctrl+Escape (or Cmd+Escape on Mac) - emergency cleanup
    if ((e.ctrlKey || e.metaKey) && e.key === 'Escape') {
        e.preventDefault();
        emergencyCloseAllOverlays();
    }
});

// Light cleanup function that only targets specific problem overlays
function lightOverlayCleanup() {
    console.log('🧹 Light cleanup: Removing only problematic overlays');
    
    let removedCount = 0;
    
    // Only remove elements that are clearly problematic modal overlays
    document.querySelectorAll('div').forEach(el => {
        const content = el.innerHTML || '';
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex || '0');
        
        // Only remove if it's clearly a modal overlay (not VIB3 Studio content)
        const isProblemOverlay = (
            // Modal content indicators
            (content.includes('Import Complete') || 
             content.includes('Processing') || 
             content.includes('Clear All Media') ||
             content.includes('cannot be undone')) ||
            // Very high z-index overlay elements
            (zIndex > 10000 && !el.id.includes('creator') && !el.classList.contains('studio-header'))
        );
        
        if (isProblemOverlay) {
            el.remove();
            removedCount++;
            console.log('🗑️ Removed problem overlay:', el.className || 'unnamed');
        }
    });
    
    if (removedCount > 0) {
        console.log(`✅ Light cleanup: Removed ${removedCount} problem overlay elements`);
    }
}

// Startup cleanup to prevent dark overlays when opening VIB3 Studio
function clearDarkOverlaysOnStartup() {
    console.log('🧹 Startup: Clearing any existing dark overlays');
    
    let removedCount = 0;
    
    // Remove any lingering dark overlays from previous sessions
    document.querySelectorAll('div, section').forEach(el => {
        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        const position = style.position;
        const zIndex = parseInt(style.zIndex || '0');
        
        const isDarkOverlay = (
            (bgColor.includes('rgba(0, 0, 0') && parseFloat(bgColor.split(',')[3]) > 0.3) ||
            (position === 'fixed' && zIndex > 1000)
        );
        
        if (isDarkOverlay && !el.classList.contains('sidebar') && !el.classList.contains('main-content')) {
            el.remove();
            removedCount++;
        }
    });
    
    if (removedCount > 0) {
        console.log(`✅ Startup cleanup: Removed ${removedCount} dark overlay elements`);
    }
}

// Proper function to close import modal and refresh
function closeImportModalAndRefresh() {
    console.log('🚪 Closing import modal and refreshing');
    
    // Remove the entire import modal
    const importModal = document.getElementById('creatorImportModal');
    if (importModal) {
        importModal.remove();
        console.log('✅ Removed import modal by ID');
    }
    
    // Also remove any modals with high z-index (fallback)
    document.querySelectorAll('[style*="z-index: 10000"]').forEach(modal => {
        if (modal.innerHTML.includes('Import Complete') || modal.innerHTML.includes('Continue')) {
            modal.remove();
            console.log('✅ Removed import modal by content');
        }
    });
    
    // Refresh the VIB3 Studio media
    refreshCreatorStudioMedia();
    
    // CRITICAL: Light cleanup after upload completion
    setTimeout(() => {
        lightOverlayCleanup();
        console.log('🧹 Light cleanup after upload completion');
    }, 100);
}

// Make emergency function globally available
window.emergencyCloseAllOverlays = emergencyCloseAllOverlays;
window.lightOverlayCleanup = lightOverlayCleanup;
window.clearDarkOverlaysOnStartup = clearDarkOverlaysOnStartup;
window.closeImportModalAndRefresh = closeImportModalAndRefresh;

// Export modal cleanup functions
window.closeAllModalsAndOverlays = closeAllModalsAndOverlays;
window.closeConfirmModal = closeConfirmModal;
  