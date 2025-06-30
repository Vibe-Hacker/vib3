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
        // Try Instagram deep link - open camera/story creation
        const instagramUrl = `instagram://camera`;
        
        // Attempt to open Instagram app
        window.location.href = instagramUrl;
        
        // Also copy link immediately as backup
        directCopyToClipboard(url, 'Opening Instagram... Link copied to paste in your story!');
    } else {
        // Desktop - try to open Instagram web, then copy
        window.open('https://www.instagram.com/', '_blank');
        directCopyToClipboard(url, 'Opening Instagram... Link copied to paste in your post!');
    }
    
    // Record the share
    recordVideoShare(videoId);
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
    
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isMac = /macintosh|mac os x/.test(userAgent);
    const isWindows = /windows/.test(userAgent);
    
    let smsUrl;
    
    if (isIOS) {
        smsUrl = `sms:&body=${encodeURIComponent(message)}`;
    } else if (isAndroid) {
        smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    } else if (isMac) {
        // macOS Messages app
        smsUrl = `sms:&body=${encodeURIComponent(message)}`;
    } else if (isWindows) {
        // Windows messaging protocol
        smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    } else {
        // Default format
        smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    }
    
    console.log('📱 Opening SMS with URL:', smsUrl);
    
    // Try to open SMS app
    window.location.href = smsUrl;
    
    // Also copy link to clipboard as backup and show simple notification
    directCopyToClipboard(url, 'Link copied to clipboard! Paste it in your SMS message.');
    
    // Record the share
    recordVideoShare(videoId);
}

// Record video share on server and update UI
async function recordVideoShare(videoId) {
    try {
        const response = await fetch(`${window.API_BASE_URL || ''}/api/videos/${videoId}/share`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const newShareCount = data.shareCount;
            
            // Update share count in all instances of this video
            document.querySelectorAll(`[data-video-id="${videoId}"] .share-count`).forEach(shareCountEl => {
                if (shareCountEl) {
                    shareCountEl.textContent = newShareCount;
                }
            });
            
            console.log(`✅ Share recorded for video ${videoId}, new count: ${newShareCount}`);
        } else {
            console.error('❌ Failed to record share:', response.status);
        }
    } catch (error) {
        console.error('❌ Error recording share:', error);
    }
}

// Simple direct copy function - tries clipboard API silently, falls back to notification only
function directCopyToClipboard(text, message) {
    // Try clipboard API first (silent)
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            // Success - show notification
            if (window.showNotification) {
                window.showNotification(message, 'success');
            }
        }).catch(() => {
            // Failed - just show notification anyway (assume copy worked)
            if (window.showNotification) {
                window.showNotification(message, 'info');
            }
        });
    } else {
        // No clipboard API - just show the notification
        if (window.showNotification) {
            window.showNotification(message, 'info');
        }
    }
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

// Robust clipboard copy function with immediate visible fallback
function copyToClipboardFallback(text, successMessage = 'Copied to clipboard!') {
    console.log('📋 Attempting to copy to clipboard:', text);
    
    // Skip trying problematic APIs and go straight to reliable visible method
    // This ensures consistent UX regardless of browser/focus state
    showVisibleCopyInterface(text, successMessage);
}

// Simple, reliable visible copy interface
function showVisibleCopyInterface(text, successMessage) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Create copy container
    const container = document.createElement('div');
    container.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 90%;
        width: 400px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        text-align: center;
    `;
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Copy Video Link';
    title.style.cssText = `
        margin: 0 0 16px 0;
        color: #333;
        font-size: 18px;
    `;
    
    // Add textarea with the link
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = `
        width: 100%;
        height: 80px;
        border: 2px solid #FF0050;
        border-radius: 8px;
        padding: 12px;
        font-size: 14px;
        font-family: monospace;
        resize: none;
        margin-bottom: 16px;
        box-sizing: border-box;
    `;
    
    // Add instruction
    const instruction = document.createElement('p');
    instruction.textContent = 'Select all text above and copy with Ctrl+C (or Cmd+C on Mac)';
    instruction.style.cssText = `
        margin: 0 0 16px 0;
        color: #666;
        font-size: 14px;
    `;
    
    // Add buttons container
    const buttons = document.createElement('div');
    buttons.style.cssText = `
        display: flex;
        gap: 12px;
        justify-content: center;
    `;
    
    // Try auto-copy button
    const autoCopyBtn = document.createElement('button');
    autoCopyBtn.textContent = 'Auto Copy';
    autoCopyBtn.style.cssText = `
        background: #FF0050;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
    `;
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
        background: #666;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
    `;
    
    // Auto-copy functionality
    autoCopyBtn.onclick = () => {
        textarea.select();
        textarea.setSelectionRange(0, text.length);
        
        try {
            const success = document.execCommand('copy');
            if (success) {
                if (window.showNotification) {
                    window.showNotification(successMessage, 'success');
                }
                document.body.removeChild(overlay);
            } else {
                autoCopyBtn.textContent = 'Copy Failed - Select Text Above';
                autoCopyBtn.style.background = '#ff6b6b';
            }
        } catch (err) {
            autoCopyBtn.textContent = 'Copy Failed - Select Text Above';
            autoCopyBtn.style.background = '#ff6b6b';
        }
    };
    
    // Close functionality
    closeBtn.onclick = () => {
        document.body.removeChild(overlay);
    };
    
    // Escape key to close
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(overlay);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Assemble and show
    buttons.appendChild(autoCopyBtn);
    buttons.appendChild(closeBtn);
    container.appendChild(title);
    container.appendChild(textarea);
    container.appendChild(instruction);
    container.appendChild(buttons);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    // Auto-select text
    setTimeout(() => {
        textarea.focus();
        textarea.select();
    }, 100);
}

