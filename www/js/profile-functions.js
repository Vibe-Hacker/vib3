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
    console.log('🔧 profile-functions.js editProfile() called');
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
                    <textarea id="editBio" style="width: 100%; padding: 12px; border: 1px solid #666; border-radius: 6px; background: #333; color: white; min-height: 80px; resize: vertical;">VIB3 Creator | Dancer | Music Lover ✨ Living my best life through dance 💃 Follow for daily vibes!</textarea>
                </div>
                <div>
                    <label style="color: white; display: block; margin-bottom: 5px;">Website</label>
                    <input type="url" id="editWebsite" value="" placeholder="https://your-website.com" style="width: 100%; padding: 12px; border: 1px solid #666; border-radius: 6px; background: #333; color: white;">
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="saveProfile()" style="flex: 1; background: #fe2c55; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600;">
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
    console.log('✅ profile-functions.js modal added to DOM with elements:', {
        displayName: !!document.getElementById('editDisplayName'),
        username: !!document.getElementById('editUsername'),
        bio: !!document.getElementById('editBio'),
        website: !!document.getElementById('editWebsite')
    });
    
    window.closeModal = () => {
        modal.remove();
    };
}

// saveProfile function is now handled by vib3-complete.js

// Make sure the function is globally available
console.log('🔧 profile-functions.js loaded, setting up changeProfilePicture');

