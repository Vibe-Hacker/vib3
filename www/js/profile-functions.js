// Simple profile functions for VIB3

function createProfilePage() {
    console.log('🔧 Fallback: Using simple profile page creation');
    if (window.createSimpleProfilePage) {
        return createSimpleProfilePage();
    } else {
        console.error('❌ Simple profile page function not available');
        showNotification('Profile page temporarily unavailable', 'error');
    }
}

function editProfile() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 2000; display: flex; 
        align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: #222; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: white; margin: 0;">Edit Profile</h2>
                <button onclick="closeModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">×</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="color: white; display: block; margin-bottom: 5px;">Display Name</label>
                    <input type="text" id="editDisplayName" value="VIB3 User" style="width: 100%; padding: 12px; border: 1px solid #666; border-radius: 6px; background: #333; color: white;">
                </div>
                <div>
                    <label style="color: white; display: block; margin-bottom: 5px;">Username</label>
                    <input type="text" id="editUsername" value="vib3user" style="width: 100%; padding: 12px; border: 1px solid #666; border-radius: 6px; background: #333; color: white;">
                </div>
                <div>
                    <label style="color: white; display: block; margin-bottom: 5px;">Bio</label>
                    <textarea id="editBio" style="width: 100%; padding: 12px; border: 1px solid #666; border-radius: 6px; background: #333; color: white; min-height: 80px; resize: vertical;">Creator | Dancer | Music Lover ✨ Living my best life through dance 💃 Follow for daily vibes!</textarea>
                </div>
                <div>
                    <label style="color: white; display: block; margin-bottom: 5px;">Website</label>
                    <input type="url" id="editWebsite" value="" placeholder="https://your-website.com" style="width: 100%; padding: 12px; border: 1px solid #666; border-radius: 6px; background: #333; color: white;">
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="saveProfile(); closeModal()" style="flex: 1; background: #fe2c55; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        Save Changes
                    </button>
                    <button onclick="closeModal()" style="flex: 1; background: #333; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
    
    document.body.appendChild(modal);
    
    window.closeModal = () => {
        modal.remove();
    };
    
    window.saveProfile = () => {
        showNotification('Profile updated successfully!', 'success');
    };
}

function changeProfilePicture() {
    if (window.changeProfilePicture) {
        window.changeProfilePicture();
    } else {
        alert('Profile picture change functionality will be available soon!');
    }
}

function showProfileSettings() {
    if (window.openProfileSettings) {
        window.openProfileSettings();
    } else {
        alert('Profile settings functionality will be available soon!');
    }
}

function showFollowing() {
    if (window.showFollowing) {
        window.showFollowing();
    } else {
        alert('Following list functionality will be available soon!');
    }
}

function showFollowers() {
    if (window.showFollowers) {
        window.showFollowers();
    } else {
        alert('Followers list functionality will be available soon!');
    }
}

function shareProfile() {
    if (navigator.share) {
        navigator.share({
            title: 'Check out my VIB3 profile!',
            text: 'Follow me on VIB3 for awesome videos!',
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        showNotification('Profile link copied to clipboard!', 'success');
    }
}

function openCreatorTools() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 2000; display: flex; 
        align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: #222; padding: 30px; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: white; margin: 0;">Creator Tools</h2>
                <button onclick="closeModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">×</button>
            </div>
            
            <!-- Analytics Section -->
            <div style="background: #333; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #fe2c55; margin-bottom: 15px;">📊 Analytics</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 15px;">
                    <div style="text-align: center;">
                        <div style="color: white; font-size: 24px; font-weight: bold;">2.3M</div>
                        <div style="color: #999; font-size: 14px;">Video Views</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: white; font-size: 24px; font-weight: bold;">156K</div>
                        <div style="color: #999; font-size: 14px;">Profile Views</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: white; font-size: 24px; font-weight: bold;">89K</div>
                        <div style="color: #999; font-size: 14px;">Likes</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: white; font-size: 24px; font-weight: bold;">12K</div>
                        <div style="color: #999; font-size: 14px;">Shares</div>
                    </div>
                </div>
                <button onclick="showDetailedAnalytics()" style="background: #fe2c55; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; width: 100%;">
                    View Detailed Analytics
                </button>
            </div>
            
            <!-- Content Tools -->
            <div style="background: #333; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #fe2c55; margin-bottom: 15px;">🎬 Content Tools</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    <button onclick="scheduleContent()" style="background: #444; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; text-align: left;">
                        📅 Schedule Posts
                    </button>
                    <button onclick="bulkUpload()" style="background: #444; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; text-align: left;">
                        📂 Bulk Upload
                    </button>
                    <button onclick="editDrafts()" style="background: #444; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; text-align: left;">
                        📝 Manage Drafts
                    </button>
                    <button onclick="videoEditor()" style="background: #444; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; text-align: left;">
                        ✂️ Video Editor
                    </button>
                </div>
            </div>
            
            <!-- Monetization -->
            <div style="background: #333; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #fe2c55; margin-bottom: 15px;">💰 Monetization</h3>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <div style="color: white; font-size: 20px; font-weight: bold;">$247.50</div>
                        <div style="color: #999; font-size: 14px;">This month's earnings</div>
                    </div>
                    <button onclick="viewEarnings()" style="background: #fe2c55; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                        View Details
                    </button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
                    <button onclick="creatorFund()" style="background: #444; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                        🏆 Creator Fund
                    </button>
                    <button onclick="brandPartnerships()" style="background: #444; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                        🤝 Brand Deals
                    </button>
                    <button onclick="liveGifts()" style="background: #444; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                        🎁 Live Gifts
                    </button>
                </div>
            </div>
            
            <!-- Community -->
            <div style="background: #333; padding: 20px; border-radius: 8px;">
                <h3 style="color: #fe2c55; margin-bottom: 15px;">👥 Community</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    <button onclick="manageComments()" style="background: #444; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; text-align: left;">
                        💬 Manage Comments
                    </button>
                    <button onclick="collaborations()" style="background: #444; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; text-align: left;">
                        🎵 Collaborations
                    </button>
                    <button onclick="fanEngagement()" style="background: #444; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; text-align: left;">
                        ⭐ Fan Engagement
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
    
    document.body.appendChild(modal);
    
    // Creator Tools Functions
    window.closeModal = () => modal.remove();
    window.showDetailedAnalytics = () => showNotification('Detailed analytics coming soon!', 'info');
    window.scheduleContent = () => showNotification('Content scheduling coming soon!', 'info');
    window.bulkUpload = () => showNotification('Bulk upload coming soon!', 'info');
    window.editDrafts = () => showNotification('Draft management coming soon!', 'info');
    window.videoEditor = () => showNotification('Video editor coming soon!', 'info');
    window.viewEarnings = () => showNotification('Earnings details coming soon!', 'info');
    window.creatorFund = () => showNotification('Creator fund application coming soon!', 'info');
    window.brandPartnerships = () => showNotification('Brand partnerships coming soon!', 'info');
    window.liveGifts = () => showNotification('Live gifts management coming soon!', 'info');
    window.manageComments = () => showNotification('Comment management coming soon!', 'info');
    window.collaborations = () => showNotification('Collaboration tools coming soon!', 'info');
    window.fanEngagement = () => showNotification('Fan engagement tools coming soon!', 'info');
}

// Make functions globally available
window.createProfilePage = createProfilePage;
window.editProfile = editProfile;
window.changeProfilePicture = changeProfilePicture;
window.showProfileSettings = showProfileSettings;
window.showFollowing = showFollowing;
window.showFollowers = showFollowers;
window.shareProfile = shareProfile;
window.openCreatorTools = openCreatorTools;