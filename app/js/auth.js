// Authentication module using MongoDB adapter
import { showNotification } from './utils.js';

// Current user state
let currentUser = null;

// Initialize auth state listener
export function initAuth(onUserChange) {
    if (window.auth && window.auth.onAuthStateChanged) {
        window.auth.onAuthStateChanged((user) => {
            currentUser = user;
            onUserChange(user);
        });
    }
}

// Get current user
export function getCurrentUser() {
    return currentUser;
}

// Login function
export async function login(email, password) {
    try {
        const result = await window.signInWithEmailAndPassword(window.auth, email, password);
        showNotification('✅ Login successful!', 'success');
        return { success: true, user: result.user };
    } catch (error) {
        console.error('Login error:', error);
        showNotification(`❌ ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
}

// Signup function
export async function signup(username, email, password) {
    try {
        if (!username || username.length < 3) {
            throw new Error('Username must be at least 3 characters long.');
        }
        
        const result = await window.createUserWithEmailAndPassword(window.auth, email, password);
        if (result.user && username) {
            await window.updateProfile(result.user, { displayName: username });
        }
        
        showNotification('✅ Account created successfully!', 'success');
        return { success: true, user: result.user };
    } catch (error) {
        console.error('Signup error:', error);
        showNotification(`❌ ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
}

// Logout function
export async function logout() {
    try {
        await window.signOut(window.auth);
        showNotification('👋 Logged out successfully', 'info');
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('❌ Error logging out', 'error');
        return { success: false, error: error.message };
    }
}

// Get user data
export async function getUserData(uid) {
    try {
        // Use MongoDB API to get user data
        const response = await fetch(`/api/users/${uid}`, {
            headers: window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {}
        });
        
        if (response.ok) {
            return await response.json();
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

// Update user profile
export async function updateUserProfile(uid, data) {
    try {
        const response = await fetch(`/api/users/${uid}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.authToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showNotification('✅ Profile updated successfully!', 'success');
            return { success: true };
        } else {
            throw new Error('Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('❌ Failed to update profile', 'error');
        return { success: false, error: error.message };
    }
}