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
                    <textarea id="editBio" style="width: 100%; padding: 12px; border: 1px solid #666; border-radius: 6px; background: #333; color: white; min-height: 80px; resize: vertical;">Creator | Dancer | Music Lover ✨ Living my best life through dance 💃 Follow for daily vibes!</textarea>
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
    console.log('📸 Quick upload - profile picture clicked');
    
    // Create hidden file input for quick upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleProfileImageUpload(file);
        }
        fileInput.remove();
    };
    
    // Show the modal with upload options
    showProfilePictureModal(fileInput);
}

function showProfilePictureModal(quickFileInput) {
    const emojis = ['👤', '😀', '😎', '🤩', '🥳', '🦄', '🌟', '💫', '🎵', '🎭', '🎨', '🏆'];
    const currentPicture = document.getElementById('profilePicture');
    const currentEmoji = currentPicture?.textContent || '👤';
    
    // Create profile picture picker modal
    const modal = document.createElement('div');
    modal.id = 'profilePictureModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); z-index: 9999; display: flex; 
        align-items: center; justify-content: center; backdrop-filter: blur(2px);
    `;
    
    modal.innerHTML = `
        <div style="background: #222; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
            <h3 style="color: white; margin-bottom: 20px;">Choose Profile Picture</h3>
            
            <!-- Quick Upload Button -->
            <button onclick="triggerQuickUpload()" style="width: 100%; padding: 20px; background: #fe2c55; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin-bottom: 20px; font-size: 18px;">
                📷 Upload New Photo
            </button>
            
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
    
    // Setup quick upload trigger
    window.triggerQuickUpload = () => {
        quickFileInput.click();
    };
}

async function handleProfileImageUpload(file) {
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
        
        // Use EXACT same approach as video upload
        const formData = new FormData();
        formData.append('profileImage', file);
        
        // Add user information
        const currentUser = window.currentUser;
        if (currentUser) {
            const username = currentUser.username || 
                           currentUser.displayName || 
                           currentUser.name ||
                           currentUser.email?.split('@')[0] || 
                           'user';
            formData.append('username', username);
            formData.append('userId', currentUser.id || currentUser._id || currentUser.uid || '');
        }
        
        const response = await fetch(`${window.API_BASE_URL}/api/user/profile-image`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                ...(window.authToken && window.authToken !== 'session-based' ? 
                    { 'Authorization': `Bearer ${window.authToken}` } : {})
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            const imageUrl = data.profilePictureUrl || data.profileImageUrl || data.profileImage;
            
            if (imageUrl) {
                updateProfilePictureDisplay(imageUrl);
                
                // Update current user data
                if (window.currentUser) {
                    window.currentUser.profileImage = imageUrl;
                    window.currentUser.profilePicture = null;
                }
                
                // Close modal
                const modal = document.getElementById('profilePictureModal');
                if (modal) modal.remove();
                
                showNotification('Profile picture updated!', 'success');
            }
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error('❌ Profile picture upload error:', error);
        alert('Error uploading profile picture');
    }
}

