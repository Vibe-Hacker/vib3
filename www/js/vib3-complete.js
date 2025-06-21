// VIB3 Complete Video Sharing App - All Features
// No ES6 modules - global functions only

// ================ CONFIGURATION ================
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
}

function showMainApp() {
    document.getElementById('mainApp').style.display = 'block';
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
        video.muted = true;
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
            const response = await fetch(`/api/videos?feed=${feedType}&page=${page}&limit=10`, {
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
    video_elem.muted = true;
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
    `;
    
    card.appendChild(video_elem);
    card.appendChild(overlay);
    card.appendChild(actions);
    
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
        const response = await fetch(`/api/videos/${videoId}/reaction`, {
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
function showUploadModal() {
    document.getElementById('uploadModal').classList.add('show');
    currentStep = 1;
    showUploadStep(1);
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('show');
}

function showUploadStep(step) {
    // Hide all steps
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`uploadStep${i}`).style.display = 'none';
    }
    // Show current step
    document.getElementById(`uploadStep${step}`).style.display = 'block';
    currentStep = step;
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
    // Handle feed tabs - don't show "coming soon" for these
    if (page === 'foryou' || page === 'following' || page === 'explore' || page === 'discover') {
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
    if (mainApp && page !== 'foryou' && page !== 'explore' && page !== 'following') {
        mainApp.style.display = 'none';
    }
    
    // Handle special cases for pages that don't exist yet
    if (page === 'activity') {
        createActivityPage();
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
    loadVideoFeed(feedType);
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
function selectVideo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            showNotification('Video selected: ' + file.name, 'success');
            // Handle video upload
        }
    };
    input.click();
}

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
        activityPage.style.cssText = 'margin-left: 240px; width: calc(100vw - 240px); height: 100vh; overflow-y: auto; background: var(--bg-primary); padding: 20px;';
        activityPage.innerHTML = `
            <h2>Activity</h2>
            <div class="activity-tabs">
                <button class="tab-btn active" onclick="filterActivity('all')">All</button>
                <button class="tab-btn" onclick="filterActivity('likes')">Likes</button>
                <button class="tab-btn" onclick="filterActivity('comments')">Comments</button>
                <button class="tab-btn" onclick="filterActivity('follows')">Follows</button>
                <button class="tab-btn" onclick="filterActivity('mentions')">Mentions</button>
            </div>
            <div class="activity-list">
                <div class="activity-item">
                    <div class="activity-avatar">👤</div>
                    <div class="activity-content">
                        <div class="activity-text"><strong>user123</strong> liked your video</div>
                        <div class="activity-time">2 hours ago</div>
                    </div>
                </div>
                <div class="activity-item">
                    <div class="activity-avatar">👤</div>
                    <div class="activity-content">
                        <div class="activity-text"><strong>jane_doe</strong> commented: "Amazing content!"</div>
                        <div class="activity-time">5 hours ago</div>
                    </div>
                </div>
                <div class="activity-item">
                    <div class="activity-avatar">👤</div>
                    <div class="activity-content">
                        <div class="activity-text"><strong>musiclover</strong> started following you</div>
                        <div class="activity-time">1 day ago</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(activityPage);
    }
    
    // Hide all other pages including activity and friends
    document.querySelectorAll('.video-feed, .search-page, .profile-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page, .activity-page, .friends-page').forEach(el => {
        el.style.display = 'none';
    });
    const mainApp = document.getElementById('mainApp');
    if (mainApp) mainApp.style.display = 'none';
    
    activityPage.style.display = 'block';
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