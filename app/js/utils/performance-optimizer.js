// Performance Optimization Utilities
// Reduces jank and improves responsiveness throughout the VIB3 app

class PerformanceOptimizer {
    constructor() {
        this.observers = new Map();
        this.rafId = null;
        this.videoPool = [];
        this.imageCache = new Map();
        this.init();
    }

    init() {
        this.setupVideoOptimizations();
        this.setupImageOptimizations();
        this.setupScrollOptimizations();
        this.setupMemoryManagement();
        this.setupRAFOptimizations();
        console.log('🚀 Performance optimizer initialized');
    }

    // ================ VIDEO OPTIMIZATIONS ================
    setupVideoOptimizations() {
        // Intersection Observer for video lazy loading and performance
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                
                if (entry.isIntersecting) {
                    // Video is in viewport
                    this.optimizeVideoForPlayback(video);
                    
                    // Preload next videos
                    this.preloadNearbyVideos(video);
                } else {
                    // Video is out of viewport
                    this.pauseVideoForPerformance(video);
                }
            });
        }, {
            threshold: [0.5], // Trigger when 50% visible
            rootMargin: '50px 0px 50px 0px' // Start loading 50px before entering viewport
        });

        // Observe all videos
        this.observeNewVideos(videoObserver);
        
        // Re-observe when new videos are added
        const contentObserver = new MutationObserver(() => {
            this.observeNewVideos(videoObserver);
        });
        
        contentObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    observeNewVideos(observer) {
        document.querySelectorAll('video:not([data-observed])').forEach(video => {
            observer.observe(video);
            video.setAttribute('data-observed', 'true');
        });
    }

    optimizeVideoForPlayback(video) {
        // Optimize video settings for smooth playback
        video.preload = 'metadata';
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('playsinline', 'true');
        
        // Enable hardware acceleration if available
        if ('requestVideoFrameCallback' in video) {
            video.style.willChange = 'transform';
        }
        
        // Optimize for mobile
        if (this.isMobile()) {
            video.muted = true; // Prevent audio issues on mobile
            video.volume = 0.8;
        }
    }

    pauseVideoForPerformance(video) {
        if (!video.paused) {
            video.pause();
            video.currentTime = 0; // Reset to beginning to save memory
        }
        
        // Remove from memory if far from viewport
        const rect = video.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        if (Math.abs(rect.top) > viewportHeight * 2) {
            // Video is very far from viewport, clear source to save memory
            if (video.src && !video.hasAttribute('data-original-src')) {
                video.setAttribute('data-original-src', video.src);
                video.removeAttribute('src');
                video.load();
            }
        }
    }

    preloadNearbyVideos(currentVideo) {
        const videoCards = Array.from(document.querySelectorAll('.video-item, .explore-video-card'));
        const currentIndex = videoCards.findIndex(card => card.contains(currentVideo));
        
        // Preload next 2 videos
        for (let i = currentIndex + 1; i <= currentIndex + 2; i++) {
            if (videoCards[i]) {
                const nextVideo = videoCards[i].querySelector('video');
                if (nextVideo && !nextVideo.src && nextVideo.hasAttribute('data-original-src')) {
                    // Restore source for preloading
                    nextVideo.src = nextVideo.getAttribute('data-original-src');
                    nextVideo.preload = 'metadata';
                    nextVideo.load();
                }
            }
        }
    }

    // ================ IMAGE OPTIMIZATIONS ================
    setupImageOptimizations() {
        // Lazy loading for images
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImageOptimized(img);
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '100px 0px 100px 0px'
        });

        // Observe images with data-src
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    loadImageOptimized(img) {
        const src = img.getAttribute('data-src');
        if (!src) return;

        // Check cache first
        if (this.imageCache.has(src)) {
            const cachedBlob = this.imageCache.get(src);
            img.src = URL.createObjectURL(cachedBlob);
            img.classList.remove('lazy');
            return;
        }

        // Load and cache image
        fetch(src)
            .then(response => response.blob())
            .then(blob => {
                this.imageCache.set(src, blob);
                img.src = URL.createObjectURL(blob);
                img.classList.remove('lazy');
            })
            .catch(() => {
                // Fallback to direct loading
                img.src = src;
                img.classList.remove('lazy');
            });
    }

    // ================ SCROLL OPTIMIZATIONS ================
    setupScrollOptimizations() {
        let scrollTimer = null;
        let isScrolling = false;

        const handleScroll = () => {
            if (!isScrolling) {
                isScrolling = true;
                document.body.classList.add('scrolling');
                
                // Reduce animations during scroll
                document.documentElement.style.setProperty('--animation-duration', '0.1s');
            }

            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                isScrolling = false;
                document.body.classList.remove('scrolling');
                
                // Restore animations after scroll
                document.documentElement.style.setProperty('--animation-duration', '');
            }, 150);
        };

        // Use passive listeners for better performance
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Throttle scroll events using RAF
        let scrollRafId = null;
        window.addEventListener('scroll', () => {
            if (scrollRafId) return;
            scrollRafId = requestAnimationFrame(() => {
                this.handleScrollFrame();
                scrollRafId = null;
            });
        }, { passive: true });
    }

    handleScrollFrame() {
        // Update video playback based on viewport position
        document.querySelectorAll('video').forEach(video => {
            const rect = video.getBoundingClientRect();
            const isInViewport = rect.top >= 0 && rect.top < window.innerHeight;
            
            if (isInViewport && video.paused && !video.hasAttribute('data-manually-paused')) {
                video.play().catch(() => {}); // Ignore errors
            } else if (!isInViewport && !video.paused) {
                video.pause();
            }
        });
    }

    // ================ MEMORY MANAGEMENT ================
    setupMemoryManagement() {
        // Clean up memory periodically
        setInterval(() => {
            this.cleanupMemory();
        }, 30000); // Every 30 seconds

        // Clean up on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.aggressiveCleanup();
            }
        });

        // Clean up on low memory warning (if supported)
        if ('memory' in performance) {
            setInterval(() => {
                const memInfo = performance.memory;
                const usageRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
                
                if (usageRatio > 0.8) {
                    console.warn('High memory usage detected, cleaning up...');
                    this.aggressiveCleanup();
                }
            }, 10000);
        }
    }

    cleanupMemory() {
        // Remove far away video sources
        document.querySelectorAll('video').forEach(video => {
            const rect = video.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            if (Math.abs(rect.top) > viewportHeight * 3) {
                if (video.src && !video.hasAttribute('data-original-src')) {
                    video.setAttribute('data-original-src', video.src);
                    video.removeAttribute('src');
                    video.load();
                }
            }
        });

        // Clean up old image cache entries
        if (this.imageCache.size > 50) {
            const entries = Array.from(this.imageCache.entries());
            entries.slice(0, 20).forEach(([key]) => {
                this.imageCache.delete(key);
            });
        }

        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }

    aggressiveCleanup() {
        // Pause all videos
        document.querySelectorAll('video').forEach(video => {
            video.pause();
            if (!video.hasAttribute('data-original-src') && video.src) {
                video.setAttribute('data-original-src', video.src);
                video.removeAttribute('src');
                video.load();
            }
        });

        // Clear image cache
        this.imageCache.clear();

        // Clear any timeouts/intervals
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }

    // ================ RAF OPTIMIZATIONS ================
    setupRAFOptimizations() {
        // Batch DOM updates using RAF
        this.pendingUpdates = [];
        
        this.processUpdates = () => {
            if (this.pendingUpdates.length === 0) return;
            
            const updates = [...this.pendingUpdates];
            this.pendingUpdates = [];
            
            updates.forEach(update => {
                try {
                    update();
                } catch (error) {
                    console.error('Update error:', error);
                }
            });
        };

        // Start RAF loop
        this.startRAFLoop();
    }

    startRAFLoop() {
        const loop = () => {
            this.processUpdates();
            this.rafId = requestAnimationFrame(loop);
        };
        
        loop();
    }

    batchUpdate(updateFn) {
        this.pendingUpdates.push(updateFn);
    }

    // ================ UTILITY METHODS ================
    isMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    isLowPowerMode() {
        // Detect low power mode indicators
        return navigator.hardwareConcurrency <= 2 || 
               (window.screen && window.screen.width <= 768) ||
               ('connection' in navigator && navigator.connection.effectiveType === 'slow-2g');
    }

    optimizeForDevice() {
        if (this.isLowPowerMode()) {
            // Reduce animations and effects for low-power devices
            document.documentElement.style.setProperty('--animation-duration', '0.1s');
            document.documentElement.style.setProperty('--transition-duration', '0.1s');
            
            // Disable expensive effects
            document.querySelectorAll('.blur, .backdrop-filter').forEach(el => {
                el.style.backdropFilter = 'none';
                el.style.filter = 'none';
            });
        }
    }

    // ================ PUBLIC API ================
    preloadVideo(videoUrl) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = videoUrl;
            
            video.addEventListener('loadedmetadata', () => {
                this.videoPool.push(video);
                resolve(video);
            });
            
            video.addEventListener('error', reject);
        });
    }

    getOptimizedVideo() {
        return this.videoPool.pop() || document.createElement('video');
    }

    reportPerformance() {
        if ('performance' in window) {
            const perfData = {
                navigation: performance.getEntriesByType('navigation')[0],
                memory: performance.memory,
                timing: performance.timing
            };
            
            console.log('📊 Performance Report:', perfData);
            return perfData;
        }
    }

    destroy() {
        // Clean up all observers and intervals
        this.observers.forEach(observer => observer.disconnect());
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        this.imageCache.clear();
        this.videoPool.forEach(video => video.remove());
    }
}

