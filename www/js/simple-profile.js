// Simple Profile Page for Testing

function createSimpleProfilePage() {
    console.log('🔧 Creating comprehensive VIB3 profile page...');
    
    // Remove any existing profile page
    const existingProfile = document.getElementById('profilePage');
    if (existingProfile) {
        existingProfile.remove();
    }
    
    // Get current user data
    const user = window.currentUser || { 
        email: 'user@example.com',
        username: 'vib3user',
        bio: 'Welcome to my VIB3!',
        profilePicture: '👤',
        stats: {
            following: 0,
            followers: 0,
            likes: 0,
            videos: 0
        }
    };
    
    // Load user profile data
    if (window.authToken) {
        loadUserProfileData();
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
        overflow-y: auto;
    `;
    
    profilePage.innerHTML = `
        <!-- Profile Header -->
        <div style="background: linear-gradient(135deg, #fe2c55 0%, #ff006e 100%); padding: 40px 50px; position: relative;">
            <!-- Back Button -->
            <button onclick="goBackToFeed();" style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.5); color: white; border: none; padding: 12px; border-radius: 50%; cursor: pointer; font-size: 18px; width: 44px; height: 44px;">
                ←
            </button>
            
            <!-- Settings Button -->
            <button onclick="openProfileSettings()" style="position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.5); color: white; border: none; padding: 12px; border-radius: 50%; cursor: pointer; font-size: 18px; width: 44px; height: 44px;">
                ⚙️
            </button>
            
            <!-- Profile Info -->
            <div style="display: flex; align-items: center; gap: 30px; max-width: 1000px; margin: 0 auto;">
                <div style="position: relative;">
                    <div id="profilePicture" style="width: 140px; height: 140px; background: linear-gradient(135deg, #333, #666); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 60px; border: 4px solid rgba(255,255,255,0.2); cursor: pointer;" onclick="changeProfilePicture()">
                        ${user.profilePicture || '👤'}
                    </div>
                    <button onclick="changeProfilePicture()" style="position: absolute; bottom: 0; right: 0; background: #fe2c55; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 16px; cursor: pointer;">
                        📷
                    </button>
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <h1 id="profileUsername" style="font-size: 36px; margin: 0; cursor: pointer;" onclick="editUsername()">@${user.username || 'vib3user'}</h1>
                        <button onclick="editUsername()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            Edit
                        </button>
                    </div>
                    <div id="profileBio" style="font-size: 16px; margin-bottom: 20px; line-height: 1.5; cursor: pointer; min-height: 24px;" onclick="editBio()">
                        ${user.bio || 'Welcome to my VIB3!'}
                    </div>
                    <div style="display: flex; gap: 30px; margin-bottom: 20px;">
                        <div onclick="showFollowing()" style="cursor: pointer; text-align: center;">
                            <strong id="followingCount" style="font-size: 24px; display: block;">${user.stats?.following || 0}</strong>
                            <span style="color: rgba(255,255,255,0.7);">Following</span>
                        </div>
                        <div onclick="showFollowers()" style="cursor: pointer; text-align: center;">
                            <strong id="followersCount" style="font-size: 24px; display: block;">${user.stats?.followers || 0}</strong>
                            <span style="color: rgba(255,255,255,0.7);">Followers</span>
                        </div>
                        <div style="cursor: pointer; text-align: center;">
                            <strong id="likesCount" style="font-size: 24px; display: block;">${user.stats?.likes || 0}</strong>
                            <span style="color: rgba(255,255,255,0.7);">Likes</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 15px;">
                        <button onclick="editProfile()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            Edit Profile
                        </button>
                        <button onclick="shareProfile()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            Share Profile
                        </button>
                        <button onclick="openCreatorTools()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            Creator Tools
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Profile Content Tabs -->
        <div style="background: #161823; padding: 0 50px;">
            <div style="display: flex; border-bottom: 1px solid #333; max-width: 1000px; margin: 0 auto;">
                <button id="videosTab" class="profile-tab active" onclick="switchProfileTab('videos')" style="padding: 15px 20px; background: none; border: none; color: #fe2c55; font-weight: 600; cursor: pointer; border-bottom: 2px solid #fe2c55;">
                    Videos
                </button>
                <button id="likedTab" class="profile-tab" onclick="switchProfileTab('liked')" style="padding: 15px 20px; background: none; border: none; color: #666; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent;">
                    Liked
                </button>
                <button id="favoritesTab" class="profile-tab" onclick="switchProfileTab('favorites')" style="padding: 15px 20px; background: none; border: none; color: #666; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent;">
                    Favorites
                </button>
                <button id="followingTab" class="profile-tab" onclick="switchProfileTab('following')" style="padding: 15px 20px; background: none; border: none; color: #666; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent;">
                    Following
                </button>
            </div>
        </div>
        
        <!-- Profile Content -->
        <div style="padding: 30px 50px; max-width: 1000px; margin: 0 auto;">
            <!-- Videos Grid -->
            <div id="videosContent" class="profile-content">
                <div style="text-align: center; padding: 60px 20px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📹</div>
                    <h3 style="margin-bottom: 10px;">Loading videos...</h3>
                    <p>Your videos will appear here</p>
                </div>
            </div>
            
            <!-- Liked Videos -->
            <div id="likedContent" class="profile-content" style="display: none;">
                <div style="text-align: center; padding: 60px 20px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 20px;">❤️</div>
                    <h3 style="margin-bottom: 10px;">Liked videos</h3>
                    <p>Videos you liked will appear here</p>
                    <div style="display: flex; align-items: center; gap: 10px; justify-content: center; margin-top: 20px;">
                        <input type="checkbox" id="likedPrivacyToggle" onchange="toggleLikedPrivacy()">
                        <label for="likedPrivacyToggle" style="color: #666;">Make liked videos private</label>
                    </div>
                </div>
            </div>
            
            <!-- Favorites -->
            <div id="favoritesContent" class="profile-content" style="display: none;">
                <div style="text-align: center; padding: 60px 20px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 20px;">⭐</div>
                    <h3 style="margin-bottom: 10px;">Favorite videos</h3>
                    <p>Your favorite videos will appear here</p>
                </div>
            </div>
            
            <!-- Following Feed -->
            <div id="followingContent" class="profile-content" style="display: none;">
                <div style="text-align: center; padding: 60px 20px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📱</div>
                    <h3 style="margin-bottom: 10px;">Following Feed</h3>
                    <p>Posts from people you follow will appear here</p>
                </div>
            </div>
        </div>
    `;
    
    // Hide all other content
    document.querySelectorAll('.video-feed, #mainApp, .search-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page, .activity-page, .friends-page').forEach(el => {
        el.style.display = 'none';
    });
    
    // Add to body
    document.body.appendChild(profilePage);
    
    console.log('✅ Comprehensive profile page created and shown');
    return profilePage;
}

// Real-time profile data functions
// Get the API base URL - use same server as main feed
function getAPIBaseURL() {
    // Use current server (same as main feed) instead of hard-coded Railway URL
    // This ensures we authenticate with the same MongoDB server that issued our token
    return '';
}

async function loadUserProfileData() {
    try {
        const baseURL = getAPIBaseURL();
        const response = await fetch(`${baseURL}/api/user/profile`, {
            headers: window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {}
        });
        
        if (response.ok) {
            const data = await response.json();
            updateProfileDisplay(data);
            loadUserVideos();
            loadUserStats();
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

async function loadUserVideos() {
    try {
        const baseURL = getAPIBaseURL();
        const response = await fetch(`${baseURL}/api/user/videos`, {
            headers: window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {}
        });
        
        if (response.ok) {
            const videos = await response.json();
            displayUserVideos(videos);
        }
    } catch (error) {
        console.error('Error loading user videos:', error);
    }
}

async function loadUserStats() {
    try {
        const baseURL = getAPIBaseURL();
        const response = await fetch(`${baseURL}/api/user/stats`, {
            headers: window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {}
        });
        
        if (response.ok) {
            const stats = await response.json();
            updateStatsDisplay(stats);
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

function updateProfileDisplay(userData) {
    // Update username
    const usernameEl = document.getElementById('profileUsername');
    if (usernameEl && userData.username) {
        usernameEl.textContent = `@${userData.username}`;
    }
    
    // Update bio
    const bioEl = document.getElementById('profileBio');
    if (bioEl && userData.bio) {
        bioEl.textContent = userData.bio;
    }
    
    // Update profile picture
    const profilePicEl = document.getElementById('profilePicture');
    if (profilePicEl && userData.profilePicture) {
        profilePicEl.textContent = userData.profilePicture;
    }
}

function updateStatsDisplay(stats) {
    if (stats.following !== undefined) {
        document.getElementById('followingCount').textContent = formatNumber(stats.following);
    }
    if (stats.followers !== undefined) {
        document.getElementById('followersCount').textContent = formatNumber(stats.followers);
    }
    if (stats.likes !== undefined) {
        document.getElementById('likesCount').textContent = formatNumber(stats.likes);
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function displayUserVideos(videos) {
    const videosContent = document.getElementById('videosContent');
    if (!videosContent) return;
    
    if (videos.length === 0) {
        videosContent.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 20px;">📹</div>
                <h3 style="margin-bottom: 10px;">No videos yet</h3>
                <p>Upload your first video to get started!</p>
                <button onclick="showUploadModal()" style="background: #fe2c55; color: white; border: none; padding: 12px 24px; border-radius: 8px; margin-top: 20px; cursor: pointer;">
                    Upload Video
                </button>
            </div>
        `;
    } else {
        videosContent.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                ${videos.map(video => createVideoCard(video)).join('')}
            </div>
        `;
    }
}

function createVideoCard(video) {
    return `
        <div style="background: #222; border-radius: 8px; overflow: hidden; cursor: pointer; position: relative; aspect-ratio: 9/16;" onclick="playUserVideo('${video._id}')">
            ${video.thumbnail ? 
                `<img src="${video.thumbnail}" style="width: 100%; height: 100%; object-fit: cover;">` :
                `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #333, #555); display: flex; align-items: center; justify-content: center; font-size: 48px;">
                    🎵
                </div>`
            }
            <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${formatDuration(video.duration)}
            </div>
            <div style="position: absolute; bottom: 8px; left: 8px; color: white; font-size: 12px; background: rgba(0,0,0,0.8); padding: 4px 8px; border-radius: 4px;">
                ${formatNumber(video.views || 0)}
            </div>
        </div>
    `;
}

function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

// Profile interaction functions
function switchProfileTab(tab) {
    // Update tab styles
    document.querySelectorAll('.profile-tab').forEach(t => {
        t.style.color = '#666';
        t.style.borderBottomColor = 'transparent';
    });
    
    const activeTab = document.getElementById(tab + 'Tab');
    if (activeTab) {
        activeTab.style.color = '#fe2c55';
        activeTab.style.borderBottomColor = '#fe2c55';
    }
    
    // Show/hide content
    document.querySelectorAll('.profile-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const activeContent = document.getElementById(tab + 'Content');
    if (activeContent) {
        activeContent.style.display = 'block';
    }
    
    // Load content for the selected tab
    switch(tab) {
        case 'videos':
            loadUserVideos();
            break;
        case 'liked':
            loadLikedVideos();
            break;
        case 'favorites':
            loadFavoriteVideos();
            break;
        case 'following':
            loadFollowingFeed();
            break;
    }
}

async function editBio() {
    const bioElement = document.getElementById('profileBio');
    const currentBio = bioElement.textContent;
    
    const newBio = prompt('Edit your bio:', currentBio);
    if (newBio !== null && newBio.trim() !== '') {
        try {
            const baseURL = getAPIBaseURL();
            const response = await fetch(`${baseURL}/api/user/profile`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${window.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bio: newBio.trim() })
            });
            
            if (response.ok) {
                bioElement.textContent = newBio;
                showNotification('Bio updated!', 'success');
            } else {
                showNotification('Failed to update bio', 'error');
            }
        } catch (error) {
            console.error('Error updating bio:', error);
            showNotification('Error updating bio', 'error');
        }
    }
}

async function editUsername() {
    const usernameElement = document.getElementById('profileUsername');
    const currentUsername = usernameElement.textContent.replace('@', '');
    
    const newUsername = prompt('Edit your username:', currentUsername);
    if (newUsername !== null && newUsername.trim() !== '') {
        const cleanUsername = newUsername.trim().replace('@', '').toLowerCase();
        
        try {
            const baseURL = getAPIBaseURL();
            const response = await fetch(`${baseURL}/api/user/profile`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${window.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: cleanUsername })
            });
            
            if (response.ok) {
                usernameElement.textContent = '@' + cleanUsername;
                showNotification('Username updated!', 'success');
            } else {
                const data = await response.json();
                showNotification(data.error || 'Username unavailable', 'error');
            }
        } catch (error) {
            console.error('Error updating username:', error);
            showNotification('Error updating username', 'error');
        }
    }
}

async function changeProfilePicture() {
    const emojis = ['👤', '😀', '😎', '🤩', '🥳', '🦄', '🌟', '💫', '🎵', '🎭', '🎨', '🏆'];
    const currentEmoji = document.getElementById('profilePicture').textContent;
    
    // Create emoji picker modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 2000; display: flex; 
        align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: #222; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
            <h3 style="color: white; margin-bottom: 20px;">Choose Profile Picture</h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                ${emojis.map(emoji => `
                    <button onclick="selectProfilePicture('${emoji}')" style="width: 60px; height: 60px; font-size: 30px; background: ${emoji === currentEmoji ? '#fe2c55' : '#333'}; border: none; border-radius: 12px; cursor: pointer; color: white;">
                        ${emoji}
                    </button>
                `).join('')}
            </div>
            <button onclick="closePictureModal()" style="background: #666; color: white; border: none; padding: 12px 24px; border-radius: 8px; width: 100%; margin-top: 20px; cursor: pointer;">
                Cancel
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    window.closePictureModal = () => modal.remove();
    
    window.selectProfilePicture = async (emoji) => {
        try {
            const baseURL = getAPIBaseURL();
            const response = await fetch(`${baseURL}/api/user/profile`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${window.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ profilePicture: emoji })
            });
            
            if (response.ok) {
                document.getElementById('profilePicture').textContent = emoji;
                showNotification('Profile picture updated!', 'success');
                modal.remove();
            } else {
                showNotification('Failed to update profile picture', 'error');
            }
        } catch (error) {
            console.error('Error updating profile picture:', error);
            showNotification('Error updating profile picture', 'error');
        }
    };
}

function openProfileSettings() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 2000; display: flex; 
        align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: #222; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
            <h2 style="color: white; margin-bottom: 20px;">Profile Settings</h2>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <button onclick="editProfile(); closeModal()" style="background: #333; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                    Edit Profile Info
                </button>
                <button onclick="openPrivacySettings(); closeModal()" style="background: #333; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                    Privacy & Safety
                </button>
                <button onclick="openAccountSettings(); closeModal()" style="background: #333; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                    Account Settings
                </button>
                <button onclick="openCreatorTools(); closeModal()" style="background: #333; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                    Creator Tools
                </button>
                <button onclick="switchAccount(); closeModal()" style="background: #333; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                    Switch Account
                </button>
                <button onclick="closeModal()" style="background: #fe2c55; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; margin-top: 10px;">
                    Close
                </button>
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
}

async function showFollowing() {
    try {
        const baseURL = getAPIBaseURL();
        const response = await fetch(`${baseURL}/api/user/following`, {
            headers: { 'Authorization': `Bearer ${window.authToken}` }
        });
        
        if (response.ok) {
            const following = await response.json();
            showFollowModal('Following', following);
        } else {
            showFollowModal('Following', []);
        }
    } catch (error) {
        console.error('Error loading following:', error);
        showFollowModal('Following', []);
    }
}

async function showFollowers() {
    try {
        const baseURL = getAPIBaseURL();
        const response = await fetch(`${baseURL}/api/user/followers`, {
            headers: { 'Authorization': `Bearer ${window.authToken}` }
        });
        
        if (response.ok) {
            const followers = await response.json();
            showFollowModal('Followers', followers);
        } else {
            showFollowModal('Followers', []);
        }
    } catch (error) {
        console.error('Error loading followers:', error);
        showFollowModal('Followers', []);
    }
}

function showFollowModal(title, users) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 2000; display: flex; 
        align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: #222; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: white; margin: 0;">${title}</h2>
                <button onclick="closeModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">×</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${users.length === 0 ? `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <p>No ${title.toLowerCase()} yet</p>
                    </div>
                ` : users.map(user => `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; background: #333;">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #fe2c55, #ff006e); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                            ${user.profilePicture || user.avatar || '👤'}
                        </div>
                        <div style="flex: 1;">
                            <div style="color: white; font-weight: 600;">@${user.username}</div>
                            <div style="color: #999; font-size: 14px;">${user.bio || user.name || ''} • ${formatNumber(user.followers || 0)} followers</div>
                        </div>
                        <button onclick="toggleFollow('${user._id || user.username}', this)" style="background: ${user.isFollowing ? '#333' : '#fe2c55'}; color: white; border: ${user.isFollowing ? '1px solid #666' : 'none'}; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                            ${user.isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>
                `).join('')}
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
}

function toggleLikedPrivacy() {
    const checkbox = document.getElementById('likedPrivacyToggle');
    const message = checkbox.checked ? 'Liked videos are now private' : 'Liked videos are now public';
    showNotification(message, 'success');
}

function playVideo(videoId) {
    showNotification(`Playing video ${videoId}`, 'info');
}

function openPrivacySettings() {
    showNotification('Privacy settings functionality coming soon!', 'info');
}

function openAccountSettings() {
    showNotification('Account settings functionality coming soon!', 'info');
}

function switchAccount() {
    showNotification('Switch account functionality coming soon!', 'info');
}

function likePost(userId) {
    showNotification(`Liked ${userId}'s post!`, 'success');
}

