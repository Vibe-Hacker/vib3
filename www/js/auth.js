// Authentication module
import { auth, db } from './firebase-init.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { showNotification } from './utils.js';

// Current user state
let currentUser = null;

// Initialize auth state listener
export function initAuth(onUserChange) {
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        onUserChange(user);
    });
}

// Get current user
export function getCurrentUser() {
    return currentUser;
}

// Login function
export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        showNotification('✅ Login successful!', 'success');
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please try again.';
        
        // Handle specific error codes
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your connection.';
                break;
        }
        
        showNotification(`❌ ${errorMessage}`, 'error');
        return { success: false, error: errorMessage };
    }
}

// Signup function
export async function signup(username, email, password) {
    try {
        // Validate username
        if (!username || username.length < 3) {
            throw new Error('Username must be at least 3 characters long.');
        }
        
        // Check if username is already taken
        const usernameQuery = query(collection(db, 'users'), where('username', '==', username));
        const usernameSnapshot = await getDocs(usernameQuery);
        
        if (!usernameSnapshot.empty) {
            throw new Error('Username is already taken.');
        }
        
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user profile in Firestore
        await addDoc(collection(db, 'users'), {
            uid: userCredential.user.uid,
            username: username,
            email: email,
            createdAt: new Date(),
            followers: [],
            following: [],
            profilePicture: null,
            bio: '',
            verified: false,
            settings: {
                privacy: 'public',
                notifications: {
                    push: true,
                    email: true,
                    sms: false
                }
            }
        });
        
        showNotification('✅ Account created successfully!', 'success');
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Signup error:', error);
        let errorMessage = error.message || 'Signup failed. Please try again.';
        
        // Handle specific error codes
        if (error.code) {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'An account with this email already exists.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password should be at least 6 characters.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Email/password accounts are not enabled.';
                    break;
            }
        }
        
        showNotification(`❌ ${errorMessage}`, 'error');
        return { success: false, error: errorMessage };
    }
}

// Logout function
export async function logout() {
    try {
        await signOut(auth);
        showNotification('👋 Logged out successfully', 'info');
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('❌ Error logging out', 'error');
        return { success: false, error: error.message };
    }
}

// Get user data from Firestore
export async function getUserData(uid) {
    try {
        const userQuery = query(collection(db, 'users'), where('uid', '==', uid));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            return { ...userData, id: userSnapshot.docs[0].id };
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

// Check if user is authenticated
export function isAuthenticated() {
    return currentUser !== null;
}

// Get user display name
export function getUserDisplayName() {
    if (!currentUser) return 'Guest';
    return currentUser.displayName || currentUser.email.split('@')[0];
}