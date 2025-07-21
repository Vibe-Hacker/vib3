// Simple Profile Page for Testing

function createSimpleProfilePage() {
    console.log('🔧 Creating comprehensive VIB3 profile page...');
    console.log('🔍 IMMEDIATE DEBUG - window.currentUser:', window.currentUser);
    console.log('🔍 IMMEDIATE DEBUG - profileImage value:', window.currentUser?.profileImage);
    
    // EMERGENCY: Define changeProfilePicture inline if it doesn't exist
    if (!window.changeProfilePicture) {
        console.log('⚠️ EMERGENCY: changeProfilePicture not found, creating inline version!');
        window.changeProfilePicture = function() {
            alert('🚨 INLINE EMERGENCY FUNCTION CALLED!');
            console.log('🚨 This is the emergency inline changeProfilePicture function');
            
            // Show a basic modal
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;';
            modal.innerHTML = '<div style="background:white;padding:20px;border-radius:10px;"><h2>Profile Picture Upload</h2><p>The upload feature is temporarily unavailable.</p><button onclick="this.parentElement.parentElement.remove()">Close</button></div>';
            document.body.appendChild(modal);
        };
    }
    
    // Remove any existing profile page
    const existingProfile = document.getElementById('profilePage');
    if (existingProfile) {
        existingProfile.remove();
    }
    
    // Pause and properly stop all videos when opening profile
    document.querySelectorAll('video').forEach(video => {
        video.pause();
        video.muted = true;
        video.currentTime = 0;
        // Remove video sources to prevent background playback
        if (video.srcObject) {
            video.srcObject = null;
        }
        if (video.src && !video.src.includes('blob:')) {
            video.removeAttribute('src');
            video.load();
        }
    });
    
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
    
    console.log('🔧 INITIAL USER DATA FOR PROFILE CREATION:', {
        hasProfileImage: !!user.profileImage,
        profileImage: user.profileImage,
        hasProfilePicture: !!user.profilePicture,
        profilePicture: user.profilePicture,
        username: user.username
    });
    
    // Add click listeners after page creation
    setTimeout(() => {
        console.log('🔧 FORCING CLICK HANDLERS...');
        const profilePic = document.getElementById('profilePicture');
        const cameraBtn = document.querySelector('button[style*="📷"]');
        
        console.log('🔧 Profile picture element found:', !!profilePic);
        console.log('🔧 Camera button element found:', !!cameraBtn);
        
        if (profilePic) {
            // Remove any existing onclick
            profilePic.onclick = null;
            profilePic.removeAttribute('onclick');
            
            // Force new click handler
            profilePic.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('🎯 PROFILE PIC CLICKED VIA EVENT LISTENER!');
                alert('🎯 EVENT LISTENER CLICK DETECTED!');
                
                // Try multiple ways to call the function
                try {
                    if (window.changeProfilePicture) {
                        console.log('🎯 Calling window.changeProfilePicture...');
                        window.changeProfilePicture();
                    } else if (typeof changeProfilePicture !== 'undefined') {
                        console.log('🎯 Calling changeProfilePicture directly...');
                        changeProfilePicture();
                    } else {
                        console.error('❌ changeProfilePicture function not found!');
                        alert('❌ Function not found!');
                    }
                } catch (err) {
                    console.error('❌ Error calling function:', err);
                    alert('❌ Error: ' + err.message);
                }
            }, true); // Use capture phase
            
            console.log('✅ Click handler attached to profile picture');
        }
        
        if (cameraBtn) {
            // Remove any existing onclick
            cameraBtn.onclick = null;
            cameraBtn.removeAttribute('onclick');
            
            // Force new click handler
            cameraBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                console.log('📷 CAMERA BUTTON CLICKED VIA EVENT LISTENER!');
                alert('📷 CAMERA EVENT LISTENER CLICK!');
                
                try {
                    if (window.changeProfilePicture) {
                        window.changeProfilePicture();
                    }
                } catch (err) {
                    console.error('❌ Camera button error:', err);
                    alert('❌ Camera Error: ' + err.message);
                }
            }, true);
            
            console.log('✅ Click handler attached to camera button');
        }
        
        // Also check what's preventing clicks
        console.log('🔍 Checking for overlapping elements...');
        const rect = profilePic?.getBoundingClientRect();
        if (rect) {
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const topElement = document.elementFromPoint(centerX, centerY);
            console.log('🔍 Element at center of profile pic:', topElement);
            console.log('🔍 Is it the profile pic?', topElement === profilePic);
        }
    }, 500); // Increased delay to ensure DOM is ready
    
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
        z-index: 100;
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
                    <div id="profilePicture" style="width: 140px; height: 140px; background: ${user.profileImage ? `url(${user.profileImage})` : 'linear-gradient(135deg, #333, #666)'}; ${user.profileImage ? 'background-size: cover; background-position: center;' : ''} border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 60px; border: 4px solid rgba(255,255,255,0.2); cursor: pointer;" onclick="alert('INLINE CLICK WORKS!'); console.log('INLINE CLICK LOG!'); window.testProfilePictureClick(); changeProfilePicture();">
