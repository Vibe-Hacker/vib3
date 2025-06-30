// Simple video deletion fix - direct injection
(function() {
    console.log('🚀 Simple video deletion fix loading...');
    
    // Wait for DOM and all other scripts to load
    function initializeVideoDeleteFix() {
        console.log('🔧 Initializing video delete fix...');
        
        // Override confirmDeleteVideo function
        const originalConfirm = window.confirmDeleteVideo;
        
        window.confirmDeleteVideo = function() {
            console.log('🎯 ENHANCED confirmDeleteVideo called!');
            console.log('🎯 currentVideoToDelete:', window.currentVideoToDelete);
            
            if (window.currentVideoToDelete) {
                const { videoId, videoData } = window.currentVideoToDelete;
                console.log('🎯 Deleting video:', videoId);
                console.log('🎯 Video data:', videoData);
                
                // Stop video audio immediately and properly
                console.log('🔇 Stopping ALL video audio to prevent background playback...');
                const allVideos = document.querySelectorAll('video');
                allVideos.forEach((video, index) => {
                    video.pause();
                    video.currentTime = 0;
                    video.muted = true;
                    // Remove video sources to prevent any background playback
                    if (video.srcObject) {
                        video.srcObject = null;
                    }
                    if (video.src && !video.src.includes('blob:')) {
                        video.removeAttribute('src');
                        video.load();
                    }
                    console.log(`🔇 Fully stopped video ${index}`);
                });
                
                // Remove from UI immediately
                console.log('🗑️ Removing from UI...');
                let removed = false;
                
                // Method 1: By data-video-id in PROFILE GRID specifically
                const profileElement = document.querySelector(`#userVideosGrid [data-video-id="${videoId}"]`);
                console.log('🔍 Found PROFILE element by ID:', profileElement);
                
                if (profileElement) {
                    console.log('✅ Removing PROFILE element by ID...');
                    profileElement.remove();
                    removed = true;
                    console.log('✅ PROFILE Element removed');
                }
                
                // Method 2: By video URL
                if (!removed && videoData && videoData.videoUrl) {
                    console.log('🔍 Searching by URL:', videoData.videoUrl);
                    const allItems = document.querySelectorAll('#userVideosGrid .profile-video-item');
                    
                    for (let i = 0; i < allItems.length; i++) {
                        const item = allItems[i];
                        const video = item.querySelector('video');
                        
                        if (video && video.src === videoData.videoUrl) {
                            console.log(`✅ Found by URL at index ${i}, removing...`);
                            item.remove();
                            removed = true;
                            break;
                        }
                    }
                }
                
                console.log('🗑️ Final removal result:', removed);
                
                // Check if grid is empty
                setTimeout(() => {
                    const remainingVideos = document.querySelectorAll('#userVideosGrid .profile-video-item');
                    console.log('🔍 Remaining videos:', remainingVideos.length);
                    
                    if (remainingVideos.length === 0) {
                        const noVideosMessage = document.getElementById('noVideosMessage');
                        if (noVideosMessage) {
                            noVideosMessage.style.display = 'block';
                            console.log('✅ Showing no videos message');
                        }
                    }
                }, 100);
                
                // Close modal
                if (window.closeDeleteModal) {
                    window.closeDeleteModal();
                }
                
                // Call backend deletion
                if (window.profileManager && window.profileManager.deleteVideo) {
                    setTimeout(() => {
                        console.log('📡 Calling backend deletion...');
                        window.profileManager.deleteVideo(videoId, videoData, true);
                    }, 200);
                }
                
                // Clear current video
                window.currentVideoToDelete = null;
                console.log('✅ Video deletion complete');
            } else {
                console.warn('⚠️ No currentVideoToDelete found!');
            }
        };
        
        console.log('✅ confirmDeleteVideo overridden successfully');
        
        // Override showDeleteModal to add debugging
        const originalShowDeleteModal = window.showDeleteModal;
        window.showDeleteModal = function(videoId, videoData) {
            console.log('🔧 Enhanced showDeleteModal called:', videoId);
            console.log('🔧 Video data:', videoData);
            
            // Store video data for deletion
            window.currentVideoToDelete = { videoId, videoData };
            console.log('🔧 Stored currentVideoToDelete:', window.currentVideoToDelete);
            
            const modal = document.getElementById('deleteModal');
            console.log('🔧 Found modal element:', modal);
            
            if (modal) {
                console.log('🔧 Modal current style.display:', modal.style.display);
                console.log('🔧 Modal computed display:', window.getComputedStyle(modal).display);
                
                modal.style.display = 'flex';
                modal.style.visibility = 'visible';
                modal.style.opacity = '1';
                modal.style.zIndex = '9999';
                
                console.log('🔧 Modal after setting display:', modal.style.display);
                console.log('✅ Delete modal should now be visible');
            } else {
                console.error('❌ Delete modal element not found!');
            }
        };
        
        // Add backup click listener
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('confirm-delete-btn') || 
                e.target.closest('.confirm-delete-btn')) {
                
                console.log('🎯 BACKUP: Confirm delete clicked!');
                e.preventDefault();
                e.stopPropagation();
                
                if (window.confirmDeleteVideo) {
                    window.confirmDeleteVideo();
                }
            }
        }, true);
        
        console.log('✅ Backup listeners added');
    }
    
    // Wait for everything to load
    if (document.readyState === 'complete') {
        setTimeout(initializeVideoDeleteFix, 1000);
    } else {
        window.addEventListener('load', () => {
            setTimeout(initializeVideoDeleteFix, 1000);
        });
    }
    
    console.log('🚀 Simple video deletion fix initialized');
})();