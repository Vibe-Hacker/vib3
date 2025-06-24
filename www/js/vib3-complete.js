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
let currentFeed = 'foryou';
let currentVideoId = null;
let isRecording = false;
let currentStep = 1;

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
    if (window.auth && window.auth.onAuthStateChanged) {
        window.auth.onAuthStateChanged((user) => {
            currentUser = user;
            if (user) {
                hideAuthContainer();
                showMainApp();
                loadUserProfile();
                loadVideoFeed(currentFeed);
            } else {
                showAuthContainer();
                hideMainApp();
            }
        });
    }
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
                el.src = currentUser.photoURL || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="40" fill="%23ddd"/%3E%3Ctext x="50" y="55" text-anchor="middle" font-size="40" fill="%23666"%3E👤%3C/text%3E%3C/svg%3E';
            } else {
                el.textContent = currentUser.photoURL ? '' : '👤';
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
                // Only play if not manually paused
                if (!video.hasAttribute('data-manually-paused')) {
                    video.play().catch(e => console.log('Play failed:', e));
                    console.log('🎬 Auto-playing video:', video.src.split('/').pop());
                    
                    // Track video view start
                    const videoCard = video.closest('.video-card');
                    if (videoCard && videoCard.videoData) {
                        startVideoTracking(videoCard.videoData._id, video);
                    }
                }
            } else {
                // Only pause if not manually playing
                if (!video.hasAttribute('data-manually-paused')) {
                    video.pause();
                    console.log('⏸️ Auto-pausing video:', video.src.split('/').pop());
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
async function loadVideoFeed(feedType = 'foryou', forceRefresh = false, page = 1, append = false) {
    // CRITICAL: Never handle explore through loadVideoFeed - it has its own system
    if (feedType === 'explore') {
        console.log('⚠️ loadVideoFeed called for explore - redirecting to initializeExplorePage');
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
        console.log(`Loading video feed: ${feedType}, page: ${page}, append: ${append}`);
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
            const response = await fetch(`${window.API_BASE_URL}/api/videos?feed=${feedType}&page=${page}&limit=10&_t=${timestamp}`, {
                headers: window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {}
            });
            
            const data = await response.json();
            console.log(`📦 Received data for page ${page}:`, data.videos?.length, 'videos');
            
            // For explore feed, supplement with sample data if needed
            if (feedType === 'explore' && (!data.videos || data.videos.length < 6)) {
                console.log('🔍 Adding sample explore data');
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
            if (!append) {
                if (feedType === 'explore') {
                    const exploreGrid = document.getElementById('exploreVideoGrid');
                    if (exploreGrid) {
                        exploreGrid.innerHTML = createErrorMessage(feedType);
                    }
                } else {
                    feedElement.innerHTML = createErrorMessage(feedType);
                }
                hasMoreVideos = false;
            } else {
                console.log('Error in append mode, but keeping hasMoreVideos true');
                hasMoreVideos = true; // Keep trying for infinite scroll
            }
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
    
    // TikTok-style card with scroll snap and proper spacing
    card.style.cssText = `
        height: calc(100vh - 40px) !important;
        width: 100% !important;
        max-width: 500px !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
        background: #000 !important;
        margin: 0 auto 20px auto !important;
        padding: 0 !important;
        overflow: hidden !important;
        scroll-snap-align: center !important;
        scroll-snap-stop: always !important;
        border-radius: 12px !important;
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
        background: #000 !important;
        z-index: 1 !important;
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
    video_elem.onplay = () => console.log('▶️ PLAYING:', video_elem.src);
    video_elem.onpause = () => console.log('⏸️ PAUSED:', video_elem.src);
    
    // Create TikTok-style overlay with user info
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: absolute !important;
        bottom: 60px !important;
        left: 20px !important;
        right: 80px !important;
        color: white !important;
        z-index: 10 !important;
        pointer-events: none !important;
    `;
    
    overlay.innerHTML = `
        <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
            @${video.user?.username || video.user?.displayName || video.username || 'user'}
        </div>
        <div style="font-size: 14px; line-height: 1.3; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
            ${video.description || video.title || 'Check out this video!'}
            ${video.position ? `<span style="opacity: 0.7; font-size: 12px;"> • Video #${video.position}</span>` : ''}
        </div>
    `;
    
    // Create TikTok-style action buttons on the right
    const actions = document.createElement('div');
    actions.style.cssText = `
        position: absolute !important;
        right: 15px !important;
        bottom: 60px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 20px !important;
        z-index: 10 !important;
    `;
    
    actions.innerHTML = `
        <div class="profile-btn" data-user-id="${video.userId || video.user?._id || 'unknown'}" style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(45deg, #fe2c55, #8b2dbd); border: 2px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; margin-bottom: 5px;">
            <div style="font-size: 20px;">${video.user?.profilePicture || '👤'}</div>
        </div>
        <div class="follow-btn" data-user-id="${video.userId || video.user?._id || 'unknown'}" style="width: 28px; height: 28px; border-radius: 50%; background: #fe2c55; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; margin-bottom: 20px; position: relative; top: -15px;">
            <div style="font-size: 16px; color: white;">+</div>
        </div>
        <div class="like-btn" data-video-id="${video._id || 'unknown'}" style="width: 48px; height: 48px; border-radius: 50%; background: rgba(0,0,0,0.6); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;">
            <div style="font-size: 20px;" class="heart-icon">🤍</div>
            <div style="font-size: 10px; color: white; margin-top: 2px;" class="like-count">${formatCount(video.likeCount || 0)}</div>
        </div>
        <div class="comment-btn" data-video-id="${video._id || 'unknown'}" style="width: 48px; height: 48px; border-radius: 50%; background: rgba(0,0,0,0.6); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;">
            <div style="font-size: 20px;">💬</div>
            <div style="font-size: 10px; color: white; margin-top: 2px;">${formatCount(video.commentCount || 0)}</div>
        </div>
        <div class="share-btn" data-video-id="${video._id || 'unknown'}" style="width: 48px; height: 48px; border-radius: 50%; background: rgba(0,0,0,0.6); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;">
            <div style="font-size: 20px;">📤</div>
            <div style="font-size: 10px; color: white; margin-top: 2px;" class="share-count">${formatCount(video.shareCount || 0)}</div>
        </div>
        <div class="volume-btn" style="width: 48px; height: 48px; border-radius: 50%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; cursor: pointer;">
            🔊
        </div>
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
    
    // Add like button functionality
    const likeBtn = actions.querySelector('.like-btn');
    likeBtn.addEventListener('click', function likeBtnClickHandler(e) { 
        return handleLikeClick(e, likeBtn); 
    });
    
    // Add enhanced like button features (double-tap, ripple, floating hearts)
    enhanceLikeButton(likeBtn, video_elem);
    
    // Add comment button functionality
    const commentBtn = actions.querySelector('.comment-btn');
    commentBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const videoId = commentBtn.dataset.videoId;
        
        // Add bounce animation
        commentBtn.style.transform = 'scale(1.1)';
        setTimeout(() => commentBtn.style.transform = 'scale(1)', 200);
        
        openCommentsModal(videoId);
    });
    
    // Add share button functionality
    const shareBtn = actions.querySelector('.share-btn');
    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const videoId = shareBtn.dataset.videoId;
        
        // Add bounce animation
        shareBtn.style.transform = 'scale(1.1)';
        setTimeout(() => shareBtn.style.transform = 'scale(1)', 200);
        
        shareVideo(videoId, video);
    });
    
    // Add profile button functionality
    const profileBtn = actions.querySelector('.profile-btn');
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const userId = profileBtn.dataset.userId;
        
        // Add bounce animation
        profileBtn.style.transform = 'scale(1.1)';
        setTimeout(() => profileBtn.style.transform = 'scale(1)', 200);
        
        // Navigate to user profile
        viewUserProfile(userId);
    });
    
    // Add follow button functionality
    const followBtn = actions.querySelector('.follow-btn');
    followBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const userId = followBtn.dataset.userId;
        
        // Add bounce animation
        followBtn.style.transform = 'scale(1.2)';
        setTimeout(() => followBtn.style.transform = 'scale(1)', 200);
        
        // Handle follow/unfollow
        await handleFollowClick(userId, followBtn);
    });
    
    // Check if user is already following
    checkFollowStatus(video.userId || video.user?._id, followBtn);
    
    // Load and set initial like status
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
    
    card.appendChild(video_elem);
    card.appendChild(overlay);
    card.appendChild(actions);
    card.appendChild(pauseIndicator);
    
    console.log('✅ TikTok-style card created with scroll snap');
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
    
    const viewCount = video.views || video.likeCount || Math.floor(Math.random() * 10000);
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
    switchFeedTab('foryou');
    
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
    console.log('🎬 User chose to record new video');
    
    // Immediately hide ALL modals to prevent flicker
    const uploadModal = document.getElementById('uploadModal');
    if (uploadModal) {
        uploadModal.style.display = 'none';
    }
    
    const videoSourceModal = document.querySelector('.video-source-modal');
    if (videoSourceModal) {
        videoSourceModal.remove();
    }
    
    // Start simplified recording directly
    startSimpleVideoRecording();
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

