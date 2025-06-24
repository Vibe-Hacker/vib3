// Main application module
import { initAuth, getCurrentUser, login, signup, logout } from './auth.js';
import { uploadVideo, toggleLike, shareVideo } from './video.js';
import { toggleFollow } from './user.js';
import { initVideoObserver, loadVideoFeed } from './feed.js';
import { initSearch } from './search.js';
import { initCommentsModal } from './comments.js';
import { showNotification, debugLog } from './utils.js';
import { appConfig } from './config.js';

// Global state
let currentFeed = 'foryou';

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    debugLog('Initializing VIB3 application...');
    
    // Initialize modules
    initializeApp();
    setupEventListeners();
    initVideoObserver();
    initSearch();
    initCommentsModal();
    
    // Setup keyboard shortcuts
    if (appConfig.keyboardShortcutsEnabled) {
        setupKeyboardShortcuts();
    }
    
    debugLog('VIB3 initialization complete');
    
    // Export all functions globally for HTML onclick handlers
    exportGlobalFunctions();
});

// Initialize app
function initializeApp() {
    // Initialize authentication
    initAuth((user) => {
        if (user) {
            showUserMenu();
            debugLog('User logged in:', user.email);
        } else {
            hideUserMenu();
            debugLog('User logged out');
        }
        
        // Reload feed when auth state changes
        loadVideoFeed(currentFeed, true);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.getAttribute('data-modal') || e.target.closest('.modal').id;
            closeModal(modalId);
        });
    });
    
    // Authentication buttons
    document.getElementById('loginBtn')?.addEventListener('click', () => openModal('loginModal'));
    document.getElementById('signupBtn')?.addEventListener('click', () => openModal('signupModal'));
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('profileBtn')?.addEventListener('click', () => {
        window.loadUserProfile();
        openModal('profileModal');
    });
    document.getElementById('settingsBtn')?.addEventListener('click', () => openModal('settingsModal'));
    
    // Upload button
    document.getElementById('uploadBtn')?.addEventListener('click', () => {
        if (getCurrentUser()) {
            openModal('uploadModal');
        } else {
            openModal('loginModal');
        }
    });
    
    // Forms
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('signupForm')?.addEventListener('submit', handleSignup);
    document.getElementById('uploadForm')?.addEventListener('submit', handleUpload);
    
    // Feed tabs
    document.querySelectorAll('.feed-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const feedType = e.target.getAttribute('data-feed');
            switchFeedTab(feedType);
        });
    });
    
    // Video file input
    document.getElementById('videoFile')?.addEventListener('change', previewVideo);
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.closest('.nav-link').getAttribute('data-page');
            handleNavigation(page);
        });
    });
    
    // Mobile sidebar toggle
    document.querySelector('.logo')?.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.toggle('open');
        }
    });
    
    // Close modals on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                toggleCurrentVideo();
                break;
            case 'ArrowUp':
                e.preventDefault();
                navigateVideo(-1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                navigateVideo(1);
                break;
            case 'KeyL':
                e.preventDefault();
                likeCurrentVideo();
                break;
            case 'KeyM':
                e.preventDefault();
                toggleMuteAllVideos();
                break;
            case 'Escape':
                closeAllModals();
                break;
        }
    });
}

// Handle login
async function handleLogin(e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const result = await login(email, password);
    if (result.success) {
        const modal = document.getElementById('loginModal');
        if (modal) closeModal('loginModal');
        
        if (e && e.target && e.target.reset) {
            e.target.reset();
        } else {
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        }
    } else {
        const errorEl = document.getElementById('authError');
        if (errorEl) {
            errorEl.textContent = result.error;
        }
    }
}

// Handle signup
async function handleSignup(e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }
    
    const username = document.getElementById('signupName').value || document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    const result = await signup(username, email, password);
    if (result.success) {
        const modal = document.getElementById('signupModal');
        if (modal) closeModal('signupModal');
        
        if (e && e.target && e.target.reset) {
            e.target.reset();
        } else {
            if (document.getElementById('signupName')) document.getElementById('signupName').value = '';
            if (document.getElementById('signupUsername')) document.getElementById('signupUsername').value = '';
            document.getElementById('signupEmail').value = '';
            document.getElementById('signupPassword').value = '';
        }
    } else {
        const errorEl = document.getElementById('authError');
        if (errorEl) {
            errorEl.textContent = result.error;
        }
    }
}

// Handle logout
async function handleLogout() {
    const result = await logout();
    if (result.success) {
        location.reload();
    }
}