function commentOnPost(userId) {
    const comment = prompt(`Comment on ${userId}'s post:`);
    if (comment && comment.trim()) {
        showNotification('Comment posted!', 'success');
    }
}

function sharePost(userId) {
    showNotification(`Shared ${userId}'s post!`, 'success');
}

async function toggleFollow(userId, button) {
    const isFollowing = button.textContent.trim() === 'Following';
    
    try {
        const baseURL = getAPIBaseURL();
        const response = await fetch(`${baseURL}/api/user/${isFollowing ? 'unfollow' : 'follow'}/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${window.authToken}` }
        });
        
        if (response.ok) {
            button.textContent = isFollowing ? 'Follow' : 'Following';
            button.style.background = isFollowing ? '#fe2c55' : '#333';
            button.style.border = isFollowing ? 'none' : '1px solid #666';
            showNotification(isFollowing ? 'Unfollowed' : 'Following!', 'success');
            
            // Update follower count
            loadUserStats();
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
        showNotification('Error updating follow status', 'error');
    }
}

function playUserVideo(videoId) {
    // Close profile and play video
    goBackToFeed();
    // Play specific video
    if (window.playVideo) {
        window.playVideo(videoId);
    }
}

async function loadLikedVideos() {
    try {
        const baseURL = getAPIBaseURL();
        const response = await fetch(`${baseURL}/api/user/liked-videos`, {
            headers: { 'Authorization': `Bearer ${window.authToken}` }
        });
        
        if (response.ok) {
            const videos = await response.json();
            displayLikedVideos(videos);
        }
    } catch (error) {
        console.error('Error loading liked videos:', error);
    }
}

