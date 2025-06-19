// Main application initialization - extracted from inline JavaScript
import { auth, db, storage } from './firebase-config.js';
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

// Set up global Firebase functions for legacy compatibility
function setupGlobalFirebaseFunctions() {
    // Auth functions
    window.auth = auth;
    window.db = db;
    window.storage = storage;
    window.signInWithEmailAndPassword = signInWithEmailAndPassword;
    window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
    window.signOut = signOut;
    window.onAuthStateChanged = onAuthStateChanged;
    window.updateProfile = updateProfile;
    
    // Firestore functions
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
    
    // Storage functions
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
        getDocs: !!window.getDocs
    });
    
    // Set flag to indicate Firebase is ready
    window.firebaseReady = true;
}

// Global auth functions for form handling
function setupGlobalAuthFunctions() {
    // Login function that reads from form and uses auth manager
    window.login = async () => {
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        const loginBtn = document.querySelector('button[aria-label="Sign In"]');
        
        if (!emailInput || !passwordInput) {
            console.error('Login form elements not found');
            return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!email || !password) {
            if (window.showToast) {
                window.showToast('Please enter email and password');
            }
            return;
        }
        
        // Set button loading state
        if (window.loadingManager) {
            window.loadingManager.setButtonLoading(loginBtn, true);
        }
        
        try {
            if (window.authManager) {
                const result = await window.authManager.login(email, password);
                if (result.success) {
                    // Clear form
                    emailInput.value = '';
                    passwordInput.value = '';
                }
            }
        } finally {
            // Remove button loading state
            if (window.loadingManager) {
                window.loadingManager.setButtonLoading(loginBtn, false);
            }
        }
    };
    
    // Signup function that reads from form and uses auth manager
    window.signup = async () => {
        const nameInput = document.getElementById('signupName');
        const emailInput = document.getElementById('signupEmail');
        const passwordInput = document.getElementById('signupPassword');
        const signupBtn = document.querySelector('button[aria-label="Create Account"]');
        
        if (!nameInput || !emailInput || !passwordInput) {
            console.error('Signup form elements not found');
            return;
        }
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!name || !email || !password) {
            if (window.showToast) {
                window.showToast('Please fill in all fields');
            }
            return;
        }
        
        if (password.length < 6) {
            if (window.showToast) {
                window.showToast('Password must be at least 6 characters');
            }
            return;
        }
        
        // Set button loading state
        if (window.loadingManager) {
            window.loadingManager.setButtonLoading(signupBtn, true);
        }
        
        try {
            if (window.authManager) {
                const result = await window.authManager.signup(name, email, password);
                if (result.success) {
                    // Clear form
                    nameInput.value = '';
                    emailInput.value = '';
                    passwordInput.value = '';
                }
            }
        } finally {
            // Remove button loading state
            if (window.loadingManager) {
                window.loadingManager.setButtonLoading(signupBtn, false);
            }
        }
    };
}

// Initialize the application
export function initializeApp() {
    console.log('Loading legacy functions for transition...');
    setupGlobalFirebaseFunctions();
    setupGlobalAuthFunctions();
    console.log('Firebase functions assigned to window');
}

export { auth, db, storage };