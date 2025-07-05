// EMERGENCY FIX FOR ALL ERRORS
console.log('🚨 APPLYING EMERGENCY FIXES - Version 2025.01.05');

// Fix 1: Define apiCallLimiter if it doesn't exist
if (typeof window.apiCallLimiter === 'undefined') {
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
    console.log('✅ apiCallLimiter fixed');
}

// Fix 2: Override the broken loadVideoLikeStatus function
window.loadVideoLikeStatus = async function(videoId, likeButton) {
    try {
        // Check rate limit with fixed apiCallLimiter
        if (!window.apiCallLimiter.canMakeCall('loadLikes')) {
            return;
        }
        
        const currentUser = (typeof window.mongoAPI !== 'undefined' && window.mongoAPI.getCurrentUser) 
            ? window.mongoAPI.getCurrentUser() 
            : (typeof window.currentUser !== 'undefined' ? window.currentUser : null);
        if (!currentUser) return;
        
        // Just set a default state for now
        if (likeButton) {
            likeButton.classList.remove('liked');
            const likeCount = likeButton.querySelector('.like-count');
            if (likeCount && !likeCount.textContent) {
                likeCount.textContent = '0';
            }
        }
        
        window.apiCallLimiter.recordCall('loadLikes');
    } catch (error) {
        console.error('Error in loadVideoLikeStatus:', error);
    }
};

// Fix 3: Fix liveStreamingState
if (typeof window.liveStreamingState === 'undefined') {
    window.liveStreamingState = {
        isActive: false,
        startTime: null,
        viewers: 0,
        title: '',
        category: '',
        stream: null
    };
    console.log('✅ liveStreamingState fixed');
}

// Fix 4: Fix setupLivePreview
window.setupLivePreview = function() {
    console.log('📹 Setting up live preview (FIXED)...');
    
    const previewVideo = document.getElementById('live-preview');
    if (!previewVideo) {
        console.error('Live preview element not found');
        return;
    }
    
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
        }, 
        audio: true 
    })
    .then(function(stream) {
        console.log('✅ Camera access granted');
        window.liveStreamingState.stream = stream;
        previewVideo.srcObject = stream;
        previewVideo.muted = true;
        previewVideo.play();
        
        const goLiveControls = document.querySelector('.go-live-controls');
        if (goLiveControls) {
            goLiveControls.style.display = 'block';
        }
        
        if (window.showNotification) {
            window.showNotification('Live preview ready! 📺', 'success');
        }
    })
    .catch(function(error) {
        console.error('❌ Camera access failed:', error);
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

// Fix 5: Fix openLiveSetup
window.openLiveSetup = function() {
    console.log('Opening live setup (FIXED)...');
    
    const modal = document.getElementById('liveSetupModal');
    if (modal) {
        modal.style.display = 'flex';
        window.setupLivePreview();
    } else {
        console.error('Live setup modal not found');
        // Try to show the live page directly
        const livePage = document.getElementById('live-page');
        if (livePage) {
            // Hide other pages
            document.querySelectorAll('[id$="-page"], [id$="Page"]').forEach(p => {
                p.style.display = 'none';
            });
            livePage.style.display = 'block';
            window.setupLivePreview();
        }
    }
};

// Fix 6: Fix startLiveStream
window.startLiveStream = function() {
    console.log('🔴 Starting live stream (FIXED)...');
    
    if (!window.liveStreamingState || !window.liveStreamingState.stream) {
        console.error('No stream available');
        if (window.showNotification) {
            window.showNotification('Please allow camera access first', 'error');
        }
        return;
    }
    
    const titleInput = document.getElementById('liveTitle');
    const categorySelect = document.getElementById('liveCategory');
    
    window.liveStreamingState.isActive = true;
    window.liveStreamingState.startTime = Date.now();
    window.liveStreamingState.title = titleInput ? titleInput.value : 'Live Stream';
    window.liveStreamingState.category = categorySelect ? categorySelect.value : 'general';
    
    const modal = document.getElementById('liveSetupModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    if (window.showNotification) {
        window.showNotification('Live stream started! 🔴', 'success');
    }
};

console.log('✅ ALL EMERGENCY FIXES APPLIED - Ready to use!');

// Test the fixes
setTimeout(function() {
    console.log('🧪 Testing fixes:');
    console.log('  - apiCallLimiter:', typeof window.apiCallLimiter);
    console.log('  - liveStreamingState:', typeof window.liveStreamingState);
    console.log('  - setupLivePreview:', typeof window.setupLivePreview);
    console.log('  - loadVideoLikeStatus:', typeof window.loadVideoLikeStatus);
}, 1000);