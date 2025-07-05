// Authentication manager module - MongoDB version
class AuthManager {
    constructor() {
        this.enableAudioAfterLogin = false;
        this.init();
    }

    init() {
        console.log('Initializing MongoDB Auth Manager...');
        
        // Check for existing session on load
        setTimeout(() => {
            if (window.mongoAPI) {
                const user = window.mongoAPI.getCurrentUser();
                if (user) {
                    this.showMainApp(user);
                } else {
                    this.showAuthScreen();
                }
            }
        }, 100);
    }

    async showMainApp(user, isPageRefresh = false) {
        try {
            const authContainer = document.getElementById('authContainer');
            if (authContainer) authContainer.style.display = 'none';
            
            const mainApp = document.getElementById('mainApp');
            if (mainApp) {
                mainApp.style.display = 'block';
                mainApp.classList.add('authenticated');
            }
            
            const appContainer = document.querySelector('.app-container');
            if (appContainer) {
                appContainer.classList.add('authenticated');
            }
            
            // Hide login section in sidebar
            const loginSection = document.getElementById('sidebarLoginSection');
            if (loginSection) {
                loginSection.style.display = 'none';
            }

            // Update state
            if (window.stateManager) {
                window.stateManager.actions.setUser(user);
            } else {
                window.currentUser = user;
            }

            // Load user profile
            if (window.loadUserProfile) {
                window.loadUserProfile(user);
            }

            // Show profile in sidebar
            const sidebarProfile = document.getElementById('sidebarProfile');
            if (sidebarProfile) {
                sidebarProfile.style.display = 'block';
            }

            // Load initial content
            if (!isPageRefresh && typeof window.loadVideos === 'function') {
                window.loadVideos();
            }

            console.log('✅ Main app displayed for user:', user.email);
        } catch (error) {
            console.error('Error showing main app:', error);
        }
    }

    showAuthScreen() {
        const authContainer = document.getElementById('authContainer');
        if (authContainer) authContainer.style.display = 'flex';
        
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.style.display = 'none';
            mainApp.classList.remove('authenticated');
        }
        
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.classList.remove('authenticated');
        }

        // Clear user state
        if (window.stateManager) {
            window.stateManager.actions.clearUser();
        } else {
            window.currentUser = null;
        }

        console.log('📋 Showing auth screen');
    }

    async login(email, password) {
        try {
            const result = await window.mongoAPI.login(email, password);
            if (result.success) {
                await this.showMainApp(result.user);
                return result;
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async signup(email, password, displayName) {
        try {
            const result = await window.mongoAPI.signup(email, password, displayName);
            if (result.success) {
                await this.showMainApp(result.user);
                return result;
            }
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await window.mongoAPI.logout();
            this.showAuthScreen();
            
            // Clear any cached data
            if (window.videoCache) {
                window.videoCache.clear();
            }
            
            // Navigate to home
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    getCurrentUser() {
        if (window.mongoAPI) {
            return window.mongoAPI.getCurrentUser();
        }
        return null;
    }
}

// Create and export singleton instance
const authManager = new AuthManager();
export default authManager;

// Also make it globally available
window.authManager = authManager;