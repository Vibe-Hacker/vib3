// Video Cache and Performance Optimization Manager
// Handles video preloading, caching, and performance optimization

class VideoCacheManager {
    constructor() {
        this.videoCache = new Map(); // URL -> HTMLVideoElement
        this.thumbnailCache = new Map(); // URL -> Canvas/Blob
        this.preloadQueue = [];
        this.maxCacheSize = 10; // Maximum videos to keep in cache
        this.maxThumbnailCacheSize = 50;
        this.preloadDistance = 2; // How many videos ahead to preload
        this.isPreloading = false;
        this.networkQuality = 'high'; // high, medium, low
        this.preloadedVideos = new Set();
        this.videoPool = []; // Reusable video elements
        this.maxPoolSize = 15;
        
        this.init();
    }

    init() {
        console.log('Video cache manager initializing...');
        this.detectNetworkQuality();
        this.setupPerformanceMonitoring();
        this.setupMemoryManagement();
        console.log('Video cache manager initialized');
    }

    // Network quality detection
    detectNetworkQuality() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            const effectiveType = connection.effectiveType;
            
            if (effectiveType === '4g') {
                this.networkQuality = 'high';
                this.maxCacheSize = 10;
                this.preloadDistance = 3;
            } else if (effectiveType === '3g') {
                this.networkQuality = 'medium';
                this.maxCacheSize = 6;
                this.preloadDistance = 2;
            } else {
                this.networkQuality = 'low';
                this.maxCacheSize = 3;
                this.preloadDistance = 1;
            }
            
