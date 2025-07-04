// Enhanced Feed Loader with UI/UX Improvements
// Replaces default loading states with enhanced skeletons and animations

// Enhanced feed loading with skeleton screens
window.enhancedLoadVideoFeed = async function(feedType = 'foryou', forceRefresh = false, page = 1, append = false) {
    console.log(`🎨 Enhanced feed loading: ${feedType}, page: ${page}, append: ${append}`);
    
    const feedElement = document.getElementById(feedType + 'Feed');
    if (!feedElement) {
        console.error('Feed element not found:', feedType + 'Feed');
        return;
    }

    try {
        // Show skeleton screens instead of basic loading
        if (!append) {
            showSkeletonScreen(feedElement, 3);
            
            // Show loading notification
            const loadingId = showLoadingNotification(`Loading ${feedType} videos...`);
            
            // Store loading ID for cleanup
            feedElement.setAttribute('data-loading-id', loadingId);
        }

        // Simulate network delay for better UX (minimum loading time)
        const minLoadTime = 800;
        const startTime = Date.now();

        // Call original loadVideoFeed function
        const originalFunction = window.originalLoadVideoFeed || window.loadVideoFeed;
        
        // Execute the original loading logic
        await originalFunction(feedType, forceRefresh, page, append);
        
        // Ensure minimum loading time for smooth UX
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < minLoadTime) {
            await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsedTime));
        }

        // Hide loading notification
        const loadingId = feedElement.getAttribute('data-loading-id');
        if (loadingId) {
            window.notificationManager.dismiss(loadingId);
            feedElement.removeAttribute('data-loading-id');
        }

        // Add stagger animation to new content
        const videoElements = feedElement.querySelectorAll('.video-item');
        videoElements.forEach((element, index) => {
            element.style.animationDelay = `${index * 0.1}s`;
            element.classList.add('float-up');
        });

        // Show success notification for fresh loads
        if (!append && feedType === 'foryou') {
            showSuccess('Feed updated with fresh content!', 2000);
        }

    } catch (error) {
        console.error('Enhanced feed loading error:', error);
        
        // Hide loading notification
        const loadingId = feedElement.getAttribute('data-loading-id');
        if (loadingId) {
            window.notificationManager.dismiss(loadingId);
            feedElement.removeAttribute('data-loading-id');
        }

        // Show enhanced error state
        showErrorState(feedElement, {
            title: 'Failed to load videos',
            message: 'Check your connection and try again.',
            icon: '📡',
            retry: `enhancedLoadVideoFeed('${feedType}', true)`,
            home: feedType !== 'foryou'
        });

        // Show error notification
        showError('Failed to load videos. Please try again.');
    }
};

// Enhanced video interaction handlers
window.enhancedLikeVideo = async function(videoId, element) {
    if (!videoId) return;

    try {
        // Show immediate visual feedback
        element.classList.add('liked');
        showActionFeedback(element, 'heart', '❤️');
        
        // Update count optimistically
        const countElement = element.parentNode.querySelector('.action-count');
        if (countElement) {
            const currentCount = parseInt(countElement.textContent) || 0;
            countElement.textContent = currentCount + 1;
            countElement.classList.add('updated');
            setTimeout(() => countElement.classList.remove('updated'), 300);
        }

        // Make API call
        const response = await fetch(`${window.API_BASE_URL}/api/videos/${videoId}/like`, {
            method: 'POST',
            headers: window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {}
        });

        if (!response.ok) {
            throw new Error('Like failed');
        }

        const result = await response.json();
        
        // Update with actual count from server
        if (countElement && result.likes !== undefined) {
            countElement.textContent = result.likes;
        }

        showSuccess('Video liked!', 1500);

    } catch (error) {
        console.error('Like error:', error);
        
        // Revert optimistic updates
        element.classList.remove('liked');
        if (countElement) {
            const currentCount = parseInt(countElement.textContent) || 0;
            countElement.textContent = Math.max(0, currentCount - 1);
        }
        
        showError('Failed to like video');
    }
};

