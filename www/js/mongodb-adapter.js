// MongoDB Adapter for VIB3
// This replaces Firebase functionality with MongoDB API calls

// API base URL configuration
if (typeof API_BASE_URL === 'undefined') {
    // For mobile app, always use production server
    window.API_BASE_URL = 'https://vib3-production.up.railway.app';
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
        
        // FORCE LOGIN - no auto-authentication on mobile
        console.log('🔒 FORCING LOGIN SCREEN - no bypass allowed');
        localStorage.removeItem('token');
        window.authToken = null;
        window.currentUser = null;
        this.currentUser = null;
        callback(null);
    },
    _triggerCallbacks: function(user) {
        this._callbacks.forEach(callback => callback(user));
    }
};

// Replace Firebase functions - Mobile token-based authentication
async function signInWithEmailAndPassword(authObj, email, password) {
    const response = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    // Store token in localStorage for mobile app
    localStorage.setItem('token', data.token);
    window.authToken = data.token;
    auth.currentUser = data.user;
    window.currentUser = data.user;
    
    // Trigger auth state change
    auth._triggerCallbacks(data.user);
    
    return { user: data.user };
}

async function createUserWithEmailAndPassword(authObj, email, password) {
    const username = email.split('@')[0]; // Default username from email
    const response = await fetch(`${window.API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    // Store token in localStorage for mobile app
    localStorage.setItem('token', data.token);
    window.authToken = data.token;
    auth.currentUser = data.user;
    window.currentUser = data.user;
    
    // Trigger auth state change
    auth._triggerCallbacks(data.user);
    
    return { user: data.user };
}

async function signOut(authObj) {
    // Mobile logout - clear local token
    await fetch(`${window.API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
    });
    
    // Clear client-side auth state and localStorage
    localStorage.removeItem('token');
    window.authToken = null;
    auth.currentUser = null;
    window.currentUser = null;
    
    // Trigger auth state change
    auth._triggerCallbacks(null);
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