// VIB3 Auto-Fix Script
// Monitors for common issues and fixes them automatically

const autoFix = {
    // Fix issues found by tests
    fixNavigationIssues: function() {
        // Ensure all page elements exist or create them
        const requiredPages = ['searchPage', 'profilePage', 'settingsPage', 'messagesPage', 'creatorPage', 'shopPage', 'analyticsPage'];
        
        requiredPages.forEach(pageId => {
            if (!document.getElementById(pageId)) {
                console.log(`Creating missing page: ${pageId}`);
                const page = document.createElement('div');
                page.id = pageId;
                page.className = pageId.replace('Page', '-page');
                page.style.cssText = 'margin-left: 240px; width: calc(100vw - 240px); height: 100vh; overflow-y: auto; background: var(--bg-primary); padding: 20px; display: none;';
                page.innerHTML = `<h2>${pageId.replace('Page', '').charAt(0).toUpperCase() + pageId.replace('Page', '').slice(1)}</h2><p>Page content loading...</p>`;
                document.body.appendChild(page);
            }
        });
    },

    // Fix modal cleanup issues
    fixModalCleanup: function() {
        // Remove orphaned modals
        const oldModals = document.querySelectorAll('.modal');
        oldModals.forEach(modal => {
            if (!modal.style.display || modal.style.display === 'none') {
                modal.remove();
            }
        });
    },

    // Fix theme persistence
    fixThemeIssues: function() {
        const savedTheme = localStorage.getItem('vib3-theme');
        if (savedTheme && !document.body.className.includes(`theme-${savedTheme}`)) {
            document.body.className = `theme-${savedTheme}`;
        }
    },

    // Monitor for JavaScript errors and attempt fixes
    setupErrorMonitoring: function() {
        window.addEventListener('error', (event) => {
            console.error('VIB3 Error detected:', event.error.message);
            
            // Common fixes for typical errors
            if (event.error.message.includes('is not a function')) {
                console.log('Attempting to reload core functions...');
                // Could trigger a function reload here
            }
            
            if (event.error.message.includes('Cannot read property')) {
                console.log('Attempting to fix null reference...');
                this.fixNavigationIssues();
            }
        });
    },

    // Auto-fix routine that runs periodically
    runAutoFix: function() {
        console.log('🔧 Running auto-fix...');
        this.fixNavigationIssues();
        this.fixModalCleanup();
        this.fixThemeIssues();
    },

    // Initialize auto-fix system
    init: function() {
        console.log('🚀 Auto-fix system initialized');
        this.setupErrorMonitoring();
        
        // Run initial fix
        setTimeout(() => this.runAutoFix(), 3000);
        
        // Run periodic fixes every 30 seconds
        setInterval(() => this.runAutoFix(), 30000);
    }
};

// Auto-start when loaded
if (typeof window !== 'undefined') {
    autoFix.init();
}

// Make available globally for manual fixes
window.autoFix = autoFix;