async function changeProfilePicture() {
    console.log('📸 IMMEDIATE CALL - changeProfilePicture function was called!');
    alert('📸 IMMEDIATE ALERT - changeProfilePicture function was called!');
    console.log('📸 PROFILE-FUNCTIONS.JS changeProfilePicture called directly!');
    const emojis = ['👤', '😀', '😎', '🤩', '🥳', '🦄', '🌟', '💫', '🎵', '🎭', '🎨', '🏆'];
    const currentPicture = document.getElementById('profilePicture');
    const currentEmoji = currentPicture?.textContent || '👤';
    
    // Create profile picture picker modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 2000; display: flex; 
        align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: #222; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
            <h3 style="color: white; margin-bottom: 20px;">Choose Profile Picture</h3>
            
            <!-- Upload Image Option -->
            <div style="margin-bottom: 20px;">
                <input type="file" id="profileImageUpload" accept="image/*" style="display: none;">
                <button onclick="document.getElementById('profileImageUpload').click()" style="width: 100%; padding: 15px; background: #fe2c55; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin-bottom: 10px;">
                    📷 Upload Photo
                </button>
                <div style="color: #888; font-size: 12px; text-align: center;">JPG, PNG, GIF up to 5MB</div>
            </div>
            
            <!-- Emoji Options -->
            <div style="border-top: 1px solid #444; padding-top: 20px;">
                <h4 style="color: white; margin-bottom: 15px; font-size: 16px;">Or choose an emoji:</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                    ${emojis.map(emoji => `
                        <button onclick="selectProfilePicture('${emoji}')" style="width: 60px; height: 60px; font-size: 30px; background: ${emoji === currentEmoji ? '#fe2c55' : '#333'}; border: none; border-radius: 12px; cursor: pointer; color: white;">
                            ${emoji}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <button onclick="closePictureModal()" style="background: #666; color: white; border: none; padding: 12px 24px; border-radius: 8px; width: 100%; margin-top: 20px; cursor: pointer;">
                Cancel
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle file upload
    modal.querySelector('#profileImageUpload').onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image too large. Maximum size is 5MB.');
                return;
            }
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file.');
                return;
            }
            
            try {
                console.log('📸 Starting profile picture upload...');
                console.log('📸 File details:', { name: file.name, size: file.size, type: file.type });
                
                // Use EXACT same approach as video upload
                const formData = new FormData();
                formData.append('profileImage', file);
                
                // Add user information EXACTLY like video upload
                const currentUser = window.currentUser;
                if (currentUser) {
                    const username = currentUser.username || 
                                   currentUser.displayName || 
                                   currentUser.name ||
                                   currentUser.email?.split('@')[0] || 
                                   'user';
                    formData.append('username', username);
                    formData.append('userId', currentUser.id || currentUser._id || currentUser.uid || '');
                    
                    console.log('📸 Adding user info to upload:');
                    console.log('  - Username:', username);
                    console.log('  - User ID:', currentUser.id || currentUser._id || currentUser.uid);
                    
                    // Log all FormData entries like video upload does
                    console.log('🔍 COMPLETE FORMDATA CONTENTS:');
                    for (let [key, value] of formData.entries()) {
                        if (value instanceof File) {
                            console.log(`  ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
                        } else {
                            console.log(`  ${key}: ${value}`);
                        }
                    }
                } else {
                    console.warn('⚠️ No currentUser found for upload');
                }
                
                // Use EXACT same API base URL and request format as video upload
                const response = await fetch(`${window.API_BASE_URL}/api/user/profile-image`, {
                    method: 'POST',
                    credentials: 'include', // EXACT same as video upload
                    headers: {
                        // EXACT same header logic as video upload
                        ...(window.authToken && window.authToken !== 'session-based' ? 
                            { 'Authorization': `Bearer ${window.authToken}` } : {})
                    },
                    body: formData
                });
                
                console.log('📡 RESPONSE STATUS:', response.status, response.statusText);
                console.log('📡 RESPONSE HEADERS:', Object.fromEntries(response.headers.entries()));
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('📸 Profile image upload SUCCESS response:', data);
                    
                    // Update profile picture display immediately
                    const imageUrl = data.profilePictureUrl || data.profileImageUrl || data.profileImage;
                    console.log('📸 Received image URL from server:', imageUrl);
                    console.log('📸 Full server response:', data);
                    
                    if (imageUrl) {
                        // Update main profile picture element
                        const profilePicEl = document.getElementById('profilePicture');
                        console.log('📸 Found profile picture element:', !!profilePicEl);
                        
                        if (profilePicEl) {
                            console.log('📸 Updating main profile picture element with:', imageUrl);
                            profilePicEl.style.backgroundImage = `url(${imageUrl})`;
                            profilePicEl.style.backgroundSize = 'cover';
                            profilePicEl.style.backgroundPosition = 'center';
                            profilePicEl.textContent = '';
                            console.log('📸 Profile picture element updated successfully');
                        }
                        
                        // Update any other profile picture elements that might exist
                        const allProfileEls = document.querySelectorAll('[id*="profile"], [class*="profile-pic"], [class*="avatar"]');
                        console.log('📸 Found additional profile elements:', allProfileEls.length);
                        allProfileEls.forEach((el, index) => {
                            if (el.id !== 'profilePicture') { // Don't duplicate the main one
                                console.log(`📸 Updating additional profile element ${index}:`, el.id || el.className);
                                el.style.backgroundImage = `url(${imageUrl})`;
                                el.style.backgroundSize = 'cover';
                                el.style.backgroundPosition = 'center';
                                if (el.textContent && el.textContent.match(/[👤😀😎🤩🥳🦄🌟💫🎵🎭🎨🏆]/)) {
                                    el.textContent = '';
                                }
                            }
                        });
                    } else {
                        console.error('❌ No image URL found in server response');
                        console.log('📸 Available response fields:', Object.keys(data));
                    }
                    
                    // Update current user data
                    if (window.currentUser) {
                        console.log('📸 Updating currentUser with new profile picture');
                        window.currentUser.profileImage = imageUrl;
                        window.currentUser.profilePicture = null; // Clear emoji when using image
                        console.log('📸 Updated currentUser:', window.currentUser);
                    }
                    
                    alert('Profile picture updated successfully!');
                    modal.remove();
                    
                    // Force reload of user data from server to get updated profile
                    setTimeout(async () => {
                        console.log('📸 Refreshing user data from server after upload...');
                        try {
                            // Fetch fresh user data from server
                            const userResponse = await fetch(`${window.API_BASE_URL}/api/auth/me`, {
                                credentials: 'include',
                                headers: {
                                    ...(window.authToken && window.authToken !== 'session-based' ? 
                                        { 'Authorization': `Bearer ${window.authToken}` } : {})
                                }
                            });
                            
                            if (userResponse.ok) {
                                const freshUserData = await userResponse.json();
                                console.log('📸 Got fresh user data:', freshUserData);
                                
                                // Update currentUser with fresh data
                                if (freshUserData.user) {
                                    window.currentUser = freshUserData.user;
                                    console.log('📸 Updated currentUser with fresh data:', window.currentUser);
                                    
                                    // Update profile display with fresh data
                                    if (window.updateProfileDisplay && typeof window.updateProfileDisplay === 'function') {
                                        window.updateProfileDisplay(freshUserData.user);
                                    }
                                    
                                    // Also trigger a profile page refresh if we're on profile page
                                    if (window.loadUserProfileData && typeof window.loadUserProfileData === 'function') {
                                        console.log('📸 Refreshing profile page display...');
                                        window.loadUserProfileData();
                                    }
                                }
                            } else {
                                console.error('❌ Failed to fetch fresh user data');
                            }
                        } catch (error) {
                            console.error('❌ Error fetching fresh user data:', error);
                        }
                    }, 1000);
                } else {
                    const errorText = await response.text();
                    console.error('❌ PROFILE PICTURE UPLOAD ERROR:', errorText);
                    alert('Failed to upload profile picture');
                }
            } catch (error) {
                console.error('❌ Profile picture upload exception:', error);
                alert('Error uploading profile picture');
            }
        }
    };
    
    window.closePictureModal = () => modal.remove();
    
    window.selectProfilePicture = async (emoji) => {
        console.log('📸 Setting emoji profile picture:', emoji);
        
        try {
            // Call server to update profile picture
            const response = await fetch(`${window.API_BASE_URL}/api/user/profile`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(window.authToken && window.authToken !== 'session-based' ? 
                        { 'Authorization': `Bearer ${window.authToken}` } : {})
                },
                body: JSON.stringify({ profilePicture: emoji })
            });
            
            if (response.ok) {
                // Update current user data
                if (window.currentUser) {
                    window.currentUser.profilePicture = emoji;
                    window.currentUser.profileImage = null; // Clear image when using emoji
                }
                
                // Update UI
                const profilePicEl = document.getElementById('profilePicture');
                if (profilePicEl) {
                    profilePicEl.style.backgroundImage = '';
                    profilePicEl.textContent = emoji;
                }
                
                alert('Profile picture updated!');
                modal.remove();
                
                // Refresh profile data
                setTimeout(() => {
                    if (window.loadUserProfileData && typeof window.loadUserProfileData === 'function') {
                        window.loadUserProfileData();
                    }
                }, 500);
            } else {
                throw new Error('Failed to update profile picture');
            }
        } catch (error) {
            console.error('❌ Error updating emoji profile picture:', error);
            alert('Error updating profile picture');
        }
    };
}

