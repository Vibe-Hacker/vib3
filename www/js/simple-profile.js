// Simple Profile Page for Testing

function createSimpleProfilePage() {
    console.log('🔧 Creating comprehensive VIB3 profile page...');
    
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
                        👤
                    </div>
                    <button onclick="changeProfilePicture()" style="position: absolute; bottom: 0; right: 0; background: #fe2c55; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 16px; cursor: pointer;">
                        📷
                    </button>
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <h1 id="profileUsername" style="font-size: 36px; margin: 0; cursor: pointer;" onclick="editUsername()">@vib3user</h1>
                        <button onclick="editUsername()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            Edit
                        </button>
                    </div>
                    <div id="profileBio" style="font-size: 16px; margin-bottom: 20px; line-height: 1.5; cursor: pointer; min-height: 24px;" onclick="editBio()">
                        Creator | Dancer | Music Lover ✨ Living my best life through dance 💃 Follow for daily vibes!
                    </div>
                    <div style="display: flex; gap: 30px; margin-bottom: 20px;">
                        <div onclick="showFollowing()" style="cursor: pointer; text-align: center;">
                            <strong style="font-size: 24px; display: block;">123</strong>
                            <span style="color: rgba(255,255,255,0.7);">Following</span>
                        </div>
                        <div onclick="showFollowers()" style="cursor: pointer; text-align: center;">
                            <strong style="font-size: 24px; display: block;">1.2K</strong>
                            <span style="color: rgba(255,255,255,0.7);">Followers</span>
                        </div>
                        <div style="cursor: pointer; text-align: center;">
                            <strong style="font-size: 24px; display: block;">5.6K</strong>
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
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                    ${generateVideoGrid()}
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
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    ${generateFollowingFeed()}
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

function generateVideoGrid() {
    const videos = [
        { id: 1, thumbnail: '🎵', title: 'Dance Challenge', views: '2.1M', duration: '0:15' },
        { id: 2, thumbnail: '🎭', title: 'Comedy Skit', views: '890K', duration: '0:30' },
        { id: 3, thumbnail: '🎨', title: 'Art Tutorial', views: '1.5M', duration: '1:45' },
        { id: 4, thumbnail: '🍕', title: 'Food Review', views: '654K', duration: '0:45' },
        { id: 5, thumbnail: '🏃', title: 'Fitness Tips', views: '987K', duration: '1:00' },
        { id: 6, thumbnail: '🎸', title: 'Music Cover', views: '2.3M', duration: '2:30' }
    ];
    
    return videos.map(video => `
        <div style="background: #222; border-radius: 8px; overflow: hidden; cursor: pointer; position: relative; aspect-ratio: 9/16;" onclick="playVideo(${video.id})">
            <div style="width: 100%; height: 200px; background: linear-gradient(135deg, #333, #555); display: flex; align-items: center; justify-content: center; font-size: 48px;">
                ${video.thumbnail}
            </div>
            <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${video.duration}
            </div>
            <div style="position: absolute; bottom: 8px; left: 8px; color: white; font-size: 12px; background: rgba(0,0,0,0.8); padding: 4px 8px; border-radius: 4px;">
                ${video.views}
            </div>
        </div>
    `).join('');
}

function generateFollowingFeed() {
    const followingPosts = [
        { 
            user: 'vibemaster', 
            avatar: '🎵', 
            username: 'Vibe Master',
            timeAgo: '2h ago',
            content: 'Just dropped my latest dance routine! Who else is ready to vibe? 💃',
            thumbnail: '🕺',
            likes: '2.1K',
            comments: '156'
        },
        { 
            user: 'dancequeen', 
            avatar: '💃', 
            username: 'Dance Queen',
            timeAgo: '5h ago',
            content: 'New tutorial coming tomorrow! Can you guess the song? 🎶',
            thumbnail: '🎭',
            likes: '1.8K',
            comments: '89'
        },
        { 
            user: 'musiclover', 
            avatar: '🎶', 
            username: 'Music Lover',
            timeAgo: '1d ago',
            content: 'Cover of my favorite song! Hope you love it as much as I do ❤️',
            thumbnail: '🎸',
            likes: '945',
            comments: '67'
        }
    ];
    
    return followingPosts.map(post => `
        <div style="background: #222; border-radius: 12px; padding: 20px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #fe2c55, #ff006e); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                    ${post.avatar}
                </div>
                <div style="flex: 1;">
                    <div style="color: white; font-weight: 600;">@${post.user}</div>
                    <div style="color: #999; font-size: 14px;">${post.username} • ${post.timeAgo}</div>
                </div>
                <button style="background: none; border: none; color: #666; font-size: 20px; cursor: pointer;">⋯</button>
            </div>
            <p style="color: white; margin-bottom: 15px; line-height: 1.5;">${post.content}</p>
            <div style="background: #333; border-radius: 8px; height: 200px; display: flex; align-items: center; justify-content: center; font-size: 64px; margin-bottom: 15px; cursor: pointer;" onclick="playVideo('${post.user}')">
                ${post.thumbnail}
            </div>
            <div style="display: flex; gap: 20px; color: #999;">
                <span style="cursor: pointer;" onclick="likePost('${post.user}')">❤️ ${post.likes}</span>
                <span style="cursor: pointer;" onclick="commentOnPost('${post.user}')">💬 ${post.comments}</span>
                <span style="cursor: pointer;" onclick="sharePost('${post.user}')">🔗 Share</span>
            </div>
        </div>
    `).join('');
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
}

function editBio() {
    const bioElement = document.getElementById('profileBio');
    const currentBio = bioElement.textContent;
    
    const newBio = prompt('Edit your bio:', currentBio);
    if (newBio !== null && newBio.trim() !== '') {
        bioElement.textContent = newBio;
        showNotification('Bio updated!', 'success');
    }
}

function editUsername() {
    const usernameElement = document.getElementById('profileUsername');
    const currentUsername = usernameElement.textContent.replace('@', '');
    
    const newUsername = prompt('Edit your username:', currentUsername);
    if (newUsername !== null && newUsername.trim() !== '') {
        usernameElement.textContent = '@' + newUsername.trim().replace('@', '');
        showNotification('Username updated!', 'success');
    }
}

function changeProfilePicture() {
    const emojis = ['👤', '😀', '😎', '🤩', '🥳', '🦄', '🌟', '💫', '🎵', '🎭', '🎨', '🏆'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    const profilePic = document.getElementById('profilePicture');
    if (profilePic) {
        profilePic.textContent = randomEmoji;
        showNotification('Profile picture updated!', 'success');
    }
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

function showFollowing() {
    showFollowModal('Following', [
        { username: 'vibemaster', name: 'Vibe Master', followers: '2.1M', avatar: '🎵' },
        { username: 'dancequeen', name: 'Dance Queen', followers: '1.8M', avatar: '💃' },
        { username: 'musiclover', name: 'Music Lover', followers: '945K', avatar: '🎶' },
        { username: 'creator_101', name: 'Creator 101', followers: '523K', avatar: '🎬' }
    ]);
}

function showFollowers() {
    showFollowModal('Followers', [
        { username: 'superfan1', name: 'Super Fan', followers: '12K', avatar: '⭐' },
        { username: 'vibesupporter', name: 'Vibe Supporter', followers: '8.9K', avatar: '🔥' },
        { username: 'dancelover', name: 'Dance Lover', followers: '5.2K', avatar: '💫' },
        { username: 'musicfan', name: 'Music Fan', followers: '3.1K', avatar: '🎤' }
    ]);
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
                ${users.map(user => `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; background: #333;">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #fe2c55, #ff006e); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                            ${user.avatar}
                        </div>
                        <div style="flex: 1;">
                            <div style="color: white; font-weight: 600;">@${user.username}</div>
                            <div style="color: #999; font-size: 14px;">${user.name} • ${user.followers} followers</div>
                        </div>
                        <button style="background: #fe2c55; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                            Follow
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