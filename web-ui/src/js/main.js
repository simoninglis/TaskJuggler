// Main entry point for Vite
// Import all modules in the correct order

// Import debug client for WebSocket debugging (only in development)
if (import.meta.env.DEV) {
    import('./debug-client.js').then(() => {
        console.log('✅ Debug client loaded');
    });
}

// Import state store first - it's needed by many other modules
import stateStore from './stateStore.js';
console.log('✅ State store initialized');

// Import web components
import './components/keyboard-help.js';
import './components/theme-manager.js';
import './components/layout-manager.js';

// Import gantt initialization
import { initializeGantt, waitForGantt } from './gantt-init.js';

// Function to load remaining modules after gantt is ready
async function loadModulesAfterGantt() {
    try {
        console.log('⏳ Starting module loading process...');
        
        // Wait for DHTMLX Gantt to be available
        await waitForGantt();
        console.log('✅ DHTMLX Gantt is available');
        
        // Now import modules that depend on gantt
        console.log('⏳ Loading gantt-config...');
        await import('./gantt-config.js');
        
        console.log('⏳ Loading gantt-data...');
        await import('./gantt-data.js');
        
        console.log('⏳ Loading gantt-controls...');
        await import('./gantt-controls.js');
        
        console.log('⏳ Loading keyboard-manager...');
        await import('./keyboard-manager.js');
        
        console.log('⏳ Loading custom-command-palette...');
        await import('./custom-command-palette.js');
        
        console.log('⏳ Loading app.js...');
        const appModule = await import('./app.js');
        
        console.log('✅ All modules loaded successfully');
        
        // Initialize gantt after modules are loaded
        console.log('⏳ Initializing Gantt chart...');
        await initializeGantt();
        
        // Now initialize the app (which loads data)
        console.log('⏳ Initializing app...');
        if (appModule.initializeApp) {
            appModule.initializeApp();
        } else {
            console.error('❌ initializeApp not found in app module');
        }
        
    } catch (error) {
        console.error('❌ Failed to load modules:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Start loading process when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadModulesAfterGantt);
} else {
    // DOM is already loaded
    loadModulesAfterGantt();
}