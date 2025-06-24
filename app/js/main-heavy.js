// Main application entry point
import { auth, db, storage } from './firebase-init.js';
import { appConfig } from './config.js';

// Import state management system
import stateManager from './core/state-manager.js';
import stateIntegration from './core/state-integration.js';
import stateDebugPanel from './debug/state-debug-panel.js';
import errorHandler from './core/error-handler.js';
import errorDebugPanel from './debug/error-debug-panel.js';
import loadingManager from './core/loading-manager.js';
import videoCacheManager from './core/video-cache-manager.js';
import videoCacheDebugPanel from './debug/video-cache-debug-panel.js';

// Import Firebase functions that will be used globally
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    updateProfile 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    deleteDoc, 
    doc, 
    setDoc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove, 
    getDoc, 
    deleteField, 
    increment 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { 
    ref, 
    uploadBytesResumable, 
    getDownloadURL, 
    deleteObject 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

console.log('Main application starting...');

// Initialize state management system
console.log('🏪 State management system initialized');
console.log('🎬 Video cache manager initialized');
console.log('🐛 Video cache debug panel initialized');
stateManager.actions.updateLastActivity();

// Make Firebase services globally available (for now, during transition)
window.auth = auth;
window.db = db;
window.storage = storage;

// Make Firebase functions globally available
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signOut = signOut;
window.onAuthStateChanged = onAuthStateChanged;
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

console.log('Firebase functions assigned to window:', {
    auth: !!window.auth,
    signIn: !!window.signInWithEmailAndPassword,
    createUser: !!window.createUserWithEmailAndPassword,
    query: !!window.query,
    where: !!window.where,
    collection: !!window.collection
});

// Global video metadata handler
window.handleVideoMetadata = function(video) {
    console.log('Video loaded - dimensions:', video.videoWidth, 'x', video.videoHeight);
    
    if (video.videoWidth > video.videoHeight) {
        // Landscape video - add class for cropping
        video.classList.add('landscape');
        console.log('Added landscape class to video');
    } else {
        // Portrait video - ensure no landscape class
        video.classList.remove('landscape');
        console.log('Portrait video - no special styling');
    }
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded. Firebase functions available:', !!window.signInWithEmailAndPassword);
    
    // Import and initialize other modules
    import('./components/auth-manager.js').then(module => {
        console.log('Auth manager loaded');
    });
    
    import('./components/video-manager.js').then(module => {
        console.log('Video manager loaded');
    });
    
    import('./components/theme-manager.js').then(module => {
        console.log('Theme manager loaded');
    });
    
    import('./components/feed-manager.js').then(module => {
        console.log('Feed manager loaded');
    });
    
    import('./components/upload-manager.js').then(module => {
        console.log('Upload manager loaded');
    });
    
    import('./utils/video-deletion-fix-v2.js?v=' + (Date.now() + Math.random() * 1000)).then(module => {
        console.log('Video deletion fix v2 with backup listeners loaded');
    });
});

export { auth, db, storage };