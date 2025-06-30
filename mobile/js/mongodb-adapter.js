// MongoDB Adapter for VIB3
// This replaces Firebase functionality with MongoDB API calls

// API base URL configuration
if (typeof API_BASE_URL === 'undefined') {
    window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? '' 
        : 'https://vib3-production.up.railway.app';
}

// Production-ready token management - no localStorage
window.authToken = null;
window.currentUser = null;

// Replace Firebase auth
const auth = {
    currentUser: null,
    _callbacks: [],
    onAuthStateChanged: function(callback) {
        this._callbacks.push(callback);
        
        // Check if this is a shared video link - if so, don't auto-login (but allow manual login)
        const urlParams = new URLSearchParams(window.location.search);
        const sharedVideoId = urlParams.get('video');
        const isSharedLink = sharedVideoId && window.location.pathname.includes('/mobile');
        
        if (isSharedLink) {
            console.log('🔗 Mobile shared video link detected - skipping auto-login but allowing manual login');
            callback(null);
            return;
        }
        
        // Check if user recently logged out - if so, don't auto-login
        const logoutTimestamp = sessionStorage.getItem('logout_timestamp');
        if (logoutTimestamp) {
            const timeSinceLogout = Date.now() - parseInt(logoutTimestamp);
            if (timeSinceLogout < 60000) { // 1 minute
                console.log('🚪 Recent logout detected - skipping auto-login');
                callback(null);
                return;
            } else {
                sessionStorage.removeItem('logout_timestamp');
            }
        }
        
        // Check if user is logged in using session-based auth (production-ready)
        fetch(`${window.API_BASE_URL}/api/auth/me`, {
            method: 'GET',
            credentials: 'include', // Include HTTP-only cookies
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        })
        .then(response => {
            if (response.status === 401 || response.status === 403) {
                // Not authenticated
                window.authToken = null;
                window.currentUser = null;
                callback(null);
                return null;
            }
            return response.json();
        })
        .then(data => {
            if (data && data.user) {
                this.currentUser = data.user;
                window.currentUser = data.user;
                // Set auth token for API calls (but don't store in localStorage)
                window.authToken = data.token || 'session-based';
                callback(data.user);
            } else {
                callback(null);
            }
        })
        .catch(() => {
            window.authToken = null;
            window.currentUser = null;
            callback(null);
        });
    },
    _triggerCallbacks: function(user) {
        this._callbacks.forEach(callback => callback(user));
    }
};

// Replace Firebase functions - Production secure authentication
async function signInWithEmailAndPassword(authObj, email, password) {
    const response = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include', // Enable cookies for session management
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    // Set token for API calls (server will manage secure storage via HTTP-only cookies)
    window.authToken = data.token || 'session-based';
    auth.currentUser = data.user;
    window.currentUser = data.user;
    
    // Trigger auth state change
    auth._triggerCallbacks(data.user);
    
    // Dispatch login event for mobile UI
    console.log('🚀 Dispatching userLoggedIn event with user:', data.user);
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: data.user }));
    
    return { user: data.user };
}