function updateProfilePictureDisplay(imageUrl) {
    const profilePicEl = document.getElementById('profilePicture');
    if (profilePicEl) {
        // Preserve all original styling while adding the background image
        profilePicEl.style.backgroundImage = `url(${imageUrl})`;
        profilePicEl.style.backgroundSize = 'cover';
        profilePicEl.style.backgroundPosition = 'center';
        profilePicEl.style.backgroundRepeat = 'no-repeat';
        // Ensure the element maintains its circular shape and size
        profilePicEl.style.width = '140px';
        profilePicEl.style.height = '140px';
        profilePicEl.style.borderRadius = '50%';
        profilePicEl.style.display = 'flex';
        profilePicEl.style.alignItems = 'center';
        profilePicEl.style.justifyContent = 'center';
        profilePicEl.textContent = '';
    }
    
    // Update other profile picture elements
    const specificProfileEls = document.querySelectorAll('.profile-picture, .user-avatar, .profile-pic-small');
    specificProfileEls.forEach((el) => {
        el.style.backgroundImage = `url(${imageUrl})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        if (el.textContent && el.textContent.match(/[👤😀😎🤩🥳🦄🌟💫🎵🎭🎨🏆]/)) {
            el.textContent = '';
        }
    });
}

// Global functions for modal interaction
window.closePictureModal = () => {
    const modal = document.getElementById('profilePictureModal');
    if (modal) modal.remove();
};

window.selectProfilePicture = async (emoji) => {
    try {
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
                window.currentUser.profileImage = null;
            }
            
            // Update UI
            const profilePicEl = document.getElementById('profilePicture');
            if (profilePicEl) {
                profilePicEl.style.backgroundImage = '';
                profilePicEl.textContent = emoji;
            }
            
            const modal = document.getElementById('profilePictureModal');
            if (modal) modal.remove();
            
            showNotification('Profile picture updated!', 'success');
        } else {
            throw new Error('Failed to update profile picture');
        }
    } catch (error) {
        console.error('❌ Error updating emoji profile picture:', error);
        alert('Error updating profile picture');
    }
};

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
    const currentUser = window.currentUser || { username: 'vib3user' };
    // Create a profile URL that will show the profile page when visited
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const profileUrl = `${baseUrl}?user=${currentUser.username || currentUser.id}`;
    
    // Create QR code share modal
    const modal = document.createElement('div');
    modal.id = 'shareProfileModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); z-index: 9999; display: flex; 
        align-items: center; justify-content: center; backdrop-filter: blur(2px);
    `;
    
    modal.innerHTML = `
        <div style="background: #222; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%; text-align: center;">
            <h3 style="color: white; margin-bottom: 20px;">Share Profile</h3>
            
            <!-- QR Code -->
            <div id="qrCodeContainer" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: center; align-items: center;">
                <div id="qrCodeDiv" style="width: 200px; height: 200px;"></div>
            </div>
            
            <!-- Profile URL -->
            <div style="background: #333; padding: 15px; border-radius: 8px; margin-bottom: 20px; word-break: break-all;">
                <div style="color: #888; font-size: 12px; margin-bottom: 5px;">Profile Link:</div>
                <div id="profileUrl" style="color: white; font-size: 14px;">${profileUrl}</div>
            </div>
            
            <!-- Action Buttons -->
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button onclick="copyProfileLink('${profileUrl}')" style="flex: 1; background: #fe2c55; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    📋 Copy Link
                </button>
                <button onclick="shareProfileNative('${profileUrl}')" style="flex: 1; background: #666; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    📤 Share
                </button>
            </div>
            
            <button onclick="closeShareModal()" style="background: #444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Generate QR code using external API
    generateQRCodeAPI(profileUrl, 'qrCodeDiv');
    
    // Setup modal functions
    window.closeShareModal = () => modal.remove();
    
    window.copyProfileLink = (url) => {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Profile link copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('Profile link copied!', 'success');
        });
    };
    
    window.shareProfileNative = (url) => {
        // Close the QR modal first
        const qrModal = document.getElementById('shareProfileModal');
        if (qrModal) qrModal.remove();
        
        // Use the same share modal as videos for consistency
        if (window.openShareModal) {
            // Create a temporary video-like object for the share modal
            const profileShareData = {
                id: 'profile-' + (currentUser?.username || currentUser?.id || 'user'),
                title: 'Check out my VIB3 profile!',
                url: url,
                isProfile: true
            };
            
            // Use the video share modal but with profile data
            openCustomShareModal(profileShareData);
        } else {
            // Fallback to copy if share modal not available
            window.copyProfileLink(url);
        }
    };
}

// Custom share modal that matches video sharing style
function openCustomShareModal(shareData) {
    console.log('📱 Creating TikTok-style share modal for profile:', shareData.id);
    
    // Remove any existing modals first
    document.querySelectorAll('[id^="vib3-share-modal"]').forEach(m => m.remove());
    
    const modal = document.createElement('div');
    modal.id = 'vib3-share-modal-' + Date.now();
    
    // Apply same styles as video share modal
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.zIndex = '2147483647';
    modal.style.display = 'flex';
    modal.style.alignItems = 'flex-end';
    modal.style.justifyContent = 'center';
    modal.style.pointerEvents = 'all';
    
    const content = document.createElement('div');
    content.style.backgroundColor = '#161823';
    content.style.borderRadius = '20px 20px 0 0';
    content.style.padding = '24px';
    content.style.width = '100%';
    content.style.maxWidth = '400px';
    content.style.color = 'white';
    content.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    
    content.innerHTML = `
        <div style="width: 40px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin: 0 auto 20px;"></div>
        <h3 style="margin: 0 0 25px 0; color: white; font-size: 20px; font-weight: 600;">Share Profile</h3>
        
        <div id="shareOptionsGrid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px;">
            <!-- Initial options -->
            <button onclick="copyToClipboard('${shareData.url}')" style="text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px;">
                <div style="width: 45px; height: 45px; background: #fe2c55; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">📋</div>
                <span style="color: white; font-size: 11px; display: block;">Copy Link</span>
            </button>
            
            <button onclick="shareToWhatsApp('${shareData.url}')" style="text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px;">
                <div style="width: 45px; height: 45px; background: #25d366; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">📱</div>
                <span style="color: white; font-size: 11px; display: block;">WhatsApp</span>
            </button>
            
            <button onclick="shareToTwitter('${shareData.url}')" style="text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px;">
                <div style="width: 45px; height: 45px; background: #1da1f2; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">🐦</div>
                <span style="color: white; font-size: 11px; display: block;">Twitter</span>
            </button>
            
            <button onclick="toggleMoreOptions('${shareData.url}')" style="text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px;">
                <div style="width: 45px; height: 45px; background: #666; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">⋯</div>
                <span style="color: white; font-size: 11px; display: block;">More</span>
            </button>
        </div>
        
        <!-- Hidden additional options -->
        <div id="moreShareOptions" style="display: none; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px;">
            <button onclick="shareToFacebook('${shareData.url}')" style="text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px;">
                <div style="width: 45px; height: 45px; background: #4267b2; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">📘</div>
                <span style="color: white; font-size: 11px; display: block;">Facebook</span>
            </button>
            
            <button onclick="shareToInstagram('${shareData.url}')" style="text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px;">
                <div style="width: 45px; height: 45px; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">📷</div>
                <span style="color: white; font-size: 11px; display: block;">Instagram</span>
            </button>
            
            <button onclick="shareToTelegram('${shareData.url}')" style="text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px;">
                <div style="width: 45px; height: 45px; background: #0088cc; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">✈️</div>
                <span style="color: white; font-size: 11px; display: block;">Telegram</span>
            </button>
            
            <button onclick="shareToSnapchat('${shareData.url}')" style="text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px;">
                <div style="width: 45px; height: 45px; background: #fffc00; color: black; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">👻</div>
                <span style="color: white; font-size: 11px; display: block;">Snapchat</span>
            </button>
            
            <button onclick="shareToReddit('${shareData.url}')" style="text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px;">
                <div style="width: 45px; height: 45px; background: #ff4500; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">🤖</div>
                <span style="color: white; font-size: 11px; display: block;">Reddit</span>
            </button>
            
            <button onclick="shareToLinkedIn('${shareData.url}')" style="text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px;">
                <div style="width: 45px; height: 45px; background: #0077b5; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">💼</div>
                <span style="color: white; font-size: 11px; display: block;">LinkedIn</span>
            </button>
            
            <button onclick="shareViaSMS('${shareData.url}')" style="text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px;">
                <div style="width: 45px; height: 45px; background: #00d4aa; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">💬</div>
                <span style="color: white; font-size: 11px; display: block;">SMS</span>
            </button>
            
            <button onclick="shareViaEmail('${shareData.url}')" style="text-align: center; cursor: pointer; padding: 12px; background: none; border: none; border-radius: 12px;">
                <div style="width: 45px; height: 45px; background: #ea4335; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 20px;">📧</div>
                <span style="color: white; font-size: 11px; display: block;">Email</span>
            </button>
        </div>
        
        <button onclick="closeShareModal()" style="width: 100%; padding: 16px; background: rgba(255,255,255,0.1); border: none; border-radius: 12px; color: white; font-size: 16px; cursor: pointer;">
            Cancel
        </button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Add click outside to close
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    // Global functions for share actions
    window.copyToClipboard = (url) => {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Profile link copied!', 'success');
            modal.remove();
        });
    };
    
    window.toggleMoreOptions = (url) => {
        const moreOptions = document.getElementById('moreShareOptions');
        if (moreOptions.style.display === 'none') {
            moreOptions.style.display = 'grid';
        } else {
            moreOptions.style.display = 'none';
        }
    };
    
    window.shareToWhatsApp = (url) => {
        const text = encodeURIComponent('Check out my VIB3 profile! ' + url);
        window.open(`https://wa.me/?text=${text}`, '_blank');
        modal.remove();
    };
    
    window.shareToTwitter = (url) => {
        const text = encodeURIComponent('Check out my VIB3 profile!');
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
        modal.remove();
    };
    
    window.shareToFacebook = (url) => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        modal.remove();
    };
    
    window.shareToInstagram = (url) => {
        // Instagram doesn't support direct web sharing, copy link instead
        window.copyToClipboard(url);
        showNotification('Link copied! Share it on Instagram', 'info');
        modal.remove();
    };
    
    window.shareToTelegram = (url) => {
        const text = encodeURIComponent('Check out my VIB3 profile!');
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`, '_blank');
        modal.remove();
    };
    
    window.shareToSnapchat = (url) => {
        // Snapchat web sharing
        window.open(`https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`, '_blank');
        modal.remove();
    };
    
    window.shareToReddit = (url) => {
        const title = encodeURIComponent('Check out my VIB3 profile!');
        window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${title}`, '_blank');
        modal.remove();
    };
    
    window.shareToLinkedIn = (url) => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        modal.remove();
    };
    
    window.shareViaSMS = (url) => {
        const text = encodeURIComponent('Check out my VIB3 profile! ' + url);
        window.open(`sms:?body=${text}`, '_self');
        modal.remove();
    };
    
    window.shareViaEmail = (url) => {
        const subject = encodeURIComponent('Check out my VIB3 profile!');
        const body = encodeURIComponent(`Hey! Check out my VIB3 profile: ${url}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
        modal.remove();
    };
    
    window.closeShareModal = () => modal.remove();
}

// QR Code generator using API service
function generateQRCodeAPI(text, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Use QR Server API (free service)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
    
    const img = document.createElement('img');
    img.src = qrUrl;
    img.style.width = '200px';
    img.style.height = '200px';
    img.style.display = 'block';
    img.alt = 'QR Code for profile';
    
    // Add loading state
    container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; width: 200px; height: 200px; color: #666;">Loading QR...</div>';
    
    img.onload = () => {
        container.innerHTML = '';
        container.appendChild(img);
    };
    
    img.onerror = () => {
        // Fallback to text-based QR if image fails
        container.innerHTML = `
            <div style="width: 200px; height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid #ccc; background: #f5f5f5;">
                <div style="font-size: 40px; margin-bottom: 10px;">📱</div>
                <div style="font-size: 12px; color: #666; text-align: center; padding: 10px;">
                    QR Code<br>
                    <small>Scan with camera</small>
                </div>
            </div>
        `;
    };
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