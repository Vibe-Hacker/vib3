// Simple video functions for VIB3

// Toggle like on a video
async function toggleLike(videoId) {
    if (!window.currentUser) {
        return { success: false, requiresAuth: true };
    }
    
    try {
        const response = await fetch(`/api/videos/${videoId}/like`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${window.authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        if (response.ok) {
            return { 
                success: true, 
                liked: data.liked, 
                likeCount: data.likeCount 
            };
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Toggle like error:', error);
        return { success: false, error: error.message };
    }
}

// Share video with TikTok-style modal - WORKING VERSION
function shareVideo(videoId) {
    console.log('🔗 Creating share modal for video:', videoId);
    
    // Remove any existing modals
    document.querySelectorAll('.share-modal').forEach(m => m.remove());
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Create modal content
    const content = document.createElement('div');
    content.style.cssText = `
        background: #161823;
        border-radius: 20px;
        padding: 30px;
        max-width: 400px;
        width: 90%;
        text-align: center;
    `;
    
    content.innerHTML = `
        <h3 style="color: white; margin: 0 0 20px 0; font-size: 20px;">Share Video</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
            <button onclick="shareToTwitter('${videoId}'); document.querySelector('.share-modal').remove();" style="
                padding: 15px; background: #1da1f2; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 14px;">
                🐦 Twitter
            </button>
            <button onclick="shareToFacebook('${videoId}'); document.querySelector('.share-modal').remove();" style="
                padding: 15px; background: #4267b2; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 14px;">
                📘 Facebook
            </button>
            <button onclick="shareToWhatsApp('${videoId}'); document.querySelector('.share-modal').remove();" style="
                padding: 15px; background: #25d366; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 14px;">
                💬 WhatsApp
            </button>
            <button onclick="copyVideoLink('${videoId}'); document.querySelector('.share-modal').remove();" style="
                padding: 15px; background: #666; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 14px;">
                🔗 Copy Link
            </button>
        </div>
        <button onclick="document.querySelector('.share-modal').remove();" style="
            width: 100%; padding: 15px; background: #333; color: white; border: none; border-radius: 10px; cursor: pointer;">
            Cancel
        </button>
    `;
    
    modal.appendChild(content);
    
    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
    console.log('✅ Share modal created and displayed');
}

// Share helper functions
function shareToTwitter(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    const text = 'Check out this amazing video on VIB3!';
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
}

function shareToFacebook(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
}

function shareToWhatsApp(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    const text = 'Check out this amazing video on VIB3!';
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
}

function copyVideoLink(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    navigator.clipboard.writeText(url).then(() => {
        if (window.showNotification) {
            window.showNotification('Link copied to clipboard!', 'success');
        }
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        if (window.showNotification) {
            window.showNotification('Link copied to clipboard!', 'success');
        }
    });
}

function shareViaEmail(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    const subject = 'Check out this VIB3 video!';
    const body = `I found this amazing video on VIB3 and thought you'd like it: ${url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function downloadVideo(videoId) {
    if (window.showNotification) {
        window.showNotification('Video download coming soon!', 'info');
    }
}

// Make share functions globally available
window.shareToTwitter = shareToTwitter;
window.shareToFacebook = shareToFacebook;
window.shareToWhatsApp = shareToWhatsApp;
window.copyVideoLink = copyVideoLink;
window.shareViaEmail = shareViaEmail;
window.downloadVideo = downloadVideo;

// Upload video (placeholder)
async function uploadVideo(file, description, tags) {
    if (!window.currentUser) {
        return { success: false, requiresAuth: true };
    }
    
    // For now, just show a message
    if (window.showNotification) {
        window.showNotification('Video upload coming soon! Will use DigitalOcean Spaces.', 'info');
    }
    
    return { success: true };
}

// Make functions globally available
window.toggleLike = toggleLike;
window.shareVideo = shareVideo;
window.uploadVideo = uploadVideo;

// Debug log to confirm this file is loading
console.log('✅ video-simple.js loaded with FIXED shareVideo v2.0');
console.log('🔍 Current shareVideo function:', typeof window.shareVideo);