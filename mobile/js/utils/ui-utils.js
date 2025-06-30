// UI utility functions - extracted from inline JavaScript

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 */
export function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// Make function globally available for transition period
window.showToast = showToast;