${user.profileImage ? '' : (user.profilePicture || '👤')}
                    </div>
                    <button onclick="alert('CAMERA BUTTON CLICK WORKS!'); changeProfilePicture();" style="position: absolute; bottom: 0; right: 0; background: #fe2c55; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 16px; cursor: pointer;">
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
                    <div style="display: flex; gap: 15px;" id="profileActions">
                        <!-- Actions will be populated based on whether it's current user or another user -->
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
    // Use shared API_BASE_URL from window if available
    if (window.API_BASE_URL) {
        return window.API_BASE_URL;
    }
    // Fallback: Use Railway URL for production, empty for local development
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? '' 
        : 'https://vib3-production.up.railway.app';
}

async function loadUserProfileData() {
    try {
        const baseURL = getAPIBaseURL();
        console.log('🔍 Loading profile data:', { baseURL, hasAuthToken: !!window.authToken });
        
        const response = await fetch(`${baseURL}/api/user/profile`, {
            credentials: 'include', // Use session-based auth
            headers: {
                'Content-Type': 'application/json',
                ...(window.authToken && window.authToken !== 'session-based' ? 
                    { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        console.log('📡 Profile API response:', { status: response.status, ok: response.ok });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Profile data loaded:', data);
            updateProfileDisplay(data.user || data);
            setupProfileActions(data.user || data);
            loadUserVideos();
            loadUserStats();
        } else {
            const text = await response.text();
            console.error('❌ Profile API failed:', { status: response.status, text: text.substring(0, 200) });
            // Fallback to currentUser data if API fails
            if (window.currentUser) {
                console.log('📊 Using currentUser data as fallback');
                updateProfileDisplay(window.currentUser);
                updateStatsDisplay(window.currentUser);
            }
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

async function loadUserVideos() {
    try {
        const baseURL = getAPIBaseURL();
        console.log('🎬 Loading user videos:', { 
            baseURL, 
            hasAuthToken: !!window.authToken,
            currentUser: window.currentUser ? {
                uid: window.currentUser.uid,
                _id: window.currentUser._id,
                username: window.currentUser.username
            } : null
        });
        
        // Add userId parameter to ensure we get the right user's videos
        const userId = window.currentUser?._id || window.currentUser?.uid;
        const url = userId ? `${baseURL}/api/user/videos?userId=${userId}` : `${baseURL}/api/user/videos`;
        
        console.log('🔍 Profile loading debug info:', {
            userId: userId,
            _id: window.currentUser?._id,
            uid: window.currentUser?.uid,
            fullUser: window.currentUser,
            finalUrl: url
        });
        
        console.log('🔍 Fetching user videos from:', url);
        
        const response = await fetch(url, {
            credentials: 'include', // Use session-based auth
            headers: {
                'Content-Type': 'application/json',
                ...(window.authToken && window.authToken !== 'session-based' ? 
                    { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        console.log('📡 Videos API response:', { status: response.status, ok: response.ok });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ User videos loaded:', data);
            displayUserVideos(data.videos || []);
        } else {
            const text = await response.text();
            console.error('❌ Videos API failed:', { status: response.status, text: text.substring(0, 200) });
        }
    } catch (error) {
        console.error('Error loading user videos:', error);
    }
}

async function loadUserStats() {
    try {
        const baseURL = getAPIBaseURL();
        console.log('📊 Loading user stats:', { baseURL, hasAuthToken: !!window.authToken });
        
        const response = await fetch(`${baseURL}/api/user/stats`, {
            credentials: 'include', // Use session-based auth
            headers: {
                'Content-Type': 'application/json',
                ...(window.authToken && window.authToken !== 'session-based' ? 
                    { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        console.log('📊 Stats API response:', { status: response.status, ok: response.ok });
        
        if (response.ok) {
            const stats = await response.json();
            console.log('📊 Stats data received:', stats);
            updateStatsDisplay(stats);
        } else {
            const text = await response.text();
            console.error('📊 Stats API failed:', { status: response.status, text: text.substring(0, 200) });
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
    console.log('🖼️ Updating profile picture:', { 
        hasElement: !!profilePicEl, 
        profileImage: userData.profileImage, 
        profilePicture: userData.profilePicture 
    });
    if (profilePicEl) {
        if (userData.profileImage) {
            // Show uploaded image
            console.log('🖼️ Setting background image:', userData.profileImage);
            profilePicEl.style.backgroundImage = `url(${userData.profileImage})`;
            profilePicEl.style.backgroundSize = 'cover';
            profilePicEl.style.backgroundPosition = 'center';
            profilePicEl.textContent = '';
        } else if (userData.profilePicture) {
            // Show emoji
            console.log('🖼️ Setting emoji:', userData.profilePicture);
            profilePicEl.style.backgroundImage = '';
            profilePicEl.textContent = userData.profilePicture;
        } else {
            console.log('🖼️ No profile image or picture found in userData');
        }
    } else {
        console.log('❌ Profile picture element not found');
    }
}

function updateStatsDisplay(stats) {
    console.log('📊 Updating stats display:', stats);
    
    const followingEl = document.getElementById('followingCount');
    const followersEl = document.getElementById('followersCount');
    const likesEl = document.getElementById('likesCount');
    
    if (followingEl && stats.following !== undefined) {
        followingEl.textContent = formatNumber(stats.following);
    }
    if (followersEl && stats.followers !== undefined) {
        followersEl.textContent = formatNumber(stats.followers);
    }
    if (likesEl && stats.likes !== undefined) {
        likesEl.textContent = formatNumber(stats.likes);
    }
    
    // Also try to use currentUser data if stats are empty
    if (window.currentUser) {
        const user = window.currentUser;
        if (followingEl && !stats.following && user.following !== undefined) {
            followingEl.textContent = formatNumber(user.following);
        }
        if (followersEl && !stats.followers && user.followers !== undefined) {
            followersEl.textContent = formatNumber(user.followers);
        }
        if (likesEl && !stats.likes && user.likes !== undefined) {
            likesEl.textContent = formatNumber(user.likes);
        }
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

function setupProfileActions(profileUser) {
    const actionsContainer = document.getElementById('profileActions');
    if (!actionsContainer) return;
    
    const currentUser = window.currentUser;
    const isOwnProfile = currentUser && profileUser && (currentUser._id === profileUser._id || currentUser.username === profileUser.username);
    
    if (isOwnProfile) {
        // Own profile - show edit buttons
        actionsContainer.innerHTML = `
            <button onclick="editProfile()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                Edit Profile
            </button>
            <button onclick="shareProfile()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                Share Profile
            </button>
            <button onclick="openCreatorTools()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                VIB3 Studio
            </button>
        `;
    } else {
        // Other user's profile - show follow button
        actionsContainer.innerHTML = `
            <button id="followButton" onclick="toggleFollow('${profileUser._id || profileUser.id}')" style="background: #fe2c55; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                <span id="followButtonText">Follow</span>
            </button>
            <button onclick="shareProfile()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                Share Profile
            </button>
            <button onclick="messageUser('${profileUser._id || profileUser.id}')" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                Message
            </button>
        `;
        
        // Load follow status
        loadFollowStatus(profileUser._id || profileUser.id);
    }
}

async function loadFollowStatus(userId) {
    if (!window.authToken) return;
    
    try {
        const response = await fetch(`${getAPIBaseURL()}/api/users/${userId}/follow-status`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(window.authToken && window.authToken !== 'session-based' ? 
                    { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateFollowButton(data.following);
        }
    } catch (error) {
        console.log('Could not load follow status:', error);
    }
}

function updateFollowButton(isFollowing) {
    const followButton = document.getElementById('followButton');
    const followButtonText = document.getElementById('followButtonText');
    
    if (followButton && followButtonText) {
        if (isFollowing) {
            followButton.style.background = 'rgba(255,255,255,0.2)';
            followButton.style.color = 'white';
            followButtonText.textContent = 'Following';
        } else {
            followButton.style.background = '#fe2c55';
            followButton.style.color = 'white';
            followButtonText.textContent = 'Follow';
        }
    }
}

async function toggleFollow(userId) {
    if (!window.authToken) {
        showNotification('Please login to follow users', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${getAPIBaseURL()}/api/users/${userId}/follow`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(window.authToken && window.authToken !== 'session-based' ? 
                    { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateFollowButton(data.following);
            
            // Update follower count
            const followersCountEl = document.getElementById('followersCount');
            if (followersCountEl) {
                const currentCount = parseInt(followersCountEl.textContent) || 0;
                followersCountEl.textContent = data.following ? currentCount + 1 : Math.max(0, currentCount - 1);
            }
            
            showNotification(data.following ? 'Following!' : 'Unfollowed', 'success');
        } else {
            throw new Error('Failed to update follow status');
        }
    } catch (error) {
        console.error('Follow error:', error);
        showNotification('Error updating follow status', 'error');
    }
}

function messageUser(userId) {
    showNotification('Messaging feature coming soon!', 'info');
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
                <button onclick="openUploadFromProfile()" style="background: #fe2c55; color: white; border: none; padding: 12px 24px; border-radius: 8px; margin-top: 20px; cursor: pointer;">
                    Upload Video
                </button>
            </div>
        `;
    } else {
        // Create grid container
        const gridContainer = document.createElement('div');
        gridContainer.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;';
        
        // Create video cards
        videos.forEach(video => {
            const cardElement = createVideoCard(video);
            if (cardElement) {
                gridContainer.appendChild(cardElement);
            }
        });
        
        videosContent.innerHTML = '';
        videosContent.appendChild(gridContainer);
    }
}

function createVideoCard(video) {
    const videoId = video._id || video.id;
    console.log('🎬 Creating video card for:', video.title || 'Untitled', video);
    
    // Use video preview with poster frame
    const videoElement = video.videoUrl ? 
        `<video 
            style="width: 100%; height: 100%; object-fit: cover;" 
            muted 
            preload="metadata"
            onloadedmetadata="this.currentTime=1"
            poster=""
            oncanplay="this.style.opacity='1'"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        >
            <source src="${video.videoUrl}#t=1" type="video/mp4">
            <source src="${video.videoUrl}#t=1" type="video/webm">
        </video>
        <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #333, #555); display: none; align-items: center; justify-content: center; flex-direction: column; position: absolute; top: 0; left: 0;">
            <div style="font-size: 48px; margin-bottom: 10px;">🎬</div>
            <div style="color: white; font-size: 14px; text-align: center; padding: 0 10px;">${video.title || 'Video'}</div>
        </div>` :
        `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #333, #555); display: flex; align-items: center; justify-content: center; flex-direction: column;">
            <div style="font-size: 48px; margin-bottom: 10px;">🎬</div>
            <div style="color: white; font-size: 14px; text-align: center; padding: 0 10px;">${video.title || 'Video'}</div>
        </div>`;
    
    const cardHtml = `
        <div class="profile-video-card" style="background: #222; border-radius: 8px; overflow: hidden; cursor: pointer; position: relative; aspect-ratio: 9/16;" data-video-id="${videoId}">
            ${videoElement}
            
            <!-- Duration -->
            <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${formatDuration(video.duration)}
            </div>
            
            <!-- Views -->
            <div style="position: absolute; bottom: 8px; left: 8px; color: white; font-size: 12px; background: rgba(0,0,0,0.8); padding: 4px 8px; border-radius: 4px;">
                👁️ ${formatNumber(video.views || 0)}
            </div>
            
            <!-- Likes -->
            <div style="position: absolute; top: 8px; right: 8px; color: white; font-size: 12px; background: rgba(0,0,0,0.8); padding: 4px 8px; border-radius: 4px;">
                ❤️ ${formatNumber(video.likeCount || video.likes || 0)}
            </div>
            
            <!-- Play indicator -->
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.6); border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; opacity: 0.8;">
                <div style="color: white; font-size: 24px; margin-left: 4px;">▶️</div>
            </div>
            
            <!-- Delete button -->
            <div class="delete-button" style="position: absolute; top: 8px; left: 8px; background: rgba(255,0,0,0.8); color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; opacity: 0.9; transition: all 0.3s ease;" 
                 title="Delete video">
                🗑️
            </div>
        </div>
    `;
    
    // Create DOM element and store video data
    const cardElement = document.createElement('div');
    cardElement.innerHTML = cardHtml;
    const card = cardElement.firstElementChild;
    
    // Store the complete video data on the card for reliable access
    card.videoData = video;
    
    // Add click handler that uses stored data
    card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎬 Profile video clicked:', card.videoData.title || 'Untitled');
        openVideoModalFromProfile(card.videoData);
    });
    
    // Add delete button handler
    const deleteButton = card.querySelector('.delete-button');
    if (deleteButton) {
        deleteButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteUserVideo(videoId, video.title || 'this video');
        });
        
        // Add hover effects
        deleteButton.addEventListener('mouseenter', () => {
            deleteButton.style.opacity = '1';
            deleteButton.style.transform = 'scale(1.1)';
        });
        
        deleteButton.addEventListener('mouseleave', () => {
            deleteButton.style.opacity = '0.9';
            deleteButton.style.transform = 'scale(1)';
        });
    }
    
    return card;
}

// Open video from profile page using the same reliable method as explore
function openVideoModalFromProfile(video) {
    console.log('🎬 Opening video from profile:', video.title || 'Untitled');
    
    // Use the same function as explore page for consistency
    if (window.openVideoModal) {
        window.openVideoModal(video);
    } else {
        // Fallback to the old method if openVideoModal is not available
        playUserVideo(video._id || video.id);
    }
}

function playUserVideo(videoId) {
    console.log('🎬 Playing user video:', videoId);
    
    // Close profile page
    const profilePage = document.getElementById('profilePage');
    if (profilePage) {
        profilePage.remove();
    }
    
    // Show main app
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'block';
    }
    
    // Switch to For You feed and play the specific video
    switchFeedTab('foryou');
    
    // Try to find and play the video in the feed
    setTimeout(() => {
        const videoCards = document.querySelectorAll('.video-card');
        for (const card of videoCards) {
            const video = card.querySelector('video');
            if (video && video.src.includes(videoId)) {
                // Scroll to this video and play it
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                video.play();
                break;
            }
        }
    }, 500);
}

async function deleteUserVideo(videoId, videoTitle) {
    console.log('🗑️ Delete video requested:', videoId, videoTitle);
    
    // CRITICAL: Stop all videos immediately to prevent background playback
    console.log('🛑 CRITICAL: Stopping all videos before deletion...');
    document.querySelectorAll('video').forEach((video, index) => {
        video.pause();
        video.muted = true;
        video.currentTime = 0;
        // Remove video sources to prevent background playback
        if (video.srcObject) {
            video.srcObject = null;
        }
        if (video.src && !video.src.includes('blob:')) {
            video.removeAttribute('src');
            video.load();
        }
        console.log(`🔇 Stopped video ${index} during deletion`);
    });
    
    // Disconnect video observer to prevent auto-play
    if (window.videoObserver) {
        window.videoObserver.disconnect();
        console.log('📹 Disconnected video observer during deletion');
    }
    
    // Show confirmation modal
    const confirmed = await showDeleteConfirmation(videoTitle);
    if (!confirmed) {
        console.log('❌ Video deletion cancelled by user');
        return;
    }
    
    try {
        const baseURL = getAPIBaseURL();
        
        
        if (!window.authToken) {
            showNotification('Please log in to delete videos', 'error');
            return;
        }
        
        console.log('🗑️ Deleting video from server...');
        const response = await fetch(`${baseURL}/api/videos/${videoId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(window.authToken && window.authToken !== 'session-based' ? 
                    { 'Authorization': `Bearer ${window.authToken}` } : {})
            }
        });
        
        if (response.ok) {
            console.log('✅ Video deleted successfully');
            showNotification('Video deleted successfully', 'success');
            
            // Remove the video card from the UI immediately
            const videoCards = document.querySelectorAll(`[onclick*="${videoId}"]`);
            videoCards.forEach(card => {
                if (card.closest('[style*="aspect-ratio"]')) {
                    card.closest('[style*="aspect-ratio"]').remove();
                }
            });
            
            // Also remove from main feed immediately
            const mainFeedVideos = document.querySelectorAll(`[data-video-id="${videoId}"]`);
            mainFeedVideos.forEach(video => {
                console.log('🗑️ Removing video from main feed:', videoId);
                video.remove();
            });
            
            // Stop all videos again after DOM manipulation
            console.log('🛑 Stopping all videos again after deletion...');
            document.querySelectorAll('video').forEach((video) => {
                video.pause();
                video.muted = true;
                video.currentTime = 0;
            });
            
            // Reload user videos to update the display
            setTimeout(() => {
                loadUserVideos();
                
                // DO NOT refresh the main video feed while on profile page
                // This prevents background video playback
                console.log('⚠️ Skipping main feed refresh while on profile page');
            }, 1000);
            
        } else {
            const error = await response.json();
            console.error('❌ Failed to delete video:', error);
            showNotification(error.error || 'Failed to delete video', 'error');
        }
        
    } catch (error) {
        console.error('❌ Error deleting video:', error);
        showNotification('Failed to delete video. Please try again.', 'error');
    }
}

function showDeleteConfirmation(videoTitle) {
    return new Promise((resolve) => {
        // Create confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal delete-confirmation-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100001;
        `;
        
        modal.innerHTML = `
            <div style="background: #1a1a1a; padding: 30px; border-radius: 15px; max-width: 400px; text-align: center; color: white;">
                <div style="font-size: 48px; margin-bottom: 20px; color: #ff4757;">🗑️</div>
                <h3 style="margin-bottom: 15px; color: white;">Delete Video?</h3>
                <p style="margin-bottom: 25px; color: #ccc; line-height: 1.5;">
                    Are you sure you want to delete "<strong>${videoTitle}</strong>"?<br>
                    This action cannot be undone.
                </p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="cancelDelete" style="
                        padding: 12px 24px;
                        background: #666;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                    ">Cancel</button>
                    <button id="confirmDelete" style="
                        padding: 12px 24px;
                        background: #ff4757;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                    ">Delete</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle button clicks
        const cancelBtn = modal.querySelector('#cancelDelete');
        const confirmBtn = modal.querySelector('#confirmDelete');
        
        cancelBtn.onclick = () => {
            modal.remove();
            resolve(false);
        };
        
        confirmBtn.onclick = () => {
            modal.remove();
            resolve(true);
        };
        
        // Close on outside click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        };
    });
}

function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function goBackToFeed() {
    console.log('🔙 Going back to video feed...');
    
    // First, stop all videos properly to prevent background playback
    console.log('🛑 Stopping all videos before returning to feed...');
    document.querySelectorAll('video').forEach((video, index) => {
        video.pause();
        video.muted = true;
        video.currentTime = 0;
        // Remove video sources to prevent background playback
        if (video.srcObject) {
            video.srcObject = null;
        }
        if (video.src && !video.src.includes('blob:')) {
            video.removeAttribute('src');
            video.load();
        }
        console.log(`🔇 Stopped video ${index} before returning to feed`);
    });
    
    // Disconnect any video observers to prevent them from starting videos
    if (window.videoObserver) {
        window.videoObserver.disconnect();
        console.log('📹 Disconnected video observer');
    }
    
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
    
    // Switch to For You feed - this will reinitialize the video observer
    if (window.switchFeedTab) {
        switchFeedTab('foryou');
        console.log('✅ Switched to For You feed');
    }
    
    showNotification('Back to video feed!', 'success');
}

// Open upload modal from profile page
function openUploadFromProfile() {
    console.log('🎬 Opening upload from profile page...');
    
    // Stop all videos first
    console.log('🛑 Stopping all background videos...');
    if (window.forceStopAllVideos && typeof window.forceStopAllVideos === 'function') {
        window.forceStopAllVideos();
    } else {
        // Fallback method
        document.querySelectorAll('video').forEach(video => {
            video.pause();
            video.currentTime = 0;
            video.muted = true;
        });
    }
    
    // Remove the profile page completely (use correct ID)
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
    
    // Wait a moment, then open upload modal
    setTimeout(() => {
        if (window.showUploadModal && typeof window.showUploadModal === 'function') {
            console.log('✅ Opening upload modal from profile');
            window.showUploadModal();
            
            // Ensure modal is on top
            const modal = document.getElementById('uploadModal');
            if (modal) {
                modal.style.zIndex = '10000';
                modal.style.position = 'fixed';
                console.log('✅ Upload modal z-index set');
            }
        } else {
            console.error('❌ showUploadModal function not available');
            showNotification('Upload feature temporarily unavailable', 'error');
        }
    }, 100);
}

// Debug function to test modal visibility
function debugUploadModal() {
    console.log('🐛 DEBUG: Testing upload modal visibility...');
    
    const modal = document.getElementById('uploadModal');
    if (!modal) {
        console.error('❌ DEBUG: Modal not found!');
        return;
    }
    
    console.log('📍 DEBUG: Modal current styles:');
    console.log('  display:', window.getComputedStyle(modal).display);
    console.log('  z-index:', window.getComputedStyle(modal).zIndex);
    console.log('  position:', window.getComputedStyle(modal).position);
    console.log('  visibility:', window.getComputedStyle(modal).visibility);
    console.log('  opacity:', window.getComputedStyle(modal).opacity);
    
    // Force modal to be visible with extreme values
    modal.style.display = 'flex';
    modal.style.zIndex = '999999';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.backgroundColor = 'rgba(255,0,0,0.9)'; // Red background to make it obvious
    modal.classList.add('active');
    
    console.log('✅ DEBUG: Modal forced visible with red background');
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
            
            console.log('Updating bio with token:', !!window.authToken);
            console.log('New bio:', newBio.trim());
            
            const response = await fetch(`${baseURL}/api/user/profile`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(window.authToken && window.authToken !== 'session-based' ? { 'Authorization': `Bearer ${window.authToken}` } : {})
                },
                body: JSON.stringify({ bio: newBio.trim() })
            });
            
            console.log('Bio update response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Bio update success:', result);
                bioElement.textContent = newBio.trim();
                showNotification('Bio updated!', 'success');
                
                // Update currentUser if available
                if (window.currentUser) {
                    window.currentUser.bio = newBio.trim();
                }
            } else {
                const errorText = await response.text();
                console.error('Bio update failed:', response.status, errorText);
                showNotification(`Failed to update bio: ${response.status}`, 'error');
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
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(window.authToken && window.authToken !== 'session-based' ? { 'Authorization': `Bearer ${window.authToken}` } : {})
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
    alert('📸 simple-profile.js changeProfilePicture called!');
    console.log('📸 SIMPLE-PROFILE.JS changeProfilePicture called!');
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
                showNotification('Image too large. Maximum size is 5MB.', 'error');
                return;
            }
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showNotification('Please select a valid image file.', 'error');
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
                
                showNotification('Uploading profile picture...', 'info');
                
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
                    const profilePicEl = document.getElementById('profilePicture');
                    if (profilePicEl && data.profilePictureUrl) {
                        console.log('📸 Updating profile picture element immediately with:', data.profilePictureUrl);
                        profilePicEl.style.backgroundImage = `url(${data.profilePictureUrl})`;
                        profilePicEl.style.backgroundSize = 'cover';
                        profilePicEl.style.backgroundPosition = 'center';
                        profilePicEl.textContent = '';
                    }
                    
                    // Update current user data
                    if (window.currentUser) {
                        console.log('📸 Updating currentUser with new profile picture');
                        window.currentUser.profilePicture = data.profilePictureUrl;
                        window.currentUser.profileImage = data.profilePictureUrl;
                        console.log('📸 Updated currentUser:', window.currentUser);
                    }
                    
                    showNotification('Profile picture updated successfully!', 'success');
                    modal.remove();
                } else {
                    const errorText = await response.text();
                    console.error('❌ PROFILE PICTURE UPLOAD ERROR:', errorText);
                    
                    try {
                        const errorData = JSON.parse(errorText);
                        showNotification(errorData.error || 'Failed to upload profile picture', 'error');
                    } catch {
                        showNotification('Failed to upload profile picture', 'error');
                    }
                }
            } catch (error) {
                console.error('❌ Profile picture upload exception:', error);
                showNotification('Error uploading profile picture', 'error');
            }
        }
    };
    
    window.closePictureModal = () => modal.remove();
    
    window.selectProfilePicture = async (emoji) => {
        try {
            const baseURL = getAPIBaseURL();
            
            
            const response = await fetch(`${baseURL}/api/user/profile`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(window.authToken && window.authToken !== 'session-based' ? { 'Authorization': `Bearer ${window.authToken}` } : {})
                },
                body: JSON.stringify({ profilePicture: emoji })
            });
            
            if (response.ok) {
                updateProfilePictureDisplay(null, emoji);
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

// Helper function to update profile picture display
function updateProfilePictureDisplay(imageUrl, emoji) {
    const profilePicture = document.getElementById('profilePicture');
    if (profilePicture) {
        if (imageUrl) {
            // Show uploaded image
            profilePicture.style.backgroundImage = `url(${imageUrl})`;
            profilePicture.style.backgroundSize = 'cover';
            profilePicture.style.backgroundPosition = 'center';
            profilePicture.textContent = '';
        } else if (emoji) {
            // Show emoji
            profilePicture.style.backgroundImage = '';
            profilePicture.textContent = emoji;
        }
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
                    VIB3 Studio
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

// Helper function to update profile picture display
function updateProfilePictureDisplay(imageUrl, emoji) {
    console.log('🖼️ Updating profile picture display:', { imageUrl, emoji });
    const profilePicture = document.getElementById('profilePicture');
    console.log('🖼️ Profile picture element found:', !!profilePicture);
    
    if (profilePicture) {
        if (imageUrl) {
            // Show uploaded image
            console.log('🖼️ Setting background image:', imageUrl);
            profilePicture.style.backgroundImage = `url(${imageUrl})`;
            profilePicture.style.backgroundSize = 'cover';
            profilePicture.style.backgroundPosition = 'center';
            profilePicture.textContent = '';
        } else if (emoji) {
            // Show emoji
            console.log('🖼️ Setting emoji:', emoji);
            profilePicture.style.backgroundImage = '';
            profilePicture.textContent = emoji;
        }
    }
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