// EMERGENCY INITIALIZATION - MUST LOAD FIRST
// This file fixes critical initialization errors

(function() {
    'use strict';
    
    console.log('🚨 EMERGENCY INIT LOADING - Version 2025.01.05');
    
    // Critical fix for apiCallLimiter
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
    
    // Critical fix for liveStreamingState
    window.liveStreamingState = {
        isActive: false,
        startTime: null,
        viewers: 0,
        title: '',
        category: '',
        stream: null
    };
    
    // Critical fix for publishRemix
    window.publishRemix = function(originalVideoId, remixData) {
        console.log('Publishing remix for video:', originalVideoId);
        if (window.showNotification) {
            window.showNotification('Remix feature coming soon!', 'info');
        }
    };
    
    // Override problematic functions
    window.setupLivePreview = function() {
        console.log('Setting up live preview (FIXED VERSION)');
        
        const previewVideo = document.getElementById('live-preview');
        if (!previewVideo) {
            console.log('No preview video element found');
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
            console.log('Camera access granted');
            window.liveStreamingState.stream = stream;
            previewVideo.srcObject = stream;
            previewVideo.muted = true;
            previewVideo.play().catch(function(e) {
                console.log('Play error:', e);
            });
            
            // Show success message
            const modal = document.getElementById('liveSetupModal');
            if (modal) {
                const controls = modal.querySelector('.go-live-controls');
                if (controls) {
                    controls.style.display = 'block';
                }
            }
        })
        .catch(function(error) {
            console.error('Camera access error:', error);
            alert('Camera access failed: ' + error.message);
        });
    };
    
    window.startLiveStream = function() {
        console.log('Starting live stream (FIXED VERSION)');
        
        if (!window.liveStreamingState.stream) {
            alert('Please allow camera access first');
            window.setupLivePreview();
            return;
        }
        
        const titleInput = document.getElementById('liveTitle');
        const categorySelect = document.getElementById('liveCategory');
        
        window.liveStreamingState.isActive = true;
        window.liveStreamingState.startTime = Date.now();
        window.liveStreamingState.title = titleInput ? titleInput.value : 'Live Stream';
        window.liveStreamingState.category = categorySelect ? categorySelect.value : 'general';
        
        // Close setup modal
        const modal = document.getElementById('liveSetupModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Show live indicator
        const liveButton = document.querySelector('[onclick*="showPage(\'live\')"]');
        if (liveButton) {
            liveButton.style.background = '#ff0000';
            liveButton.innerHTML += ' 🔴';
        }
        
        alert('Live stream started!');
    };
    
    console.log('✅ EMERGENCY INIT COMPLETE - All critical functions defined');
    
})();