function displayLikedVideos(videos) {
    const likedContent = document.getElementById('likedContent');
    if (!likedContent) return;
    
    if (videos.length === 0) {
        likedContent.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 20px;">❤️</div>
                <h3 style="margin-bottom: 10px;">Liked videos</h3>
                <p>Videos you liked will appear here</p>
                <div style="display: flex; align-items: center; gap: 10px; justify-content: center; margin-top: 20px;">
                    <input type="checkbox" id="likedPrivacyToggle" onchange="toggleLikedPrivacy()">
                    <label for="likedPrivacyToggle" style="color: #666;">Make liked videos private</label>
                </div>
            </div>
        `;
    } else {
        likedContent.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                ${videos.map(video => createVideoCard(video)).join('')}
            </div>
            <div style="display: flex; align-items: center; gap: 10px; justify-content: center; margin-top: 20px;">
                <input type="checkbox" id="likedPrivacyToggle" onchange="toggleLikedPrivacy()">
                <label for="likedPrivacyToggle" style="color: #666;">Make liked videos private</label>
            </div>
        `;
    }
}

async function loadFavoriteVideos() {
    try {
        const baseURL = getAPIBaseURL();
        const response = await fetch(`${baseURL}/api/user/favorites`, {
            headers: { 'Authorization': `Bearer ${window.authToken}` }
        });
        
        if (response.ok) {
            const videos = await response.json();
            displayFavoriteVideos(videos);
        }
    } catch (error) {
        console.error('Error loading favorite videos:', error);
    }
}

