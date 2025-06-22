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
        
        if (window.showToast) {
            window.showToast('Live streaming coming soon! 🎥');
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
                <div style="font-size: 48px; margin-bottom: 20px;">🔔</div>
                <h2 style="font-size: 24px; margin-bottom: 10px; color: var(--text-primary);">Activity</h2>
                <p style="font-size: 16px; color: var(--text-secondary); max-width: 400px;">
                    Notifications and activity updates will appear here soon! Stay tuned for likes, comments, follows, and more.
                </p>
            `;
            
            // Insert after main content
            const mainContent = document.querySelector('.main-content') || document.body;
            mainContent.appendChild(activityPage);
        } else {
            activityPage.style.display = 'flex';
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

// Make functions globally available for onclick handlers
window.showPage = showPage;
// Don't override switchFeedTab - let video manager handle it