// Simple authentication for VIB3 with MongoDB

// Use existing currentUser or create new one
if (typeof window.currentUser === 'undefined') {
    window.currentUser = null;
}

// Initialize auth state listener
function initAuth(onUserChange) {
    // Use the MongoDB adapter's auth system
    if (window.auth && window.auth.onAuthStateChanged) {
        window.auth.onAuthStateChanged((user) => {
            window.currentUser = user;
            onUserChange(user);
        });
    }
}

// Get current user
function getCurrentUser() {
    return window.currentUser;
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
        // CRITICAL: Clean up all overlays and special pages before logout
        const overlaysToRemove = [
            'analyticsOverlay',
            'activityPage',
            document.querySelector('[style*="position: fixed"][style*="z-index: 99999"]'),
            document.querySelector('[style*="position: fixed"][style*="z-index: 100000"]')
        ];
        
        overlaysToRemove.forEach(overlay => {
            if (typeof overlay === 'string') {
                const element = document.getElementById(overlay);
                if (element) {
                    element.remove();
                    console.log(`🧹 Removed ${overlay} on logout`);
                }
            } else if (overlay) {
                overlay.remove();
                console.log('🧹 Removed fixed overlay on logout');
            }
        });
        
        // Hide all special pages
        document.querySelectorAll('.activity-page, .analytics-page, .messages-page, .profile-page').forEach(el => {
            if (el) {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.style.opacity = '0';
                el.style.zIndex = '-1';
            }
        });
        
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

// UI Handler functions (called from HTML)
async function handleLogin() {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    
    if (!emailInput || !passwordInput) {
        console.error('Login form elements not found');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        if (window.showNotification) {
            window.showNotification('Please enter email and password', 'error');
        }
        return;
    }
    
    const result = await login(email, password);
    if (result.success) {
        // Clear form
        emailInput.value = '';
        passwordInput.value = '';
        
        // Close modal if it exists
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.style.display = 'none';
        }
    }
}

async function handleSignup() {
    const usernameInput = document.getElementById('signupUsername');
    const emailInput = document.getElementById('signupEmail');
    const passwordInput = document.getElementById('signupPassword');
    
    if (!usernameInput || !emailInput || !passwordInput) {
        console.error('Signup form elements not found');
        return;
    }
    
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !email || !password) {
        if (window.showNotification) {
            window.showNotification('Please fill in all fields', 'error');
        }
        return;
    }
    
    const result = await signup(username, email, password);
    if (result.success) {
        // Clear form
        usernameInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';
        
        // Close modal if it exists
        const signupModal = document.getElementById('signupModal');
        if (signupModal) {
            signupModal.style.display = 'none';
        }
    }
}

async function handleLogout() {
    const result = await logout();
    if (result.success) {
        // Redirect to login or refresh page
        window.location.reload();
    }
}

// Make functions globally available
window.initAuth = initAuth;
window.getCurrentUser = getCurrentUser;
window.login = login;
window.signup = signup;
window.logout = logout;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleLogout = handleLogout;