// Enhanced share functionality
window.enhancedShareVideo = function(videoId, element) {
    if (!videoId) return;

    try {
        // Show visual feedback
        element.classList.add('shared');
        showActionFeedback(element, 'share', '📤');

        // Create share URL
        const shareUrl = `${window.location.origin}${window.location.pathname}?video=${videoId}`;
        
        // Use native share API if available
        if (navigator.share) {
            navigator.share({
                title: 'Check out this VIB3 video!',
                url: shareUrl
            }).then(() => {
                showSuccess('Video shared!', 2000);
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    console.error('Share failed:', error);
                    fallbackShare(shareUrl);
                }
            });
        } else {
            fallbackShare(shareUrl);
        }

        // Remove shared class after animation
        setTimeout(() => {
            element.classList.remove('shared');
        }, 600);

    } catch (error) {
        console.error('Share error:', error);
        showError('Failed to share video');
    }
};

// Fallback share functionality
function fallbackShare(url) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showSuccess('Link copied to clipboard!', 2000);
        }).catch(() => {
            showManualCopyDialog(url);
        });
    } else {
        showManualCopyDialog(url);
    }
}

function showManualCopyDialog(url) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3>Share Video</h3>
            <p>Copy this link to share the video:</p>
            <input type="text" value="${url}" readonly style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px;" onclick="this.select()">
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button onclick="this.closest('.modal').remove()" style="padding: 10px 20px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                <button onclick="navigator.clipboard.writeText('${url}').then(() => { showSuccess('Copied!'); this.closest('.modal').remove(); })" style="padding: 10px 20px; background: #fe2c55; color: white; border: none; border-radius: 4px; cursor: pointer;">Copy</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Enhanced bookmark functionality
window.enhancedBookmarkVideo = async function(videoId, element) {
    if (!videoId) return;

    try {
        // Show immediate visual feedback
        const isBookmarked = element.classList.contains('bookmarked');
        
        if (isBookmarked) {
            element.classList.remove('bookmarked');
            showActionFeedback(element, 'bookmark', '📌');
        } else {
            element.classList.add('bookmarked');
            showActionFeedback(element, 'bookmark', '⭐');
        }

        // Make API call
        const response = await fetch(`${window.API_BASE_URL}/api/videos/${videoId}/bookmark`, {
            method: isBookmarked ? 'DELETE' : 'POST',
            headers: window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {}
        });

        if (!response.ok) {
            throw new Error('Bookmark failed');
        }

        showSuccess(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks', 1500);

    } catch (error) {
        console.error('Bookmark error:', error);
        
        // Revert optimistic updates
        if (element.classList.contains('bookmarked')) {
            element.classList.remove('bookmarked');
        } else {
            element.classList.add('bookmarked');
        }
        
        showError('Failed to bookmark video');
    }
};

// Enhanced upload progress
window.enhancedUploadProgress = function(progress, message = '') {
    const progressElement = document.querySelector('.progress-fill');
    const statusElement = document.querySelector('#uploadStatus');
    
    if (progressElement) {
        progressElement.style.width = `${progress}%`;
    }
    
    if (statusElement) {
        statusElement.textContent = message || `${Math.round(progress)}% complete`;
    }

    // Update notification if exists
    const uploadNotificationId = document.body.getAttribute('data-upload-notification-id');
    if (uploadNotificationId && window.notificationManager) {
        window.notificationManager.updateProgress(uploadNotificationId, progress);
    }
};

// Enhanced error recovery
window.enhancedErrorRecovery = function(container, errorType = 'general') {
    const errorStates = {
        network: {
            title: 'Connection Problem',
            message: 'Check your internet connection and try again.',
            icon: '📡',
            retry: 'window.location.reload()'
        },
        server: {
            title: 'Server Error',
            message: 'Our servers are experiencing issues. Please try again later.',
            icon: '🔧',
            retry: 'enhancedLoadVideoFeed(currentFeed, true)'
        },
        general: {
            title: 'Something went wrong',
            message: 'An unexpected error occurred. Please try again.',
            icon: '⚠️',
            retry: 'window.location.reload()'
        }
    };

    const errorConfig = errorStates[errorType] || errorStates.general;
    showErrorState(container, errorConfig);
};

// Enhanced infinite scroll
window.enhancedInfiniteScroll = function() {
    const feedElements = document.querySelectorAll('.feed-content.active');
    
    feedElements.forEach(feedElement => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.target.classList.contains('infinite-scroll-trigger')) {
                    // Load more content
                    const feedType = feedElement.id.replace('Feed', '');
                    enhancedLoadVideoFeed(feedType, false, currentPage + 1, true);
                    
                    // Remove trigger to prevent duplicate loads
                    entry.target.remove();
                }
            });
        }, { threshold: 0.1 });

        // Add scroll trigger at the end of the feed
        const trigger = document.createElement('div');
        trigger.className = 'infinite-scroll-trigger';
        trigger.style.height = '100px';
        feedElement.appendChild(trigger);
        observer.observe(trigger);
    });
};