// Expose function globally
window.changeProfilePicture = changeProfilePicture;
console.log('✅ changeProfilePicture exposed to window:', typeof window.changeProfilePicture);

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
                <h2 style="color: white; margin: 0;">VIB3 Studio</h2>
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
                        🏆 VIB3 Studio
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
    
    // VIB3 Studio Functions
    window.closeModal = () => modal.remove();
    window.showDetailedAnalytics = () => showNotification('Detailed analytics coming soon!', 'info');
    window.scheduleContent = () => showNotification('Content scheduling coming soon!', 'info');
    window.bulkUpload = () => showNotification('Bulk upload coming soon!', 'info');
    window.editDrafts = () => showNotification('Draft management coming soon!', 'info');
    window.videoEditor = () => showNotification('Video editor coming soon!', 'info');
    window.viewEarnings = () => showNotification('Earnings details coming soon!', 'info');
    window.creatorFund = () => showNotification('VIB3 Studio application coming soon!', 'info');
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

// IMMEDIATE TEST - Add a test function to global scope
window.testProfilePictureClick = function() {
    alert('TEST FUNCTION WORKS! The problem is somewhere else.');
    console.log('🧪 TEST FUNCTION EXECUTED');
};

// Force log the function status immediately
console.log('🔧 PROFILE-FUNCTIONS.JS STATUS CHECK:');
console.log('  - changeProfilePicture function exists:', typeof window.changeProfilePicture);
console.log('  - testProfilePictureClick function exists:', typeof window.testProfilePictureClick);

// Test changeProfilePicture directly
setTimeout(() => {
    console.log('🧪 TESTING changeProfilePicture function directly...');
    try {
        // Don't actually call it, just verify it exists and log its source
        console.log('🧪 Function source preview:', window.changeProfilePicture.toString().substring(0, 200));
    } catch (e) {
        console.error('🧪 Function test failed:', e);
    }
}, 1000);