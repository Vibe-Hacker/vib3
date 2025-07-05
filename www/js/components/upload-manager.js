// Upload manager module
import { db, storage } from '../firebase-init.js';

class UploadManager {
    constructor() {
        this.selectedVideoFile = null;
        this.currentCameraStream = null;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recordingStartTime = null;
        this.recordingTimer = null;
        this.currentFacingMode = 'user';
        this.init();
    }

    init() {
        console.log('Upload manager initializing...');
        this.setupStateSubscriptions();
        this.setupGlobalUploadFunctions();
    }

    setupStateSubscriptions() {
        if (!window.stateManager) return;
        
        // Subscribe to selected video file changes
        window.stateManager.subscribe('video.selectedVideoFile', (file) => {
            if (file !== this.selectedVideoFile) {
                this.selectedVideoFile = file;
                console.log('Selected video file updated via state:', file?.name || 'none');
            }
        });

        // Subscribe to upload progress changes
        window.stateManager.subscribe('video.uploadProgress', (progress) => {
            this.updateUploadProgressUI(progress);
        });

        // Subscribe to upload state changes
        window.stateManager.subscribe('ui.uploadInProgress', (inProgress) => {
            console.log('Upload in progress state:', inProgress);
            if (inProgress) {
                this.showUploadProgress();
            }
        });
    }

    updateUploadProgressUI(progress) {
        const progressBar = document.getElementById('uploadProgressBar');
        const progressText = document.getElementById('uploadProgressText');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        if (progressText) {
            progressText.textContent = `${progress}% complete`;
        }
        
        console.log(`Upload progress UI updated: ${progress}%`);
    }

    setupGlobalUploadFunctions() {
        // Global upload functions
        window.showUploadModal = () => this.showUploadModal();
        window.closeUploadModal = () => this.closeUploadModal();
        window.selectVideo = () => this.selectVideo();
        window.recordVideo = () => this.recordVideo();
        window.backToStep1 = () => this.backToStep1();
        window.uploadVideo = () => this.uploadVideo();
        window.toggleRecording = () => this.toggleRecording();
        window.switchCamera = () => this.switchCamera();
        window.closeCameraModal = () => this.closeCameraModal();
        window.showTrendingSounds = () => this.showTrendingSounds();
        
        // Make selected video file globally accessible via state
        Object.defineProperty(window, 'selectedVideoFile', {
            get: () => {
                return window.stateManager ? 
                    window.stateManager.getState('video.selectedVideoFile') : 
                    this.selectedVideoFile;
            },
            set: (value) => {
                if (window.stateManager) {
                    window.stateManager.setState('video.selectedVideoFile', value);
                } else {
                    this.selectedVideoFile = value;
                }
            }
        });
    }

    showUploadModal() {
        console.log('Opening upload page - stopping all videos and hiding main content');
        
        // Save the currently playing video before stopping it
        this.saveCurrentVideoState();
        
        // Update state to indicate upload page is active
        if (window.stateManager) {
            window.stateManager.actions.setUploadPageActive(true);
        } else {
            window.uploadPageActive = true;
        }
        
        // IMMEDIATELY stop all videos
        if (window.stopAllVideosCompletely) {
            window.stopAllVideosCompletely();
        }
        
        // Hide ALL main content completely
        const mainContent = document.querySelector('.app-container');
        const videoFeed = document.querySelector('.video-feed');
        const sidebar = document.querySelector('.sidebar');
        const allPages = document.querySelectorAll('[id$="Page"]');
        
        console.log('=== HIDING MAIN CONTENT FOR UPLOAD ===');
        console.log('Found elements to hide:', {
            mainContent: !!mainContent,
            videoFeed: !!videoFeed,
            sidebar: !!sidebar
        });
        
        if (mainContent) {
            mainContent.style.display = 'none';
            console.log('Hidden main app container');
        }
        if (videoFeed) {
            videoFeed.style.display = 'none';
            console.log('Hidden video feed');
        }
        if (sidebar) {
            sidebar.style.display = 'none';
            console.log('Hidden sidebar');
        }
        
        // Hide all pages
        allPages.forEach(page => {
            page.style.display = 'none';
        });
        
        // Create a completely new fullscreen upload overlay
        this.createFullscreenUploadPage();
    }

    closeUploadModal() {
        console.log('=== CLOSING UPLOAD MODAL AND RESTORING CONTENT ===');
        
        // Clear the upload page flag via state
        if (window.stateManager) {
            window.stateManager.actions.setUploadPageActive(false);
            window.stateManager.actions.setUploadInProgress(false);
        } else {
            window.uploadPageActive = false;
        }
        console.log('Cleared uploadPageActive flag');
        
        // Remove the fullscreen upload page
        const uploadPage = document.getElementById('fullscreenUploadPage');
        if (uploadPage) {
            uploadPage.remove();
            console.log('Removed fullscreen upload page');
        }
        
        // IMMEDIATE FALLBACK RESTORATION - ensure basic content is visible
        this.emergencyContentRestore();
        
        // Then do the full restoration
        this.restoreMainContent();
        
        // Also clean up the original modal if it exists
        const uploadModal = document.getElementById('uploadModal');
        if (uploadModal) {
            uploadModal.classList.remove('active');
            uploadModal.style.cssText = '';
            
            const modalContent = uploadModal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.cssText = '';
            }
        }
        
        // Clean up video file via state
        if (window.stateManager) {
            window.stateManager.setState('video.selectedVideoFile', null);
        } else {
            this.selectedVideoFile = null;
        }
        
        // Clean up camera stream if active
        this.cleanupCameraStream();
        
