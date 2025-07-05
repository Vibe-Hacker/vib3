// Main entry point for modular VIB3 - MongoDB version
console.log('Starting VIB3 application (MongoDB version)...');

// Import core functionality
import { initializeApp } from './core/app-init.js';
import { showToast } from './utils/ui-utils.js';

// Initialize the application
initializeApp();

// Missing functions that were in vib3-complete.js
function publishRemix(originalVideoId, remixData) {
    console.log('🎬 Publishing remix for video:', originalVideoId);
    console.log('📝 Remix data:', remixData);
    
    if (window.showToast) {
        window.showToast('Remix feature coming soon! 🎵', 'info');
    }
}

// Setup live preview function (fixed version)
function setupLivePreview() {
    console.log('📹 Setting up live preview...');
    
    if (!window.liveStreamingState) {
        window.liveStreamingState = {
            isActive: false,
            startTime: null,
            viewers: 0,
            title: '',
            category: '',
            stream: null
        };
    }
    
    const previewVideo = document.getElementById('live-preview');
    if (!previewVideo) {
        console.error('Live preview element not found');
        return;
    }
    
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
        }, 
        audio: true 
    })
    .then(stream => {
        console.log('✅ Camera and microphone access granted');
        window.liveStreamingState.stream = stream;
        previewVideo.srcObject = stream;
        previewVideo.muted = true;
        previewVideo.play();
        
        // Show go live controls
        const goLiveControls = document.querySelector('.go-live-controls');
        if (goLiveControls) {
            goLiveControls.style.display = 'block';
        }
        
        window.showToast('Live preview ready! 📺', 'success');
    })
    .catch(error => {
        console.error('❌ Failed to setup live preview:', error);
        let message = 'Camera access failed';
        
        if (error.name === 'NotAllowedError') {
            message = 'Camera permission denied. Please allow camera access.';
        } else if (error.name === 'NotFoundError') {
            message = 'No camera found on this device.';
        } else if (error.name === 'NotReadableError') {
            message = 'Camera is being used by another application.';
        }
        
        window.showToast(message, 'error');
    });
}

// Start live stream function
function startLiveStream() {
    console.log('🔴 Starting live stream...');
    
    if (!window.liveStreamingState || !window.liveStreamingState.stream) {
        console.error('No stream available');
        window.showToast('Please allow camera access first', 'error');
        return;
    }
    
    const titleInput = document.getElementById('liveTitle');
    const categorySelect = document.getElementById('liveCategory');
    
    window.liveStreamingState.isActive = true;
    window.liveStreamingState.startTime = Date.now();
    window.liveStreamingState.title = titleInput ? titleInput.value : 'Live Stream';
    window.liveStreamingState.category = categorySelect ? categorySelect.value : 'general';
    
    // Close setup modal
    const modal = document.getElementById('liveSetupModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    window.showToast('Live stream started! 🔴', 'success');
    
    // TODO: Implement actual streaming to backend
}

// Show page function
function showPage(page) {
    console.log('Navigating to page:', page);
    
    // Hide all pages
    const pages = document.querySelectorAll('[id$="-page"], [id$="Page"]');
    pages.forEach(p => p.style.display = 'none');
    
    // Show requested page
    const pageElement = document.getElementById(page + '-page') || document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.style.display = 'block';
    }
    
    // Special handling for live page
    if (page === 'live') {
        openLiveSetup();
    }
}

// Open live setup modal
function openLiveSetup() {
    console.log('Opening live setup...');
    
    const modal = document.getElementById('liveSetupModal');
    if (modal) {
        modal.style.display = 'flex';
        setupLivePreview();
    } else {
        console.error('Live setup modal not found');
    }
}

// Export functions to global scope
window.publishRemix = publishRemix;
window.setupLivePreview = setupLivePreview;
window.startLiveStream = startLiveStream;
window.showPage = showPage;
window.openLiveSetup = openLiveSetup;

// Also export for modules
export { publishRemix, setupLivePreview, startLiveStream, showPage, openLiveSetup };