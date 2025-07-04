// Live Streaming Feature - vertical video live broadcasts
export class LiveStream {
    constructor() {
        this.isLive = false;
        this.stream = null;
        this.peerConnection = null;
        this.dataChannel = null;
        this.viewers = new Map();
        this.comments = [];
        this.gifts = [];
        this.streamId = null;
        
        this.config = {
            maxViewers: 1000,
            streamQuality: {
                width: 720,
                height: 1280,
                frameRate: 30,
                videoBitrate: 2500000,
                audioBitrate: 128000
            },
            rtcConfig: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        };

        this.streamSettings = {
            title: '',
            description: '',
            tags: [],
            category: 'General',
            allowComments: true,
            allowGifts: true,
            isPrivate: false
        };

        this.giftTypes = [
            { id: 'heart', name: '❤️ Heart', coins: 1 },
            { id: 'star', name: '⭐ Star', coins: 5 },
            { id: 'diamond', name: '💎 Diamond', coins: 10 },
            { id: 'crown', name: '👑 Crown', coins: 25 },
            { id: 'rocket', name: '🚀 Rocket', coins: 50 },
            { id: 'unicorn', name: '🦄 Unicorn', coins: 100 }
        ];
    }

    async initialize() {
        console.log('📺 Initializing Live Stream...');
        await this.setupWebRTC();
        this.setupUI();
        this.setupSignaling();
    }

    async setupWebRTC() {
        try {
            this.peerConnection = new RTCPeerConnection(this.config.rtcConfig);
            console.log('🔗 WebRTC initialized');
        } catch (error) {
            console.error('WebRTC setup failed:', error);
        }
    }

    setupSignaling() {
        // In a real implementation, this would connect to your signaling server
        // For now, we'll simulate the signaling
        console.log('📡 Signaling setup (simulated)');
    }

