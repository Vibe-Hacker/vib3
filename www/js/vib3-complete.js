// VIB3 Complete Video Sharing App - All Features
// No ES6 modules - global functions only

// ================ CONFIGURATION ================
const appConfig = {
    name: 'VIB3',
    version: '1.0.0',
    debug: true,
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    supportedVideoFormats: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    videoCompressionQuality: 0.8,
    maxVideoDuration: 180, // 3 minutes
    defaultUserAvatar: '👤',
    feedPageSize: 10
};

// Global state
if (typeof currentUser === 'undefined') {
    window.currentUser = null;
}
let currentFeed = 'foryou';
let currentVideoId = null;
let isRecording = false;
let currentStep = 1;

// ================ AUTHENTICATION ================
function initializeAuth() {
    if (window.auth && window.auth.onAuthStateChanged) {
        window.auth.onAuthStateChanged((user) => {
            currentUser = user;
            if (user) {
                hideAuthContainer();
                showMainApp();
                loadUserProfile();
                loadVideoFeed(currentFeed);
            } else {
                showAuthContainer();
                hideMainApp();
            }
        });
    }
}

function hideAuthContainer() {
    document.getElementById('authContainer').style.display = 'none';
}

function showAuthContainer() {
    document.getElementById('authContainer').style.display = 'flex';
}

function hideMainApp() {
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('mainApp').style.display = 'block';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
}

function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (window.login) {
        const result = await window.login(email, password);
        if (!result.success) {
            document.getElementById('authError').textContent = result.error;
        }
    }
}

async function handleSignup() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const displayName = document.getElementById('signupName').value;
    
    if (window.signup) {
        const result = await window.signup(displayName, email, password);
        if (!result.success) {
            document.getElementById('authError').textContent = result.error;
        }
    }
}

async function handleLogout() {
    if (window.logout) {
        await window.logout();
    }
}

// ================ USER PROFILE ================
async function loadUserProfile() {
    if (!currentUser) {
        console.error('No current user to load profile for');
        return;
    }
    
    // Update profile UI elements
    const profileElements = {
        username: document.querySelectorAll('.profile-username'),
        avatar: document.querySelectorAll('.profile-avatar'),
        displayName: document.querySelectorAll('.profile-displayname')
    };
    
    // Set username
    profileElements.username.forEach(el => {
        if (el) el.textContent = currentUser.username || currentUser.email?.split('@')[0] || 'User';
    });
    
    // Set display name
    profileElements.displayName.forEach(el => {
        if (el) el.textContent = currentUser.displayName || currentUser.username || 'VIB3 User';
    });
    
    // Set avatar (use default if none)
    profileElements.avatar.forEach(el => {
        if (el) {
            if (el.tagName === 'IMG') {
                el.src = currentUser.photoURL || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="40" fill="%23ddd"/%3E%3Ctext x="50" y="55" text-anchor="middle" font-size="40" fill="%23666"%3E👤%3C/text%3E%3C/svg%3E';
            } else {
                el.textContent = currentUser.photoURL ? '' : '👤';
            }
        }
    });
    
    console.log('User profile loaded:', currentUser.email);
}

