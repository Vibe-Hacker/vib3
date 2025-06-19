// Centralized Event Management System
// Replaces inline onclick handlers with modern event listeners

class EventManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('Event manager initializing...');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.attachAllEventListeners());
        } else {
            this.attachAllEventListeners();
        }
    }

    attachAllEventListeners() {
        console.log('Attaching modern event listeners...');
        
        // Authentication handlers
        this.setupAuthenticationHandlers();
        
        // Navigation handlers  
        this.setupNavigationHandlers();
        
        // Upload modal handlers
        this.setupUploadHandlers();
        
        // Settings handlers
        this.setupSettingsHandlers();
        
        // Share modal handlers
        this.setupShareHandlers();
        
        // Delete modal handlers
        this.setupDeleteModalHandlers();

        console.log('All event listeners attached successfully');
        
        // Remove all inline onclick handlers after event listeners are attached
        this.removeInlineHandlers();
    }

    // Helper method to safely add event listeners
    addEventListenerSafe(selector, event, handler, options = {}) {
        const elements = document.querySelectorAll(selector);
        console.log(`addEventListenerSafe: Found ${elements.length} elements for selector "${selector}"`);
        elements.forEach((element, index) => {
            console.log(`  Adding ${event} listener to element ${index}:`, element);
            // Remove existing listeners to prevent duplicates
            element.removeEventListener(event, handler);
            element.addEventListener(event, handler, options);
        });
        return elements.length;
    }

    // Authentication event handlers
    setupAuthenticationHandlers() {
        // Login button
        this.addEventListenerSafe('button[aria-label="Sign In"]', 'click', (e) => {
            e.preventDefault();
            if (window.login) window.login();
        });

        // Signup button  
        this.addEventListenerSafe('button[aria-label="Create Account"]', 'click', (e) => {
            e.preventDefault();
            if (window.signup) window.signup();
        });

        // Show signup link
        this.addEventListenerSafe('a[onclick*="showSignup"]', 'click', (e) => {
            e.preventDefault();
            if (window.showSignup) window.showSignup();
        });

        // Show login link
        this.addEventListenerSafe('a[onclick*="showLogin"]', 'click', (e) => {
            e.preventDefault();
            if (window.showLogin) window.showLogin();
        });

        console.log('Authentication handlers attached');
    }

    // Navigation event handlers
    setupNavigationHandlers() {
        // Sidebar navigation buttons - use showPage to ensure proper highlighting
        const navigationMap = {
            '#sidebarHome': () => {
                // Clear all active states and highlight home button
                console.log('Home button clicked - setting active state');
                // Reset all buttons to normal color
                document.querySelectorAll('.sidebar-item').forEach(item => {
                    item.classList.remove('active');
                    item.style.color = 'rgba(255, 255, 255, 0.75)';
                    const icon = item.querySelector('.sidebar-icon');
                    const text = item.querySelector('.sidebar-text');
                    if (icon) icon.style.color = 'rgba(255, 255, 255, 0.75)';
                    if (text) text.style.color = 'rgba(255, 255, 255, 0.75)';
                });
                
                const homeBtn = document.getElementById('sidebarHome');
                if (homeBtn) {
                    homeBtn.classList.add('active');
                    // Force red color via JavaScript
                    homeBtn.style.color = '#fe2c55';
                    const icon = homeBtn.querySelector('.sidebar-icon');
                    const text = homeBtn.querySelector('.sidebar-text');
                    if (icon) icon.style.color = '#fe2c55';
                    if (text) text.style.color = '#fe2c55';
                    
                    console.log('Home button active class added');
                    console.log('Home button classes:', homeBtn.className);
                    console.log('Home button computed style:', window.getComputedStyle(homeBtn).color);
                }
                window.switchFeedTab && window.switchFeedTab('foryou');
            },
            '#sidebarExplore': () => {
                // Clear all active states and highlight explore button
                console.log('Explore button clicked - setting active state');
                // Reset all buttons to normal color
                document.querySelectorAll('.sidebar-item').forEach(item => {
                    item.classList.remove('active');
                    item.style.color = 'rgba(255, 255, 255, 0.75)'; // Reset to normal color
                    // Reset child elements too
                    const icon = item.querySelector('.sidebar-icon');
                    const text = item.querySelector('.sidebar-text');
                    if (icon) icon.style.color = 'rgba(255, 255, 255, 0.75)';
                    if (text) text.style.color = 'rgba(255, 255, 255, 0.75)';
                });
                
                const exploreBtn = document.getElementById('sidebarExplore');
                if (exploreBtn) {
                    exploreBtn.classList.add('active');
                    // Force red color via JavaScript
                    exploreBtn.style.color = '#fe2c55';
                    const icon = exploreBtn.querySelector('.sidebar-icon');
                    const text = exploreBtn.querySelector('.sidebar-text');
                    if (icon) icon.style.color = '#fe2c55';
                    if (text) text.style.color = '#fe2c55';
                    
                    console.log('Explore button active class added');
                    console.log('Explore button classes:', exploreBtn.className);
                    console.log('Explore button computed style:', window.getComputedStyle(exploreBtn).color);
                }
                window.switchFeedTab && window.switchFeedTab('explore');
            },
            '#sidebarFollowing': () => {
                // Clear all active states and highlight following button
                console.log('Following button clicked - setting active state');
                // Reset all buttons to normal color
                document.querySelectorAll('.sidebar-item').forEach(item => {
                    item.classList.remove('active');
                    item.style.color = 'rgba(255, 255, 255, 0.75)';
                    const icon = item.querySelector('.sidebar-icon');
                    const text = item.querySelector('.sidebar-text');
                    if (icon) icon.style.color = 'rgba(255, 255, 255, 0.75)';
                    if (text) text.style.color = 'rgba(255, 255, 255, 0.75)';
                });
                
                const followingBtn = document.getElementById('sidebarFollowing');
                if (followingBtn) {
                    followingBtn.classList.add('active');
                    // Force red color via JavaScript
                    followingBtn.style.color = '#fe2c55';
                    const icon = followingBtn.querySelector('.sidebar-icon');
                    const text = followingBtn.querySelector('.sidebar-text');
                    if (icon) icon.style.color = '#fe2c55';
                    if (text) text.style.color = '#fe2c55';
                    
                    console.log('Following button active class added');
                }
                window.switchFeedTab && window.switchFeedTab('following');
            },
            '#sidebarFriends': () => {
                // Clear all active states and highlight friends button
                console.log('Friends button clicked - setting active state');
                // Reset all buttons to normal color
                document.querySelectorAll('.sidebar-item').forEach(item => {
                    item.classList.remove('active');
                    item.style.color = 'rgba(255, 255, 255, 0.75)';
                    const icon = item.querySelector('.sidebar-icon');
                    const text = item.querySelector('.sidebar-text');
                    if (icon) icon.style.color = 'rgba(255, 255, 255, 0.75)';
                    if (text) text.style.color = 'rgba(255, 255, 255, 0.75)';
                });
                
                const friendsBtn = document.getElementById('sidebarFriends');
                if (friendsBtn) {
                    friendsBtn.classList.add('active');
                    // Force red color via JavaScript
                    friendsBtn.style.color = '#fe2c55';
                    const icon = friendsBtn.querySelector('.sidebar-icon');
                    const text = friendsBtn.querySelector('.sidebar-text');
                    if (icon) icon.style.color = '#fe2c55';
                    if (text) text.style.color = '#fe2c55';
                    
                    console.log('Friends button active class added');
                }
                window.showPage && window.showPage('friends');
            },
            '#sidebarProfile': () => {
                // Clear all active states and highlight profile button
                console.log('Profile button clicked - setting active state');
                // Reset all buttons to normal color
                document.querySelectorAll('.sidebar-item').forEach(item => {
                    item.classList.remove('active');
                    item.style.color = 'rgba(255, 255, 255, 0.75)';
                    const icon = item.querySelector('.sidebar-icon');
                    const text = item.querySelector('.sidebar-text');
                    if (icon) icon.style.color = 'rgba(255, 255, 255, 0.75)';
                    if (text) text.style.color = 'rgba(255, 255, 255, 0.75)';
                });
                
                const profileBtn = document.getElementById('sidebarProfile');
                if (profileBtn) {
                    profileBtn.classList.add('active');
                    // Force red color via JavaScript
                    profileBtn.style.color = '#fe2c55';
                    const icon = profileBtn.querySelector('.sidebar-icon');
                    const text = profileBtn.querySelector('.sidebar-text');
                    if (icon) icon.style.color = '#fe2c55';
                    if (text) text.style.color = '#fe2c55';
                    
                    console.log('Profile button active class added');
                }
                window.showPage && window.showPage('profile');
            }
        };

        // Add handlers for other navigation buttons
        const otherNavigationHandlers = {
            'button[onclick*="activity"]': () => {
                console.log('Activity button clicked via event listener');
                window.showPage && window.showPage('activity');
            },
            'button[onclick*="messages"]': () => {
                console.log('Messages button clicked via event listener');
                window.showPage && window.showPage('messages');
            }
        };

        Object.entries(navigationMap).forEach(([selector, handler]) => {
            this.addEventListenerSafe(selector, 'click', (e) => {
                e.preventDefault();
                handler();
            });
        });

        // Add other navigation handlers
        Object.entries(otherNavigationHandlers).forEach(([selector, handler]) => {
            this.addEventListenerSafe(selector, 'click', (e) => {
                e.preventDefault();
                handler();
            });
        });

        // Feed tab buttons
        this.addEventListenerSafe('#foryouTab', 'click', (e) => {
            e.preventDefault();
            if (window.switchFeedTab) window.switchFeedTab('foryou');
        });

        this.addEventListenerSafe('#followingTab', 'click', (e) => {
            e.preventDefault();
            if (window.switchFeedTab) window.switchFeedTab('following');
        });

        this.addEventListenerSafe('#discoverTab', 'click', (e) => {
            e.preventDefault();
            if (window.switchFeedTab) window.switchFeedTab('discover');
        });

        // Logo refresh
        this.addEventListenerSafe('.sidebar-logo', 'click', (e) => {
            e.preventDefault();
            if (window.refreshForYou) window.refreshForYou();
        });

        console.log('Navigation handlers attached');
    }

    // Upload modal handlers  
    setupUploadHandlers() {
        // Upload modal trigger
        this.addEventListenerSafe('button[onclick*="showUploadModal"]', 'click', (e) => {
            e.preventDefault();
            if (window.showUploadModal) window.showUploadModal();
        });

        // Upload modal close
        this.addEventListenerSafe('button[onclick*="closeUploadModal"]', 'click', (e) => {
            e.preventDefault();
            if (window.closeUploadModal) window.closeUploadModal();
        });

        // Record video
        this.addEventListenerSafe('.upload-option[onclick*="recordVideo"]', 'click', (e) => {
            e.preventDefault();
            if (window.recordVideo) window.recordVideo();
        });

        // Select video
        this.addEventListenerSafe('.upload-option[onclick*="selectVideo"]', 'click', (e) => {
            e.preventDefault();
            if (window.selectVideo) window.selectVideo();
        });

        // Back to step 1 - use class selector
        this.addEventListenerSafe('.cancel-btn', 'click', (e) => {
            e.preventDefault();
            console.log('Back button clicked - calling backToStep1');
            if (window.backToStep1) window.backToStep1();
        });

        // Upload/Publish video - use class selector
        this.addEventListenerSafe('.publish-btn', 'click', (e) => {
            e.preventDefault();
            console.log('=== PUBLISH BUTTON CLICKED IN EVENT MANAGER ===');
            console.log('Event target:', e.target);
            console.log('Event currentTarget:', e.currentTarget);
            console.log('Button element:', e.target.closest('.publish-btn'));
            console.log('Button innerHTML:', e.target.innerHTML);
            console.log('Button classList:', e.target.classList.toString());
            console.log('uploadVideo function exists:', typeof window.uploadVideo);
            console.log('uploadManager exists:', typeof window.uploadManager);
            console.log('Current user:', window.currentUser?.uid);
            console.log('Selected video file:', window.selectedVideoFile?.name);
            
            // Additional debugging
            console.log('Upload modal element:', document.getElementById('uploadModal'));
            console.log('Upload step 2 visible:', document.getElementById('uploadStep2')?.style.display);
            console.log('Video title value:', document.getElementById('videoTitle')?.value);
            console.log('Video description value:', document.getElementById('videoDescription')?.value);
            
            if (window.uploadVideo) {
                console.log('Calling window.uploadVideo()');
                window.uploadVideo();
            } else {
                console.error('window.uploadVideo function not found!');
            }
        });

        // Show trending sounds - use class selector
        this.addEventListenerSafe('.trending-sounds-btn', 'click', (e) => {
            e.preventDefault();
            console.log('Choose sound button clicked - calling showTrendingSounds');
            if (window.showTrendingSounds) window.showTrendingSounds();
        });

        // Debug: Check how many elements were found and add direct listeners
        const publishBtns = document.querySelectorAll('.publish-btn');
        const soundBtns = document.querySelectorAll('.trending-sounds-btn');
        const backBtns = document.querySelectorAll('.cancel-btn');
        
        console.log(`Upload handlers attached: ${publishBtns.length} publish buttons, ${soundBtns.length} sound buttons, ${backBtns.length} back buttons`);
        
        // Add direct event listeners as backup
        publishBtns.forEach((btn, index) => {
            console.log(`Adding direct listener to publish button ${index}:`, btn);
            console.log(`Button ${index} element:`, btn.outerHTML);
            console.log(`Button ${index} parent:`, btn.parentElement);
            console.log(`Button ${index} offsetParent:`, btn.offsetParent);
            
            // Try multiple event types
            ['click', 'mousedown', 'touchstart'].forEach(eventType => {
                btn.addEventListener(eventType, (e) => {
                    console.log(`=== PUBLISH BUTTON ${eventType.toUpperCase()} DETECTED (DIRECT LISTENER ${index}) ===`);
                    console.log(`Event type: ${eventType}`);
                    console.log('Event target:', e.target);
                    console.log('Event timestamp:', Date.now());
                    console.log('Button position:', btn.getBoundingClientRect());
                    console.log('Button computed style:', {
                        display: window.getComputedStyle(btn).display,
                        visibility: window.getComputedStyle(btn).visibility,
                        pointerEvents: window.getComputedStyle(btn).pointerEvents,
                        zIndex: window.getComputedStyle(btn).zIndex
                    });
                    
                    if (eventType === 'click') {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Processing click event via direct listener...');
                        console.log('Current upload state:', {
                            currentUser: window.currentUser?.uid,
                            selectedVideoFile: window.selectedVideoFile?.name,
                            uploadVideo: typeof window.uploadVideo,
                            uploadManager: typeof window.uploadManager
                        });
                        
                        if (window.uploadVideo) {
                            console.log('Calling uploadVideo via direct listener');
                            window.uploadVideo();
                        } else {
                            console.error('uploadVideo function not available via direct listener');
                        }
                    }
                }, true); // Use capture phase
            });
            
            // Also add a test click to see if the element is clickable
            setTimeout(() => {
                console.log(`Testing if button ${index} is still in DOM:`, document.contains(btn));
                console.log(`Button ${index} style display:`, window.getComputedStyle(btn).display);
                console.log(`Button ${index} style visibility:`, window.getComputedStyle(btn).visibility);
                console.log(`Button ${index} pointer-events:`, window.getComputedStyle(btn).pointerEvents);
                console.log(`Button ${index} z-index:`, window.getComputedStyle(btn).zIndex);
            }, 2000);
        });
        
        // Add global click listener to track all clicks in upload modal
        document.addEventListener('click', (e) => {
            if (e.target.closest('#uploadModal')) {
                console.log('=== CLICK DETECTED IN UPLOAD MODAL (GLOBAL LISTENER) ===');
                console.log('Clicked element:', e.target);
                console.log('Target tagName:', e.target.tagName);
                console.log('Target classList:', e.target.classList.toString());
                console.log('Target innerHTML:', e.target.innerHTML);
                console.log('Target id:', e.target.id);
                console.log('Is publish button:', e.target.classList.contains('publish-btn'));
                console.log('Closest publish button:', e.target.closest('.publish-btn'));
                console.log('Event phase:', e.eventPhase);
                console.log('Event bubbles:', e.bubbles);
                console.log('Event cancelable:', e.cancelable);
                console.log('Event defaultPrevented:', e.defaultPrevented);
                
                // Log all ancestors to trace event bubbling
                let element = e.target;
                const ancestors = [];
                while (element && element !== document) {
                    ancestors.push({
                        tagName: element.tagName,
                        classList: element.classList.toString(),
                        id: element.id
                    });
                    element = element.parentElement;
                }
                console.log('Event bubbling path:', ancestors);
                
                if (e.target.classList.contains('publish-btn') || e.target.closest('.publish-btn')) {
                    console.log('=== PUBLISH BUTTON CLICKED VIA GLOBAL LISTENER ===');
                    console.log('Preventing default and stopping propagation...');
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('Upload system state:', {
                        uploadVideo: typeof window.uploadVideo,
                        uploadManager: typeof window.uploadManager,
                        currentUser: window.currentUser?.uid,
                        selectedVideoFile: window.selectedVideoFile?.name
                    });
                    
                    if (window.uploadVideo) {
                        console.log('Calling uploadVideo via global listener');
                        window.uploadVideo();
                    } else if (window.uploadManager && window.uploadManager.uploadVideo) {
                        console.log('Calling uploadManager.uploadVideo via global listener');
                        window.uploadManager.uploadVideo();
                    } else {
                        console.error('No uploadVideo function found in global listener!');
                    }
                }
            }
        }, true);
    }

    // Settings handlers
    setupSettingsHandlers() {
        // Theme selection
        const themes = ['light', 'dark', 'purple', 'blue', 'green', 'rose'];
        themes.forEach(theme => {
            this.addEventListenerSafe(`[data-theme="${theme}"]`, 'click', (e) => {
                e.preventDefault();
                if (window.changeTheme) window.changeTheme(theme);
            });
        });

        // Toggle switches
        this.addEventListenerSafe('.toggle-switch', 'click', (e) => {
            e.preventDefault();
            const settingName = e.target.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (settingName && window.toggleSetting) {
                window.toggleSetting(e.target, settingName);
            }
        });

        console.log('Settings handlers attached');
    }

    // Share modal handlers
    setupShareHandlers() {
        const shareActions = {
            'closeShareModal': () => window.closeShareModal && window.closeShareModal(),
            'copyVideoLink': () => window.copyVideoLink && window.copyVideoLink(),
            'shareToInstagram': () => window.shareToInstagram && window.shareToInstagram(),
            'shareToTwitter': () => window.shareToTwitter && window.shareToTwitter(),
            'shareToFacebook': () => window.shareToFacebook && window.shareToFacebook(),
            'downloadVideo': () => window.downloadVideo && window.downloadVideo()
        };

        Object.entries(shareActions).forEach(([action, handler]) => {
            this.addEventListenerSafe(`[onclick*="${action}"]`, 'click', (e) => {
                e.preventDefault();
                handler();
            });
        });

        console.log('Share handlers attached');
    }

    // Delete modal handlers
    setupDeleteModalHandlers() {
        // Close delete modal
        this.addEventListenerSafe('.cancel-delete-btn', 'click', (e) => {
            e.preventDefault();
            if (window.closeDeleteModal) window.closeDeleteModal();
        });

        // Confirm delete video
        this.addEventListenerSafe('.confirm-delete-btn', 'click', (e) => {
            e.preventDefault();
            if (window.confirmDeleteVideo) window.confirmDeleteVideo();
        });

        console.log('Delete modal handlers attached');
    }

    // Method to remove all onclick attributes after event listeners are attached
    removeInlineHandlers() {
        const elementsWithOnclick = document.querySelectorAll('[onclick]');
        console.log(`Removing ${elementsWithOnclick.length} inline onclick handlers`);
        
        elementsWithOnclick.forEach(element => {
            element.removeAttribute('onclick');
        });
        
        console.log('All inline onclick handlers removed');
    }
}

// Initialize event manager
const eventManager = new EventManager();

// Make globally available
window.eventManager = eventManager;

export default EventManager;