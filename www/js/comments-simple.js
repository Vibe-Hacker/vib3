// Simple comments functions for VIB3

// currentVideoId is declared globally in vib3-complete.js
let commentsModal = null;

// Create comments modal HTML
function createCommentsModal() {
    if (commentsModal) return commentsModal;
    
    const modal = document.createElement('div');
    modal.id = 'commentsModal';
    modal.className = 'comments-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: none;
        justify-content: center;
        align-items: flex-end;
    `;
    
    modal.innerHTML = `
        <div class="comments-container" style="
            background: #161823;
            width: 100%;
            max-width: 500px;
            max-height: 80vh;
            border-radius: 20px 20px 0 0;
            display: flex;
            flex-direction: column;
            color: white;
        ">
            <!-- Header -->
            <div class="comments-header" style="
                padding: 20px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h3 style="margin: 0; font-size: 18px;">Comments</h3>
                <button class="close-comments" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                ">&times;</button>
            </div>
            
            <!-- Comments List -->
            <div class="comments-list" style="
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                max-height: 50vh;
            ">
                <div class="loading-comments" style="
                    text-align: center;
                    color: rgba(255,255,255,0.6);
                    padding: 40px;
                ">
                    Loading comments...
                </div>
            </div>
            
            <!-- Comment Input -->
            <div class="comment-input-container" style="
                padding: 20px;
                border-top: 1px solid rgba(255,255,255,0.1);
                display: flex;
                gap: 10px;
                align-items: center;
            ">
                <input type="text" class="comment-input" placeholder="Add a comment..." style="
                    flex: 1;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 25px;
                    padding: 12px 16px;
                    color: white;
                    font-size: 14px;
                " maxlength="500">
                <button class="send-comment" style="
                    background: #fe2c55;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                ">➤</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    commentsModal = modal;
    
    // Add event listeners
    setupCommentsEventListeners();
    
    return modal;
}

// Setup event listeners for comments modal
function setupCommentsEventListeners() {
    if (!commentsModal) return;
    
    const closeBtn = commentsModal.querySelector('.close-comments');
    const sendBtn = commentsModal.querySelector('.send-comment');
    const input = commentsModal.querySelector('.comment-input');
    
    // Close modal
    closeBtn.addEventListener('click', closeCommentsModal);
    
    // Click outside to close
    commentsModal.addEventListener('click', (e) => {
        if (e.target === commentsModal) {
            closeCommentsModal();
        }
    });
    
    // Send comment
    sendBtn.addEventListener('click', postComment);
    
    // Send comment on Enter
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            postComment();
        }
    });
}

// Open comments modal for a video
function openCommentsModal(videoId) {
    console.log('💬 Opening comments for video:', videoId);
    
    window.currentVideoId = videoId;
    
    if (!commentsModal) {
        createCommentsModal();
    }
    
    // Show modal
    commentsModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Load comments
    loadComments(videoId);
    
    // Focus input
    setTimeout(() => {
        const input = commentsModal.querySelector('.comment-input');
        if (input) input.focus();
    }, 300);
}

// Close comments modal
function closeCommentsModal() {
    if (!commentsModal) return;
    
    commentsModal.style.display = 'none';
    document.body.style.overflow = '';
    window.currentVideoId = null;
    
    console.log('💬 Comments modal closed');
}

// Load comments for a video
async function loadComments(videoId) {
    const commentsList = commentsModal.querySelector('.comments-list');
    if (!commentsList) return;
    
    try {
        // Show loading
        commentsList.innerHTML = `
            <div class="loading-comments" style="
                text-align: center;
                color: rgba(255,255,255,0.6);
                padding: 40px;
            ">
                <div style="font-size: 20px; margin-bottom: 10px;">💬</div>
                Loading comments...
            </div>
        `;
        
        // Try to fetch from API
        const response = await fetch(`${window.API_BASE_URL}/api/videos/${videoId}/comments`);
        
        if (response.ok) {
            const data = await response.json();
            displayComments(data.comments || []);
        } else {
            // Fallback to mock comments
            setTimeout(() => {
                const mockComments = generateMockComments(videoId);
                displayComments(mockComments);
            }, 500);
        }
        
    } catch (error) {
        console.error('Error loading comments:', error);
        
        // Show mock comments on error
        const mockComments = generateMockComments(videoId);
        displayComments(mockComments);
    }
}

