// Error Debug Panel
// Visual debugging tool for the error handling system

class ErrorDebugPanel {
    constructor() {
        this.isVisible = false;
        this.updateInterval = null;
        this.init();
    }

    init() {
        // Add keyboard shortcut to toggle error debug panel
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + E to toggle
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                this.toggle();
            }
        });

        console.log('🚨 Error debug panel initialized. Press Ctrl+Shift+E to toggle.');
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
        
        // Update every 2 seconds
        this.updateInterval = setInterval(() => {
            this.updateContent();
        }, 2000);

        console.log('🚨 Error debug panel opened');
    }

    hide() {
        const panel = document.getElementById('errorDebugPanel');
        if (panel) {
            panel.remove();
        }

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.isVisible = false;
        console.log('🚨 Error debug panel closed');
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'errorDebugPanel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 450px;
            max-height: 80vh;
            background: rgba(40, 0, 0, 0.95);
            border: 2px solid #ff4444;
            border-radius: 10px;
            padding: 20px;
            color: white;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 999998;
            overflow-y: auto;
            backdrop-filter: blur(10px);
        `;

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #ff4444;">🚨 Error Debug Panel</h3>
                <button onclick="this.parentElement.parentElement.remove(); window.errorDebugPanel.isVisible = false;" 
                        style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">×</button>
            </div>
            <div id="errorDebugContent">Loading...</div>
        `;

        document.body.appendChild(panel);
        this.updateContent();
    }

    updateContent() {
        const content = document.getElementById('errorDebugContent');
        if (!content || !window.errorHandler) return;

        const stats = window.errorHandler.getErrorStats();
        const history = window.errorHandler.getErrorHistory();

        content.innerHTML = `
            <div style="margin-bottom: 15px;">
                <h4 style="color: #ff6666; margin: 10px 0 5px 0;">📊 Error Statistics</h4>
                <div style="margin-left: 10px;">
                    <div>Total Errors: <span style="color: #ffaa00">${stats.totalErrors}</span></div>
                    <div>Connection: <span style="color: ${stats.isOnline ? '#00ff00' : '#ff4444'}">${stats.isOnline ? 'Online' : 'Offline'}</span></div>
                    <div>Last Error: <span style="color: #ffaa00">${stats.lastError ? new Date(stats.lastError.timestamp).toLocaleTimeString() : 'None'}</span></div>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <h4 style="color: #ff6666; margin: 10px 0 5px 0;">📈 Error Counts by Type</h4>
                <div style="margin-left: 10px;">
                    ${Object.entries(stats.errorCounts).map(([type, count]) => `
                        <div>${type}: <span style="color: #ffaa00">${count}</span></div>
                    `).join('') || '<div style="color: #666;">No errors recorded</div>'}
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <h4 style="color: #ff6666; margin: 10px 0 5px 0;">🕒 Recent Errors</h4>
                <div style="margin-left: 10px; max-height: 200px; overflow-y: auto;">
                    ${history.slice(-5).reverse().map(error => `
                        <div style="margin-bottom: 10px; padding: 8px; background: rgba(255, 68, 68, 0.1); border-radius: 5px;">
                            <div style="color: #ff6666; font-weight: bold;">${error.type.toUpperCase()}</div>
                            <div style="color: #ffaa00; font-size: 10px;">${new Date(error.timestamp).toLocaleString()}</div>
                            <div style="color: #ccc; font-size: 10px; margin-top: 2px;">
                                ${error.details?.message || error.details?.code || 'Unknown error'}
                            </div>
                            ${error.context?.operation ? `
                                <div style="color: #aaa; font-size: 10px; margin-top: 2px;">
                                    Operation: ${error.context.operation}
                                </div>
                            ` : ''}
                        </div>
                    `).join('') || '<div style="color: #666;">No recent errors</div>'}
                </div>
            </div>

            <div style="margin-bottom: 10px;">
                <h4 style="color: #ff6666; margin: 10px 0 5px 0;">⚡ Quick Actions</h4>
                <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-left: 10px;">
                    <button onclick="window.errorHandler.clearErrorHistory()" style="padding: 5px 8px; background: #666; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">Clear History</button>
                    <button onclick="window.errorHandler.checkConnectivity()" style="padding: 5px 8px; background: #666; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">Test Connection</button>
                    <button onclick="window.errorHandler.reportError('test', { message: 'Test error' }, { operation: 'debug' })" style="padding: 5px 8px; background: #ff4444; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">Test Error</button>
                    <button onclick="console.log(window.errorHandler.getErrorStats())" style="padding: 5px 8px; background: #666; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">Log Stats</button>
                </div>
            </div>

            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #333; font-size: 10px; color: #666;">
                Press Ctrl+Shift+E to toggle this panel<br>
                Retry counts: ${this.getRetryCountSummary()}
            </div>
        `;
    }

    getRetryCountSummary() {
        // Get retry counts from session storage
        const retryKeys = Object.keys(sessionStorage).filter(key => key.startsWith('retry_'));
        if (retryKeys.length === 0) return 'None active';
        
        return retryKeys.map(key => {
            const operation = key.replace('retry_', '').split('_')[0];
            const count = sessionStorage.getItem(key);
            return `${operation}:${count}`;
        }).join(', ');
    }
}

// Initialize error debug panel
const errorDebugPanel = new ErrorDebugPanel();
window.errorDebugPanel = errorDebugPanel;

export default errorDebugPanel;