// ================ VIDEO FEED MANAGEMENT ================
async function loadVideoFeed(feedType = 'foryou', forceRefresh = false) {
    currentFeed = feedType;
    
    // Update UI to show correct feed
    document.querySelectorAll('.feed-content').forEach(feed => {
        feed.classList.remove('active');
    });
    document.querySelectorAll('.feed-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show the correct feed
    const feedElement = document.getElementById(feedType + 'Feed');
    const tabElement = document.getElementById(feedType + 'Tab');
    
    if (feedElement) {
        feedElement.classList.add('active');
        feedElement.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading videos...</p></div>';
        
        try {
            const response = await fetch(`/api/videos?feed=${feedType}`, {
                headers: window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {}
            });
            
            const data = await response.json();
            
            if (data.videos && data.videos.length > 0) {
                feedElement.innerHTML = '';
                data.videos.forEach(video => {
                    const videoCard = createAdvancedVideoCard(video);
                    feedElement.appendChild(videoCard);
                });
                initializeVideoObserver();
            } else {
                feedElement.innerHTML = createEmptyFeedMessage(feedType);
            }
        } catch (error) {
            console.error('Load feed error:', error);
            feedElement.innerHTML = createErrorMessage(feedType);
        }
    }
    
    if (tabElement) {
        tabElement.classList.add('active');
    }
}

function createAdvancedVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `
        <div class="video-container">
            <video 
                class="video-element" 
                src="${video.videoUrl || 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'}"
                poster="${video.thumbnail || ''}"
                loop
                muted
                onclick="toggleVideoPlayback(this.parentElement)"
            ></video>
            <div class="play-pause-indicator">▶️</div>
            
            <!-- Advanced Video Actions -->
            <div class="video-actions-right">
                <div class="action-group">
                    <button class="action-btn like-btn" onclick="handleAdvancedLike('${video._id}', this)" data-count="${video.likeCount || 0}">
                        <div class="action-icon">❤️</div>
                        <span class="action-count">${formatCount(video.likeCount || 0)}</span>
                    </button>
                    <div class="reaction-buttons" style="display: none;">
                        <button class="reaction-btn" onclick="addReaction('${video._id}', 'love')" title="Love">❤️</button>
                        <button class="reaction-btn" onclick="addReaction('${video._id}', 'laugh')" title="Laugh">😂</button>
                        <button class="reaction-btn" onclick="addReaction('${video._id}', 'surprise')" title="Surprise">😮</button>
                        <button class="reaction-btn" onclick="addReaction('${video._id}', 'sad')" title="Sad">😢</button>
                        <button class="reaction-btn" onclick="addReaction('${video._id}', 'angry')" title="Angry">😠</button>
                    </div>
                </div>
                
                <button class="action-btn comment-btn" onclick="openCommentsModal('${video._id}')">
                    <div class="action-icon">💬</div>
                    <span class="action-count">${formatCount(video.commentCount || 0)}</span>
                </button>
                
                <button class="action-btn share-btn" onclick="openShareModal('${video._id}')">
                    <div class="action-icon">📤</div>
                    <span class="action-count">Share</span>
                </button>
                
                <button class="action-btn duet-btn" onclick="startDuet('${video._id}')">
                    <div class="action-icon">👥</div>
                    <span class="action-count">Duet</span>
                </button>
                
                <button class="action-btn stitch-btn" onclick="startStitch('${video._id}')">
                    <div class="action-icon">✂️</div>
                    <span class="action-count">Stitch</span>
                </button>
                
                <button class="action-btn save-btn" onclick="saveVideo('${video._id}', this)">
                    <div class="action-icon">🔖</div>
                    <span class="action-count">Save</span>
                </button>
                
                <button class="action-btn more-btn" onclick="showVideoOptions('${video._id}')">
                    <div class="action-icon">⋯</div>
                </button>
            </div>
            
            <!-- Video Info Overlay -->
            <div class="video-info-overlay">
                <div class="user-info">
                    <div class="user-avatar" onclick="viewProfile('${video.userId}')">${video.userAvatar || '👤'}</div>
                    <div class="user-details">
                        <div class="username" onclick="viewProfile('${video.userId}')">@${video.username || 'user'}</div>
                        <div class="video-description">${video.description || ''}</div>
                        <div class="video-sound" onclick="browseSound('${video.soundId || ''}')">
                            🎵 ${video.soundName || 'Original sound'}
                        </div>
                    </div>
                    <button class="follow-btn" onclick="toggleFollow('${video.userId}', this)">Follow</button>
                </div>
            </div>
            
            <!-- Video Effects Overlay -->
            <div class="video-effects-overlay">
                <div class="effect-tags">
                    ${video.effects ? video.effects.map(effect => `<span class="effect-tag">${effect}</span>`).join('') : ''}
                </div>
            </div>
        </div>
    `;
    return card;
}

