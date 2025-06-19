// Authentication UI management - extracted from inline JavaScript

/**
 * Shows the main app interface after login
 * @param {Object} user - Firebase user object
 * @param {boolean} isPageRefresh - Whether this is a page refresh vs fresh login
 */
export function showMainApp(user, isPageRefresh = false) {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('mainApp').classList.add('authenticated');
    document.getElementById('mainApp').style.display = 'block';
    
    // Also add to parent container for CSS targeting
    document.querySelector('.app-container').classList.add('authenticated');
    
    // Directly hide the login section
    const loginSection = document.querySelector('.sidebar-login-section');
    if (loginSection) {
        loginSection.style.display = 'none';
    }
    
    // Show profile button
    const profileBtn = document.getElementById('sidebarProfile');
    if (profileBtn) {
        profileBtn.style.display = 'flex';
    }
    
    // Update profile elements if they exist
    const profileNameEl = document.getElementById('profileName');
    const userDisplayNameEl = document.getElementById('userDisplayName');
    
    if (profileNameEl) {
        profileNameEl.textContent = '@' + (user.email.split('@')[0] || 'user');
    }
    if (userDisplayNameEl) {
        userDisplayNameEl.textContent = user.displayName || user.email || 'VIB3 User';
    }
    
    window.currentUser = user;
    
    // Update header profile picture
    if (window.updateHeaderProfile) {
        window.updateHeaderProfile();
    }
    
    // Load user profile picture
    if (window.loadUserProfilePicture) {
        window.loadUserProfilePicture();
    }
    
    // Load following accounts for sidebar
    if (window.loadFollowingAccountsForSidebar) {
        window.loadFollowingAccountsForSidebar();
    }
    
    // Only enable audio flag for fresh logins, not page refreshes
    if (!isPageRefresh) {
        window.enableAudioAfterLogin = true;
    } else {
        // For page refresh, restore previous audio preference or default to enabled
        const savedAudioPreference = localStorage.getItem('vib3_audio_enabled');
        window.enableAudioAfterLogin = savedAudioPreference !== 'false'; // Default to true unless explicitly disabled
    }
    
    // Small delay to ensure currentUser is properly set before loading videos
    setTimeout(() => {
        // Ensure we're on the For You page and video feed is shown
        document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
        const homeBtn = document.getElementById('sidebarHome');
        if (homeBtn) {
            homeBtn.classList.add('active');
        }
        
        // Hide any profile/settings pages and show video feed
        const pages = ['profilePage', 'settingsPage', 'searchPage', 'messagesPage'];
        pages.forEach(pageId => {
            const page = document.getElementById(pageId);
            if (page) page.style.display = 'none';
        });
        
        // Show video feed
        const videoFeed = document.getElementById('videoFeed');
        if (videoFeed) videoFeed.style.display = 'block';
        
        // Switch to For You tab and load videos
        if (window.switchFeedTab) {
            window.switchFeedTab('foryou');
        }
    }, 100);
}

/**
 * Shows the authentication screen
 */
export function showAuthScreen() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('mainApp').classList.remove('authenticated');
    document.querySelector('.app-container').classList.remove('authenticated');
    
    const userVideosGrid = document.getElementById('userVideosGrid');
    if (userVideosGrid) {
        userVideosGrid.innerHTML = '';
    }
    
    const noVideosMessage = document.getElementById('noVideosMessage');
    if (noVideosMessage) {
        noVideosMessage.style.display = 'block';
    }
}

/**
 * Shows the login form
 */
export function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    clearError();
}

/**
 * Shows the signup form
 */
export function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    clearError();
}

/**
 * Clears authentication error messages
 */
export function clearError() {
    const errorEl = document.getElementById('authError');
    if (errorEl) {
        errorEl.textContent = '';
    }
}

// Make functions globally available for transition period
window.showMainApp = showMainApp;
window.showAuthScreen = showAuthScreen;
window.showLogin = showLogin;
window.showSignup = showSignup;
window.clearError = clearError;