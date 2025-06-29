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

// Share video with TikTok-style modal - IMPROVED VERSION
function shareVideo(videoId) {
    console.log('🔗 Creating share modal for video:', videoId);
    
    // Create modal using the working approach but with better styling
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.8);
            z-index: 99999999;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                background: #161823;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                max-width: 400px;
                width: 90%;
            ">
                <h3 style="color: white; margin: 0 0 20px 0; font-size: 18px;">Share Video</h3>
                
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px;">
                    <button onclick="window.open('https://www.tiktok.com/upload', '_blank')" 
                        style="padding: 10px; background: linear-gradient(45deg, #ff0050, #000000); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        🎵<br>TikTok
                    </button>
                    
                    <button onclick="window.open('https://www.instagram.com/', '_blank')" 
                        style="padding: 10px; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        📷<br>Instagram
                    </button>
                    
                    <button onclick="window.open('https://twitter.com/intent/tweet?text=Check out this amazing video on VIB3!&url=${window.location.origin}/?video=${videoId}', '_blank')" 
                        style="padding: 10px; background: #1da1f2; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        🐦<br>Twitter
                    </button>
                    
                    <button onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}/?video=${videoId}', '_blank')" 
                        style="padding: 10px; background: #4267b2; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        📘<br>Facebook
                    </button>
                    
                    <button onclick="window.open('https://wa.me/?text=Check out this amazing video on VIB3! ${window.location.origin}/?video=${videoId}', '_blank')" 
                        style="padding: 10px; background: #25d366; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        📱<br>WhatsApp
                    </button>
                    
                    <button onclick="window.open('https://t.me/share/url?url=${window.location.origin}/?video=${videoId}&text=Check out this video!', '_blank')" 
                        style="padding: 10px; background: #0088cc; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        ✈️<br>Telegram
                    </button>
                    
                    <button onclick="window.open('https://www.snapchat.com/', '_blank')" 
                        style="padding: 10px; background: #fffc00; color: black; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        👻<br>Snapchat
                    </button>
                    
                    <button onclick="window.open('https://www.reddit.com/submit?url=${window.location.origin}/?video=${videoId}&title=Check out this video!', '_blank')" 
                        style="padding: 10px; background: #ff4500; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        🤖<br>Reddit
                    </button>
                    
                    <button onclick="window.open('https://www.linkedin.com/sharing/share-offsite/?url=${window.location.origin}/?video=${videoId}', '_blank')" 
                        style="padding: 10px; background: #0077b5; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        💼<br>LinkedIn
                    </button>
                    
                    <button onclick="window.open('https://pinterest.com/pin/create/button/?url=${window.location.origin}/?video=${videoId}&description=Check out this video!', '_blank')" 
                        style="padding: 10px; background: #bd081c; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        📌<br>Pinterest
                    </button>
                    
                    <button onclick="window.open('https://discord.com/', '_blank')" 
                        style="padding: 10px; background: #7289da; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        🎮<br>Discord
                    </button>
                    
                    <button onclick="shareViaSMS('${videoId}')" 
                        style="padding: 10px; background: #00d4aa; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        💬<br>SMS
                    </button>
                    
                    <button onclick="window.location.href='mailto:?subject=Check out this VIB3 video!&body=I found this amazing video: ${window.location.origin}/?video=${videoId}'" 
                        style="padding: 10px; background: #ea4335; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        📧<br>Email
                    </button>
                    
                    <button onclick="navigator.clipboard.writeText('${window.location.origin}/?video=${videoId}').then(() => alert('Link copied to clipboard!'))" 
                        style="padding: 10px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        🔗<br>Copy Link
                    </button>
                </div>
                
                <div style="border-top: 1px solid #333; padding-top: 15px; margin-top: 5px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <button onclick="alert('Video download feature coming soon!')" 
                            style="padding: 12px; background: #4caf50; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 12px;">
                            ⬇️ Save Video
                        </button>
                        
                        <button onclick="alert('Report feature coming soon!')" 
                            style="padding: 12px; background: #f44336; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 12px;">
                            🚩 Report
                        </button>
                    </div>
                </div>
                
                <button onclick="this.closest('div').parentElement.remove()" 
                    style="width: 100%; padding: 12px; background: #333; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    console.log('✅ TikTok-style modal created');
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

function shareViaSMS(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    const message = `Check out this amazing video on VIB3! ${url}`;
    
    // Detect platform and use appropriate SMS format
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isMac = /macintosh|mac os x/.test(userAgent);
    const isWindows = /windows/.test(userAgent);
    
    let smsUrl;
    
    if (isIOS || isMac) {
        // iOS and macOS use & for body parameter
        smsUrl = `sms:&body=${encodeURIComponent(message)}`;
    } else if (isAndroid) {
        // Android uses ? for body parameter
        smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    } else if (isWindows) {
        // Windows - try Microsoft messaging protocol
        // First attempt with proper encoding
        smsUrl = `sms:?body=${encodeURIComponent(message)}`;
        
        // If SMS doesn't work on Windows, offer to copy the message instead
        setTimeout(() => {
            if (confirm('If SMS didn\'t open, would you like to copy the message to clipboard instead?')) {
                navigator.clipboard.writeText(message).then(() => {
                    if (window.showNotification) {
                        window.showNotification('Message copied! Paste it in your messaging app.', 'success');
                    }
                });
            }
        }, 1000);
    } else {
        // Default format for other platforms
        smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    }
    
    console.log('📱 Opening SMS with URL:', smsUrl);
    window.location.href = smsUrl;
}

// Make share functions globally available
window.shareToTwitter = shareToTwitter;
window.shareToFacebook = shareToFacebook;
window.shareToWhatsApp = shareToWhatsApp;
window.copyVideoLink = copyVideoLink;
window.shareViaEmail = shareViaEmail;
window.downloadVideo = downloadVideo;
window.shareViaSMS = shareViaSMS;

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