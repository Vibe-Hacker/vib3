// UI Navigation functions - extracted from inline JavaScript

/**
 * Shows a specific page in the application
 * @param {string} page - The page to show (home, explore, live, profile, etc.)
 */
export function showPage(page) {
    // Update state manager with current page FIRST (before any early returns)
    if (window.stateManager) {
        window.stateManager.actions.setCurrentPage(page);
        console.log('Set current page in state:', page);
    }
    
    // CRITICAL: Remove activity page if it exists when navigating away
    const activityPage = document.getElementById('activityPage');
    if (activityPage && page !== 'activity') {
        activityPage.remove();
        console.log('🧹 Removed activity page');
    }
    
    // CRITICAL: Remove analytics overlay if it exists when navigating away  
    const analyticsOverlay = document.querySelector('[style*="position: fixed"][style*="z-index: 99999"]');
    if (analyticsOverlay && page !== 'analytics') {
        analyticsOverlay.remove();
        console.log('🧹 Removed analytics overlay');
    }
    
    // Update sidebar active state FIRST for all pages
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const sidebarMap = {
        'home': 'sidebarHome',
        'explore': 'sidebarExplore',
        'live': 'sidebarLive',
        'profile': 'sidebarProfile',
        'friends': 'sidebarFriends'
    };
    
    const sidebarButton = document.getElementById(sidebarMap[page]);
    if (sidebarButton) {
        sidebarButton.classList.add('active');
    }
    
    // Handle vertical video navigation
    if (page === 'explore') {
        // Ensure video feed is shown first
        const pages = ['videoFeed', 'searchPage', 'messagesPage', 'profilePage', 'settingsPage'];
        pages.forEach(p => {
            const element = document.getElementById(p);
            if (element) {
                element.style.display = p === 'videoFeed' ? 'block' : 'none';
            }
        });
        
        // Switch to explore tab
        if (window.switchFeedTab) {
            window.switchFeedTab('explore');
        }
        return;
    }
    
    if (page === 'live') {
        // Force stop ALL videos immediately when entering live page
        console.log('🛑 LIVE PAGE: Force stopping all videos');
        
        // Use aggressive video stopping
        if (window.forceStopAllVideos) {
            window.forceStopAllVideos();
        }
        
        // Also use regular stopping as backup
        if (window.stopAllVideosCompletely) {
            window.stopAllVideosCompletely();
        }
        
        // Setup live preview
        if (window.setupLivePreview) {
            window.setupLivePreview();
        } else {
            console.error('setupLivePreview not found');
            if (window.showToast) {
                window.showToast('Live streaming setup error', 'error');
            }
        }
        return;
    }
    
    if (page === 'friends') {
        // Ensure video feed is shown first
        const pages = ['videoFeed', 'searchPage', 'messagesPage', 'profilePage', 'settingsPage'];
        pages.forEach(p => {
            const element = document.getElementById(p);
            if (element) {
                element.style.display = p === 'videoFeed' ? 'block' : 'none';
            }
        });
        
        // Clear all active states first
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Highlight the friends button and keep it highlighted
        const friendsBtn = document.getElementById('sidebarFriends');
        if (friendsBtn) {
            friendsBtn.classList.add('active');
        }
        
        // Friends feature - redirect to following tab but keep friends button active
        if (window.switchFeedTab) {
            // Call switchFeedTab without clearing sidebar states
            window.switchFeedTab('following', true); // Add flag to preserve sidebar state
        }
        
        if (window.showToast) {
            window.showToast('Showing your following feed! 👥');
        }
        return;
    }
    
    if (page === 'activity') {
        console.log('Activity page clicked - clearing all navigation states');
        
        // Clear all active states first
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
            item.style.color = 'rgba(255, 255, 255, 0.75)';
            const icon = item.querySelector('.sidebar-icon');
            const text = item.querySelector('.sidebar-text');
            if (icon) icon.style.color = 'rgba(255, 255, 255, 0.75)';
            if (text) text.style.color = 'rgba(255, 255, 255, 0.75)';
        });
        
        // Highlight the activity button
        const activityBtn = document.querySelector('button[onclick*="activity"]');
        if (activityBtn) {
            activityBtn.classList.add('active');
            activityBtn.style.color = '#fe2c55';
            const icon = activityBtn.querySelector('.sidebar-icon');
            const text = activityBtn.querySelector('.sidebar-text');
            if (icon) icon.style.color = '#fe2c55';
            if (text) text.style.color = '#fe2c55';
        }
        
        // Stop all videos to prevent interference
        if (window.forceStopAllVideos) {
            window.forceStopAllVideos();
        }
        
        if (window.stopAllVideosCompletely) {
            window.stopAllVideosCompletely();
        }
        
        // Hide all other pages
        const pages = ['videoFeed', 'searchPage', 'messagesPage', 'profilePage', 'settingsPage'];
        pages.forEach(p => {
            const element = document.getElementById(p);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // Create or show activity page
        let activityPage = document.getElementById('activityPage');
        if (!activityPage) {
            activityPage = document.createElement('div');
            activityPage.id = 'activityPage';
            activityPage.className = 'activity-page';
            
            activityPage.innerHTML = `
                <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="font-size: 48px; margin-bottom: 20px;">🔔</div>
                        <h2 style="font-size: 24px; margin-bottom: 10px; color: var(--text-primary);">Activity</h2>
                        <p style="font-size: 14px; color: var(--text-secondary);">Stay updated with your latest interactions</p>
                    </div>
                    
                    <div id="activityContent">
                        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                            <div class="spinner" style="margin: 0 auto 20px;"></div>
                            <p>Loading your activity...</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Insert after main content
            const mainContent = document.querySelector('.main-content') || document.body;
            mainContent.appendChild(activityPage);
            
            // Load activity data
            setTimeout(() => loadActivityData(), 500);
        } else {
            activityPage.style.display = 'flex';
            // Refresh activity data if page already exists
            setTimeout(() => loadActivityData(), 100);
        }
        
        return;
    }
    
    if (page === 'messages') {
        // Force stop ALL videos immediately when entering messages
        console.log('🛑 MESSAGES PAGE: Force stopping all videos');
        
        // Use aggressive video stopping
        if (window.forceStopAllVideos) {
            window.forceStopAllVideos();
        }
        
        // Also use regular stopping as backup
        if (window.stopAllVideosCompletely) {
            window.stopAllVideosCompletely();
        }
        
        // Clear all active states first
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show messages page
        const pages = ['videoFeed', 'searchPage', 'messagesPage', 'profilePage', 'settingsPage'];
        pages.forEach(p => {
            const element = document.getElementById(p);
            if (element) {
                element.style.display = p === 'messagesPage' ? 'block' : 'none';
            }
        });
        
        if (window.showToast) {
            window.showToast('Messages coming soon! 💬');
        }
        return;
    }
    
    // Handle general page display for remaining pages (home, settings, etc.)
    const pages = ['videoFeed', 'searchPage', 'messagesPage', 'profilePage', 'settingsPage'];
    pages.forEach(p => {
        const element = document.getElementById(p);
        if (element) {
            element.style.display = p === (page === 'home' ? 'videoFeed' : page + 'Page') ? 'block' : 'none';
        }
    });
    
    // Specific handler for home page to ensure video feed is properly shown
    if (page === 'home') {
        console.log('🏠 HOME PAGE: Ensuring video feed is visible');
        
        // Force video feed to be visible
        const videoFeed = document.getElementById('videoFeed');
        if (videoFeed) {
            videoFeed.style.display = 'block';
            videoFeed.style.visibility = 'visible';
            videoFeed.style.opacity = '1';
            console.log('✅ Video feed forced visible for home page');
        }
        
        // Trigger feed display fix
        if (window.fixVideoFeedDisplay) {
            setTimeout(() => {
                window.fixVideoFeedDisplay();
            }, 100);
        }
        
        // Switch to For You tab if available
        if (window.switchFeedTab) {
            setTimeout(() => {
                window.switchFeedTab('foryou');
            }, 150);
        }
    }
    
    if (page === 'profile') {
        // Force stop ALL videos immediately when entering profile
        console.log('🛑 PROFILE PAGE: Force stopping all videos');
        
        // Use aggressive video stopping
        if (window.forceStopAllVideos) {
            window.forceStopAllVideos();
        }
        
        // Also use regular stopping as backup
        if (window.stopAllVideosCompletely) {
            window.stopAllVideosCompletely();
        }
        
        // Stop profile videos specifically
        if (window.profileManager && window.profileManager.stopAllProfileVideos) {
            window.profileManager.stopAllProfileVideos();
        }
        
        // Also try the global function
        if (window.stopAllProfileVideos) {
            window.stopAllProfileVideos();
        }
        
        // Disable profile video hover to prevent auto-play
        if (window.videoManager && window.videoManager.disableProfileVideoHover) {
            window.videoManager.disableProfileVideoHover();
        }
        
        if (window.currentUser && window.loadUserVideos) {
            window.loadUserVideos(window.currentUser.uid);
        }
        return;
    }
}

// Activity data loading function
async function loadActivityData() {
    console.log('📱 Loading activity data...');
    
    const activityContent = document.getElementById('activityContent');
    if (!activityContent) return;
    
    try {
        const apiBaseUrl = window.API_BASE_URL || 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? '' 
                : 'https://vib3-production.up.railway.app');
        
        const response = await fetch(`${apiBaseUrl}/api/user/activity`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📱 Activity data received:', data);
        displayActivityData(data);
        
    } catch (error) {
        console.error('Error loading activity:', error);
        activityContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <div style="font-size: 24px; margin-bottom: 10px;">😔</div>
                <p>Unable to load activity</p>
                <button onclick="loadActivityData()" style="margin-top: 15px; padding: 8px 16px; background: var(--accent-primary); color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Display activity data
function displayActivityData(data) {
    const activityContent = document.getElementById('activityContent');
    if (!activityContent) return;
    
    if (!data.activities || data.activities.length === 0) {
        activityContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <div style="font-size: 32px; margin-bottom: 15px;">🌟</div>
                <h3 style="color: var(--text-primary); margin-bottom: 10px;">No activity yet</h3>
                <p>Start engaging with videos to see your activity here!</p>
            </div>
        `;
        return;
    }
    
    const activityItems = data.activities.map(activity => {
        const timeAgo = getTimeAgo(new Date(activity.timestamp));
        let icon, message, actionStyle = '';
        
        switch (activity.type) {
            case 'like':
                icon = '❤️';
                message = `You liked "${activity.videoTitle || 'a video'}"`;
                actionStyle = 'background: rgba(255, 69, 69, 0.1); border-left: 3px solid #ff4545;';
                break;
            case 'comment':
                icon = '💬';
                message = `You commented on "${activity.videoTitle || 'a video'}"`;
                actionStyle = 'background: rgba(52, 152, 219, 0.1); border-left: 3px solid #3498db;';
                break;
            case 'share':
                icon = '📤';
                message = `You shared "${activity.videoTitle || 'a video'}"`;
                actionStyle = 'background: rgba(46, 204, 113, 0.1); border-left: 3px solid #2ecc71;';
                break;
            case 'follow':
                icon = '👥';
                message = `You followed ${activity.targetUser || 'a user'}`;
                actionStyle = 'background: rgba(155, 89, 182, 0.1); border-left: 3px solid #9b59b6;';
                break;
            case 'video_uploaded':
                icon = '🎬';
                message = `You uploaded "${activity.videoTitle || 'a video'}"`;
                actionStyle = 'background: rgba(241, 196, 15, 0.1); border-left: 3px solid #f1c40f;';
                break;
            default:
                icon = '📱';
                message = activity.description || 'Activity occurred';
                actionStyle = 'background: rgba(127, 140, 141, 0.1); border-left: 3px solid #7f8c8d;';
        }
        
        return `
            <div style="padding: 15px; margin-bottom: 10px; border-radius: 8px; ${actionStyle}">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center;">
                        <span style="font-size: 20px; margin-right: 12px;">${icon}</span>
                        <div>
                            <p style="margin: 0; color: var(--text-primary); font-weight: 500;">${message}</p>
                            ${activity.details ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: var(--text-secondary);">${activity.details}</p>` : ''}
                        </div>
                    </div>
                    <span style="font-size: 12px; color: var(--text-secondary); white-space: nowrap;">${timeAgo}</span>
                </div>
            </div>
        `;
    }).join('');
    
    activityContent.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: var(--text-primary);">Recent Activity</h3>
                <span style="font-size: 12px; color: var(--text-secondary);">${data.activities.length} activities</span>
            </div>
            ${activityItems}
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button onclick="loadActivityData()" style="background: var(--accent-primary); color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                🔄 Refresh
            </button>
        </div>
    `;
}

// Helper function to format time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

// Make functions globally available for onclick handlers
window.showPage = showPage;
window.loadActivityData = loadActivityData;
// Don't override switchFeedTab - let video manager handle it