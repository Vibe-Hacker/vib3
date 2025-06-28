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
        top: 0px !important;
        left: 0px !important;
        right: 0px !important;
        bottom: 0px !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(255,0,0,0.9) !important;
        z-index: 9999999 !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: all !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        outline: none !important;
        overflow: visible !important;
        transform: none !important;
    `;
    
    const videoUrl = `${window.location.origin}/?video=${videoId}`;
    
    modal.innerHTML = `
        <div style="
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            background: white !important;
            color: black !important;
            padding: 50px !important;
            border-radius: 10px !important;
            font-size: 24px !important;
            font-weight: bold !important;
            text-align: center !important;
            z-index: 99999999 !important;
            box-shadow: 0 0 50px rgba(0,0,0,0.5) !important;
        ">
            <h2 style="margin: 0 0 20px 0 !important; color: black !important;">SHARE MODAL TEST</h2>
            <p style="margin: 0 0 20px 0 !important; color: black !important;">Video ID: ${videoId}</p>
            <button onclick="shareToTwitter('${videoId}'); this.closest('.share-modal').remove();" style="
                padding: 15px 30px !important;
                background: #1da1f2 !important;
                color: white !important;
                border: none !important;
                border-radius: 5px !important;
                cursor: pointer !important;
                margin: 10px !important;
                font-size: 16px !important;
            ">Twitter</button>
            <button onclick="copyVideoLink('${videoId}'); this.closest('.share-modal').remove();" style="
                padding: 15px 30px !important;
                background: #666 !important;
                color: white !important;
                border: none !important;
                border-radius: 5px !important;
                cursor: pointer !important;
                margin: 10px !important;
                font-size: 16px !important;
            ">Copy Link</button>
            <br>
            <button onclick="this.closest('.share-modal').remove();" style="
                padding: 15px 30px !important;
                background: #ff0050 !important;
                color: white !important;
                border: none !important;
                border-radius: 5px !important;
                cursor: pointer !important;
                margin: 10px !important;
                font-size: 16px !important;
            ">Close</button>
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
    console.log('🔍 Modal element:', modal);
    console.log('🔍 Modal in DOM:', document.querySelector('.share-modal'));
    console.log('🔍 Modal styles:', modal.style.cssText);
    console.log('🔍 Modal computed styles:', window.getComputedStyle(modal));
    
    // Force visibility check
    setTimeout(() => {
        console.log('🔍 Modal still in DOM after 1s:', document.querySelector('.share-modal'));
        const modalInDom = document.querySelector('.share-modal');
        if (modalInDom) {
            console.log('🔍 Modal dimensions:', modalInDom.getBoundingClientRect());
        }
    }, 1000);
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