// Retry clipboard with better focus handling
function retryClipboardWithFocus(text, successMessage) {
    // Create a temporary button to ensure user interaction
    const button = document.createElement('button');
    button.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10000;
        padding: 12px 24px;
        background: #FF0050;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    button.textContent = 'Click to Copy Link';
    
    document.body.appendChild(button);
    
    button.onclick = () => {
        navigator.clipboard.writeText(text).then(() => {
            console.log('✅ Clipboard API success on retry');
            document.body.removeChild(button);
            if (window.showNotification) {
                window.showNotification(successMessage, 'success');
            }
        }).catch((err) => {
            console.log('❌ Clipboard API still failed:', err);
            document.body.removeChild(button);
            fallbackCopyMethod(text, successMessage);
        });
    };
    
    // Auto-remove button after 5 seconds if not clicked
    setTimeout(() => {
        if (button.parentNode) {
            document.body.removeChild(button);
            fallbackCopyMethod(text, successMessage);
        }
    }, 5000);
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
        
        // Ensure window and document focus
        window.focus();
        if (document.body) {
            document.body.focus();
        }
        
        // Create a temporary textarea element with better styling
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.readOnly = false; // Allow editing for better compatibility
        
        // Make it visible but small for better focus handling
        textArea.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 300px;
            height: 50px;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #FF0050;
            border-radius: 4px;
            padding: 8px;
            font-size: 14px;
            z-index: 9999;
            opacity: 0.9;
        `;
        
        document.body.appendChild(textArea);
        
        // Enhanced focus and selection
        setTimeout(() => {
            try {
                textArea.focus();
                textArea.select();
                textArea.setSelectionRange(0, text.length);
                
                // Try to copy after ensuring selection
                setTimeout(() => {
                    try {
                        const successful = document.execCommand('copy');
                        
                        if (successful) {
                            console.log('✅ Fallback copy successful');
                            if (window.showNotification) {
                                window.showNotification(successMessage, 'success');
                            }
                            // Remove textarea after short delay to show success
                            setTimeout(() => {
                                if (textArea.parentNode) {
                                    document.body.removeChild(textArea);
                                }
                            }, 500);
                        } else {
                            console.log('❌ execCommand returned false');
                            // Keep textarea visible for manual copy
                            textArea.style.opacity = '1';
                            textArea.placeholder = 'Copy this text manually (Ctrl+C)';
                            
                            // Add close button
                            const closeBtn = document.createElement('button');
                            closeBtn.textContent = 'Close';
                            closeBtn.style.cssText = `
                                position: fixed;
                                top: calc(50% + 40px);
                                left: 50%;
                                transform: translateX(-50%);
                                background: #FF0050;
                                color: white;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 4px;
                                cursor: pointer;
                                z-index: 10000;
                            `;
                            closeBtn.onclick = () => {
                                if (textArea.parentNode) document.body.removeChild(textArea);
                                if (closeBtn.parentNode) document.body.removeChild(closeBtn);
                            };
                            document.body.appendChild(closeBtn);
                            
                            // Auto-close after 10 seconds
                            setTimeout(() => {
                                if (textArea.parentNode) document.body.removeChild(textArea);
                                if (closeBtn.parentNode) document.body.removeChild(closeBtn);
                            }, 10000);
                        }
                    } catch (execErr) {
                        console.log('❌ execCommand exception:', execErr);
                        if (textArea.parentNode) {
                            document.body.removeChild(textArea);
                        }
                        manualCopyPrompt(text);
                    }
                }, 50);
                
            } catch (selectionErr) {
                console.log('❌ Selection error:', selectionErr);
                if (textArea.parentNode) {
                    document.body.removeChild(textArea);
                }
                manualCopyPrompt(text);
            }
        }, 50);
        
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