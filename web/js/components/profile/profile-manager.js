// Profile management - extracted and enhanced from inline JavaScript
import { db } from '../../core/firebase-config.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class ProfileManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('Profile manager initializing...');
        this.setupGlobalProfileFunctions();
    }

    setupGlobalProfileFunctions() {
        window.loadUserVideos = this.loadUserVideos.bind(this);
        window.editDisplayName = this.editDisplayName.bind(this);
        window.uploadProfilePicture = this.uploadProfilePicture.bind(this);
        window.updateHeaderProfile = this.updateHeaderProfile.bind(this);
        window.loadUserProfilePicture = this.loadUserProfilePicture.bind(this);
        window.stopAllProfileVideos = this.stopAllProfileVideos.bind(this);
    }

    /**
     * Load user videos for profile page
     * @param {string} userId - The user ID to load videos for
     */
    async loadUserVideos(userId) {
        console.log(`Loading videos for user: ${userId}`);
        
        // IMPORTANT: Stop all videos immediately when profile loads
        this.stopAllProfileVideos();
        
        try {
            const videosGrid = document.getElementById('userVideosGrid');
            const noVideosMessage = document.getElementById('noVideosMessage');
            
            if (!videosGrid) {
                console.warn('userVideosGrid element not found');
                return;
            }

            // Clear existing videos
            videosGrid.innerHTML = '';
            
            if (noVideosMessage) {
                noVideosMessage.style.display = 'none';
            }

            // Query user's videos
            const q = query(collection(db, 'videos'), where('userId', '==', userId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                if (noVideosMessage) {
                    noVideosMessage.style.display = 'block';
                }
                console.log('No videos found for user');
                return;
            }

            console.log(`Found ${querySnapshot.size} videos for user`);

            // Create video grid items
            querySnapshot.forEach((doc) => {
                const videoData = doc.data();
                const videoId = doc.id;
                
                const videoItem = this.createProfileVideoItem(videoData, videoId);
                videoItem.setAttribute('data-video-id', videoId); // Add for easier deletion
                videosGrid.appendChild(videoItem);
            });

        } catch (error) {
            console.error('Error loading user videos:', error);
            if (window.showToast) {
                window.showToast('Error loading videos');
            }
        }
    }

    /**
     * Create a video item for the profile grid (vertical video small thumbnails)
     * @param {Object} videoData - Video data from Firestore
     * @param {string} videoId - Video document ID
     */
    createProfileVideoItem(videoData, videoId) {
        const videoItem = document.createElement('div');
        videoItem.className = 'profile-video-item';
        videoItem.style.cssText = `
            position: relative;
            aspect-ratio: 9/16;
            background: #000;
            border-radius: 4px;
            overflow: hidden;
            cursor: pointer;
            width: 100%;
            height: 200px;
        `;

        videoItem.innerHTML = `
            <video 
                src="${videoData.videoUrl}" 
                style="width: 100%; height: 100%; object-fit: cover;"
                muted
                preload="metadata"
            ></video>
            <div style="
                position: absolute;
                bottom: 4px;
                right: 4px;
                color: white;
                font-size: 10px;
                background: rgba(0,0,0,0.8);
                padding: 2px 4px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 2px;
            ">
                ▶ ${this.formatViews(videoData.views || 0)}
            </div>
            <button class="delete-video-btn" style="
                position: absolute;
                top: 4px;
                right: 4px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: rgba(255, 68, 68, 0.9);
                color: white;
                border: none;
                font-size: 12px;
                cursor: pointer;
                display: none;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                z-index: 10;
            " title="Delete video">
                ×
            </button>
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0);
                transition: background 0.2s;
            " class="hover-overlay"></div>
        `;

        // Add hover effect
        videoItem.addEventListener('mouseenter', () => {
            const overlay = videoItem.querySelector('.hover-overlay');
            const deleteBtn = videoItem.querySelector('.delete-video-btn');
            if (overlay) overlay.style.background = 'rgba(0,0,0,0.3)';
            if (deleteBtn) deleteBtn.style.display = 'flex';
            
            // DISABLED: No auto-play on hover for profile videos to prevent background audio
            // Profile videos should only play when clicked to view full screen
            console.log('👀 Profile video hover - autoplay disabled');
        });

        videoItem.addEventListener('mouseleave', () => {
            const overlay = videoItem.querySelector('.hover-overlay');
            const deleteBtn = videoItem.querySelector('.delete-video-btn');
            if (overlay) overlay.style.background = 'rgba(0,0,0,0)';
            if (deleteBtn) deleteBtn.style.display = 'none';
            const video = videoItem.querySelector('video');
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        });

        // Add delete button handler
        const deleteBtn = videoItem.querySelector('.delete-video-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent video from playing
            console.log('=== DELETE BUTTON CLICKED ===');
            console.log('Video ID:', videoId);
            console.log('Video data:', videoData);
            console.log('Video item element:', videoItem);
            console.log('Video item data-video-id:', videoItem.getAttribute('data-video-id'));
            
            if (window.showDeleteModal) {
                console.log('Showing delete modal');
                window.showDeleteModal(videoId, videoData);
            } else {
                console.log('No delete modal available, using direct deletion');
                // Fallback to direct deletion with confirm
                this.deleteVideo(videoId, videoData);
            }
        });

        // Add click handler to play video
        videoItem.addEventListener('click', () => {
            this.playProfileVideo(videoData, videoId);
        });

        return videoItem;
    }

    /**
     * Format view count like VIB3 (1.2K, 15M, etc.)
     */
    formatViews(views) {
        if (views < 1000) return views.toString();
        if (views < 1000000) return (views / 1000).toFixed(1) + 'K';
        return (views / 1000000).toFixed(1) + 'M';
    }

    /**
     * Play a video from the profile grid
     * @param {Object} videoData - Video data
     * @param {string} videoId - Video ID
     */
    playProfileVideo(videoData, videoId) {
        console.log('Playing profile video:', videoId);
        
        // Switch back to video feed and play this specific video
        if (window.showPage) {
            window.showPage('home');
        }
        
        // You could implement a specific video player here
        if (window.showToast) {
            window.showToast('Playing video...');
        }
    }

    /**
     * Edit display name (stub for now)
     */
    editDisplayName() {
        if (window.showToast) {
            window.showToast('Edit display name coming soon!');
        }
    }

    /**
     * Upload profile picture (stub for now)
     */
    uploadProfilePicture() {
        if (window.showToast) {
            window.showToast('Profile picture upload coming soon!');
        }
    }

    /**
     * Update header profile (stub for now)
     */
    updateHeaderProfile() {
        // Implementation for updating header profile
        console.log('Updating header profile...');
    }

    /**
     * Load user profile picture (stub for now)
     */
    loadUserProfilePicture() {
        // Implementation for loading profile picture
        console.log('Loading user profile picture...');
    }

    /**
     * Delete a video from user's profile
     * @param {string} videoId - Video document ID
     * @param {Object} videoData - Video data
     */
    async deleteVideo(videoId, videoData, skipUIRemoval = false) {
        console.log('🔥 PROFILE MANAGER deleteVideo called!', videoId);
        console.log('🔥 Skip UI removal:', skipUIRemoval);
        console.log('🔥 Current video to delete:', window.currentVideoToDelete);

        try {
            console.log(`=== STARTING VIDEO DELETION ===`);
            console.log(`Deleting video: ${videoId}`);
            console.log('Video data:', videoData);
            
            // Show loading toast
            if (window.showToast) {
                window.showToast('Deleting video...');
            }

            // Find all video items and log them for debugging
            const allVideoItems = document.querySelectorAll('#userVideosGrid .profile-video-item');
            console.log('=== ALL VIDEO ITEMS IN GRID ===');
            console.log('Total video items found:', allVideoItems.length);
            
            allVideoItems.forEach((item, index) => {
                const videoEl = item.querySelector('video');
                const dataId = item.getAttribute('data-video-id');
                console.log(`Item ${index}:`, {
                    element: item,
                    dataVideoId: dataId,
                    videoSrc: videoEl?.src,
                    matches: dataId === videoId || videoEl?.src === videoData.videoUrl
                });
            });

            // Only remove from UI if not already handled
            if (!skipUIRemoval) {
                console.log('=== UI REMOVAL IN PROFILE MANAGER ===');
                // Stop any playing video first
                allVideoItems.forEach(item => {
                    const video = item.querySelector('video');
                    const itemId = item.getAttribute('data-video-id');
                    if (video && (itemId === videoId || video.src === videoData.videoUrl)) {
                        video.pause();
                        video.currentTime = 0;
                        video.muted = true;
                        console.log('🔇 Stopped video audio in profile manager');
                    }
                });
                
                // Try to find and remove by data-video-id first
                const videoElement = document.querySelector(`[data-video-id="${videoId}"]`);
                
                let removed = false;
                
                if (videoElement) {
                    console.log('=== REMOVING VIA data-video-id ===');
                    videoElement.remove();
                    this.checkForEmptyGrid();
                    removed = true;
                } else {
                    console.log('=== FALLBACK REMOVAL BY URL ===');
                    allVideoItems.forEach((item, index) => {
                        const video = item.querySelector('video');
                        if (video && video.src === videoData.videoUrl) {
                            console.log(`=== FOUND MATCH AT INDEX ${index} - REMOVING ===`);
                            item.remove();
                            this.checkForEmptyGrid();
                            removed = true;
                            return;
                        }
                    });
                }
                
                if (!removed) {
                    console.error('=== COULD NOT FIND VIDEO TO REMOVE ===');
                }
            } else {
                console.log('=== SKIPPING UI REMOVAL - ALREADY HANDLED ===');
            }

            // Delete from Firestore
            const { deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            await deleteDoc(doc(db, 'videos', videoId));
            console.log('Video document deleted from Firestore');

            // Delete video file from Storage if URL exists
            if (videoData.videoUrl) {
                try {
                    const { deleteObject, ref } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');
                    const { storage } = await import('../../core/firebase-config.js');
                    
                    // Extract file path from URL - fix the path extraction
                    const url = new URL(videoData.videoUrl);
                    console.log('Full video URL:', videoData.videoUrl);
                    console.log('URL pathname:', url.pathname);
                    
                    // Handle Firebase Storage URL format
                    let filePath;
                    if (url.pathname.includes('/o/')) {
                        const pathStart = url.pathname.indexOf('/o/') + 3;
                        const pathEnd = url.pathname.indexOf('?');
                        filePath = decodeURIComponent(url.pathname.slice(pathStart, pathEnd > 0 ? pathEnd : undefined));
                    } else {
                        // Fallback: extract from URL search params
                        const urlParams = new URLSearchParams(url.search);
                        filePath = urlParams.get('name') || `videos/${videoId}`;
                    }
                    
                    console.log('Extracted file path for deletion:', filePath);
                    
                    const videoRef = ref(storage, filePath);
                    await deleteObject(videoRef);
                    console.log('Video file deleted from storage');
                } catch (storageError) {
                    console.warn('Could not delete video file from storage:', storageError);
                    console.warn('This may be because the file was already deleted or the path is incorrect');
                    // Continue anyway - document deletion is more important
                }
            }

            if (window.showToast) {
                window.showToast('Video deleted successfully! 🗑️');
            }

        } catch (error) {
            console.error('Error deleting video:', error);
            if (window.showToast) {
                window.showToast('Error deleting video. Please try again.');
            }
        }
    }

    /**
     * Check if the video grid is empty and show appropriate message
     */
    checkForEmptyGrid() {
        setTimeout(() => {
            const remainingVideos = document.querySelectorAll('#userVideosGrid .profile-video-item');
            console.log('Checking for empty grid - remaining videos:', remainingVideos.length);
            
            if (remainingVideos.length === 0) {
                const noVideosMessage = document.getElementById('noVideosMessage');
                if (noVideosMessage) {
                    noVideosMessage.style.display = 'block';
                    console.log('Showing no videos message');
                }
            }
        }, 100); // Small delay to ensure DOM has updated
    }
    
    /**
     * Stop all profile videos from playing
     */
    stopAllProfileVideos() {
        console.log('Stopping all profile videos');
        const profileVideos = document.querySelectorAll('.profile-video-item video');
        profileVideos.forEach((video, index) => {
            if (!video.paused) {
                video.pause();
                video.currentTime = 0;
                video.muted = true;
                console.log(`Stopped profile video ${index}`);
            }
        });
    }
}

// Initialize profile manager
const profileManager = new ProfileManager();

// Make globally available
window.profileManager = profileManager;
window.stopAllProfileVideos = () => profileManager.stopAllProfileVideos();

export default ProfileManager;