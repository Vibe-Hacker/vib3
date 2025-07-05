// DEPRECATED - This file has been replaced with vib3-complete-v2.js
// Redirecting to new version to avoid cache issues

console.warn('⚠️ Loading deprecated vib3-complete.js - redirecting to new version');

// Dynamically load the new version
(function() {
    const script = document.createElement('script');
    script.src = 'js/vib3-complete-v2.js?v=' + Date.now();
    script.onload = function() {
        console.log('✅ Loaded vib3-complete-v2.js');
    };
    script.onerror = function() {
        console.error('❌ Failed to load vib3-complete-v2.js');
    };
    document.head.appendChild(script);
})();