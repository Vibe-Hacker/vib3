// Main App Controller
class VIB3App {
    constructor() {
        this.modules = {};
        this.currentUser = null;
        this.config = {
            appName: 'VIB3',
            version: '2.0.0',
            features: {
                videoEditing: true,
                liveStreaming: true,
                shopping: true,
                effects: true
            }
        };
    }

    async initialize() {
        console.log('🚀 Initializing VIB3 App v2.0...');
        
        try {
            // Initialize core modules
            await this.initializeCore();
            
            // Initialize features
            await this.initializeFeatures();
            
            // Setup event listeners
            this.setupGlobalListeners();
            
            console.log('✅ VIB3 App initialized successfully');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
        }
    }

    async initializeCore() {
        // Initialize Firebase
        const { initializeFirebase } = await import('./firebase.js');
        await initializeFirebase();
        
        // Initialize auth
        const { AuthManager } = await import('./auth.js');
        this.modules.auth = new AuthManager();
        await this.modules.auth.initialize();
        
        // Initialize video feed
        const { VideoFeed } = await import('./videoFeed.js');
        this.modules.videoFeed = new VideoFeed();
        
        // Initialize navigation
        const { Navigation } = await import('./navigation.js');
        this.modules.navigation = new Navigation();
    }

    async initializeFeatures() {
        // Video Editor
        if (this.config.features.videoEditing) {
            const { VideoEditor } = await import('../features/videoEditor.js');
            this.modules.videoEditor = new VideoEditor();
        }
        
        // Effects Engine
        if (this.config.features.effects) {
            const { EffectsEngine } = await import('../features/effects.js');
            this.modules.effects = new EffectsEngine();
        }
        
        // Live Streaming
        if (this.config.features.liveStreaming) {
            const { LiveStream } = await import('../features/liveStream.js');
            this.modules.liveStream = new LiveStream();
        }
        
        // Shopping
        if (this.config.features.shopping) {
            const { Shopping } = await import('../features/shopping.js');
            this.modules.shopping = new Shopping();
        }
    }

    setupGlobalListeners() {
        // Handle app-wide events
        document.addEventListener('userLogin', (e) => {
            this.currentUser = e.detail;
            this.onUserLogin(e.detail);
        });
        
        document.addEventListener('userLogout', () => {
            this.currentUser = null;
            this.onUserLogout();
        });
    }

    onUserLogin(user) {
        console.log('👤 User logged in:', user.email);
        // Update UI for logged in state
        Object.values(this.modules).forEach(module => {
            if (module.onUserLogin) {
                module.onUserLogin(user);
            }
        });
    }

    onUserLogout() {
        console.log('👤 User logged out');
        // Update UI for logged out state
        Object.values(this.modules).forEach(module => {
            if (module.onUserLogout) {
                module.onUserLogout();
            }
        });
    }

    // Public API
    getModule(moduleName) {
        return this.modules[moduleName];
    }

    async loadFeature(featureName) {
        if (!this.modules[featureName]) {
            console.log(`📦 Loading feature: ${featureName}`);
            const module = await import(`../features/${featureName}.js`);
            this.modules[featureName] = new module.default();
            await this.modules[featureName].initialize();
        }
        return this.modules[featureName];
    }
}

// Global app instance
window.VIB3 = new VIB3App();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.VIB3.initialize();
});

export { VIB3App };