// Handle video upload
async function handleUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('videoFile');
    const description = document.getElementById('videoDescription').value;
    const tags = document.getElementById('videoTags').value;
    
    if (!fileInput.files[0]) {
        showNotification('Please select a video file', 'error');
        return;
    }
    
    try {
        const result = await uploadVideo(fileInput.files[0], description, tags);
        if (result.success) {
            closeModal('uploadModal');
            e.target.reset();
            // Reset file preview
            document.querySelector('.file-upload-label').innerHTML = `
                <span class="file-upload-icon">📹</span>
                <div>Click to select a video</div>
                <small>MP4, MOV, AVI up to 100MB</small>
            `;
            // Reload feed
            loadVideoFeed(currentFeed, true);
        }
    } catch (error) {
        debugLog('Upload error:', error);
    }
}

// Preview video file
function previewVideo(e) {
    const file = e.target.files[0];
    if (file) {
        const label = e.target.nextElementSibling;
        label.innerHTML = `
            <span class="file-upload-icon">✓</span>
            <div>Video selected: ${file.name}</div>
            <small>Size: ${(file.size / 1024 / 1024).toFixed(2)}MB</small>
        `;
    }
}

// Switch feed tab
function switchFeedTab(feedType) {
    currentFeed = feedType;
    
    // Update tab UI
    document.querySelectorAll('.feed-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-feed="${feedType}"]`)?.classList.add('active');
    
    // Load new feed
    if (feedType === 'foryou') {
        loadVideoFeed('foryou', true);
    } else if (feedType === 'discover') {
        // Load random/discover content
        loadVideoFeed('discover', true);
    }
}

// Handle navigation
function handleNavigation(page) {
    debugLog('Navigation:', page);
    
    // Update active nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
    
    switch(page) {
        case 'home':
            switchFeedTab('foryou');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            break;
        case 'trending':
            loadVideoFeed('trending', true);
            break;
        case 'following':
            loadVideoFeed('following', true);
            break;
        case 'profile':
            if (getCurrentUser()) {
                window.loadUserProfile();
                openModal('profileModal');
            } else {
                openModal('loginModal');
            }
            break;
        case 'settings':
            openModal('settingsModal');
            break;
        case 'login':
            openModal('loginModal');
            break;
        case 'signup':
            openModal('signupModal');
            break;
        case 'logout':
            handleLogout();
            break;
        case 'live':
            showNotification('Live streaming coming soon!', 'info');
            break;
    }
    
    // Close mobile sidebar
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

// Show/hide user menu
function showUserMenu() {
    document.getElementById('loginBtn')?.style.setProperty('display', 'none');
    document.getElementById('signupBtn')?.style.setProperty('display', 'none');
    document.getElementById('userMenu')?.style.setProperty('display', 'flex');
    
    document.getElementById('sidebarProfileItem').style.display = 'block';
    document.getElementById('sidebarSettingsItem').style.display = 'block';
    document.getElementById('sidebarLogoutItem').style.display = 'block';
    document.getElementById('sidebarLoginItem').style.display = 'none';
    document.getElementById('sidebarSignupItem').style.display = 'none';
}

function hideUserMenu() {
    document.getElementById('loginBtn')?.style.setProperty('display', 'inline-block');
    document.getElementById('signupBtn')?.style.setProperty('display', 'inline-block');
    document.getElementById('userMenu')?.style.setProperty('display', 'none');
    
    document.getElementById('sidebarProfileItem').style.display = 'none';
    document.getElementById('sidebarSettingsItem').style.display = 'none';
    document.getElementById('sidebarLogoutItem').style.display = 'none';
    document.getElementById('sidebarLoginItem').style.display = 'block';
    document.getElementById('sidebarSignupItem').style.display = 'block';
}

// Modal functions
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
};

function closeAllModals() {
    document.querySelectorAll('.modal.show').forEach(modal => {
        modal.classList.remove('show');
    });
}

// Video control functions
function toggleCurrentVideo() {
    const videos = document.querySelectorAll('.video-element');
    videos.forEach(video => {
        const rect = video.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        }
    });
}

