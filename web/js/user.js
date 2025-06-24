// User management module
import { db } from './firebase-init.js';
import { 
    collection, 
    doc, 
    updateDoc, 
    getDoc,
    getDocs,
    query,
    where,
    arrayUnion, 
    arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getCurrentUser, getUserData } from './auth.js';
import { showNotification, debugLog } from './utils.js';

// Follow/unfollow user
export async function toggleFollow(targetUserId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Please login to follow users', 'info');
        return { success: false, requiresAuth: true };
    }
    
    if (currentUser.uid === targetUserId) {
        showNotification('You cannot follow yourself', 'info');
        return { success: false, error: 'Cannot follow self' };
    }
    
    try {
        // Get current user's data
        const currentUserData = await getUserData(currentUser.uid);
        if (!currentUserData || !currentUserData.id) {
            throw new Error('Current user data not found');
        }
        
        // Get target user's data
        const targetUserQuery = query(collection(db, 'users'), where('uid', '==', targetUserId));
        const targetUserSnapshot = await getDocs(targetUserQuery);
        
        if (targetUserSnapshot.empty) {
            throw new Error('Target user not found');
        }
        
        const targetUserDoc = targetUserSnapshot.docs[0];
        const targetUserData = targetUserDoc.data();
        const targetUserDocId = targetUserDoc.id;
        
        // Check if already following
        const following = currentUserData.following || [];
        const isFollowing = following.includes(targetUserId);
        
        const currentUserRef = doc(db, 'users', currentUserData.id);
        const targetUserRef = doc(db, 'users', targetUserDocId);
        
        if (isFollowing) {
            // Unfollow
            await updateDoc(currentUserRef, {
                following: arrayRemove(targetUserId)
            });
            
            await updateDoc(targetUserRef, {
                followers: arrayRemove(currentUser.uid)
            });
            
            debugLog(`Unfollowed user ${targetUserId}`);
            showNotification('✅ Unfollowed successfully', 'success');
            return { success: true, following: false };
        } else {
            // Follow
            await updateDoc(currentUserRef, {
                following: arrayUnion(targetUserId)
            });
            
            await updateDoc(targetUserRef, {
                followers: arrayUnion(currentUser.uid)
            });
            
            debugLog(`Followed user ${targetUserId}`);
            showNotification('✅ Following successfully', 'success');
            return { success: true, following: true };
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
        showNotification('❌ Failed to update follow status', 'error');
        return { success: false, error: error.message };
    }
}

// Get user profile by userId
export async function getUserProfile(userId) {
    try {
        const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
            return null;
        }
        
        const userData = userSnapshot.docs[0].data();
        const userDocId = userSnapshot.docs[0].id;
        
        // Get user's videos
        const videosQuery = query(collection(db, 'videos'), where('userId', '==', userId));
        const videosSnapshot = await getDocs(videosQuery);
        
        const videos = [];
        videosSnapshot.forEach(doc => {
            videos.push({ id: doc.id, ...doc.data() });
        });
        
        return {
            ...userData,
            id: userDocId,
            videoCount: videos.length,
            videos: videos
        };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

// Update user profile
export async function updateUserProfile(updates) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Please login to update profile', 'info');
        return { success: false, requiresAuth: true };
    }
    
    try {
        const userData = await getUserData(currentUser.uid);
        if (!userData || !userData.id) {
            throw new Error('User data not found');
        }
        
        const userRef = doc(db, 'users', userData.id);
        await updateDoc(userRef, {
            ...updates,
            updatedAt: new Date()
        });
        
        showNotification('✅ Profile updated successfully', 'success');
        return { success: true };
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('❌ Failed to update profile', 'error');
        return { success: false, error: error.message };
    }
}

// Check if current user follows target user
export async function checkFollowStatus(targetUserId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return false;
    }
    
    try {
        const userData = await getUserData(currentUser.uid);
        if (!userData) {
            return false;
        }
        
        const following = userData.following || [];
        return following.includes(targetUserId);
    } catch (error) {
        console.error('Error checking follow status:', error);
        return false;
    }
}

// Get user's followers
export async function getUserFollowers(userId) {
    try {
        const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
            return [];
        }
        
        const userData = userSnapshot.docs[0].data();
        const followerIds = userData.followers || [];
        
        // Get follower details
        const followers = [];
        for (const followerId of followerIds) {
            const followerData = await getUserData(followerId);
            if (followerData) {
                followers.push(followerData);
            }
        }
        
        return followers;
    } catch (error) {
        console.error('Error fetching followers:', error);
        return [];
    }
}

// Get user's following
export async function getUserFollowing(userId) {
    try {
        const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
            return [];
        }
        
        const userData = userSnapshot.docs[0].data();
        const followingIds = userData.following || [];
        
        // Get following details
        const following = [];
        for (const followingId of followingIds) {
            const followingData = await getUserData(followingId);
            if (followingData) {
                following.push(followingData);
            }
        }
        
        return following;
    } catch (error) {
        console.error('Error fetching following:', error);
        return [];
    }
}

// Search users
export async function searchUsers(searchQuery) {
    if (!searchQuery || searchQuery.length < 2) {
        return [];
    }
    
    try {
        // Simple search by username (case-insensitive would require additional setup)
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = [];
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.username && 
                userData.username.toLowerCase().includes(searchQuery.toLowerCase())) {
                users.push({ ...userData, id: doc.id });
            }
        });
        
        return users;
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
}