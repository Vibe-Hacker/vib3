// Simple search functions for VIB3

// Perform search
function performSearch(query) {
    if (window.showNotification) {
        window.showNotification(`Search for "${query}" coming soon!`, 'info');
    }
}

// Initialize search
function initSearch() {
    // Search is initialized in the HTML
}

// Make functions globally available
window.performSearch = performSearch;
window.initSearch = initSearch;