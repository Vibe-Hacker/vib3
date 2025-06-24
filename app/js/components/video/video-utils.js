// Video utility functions extracted from inline JavaScript

/**
 * Handles video metadata loading and applies appropriate styling
 * @param {HTMLVideoElement} video - The video element
 */
export function handleVideoMetadata(video) {
    console.log('Video loaded - dimensions:', video.videoWidth, 'x', video.videoHeight);
    
    if (video.videoWidth > video.videoHeight) {
        // Landscape video - add class for cropping
        video.classList.add('landscape');
        console.log('Added landscape class to video');
    } else {
        // Portrait video - ensure no landscape class
        video.classList.remove('landscape');
        console.log('Portrait video - no special styling');
    }
}

// Make function available globally for inline onloadedmetadata handlers
// TODO: Replace with proper event listeners
window.handleVideoMetadata = handleVideoMetadata;