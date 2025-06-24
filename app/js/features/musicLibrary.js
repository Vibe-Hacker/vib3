// Music Library - vertical video music and audio features
export class MusicLibrary {
    constructor() {
        this.tracks = [];
        this.sounds = [];
        this.userRecordings = [];
        this.currentAudio = null;
        this.audioContext = null;
        this.recorder = null;
        this.isRecording = false;
        
        this.config = {
            maxRecordingTime: 60000, // 60 seconds
            audioFormat: 'audio/webm',
            sampleRate: 44100
        };

        this.categories = [
            'Trending',
            'Original',
            'Hip Hop',
            'Pop',
            'R&B',
            'Electronic',
            'Rock',
            'Indie',
            'Classical',
            'Jazz',
            'Country',
            'Reggae',
            'Sound Effects',
            'Voice Over'
        ];
    }

    async initialize() {
        console.log('🎵 Initializing Music Library...');
        await this.setupAudioContext();
        await this.loadTrendingMusic();
        await this.loadSoundEffects();
        await this.loadUserRecordings();
        this.setupUI();
    }

    async setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Audio context initialized');
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }

    async loadTrendingMusic() {
        // Simulate loading trending music from API
        this.tracks = [
            {
                id: 'trend_1',
                title: 'Viral Dance Beat',
                artist: 'VIB3 Star',
                duration: 30,
                category: 'Trending',
                url: '/assets/music/viral-dance.mp3',
                thumbnail: '/assets/music/thumbnails/viral-dance.jpg',
                uses: 1250000,
                trending: true
            },
            {
                id: 'trend_2',
                title: 'Summer Vibes',
                artist: 'Chill Producer',
                duration: 45,
                category: 'Pop',
                url: '/assets/music/summer-vibes.mp3',
                thumbnail: '/assets/music/thumbnails/summer-vibes.jpg',
                uses: 890000,
                trending: true
            },
            {
                id: 'trend_3',
                title: 'Lo-Fi Study Beat',
                artist: 'Study Music Co.',
                duration: 60,
                category: 'Electronic',
                url: '/assets/music/lofi-study.mp3',
                thumbnail: '/assets/music/thumbnails/lofi-study.jpg',
                uses: 650000,
                trending: false
            },
            {
                id: 'original_1',
                title: 'My Original Song',
                artist: 'User123',
                duration: 25,
                category: 'Original',
                url: '/assets/music/original-1.mp3',
                thumbnail: '/assets/music/thumbnails/original-1.jpg',
                uses: 1500,
                original: true
            }
        ];

        console.log(`🎶 Loaded ${this.tracks.length} music tracks`);
    }

    async loadSoundEffects() {
        this.sounds = [
            {
                id: 'sfx_1',
                title: 'Applause',
                category: 'Sound Effects',
                duration: 5,
                url: '/assets/sounds/applause.mp3',
                uses: 45000
            },
            {
                id: 'sfx_2',
                title: 'Whoosh',
                category: 'Sound Effects',
                duration: 2,
                url: '/assets/sounds/whoosh.mp3',
                uses: 78000
            },
            {
                id: 'sfx_3',
                title: 'Pop',
                category: 'Sound Effects',
                duration: 1,
                url: '/assets/sounds/pop.mp3',
                uses: 120000
            },
            {
                id: 'sfx_4',
                title: 'Laugh Track',
                category: 'Sound Effects',
                duration: 3,
                url: '/assets/sounds/laugh.mp3',
                uses: 55000
            }
        ];

        console.log(`🔊 Loaded ${this.sounds.length} sound effects`);
    }

    async loadUserRecordings() {
        // Load user's saved recordings from localStorage
        const saved = localStorage.getItem('userRecordings');
        if (saved) {
            this.userRecordings = JSON.parse(saved);
            console.log(`🎤 Loaded ${this.userRecordings.length} user recordings`);
        }
    }

    setupUI() {
        // Music library modal
        const musicHTML = `
            <div id="musicLibrary" class="music-library-modal" style="display: none;">
                <div class="music-container">
                    <div class="music-header">
                        <button class="music-back-btn">←</button>
                        <h2>Add Music</h2>
                        <button class="music-record-btn">🎤</button>
                    </div>
                    
                    <div class="music-search">
                        <input type="text" id="musicSearch" placeholder="Search music and sounds">
                    </div>
                    
                    <div class="music-categories">
                        ${this.categories.map(cat => 
                            `<button class="music-category ${cat === 'Trending' ? 'active' : ''}" data-category="${cat}">${cat}</button>`
                        ).join('')}
                    </div>
                    
                    <div class="music-content">
                        <div id="musicList" class="music-list"></div>
                    </div>
                    
                    <div class="music-player">
                        <div class="player-info">
                            <div class="track-info">
                                <span id="currentTrackTitle">Select a track</span>
                                <span id="currentTrackArtist"></span>
                            </div>
                        </div>
                        <div class="player-controls">
                            <button id="playPauseBtn">▶️</button>
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                            <button id="useTrackBtn" disabled>Use</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="voiceRecorder" class="voice-recorder-modal" style="display: none;">
                <div class="recorder-container">
                    <div class="recorder-header">
                        <button class="recorder-back-btn">←</button>
                        <h2>Record Voice</h2>
                        <button class="recorder-save-btn" disabled>Save</button>
                    </div>
                    
                    <div class="recorder-content">
                        <div class="recording-visual">
                            <canvas id="audioVisualizer" width="300" height="100"></canvas>
                        </div>
                        
                        <div class="recording-info">
                            <span id="recordingTime">00:00</span>
                            <span id="recordingStatus">Ready to record</span>
                        </div>
                        
                        <div class="recording-controls">
                            <button id="recordBtn" class="record-button">🎤</button>
                            <button id="playRecordingBtn" disabled>▶️</button>
                            <button id="stopRecordingBtn" disabled>⏹️</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', musicHTML);
        this.attachEventListeners();
        this.loadMusicByCategory('Trending');
    }

    attachEventListeners() {
        // Music library events
        document.querySelector('.music-back-btn').addEventListener('click', () => {
            this.closeMusicLibrary();
        });

        document.querySelector('.music-record-btn').addEventListener('click', () => {
            this.openVoiceRecorder();
        });

        // Category buttons
        document.querySelectorAll('.music-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchCategory(e.target.dataset.category);
            });
        });

        // Search
        document.getElementById('musicSearch').addEventListener('input', (e) => {
            this.searchMusic(e.target.value);
        });

        // Player controls
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.togglePlayback();
        });

        document.getElementById('useTrackBtn').addEventListener('click', () => {
            this.useCurrentTrack();
        });

        // Voice recorder events
        document.querySelector('.recorder-back-btn').addEventListener('click', () => {
            this.closeVoiceRecorder();
        });

        document.getElementById('recordBtn').addEventListener('click', () => {
            this.toggleRecording();
        });

        document.getElementById('playRecordingBtn').addEventListener('click', () => {
            this.playRecording();
        });

        document.getElementById('stopRecordingBtn').addEventListener('click', () => {
            this.stopRecording();
        });

        document.querySelector('.recorder-save-btn').addEventListener('click', () => {
            this.saveRecording();
        });
    }

    // Music Library Functions
    openMusicLibrary() {
        document.getElementById('musicLibrary').style.display = 'flex';
    }

    closeMusicLibrary() {
        document.getElementById('musicLibrary').style.display = 'none';
        this.stopCurrentAudio();
    }

    switchCategory(category) {
        document.querySelectorAll('.music-category').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        this.loadMusicByCategory(category);
    }

    loadMusicByCategory(category) {
        let items = [];
        
        if (category === 'Trending') {
            items = this.tracks.filter(track => track.trending);
        } else if (category === 'Original') {
            items = this.tracks.filter(track => track.original);
        } else if (category === 'Sound Effects') {
            items = this.sounds;
        } else {
            items = this.tracks.filter(track => track.category === category);
        }

        this.renderMusicList(items);
    }

    renderMusicList(items) {
        const musicList = document.getElementById('musicList');
        musicList.innerHTML = '';

        items.forEach(item => {
            const trackElement = document.createElement('div');
            trackElement.className = 'music-track';
            trackElement.innerHTML = `
                <div class="track-thumbnail">
                    ${item.thumbnail ? 
                        `<img src="${item.thumbnail}" alt="${item.title}">` : 
                        `<div class="track-icon">${item.category === 'Sound Effects' ? '🔊' : '🎵'}</div>`
                    }
                </div>
                <div class="track-details">
                    <div class="track-title">${item.title}</div>
                    <div class="track-artist">${item.artist || 'Sound Effect'}</div>
                    <div class="track-stats">${this.formatUsageCount(item.uses)} uses • ${item.duration}s</div>
                </div>
                <button class="track-select-btn" data-track-id="${item.id}">Select</button>
            `;

            trackElement.querySelector('.track-select-btn').addEventListener('click', () => {
                this.selectTrack(item);
            });

            musicList.appendChild(trackElement);
        });
    }

    selectTrack(track) {
        // Update player info
        document.getElementById('currentTrackTitle').textContent = track.title;
        document.getElementById('currentTrackArtist').textContent = track.artist || '';
        document.getElementById('useTrackBtn').disabled = false;

        // Load audio
        this.stopCurrentAudio();
        this.currentAudio = new Audio(track.url);
        this.currentAudio.addEventListener('loadedmetadata', () => {
            console.log(`🎵 Loaded: ${track.title}`);
        });

        // Store current track
        this.selectedTrack = track;
    }

    togglePlayback() {
        if (!this.currentAudio) return;

        const playBtn = document.getElementById('playPauseBtn');
        
        if (this.currentAudio.paused) {
            this.currentAudio.play();
            playBtn.textContent = '⏸️';
        } else {
            this.currentAudio.pause();
            playBtn.textContent = '▶️';
        }
    }

    stopCurrentAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            document.getElementById('playPauseBtn').textContent = '▶️';
        }
    }

    useCurrentTrack() {
        if (this.selectedTrack) {
            // Dispatch event with selected track
            document.dispatchEvent(new CustomEvent('musicSelected', {
                detail: this.selectedTrack
            }));
            this.closeMusicLibrary();
        }
    }

    searchMusic(query) {
        if (!query.trim()) {
            this.loadMusicByCategory('Trending');
            return;
        }

        const allItems = [...this.tracks, ...this.sounds];
        const results = allItems.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            (item.artist && item.artist.toLowerCase().includes(query.toLowerCase()))
        );

        this.renderMusicList(results);
    }

    // Voice Recording Functions
    openVoiceRecorder() {
        document.getElementById('voiceRecorder').style.display = 'flex';
        this.requestMicrophonePermission();
    }

    closeVoiceRecorder() {
        document.getElementById('voiceRecorder').style.display = 'none';
        this.stopRecording();
    }

    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.setupRecorder(stream);
        } catch (error) {
            console.error('Microphone access denied:', error);
            document.getElementById('recordingStatus').textContent = 'Microphone access required';
        }
    }

    setupRecorder(stream) {
        this.recorder = new MediaRecorder(stream);
        this.recordedChunks = [];

        this.recorder.ondataavailable = (event) => {
            this.recordedChunks.push(event.data);
        };

        this.recorder.onstop = () => {
            this.recordedBlob = new Blob(this.recordedChunks, { type: this.config.audioFormat });
            this.recordedUrl = URL.createObjectURL(this.recordedBlob);
            document.getElementById('playRecordingBtn').disabled = false;
            document.querySelector('.recorder-save-btn').disabled = false;
        };

        document.getElementById('recordingStatus').textContent = 'Ready to record';
    }

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        if (!this.recorder) return;

        this.recorder.start();
        this.isRecording = true;
        this.recordingStartTime = Date.now();

        document.getElementById('recordBtn').textContent = '⏸️';
        document.getElementById('stopRecordingBtn').disabled = false;
        document.getElementById('recordingStatus').textContent = 'Recording...';

        // Start timer
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            document.getElementById('recordingTime').textContent = this.formatTime(elapsed);

            if (elapsed >= this.config.maxRecordingTime) {
                this.stopRecording();
            }
        }, 100);

        // Start audio visualization
        this.startAudioVisualization();
    }

    stopRecording() {
        if (!this.isRecording) return;

        this.recorder.stop();
        this.isRecording = false;

        document.getElementById('recordBtn').textContent = '🎤';
        document.getElementById('stopRecordingBtn').disabled = true;
        document.getElementById('recordingStatus').textContent = 'Recording complete';

        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
        }

        this.stopAudioVisualization();
    }

    playRecording() {
        if (this.recordedUrl) {
            const audio = new Audio(this.recordedUrl);
            audio.play();
        }
    }

    saveRecording() {
        if (!this.recordedBlob) return;

        const recording = {
            id: 'rec_' + Date.now(),
            title: `Recording ${new Date().toLocaleDateString()}`,
            duration: Math.floor((Date.now() - this.recordingStartTime) / 1000),
            blob: this.recordedBlob,
            url: this.recordedUrl,
            createdAt: new Date()
        };

        this.userRecordings.push(recording);
        this.saveUserRecordings();

        document.dispatchEvent(new CustomEvent('voiceRecorded', {
            detail: recording
        }));

        this.closeVoiceRecorder();
    }

    saveUserRecordings() {
        // Save to localStorage (excluding blob data)
        const recordingsToSave = this.userRecordings.map(rec => ({
            id: rec.id,
            title: rec.title,
            duration: rec.duration,
            createdAt: rec.createdAt
        }));
        
        localStorage.setItem('userRecordings', JSON.stringify(recordingsToSave));
    }

    startAudioVisualization() {
        const canvas = document.getElementById('audioVisualizer');
        const ctx = canvas.getContext('2d');
        
        // Simple oscilloscope visualization
        const draw = () => {
            if (!this.isRecording) return;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#ff2d55';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let i = 0; i < canvas.width; i++) {
                const y = canvas.height / 2 + Math.sin(i * 0.1 + Date.now() * 0.01) * 20;
                if (i === 0) {
                    ctx.moveTo(i, y);
                } else {
                    ctx.lineTo(i, y);
                }
            }
            
            ctx.stroke();
            requestAnimationFrame(draw);
        };
        
        draw();
    }

    stopAudioVisualization() {
        const canvas = document.getElementById('audioVisualizer');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Utility functions
    formatUsageCount(count) {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    }

    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Public API
    getAllTracks() {
        return [...this.tracks, ...this.sounds, ...this.userRecordings];
    }

    getTrackById(id) {
        return this.getAllTracks().find(track => track.id === id);
    }

    getTrendingTracks() {
        return this.tracks.filter(track => track.trending);
    }
}

// Global access
window.openMusicLibrary = function() {
    if (window.VIB3 && window.VIB3.getModule('musicLibrary')) {
        window.VIB3.getModule('musicLibrary').openMusicLibrary();
    }
};

export default MusicLibrary;