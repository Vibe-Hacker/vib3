// Comments module
import { db } from './firebase-init.js';
import { 
    doc, 
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getCurrentUser, getUserData } from './auth.js';
import { showNotification, formatDate, generateId } from './utils.js';

let commentsModal = null;
let currentVideoId = null;

// Initialize comments modal
export function initCommentsModal() {
    // Create comments modal if it doesn't exist
    if (!document.getElementById('commentsModal')) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'commentsModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 class="modal-title">Comments</h2>
                    <button class="close-btn" onclick="window.closeModal('commentsModal')">&times;</button>
                </div>
                <div id="commentsContainer" style="max-height: 400px; overflow-y: auto; margin-bottom: 20px;">
                    <!-- Comments will be loaded here -->
                </div>
                <div id="commentInput" style="display: none;">
                    <form id="commentForm" style="display: flex; gap: 10px;">
                        <input type="text" 
                               id="commentText" 
                               class="form-input" 
                               placeholder="Add a comment..." 
                               style="flex: 1;"
                               maxlength="500">
                        <button type="submit" class="btn btn-primary" style="width: auto;">Post</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add event listener for comment form
        const commentForm = document.getElementById('commentForm');
        commentForm.addEventListener('submit', handleCommentSubmit);
    }
    
    commentsModal = document.getElementById('commentsModal');
}

// Show comments for a video
export async function showComments(videoId) {
    if (!commentsModal) initCommentsModal();
    
    currentVideoId = videoId;
    const currentUser = getCurrentUser();
    const commentsContainer = document.getElementById('commentsContainer');
    const commentInput = document.getElementById('commentInput');
    
    // Show/hide comment input based on auth status
    commentInput.style.display = currentUser ? 'block' : 'none';
    
    // Show loading state
    commentsContainer.innerHTML = '<div style="text-align: center; padding: 40px;">Loading comments...</div>';
    
    // Open modal
    window.openModal('commentsModal');
    
    try {
        // Get video data
        const videoRef = doc(db, 'videos', videoId);
        const videoDoc = await getDoc(videoRef);
        
        if (!videoDoc.exists()) {
            throw new Error('Video not found');
        }
        
        const videoData = videoDoc.data();
        const comments = videoData.comments || [];
        
        if (comments.length === 0) {
            commentsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.7);">
                    <div style="font-size: 48px; margin-bottom: 20px;">💬</div>
                    <h3>No comments yet</h3>
                    <p>Be the first to comment on this video!</p>
                </div>
            `;
        } else {
            // Sort comments by date (newest first)
            comments.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB - dateA;
            });
            
            // Display comments
            commentsContainer.innerHTML = await renderComments(comments);
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.7);">
                <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <h3>Error loading comments</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Render comments HTML
async function renderComments(comments) {
    const currentUser = getCurrentUser();
    let html = '';
    
    for (const comment of comments) {
        const userData = await getUserData(comment.userId);
        const username = userData?.username || 'Deleted User';
        const isOwner = currentUser && currentUser.uid === comment.userId;
        const isLiked = currentUser && comment.likes?.includes(currentUser.uid);
        
        html += `
            <div class="comment-item" style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; gap: 15px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">
                        ${username.charAt(0).toUpperCase()}
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                            <span style="font-weight: 600;">@${username}</span>
                            <span style="font-size: 12px; color: rgba(255,255,255,0.5);">
                                ${formatDate(comment.createdAt)}
                            </span>
                        </div>
                        <p style="margin: 0 0 10px 0; line-height: 1.4;">${comment.text}</p>
                        <div style="display: flex; gap: 20px; align-items: center;">
                            <button class="comment-action ${isLiked ? 'liked' : ''}" 
                                    onclick="window.toggleCommentLike('${comment.id}')"
                                    style="background: none; border: none; color: ${isLiked ? '#ff6b6b' : 'rgba(255,255,255,0.7)'}; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 5px;">
                                ❤️ ${comment.likes?.length || 0}
                            </button>
                            ${isOwner ? `
                                <button class="comment-action" 
                                        onclick="window.deleteComment('${comment.id}')"
                                        style="background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 14px;">
                                    🗑️ Delete
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    return html;
}

// Handle comment submission
async function handleCommentSubmit(e) {
    e.preventDefault();
    
    const commentText = document.getElementById('commentText').value.trim();
    if (!commentText) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Please login to comment', 'info');
        return;
    }
    
    // Disable form while submitting
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Posting...';
    
    try {
        const videoRef = doc(db, 'videos', currentVideoId);
        const comment = {
            id: generateId(),
            userId: currentUser.uid,
            text: commentText,
            createdAt: new Date(),
            likes: []
        };
        
        await updateDoc(videoRef, {
            comments: arrayUnion(comment)
        });
        
        // Clear input
        document.getElementById('commentText').value = '';
        
        // Reload comments
        await showComments(currentVideoId);
        
        showNotification('✅ Comment posted!', 'success');
        
        // Update comment count in the video card
        updateVideoCommentCount(currentVideoId, 1);
        
    } catch (error) {
        console.error('Error posting comment:', error);
        showNotification('❌ Failed to post comment', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// Toggle comment like
window.toggleCommentLike = async function(commentId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Please login to like comments', 'info');
        return;
    }
    
    try {
        const videoRef = doc(db, 'videos', currentVideoId);
        const videoDoc = await getDoc(videoRef);
        
        if (!videoDoc.exists()) return;
        
        const videoData = videoDoc.data();
        const comments = videoData.comments || [];
        
        // Find and update the comment
        const updatedComments = comments.map(comment => {
            if (comment.id === commentId) {
                const likes = comment.likes || [];
                const isLiked = likes.includes(currentUser.uid);
                
                if (isLiked) {
                    comment.likes = likes.filter(uid => uid !== currentUser.uid);
                } else {
                    comment.likes = [...likes, currentUser.uid];
                }
            }
            return comment;
        });
        
        // Update the video document
        await updateDoc(videoRef, {
            comments: updatedComments
        });
        
        // Reload comments
        await showComments(currentVideoId);
        
    } catch (error) {
        console.error('Error toggling comment like:', error);
        showNotification('❌ Failed to update like', 'error');
    }
};

// Delete comment
window.deleteComment = async function(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
        const videoRef = doc(db, 'videos', currentVideoId);
        const videoDoc = await getDoc(videoRef);
        
        if (!videoDoc.exists()) return;
        
        const videoData = videoDoc.data();
        const comments = videoData.comments || [];
        
        // Filter out the deleted comment
        const updatedComments = comments.filter(comment => comment.id !== commentId);
        
        // Update the video document
        await updateDoc(videoRef, {
            comments: updatedComments
        });
        
        // Reload comments
        await showComments(currentVideoId);
        
        showNotification('✅ Comment deleted', 'success');
        
        // Update comment count in the video card
        updateVideoCommentCount(currentVideoId, -1);
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        showNotification('❌ Failed to delete comment', 'error');
    }
};

// Update video comment count in the UI
function updateVideoCommentCount(videoId, change) {
    const videoCard = document.querySelector(`[data-video-id="${videoId}"]`);
    if (!videoCard) return;
    
    const commentButton = videoCard.querySelector('.action-btn:nth-child(2) span');
    if (commentButton) {
        const currentCount = parseInt(commentButton.textContent) || 0;
        commentButton.textContent = Math.max(0, currentCount + change);
    }
}

// Export function to handle comment click
window.handleCommentClick = function(videoId) {
    showComments(videoId);
};