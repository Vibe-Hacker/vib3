// Aggressive video stopping utility for navigation
function forceStopAllVideos() {
    console.log('🚨 FORCE STOPPING ALL VIDEOS');
    
    // Find all video elements on the page
    const allVideos = document.querySelectorAll('video');
    console.log(`Found ${allVideos.length} video elements to force stop`);
    
    allVideos.forEach((video, index) => {
        try {
            // Immediately pause
            video.pause();
            
            // Reset time
            video.currentTime = 0;
            
            // Mute completely
            video.muted = true;
            video.volume = 0;
            
            // Remove src to stop loading
            const originalSrc = video.src;
            video.removeAttribute('src');
            video.load(); // This stops any loading/buffering
            
            // Restore src but keep paused
            video.src = originalSrc;
            
            console.log(`🛑 Force stopped video ${index}`);
        } catch (error) {
            console.log(`Failed to stop video ${index}:`, error.message);
        }
    });
    
    // Also try to stop any audio contexts
    try {
        if (window.AudioContext || window.webkitAudioContext) {
            // Suspend any active audio contexts
            if (window.audioContext && window.audioContext.state === 'running') {
                window.audioContext.suspend();
                console.log('🔇 Suspended audio context');
            }
        }
    } catch (error) {
        console.log('Audio context suspension failed:', error.message);
    }
    
    console.log('✅ Force stop complete');
}

// Make globally available
window.forceStopAllVideos = forceStopAllVideos;

// Don't use export in non-module script
// export default forceStopAllVideos;