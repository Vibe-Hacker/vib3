// Simple feed functions for VIB3

// Load video feed
async function loadVideoFeed(feedType = 'foryou', forceRefresh = false) {
    const videoFeed = document.getElementById('videoFeed');
    if (!videoFeed) return;
    
    // Show loading
    videoFeed.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Loading videos...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/videos?feed=${feedType}`, {
            headers: window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {}
        });
        
        const data = await response.json();
        
        if (data.videos && data.videos.length > 0) {
            videoFeed.innerHTML = '';
            data.videos.forEach(video => {
                const videoCard = createVideoCard(video);
                videoFeed.appendChild(videoCard);
            });
        } else {
            videoFeed.innerHTML = `
                <div class="empty-feed">
                    <h3>No videos yet</h3>
                    <p>Be the first to upload!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load feed error:', error);
        videoFeed.innerHTML = `
            <div class="error-container">
                <h3>Unable to load videos</h3>
                <p>Check your connection and try again</p>
                <button onclick="loadVideoFeed('${feedType}', true)">Retry</button>
            </div>
        `;
    }
}

// Create video card element
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `
        <div class="video-container">
            <video 
                class="video-element" 
                src="${video.videoUrl || 'https://example.com/sample.mp4'}"
                poster="${video.thumbnail || ''}"
                loop
                muted
                onclick="toggleVideoPlayback(this.parentElement)"
            ></video>
            <div class="play-pause-indicator">▶️</div>
            
            <div class="video-info">
                <div class="user-info">
                    <div class="user-avatar">${video.userAvatar || '👤'}</div>
                    <div class="user-details">
                        <div class="username">@${video.username || 'user'}</div>
                        <div class="upload-time">${formatDate(video.createdAt)}</div>
                    </div>
                </div>
                
                <div class="video-description">${video.description || ''}</div>
                
                <div class="video-actions">
                    <button class="action-btn like-btn" onclick="handleLikeClick('${video._id}', this)">
                        ❤️ <span>${video.likeCount || 0}</span>
                    </button>
                    <button class="action-btn comment-btn">
                        💬 <span>${video.commentCount || 0}</span>
                    </button>
                    <button class="action-btn share-btn" onclick="shareVideo('${video._id}')">
                        🔗 Share
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Toggle video playback
function toggleVideoPlayback(container) {
    const video = container.querySelector('.video-element');
    const indicator = container.querySelector('.play-pause-indicator');
    
    if (!video) return;
    
    if (video.paused) {
        // Pause all other videos
        document.querySelectorAll('.video-element').forEach(v => {
            if (v !== video && !v.paused) {
                v.pause();
            }
        });
        
        video.play().then(() => {
            indicator.textContent = '⏸️';
            indicator.style.opacity = '1';
            setTimeout(() => indicator.style.opacity = '0', 1000);
        }).catch(() => {
            console.log('Playback failed');
        });
    } else {
        video.pause();
        indicator.textContent = '▶️';
        indicator.style.opacity = '1';
        setTimeout(() => indicator.style.opacity = '0', 1000);
    }
}

// Handle like button click
async function handleLikeClick(videoId, button) {
    const result = await window.toggleLike(videoId);
    if (result.success) {
        button.classList.toggle('liked', result.liked);
        button.querySelector('span').textContent = result.likeCount;
    } else if (result.requiresAuth) {
        if (window.showNotification) {
            window.showNotification('Please login to like videos', 'info');
        }
    }
}

// Initialize video observer for auto-play
function initVideoObserver() {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target.querySelector('.video-element');
                if (video) {
                    if (entry.isIntersecting) {
                        video.play().catch(() => {});
                    } else {
                        video.pause();
                    }
                }
            });
        }, { threshold: 0.7 });
        
        // Observe existing videos
        document.querySelectorAll('.video-card').forEach(card => {
            observer.observe(card);
        });
        
        // Store observer for later use
        window.videoObserver = observer;
    }
}

// Format date function (fallback)
function formatDate(date) {
    if (!date) return 'Recently';
    const dateObj = new Date(date);
    const now = new Date();
    const diff = now - dateObj;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return Math.floor(diff / 86400000) + 'd ago';
}

// Make functions globally available
window.loadVideoFeed = loadVideoFeed;
window.createVideoCard = createVideoCard;
window.toggleVideoPlayback = toggleVideoPlayback;
window.handleLikeClick = handleLikeClick;
window.initVideoObserver = initVideoObserver;