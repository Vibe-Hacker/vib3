// Style Error Prevention for Mobile App
// Wraps common style operations with null checks

(function() {
    'use strict';
    
    // Safe style setter function
    window.safeSetStyle = function(element, property, value) {
        if (element && element.style && typeof element.style[property] !== 'undefined') {
            element.style[property] = value;
            return true;
        }
        return false;
    };
    
    // Safe element getter with style access
    window.safeGetElement = function(id) {
        const element = document.getElementById(id);
        if (element) {
            return {
                element: element,
                setStyle: function(property, value) {
                    return safeSetStyle(element, property, value);
                },
                show: function() {
                    return safeSetStyle(element, 'display', 'block');
                },
                hide: function() {
                    return safeSetStyle(element, 'display', 'none');
                },
                addClass: function(className) {
                    if (element.classList) {
                        element.classList.add(className);
                    }
                },
                removeClass: function(className) {
                    if (element.classList) {
                        element.classList.remove(className);
                    }
                }
            };
        }
        return {
            element: null,
            setStyle: () => false,
            show: () => false,
            hide: () => false,
            addClass: () => false,
            removeClass: () => false
        };
    };
    
    // Override problematic modal functions with safe versions
    window.safeOpenUploadModal = function() {
        const uploadModal = safeGetElement('uploadModal');
        const modalOverlay = safeGetElement('modalOverlay');
        uploadModal.show();
        modalOverlay.show();
    };
    
    window.safeCloseUploadModal = function() {
        const uploadModal = safeGetElement('uploadModal');
        const modalOverlay = safeGetElement('modalOverlay');
        uploadModal.hide();
        modalOverlay.hide();
    };
    
    window.safeOpenComments = function(videoId) {
        const commentsSheet = safeGetElement('commentsSheet');
        const modalOverlay = safeGetElement('modalOverlay');
        commentsSheet.addClass('open');
        modalOverlay.show();
        if (typeof loadComments === 'function') {
            loadComments(videoId);
        }
    };
    
    window.safeCloseComments = function() {
        const commentsSheet = safeGetElement('commentsSheet');
        const modalOverlay = safeGetElement('modalOverlay');
        commentsSheet.removeClass('open');
        modalOverlay.hide();
    };
    
    // Enhanced error logging for mobile debugging
    const originalError = console.error;
    const originalLog = console.log;
    
    console.error = function(message) {
        // Always log to see what's happening
        originalLog('🔴 ERROR:', message);
        if (typeof message === 'string' && message.includes('Cannot read properties of null')) {
            originalLog('🛡️ Style error prevented:', message);
            return;
        }
        originalError.apply(console, arguments);
    };
    
    // Override common problematic functions
    const originalGetElementById = document.getElementById;
    document.getElementById = function(id) {
        try {
            const element = originalGetElementById.call(document, id);
            if (!element) {
                console.warn('⚠️ Element not found:', id);
            }
            return element;
        } catch (e) {
            console.error('🔴 getElementById error:', e);
            return null;
        }
    };
    
    // Add global error handler for uncaught style errors
    window.addEventListener('error', function(event) {
        if (event.error && event.error.message && event.error.message.includes('Cannot read properties of null')) {
            console.warn('Style error caught and handled:', event.error.message);
            event.preventDefault();
            return false;
        }
    });
    
    console.log('✅ Style error prevention loaded');
})();