// Main application initialization - MongoDB version
// This file sets up the core app functionality

console.log('🚀 Initializing VIB3 app (MongoDB version)...');

// Import MongoDB adapter functions
function setupGlobalMongoFunctions() {
    // Check if mongodb-adapter is loaded
    if (!window.mongoAPI) {
        console.error('MongoDB adapter not loaded yet, waiting...');
        setTimeout(setupGlobalMongoFunctions, 100);
        return;
    }
    
    console.log('✅ MongoDB adapter loaded, setting up global functions');
    
    // Auth functions from mongodb-adapter
    window.login = window.mongoAPI.login;
    window.signup = window.mongoAPI.signup;
    window.logout = window.mongoAPI.logout;
    window.getCurrentUser = window.mongoAPI.getCurrentUser;
    
    // Set ready flag
    window.mongoReady = true;
}

// Global auth functions for form handling
function setupGlobalAuthFunctions() {
    // Login function that reads from form
    window.handleLogin = async () => {
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        
        if (!emailInput || !passwordInput) {
            console.error('Login form elements not found');
            return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!email || !password) {
            if (window.showToast) {
                window.showToast('Please enter email and password', 'error');
            }
            return;
        }
        
        try {
            const result = await window.login(email, password);
            if (result.success) {
                // Hide auth container and show main app
                const authContainer = document.getElementById('authContainer');
                if (authContainer) authContainer.style.display = 'none';
                
                // Show main content
                const sidebar = document.getElementById('sidebar');
                const mainApp = document.getElementById('mainApp');
                if (sidebar) sidebar.style.display = 'block';
                if (mainApp) mainApp.style.display = 'block';
                
                // Load user profile
                if (window.loadUserProfile) {
                    window.loadUserProfile(result.user);
                }
                
                window.showToast('Welcome back!', 'success');
            }
        } catch (error) {
            console.error('Login error:', error);
            window.showToast(error.message || 'Login failed', 'error');
        }
    };
    
    // Signup function
    window.handleSignup = async () => {
        const nameInput = document.getElementById('signupName');
        const emailInput = document.getElementById('signupEmail');
        const passwordInput = document.getElementById('signupPassword');
        
        if (!nameInput || !emailInput || !passwordInput) {
            console.error('Signup form elements not found');
            return;
        }
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!name || !email || !password) {
            window.showToast('Please fill all fields', 'error');
            return;
        }
        
        if (password.length < 6) {
            window.showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        try {
            const result = await window.signup(email, password, name);
            if (result.success) {
                window.showToast('Account created successfully!', 'success');
                // Auto login after signup
                await window.handleLogin();
            }
        } catch (error) {
            console.error('Signup error:', error);
            window.showToast(error.message || 'Signup failed', 'error');
        }
    };
    
    // Form switching functions
    window.showLogin = () => {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    };
    
    window.showSignup = () => {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    };
    
    // Logout function
    window.handleLogout = async () => {
        try {
            await window.logout();
            // Show auth container and hide main app
            const authContainer = document.getElementById('authContainer');
            if (authContainer) authContainer.style.display = 'block';
            
            // Hide main content
            const sidebar = document.getElementById('sidebar');
            const mainApp = document.getElementById('mainApp');
            if (sidebar) sidebar.style.display = 'none';
            if (mainApp) mainApp.style.display = 'none';
            
            window.showToast('Logged out successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            window.showToast('Logout failed', 'error');
        }
    };
}

// Initialize the app
export function initializeApp() {
    console.log('📱 Starting VIB3 app initialization...');
    
    // Set up MongoDB functions
    setupGlobalMongoFunctions();
    
    // Set up auth form handlers
    setupGlobalAuthFunctions();
    
    // Check for existing session
    setTimeout(() => {
        if (window.mongoAPI && window.mongoAPI.getCurrentUser) {
            const currentUser = window.mongoAPI.getCurrentUser();
            if (currentUser) {
                console.log('✅ Found existing session for:', currentUser.email);
                // Auto-login with existing session
                const authContainer = document.getElementById('authContainer');
                if (authContainer) authContainer.style.display = 'none';
                
                const sidebar = document.getElementById('sidebar');
                const mainApp = document.getElementById('mainApp');
                if (sidebar) sidebar.style.display = 'block';
                if (mainApp) mainApp.style.display = 'block';
                
                if (window.loadUserProfile) {
                    window.loadUserProfile(currentUser);
                }
            }
        }
    }, 500);
    
    console.log('✅ VIB3 app initialization complete');
}

// Auto-initialize if this is loaded directly
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}