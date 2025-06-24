// Video manager module
import { db, storage } from '../firebase-init.js';
import videoCacheManager from '../core/video-cache-manager.js';

class VideoManager {
    constructor() {
        this.currentlyPlayingVideo = null;
        this.userHasInteracted = localStorage.getItem('vib3_user_interacted') === 'true';
        this.tryUnmuteNext = false;
        this.isLoadingMore = false;
        this.feedOffset = 0;
        this.videoObservers = [];
        this.autoplayTimeouts = [];
        this.isPlayingVideo = false; // Lock to prevent multiple simultaneous plays
        this.currentFeedVideos = []; // Track current feed videos for smart preloading
        this.currentVideoIndex = 0; // Track current video position
        
        // New: Video state management for profile navigation
        this.savedVideoState = null; // Store video state when leaving page
        this.currentPage = 'home'; // Track current page
        
        this.init();
    }

    init() {
        console.log('Video manager initializing...');
        
        // Subscribe to state changes
        this.setupStateSubscriptions();
        
        this.setupGlobalInteractionListeners();
        this.setupGlobalVideoFunctions();
        
        // Set initial active state for Home button
        setTimeout(() => {
            document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
            const homeBtn = document.getElementById('sidebarHome');
            if (homeBtn) homeBtn.classList.add('active');
        }, 100);
    }

    setupStateSubscriptions() {
        if (!window.stateManager) return;
        
        // Subscribe to user interaction state
        window.stateManager.subscribe('video.userHasInteracted', (hasInteracted) => {
            this.userHasInteracted = hasInteracted;
            localStorage.setItem('vib3_user_interacted', hasInteracted.toString());
            console.log('User interaction state updated:', hasInteracted);
        });

        // Subscribe to upload state changes
        window.stateManager.subscribe('ui.uploadPageActive', (active) => {
            if (active && this.currentlyPlayingVideo && !this.currentlyPlayingVideo.paused) {
                this.currentlyPlayingVideo.pause();
                console.log('Upload page active - paused current video');
            }
        });

        // Subscribe to current video changes
        window.stateManager.subscribe('video.currentlyPlayingVideo', (video) => {
            if (video !== this.currentlyPlayingVideo) {
                this.currentlyPlayingVideo = video;
                console.log('Current video updated via state:', video?.src || 'none');
            }
        });

        // Subscribe to page changes for video pause/resume
        window.stateManager.subscribe('ui.currentPage', (newPage, oldPage) => {
            console.log(`🔄 VideoManager: Page state changed from ${oldPage} to ${newPage}`);
            this.handlePageChange(newPage);
        });
    }

    setupGlobalInteractionListeners() {
        // Add global interaction listeners to unmute videos
        const enableAudioOnInteraction = (event) => {
            // Check if user is logged in (has currentUser)
            if (!window.currentUser) {
                return; // Don't unmute if not logged in
            }
            
            // Don't trigger on video container clicks (let toggleVideoPlayback handle that)
            if (event && event.target.closest('.video-container')) {
                return;
            }
            
            // Don't trigger on upload modal interactions
            if (event && (event.target.closest('.modal') || event.target.closest('#uploadModal'))) {
                return;
            }
            
            // Don't trigger on any modal interactions
            if (event && event.target.closest('[class*="modal"]')) {
                return;
            }
            
            // Don't trigger when fullscreen upload page is active
            if (event && event.target.closest('#fullscreenUploadPage')) {
                console.log('Click detected on upload page - ignoring interaction');
                return;
            }
            
            // Check upload state via state manager
            const isUploadActive = window.stateManager ? 
                window.stateManager.computed.hasActiveUpload() : 
                window.uploadPageActive;
                
            // Don't trigger if any upload page exists
            if (document.getElementById('fullscreenUploadPage') || isUploadActive) {
                console.log('Upload page active - ignoring all interactions');
                return;
            }
            
            console.log('User interaction detected outside video - enabling audio');
            
            // Update state instead of direct property
            if (window.stateManager) {
                window.stateManager.actions.setUserInteracted(true);
            } else {
                this.userHasInteracted = true;
                localStorage.setItem('vib3_user_interacted', 'true');
            }
            
            // Find the first visible video and play it with sound
            const videos = document.querySelectorAll('.video-element');
            let playedVideo = false;
            
            videos.forEach(video => {
                if (playedVideo) return; // Only play one video
                
                const rect = video.getBoundingClientRect();
                const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
                
                if (isVisible && !video.hasAttribute('data-manually-muted')) {
                    // Pause all other videos first
                    document.querySelectorAll('.video-element').forEach(otherVideo => {
                        if (otherVideo !== video && !otherVideo.paused) {
                            otherVideo.pause();
                        }
                    });
                    
                    // Play this video with sound
                    video.muted = false;
                    video.volume = 0.8;
                    this.currentlyPlayingVideo = video;
                    
                    // Force a small delay to ensure the interaction is registered by the browser
                    setTimeout(() => {
                        video.play().then(() => {
                            console.log('Started playing video with sound after outside interaction');
                        }).catch(err => {
                            console.log('Could not autoplay even after interaction:', err);
                            // Try muted as fallback
                            video.muted = true;
                            video.play().then(() => {
                                console.log('Playing muted as fallback');
                            }).catch(() => {
                                console.log('Even muted playback failed');
                            });
                        });
                    }, 100);
                    
                    // Update mute button appearance
                    const muteBtn = video.closest('.video-item')?.querySelector('.mute-btn');
                    if (muteBtn) {
                        muteBtn.classList.add('unmuted');
                        muteBtn.textContent = '🔊';
                        muteBtn.style.background = 'rgba(0,0,0,0.9)';
                    }
                    
                    playedVideo = true;
                }
            });
            
            // Remove the listeners after first interaction
            document.removeEventListener('click', enableAudioOnInteraction);
            document.removeEventListener('touchstart', enableAudioOnInteraction);
            document.removeEventListener('scroll', enableAudioOnInteraction);
            document.removeEventListener('keydown', enableAudioOnInteraction);
        };
        
        // Always add listeners, but they only work when logged in
        // Use capture phase for click to run before other handlers
        document.addEventListener('click', enableAudioOnInteraction, true);
        document.addEventListener('touchstart', enableAudioOnInteraction, true);
        document.addEventListener('scroll', enableAudioOnInteraction);
        document.addEventListener('keydown', enableAudioOnInteraction);
        console.log('Added interaction listeners to enable audio when logged in');
    }

