// Video Cache Debug Panel
// Provides real-time monitoring of video caching performance

class VideoCacheDebugPanel {
    constructor() {
        this.isVisible = false;
        this.panel = null;
        this.updateInterval = null;
        this.setupKeyboardShortcut();
        console.log('🎬 Video cache debug panel initialized. Press Ctrl+Shift+V to toggle.');
    }

    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        if (this.panel) {
            this.panel.remove();
        }

        this.panel = document.createElement('div');
        this.panel.id = 'videoCacheDebugPanel';
        this.panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 350px;
            max-height: 600px;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 999999;
            overflow-y: auto;
            border: 2px solid #4CAF50;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;

        this.panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">
                <h3 style="margin: 0; color: #4CAF50;">🎬 Video Cache Monitor</h3>
                <button onclick="this.parentElement.parentElement.remove(); window.videoCacheDebugPanel.isVisible = false;" 
                        style="background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">×</button>
            </div>
            <div id="videoCacheStats">Loading...</div>
            <div style="margin-top: 15px; border-top: 1px solid #333; padding-top: 10px;">
                <h4 style="margin: 0 0 10px 0; color: #2196F3;">Quick Actions</h4>
                <button onclick="window.videoCacheManager?.clearAllCaches(); window.showToast?.('All caches cleared')" 
                        style="background: #ff9800; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px; font-size: 11px;">
                    Clear All Caches
                </button>
                <button onclick="window.videoManager?.triggerSmartPreloading(); window.showToast?.('Preloading triggered')" 
                        style="background: #9c27b0; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px; font-size: 11px;">
                    Trigger Preload
                </button>
                <button onclick="window.videoCacheManager?.detectNetworkQuality(); window.showToast?.('Network re-detected')" 
                        style="background: #3f51b5; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    Detect Network
                </button>
            </div>
        `;

        document.body.appendChild(this.panel);
        this.isVisible = true;

        // Start updating the panel
        this.startUpdating();
    }

    hide() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        this.isVisible = false;
        this.stopUpdating();
    }

    startUpdating() {
        this.updateStats();
        this.updateInterval = setInterval(() => {
            this.updateStats();
        }, 2000); // Update every 2 seconds
    }

    stopUpdating() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateStats() {
        if (!this.panel || !window.videoCacheManager) return;

        const stats = window.videoCacheManager.getPerformanceStats();
        const memoryInfo = this.getMemoryInfo();
        const networkInfo = this.getNetworkInfo();
        const videoInfo = this.getVideoInfo();

        const statsContainer = this.panel.querySelector('#videoCacheStats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div style="margin-bottom: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #4CAF50;">📊 Cache Statistics</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 11px;">
                    <div>Cache Size: <span style="color: #81C784;">${stats.cacheSize}/${window.videoCacheManager?.maxCacheSize || 'N/A'}</span></div>
                    <div>Thumbnails: <span style="color: #81C784;">${stats.thumbnailCacheSize}/${window.videoCacheManager?.maxThumbnailCacheSize || 'N/A'}</span></div>
                    <div>Preloaded: <span style="color: #81C784;">${stats.preloadedCount}</span></div>
                    <div>Pool Size: <span style="color: #81C784;">${stats.poolSize}/${window.videoCacheManager?.maxPoolSize || 'N/A'}</span></div>
                    <div>Avg Load: <span style="color: #81C784;">${stats.averageLoadTime}ms</span></div>
                    <div>Network: <span style="color: #81C784;">${stats.networkQuality}</span></div>
                </div>
            </div>

            <div style="margin-bottom: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #2196F3;">🌐 Network Status</h4>
                <div style="font-size: 11px;">
                    <div>Connection: <span style="color: #64B5F6;">${networkInfo.type}</span></div>
                    <div>Effective: <span style="color: #64B5F6;">${networkInfo.effectiveType}</span></div>
                    <div>Downlink: <span style="color: #64B5F6;">${networkInfo.downlink} Mbps</span></div>
                    <div>RTT: <span style="color: #64B5F6;">${networkInfo.rtt}ms</span></div>
                </div>
            </div>

            <div style="margin-bottom: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #FF9800;">🎥 Video Status</h4>
                <div style="font-size: 11px;">
                    <div>Total Videos: <span style="color: #FFB74D;">${videoInfo.totalVideos}</span></div>
                    <div>Playing: <span style="color: #FFB74D;">${videoInfo.playingVideos}</span></div>
                    <div>Buffering: <span style="color: #FFB74D;">${videoInfo.bufferingVideos}</span></div>
                    <div>Current Index: <span style="color: #FFB74D;">${window.videoManager?.currentVideoIndex || 0}</span></div>
                </div>
            </div>

            <div>
                <h4 style="margin: 0 0 8px 0; color: #9C27B0;">💾 Memory Usage</h4>
                <div style="font-size: 11px;">
                    <div>Used: <span style="color: #BA68C8;">${memoryInfo.used} MB</span></div>
                    <div>Total: <span style="color: #BA68C8;">${memoryInfo.total} MB</span></div>
                    <div>Percentage: <span style="color: #BA68C8;">${memoryInfo.percentage}%</span></div>
                </div>
            </div>
        `;
    }

    getNetworkInfo() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return {
                type: conn.type || 'unknown',
                effectiveType: conn.effectiveType || 'unknown',
                downlink: conn.downlink?.toFixed(1) || 'unknown',
                rtt: conn.rtt || 'unknown'
            };
        }
        return {
            type: 'unknown',
            effectiveType: 'unknown',
            downlink: 'unknown',
            rtt: 'unknown'
        };
    }

    getMemoryInfo() {
        if ('memory' in performance) {
            const memory = performance.memory;
            const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
            const percentage = Math.round((used / total) * 100);
            return { used, total, percentage };
        }
        return { used: 'N/A', total: 'N/A', percentage: 'N/A' };
    }

    getVideoInfo() {
        const videos = document.querySelectorAll('video');
        const totalVideos = videos.length;
        let playingVideos = 0;
        let bufferingVideos = 0;

        videos.forEach(video => {
            if (!video.paused) playingVideos++;
            if (video.readyState < 3) bufferingVideos++;
        });

        return {
            totalVideos,
            playingVideos,
            bufferingVideos
        };
    }
}

// Create singleton instance
const videoCacheDebugPanel = new VideoCacheDebugPanel();

// Make globally available
window.videoCacheDebugPanel = videoCacheDebugPanel;

// Export for modules
export default videoCacheDebugPanel;