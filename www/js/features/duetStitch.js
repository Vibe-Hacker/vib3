// Duet & Stitch Features - vertical video video collaboration
export class DuetStitch {
    constructor() {
        this.originalVideo = null;
        this.userVideo = null;
        this.recordedStream = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.mode = null; // 'duet' or 'stitch'
        this.selectedSegment = null;
        
        this.config = {
            maxDuetDuration: 60, // seconds
            maxStitchDuration: 15, // seconds
            videoQuality: {
                width: { ideal: 3840, max: 3840 },
                height: { ideal: 2160, max: 2160 },
                frameRate: { ideal: 60, max: 60 }
            }
        };
    }

    async initialize() {
        console.log('🎭 Initializing Duet & Stitch...');
        this.setupUI();
        await this.setupCamera();
    }

    async setupCamera() {
        try {
            this.userStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: this.config.videoQuality.width,
                    height: this.config.videoQuality.height,
                    frameRate: this.config.videoQuality.frameRate,
                    facingMode: 'user'
                },
                audio: true
            });
            console.log('📹 Camera initialized');
        } catch (error) {
            console.error('Camera access failed:', error);
        }
    }

    setupUI() {
        const duetStitchHTML = `
            <!-- Duet/Stitch Selection Modal -->
            <div id="duetStitchModal" class="duet-stitch-modal" style="display: none;">
                <div class="duet-stitch-container">
                    <div class="duet-stitch-header">
                        <button class="back-btn">←</button>
                        <h2>Create With This Video</h2>
                        <button class="close-btn">×</button>
                    </div>
                    
                    <div class="collaboration-options">
                        <button class="collab-option" data-mode="duet">
                            <div class="option-icon">🎭</div>
                            <div class="option-info">
                                <h3>Duet</h3>
                                <p>Record alongside this video</p>
                            </div>
                        </button>
                        
                        <button class="collab-option" data-mode="stitch">
                            <div class="option-icon">✂️</div>
                            <div class="option-info">
                                <h3>Stitch</h3>
                                <p>Add to the end of this video</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Duet Recording Interface -->
            <div id="duetRecorder" class="duet-recorder" style="display: none;">
                <div class="duet-layout">
                    <div class="original-video-container">
                        <video id="duetOriginalVideo" class="original-video" muted></video>
                        <div class="video-info">
                            <span class="username">@original_user</span>
                        </div>
                    </div>
                    
                    <div class="user-video-container">
                        <video id="duetUserVideo" class="user-video" autoplay muted></video>
                        <div class="recording-indicator" style="display: none;">
                            <div class="recording-dot"></div>
                            <span>REC</span>
                        </div>
                    </div>
                </div>
                
                <div class="duet-controls">
                    <div class="timer-display">
                        <span id="duetTimer">00:00</span>
                        <span class="max-time">/ 01:00</span>
                    </div>
                    
                    <div class="recording-controls">
                        <button id="duetCancelBtn" class="control-btn cancel">Cancel</button>
                        <button id="duetRecordBtn" class="record-btn">
                            <div class="record-ring"></div>
                        </button>
                        <button id="duetNextBtn" class="control-btn next" disabled>Next</button>
                    </div>
                    
                    <div class="duet-options">
                        <button class="option-btn" id="flipCamera">📷</button>
                        <button class="option-btn" id="muteOriginal">🔊</button>
                        <button class="option-btn" id="addEffects">✨</button>
                    </div>
                </div>
            </div>

            <!-- Stitch Selector Interface -->
            <div id="stitchSelector" class="stitch-selector" style="display: none;">
                <div class="stitch-preview">
                    <video id="stitchOriginalVideo" class="stitch-video"></video>
                    <div class="selection-overlay">
                        <div class="selection-handles">
                            <div class="handle start-handle"></div>
                            <div class="handle end-handle"></div>
                        </div>
                        <div class="selection-timeline">
                            <div class="timeline-progress"></div>
                        </div>
                    </div>
                </div>
                
                <div class="stitch-info">
                    <p>Select up to 5 seconds from this video</p>
                    <div class="selected-duration">
                        <span id="selectedDuration">0s</span> selected
                    </div>
                </div>
                
                <div class="stitch-controls">
                    <button id="stitchCancelBtn" class="control-btn cancel">Cancel</button>
                    <button id="stitchNextBtn" class="control-btn next" disabled>Next</button>
                </div>
            </div>

            <!-- Stitch Recording Interface -->
            <div id="stitchRecorder" class="stitch-recorder" style="display: none;">
                <div class="stitch-layout">
                    <div class="preview-section">
                        <video id="stitchPreview" class="stitch-preview-video" muted></video>
                        <div class="preview-label">Your selected clip</div>
                    </div>
                    
                    <div class="record-section">
                        <video id="stitchUserVideo" class="stitch-user-video" autoplay muted></video>
                        <div class="recording-indicator" style="display: none;">
                            <div class="recording-dot"></div>
                            <span>REC</span>
                        </div>
                    </div>
                </div>
                
                <div class="stitch-record-controls">
                    <div class="timer-display">
                        <span id="stitchTimer">00:00</span>
                        <span class="max-time">/ 01:00</span>
                    </div>
                    
                    <div class="recording-controls">
                        <button id="stitchRecordCancelBtn" class="control-btn cancel">Cancel</button>
                        <button id="stitchRecordBtn" class="record-btn">
                            <div class="record-ring"></div>
                        </button>
                        <button id="stitchRecordNextBtn" class="control-btn next" disabled>Next</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', duetStitchHTML);
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Modal controls
        document.querySelectorAll('.back-btn, .close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeAll());
        });

        // Collaboration option selection
        document.querySelectorAll('.collab-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.startCollaboration(mode);
            });
        });

        // Duet controls
        document.getElementById('duetRecordBtn').addEventListener('click', () => {
            this.toggleDuetRecording();
        });

        document.getElementById('duetCancelBtn').addEventListener('click', () => {
            this.cancelDuet();
        });

        document.getElementById('duetNextBtn').addEventListener('click', () => {
            this.finishDuet();
        });

        // Duet options
        document.getElementById('flipCamera').addEventListener('click', () => {
            this.flipCamera();
        });

        document.getElementById('muteOriginal').addEventListener('click', () => {
            this.toggleOriginalAudio();
        });

        // Stitch controls
        document.getElementById('stitchNextBtn').addEventListener('click', () => {
            this.startStitchRecording();
        });

        document.getElementById('stitchCancelBtn').addEventListener('click', () => {
            this.closeAll();
        });

        // Stitch recording controls
        document.getElementById('stitchRecordBtn').addEventListener('click', () => {
            this.toggleStitchRecording();
        });

        document.getElementById('stitchRecordCancelBtn').addEventListener('click', () => {
            this.cancelStitch();
        });

        document.getElementById('stitchRecordNextBtn').addEventListener('click', () => {
            this.finishStitch();
        });
    }

    // Main entry point
    openDuetStitch(videoData) {
        this.originalVideo = videoData;
        document.getElementById('duetStitchModal').style.display = 'flex';
    }

    startCollaboration(mode) {
        this.mode = mode;
        document.getElementById('duetStitchModal').style.display = 'none';

        if (mode === 'duet') {
            this.setupDuet();
        } else if (mode === 'stitch') {
            this.setupStitch();
        }
    }

    // Duet Functions
    async setupDuet() {
        const duetRecorder = document.getElementById('duetRecorder');
        const originalVideo = document.getElementById('duetOriginalVideo');
        const userVideo = document.getElementById('duetUserVideo');

        // Load original video
        originalVideo.src = this.originalVideo.videoUrl;
        originalVideo.load();

        // Setup user camera
        if (this.userStream) {
            userVideo.srcObject = this.userStream;
        }

        duetRecorder.style.display = 'flex';
        console.log('🎭 Duet setup complete');
    }

    async toggleDuetRecording() {
        if (this.isRecording) {
            this.stopDuetRecording();
        } else {
            this.startDuetRecording();
        }
    }

    async startDuetRecording() {
        try {
            // Create canvas for composite recording
            const canvas = document.createElement('canvas');
            canvas.width = this.config.videoQuality.width * 2; // Side by side
            canvas.height = this.config.videoQuality.height;
            const ctx = canvas.getContext('2d');

            const originalVideo = document.getElementById('duetOriginalVideo');
            const userVideo = document.getElementById('duetUserVideo');

            // Start original video
            originalVideo.currentTime = 0;
            originalVideo.play();

            // Setup composite stream
            const compositeStream = canvas.captureStream(30);
            
            // Add audio from user stream
            if (this.userStream) {
                const audioTrack = this.userStream.getAudioTracks()[0];
                if (audioTrack) {
                    compositeStream.addTrack(audioTrack);
                }
            }

            // Setup media recorder
            this.mediaRecorder = new MediaRecorder(compositeStream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            this.recordedChunks = [];
            this.mediaRecorder.ondataavailable = (event) => {
                this.recordedChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                this.processDuetRecording();
            };

            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();

            // Update UI
            document.querySelector('.recording-indicator').style.display = 'flex';
            document.getElementById('duetRecordBtn').classList.add('recording');

            // Start timer
            this.updateTimer('duetTimer', this.config.maxDuetDuration);

            // Composite video frames
            const drawFrame = () => {
                if (!this.isRecording) return;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw original video (left side)
                ctx.drawImage(originalVideo, 0, 0, canvas.width / 2, canvas.height);
                
                // Draw user video (right side)
                ctx.drawImage(userVideo, canvas.width / 2, 0, canvas.width / 2, canvas.height);

                requestAnimationFrame(drawFrame);
            };

            requestAnimationFrame(drawFrame);

            console.log('🎬 Duet recording started');

        } catch (error) {
            console.error('Failed to start duet recording:', error);
        }
    }

    stopDuetRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;

            // Stop original video
            document.getElementById('duetOriginalVideo').pause();

            // Update UI
            document.querySelector('.recording-indicator').style.display = 'none';
            document.getElementById('duetRecordBtn').classList.remove('recording');
            document.getElementById('duetNextBtn').disabled = false;

            console.log('⏹️ Duet recording stopped');
        }
    }

    processDuetRecording() {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.recordedVideo = {
            blob: blob,
            url: URL.createObjectURL(blob),
            type: 'duet',
            originalVideo: this.originalVideo,
            duration: (Date.now() - this.recordingStartTime) / 1000
        };

        console.log('✅ Duet recording processed');
    }

    // Stitch Functions
    setupStitch() {
        const stitchSelector = document.getElementById('stitchSelector');
        const stitchVideo = document.getElementById('stitchOriginalVideo');

        // Load original video
        stitchVideo.src = this.originalVideo.videoUrl;
        stitchVideo.load();

        stitchSelector.style.display = 'flex';
        this.setupStitchSelector();
        console.log('✂️ Stitch setup complete');
    }

    setupStitchSelector() {
        const video = document.getElementById('stitchOriginalVideo');
        const timeline = document.querySelector('.selection-timeline');
        const startHandle = document.querySelector('.start-handle');
        const endHandle = document.querySelector('.end-handle');
        const progress = document.querySelector('.timeline-progress');

        let isDragging = false;
        let dragHandle = null;
        let startTime = 0;
        let endTime = 5; // Default 5 seconds

        // Video loaded
        video.addEventListener('loadedmetadata', () => {
            const maxDuration = Math.min(video.duration, 15); // Max 15 seconds for stitch
            endTime = Math.min(5, maxDuration);
            this.updateStitchSelection(startTime, endTime);
        });

        // Handle dragging
        const startDrag = (handle) => {
            isDragging = true;
            dragHandle = handle;
        };

        const drag = (e) => {
            if (!isDragging) return;

            const rect = timeline.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const time = percent * Math.min(video.duration, 15);

            if (dragHandle === startHandle) {
                startTime = Math.min(time, endTime - 1);
            } else if (dragHandle === endHandle) {
                endTime = Math.max(time, startTime + 1);
                endTime = Math.min(endTime, startTime + 5); // Max 5 seconds
            }

            this.updateStitchSelection(startTime, endTime);
        };

        const endDrag = () => {
            isDragging = false;
            dragHandle = null;
        };

        // Event listeners
        startHandle.addEventListener('mousedown', () => startDrag(startHandle));
        endHandle.addEventListener('mousedown', () => startDrag(endHandle));
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);

        // Touch events
        startHandle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startDrag(startHandle);
        });
        endHandle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startDrag(endHandle);
        });
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            drag(e.touches[0]);
        });
        document.addEventListener('touchend', endDrag);
    }

    updateStitchSelection(startTime, endTime) {
        const video = document.getElementById('stitchOriginalVideo');
        const startHandle = document.querySelector('.start-handle');
        const endHandle = document.querySelector('.end-handle');
        const progress = document.querySelector('.timeline-progress');
        const durationSpan = document.getElementById('selectedDuration');

        const videoDuration = Math.min(video.duration || 15, 15);
        const startPercent = (startTime / videoDuration) * 100;
        const endPercent = (endTime / videoDuration) * 100;

        startHandle.style.left = startPercent + '%';
        endHandle.style.left = endPercent + '%';
        progress.style.left = startPercent + '%';
        progress.style.width = (endPercent - startPercent) + '%';

        durationSpan.textContent = Math.round(endTime - startTime) + 's';

        // Store selection
        this.selectedSegment = { startTime, endTime };

        // Enable next button if selection is valid
        document.getElementById('stitchNextBtn').disabled = (endTime - startTime) < 1;

        // Update video preview
        video.currentTime = startTime;
    }

    startStitchRecording() {
        document.getElementById('stitchSelector').style.display = 'none';
        
        const stitchRecorder = document.getElementById('stitchRecorder');
        const previewVideo = document.getElementById('stitchPreview');
        const userVideo = document.getElementById('stitchUserVideo');

        // Setup preview with selected segment
        previewVideo.src = this.originalVideo.videoUrl;
        previewVideo.currentTime = this.selectedSegment.startTime;

        // Setup user camera
        if (this.userStream) {
            userVideo.srcObject = this.userStream;
        }

        stitchRecorder.style.display = 'flex';
        console.log('✂️ Stitch recording ready');
    }

    async toggleStitchRecording() {
        if (this.isRecording) {
            this.stopStitchRecording();
        } else {
            this.startStitchRecordingProcess();
        }
    }

    async startStitchRecordingProcess() {
        try {
            // First, create the selected clip
            await this.createStitchClip();

            // Then start recording user portion
            const userVideo = document.getElementById('stitchUserVideo');
            
            if (!this.userStream) {
                throw new Error('No user camera stream available');
            }

            this.mediaRecorder = new MediaRecorder(this.userStream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            this.recordedChunks = [];
            this.mediaRecorder.ondataavailable = (event) => {
                this.recordedChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                this.processStitchRecording();
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();

            // Update UI
            document.querySelector('#stitchRecorder .recording-indicator').style.display = 'flex';
            document.getElementById('stitchRecordBtn').classList.add('recording');

            // Start timer
            this.updateTimer('stitchTimer', this.config.maxStitchDuration);

            console.log('🎬 Stitch recording started');

        } catch (error) {
            console.error('Failed to start stitch recording:', error);
        }
    }

    stopStitchRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;

            // Update UI
            document.querySelector('#stitchRecorder .recording-indicator').style.display = 'none';
            document.getElementById('stitchRecordBtn').classList.remove('recording');
            document.getElementById('stitchRecordNextBtn').disabled = false;

            console.log('⏹️ Stitch recording stopped');
        }
    }

    async createStitchClip() {
        // This would typically use ffmpeg.wasm or server-side processing
        // For now, we'll store the segment info for later processing
        this.stitchClip = {
            originalVideo: this.originalVideo,
            startTime: this.selectedSegment.startTime,
            endTime: this.selectedSegment.endTime
        };
    }

    processStitchRecording() {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.recordedVideo = {
            blob: blob,
            url: URL.createObjectURL(blob),
            type: 'stitch',
            originalClip: this.stitchClip,
            duration: (Date.now() - this.recordingStartTime) / 1000
        };

        console.log('✅ Stitch recording processed');
    }

    // Common Functions
    updateTimer(elementId, maxDuration) {
        const timerElement = document.getElementById(elementId);
        const startTime = this.recordingStartTime;

        const updateTime = () => {
            if (!this.isRecording) return;

            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;

            timerElement.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (elapsed >= maxDuration) {
                if (this.mode === 'duet') {
                    this.stopDuetRecording();
                } else {
                    this.stopStitchRecording();
                }
                return;
            }

            setTimeout(updateTime, 1000);
        };

        updateTime();
    }

    async flipCamera() {
        // Implementation for camera switching
        console.log('📷 Flipping camera');
    }

    toggleOriginalAudio() {
        const originalVideo = document.getElementById('duetOriginalVideo');
        const muteBtn = document.getElementById('muteOriginal');
        
        originalVideo.muted = !originalVideo.muted;
        muteBtn.textContent = originalVideo.muted ? '🔇' : '🔊';
    }

    // Cleanup functions
    cancelDuet() {
        this.stopDuetRecording();
        this.closeAll();
    }

    cancelStitch() {
        this.stopStitchRecording();
        this.closeAll();
    }

    finishDuet() {
        if (this.recordedVideo) {
            document.dispatchEvent(new CustomEvent('duetCreated', {
                detail: this.recordedVideo
            }));
        }
        this.closeAll();
    }

    finishStitch() {
        if (this.recordedVideo) {
            document.dispatchEvent(new CustomEvent('stitchCreated', {
                detail: this.recordedVideo
            }));
        }
        this.closeAll();
    }

    closeAll() {
        document.getElementById('duetStitchModal').style.display = 'none';
        document.getElementById('duetRecorder').style.display = 'none';
        document.getElementById('stitchSelector').style.display = 'none';
        document.getElementById('stitchRecorder').style.display = 'none';

        // Stop any ongoing recording
        if (this.isRecording) {
            if (this.mode === 'duet') {
                this.stopDuetRecording();
            } else {
                this.stopStitchRecording();
            }
        }

        // Reset state
        this.mode = null;
        this.originalVideo = null;
        this.selectedSegment = null;
        this.recordedVideo = null;
    }
}

// Global access
window.openDuetStitch = function(videoData) {
    if (window.VIB3 && window.VIB3.getModule('duetStitch')) {
        window.VIB3.getModule('duetStitch').openDuetStitch(videoData);
    }
};

export default DuetStitch;