function displayFavoriteVideos(videos) {
    const favoritesContent = document.getElementById('favoritesContent');
    if (!favoritesContent) return;
    
    if (videos.length === 0) {
        favoritesContent.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 20px;">⭐</div>
                <h3 style="margin-bottom: 10px;">Favorite videos</h3>
                <p>Your favorite videos will appear here</p>
            </div>
        `;
    } else {
        favoritesContent.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                ${videos.map(video => createVideoCard(video)).join('')}
            </div>
        `;
    }
}

async function loadFollowingFeed() {
    try {
        const baseURL = getAPIBaseURL();
        const response = await fetch(`${baseURL}/api/feed/following`, {
            headers: { 'Authorization': `Bearer ${window.authToken}` }
        });
        
        if (response.ok) {
            const posts = await response.json();
            displayFollowingFeed(posts);
        }
    } catch (error) {
        console.error('Error loading following feed:', error);
    }
}

function displayFollowingFeed(posts) {
    const followingContent = document.getElementById('followingContent');
    if (!followingContent) return;
    
    if (posts.length === 0) {
        followingContent.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 20px;">📱</div>
                <h3 style="margin-bottom: 10px;">No posts yet</h3>
                <p>Posts from people you follow will appear here</p>
            </div>
        `;
    } else {
        followingContent.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 20px;">
                ${posts.map(post => createFollowingPost(post)).join('')}
            </div>
        `;
    }
}

