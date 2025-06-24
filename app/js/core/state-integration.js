// State Integration Helper
// Migrates global variables to centralized state management

import stateManager from './state-manager.js';

class StateIntegration {
    constructor() {
        this.legacyVariables = new Map();
        this.init();
    }

    init() {
        console.log('Setting up state integration...');
        
        // Set up bidirectional sync with existing global variables
        this.setupLegacySync();
        
        // Set up state-driven UI updates
        this.setupUIBindings();
        
        // Set up middleware for logging and debugging
        this.setupMiddleware();
        
        console.log('State integration complete');
    }

    setupLegacySync() {
        // Map legacy global variables to state paths
        const legacyMappings = {
            'currentUser': 'user.currentUser',
            'uploadPageActive': 'ui.uploadPageActive',
            'uploadInProgress': 'ui.uploadInProgress',
            'userHasInteracted': 'video.userHasInteracted',
            'selectedVideoFile': 'video.selectedVideoFile'
        };

        // Create getters/setters for legacy variables
        Object.entries(legacyMappings).forEach(([globalVar, statePath]) => {
            this.createLegacyBinding(globalVar, statePath);
        });

        // Migrate existing values if they exist
        this.migrateExistingValues(legacyMappings);
    }

    createLegacyBinding(globalVar, statePath) {
        // Store original value if it exists
        if (window[globalVar] !== undefined) {
            this.legacyVariables.set(globalVar, window[globalVar]);
        }

        // Create property descriptor
        Object.defineProperty(window, globalVar, {
            get: () => {
                return stateManager.getState(statePath);
            },
            set: (value) => {
                stateManager.setState(statePath, value);
            },
            configurable: true,
            enumerable: true
        });

        console.log(`🔗 Linked global variable '${globalVar}' to state path '${statePath}'`);
    }

    migrateExistingValues(mappings) {
        console.log('Migrating existing global variables to state...');
        
        Object.entries(mappings).forEach(([globalVar, statePath]) => {
            const existingValue = this.legacyVariables.get(globalVar);
            if (existingValue !== undefined) {
                stateManager.setState(statePath, existingValue, false);
                console.log(`✅ Migrated ${globalVar}:`, existingValue);
            }
        });
    }

    setupUIBindings() {
        // Theme changes
        stateManager.subscribe('ui.theme', (theme) => {
            document.body.className = `theme-${theme}`;
            console.log(`🎨 Theme changed to: ${theme}`);
        }, { immediate: true });

        // Upload state changes
        stateManager.subscribe('ui.uploadPageActive', (active) => {
            console.log(`📤 Upload page active: ${active}`);
            // Could trigger UI updates here
        });

        // User authentication changes
        stateManager.subscribe('user.isAuthenticated', (isAuth) => {
            console.log(`🔐 Authentication state: ${isAuth}`);
            this.updateUIForAuth(isAuth);
        }, { immediate: true });

        // Connection status changes
        stateManager.subscribe('app.connectionStatus', (status) => {
            this.updateConnectionUI(status);
        });

        // Current page changes
        stateManager.subscribe('ui.currentPage', (page) => {
            console.log(`📄 Page changed to: ${page}`);
            this.updatePageUI(page);
        });
    }

    updateUIForAuth(isAuthenticated) {
        // Update UI elements based on authentication state
        const authElements = document.querySelectorAll('[data-auth-required]');
        authElements.forEach(el => {
            el.style.display = isAuthenticated ? 'block' : 'none';
        });

        const guestElements = document.querySelectorAll('[data-guest-only]');
        guestElements.forEach(el => {
            el.style.display = isAuthenticated ? 'none' : 'block';
        });
    }

