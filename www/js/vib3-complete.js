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
    maxVideoSize: 100 * 1024 * 1024, // 100MB
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
let lastFeedLoad = 0;
let isLoadingMore = false;
let hasMoreVideos = true;
let currentPage = 1;

function initializeVideoObserver() {
    console.log('🎬 TIKTOK-STYLE VIDEO INIT WITH SCROLL SNAP');
    
    // Only target feed videos, not upload modal videos
    const videos = document.querySelectorAll('.feed-content video');
    console.log('📹 Found', videos.length, 'feed video elements');
    
    if (videos.length === 0) {
        console.log('❌ No feed videos found');
        return;
    }
    
    // Create intersection observer for TikTok-style video playback
    if (videoObserver) {
        videoObserver.disconnect();
    }
    
    videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
                // Play video when mostly visible
                video.play().catch(e => console.log('Play failed:', e));
                console.log('🎬 Playing video:', video.src.split('/').pop());
            } else {
                // Pause when not visible
                video.pause();
                console.log('⏸️ Pausing video:', video.src.split('/').pop());
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
    
    // Auto-play first video
    if (videos.length > 0) {
        videos[0].play().catch(e => console.log('▶️ First video autoplay blocked:', e));
    }
    
    console.log('🏁 TikTok-style video system initialized with scroll snap');
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
    
    console.log(`Loading video feed: ${feedType}, page: ${page}, append: ${append}`);
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
            const response = await fetch(`${window.API_BASE_URL}/api/videos?feed=${feedType}&page=${page}&limit=10`, {
                headers: window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {}
            });
            
            const data = await response.json();
            console.log(`📦 Received data for page ${page}:`, data.videos?.length, 'videos');
            
            // Remove loading indicator
            if (append) {
                const loadingElement = feedElement.querySelector('.infinite-loading');
                if (loadingElement) loadingElement.remove();
            }
            
            if (data.videos && data.videos.length > 0) {
                // Filter out videos with invalid URLs
                const validVideos = data.videos.filter(video => {
                    return video.videoUrl && 
                           !video.videoUrl.includes('example.com') && 
                           video.videoUrl !== '' &&
                           video.videoUrl.startsWith('http');
                });
                
                if (validVideos.length > 0) {
                    if (!append) {
                        feedElement.innerHTML = '';
                        feedElement.style.overflow = 'auto';
                        feedElement.style.scrollSnapType = 'y mandatory';
                        feedElement.style.scrollBehavior = 'smooth';
                    }
                    
                    console.log(`➕ Adding ${validVideos.length} videos to feed (append: ${append})`);
                    validVideos.forEach((video, index) => {
                        const videoCard = createAdvancedVideoCard(video);
                        feedElement.appendChild(videoCard);
                        console.log(`  ✅ Added video ${index + 1}: ${video.title || 'Untitled'}`);
                    });
                    
                    // For infinite scroll testing, always assume there are more videos
                    hasMoreVideos = true;
                    console.log(`🔄 Feed now has ${feedElement.children.length} video elements total`);
                    
                    // Setup infinite scroll listener
                    if (!append) {
                        setupInfiniteScroll(feedElement, feedType);
                        setTimeout(() => initializeVideoObserver(), 200);
                    } else {
                        // Re-initialize observer for new videos
                        setTimeout(() => initializeVideoObserver(), 200);
                    }
                } else {
                    if (!append) {
                        feedElement.innerHTML = createEmptyFeedMessage(feedType);
                        feedElement.style.overflow = 'hidden';
                        console.log('No valid videos after filtering, showing empty message for', feedType);
                        hasMoreVideos = false;
                    } else {
                        console.log('No valid videos in append mode, but keeping hasMoreVideos true');
                        hasMoreVideos = true; // Keep trying for infinite scroll
                    }
                }
            } else {
                if (!append) {
                    feedElement.innerHTML = createEmptyFeedMessage(feedType);
                    feedElement.style.overflow = 'hidden';
                    console.log('No videos to display, showing empty message for', feedType);
                    hasMoreVideos = false;
                } else {
                    console.log('No videos returned in append mode, but keeping hasMoreVideos true');
                    hasMoreVideos = true; // Keep trying for infinite scroll
                }
            }
        } catch (error) {
            console.error('Load feed error:', error);
            if (!append) {
                feedElement.innerHTML = createErrorMessage(feedType);
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
    video_elem.src = video.videoUrl || '';
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
    
    // Add event listeners
    video_elem.onerror = () => console.error('🚨 VIDEO ERROR:', video_elem.src);
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
            @${video.username || 'user'}
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
        <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ❤️
        </div>
        <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; cursor: pointer;">
            💬
        </div>
        <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; cursor: pointer;">
            📤
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
    
    // Add pause/play functionality when clicking video
    video_elem.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        
        if (video_elem.paused) {
            video_elem.play();
            pauseIndicator.style.display = 'none';
            console.log('▶️ RESUMED VIDEO:', video_elem.src);
        } else {
            video_elem.pause();
            pauseIndicator.style.display = 'flex';
            console.log('⏸️ PAUSED VIDEO:', video_elem.src);
        }
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
    const modal = document.getElementById('uploadModal');
    if (!modal) {
        console.error('❌ Upload modal not found!');
        return;
    }
    
    console.log('✅ Upload modal found, showing...');
    modal.classList.add('show');
    modal.style.display = 'flex';  // Ensure modal is visible
    goToStep(1);
}

function closeUploadModal() {
    console.log('🔒 Closing upload modal...');
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';  // Ensure modal is hidden
        console.log('✅ Upload modal closed and hidden');
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
    } else {
        console.error(`❌ Upload step ${step} element not found!`);
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
    document.getElementById('step2Title').textContent = '🎥 Select Video';
    document.getElementById('formatHint').textContent = 'Supported: MP4, MOV, AVI (up to 1080p)';
    goToStep(2);
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
        return validTypes.includes(file.type) && file.size <= 100 * 1024 * 1024; // 100MB limit
    });
    
    if (validFiles.length === 0) {
        showNotification('Please select valid video files (MP4, MOV, AVI under 100MB)', 'error');
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
    
    if (uploadType === 'video' && selectedFiles.length > 0) {
        videoPreview.src = URL.createObjectURL(selectedFiles[0]);
        videoPreview.style.display = 'block';
        photoSlideshow.style.display = 'none';
        currentEditingFile = selectedFiles[0];
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
    
    if (selectedFiles.length === 0) {
        showNotification('No files selected for upload', 'error');
        return;
    }
    
    goToStep(5);
    
    try {
        updatePublishProgress('Preparing upload...', 0);
        
        // Get auth token
        const token = localStorage.getItem('vib3_token');
        if (!token) {
            showNotification('Please log in to upload content', 'error');
            goToStep(4);
            return;
        }
        
        updatePublishProgress('Uploading content...', 20);
        
        // Create FormData for file upload
        const formData = new FormData();
        
        if (uploadType === 'video' && selectedFiles.length > 0) {
            // Upload video file
            formData.append('video', selectedFiles[0]);
            formData.append('title', finalTitle);
            formData.append('description', description);
            
            const response = await fetch(`${window.API_BASE_URL}/api/upload/video`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            updatePublishProgress('Processing video...', 60);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }
            
            const result = await response.json();
            console.log('✅ Video uploaded:', result);
            
            updatePublishProgress('Finalizing...', 90);
            
        } else if (uploadType === 'photos' && selectedFiles.length > 0) {
            // Handle photo slideshow upload
            formData.append('title', finalTitle);
            formData.append('description', description);
            
            // Add all photos
            selectedFiles.forEach((file, index) => {
                formData.append(`photos`, file);
            });
            
            const response = await fetch(`${window.API_BASE_URL}/api/upload/slideshow`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            updatePublishProgress('Creating slideshow...', 60);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }
            
            const result = await response.json();
            console.log('✅ Slideshow created:', result);
            
            updatePublishProgress('Finalizing...', 90);
        }
        
        updatePublishProgress('Complete!', 100);
        
        // Success
        setTimeout(() => {
            showNotification('Content published successfully!', 'success');
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
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: 720, height: 1280 }, 
            audio: true 
        });
        
        // Open advanced video editor
        openAdvancedVideoEditor(stream);
    } catch (error) {
        showNotification('Camera access required to record video', 'error');
    }
}