function createFollowingPost(post) {
    return `
        <div style="background: #222; border-radius: 12px; padding: 20px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #fe2c55, #ff006e); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                    ${post.user?.profilePicture || '👤'}
                </div>
                <div style="flex: 1;">
                    <div style="color: white; font-weight: 600;">@${post.user?.username || 'user'}</div>
                    <div style="color: #999; font-size: 14px;">${post.user?.bio || ''} • ${formatTimeAgo(post.createdAt)}</div>
                </div>
                <button style="background: none; border: none; color: #666; font-size: 20px; cursor: pointer;">⋯</button>
            </div>
            <p style="color: white; margin-bottom: 15px; line-height: 1.5;">${post.description || ''}</p>
            ${post.thumbnail ? 
                `<img src="${post.thumbnail}" style="width: 100%; border-radius: 8px; margin-bottom: 15px; cursor: pointer;" onclick="playUserVideo('${post._id}')">` :
                `<div style="background: #333; border-radius: 8px; height: 200px; display: flex; align-items: center; justify-content: center; font-size: 64px; margin-bottom: 15px; cursor: pointer;" onclick="playUserVideo('${post._id}')">
                    🎵
                </div>`
            }
            <div style="display: flex; gap: 20px; color: #999;">
                <span style="cursor: pointer;" onclick="likePost('${post._id}')">❤️ ${formatNumber(post.likes || 0)}</span>
                <span style="cursor: pointer;" onclick="commentOnPost('${post._id}')">💬 ${formatNumber(post.comments || 0)}</span>
                <span style="cursor: pointer;" onclick="sharePost('${post._id}')">🔗 Share</span>
            </div>
        </div>
    `;
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'now';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    
    return date.toLocaleDateString();
}

// Make functions globally available
window.createSimpleProfilePage = createSimpleProfilePage;
window.goBackToFeed = goBackToFeed;
window.switchProfileTab = switchProfileTab;
window.editBio = editBio;
window.editUsername = editUsername;
window.changeProfilePicture = changeProfilePicture;
window.openProfileSettings = openProfileSettings;
window.showFollowing = showFollowing;
window.showFollowers = showFollowers;
window.toggleLikedPrivacy = toggleLikedPrivacy;
window.playVideo = playVideo;
window.openPrivacySettings = openPrivacySettings;
window.openAccountSettings = openAccountSettings;
window.switchAccount = switchAccount;
window.likePost = likePost;
window.commentOnPost = commentOnPost;
window.sharePost = sharePost;
window.toggleFollow = toggleFollow;
window.playUserVideo = playUserVideo;
window.loadUserProfileData = loadUserProfileData;
window.loadUserVideos = loadUserVideos;
window.loadUserStats = loadUserStats;
window.loadLikedVideos = loadLikedVideos;
window.loadFavoriteVideos = loadFavoriteVideos;
window.loadFollowingFeed = loadFollowingFeed;