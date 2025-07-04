// Main entry point for VIB3 - modular JS version
// This file is loaded by index-heavy.html as a module

console.log('📱 VIB3 Main.js loading...');

// Import and initialize core functionality needed by index-heavy.html
import { initializeApp } from './core/app-init.js';
import { showToast } from './utils/ui-utils.js';

// Initialize the application core
console.log('🚀 Initializing VIB3 core...');
initializeApp();

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM ready, loading components...');
    
    try {
        // Import all required managers for the app
        const [
            { default: AuthManager },
            { default: VideoManager },
            { default: ThemeManager },
            { default: FeedManager },
            { default: UploadManager },
            { default: ProfileManager }
        ] = await Promise.all([
            import('./components/auth-manager.js'),
            import('./components/video-manager.js'),
            import('./components/theme-manager.js'),
            import('./components/feed-manager.js'),
            import('./components/upload-manager.js'),
            import('./components/profile/profile-manager.js')
        ]);
        
        console.log('✅ All VIB3 components loaded successfully');
        
        // Set up global ready flag
        window.vib3Ready = true;
        
        // Emit ready event
        document.dispatchEvent(new CustomEvent('vib3Ready'));
        
    } catch (error) {
        console.error('❌ Error loading VIB3 components:', error);
        
        // Show user-friendly error
        if (window.showToast) {
            window.showToast('Failed to load app components. Please refresh the page.', 'error');
        }
    }
});

console.log('📱 Main.js setup complete');