function openAdvancedVideoEditor(stream) {
    const editorModal = document.createElement('div');
    editorModal.className = 'modal video-editor-modal';
    editorModal.innerHTML = `
        <div class="modal-content editor-content">
            <div class="editor-header">
                <button onclick="closeVideoEditor()" class="close-btn">&times;</button>
                <div class="editor-title">Video Editor</div>
                <button onclick="saveEditedVideo()" class="save-btn">Save</button>
            </div>
            
            <div class="editor-main">
                <div class="video-preview-area">
                    <video id="editorPreview" autoplay muted></video>
                    <canvas id="editorCanvas" style="display: none;"></canvas>
                    
                    <!-- Real-time Effects Overlay -->
                    <div class="effects-overlay">
                        <div class="effect-buttons">
                            <button onclick="toggleEffect('beauty')" class="effect-btn">✨ Beauty</button>
                            <button onclick="toggleEffect('blur')" class="effect-btn">🌫️ Blur BG</button>
                            <button onclick="toggleEffect('greenscreen')" class="effect-btn">🟢 Green Screen</button>
                        </div>
                    </div>
                    
                    <!-- Recording Controls -->
                    <div class="recording-controls">
                        <button id="recordButton" onclick="toggleRecording()" class="record-btn">🔴</button>
                        <button onclick="flipCamera()" class="flip-btn">🔄</button>
                        <button onclick="toggleFlash()" class="flash-btn">⚡</button>
                        <div class="timer-display">00:00</div>
                    </div>
                </div>
                
                <div class="editor-sidebar">
                    <!-- Filters -->
                    <div class="editor-section">
                        <h4>🎨 Filters</h4>
                        <div class="filter-grid">
                            <button onclick="applyFilter('normal')" class="filter-btn active">Normal</button>
                            <button onclick="applyFilter('vibrant')" class="filter-btn">Vibrant</button>
                            <button onclick="applyFilter('vintage')" class="filter-btn">Vintage</button>
                            <button onclick="applyFilter('bw')" class="filter-btn">B&W</button>
                            <button onclick="applyFilter('warm')" class="filter-btn">Warm</button>
                            <button onclick="applyFilter('cold')" class="filter-btn">Cold</button>
                            <button onclick="applyFilter('dramatic')" class="filter-btn">Dramatic</button>
                            <button onclick="applyFilter('film')" class="filter-btn">Film</button>
                        </div>
                    </div>
                    
                    <!-- Effects -->
                    <div class="editor-section">
                        <h4>✨ Effects</h4>
                        <div class="effects-grid">
                            <button onclick="addEffect('sparkle')" class="effect-btn">✨ Sparkle</button>
                            <button onclick="addEffect('hearts')" class="effect-btn">💕 Hearts</button>
                            <button onclick="addEffect('confetti')" class="effect-btn">🎉 Confetti</button>
                            <button onclick="addEffect('snow')" class="effect-btn">❄️ Snow</button>
                            <button onclick="addEffect('fire')" class="effect-btn">🔥 Fire</button>
                            <button onclick="addEffect('neon')" class="effect-btn">💡 Neon</button>
                        </div>
                    </div>
                    
                    <!-- Speed -->
                    <div class="editor-section">
                        <h4>⚡ Speed</h4>
                        <div class="speed-controls">
                            <button onclick="setSpeed(0.3)" class="speed-btn">0.3x</button>
                            <button onclick="setSpeed(0.5)" class="speed-btn">0.5x</button>
                            <button onclick="setSpeed(1)" class="speed-btn active">1x</button>
                            <button onclick="setSpeed(1.5)" class="speed-btn">1.5x</button>
                            <button onclick="setSpeed(2)" class="speed-btn">2x</button>
                            <button onclick="setSpeed(3)" class="speed-btn">3x</button>
                        </div>
                    </div>
                    
                    <!-- Text -->
                    <div class="editor-section">
                        <h4>📝 Text</h4>
                        <button onclick="addTextOverlay()" class="add-text-btn">+ Add Text</button>
                        <div class="text-styles">
                            <button onclick="setTextStyle('classic')" class="text-style-btn">Classic</button>
                            <button onclick="setTextStyle('bold')" class="text-style-btn">Bold</button>
                            <button onclick="setTextStyle('neon')" class="text-style-btn">Neon</button>
                            <button onclick="setTextStyle('handwritten')" class="text-style-btn">Handwritten</button>
                        </div>
                    </div>
                    
                    <!-- Music -->
                    <div class="editor-section">
                        <h4>🎵 Music</h4>
                        <button onclick="openMusicLibrary()" class="music-btn">Browse Sounds</button>
                        <button onclick="recordVoiceover()" class="voiceover-btn">🎤 Voice Over</button>
                        <div class="volume-controls">
                            <label>Original: </label>
                            <input type="range" min="0" max="100" value="50" onchange="setOriginalVolume(this.value)">
                            <label>Music: </label>
                            <input type="range" min="0" max="100" value="50" onchange="setMusicVolume(this.value)">
                        </div>
                    </div>
                    
                    <!-- Timer & Tools -->
                    <div class="editor-section">
                        <h4>⏰ Timer & Tools</h4>
                        <button onclick="setRecordingTimer(3)" class="timer-btn">3s Timer</button>
                        <button onclick="setRecordingTimer(10)" class="timer-btn">10s Timer</button>
                        <button onclick="toggleCountdown()" class="countdown-btn">Countdown</button>
                        <button onclick="toggleGridLines()" class="grid-btn">Grid Lines</button>
                    </div>
                </div>
            </div>
            
            <!-- Timeline Editor -->
            <div class="timeline-editor">
                <div class="timeline-tracks">
                    <div class="track video-track">
                        <label>Video</label>
                        <div class="track-content"></div>
                    </div>
                    <div class="track audio-track">
                        <label>Audio</label>
                        <div class="track-content"></div>
                    </div>
                    <div class="track effects-track">
                        <label>Effects</label>
                        <div class="track-content"></div>
                    </div>
                </div>
                <div class="timeline-controls">
                    <button onclick="trimVideo()" class="trim-btn">✂️ Trim</button>
                    <button onclick="splitVideo()" class="split-btn">🔪 Split</button>
                    <button onclick="mergeClips()" class="merge-btn">🔗 Merge</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(editorModal);
    editorModal.classList.add('show');
    
    // Initialize video editor
    initializeVideoEditor(stream);
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
    
    // Handle feed tabs - don't show "coming soon" for these
    if (page === 'foryou' || page === 'following' || page === 'explore' || page === 'friends') {
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
    const liveModal = document.createElement('div');
    liveModal.className = 'modal live-stream-modal';
    liveModal.innerHTML = `
        <div class="modal-content live-content">
            <div class="live-header">
                <button onclick="closeLiveStream()" class="close-btn">&times;</button>
                <h3>📺 Go Live</h3>
            </div>
            
            <div class="live-setup">
                <div class="live-preview">
                    <video id="livePreview" autoplay muted></video>
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
                            <option value="720p">720p HD</option>
                            <option value="1080p">1080p Full HD</option>
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
    
    initializeLiveStream();
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
    console.log(`🔄 Switching to ${feedType} feed`);
    
    // CRITICAL FIX: Remove profile page when switching feeds
    const profilePage = document.getElementById('profilePage');
    if (profilePage) {
        profilePage.remove();
        console.log('✅ Removed profile page when switching to feed');
    }
    
    // Pause all currently playing videos
    document.querySelectorAll('video').forEach(video => {
        video.pause();
        console.log('⏸️ Paused video during feed switch:', video.src);
    });
    
    // Hide all feed content containers
    document.querySelectorAll('.feed-content').forEach(feed => {
        feed.classList.remove('active');
        feed.style.display = 'none';
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.feed-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show the target feed container
    const targetFeed = document.getElementById(feedType + 'Feed');
    if (targetFeed) {
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
    
    // Load the feed content
    loadVideoFeed(feedType);
    
    // After a brief delay, ensure the first video starts playing
    setTimeout(() => {
        const firstVideo = targetFeed?.querySelector('video');
        if (firstVideo) {
            firstVideo.currentTime = 0;
            firstVideo.play().catch(e => console.log('Auto-play prevented:', e));
            console.log('🎬 Started first video in', feedType, 'feed');
        }
    }, 500);
}

function refreshForYou() {
    loadVideoFeed('foryou', true);
}

function performSearch(query) {
    if (!query || !query.trim()) return;
    
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
                    <div class="search-item user-result">
                        <div class="user-avatar">👤</div>
                        <div class="user-info">
                            <div class="user-name">${query}_official</div>
                            <div class="user-stats">1.2M followers</div>
                        </div>
                        <button class="follow-btn" onclick="toggleFollow('${query}_official')">Follow</button>
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

// ================ INITIALIZATION ================
document.addEventListener('DOMContentLoaded', function() {
    console.log('VIB3 Complete App Starting...');
    
    // Apply saved theme
    const savedTheme = localStorage.getItem('vib3-theme');
    if (savedTheme) {
        document.body.className = `theme-${savedTheme}`;
    }
    
    // Initialize authentication
    initializeAuth();
    
    // Add global CSS for animations
    addGlobalStyles();
    
    // Initialize all features
    console.log('All VIB3 features loaded successfully!');
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
function startLiveStream() {
    showNotification('🔴 Starting live stream...', 'success');
    // Initialize live stream
    document.getElementById('liveChat').style.display = 'block';
}

function scheduleLiveStream() {
    const time = prompt('Schedule for when? (e.g., "Tomorrow 8PM")');
    if (time) {
        showNotification(`Live stream scheduled for ${time}`, 'success');
    }
}

function closeLiveStream() {
    document.querySelector('.live-stream-modal').remove();
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
                <h2 style="color: var(--text-primary); margin-bottom: 20px; font-size: 24px; font-weight: 700;">
                    🔔 Activity
                </h2>
                
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
        // Simulate API call for now - in real app would fetch from /api/activity
        const activities = generateSampleActivity(filter);
        
        setTimeout(() => {
            if (activities.length === 0) {
                activityList.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                        <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
                        <h3 style="margin-bottom: 8px; color: var(--text-primary);">No ${filter === 'all' ? '' : filter} activity yet</h3>
                        <p>When people interact with your content, you'll see it here</p>
                    </div>
                `;
            } else {
                activityList.innerHTML = activities.map(createActivityItem).join('');
                
                // Add click handlers for activity items
                activityList.querySelectorAll('.activity-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const activityId = item.dataset.activityId;
                        handleActivityClick(activityId);
                    });
                });
            }
        }, 500);
        
    } catch (error) {
        console.error('Error loading activity:', error);
        activityList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                ❌ Failed to load activity. Please try again.
            </div>
        `;
    }
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
                    <strong style="color: var(--accent-color);">@${activity.user.username}</strong> 
                    ${activity.action}
                    ${activity.target ? `<span style="color: var(--text-secondary);">"${activity.target}"</span>` : ''}
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
                            onkeypress="if(event.key==='Enter') sendMessage()"
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

function filterActivity(type) {
    showNotification(`Showing ${type} activity`, 'info');
    // Update tab styles
    document.querySelectorAll('.activity-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
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
            <div class="comment-input">
                <input type="text" placeholder="Add a comment..." onkeypress="if(event.key==='Enter') addComment(this.value, '${videoId}')">
                <button onclick="addComment(this.previousElementSibling.value, '${videoId}')">Post</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
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
    const video = document.querySelector('.camera-preview video');
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
    showNotification('Video saved successfully!', 'success');
    closeVideoEditor();
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
        event.target.value = '';
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
window.closeVideoEditor = closeVideoEditor;
window.saveEditedVideo = saveEditedVideo;

// Profile and upload functions
window.handleProfilePicUpload = handleProfilePicUpload;
window.filterDiscoverVideos = filterDiscoverVideos;

// Comment system
window.addComment = addComment;
window.likeComment = likeComment;
window.replyToComment = replyToComment;

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
                    Username
                </label>
                <input type="text" value="${currentUser?.username || 'vib3user'}" style="
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
                <textarea placeholder="Tell us about yourself..." style="
                    width: 100%;
                    height: 100px;
                    padding: 12px;
                    border: 1px solid var(--border-primary);
                    border-radius: 8px;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    font-size: 16px;
                    resize: vertical;
                ">Welcome to my VIB3 profile! 🎵✨
Creator | Dancer | Music Lover
📧 Contact: hello@vib3.com</textarea>
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
                <button onclick="saveProfile(); this.closest('.modal').remove();" style="
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

function saveProfile() {
    showNotification('Profile updated successfully!', 'success');
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
            padding: 32px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="color: var(--text-primary); margin: 0;">Creator Tools</h2>
                <button onclick="this.closest('.modal').remove()" style="
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 24px;
                    cursor: pointer;
                ">×</button>
            </div>
            
            <div class="creator-tools-grid" style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 16px;
            ">
                <button onclick="showNotification('Analytics dashboard', 'info')" style="
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
                
                <button onclick="showNotification('Live streaming setup', 'info')" style="
                    padding: 24px;
                    background: var(--bg-secondary);
                    border: none;
                    border-radius: 12px;
                    color: var(--text-primary);
                    cursor: pointer;
                    text-align: center;
                    transition: background 0.2s ease;
                ">
                    <div style="font-size: 32px; margin-bottom: 8px;">📺</div>
                    <div style="font-weight: 600;">Live Stream</div>
                </button>
                
                <button onclick="showNotification('Monetization options', 'info')" style="
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
                    <div style="font-weight: 600;">Monetization</div>
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
                    <div style="font-size: 32px; margin-bottom: 8px;">🏆</div>
                    <div style="font-weight: 600;">Creator Fund</div>
                </button>
                
                <button onclick="showNotification('Brand partnerships', 'info')" style="
                    padding: 24px;
                    background: var(--bg-secondary);
                    border: none;
                    border-radius: 12px;
                    color: var(--text-primary);
                    cursor: pointer;
                    text-align: center;
                    transition: background 0.2s ease;
                ">
                    <div style="font-size: 32px; margin-bottom: 8px;">🤝</div>
                    <div style="font-weight: 600;">Partnerships</div>
                </button>
                
                <button onclick="showNotification('Account verification', 'info')" style="
                    padding: 24px;
                    background: var(--bg-secondary);
                    border: none;
                    border-radius: 12px;
                    color: var(--text-primary);
                    cursor: pointer;
                    text-align: center;
                    transition: background 0.2s ease;
                ">
                    <div style="font-size: 32px; margin-bottom: 8px;">✅</div>
                    <div style="font-weight: 600;">Verification</div>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}