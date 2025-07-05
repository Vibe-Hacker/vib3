// Main entry point for VIB3 - modular JS version
// This file is loaded by index-heavy.html as a module

console.log('📱 VIB3 Main.js loading (MongoDB version)...');

// Import and initialize core functionality
import { initializeApp } from './core/app-init.js';
import { showToast } from './utils/ui-utils.js';

// Initialize the application core
console.log('🚀 Initializing VIB3 core...');
initializeApp();

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM ready, setting up app...');
    
    try {
        // Set up global ready flag
        window.vib3Ready = true;
        
        // Emit ready event
        document.dispatchEvent(new CustomEvent('vib3Ready'));
        
        console.log('✅ VIB3 ready!');
        
    } catch (error) {
        console.error('❌ Error during app setup:', error);
        
        // Show user-friendly error
        if (window.showToast) {
            window.showToast('Failed to load app. Please refresh the page.', 'error');
        }
    }
});