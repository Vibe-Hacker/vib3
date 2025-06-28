// Authentication manager module
import { auth, db } from '../firebase-init.js';

class AuthManager {
    constructor() {
        this.enableAudioAfterLogin = false;
        this.init();
    }

    init() {
        // Set up authentication state listener
        window.onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
            
            if (user) {
                // Update state management
                if (window.stateManager) {
                    window.stateManager.actions.setUser(user);
                } else {
                    // Fallback for backwards compatibility
                    window.currentUser = user;
                }
                
                await this.showMainApp(user);
            } else {
                // Clear user state
                if (window.stateManager) {
                    window.stateManager.actions.clearUser();
                } else {
                    // Fallback for backwards compatibility
                    window.currentUser = null;
                }
                
                this.showAuthScreen();
            }
        });
    }

    async showMainApp(user, isPageRefresh = false) {
        try {
            document.getElementById('authContainer').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            document.getElementById('mainApp').classList.add('authenticated');
            document.querySelector('.app-container').classList.add('authenticated');
            
            // Hide login section in sidebar
            const loginSection = document.getElementById('sidebarLoginSection');
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
            this.updateHeaderProfile();
            
            // Load user profile picture
            this.loadUserProfilePicture();
            
            // Load following accounts for sidebar
            this.loadFollowingAccountsForSidebar();
            
            // Only enable audio flag for fresh logins, not page refreshes
            if (!isPageRefresh) {
                window.enableAudioAfterLogin = true;
            } else {
                // For page refresh, restore previous audio preference or default to enabled
                const savedAudioPreference = localStorage.getItem('vib3_audio_enabled');
                window.enableAudioAfterLogin = savedAudioPreference !== 'false';
            }
            
            // Small delay to ensure currentUser is properly set before loading videos
            setTimeout(() => {
                // Ensure we're on the For You page and video feed is shown
                document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
                const homeBtn = document.getElementById('sidebarHome');
                if (homeBtn) homeBtn.classList.add('active');
                
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
            
        } catch (error) {
            console.error('Error in showMainApp:', error);
        }
    }

    showAuthScreen() {
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('mainApp').classList.remove('authenticated');
        document.querySelector('.app-container').classList.remove('authenticated');
        
        const userVideosGrid = document.getElementById('userVideosGrid');
        const noVideosMessage = document.getElementById('noVideosMessage');
        if (userVideosGrid) userVideosGrid.innerHTML = '';
        if (noVideosMessage) noVideosMessage.style.display = 'block';
    }

    async updateHeaderProfile() {
        const headerProfileBtn = document.getElementById('headerProfileBtn');
        if (!headerProfileBtn || !window.currentUser) return;

        try {
            const userQuery = window.query(window.collection(db, 'users'), window.where('uid', '==', window.currentUser.uid));
            const userSnapshot = await window.getDocs(userQuery);
            
            if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data();
                if (userData.profilePicture || userData.avatarPicture) {
                    headerProfileBtn.innerHTML = `<img src="${userData.profilePicture || userData.avatarPicture}" alt="Profile" class="header-profile-img">`;
                } else {
                    // Use first letter of display name
                    const displayName = userData.displayName || userData.username || 'User';
                    headerProfileBtn.innerHTML = `<div class="header-profile-placeholder">${displayName.charAt(0).toUpperCase()}</div>`;
                }
            }
        } catch (error) {
            console.error('Error updating header profile:', error);
        }
    }

    async loadUserProfilePicture() {
        if (!window.currentUser) return;

        try {
            const userQuery = window.query(window.collection(db, 'users'), window.where('uid', '==', window.currentUser.uid));
            const userSnapshot = await window.getDocs(userQuery);
            
            if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data();
                if (userData.profilePicture && window.updateProfilePicDisplay) {
                    window.updateProfilePicDisplay(userData.profilePicture);
                }
                if (userData.avatarPicture && window.updateAvatarDisplay) {
                    window.updateAvatarDisplay(userData.avatarPicture);
                    if (window.updateAllVideoAvatars) {
                        window.updateAllVideoAvatars(userData.avatarPicture);
                    }
                } else if (userData.profilePicture && window.updateAllVideoProfilePics) {
                    window.updateAllVideoProfilePics(userData.profilePicture);
                }
            }
        } catch (error) {
            console.error('Error loading profile picture:', error);
        }
    }

    async loadFollowingAccountsForSidebar() {
        const followingAccountsList = document.getElementById('followingAccountsList');
        if (!followingAccountsList || !window.currentUser) return;

        try {
            // Get users that current user is following
            const followingQuery = window.query(
                window.collection(db, 'following'),
                window.where('followerId', '==', window.currentUser.uid)
            );
            const followingSnapshot = await window.getDocs(followingQuery);
            
            if (followingSnapshot.empty) {
                followingAccountsList.innerHTML = '<p style="color: var(--text-tertiary); font-size: 12px;">Follow some accounts to see them here</p>';
                return;
            }

            const followingUserIds = followingSnapshot.docs.map(doc => doc.data().followingId);
            
            // Get user data for followed accounts
            const followingUsers = [];
            for (const userId of followingUserIds.slice(0, 5)) { // Show max 5
                const userQuery = window.query(window.collection(db, 'users'), window.where('uid', '==', userId));
                const userSnapshot = await window.getDocs(userQuery);
                if (!userSnapshot.empty) {
                    followingUsers.push({ uid: userId, ...userSnapshot.docs[0].data() });
                }
            }

            followingAccountsList.innerHTML = followingUsers.map(user => `
                <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; cursor: pointer; border-radius: 8px; transition: background 0.2s;" onclick="openUserProfile('${user.uid}')">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(45deg, #ff006e, #8338ec); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold; overflow: hidden;">
                        ${user.profilePicture || user.avatarPicture ? 
                            `<img src="${user.profilePicture || user.avatarPicture}" style="width: 100%; height: 100%; object-fit: cover;" alt="Profile">` : 
                            (user.displayName || user.username || 'U').charAt(0).toUpperCase()
                        }
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); truncate">${user.displayName || user.username || 'User'}</div>
                        <div style="font-size: 11px; color: var(--text-tertiary); truncate">@${user.username || user.displayName || 'user'}</div>
                    </div>
                </div>
            `).join('');
            
            // Add "See all" link if there are more than 5
            if (followingUserIds.length > 5) {
                followingAccountsList.innerHTML += `
                    <div style="text-align: center; margin-top: 12px;">
                        <button onclick="showAllFollowing()" style="color: var(--text-secondary); font-size: 12px; background: none; border: none; cursor: pointer; text-decoration: underline;">
                            See all ${followingUserIds.length} accounts
                        </button>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Error loading following accounts:', error);
            followingAccountsList.innerHTML = '<p style="color: var(--text-tertiary); font-size: 12px;">Error loading accounts</p>';
        }
    }

    // Login function
    async login(email, password) {
        // Show loading state
        if (window.loadingManager) {
            window.loadingManager.showAuthLoading();
        }
        
        try {
            const userCredential = await window.signInWithEmailAndPassword(auth, email, password);
            console.log('Login successful:', userCredential.user.email);
            
            // Hide loading state
            if (window.loadingManager) {
                window.loadingManager.hide('auth');
            }
            
            return { success: true, user: userCredential.user };
        } catch (error) {
            // Use centralized error handling
            if (window.errorHandler) {
                window.errorHandler.reportError('firebase', error, {
                    operation: 'login',
                    email: email
                });
            } else {
                console.error('Login error:', error);
            }
            
            // Hide loading state
            if (window.loadingManager) {
                window.loadingManager.hide('auth');
            }
            
            this.showToast('Login failed: ' + error.message);
            return { success: false, error: error.message };
        }
    }

    // Signup function
    async signup(username, email, password) {
        // Show loading state
        if (window.loadingManager) {
            window.loadingManager.show('auth', {
                message: 'Creating account...',
                showSpinner: true,
                timeout: 20000
            });
        }
        
        try {
            const userCredential = await window.createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update profile with username
            await window.updateProfile(user, { displayName: username });

            // Create user document in Firestore
            await window.setDoc(window.doc(db, 'users', user.uid), {
                uid: user.uid,
                username: username,
                email: email,
                displayName: username,
                createdAt: new Date(),
                followers: [],
                following: []
            });

            console.log('Signup successful:', user.email);
            
            // Hide loading state
            if (window.loadingManager) {
                window.loadingManager.hide('auth');
            }
            
            return { success: true, user };
        } catch (error) {
            // Use centralized error handling
            if (window.errorHandler) {
                window.errorHandler.reportError('firebase', error, {
                    operation: 'signup',
                    email: email,
                    username: username
                });
            } else {
                console.error('Signup error:', error);
            }
            
            // Hide loading state
            if (window.loadingManager) {
                window.loadingManager.hide('auth');
            }
            
            this.showToast('Signup failed: ' + error.message);
            return { success: false, error: error.message };
        }
    }

    // Logout function
    async logout() {
        try {
            await window.signOut(auth);
            console.log('Logout successful');
            return { success: true };
        } catch (error) {
            // Use centralized error handling
            if (window.errorHandler) {
                window.errorHandler.reportError('firebase', error, {
                    operation: 'logout'
                });
            } else {
                console.error('Logout error:', error);
            }
            this.showToast('Logout failed: ' + error.message);
            return { success: false, error: error.message };
        }
    }

    showToast(message) {
        if (window.showToast) {
            window.showToast(message);
        } else {
            console.log('Toast:', message);
        }
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Make auth functions globally available
window.authManager = authManager;
window.authLogin = (email, password) => authManager.login(email, password);
window.signup = (username, email, password) => authManager.signup(username, email, password);
window.logout = () => authManager.logout();

export default AuthManager;