async function createUserWithEmailAndPassword(authObj, email, password) {
    const username = email.split('@')[0]; // Default username from email
    const response = await fetch(`${window.API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        credentials: 'include', // Enable cookies for session management
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    // Set token for API calls (server will manage secure storage via HTTP-only cookies)
    window.authToken = data.token || 'session-based';
    auth.currentUser = data.user;
    window.currentUser = data.user;
    
    // Trigger auth state change
    auth._triggerCallbacks(data.user);
    
    // Dispatch login event for mobile UI
    console.log('🚀 Dispatching userLoggedIn event with user:', data.user);
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: data.user }));
    
    return { user: data.user };
}

async function signOut(authObj) {
    try {
        // Production logout - clear server-side session with stronger cache control
        const response = await fetch(`${window.API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include', // Include cookies for proper logout
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            console.error('Logout failed on server:', response.status);
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    // Clear ALL client-side auth state
    window.authToken = null;
    auth.currentUser = null;
    window.currentUser = null;
    
    // Clear any stored credentials from all possible storage locations
    if (typeof localStorage !== 'undefined') {
        localStorage.clear(); // Clear everything to be sure
    }
    
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
    }
    
    // Clear ALL possible cookies with different paths and domains
    const cookieNames = ['session', 'auth', 'connect.sid', 'token', 'authToken', 'user'];
    const domains = [window.location.hostname, '.railway.app', '.up.railway.app'];
    const paths = ['/', '/api', '/auth'];
    
    cookieNames.forEach(name => {
        paths.forEach(path => {
            domains.forEach(domain => {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
            });
        });
    });
    
    // Trigger auth state change
    auth._triggerCallbacks(null);
    
    // Add a flag to prevent auto re-login on refresh
    sessionStorage.setItem('logout_timestamp', Date.now().toString());
}

async function updateProfile(user, updates) {
    // Update user profile via API
    return true;
}

// Make functions globally available
window.auth = auth;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signOut = signOut;
window.updateProfile = updateProfile;

// Replace Firestore functions
const db = {
    collection: function(name) {
        return {
            doc: function(id) {
                return {
                    set: async function(data) {
                        // Create/update document
                        return true;
                    },
                    get: async function() {
                        // Get document
                        return { exists: true, data: () => ({}) };
                    },
                    delete: async function() {
                        // Delete document
                        return true;
                    },
                    update: async function(data) {
                        // Update document
                        return true;
                    }
                };
            },
            add: async function(data) {
                // Add new document
                return { id: Date.now().toString() };
            },
            where: function(field, op, value) {
                return {
                    get: async function() {
                        // Query documents
                        return { docs: [] };
                    }
                };
            },
            orderBy: function(field, direction) {
                return {
                    limit: function(n) {
                        return {
                            get: async function() {
                                // Get videos from API with cache busting
                                const cacheBuster = Date.now();
                                const response = await fetch(`${window.API_BASE_URL}/api/videos?limit=${n}&_t=${cacheBuster}`, {
                                    headers: window.authToken ? { 'Authorization': `Bearer ${window.authToken}` } : {}
                                });
                                const data = await response.json();
                                
                                // Convert to Firestore-like format
                                return {
                                    docs: (data.videos || []).map(video => ({
                                        id: video._id,
                                        data: () => ({
                                            ...video,
                                            userId: video.userId,
                                            videoUrl: video.videoUrl,
                                            likes: video.likeCount || 0,
                                            comments: video.commentCount || 0,
                                            createdAt: { toDate: () => new Date(video.createdAt) }
                                        })
                                    }))
                                };
                            }
                        };
                    }
                };
            }
        };
    }
};

// Storage stub (would connect to DigitalOcean Spaces)
const storage = {
    ref: function(path) {
        return {
            put: async function(file) {
                // Upload to Spaces
                return {
                    ref: {
                        getDownloadURL: async () => '/videos/placeholder.mp4'
                    }
                };
            }
        };
    }
};

// Stubs for other Firebase functions
function collection() { return db.collection(...arguments); }
function query() { return {}; }
function where() { return {}; }
function getDocs() { return Promise.resolve({ docs: [] }); }
function addDoc() { return Promise.resolve({ id: Date.now().toString() }); }
function deleteDoc() { return Promise.resolve(); }
function doc() { return {}; }
function setDoc() { return Promise.resolve(); }
function updateDoc() { return Promise.resolve(); }
function arrayUnion() { return []; }
function arrayRemove() { return []; }
function getDoc() { return Promise.resolve({ exists: true, data: () => ({}) }); }
function deleteField() { return null; }
function increment() { return 1; }
function ref() { return storage.ref(...arguments); }
function uploadBytesResumable() { return { on: () => {} }; }
function getDownloadURL() { return Promise.resolve('/videos/placeholder.mp4'); }
function deleteObject() { return Promise.resolve(); }
function onAuthStateChanged() { return auth.onAuthStateChanged(...arguments); }

// Export everything needed
window.auth = auth;
window.db = db;
window.storage = storage;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signOut = signOut;
window.updateProfile = updateProfile;
window.collection = collection;
window.query = query;
window.where = where;
window.getDocs = getDocs;
window.addDoc = addDoc;
window.deleteDoc = deleteDoc;
window.doc = doc;
window.setDoc = setDoc;
window.updateDoc = updateDoc;
window.arrayUnion = arrayUnion;
window.arrayRemove = arrayRemove;
window.getDoc = getDoc;
window.deleteField = deleteField;
window.increment = increment;
window.ref = ref;
window.uploadBytesResumable = uploadBytesResumable;
window.getDownloadURL = getDownloadURL;
window.deleteObject = deleteObject;
window.onAuthStateChanged = onAuthStateChanged;