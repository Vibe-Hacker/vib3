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
window.openLiveSetup = openLiveSetup;
window.startLiveStream = startLiveStream;
window.stopLiveStream = stopLiveStream;

console.log('✅ Live functions loaded');