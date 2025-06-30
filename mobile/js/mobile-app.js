// VIB3 Mobile App JavaScript
// Mobile-optimized video social app

// Global state
let currentUser = null;
let videos = [];
let currentVideoIndex = 0;
let isAudioEnabled = true;

// Simple notification system for mobile
function showNotification(message, type = 'info') {
    console.log(`📱 Notification (${type}):`, message);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10001;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 300px;
        text-align: center;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Initialize mobile app
function initMobileApp() {
    console.log('🔧 Initializing VIB3 Mobile App...');
    
    // Set API base URL
    window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? '' 
        : 'https://vib3-production.up.railway.app';
    
    // Check authentication status
    window.auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            showMainApp();
            loadMobileFeed();
        } else {
            showAuth();
        }
    });
    
    console.log('✅ Mobile app initialized');
}

// Authentication functions
function showAuth() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('profilePage').style.display = 'none';
}

function showMainApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('profilePage').style.display = 'none';
}

// Mobile navigation
function showMobilePage(page) {
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    switch(page) {
        case 'home':
            document.getElementById('mainContent').style.display = 'block';
            document.getElementById('profilePage').style.display = 'none';
            document.querySelector('.nav-item').classList.add('active');
            break;
        case 'discover':
            console.log('Discover page - coming soon');
            break;
        case 'upload':
            console.log('Upload - coming soon');
            break;
        case 'inbox':
            console.log('Inbox - coming soon');
            break;
        case 'profile':
            showMobileProfile();
            break;
    }
}

function showMobileProfile() {
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('profilePage').style.display = 'block';
    
    // Update profile info
    if (currentUser) {
        const username = currentUser.username || currentUser.email?.split('@')[0] || 'user';
        document.getElementById('profileUsername').textContent = '@' + username;
    }
    
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('.nav-item:last-child').classList.add('active');
}

// Mobile video feed
async function loadMobileFeed() {
    const feed = document.getElementById('videoFeed');
    
    // Show loading state
    feed.innerHTML = `
        <div class="loading-message">
            <div class="loading-spinner"></div>
            <div>Loading videos...</div>
        </div>
    `;
    
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/videos?feed=foryou&limit=20`, {
            method: 'GET',
            credentials: 'include',
            headers: window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {}
        });
        
        const data = await response.json();
        
        if (response.ok && data.videos && data.videos.length > 0) {
            videos = data.videos;
            renderMobileVideos();
        } else {
            showNoVideos();
        }
    } catch (error) {
        console.error('Failed to load mobile videos:', error);
        showNoVideos();
    }
}

function renderMobileVideos() {
    const feed = document.getElementById('videoFeed');
    
    feed.innerHTML = videos.map((video, index) => {
        const videoSrc = video.url || video.videoUrl || video.fileUrl || '';
        const username = video.username || video.user?.username || 'user';
        const description = video.description || video.caption || '';
        const likes = video.likes || video.likeCount || 0;
        const comments = video.comments || video.commentCount || 0;
        
        return `
            <div class="video-item" data-index="${index}">
                <video class="video-player" 
                       src="${videoSrc}"
                       loop
                       muted="${!isAudioEnabled}"
                       preload="metadata"
                       playsinline
                       webkit-playsinline
                       onclick="toggleMobileVideoPlayback(this)">
                </video>
                
                <div class="video-info">
                    <div class="video-username">@${username}</div>
                    <div class="video-description">${description}</div>
                </div>
                
                <div class="video-actions">
                    <div class="action-item" onclick="likeVideo(${index})">
                        <div class="action-icon">❤️</div>
                        <div class="action-count">${likes}</div>
                    </div>
                    <div class="action-item" onclick="showComments(${index})">
                        <div class="action-icon">💬</div>
                        <div class="action-count">${comments}</div>
                    </div>
                    <div class="action-item" onclick="shareVideo(${index})">
                        <div class="action-icon">📤</div>
                    </div>
                    <div class="action-item" onclick="toggleVideoAudio(${index})">
                        <div class="action-icon" id="audioIcon${index}">🔊</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Setup mobile video observer
    setupMobileVideoObserver();
}

function setupMobileVideoObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('.video-player');
            if (video) {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    // Pause all other videos first
                    document.querySelectorAll('.video-player').forEach(v => {
                        if (v !== video) v.pause();
                    });
                    // Play this video
                    video.play().catch(e => console.log('Mobile autoplay prevented:', e));
                } else {
                    video.pause();
                }
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.video-item').forEach(item => {
        observer.observe(item);
    });
}

function toggleMobileVideoPlayback(video) {
    // Pause all other videos
    document.querySelectorAll('.video-player').forEach(v => {
        if (v !== video) v.pause();
    });
    
    // Toggle this video
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

function showNoVideos() {
    const feed = document.getElementById('videoFeed');
    feed.innerHTML = `
        <div class="loading-message">
            <div>No videos available</div>
            <button onclick="loadMobileFeed()" style="margin-top: 20px; padding: 10px 20px; background: #FF0050; border: none; border-radius: 8px; color: white; cursor: pointer;">Retry</button>
        </div>
    `;
}

// Video actions
function likeVideo(index) {
    console.log('Like mobile video:', index);
    // TODO: Implement like functionality
}

function showComments(index) {
    console.log('Show mobile comments for video:', index);
    // TODO: Implement comments
}

function shareVideo(index) {
    console.log('Share mobile video:', index);
    // TODO: Implement share functionality
}

function toggleVideoAudio(index) {
    const video = document.querySelector(`[data-index="${index}"] .video-player`);
    const audioIcon = document.getElementById(`audioIcon${index}`);
    
    if (video.muted) {
        video.muted = false;
        video.volume = 0.8;
        audioIcon.textContent = '🔊';
    } else {
        video.muted = true;
        audioIcon.textContent = '🔇';
    }
}

// Make functions globally available
window.showNotification = showNotification;
window.showMobilePage = showMobilePage;
window.loadMobileFeed = loadMobileFeed;
window.toggleMobileVideoPlayback = toggleMobileVideoPlayback;
window.likeVideo = likeVideo;
window.showComments = showComments;
window.shareVideo = shareVideo;
window.toggleVideoAudio = toggleVideoAudio;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initMobileApp);

console.log('📱 VIB3 Mobile App script loaded');