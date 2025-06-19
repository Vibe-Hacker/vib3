// Modern State Management System
// Centralized state handling with reactive updates

class StateManager {
    constructor() {
        this.state = {
            // User state
            user: {
                currentUser: null,
                isAuthenticated: false,
                profile: null,
                preferences: {}
            },
            
            // UI state
            ui: {
                currentPage: 'home',
                activeFeedTab: 'foryou',
                sidebarCollapsed: false,
                theme: 'dark',
                uploadPageActive: false,
                uploadInProgress: false
            },
            
            // Video state
            video: {
                currentlyPlayingVideo: null,
                userHasInteracted: false,
                feedVideos: [],
                uploadProgress: 0,
                selectedVideoFile: null
            },
            
            // App state
            app: {
                isLoading: false,
                connectionStatus: 'online',
                lastActivity: Date.now(),
                notifications: []
            }
        };
        
        this.subscribers = new Map();
        this.middleware = [];
        
        this.init();
    }

    init() {
        console.log('State manager initializing...');
        
        // Load persisted state from localStorage
        this.loadPersistedState();
        
        // Set up automatic state persistence
        this.setupStatePersistence();
        
        // Set up connection monitoring
        this.setupConnectionMonitoring();
        
        // Set default page state if not already set
        if (!this.getState('ui.currentPage')) {
            this.setState('ui.currentPage', 'home');
        }
        if (!this.getState('ui.activeFeedTab')) {
            this.setState('ui.activeFeedTab', 'foryou');
        }
        
        console.log('State manager initialized with state:', this.state);
    }

    // Core state management methods
    getState(path = null) {
        if (!path) return { ...this.state };
        
        const keys = path.split('.');
        let value = this.state;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }

    setState(path, value, notify = true) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.state;
        
        // Navigate to the parent object
        for (const key of keys) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        // Store old value for comparison
        const oldValue = target[lastKey];
        
        // Set the new value
        target[lastKey] = value;
        
        console.log(`State updated: ${path} =`, value);
        
        // Run middleware
        this.runMiddleware(path, value, oldValue);
        
        // Notify subscribers
        if (notify) {
            this.notifySubscribers(path, value, oldValue);
        }
        
