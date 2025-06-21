// Main Application Entry Point
// This file initializes and coordinates all modules

// Initialize the application
function initializeApp() {
    // 1. Initialize DHTMLX Gantt configuration
    initializeGanttConfig();
    
    // 2. Load initial data
    loadTaskJugglerData();
    
    // 3. Keyboard navigation is now handled automatically by KeyboardManager
    
    // 4. Command palette is initialized automatically by custom-command-palette.js
    
    // 5. Initialize mouse wheel zoom
    initializeMouseWheelZoom();
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
    // Debug: Check if modules are loaded
    setTimeout(() => {
        console.log('=== Module Check ===');
        console.log('keyboardHelp loaded:', !!window.keyboardHelp);
        console.log('keyboardManager loaded:', !!window.keyboardManager);
        console.log('customCommandPalette loaded:', !!window.customCommandPalette);
        
        if (window.keyboardManager) {
            console.log('KeyboardManager state:', window.keyboardManager.getCurrentState());
            console.log('Global hotkeys size:', window.keyboardManager.globalHotkeys.size);
            console.log('Global hotkeys:', Array.from(window.keyboardManager.globalHotkeys.keys()));
        }
    }, 1000);
});