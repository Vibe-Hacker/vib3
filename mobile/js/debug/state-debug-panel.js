// State Debug Panel
// Visual debugging tool for the state management system

class StateDebugPanel {
    constructor() {
        this.isVisible = false;
        this.updateInterval = null;
        this.init();
    }

    init() {
        // Add keyboard shortcut to toggle debug panel
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + S to toggle
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.toggle();
            }
        });

        console.log('🐛 State debug panel initialized. Press Ctrl+Shift+S to toggle.');
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        if (this.isVisible) return;

        this.createPanel();
        this.isVisible = true;
        
        // Update every second
        this.updateInterval = setInterval(() => {
            this.updateContent();
        }, 1000);

        console.log('🐛 State debug panel opened');
    }

    hide() {
        const panel = document.getElementById('stateDebugPanel');
        if (panel) {
            panel.remove();
        }

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.isVisible = false;
        console.log('🐛 State debug panel closed');
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'stateDebugPanel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-height: 80vh;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #fe2c55;
            border-radius: 10px;
            padding: 20px;
            color: white;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 999999;
            overflow-y: auto;
            backdrop-filter: blur(10px);
        `;

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #fe2c55;">🏪 State Debug Panel</h3>
                <button onclick="this.parentElement.parentElement.remove(); window.stateDebugPanel.isVisible = false;" 
                        style="background: #fe2c55; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">×</button>
            </div>
            <div id="stateDebugContent">Loading...</div>
        `;

        document.body.appendChild(panel);
        this.updateContent();
    }

    updateContent() {
        const content = document.getElementById('stateDebugContent');
        if (!content || !window.stateManager) return;

        const state = window.stateManager.getState();
        const computed = window.stateManager.computed;

        content.innerHTML = `
            <div style="margin-bottom: 15px;">
                <h4 style="color: #8338ec; margin: 10px 0 5px 0;">🔐 User State</h4>
                <div style="margin-left: 10px;">
                    <div>Authenticated: <span style="color: ${state.user.isAuthenticated ? '#00ff00' : '#ff4444'}">${state.user.isAuthenticated}</span></div>
                    <div>User ID: <span style="color: #ffaa00">${state.user.currentUser?.uid || 'null'}</span></div>
                    <div>Email: <span style="color: #ffaa00">${state.user.currentUser?.email || 'null'}</span></div>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <h4 style="color: #8338ec; margin: 10px 0 5px 0;">🎨 UI State</h4>
                <div style="margin-left: 10px;">
                    <div>Current Page: <span style="color: #00aaff">${state.ui.currentPage}</span></div>
                    <div>Feed Tab: <span style="color: #00aaff">${state.ui.activeFeedTab}</span></div>
                    <div>Theme: <span style="color: #00aaff">${state.ui.theme}</span></div>
                    <div>Upload Active: <span style="color: ${state.ui.uploadPageActive ? '#00ff00' : '#ff4444'}">${state.ui.uploadPageActive}</span></div>
                    <div>Upload Progress: <span style="color: #ffaa00">${state.ui.uploadInProgress}</span></div>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <h4 style="color: #8338ec; margin: 10px 0 5px 0;">📹 Video State</h4>
                <div style="margin-left: 10px;">
                    <div>User Interacted: <span style="color: ${state.video.userHasInteracted ? '#00ff00' : '#ff4444'}">${state.video.userHasInteracted}</span></div>
                    <div>Playing Video: <span style="color: #ffaa00">${state.video.currentlyPlayingVideo ? 'Yes' : 'None'}</span></div>
                    <div>Upload Progress: <span style="color: #00aaff">${state.video.uploadProgress}%</span></div>
                    <div>Selected File: <span style="color: #ffaa00">${state.video.selectedVideoFile?.name || 'None'}</span></div>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <h4 style="color: #8338ec; margin: 10px 0 5px 0;">🌐 App State</h4>
                <div style="margin-left: 10px;">
                    <div>Connection: <span style="color: ${state.app.connectionStatus === 'online' ? '#00ff00' : '#ff4444'}">${state.app.connectionStatus}</span></div>
                    <div>Loading: <span style="color: ${state.app.isLoading ? '#ffaa00' : '#00ff00'}">${state.app.isLoading}</span></div>
                    <div>Notifications: <span style="color: #00aaff">${state.app.notifications?.length || 0}</span></div>
                    <div>Last Activity: <span style="color: #666">${new Date(state.app.lastActivity).toLocaleTimeString()}</span></div>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <h4 style="color: #8338ec; margin: 10px 0 5px 0;">⚡ Computed Values</h4>
                <div style="margin-left: 10px;">
                    <div>Is Logged In: <span style="color: ${computed.isLoggedIn() ? '#00ff00' : '#ff4444'}">${computed.isLoggedIn()}</span></div>
                    <div>Has Active Upload: <span style="color: ${computed.hasActiveUpload() ? '#ffaa00' : '#00ff00'}">${computed.hasActiveUpload()}</span></div>
                    <div>Can Play Videos: <span style="color: ${computed.canPlayVideos() ? '#00ff00' : '#ff4444'}">${computed.canPlayVideos()}</span></div>
                    <div>Theme Class: <span style="color: #00aaff">${computed.currentThemeClass()}</span></div>
                </div>
            </div>

            <div style="margin-bottom: 10px;">
                <h4 style="color: #8338ec; margin: 10px 0 5px 0;">🎮 Quick Actions</h4>
                <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-left: 10px;">
                    <button onclick="window.stateManager.actions.setTheme('light')" style="padding: 5px 8px; background: #666; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">Light</button>
                    <button onclick="window.stateManager.actions.setTheme('dark')" style="padding: 5px 8px; background: #666; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">Dark</button>
                    <button onclick="window.stateManager.actions.setUserInteracted(true)" style="padding: 5px 8px; background: #666; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">Enable Audio</button>
                    <button onclick="window.stateManager.debug()" style="padding: 5px 8px; background: #fe2c55; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">Console Log</button>
                </div>
            </div>

            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #333; font-size: 10px; color: #666;">
                Press Ctrl+Shift+S to toggle this panel
            </div>
        `;
    }
}

// Initialize debug panel
const stateDebugPanel = new StateDebugPanel();
window.stateDebugPanel = stateDebugPanel;

export default stateDebugPanel;