// Enhanced search with debounce
window.enhancedSearch = (function() {
    let searchTimeout;
    
    return function(query, feedType = 'discover') {
        clearTimeout(searchTimeout);
        
        if (!query.trim()) {
            // Show empty search state
            const searchContainer = document.querySelector('#discoverVideoFeed, #searchResults');
            if (searchContainer) {
                showEmptyState(searchContainer, {
                    title: 'Start searching',
                    message: 'Enter keywords to find amazing videos',
                    icon: '🔍',
                    action: 'document.querySelector("#discoverSearchInput, #searchInput").focus()',
                    actionText: 'Try searching'
                });
            }
            return;
        }

        // Show searching state immediately
        const searchContainer = document.querySelector('#discoverVideoFeed, #searchResults');
        if (searchContainer) {
            showSkeletonScreen(searchContainer, 2);
        }

        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`${window.API_BASE_URL}/api/videos/search?q=${encodeURIComponent(query)}&limit=12`);
                const data = await response.json();

                if (data.videos && data.videos.length > 0) {
                    // Display results with stagger animation
                    displaySearchResults(data.videos, searchContainer);
                } else {
                    // Show no results state
                    showEmptyState(searchContainer, {
                        title: 'No videos found',
                        message: `No results for "${query}". Try different keywords.`,
                        icon: '🔍',
                        action: 'document.querySelector("#discoverSearchInput, #searchInput").focus()',
                        actionText: 'Search again'
                    });
                }
            } catch (error) {
                console.error('Search error:', error);
                enhancedErrorRecovery(searchContainer, 'network');
            }
        }, 300); // Debounce delay
    };
})();

function displaySearchResults(videos, container) {
    if (!container) return;

    const gridHTML = videos.map((video, index) => `
        <div class="explore-video-card float-up" style="animation-delay: ${index * 0.05}s;" onclick="playVideo('${video._id}')">
            <video src="${video.videoUrl}" muted loop preload="metadata"></video>
            <div class="video-overlay">
                <div class="video-stats">
                    <span>❤️ ${video.likes || 0}</span>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `<div class="explore-video-grid stagger-animation">${gridHTML}</div>`;
}

// Initialize enhanced features
document.addEventListener('DOMContentLoaded', () => {
    // Store original function if not already stored
    if (!window.originalLoadVideoFeed && window.loadVideoFeed) {
        window.originalLoadVideoFeed = window.loadVideoFeed;
    }

    // Replace with enhanced version
    window.loadVideoFeed = window.enhancedLoadVideoFeed;

    // Initialize infinite scroll
    setTimeout(() => {
        window.enhancedInfiniteScroll();
    }, 1000);

    console.log('🚀 Enhanced feed loader initialized');
});

// Export enhanced functions
window.EnhancedFeedLoader = {
    enhancedLoadVideoFeed,
    enhancedLikeVideo,
    enhancedShareVideo,
    enhancedBookmarkVideo,
    enhancedUploadProgress,
    enhancedErrorRecovery,
    enhancedInfiniteScroll,
    enhancedSearch
};