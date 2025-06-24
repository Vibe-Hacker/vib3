// Video deletion fix - NEW VERSION TO BYPASS CACHE
console.log('🚀 Video deletion fix v2 loaded - CACHE BUSTED VERSION');

// Override confirmDeleteVideo immediately when it becomes available
function setupVideoDeleteion() {
    console.log('🔧 Setting up video deletion override...');
    
    // Wait for confirmDeleteVideo to exist, then override it
    const checkForFunction = setInterval(() => {
        if (window.confirmDeleteVideo) {
            console.log('✅ Found confirmDeleteVideo, overriding now...');
            clearInterval(checkForFunction);
            
            // Store original function
            const originalConfirm = window.confirmDeleteVideo;
            
            // Override with immediate UI removal
            window.confirmDeleteVideo = function() {
                console.log('🎯 ENHANCED confirmDeleteVideo called!');
                console.log('🎯 currentVideoToDelete:', window.currentVideoToDelete);
                
                if (window.currentVideoToDelete) {
                    const { videoId, videoData } = window.currentVideoToDelete;
                    console.log('🎯 Deleting video:', videoId);
                    console.log('🎯 Video data:', videoData);
                    console.log('🎯 Video URL:', videoData?.videoUrl);
                    
                    // Stop any playing video immediately
                    console.log('🔇 Stopping video audio...');
                    stopVideoAudio(videoId, videoData);
                    
                    // Remove from UI immediately - no delays
                    console.log('🗑️ Removing from UI...');
                    const removed = removeVideoFromUI(videoId, videoData);
                    console.log('🗑️ UI removal result:', removed);
                    
                    // Close modal
                    console.log('🚪 Closing modal...');
                    if (window.closeDeleteModal) {
                        window.closeDeleteModal();
                    }
                    
                    // Call backend deletion
                    console.log('📡 Calling backend deletion...');
                    if (window.profileManager && window.profileManager.deleteVideo) {
                        // Use setTimeout to avoid blocking UI removal
                        setTimeout(() => {
                            console.log('📡 Executing backend deletion...');
                            window.profileManager.deleteVideo(videoId, videoData, true);
                        }, 100);
                    }
                    
                    // Clear current video
                    window.currentVideoToDelete = null;
                    console.log('✅ confirmDeleteVideo processing complete');
                } else {
                    console.warn('⚠️ No currentVideoToDelete found!');
                }
            };
            
            console.log('✅ confirmDeleteVideo successfully overridden!');
        }
    }, 50);
    
    // Stop checking after 10 seconds
    setTimeout(() => {
        clearInterval(checkForFunction);
    }, 10000);
    
    // BACKUP: Add direct click listener to delete modal buttons
    addDirectDeleteModalListener();
}
}

function stopVideoAudio(videoId, videoData) {
    console.log('🔇 Stopping video audio for:', videoId);
    
    // Find and stop all videos that might be playing
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((video, index) => {
        if (video.src && (video.src.includes(videoId) || (videoData.videoUrl && video.src === videoData.videoUrl))) {
            video.pause();
            video.currentTime = 0;
            video.muted = true;
            console.log(`🔇 Stopped video ${index}`);
        }
    });
    
    // Also stop profile grid videos
    const profileVideos = document.querySelectorAll('#userVideosGrid video');
    profileVideos.forEach((video, index) => {
        video.pause();
        video.currentTime = 0;
        video.muted = true;
        console.log(`🔇 Stopped profile video ${index}`);
    });
}