    setupUI() {
        const liveStreamHTML = `
            <!-- Live Stream Setup Modal -->
            <div id="liveStreamSetup" class="live-stream-modal" style="display: none;">
                <div class="stream-setup-container">
                    <div class="setup-header">
                        <button class="setup-back-btn">←</button>
                        <h2>Go Live</h2>
                        <button class="setup-close-btn">×</button>
                    </div>
                    
                    <div class="setup-content">
                        <div class="camera-preview">
                            <video id="setupPreview" class="preview-video" autoplay muted></video>
                            <div class="preview-controls">
                                <button id="flipCameraBtn" class="preview-btn">📷</button>
                                <button id="toggleMicBtn" class="preview-btn">🎤</button>
                                <button id="addFiltersBtn" class="preview-btn">✨</button>
                            </div>
                        </div>
                        
                        <div class="stream-settings">
                            <div class="setting-group">
                                <label>Stream Title</label>
                                <input type="text" id="streamTitle" placeholder="What's happening?" maxlength="100">
                            </div>
                            
                            <div class="setting-group">
                                <label>Category</label>
                                <select id="streamCategory">
                                    <option value="General">General</option>
                                    <option value="Music">Music</option>
                                    <option value="Gaming">Gaming</option>
                                    <option value="Education">Education</option>
                                    <option value="Cooking">Cooking</option>
                                    <option value="Fitness">Fitness</option>
                                    <option value="Art">Art</option>
                                    <option value="Travel">Travel</option>
                                </select>
                            </div>
                            
                            <div class="setting-group">
                                <label>Tags</label>
                                <input type="text" id="streamTags" placeholder="#hashtags (comma separated)">
                            </div>
                            
                            <div class="setting-toggles">
                                <div class="toggle-item">
                                    <input type="checkbox" id="allowComments" checked>
                                    <label for="allowComments">Allow Comments</label>
                                </div>
                                <div class="toggle-item">
                                    <input type="checkbox" id="allowGifts" checked>
                                    <label for="allowGifts">Allow Gifts</label>
                                </div>
                                <div class="toggle-item">
                                    <input type="checkbox" id="privateStream">
                                    <label for="privateStream">Private Stream</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="setup-footer">
                        <button id="startLiveBtn" class="start-live-btn">Go Live</button>
                    </div>
                </div>
            </div>

            <!-- Live Stream Interface -->
            <div id="liveStreamInterface" class="live-stream-interface" style="display: none;">
                <div class="stream-container">
                    <div class="stream-video-container">
                        <video id="liveVideo" class="live-video" autoplay muted></video>
                        
                        <div class="stream-overlay">
                            <div class="stream-info">
                                <div class="live-indicator">
                                    <div class="live-dot"></div>
                                    <span>LIVE</span>
                                </div>
                                <div class="viewer-count">
                                    <span id="viewerCount">0</span>
                                    <span>viewers</span>
                                </div>
                            </div>
                            
                            <div class="stream-controls">
                                <button id="endStreamBtn" class="end-stream-btn">End</button>
                                <button id="streamSettingsBtn" class="stream-control-btn">⚙️</button>
                                <button id="shareStreamBtn" class="stream-control-btn">📤</button>
                            </div>
                        </div>
                        
                        <div class="gifts-animation-area" id="giftsArea"></div>
                    </div>
                    
                    <div class="stream-sidebar">
                        <div class="sidebar-tabs">
                            <button class="sidebar-tab active" data-tab="comments">💬</button>
                            <button class="sidebar-tab" data-tab="viewers">👥</button>
                            <button class="sidebar-tab" data-tab="gifts">🎁</button>
                        </div>
                        
                        <div class="sidebar-content">
                            <!-- Comments Tab -->
                            <div class="sidebar-panel active" id="commentsPanel">
                                <div class="comments-list" id="liveComments"></div>
                                <div class="comment-input">
                                    <input type="text" id="commentInput" placeholder="Say something..." maxlength="200">
                                    <button id="sendCommentBtn">Send</button>
                                </div>
                            </div>
                            
                            <!-- Viewers Tab -->
                            <div class="sidebar-panel" id="viewersPanel">
                                <div class="viewers-list" id="viewersList"></div>
                            </div>
                            
                            <!-- Gifts Tab -->
                            <div class="sidebar-panel" id="giftsPanel">
                                <div class="gifts-grid">
                                    ${this.giftTypes.map(gift => `
                                        <button class="gift-btn" data-gift-id="${gift.id}">
                                            <div class="gift-icon">${gift.name.split(' ')[0]}</div>
                                            <div class="gift-cost">${gift.coins}</div>
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Live Stream Viewer Interface -->
            <div id="liveStreamViewer" class="live-stream-viewer" style="display: none;">
                <div class="viewer-container">
                    <div class="viewer-video-container">
                        <video id="viewerVideo" class="viewer-video" autoplay></video>
                        
                        <div class="viewer-overlay">
                            <div class="streamer-info">
                                <div class="streamer-avatar">
                                    <img id="streamerAvatar" src="" alt="Streamer">
                                </div>
                                <div class="streamer-details">
                                    <div class="streamer-name" id="streamerName"></div>
                                    <div class="stream-title" id="viewerStreamTitle"></div>
                                </div>
                                <button id="followStreamerBtn" class="follow-btn">Follow</button>
                            </div>
                            
                            <div class="viewer-controls">
                                <button id="leaveStreamBtn" class="leave-stream-btn">Leave</button>
                                <button id="muteStreamBtn" class="viewer-control-btn">🔊</button>
                                <button id="shareStreamViewerBtn" class="viewer-control-btn">📤</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="viewer-sidebar">
                        <div class="viewer-sidebar-tabs">
                            <button class="viewer-sidebar-tab active" data-tab="chat">💬</button>
                            <button class="viewer-sidebar-tab" data-tab="send-gift">🎁</button>
                        </div>
                        
                        <div class="viewer-sidebar-content">
                            <!-- Chat Tab -->
                            <div class="viewer-sidebar-panel active" id="chatPanel">
                                <div class="viewer-comments-list" id="viewerComments"></div>
                                <div class="viewer-comment-input">
                                    <input type="text" id="viewerCommentInput" placeholder="Say something..." maxlength="200">
                                    <button id="sendViewerCommentBtn">Send</button>
                                </div>
                            </div>
                            
                            <!-- Send Gift Tab -->
                            <div class="viewer-sidebar-panel" id="sendGiftPanel">
                                <div class="viewer-gifts-grid">
                                    ${this.giftTypes.map(gift => `
                                        <button class="viewer-gift-btn" data-gift-id="${gift.id}">
                                            <div class="gift-icon">${gift.name.split(' ')[0]}</div>
                                            <div class="gift-name">${gift.name.split(' ').slice(1).join(' ')}</div>
                                            <div class="gift-cost">${gift.coins} coins</div>
                                        </button>
                                    `).join('')}
                                </div>
                                <div class="coins-balance">
                                    <span>Your balance: </span>
                                    <span id="userCoins">0</span>
                                    <span> coins</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', liveStreamHTML);
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Setup modal controls
        document.querySelector('.setup-back-btn').addEventListener('click', () => {
            this.closeSetup();
        });

        document.querySelector('.setup-close-btn').addEventListener('click', () => {
            this.closeSetup();
        });

        // Preview controls
        document.getElementById('flipCameraBtn').addEventListener('click', () => {
            this.flipCamera();
        });

        document.getElementById('toggleMicBtn').addEventListener('click', () => {
            this.toggleMicrophone();
        });

        // Start live button
        document.getElementById('startLiveBtn').addEventListener('click', () => {
            this.startLiveStream();
        });

        // Stream controls
        document.getElementById('endStreamBtn').addEventListener('click', () => {
            this.endStream();
        });

        // Sidebar tabs
        document.querySelectorAll('.sidebar-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchSidebarTab(e.target.dataset.tab);
            });
        });

        // Comments
        document.getElementById('sendCommentBtn').addEventListener('click', () => {
            this.sendComment();
        });

        document.getElementById('commentInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendComment();
            }
        });

        // Gifts
        document.querySelectorAll('.gift-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const giftId = e.currentTarget.dataset.giftId;
                this.sendGift(giftId);
            });
        });

        // Viewer controls
        document.getElementById('leaveStreamBtn').addEventListener('click', () => {
            this.leaveStream();
        });

        document.getElementById('sendViewerCommentBtn').addEventListener('click', () => {
            this.sendViewerComment();
        });

        // Viewer gifts
        document.querySelectorAll('.viewer-gift-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const giftId = e.currentTarget.dataset.giftId;
                this.sendViewerGift(giftId);
            });
        });
    }

    // Setup Functions
    async openSetup() {
        document.getElementById('liveStreamSetup').style.display = 'flex';
        await this.setupPreview();
    }

    async setupPreview() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: this.config.streamQuality.width,
                    height: this.config.streamQuality.height,
                    frameRate: this.config.streamQuality.frameRate,
                    facingMode: 'user'
                },
                audio: true
            });

            const previewVideo = document.getElementById('setupPreview');
            previewVideo.srcObject = this.stream;
            
            console.log('📹 Camera preview setup');
        } catch (error) {
            console.error('Failed to setup camera preview:', error);
        }
    }

    closeSetup() {
        document.getElementById('liveStreamSetup').style.display = 'none';
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }

    // Streaming Functions
    async startLiveStream() {
        try {
            // Get stream settings
            this.streamSettings.title = document.getElementById('streamTitle').value || 'Live Stream';
            this.streamSettings.category = document.getElementById('streamCategory').value;
            this.streamSettings.tags = document.getElementById('streamTags').value.split(',').map(tag => tag.trim());
            this.streamSettings.allowComments = document.getElementById('allowComments').checked;
            this.streamSettings.allowGifts = document.getElementById('allowGifts').checked;
            this.streamSettings.isPrivate = document.getElementById('privateStream').checked;

            // Generate stream ID
            this.streamId = 'stream_' + Date.now();

            // Close setup and open live interface
            this.closeSetup();
            document.getElementById('liveStreamInterface').style.display = 'flex';

            // Setup live video
            const liveVideo = document.getElementById('liveVideo');
            liveVideo.srcObject = this.stream;

            this.isLive = true;
            this.startTime = Date.now();

            // Start stream broadcasting (simulated)
            this.startBroadcast();

            console.log('🔴 Live stream started:', this.streamId);

            // Notify followers (simulated)
            this.notifyFollowers();

        } catch (error) {
            console.error('Failed to start live stream:', error);
        }
    }

    async startBroadcast() {
        // In a real implementation, this would connect to streaming server
        // For now, we'll simulate the broadcast
        console.log('📡 Broadcasting started');
        
        // Simulate viewers joining
        setTimeout(() => {
            this.simulateViewer('user123', 'User123');
        }, 5000);
        
        setTimeout(() => {
            this.simulateViewer('user456', 'User456');
        }, 10000);
    }

    simulateViewer(userId, username) {
        this.viewers.set(userId, {
            id: userId,
            username: username,
            joinTime: Date.now(),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        });

        this.updateViewerCount();
        this.updateViewersList();

        // Simulate viewer comment
        setTimeout(() => {
            this.receiveComment(userId, username, 'Hey! Great stream! 👍');
        }, 2000);
    }

    endStream() {
        if (!this.isLive) return;

        this.isLive = false;
        
        // Stop all tracks
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }

        // Close peer connections
        if (this.peerConnection) {
            this.peerConnection.close();
        }

        // Show stream summary
        this.showStreamSummary();

        // Close interface
        document.getElementById('liveStreamInterface').style.display = 'none';

        console.log('🔴 Live stream ended');
    }

    showStreamSummary() {
        const duration = Math.floor((Date.now() - this.startTime) / 1000);
        const maxViewers = Math.max(...Array.from(this.viewers.values()).map(v => 1));
        const totalComments = this.comments.length;
        const totalGifts = this.gifts.length;

        alert(`Stream Summary:
Duration: ${this.formatDuration(duration)}
Peak Viewers: ${maxViewers}
Comments: ${totalComments}
Gifts Received: ${totalGifts}`);
    }

    // Comment Functions
    sendComment() {
        const input = document.getElementById('commentInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Simulate sending comment (in real app, this would go to server)
        const comment = {
            id: Date.now(),
            userId: 'streamer',
            username: 'You',
            message: message,
            timestamp: Date.now(),
            isStreamer: true
        };

        this.comments.push(comment);
        this.displayComment(comment);
        
        input.value = '';
    }

    receiveComment(userId, username, message) {
        const comment = {
            id: Date.now(),
            userId: userId,
            username: username,
            message: message,
            timestamp: Date.now(),
            isStreamer: false
        };

        this.comments.push(comment);
        this.displayComment(comment);
    }

    displayComment(comment) {
        const commentsList = document.getElementById('liveComments');
        const commentElement = document.createElement('div');
        commentElement.className = `comment ${comment.isStreamer ? 'streamer-comment' : ''}`;
        
        commentElement.innerHTML = `
            <div class="comment-header">
                <span class="comment-username">${comment.username}</span>
                <span class="comment-time">${this.formatTime(comment.timestamp)}</span>
            </div>
            <div class="comment-message">${comment.message}</div>
        `;

        commentsList.appendChild(commentElement);
        commentsList.scrollTop = commentsList.scrollHeight;

        // Auto-remove old comments to prevent overflow
        while (commentsList.children.length > 100) {
            commentsList.removeChild(commentsList.firstChild);
        }
    }

    // Gift Functions
    sendGift(giftId) {
        const gift = this.giftTypes.find(g => g.id === giftId);
        if (!gift) return;

        // Simulate gift animation
        this.animateGift(gift);

        // Add to gifts list
        this.gifts.push({
            id: Date.now(),
            giftId: giftId,
            from: 'viewer',
            timestamp: Date.now()
        });

        console.log('🎁 Gift received:', gift.name);
    }

    animateGift(gift) {
        const giftsArea = document.getElementById('giftsArea');
        if (!giftsArea) return;
        
        const giftElement = document.createElement('div');
        giftElement.className = 'gift-animation';
        giftElement.textContent = gift.name.split(' ')[0];
        
        // Random position and safe CSS property assignment
        giftElement.style.left = Math.random() * 80 + 10 + '%';
        giftElement.style.animationDuration = '3s';
        giftElement.style.animationName = 'floatUp';
        giftElement.style.animationTimingFunction = 'ease-out';
        giftElement.style.animationFillMode = 'forwards';
        
        giftsArea.appendChild(giftElement);

        // Remove after animation
        setTimeout(() => {
            if (giftElement.parentNode) {
                giftElement.parentNode.removeChild(giftElement);
            }
        }, 3000);
    }

    // Viewer Functions
    updateViewerCount() {
        document.getElementById('viewerCount').textContent = this.viewers.size;
    }

    updateViewersList() {
        const viewersList = document.getElementById('viewersList');
        viewersList.innerHTML = '';

        this.viewers.forEach(viewer => {
            const viewerElement = document.createElement('div');
            viewerElement.className = 'viewer-item';
            viewerElement.innerHTML = `
                <div class="viewer-avatar">
                    <img src="${viewer.avatar}" alt="${viewer.username}">
                </div>
                <div class="viewer-info">
                    <div class="viewer-name">${viewer.username}</div>
                    <div class="viewer-join-time">Joined ${this.formatTime(viewer.joinTime)}</div>
                </div>
            `;
            viewersList.appendChild(viewerElement);
        });
    }

    switchSidebarTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.sidebar-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab panels
        document.querySelectorAll('.sidebar-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}Panel`);
        });
    }

    // Viewer Interface Functions
    joinStream(streamId, streamerData) {
        document.getElementById('liveStreamViewer').style.display = 'flex';
        
        // Update streamer info
        document.getElementById('streamerName').textContent = streamerData.username;
        document.getElementById('viewerStreamTitle').textContent = streamerData.streamTitle;
        document.getElementById('streamerAvatar').src = streamerData.avatar;

        // Connect to stream (simulated)
        this.connectToStream(streamId);
    }

    connectToStream(streamId) {
        // In real implementation, this would connect to the stream
        console.log('📺 Connected to stream:', streamId);
    }

    leaveStream() {
        document.getElementById('liveStreamViewer').style.display = 'none';
        console.log('👋 Left stream');
    }

    sendViewerComment() {
        const input = document.getElementById('viewerCommentInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Send comment to stream (simulated)
        console.log('💬 Viewer comment sent:', message);
        input.value = '';
    }

    sendViewerGift(giftId) {
        const gift = this.giftTypes.find(g => g.id === giftId);
        if (!gift) return;

        // Check if user has enough coins (simulated)
        const userCoins = parseInt(document.getElementById('userCoins').textContent);
        if (userCoins < gift.coins) {
            alert('Not enough coins!');
            return;
        }

        // Send gift (simulated)
        console.log('🎁 Gift sent:', gift.name);
        
        // Update coins
        document.getElementById('userCoins').textContent = userCoins - gift.coins;
    }

    // Utility Functions
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    async flipCamera() {
        // Implementation for camera flipping
        console.log('📷 Flipping camera');
    }

    toggleMicrophone() {
        if (this.stream) {
            const audioTrack = this.stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                document.getElementById('toggleMicBtn').textContent = audioTrack.enabled ? '🎤' : '🎤❌';
            }
        }
    }

    notifyFollowers() {
        // In real implementation, this would send push notifications to followers
        console.log('📢 Notifying followers about live stream');
    }

    // Public API
    isStreaming() {
        return this.isLive;
    }

    getStreamInfo() {
        return {
            id: this.streamId,
            title: this.streamSettings.title,
            category: this.streamSettings.category,
            viewerCount: this.viewers.size,
            startTime: this.startTime,
            isLive: this.isLive
        };
    }
}

// Global access
window.startLiveStream = function() {
    if (window.VIB3 && window.VIB3.getModule('liveStream')) {
        window.VIB3.getModule('liveStream').openSetup();
    }
};

export default LiveStream;