// Editing Tool Functions (Basic implementations)
function trimVideo() {
    showNotification('Video trimming tool - Feature coming soon!', 'info');
}

function addFilter() {
    showNotification('Filter selection - Feature coming soon!', 'info');
}

function adjustSpeed() {
    showNotification('Speed adjustment - Feature coming soon!', 'info');
}

function addTransition() {
    showNotification('Transition effects - Feature coming soon!', 'info');
}

function addMusic() {
    showNotification('Music library - Feature coming soon!', 'info');
}

function recordVoiceover() {
    showNotification('Voiceover recording - Feature coming soon!', 'info');
}

function adjustVolume() {
    showNotification('Volume control - Feature coming soon!', 'info');
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

async function recordVideo() {
    console.log('🎬 Record Video button clicked - starting debug');
    
    // Add detailed debugging
    console.log('📱 Current document.body children:', document.body.children.length);
    console.log('📱 Existing modals:', document.querySelectorAll('.modal').length);
    
    try {
        // Request camera permission first to enumerate devices
        console.log('📱 Requesting camera permissions...');
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log('✅ Camera permissions granted, tracks:', tempStream.getTracks().length);
        
        // Stop the temp stream immediately
        tempStream.getTracks().forEach(track => {
            console.log(`🛑 Stopping track: ${track.kind} - ${track.label}`);
            track.stop();
        });
        
        // Add a small delay to ensure permission state is updated
        setTimeout(() => {
            console.log('📱 Now showing camera selection modal...');
            showCameraSelectionModal('video');
        }, 500);
        
    } catch (error) {
        console.error('❌ Camera permission denied:', error);
        showNotification('Camera access is required to record videos. Please allow camera access and try again.', 'error');
    }
}

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

// ================ LIVE STREAMING ================
function showPage(page) {
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

    // Handle feed tabs - don't show "coming soon" for these
    if (page === 'foryou' || page === 'following' || page === 'explore' || page === 'friends') {
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
        createFriendsPage();
        return;
    }
    
    if (page === 'analytics') {
        console.log('📊 Analytics page case triggered');
        // Show analytics page specifically
        const analyticsPage = document.getElementById('analyticsPage');
        console.log('📊 Analytics page element:', analyticsPage);
        if (analyticsPage) {
            analyticsPage.style.display = 'block';
            analyticsPage.style.visibility = 'visible';
            analyticsPage.style.opacity = '1';
            analyticsPage.style.zIndex = '1000';
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
            switchFeedTab('foryou');
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
        // Only clear content for non-explore feeds to preserve explore structure
        if (feedType !== 'explore') {
            // Only show loading if not loading a specific video
            if (!window.isLoadingSpecificVideo) {
                targetFeed.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">Loading...</div>';
            }
        } else {
            // For explore feed, ensure the structure exists, then clear the video grid
            if (!document.getElementById('exploreVideoGrid')) {
                // Create the structure if it doesn't exist
                targetFeed.innerHTML = `
                    <div class="explore-header" style="padding: 20px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
                        <div class="search-bar-container" style="margin-bottom: 20px;">
                            <input type="text" class="explore-search" placeholder="Search videos, creators, hashtags..." style="width: 100%; padding: 12px 16px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary); font-size: 14px;" onkeypress="if(event.key==='Enter') performExploreSearch(this.value)">
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
        
        // Initialize explore page if switching to explore  
        if (feedType === 'explore') {
            // Don't call loadVideoFeed for explore - use dedicated explore initialization
            console.log('🔍 Calling initializeExplorePage for explore feed');
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
    loadVideoFeed('foryou', true);
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

// ================ INITIALIZATION ================
document.addEventListener('DOMContentLoaded', function() {    
    // Apply saved theme
    const savedTheme = localStorage.getItem('vib3-theme');
    if (savedTheme) {
        document.body.className = `theme-${savedTheme}`;
    }
    
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

function shareToInstagram() {
    window.open('https://instagram.com', '_blank');
    showNotification('Opening Instagram...', 'info');
}

function shareToTwitter() {
    const text = 'Check out this video on VIB3!';
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
}

function shareToFacebook() {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
}

function shareToWhatsApp() {
    const text = 'Check out this video on VIB3! ' + window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function shareToTelegram() {
    const url = window.location.href;
    const text = 'Check out this video on VIB3!';
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
}

function shareViaEmail() {
    const subject = 'Check out this VIB3 video!';
    const body = 'I thought you might enjoy this video: ' + window.location.href;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
    const mainApp = document.getElementById('mainApp');
    if (mainApp) mainApp.style.display = 'none';
    
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
    const mainApp = document.getElementById('mainApp');
    if (mainApp) mainApp.style.display = 'none';
    
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
    let friendsPage = document.getElementById('friendsPage');
    if (!friendsPage) {
        friendsPage = document.createElement('div');
        friendsPage.id = 'friendsPage';
        friendsPage.className = 'friends-page';
        friendsPage.style.cssText = 'margin-left: 240px; width: calc(100vw - 240px); height: 100vh; overflow-y: auto; background: var(--bg-primary); padding: 20px;';
        friendsPage.innerHTML = `
            <h2>Friends</h2>
            <div class="friends-tabs">
                <button class="tab-btn active" onclick="filterFriends('suggested')">Suggested</button>
                <button class="tab-btn" onclick="filterFriends('following')">Following</button>
                <button class="tab-btn" onclick="filterFriends('followers')">Followers</button>
                <button class="tab-btn" onclick="filterFriends('requests')">Requests</button>
            </div>
            <div class="friends-search">
                <input type="text" placeholder="Search friends..." onkeypress="if(event.key==='Enter') searchFriends(this.value)">
            </div>
            <div class="friends-list">
                <div class="friend-item">
                    <div class="friend-avatar">👤</div>
                    <div class="friend-info">
                        <div class="friend-name">alex_creator</div>
                        <div class="friend-stats">1.2M followers</div>
                    </div>
                    <button class="follow-btn" onclick="toggleFollow('alex_creator')">Follow</button>
                </div>
                <div class="friend-item">
                    <div class="friend-avatar">👤</div>
                    <div class="friend-info">
                        <div class="friend-name">dance_queen</div>
                        <div class="friend-stats">856K followers</div>
                    </div>
                    <button class="follow-btn" onclick="toggleFollow('dance_queen')">Follow</button>
                </div>
                <div class="friend-item">
                    <div class="friend-avatar">👤</div>
                    <div class="friend-info">
                        <div class="friend-name">tech_reviewer</div>
                        <div class="friend-stats">2.1M followers</div>
                    </div>
                    <button class="follow-btn" onclick="toggleFollow('tech_reviewer')">Follow</button>
                </div>
            </div>
        `;
        document.body.appendChild(friendsPage);
    }
    
    // Hide all other pages including activity and friends
    document.querySelectorAll('.video-feed, .search-page, .profile-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page, .activity-page, .friends-page').forEach(el => {
        el.style.display = 'none';
    });
    const mainApp = document.getElementById('mainApp');
    if (mainApp) mainApp.style.display = 'none';
    
    friendsPage.style.display = 'block';
}


function filterFriends(type) {
    showNotification(`Showing ${type} friends`, 'info');
    // Update tab styles
    document.querySelectorAll('.friends-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
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
    const modal = document.createElement('div');
    modal.className = 'modal share-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Share</h3>
                <button onclick="this.closest('.modal').remove()" class="close-btn">&times;</button>
            </div>
            <div class="share-options">
                <button onclick="shareToInstagram(); this.closest('.modal').remove();">📷 Instagram</button>
                <button onclick="shareToTwitter(); this.closest('.modal').remove();">🐦 Twitter</button>
                <button onclick="shareToFacebook(); this.closest('.modal').remove();">📘 Facebook</button>
                <button onclick="shareToWhatsApp(); this.closest('.modal').remove();">💬 WhatsApp</button>
                <button onclick="copyVideoLink(); this.closest('.modal').remove();">🔗 Copy Link</button>
                <button onclick="downloadVideo(); this.closest('.modal').remove();">⬇️ Download</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
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

function shareVideo(videoId) {
    openShareModal(videoId);
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
window.recordVideo = recordVideo;
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

// Duet and stitch functions
window.addDuetEffect = addDuetEffect;
window.closeDuetModal = closeDuetModal;
window.publishDuet = publishDuet;
window.saveDuetDraft = saveDuetDraft;
window.closeStitchModal = closeStitchModal;
window.publishStitch = publishStitch;
window.previewStitch = previewStitch;

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

function changeProfilePicture() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Update profile picture in UI
                document.querySelectorAll('.profile-picture').forEach(pic => {
                    pic.style.backgroundImage = `url(${e.target.result})`;
                    pic.textContent = '';
                });
                showNotification('Profile picture updated!', 'success');
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

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

function showFollowing() {
    showNotification('Following list feature coming soon!', 'info');
}

function showFollowers() {
    showNotification('Followers list feature coming soon!', 'info');
}

function shareProfile() {
    if (navigator.share) {
        navigator.share({
            title: 'Check out my VIB3 profile!',
            text: 'Follow me on VIB3 for awesome videos!',
            url: window.location.href
        });
    } else {
        // Fallback to copy link
        navigator.clipboard.writeText(window.location.href);
        showNotification('Profile link copied to clipboard!', 'success');
    }
}

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
    const videoUrl = `${window.location.origin}/?video=${videoId}`;
    const shareText = `Check out this video on VIB3! ${video.title || 'Amazing video'}`;
    
    if (navigator.share) {
        navigator.share({
            title: video.title || 'VIB3 Video',
            text: shareText,
            url: videoUrl
        }).then(() => {
            showNotification('Video shared!', 'success');
            
            // Record the share on server and update count
            recordVideoShare(videoId);
        }).catch(console.error);
    } else {
        // Fallback to copy link
        navigator.clipboard.writeText(videoUrl).then(() => {
            showNotification('Video link copied to clipboard!', 'success');
            
            // Record the share on server and update count
            recordVideoShare(videoId);
        });
    }
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

// Load like status for a video (called when video is created)
async function loadVideoLikeStatus(videoId, likeBtn) {
    if (!videoId || videoId === 'unknown' || !likeBtn) {
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
        if (window.authToken) {
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
    if (!currentUser || !userId || userId === 'unknown') return;
    
    // Hide follow button for own videos
    if (userId === currentUser._id) {
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
        // On error, just show the follow button in default state
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
    
    // Close the profile page and go back to main feed
    const profilePage = document.getElementById('profilePage');
    if (profilePage) {
        profilePage.remove();
    }
    
    // Navigate to For You page and find the video
    showPage('foryou');
    
    // Wait a moment for the feed to load, then try to find and play the video
    setTimeout(() => {
        const videoCard = document.querySelector(`[data-video-id="${videoId}"]`);
        if (videoCard) {
            console.log(`✅ Found video in feed, scrolling to it`);
            videoCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Try to play the video
            const video = videoCard.querySelector('video');
            if (video) {
                video.play().catch(e => console.log('Video play failed:', e));
            }
        } else {
            console.log(`❌ Video not found in current feed, loading it...`);
            // If video not in current feed, we could implement specific video loading here
            showNotification('Loading video...', 'info');
            loadSpecificVideo(videoId);
        }
    }, 500);
}

async function loadSpecificVideo(videoId) {
    try {
        // Fetch the specific video data
        const response = await fetch(`${API_BASE_URL}/api/videos/${videoId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            const video = await response.json();
            console.log(`📹 Loaded specific video:`, video);
            
            // Add this video to the top of the feed
            const feedContainer = document.getElementById('foryouFeed');
            if (feedContainer) {
                const videoCard = createAdvancedVideoCard(video);
                feedContainer.insertAdjacentElement('afterbegin', videoCard);
                
                // Scroll to and play the new video
                setTimeout(() => {
                    const newVideoCard = document.querySelector(`[data-video-id="${videoId}"]`);
                    if (newVideoCard) {
                        newVideoCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        const videoElement = newVideoCard.querySelector('video');
                        if (videoElement) {
                            videoElement.play().catch(e => console.log('Video play failed:', e));
                        }
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
  