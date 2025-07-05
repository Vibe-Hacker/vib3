// Auth handlers - NEW FILE to bypass Railway cache
console.log('🔐 Auth handlers loading (NEW FILE)...');

// Define auth UI handlers
window.handleLogin = async function() {
    console.log('🔐 handleLogin called');
    
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const errorDiv = document.getElementById('authError');
    const loadingDiv = document.getElementById('authLoading');
    
    if (!emailInput || !passwordInput) {
        console.error('Login form elements not found');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        if (errorDiv) {
            errorDiv.textContent = 'Please enter email and password';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    // Show loading
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (errorDiv) errorDiv.style.display = 'none';
    
    try {
        const result = await window.signInWithEmailAndPassword(window.auth, email, password);
        console.log('✅ Login successful:', result);
        
        // Hide auth container
        const authContainer = document.getElementById('authContainer');
        if (authContainer) authContainer.style.display = 'none';
        
        // Clear form
        emailInput.value = '';
        passwordInput.value = '';
        
        // Reload feed
        if (window.loadFeedVideos) {
            window.loadFeedVideos('foryou');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        if (errorDiv) {
            errorDiv.textContent = error.message || 'Login failed. Please try again.';
            errorDiv.style.display = 'block';
        }
    } finally {
        if (loadingDiv) loadingDiv.style.display = 'none';
    }
};

window.handleSignup = async function() {
    console.log('📝 handleSignup called');
    
    const nameInput = document.getElementById('signupName');
    const emailInput = document.getElementById('signupEmail');
    const passwordInput = document.getElementById('signupPassword');
    const errorDiv = document.getElementById('authError');
    const loadingDiv = document.getElementById('authLoading');
    
    if (!emailInput || !passwordInput) {
        console.error('Signup form elements not found');
        return;
    }
    
    const displayName = nameInput ? nameInput.value.trim() : '';
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        if (errorDiv) {
            errorDiv.textContent = 'Please enter email and password';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    if (password.length < 6) {
        if (errorDiv) {
            errorDiv.textContent = 'Password must be at least 6 characters';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    // Show loading
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (errorDiv) errorDiv.style.display = 'none';
    
    try {
        const result = await window.createUserWithEmailAndPassword(window.auth, email, password, displayName);
        console.log('✅ Signup successful:', result);
        
        // Hide auth container
        const authContainer = document.getElementById('authContainer');
        if (authContainer) authContainer.style.display = 'none';
        
        // Clear form
        if (nameInput) nameInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';
        
        // Show login form
        showLogin();
    } catch (error) {
        console.error('❌ Signup error:', error);
        if (errorDiv) {
            errorDiv.textContent = error.message || 'Signup failed. Please try again.';
            errorDiv.style.display = 'block';
        }
    } finally {
        if (loadingDiv) loadingDiv.style.display = 'none';
    }
};

window.handleLogout = async function() {
    console.log('🚪 handleLogout called');
    
    try {
        await window.signOut(window.auth);
        console.log('✅ Logout successful');
        
        // Show auth container
        const authContainer = document.getElementById('authContainer');
        if (authContainer) authContainer.style.display = 'flex';
        
        // Reload page
        window.location.reload();
    } catch (error) {
        console.error('❌ Logout error:', error);
        if (window.showNotification) {
            window.showNotification('Logout failed', 'error');
        }
    }
};

window.showLogin = function() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const errorDiv = document.getElementById('authError');
    
    if (loginForm) loginForm.style.display = 'block';
    if (signupForm) signupForm.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';
};

window.showSignup = function() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const errorDiv = document.getElementById('authError');
    
    if (loginForm) loginForm.style.display = 'none';
    if (signupForm) signupForm.style.display = 'block';
    if (errorDiv) errorDiv.style.display = 'none';
};

console.log('✅ Auth handlers ready (NEW FILE)');