// Enhanced UI/UX JavaScript Functions
// Global UI enhancement utilities for VIB3

// ================ NOTIFICATION SYSTEM ================
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.init();
    }

    init() {
        // Create toast container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.setAttribute('aria-live', 'polite');
            this.container.setAttribute('aria-label', 'Notifications');
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
        }
    }

    show(options = {}) {
        const {
            message = 'Notification',
            title = null,
            type = 'info', // success, error, warning, info, loading
            duration = 4000,
            persistent = false,
            icon = null,
            action = null
        } = options;

        const id = Date.now() + Math.random();
        const toast = this.createToast(id, { message, title, type, icon, action, persistent });
        
        this.container.appendChild(toast);
        this.notifications.set(id, toast);

        // Trigger show animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto dismiss if not persistent
        if (!persistent && duration > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, duration);
        }

        return id;
    }

    createToast(id, { message, title, type, icon, action, persistent }) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

        const iconMap = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
            loading: '⏳'
        };

        const toastIcon = icon || iconMap[type];

        toast.innerHTML = `
            <div class="toast-content">
                ${toastIcon ? `<div class="toast-icon">${toastIcon}</div>` : ''}
                <div class="toast-text">
                    ${title ? `<div class="toast-title">${title}</div>` : ''}
                    <div class="toast-message">${message}</div>
                </div>
            </div>
            ${!persistent ? '<button class="toast-close" aria-label="Close notification">×</button>' : ''}
            ${type === 'loading' ? '<div class="toast-progress"></div>' : ''}
        `;

        // Add click handlers
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.dismiss(id));
        }

        toast.addEventListener('click', (e) => {
            if (e.target !== closeBtn && action) {
                action();
                this.dismiss(id);
            }
        });

        return toast;
    }

    dismiss(id) {
        const toast = this.notifications.get(id);
        if (toast) {
            toast.classList.add('hide');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                this.notifications.delete(id);
            }, 300);
        }
    }

    dismissAll() {
        this.notifications.forEach((_, id) => this.dismiss(id));
    }

    updateProgress(id, progress) {
        const toast = this.notifications.get(id);
        if (toast) {
            const progressBar = toast.querySelector('.toast-progress');
            if (progressBar) {
                progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
            }
        }
    }
}

// Global notification manager instance
window.notificationManager = new NotificationManager();

// Convenience functions
window.showToast = (message, type = 'info', duration = 4000) => {
    return window.notificationManager.show({ message, type, duration });
};

window.showSuccess = (message, duration = 3000) => {
    return window.notificationManager.show({ message, type: 'success', duration });
};

window.showError = (message, duration = 5000) => {
    return window.notificationManager.show({ message, type: 'error', duration });
};

window.showWarning = (message, duration = 4000) => {
    return window.notificationManager.show({ message, type: 'warning', duration });
};

window.showLoadingNotification = (message) => {
    return window.notificationManager.show({ 
        message, 
        type: 'loading', 
        persistent: true 
    });
};

// ================ LOADING STATE MANAGER ================
class LoadingManager {
    constructor() {
        this.loadingStates = new Set();
        this.overlay = null;
    }

    show(message = 'Loading...', subtext = null) {
        const id = Date.now() + Math.random();
        this.loadingStates.add(id);

        if (!this.overlay) {
            this.createOverlay();
        }

        this.updateOverlay(message, subtext);
        this.overlay.classList.add('active');

        return id;
    }

    hide(id) {
        if (id) {
            this.loadingStates.delete(id);
        }

        if (this.loadingStates.size === 0 && this.overlay) {
            this.overlay.classList.remove('active');
        }
    }