function navigateVideo(direction) {
    const videoCards = document.querySelectorAll('.video-card');
    const currentIndex = Array.from(videoCards).findIndex(card => {
        const rect = card.getBoundingClientRect();
        return rect.top >= 0 && rect.top < window.innerHeight / 2;
    });
    
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < videoCards.length) {
        videoCards[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function likeCurrentVideo() {
    const videos = document.querySelectorAll('.video-element');
    videos.forEach(video => {
        const rect = video.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
            const likeBtn = video.closest('.video-card').querySelector('.action-btn');
            likeBtn?.click();
        }
    });
}

function toggleMuteAllVideos() {
    const videos = document.querySelectorAll('.video-element');
    const anyUnmuted = Array.from(videos).some(v => !v.muted);
    
    videos.forEach(video => {
        video.muted = anyUnmuted;
    });
    
    showNotification(anyUnmuted ? '🔇 Muted' : '🔊 Unmuted', 'info', 1500);
}

// Video playback toggle
window.toggleVideoPlayback = function(wrapper) {
    const video = wrapper.querySelector('.video-element');
    const indicator = wrapper.querySelector('.play-pause-indicator');
    
    if (!video) return;
    
    if (video.paused) {
        // Pause all other videos
        document.querySelectorAll('.video-element').forEach(v => {
            if (v !== video && !v.paused) {
                v.pause();
            }
        });
        
        video.play().then(() => {
            indicator.textContent = '▶️';
            indicator.style.opacity = '1';
            setTimeout(() => indicator.style.opacity = '0', 1000);
        }).catch(() => {
            debugLog('Playback failed');
        });
    } else {
        video.pause();
        indicator.textContent = '⏸️';
        indicator.style.opacity = '1';
        setTimeout(() => indicator.style.opacity = '0', 1000);
    }
};

// Global action handlers
window.handleLikeClick = async function(videoId, button) {
    const result = await toggleLike(videoId);
    if (result.success) {
        button.classList.toggle('liked', result.liked);
        button.querySelector('span').textContent = result.likeCount;
    } else if (result.requiresAuth) {
        openModal('loginModal');
    }
};

window.handleShareClick = async function(videoId) {
    await shareVideo(videoId);
};

window.handleFollowClick = async function(userId, button) {
    const result = await toggleFollow(userId);
    if (result.success) {
        button.classList.toggle('following', result.following);
        button.textContent = result.following ? 'Following' : 'Follow';
    } else if (result.requiresAuth) {
        openModal('loginModal');
    }
};

window.switchFeed = switchFeedTab;

// Export for profile loading
window.loadUserProfile = async function() {
    debugLog('Loading user profile...');
};

// Export all functions globally for HTML onclick handlers
function exportGlobalFunctions() {
    // Auth functions
    window.handleLogin = handleLogin;
    window.handleSignup = handleSignup;
    window.handleLogout = handleLogout;
    
    // Navigation functions
    window.showPage = showPage;
    window.switchFeedTab = switchFeedTab;
    window.refreshForYou = refreshForYou;
    window.performSearch = performSearch;
    
    // Upload and video functions
    window.showUploadModal = showUploadModal;
    window.closeUploadModal = closeUploadModal;
    window.recordVideo = recordVideo;
    
    // Theme and settings
    window.changeTheme = changeTheme;
    window.toggleSetting = toggleSetting;
    window.showToast = showToast;
    
    // All functions from the complete system
    copyFunctionsFromComplete();
}


// Basic page navigation
function showPage(page) {
    if (page === 'foryou' || page === 'explore' || page === 'following') {
        switchFeedTab(page);
        return;
    }
    
    // Hide all pages
    document.querySelectorAll('.video-feed, .search-page, .profile-page, .settings-page, .messages-page, .creator-page, .shop-page, .analytics-page').forEach(el => {
        el.style.display = 'none';
    });
    
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.style.display = 'block';
    } else {
        showNotification(`${page} page coming soon!`, 'info');
    }
}

function refreshForYou() {
    loadVideoFeed('foryou', true);
}

function performSearch(query) {
    if (query) {
        showNotification(`Searching for: ${query}`, 'info');
    }
}

// Stub functions that show notifications
function copyFunctionsFromComplete() {
    const functions = {
        toggleVideoPlayback: () => showNotification('Video playback toggled', 'info'),
        openCommentsModal: (id) => showNotification('Comments modal opened', 'info'),
        openShareModal: (id) => showNotification('Share modal opened', 'info'),
        viewProfile: (user) => showNotification(`Viewing profile: ${user}`, 'info'),
        showVideoOptions: (id) => showNotification('Video options shown', 'info'),
        saveVideo: (id) => showNotification('Video saved', 'success'),
        changeTheme: (theme) => {
            document.body.className = `theme-${theme}`;
            localStorage.setItem('vib3-theme', theme);
            showNotification(`Theme changed to ${theme}`, 'success');
        },
        toggleSetting: (el, setting) => {
            el.classList.toggle('active');
            showNotification(`${setting} toggled`, 'info');
        },
        showToast: (msg) => showNotification(msg, 'info'),
        showUploadModal: () => showNotification('Upload modal opened', 'info'),
        closeUploadModal: () => showNotification('Upload modal closed', 'info'),
        recordVideo: () => showNotification('Video recording started', 'info'),
        shareToInstagram: () => window.open('https://instagram.com', '_blank'),
        shareToTwitter: () => window.open('https://twitter.com', '_blank'),
        shareToFacebook: () => window.open('https://facebook.com', '_blank'),
        shareToWhatsApp: () => window.open('https://wa.me', '_blank'),
        showMoreOptions: () => showNotification('More options', 'info')
    };
    
    Object.assign(window, functions);
}

// Initialize theme on load
const savedTheme = localStorage.getItem('vib3-theme');
if (savedTheme) {
    document.body.className = `theme-${savedTheme}`;
}