// ================ ADVANCED VIDEO INTERACTIONS ================
async function handleAdvancedLike(videoId, button) {
    // Show reaction options on long press
    let pressTimer = null;
    
    button.addEventListener('mousedown', () => {
        pressTimer = setTimeout(() => {
            showReactionOptions(button);
        }, 500);
    });
    
    button.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
    });
    
    // Regular like on click
    if (window.toggleLike) {
        const result = await window.toggleLike(videoId);
        if (result.success) {
            button.classList.toggle('liked', result.liked);
            button.querySelector('.action-count').textContent = formatCount(result.likeCount);
            
            // Animate like
            if (result.liked) {
                animateLike(button);
            }
        }
    }
}

function showReactionOptions(button) {
    const reactions = button.parentElement.querySelector('.reaction-buttons');
    reactions.style.display = 'flex';
    setTimeout(() => {
        reactions.style.display = 'none';
    }, 3000);
}

async function addReaction(videoId, reactionType) {
    // Send reaction to backend
    try {
        const response = await fetch(`/api/videos/${videoId}/reaction`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type: reactionType })
        });
        
        if (response.ok) {
            showNotification(`${getReactionEmoji(reactionType)} Reaction added!`, 'success');
        }
    } catch (error) {
        console.error('Reaction error:', error);
    }
}

function getReactionEmoji(type) {
    const emojis = {
        love: '❤️',
        laugh: '😂',
        surprise: '😮',
        sad: '😢',
        angry: '😠'
    };
    return emojis[type] || '❤️';
}

function animateLike(button) {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.style.cssText = `
        position: absolute;
        font-size: 30px;
        pointer-events: none;
        animation: likeAnimation 1s ease-out;
        z-index: 1000;
    `;
    button.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
}

// ================ DUET AND STITCH FEATURES ================
async function startDuet(videoId) {
    showNotification('Starting duet recording...', 'info');
    
    // Open duet recording interface
    const duetModal = document.createElement('div');
    duetModal.className = 'modal duet-modal';
    duetModal.innerHTML = `
        <div class="modal-content duet-content">
            <button class="close-btn" onclick="closeDuetModal()">&times;</button>
            <h3>Create Duet</h3>
            <div class="duet-container">
                <div class="original-video">
                    <video src="${await getVideoUrl(videoId)}" loop muted autoplay></video>
                    <div class="video-label">Original</div>
                </div>
                <div class="duet-recording">
                    <video id="duetRecordingPreview" muted></video>
                    <div class="video-label">Your Duet</div>
                    <div class="recording-controls">
                        <button class="record-btn" onclick="toggleDuetRecording()">🔴 Record</button>
                        <button class="flip-camera-btn" onclick="flipDuetCamera()">🔄</button>
                        <button class="timer-btn" onclick="setDuetTimer()">⏰</button>
                    </div>
                </div>
            </div>
            <div class="duet-effects">
                <button onclick="addDuetEffect('split')" class="effect-btn active">Split Screen</button>
                <button onclick="addDuetEffect('picture-in-picture')" class="effect-btn">Picture in Picture</button>
                <button onclick="addDuetEffect('green-screen')" class="effect-btn">Green Screen</button>
            </div>
            <div class="duet-actions">
                <button onclick="saveDuetDraft()" class="save-draft-btn">Save Draft</button>
                <button onclick="publishDuet()" class="publish-duet-btn">Publish Duet</button>
            </div>
        </div>
    `;
    document.body.appendChild(duetModal);
    duetModal.classList.add('show');
    
    // Initialize duet camera
    initializeDuetCamera();
}

