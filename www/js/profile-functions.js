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
    const profileUrl = `${window.location.origin}${window.location.pathname}?profile=${currentUser.username || currentUser.id}`;
    
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
                <canvas id="qrCodeCanvas" width="200" height="200"></canvas>
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
    
    // Generate QR code
    generateQRCode(profileUrl, 'qrCodeCanvas');
    
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
        if (navigator.share) {
            navigator.share({
                title: 'Check out my VIB3 profile!',
                text: 'Follow me on VIB3 for awesome videos!',
                url: url
            });
        } else {
            // Fallback to copy
            window.copyProfileLink(url);
        }
    };
}

// Simple QR Code generator using canvas
function generateQRCode(text, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const size = 200;
    const cellSize = size / 25; // 25x25 grid for simple QR
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Generate simple QR-like pattern (this is a simplified version)
    // For production, you'd want to use a proper QR code library
    const qrData = generateSimpleQRPattern(text);
    
    ctx.fillStyle = '#000000';
    for (let row = 0; row < 25; row++) {
        for (let col = 0; col < 25; col++) {
            if (qrData[row] && qrData[row][col]) {
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }
    }
    
    // Add positioning squares (corners)
    drawPositioningSquare(ctx, 0, 0, cellSize);
    drawPositioningSquare(ctx, 18 * cellSize, 0, cellSize);
    drawPositioningSquare(ctx, 0, 18 * cellSize, cellSize);
}

function generateSimpleQRPattern(text) {
    // This is a simplified QR-like pattern generator
    // In production, use a proper QR code library like qrcode.js
    const size = 25;
    const pattern = Array(size).fill().map(() => Array(size).fill(false));
    
    // Create a pseudo-random pattern based on the text
    const hash = text.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    
    let seed = Math.abs(hash);
    
    // Fill pattern with pseudo-random data
    for (let row = 3; row < 22; row++) {
        for (let col = 3; col < 22; col++) {
            // Skip positioning areas
            if ((row < 9 && col < 9) || 
                (row < 9 && col > 15) || 
                (row > 15 && col < 9)) continue;
            
            seed = (seed * 9301 + 49297) % 233280;
            pattern[row][col] = (seed / 233280) > 0.5;
        }
    }
    
    return pattern;
}

function drawPositioningSquare(ctx, x, y, cellSize) {
    // Draw the corner positioning squares
    ctx.fillStyle = '#000000';
    // Outer square
    ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize);
    // Inner white square
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);
    // Center black square
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
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