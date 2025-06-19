// Firebase configuration
// In production, these values should be loaded from environment variables
const firebaseConfig = {
    apiKey: "AIzaSyDm3RODqsYRB1P9Lrri497FmMA0IIklvwM",
    authDomain: "vib3-a293b.firebaseapp.com",
    projectId: "vib3-a293b",
    storageBucket: "vib3-a293b.firebasestorage.app",
    messagingSenderId: "916623805957",
    appId: "1:916623805957:web:09e9de341bc490004fd66c",
    measurementId: "G-KW08F2608Q"
};

// App configuration
const appConfig = {
    name: 'VIB3',
    version: '1.0.0',
    debug: true, // Set to false in production
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    supportedVideoFormats: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    videoCompressionQuality: 0.8,
    maxVideoDuration: 180, // 3 minutes in seconds
    defaultUserAvatar: '👤',
    feedPageSize: 10,
    infiniteScrollThreshold: 0.1,
    videoIntersectionThreshold: 0.7,
    keyboardShortcutsEnabled: true
};

// Make configurations globally available
window.firebaseConfig = firebaseConfig;
window.appConfig = appConfig;