// Page navigation handler
console.log('📄 Page handler loading...');

// Show page function
window.showPage = function(pageName) {
    console.log(`🔄 Switching to page: ${pageName}`);
    
    // Hide all pages first
    const pages = [
        'videoFeed', 'searchPage', 'profilePage', 'live-page', 
        'coins-page', 'creations-page', 'shop-page', 'settings-page',
        'help-page', 'analytics-page', 'activityPage', 'messagesPage',
        'friendsPage'
    ];
    
    pages.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) {
            page.style.display = 'none';
        }
    });
    
    // Hide feed tabs for non-feed pages
    const feedTabs = document.querySelector('.feed-tabs');
    if (feedTabs) {
        feedTabs.style.display = pageName === 'foryou' || pageName === 'explore' || pageName === 'following' ? 'flex' : 'none';
    }
    
    // Show the requested page
    switch(pageName) {
        case 'foryou':
            const videoFeed = document.getElementById('videoFeed');
            if (videoFeed) videoFeed.style.display = 'block';
            switchFeedTab('foryou');
            break;
            
        case 'explore':
            const exploreFeed = document.getElementById('videoFeed');
            if (exploreFeed) exploreFeed.style.display = 'block';
            switchFeedTab('discover');
            break;
            
        case 'following':
            const followingFeed = document.getElementById('videoFeed');
            if (followingFeed) followingFeed.style.display = 'block';
            switchFeedTab('following');
            break;
            
        case 'search':
            const searchPage = document.getElementById('searchPage');
            if (searchPage) searchPage.style.display = 'block';
            break;
            
        case 'profile':
            const profilePage = document.getElementById('profilePage');
            if (profilePage) profilePage.style.display = 'block';
            if (window.loadUserProfile) window.loadUserProfile();
            break;
            
        case 'live':
            const livePage = document.getElementById('live-page');
            if (livePage) {
                livePage.style.display = 'block';
            } else {
                // Open live setup modal if page doesn't exist
                if (window.openLiveSetup) window.openLiveSetup();
            }
            break;
            
        case 'coins':
            const coinsPage = document.getElementById('coins-page');
            if (coinsPage) {
                coinsPage.style.display = 'block';
                if (window.updateCoinBalance) window.updateCoinBalance();
            }
            break;
            
        case 'creations':
        case 'studio':
            // VIB3 Studio page
            const creationsPage = document.getElementById('creations-page');
            if (creationsPage) {
                creationsPage.style.display = 'block';
            } else {
                // Create a simple VIB3 Studio page
                createVIB3StudioPage();
            }
            break;
            
        case 'activity':
            const activityPage = document.getElementById('activityPage');
            if (activityPage) activityPage.style.display = 'block';
            break;
            
        case 'messages':
            const messagesPage = document.getElementById('messagesPage');
            if (messagesPage) messagesPage.style.display = 'block';
            break;
            
        case 'friends':
            const friendsPage = document.getElementById('friendsPage');
            if (friendsPage) friendsPage.style.display = 'block';
            break;
            
        case 'settings':
            const settingsPage = document.getElementById('settings-page');
            if (settingsPage) {
                settingsPage.style.display = 'block';
            } else {
                createSettingsPage();
            }
            break;
            
        case 'help':
            if (window.showNotification) {
                window.showNotification('Help center coming soon! 🚧', 'info');
            }
            break;
            
        case 'analytics':
            if (window.showNotification) {
                window.showNotification('Analytics coming soon! 📊', 'info');
            }
            break;
            
        case 'shop':
            if (window.showNotification) {
                window.showNotification('Shop coming soon! 🛍️', 'info');
            }
            break;
            
        default:
            console.warn(`Page not found: ${pageName}`);
            // Default to home
            showPage('foryou');
    }
    
    // Update active sidebar item
    updateSidebarActive(pageName);
};

// Update sidebar active state
function updateSidebarActive(pageName) {
    // Remove active class from all items
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to current page
    const sidebarMap = {
        'foryou': 'sidebarHome',
        'explore': 'sidebarExplore',
        'following': 'sidebarFollowing',
        'friends': 'sidebarFriends',
        'profile': 'sidebarProfile'
    };
    
    const activeId = sidebarMap[pageName];
    if (activeId) {
        const activeItem = document.getElementById(activeId);
        if (activeItem) activeItem.classList.add('active');
    }
}

// Create VIB3 Studio page
function createVIB3StudioPage() {
    const page = document.createElement('div');
    page.id = 'creations-page';
    page.style.cssText = `
        display: block;
        margin-left: 240px;
        width: calc(100vw - 240px);
        height: 100vh;
        overflow-y: auto;
        background: var(--bg-primary);
        padding: 32px 40px;
    `;
    
    page.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto;">
            <h1 style="font-size: 48px; font-weight: 900; color: var(--text-primary); margin-bottom: 16px;">
                🎬 VIB3 Studio
            </h1>
            <p style="font-size: 20px; color: var(--text-secondary); margin-bottom: 48px;">
                Create amazing videos with our powerful editing tools
            </p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px;">
                <div onclick="window.showUploadModal && window.showUploadModal()" style="background: linear-gradient(135deg, #ff006e, #8338ec); border-radius: 16px; padding: 40px; cursor: pointer; transition: transform 0.3s;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📹</div>
                    <h3 style="font-size: 24px; font-weight: 700; color: white; margin-bottom: 8px;">Upload Video</h3>
                    <p style="color: rgba(255,255,255,0.8);">Share your content with the world</p>
                </div>
                
                <div onclick="window.openLiveSetup && window.openLiveSetup()" style="background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 16px; padding: 40px; cursor: pointer; transition: all 0.3s;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔴</div>
                    <h3 style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">Go Live</h3>
                    <p style="color: var(--text-secondary);">Stream to your audience in real-time</p>
                </div>
                
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 16px; padding: 40px; cursor: pointer; transition: all 0.3s; opacity: 0.6;">
                    <div style="font-size: 48px; margin-bottom: 16px;">✂️</div>
                    <h3 style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">Video Editor</h3>
                    <p style="color: var(--text-secondary);">Coming soon...</p>
                </div>
            </div>
        </div>
    `;
    
    document.querySelector('.app-container').appendChild(page);
}

// Create Settings page
function createSettingsPage() {
    const page = document.createElement('div');
    page.id = 'settings-page';
    page.style.cssText = `
        display: block;
        margin-left: 240px;
        width: calc(100vw - 240px);
        height: 100vh;
        overflow-y: auto;
        background: var(--bg-primary);
        padding: 32px 40px;
    `;
    
    page.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto;">
            <h1 style="font-size: 32px; font-weight: 700; color: var(--text-primary); margin-bottom: 32px;">Settings</h1>
            
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 12px; padding: 24px; margin-bottom: 16px;">
                <h3 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px;">Account</h3>
                <button onclick="showPage('profile')" style="width: 100%; text-align: left; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-primary); border-radius: 8px; color: var(--text-primary); cursor: pointer; margin-bottom: 8px;">Edit Profile</button>
                <button onclick="handleLogout()" style="width: 100%; text-align: left; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-primary); border-radius: 8px; color: #ff006e; cursor: pointer;">Sign Out</button>
            </div>
            
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 12px; padding: 24px;">
                <h3 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px;">About</h3>
                <p style="color: var(--text-secondary); margin-bottom: 8px;">VIB3 v2025.01.05</p>
                <p style="color: var(--text-secondary);">© 2025 VIB3. All rights reserved.</p>
            </div>
        </div>
    `;
    
    document.querySelector('.app-container').appendChild(page);
}

console.log('✅ Page handler ready');