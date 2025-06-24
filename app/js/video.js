// Video management module
import { db, storage } from './firebase-init.js';
import { 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    getDoc,
    arrayUnion, 
    arrayRemove,
    increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { getCurrentUser } from './auth.js';
import { showNotification, debugLog } from './utils.js';
import { appConfig } from './config.js';

// Video compression using browser APIs
export async function compressVideo(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        video.onloadedmetadata = async () => {
            // Check video duration
            if (video.duration > appConfig.maxVideoDuration) {
                reject(new Error(`Video must be less than ${appConfig.maxVideoDuration / 60} minutes`));
                return;
            }
            
            // For now, return original file if it's already small enough
            if (file.size <= appConfig.maxVideoSize) {
                resolve(file);
                return;
            }
            
            // TODO: Implement actual video compression
            // This would require a more sophisticated approach,
            // possibly using WebCodecs API or a library like ffmpeg.wasm
            showNotification('Video compression in progress...', 'info');
            
            // Simulate compression with a delay
            setTimeout(() => {
                resolve(file);
            }, 2000);
        };
        
        video.onerror = () => {
            reject(new Error('Failed to load video for compression'));
        };
        
        video.src = URL.createObjectURL(file);
    });
}

// Upload video to Firebase Storage
export async function uploadVideo(file, description, tags) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        throw new Error('User must be authenticated to upload videos');
    }
    
    try {
        // Validate file
        if (!appConfig.supportedVideoFormats.includes(file.type)) {
            throw new Error('Unsupported video format. Please use MP4, MOV, or AVI.');
        }
        
        if (file.size > appConfig.maxVideoSize) {
            throw new Error(`Video size must be less than ${appConfig.maxVideoSize / 1024 / 1024}MB`);
        }
        
        // Show compression progress
        showNotification('Processing video...', 'info');
        
        // Compress video
        const compressedFile = await compressVideo(file);
        
        // Upload to Firebase Storage
        const timestamp = Date.now();
        const fileName = `${currentUser.uid}_${timestamp}_${file.name}`;
        const videoRef = ref(storage, `videos/${currentUser.uid}/${fileName}`);
        
        showNotification('Uploading video...', 'info');
        const snapshot = await uploadBytes(videoRef, compressedFile);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        // Save video metadata to Firestore
        const videoData = {
            userId: currentUser.uid,
            videoUrl: downloadURL,
            description: description || '',
            tags: tags ? tags.split(' ').filter(tag => tag.startsWith('#')) : [],
            likes: [],
            comments: [],
            shares: 0,
            views: 0,
            createdAt: new Date(),
            status: 'active',
            metadata: {
                fileName: fileName,
                fileSize: compressedFile.size,
                mimeType: compressedFile.type,
                duration: null // TODO: Extract video duration
            }
        };
        
        const docRef = await addDoc(collection(db, 'videos'), videoData);
        
        showNotification('✅ Video uploaded successfully!', 'success');
        return { success: true, videoId: docRef.id, videoUrl: downloadURL };
    } catch (error) {
        console.error('Upload error:', error);
        showNotification(`❌ Upload failed: ${error.message}`, 'error');
        throw error;
    }
}

// Toggle like on video
export async function toggleLike(videoId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Please login to like videos', 'info');
        return { success: false, requiresAuth: true };
    }
    
    try {
        const videoRef = doc(db, 'videos', videoId);
        const videoDoc = await getDoc(videoRef);
        
        if (!videoDoc.exists()) {
            throw new Error('Video not found');
        }
        
        const videoData = videoDoc.data();
        const likes = videoData.likes || [];
        const userLiked = likes.includes(currentUser.uid);
        
        if (userLiked) {
            // Unlike
            await updateDoc(videoRef, {
                likes: arrayRemove(currentUser.uid)
            });
            debugLog(`Unliked video ${videoId}`);
            return { success: true, liked: false, likeCount: likes.length - 1 };
        } else {
            // Like
            await updateDoc(videoRef, {
                likes: arrayUnion(currentUser.uid)
            });
            debugLog(`Liked video ${videoId}`);
            return { success: true, liked: true, likeCount: likes.length + 1 };
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        showNotification('❌ Failed to update like', 'error');
        return { success: false, error: error.message };
    }
}

// Add comment to video
export async function addComment(videoId, commentText) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Please login to comment', 'info');
        return { success: false, requiresAuth: true };
    }
    
    if (!commentText || commentText.trim().length === 0) {
        showNotification('Comment cannot be empty', 'error');
        return { success: false, error: 'Empty comment' };
    }
    
    try {
        const videoRef = doc(db, 'videos', videoId);
        const comment = {
            userId: currentUser.uid,
            text: commentText.trim(),
            createdAt: new Date(),
            likes: [],
            id: Date.now().toString()
        };
        
        await updateDoc(videoRef, {
            comments: arrayUnion(comment)
        });
        
        debugLog(`Added comment to video ${videoId}`);
        showNotification('✅ Comment added!', 'success');
        return { success: true, comment };
    } catch (error) {
        console.error('Error adding comment:', error);
        showNotification('❌ Failed to add comment', 'error');
        return { success: false, error: error.message };
    }
}

// Share video
export async function shareVideo(videoId) {
    try {
        const videoUrl = `${window.location.origin}/?video=${videoId}`;
        
        if (navigator.share) {
            // Use Web Share API if available
            await navigator.share({
                title: 'Check out this video on VIB3',
                text: 'Amazing video on VIB3!',
                url: videoUrl
            });
            
            // Increment share count
            const videoRef = doc(db, 'videos', videoId);
            await updateDoc(videoRef, {
                shares: increment(1)
            });
            
            return { success: true, shared: true };
        } else {
            // Fallback to clipboard
            await navigator.clipboard.writeText(videoUrl);
            showNotification('✅ Link copied to clipboard!', 'success');
            
            // Increment share count
            const videoRef = doc(db, 'videos', videoId);
            await updateDoc(videoRef, {
                shares: increment(1)
            });
            
            return { success: true, copied: true };
        }
    } catch (error) {
        console.error('Error sharing video:', error);
        showNotification('❌ Failed to share video', 'error');
        return { success: false, error: error.message };
    }
}

// Increment video view count
export async function incrementVideoView(videoId) {
    try {
        const videoRef = doc(db, 'videos', videoId);
        await updateDoc(videoRef, {
            views: increment(1)
        });
        debugLog(`Incremented view count for video ${videoId}`);
    } catch (error) {
        console.error('Error incrementing view count:', error);
    }
}

// Report video
export async function reportVideo(videoId, reason) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Please login to report videos', 'info');
        return { success: false, requiresAuth: true };
    }
    
    try {
        await addDoc(collection(db, 'reports'), {
            videoId: videoId,
            reportedBy: currentUser.uid,
            reason: reason,
            createdAt: new Date(),
            status: 'pending'
        });
        
        showNotification('✅ Video reported. We will review it soon.', 'success');
        return { success: true };
    } catch (error) {
        console.error('Error reporting video:', error);
        showNotification('❌ Failed to report video', 'error');
        return { success: false, error: error.message };
    }
}