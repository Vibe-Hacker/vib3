// VIB3 Complete Fixed - Emergency replacement for cached version
// This file includes all necessary fixes for live streaming

// Initialize core variables at the top to prevent initialization errors
let apiCallLimiter = {
    calls: 0,
    maxCalls: 100,
    resetInterval: 60000,
    lastReset: Date.now()
};

// Initialize live streaming state BEFORE any functions use it
let liveStreamingState = {
    isActive: false,
    startTime: null,
    viewers: 0,
    title: '',
    category: '',
    stream: null
};

// Define all missing functions that are being called
function setupLivePreview() {
    console.log('📹 Setting up live preview...');
    
    try {
        // Check camera and microphone permissions
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }, 
            audio: true 
        })
        .then(stream => {
            console.log('✅ Camera and microphone access granted');
            const previewVideo = document.getElementById('live-preview');
            if (previewVideo) {
                previewVideo.srcObject = stream;
                previewVideo.muted = true;
                previewVideo.play();
            }
            liveStreamingState.stream = stream;
            if (window.showToast) {
                window.showToast('Live preview ready! 📺', 'success');
            }
        })
        .catch(error => {
            console.error('❌ Failed to setup live preview:', error);
            let errorMessage = 'Unable to access camera and microphone.';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera/microphone access denied. Please check your browser permissions.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera or microphone found on this device.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'Camera/microphone is already in use by another application.';
            }
            
            if (window.showToast) {
                window.showToast(errorMessage, 'error');
            }
        });
            
    } catch (error) {
        console.error('❌ Failed to setup live preview:', error);
        if (window.showToast) {
            window.showToast('Live streaming setup failed', 'error');
        }
    }
}

function openLiveSetup() {
    console.log('🎬 Opening live setup...');
    setupLivePreview();
    if (window.showToast) {
        window.showToast('Live setup interface coming soon! 🎬', 'info');
    }
}

function startLiveStream() {
    console.log('🔴 Starting live stream...');
    
    if (!liveStreamingState.stream) {
        console.error('❌ No camera stream available');
        if (window.showToast) {
            window.showToast('Please allow camera access first', 'error');
        }
        setupLivePreview();
        return;
    }
    
    liveStreamingState.isActive = true;
    liveStreamingState.startTime = Date.now();
    
    if (window.showToast) {
        window.showToast('Live stream started! 🔴', 'success');
    }
}

function stopLiveStream() {
    console.log('⏹️ Stopping live stream...');
    
    if (liveStreamingState.stream) {
        liveStreamingState.stream.getTracks().forEach(track => track.stop());
        liveStreamingState.isActive = false;
        liveStreamingState.stream = null;
    }
    
    if (window.showToast) {
        window.showToast('Live stream stopped', 'info');
    }
}

function publishRemix(originalVideoId, remixData) {
    console.log('🎬 Publishing remix for video:', originalVideoId);
    if (window.showToast) {
        window.showToast('Remix feature coming soon! 🎵', 'info');
    }
}

function startRemix(videoId) {
    console.log('🎵 Starting remix for video:', videoId);
    if (window.showToast) {
        window.showToast('Remix creator coming soon! 🎤', 'info');
    }
}

function createDuet(videoId) {
    console.log('👥 Creating duet for video:', videoId);
    if (window.showToast) {
        window.showToast('Duet feature coming soon! 🎭', 'info');
    }
}

// Make all functions globally available
window.setupLivePreview = setupLivePreview;
window.openLiveSetup = openLiveSetup;
window.startLiveStream = startLiveStream;
window.stopLiveStream = stopLiveStream;
window.publishRemix = publishRemix;
window.startRemix = startRemix;
window.createDuet = createDuet;
window.liveStreamingState = liveStreamingState;
window.apiCallLimiter = apiCallLimiter;

// Load the full vib3-complete-v2.js file
console.log('📦 Loading full VIB3 Complete v2...');
const script = document.createElement('script');
script.src = 'js/vib3-complete-v2.js?v=' + Date.now();
script.onload = function() {
    console.log('✅ Loaded vib3-complete-v2.js');
};
script.onerror = function() {
    console.error('❌ Failed to load vib3-complete-v2.js');
};
document.head.appendChild(script);