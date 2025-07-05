// Emergency initialization fix for vib3-complete.js
// This MUST load before vib3-complete.js to prevent initialization errors

console.log('🚨 INIT-FIX.JS: Emergency initialization patch loading...');

// Define apiCallLimiter before vib3-complete.js tries to use it
if (typeof window.apiCallLimiter === 'undefined') {
    window.apiCallLimiter = {
        calls: new Map(),
        limit: 10,
        window: 60000,
        canMakeCall(key) {
            const now = Date.now();
            if (!this.calls.has(key)) {
                this.calls.set(key, []);
            }
            const calls = this.calls.get(key);
            const recentCalls = calls.filter(time => now - time < this.window);
            this.calls.set(key, recentCalls);
            return recentCalls.length < this.limit;
        },
        recordCall(key) {
            if (!this.calls.has(key)) {
                this.calls.set(key, []);
            }
            this.calls.get(key).push(Date.now());
        }
    };
    console.log('✅ apiCallLimiter initialized');
}

// Define liveStreamingState before vib3-complete.js tries to use it
if (typeof window.liveStreamingState === 'undefined') {
    window.liveStreamingState = {
        isActive: false,
        startTime: null,
        viewers: 0,
        title: '',
        category: '',
        stream: null
    };
    console.log('✅ liveStreamingState initialized');
}

// Define publishRemix before it's called
if (typeof window.publishRemix === 'undefined') {
    window.publishRemix = function(originalVideoId, remixData) {
        console.log('🎬 Publishing remix for video:', originalVideoId);
        if (window.showNotification) {
            window.showNotification('Remix feature coming soon! 🎵', 'info');
        }
    };
    console.log('✅ publishRemix defined');
}

// Override setupLivePreview to fix the error
window.setupLivePreview = function() {
    console.log('📹 FIXED setupLivePreview running...');
    
    // Ensure liveStreamingState exists
    if (!window.liveStreamingState) {
        window.liveStreamingState = {
            isActive: false,
            startTime: null,
            viewers: 0,
            title: '',
            category: '',
            stream: null
        };
    }
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            console.log('✅ Camera and microphone access granted');
            window.liveStreamingState.stream = stream;
            
            const previewVideo = document.getElementById('live-preview');
            if (previewVideo) {
                previewVideo.srcObject = stream;
                previewVideo.muted = true;
                previewVideo.play();
            }
            
            if (window.showNotification) {
                window.showNotification('Live preview ready! 📺', 'success');
            }
        })
        .catch(error => {
            console.error('❌ Failed to setup live preview:', error);
            let message = 'Camera access failed';
            
            if (error.name === 'NotAllowedError') {
                message = 'Camera permission denied. Please allow camera access.';
            } else if (error.name === 'NotFoundError') {
                message = 'No camera found on this device.';
            }
            
            if (window.showNotification) {
                window.showNotification(message, 'error');
            }
        });
};

// Override startLiveStream to fix the error
window.startLiveStream = function() {
    console.log('🔴 FIXED startLiveStream running...');
    
    if (!window.liveStreamingState) {
        window.liveStreamingState = {
            isActive: false,
            startTime: null,
            viewers: 0,
            title: '',
            category: '',
            stream: null
        };
    }
    
    if (!window.liveStreamingState.stream) {
        console.log('No stream yet, setting up preview first...');
        window.setupLivePreview();
        return;
    }
    
    window.liveStreamingState.isActive = true;
    window.liveStreamingState.startTime = Date.now();
    
    if (window.showNotification) {
        window.showNotification('Live stream started! 🔴', 'success');
    }
};

console.log('✅ INIT-FIX.JS: All patches applied successfully!');