function removeVideoFromUI(videoId, videoData) {
    console.log('🗑️ Starting video UI removal for:', videoId);
    console.log('🗑️ Video data:', videoData);
    console.log('🗑️ Video URL:', videoData?.videoUrl);
    
    let removed = false;
    
    // First, log all existing video items for debugging
    const allItems = document.querySelectorAll('#userVideosGrid .profile-video-item');
    console.log('🔍 Total video items in grid:', allItems.length);
    
    allItems.forEach((item, index) => {
        const dataId = item.getAttribute('data-video-id');
        const video = item.querySelector('video');
        const videoSrc = video?.src;
        console.log(`🔍 Item ${index}:`, {
            dataVideoId: dataId,
            videoSrc: videoSrc,
            matchesId: dataId === videoId,
            matchesUrl: videoSrc === videoData?.videoUrl
        });
    });
    
    // Method 1: Find by data-video-id
    console.log('🔍 Method 1: Looking for data-video-id=' + videoId);
    const elementById = document.querySelector(`[data-video-id="${videoId}"]`);
    console.log('🔍 Found element by ID:', elementById);
    
    if (elementById) {
        console.log('✅ Found by data-video-id, removing immediately...');
        elementById.remove();
        console.log('✅ Element removed from DOM');
        removed = true;
    }
    
    // Method 2: Find by video URL
    if (!removed && videoData && videoData.videoUrl) {
        console.log('🔍 Method 2: Searching by video URL:', videoData.videoUrl);
        
        for (let i = 0; i < allItems.length; i++) {
            const item = allItems[i];
            const video = item.querySelector('video');
            
            console.log(`🔍 Checking item ${i}:`, {
                video: video,
                videoSrc: video?.src,
                targetUrl: videoData.videoUrl,
                matches: video?.src === videoData.videoUrl
            });
            
            if (video && video.src === videoData.videoUrl) {
                console.log(`✅ Found by URL at index ${i}, removing...`);
                item.remove();
                console.log('✅ Item removed from DOM by URL');
                removed = true;
                break;
            }
        }
    }
    
    // Method 3: Partial match
    if (!removed) {
        console.log('🔍 Method 3: Trying partial URL match for videoId:', videoId);
        const currentItems = document.querySelectorAll('#userVideosGrid .profile-video-item');
        
        for (const item of currentItems) {
            const video = item.querySelector('video');
            console.log('🔍 Checking for partial match:', {
                videoSrc: video?.src,
                includes: video?.src?.includes(videoId)
            });
            
            if (video && video.src && video.src.includes(videoId)) {
                console.log('✅ Found by partial match, removing...');
                item.remove();
                console.log('✅ Item removed from DOM by partial match');
                removed = true;
                break;
            }
        }
    }
    
    // Final check
    console.log('🗑️ Final removal result:', removed);
    
    // Check if grid is now empty
    setTimeout(() => {
        const remainingVideos = document.querySelectorAll('#userVideosGrid .profile-video-item');
        console.log('🔍 After removal - remaining videos:', remainingVideos.length);
        
        if (remainingVideos.length === 0) {
            const noVideosMessage = document.getElementById('noVideosMessage');
            if (noVideosMessage) {
                noVideosMessage.style.display = 'block';
                console.log('✅ Showing no videos message');
            }
        }
    }, 100);
    
    return removed;
}

// Backup function to add direct click listeners to modal buttons
function addDirectDeleteModalListener() {
    console.log('🔧 Adding backup delete modal listeners...');
    
    // Add a global click listener to catch any delete modal clicks
    document.addEventListener('click', function(e) {
        // Check if clicked element is the confirm delete button
        if (e.target.classList.contains('confirm-delete-btn') || 
            e.target.closest('.confirm-delete-btn')) {
            
            console.log('🎯 CONFIRM DELETE BUTTON CLICKED VIA BACKUP LISTENER!');
            console.log('🎯 Target classes:', e.target.className);
            console.log('🎯 Target innerHTML:', e.target.innerHTML);
            
            e.preventDefault();
            e.stopPropagation();
            
            // Call our enhanced confirmDeleteVideo function directly
            if (window.confirmDeleteVideo) {
                console.log('🎯 Calling confirmDeleteVideo via backup...');
                window.confirmDeleteVideo();
            } else {
                console.error('🚫 confirmDeleteVideo not found!');
            }
        }
        
        // Also handle delete modal show to check structure
        if (e.target.classList.contains('delete-video-btn') || 
            e.target.closest('.delete-video-btn')) {
            
            console.log('🎯 Delete video button clicked, modal should show');
            
            // After modal shows, log its structure
            setTimeout(() => {
                const modal = document.getElementById('deleteModal');
                if (modal) {
                    console.log('🔍 Delete modal found:', modal);
                    const confirmBtn = modal.querySelector('.confirm-delete-btn');
                    console.log('🔍 Confirm button in modal:', confirmBtn);
                    console.log('🔍 Confirm button onclick:', confirmBtn?.onclick);
                    console.log('🔍 Confirm button outerHTML:', confirmBtn?.outerHTML);
                }
            }, 100);
        }
    }, true); // Use capture phase
    
    console.log('✅ Backup delete modal listeners added');
}

// Start setup immediately
setupVideoDeleteion();

console.log('🚀 Video deletion fix v2 initialized');