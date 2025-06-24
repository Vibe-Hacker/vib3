// New main entry point with extracted modules
import { initializeApp } from './core/app-init.js';
import { handleVideoMetadata } from './components/video/video-utils.js';
import { setupAuthStateListener } from './components/auth/auth-service.js';
import { showMainApp, showAuthScreen, showLogin, showSignup, clearError } from './components/auth/auth-ui.js';
import { showPage } from './ui/navigation.js';
import { showToast } from './utils/ui-utils.js';
import EventManager from './ui/event-manager.js';
import functionStubs from './utils/function-stubs.js';

// Initialize the application
console.log('Starting VIB3 application v2...');
initializeApp();

// Set up authentication
setupAuthStateListener();

// Initialize all existing components
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded. Firebase functions available:', !!window.firebaseReady);
    
    // Import and initialize existing components
    try {
        // Import existing managers
        const { default: AuthManager } = await import('./components/auth-manager.js');
        const { default: VideoManager } = await import('./components/video-manager.js');
        const { default: ThemeManager } = await import('./components/theme-manager.js');
        const { default: FeedManager } = await import('./components/feed-manager.js');
        const { default: UploadManager } = await import('./components/upload-manager.js');
        const { default: ProfileManager } = await import('./components/profile/profile-manager.js');
        
        console.log('All components loaded successfully');
        
        // Give components time to initialize, then remove inline handlers
        setTimeout(() => {
            if (window.eventManager) {
                window.eventManager.removeInlineHandlers();
                console.log('Phase 3: Modern event listeners activated');
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error loading components:', error);
    }
});