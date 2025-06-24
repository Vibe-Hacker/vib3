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

// Share video
async function shareVideo(videoId) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Check out this VIB3 video!',
                url: `${window.location.origin}/video/${videoId}`
            });
        } catch (error) {
            console.log('Share cancelled');
        }
    } else {
        // Fallback - copy to clipboard
        const url = `${window.location.origin}/video/${videoId}`;
        navigator.clipboard.writeText(url).then(() => {
            if (window.showNotification) {
                window.showNotification('Link copied to clipboard!', 'success');
            }
        });
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
window.shareVideo = shareVideo;
window.uploadVideo = uploadVideo;