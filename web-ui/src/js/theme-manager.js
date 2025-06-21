// Theme Manager Module
// Handles dark mode toggle and persistence

console.log('🎨 theme-manager.js is loading...');

class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themeToggle = null;
        this.themeIcon = null;
        this.initialize();
    }
    
    initialize() {
        // Get elements
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');
        
        // Load saved theme preference
        this.loadTheme();
        
        // Register event handlers
        this.registerEventHandlers();
        
        console.log('✅ ThemeManager initialized with theme:', this.currentTheme);
    }
    
    loadTheme() {
        // Check localStorage for saved theme
        const savedTheme = localStorage.getItem('taskjuggler-theme');
        
        // Check system preference if no saved theme
        if (!savedTheme) {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'dark' : 'light';
        } else {
            this.currentTheme = savedTheme;
        }
        
        // Apply theme
        this.applyTheme(this.currentTheme);
    }
    
    applyTheme(theme) {
        // Update data attribute on body
        document.body.setAttribute('data-theme', theme);
        
        // Update icon
        if (this.themeIcon) {
            this.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
        
        // Update toggle title
        if (this.themeToggle) {
            this.themeToggle.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
        }
        
        // Special handling for DHTMLX Gantt
        this.updateGanttTheme(theme);
        
        // Log theme change
        if (window.debugLog) {
            window.debugLog('theme', 'Theme changed', { theme });
        }
    }
    
    updateGanttTheme(theme) {
        if (typeof gantt === 'undefined') return;
        
        // DHTMLX Gantt doesn't have a built-in dark theme switch,
        // but we can trigger a re-render to apply our CSS overrides
        if (gantt.render) {
            setTimeout(() => {
                gantt.render();
            }, 10);
        }
    }
    
    registerEventHandlers() {
        if (!this.themeToggle) return;
        
        // Theme toggle click handler
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                if (!localStorage.getItem('taskjuggler-theme')) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.currentTheme = newTheme;
                    this.applyTheme(newTheme);
                }
            });
        }
    }
    
    toggleTheme() {
        // Switch theme
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        
        // Apply new theme
        this.applyTheme(this.currentTheme);
        
        // Save preference
        localStorage.setItem('taskjuggler-theme', this.currentTheme);
        
        // Update status
        if (typeof updateStatus === 'function') {
            updateStatus(`Switched to ${this.currentTheme} mode`);
        }
    }
    
    // Public API
    getTheme() {
        return this.currentTheme;
    }
    
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.currentTheme = theme;
            this.applyTheme(theme);
            localStorage.setItem('taskjuggler-theme', theme);
        }
    }
}

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    // DOM is already loaded
    window.themeManager = new ThemeManager();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}