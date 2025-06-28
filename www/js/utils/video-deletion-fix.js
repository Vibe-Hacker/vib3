// Immediate video deletion fix - simplified version
console.log('🚀 Video deletion fix loaded - SIMPLIFIED VERSION');

// Track deletion to prevent doubles
let deletionInProgress = new Set();

// Function to stop video audio before deletion
function stopVideoAudio(videoId) {
    console.log('🔇 Stopping audio for video:', videoId);
    
    // Find video by data-video-id
    const videoElement = document.querySelector(`[data-video-id="${videoId}"]`);
    if (videoElement) {
        const video = videoElement.querySelector('video');
        if (video) {
            video.pause();
            video.currentTime = 0;
            video.muted = true;
            console.log('🔇 Video stopped and muted');
        }
    }
    
    // Also check all videos in profile grid
    const allVideoItems = document.querySelectorAll('#userVideosGrid .profile-video-item video');
    allVideoItems.forEach((video, index) => {
        if (video.src && video.src.includes(videoId)) {
            video.pause();
            video.currentTime = 0;
            video.muted = true;
            console.log(`🔇 Profile video ${index} stopped and muted`);
        }
    });
}

function forceRemoveVideoFromUI(videoId, videoData) {
    console.log('🎯 Force removing video from UI:', videoId);
    console.log('🎯 Video data:', videoData);
    
    // Check if already being deleted
    if (deletionInProgress.has(videoId)) {
        console.log('🚫 Video already being deleted, skipping');
        return true;
    }
    
    // Mark as in progress
    deletionInProgress.add(videoId);
    
    let removed = false;
    
    // Method 1: By data-video-id
    console.log('🔍 Method 1: Looking for element with data-video-id=' + videoId);
    const elementById = document.querySelector(`[data-video-id="${videoId}"]`);
    console.log('🔍 Found element by ID:', elementById);
    
    if (elementById) {
        console.log('✅ Found by data-video-id, removing immediately...');
        // Remove immediately, no animation delay
        elementById.remove();
        console.log('✅ Element removed from DOM');
        checkForEmptyGrid();
        deletionInProgress.delete(videoId);
        removed = true;
    }
    
    // Method 2: By video URL (more aggressive search)
    if (!removed && videoData && videoData.videoUrl) {
        console.log('🔄 Method 2: Searching by video URL...');
        console.log('🔄 Target URL:', videoData.videoUrl);
        
        const allItems = document.querySelectorAll('#userVideosGrid .profile-video-item');
        console.log('🔄 Found', allItems.length, 'video items to check');
        
        for (let i = 0; i < allItems.length; i++) {
            const item = allItems[i];
            const video = item.querySelector('video');
            const itemId = item.getAttribute('data-video-id');
            
            console.log(`🔄 Checking item ${i}:`, {
                dataVideoId: itemId,
                videoSrc: video?.src,
                matchesId: itemId === videoId,
                matchesUrl: video?.src === videoData.videoUrl
            });
            
            if ((video && video.src === videoData.videoUrl) || itemId === videoId) {
                console.log(`✅ Found match at item ${i}, removing immediately...`);
                item.remove();
                console.log('✅ Item removed from DOM');
                checkForEmptyGrid();
                deletionInProgress.delete(videoId);
                removed = true;
                break;
            }
        }
    }
    
    // Method 3: Remove any video containing the videoId in its URL
    if (!removed) {
        console.log('🔄 Method 3: Searching by partial URL match...');
        const allItems = document.querySelectorAll('#userVideosGrid .profile-video-item');
        
        for (const item of allItems) {
            const video = item.querySelector('video');
            if (video && video.src && video.src.includes(videoId)) {
                console.log('✅ Found by partial URL match, removing...');
                item.remove();
                checkForEmptyGrid();
                deletionInProgress.delete(videoId);
                removed = true;
                break;
            }
        }
    }
    
    // If still not removed, clean up
    if (!removed) {
        console.log('❌ Could not find video to remove');
        deletionInProgress.delete(videoId);
    }
    
    console.log('🎯 Final removal result:', removed);
    return removed;
}

function checkForEmptyGrid() {
    setTimeout(() => {
        const remainingVideos = document.querySelectorAll('#userVideosGrid .profile-video-item');
        console.log('Checking empty grid - remaining videos:', remainingVideos.length);
        
        if (remainingVideos.length === 0) {
            const noVideosMessage = document.getElementById('noVideosMessage');
            if (noVideosMessage) {
                noVideosMessage.style.display = 'block';
                console.log('Showing no videos message');
            }
        }
    }, 100);
}

// Simple approach - just override the functions we need
function setupSimpleVideoDelation() {
    // Override confirmDeleteVideo to include immediate UI removal
    if (window.confirmDeleteVideo) {
        const originalConfirm = window.confirmDeleteVideo;
        window.confirmDeleteVideo = function() {
            console.log('🎯 Enhanced confirmDeleteVideo called');
            
            if (window.currentVideoToDelete) {
                const { videoId, videoData } = window.currentVideoToDelete;
                
                console.log('🎯 Removing video from UI immediately:', videoId);
                
                // Stop any playing audio/video first
                stopVideoAudio(videoId);
                
                // Remove from UI immediately for better UX
                const removed = forceRemoveVideoFromUI(videoId, videoData);
                console.log('🎯 UI removal result:', removed);
                
                // Call backend deletion but don't wait for UI
                if (window.profileManager) {
                    // Call deleteVideo with special flag to skip UI removal
                    window.profileManager.deleteVideo(videoId, videoData, true);
                }
                
                // Close modal
                if (window.closeDeleteModal) {
                    window.closeDeleteModal();
                }
                
                // Clear the current video to delete
                window.currentVideoToDelete = null;
            }
        };
    }
}

// Wait for functions to be available
function waitAndSetup() {
    if (window.confirmDeleteVideo) {
        setupSimpleVideoDelation();
        console.log('✅ Video deletion enhancement applied');
    } else {
        setTimeout(waitAndSetup, 100);
    }
}

waitAndSetup();

export { forceRemoveVideoFromUI, checkForEmptyGrid };