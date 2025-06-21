// Layout Manager Module
// Handles responsive layout, window resizing, and UI state management

console.log('📐 layout-manager.js is loading...');

class LayoutManager {
    constructor() {
        this.statusCollapsed = false;
        this.fullscreenMode = false;
        this.resizeTimeout = null;
        this.initialize();
    }
    
    initialize() {
        // Load saved preferences
        this.loadPreferences();
        
        // Set initial layout
        this.updateLayout();
        
        // Register event handlers
        this.registerEventHandlers();
        
        console.log('✅ LayoutManager initialized');
    }
    
    loadPreferences() {
        // Load status collapsed state
        const savedStatusState = localStorage.getItem('taskjuggler-status-collapsed');
        if (savedStatusState === 'true') {
            this.statusCollapsed = true;
            const statusSection = document.getElementById('statusSection');
            if (statusSection) {
                statusSection.classList.add('collapsed');
            }
        }
    }
    
    registerEventHandlers() {
        // Window resize handler with debouncing
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250); // Debounce for 250ms
        });
        
        // Fullscreen change handler
        document.addEventListener('fullscreenchange', () => {
            this.handleFullscreenChange();
        });
        
        // Initial resize to set proper dimensions
        setTimeout(() => {
            this.handleResize();
        }, 100);
    }
    
    handleResize() {
        if (window.debugLog) {
            window.debugLog('layout', 'Window resized', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        }
        
        // Update layout calculations
        this.updateLayout();
        
        // Refresh gantt chart
        if (typeof gantt !== 'undefined' && gantt.render) {
            gantt.render();
            
            // Re-center on selected task if any
            const selectedId = gantt.getSelectedId();
            if (selectedId && gantt.isTaskExists(selectedId)) {
                setTimeout(() => {
                    gantt.showTask(selectedId);
                }, 50);
            }
        }
        
        // Update status if needed
        if (typeof updateStatus === 'function') {
            updateStatus(`Layout updated (${window.innerWidth}x${window.innerHeight})`);
        }
    }
    
    updateLayout() {
        // Calculate available height for gantt
        const header = document.querySelector('.header');
        const statusSection = document.getElementById('statusSection');
        const mainContent = document.querySelector('.main-content');
        
        if (!header || !mainContent) return;
        
        const headerHeight = header.offsetHeight;
        const statusHeight = this.statusCollapsed ? 40 : (statusSection ? statusSection.offsetHeight : 0);
        const mainPadding = 20; // Total vertical padding
        
        // Calculate gantt container height
        const availableHeight = window.innerHeight - headerHeight - statusHeight - mainPadding;
        
        const ganttContainer = document.querySelector('.gantt-container');
        if (ganttContainer) {
            // Set a minimum height to keep it usable
            const minHeight = 300;
            const finalHeight = Math.max(availableHeight, minHeight);
            
            // Update CSS custom property for other components to use
            document.documentElement.style.setProperty('--gantt-height', `${finalHeight}px`);
        }
    }
    
    toggleStatus() {
        const statusSection = document.getElementById('statusSection');
        if (!statusSection) return;
        
        this.statusCollapsed = !this.statusCollapsed;
        statusSection.classList.toggle('collapsed');
        
        // Save preference
        localStorage.setItem('taskjuggler-status-collapsed', this.statusCollapsed);
        
        // Update layout after animation
        setTimeout(() => {
            this.handleResize();
        }, 350);
        
        if (window.debugLog) {
            window.debugLog('ui', 'Status section toggled', { collapsed: this.statusCollapsed });
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Error entering fullscreen:', err);
            });
        } else {
            document.exitFullscreen().catch(err => {
                console.error('Error exiting fullscreen:', err);
            });
        }
    }
    
    handleFullscreenChange() {
        this.fullscreenMode = !!document.fullscreenElement;
        document.body.classList.toggle('fullscreen', this.fullscreenMode);
        
        // Force resize after transition
        setTimeout(() => {
            this.handleResize();
        }, 100);
        
        if (typeof updateStatus === 'function') {
            updateStatus(this.fullscreenMode ? 'Entered fullscreen mode' : 'Exited fullscreen mode');
        }
    }
    
    // Public API
    getState() {
        return {
            statusCollapsed: this.statusCollapsed,
            fullscreenMode: this.fullscreenMode,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight
        };
    }
}

// Create global instance
window.layoutManager = new LayoutManager();

// Global function for status toggle (called from HTML onclick)
window.toggleStatus = function() {
    if (window.layoutManager) {
        window.layoutManager.toggleStatus();
    }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayoutManager;
}