    updateConnectionUI(status) {
        // Show connection status indicator
        const indicator = document.getElementById('connectionIndicator');
        if (indicator) {
            indicator.textContent = status === 'online' ? '🟢' : '🔴';
            indicator.title = `Connection: ${status}`;
        }

        // Add connection status class to body
        document.body.classList.toggle('offline', status === 'offline');
        
        if (status === 'offline') {
            this.showConnectionNotification('You are offline. Some features may be limited.');
        }
    }

    updatePageUI(page) {
        // Update active page classes
        document.querySelectorAll('.page').forEach(pageEl => {
            pageEl.classList.toggle('active', pageEl.id === `${page}Page`);
        });

        // Update sidebar active states
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeItem = document.getElementById(`sidebar${page.charAt(0).toUpperCase() + page.slice(1)}`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    setupMiddleware() {
        // Logging middleware
        stateManager.addMiddleware((path, newValue, oldValue) => {
            if (newValue !== oldValue) {
                console.log(`🔄 State change: ${path}`, { 
                    from: oldValue, 
                    to: newValue 
                });
            }
        });

        // Performance monitoring middleware
        stateManager.addMiddleware((path, newValue, oldValue) => {
            if (path.startsWith('video.') || path.startsWith('ui.')) {
                this.trackPerformanceMetrics(path, newValue);
            }
        });

        // Validation middleware
        stateManager.addMiddleware((path, newValue, oldValue) => {
            this.validateStateChange(path, newValue);
        });
    }

    trackPerformanceMetrics(path, value) {
        // Track state changes that might affect performance
        const metrics = {
            timestamp: Date.now(),
            path,
            value: typeof value === 'object' ? '[Object]' : value
        };

        // Store in performance buffer (limit to last 100 entries)
        if (!window.performanceMetrics) {
            window.performanceMetrics = [];
        }
        
        window.performanceMetrics.push(metrics);
        if (window.performanceMetrics.length > 100) {
            window.performanceMetrics.shift();
        }
    }

    validateStateChange(path, value) {
        // Validate critical state changes
        const validations = {
            'user.currentUser': (val) => val === null || (typeof val === 'object' && val.uid),
            'ui.theme': (val) => ['light', 'dark', 'purple', 'blue', 'green', 'rose'].includes(val),
            'ui.currentPage': (val) => typeof val === 'string' && val.length > 0,
            'video.uploadProgress': (val) => typeof val === 'number' && val >= 0 && val <= 100
        };

        const validator = validations[path];
        if (validator && !validator(value)) {
            console.warn(`⚠️ Invalid state value for ${path}:`, value);
        }
    }

    showConnectionNotification(message) {
        stateManager.actions.addNotification({
            type: 'warning',
            message,
            duration: 5000,
            dismissible: true
        });
    }

    // Helper methods for common operations
    helpers = {
        // Safe user operations
        getCurrentUser: () => stateManager.getState('user.currentUser'),
        isLoggedIn: () => stateManager.computed.isLoggedIn(),
        
        // UI state helpers
        isUploadActive: () => stateManager.computed.hasActiveUpload(),
        getCurrentTheme: () => stateManager.getState('ui.theme'),
        getCurrentPage: () => stateManager.getState('ui.currentPage'),
        
        // Video state helpers
        getCurrentVideo: () => stateManager.getState('video.currentlyPlayingVideo'),
        canPlayVideos: () => stateManager.computed.canPlayVideos(),
        
        // Notification helpers
        showNotification: (message, type = 'info') => {
            stateManager.actions.addNotification({ type, message });
        },
        
        // Debug helpers
        debugState: () => stateManager.debug(),
        getStateSnapshot: () => stateManager.getState(),
        
        // Migration helpers
        migrateToState: (globalVar, statePath, value) => {
            this.createLegacyBinding(globalVar, statePath);
            if (value !== undefined) {
                stateManager.setState(statePath, value);
            }
        }
    };
}

// Initialize state integration
const stateIntegration = new StateIntegration();

// Make helpers globally available
window.stateHelpers = stateIntegration.helpers;

// Export for modules
export default stateIntegration;