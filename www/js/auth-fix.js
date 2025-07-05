// Auth fix to connect HTML login form to MongoDB adapter
console.log('🔐 Auth fix loading...');

// Wait for mongodb-adapter to load
function setupAuthFunctions() {
    if (!window.signInWithEmailAndPassword) {
        console.log('Waiting for MongoDB adapter...');
        setTimeout(setupAuthFunctions, 100);
        return;
    }
    
    console.log('✅ Setting up auth functions');
    
    // Create login function that the HTML expects
    window.login = async function() {
        console.log('🔐 Login function called');
        
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        const errorDiv = document.getElementById('authError');
        const loadingDiv = document.getElementById('authLoading');
        
        if (!emailInput || !passwordInput) {
            console.error('Login inputs not found');
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
            console.log('🔐 Attempting login for:', email);
            const result = await window.signInWithEmailAndPassword(window.auth, email, password);
            
            console.log('✅ Login successful:', result);
            
            // Hide auth container and show main app
            const authContainer = document.getElementById('authContainer');
            if (authContainer) authContainer.style.display = 'none';
            
            // Reload to show main content
            window.location.reload();
            
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
    
    // Create signup function
    window.signup = async function() {
        console.log('📝 Signup function called');
        
        const nameInput = document.getElementById('signupName');
        const emailInput = document.getElementById('signupEmail');
        const passwordInput = document.getElementById('signupPassword');
        const errorDiv = document.getElementById('authError');
        const loadingDiv = document.getElementById('authLoading');
        
        if (!emailInput || !passwordInput) {
            console.error('Signup inputs not found');
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
            console.log('📝 Creating account for:', email);
            const result = await window.createUserWithEmailAndPassword(window.auth, email, password, displayName);
            
            console.log('✅ Account created:', result);
            
            // Auto-login after signup
            window.location.reload();
            
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
    
    // Form switching functions
    window.showLogin = function() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('authError').style.display = 'none';
    };
    
    window.showSignup = function() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
        document.getElementById('authError').style.display = 'none';
    };
    
    console.log('✅ Auth functions ready');
}

// Start setup
setupAuthFunctions();

// Also handle Enter key in password fields
document.addEventListener('DOMContentLoaded', function() {
    const loginPassword = document.getElementById('loginPassword');
    const signupPassword = document.getElementById('signupPassword');
    
    if (loginPassword) {
        loginPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                window.login();
            }
        });
    }
    
    if (signupPassword) {
        signupPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                window.signup();
            }
        });
    }
});