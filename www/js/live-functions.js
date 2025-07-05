// Live streaming functions for modular architecture
// These functions handle live streaming UI and interactions

// Make sure liveStreamingState is available
if (typeof liveStreamingState === 'undefined') {
    window.liveStreamingState = {
        isActive: false,
        startTime: null,
        viewers: 0,
        title: '',
        category: '',
        stream: null
    };
}

// Setup live preview with camera access
function setupLivePreview() {
    console.log('📹 Setting up live preview...');
    
    try {
        // Check if liveStreamingState exists
        if (!window.liveStreamingState) {
            console.error('❌ liveStreamingState not initialized');
            window.liveStreamingState = {
                isActive: false,
                startTime: null,
                viewers: 0,
                title: '',
                category: '',
                stream: null
            };
        }
        
        // Check camera and microphone permissions with better error handling
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }, 
            audio: true 
        })
        .then(stream => {
            console.log('✅ Camera and microphone access granted');
            console.log('Stream tracks:', stream.getTracks());
            
            const previewVideo = document.getElementById('live-preview');
            if (previewVideo) {
                previewVideo.srcObject = stream;
                previewVideo.muted = true; // Mute to avoid feedback
                previewVideo.play()
                    .then(() => console.log('✅ Video playing'))
                    .catch(e => console.error('❌ Video play failed:', e));
            } else {
                console.warn('⚠️ live-preview element not found');
            }
            
            window.liveStreamingState.stream = stream;
            if (window.showToast) {
                window.showToast('Live preview ready! 📺', 'success');
            }
        })
        .catch(error => {
            console.error('❌ Failed to setup live preview:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            
            let errorMessage = 'Unable to access camera and microphone.';
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = 'Camera/microphone access denied. Please check your browser permissions.';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = 'No camera or microphone found on this device.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = 'Camera/microphone is already in use by another application.';
            } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
                errorMessage = 'Camera does not support the requested settings.';
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

// Open live setup modal
function openLiveSetup() {
    console.log('🎬 Opening live setup...');
    
    try {
        // First setup the preview
        if (window.setupLivePreview) {
            window.setupLivePreview();
        }
        
        // Show live setup UI (if it exists)
        const liveSetupModal = document.getElementById('liveSetupModal');
        if (liveSetupModal) {
            liveSetupModal.style.display = 'block';
        } else {
            console.log('Live setup modal not found, creating basic UI...');
            // For now, just show a message
            if (window.showToast) {
                window.showToast('Live setup interface coming soon! 🎬', 'info');
            }
        }
    } catch (error) {
        console.error('❌ Failed to open live setup:', error);
        if (window.showToast) {
            window.showToast('Failed to open live setup', 'error');
        }
    }
}

// Start live stream
function startLiveStream() {
    console.log('🔴 Starting live stream...');
    
    try {
        // Check if liveStreamingState exists
        if (!window.liveStreamingState) {
            console.error('❌ liveStreamingState not initialized');
            if (window.showToast) {
                window.showToast('Live streaming not initialized', 'error');
            }
            return;
        }
        
        // Check if we have a stream
        if (!window.liveStreamingState.stream) {
            console.error('❌ No camera stream available');
            if (window.showToast) {
                window.showToast('Please allow camera access first', 'error');
            }
            // Try to setup preview first
            if (window.setupLivePreview) {
                window.setupLivePreview();
            }
            return;
        }
        
        // Update state
        window.liveStreamingState.isActive = true;
        window.liveStreamingState.startTime = Date.now();
        
        // Show success message
        if (window.showToast) {
            window.showToast('Live stream started! 🔴', 'success');
        }
        
        // TODO: Implement actual streaming logic
        console.log('Live streaming feature implementation coming soon!');
        
    } catch (error) {
        console.error('❌ Failed to start live stream:', error);
        if (window.showToast) {
            window.showToast('Failed to start live stream', 'error');
        }
    }
}

// Stop live stream
function stopLiveStream() {
    console.log('⏹️ Stopping live stream...');
    
    try {
        if (window.liveStreamingState && window.liveStreamingState.stream) {
            // Stop all tracks
            window.liveStreamingState.stream.getTracks().forEach(track => track.stop());
            
            // Reset state
            window.liveStreamingState.isActive = false;
            window.liveStreamingState.stream = null;
            window.liveStreamingState.startTime = null;
            window.liveStreamingState.viewers = 0;
        }
        
        if (window.showToast) {
            window.showToast('Live stream stopped', 'info');
        }
    } catch (error) {
        console.error('❌ Failed to stop live stream:', error);
    }
}

// Make functions globally available
window.setupLivePreview = setupLivePreview;
window.openLiveSetup = openLiveSetup;
window.startLiveStream = startLiveStream;
window.stopLiveStream = stopLiveStream;

console.log('✅ Live functions loaded');