async function startStitch(videoId) {
    showNotification('Starting stitch creation...', 'info');
    
    const stitchModal = document.createElement('div');
    stitchModal.className = 'modal stitch-modal';
    stitchModal.innerHTML = `
        <div class="modal-content stitch-content">
            <button class="close-btn" onclick="closeStitchModal()">&times;</button>
            <h3>Create Stitch</h3>
            <div class="stitch-timeline">
                <video id="stitchOriginalVideo" src="${await getVideoUrl(videoId)}" controls></video>
                <div class="timeline-selector">
                    <div class="timeline-track">
                        <div class="selection-area" draggable="true"></div>
                    </div>
                    <div class="time-display">
                        <span id="stitchStartTime">0:00</span> - <span id="stitchEndTime">0:05</span>
                    </div>
                </div>
            </div>
            <div class="stitch-recording">
                <video id="stitchRecordingPreview" muted></video>
                <div class="recording-controls">
                    <button class="record-btn" onclick="toggleStitchRecording()">🔴 Record Response</button>
                    <button class="flip-camera-btn" onclick="flipStitchCamera()">🔄</button>
                </div>
            </div>
            <div class="stitch-actions">
                <button onclick="previewStitch()" class="preview-btn">Preview</button>
                <button onclick="publishStitch()" class="publish-btn">Publish Stitch</button>
            </div>
        </div>
    `;
    document.body.appendChild(stitchModal);
    stitchModal.classList.add('show');
    
    initializeStitchInterface();
}

// ================ ADVANCED UPLOAD AND EDITING ================
function showUploadModal() {
    document.getElementById('uploadModal').classList.add('show');
    currentStep = 1;
    showUploadStep(1);
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('show');
}

function showUploadStep(step) {
    // Hide all steps
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`uploadStep${i}`).style.display = 'none';
    }
    // Show current step
    document.getElementById(`uploadStep${step}`).style.display = 'block';
    currentStep = step;
}

async function recordVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: 720, height: 1280 }, 
            audio: true 
        });
        
        // Open advanced video editor
        openAdvancedVideoEditor(stream);
    } catch (error) {
        showNotification('Camera access required to record video', 'error');
    }
}

