// Main Application Entry Point
// This file initializes and coordinates all modules

// Initialize the application
function initializeApp() {
    console.log('🚀 Initializing TaskJuggler Web UI...');
    
    // Check if gantt is available
    if (typeof gantt === 'undefined') {
        console.error('❌ DHTMLX Gantt is not loaded!');
        return;
    }
    
    // Check if container exists
    const ganttContainer = document.getElementById('gantt_here');
    if (!ganttContainer) {
        console.error('❌ Gantt container #gantt_here not found!');
        return;
    }
    
    console.log('✅ Prerequisites checked, initializing app...');
    
    // 1. Initialize DHTMLX Gantt configuration
    if (typeof initializeGanttConfig === 'function') {
        initializeGanttConfig();
    } else {
        console.error('❌ initializeGanttConfig not found');
    }
    
    // 2. Load initial data
    if (typeof loadTaskJugglerData === 'function') {
        loadTaskJugglerData();
    } else {
        console.error('❌ loadTaskJugglerData not found');
    }
    
    // 3. Keyboard navigation is now handled automatically by KeyboardManager
    
    // 4. Command palette is initialized automatically by custom-command-palette.js
    
    // 5. Initialize mouse wheel zoom
    if (typeof initializeMouseWheelZoom === 'function') {
        initializeMouseWheelZoom();
    } else {
        console.error('❌ initializeMouseWheelZoom not found');
    }
}

// Start the application when DOM is ready
// Check if DOM is already loaded (for ES modules)
if (document.readyState !== 'loading') {
    initializeApp();
} else {
    document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
    });
}

// Cleanup handler to prevent memory leaks
window.addEventListener('beforeunload', () => {
    console.log('🧹 Cleaning up resources before page unload...');

    // Clean up keyboard manager
    if (window.keyboardManager && window.keyboardManager.cleanup) {
        window.keyboardManager.cleanup();
        console.log('✅ Keyboard manager cleaned up');
    }

    // Clean up data watcher
    if (window.dataWatcher && window.dataWatcher.stop) {
        window.dataWatcher.stop();
        console.log('✅ Data watcher stopped');
    }

    // Clean up WebSocket data watcher
    if (window.wsDataWatcher && window.wsDataWatcher.ws) {
        window.wsDataWatcher.ws.close();
        console.log('✅ WebSocket data watcher closed');
    }

    // Clean up File System watcher
    if (window.fsWatcher && window.fsWatcher.eventSource) {
        window.fsWatcher.eventSource.close();
        console.log('✅ File System watcher closed');
    }
});

// Export for use in main.js
export { initializeApp };