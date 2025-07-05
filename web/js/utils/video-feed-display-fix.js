// Video Feed Display Fix - ensures video feed is always visible when it should be
(function() {
    console.log('🎬 Video Feed Display Fix loading...');
    
    // Prevent infinite reload loops
    let reloadAttempts = 0;
    const maxReloadAttempts = 3;
    
    function fixVideoFeedDisplay() {
        console.log('🔧 Fixing video feed display...');
        
        // Ensure video feed container is visible
        const videoFeed = document.getElementById('videoFeed');
        if (videoFeed) {
            videoFeed.style.display = 'block';
            videoFeed.style.visibility = 'visible';
            videoFeed.style.opacity = '1';
            console.log('✅ Video feed container made visible');
        }
        
        // Ensure feed tabs are visible
        const feedTabs = document.querySelector('.feed-tabs');
        if (feedTabs) {
            feedTabs.style.display = 'flex';
            feedTabs.style.visibility = 'visible';
            console.log('✅ Feed tabs made visible');
        }
        
        // Hide other pages that might be interfering
        const pagesToHide = ['profilePage', 'messagesPage', 'settingsPage', 'searchPage'];
        pagesToHide.forEach(pageId => {
            const page = document.getElementById(pageId);
            if (page) {
                page.style.display = 'none';
            }
        });
        
        // Ensure feed content is visible
        const feedContent = document.querySelector('.feed-content.active');
        if (feedContent) {
            feedContent.style.display = 'block';
            feedContent.style.visibility = 'visible';
            console.log('✅ Feed content made visible');
        }
        
        // Check if there are videos loaded
        const videoItems = document.querySelectorAll('.video-item');
        console.log(`📊 Found ${videoItems.length} video items`);
        
        if (videoItems.length === 0 && reloadAttempts < maxReloadAttempts) {
            console.log(`⚠️ No video items found - reload attempt ${reloadAttempts + 1}/${maxReloadAttempts}`);
            reloadAttempts++;
            // Trigger feed reload if no videos
            if (window.switchFeedTab) {
                setTimeout(() => {
                    console.log('🔄 Reloading For You feed...');
                    window.switchFeedTab('foryou');
                }, 100);
            }
        } else if (videoItems.length === 0) {
            console.log('⚠️ No videos loaded after max attempts - stopping reload loop');
        } else {
            // Reset counter if videos are found
            reloadAttempts = 0;
        }
    }
    
    // Override switchFeedTab to ensure proper display
    const originalSwitchFeedTab = window.switchFeedTab;
    window.switchFeedTab = function(tab) {
        console.log(`🔄 Enhanced switchFeedTab called: ${tab}`);
        
        // Call original function
        if (originalSwitchFeedTab) {
            originalSwitchFeedTab.call(this, tab);
        }
        
        // Small delay then fix display
        setTimeout(() => {
            fixVideoFeedDisplay();
        }, 50);
    };
    
    // Make fix function globally available
    window.fixVideoFeedDisplay = fixVideoFeedDisplay;
    
    // Monitor for display issues and auto-fix
    function monitorVideoFeedDisplay() {
        const videoFeed = document.getElementById('videoFeed');
        if (videoFeed && window.location.hash !== '#profile' && window.location.hash !== '#messages') {
            const computedStyle = window.getComputedStyle(videoFeed);
            if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
                console.log('🚨 Video feed display issue detected - auto-fixing...');
                fixVideoFeedDisplay();
            }
        }
    }
    
    // Check every 2 seconds for display issues
    setInterval(monitorVideoFeedDisplay, 2000);
    
    // Fix display when page loads
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(fixVideoFeedDisplay, 500);
    });
    
    console.log('✅ Video Feed Display Fix initialized');
})();