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

// Share video with TikTok-style modal - UPDATED v2.0
async function shareVideo(videoId) {
    console.log('🔗 FIXED SHARE MODAL v2.0 - Opening TikTok-style share modal for video:', videoId);
    console.log('📍 This is the CORRECT shareVideo function from video-simple.js');
    
    // Remove any existing share modals
    document.querySelectorAll('.share-modal').forEach(m => m.remove());
    
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0,0,0,0.9) !important;
        z-index: 999999 !important;
        display: flex !important;
        align-items: flex-end !important;
        justify-content: center !important;
        backdrop-filter: blur(10px) !important;
        pointer-events: all !important;
    `;
    
    const videoUrl = `${window.location.origin}/?video=${videoId}`;
    
    modal.innerHTML = `
        <div style="
            background: #161823 !important;
            width: 100% !important;
            max-width: 500px !important;
            max-height: 70vh !important;
            border-radius: 20px 20px 0 0 !important;
            padding: 30px !important;
            overflow-y: auto !important;
            position: relative !important;
            z-index: 9999999 !important;
            animation: slideUp 0.3s ease !important;
        ">
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="width: 40px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin: 0 auto 20px;"></div>
                <h3 style="margin: 0; color: white; font-size: 20px; font-weight: 600;">Share to</h3>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 25px;">
                <button onclick="shareToTwitter('${videoId}'); this.closest('.share-modal').remove();" style="
                    text-align: center; cursor: pointer; padding: 15px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                    <div style="width: 50px; height: 50px; background: #1da1f2; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-size: 24px;">🐦</div>
                    <span style="color: white; font-size: 12px; display: block;">Twitter</span>
                </button>
                
                <button onclick="shareToFacebook('${videoId}'); this.closest('.share-modal').remove();" style="
                    text-align: center; cursor: pointer; padding: 15px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                    <div style="width: 50px; height: 50px; background: #4267b2; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-size: 24px;">📘</div>
                    <span style="color: white; font-size: 12px; display: block;">Facebook</span>
                </button>
                
                <button onclick="shareToWhatsApp('${videoId}'); this.closest('.share-modal').remove();" style="
                    text-align: center; cursor: pointer; padding: 15px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                    <div style="width: 50px; height: 50px; background: #25d366; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-size: 24px;">💬</div>
                    <span style="color: white; font-size: 12px; display: block;">WhatsApp</span>
                </button>
                
                <button onclick="copyVideoLink('${videoId}'); this.closest('.share-modal').remove();" style="
                    text-align: center; cursor: pointer; padding: 15px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                    <div style="width: 50px; height: 50px; background: #666; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-size: 24px;">🔗</div>
                    <span style="color: white; font-size: 12px; display: block;">Copy Link</span>
                </button>
                
                <button onclick="shareViaEmail('${videoId}'); this.closest('.share-modal').remove();" style="
                    text-align: center; cursor: pointer; padding: 15px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                    <div style="width: 50px; height: 50px; background: #ea4335; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-size: 24px;">📧</div>
                    <span style="color: white; font-size: 12px; display: block;">Email</span>
                </button>
                
                <button onclick="downloadVideo('${videoId}'); this.closest('.share-modal').remove();" style="
                    text-align: center; cursor: pointer; padding: 15px; background: none; border: none; border-radius: 12px; transition: background 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                    <div style="width: 50px; height: 50px; background: #4caf50; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-size: 24px;">⬇️</div>
                    <span style="color: white; font-size: 12px; display: block;">Save</span>
                </button>
            </div>
            
            <button onclick="this.closest('.share-modal').remove()" style="
                width: 100%; padding: 16px; background: rgba(255,255,255,0.1); border: none; border-radius: 12px;
                color: white; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 12px;
            ">Cancel</button>
        </div>
    `;
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
    console.log('✅ TikTok-style share modal added to page');
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