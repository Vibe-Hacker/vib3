// Simple Profile Page for Testing

function createSimpleProfilePage() {
    console.log('🔧 Creating SIMPLE profile page...');
    
    // Remove any existing profile page
    const existingProfile = document.getElementById('profilePage');
    if (existingProfile) {
        existingProfile.remove();
    }
    
    // Create new profile page
    const profilePage = document.createElement('div');
    profilePage.id = 'profilePage';
    profilePage.style.cssText = `
        position: fixed;
        top: 0;
        left: 240px; 
        width: calc(100vw - 240px); 
        height: 100vh; 
        background: #161823;
        color: white;
        z-index: 1000;
        display: block;
        padding: 50px;
        text-align: center;
        overflow-y: auto;
    `;
    
    profilePage.innerHTML = `
        <h1 style="color: #fe2c55; font-size: 48px; margin-bottom: 20px;">
            🎵 VIB3 PROFILE 🎵
        </h1>
        <p style="color: white; font-size: 24px; margin-bottom: 30px;">
            Profile page is working! This is a test version.
        </p>
        <div style="background: #333; padding: 30px; border-radius: 15px; margin: 20px auto; max-width: 600px;">
            <div style="width: 120px; height: 120px; background: linear-gradient(135deg, #fe2c55, #ff006e); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 48px;">
                👤
            </div>
            <h2 style="color: white; margin-bottom: 10px;">@vib3user</h2>
            <p style="color: #ccc; margin-bottom: 20px;">Creator | Dancer | Music Lover</p>
            <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 20px;">
                <div><strong style="color: white;">123</strong> <span style="color: #ccc;">following</span></div>
                <div><strong style="color: white;">1.2K</strong> <span style="color: #ccc;">followers</span></div>
                <div><strong style="color: white;">5.6K</strong> <span style="color: #ccc;">likes</span></div>
            </div>
            <button onclick="alert('Edit Profile clicked!')" style="background: #fe2c55; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; margin: 10px;">
                Edit Profile
            </button>
            <button onclick="goBackToFeed();" style="background: #333; color: white; border: 1px solid #666; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; margin: 10px;">
                Back to Feed
            </button>
        </div>
    `;
    
    // Hide all other content
    document.querySelectorAll('.video-feed, #mainApp, .search-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page, .activity-page, .friends-page').forEach(el => {
        el.style.display = 'none';
    });
    
    // Add to body
    document.body.appendChild(profilePage);
    
    console.log('✅ SIMPLE profile page created and shown');
    return profilePage;
}

function goBackToFeed() {
    console.log('🔙 Going back to video feed...');
    
    // Remove the profile page
    const profilePage = document.getElementById('profilePage');
    if (profilePage) {
        profilePage.remove();
        console.log('✅ Profile page removed');
    }
    
    // Show the main app
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'block';
        console.log('✅ Main app shown');
    }
    
    // Switch to For You feed
    if (window.switchFeedTab) {
        switchFeedTab('foryou');
        console.log('✅ Switched to For You feed');
    }
    
    showNotification('Back to video feed!', 'success');
}

// Make functions globally available
window.createSimpleProfilePage = createSimpleProfilePage;
window.goBackToFeed = goBackToFeed;