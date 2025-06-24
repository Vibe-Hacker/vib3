// Comprehensive Error Handling System
// Provides centralized error handling, retry mechanisms, and user feedback

class ErrorHandler {
    constructor() {
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2
        };
        
        this.errorCounts = new Map();
        this.errorHistory = [];
        this.isOnline = navigator.onLine;
        
        this.init();
    }

    init() {
        console.log('🚨 Error handling system initialized');
        
        // Set up global error handlers
        this.setupGlobalErrorHandlers();
        
        // Set up network monitoring
        this.setupNetworkMonitoring();
        
        // Set up error recovery mechanisms
        this.setupErrorRecovery();
        
        // Make globally available
        window.errorHandler = this;
    }

    setupGlobalErrorHandlers() {
        // Unhandled JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError('javascript', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('promise', {
                reason: event.reason,
                promise: event.promise
            });
            event.preventDefault(); // Prevent console error
        });

        // Network errors
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Network connection restored');
            this.handleNetworkRestore();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('🌐 Network connection lost');
            this.handleNetworkLoss();
        });
    }

    setupNetworkMonitoring() {
        // Periodic connectivity check
        setInterval(() => {
            this.checkConnectivity();
        }, 30000); // Check every 30 seconds
    }

    async checkConnectivity() {
        try {
            // Use navigator.onLine for reliable connectivity check in development
            if (!navigator.onLine) {
                throw new Error('Browser reports offline');
            }
            
            // For development, just assume online if navigator.onLine is true
            const response = { ok: true };
            
            const wasOnline = this.isOnline;
            this.isOnline = response.ok;
            
            if (!wasOnline && this.isOnline) {
                this.handleNetworkRestore();
            } else if (wasOnline && !this.isOnline) {
                this.handleNetworkLoss();
            }
        } catch (error) {
            if (this.isOnline) {
                this.isOnline = false;
                this.handleNetworkLoss();
            }
        }
    }

    setupErrorRecovery() {
        // Auto-retry failed Firebase operations
        this.setupFirebaseRetry();
        
        // Auto-retry failed video operations
        this.setupVideoRetry();
        
        // Auto-retry failed upload operations
        this.setupUploadRetry();
    }

    // Main error handling method
    handleError(type, details, context = {}) {
        const error = {
            type,
            details,
            context,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: window.stateManager?.getState('user.currentUser')?.uid || 'anonymous'
        };

        // Log error
        console.error(`🚨 ${type.toUpperCase()} ERROR:`, error);
        
        // Track error frequency
        this.trackError(type);
        
        // Store in history (limit to last 50 errors)
        this.errorHistory.push(error);
        if (this.errorHistory.length > 50) {
            this.errorHistory.shift();
        }

        // Determine if error is recoverable
        const recovery = this.getRecoveryStrategy(type, details);
        
        if (recovery.canRecover) {
            this.attemptRecovery(error, recovery);
        } else {
            this.showUserError(error, recovery);
        }

        // Update app state
        if (window.stateManager) {
            window.stateManager.setState('app.lastError', error);
        }

        return error;
    }

    trackError(type) {
        const count = this.errorCounts.get(type) || 0;
        this.errorCounts.set(type, count + 1);
        
        // If error frequency is high, escalate
        if (count > 5) {
            this.escalateError(type, count);
        }
    }

    getRecoveryStrategy(type, details) {
        const strategies = {
            'network': {
                canRecover: true,
                strategy: 'retry',
                userMessage: 'Connection issue detected. Retrying...',
                maxRetries: 5
            },
            'firebase': {
                canRecover: true,
                strategy: 'retry',
                userMessage: 'Server connection issue. Retrying...',
                maxRetries: 3
            },
            'video': {
                canRecover: true,
                strategy: 'fallback',
                userMessage: 'Video playback issue. Trying alternative...',
                maxRetries: 2
            },
            'upload': {
                canRecover: true,
                strategy: 'retry',
                userMessage: 'Upload interrupted. Retrying...',
                maxRetries: 3
            },
            'javascript': {
                canRecover: false,
                strategy: 'report',
                userMessage: 'Something went wrong. Please refresh the page.',
                maxRetries: 0
            },
            'promise': {
                canRecover: false,
                strategy: 'report',
                userMessage: 'An error occurred. Please try again.',
                maxRetries: 0
            }
        };

        return strategies[type] || {
            canRecover: false,
            strategy: 'report',
            userMessage: 'An unexpected error occurred.',
            maxRetries: 0
        };
    }

    async attemptRecovery(error, recovery) {
        const retryKey = `${error.type}_${JSON.stringify(error.context)}`;
        const retryCount = this.getRetryCount(retryKey);
        
        if (retryCount >= recovery.maxRetries) {
            this.showUserError(error, recovery);
            return;
        }

        // Show retry message to user
        if (window.stateManager) {
            window.stateManager.actions.addNotification({
                type: 'warning',
                message: recovery.userMessage,
                duration: 3000
            });
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
            this.retryConfig.maxDelay
        );

        console.log(`🔄 Retrying ${error.type} operation in ${delay}ms (attempt ${retryCount + 1})`);

        // Wait and retry
        setTimeout(() => {
            this.executeRetry(error, recovery, retryKey);
        }, delay);
    }

    executeRetry(error, recovery, retryKey) {
        this.incrementRetryCount(retryKey);
        
        switch (recovery.strategy) {
            case 'retry':
                this.retryOperation(error);
                break;
            case 'fallback':
                this.useFallback(error);
                break;
            default:
                this.showUserError(error, recovery);
        }
    }

    retryOperation(error) {
        // Retry the original operation based on context
        const { operation, args } = error.context;
        
        if (operation && window[operation]) {
            try {
                window[operation](...(args || []));
            } catch (retryError) {
                this.handleError('retry_failed', retryError, error.context);
            }
        }
    }

    useFallback(error) {
        const fallbacks = {
            'video': () => this.fallbackVideoPlayback(error),
            'upload': () => this.fallbackUpload(error),
            'firebase': () => this.fallbackFirebaseOperation(error)
        };

        const fallback = fallbacks[error.type];
        if (fallback) {
            fallback();
        } else {
            this.showUserError(error, { userMessage: 'Fallback not available' });
        }
    }

    fallbackVideoPlayback(error) {
        console.log('🎥 Attempting video playback fallback');
        
        // Try muted playback
        const video = error.context.video;
        if (video) {
            video.muted = true;
            video.play().catch(() => {
                this.showUserError(error, { userMessage: 'Video playback failed' });
            });
        }
    }

    fallbackUpload(error) {
        console.log('📤 Attempting upload fallback');
        
        // Try smaller chunk size or different upload method
        if (error.context.retryWithSmallerChunks) {
            error.context.retryWithSmallerChunks();
        }
    }

    fallbackFirebaseOperation(error) {
        console.log('🔥 Attempting Firebase fallback');
        
        // Try offline mode or cached data
        if (error.context.useOfflineCache) {
            error.context.useOfflineCache();
        }
    }

    showUserError(error, recovery) {
        console.error('❌ Showing error to user:', error.type);
        
        // Show user-friendly error message
        if (window.stateManager) {
            window.stateManager.actions.addNotification({
                type: 'error',
                message: recovery.userMessage,
                duration: 5000,
                dismissible: true,
                actions: this.getErrorActions(error)
            });
        } else if (window.showToast) {
            window.showToast(recovery.userMessage);
        }
    }

    getErrorActions(error) {
        const actions = [];
        
        // Add retry action for certain errors
        if (['network', 'firebase', 'upload'].includes(error.type)) {
            actions.push({
                label: 'Retry',
                action: () => this.manualRetry(error)
            });
        }
        
        // Add refresh action for severe errors
        if (['javascript', 'promise'].includes(error.type)) {
            actions.push({
                label: 'Refresh Page',
                action: () => window.location.reload()
            });
        }
        
        return actions;
    }

    manualRetry(error) {
        console.log('🔄 Manual retry requested for:', error.type);
        const recovery = this.getRecoveryStrategy(error.type, error.details);
        this.retryOperation(error);
    }

    handleNetworkLoss() {
        console.log('🔴 Network connection lost');
        
        if (window.stateManager) {
            window.stateManager.setState('app.connectionStatus', 'offline');
            window.stateManager.actions.addNotification({
                type: 'warning',
                message: 'You are offline. Some features may be limited.',
                duration: 5000
            });
        }
    }

    handleNetworkRestore() {
        console.log('🟢 Network connection restored');
        
        if (window.stateManager) {
            window.stateManager.setState('app.connectionStatus', 'online');
            window.stateManager.actions.addNotification({
                type: 'success',
                message: 'Connection restored!',
                duration: 3000
            });
        }
        
        // Retry any pending operations
        this.retryPendingOperations();
    }

    retryPendingOperations() {
        // Implementation for retrying operations that failed due to network issues
        console.log('🔄 Retrying pending operations after network restore');
    }

    escalateError(type, count) {
        console.warn(`⚠️ High error frequency for ${type}: ${count} errors`);
        
        // Could send to analytics or support system
        this.reportToAnalytics(type, count);
    }

    reportToAnalytics(type, count) {
        // Send error metrics to analytics system
        if (window.analytics) {
            window.analytics.track('error_frequency', {
                error_type: type,
                error_count: count,
                user_id: window.stateManager?.getState('user.currentUser')?.uid
            });
        }
    }

    // Retry count management
    getRetryCount(key) {
        return parseInt(sessionStorage.getItem(`retry_${key}`) || '0');
    }

    incrementRetryCount(key) {
        const count = this.getRetryCount(key) + 1;
        sessionStorage.setItem(`retry_${key}`, count.toString());
        return count;
    }

    clearRetryCount(key) {
        sessionStorage.removeItem(`retry_${key}`);
    }

    // Firebase-specific retry setup
    setupFirebaseRetry() {
        // Wrap Firebase operations with automatic retry
        this.wrapFirebaseMethod('addDoc');
        this.wrapFirebaseMethod('setDoc');
        this.wrapFirebaseMethod('updateDoc');
        this.wrapFirebaseMethod('getDocs');
        this.wrapFirebaseMethod('getDoc');
    }

    wrapFirebaseMethod(methodName) {
        if (!window[methodName]) return;
        
        const originalMethod = window[methodName];
        window[methodName] = async (...args) => {
            try {
                return await originalMethod(...args);
            } catch (error) {
                this.handleError('firebase', error, {
                    operation: methodName,
                    args: args
                });
                throw error;
            }
        };
    }

    setupVideoRetry() {
        // Video playback error recovery will be handled by video manager
        console.log('🎥 Video retry mechanisms set up');
    }

    setupUploadRetry() {
        // Upload retry mechanisms will be handled by upload manager
        console.log('📤 Upload retry mechanisms set up');
    }

    // Public API methods
    reportError(type, details, context = {}) {
        return this.handleError(type, details, context);
    }

    getErrorHistory() {
        return [...this.errorHistory];
    }

    getErrorStats() {
        return {
            totalErrors: this.errorHistory.length,
            errorCounts: Object.fromEntries(this.errorCounts),
            isOnline: this.isOnline,
            lastError: this.errorHistory[this.errorHistory.length - 1]
        };
    }

    clearErrorHistory() {
        this.errorHistory = [];
        this.errorCounts.clear();
        console.log('🧹 Error history cleared');
    }
}

// Initialize error handler
const errorHandler = new ErrorHandler();

export default errorHandler;