    setupGlobalVideoFunctions() {
        // Video playback toggle function
        window.toggleVideoPlayback = (wrapper) => {
            // Handle nested structure - look for video in wrapper or its children
            const video = wrapper.querySelector('.video-element') || wrapper.closest('.video-item').querySelector('.video-element');
            const indicator = wrapper.querySelector('.play-pause-indicator') || wrapper.closest('.video-item').querySelector('.play-pause-indicator');
            
            if (!video) return;
            
            // Video tap behavior: toggle play/pause
            if (video.paused) {
                // Resume video with sound
                // Pause all other videos first
                document.querySelectorAll('.video-element').forEach(otherVideo => {
                    if (otherVideo !== video && !otherVideo.paused) {
                        otherVideo.pause();
                    }
                });
                
                // Set this as currently playing
                videoManager.currentlyPlayingVideo = video;
                
                // Play with sound if user has interacted
                video.muted = false;
                video.volume = 0.8;
                
                video.play().then(() => {
                    console.log('Video resumed by tap');
                    if (indicator) {
                        indicator.textContent = '▶️';
                        indicator.style.opacity = '1';
                        setTimeout(() => indicator.style.opacity = '0', 1000);
                    }
                }).catch((error) => {
                    console.log('Resume failed, trying muted');
                    if (window.errorHandler) {
                        window.errorHandler.reportError('video', error, {
                            operation: 'toggleVideoPlayback',
                            video: video,
                            fallback: () => {
                                video.muted = true;
                                video.play().catch(() => {});
                            }
                        });
                    }
                    video.muted = true;
                    video.play().catch(() => {});
                });
            } else {
                // Pause video
                video.pause();
                if (indicator) {
                    indicator.textContent = '⏸️';
                    indicator.style.opacity = '1';
                    setTimeout(() => indicator.style.opacity = '0', 1000);
                }
                console.log('Video paused by tap');
            }
        };

        // Current video mute toggle
        window.toggleCurrentVideoMute = () => {
            const videos = document.querySelectorAll('.video-element');
            videos.forEach(video => {
                const rect = video.getBoundingClientRect();
                if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                    // Toggle mute state
                    video.muted = !video.muted;
                    
                    // Mark as manually muted/unmuted
                    if (video.muted) {
                        video.setAttribute('data-manually-muted', 'true');
                    } else {
                        video.removeAttribute('data-manually-muted');
                    }
                    
                    // Update button appearance
                    this.updateMuteButtonAppearance(video.muted);
                    
                    // Show toast notification
                    if (window.showToast) {
                        window.showToast(video.muted ? '🔇 Video Muted' : '🔊 Video Unmuted');
                    }
                }
            });
        };

        // Switch feed tab function
        window.switchFeedTab = (tab, preserveSidebarState = false) => {
            console.log(`Switching to ${tab} tab - cleaning up videos first`);
            
            // CRITICAL: Stop all videos completely before switching tabs
            this.stopAllVideosCompletely();
            
            // Clear all existing video content from feeds
            const feeds = ['foryouFeed', 'followingFeed', 'discoverFeed'];
            feeds.forEach(feedId => {
                const feed = document.getElementById(feedId);
                if (feed) {
                    // Clear existing content but keep structure
                    feed.innerHTML = '<div class="feed-loading">Loading...</div>';
                }
            });
            
            this.isLoadingMore = false;
            this.feedOffset = 0;
            
            // Ensure video feed page is visible
            if (window.showPage) {
                window.showPage('home');
            }
            
            // Wait a moment for cleanup to complete before proceeding
            setTimeout(() => {
                console.log(`Proceeding with ${tab} tab loading after cleanup delay`);
                this.completeFeedTabSwitch(tab, preserveSidebarState);
            }, 300);
        };
        