// ================ ADDITIONAL PERFORMANCE UTILITIES ================

// Debounce utility for expensive operations
window.debounce = function(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
};

// Throttle utility for scroll/resize events
window.throttle = function(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Optimize CSS animations for performance
window.optimizeAnimations = function() {
    // Add will-change property to animated elements
    document.querySelectorAll('.hover-lift, .hover-scale, .hover-glow').forEach(el => {
        el.style.willChange = 'transform';
    });

    // Use transform and opacity for animations (hardware accelerated)
    const style = document.createElement('style');
    style.textContent = `
        .optimized-animation {
            will-change: transform, opacity;
            backface-visibility: hidden;
            perspective: 1000px;
        }
        
        .gpu-accelerated {
            transform: translateZ(0);
            will-change: transform;
        }
    `;
    document.head.appendChild(style);
};

// Initialize performance optimizer
let performanceOptimizer;

document.addEventListener('DOMContentLoaded', () => {
    performanceOptimizer = new PerformanceOptimizer();
    
    // Apply device-specific optimizations
    performanceOptimizer.optimizeForDevice();
    
    // Optimize animations
    window.optimizeAnimations();
    
    // Setup performance monitoring
    if (window.location.hostname === 'localhost') {
        setInterval(() => {
            performanceOptimizer.reportPerformance();
        }, 30000);
    }
});

// Export for global use
window.PerformanceOptimizer = PerformanceOptimizer;
window.performanceOptimizer = performanceOptimizer;