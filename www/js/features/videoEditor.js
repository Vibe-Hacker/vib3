// Video Editor Module - vertical video editing features
export class VideoEditor {
    constructor() {
        this.currentVideo = null;
        this.effects = [];
        this.filters = [];
        this.timeline = null;
        this.audioTracks = [];
        this.textOverlays = [];
        this.stickers = [];
        
        this.config = {
            maxDuration: 180, // 3 minutes max
            minDuration: 3,   // 3 seconds min
            speeds: [0.3, 0.5, 1, 2, 3],
            defaultSpeed: 1
        };
    }

    async initialize() {
        console.log('🎬 Initializing Video Editor...');
        await this.loadEffects();
        await this.loadFilters();
        this.setupUI();
    }

    async loadEffects() {
        // Load available effects
        this.effects = [
            { id: 'greenscreen', name: 'Green Screen', type: 'background' },
            { id: 'blur', name: 'Blur Background', type: 'background' },
            { id: 'mirror', name: 'Mirror', type: 'transform' },
            { id: 'shake', name: 'Shake', type: 'motion' },
            { id: 'zoom', name: 'Zoom Pulse', type: 'motion' },
            { id: 'glitch', name: 'Glitch', type: 'distortion' },
            { id: 'vhs', name: 'VHS', type: 'retro' },
            { id: 'rainbow', name: 'Rainbow', type: 'color' }
        ];
    }

    async loadFilters() {
        // Load Instagram-style filters
        this.filters = [
            { id: 'normal', name: 'Normal', css: '' },
            { id: 'vibrant', name: 'Vibrant', css: 'contrast(1.2) saturate(1.3)' },
            { id: 'vintage', name: 'Vintage', css: 'sepia(0.3) contrast(1.1)' },
            { id: 'bw', name: 'B&W', css: 'grayscale(1) contrast(1.2)' },
            { id: 'cold', name: 'Cold', css: 'hue-rotate(180deg) saturate(0.8)' },
            { id: 'warm', name: 'Warm', css: 'sepia(0.2) saturate(1.2)' },
            { id: 'fade', name: 'Fade', css: 'contrast(0.8) brightness(1.2)' }
        ];
    }