        // Complete the feed tab switch after cleanup
        this.completeFeedTabSwitch = (tab, preserveSidebarState = false) => {
            // Only update sidebar if not preserving state (for friends button case)
            // For regular tab switches, the navigation.js showPage function already handles sidebar highlighting
            if (!preserveSidebarState) {
                // Don't clear sidebar states here - let navigation.js handle it
                // This prevents overriding the proper sidebar highlighting
            }
            
            document.querySelectorAll('.feed-loading').forEach(el => el.remove());
            document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
            
            // Normalize tab names for element IDs
            const feedName = tab === 'explore' ? 'discover' : tab;
            const tabElement = document.getElementById(`${feedName}Tab`);
            if (tabElement) tabElement.classList.add('active');
            
            document.querySelectorAll('.feed-content').forEach(c => c.classList.remove('active'));
            const feedElement = document.getElementById(`${feedName}Feed`);
            if (feedElement) feedElement.classList.add('active');
            
            // Update state manager with current active tab
            if (window.stateManager) {
                window.stateManager.actions.setFeedTab(tab);
                window.stateManager.actions.setCurrentPage('home');
                console.log(`Updated state manager with active feed tab: ${tab}`);
            }
            
            document.querySelectorAll('video').forEach(video => {
                video.pause();
            });
            
            // Load content for the selected tab
            if (tab === 'foryou') {
                // Always load For You videos when switching to this tab
                if (window.loadAllVideosForFeed) {
                    window.loadAllVideosForFeed();
                }
            } else if (tab === 'following') {
                if (window.loadFollowingFeed) {
                    window.loadFollowingFeed();
                }
            } else if (tab === 'discover' || tab === 'explore') {
                if (window.loadDiscoverFeed) {
                    window.loadDiscoverFeed();
                }
            }
            
            // No automatic video playing after tab switch - let intersection observer handle it
            console.log(`Completed switching to ${tab} tab`);
        };
    }

    updateMuteButtonAppearance(muted) {
        if (window.updateMuteButtonAppearance) {
            window.updateMuteButtonAppearance(muted);
        }
    }

    // Format count numbers like VIB3 (1.2K, 15M, etc.)
    formatCount(count) {
        if (count < 1000) return count.toString();
        if (count < 1000000) return (count / 1000).toFixed(1).replace('.0', '') + 'K';
        return (count / 1000000).toFixed(1).replace('.0', '') + 'M';
    }

    // Create video playback controls
    createVideoItem(videoData, userData, username) {
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.dataset.videoId = videoData.id;
        videoItem.dataset.userId = videoData.userId;
        videoItem.dataset.videoUrl = videoData.videoUrl; // Store URL for caching
        
        videoItem.innerHTML = `
            <div class="video-container" style="position: relative; width: 100%; height: 100vh; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer;">
                <!-- Video content wrapper with max width like VIB3 -->
                <div class="video-content-wrapper" style="position: relative; max-width: 600px; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                    <video class="video-element" loop playsinline preload="metadata" data-video-url="${videoData.videoUrl}" onloadedmetadata="handleVideoMetadata(this)" style="width: 100%; height: 100%; object-fit: cover;"></video>
                    
                    <!-- Username and title overlay - positioned inside video -->
                    <div class="video-info-overlay" style="position: absolute; bottom: 65px; left: 85px; color: white; z-index: 9; max-width: calc(100% - 120px); pointer-events: none;">
                        <div class="username" style="font-weight: 700; font-size: 18px; text-shadow: 0 0 12px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7); margin-bottom: 6px;">@${username}</div>
                        <div class="video-title" style="font-size: 16px; line-height: 1.3; text-shadow: 0 0 12px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7);">${videoData.description || 'No title'}</div>
                    </div>
                    
                    <!-- vertical video action buttons - positioned relative to video content -->
                    <div class="video-actions" style="position: absolute; right: -10px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 24px; z-index: 10; align-items: center;">
                        <!-- Creator Profile Avatar -->
                        <div class="action-item" style="display: flex; flex-direction: column; align-items: center; position: relative;">
                            <div class="creator-avatar" onclick="event.stopPropagation(); window.showCreatorProfile('${videoData.userId}')" style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(45deg, #ff006e, #8338ec); display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid white; position: relative;">
                                <span style="color: white; font-weight: bold; font-size: 20px;">${username.charAt(0).toUpperCase()}</span>
                            </div>
                            <!-- Follow Button on avatar -->
                            <button class="follow-btn" onclick="event.stopPropagation(); window.handleFollowClick('${videoData.userId}', this)" style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 24px; height: 24px; border-radius: 50%; background: #fe2c55; color: white; border: 2px solid white; font-size: 16px; font-weight: bold; cursor: pointer; z-index: 1; display: flex; align-items: center; justify-content: center; line-height: 1;">
                                +
                            </button>
                        </div>
                        
                        <!-- Like Button -->
                        <div class="action-item" style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                            <button class="action-btn like-btn" onclick="event.stopPropagation(); window.handleLikeClick('${videoData.id}', this)" style="background: none; border: none; width: 56px; height: 56px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border-radius: 50%;">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="white" stroke="none">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                            </button>
                            <span style="color: white; font-size: 12px; font-weight: 600; text-shadow: 0 0 8px rgba(0,0,0,0.8);">${this.formatCount(videoData.likes?.length || 0)}</span>
                        </div>
                        
                        <!-- Comment Button -->
                        <div class="action-item" style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                            <button class="action-btn comment-btn" onclick="event.stopPropagation(); window.handleCommentClick('${videoData.id}')" style="background: none; border: none; width: 56px; height: 56px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border-radius: 50%;">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="white" stroke="none">
                                    <path d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.89 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                                </svg>
                            </button>
                            <span style="color: white; font-size: 12px; font-weight: 600; text-shadow: 0 0 8px rgba(0,0,0,0.8);">${this.formatCount(videoData.comments?.length || 0)}</span>
                        </div>
                        
                        <!-- Bookmark Button -->
                        <div class="action-item" style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                            <button class="action-btn bookmark-btn" onclick="event.stopPropagation(); window.handleBookmarkClick('${videoData.id}', this)" style="background: none; border: none; width: 56px; height: 56px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border-radius: 50%;">
                                <svg width="36" height="40" viewBox="0 0 24 24" fill="white" stroke="none">
                                    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                                </svg>
                            </button>
                        </div>
                        
                        <!-- Share Button -->
                        <div class="action-item" style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                            <button class="action-btn share-btn" onclick="event.stopPropagation(); window.handleShareClick('${videoData.id}')" style="background: none; border: none; width: 56px; height: 56px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border-radius: 50%;">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="white" stroke="none">
                                    <path d="M21 12l-7-7v4C7 10 4 15 3 20c2.5-3.5 6-5.1 11-5.1V18l7-6z"/>
                                </svg>
                            </button>
                            <span style="color: white; font-size: 12px; font-weight: 600; text-shadow: 0 0 8px rgba(0,0,0,0.8);">${this.formatCount(videoData.shares || 0)}</span>
                        </div>
                    </div>
                    
                    <!-- Play/pause indicator -->
                    <div class="play-pause-indicator" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.7); border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: white; opacity: 0; transition: opacity 0.3s ease; pointer-events: none;">
                        ▶️
                    </div>
                </div>
                
                <!-- Progress bar -->
                <div class="video-progress" style="position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: rgba(255,255,255,0.3); z-index: 8;">
                    <div class="progress-fill" style="height: 100%; width: 0%; background: white; transition: width 0.1s;"></div>
                </div>
            </div>
        `;
        
        const video = videoItem.querySelector('video');
        const videoContainer = videoItem.querySelector('.video-container');
        
        // Set up video with caching optimization
        this.setupVideoWithCaching(video, videoData.videoUrl);
        
        // Add proper event listener for video playback toggle (replacing inline onclick)
        videoContainer.addEventListener('click', (e) => {
            // Don't trigger if clicking on action buttons
            if (e.target.closest('.video-actions') || e.target.closest('.action-btn')) {
                return;
            }
            window.toggleVideoPlayback(videoContainer);
        });
        
        // Set up video for autoplay and audio
        // Start unmuted if user is logged in, otherwise muted
        if (window.currentUser) {
            video.muted = false;
            video.volume = 0.8;
            console.log('Setting up video unmuted for logged in user');
        } else {
            video.muted = true;
            video.volume = 0.8;
            console.log('Setting up video muted for non-logged in user');
        }
        
        // Handle autoplay restrictions
        const playVideo = async (videoElement) => {
            // Prevent multiple videos from starting simultaneously
            if (videoManager.isPlayingVideo) {
                console.log('Video play already in progress, ignoring this request');
                return;
            }
            
            videoManager.isPlayingVideo = true;
            console.log('Starting video play with exclusive lock');
            
            // CRITICAL: Only allow one video to play at a time
            if (videoManager.currentlyPlayingVideo && videoManager.currentlyPlayingVideo !== videoElement) {
                console.log('Another video is already playing, stopping it first');
                videoManager.currentlyPlayingVideo.pause();
                videoManager.currentlyPlayingVideo.currentTime = 0;
                videoManager.currentlyPlayingVideo.volume = 0;
            }
            
            // Pause ALL other videos aggressively
            document.querySelectorAll('video').forEach(video => {
                if (video !== videoElement && !video.paused) {
                    console.log('Pausing competing video');
                    video.pause();
                    video.currentTime = 0;
                    video.volume = 0;
                }
            });
            
            // Set this as the currently playing video
            videoManager.currentlyPlayingVideo = videoElement;
            
            // Always set to unmuted unless manually muted by user
            if (!videoElement.hasAttribute('data-manually-muted')) {
                videoElement.muted = false;
                videoElement.volume = 0.8;
                
                // Update mute button to show unmuted state
                const muteBtn = videoElement.closest('.video-item').querySelector('.mute-btn');
                if (muteBtn) {
                    muteBtn.classList.add('unmuted');
                    muteBtn.textContent = '🔊';
                    muteBtn.style.background = 'rgba(0,0,0,0.9)';
                }
            }
            
            try {
                videoElement.currentTime = 0; // Reset video to beginning
                await videoElement.play();
                console.log('Video playing with sound');
                
                // Mark that user interaction has occurred, enabling autoplay for future videos
                videoManager.userHasInteracted = true;
                localStorage.setItem('vib3_user_interacted', 'true');
                
            } catch (error) {
                console.log('Autoplay with sound blocked, trying muted autoplay');
                // Try muted autoplay as fallback
                try {
                    videoElement.muted = true;
                    await videoElement.play();
                    console.log('Video playing muted - will unmute on interaction');
                    
                    // Show unmute prompt for muted videos
                    if (window.currentUser) {
                        this.showUnmutePrompt(videoElement);
                    }
                    
                } catch (mutedError) {
                    console.log('All autoplay blocked, video will play when user interacts');
                }
            }
            
            // Release the lock
            setTimeout(() => {
                videoManager.isPlayingVideo = false;
                console.log('Video play lock released');
            }, 1000);
        };
        
        // Add intersection observer for video autoplay
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const videoElement = entry.target;
                if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                    // Don't autoplay if upload is in progress
                    if (window.uploadInProgress) {
                        console.log('Upload in progress - skipping video autoplay');
                        return;
                    }
                    
                    // Don't autoplay if this video was paused for upload
                    if (videoElement.hasAttribute('data-upload-paused')) {
                        console.log('Video paused for upload - skipping autoplay');
                        return;
                    }
                    // Pause any other currently playing videos
                    document.querySelectorAll('.video-element').forEach(otherVideo => {
                        if (otherVideo !== videoElement && !otherVideo.paused) {
                            otherVideo.pause();
                        }
                    });
                    
                    // Check if this is the first video after login or if user is logged in
                    if (window.enableAudioAfterLogin || window.currentUser) {
                        // Force audio enabled for logged in users
                        videoElement.muted = false;
                        videoElement.volume = 0.8;
                        // Update mute button to show unmuted state
                        const muteBtn = videoElement.closest('.video-item').querySelector('.mute-btn');
                        if (muteBtn) {
                            muteBtn.classList.add('unmuted');
                            muteBtn.textContent = '🔊';
                            muteBtn.style.background = 'rgba(0,0,0,0.9)';
                        }
                        if (window.enableAudioAfterLogin) {
                            window.enableAudioAfterLogin = false; // Reset flag
                        }
                    }
                    
                    // If we should try unmuting on next video, attempt it
                    if (this.tryUnmuteNext && !videoElement.hasAttribute('data-manually-muted')) {
                        console.log('Attempting to unmute video on scroll');
                        videoElement.muted = false;
                        videoElement.volume = 0.8;
                        
                        // Update mute button to show unmuted state
                        const muteBtn = videoElement.closest('.video-item').querySelector('.mute-btn');
                        if (muteBtn) {
                            muteBtn.classList.add('unmuted');
                            muteBtn.textContent = '🔊';
                            muteBtn.style.background = 'rgba(0,0,0,0.9)';
                        }
                        
                        // Clear the flag after first attempt
                        this.tryUnmuteNext = false;
                    }
                    
                    // Video is mostly visible, play it
                    // Check if user has interacted and unmute accordingly
                    if (videoElement.paused) {
                        if (videoManager.userHasInteracted && window.currentUser) {
                            // User has interacted, try unmuted play
                            videoElement.muted = false;
                            videoElement.volume = 0.8;
                            videoElement.play().then(() => {
                                console.log('Video auto-started unmuted (user has interacted)');
                            }).catch(() => {
                                console.log('Unmuted autoplay failed, falling back to muted');
                                videoElement.muted = true;
                                videoElement.play().catch(() => {});
                            });
                        } else {
                            // No interaction yet, start muted
                            videoElement.muted = true;
                            videoElement.play().then(() => {
                                console.log('Video auto-started muted via intersection observer');
                                if (window.currentUser) {
                                    this.showUnmutePrompt(videoElement);
                                }
                            }).catch(() => {
                                console.log('Intersection observer autoplay blocked, trying full playVideo');
                                playVideo(videoElement);
                            });
                        }
                    }
                } else {
                    // Video is out of view, pause it
                    videoElement.pause();
                }
            });
        }, {
            threshold: 0.3 // Play when 30% visible (more sensitive)
        });
        
        videoObserver.observe(video);
        
        // Track the observer for cleanup
        this.videoObservers.push(videoObserver);
        
        // Try to autoplay the first video immediately if it's the first in view
        const autoplayTimeout = setTimeout(() => {
            // Don't autoplay if upload is in progress
            if (window.uploadInProgress) {
                console.log('Upload in progress - skipping initial autoplay');
                return;
            }
            
            const rect = video.getBoundingClientRect();
            const isInViewport = rect.top >= 0 && rect.top < window.innerHeight * 0.7;
            if (isInViewport && video.paused) {
                console.log('Attempting autoplay for first visible video');
                
                // Always try muted autoplay first (browser requirement)
                video.muted = true;
                video.play().then(() => {
                    console.log('Video started muted - ready for interaction');
                    if (window.currentUser) {
                        this.showUnmutePrompt(video);
                    }
                }).catch(() => {
                    console.log('Even muted autoplay blocked - will play on interaction');
                });
            }
        }, 100); // Reduced delay for faster startup
        
        // Track the timeout for cleanup
        this.autoplayTimeouts.push(autoplayTimeout);
        
        return videoItem;
    }

    // Set up video with caching optimization
    setupVideoWithCaching(videoElement, videoUrl) {
        // Optimize video element for performance
        videoCacheManager.optimizeVideoElement(videoElement);
        
        // Check if we have a cached version
        const cachedVideo = videoCacheManager.getCachedVideo(videoUrl);
        if (cachedVideo) {
            console.log('Using cached video for:', videoUrl.substring(0, 50));
            // Copy the cached video's source
            videoElement.src = cachedVideo.src;
            videoElement.lastAccessed = Date.now();
        } else {
            // Set source normally and trigger preloading
            videoElement.src = videoUrl;
            this.triggerSmartPreloading();
        }
        
        // Mark access time for cache management
        videoElement.addEventListener('play', () => {
            videoElement.lastAccessed = Date.now();
            this.triggerSmartPreloading();
        });
    }

    // Trigger smart preloading based on current video position
    triggerSmartPreloading() {
        // Get all video items currently in feed
        const videoItems = Array.from(document.querySelectorAll('.video-item'));
        
        if (videoItems.length === 0) return;
        
        // Find currently playing or visible video
        let currentIndex = 0;
        const currentVideo = this.currentlyPlayingVideo;
        
        if (currentVideo) {
            const currentItem = currentVideo.closest('.video-item');
            currentIndex = videoItems.indexOf(currentItem);
        }
        
        // Update current feed videos for smart preloading
        this.currentFeedVideos = videoItems.map(item => ({
            url: item.dataset.videoUrl,
            element: item
        }));
        
        this.currentVideoIndex = currentIndex;
        
        // Trigger smart preloading
        if (this.currentFeedVideos.length > 0) {
            videoCacheManager.smartPreload(this.currentFeedVideos, currentIndex)
                .catch(error => console.warn('Smart preload failed:', error));
        }
    }

    // Enhanced video restoration with caching
    restoreVideoPlaybackAfterUpload() {
        const activeFeedTab = window.stateManager ? 
            window.stateManager.getState('ui.activeFeedTab') : 'foryou';
        
        if (window.switchFeedTab) {
            window.switchFeedTab(activeFeedTab);
        }
        
        setTimeout(() => {
            this.attemptAutoplayForFirstVisibleVideo();
            // Trigger preloading for the restored feed
            this.triggerSmartPreloading();
        }, 1000);
    }

    // Get performance statistics from cache manager
    getVideoPerformanceStats() {
        if (window.videoCacheManager) {
            return window.videoCacheManager.getPerformanceStats();
        }
        return null;
    }

    pauseAllVideos() {
        console.log('Pausing all videos and resetting state');
        
        // Pause feed videos
        document.querySelectorAll('.video-element').forEach(video => {
            // Pause video
            if (!video.paused) {
                video.pause();
            }
            // Reset video to beginning
            video.currentTime = 0;
            // Ensure volume is reset
            video.volume = 0.8;
            // Remove any playing classes
            video.classList.remove('playing');
        });
        
        // Also pause any profile videos that might be playing
        document.querySelectorAll('.profile-video-item video').forEach(video => {
            if (!video.paused) {
                video.pause();
                video.currentTime = 0;
                video.muted = true;
            }
        });
        
        this.currentlyPlayingVideo = null;
        
        // Also remove any unmute prompts
        document.querySelectorAll('.unmute-prompt').forEach(prompt => {
            prompt.remove();
        });
    }

    // Enhanced function to completely stop all video playback
    stopAllVideosCompletely() {
        console.log('Stopping all videos completely');
        
        // First, find and log all video elements including profile videos
        const allVideos = document.querySelectorAll('video, .video-element');
        const profileVideos = document.querySelectorAll('.profile-video-item video');
        console.log(`Found ${allVideos.length} video elements + ${profileVideos.length} profile videos to stop`);
        
        // Aggressively stop all videos
        allVideos.forEach((video, index) => {
            if (video.tagName === 'VIDEO') {
                console.log(`Stopping video ${index}: playing=${!video.paused}, volume=${video.volume}`);
                video.pause();
                video.currentTime = 0;
                video.volume = 0; // Mute completely during transition
                video.muted = true;
                
                // Remove all event listeners by cloning and replacing
                const newVideo = video.cloneNode(true);
                video.parentNode.replaceChild(newVideo, video);
            }
        });
        
        // Also stop profile grid videos
        profileVideos.forEach((video, index) => {
            if (video.tagName === 'VIDEO') {
                console.log(`Stopping profile video ${index}`);
                video.pause();
                video.currentTime = 0;
                video.muted = true;
                
                // Remove hover event listeners by cloning
                const videoItem = video.closest('.profile-video-item');
                if (videoItem) {
                    const newVideoItem = videoItem.cloneNode(true);
                    videoItem.parentNode.replaceChild(newVideoItem, videoItem);
                }
            }
        });
        
        this.pauseAllVideos();
        
        // Remove all intersection observers to prevent auto-restart
        if (this.videoObservers) {
            console.log(`Disconnecting ${this.videoObservers.length} video observers`);
            this.videoObservers.forEach(observer => observer.disconnect());
            this.videoObservers = [];
        }
        
        // Clear any pending timeouts for autoplay
        if (this.autoplayTimeouts) {
            console.log(`Clearing ${this.autoplayTimeouts.length} autoplay timeouts`);
            this.autoplayTimeouts.forEach(timeout => clearTimeout(timeout));
            this.autoplayTimeouts = [];
        }
        
        // Reset playing video reference and lock
        this.currentlyPlayingVideo = null;
        this.isPlayingVideo = false;
        
        console.log('All videos stopped and cleaned up');
    }

    // New: Handle page changes for video pause/resume
    handlePageChange(newPage) {
        const oldPage = this.currentPage;
        this.currentPage = newPage;
        
        console.log(`🔄 Page changed from ${oldPage} to ${newPage}`);
        
        // When navigating to profile from any page
        if (newPage === 'profile') {
            console.log('👤 Entering profile page - pausing all videos');
            
            // Save state if coming from home
            if (oldPage === 'home') {
                this.saveVideoStateAndPause();
            } else {
                // Just pause videos gracefully
                this.pauseAllVideosGracefully();
                this.disableProfileVideoHover();
            }
            
            // Extra safety: Stop all profile videos too
            if (window.stopAllProfileVideos) {
                window.stopAllProfileVideos();
            }
        }

        // When navigating to messages from any page
        if (newPage === 'messages') {
            console.log('💬 Entering messages page - pausing all videos');
            
            // Save state if coming from home
            if (oldPage === 'home') {
                this.saveVideoStateAndPause();
            } else {
                // Just pause videos gracefully
                this.pauseAllVideosGracefully();
            }
        }

        // When navigating to activity from any page
        if (newPage === 'activity') {
            console.log('🔔 Entering activity page - pausing all videos');
            
            // Save state if coming from home
            if (oldPage === 'home') {
                this.saveVideoStateAndPause();
            } else {
                // Just pause videos gracefully
                this.pauseAllVideosGracefully();
            }
        }

        // When navigating to live from any page
        if (newPage === 'live') {
            console.log('📺 Entering live page - pausing all videos');
            
            // Save state if coming from home
            if (oldPage === 'home') {
                this.saveVideoStateAndPause();
            } else {
                // Just pause videos gracefully
                this.pauseAllVideosGracefully();
            }
        }
        
        // When returning from profile to home/video feed
        if (oldPage === 'profile' && newPage === 'home') {
            console.log('🏠 Returning to home from profile');
            
            // Re-enable profile video hover when leaving profile
            this.enableProfileVideoHover();
            
            // Small delay to let the page load first
            setTimeout(() => {
                this.restoreVideoState();
            }, 100);
        }

        // When returning from messages to home/video feed
        if (oldPage === 'messages' && newPage === 'home') {
            console.log('🏠 Returning to home from messages');
            
            // Small delay to let the page load first
            setTimeout(() => {
                this.restoreVideoState();
            }, 100);
        }

        // When returning from activity to home/video feed
        if (oldPage === 'activity' && newPage === 'home') {
            console.log('🏠 Returning to home from activity');
            
            // Small delay to let the page load first
            setTimeout(() => {
                this.restoreVideoState();
            }, 100);
        }

        // When returning from live to home/video feed
        if (oldPage === 'live' && newPage === 'home') {
            console.log('🏠 Returning to home from live');
            
            // Small delay to let the page load first
            setTimeout(() => {
                this.restoreVideoState();
            }, 100);
        }

        // General handler: When returning from any non-feed page to home
        const nonFeedPages = ['profile', 'messages', 'activity', 'live', 'settings'];
        if (nonFeedPages.includes(oldPage) && newPage === 'home') {
            console.log(`🏠 Returning to home from ${oldPage} (general handler)`);
            
            // Re-enable profile video hover if it was disabled
            if (oldPage === 'profile') {
                this.enableProfileVideoHover();
            }
        }
    }

    // Save current video state before pausing
    saveVideoStateAndPause() {
        console.log('🎥 Saving video state before entering profile...');
        
        if (this.currentlyPlayingVideo && !this.currentlyPlayingVideo.paused) {
            this.savedVideoState = {
                videoElement: this.currentlyPlayingVideo,
                currentTime: this.currentlyPlayingVideo.currentTime,
                volume: this.currentlyPlayingVideo.volume,
                muted: this.currentlyPlayingVideo.muted,
                wasPlaying: !this.currentlyPlayingVideo.paused,
                videoContainer: this.currentlyPlayingVideo.closest('.video-container'),
                videoId: this.currentlyPlayingVideo.closest('[data-video-id]')?.getAttribute('data-video-id')
            };
            
            console.log('💾 Saved video state:', {
                time: this.savedVideoState.currentTime,
                volume: this.savedVideoState.volume,
                videoId: this.savedVideoState.videoId,
                wasPlaying: this.savedVideoState.wasPlaying
            });
        }
        
        // Pause all videos gracefully including profile videos
        this.pauseAllVideosGracefully();
        
        // Important: Stop any profile videos that might auto-play on hover
        this.disableProfileVideoHover();
    }

    // Restore video state when returning to home
    restoreVideoState() {
        console.log('🎥 Attempting to restore video state...');
        
        if (!this.savedVideoState) {
            console.log('📭 No saved video state to restore');
            return;
        }
        
        // Try to find the same video element (it may have been recreated)
        let targetVideo = this.savedVideoState.videoElement;
        
        // If the original element is no longer valid, try to find by video ID
        if (!targetVideo || !document.contains(targetVideo)) {
            if (this.savedVideoState.videoId) {
                const videoContainer = document.querySelector(`[data-video-id="${this.savedVideoState.videoId}"]`);
                if (videoContainer) {
                    targetVideo = videoContainer.querySelector('video');
                    console.log('🔍 Found video by ID:', this.savedVideoState.videoId);
                }
            }
        }
        
        if (targetVideo && document.contains(targetVideo)) {
            console.log('🔄 Restoring video playback...');
            
            // Restore video properties
            targetVideo.currentTime = this.savedVideoState.currentTime;
            targetVideo.volume = this.savedVideoState.volume;
            targetVideo.muted = this.savedVideoState.muted;
            
            // Resume playback if it was playing before
            if (this.savedVideoState.wasPlaying) {
                targetVideo.play().then(() => {
                    console.log('▶️ Video resumed successfully');
                    this.currentlyPlayingVideo = targetVideo;
                    this.isPlayingVideo = true;
                }).catch(error => {
                    console.log('⚠️ Could not resume video:', error.message);
                    // Fall back to muted playback
                    targetVideo.muted = true;
                    targetVideo.play().catch(e => console.log('Muted playback also failed:', e.message));
                });
            }
        } else {
            console.log('❌ Could not find video to restore');
        }
        
        // Clear saved state
        this.savedVideoState = null;
    }

    // Graceful pause (doesn't reset time or replace elements)
    pauseAllVideosGracefully() {
        console.log('⏸️ Pausing all videos gracefully...');
        
        // Pause ALL video elements, including profile grid videos
        const allVideos = document.querySelectorAll('video, .video-element');
        allVideos.forEach((video, index) => {
            if (video.tagName === 'VIDEO' && !video.paused) {
                video.pause();
                console.log(`⏸️ Paused video ${index}`);
            }
        });
        
        // Also pause any profile grid videos that might be playing
        const profileVideos = document.querySelectorAll('.profile-video-item video');
        profileVideos.forEach((video, index) => {
            if (!video.paused) {
                video.pause();
                video.currentTime = 0; // Reset profile videos
                console.log(`⏸️ Paused profile video ${index}`);
            }
        });
        
        // Update current state
        this.isPlayingVideo = false;
        
        console.log('✅ All videos paused gracefully');
    }

    // Disable profile video hover play temporarily
    disableProfileVideoHover() {
        console.log('🚫 Disabling profile video hover autoplay');
        
        // Add a flag to prevent hover play
        document.body.setAttribute('data-profile-hover-disabled', 'true');
        
        // Remove existing hover event listeners from profile videos
        const profileVideoItems = document.querySelectorAll('.profile-video-item');
        profileVideoItems.forEach(item => {
            // Clone to remove event listeners
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
        });
    }
    
    // Re-enable profile video hover play
    enableProfileVideoHover() {
        console.log('✅ Re-enabling profile video hover autoplay');
        document.body.removeAttribute('data-profile-hover-disabled');
    }

    showUnmutePrompt(video) {
        const videoContainer = video.closest('.video-container');
        if (!videoContainer || this.userHasInteracted) return;

        // Create unmute prompt overlay
        const unmutePrompt = document.createElement('div');
        unmutePrompt.className = 'unmute-prompt';
        unmutePrompt.innerHTML = `
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 15px 20px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: bold;
                z-index: 100;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                animation: pulse 2s infinite;
            ">
                🔊 Tap anywhere for sound
            </div>
        `;

        videoContainer.appendChild(unmutePrompt);

        // Remove prompt after first interaction
        const removePrompt = () => {
            if (unmutePrompt.parentNode) {
                unmutePrompt.remove();
            }
        };

        document.addEventListener('click', removePrompt, { once: true });
        document.addEventListener('touchstart', removePrompt, { once: true });
        document.addEventListener('scroll', removePrompt, { once: true });
        
        // Auto-remove after 5 seconds
        setTimeout(removePrompt, 5000);
    }

    // Restore video playback after upload completion
    restoreVideoPlaybackAfterUpload() {
        console.log('Restoring video playback after upload completion');
        
        // Get the current active tab from state or default to foryou
        const activeFeedTab = window.stateManager ? 
            window.stateManager.getState('ui.activeFeedTab') : 
            'foryou';
        
        console.log(`Restoring ${activeFeedTab} feed videos`);
        
        // Switch to the active tab to reload videos
        if (window.switchFeedTab) {
            window.switchFeedTab(activeFeedTab);
        }
        
        // After a short delay, try to start the first visible video
        setTimeout(() => {
            this.attemptAutoplayForFirstVisibleVideo();
        }, 1000);
    }

    // Helper method to start the first visible video
    attemptAutoplayForFirstVisibleVideo() {
        console.log('Attempting to start first visible video after upload');
        
        const videos = document.querySelectorAll('.video-element');
        if (videos.length === 0) {
            console.log('No videos found to start');
            return;
        }

        // Find the first visible video
        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            const rect = video.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
            
            if (isVisible) {
                console.log(`Starting video ${i} after upload restoration`);
                
                // Try to play with sound if user has interacted
                const userHasInteracted = window.stateManager ? 
                    window.stateManager.getState('video.userHasInteracted') : 
                    window.userHasInteracted;
                
                if (userHasInteracted) {
                    video.muted = false;
                    video.volume = 0.8;
                    
                    video.play().then(() => {
                        console.log('Video resumed with sound after upload');
                        this.currentlyPlayingVideo = video;
                        
                        // Update state
                        if (window.stateManager) {
                            window.stateManager.setState('video.currentlyPlayingVideo', video);
                        }
                    }).catch(() => {
                        console.log('Video autoplay failed, trying muted');
                        video.muted = true;
                        video.play().catch(() => {
                            console.log('Even muted playback failed');
                        });
                    });
                } else {
                    // Try muted playback
                    video.muted = true;
                    video.play().catch(() => {
                        console.log('Muted playback failed');
                    });
                }
                
                break; // Only play one video
            }
        }
    }
}

// Initialize video manager
const videoManager = new VideoManager();

// Make video manager globally available
window.videoManager = videoManager;
window.pauseAllVideos = () => videoManager.pauseAllVideos();
window.pauseAllVideosGracefully = () => videoManager.pauseAllVideosGracefully();
window.stopAllVideosCompletely = () => videoManager.stopAllVideosCompletely();
window.restoreVideoPlaybackAfterUpload = () => videoManager.restoreVideoPlaybackAfterUpload();

export default VideoManager;