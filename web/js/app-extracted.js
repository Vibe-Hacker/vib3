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

// Missing functions that were in vib3-complete.js but not in modular files
function publishRemix(originalVideoId, remixData) {
    console.log('🎬 Publishing remix for video:', originalVideoId);
    console.log('📝 Remix data:', remixData);
    
    // Show notification for now
    if (window.showToast) {
        window.showToast('Remix feature coming soon! 🎵', 'info');
    } else {
        console.log('Remix feature coming soon! 🎵');
    }
    
    // TODO: Implement actual remix publishing logic
    // This would typically:
    // 1. Upload the remix video
    // 2. Link it to the original video
    // 3. Add remix metadata
    // 4. Update the feed
}

function startRemix(videoId) {
    console.log('🎵 Starting remix for video:', videoId);
    
    if (window.showToast) {
        window.showToast('Remix creation coming soon! 🎬', 'info');
    } else {
        console.log('Remix creation coming soon! 🎬');
    }
    
    // TODO: Implement remix creation logic
}

function createDuet(videoId) {
    console.log('👥 Creating duet for video:', videoId);
    
    if (window.showToast) {
        window.showToast('Duet feature coming soon! 🎭', 'info');
    } else {
        console.log('Duet feature coming soon! 🎭');
    }
    
    // TODO: Implement duet creation logic
}

// Live streaming state and functions
let liveStreamingState = {
    isActive: false,
    startTime: null,
    viewers: 0,
    title: '',
    category: '',
    stream: null
};

function setupLivePreview() {
    console.log('📹 Setting up live preview...');
    
    try {
        // Check if liveStreamingState exists
        if (!liveStreamingState) {
            console.error('❌ liveStreamingState not initialized');
            if (window.showToast) {
                window.showToast('Live streaming setup failed', 'error');
            }
            return;
        }
        
        // Check camera and microphone permissions
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                console.log('✅ Camera and microphone access granted');
                const previewVideo = document.getElementById('live-preview');
                if (previewVideo) {
                    previewVideo.srcObject = stream;
                    previewVideo.play();
                }
                liveStreamingState.stream = stream;
                if (window.showToast) {
                    window.showToast('Live preview ready! 📺', 'success');
                }
            })
            .catch(error => {
                console.error('❌ Failed to setup live preview:', error);
                if (window.showToast) {
                    window.showToast('Unable to access camera and microphone. Please ensure permissions are granted.', 'error');
                }
            });
            
    } catch (error) {
        console.error('❌ Failed to setup live preview:', error);
        if (window.showToast) {
            window.showToast('Live streaming setup failed', 'error');
        }
    }
}

function openLiveSetup() {
    console.log('🎬 Opening live setup...');
    
    if (window.showToast) {
        window.showToast('Live streaming coming soon! 🔴', 'info');
    } else {
        console.log('Live streaming coming soon! 🔴');
    }
    
    // TODO: Implement live setup modal
}

function startLiveStream() {
    console.log('🔴 Starting live stream...');
    
    if (window.showToast) {
        window.showToast('Live streaming feature coming soon! 📡', 'info');
    } else {
        console.log('Live streaming feature coming soon! 📡');
    }
    
    // TODO: Implement live streaming
}

// Make all functions globally available
window.publishRemix = publishRemix;
window.startRemix = startRemix;
window.createDuet = createDuet;
window.setupLivePreview = setupLivePreview;
window.openLiveSetup = openLiveSetup;
window.startLiveStream = startLiveStream;
window.liveStreamingState = liveStreamingState;

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