    hideAll() {
        this.loadingStates.clear();
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';
        this.overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <div class="loading-text">Loading...</div>
                <div class="loading-subtext"></div>
            </div>
        `;
        document.body.appendChild(this.overlay);
    }

    updateOverlay(message, subtext) {
        if (this.overlay) {
            const textEl = this.overlay.querySelector('.loading-text');
            const subtextEl = this.overlay.querySelector('.loading-subtext');
            
            if (textEl) textEl.textContent = message;
            if (subtextEl) {
                subtextEl.textContent = subtext || '';
                subtextEl.style.display = subtext ? 'block' : 'none';
            }
        }
    }
}

window.loadingManager = new LoadingManager();

// ================ SKELETON SCREEN UTILITIES ================
window.createVideoSkeleton = () => {
    return `
        <div class="video-skeleton">
            <div class="video-skeleton-container">
                <div class="skeleton-video"></div>
                <div class="video-skeleton-actions">
                    <div class="video-skeleton-action"></div>
                    <div class="video-skeleton-action"></div>
                    <div class="video-skeleton-action"></div>
                    <div class="video-skeleton-action"></div>
                </div>
            </div>
            <div class="video-skeleton-info">
                <div class="skeleton-profile"></div>
                <div class="video-skeleton-info-text">
                    <div class="skeleton-text skeleton-text-medium"></div>
                    <div class="skeleton-text skeleton-text-long"></div>
                    <div class="skeleton-text skeleton-text-short"></div>
                </div>
            </div>
        </div>
    `;
};

window.showSkeletonScreen = (container, count = 3) => {
    if (typeof container === 'string') {
        container = document.querySelector(container);
    }
    
    if (container) {
        const skeletons = Array.from({ length: count }, () => window.createVideoSkeleton()).join('');
        container.innerHTML = `<div class="stagger-animation">${skeletons}</div>`;
    }
};

// ================ ENHANCED ERROR HANDLING ================
window.showErrorState = (container, options = {}) => {
    const {
        title = 'Something went wrong',
        message = 'We encountered an error. Please try again.',
        icon = '⚠️',
        retry = null,
        home = true
    } = options;

    if (typeof container === 'string') {
        container = document.querySelector(container);
    }

    if (container) {
        container.innerHTML = `
            <div class="error-empty-state">
                <div class="empty-state-icon">${icon}</div>
                <div class="empty-state-title">${title}</div>
                <div class="empty-state-message">${message}</div>
                <div class="empty-state-actions">
                    ${retry ? `<button class="empty-state-btn" onclick="${retry}">Try Again</button>` : ''}
                    ${home ? `<button class="empty-state-btn secondary" onclick="switchFeedTab('foryou')">Go Home</button>` : ''}
                </div>
            </div>
        `;
    }
};

window.showEmptyState = (container, options = {}) => {
    const {
        title = 'Nothing here yet',
        message = 'Be the first to create something amazing!',
        icon = '🎬',
        action = null,
        actionText = 'Get Started'
    } = options;

    if (typeof container === 'string') {
        container = document.querySelector(container);
    }

    if (container) {
        container.innerHTML = `
            <div class="no-videos-state">
                <div class="empty-state-icon">${icon}</div>
                <div class="empty-state-title">${title}</div>
                <div class="empty-state-message">${message}</div>
                ${action ? `
                    <div class="empty-state-actions">
                        <button class="empty-state-btn" onclick="${action}">${actionText}</button>
                    </div>
                ` : ''}
            </div>
        `;
    }
};

// ================ ACTION FEEDBACK SYSTEM ================
window.showActionFeedback = (element, type, text) => {
    const rect = element.getBoundingClientRect();
    const feedback = document.createElement('div');
    feedback.className = `action-feedback ${type}`;
    feedback.textContent = text;
    feedback.style.left = rect.left + rect.width / 2 + 'px';
    feedback.style.top = rect.top + rect.height / 2 + 'px';
    
    document.body.appendChild(feedback);
    
    requestAnimationFrame(() => {
        feedback.classList.add('show');
    });

    setTimeout(() => {
        feedback.remove();
    }, 1000);
};

// ================ RIPPLE EFFECT ================
window.addRippleEffect = (element) => {
    element.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple-effect');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
};

// ================ ACCESSIBILITY ENHANCEMENTS ================
window.enhanceAccessibility = () => {
    // Add skip links
    if (!document.querySelector('.skip-link')) {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // Add ARIA live region for dynamic content updates
    if (!document.querySelector('.live-region')) {
        const liveRegion = document.createElement('div');
        liveRegion.className = 'live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(liveRegion);
    }

    // Enhanced keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation-active');
        }
    });

    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation-active');
    });

    // Add tooltips to action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        if (!btn.hasAttribute('data-tooltip')) {
            const type = btn.querySelector('.action-icon')?.textContent || 'Action';
            btn.setAttribute('data-tooltip', type);
        }
    });
};

// ================ CONNECTION STATUS ================
class ConnectionMonitor {
    constructor() {
        this.indicator = null;
        this.isOnline = navigator.onLine;
        this.init();
    }

    init() {
        this.createIndicator();
        
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateStatus();
            window.showSuccess('Connection restored');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateStatus();
            window.showError('Connection lost', 0);
        });

        this.updateStatus();
    }

    createIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.className = 'connection-indicator';
        this.indicator.innerHTML = `
            <div class="connection-indicator-content">
                <div class="connection-indicator-icon"></div>
                <span class="connection-indicator-text">Online</span>
            </div>
        `;
        document.body.appendChild(this.indicator);
    }

    updateStatus() {
        const text = this.indicator.querySelector('.connection-indicator-text');
        
        if (this.isOnline) {
            this.indicator.className = 'connection-indicator online show';
            text.textContent = 'Online';
            
            setTimeout(() => {
                this.indicator.classList.remove('show');
            }, 3000);
        } else {
            this.indicator.className = 'connection-indicator offline show';
            text.textContent = 'Offline';
        }
    }
}

// ================ PERFORMANCE OPTIMIZATIONS ================
window.optimizePerformance = () => {
    // Lazy loading for images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Smooth scrolling optimization
    if ('scrollBehavior' in document.documentElement.style) {
        document.documentElement.style.scrollBehavior = 'smooth';
    }

    // Reduce motion for users who prefer it
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.style.setProperty('--animation-duration', '0.01ms');
        document.documentElement.style.setProperty('--transition-duration', '0.01ms');
    }
};

// ================ INITIALIZATION ================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all enhancement systems
    window.enhanceAccessibility();
    window.optimizePerformance();
    new ConnectionMonitor();

    // Add ripple effects to interactive elements
    document.querySelectorAll('.action-btn, .sidebar-item, .feed-tab').forEach(el => {
        window.addRippleEffect(el);
    });

    console.log('🎨 UI/UX enhancements initialized');
});

// Export for use in other modules
window.UIEnhancements = {
    NotificationManager,
    LoadingManager,
    ConnectionMonitor,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showLoadingNotification,
    showErrorState,
    showEmptyState,
    showActionFeedback,
    createVideoSkeleton,
    showSkeletonScreen,
    addRippleEffect,
    enhanceAccessibility,
    optimizePerformance
};