function openAdvancedVideoEditor(stream) {
    const editorModal = document.createElement('div');
    editorModal.className = 'modal video-editor-modal';
    editorModal.innerHTML = `
        <div class="modal-content editor-content">
            <div class="editor-header">
                <button onclick="closeVideoEditor()" class="close-btn">&times;</button>
                <div class="editor-title">Video Editor</div>
                <button onclick="saveEditedVideo()" class="save-btn">Save</button>
            </div>
            
            <div class="editor-main">
                <div class="video-preview-area">
                    <video id="editorPreview" autoplay muted></video>
                    <canvas id="editorCanvas" style="display: none;"></canvas>
                    
                    <!-- Real-time Effects Overlay -->
                    <div class="effects-overlay">
                        <div class="effect-buttons">
                            <button onclick="toggleEffect('beauty')" class="effect-btn">✨ Beauty</button>
                            <button onclick="toggleEffect('blur')" class="effect-btn">🌫️ Blur BG</button>
                            <button onclick="toggleEffect('greenscreen')" class="effect-btn">🟢 Green Screen</button>
                        </div>
                    </div>
                    
                    <!-- Recording Controls -->
                    <div class="recording-controls">
                        <button id="recordButton" onclick="toggleRecording()" class="record-btn">🔴</button>
                        <button onclick="flipCamera()" class="flip-btn">🔄</button>
                        <button onclick="toggleFlash()" class="flash-btn">⚡</button>
                        <div class="timer-display">00:00</div>
                    </div>
                </div>
                
                <div class="editor-sidebar">
                    <!-- Filters -->
                    <div class="editor-section">
                        <h4>🎨 Filters</h4>
                        <div class="filter-grid">
                            <button onclick="applyFilter('normal')" class="filter-btn active">Normal</button>
                            <button onclick="applyFilter('vibrant')" class="filter-btn">Vibrant</button>
                            <button onclick="applyFilter('vintage')" class="filter-btn">Vintage</button>
                            <button onclick="applyFilter('bw')" class="filter-btn">B&W</button>
                            <button onclick="applyFilter('warm')" class="filter-btn">Warm</button>
                            <button onclick="applyFilter('cold')" class="filter-btn">Cold</button>
                            <button onclick="applyFilter('dramatic')" class="filter-btn">Dramatic</button>
                            <button onclick="applyFilter('film')" class="filter-btn">Film</button>
                        </div>
                    </div>
                    
                    <!-- Effects -->
                    <div class="editor-section">
                        <h4>✨ Effects</h4>
                        <div class="effects-grid">
                            <button onclick="addEffect('sparkle')" class="effect-btn">✨ Sparkle</button>
                            <button onclick="addEffect('hearts')" class="effect-btn">💕 Hearts</button>
                            <button onclick="addEffect('confetti')" class="effect-btn">🎉 Confetti</button>
                            <button onclick="addEffect('snow')" class="effect-btn">❄️ Snow</button>
                            <button onclick="addEffect('fire')" class="effect-btn">🔥 Fire</button>
                            <button onclick="addEffect('neon')" class="effect-btn">💡 Neon</button>
                        </div>
                    </div>
                    
                    <!-- Speed -->
                    <div class="editor-section">
                        <h4>⚡ Speed</h4>
                        <div class="speed-controls">
                            <button onclick="setSpeed(0.3)" class="speed-btn">0.3x</button>
                            <button onclick="setSpeed(0.5)" class="speed-btn">0.5x</button>
                            <button onclick="setSpeed(1)" class="speed-btn active">1x</button>
                            <button onclick="setSpeed(1.5)" class="speed-btn">1.5x</button>
                            <button onclick="setSpeed(2)" class="speed-btn">2x</button>
                            <button onclick="setSpeed(3)" class="speed-btn">3x</button>
                        </div>
                    </div>
                    
                    <!-- Text -->
                    <div class="editor-section">
                        <h4>📝 Text</h4>
                        <button onclick="addTextOverlay()" class="add-text-btn">+ Add Text</button>
                        <div class="text-styles">
                            <button onclick="setTextStyle('classic')" class="text-style-btn">Classic</button>
                            <button onclick="setTextStyle('bold')" class="text-style-btn">Bold</button>
                            <button onclick="setTextStyle('neon')" class="text-style-btn">Neon</button>
                            <button onclick="setTextStyle('handwritten')" class="text-style-btn">Handwritten</button>
                        </div>
                    </div>
                    
                    <!-- Music -->
                    <div class="editor-section">
                        <h4>🎵 Music</h4>
                        <button onclick="openMusicLibrary()" class="music-btn">Browse Sounds</button>
                        <button onclick="recordVoiceover()" class="voiceover-btn">🎤 Voice Over</button>
                        <div class="volume-controls">
                            <label>Original: </label>
                            <input type="range" min="0" max="100" value="50" onchange="setOriginalVolume(this.value)">
                            <label>Music: </label>
                            <input type="range" min="0" max="100" value="50" onchange="setMusicVolume(this.value)">
                        </div>
                    </div>
                    
                    <!-- Timer & Tools -->
                    <div class="editor-section">
                        <h4>⏰ Timer & Tools</h4>
                        <button onclick="setRecordingTimer(3)" class="timer-btn">3s Timer</button>
                        <button onclick="setRecordingTimer(10)" class="timer-btn">10s Timer</button>
                        <button onclick="toggleCountdown()" class="countdown-btn">Countdown</button>
                        <button onclick="toggleGridLines()" class="grid-btn">Grid Lines</button>
                    </div>
                </div>
            </div>
            
            <!-- Timeline Editor -->
            <div class="timeline-editor">
                <div class="timeline-tracks">
                    <div class="track video-track">
                        <label>Video</label>
                        <div class="track-content"></div>
                    </div>
                    <div class="track audio-track">
                        <label>Audio</label>
                        <div class="track-content"></div>
                    </div>
                    <div class="track effects-track">
                        <label>Effects</label>
                        <div class="track-content"></div>
                    </div>
                </div>
                <div class="timeline-controls">
                    <button onclick="trimVideo()" class="trim-btn">✂️ Trim</button>
                    <button onclick="splitVideo()" class="split-btn">🔪 Split</button>
                    <button onclick="mergeClips()" class="merge-btn">🔗 Merge</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(editorModal);
    editorModal.classList.add('show');
    
    // Initialize video editor
    initializeVideoEditor(stream);
}

// ================ MUSIC LIBRARY ================
function openMusicLibrary() {
    const musicModal = document.createElement('div');
    musicModal.className = 'modal music-library-modal';
    musicModal.innerHTML = `
        <div class="modal-content music-content">
            <div class="music-header">
                <button onclick="closeMusicLibrary()" class="close-btn">&times;</button>
                <h3>🎵 Music Library</h3>
                <input type="text" placeholder="Search sounds..." class="music-search" onkeyup="searchMusic(this.value)">
            </div>
            
            <div class="music-categories">
                <button onclick="filterMusic('trending')" class="category-btn active">🔥 Trending</button>
                <button onclick="filterMusic('original')" class="category-btn">🎤 Original</button>
                <button onclick="filterMusic('hiphop')" class="category-btn">🎯 Hip Hop</button>
                <button onclick="filterMusic('pop')" class="category-btn">🎊 Pop</button>
                <button onclick="filterMusic('electronic')" class="category-btn">⚡ Electronic</button>
                <button onclick="filterMusic('rb')" class="category-btn">🎵 R&B</button>
                <button onclick="filterMusic('rock')" class="category-btn">🎸 Rock</button>
                <button onclick="filterMusic('indie')" class="category-btn">🌈 Indie</button>
                <button onclick="filterMusic('classical')" class="category-btn">🎼 Classical</button>
                <button onclick="filterMusic('jazz')" class="category-btn">🎺 Jazz</button>
                <button onclick="filterMusic('country')" class="category-btn">🤠 Country</button>
                <button onclick="filterMusic('reggae')" class="category-btn">🌴 Reggae</button>
                <button onclick="filterMusic('effects')" class="category-btn">🔊 Effects</button>
                <button onclick="filterMusic('voiceover')" class="category-btn">🎤 Voice Over</button>
            </div>
            
            <div class="music-list" id="musicList">
                <!-- Music tracks will be loaded here -->
            </div>
        </div>
    `;
    
    document.body.appendChild(musicModal);
    musicModal.classList.add('show');
    
    loadMusicTracks('trending');
}

function loadMusicTracks(category) {
    const musicTracks = {
        trending: [
            { id: 1, name: "Viral Dance Beat", artist: "TrendyBeats", duration: "0:15", uses: "1.2M", preview: "trending1.mp3" },
            { id: 2, name: "Epic Moment", artist: "SoundWave", duration: "0:30", uses: "850K", preview: "trending2.mp3" },
            { id: 3, name: "Uplifting Vibes", artist: "VibeCreator", duration: "0:20", uses: "2.1M", preview: "trending3.mp3" }
        ],
        hiphop: [
            { id: 4, name: "Street Beats", artist: "UrbanFlow", duration: "0:25", uses: "500K", preview: "hiphop1.mp3" },
            { id: 5, name: "Rap Instrumental", artist: "BeatMaker", duration: "0:30", uses: "750K", preview: "hiphop2.mp3" }
        ],
        pop: [
            { id: 6, name: "Catchy Hook", artist: "PopStar", duration: "0:15", uses: "900K", preview: "pop1.mp3" },
            { id: 7, name: "Summer Vibes", artist: "Sunshine", duration: "0:20", uses: "1.5M", preview: "pop2.mp3" }
        ]
        // ... more categories
    };
    
    const musicList = document.getElementById('musicList');
    const tracks = musicTracks[category] || [];
    
    musicList.innerHTML = tracks.map(track => `
        <div class="music-track" onclick="selectMusic('${track.id}', '${track.name}', '${track.artist}')">
            <div class="track-info">
                <div class="track-name">${track.name}</div>
                <div class="track-artist">${track.artist} • ${track.duration}</div>
                <div class="track-uses">${track.uses} videos</div>
            </div>
            <div class="track-actions">
                <button onclick="playPreview('${track.preview}')" class="play-btn">▶️</button>
                <button onclick="favoriteTrack('${track.id}')" class="favorite-btn">🤍</button>
            </div>
        </div>
    `).join('');
}

// ================ LIVE STREAMING ================
function showPage(page) {
    if (page === 'live') {
        openLiveStreamSetup();
    }
    // Hide all pages first
    document.querySelectorAll('.video-feed, .search-page, .profile-page, .settings-page, .messages-page').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show specific page
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.style.display = 'block';
    }
}

function openLiveStreamSetup() {
    const liveModal = document.createElement('div');
    liveModal.className = 'modal live-stream-modal';
    liveModal.innerHTML = `
        <div class="modal-content live-content">
            <div class="live-header">
                <button onclick="closeLiveStream()" class="close-btn">&times;</button>
                <h3>📺 Go Live</h3>
            </div>
            
            <div class="live-setup">
                <div class="live-preview">
                    <video id="livePreview" autoplay muted></video>
                    <div class="live-overlay">
                        <div class="live-indicator">🔴 LIVE</div>
                        <div class="viewer-count">0 viewers</div>
                    </div>
                </div>
                
                <div class="live-settings">
                    <div class="setting-group">
                        <label>Stream Title</label>
                        <input type="text" id="streamTitle" placeholder="What's happening?" maxlength="100">
                    </div>
                    
                    <div class="setting-group">
                        <label>Category</label>
                        <select id="streamCategory">
                            <option value="just-chatting">Just Chatting</option>
                            <option value="music">Music</option>
                            <option value="gaming">Gaming</option>
                            <option value="art">Art & Creativity</option>
                            <option value="education">Educational</option>
                            <option value="lifestyle">Lifestyle</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="setting-group">
                        <label>Privacy</label>
                        <div class="privacy-options">
                            <label><input type="radio" name="privacy" value="public" checked> 🌍 Public</label>
                            <label><input type="radio" name="privacy" value="followers"> 👥 Followers Only</label>
                            <label><input type="radio" name="privacy" value="friends"> 👫 Friends Only</label>
                        </div>
                    </div>
                    
                    <div class="setting-group">
                        <label>Stream Quality</label>
                        <select id="streamQuality">
                            <option value="720p">720p HD</option>
                            <option value="1080p">1080p Full HD</option>
                            <option value="480p">480p (Data Saver)</option>
                        </select>
                    </div>
                    
                    <div class="live-actions">
                        <button onclick="startLiveStream()" class="go-live-btn">🔴 Go Live</button>
                        <button onclick="scheduleLiveStream()" class="schedule-btn">📅 Schedule</button>
                    </div>
                </div>
            </div>
            
            <!-- Live Chat Interface (when streaming) -->
            <div class="live-chat" id="liveChat" style="display: none;">
                <div class="chat-header">
                    <h4>Live Chat</h4>
                    <button onclick="toggleChatSettings()" class="chat-settings-btn">⚙️</button>
                </div>
                <div class="chat-messages" id="chatMessages"></div>
                <div class="chat-input">
                    <input type="text" placeholder="Say something..." onkeypress="if(event.key==='Enter') sendChatMessage(this.value)">
                    <button onclick="sendGift()" class="gift-btn">🎁</button>
                </div>
            </div>
            
            <!-- Gift Selection -->
            <div class="gift-selection" id="giftSelection" style="display: none;">
                <h4>Send Gift</h4>
                <div class="gifts-grid">
                    <div class="gift-item" onclick="sendSpecificGift('heart', 1)">
                        <div class="gift-icon">❤️</div>
                        <div class="gift-name">Heart</div>
                        <div class="gift-cost">1 coin</div>
                    </div>
                    <div class="gift-item" onclick="sendSpecificGift('star', 5)">
                        <div class="gift-icon">⭐</div>
                        <div class="gift-name">Star</div>
                        <div class="gift-cost">5 coins</div>
                    </div>
                    <div class="gift-item" onclick="sendSpecificGift('diamond', 10)">
                        <div class="gift-icon">💎</div>
                        <div class="gift-name">Diamond</div>
                        <div class="gift-cost">10 coins</div>
                    </div>
                    <div class="gift-item" onclick="sendSpecificGift('crown', 25)">
                        <div class="gift-icon">👑</div>
                        <div class="gift-name">Crown</div>
                        <div class="gift-cost">25 coins</div>
                    </div>
                    <div class="gift-item" onclick="sendSpecificGift('rocket', 50)">
                        <div class="gift-icon">🚀</div>
                        <div class="gift-name">Rocket</div>
                        <div class="gift-cost">50 coins</div>
                    </div>
                    <div class="gift-item" onclick="sendSpecificGift('unicorn', 100)">
                        <div class="gift-icon">🦄</div>
                        <div class="gift-name">Unicorn</div>
                        <div class="gift-cost">100 coins</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(liveModal);
    liveModal.classList.add('show');
    
    initializeLiveStream();
}

