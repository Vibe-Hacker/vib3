// App Initializer - Ensures app shows after login
console.log('🚀 App initializer loading...');

// Initialize app after auth
function initializeApp() {
    console.log('🎯 Initializing VIB3 app...');
    
    // Hide auth container
    const authContainer = document.getElementById('authContainer');
    if (authContainer) {
        authContainer.style.display = 'none';
    }
    
    // Show main app
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'block';
    }
    
    // Show sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.display = 'block';
    }
    
    // Show video feed
    const videoFeed = document.getElementById('videoFeed');
    if (videoFeed) {
        videoFeed.style.display = 'block';
    }
    
    // Load initial feed
    if (window.loadFeedVideos) {
        console.log('📹 Loading initial feed...');
        window.loadFeedVideos('foryou');
    }
    
    // Update user profile if available
    if (window.loadUserProfile) {
        window.loadUserProfile();
    }
    
    console.log('✅ App initialized');
}

// Check auth state on load
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Checking auth state...');
    
    // Check if user is already logged in
    setTimeout(() => {
        const currentUser = window.currentUser || 
                          (window.mongoAPI && window.mongoAPI.getCurrentUser && window.mongoAPI.getCurrentUser());
        
        if (currentUser) {
            console.log('✅ User already logged in:', currentUser.email);
            initializeApp();
        } else {
            console.log('❌ No user logged in');
            // Make sure auth container is visible
            const authContainer = document.getElementById('authContainer');
            if (authContainer) {
                authContainer.style.display = 'flex';
            }
        }
    }, 500);
});

// Export for use
window.initializeApp = initializeApp;

console.log('✅ App initializer ready');