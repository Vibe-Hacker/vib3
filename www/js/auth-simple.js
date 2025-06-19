// Simple authentication for VIB3 with MongoDB

let currentUser = null;

// Initialize auth state listener
function initAuth(onUserChange) {
    // Use the MongoDB adapter's auth system
    if (window.auth && window.auth.onAuthStateChanged) {
        window.auth.onAuthStateChanged((user) => {
            currentUser = user;
            onUserChange(user);
        });
    }
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Login function
async function login(email, password) {
    try {
        const result = await window.signInWithEmailAndPassword(window.auth, email, password);
        if (window.showNotification) {
            window.showNotification('Login successful!', 'success');
        }
        return { success: true, user: result.user };
    } catch (error) {
        if (window.showNotification) {
            window.showNotification(error.message, 'error');
        }
        return { success: false, error: error.message };
    }
}

// Signup function
async function signup(username, email, password) {
    try {
        const result = await window.createUserWithEmailAndPassword(window.auth, email, password);
        if (result.user && username) {
            await window.updateProfile(result.user, { displayName: username });
        }
        if (window.showNotification) {
            window.showNotification('Account created successfully!', 'success');
        }
        return { success: true, user: result.user };
    } catch (error) {
        if (window.showNotification) {
            window.showNotification(error.message, 'error');
        }
        return { success: false, error: error.message };
    }
}

// Logout function
async function logout() {
    try {
        await window.signOut(window.auth);
        if (window.showNotification) {
            window.showNotification('Logged out successfully', 'info');
        }
        return { success: true };
    } catch (error) {
        if (window.showNotification) {
            window.showNotification(error.message, 'error');
        }
        return { success: false, error: error.message };
    }
}

// Make functions globally available
window.initAuth = initAuth;
window.getCurrentUser = getCurrentUser;
window.login = login;
window.signup = signup;
window.logout = logout;