// Comprehensive fix for feed navigation and video display issues
console.log('[Feed Navigation Fix] Loading...');

// Wait for DOM and other scripts to load
document.addEventListener('DOMContentLoaded', function() {
    // Ensure proper page display when switching tabs
    const fixNavigationDisplay = () => {
        // Override showPage to ensure video feed is shown for home/explore
        const originalShowPage = window.showPage;
        
        window.showPage = function(page) {
            console.log(`[Feed Nav Fix] showPage called with: ${page}`);
            
            // For explore, we need to ensure video feed is visible
            if (page === 'explore') {
                // First show the video feed container
                const videoFeed = document.getElementById('videoFeed');
                if (videoFeed) {
                    videoFeed.style.display = 'block';
                }
                
                // Hide other pages
                const pagesToHide = ['searchPage', 'messagesPage', 'profilePage', 'settingsPage', 'activityPage'];
                pagesToHide.forEach(pageId => {
                    const pageEl = document.getElementById(pageId);
                    if (pageEl) {
                        pageEl.style.display = 'none';
                    }
                });
                
                // Then switch to discover tab
                if (window.switchFeedTab) {
                    window.switchFeedTab('discover');
                }
                
                // Update sidebar highlighting
                document.querySelectorAll('.sidebar-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                const exploreBtn = document.getElementById('sidebarExplore');
                if (exploreBtn) {
                    exploreBtn.classList.add('active');
                }
                
                return; // Don't call original showPage for explore
            }
            
            // For other pages, call original
            if (originalShowPage) {
                originalShowPage.call(this, page);
            }
        };
    };
    
    // Fix feed tab switching to ensure proper display
    const fixFeedTabSwitch = () => {
        const enhanceSwitchFeedTab = () => {
            const original = window.switchFeedTab;
            
            window.switchFeedTab = function(tab, preserveSidebarState) {
                console.log(`[Feed Nav Fix] switchFeedTab called with: ${tab}`);
                
                // Ensure video feed container is visible FIRST
                const videoFeed = document.getElementById('videoFeed');
                if (videoFeed) {
                    videoFeed.style.display = 'block';
                    videoFeed.style.visibility = 'visible';
                    videoFeed.style.opacity = '1';
                }
                
                // Hide other pages
                const pagesToHide = ['searchPage', 'messagesPage', 'profilePage', 'settingsPage', 'activityPage'];
                pagesToHide.forEach(pageId => {
                    const pageEl = document.getElementById(pageId);
                    if (pageEl) {
                        pageEl.style.display = 'none';
                    }
                });
                
                // Call original
                if (original) {
                    original.call(this, tab, preserveSidebarState);
                }
                
                // Post-switch verification
                setTimeout(() => {
                    const feedName = tab === 'explore' ? 'discover' : tab;
                    const activeFeed = document.getElementById(`${feedName}Feed`);
                    
                    if (activeFeed && activeFeed.style.display === 'none') {
                        console.warn(`[Feed Nav Fix] Active feed ${feedName} was hidden, making visible`);
                        activeFeed.style.display = 'block';
                        activeFeed.classList.add('active');
                    }
                }, 100);
            };
        };
        
        // Try to enhance immediately
        if (window.switchFeedTab) {
            enhanceSwitchFeedTab();
        } else {
            // Wait for it to be defined
            let attempts = 0;
            const waitForSwitchFeedTab = setInterval(() => {
                if (window.switchFeedTab || attempts > 20) {
                    clearInterval(waitForSwitchFeedTab);
                    if (window.switchFeedTab) {
                        enhanceSwitchFeedTab();
                    }
                }
                attempts++;
            }, 100);
        }
    };
    
    // Apply fixes
    fixNavigationDisplay();
    fixFeedTabSwitch();
    
    // Additional safeguard: Monitor for hidden video feed
    setInterval(() => {
        const currentPage = window.stateManager?.getState('ui.currentPage');
        const activeFeedTab = window.stateManager?.getState('ui.activeFeedTab');
        
        // If we're on home or explore page but video feed is hidden
        if ((currentPage === 'home' || currentPage === 'explore') && activeFeedTab) {
            const videoFeed = document.getElementById('videoFeed');
            if (videoFeed && videoFeed.style.display === 'none') {
                console.warn('[Feed Nav Fix] Video feed incorrectly hidden, fixing...');
                videoFeed.style.display = 'block';
            }
            
            // Also check the active feed content
            const feedName = activeFeedTab === 'explore' ? 'discover' : activeFeedTab;
            const activeFeed = document.getElementById(`${feedName}Feed`);
            if (activeFeed && !activeFeed.classList.contains('active')) {
                console.warn(`[Feed Nav Fix] ${feedName}Feed not active, fixing...`);
                
                // Hide all feeds
                document.querySelectorAll('.feed-content').forEach(f => {
                    f.classList.remove('active');
                    f.style.display = 'none';
                });
                
                // Show active feed
                activeFeed.classList.add('active');
                activeFeed.style.display = 'block';
            }
        }
    }, 1000);
    
    console.log('[Feed Navigation Fix] Applied successfully');
});

// Also add a global function to manually fix display issues
window.fixVideoFeedDisplay = function() {
    console.log('[Feed Nav Fix] Manual fix triggered');
    
    const videoFeed = document.getElementById('videoFeed');
    if (videoFeed) {
        videoFeed.style.display = 'block';
        videoFeed.style.visibility = 'visible';
        videoFeed.style.opacity = '1';
    }
    
    // Find and show the active feed
    const activeFeedTab = document.querySelector('.feed-tab.active');
    if (activeFeedTab) {
        const tabId = activeFeedTab.id;
        const feedName = tabId.replace('Tab', '');
        const feedEl = document.getElementById(`${feedName}Feed`);
        
        if (feedEl) {
            document.querySelectorAll('.feed-content').forEach(f => {
                f.classList.remove('active');
                f.style.display = 'none';
            });
            
            feedEl.classList.add('active');
            feedEl.style.display = 'block';
        }
    }
    
    console.log('[Feed Nav Fix] Manual fix completed');
};