        console.log('=== UPLOAD MODAL CLOSED ===');
    }

    emergencyContentRestore() {
        console.log('=== EMERGENCY CONTENT RESTORATION ===');
        
        // Force show main elements with important flag
        const elementsToShow = [
            '.app-container',
            '.main-app', 
            '.video-feed',
            '.sidebar',
            'body'
        ];
        
        elementsToShow.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.setProperty('display', 'block', 'important');
                console.log(`Emergency restored: ${selector}`);
            } else {
                console.warn(`Emergency restore failed - not found: ${selector}`);
            }
        });
        
        // Ensure body is not hidden
        document.body.style.setProperty('display', 'block', 'important');
        document.body.style.setProperty('visibility', 'visible', 'important');
        
        // Hide auth container if user is logged in
        if (window.currentUser) {
            const authContainer = document.getElementById('authContainer');
            if (authContainer) {
                authContainer.style.display = 'none';
            }
        }
        
        console.log('Emergency restoration complete');
    }

    restoreMainContent() {
        console.log('=== STARTING MAIN CONTENT RESTORATION ===');
        
        // Find and restore hidden content areas
        const mainContent = document.querySelector('.app-container');
        const videoFeed = document.querySelector('.video-feed');
        const sidebar = document.querySelector('.sidebar');
        
        console.log('Found elements:', {
            mainContent: !!mainContent,
            videoFeed: !!videoFeed,
            sidebar: !!sidebar
        });
        
        if (mainContent) {
            const currentDisplay = window.getComputedStyle(mainContent).display;
            console.log('Main content current display:', currentDisplay);
            mainContent.style.display = '';
            console.log('Restored main app container');
        } else {
            console.error('Main content not found!');
        }
        
        if (videoFeed) {
            const currentDisplay = window.getComputedStyle(videoFeed).display;
            console.log('Video feed current display:', currentDisplay);
            videoFeed.style.display = '';
            console.log('Restored video feed');
        } else {
            console.error('Video feed not found!');
        }
        
        if (sidebar) {
            const currentDisplay = window.getComputedStyle(sidebar).display;
            console.log('Sidebar current display:', currentDisplay);
            sidebar.style.display = '';
            console.log('Restored sidebar');
        } else {
            console.error('Sidebar not found!');
        }
        
        // Restore the current page that was active before upload
        const currentPageName = window.stateManager ? 
            window.stateManager.getState('ui.currentPage') : 'home';
        
        console.log('Restoring page:', currentPageName);
        
        // Hide all pages first
        const allPages = document.querySelectorAll('[id$="Page"]');
        allPages.forEach(page => {
            page.style.display = 'none';
        });
        
        // For home page, show the video feed instead of trying to find 'homePage'
        if (currentPageName === 'home') {
            const videoFeed = document.querySelector('.video-feed');
            if (videoFeed) {
                videoFeed.style.display = 'block';
                console.log('Restored video feed (home page)');
            } else {
                console.error('Video feed not found for home page restoration!');
            }
        } else {
            // Show the correct page for other pages
            const pageId = `${currentPageName}Page`;
            const currentPage = document.getElementById(pageId);
            console.log(`Looking for page: ${pageId}, found: ${!!currentPage}`);
            if (currentPage) {
                currentPage.style.display = 'block';
                console.log(`Restored ${currentPageName} page`);
            } else {
                // Fallback to video feed if current page not found
                console.log('Page not found, falling back to video feed');
                const videoFeed = document.querySelector('.video-feed');
                if (videoFeed) {
                    videoFeed.style.display = 'block';
                    console.log('Fallback: Restored video feed');
                } else {
                    console.error('Fallback video feed not found!');
                }
            }
        }
        
        console.log('=== PAGE RESTORATION COMPLETE ===');
        
        // Important: Restore video playback after upload completion with proper sequencing
        setTimeout(() => {
            console.log('Restoring video playback after upload completion');
            
            // First, ensure all videos are completely stopped to prevent conflicts
            document.querySelectorAll('video').forEach(video => {
                video.pause();
                video.currentTime = 0;
            });
            
            // Wait a bit for all videos to fully stop
            setTimeout(() => {
                // Now try to restore the specific video that was playing
                const videoRestored = this.restoreCurrentVideoState();
                
                if (!videoRestored) {
                    console.log('Could not restore specific video, using general restoration');
                    
                    // Use the dedicated restoration function
                    if (window.restoreVideoPlaybackAfterUpload) {
                        window.restoreVideoPlaybackAfterUpload();
                    } else {
                        // Fallback to manual restoration
                        const activeFeedTab = window.stateManager ? 
                            window.stateManager.getState('ui.activeFeedTab') : 
                            'foryou';
                        
                        console.log(`Refreshing ${activeFeedTab} tab to restore videos`);
                        
                        if (window.switchFeedTab) {
                            window.switchFeedTab(activeFeedTab);
                        } else if (window.loadAllVideosForFeed) {
                            window.loadAllVideosForFeed();
                        }
                    }
                }
                
                // Also refresh feed data to include the newly uploaded video
                setTimeout(() => {
                    console.log('Reloading video feed to include new upload');
                    if (window.loadAllVideosForFeed) {
                        window.loadAllVideosForFeed();
                    }
                }, 1500);
            }, 100);
        }, 200);
        
        // Final verification of what's visible
        setTimeout(() => {
            console.log('=== FINAL RESTORATION CHECK ===');
            const mainContent = document.querySelector('.app-container');
            const videoFeed = document.querySelector('.video-feed');
            const sidebar = document.querySelector('.sidebar');
            
            console.log('Final element visibility:', {
                mainContent: mainContent ? window.getComputedStyle(mainContent).display : 'not found',
                videoFeed: videoFeed ? window.getComputedStyle(videoFeed).display : 'not found',
                sidebar: sidebar ? window.getComputedStyle(sidebar).display : 'not found'
            });
            
            // Check if body has any special classes or styles
            console.log('Body classes:', document.body.className);
            console.log('Body style display:', document.body.style.display);
        }, 1000);
        
        console.log('Main content restored after upload');
    }

    saveCurrentVideoState() {
        console.log('Saving current video state before upload');
        
        // Find the currently playing or visible video
        let currentVideo = null;
        let videoContainer = null;
        let videoSrc = null;
        let scrollPosition = 0;
        
        // Check state manager first
        if (window.stateManager) {
            currentVideo = window.stateManager.getState('video.currentlyPlayingVideo');
        }
        
        // If no video in state, find the currently playing one
        if (!currentVideo) {
            const allVideos = document.querySelectorAll('video');
            for (const video of allVideos) {
                if (!video.paused) {
                    currentVideo = video;
                    break;
                }
            }
        }
        
        // If still no playing video, find the most visible one
        if (!currentVideo) {
            const videoContainers = document.querySelectorAll('.video-container');
            let maxVisibility = 0;
            let mostVisibleVideo = null;
            
            videoContainers.forEach(container => {
                const rect = container.getBoundingClientRect();
                const visibility = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
                if (visibility > maxVisibility) {
                    maxVisibility = visibility;
                    mostVisibleVideo = container.querySelector('video');
                }
            });
            
            currentVideo = mostVisibleVideo;
        }
        
        if (currentVideo) {
            videoContainer = currentVideo.closest('.video-container');
            videoSrc = currentVideo.src;
            scrollPosition = window.scrollY;
            
            console.log('Saved current video state:', {
                src: videoSrc ? videoSrc.substring(0, 80) + '...' : 'no src',
                scrollPosition,
                hasContainer: !!videoContainer
            });
        }
        
        // Save to state manager
        if (window.stateManager) {
            window.stateManager.setState('ui.preUploadVideoState', {
                videoSrc,
                scrollPosition,
                timestamp: Date.now()
            });
        }
    }

    restoreCurrentVideoState() {
        console.log('Attempting to restore previous video state');
        
        const savedState = window.stateManager ? 
            window.stateManager.getState('ui.preUploadVideoState') : null;
            
        if (!savedState || !savedState.videoSrc) {
            console.log('No saved video state found');
            return false;
        }
        
        // Don't restore if the saved state is too old (more than 30 minutes)
        if (Date.now() - savedState.timestamp > 30 * 60 * 1000) {
            console.log('Saved video state is too old, not restoring');
            return false;
        }
        
        console.log('Attempting to restore video:', savedState.videoSrc.substring(0, 80) + '...');
        
        // Find the video with matching src
        const allVideos = document.querySelectorAll('video');
        let targetVideo = null;
        
        for (const video of allVideos) {
            if (video.src === savedState.videoSrc) {
                targetVideo = video;
                break;
            }
        }
        
        if (targetVideo) {
            const container = targetVideo.closest('.video-container');
            if (container) {
                console.log('Found target video, scrolling into view');
                
                // Scroll to the video container
                container.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                
                // Start playing the video after scroll with better error handling
                setTimeout(() => {
                    if (window.stateManager && window.stateManager.getState('video.userHasInteracted')) {
                        // Use a more robust play method that handles interruptions
                        const playVideo = async () => {
                            try {
                                // First ensure the video is not paused by other systems
                                if (targetVideo.paused) {
                                    const playPromise = targetVideo.play();
                                    if (playPromise !== undefined) {
                                        await playPromise;
                                    }
                                }
                            } catch (error) {
                                // Handle AbortError and other play interruptions gracefully
                                if (error.name === 'AbortError') {
                                    console.log('Video play was interrupted during restoration - this is normal');
                                } else if (error.name === 'NotAllowedError') {
                                    console.log('Autoplay not allowed - user interaction required');
                                } else {
                                    console.log('Could not autoplay restored video:', error.name, error.message);
                                }
                            }
                        };
                        
                        playVideo();
                    }
                    
                    // Update state to track this as current video
                    if (window.stateManager) {
                        window.stateManager.actions.setCurrentlyPlayingVideo(targetVideo);
                    }
                }, 500);
                
                // Clear the saved state
                if (window.stateManager) {
                    window.stateManager.setState('ui.preUploadVideoState', null);
                }
                
                return true;
            }
        }
        
        console.log('Could not find video to restore');
        return false;
    }

    verifyContentRestoration() {
        console.log('=== VERIFYING CONTENT RESTORATION ===');
        
        // Check that main content areas are visible
        const mainContent = document.querySelector('.app-container');
        const videoFeed = document.querySelector('.video-feed');
        const sidebar = document.querySelector('.sidebar');
        
        const issues = [];
        
        if (!mainContent || mainContent.style.display === 'none') {
            issues.push('Main content not visible');
            if (mainContent) {
                mainContent.style.display = '';
                console.log('Fixed: Restored main content visibility');
            }
        }
        
        if (!videoFeed || videoFeed.style.display === 'none') {
            issues.push('Video feed not visible');
            if (videoFeed) {
                videoFeed.style.display = '';
                console.log('Fixed: Restored video feed visibility');
            }
        }
        
        if (!sidebar || sidebar.style.display === 'none') {
            issues.push('Sidebar not visible');
            if (sidebar) {
                sidebar.style.display = '';
                console.log('Fixed: Restored sidebar visibility');
            }
        }
        
        // Ensure upload overlays are completely removed
        const uploadOverlay = document.getElementById('fullscreenUploadOverlay');
        const uploadPage = document.getElementById('fullscreenUploadPage');
        const reviewModal = document.querySelector('.video-review-modal');
        
        if (uploadOverlay) {
            uploadOverlay.remove();
            console.log('Fixed: Removed remaining upload overlay');
        }
        
        if (uploadPage) {
            uploadPage.remove();
            console.log('Fixed: Removed remaining upload page');
        }
        
        if (reviewModal) {
            reviewModal.remove();
            console.log('Fixed: Removed remaining review modal');
        }
        
        // Ensure home page is visible
        const homePage = document.getElementById('homePage');
        if (homePage && homePage.style.display === 'none') {
            homePage.style.display = 'block';
            console.log('Fixed: Made home page visible');
        }
        
        // Clear any remaining high z-index elements that might be blocking content
        document.querySelectorAll('[style*="z-index: 999"]').forEach(element => {
            if (element.id !== 'toastNotification' && !element.classList.contains('debug-panel')) {
                element.remove();
                console.log('Fixed: Removed high z-index blocking element');
            }
        });
        
        // Update state to ensure everything is clean
        if (window.stateManager) {
            window.stateManager.actions.setUploadPageActive(false);
            window.stateManager.actions.setUploadInProgress(false);
            console.log('Fixed: Cleared all upload state flags');
        }
        
        if (issues.length === 0) {
            console.log('✅ Content restoration verified - everything looks good!');
        } else {
            console.log('⚠️ Fixed restoration issues:', issues);
        }
        
        // Force a final video restoration
        setTimeout(() => {
            if (window.videoManager && window.videoManager.restoreVideoPlaybackAfterUpload) {
                console.log('Final video restoration attempt');
                window.videoManager.restoreVideoPlaybackAfterUpload();
            }
        }, 200);
    }

    createFullscreenUploadPage() {
        console.log('Creating fullscreen upload page');
        
        // Set flag to completely block video operations via state
        if (window.stateManager) {
            window.stateManager.actions.setUploadPageActive(true);
        } else {
            window.uploadPageActive = true;
        }
        console.log('Set uploadPageActive flag to block video interactions');
        
        // Remove any existing upload page
        const existingPage = document.getElementById('fullscreenUploadPage');
        if (existingPage) {
            existingPage.remove();
        }

        // Create a completely new fullscreen upload page
        const uploadPage = document.createElement('div');
        uploadPage.id = 'fullscreenUploadPage';
        uploadPage.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            z-index: 9999999;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial, sans-serif;
        `;

        // Add click handler to prevent background video interaction
        uploadPage.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('Upload page clicked - preventing background interaction');
        });

        uploadPage.innerHTML = `
            <div style="width: 90%; max-width: 500px; text-align: center; padding: 40px; background: #1a1a1a; border-radius: 15px; position: relative;">
                <!-- Close button -->
                <button id="closeUploadPage" style="position: absolute; top: 20px; right: 20px; background: none; border: none; color: white; font-size: 30px; cursor: pointer;">×</button>
                
                <!-- Upload content -->
                <h2 style="color: white; margin-bottom: 30px; font-size: 28px;">Create New Video</h2>
                
                <div style="display: flex; gap: 20px; margin: 30px 0; justify-content: center;">
                    <div id="recordVideoOption" style="flex: 1; padding: 30px 20px; background: #333; border-radius: 15px; cursor: pointer; transition: all 0.3s ease; text-align: center; max-width: 200px;">
                        <div style="font-size: 40px; margin-bottom: 15px;">📹</div>
                        <div style="font-size: 16px; font-weight: 600;">Record Video</div>
                    </div>
                    
                    <div id="selectVideoOption" style="flex: 1; padding: 30px 20px; background: #333; border-radius: 15px; cursor: pointer; transition: all 0.3s ease; text-align: center; max-width: 200px;">
                        <div style="font-size: 40px; margin-bottom: 15px;">📁</div>
                        <div style="font-size: 16px; font-weight: 600;">Choose from Gallery</div>
                    </div>
                </div>
                
                <p style="color: #888; font-size: 14px; margin-top: 20px;">Select an option to get started</p>
            </div>
        `;

        // Add to document
        document.body.appendChild(uploadPage);

        // Add event listeners
        document.getElementById('closeUploadPage').addEventListener('click', () => {
            console.log('Close button clicked');
            this.closeUploadModal();
        });

        document.getElementById('recordVideoOption').addEventListener('click', () => {
            console.log('Record video option clicked');
            console.log('About to call this.recordVideo()...');
            try {
                this.recordVideo();
            } catch (error) {
                console.error('Error calling recordVideo:', error);
            }
        });

        document.getElementById('selectVideoOption').addEventListener('click', () => {
            console.log('Select video option clicked');
            this.selectVideo();
        });

        // Add hover effects
        const options = [document.getElementById('recordVideoOption'), document.getElementById('selectVideoOption')];
        options.forEach(option => {
            option.addEventListener('mouseenter', () => {
                option.style.background = '#444';
                option.style.transform = 'scale(1.05)';
            });
            option.addEventListener('mouseleave', () => {
                option.style.background = '#333';
                option.style.transform = 'scale(1)';
            });
        });

        console.log('Fullscreen upload page created and displayed');
    }

    showUploadProgress() {
        console.log('Showing upload progress overlay');
        
        // Find the upload page content area
        const uploadPage = document.getElementById('fullscreenUploadPage');
        if (!uploadPage) return;

        // Replace content with upload progress
        uploadPage.innerHTML = `
            <div style="width: 90%; max-width: 500px; text-align: center; padding: 40px; background: #1a1a1a; border-radius: 15px; position: relative;">
                <!-- Upload progress content -->
                <h2 style="color: white; margin-bottom: 30px; font-size: 28px;">Uploading Video...</h2>
                
                <!-- Animated upload icon -->
                <div style="margin: 30px 0;">
                    <div style="
                        width: 80px; 
                        height: 80px; 
                        border: 4px solid #333; 
                        border-top: 4px solid #fe2c55; 
                        border-radius: 50%; 
                        animation: spin 1s linear infinite; 
                        margin: 0 auto 20px;
                    "></div>
                </div>
                
                <!-- Progress bar -->
                <div style="width: 100%; background: #333; border-radius: 10px; margin: 20px 0; overflow: hidden;">
                    <div id="uploadProgressBar" style="
                        width: 0%; 
                        height: 20px; 
                        background: linear-gradient(45deg, #fe2c55, #8338ec); 
                        border-radius: 10px; 
                        transition: width 0.3s ease;
                    "></div>
                </div>
                
                <!-- Progress text -->
                <p id="uploadProgressText" style="color: #888; font-size: 18px; margin: 20px 0;">0% complete</p>
                
                <!-- Status message -->
                <p id="uploadStatusText" style="color: white; font-size: 16px; margin: 10px 0;">Preparing upload...</p>
                
                <!-- Add spinning animation -->
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </div>
        `;
    }

    updateUploadProgress(progress, status = '') {
        // Update state
        if (window.stateManager) {
            window.stateManager.actions.setUploadProgress(progress);
        }
        
        const progressBar = document.getElementById('uploadProgressBar');
        const progressText = document.getElementById('uploadProgressText');
        const statusText = document.getElementById('uploadStatusText');
        
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}% complete`;
        }
        
        if (statusText && status) {
            statusText.textContent = status;
        }
        
        console.log(`Upload progress: ${progress}% - ${status}`);
    }

    showVideoDetailsPage(file) {
        console.log('Showing video details page for:', file.name);
        
        // Update the upload page to show video details
        const uploadPage = document.getElementById('fullscreenUploadPage');
        if (!uploadPage) return;
        
        // FORCE the upload page to be visible and on top
        uploadPage.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.95) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 999999 !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;
        
        console.log('Forced upload page visibility with styles:', uploadPage.style.cssText);

        uploadPage.innerHTML = `
            <div style="width: 90%; max-width: 600px; text-align: center; padding: 40px; background: #1a1a1a; border-radius: 15px; position: relative;">
                <!-- Close button -->
                <button id="closeUploadPage" style="position: absolute; top: 20px; right: 20px; background: none; border: none; color: white; font-size: 30px; cursor: pointer;">×</button>
                
                <!-- Video details content -->
                <h2 style="color: white; margin-bottom: 30px; font-size: 24px;">Add Details</h2>
                
                <!-- Video preview -->
                <div id="videoPreviewContainer" style="width: 200px; height: 355px; border-radius: 15px; margin: 15px auto; background: #fe2c55; display: flex; align-items: center; justify-content: center; border: 2px solid #fe2c55; position: relative; z-index: 10000000;">
                    <div style="color: white; font-size: 16px; text-align: center;">
                        📹 Loading Video Preview...
                    </div>
                </div>
                
                <!-- Form fields -->
                <div style="text-align: left; margin: 20px 0;">
                    <input type="text" id="videoTitle" placeholder="Video title..." maxlength="100" style="width: 100%; padding: 12px; margin-bottom: 15px; border: none; border-radius: 10px; background: #333; color: white; font-size: 16px;">
                    
                    <textarea id="videoDescription" placeholder="Describe your video... #hashtags" style="width: 100%; height: 80px; padding: 12px; border: none; border-radius: 10px; background: #333; color: white; font-size: 16px; resize: vertical; margin-bottom: 15px;"></textarea>
                    
                    <button id="chooseSoundBtn" style="width: 100%; padding: 12px; background: #333; color: white; border: none; border-radius: 10px; margin: 10px 0; text-align: left; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <span style="font-size: 20px;">🎵</span>
                        <div>
                            <span id="selectedSound">Choose trending sound</span><br>
                            <small style="color: #888;">Add popular audio to your video</small>
                        </div>
                    </button>
                </div>
                
                <!-- Action buttons -->
                <div style="display: flex; gap: 15px; margin-top: 30px;">
                    <button id="backToOptionsBtn" style="flex: 1; padding: 12px; background: #666; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px;">Back</button>
                    <button id="publishVideoBtn" class="publish-btn" style="flex: 1; padding: 12px; background: linear-gradient(45deg, #ff006e, #8338ec); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: bold;"
                            onmousedown="console.log('=== DYNAMIC PUBLISH BUTTON MOUSEDOWN ==='); console.log('Button:', this);"
                            onmouseup="console.log('=== DYNAMIC PUBLISH BUTTON MOUSEUP ===');"
                            onpointerdown="console.log('=== DYNAMIC PUBLISH BUTTON POINTERDOWN ===');"
                            onpointerup="console.log('=== DYNAMIC PUBLISH BUTTON POINTERUP ===');"
                            ontouchstart="console.log('=== DYNAMIC PUBLISH BUTTON TOUCHSTART ===');"
                            ontouchend="console.log('=== DYNAMIC PUBLISH BUTTON TOUCHEND ===');">Publish</button>
                </div>
            </div>
        `;

        // Simple video preview setup
        setTimeout(() => {
            const container = document.getElementById('videoPreviewContainer');
            
            console.log('Setting up simple video preview for:', file?.name);
            
            if (container && file) {
                try {
                    // Create a hidden video to get a frame
                    const video = document.createElement('video');
                    video.muted = true;
                    video.preload = 'metadata';
                    video.style.display = 'none';
                    document.body.appendChild(video);
                    
                    const objectUrl = URL.createObjectURL(file);
                    video.src = objectUrl;
                    
                    video.addEventListener('loadeddata', () => {
                        console.log('Video loaded, creating thumbnail');
                        
                        // Create canvas to capture frame
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Set canvas size
                        canvas.width = 190;
                        canvas.height = 340;
                        
                        // Seek to first frame
                        video.currentTime = 0.5;
                        
                        video.addEventListener('seeked', () => {
                            try {
                                // Draw video frame to canvas
                                ctx.drawImage(video, 0, 0, 190, 340);
                                
                                // Convert to image
                                const dataURL = canvas.toDataURL('image/jpeg', 0.9);
                                console.log('Created thumbnail image');
                                
                                // Replace container content with playable video
                                container.innerHTML = `
                                    <video 
                                        src="${objectUrl}" 
                                        controls
                                        muted
                                        preload="metadata"
                                        style="
                                            width: 190px;
                                            height: 340px;
                                            border-radius: 10px;
                                            object-fit: cover;
                                            z-index: 10000001;
                                        "
                                        poster="${dataURL}"
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                `;
                                
                                console.log('Video preview thumbnail displayed');
                                
                                // Clean up
                                video.remove();
                                
                            } catch (error) {
                                console.error('Error creating thumbnail:', error);
                                container.innerHTML = `
                                    <div style="color: white; text-align: center;">
                                        ❌ Preview Failed<br>
                                        <small>${file.name}</small>
                                    </div>
                                `;
                            }
                        }, { once: true });
                    });
                    
                    video.addEventListener('error', (e) => {
                        console.error('Video error:', e);
                        container.innerHTML = `
                            <div style="color: white; text-align: center;">
                                ❌ Video Load Failed<br>
                                <small>${file.name}</small>
                            </div>
                        `;
                        video.remove();
                    });
                    
                    video.load();
                    
                } catch (error) {
                    console.error('Error setting up video preview:', error);
                    container.innerHTML = `
                        <div style="color: white; text-align: center;">
                            ❌ Setup Failed<br>
                            <small>Please try again</small>
                        </div>
                    `;
                }
            }
        }, 100);

        // Add event listeners
        document.getElementById('closeUploadPage').addEventListener('click', () => {
            console.log('Close button clicked');
            this.closeUploadModal();
        });

        document.getElementById('backToOptionsBtn').addEventListener('click', () => {
            console.log('Back to options clicked');
            this.createFullscreenUploadPage();
        });
        
        // DEBUG: Track publish button creation
        console.log('=== PUBLISH BUTTON CREATED IN showVideoDetailsPage ===');
        const publishBtn = document.getElementById('publishVideoBtn');
        console.log('Publish button element:', publishBtn);
        console.log('Publish button classList:', publishBtn?.classList.toString());
        console.log('Publish button innerHTML:', publishBtn?.innerHTML);
        console.log('Publish button parent:', publishBtn?.parentElement);
        console.log('Button position:', publishBtn?.getBoundingClientRect());
        console.log('Button computed styles:', publishBtn ? {
            display: window.getComputedStyle(publishBtn).display,
            visibility: window.getComputedStyle(publishBtn).visibility,
            pointerEvents: window.getComputedStyle(publishBtn).pointerEvents,
            zIndex: window.getComputedStyle(publishBtn).zIndex
        } : 'Button not found');

        // FORCE PROPER BUTTON DIMENSIONS AND POSITIONING
        if (publishBtn) {
            // Force layout calculation
            publishBtn.offsetHeight; // Trigger reflow
            
            // Set explicit dimensions and positioning
            publishBtn.style.cssText += `
                min-width: 120px !important;
                min-height: 44px !important;
                width: auto !important;
                height: auto !important;
                display: inline-block !important;
                position: relative !important;
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: auto !important;
                z-index: 1000 !important;
                box-sizing: border-box !important;
                line-height: normal !important;
                vertical-align: baseline !important;
                transform: none !important;
                margin: 0 !important;
            `;
            
            // Force recalculation of layout
            publishBtn.getBoundingClientRect();
            
            // Log after forced sizing
            console.log('Button position after forced sizing:', publishBtn.getBoundingClientRect());
            console.log('Button offsetWidth/Height:', publishBtn.offsetWidth, publishBtn.offsetHeight);
            console.log('Button clientWidth/Height:', publishBtn.clientWidth, publishBtn.clientHeight);
            
            // Additional check after a brief delay to ensure DOM is fully rendered
            setTimeout(() => {
                const finalRect = publishBtn.getBoundingClientRect();
                console.log('Final button dimensions:', finalRect);
                if (finalRect.width === 0 || finalRect.height === 0) {
                    console.warn('Button still has zero dimensions, applying emergency fix');
                    publishBtn.style.cssText = `
                        flex: 1;
                        padding: 12px;
                        background: linear-gradient(45deg, #ff006e, #8338ec);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                        min-width: 120px;
                        min-height: 44px;
                        width: 120px;
                        height: 44px;
                        display: block;
                        position: relative;
                        visibility: visible;
                        opacity: 1;
                        pointer-events: auto;
                        z-index: 1000;
                        box-sizing: border-box;
                        line-height: 1;
                        text-align: center;
                    `;
                }
            }, 100);
        }

        document.getElementById('publishVideoBtn').addEventListener('click', () => {
            console.log('=== PUBLISH BUTTON CLICKED (UPLOAD MANAGER - VIDEO DETAILS PAGE) ===');
            console.log('Button clicked at timestamp:', Date.now());
            console.log('Click event target:', event.target);
            console.log('Button element:', document.getElementById('publishVideoBtn'));
            console.log('Button innerHTML:', document.getElementById('publishVideoBtn')?.innerHTML);
            console.log('Current upload manager state:', {
                selectedVideoFile: this.selectedVideoFile?.name,
                currentUser: window.currentUser?.uid,
                uploadVideo: typeof this.uploadVideo
            });
            console.log('About to call uploadVideo()...');
            try {
                this.uploadVideo();
            } catch (error) {
                console.error('Error in uploadVideo:', error);
                if (window.showToast) {
                    window.showToast('Upload failed: ' + error.message);
                }
            }
        });

        document.getElementById('chooseSoundBtn').addEventListener('click', () => {
            console.log('Choose sound button clicked');
            this.showTrendingSounds();
        });

        console.log('Video details page displayed');
    }

    createFullscreenUploadOverlay() {
        // Set a global flag to prevent video autoplay during upload via state
        if (window.stateManager) {
            window.stateManager.actions.setUploadInProgress(true);
        } else {
            window.uploadInProgress = true;
        }
        console.log('Setting uploadInProgress flag to prevent video autoplay');
        
        // Remove any existing overlay
        const existingOverlay = document.getElementById('fullscreenUploadOverlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Create a completely new fullscreen overlay
        const overlay = document.createElement('div');
        overlay.id = 'fullscreenUploadOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial, sans-serif;
        `;

        overlay.innerHTML = `
            <div style="text-align: center;">
                <div style="width: 60px; height: 60px; border: 4px solid #333; border-top: 4px solid #fe2c55; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <h2 style="margin: 0 0 10px 0; font-size: 24px;">Uploading Video...</h2>
                <p id="uploadProgress" style="margin: 0; font-size: 18px; color: #888;">0% complete</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        // Add to body and force all videos to stop
        document.body.appendChild(overlay);
        
        // FORCE stop all videos and prevent autoplay
        document.querySelectorAll('video').forEach(video => {
            video.pause();
            video.muted = true;
            video.volume = 0;
            // Add a flag to prevent this video from autoplaying
            video.setAttribute('data-upload-paused', 'true');
        });

        console.log('Fullscreen upload overlay created and videos stopped');
    }

    removeFullscreenUploadOverlay() {
        // Clear the upload flag to allow videos to resume via state
        if (window.stateManager) {
            window.stateManager.actions.setUploadInProgress(false);
        } else {
            window.uploadInProgress = false;
        }
        console.log('Clearing uploadInProgress flag - videos can resume');
        
        const overlay = document.getElementById('fullscreenUploadOverlay');
        if (overlay) {
            overlay.remove();
            console.log('Fullscreen upload overlay removed');
        }
        
        // Remove the upload-paused flags from videos but don't auto-restart them
        document.querySelectorAll('video[data-upload-paused]').forEach(video => {
            video.removeAttribute('data-upload-paused');
        });
    }

    selectVideo() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                // Validate file size (500MB limit for 4K videos)
                const maxSize = 500 * 1024 * 1024; // 500MB for 4K
                if (file.size > maxSize) {
                    if (window.showToast) {
                        window.showToast('Video file too large. Please choose a video under 500MB.');
                    }
                    return;
                }
                
                // Set selected file via state
                if (window.stateManager) {
                    window.stateManager.setState('video.selectedVideoFile', file);
                } else {
                    this.selectedVideoFile = file;
                }
                console.log('Video file selected:', file.name);
                
                // Open video editor first, then details page
                this.openVideoEditor(file);
                
                if (window.showToast) {
                    window.showToast('Video ready for upload! 🎬');
                }
            }
        };
        input.click();
    }

    async recordVideo() {
        console.log('=== RECORD VIDEO METHOD CALLED ===');
        try {
            // Check if MediaRecorder is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.log('MediaRecorder not supported');
                if (window.showToast) {
                    window.showToast('Camera not supported on this device');
                }
                return;
            }

            console.log('MediaRecorder is supported, requesting camera access...');
            if (window.showToast) {
                window.showToast('Accessing camera... 📹');
            }

            // Hide the fullscreen upload page while accessing camera
            const fullscreenUploadPage = document.getElementById('fullscreenUploadPage');
            if (fullscreenUploadPage) {
                fullscreenUploadPage.style.display = 'none';
                console.log('Hid fullscreen upload page');
            }

            console.log('Attempting to get user media with constraints:', {
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: this.currentFacingMode
                },
                audio: true
            });

            // Get camera stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 3840, max: 3840 },
                    height: { ideal: 2160, max: 2160 },
                    frameRate: { ideal: 60, max: 60 },
                    facingMode: this.currentFacingMode
                },
                audio: true
            });

            console.log('Successfully got camera stream:', stream);

            // Create camera interface
            const cameraModal = document.createElement('div');
            cameraModal.className = 'modal active camera-modal';
            cameraModal.innerHTML = `
                <div class="modal-content" style="max-width: 90%; height: 90%; background: #000;">
                    <div style="position: relative; width: 100%; height: 100%; display: flex; flex-direction: column;">
                        <video id="cameraPreview" autoplay playsinline muted style="flex: 1; width: 100%; object-fit: cover; border-radius: 10px;"></video>
                        
                        <div style="position: absolute; top: 20px; right: 20px; display: flex; gap: 10px;">
                            <button onclick="switchCamera()" style="background: rgba(0,0,0,0.7); color: white; border: none; padding: 10px; border-radius: 50%; cursor: pointer;">🔄</button>
                            <button onclick="closeCameraModal()" style="background: rgba(0,0,0,0.7); color: white; border: none; padding: 10px; border-radius: 50%; cursor: pointer;">✕</button>
                        </div>
                        
                        <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 15px; align-items: center;">
                            <button id="recordBtn" onclick="toggleRecording()" style="width: 70px; height: 70px; background: #ff006e; border: none; border-radius: 50%; color: white; font-size: 24px; cursor: pointer; transition: all 0.3s;">📹</button>
                            <div id="recordingTimer" style="color: white; font-size: 18px; font-weight: bold; min-width: 60px; text-align: center; display: none;">00:00</div>
                        </div>
                        
                        <div id="recordingIndicator" style="position: absolute; top: 20px; left: 20px; background: #ff4444; color: white; padding: 8px 15px; border-radius: 20px; font-weight: bold; display: none;">
                            🔴 REC
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(cameraModal);
            
            // Set up camera preview
            const video = document.getElementById('cameraPreview');
            video.srcObject = stream;
            
            // Store stream for recording
            this.currentCameraStream = stream;
            this.isRecording = false;
            this.mediaRecorder = null;
            this.recordedChunks = [];
            this.recordingStartTime = null;
            
            if (window.showToast) {
                window.showToast('Camera ready! Tap record to start 🎬');
            }
            
        } catch (error) {
            console.error('Camera access error:', error);
            
            // Restore the fullscreen upload page if camera access fails
            const fullscreenUploadPage = document.getElementById('fullscreenUploadPage');
            if (fullscreenUploadPage) {
                fullscreenUploadPage.style.display = 'flex';
                console.log('Restored fullscreen upload page after camera error');
            }
            
            if (error.name === 'NotAllowedError') {
                if (window.showToast) {
                    window.showToast('Camera permission denied. Please allow camera access.');
                }
            } else if (error.name === 'NotFoundError') {
                if (window.showToast) {
                    window.showToast('No camera found on this device.');
                }
            } else {
                if (window.showToast) {
                    window.showToast('Failed to access camera. Please try again.');
                }
            }
        }
    }

    toggleRecording() {
        const recordBtn = document.getElementById('recordBtn');
        const timer = document.getElementById('recordingTimer');
        const indicator = document.getElementById('recordingIndicator');
        
        if (!this.isRecording) {
            // Start recording
            this.startRecording();
            if (recordBtn) {
                recordBtn.style.background = '#ff4444';
                recordBtn.textContent = '⏹️';
            }
            if (timer) timer.style.display = 'block';
            if (indicator) indicator.style.display = 'block';
        } else {
            // Stop recording
            this.stopRecording();
            if (recordBtn) {
                recordBtn.style.background = '#ff006e';
                recordBtn.textContent = '📹';
            }
            if (timer) timer.style.display = 'none';
            if (indicator) indicator.style.display = 'none';
        }
    }

    startRecording() {
        if (!this.currentCameraStream) return;
        
        try {
            this.recordedChunks = [];
            this.mediaRecorder = new MediaRecorder(this.currentCameraStream, {
                mimeType: 'video/webm'
            });
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecordedVideo();
            };
            
            this.mediaRecorder.start(1000); // Collect data every second
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            // Start timer
            this.recordingTimer = setInterval(() => {
                const elapsed = Date.now() - this.recordingStartTime;
                const seconds = Math.floor(elapsed / 1000);
                const minutes = Math.floor(seconds / 60);
                const displaySeconds = seconds % 60;
                const timerElement = document.getElementById('recordingTimer');
                if (timerElement) {
                    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
                }
            }, 1000);
            
        } catch (error) {
            console.error('Recording start error:', error);
            if (window.showToast) {
                window.showToast('Failed to start recording');
            }
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            if (this.recordingTimer) {
                clearInterval(this.recordingTimer);
                this.recordingTimer = null;
            }
        }
    }

    processRecordedVideo() {
        if (this.recordedChunks.length > 0) {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            this.selectedVideoFile = new File([blob], `recorded_${Date.now()}.webm`, {
                type: 'video/webm'
            });
            
            console.log('Video recorded successfully, showing review screen');
            
            // Show video review screen instead of closing camera modal
            this.showVideoReviewScreen(blob);
            
            if (window.showToast) {
                window.showToast('Video recorded successfully! 🎬');
            }
        }
    }

    showVideoReviewScreen(videoBlob) {
        // Remove the camera modal
        const cameraModal = document.querySelector('.camera-modal');
        if (cameraModal) {
            cameraModal.remove();
        }

        // Create video review modal
        const reviewModal = document.createElement('div');
        reviewModal.className = 'modal active video-review-modal';
        reviewModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.95);
            z-index: 9999999;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial, sans-serif;
        `;

        reviewModal.innerHTML = `
            <div style="width: 90%; max-width: 500px; text-align: center; position: relative;">
                <h2 style="color: white; margin-bottom: 20px;">Review Your Video</h2>
                
                <!-- Video Preview -->
                <div style="position: relative; background: #000; border-radius: 15px; overflow: hidden; margin-bottom: 20px;">
                    <video id="reviewVideoPreview" 
                           controls 
                           autoplay 
                           loop 
                           style="width: 100%; height: auto; max-height: 60vh; object-fit: cover;">
                    </video>
                </div>
                
                <!-- Action Buttons -->
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button id="cancelRecordingBtn" 
                            style="padding: 12px 24px; background: #333; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: 600;">
                        ✕ Cancel
                    </button>
                    <button id="retakeVideoBtn" 
                            style="padding: 12px 24px; background: #666; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: 600;">
                        🔄 Retake
                    </button>
                    <button id="continueToUploadBtn" 
                            style="padding: 12px 24px; background: #ff006e; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: 600;">
                        ✨ Continue to Upload
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(reviewModal);

        // Set up the video preview
        const reviewVideo = document.getElementById('reviewVideoPreview');
        reviewVideo.src = URL.createObjectURL(videoBlob);

        // Set up button event listeners
        document.getElementById('cancelRecordingBtn').addEventListener('click', () => {
            console.log('Cancel recording clicked');
            reviewModal.remove();
            // Clean up the blob URL
            URL.revokeObjectURL(reviewVideo.src);
            // Return to main upload options
            this.createFullscreenUploadPage();
        });

        document.getElementById('retakeVideoBtn').addEventListener('click', () => {
            console.log('Retake video clicked');
            reviewModal.remove();
            // Clean up the blob URL
            URL.revokeObjectURL(reviewVideo.src);
            // Restart camera recording
            this.recordVideo();
        });

        document.getElementById('continueToUploadBtn').addEventListener('click', () => {
            console.log('Continue to upload clicked');
            reviewModal.remove();
            // Clean up the blob URL
            URL.revokeObjectURL(reviewVideo.src);
            // Open video editor for recorded video
            this.openVideoEditor(this.selectedVideoFile);
        });
    }

    switchCamera() {
        // Toggle between front and back camera
        this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
        
        // Restart camera with new facing mode
        this.closeCameraModal();
        setTimeout(() => {
            this.recordVideo();
        }, 100);
    }

    closeCameraModal() {
        this.cleanupCameraStream();
        
        // Remove camera modal
        const cameraModal = document.querySelector('.camera-modal');
        if (cameraModal) {
            cameraModal.remove();
        }
        
        // Restore the fullscreen upload page
        const fullscreenUploadPage = document.getElementById('fullscreenUploadPage');
        if (fullscreenUploadPage) {
            fullscreenUploadPage.style.display = 'flex';
            console.log('Restored fullscreen upload page');
        }
    }

    cleanupCameraStream() {
        if (this.currentCameraStream) {
            this.currentCameraStream.getTracks().forEach(track => track.stop());
            this.currentCameraStream = null;
        }
        
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
    }

    backToStep1() {
        const step1 = document.getElementById('uploadStep1');
        const step2 = document.getElementById('uploadStep2');
        if (step1) step1.style.display = 'block';
        if (step2) step2.style.display = 'none';
    }

    async uploadVideo() {
        console.log('=== UPLOAD VIDEO FUNCTION CALLED ===');
        console.log('Current user:', window.currentUser?.uid);
        console.log('Selected file:', this.selectedVideoFile?.name);
        console.log('Upload function called from:', new Error().stack);
        
        if (!window.currentUser || !this.selectedVideoFile) {
            if (window.showToast) {
                window.showToast('Please select a video and sign in');
            }
            return;
        }

        // Show upload progress in the current video details page
        this.showUploadProgress();

        const titleElement = document.getElementById('videoTitle');
        const descriptionElement = document.getElementById('videoDescription');
        
        const title = titleElement ? titleElement.value.trim() : '';
        const description = descriptionElement ? descriptionElement.value.trim() : '';

        // CRITICAL: Stop ALL videos BEFORE proceeding with upload UI
        console.log('Stopping all videos before upload...');
        
        // First, use the video manager's complete stop function
        if (window.stopAllVideosCompletely) {
            window.stopAllVideosCompletely();
        }
        
        // Aggressively pause every single video element on the page
        document.querySelectorAll('video').forEach((video, index) => {
            console.log(`Stopping video ${index}: ${video.src ? video.src.substring(0, 50) : 'no src'}`);
            video.pause();
            video.currentTime = 0;
            video.muted = true;
            video.volume = 0;
            // Remove src to fully stop loading
            if (video.src && !video.src.includes('videoPreview')) {
                video.removeAttribute('src');
                video.load(); // Reset the video element
            }
        });
        
        // Specifically handle the video preview in upload modal
        const videoPreview = document.getElementById('videoPreview');
        if (videoPreview) {
            videoPreview.pause();
            videoPreview.currentTime = 0;
            videoPreview.muted = true;
        }
        
        console.log('All videos stopped, proceeding with upload UI...');

        // Hide the main content area completely during upload
        const mainContent = document.querySelector('.app-container');
        const videoFeed = document.querySelector('.video-feed');
        const sidebar = document.querySelector('.sidebar');
        
        if (mainContent) mainContent.style.display = 'none';
        if (videoFeed) videoFeed.style.display = 'none';
        if (sidebar) sidebar.style.display = 'none';
        
        // Make upload modal fullscreen
        const uploadModal = document.getElementById('uploadModal');
        if (uploadModal) {
            uploadModal.style.background = '#000';
            uploadModal.style.zIndex = '9999';
        }

        // Navigate to upload progress step
        const step2 = document.getElementById('uploadStep2');
        const step3 = document.getElementById('uploadStep3');
        if (step2) step2.style.display = 'none';
        if (step3) {
            step3.style.display = 'block';
            step3.style.textAlign = 'center';
            step3.style.padding = '40px 20px';
            step3.style.color = 'white';
        }

        try {
            // Update status
            this.updateUploadProgress(0, 'Starting upload...');
            
            // Create storage reference
            const storageRef = window.ref(storage, `videos/${window.currentUser.uid}_${Date.now()}.mp4`);
            const uploadTask = window.uploadBytesResumable(storageRef, this.selectedVideoFile);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Upload progress
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    
                    // Determine status message based on progress
                    let status = 'Uploading video...';
                    if (progress < 10) {
                        status = 'Starting upload...';
                    } else if (progress < 50) {
                        status = 'Uploading video...';
                    } else if (progress < 90) {
                        status = 'Almost done...';
                    } else if (progress < 100) {
                        status = 'Finalizing upload...';
                    }
                    
                    // Update the progress UI
                    this.updateUploadProgress(progress, status);
                },
                (error) => {
                    // Upload error - use centralized error handling
                    if (window.errorHandler) {
                        window.errorHandler.reportError('upload', error, {
                            operation: 'uploadVideo',
                            userId: window.currentUser?.uid,
                            fileSize: this.selectedVideoFile?.size,
                            retryWithSmallerChunks: () => {
                                // Implement retry with smaller chunks if needed
                                console.log('Retrying upload with smaller chunks');
                                this.uploadVideo();
                            }
                        });
                    } else {
                        console.error('Upload error:', error);
                        if (window.showToast) {
                            window.showToast('Failed to upload video');
                        }
                    }
                    this.closeUploadModal();
                },
                async () => {
                    // Upload success
                    try {
                        this.updateUploadProgress(100, 'Processing video...');
                        
                        const videoUrl = await window.getDownloadURL(uploadTask.snapshot.ref);
                        
                        this.updateUploadProgress(100, 'Saving video details...');
                        
                        // Create video document in Firestore
                        await window.addDoc(window.collection(db, 'videos'), {
                            userId: window.currentUser.uid,
                            title: title,
                            description: description,
                            videoUrl,
                            likes: [],
                            comments: [],
                            shares: 0,
                            views: 0,
                            createdAt: new Date()
                        });
                        
                        this.updateUploadProgress(100, 'Upload complete! 🎉');
                        
                        // Show success for a moment before closing
                        setTimeout(() => {
                            console.log('Upload complete - closing upload modal');
                            
                            if (window.showToast) {
                                window.showToast('Video uploaded successfully! 🎉');
                            }
                            
                            // Close upload modal and restore content
                            this.closeUploadModal();
                            
                            // Refresh feeds after successful upload
                            if (window.loadAllVideosForFeed) {
                                window.loadAllVideosForFeed();
                            }
                        }, 2000);
                        
                    } catch (firestoreError) {
                        console.error('Firestore error:', firestoreError);
                        if (window.showToast) {
                            window.showToast('Video uploaded but failed to save details');
                        }
                        this.closeUploadModal();
                    }
                }
            );
            
        } catch (error) {
            // Use centralized error handling
            if (window.errorHandler) {
                window.errorHandler.reportError('upload', error, {
                    operation: 'uploadVideo',
                    userId: window.currentUser?.uid,
                    phase: 'initialization'
                });
            } else {
                console.error('Upload error:', error);
                if (window.showToast) {
                    window.showToast('Failed to upload video');
                }
            }
            this.closeUploadModal();
        }
    }

    openVideoEditor(file) {
        console.log('Opening video editor for file:', file.name);
        
        if (!window.videoEditor) {
            console.error('Video editor not available');
            // Fallback to direct upload
            this.showVideoDetailsPage(file);
            return;
        }
        
        // Hide the upload page
        const uploadPage = document.getElementById('fullscreenUploadPage');
        if (uploadPage) {
            uploadPage.style.display = 'none';
        }
        
        // Set up video editor completion handler
        const originalHandler = document.addEventListener;
        const editorCompleteHandler = (event) => {
            if (event.type === 'videoEdited') {
                console.log('Video editing completed:', event.detail);
                
                // Update the selected file with edited version
                if (event.detail.video) {
                    this.selectedVideoFile = event.detail.video.file || file;
                }
                
                // Show video details page after editing
                this.showVideoDetailsPage(this.selectedVideoFile);
                
                // Remove the event listener
                document.removeEventListener('videoEdited', editorCompleteHandler);
            }
        };
        
        document.addEventListener('videoEdited', editorCompleteHandler);
        
        // Open the video editor
        if (window.openVideoEditor) {
            // Create a video element for the editor
            const videoElement = document.createElement('video');
            videoElement.src = URL.createObjectURL(file);
            videoElement.muted = true;
            videoElement.preload = 'metadata';
            
            window.openVideoEditor(videoElement);
        } else {
            console.error('openVideoEditor function not found');
            this.showVideoDetailsPage(file);
        }
    }

    showTrendingSounds() {
        // Placeholder for trending sounds functionality
        if (window.showToast) {
            window.showToast('Trending sounds feature coming soon! 🎵');
        }
    }

    // Utility methods
    getSelectedVideoFile() {
        return this.selectedVideoFile;
    }

    setSelectedVideoFile(file) {
        this.selectedVideoFile = file;
    }

    isCurrentlyRecording() {
        return this.isRecording;
    }
}

// Initialize upload manager
const uploadManager = new UploadManager();

// Make upload manager globally available
window.uploadManager = uploadManager;

export default UploadManager;