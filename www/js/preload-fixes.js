// PRELOAD FIXES - This must run BEFORE any other scripts
console.log('🚨 PRELOAD FIXES LOADING - Version 2025.01.05.003');

// Immediately define all missing variables
window.apiCallLimiter = {
    calls: new Map(),
    limit: 10,
    window: 60000,
    canMakeCall: function(key) {
        const now = Date.now();
        if (!this.calls.has(key)) {
            this.calls.set(key, []);
        }
        const calls = this.calls.get(key);
        const recentCalls = calls.filter(time => now - time < this.window);
        this.calls.set(key, recentCalls);
        return recentCalls.length < this.limit;
    },
    recordCall: function(key) {
        if (!this.calls.has(key)) {
            this.calls.set(key, []);
        }
        this.calls.get(key).push(Date.now());
    }
};

window.liveStreamingState = {
    isActive: false,
    startTime: null,
    viewers: 0,
    title: '',
    category: '',
    stream: null
};

// Prevent the old vib3-complete.js from loading
document.addEventListener('DOMContentLoaded', function() {
    // Find and remove any dynamically added vib3-complete.js scripts
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
        if (script.src && script.src.includes('vib3-complete.js')) {
            console.log('🚫 Blocking old vib3-complete.js:', script.src);
            script.remove();
        }
    });
});

// Monitor for dynamic script additions
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
            if (node.tagName === 'SCRIPT' && node.src && node.src.includes('vib3-complete.js')) {
                console.log('🚫 Blocking dynamically added vib3-complete.js:', node.src);
                node.remove();
            }
        });
    });
});

observer.observe(document.documentElement, {
    childList: true,
    subtree: true
});

console.log('✅ PRELOAD FIXES READY - All variables defined');