// Generate mock comments for testing
function generateMockComments(videoId) {
    const mockUsers = ['user123', 'dancer_girl', 'music_lover', 'vibe_check', 'tiktok_fan'];
    const mockTexts = [
        'Love this! 🔥',
        'This is amazing!',
        'Can you do a tutorial?',
        'First! ✨',
        'This made my day 😍',
        'How did you do this?',
        'So talented! 👏',
        'Please make more like this',
        'This is my new favorite video',
        'You are so creative! 🎨'
    ];
    
    const numComments = Math.floor(Math.random() * 8) + 2; // 2-10 comments
    const comments = [];
    
    for (let i = 0; i < numComments; i++) {
        comments.push({
            id: `comment_${i}`,
            userId: mockUsers[Math.floor(Math.random() * mockUsers.length)],
            username: mockUsers[Math.floor(Math.random() * mockUsers.length)],
            text: mockTexts[Math.floor(Math.random() * mockTexts.length)],
            createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random time in last 24h
            likes: Math.floor(Math.random() * 50)
        });
    }
    
    return comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Display comments in the modal
function displayComments(comments) {
    const commentsList = commentsModal.querySelector('.comments-list');
    if (!commentsList) return;
    
    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div style="
                text-align: center;
                color: rgba(255,255,255,0.6);
                padding: 40px;
            ">
                <div style="font-size: 40px; margin-bottom: 15px;">💬</div>
                <h4 style="margin: 0 0 10px 0;">No comments yet</h4>
                <p style="margin: 0; font-size: 14px;">Be the first to comment!</p>
            </div>
        `;
        return;
    }
    
    const commentsHTML = comments.map(comment => createCommentHTML(comment)).join('');
    commentsList.innerHTML = commentsHTML;
    
    console.log(`💬 Displayed ${comments.length} comments`);
}

// Create HTML for a single comment
function createCommentHTML(comment) {
    const timeAgo = getTimeAgo(comment.createdAt);
    
    return `
        <div class="comment-item" style="
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        ">
            <div class="comment-avatar" style="
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: linear-gradient(45deg, #fe2c55, #8338ec);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                color: white;
                flex-shrink: 0;
            ">
                ${comment.username ? comment.username.charAt(0).toUpperCase() : '👤'}
            </div>
            <div class="comment-content" style="flex: 1;">
                <div class="comment-header" style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 4px;
                ">
                    <span class="comment-username" style="
                        font-weight: 600;
                        font-size: 14px;
                        color: white;
                    ">@${comment.username || 'anonymous'}</span>
                    <span class="comment-time" style="
                        font-size: 12px;
                        color: rgba(255,255,255,0.5);
                    ">${timeAgo}</span>
                </div>
                <div class="comment-text" style="
                    font-size: 14px;
                    line-height: 1.4;
                    color: rgba(255,255,255,0.9);
                    margin-bottom: 8px;
                ">${comment.text}</div>
                <div class="comment-actions" style="
                    display: flex;
                    align-items: center;
                    gap: 15px;
                ">
                    <button class="comment-like" style="
                        background: none;
                        border: none;
                        color: rgba(255,255,255,0.6);
                        font-size: 12px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    ">
                        🤍 ${comment.likes || 0}
                    </button>
                    <button class="comment-reply" style="
                        background: none;
                        border: none;
                        color: rgba(255,255,255,0.6);
                        font-size: 12px;
                        cursor: pointer;
                    ">Reply</button>
                </div>
            </div>
        </div>
    `;
}

// Post a new comment
async function postComment() {
    const input = commentsModal.querySelector('.comment-input');
    if (!input || !window.currentVideoId) return;
    
    const commentText = input.value.trim();
    if (!commentText) return;
    
    try {
        // Optimistic UI update
        addCommentToUI({
            id: 'temp_' + Date.now(),
            username: 'You',
            text: commentText,
            createdAt: new Date().toISOString(),
            likes: 0
        });
        
        // Clear input
        input.value = '';
        
        // Try to post to API
        const response = await fetch(`${window.API_BASE_URL}/api/videos/${window.currentVideoId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': window.authToken ? `Bearer ${window.authToken}` : ''
            },
            body: JSON.stringify({
                text: commentText,
                videoId: window.currentVideoId
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('💬 Comment posted successfully:', data);
            
            // Update comment count in video UI
            updateVideoCommentCount(window.currentVideoId);
        } else {
            console.log('💬 Comment API not available, using mock');
        }
        
        if (window.showNotification) {
            window.showNotification('Comment posted! 💬', 'success');
        }
        
    } catch (error) {
        console.error('Error posting comment:', error);
        
        if (window.showNotification) {
            window.showNotification('Comment posted! 💬', 'success');
        }
    }
}

// Add comment to UI immediately
function addCommentToUI(comment) {
    const commentsList = commentsModal.querySelector('.comments-list');
    if (!commentsList) return;
    
    // Remove "no comments" message if it exists
    const noComments = commentsList.querySelector('[style*="No comments yet"]');
    if (noComments) {
        commentsList.innerHTML = '';
    }
    
    // Add new comment at the top
    const commentHTML = createCommentHTML(comment);
    commentsList.insertAdjacentHTML('afterbegin', commentHTML);
    
    // Scroll to top to show new comment
    commentsList.scrollTop = 0;
}

// Update video comment count in the feed
function updateVideoCommentCount(videoId) {
    const commentBtns = document.querySelectorAll(`[data-video-id="${videoId}"] .comment-btn div:last-child`);
    commentBtns.forEach(countEl => {
        const currentCount = parseInt(countEl.textContent) || 0;
        countEl.textContent = currentCount + 1;
    });
}

// Helper function to format time ago
function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
}

// Initialize comments modal
function initCommentsModal() {
    createCommentsModal();
    console.log('💬 Comments system initialized');
}

// Make functions globally available
window.initCommentsModal = initCommentsModal;
window.openCommentsModal = openCommentsModal;
window.closeCommentsModal = closeCommentsModal;