            // Listen for network changes
            connection.addEventListener('change', () => {
                this.detectNetworkQuality();
                console.log(`Network quality changed to: ${this.networkQuality}`);
            });
        }
        
        console.log(`Network quality detected: ${this.networkQuality}`);
    }

    // Performance monitoring
    setupPerformanceMonitoring() {
        // Monitor video load times
        this.videoLoadTimes = [];
        this.averageLoadTime = 0;
    }

    // Memory management
    setupMemoryManagement() {
        // Clean up cache periodically
        setInterval(() => {
            this.cleanupCache();
            this.cleanupVideoPool();
        }, 30000); // Every 30 seconds

        // Clean up on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAllCachedVideos();
            }
        });
    }

    // Get or create a video element from the pool
    getVideoElement() {
        let video;
        
        if (this.videoPool.length > 0) {
            video = this.videoPool.pop();
            console.log('Reused video element from pool');
        } else {
            video = document.createElement('video');
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.muted = true;
            video.preload = 'metadata';
            console.log('Created new video element');
        }
        
        // Reset video element
        video.currentTime = 0;
        video.volume = 1;
        video.muted = true;
        
        return video;
    }

    // Return video element to pool
    returnVideoElement(video) {
        if (this.videoPool.length < this.maxPoolSize) {
            // Clean up the video
            video.pause();
            video.src = '';
            video.load();
            video.currentTime = 0;
            video.removeAttribute('src');
            
            // Remove all event listeners
            const newVideo = video.cloneNode(true);
            this.videoPool.push(newVideo);
            console.log('Returned video element to pool');
        }
    }

    // Preload video
    async preloadVideo(videoUrl, priority = 'normal') {
        if (this.preloadedVideos.has(videoUrl) || this.videoCache.has(videoUrl)) {
            return this.videoCache.get(videoUrl);
        }

        const video = this.getVideoElement();
        const startTime = performance.now();

        return new Promise((resolve, reject) => {
            const onCanPlay = () => {
                const loadTime = performance.now() - startTime;
                this.recordLoadTime(loadTime);
                
                // Add to cache
                this.addToCache(videoUrl, video);
                this.preloadedVideos.add(videoUrl);
                
                console.log(`Video preloaded: ${videoUrl.substring(0, 50)}... (${loadTime.toFixed(0)}ms)`);
                
                // Clean up listeners
                video.removeEventListener('canplay', onCanPlay);
                video.removeEventListener('error', onError);
                
                resolve(video);
            };

            const onError = (error) => {
                console.error('Video preload failed:', error);
                this.returnVideoElement(video);
                
                // Clean up listeners
                video.removeEventListener('canplay', onCanPlay);
                video.removeEventListener('error', onError);
                
                reject(error);
            };

            video.addEventListener('canplay', onCanPlay);
            video.addEventListener('error', onError);

            // Set quality based on network
            video.preload = this.networkQuality === 'low' ? 'metadata' : 'auto';
            video.src = videoUrl;
        });
    }

    // Smart preloading based on current video position
    async smartPreload(videos, currentIndex) {
        if (this.isPreloading) return;
        this.isPreloading = true;

        try {
            const preloadPromises = [];
            
            // Preload videos ahead
            for (let i = 1; i <= this.preloadDistance; i++) {
                const nextIndex = currentIndex + i;
                if (nextIndex < videos.length) {
                    const video = videos[nextIndex];
                    if (video && video.url && !this.preloadedVideos.has(video.url)) {
                        preloadPromises.push(this.preloadVideo(video.url, 'high'));
                    }
                }
            }

            // Preload one video behind (for going back)
            const prevIndex = currentIndex - 1;
            if (prevIndex >= 0 && videos[prevIndex]) {
                const video = videos[prevIndex];
                if (video && video.url && !this.preloadedVideos.has(video.url)) {
                    preloadPromises.push(this.preloadVideo(video.url, 'low'));
                }
            }

            await Promise.allSettled(preloadPromises);
        } catch (error) {
            console.error('Smart preload error:', error);
        } finally {
            this.isPreloading = false;
        }
    }

    // Add video to cache
    addToCache(url, video) {
        // Remove oldest if cache is full
        if (this.videoCache.size >= this.maxCacheSize) {
            const oldestUrl = this.videoCache.keys().next().value;
            const oldVideo = this.videoCache.get(oldestUrl);
            this.videoCache.delete(oldestUrl);
            this.returnVideoElement(oldVideo);
            console.log('Removed oldest video from cache');
        }

        this.videoCache.set(url, video);
    }

    // Get cached video
    getCachedVideo(url) {
        return this.videoCache.get(url);
    }

    // Generate and cache thumbnail
    async generateThumbnail(videoUrl, timeOffset = 1) {
        if (this.thumbnailCache.has(videoUrl)) {
            return this.thumbnailCache.get(videoUrl);
        }

        try {
            const video = this.getVideoElement();
            
            return new Promise((resolve, reject) => {
                video.addEventListener('loadeddata', () => {
                    video.currentTime = Math.min(timeOffset, video.duration * 0.1);
                });

                video.addEventListener('seeked', () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = 200;
                        canvas.height = Math.round((video.videoHeight / video.videoWidth) * 200);
                        
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        canvas.toBlob((blob) => {
                            this.addThumbnailToCache(videoUrl, blob);
                            this.returnVideoElement(video);
                            resolve(blob);
                        }, 'image/jpeg', 0.7);
                    } catch (error) {
                        this.returnVideoElement(video);
                        reject(error);
                    }
                });

                video.addEventListener('error', (error) => {
                    this.returnVideoElement(video);
                    reject(error);
                });

                video.src = videoUrl;
                video.load();
            });
        } catch (error) {
            console.error('Thumbnail generation failed:', error);
            return null;
        }
    }

    // Add thumbnail to cache
    addThumbnailToCache(url, thumbnail) {
        if (this.thumbnailCache.size >= this.maxThumbnailCacheSize) {
            const oldestUrl = this.thumbnailCache.keys().next().value;
            this.thumbnailCache.delete(oldestUrl);
        }
        this.thumbnailCache.set(url, thumbnail);
    }

    // Get cached thumbnail
    getCachedThumbnail(url) {
        return this.thumbnailCache.get(url);
    }

    // Record load time for performance monitoring
    recordLoadTime(loadTime) {
        this.videoLoadTimes.push(loadTime);
        if (this.videoLoadTimes.length > 100) {
            this.videoLoadTimes.shift(); // Keep only last 100 measurements
        }
        
        this.averageLoadTime = this.videoLoadTimes.reduce((a, b) => a + b, 0) / this.videoLoadTimes.length;
    }

    // Clean up cache
    cleanupCache() {
        // Remove videos that haven't been accessed recently
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes

        for (const [url, video] of this.videoCache.entries()) {
            if (video.lastAccessed && (now - video.lastAccessed) > maxAge) {
                this.videoCache.delete(url);
                this.returnVideoElement(video);
                this.preloadedVideos.delete(url);
                console.log('Cleaned up old cached video:', url.substring(0, 50));
            }
        }

        // Clean up thumbnail cache
        if (this.thumbnailCache.size > this.maxThumbnailCacheSize) {
            const urlsToDelete = Array.from(this.thumbnailCache.keys())
                .slice(0, this.thumbnailCache.size - this.maxThumbnailCacheSize);
            
            urlsToDelete.forEach(url => this.thumbnailCache.delete(url));
        }
    }

    // Clean up video pool
    cleanupVideoPool() {
        while (this.videoPool.length > this.maxPoolSize) {
            this.videoPool.pop();
        }
    }

    // Pause all cached videos
    pauseAllCachedVideos() {
        for (const video of this.videoCache.values()) {
            if (!video.paused) {
                video.pause();
            }
        }
    }

    // Clear all caches
    clearAllCaches() {
        // Return all videos to pool
        for (const video of this.videoCache.values()) {
            this.returnVideoElement(video);
        }
        
        this.videoCache.clear();
        this.thumbnailCache.clear();
        this.preloadedVideos.clear();
        this.preloadQueue = [];
        
        console.log('All caches cleared');
    }

    // Get performance statistics
    getPerformanceStats() {
        return {
            cacheSize: this.videoCache.size,
            thumbnailCacheSize: this.thumbnailCache.size,
            averageLoadTime: this.averageLoadTime.toFixed(0),
            networkQuality: this.networkQuality,
            preloadedCount: this.preloadedVideos.size,
            poolSize: this.videoPool.length
        };
    }

    // Optimize video element for performance
    optimizeVideoElement(video) {
        // Set optimal attributes for performance
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('x5-video-player-type', 'h5');
        video.setAttribute('x5-video-orientation', 'portraint');
        
        // Disable picture-in-picture
        if ('disablePictureInPicture' in video) {
            video.disablePictureInPicture = true;
        }
        
        // Set preload based on network quality
        video.preload = this.networkQuality === 'low' ? 'metadata' : 'auto';
        
        return video;
    }
}

// Create singleton instance
const videoCacheManager = new VideoCacheManager();

// Make globally available
window.videoCacheManager = videoCacheManager;

// Export for modules
export default videoCacheManager;