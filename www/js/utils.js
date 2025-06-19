// Utility functions - no modules

// Show notification
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4ecdc4' : type === 'error' ? '#ff6b6b' : '#45b7d1'};
        color: white;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease, slideOut 0.3s ease ${duration}ms;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, duration);
}

// Format date
function formatDate(date) {
    if (!date) return 'Unknown date';
    
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diff = now - dateObj;
    
    // Less than 1 minute
    if (diff < 60000) {
        return 'Just now';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than 1 day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than 1 week
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Default to date string
    return dateObj.toLocaleDateString();
}

// Format number (e.g., 1.2K, 1.5M)
function formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    return (num / 1000000).toFixed(1) + 'M';
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate username
function isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Show loading spinner
function showLoader(container, message = 'Loading...') {
    const loader = document.createElement('div');
    loader.className = 'loader-container';
    loader.innerHTML = `
        <div class="loader"></div>
        <p>${message}</p>
    `;
    
    loader.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: white;
        z-index: 1000;
    `;
    
    container.appendChild(loader);
    return loader;
}

// Hide loading spinner
function hideLoader(loader) {
    if (loader && loader.parentNode) {
        loader.remove();
    }
}

// Create skeleton loader
function createSkeleton(count = 3) {
    const skeletons = [];
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'video-skeleton';
        skeleton.style.marginBottom = '20px';
        skeletons.push(skeleton);
    }
    return skeletons;
}

// Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Log debug message (only in debug mode)
function debugLog(...args) {
    if (window.appConfig && window.appConfig.debug) {
        console.log('[VIB3 Debug]:', ...args);
    }
}

// Handle async errors
async function handleAsync(asyncFunc) {
    try {
        const result = await asyncFunc();
        return { success: true, data: result };
    } catch (error) {
        console.error('Async error:', error);
        return { success: false, error: error.message };
    }
}

// Add CSS animation styles
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .loader {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top-color: #ff6b6b;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// Initialize utility styles
addAnimationStyles();

// Make functions globally available
window.showNotification = showNotification;
window.formatDate = formatDate;
window.formatNumber = formatNumber;
window.debounce = debounce;
window.throttle = throttle;
window.isValidEmail = isValidEmail;
window.isValidUsername = isValidUsername;
window.generateId = generateId;
window.showLoader = showLoader;
window.hideLoader = hideLoader;
window.createSkeleton = createSkeleton;
window.isInViewport = isInViewport;
window.debugLog = debugLog;
window.handleAsync = handleAsync;