// ================ UTILITY FUNCTIONS ================
function formatCount(count) {
    if (count < 1000) return count.toString();
    if (count < 1000000) return (count / 1000).toFixed(1) + 'K';
    return (count / 1000000).toFixed(1) + 'M';
}

function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4ecdc4' : type === 'error' ? '#ff6b6b' : '#45b7d1'};
        color: white;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), duration);
}

function switchFeedTab(feedType) {
    loadVideoFeed(feedType);
}

function refreshForYou() {
    loadVideoFeed('foryou', true);
}

function performSearch(query) {
    // Advanced search implementation
    showNotification(`Searching for: ${query}`, 'info');
}

// ================ INITIALIZATION ================
document.addEventListener('DOMContentLoaded', function() {
    console.log('VIB3 Complete App Starting...');
    
    // Initialize authentication
    initializeAuth();
    
    // Add global CSS for animations
    addGlobalStyles();
    
    // Initialize all features
    console.log('All VIB3 features loaded successfully!');
});

function addGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes likeAnimation {
            0% { transform: scale(1) translateY(0); opacity: 1; }
            50% { transform: scale(1.5) translateY(-20px); opacity: 0.8; }
            100% { transform: scale(0) translateY(-40px); opacity: 0; }
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top-color: #ff6b6b;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .video-card {
            position: relative;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .action-btn {
            background: rgba(0,0,0,0.5);
            border: none;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            color: white;
            cursor: pointer;
            margin: 8px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        
        .action-btn:hover {
            background: rgba(0,0,0,0.7);
            transform: scale(1.1);
        }
        
        .reaction-buttons {
            position: absolute;
            left: -120px;
            top: 0;
            display: flex;
            gap: 8px;
            background: rgba(0,0,0,0.8);
            padding: 8px;
            border-radius: 25px;
        }
        
        .reaction-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 4px;
            border-radius: 50%;
            transition: transform 0.2s ease;
        }
        
        .reaction-btn:hover {
            transform: scale(1.2);
        }
    `;
    document.head.appendChild(style);
}

// Make all functions globally available
window.initializeAuth = initializeAuth;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleLogout = handleLogout;
window.showLogin = showLogin;
window.showSignup = showSignup;
window.loadUserProfile = loadUserProfile;
window.loadVideoFeed = loadVideoFeed;
window.switchFeedTab = switchFeedTab;
window.refreshForYou = refreshForYou;
window.performSearch = performSearch;
window.showPage = showPage;
window.showUploadModal = showUploadModal;
window.closeUploadModal = closeUploadModal;
window.recordVideo = recordVideo;
window.startDuet = startDuet;
window.startStitch = startStitch;
window.openMusicLibrary = openMusicLibrary;
window.handleAdvancedLike = handleAdvancedLike;
window.addReaction = addReaction;
window.showNotification = showNotification;