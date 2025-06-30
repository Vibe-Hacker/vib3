// Centralized Firebase configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyDm3RODqsYRB1P9Lrri497FmMA0IIklvwM",
    authDomain: "vib3-a293b.firebaseapp.com",
    projectId: "vib3-a293b",
    storageBucket: "vib3-a293b.firebasestorage.app",
    messagingSenderId: "916623805957",
    appId: "1:916623805957:web:09e9de341bc490004fd66c",
    measurementId: "G-KW08F2608Q"
};

// Initialize Firebase
console.log('Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
console.log('Firebase initialized successfully');

export { auth, db, storage };