// Early auth function fix - provides login/signup functions before modules load
(function() {
    console.log('🔧 Early auth fix loading...');
    
    // Temporary login function that will be replaced when modules load
    window.login = function() {
        console.log('⏳ Early login called - waiting for auth system...');
        
        // Show loading state
        const btn = document.querySelector('button[aria-label="Sign In"]');
        const originalText = btn ? btn.textContent : '';
        if (btn) {
            btn.textContent = 'Loading...';
            btn.disabled = true;
        }
        
        // Wait for the real login function to be available
        let attempts = 0;
        const checkForRealLogin = setInterval(() => {
            // Check if the real login function is available by looking for auth system
            if (window.auth || attempts > 50) {
                clearInterval(checkForRealLogin);
                
                if (btn) {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
                
                // Try calling the real login if it's available
                if (window.auth) {
                    console.log('✅ Auth system ready, calling real login');
                    
                    // Get form values
                    const emailInput = document.getElementById('loginEmail');
                    const passwordInput = document.getElementById('loginPassword');
                    
                    if (emailInput && passwordInput) {
                        const email = emailInput.value.trim();
                        const password = passwordInput.value.trim();
                        
                        if (email && password) {
                            // Call the real login function if it exists
                            const realLogin = window.loginUser || window.signIn;
                            if (realLogin) {
                                realLogin(email, password);
                            } else {
                                console.log('Real login function not found yet');
                            }
                        } else {
                            if (btn) {
                                btn.style.backgroundColor = '#ff4444';
                                setTimeout(() => {
                                    btn.style.backgroundColor = '';
                                }, 1000);
                            }
                        }
                    }
                } else {
                    console.log('⚠️ Auth system still not ready after waiting');
                }
            }
            attempts++;
        }, 100);
    };
    
    // Temporary signup function
    window.signup = function() {
        console.log('⏳ Early signup called - waiting for auth system...');
        
        const btn = document.querySelector('button[aria-label="Create Account"]');
        const originalText = btn ? btn.textContent : '';
        if (btn) {
            btn.textContent = 'Loading...';
            btn.disabled = true;
        }
        
        // Similar waiting logic for signup
        setTimeout(() => {
            if (btn) {
                btn.textContent = originalText;
                btn.disabled = false;
            }
            console.log('⚠️ Signup function placeholder - real function should load soon');
        }, 2000);
    };
    
    // Also provide early versions of showLogin/showSignup
    window.showLogin = function() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (loginForm && signupForm) {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
        }
    };
    
    window.showSignup = function() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (loginForm && signupForm) {
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
        }
    };
    
    console.log('✅ Early auth fix ready');
})();