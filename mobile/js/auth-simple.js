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

// Password reset function
async function sendPasswordResetEmail(email) {
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (window.showNotification) {
                window.showNotification('Password reset email sent! Check your inbox.', 'success');
            }
            return { success: true };
        } else {
            throw new Error(data.error || 'Failed to send reset email');
        }
    } catch (error) {
        console.error('Password reset email error:', error);
        if (window.showNotification) {
            window.showNotification(error.message || 'Error sending reset email', 'error');
        }
        return { success: false, error: error.message };
    }
}

// Reset password with token
async function resetPasswordWithToken(token, newPassword) {
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, newPassword })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (window.showNotification) {
                window.showNotification('Password reset successful! You can now log in.', 'success');
            }
            return { success: true };
        } else {
            throw new Error(data.error || 'Failed to reset password');
        }
    } catch (error) {
        console.error('Password reset error:', error);
        if (window.showNotification) {
            window.showNotification(error.message || 'Error resetting password', 'error');
        }
        return { success: false, error: error.message };
    }
}

// UI handler for forgot password
async function handleForgotPassword() {
    const email = document.getElementById('resetEmail').value.trim();
    
    if (!email) {
        if (window.showNotification) {
            window.showNotification('Please enter your email address', 'error');
        }
        return;
    }
    
    if (!email.includes('@')) {
        if (window.showNotification) {
            window.showNotification('Please enter a valid email address', 'error');
        }
        return;
    }
    
    // Show loading state
    const button = document.querySelector('#forgotPasswordForm .auth-btn');
    const originalText = button.textContent;
    button.textContent = 'Sending...';
    button.disabled = true;
    
    const result = await sendPasswordResetEmail(email);
    
    // Reset button state
    button.textContent = originalText;
    button.disabled = false;
    
    if (result.success) {
        // Show success message and go back to login
        setTimeout(() => {
            showLogin();
        }, 2000);
    }
}

// UI handler for resetting password
async function handleResetPassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!newPassword || !confirmPassword) {
        if (window.showNotification) {
            window.showNotification('Please fill in both password fields', 'error');
        }
        return;
    }
    
    if (newPassword.length < 6) {
        if (window.showNotification) {
            window.showNotification('Password must be at least 6 characters', 'error');
        }
        return;
    }
    
    if (newPassword !== confirmPassword) {
        if (window.showNotification) {
            window.showNotification('Passwords do not match', 'error');
        }
        return;
    }
    
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('reset_token');
    
    if (!token) {
        if (window.showNotification) {
            window.showNotification('Invalid or expired reset link', 'error');
        }
        return;
    }
    
    // Show loading state
    const button = document.querySelector('#resetPasswordForm .auth-btn');
    const originalText = button.textContent;
    button.textContent = 'Resetting...';
    button.disabled = true;
    
    const result = await resetPasswordWithToken(token, newPassword);
    
    // Reset button state
    button.textContent = originalText;
    button.disabled = false;
    
    if (result.success) {
        // Clear URL parameters and show login form
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
            showLogin();
        }, 2000);
    }
}

// Show forgot password form
function showForgotPassword() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
    document.getElementById('resetPasswordForm').style.display = 'none';
    
    // Update title
    document.querySelector('.auth-form h2').textContent = 'Reset Password';
    
    // Clear form
    document.getElementById('resetEmail').value = '';
}

// Show login form
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'none';
    
    // Update title
    document.querySelector('.auth-form h2').textContent = 'Welcome to VIB3';
    
    // Clear error messages
    const errorDiv = document.getElementById('authError');
    if (errorDiv) {
        errorDiv.textContent = '';
    }
}

// Show signup form
function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'none';
    
    // Update title
    document.querySelector('.auth-form h2').textContent = 'Join VIB3';
}

// Check for reset token on page load
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('reset_token');
    
    if (resetToken) {
        // Show reset password form
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('forgotPasswordForm').style.display = 'none';
        document.getElementById('resetPasswordForm').style.display = 'block';
        
        // Update title
        document.querySelector('.auth-form h2').textContent = 'Set New Password';
    }
});

// Make functions globally available
window.initAuth = initAuth;
window.getCurrentUser = getCurrentUser;
window.login = login;
window.signup = signup;
window.logout = logout;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleLogout = handleLogout;
window.sendPasswordResetEmail = sendPasswordResetEmail;
window.resetPasswordWithToken = resetPasswordWithToken;
window.handleForgotPassword = handleForgotPassword;
window.handleResetPassword = handleResetPassword;
window.showForgotPassword = showForgotPassword;
window.showLogin = showLogin;
window.showSignup = showSignup;