    setupUI() {
        // Create editor UI container
        const editorHTML = `
            <div id="videoEditor" class="video-editor-modal" style="display: none;">
                <div class="editor-container">
                    <div class="editor-header">
                        <button class="editor-back-btn">←</button>
                        <h2>Edit Video</h2>
                        <button class="editor-save-btn">Next</button>
                    </div>
                    
                    <div class="editor-preview">
                        <video id="editorVideo" class="editor-video" controls></video>
                        <canvas id="editorCanvas" class="editor-canvas" style="display: none;"></canvas>
                    </div>
                    
                    <div class="editor-timeline">
                        <div class="timeline-track" id="videoTrack">
                            <div class="timeline-clip"></div>
                        </div>
                        <div class="timeline-track" id="audioTrack"></div>
                        <div class="timeline-track" id="effectsTrack"></div>
                    </div>
                    
                    <div class="editor-tools">
                        <div class="tool-tabs">
                            <button class="tool-tab active" data-tool="trim">✂️ Trim</button>
                            <button class="tool-tab" data-tool="speed">⚡ Speed</button>
                            <button class="tool-tab" data-tool="filters">🎨 Filters</button>
                            <button class="tool-tab" data-tool="effects">✨ Effects</button>
                            <button class="tool-tab" data-tool="text">📝 Text</button>
                            <button class="tool-tab" data-tool="stickers">😀 Stickers</button>
                            <button class="tool-tab" data-tool="audio">🎵 Audio</button>
                        </div>
                        
                        <div class="tool-panels">
                            <!-- Trim Panel -->
                            <div class="tool-panel active" id="trimPanel">
                                <div class="trim-controls">
                                    <input type="range" id="trimStart" min="0" max="100" value="0">
                                    <input type="range" id="trimEnd" min="0" max="100" value="100">
                                    <button class="split-btn">Split</button>
                                </div>
                            </div>
                            
                            <!-- Speed Panel -->
                            <div class="tool-panel" id="speedPanel">
                                <div class="speed-options">
                                    <button class="speed-btn" data-speed="0.3">0.3x</button>
                                    <button class="speed-btn" data-speed="0.5">0.5x</button>
                                    <button class="speed-btn active" data-speed="1">1x</button>
                                    <button class="speed-btn" data-speed="2">2x</button>
                                    <button class="speed-btn" data-speed="3">3x</button>
                                </div>
                            </div>
                            
                            <!-- Filters Panel -->
                            <div class="tool-panel" id="filtersPanel">
                                <div class="filter-grid"></div>
                            </div>
                            
                            <!-- Effects Panel -->
                            <div class="tool-panel" id="effectsPanel">
                                <div class="effects-categories">
                                    <button class="effect-cat active">Trending</button>
                                    <button class="effect-cat">Background</button>
                                    <button class="effect-cat">Motion</button>
                                    <button class="effect-cat">Face</button>
                                </div>
                                <div class="effects-grid"></div>
                            </div>
                            
                            <!-- Text Panel -->
                            <div class="tool-panel" id="textPanel">
                                <input type="text" class="text-input" placeholder="Add text">
                                <div class="text-styles">
                                    <button class="text-style">Classic</button>
                                    <button class="text-style">Bold</button>
                                    <button class="text-style">Neon</button>
                                    <button class="text-style">Typewriter</button>
                                </div>
                                <div class="text-animations">
                                    <button class="text-anim">Fade In</button>
                                    <button class="text-anim">Slide</button>
                                    <button class="text-anim">Pop</button>
                                    <button class="text-anim">Bounce</button>
                                </div>
                            </div>
                            
                            <!-- Stickers Panel -->
                            <div class="tool-panel" id="stickersPanel">
                                <div class="sticker-search">
                                    <input type="text" placeholder="Search stickers">
                                </div>
                                <div class="sticker-grid"></div>
                            </div>
                            
                            <!-- Audio Panel -->
                            <div class="tool-panel" id="audioPanel">
                                <div class="audio-tabs">
                                    <button class="audio-tab active">Sounds</button>
                                    <button class="audio-tab">Music</button>
                                    <button class="audio-tab">Voice</button>
                                </div>
                                <div class="audio-list"></div>
                                <button class="record-voice-btn">🎤 Record Voice</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to page
        document.body.insertAdjacentHTML('beforeend', editorHTML);
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Tool tabs
        document.querySelectorAll('.tool-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTool(e.target.dataset.tool);
            });
        });
        
        // Speed buttons
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setSpeed(parseFloat(e.target.dataset.speed));
            });
        });
        
        // Back button
        document.querySelector('.editor-back-btn').addEventListener('click', () => {
            this.close();
        });
        
        // Save button
        document.querySelector('.editor-save-btn').addEventListener('click', () => {
            this.saveAndContinue();
        });
    }

    // Open editor with video
    async open(videoFile) {
        console.log('📹 Opening video editor');
        this.currentVideo = videoFile;
        
        const editor = document.getElementById('videoEditor');
        const video = document.getElementById('editorVideo');
        
        // Load video
        const videoUrl = URL.createObjectURL(videoFile);
        video.src = videoUrl;
        
        // Show editor
        editor.style.display = 'flex';
        
        // Initialize timeline
        video.addEventListener('loadedmetadata', () => {
            this.initializeTimeline(video.duration);
            this.loadFilterPreviews();
            this.loadEffectPreviews();
        });
    }

    close() {
        document.getElementById('videoEditor').style.display = 'none';
        if (this.currentVideo) {
            URL.revokeObjectURL(document.getElementById('editorVideo').src);
        }
    }

    switchTool(toolName) {
        // Update tabs
        document.querySelectorAll('.tool-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tool === toolName);
        });
        
        // Update panels
        document.querySelectorAll('.tool-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${toolName}Panel`);
        });
    }

    setSpeed(speed) {
        const video = document.getElementById('editorVideo');
        video.playbackRate = speed;
        
        // Update UI
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.speed) === speed);
        });
    }

    applyFilter(filterId) {
        const video = document.getElementById('editorVideo');
        const filter = this.filters.find(f => f.id === filterId);
        
        if (filter) {
            video.style.filter = filter.css;
        }
    }

    applyEffect(effectId) {
        const effect = this.effects.find(e => e.id === effectId);
        
        if (effect) {
            console.log(`Applying effect: ${effect.name}`);
            // Implementation depends on effect type
            switch (effect.type) {
                case 'background':
                    this.applyBackgroundEffect(effect);
                    break;
                case 'motion':
                    this.applyMotionEffect(effect);
                    break;
                case 'distortion':
                    this.applyDistortionEffect(effect);
                    break;
            }
        }
    }

    addText(text, style, animation) {
        const overlay = {
            id: Date.now(),
            text: text,
            style: style,
            animation: animation,
            position: { x: 50, y: 50 },
            startTime: 0,
            duration: 3
        };
        
        this.textOverlays.push(overlay);
        this.renderTextOverlay(overlay);
    }

    async saveAndContinue() {
        console.log('💾 Saving edited video...');
        
        // Process video with all edits
        const processedVideo = await this.processVideo();
        
        // Continue to next step (add description, hashtags, etc.)
        document.dispatchEvent(new CustomEvent('videoEdited', {
            detail: { video: processedVideo, edits: this.getEditData() }
        }));
    }

    async processVideo() {
        // This would use WebCodecs API or ffmpeg.wasm for actual processing
        // For now, return original with edit metadata
        return {
            file: this.currentVideo,
            edits: this.getEditData()
        };
    }

    getEditData() {
        return {
            trim: { start: 0, end: 100 },
            speed: 1,
            filter: null,
            effects: [],
            textOverlays: this.textOverlays,
            stickers: this.stickers,
            audioTracks: this.audioTracks
        };
    }

    // Timeline functions
    initializeTimeline(duration) {
        console.log('⏱️ Initializing timeline for', duration, 'seconds');
        
        this.timeline = {
            duration: duration,
            currentTime: 0,
            zoom: 1
        };
        
        this.videoDuration = duration;
        this.trimStartTime = 0;
        this.trimEndTime = duration;
        
        // Setup interactive timeline
        this.setupTimelineScrubbing();
        this.setupTrimControls();
        this.updateTimelineUI();
    }

    setupTimelineScrubbing() {
        const video = document.getElementById('editorVideo');
        const timeline = document.querySelector('.timeline-track');
        
        if (!timeline) return;
        
        let isDragging = false;
        
        // Create scrub handle if it doesn't exist
        let scrubHandle = timeline.querySelector('.scrub-handle');
        if (!scrubHandle) {
            scrubHandle = document.createElement('div');
            scrubHandle.className = 'scrub-handle';
            scrubHandle.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 3px;
                height: 100%;
                background: #fe2c55;
                cursor: pointer;
                z-index: 10;
                border-radius: 1px;
            `;
            timeline.appendChild(scrubHandle);
        }
        
        // Timeline click to jump
        timeline.addEventListener('click', (e) => {
            if (isDragging) return;
            
            const rect = timeline.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const newTime = percentage * this.videoDuration;
            
            video.currentTime = Math.max(0, Math.min(newTime, this.videoDuration));
            this.updateScrubHandle();
            console.log('⏭️ Jumped to:', this.formatTime(newTime));
        });
        
        // Scrub handle dragging
        scrubHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            e.preventDefault();
            e.stopPropagation();
            console.log('🎬 Started scrubbing');
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rect = timeline.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(mouseX / rect.width, 1));
            const newTime = percentage * this.videoDuration;
            
            video.currentTime = newTime;
            this.updateScrubHandle();
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                console.log('🎬 Stopped scrubbing at:', this.formatTime(video.currentTime));
            }
            isDragging = false;
        });
        
        // Update handle position as video plays
        video.addEventListener('timeupdate', () => {
            if (!isDragging) {
                this.updateScrubHandle();
            }
        });
    }

    updateScrubHandle() {
        const video = document.getElementById('editorVideo');
        const scrubHandle = document.querySelector('.scrub-handle');
        const timeline = document.querySelector('.timeline-track');
        
        if (!scrubHandle || !timeline || !this.videoDuration) return;
        
        const percentage = video.currentTime / this.videoDuration;
        scrubHandle.style.left = `${percentage * 100}%`;
    }

    setupTrimControls() {
        const trimStart = document.getElementById('trimStart');
        const trimEnd = document.getElementById('trimEnd');
        
        if (!trimStart || !trimEnd) return;
        
        // Set initial values
        trimStart.min = 0;
        trimStart.max = 100;
        trimStart.value = 0;
        
        trimEnd.min = 0;
        trimEnd.max = 100;
        trimEnd.value = 100;
        
        // Handle trim start changes
        trimStart.addEventListener('input', (e) => {
            const percentage = parseFloat(e.target.value);
            this.trimStartTime = (percentage / 100) * this.videoDuration;
            
            // Ensure start is before end
            if (this.trimStartTime >= this.trimEndTime) {
                this.trimStartTime = Math.max(0, this.trimEndTime - 1);
                trimStart.value = (this.trimStartTime / this.videoDuration) * 100;
            }
            
            this.updateTimelineUI();
            console.log('✂️ Trim start:', this.formatTime(this.trimStartTime));
        });
        
        // Handle trim end changes
        trimEnd.addEventListener('input', (e) => {
            const percentage = parseFloat(e.target.value);
            this.trimEndTime = (percentage / 100) * this.videoDuration;
            
            // Ensure end is after start
            if (this.trimEndTime <= this.trimStartTime) {
                this.trimEndTime = Math.min(this.videoDuration, this.trimStartTime + 1);
                trimEnd.value = (this.trimEndTime / this.videoDuration) * 100;
            }
            
            this.updateTimelineUI();
            console.log('✂️ Trim end:', this.formatTime(this.trimEndTime));
        });
    }

    updateTimelineUI() {
        // Update timeline visualization
        const trimDuration = this.trimEndTime - this.trimStartTime;
        console.log(`📏 Trimmed duration: ${this.formatTime(trimDuration)}`);
        
        // Visual indicators for trim points could be added here
        this.updateTrimIndicators();
    }

    updateTrimIndicators() {
        const timeline = document.querySelector('.timeline-track');
        if (!timeline) return;
        
        // Remove existing indicators
        timeline.querySelectorAll('.trim-indicator').forEach(indicator => indicator.remove());
        
        // Add trim start indicator
        const startIndicator = document.createElement('div');
        startIndicator.className = 'trim-indicator trim-start';
        startIndicator.style.cssText = `
            position: absolute;
            left: ${(this.trimStartTime / this.videoDuration) * 100}%;
            top: 0;
            width: 2px;
            height: 100%;
            background: #00ff00;
            z-index: 5;
        `;
        timeline.appendChild(startIndicator);
        
        // Add trim end indicator
        const endIndicator = document.createElement('div');
        endIndicator.className = 'trim-indicator trim-end';
        endIndicator.style.cssText = `
            position: absolute;
            left: ${(this.trimEndTime / this.videoDuration) * 100}%;
            top: 0;
            width: 2px;
            height: 100%;
            background: #ff0000;
            z-index: 5;
        `;
        timeline.appendChild(endIndicator);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Filter preview generation
    loadFilterPreviews() {
        const filterGrid = document.querySelector('.filter-grid');
        filterGrid.innerHTML = '';
        
        this.filters.forEach(filter => {
            const preview = document.createElement('div');
            preview.className = 'filter-preview';
            preview.innerHTML = `
                <div class="filter-thumb" style="filter: ${filter.css}"></div>
                <span>${filter.name}</span>
            `;
            preview.addEventListener('click', () => this.applyFilter(filter.id));
            filterGrid.appendChild(preview);
        });
    }

    // Effect preview generation
    loadEffectPreviews() {
        const effectsGrid = document.querySelector('.effects-grid');
        effectsGrid.innerHTML = '';
        
        this.effects.forEach(effect => {
            const preview = document.createElement('div');
            preview.className = 'effect-preview';
            preview.innerHTML = `
                <div class="effect-thumb">✨</div>
                <span>${effect.name}</span>
            `;
            preview.addEventListener('click', () => this.applyEffect(effect.id));
            effectsGrid.appendChild(preview);
        });
    }

    // Background effects
    applyBackgroundEffect(effect) {
        if (effect.id === 'greenscreen') {
            this.enableGreenScreen();
        } else if (effect.id === 'blur') {
            this.enableBackgroundBlur();
        }
    }

    enableGreenScreen() {
        // Would use Canvas API and chroma key
        console.log('Green screen effect enabled');
    }

    enableBackgroundBlur() {
        // Would use Canvas API and blur filter
        console.log('Background blur enabled');
    }

    // Motion effects
    applyMotionEffect(effect) {
        const video = document.getElementById('editorVideo');
        video.classList.add(`effect-${effect.id}`);
    }

    // Text overlay rendering
    renderTextOverlay(overlay) {
        // Create text element on canvas
        console.log('Rendering text overlay:', overlay);
    }
    // Add method to open with video element
    openWithVideoElement(videoElement) {
        if (!videoElement || !videoElement.src) {
            console.error('❌ No valid video element provided');
            return;
        }
        
        console.log('🎬 Opening video editor with video element');
        
        const editor = document.getElementById('videoEditor');
        const editorVideo = document.getElementById('editorVideo');
        
        // Copy video source
        editorVideo.src = videoElement.src;
        editorVideo.load();
        
        // Show editor
        editor.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Initialize when video loads
        editorVideo.addEventListener('loadedmetadata', () => {
            this.initializeTimeline(editorVideo.duration);
            this.loadFilterPreviews();
            this.loadEffectPreviews();
        });
        
        this.currentVideo = videoElement;
    }
    
    // Export edited video
    exportVideo() {
        console.log('💾 Exporting edited video...');
        console.log('✂️ Trim range:', this.formatTime(this.trimStartTime), 'to', this.formatTime(this.trimEndTime));
        console.log('🎨 Applied filter:', this.currentFilter ? this.currentFilter.name : 'None');
        
        // In a real implementation, this would process the video with WebCodecs API
        // For now, just close the editor
        this.close();
        
        if (window.showNotification) {
            window.showNotification('Video edited successfully! 🎬', 'success');
        }
    }
}

export default VideoEditor;

// Make VideoEditor available globally for non-module environments
if (typeof window !== 'undefined') {
    window.VideoEditor = VideoEditor;
    
    // Create a global video editor instance
    window.videoEditor = new VideoEditor();
    window.videoEditor.initialized = false;
    
    // Global function to open video editor
    window.openVideoEditor = function(videoElement) {
        if (!window.videoEditor.initialized) {
            window.videoEditor.initialize().then(() => {
                window.videoEditor.initialized = true;
                window.videoEditor.openWithVideoElement(videoElement);
            });
        } else {
            window.videoEditor.openWithVideoElement(videoElement);
        }
    };
    
    // Global functions for editor controls
    window.closeVideoEditor = function() {
        if (window.videoEditor) {
            window.videoEditor.close();
            document.body.style.overflow = '';
        }
    };
    
    window.saveEditedVideo = function() {
        if (window.videoEditor) {
            window.videoEditor.exportVideo();
        }
    };
    
    console.log('📱 Video Editor globals loaded');
}