// Comprehensive Loading States Manager
// Provides centralized loading state management for all UI interactions

class LoadingManager {
    constructor() {
        this.activeLoadings = new Map();
        this.loadingHistory = [];
        this.defaultOptions = {
            showSpinner: true,
            showOverlay: false,
            showProgress: false,
            disableInteraction: false,
            message: 'Loading...',
            position: 'center',
            timeout: 30000,
            showCancel: false
        };
        
        this.init();
    }

    init() {
        console.log('⏳ Loading manager initialized');
        
        // Set up loading state subscriptions
        this.setupStateSubscriptions();
        
        // Set up global loading functions
        this.setupGlobalLoadingFunctions();
        
        // Set up loading UI components
        this.setupLoadingComponents();
        
        // Make globally available
        window.loadingManager = this;
    }

    setupStateSubscriptions() {
        if (!window.stateManager) return;
        
        // Subscribe to app loading state
        window.stateManager.subscribe('app.isLoading', (isLoading) => {
            if (isLoading) {
                this.showGlobalLoading();
            } else {
                this.hideGlobalLoading();
            }
        });

        // Subscribe to upload progress
        window.stateManager.subscribe('video.uploadProgress', (progress) => {
            if (this.activeLoadings.has('upload')) {
                this.updateProgress('upload', progress);
            }
        });

        // Subscribe to upload in progress
        window.stateManager.subscribe('ui.uploadInProgress', (inProgress) => {
            if (inProgress && !this.activeLoadings.has('upload')) {
                this.show('upload', {
                    message: 'Uploading video...',
                    showProgress: true,
                    showCancel: true,
                    disableInteraction: true
                });
            } else if (!inProgress && this.activeLoadings.has('upload')) {
                this.hide('upload');
            }
        });
    }

    setupGlobalLoadingFunctions() {
        // Make loading functions globally available
        window.showLoading = (id, options) => this.show(id, options);
        window.hideLoading = (id) => this.hide(id);
        window.updateLoadingProgress = (id, progress) => this.updateProgress(id, progress);
        window.updateLoadingMessage = (id, message) => this.updateMessage(id, message);
    }

    setupLoadingComponents() {
        // Create global loading overlay
        this.createGlobalLoadingOverlay();
        
        // Create loading spinner styles
        this.injectLoadingStyles();
    }

    createGlobalLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'globalLoadingOverlay';
        overlay.className = 'loading-overlay global-loading';
        overlay.style.display = 'none';
        
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-message">Loading...</div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    injectLoadingStyles() {
        const styles = `
            <style id="loading-manager-styles">
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(5px);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .loading-overlay.visible {
                    opacity: 1;
                }

                .loading-content {
                    background: var(--bg-secondary);
                    padding: 30px;
                    border-radius: 15px;
                    text-align: center;
                    color: var(--text-primary);
                    min-width: 200px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    margin: 0 auto 20px;
                    border: 4px solid var(--border-primary);
                    border-top: 4px solid var(--accent-primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .loading-message {
                    font-size: 16px;
                    font-weight: 500;
                    margin-bottom: 10px;
                }

                .loading-progress {
                    width: 100%;
                    height: 6px;
                    background: var(--border-primary);
                    border-radius: 3px;
                    margin: 15px 0;
                    overflow: hidden;
                }

                .loading-progress-bar {
                    height: 100%;
                    background: linear-gradient(45deg, var(--accent-primary), var(--accent-secondary));
                    border-radius: 3px;
                    transition: width 0.3s ease;
                    width: 0%;
                }

                .loading-cancel-btn {
                    margin-top: 15px;
                    padding: 8px 16px;
                    background: var(--bg-tertiary);
                    color: var(--text-secondary);
                    border: 1px solid var(--border-primary);
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .loading-cancel-btn:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Inline loading states */
                .loading-inline {
                    position: relative;
                    pointer-events: none;
                    opacity: 0.6;
                }

                .loading-inline::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 20px;
                    height: 20px;
                    margin: -10px 0 0 -10px;
                    border: 2px solid var(--border-primary);
                    border-top: 2px solid var(--accent-primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    z-index: 1;
                }

                /* Button loading states */
                .btn-loading {
                    position: relative;
                    pointer-events: none;
                    color: transparent !important;
                }

                .btn-loading::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 16px;
                    height: 16px;
                    margin: -8px 0 0 -8px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                /* Skeleton loading */
                .skeleton {
                    background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-hover) 50%, var(--bg-tertiary) 75%);
                    background-size: 200% 100%;
                    animation: skeleton-pulse 1.5s ease-in-out infinite;
                    border-radius: 4px;
                }

                @keyframes skeleton-pulse {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // Main loading management methods
    show(id, options = {}) {
        const config = { ...this.defaultOptions, ...options };
        
        // Store loading state
        const loadingState = {
            id,
            config,
            startTime: Date.now(),
            element: null,
            timeoutId: null
        };

        this.activeLoadings.set(id, loadingState);
        
        // Create loading UI
        loadingState.element = this.createLoadingElement(id, config);
        
        // Set up timeout
        if (config.timeout > 0) {
            loadingState.timeoutId = setTimeout(() => {
                this.hide(id, 'timeout');
            }, config.timeout);
        }

        // Track in history
        this.trackLoading(id, 'start', config);
        
        // Update state
        if (window.stateManager && id === 'global') {
            window.stateManager.setState('app.isLoading', true);
        }

        console.log(`⏳ Started loading: ${id}`);
        return loadingState;
    }

    hide(id, reason = 'completed') {
        const loadingState = this.activeLoadings.get(id);
        if (!loadingState) return;

        // Clear timeout
        if (loadingState.timeoutId) {
            clearTimeout(loadingState.timeoutId);
        }

        // Remove loading UI
        if (loadingState.element) {
            this.removeLoadingElement(loadingState.element);
        }

        // Calculate duration
        const duration = Date.now() - loadingState.startTime;
        
        // Track in history
        this.trackLoading(id, 'end', { reason, duration });
        
        // Remove from active loadings
        this.activeLoadings.delete(id);
        
        // Update state
        if (window.stateManager && id === 'global') {
            window.stateManager.setState('app.isLoading', false);
        }

        console.log(`✅ Finished loading: ${id} (${duration}ms, ${reason})`);
    }

    updateProgress(id, progress) {
        const loadingState = this.activeLoadings.get(id);
        if (!loadingState || !loadingState.config.showProgress) return;

        const progressBar = loadingState.element?.querySelector('.loading-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
        }

        console.log(`📊 Updated progress for ${id}: ${progress}%`);
    }

    updateMessage(id, message) {
        const loadingState = this.activeLoadings.get(id);
        if (!loadingState) return;

        const messageEl = loadingState.element?.querySelector('.loading-message');
        if (messageEl) {
            messageEl.textContent = message;
        }

        console.log(`💬 Updated message for ${id}: ${message}`);
    }

    createLoadingElement(id, config) {
        const overlay = document.createElement('div');
        overlay.className = `loading-overlay loading-${id}`;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const content = document.createElement('div');
        content.className = 'loading-content';
        
        let contentHTML = '';
        
        if (config.showSpinner) {
            contentHTML += '<div class="loading-spinner"></div>';
        }
        
        contentHTML += `<div class="loading-message">${config.message}</div>`;
        
        if (config.showProgress) {
            contentHTML += `
                <div class="loading-progress">
                    <div class="loading-progress-bar"></div>
                </div>
            `;
        }
        
        if (config.showCancel) {
            contentHTML += `
                <button class="loading-cancel-btn" onclick="window.loadingManager.cancel('${id}')">
                    Cancel
                </button>
            `;
        }
        
        content.innerHTML = contentHTML;
        overlay.appendChild(content);
        
        // Add to DOM
        document.body.appendChild(overlay);
        
        // Trigger animation
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });

        return overlay;
    }

    removeLoadingElement(element) {
        if (!element) return;
        
        element.classList.remove('visible');
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
    }

    cancel(id) {
        console.log(`❌ Cancelled loading: ${id}`);
        this.hide(id, 'cancelled');
        
        // Emit cancel event
        if (window.stateManager) {
            window.stateManager.setState('app.lastCancelledLoading', { id, timestamp: Date.now() });
        }
    }

    // Global loading methods
    showGlobalLoading(message = 'Loading...') {
        return this.show('global', {
            message,
            showSpinner: true,
            disableInteraction: true
        });
    }

    hideGlobalLoading() {
        this.hide('global');
    }

    // Button loading states
    setButtonLoading(button, loading = true) {
        if (typeof button === 'string') {
            button = document.querySelector(button);
        }
        
        if (!button) return;
        
        if (loading) {
            button.classList.add('btn-loading');
            button.disabled = true;
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
        }
    }

    // Element loading states
    setElementLoading(element, loading = true) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return;
        
        if (loading) {
            element.classList.add('loading-inline');
        } else {
            element.classList.remove('loading-inline');
        }
    }

    // Skeleton loading
    showSkeleton(container, count = 3) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) return;
        
        const skeletonHTML = Array(count).fill().map(() => `
            <div class="skeleton" style="height: 20px; margin: 10px 0; border-radius: 4px;"></div>
        `).join('');
        
        container.innerHTML = skeletonHTML;
    }

    hideSkeleton(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) return;
        
        const skeletons = container.querySelectorAll('.skeleton');
        skeletons.forEach(skeleton => skeleton.remove());
    }

    // Utility methods
    trackLoading(id, action, data = {}) {
        const entry = {
            id,
            action,
            timestamp: Date.now(),
            data
        };
        
        this.loadingHistory.push(entry);
        
        // Keep only last 100 entries
        if (this.loadingHistory.length > 100) {
            this.loadingHistory.shift();
        }
    }

    isLoading(id) {
        return this.activeLoadings.has(id);
    }

    getActiveLoadings() {
        return Array.from(this.activeLoadings.keys());
    }

    getLoadingHistory() {
        return [...this.loadingHistory];
    }

    clearAllLoadings() {
        const activeIds = [...this.activeLoadings.keys()];
        activeIds.forEach(id => this.hide(id, 'cleared'));
        console.log('🧹 Cleared all active loadings');
    }

    // Preset loading patterns
    showAuthLoading() {
        return this.show('auth', {
            message: 'Signing in...',
            showSpinner: true,
            timeout: 15000
        });
    }

    showVideoLoading() {
        return this.show('video', {
            message: 'Loading videos...',
            showSpinner: true,
            position: 'center',
            timeout: 10000
        });
    }

    showUploadLoading() {
        return this.show('upload', {
            message: 'Preparing upload...',
            showSpinner: true,
            showProgress: true,
            showCancel: true,
            disableInteraction: true,
            timeout: 0 // No timeout for uploads
        });
    }

    showDataLoading(message = 'Loading data...') {
        return this.show('data', {
            message,
            showSpinner: true,
            timeout: 20000
        });
    }
}

// Initialize loading manager
const loadingManager = new LoadingManager();

export default loadingManager;