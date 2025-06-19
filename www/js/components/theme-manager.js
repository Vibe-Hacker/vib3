// Theme manager module
class ThemeManager {
    constructor() {
        this.currentTheme = 'dark';
        this.init();
    }

    init() {
        this.setupStateSubscriptions();
        this.initializeTheme();
        this.setupThemeFunction();
    }

    setupStateSubscriptions() {
        if (!window.stateManager) return;
        
        // Subscribe to theme changes
        window.stateManager.subscribe('ui.theme', (theme) => {
            if (theme !== this.currentTheme) {
                this.applyTheme(theme);
            }
        });
    }

    initializeTheme() {
        // Get saved theme or default to dark
        const savedTheme = localStorage.getItem('vib3_theme') || 'dark';
        
        // Initialize state with saved theme
        if (window.stateManager) {
            window.stateManager.actions.setTheme(savedTheme);
        } else {
            this.applyTheme(savedTheme);
        }
        
        // Update theme selector if it exists
        const currentThemeOption = document.querySelector(`[data-theme="${savedTheme}"]`);
        if (currentThemeOption) {
            // Remove active class from all theme options
            document.querySelectorAll('.theme-option').forEach(option => {
                option.classList.remove('active');
            });
            // Add active class to current theme
            currentThemeOption.classList.add('active');
        }
    }

    applyTheme(themeName) {
        this.currentTheme = themeName;
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('vib3_theme', themeName);
        
        // Update state if not called from state change
        if (window.stateManager && window.stateManager.getState('ui.theme') !== themeName) {
            window.stateManager.actions.setTheme(themeName);
        }
        
        console.log(`Theme changed to: ${themeName}`);
        
        // Show toast notification
        if (window.showToast) {
            const themeNames = {
                'dark': 'Dark',
                'purple': 'Purple',
                'blue': 'Ocean',
                'green': 'Nature',
                'rose': 'Rose'
            };
            window.showToast(`🎨 ${themeNames[themeName] || themeName} theme applied`);
        }
    }

    setupThemeFunction() {
        // Global theme change function
        window.changeTheme = (themeName) => {
            this.applyTheme(themeName);
            
            // Update UI state
            document.querySelectorAll('.theme-option').forEach(option => {
                option.classList.remove('active');
            });
            
            const selectedOption = document.querySelector(`[data-theme="${themeName}"]`);
            if (selectedOption) {
                selectedOption.classList.add('active');
            }
        };

        // Initialize theme function
        window.initializeTheme = () => {
            this.initializeTheme();
        };
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getAvailableThemes() {
        return ['dark', 'purple', 'blue', 'green', 'rose'];
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Make theme manager globally available
window.themeManager = themeManager;

export default ThemeManager;