// Mobile-specific authentication for VIB3
// Clean, simple auth without desktop complexity

let currentUser = null;

// Initialize auth state listener for mobile
function initAuth(onUserChange) {
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

// Simple login function for mobile using MongoDB
async function login(email, password) {
    console.log('📱 Mobile login called with MongoDB');
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        // Set auth state
        window.authToken = data.token || 'session-based';
        window.auth.currentUser = data.user;
        window.currentUser = data.user;
        
        // Trigger auth state change
        window.auth._triggerCallbacks(data.user);
        
        // Dispatch login event for mobile UI
        console.log('🚀 Mobile dispatching userLoggedIn event with user:', data.user);
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: data.user }));
        
        console.log('✅ Mobile login successful:', data);
        
        if (window.showNotification) {
            window.showNotification('Login successful!', 'success');
        }
        return { success: true, user: data.user };
    } catch (error) {
        console.error('❌ Mobile login error:', error);
        if (window.showNotification) {
            window.showNotification(error.message, 'error');
        }
        return { success: false, error: error.message };
    }
}

// Simple signup function for mobile using MongoDB
async function signup(username, email, password) {
    console.log('📱 Mobile signup called with MongoDB');
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, username })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        // Set auth state
        window.authToken = data.token || 'session-based';
        window.auth.currentUser = data.user;
        window.currentUser = data.user;
        
        // Trigger auth state change
        window.auth._triggerCallbacks(data.user);
        
        // Dispatch login event for mobile UI
        console.log('🚀 Mobile dispatching userLoggedIn event with user:', data.user);
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: data.user }));
        
        if (window.showNotification) {
            window.showNotification('Account created successfully!', 'success');
        }
        return { success: true, user: data.user };
    } catch (error) {
        console.error('❌ Mobile signup error:', error);
        if (window.showNotification) {
            window.showNotification(error.message, 'error');
        }
        return { success: false, error: error.message };
    }
}

// Simple logout function for mobile using MongoDB
async function logout() {
    console.log('📱 Mobile logout called with MongoDB');
    try {
        // Call server logout
        await fetch(`${window.API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        // Clear client state
        window.authToken = null;
        window.auth.currentUser = null;
        window.currentUser = null;
        
        // Trigger auth state change
        window.auth._triggerCallbacks(null);
        
        if (window.showNotification) {
            window.showNotification('Logged out successfully', 'info');
        }
        return { success: true };
    } catch (error) {
        console.error('❌ Mobile logout error:', error);
        if (window.showNotification) {
            window.showNotification(error.message, 'error');
        }
        return { success: false, error: error.message };
    }
}

// Mobile UI Handler functions (called from HTML)
async function handleLogin() {
    console.log('📱 Mobile handleLogin called with MongoDB auth');
    
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    
    if (!emailInput || !passwordInput) {
        console.error('Mobile login form elements not found');
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
    console.log('📱 Mobile login result:', result);
    
    if (result && result.success) {
        // Clear form
        emailInput.value = '';
        passwordInput.value = '';
        
        console.log('📱 Mobile login successful, events dispatched');
    } else {
        console.error('❌ Mobile login failed:', result);
    }
}

async function handleSignup() {
    console.log('📱 Mobile handleSignup called');
    
    const usernameInput = document.getElementById('signupName');
    const emailInput = document.getElementById('signupEmail');
    const passwordInput = document.getElementById('signupPassword');
    
    if (!usernameInput || !emailInput || !passwordInput) {
        console.error('Mobile signup form elements not found');
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
    console.log('📱 Mobile signup result:', result);
    
    if (result && result.success) {
        // Clear form
        usernameInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';
        
        // NO navigation logic here - let mobile-app.js handle it via auth state change
        console.log('📱 Mobile signup successful, waiting for auth state change...');
    }
}

async function handleLogout() {
    console.log('📱 Mobile handleLogout called');
    
    const result = await logout();
    if (result && result.success) {
        // Let the auth state change handle the UI update
        console.log('📱 Mobile logout successful, waiting for auth state change...');
    }
}

// Show login form
function showLogin() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm && signupForm) {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    }
}

// Show signup form
function showSignup() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm && signupForm) {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    }
}

// Make functions globally available for mobile
window.initAuth = initAuth;
window.getCurrentUser = getCurrentUser;
window.login = login;
window.signup = signup;
window.logout = logout;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleLogout = handleLogout;
window.showLogin = showLogin;
window.showSignup = showSignup;

console.log('📱 Mobile auth script loaded');