        return this;
    }

    // Subscription system for reactive updates
    subscribe(path, callback, options = {}) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, []);
        }
        
        const subscription = {
            callback,
            options,
            id: Date.now() + Math.random()
        };
        
        this.subscribers.get(path).push(subscription);
        
        // Call immediately if requested
        if (options.immediate) {
            callback(this.getState(path), undefined);
        }
        
        // Return unsubscribe function
        return () => this.unsubscribe(path, subscription.id);
    }

    unsubscribe(path, subscriptionId) {
        const pathSubscribers = this.subscribers.get(path);
        if (pathSubscribers) {
            const index = pathSubscribers.findIndex(sub => sub.id === subscriptionId);
            if (index !== -1) {
                pathSubscribers.splice(index, 1);
            }
        }
    }

    notifySubscribers(path, newValue, oldValue) {
        // Notify exact path subscribers
        const exactSubscribers = this.subscribers.get(path) || [];
        exactSubscribers.forEach(({ callback, options }) => {
            try {
                callback(newValue, oldValue);
            } catch (error) {
                console.error('Error in state subscriber:', error);
            }
        });

        // Notify wildcard subscribers (e.g., "user.*" matches "user.currentUser")
        this.subscribers.forEach((subscribers, subscriberPath) => {
            if (subscriberPath.endsWith('*')) {
                const basePath = subscriberPath.slice(0, -1);
                if (path.startsWith(basePath)) {
                    subscribers.forEach(({ callback, options }) => {
                        try {
                            callback(newValue, oldValue);
                        } catch (error) {
                            console.error('Error in wildcard state subscriber:', error);
                        }
                    });
                }
            }
        });
    }

    // Middleware system for state changes
    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }

    runMiddleware(path, newValue, oldValue) {
        this.middleware.forEach(middleware => {
            try {
                middleware(path, newValue, oldValue, this.state);
            } catch (error) {
                console.error('Error in state middleware:', error);
            }
        });
    }

    // Persistence methods
    loadPersistedState() {
        try {
            const persistedState = localStorage.getItem('vib3_app_state');
            if (persistedState) {
                const parsed = JSON.parse(persistedState);
                
                // Only restore specific safe state properties
                if (parsed.ui?.theme) {
                    this.setState('ui.theme', parsed.ui.theme, false);
                }
                if (parsed.video?.userHasInteracted) {
                    this.setState('video.userHasInteracted', parsed.video.userHasInteracted, false);
                }
                if (parsed.ui?.sidebarCollapsed !== undefined) {
                    this.setState('ui.sidebarCollapsed', parsed.ui.sidebarCollapsed, false);
                }
                
                console.log('Restored persisted state');
            }
        } catch (error) {
            console.error('Error loading persisted state:', error);
        }
    }

    setupStatePersistence() {
        // Auto-save specific state changes
        const persistPaths = ['ui.theme', 'video.userHasInteracted', 'ui.sidebarCollapsed'];
        
        persistPaths.forEach(path => {
            this.subscribe(path, () => {
                this.saveStateToStorage();
            });
        });
    }

    saveStateToStorage() {
        try {
            const stateToSave = {
                ui: {
                    theme: this.getState('ui.theme'),
                    sidebarCollapsed: this.getState('ui.sidebarCollapsed')
                },
                video: {
                    userHasInteracted: this.getState('video.userHasInteracted')
                }
            };
            
            localStorage.setItem('vib3_app_state', JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Error saving state to storage:', error);
        }
    }

    // Connection monitoring
    setupConnectionMonitoring() {
        const updateConnectionStatus = () => {
            this.setState('app.connectionStatus', navigator.onLine ? 'online' : 'offline');
        };

        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);
        
        // Initial check
        updateConnectionStatus();
    }

    // Computed properties (derived state)
    computed = {
        isLoggedIn: () => Boolean(this.getState('user.currentUser')),
        hasActiveUpload: () => this.getState('ui.uploadPageActive') || this.getState('ui.uploadInProgress'),
        canPlayVideos: () => this.getState('user.isAuthenticated') && this.getState('video.userHasInteracted'),
        currentThemeClass: () => `theme-${this.getState('ui.theme')}`,
        notificationCount: () => this.getState('app.notifications')?.length || 0
    };

    // Action methods (common state operations)
    actions = {
        setUser: (user) => {
            this.setState('user.currentUser', user);
            this.setState('user.isAuthenticated', Boolean(user));
        },

        clearUser: () => {
            this.setState('user.currentUser', null);
            this.setState('user.isAuthenticated', false);
            this.setState('user.profile', null);
        },

        setCurrentPage: (page) => {
            this.setState('ui.currentPage', page);
        },

        setFeedTab: (tab) => {
            this.setState('ui.activeFeedTab', tab);
        },

        setTheme: (theme) => {
            this.setState('ui.theme', theme);
            document.body.className = this.computed.currentThemeClass();
        },

        setUploadActive: (active) => {
            this.setState('ui.uploadPageActive', active);
        },

        setUploadPageActive: (active) => {
            this.setState('ui.uploadPageActive', active);
        },

        setUploadInProgress: (inProgress) => {
            this.setState('ui.uploadInProgress', inProgress);
        },

        setUploadProgress: (progress) => {
            this.setState('ui.uploadInProgress', progress > 0 && progress < 100);
            this.setState('video.uploadProgress', progress);
        },

        setCurrentlyPlayingVideo: (video) => {
            this.setState('video.currentlyPlayingVideo', video);
        },

        setUserInteracted: (interacted) => {
            this.setState('video.userHasInteracted', interacted);
        },

        addNotification: (notification) => {
            const notifications = this.getState('app.notifications') || [];
            notifications.push({
                id: Date.now(),
                timestamp: new Date(),
                ...notification
            });
            this.setState('app.notifications', notifications);
        },

        removeNotification: (id) => {
            const notifications = this.getState('app.notifications') || [];
            this.setState('app.notifications', notifications.filter(n => n.id !== id));
        },

        updateLastActivity: () => {
            this.setState('app.lastActivity', Date.now());
        }
    };

    // Debug methods
    debug() {
        console.group('🏪 State Manager Debug');
        console.log('Current State:', this.state);
        console.log('Subscribers:', this.subscribers);
        console.log('Middleware:', this.middleware);
        console.groupEnd();
    }

    // Method to reset state (useful for testing)
    reset() {
        this.state = {
            user: { currentUser: null, isAuthenticated: false, profile: null, preferences: {} },
            ui: { currentPage: 'home', activeFeedTab: 'foryou', sidebarCollapsed: false, theme: 'dark', uploadPageActive: false, uploadInProgress: false },
            video: { currentlyPlayingVideo: null, userHasInteracted: false, feedVideos: [], uploadProgress: 0, selectedVideoFile: null },
            app: { isLoading: false, connectionStatus: 'online', lastActivity: Date.now(), notifications: [] }
        };
        this.notifySubscribers('*', this.state, {});
    }
}

// Create singleton instance
const stateManager = new StateManager();

// Make globally available
window.stateManager = stateManager;

// Export for modules
export default stateManager;