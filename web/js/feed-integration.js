// Feed Integration - connects switchFeedTab with loadVideoFeed
console.log('🔗 Feed integration loading...');

// Define the main switchFeedTab function
window.switchFeedTab = function(tab) {
    console.log('📱 Switching to tab:', tab);
    
    // Update UI tabs
    const tabs = document.querySelectorAll('.feed-tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    const activeTab = document.getElementById(`${tab}Tab`);
    if (activeTab) activeTab.classList.add('active');
    
    // Hide all feed contents
    const feeds = document.querySelectorAll('.feed-content');
    feeds.forEach(f => {
        f.classList.remove('active');
        f.style.display = 'none';
    });
    
    // Show active feed
    const feedName = tab === 'discover' ? 'discover' : tab;
    const activeFeed = document.getElementById(`${feedName}Feed`);
    if (activeFeed) {
        activeFeed.classList.add('active');
        activeFeed.style.display = 'block';
    }
    
    // Load the videos for this feed
    loadFeedVideos(tab);
};

// Load videos for a specific feed
async function loadFeedVideos(feedType) {
    console.log('📹 Loading videos for feed:', feedType);
    
    const feedName = feedType === 'discover' ? 'discover' : feedType;
    const feedContainer = document.getElementById(`${feedName}Feed`);
    
    if (!feedContainer) {
        console.error('Feed container not found:', feedName);
        return;
    }
    
    // Show loading state
    feedContainer.innerHTML = `
        <div class="loading-state" style="text-align: center; padding: 50px;">
            <div class="spinner"></div>
            <p>Loading awesome videos...</p>
        </div>
    `;
    
    try {
        // Get API URL
        const apiUrl = window.API_BASE_URL || '';
        const response = await fetch(`${apiUrl}/api/videos/${feedType}`, {
            headers: {
                'Authorization': window.authToken ? `Bearer ${window.authToken}` : '',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.videos && data.videos.length > 0) {
            displayVideos(feedContainer, data.videos);
        } else {
            // Show empty state
            feedContainer.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 50px;">
                    <div style="font-size: 72px; margin-bottom: 20px;">🎬</div>
                    <h3>No videos yet</h3>
                    <p>Be the first to share something amazing!</p>
                    <button onclick="showUploadModal()" style="margin-top: 20px; padding: 12px 24px; background: var(--accent-primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Upload Video
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading feed:', error);
        
        // For now, show a demo video
        feedContainer.innerHTML = `
            <div class="video-item" style="position: relative; width: 100%; max-width: 500px; margin: 0 auto;">
                <video 
                    src="https://www.w3schools.com/html/mov_bbb.mp4" 
                    controls 
                    style="width: 100%; border-radius: 8px;"
                    poster="https://via.placeholder.com/500x900/FF0080/FFFFFF?text=VIB3+Demo"
                >
                </video>
                <div class="video-info" style="padding: 15px;">
                    <h4>Welcome to VIB3! 🎉</h4>
                    <p>This is a demo video. Upload your own to get started!</p>
                    <div class="video-actions" style="margin-top: 10px;">
                        <button onclick="showToast('Like feature coming soon!')" style="margin-right: 10px;">❤️ Like</button>
                        <button onclick="showToast('Comment feature coming soon!')" style="margin-right: 10px;">💬 Comment</button>
                        <button onclick="showToast('Share feature coming soon!')">🔗 Share</button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Display videos in the feed
function displayVideos(container, videos) {
    container.innerHTML = '';
    
    videos.forEach(video => {
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.style.cssText = 'margin-bottom: 20px; max-width: 500px; margin-left: auto; margin-right: auto;';
        
        videoItem.innerHTML = `
            <div class="video-container" style="position: relative;">
                <video 
                    src="${video.url || video.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'}"
                    poster="${video.thumbnail || ''}"
                    controls
                    style="width: 100%; border-radius: 8px;"
                ></video>
                
                <div class="video-info" style="padding: 15px; background: var(--bg-secondary); border-radius: 0 0 8px 8px;">
                    <div class="user-info" style="display: flex; align-items: center; margin-bottom: 10px;">
                        <div class="avatar" style="width: 40px; height: 40px; border-radius: 50%; background: var(--accent-primary); display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                            ${video.userAvatar || '👤'}
                        </div>
                        <div>
                            <div class="username" style="font-weight: bold;">@${video.username || 'user'}</div>
                            <div class="time" style="font-size: 12px; opacity: 0.7;">${formatTimeAgo(video.createdAt)}</div>
                        </div>
                    </div>
                    
                    <div class="description" style="margin-bottom: 10px;">${video.description || 'Check out my video!'}</div>
                    
                    <div class="actions" style="display: flex; gap: 15px;">
                        <button onclick="handleVideoLike('${video._id || video.id}')" style="background: none; border: none; color: var(--text-primary); cursor: pointer;">
                            ❤️ ${video.likes || 0}
                        </button>
                        <button onclick="showComments('${video._id || video.id}')" style="background: none; border: none; color: var(--text-primary); cursor: pointer;">
                            💬 ${video.comments || 0}
                        </button>
                        <button onclick="shareVideo('${video._id || video.id}')" style="background: none; border: none; color: var(--text-primary); cursor: pointer;">
                            🔗 Share
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(videoItem);
    });
}

// Helper function to format time
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'just now';
    
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// Video action handlers
window.handleVideoLike = async function(videoId) {
    if (!window.currentUser) {
        window.showToast('Please login to like videos');
        return;
    }
    
    try {
        const result = await toggleLike(videoId);
        if (result.success) {
            window.showToast(result.liked ? 'Liked!' : 'Unliked');
        }
    } catch (error) {
        window.showToast('Like feature coming soon!');
    }
};

window.showComments = function(videoId) {
    window.showToast('Comments coming soon!');
};

// Initialize feed when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        // Load initial feed if user is logged in
        if (window.currentUser || localStorage.getItem('authToken')) {
            console.log('🚀 Auto-loading For You feed...');
            switchFeedTab('foryou');
        }
    }, 1000);
});

console.log('✅ Feed integration ready');