// EMERGENCY REDIRECT - Railway is caching old version
// Force load the fixed version with all initialization issues resolved

console.warn('⚠️ EMERGENCY: Redirecting to vib3-complete-fixed.js due to Railway cache');

(function() {
    // Define critical variables immediately to prevent errors
    window.liveStreamingState = window.liveStreamingState || {
        isActive: false,
        startTime: null,
        viewers: 0,
        title: '',
        category: '',
        stream: null
    };
    
    window.apiCallLimiter = window.apiCallLimiter || {
        calls: 0,
        maxCalls: 100,
        resetInterval: 60000,
        lastReset: Date.now()
    };
    
    // Load the fixed version
    const script = document.createElement('script');
    script.src = 'js/vib3-complete-fixed.js?v=' + Date.now();
    script.async = false; // Load synchronously to ensure variables are available
    document.head.appendChild(script);
})();