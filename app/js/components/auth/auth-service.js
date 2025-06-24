// Authentication service - extracted from inline JavaScript
import { auth, db } from '../../core/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, query, where, getDocs, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Global state for followed users
export const followedUsers = new Set();

/**
 * Ensures a user document exists in Firestore
 * @param {Object} user - Firebase user object
 */
export async function ensureUserDocument(user) {
    try {
        const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
            console.log('Creating missing user document for', user.uid);
            // Create user document
            await addDoc(collection(db, 'users'), {
                uid: user.uid,
                username: user.email.split('@')[0], // Use email prefix as username
                email: user.email,
                displayName: user.displayName || null,
                createdAt: new Date(),
                followers: [],
                following: []
            });
            console.log('User document created successfully');
        }
    } catch (error) {
        console.error('Error ensuring user document:', error);
    }
}

/**
 * Sets up authentication state listener
 */
export function setupAuthStateListener() {
    onAuthStateChanged(auth, async (user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
        
        if (user) {
            // User is logged in
            window.currentUser = user;
            
            // Check if user has a Firestore document, create if missing
            await ensureUserDocument(user);
            
            // Check if this is a fresh login or page refresh
            const isPageRefresh = !window.userJustLoggedIn;
            
            // Import and call UI functions (these need to be created)
            if (window.showMainApp) {
                window.showMainApp(user, isPageRefresh);
            }
            
            if (document.getElementById('profilePage').style.display === 'block') {
                if (window.loadUserVideos) {
                    window.loadUserVideos(user.uid);
                }
            }
            
            if (window.loadUserFollowing) {
                window.loadUserFollowing();
            }
            
            // Update bottom navigation profile button
            if (window.updateBottomNavProfile) {
                window.updateBottomNavProfile();
            }
            
            // Reset the login flag
            window.userJustLoggedIn = false;
        } else {
            if (window.showAuthScreen) {
                window.showAuthScreen();
            }
            followedUsers.clear();
        }
    });
}

// Make functions globally available for transition period
window.ensureUserDocument = ensureUserDocument;
window.followedUsers = followedUsers;