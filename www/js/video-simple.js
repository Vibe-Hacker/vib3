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

// Don't override shareVideo function - let vib3-complete.js handle it
// The openShareModal function in vib3-complete.js has the working implementation

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
    const url = `${window.location.origin}/?video=${videoId}`;
    const message = `Check out this amazing video on VIB3! ${url}`;
    
    // Try mobile deep link first (for mobile devices)
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(userAgent);
    
    if (isMobile) {
        // Try TikTok deep link (may or may not work depending on device)
        const tiktokUrl = `tiktok://share?text=${encodeURIComponent(message)}`;
        
        // Attempt to open TikTok app
        window.location.href = tiktokUrl;
        
        // Fallback after 1 second if app didn't open
        setTimeout(() => {
            navigator.clipboard.writeText(url).then(() => {
                alert('✅ Link copied to clipboard!\n\nIf TikTok didn\'t open:\n1. Open TikTok app manually\n2. Create a new post\n3. Paste the link in your caption');
            });
        }, 1000);
    } else {
        // Desktop - just copy link with instructions
        navigator.clipboard.writeText(url).then(() => {
            alert('✅ Link copied to clipboard!\n\n📱 To share on TikTok:\n1. Open TikTok app on your phone\n2. Create a new post\n3. Paste the link in your caption or bio');
        }).catch(() => {
            alert('TikTok sharing: Please copy this link manually:\n' + url);
        });
    }
}

function shareToInstagram(videoId) {
    const url = `${window.location.origin}/?video=${videoId}`;
    const message = `Check out this amazing video on VIB3! ${url}`;
    
    // Try mobile deep link first (for mobile devices)
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(userAgent);
    
    if (isMobile) {
        // Try Instagram deep link
        const instagramUrl = `instagram://share?text=${encodeURIComponent(message)}`;
        
        // Attempt to open Instagram app
        window.location.href = instagramUrl;
        
        // Fallback after 1 second if app didn't open
        setTimeout(() => {
            navigator.clipboard.writeText(url).then(() => {
                alert('✅ Link copied to clipboard!\n\nIf Instagram didn\'t open:\n1. Open Instagram app manually\n2. Create a post or story\n3. Paste the link in your caption');
            });
        }, 1000);
    } else {
        // Desktop - just copy link with instructions
        navigator.clipboard.writeText(url).then(() => {
            alert('✅ Link copied to clipboard!\n\n📸 To share on Instagram:\n1. Open Instagram app on your phone\n2. Create a post or story\n3. Paste the link in your caption or bio');
        }).catch(() => {
            alert('Instagram sharing: Please copy this link manually:\n' + url);
        });
    }
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
    copyToClipboardFallback(url, 'Link copied to clipboard!');
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
                copyToClipboardFallback(message, 'Message copied! Paste it in your messaging app.');
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
window.copyToClipboardFallback = copyToClipboardFallback;

// Robust clipboard copy function with multiple fallbacks
function copyToClipboardFallback(text, successMessage = 'Copied to clipboard!') {
    console.log('📋 Attempting to copy to clipboard:', text);
    
    // Method 1: Modern Clipboard API (requires HTTPS)
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('✅ Clipboard API success');
            if (window.showNotification) {
                window.showNotification(successMessage, 'success');
            }
        }).catch((err) => {
            console.log('❌ Clipboard API failed:', err);
            fallbackCopyMethod(text, successMessage);
        });
    } else {
        console.log('📋 Clipboard API not available, using fallback');
        fallbackCopyMethod(text, successMessage);
    }
}

// Fallback method using execCommand with enhanced compatibility
function fallbackCopyMethod(text, successMessage) {
    try {
        // Check if execCommand is supported
        if (!document.queryCommandSupported || !document.queryCommandSupported('copy')) {
            console.log('📋 execCommand copy not supported, showing manual prompt');
            manualCopyPrompt(text);
            return;
        }
        
        // Create a temporary textarea element with better styling
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.readOnly = true;
        
        // Better invisible styling
        textArea.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 1px;
            height: 1px;
            opacity: 0;
            border: none;
            outline: none;
            boxShadow: none;
            background: transparent;
            fontSize: 16px;
            zIndex: -1000;
        `;
        
        document.body.appendChild(textArea);
        
        // Enhanced selection for better compatibility
        textArea.focus();
        textArea.select();
        
        // For mobile devices
        if (textArea.setSelectionRange) {
            textArea.setSelectionRange(0, text.length);
        }
        
        // Small delay to ensure focus
        setTimeout(() => {
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (successful) {
                    console.log('✅ Fallback copy successful');
                    if (window.showNotification) {
                        window.showNotification(successMessage, 'success');
                    }
                } else {
                    console.log('❌ execCommand returned false');
                    manualCopyPrompt(text);
                }
            } catch (execErr) {
                console.log('❌ execCommand exception:', execErr);
                document.body.removeChild(textArea);
                manualCopyPrompt(text);
            }
        }, 10);
        
    } catch (err) {
        console.log('❌ Fallback copy setup error:', err);
        manualCopyPrompt(text);
    }
}

// Final fallback - show text for manual copying with better UX
function manualCopyPrompt(text) {
    console.log('📋 Showing manual copy prompt');
    
    // Create a modal-like prompt for better UX
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (window.showNotification) {
        window.showNotification('Auto-copy failed. Please copy the link manually.', 'info');
    }
    
    // For mobile, use alert since prompt is better
    if (isMobile) {
        alert(`Copy this link:\n\n${text}\n\nTap and hold to select all, then copy.`);
    } else {
        // For desktop, use prompt which allows easy selection
        const copied = window.prompt('Auto-copy failed. Please copy this link manually (Ctrl+C):', text);
        if (copied !== null) {
            console.log('📋 User manually copied:', copied);
        }
    }
}

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
// Don't override shareVideo - let vib3-complete.js handle it
window.uploadVideo = uploadVideo;

// Debug log to confirm this file is loading
console.log('✅ video-simple.js loaded with FIXED shareVideo v2.0');
console.log('🔍 Current shareVideo function:', typeof window.shareVideo);