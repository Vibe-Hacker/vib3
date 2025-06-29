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

// Share video with TikTok-style modal - FIXED VERSION
function shareVideo(videoId) {
    console.log('🔗 Creating share modal for video:', videoId);
    
    // Create modal with proper class name for removal
    const modal = document.createElement('div');
    modal.className = 'share-modal';
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
                    <button onclick="shareToTikTok('${videoId}'); document.querySelector('.share-modal').remove();" 
                        style="padding: 10px; background: linear-gradient(45deg, #ff0050, #000000); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        🎵<br>TikTok
                    </button>
                    
                    <button onclick="shareToInstagram('${videoId}'); document.querySelector('.share-modal').remove();" 
                        style="padding: 10px; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        📷<br>Instagram
                    </button>
                    
                    <button onclick="shareToTwitter('${videoId}'); document.querySelector('.share-modal').remove();" 
                        style="padding: 10px; background: #1da1f2; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        🐦<br>Twitter
                    </button>
                    
                    <button onclick="shareToFacebook('${videoId}'); document.querySelector('.share-modal').remove();" 
                        style="padding: 10px; background: #4267b2; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        📘<br>Facebook
                    </button>
                    
                    <button onclick="shareToWhatsApp('${videoId}'); document.querySelector('.share-modal').remove();" 
                        style="padding: 10px; background: #25d366; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        📱<br>WhatsApp
                    </button>
                    
                    <button onclick="shareToTelegram('${videoId}'); document.querySelector('.share-modal').remove();" 
                        style="padding: 10px; background: #0088cc; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        ✈️<br>Telegram
                    </button>
                    
                    <button onclick="shareToSnapchat('${videoId}'); document.querySelector('.share-modal').remove();" 
                        style="padding: 10px; background: #fffc00; color: black; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        👻<br>Snapchat
                    </button>
                    
                    <button onclick="shareToReddit('${videoId}'); document.querySelector('.share-modal').remove();" 
                        style="padding: 10px; background: #ff4500; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        🤖<br>Reddit
                    </button>
                    
                    <button onclick="shareToLinkedIn('${videoId}'); document.querySelector('.share-modal').remove();" 
                        style="padding: 10px; background: #0077b5; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        💼<br>LinkedIn
                    </button>
                    
                    <button onclick="shareToPinterest('${videoId}'); document.querySelector('.share-modal').remove();" 
                        style="padding: 10px; background: #bd081c; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        📌<br>Pinterest
                    </button>
                    
                    <button onclick="shareToDiscord('${videoId}'); document.querySelector('.share-modal').remove();" 
                        style="padding: 10px; background: #7289da; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        🎮<br>Discord
                    </button>
                    
                    <button onclick="shareViaSMS('${videoId}'); document.querySelector('.share-modal').remove();" 
                        style="padding: 10px; background: #00d4aa; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        💬<br>SMS
                    </button>
                    
                    <button onclick="window.location.href='mailto:?subject=Check out this VIB3 video!&body=I found this amazing video: ${window.location.origin}/?video=${videoId}'; document.querySelector('.share-modal').remove();" 
                        style="padding: 10px; background: #ea4335; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        📧<br>Email
                    </button>
                    
                    <button onclick="navigator.clipboard.writeText('${window.location.origin}/?video=${videoId}').then(() => alert('Link copied to clipboard!')); document.querySelector('.share-modal').remove();" 
                        style="padding: 10px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
                        🔗<br>Copy Link
                    </button>
                </div>
                
                <div style="border-top: 1px solid #333; padding-top: 15px; margin-top: 5px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <button onclick="alert('Video download feature coming soon!'); document.querySelector('.share-modal').remove();" 
                            style="padding: 12px; background: #4caf50; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 12px;">
                            ⬇️ Save Video
                        </button>
                        
                        <button onclick="alert('Report feature coming soon!'); document.querySelector('.share-modal').remove();" 
                            style="padding: 12px; background: #f44336; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 12px;">
                            🚩 Report
                        </button>
                    </div>
                </div>
                
                <button onclick="document.querySelector('.share-modal').remove();" 
                    style="width: 100%; padding: 12px; background: #333; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    console.log('✅ TikTok-style modal created with proper removal');
}

// Share helper functions with proper pre-filled content
function shareToTwitter(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    const text = 'Check out this amazing video on VIB3!';
    // Twitter Intent API properly formats the tweet
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
}

function shareToFacebook(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    // Facebook sharer with proper parameters
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent('Check out this amazing video on VIB3!')}`, '_blank');
}

function shareToWhatsApp(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    const text = 'Check out this amazing video on VIB3!';
    // WhatsApp with pre-filled message
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
}

function shareToTelegram(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    const text = 'Check out this amazing video on VIB3!';
    // Telegram share URL
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
}

function shareToReddit(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    const title = 'Check out this amazing VIB3 video!';
    // Reddit submit URL
    window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank');
}

function shareToLinkedIn(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    // LinkedIn sharing URL
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
}

function shareToPinterest(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    const description = 'Check out this amazing video on VIB3!';
    // Pinterest create pin URL
    window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}`, '_blank');
}

function shareToTikTok(videoId) {
    // TikTok doesn't have a direct share URL, so copy link and show instructions
    const url = `${window.location.origin}/?video=${videoId}`;
    navigator.clipboard.writeText(url).then(() => {
        if (window.showNotification) {
            window.showNotification('Link copied! Open TikTok and paste in your post.', 'success');
        }
    });
}

function shareToInstagram(videoId) {
    // Instagram doesn't support direct URL sharing, so copy link
    const url = `${window.location.origin}/?video=${videoId}`;
    navigator.clipboard.writeText(url).then(() => {
        if (window.showNotification) {
            window.showNotification('Link copied! Open Instagram and paste in your story/post.', 'success');
        }
    });
}

function shareToSnapchat(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    // Snapchat Creative Kit URL (web share)
    window.open(`https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`, '_blank');
}

function shareToDiscord(videoId) {
    // Discord doesn't have a direct share URL, so copy link
    const url = `${window.location.origin}/?video=${videoId}`;
    const message = `Check out this amazing video on VIB3! ${url}`;
    navigator.clipboard.writeText(message).then(() => {
        if (window.showNotification) {
            window.showNotification('Message copied! Paste in Discord channel.', 'success');
        }
    });
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
window.shareToTelegram = shareToTelegram;
window.shareToReddit = shareToReddit;
window.shareToLinkedIn = shareToLinkedIn;
window.shareToPinterest = shareToPinterest;
window.shareToTikTok = shareToTikTok;
window.shareToInstagram = shareToInstagram;
window.shareToSnapchat = shareToSnapchat;
window.shareToDiscord = shareToDiscord;
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