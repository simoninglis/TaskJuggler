// Centralized Keyboard Event Management System  
// Single source of truth for all keyboard handling in the application

// Import state store
import stateStore from './stateStore.js';

console.log('🔥 keyboard-manager.js is loading...');
if (window.debugLog) {
    window.debugLog('debug', 'keyboard-manager.js file is loading');
}

class KeyboardManager {
    constructor() {
        // Application states
        this.States = {
            GANTT_FOCUSED: 'gantt_focused',
            SEARCH_FOCUSED: 'search_focused', 
            CUSTOM_PALETTE_OPEN: 'custom_palette_open',
            LIGHTBOX_OPEN: 'lightbox_open',
            EXTERNAL_FOCUSED: 'external_focused',
            HELP_OPEN: 'help_open'
        };
        
        // Handler registry - maps states to handler functions
        this.handlers = new Map();
        
        // Global hotkeys that work in any state
        this.globalHotkeys = new Map();
        
        // State detection functions
        this.stateDetectors = new Map();
        
        // Debug logging
        this.debugEnabled = typeof window.debugLog === 'function';
        
        // Initialize keyboard state in store
        stateStore.setKeyboardState(this.States.GANTT_FOCUSED);
        stateStore.setPrefixKey(null);
        
        // Initialize the manager
        this.initialize();
    }
    
    initialize() {
        this.debug('Initializing KeyboardManager');
        
        // Register state detectors
        this.registerStateDetectors();
        
        // Register default handlers
        this.registerDefaultHandlers();
        
        // Register global hotkeys
        this.registerGlobalHotkeys();
        
        // Start listening for keyboard events
        this.startListening();
        
        // Monitor state changes
        this.startStateMonitoring();
    }
    
    debug(message, data = null) {
        // Always log to console for debugging
        console.log(`[KeyboardManager] ${message}`, data || '');
        
        // Also log to WebSocket if available
        if (this.debugEnabled) {
            window.debugLog('keyboard', message, data);
        }
    }
    
    // ===================
    // State Management
    // ===================
    
    registerStateDetectors() {
        // Detect if keyboard help is open
        this.stateDetectors.set(this.States.HELP_OPEN, () => {
            const keyboardHelp = document.querySelector('keyboard-help');
            if (keyboardHelp) {
                const state = keyboardHelp.getState();
                return state.isOpen;
            }
            return false;
        });
        
        // Detect if custom command palette is open
        this.stateDetectors.set(this.States.CUSTOM_PALETTE_OPEN, () => {
            return stateStore.isCommandPaletteOpen();
        });
        
        // Detect if search input is focused
        this.stateDetectors.set(this.States.SEARCH_FOCUSED, () => {
            const searchInput = document.getElementById('searchInput');
            return document.activeElement === searchInput;
        });
        
        // Detect if lightbox is open (DHTMLX Gantt editing dialog)
        this.stateDetectors.set(this.States.LIGHTBOX_OPEN, () => {
            if (gantt && gantt.getState) {
                const state = gantt.getState();
                const lightboxOpen = state.lightbox_id !== null && state.lightbox_id !== undefined;
                
                if (lightboxOpen) {
                    this.debug('Lightbox detected open', { lightbox_id: state.lightbox_id });
                }
                
                return lightboxOpen;
            }
            return false;
        });
        
        // Detect if focus is on external element (not gantt, search, or known UI)
        this.stateDetectors.set(this.States.EXTERNAL_FOCUSED, () => {
            const activeElement = document.activeElement;
            const ganttContainer = document.getElementById('gantt_here');
            const searchInput = document.getElementById('searchInput');
            
            return activeElement && 
                   activeElement !== document.body &&
                   !ganttContainer?.contains(activeElement) &&
                   activeElement !== searchInput;
        });
    }
    
    detectCurrentState() {
        // Check states in priority order
        const stateOrder = [
            this.States.HELP_OPEN,
            this.States.CUSTOM_PALETTE_OPEN,
            this.States.LIGHTBOX_OPEN,
            this.States.SEARCH_FOCUSED,
            this.States.EXTERNAL_FOCUSED,
            this.States.GANTT_FOCUSED  // Default fallback
        ];
        
        for (const state of stateOrder) {
            const detector = this.stateDetectors.get(state);
            if (detector && detector()) {
                return state;
            }
        }
        
        return this.States.GANTT_FOCUSED;
    }
    
    updateState() {
        const newState = this.detectCurrentState();
        const currentState = stateStore.getKeyboardState();
        if (newState !== currentState) {
            const oldState = currentState;
            stateStore.setKeyboardState(newState);
            this.debug(`State changed: ${oldState} -> ${newState}`);
            this.onStateChange(oldState, newState);
        }
    }
    
    onStateChange(fromState, toState) {
        // Handle state transitions
        this.debug('State transition', { from: fromState, to: toState });
        
        // Specific transition logic
        if (toState === this.States.GANTT_FOCUSED) {
            // Restore gantt focus and navigation capability
            this.restoreGanttFocus();
        }
    }
    
    restoreGanttFocus() {
        this.debug('Restoring gantt focus and navigation');
        
        const ganttContainer = document.getElementById('gantt_here');
        if (!ganttContainer) {
            this.debug('Gantt container not found!');
            return;
        }
        
        // Multi-step focus restoration for DHTMLX Gantt
        setTimeout(() => {
            // Step 1: Focus the gantt container
            ganttContainer.focus();
            this.debug('Gantt container focused');
            
            // Step 2: Ensure gantt has a selected task (required for navigation)
            setTimeout(() => {
                if (typeof gantt !== 'undefined' && gantt.getSelectedId) {
                    const selectedId = gantt.getSelectedId();
                    if (!selectedId) {
                        // Select first visible task if none selected
                        const tasks = gantt.getTaskByTime();
                        const visibleTasks = tasks.filter(task => gantt.isTaskVisible && gantt.isTaskVisible(task.id));
                        if (visibleTasks.length > 0) {
                            gantt.selectTask(visibleTasks[0].id);
                            this.debug('Selected first visible task for navigation:', visibleTasks[0].id);
                        }
                    } else {
                        this.debug('Gantt already has selected task:', selectedId);
                    }
                }
                
                // Step 3: Force gantt to recognize it's active
                setTimeout(() => {
                    if (typeof gantt !== 'undefined' && gantt.refreshData) {
                        // Trigger gantt refresh to ensure it's in correct state
                        gantt.refreshData();
                        this.debug('Gantt data refreshed');
                    }
                    
                    // Final verification
                    this.debug('Gantt focus restoration complete', {
                        activeElement: document.activeElement.tagName + (document.activeElement.id ? '#' + document.activeElement.id : ''),
                        selectedTask: typeof gantt !== 'undefined' && gantt.getSelectedId ? gantt.getSelectedId() : 'unknown'
                    });
                }, 10);
            }, 10);
        }, 10);
    }
    
    startStateMonitoring() {
        // Monitor for state changes more frequently for better responsiveness
        setInterval(() => {
            this.updateState();
        }, 50);
        
        // Also monitor on focus changes
        document.addEventListener('focusin', () => {
            setTimeout(() => this.updateState(), 10);
        });
        
        document.addEventListener('focusout', () => {
            setTimeout(() => this.updateState(), 10);
        });
    }
    
    // ===================
    // Event Handling
    // ===================
    
    startListening() {
        // Single keyboard event listener for the entire application
        document.addEventListener('keydown', (e) => {
            // Always log to WebSocket for debugging
            if (window.debugLog) {
                window.debugLog('event', 'Keydown event', {
                    key: e.key,
                    keyCode: e.keyCode,
                    ctrlKey: e.ctrlKey,
                    shiftKey: e.shiftKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey,
                    target: e.target.tagName + (e.target.id ? '#' + e.target.id : '')
                });
            }
            
            this.handleKeyboardEvent(e);
        }, false); // Use bubble phase, not capture
        
        this.debug('Started listening for keyboard events');
    }
    
    handleKeyboardEvent(e) {
        // Update state before processing
        this.updateState();
        
        this.debug('Processing keyboard event', {
            key: e.key,
            keyCode: e.keyCode,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
            metaKey: e.metaKey,
            currentState: stateStore.getKeyboardState(),
            target: e.target.tagName + (e.target.id ? '#' + e.target.id : ''),
            keyCombo: this.getKeyCombo(e)
        });
        
        // Check global hotkeys first (work in any state)
        const globalResult = this.processGlobalHotkeys(e);
        if (globalResult === 'handled') {
            return;
        } else if (globalResult === 'blocked') {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        
        // Route to state-specific handler
        const currentState = stateStore.getKeyboardState();
        const handler = this.handlers.get(currentState);
        if (handler) {
            this.debug(`Routing ${e.key} to ${currentState} handler`);
            const result = handler(e, currentState);
            this.debug(`Handler returned: ${result}`);
            
            if (result === 'handled' || result === 'blocked') {
                e.preventDefault();
                e.stopPropagation();
                
                // Update state after handling (in case handler changed it)
                setTimeout(() => this.updateState(), 10);
            } else if (result === 'continue') {
                this.debug(`Handler passed event through - letting browser handle ${e.key}`);
            }
        } else {
            this.debug(`❌ No handler registered for state: ${currentState} - event will be ignored!`);
        }
    }
    
    processGlobalHotkeys(e) {
        const keyCombo = this.getKeyCombo(e);
        const globalHandler = this.globalHotkeys.get(keyCombo);
        
        this.debug(`Checking global hotkey: "${keyCombo}"`, {
            availableHotkeys: Array.from(this.globalHotkeys.keys()),
            found: !!globalHandler
        });
        
        if (globalHandler) {
            this.debug(`Processing global hotkey: ${keyCombo}`);
            return globalHandler(e, stateStore.getKeyboardState());
        }
        
        return 'continue';
    }
    
    getKeyCombo(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.metaKey) parts.push('cmd');
        if (e.shiftKey) parts.push('shift'); 
        if (e.altKey) parts.push('alt');
        parts.push(e.key.toLowerCase());
        return parts.join('+');
    }
    
    // ===================
    // Handler Registration
    // ===================
    
    registerHandler(state, handlerFunction) {
        this.handlers.set(state, handlerFunction);
        this.debug(`Registered handler for state: ${state}`);
    }
    
    registerGlobalHotkey(keyCombo, handlerFunction) {
        this.globalHotkeys.set(keyCombo, handlerFunction);
        this.debug(`Registered global hotkey: ${keyCombo}`);
    }
    
    registerDefaultHandlers() {
        // Register handlers for each state
        this.registerHandler(this.States.GANTT_FOCUSED, this.handleGanttFocused.bind(this));
        this.registerHandler(this.States.SEARCH_FOCUSED, this.handleSearchFocused.bind(this));
        this.registerHandler(this.States.CUSTOM_PALETTE_OPEN, this.handleCustomPaletteOpen.bind(this));
        this.registerHandler(this.States.LIGHTBOX_OPEN, this.handleLightboxOpen.bind(this));
        this.registerHandler(this.States.EXTERNAL_FOCUSED, this.handleExternalFocused.bind(this));
        this.registerHandler(this.States.HELP_OPEN, this.handleHelpOpen.bind(this));
    }
    
    registerGlobalHotkeys() {
        // Ctrl+Shift+P / Cmd+Shift+P - Command palette (works from any state)
        this.registerGlobalHotkey('ctrl+shift+p', (e, currentState) => {
            this.debug('Global Ctrl+Shift+P pressed', { currentState });
            
            if (window.customCommandPalette) {
                window.customCommandPalette.open();
                this.debug('Opened custom command palette');
                this.updateState();
            }
            
            return 'handled'; // Prevent routing to other handlers
        });
        
        this.registerGlobalHotkey('cmd+shift+p', (e, currentState) => {
            this.debug('Global Cmd+Shift+P pressed', { currentState });
            
            if (window.customCommandPalette) {
                window.customCommandPalette.open();
                this.debug('Opened custom command palette');
                this.updateState();
            }
            
            return 'handled'; // Prevent routing to other handlers
        });
        
        // '/' key - Open search in command palette
        this.registerGlobalHotkey('/', (e, currentState) => {
            if (currentState === this.States.CUSTOM_PALETTE_OPEN) {
                return 'continue'; // Let palette handle it
            }
            
            this.debug('Global / pressed - opening search palette');
            if (window.customCommandPalette) {
                window.customCommandPalette.openSearch();
                this.debug('Opened custom command palette in search mode');
                this.updateState();
            }
            
            return 'handled';
        });
        
        // 'f' key - Open focus search (lowercase)
        this.registerGlobalHotkey('f', (e, currentState) => {
            if (currentState === this.States.CUSTOM_PALETTE_OPEN) {
                return 'continue'; // Let palette handle it
            }
            
            // Check if shift is pressed for fullscreen
            if (e.shiftKey) {
                return 'continue'; // Let shift+f be handled separately
            }
            
            this.debug('Global f pressed - opening focus search');
            if (window.customCommandPalette) {
                window.customCommandPalette.openFocusSearch();
                this.debug('Opened custom command palette in focus search mode');
                this.updateState();
            }
            
            return 'handled';
        });
        
        // 'Shift+F' - Focus on current selection
        this.registerGlobalHotkey('shift+f', (e, currentState) => {
            if (currentState === this.States.CUSTOM_PALETTE_OPEN) {
                return 'continue'; // Let palette handle it
            }
            
            this.debug('Global Shift+F pressed - focusing on current task');
            if (typeof focusOnCurrentTask === 'function') {
                focusOnCurrentTask();
            }
            
            return 'handled';
        });
        
        // 'g' key - Go navigation
        this.registerGlobalHotkey('g', (e, currentState) => {
            if (currentState === this.States.CUSTOM_PALETTE_OPEN || 
                currentState === this.States.HELP_OPEN) {
                return 'continue'; // Let palette/help handle it
            }
            
            this.debug('Global g pressed - opening go navigation');
            if (window.customCommandPalette) {
                window.customCommandPalette.openGoNavigation();
                this.debug('Opened go navigation palette');
                this.updateState();
            }
            
            return 'handled';
        });
        
        // '?' key - Show keyboard help
        // Register as 'shift+?' because that's what the browser reports when pressing Shift+/
        this.registerGlobalHotkey('shift+?', (e, currentState) => {
            this.debug('Shift+? hotkey triggered', { currentState });
            
            if (currentState === this.States.CUSTOM_PALETTE_OPEN || 
                currentState === this.States.HELP_OPEN) {
                this.debug('Hotkey blocked - palette or help already open');
                return 'continue'; // Let palette/help handle it
            }
            
            this.debug('Global ? pressed - toggling keyboard help');
            const keyboardHelp = document.querySelector('keyboard-help');
            if (keyboardHelp) {
                keyboardHelp.toggle();
                this.debug('Toggled keyboard help');
                this.updateState();
            } else {
                this.debug('ERROR: keyboard-help element not found!');
            }
            
            return 'handled';
        });
        
        // Also register '?' without shift (some keyboards/browsers handle it differently)
        this.registerGlobalHotkey('?', (e, currentState) => {
            this.debug('? hotkey triggered (without shift)', { currentState });
            
            if (currentState === this.States.CUSTOM_PALETTE_OPEN || 
                currentState === this.States.HELP_OPEN) {
                this.debug('Hotkey blocked - palette or help already open');
                return 'continue'; // Let palette/help handle it
            }
            
            this.debug('Global ? pressed - toggling keyboard help');
            const keyboardHelp = document.querySelector('keyboard-help');
            if (keyboardHelp) {
                keyboardHelp.toggle();
                this.debug('Toggled keyboard help');
                this.updateState();
            } else {
                this.debug('ERROR: keyboard-help element not found!');
            }
            
            return 'handled';
        });
        
        // Escape key - Context-sensitive escape handling
        this.registerGlobalHotkey('escape', (e, currentState) => {
            this.debug('Global Escape pressed', { currentState });
            
            if (currentState === this.States.HELP_OPEN) {
                // Close help screen
                if (window.keyboardHelp) {
                    window.keyboardHelp.close();
                }
                return 'handled';
            }
            
            if (currentState === this.States.CUSTOM_PALETTE_OPEN) {
                // Close custom palette
                if (window.customCommandPalette) {
                    window.customCommandPalette.close();
                }
                return 'handled';
            }
            
            return 'continue';
        });
    }
    
    // ===================
    // State-Specific Handlers
    // ===================
    
    handleGanttFocused(e, state) {
        this.debug('Handling gantt-focused key', { 
            key: e.key,
            activeElement: document.activeElement.tagName + (document.activeElement.id ? '#' + document.activeElement.id : ''),
            selectedTask: typeof gantt !== 'undefined' && gantt.getSelectedId ? gantt.getSelectedId() : 'unknown'
        });
        
        // Handle prefix keys for multi-key sequences
        if (e.key === ']' || e.key === '[') {
            stateStore.setPrefixKey(e.key);
            this.debug('Prefix key captured', { prefix: e.key });
            return 'handled';
        }
        
        // Handle multi-key sequences
        const prefixKey = stateStore.get('keyboard.prefixKey');
        if (prefixKey) {
            const sequence = prefixKey + e.key;
            this.debug('Multi-key sequence', { sequence });
            
            switch (sequence) {
                case ']m':
                    if (typeof navigateToNextMilestone === 'function') {
                        navigateToNextMilestone();
                    }
                    stateStore.setPrefixKey(null);
                    return 'handled';
                    
                case '[m':
                    if (typeof navigateToPreviousMilestone === 'function') {
                        navigateToPreviousMilestone();
                    }
                    stateStore.setPrefixKey(null);
                    return 'handled';
                    
                default:
                    // Unknown sequence, reset
                    stateStore.setPrefixKey(null);
                    break;
            }
        }
        
        // Gantt navigation and controls
        switch (e.key) {
            case 'ArrowUp':
                this.debug('⬆️ Arrow Up pressed - calling selectPreviousTask');
                if (typeof selectPreviousTask === 'function') {
                    selectPreviousTask();
                    this.debug('✅ selectPreviousTask completed');
                } else {
                    this.debug('❌ selectPreviousTask function not available!');
                }
                return 'handled';
                
            case 'ArrowDown':
                this.debug('⬇️ Arrow Down pressed - calling selectNextTask');
                if (typeof selectNextTask === 'function') {
                    selectNextTask();
                    this.debug('✅ selectNextTask completed');
                } else {
                    this.debug('❌ selectNextTask function not available!');
                }
                return 'handled';
                
            case 'ArrowRight':
                if (!e.shiftKey) {
                    const selectedId = gantt.getSelectedId();
                    if (selectedId && gantt.hasChild(selectedId)) {
                        gantt.open(selectedId);
                    }
                    return 'handled';
                } else {
                    // Shift+Right = horizontal scroll
                    return this.handleHorizontalScroll(e, 'right');
                }
                
            case 'ArrowLeft':
                if (!e.shiftKey) {
                    const selectedId = gantt.getSelectedId();
                    if (selectedId && gantt.hasChild(selectedId)) {
                        gantt.close(selectedId);
                    }
                    return 'handled';
                } else {
                    // Shift+Left = horizontal scroll
                    return this.handleHorizontalScroll(e, 'left');
                }
                
            case ' ':
                // Space to toggle expand/collapse
                const selectedId = gantt.getSelectedId();
                if (selectedId && gantt.hasChild(selectedId)) {
                    if (gantt.getState().opened[selectedId]) {
                        gantt.close(selectedId);
                    } else {
                        gantt.open(selectedId);
                    }
                }
                return 'handled';
                
            case 'Enter':
                return this.handleEnterKey(e);
                
            case '+':
            case '=':
                if (typeof zoomIn === 'function') {
                    zoomIn();
                }
                return 'handled';
                
            case '-':
            case '_':
                if (typeof zoomOut === 'function') {
                    zoomOut();
                }
                return 'handled';
                
            case 'Home':
                gantt.scrollTo(0, null);
                if (typeof updateStatus === 'function') {
                    updateStatus('Scrolled to timeline start');
                }
                return 'handled';
                
            case 'End':
                gantt.scrollTo(999999, null);
                if (typeof updateStatus === 'function') {
                    updateStatus('Scrolled to timeline end');
                }
                return 'handled';
                
            default:
                return 'continue';
        }
    }
    
    handleSearchFocused(e, state) {
        this.debug('Handling search-focused key', { key: e.key });
        
        // Most keys should pass through to the search input
        // Escape is handled by global hotkey
        return 'continue';
    }
    
    handleCustomPaletteOpen(e, state) {
        this.debug('Handling custom-palette-open key', { key: e.key });
        
        // Let the custom command palette handle all keys
        // The palette has its own internal keyboard handling
        return 'continue';
    }
    
    handleLightboxOpen(e, state) {
        this.debug('Handling lightbox-open key', { key: e.key });
        
        // Let DHTMLX Gantt handle lightbox events
        return 'continue';
    }
    
    handleExternalFocused(e, state) {
        this.debug('Handling external-focused key', { key: e.key });
        
        // Don't interfere with external elements
        return 'continue';
    }
    
    handleHelpOpen(e, state) {
        this.debug('Handling help-open key', { key: e.key });
        
        // Let the help screen handle its own keyboard events
        // Escape is handled by global hotkey
        return 'continue';
    }
    
    // ===================
    // Helper Methods
    // ===================
    
    handleHorizontalScroll(e, direction) {
        const scrollState = gantt.getScrollState();
        const scrollAmount = this.calculateScrollAmount();
        
        if (direction === 'left') {
            gantt.scrollTo(Math.max(0, scrollState.x - scrollAmount), null);
            if (typeof updateStatus === 'function') {
                updateStatus('Scrolled left');
            }
        } else {
            gantt.scrollTo(scrollState.x + scrollAmount, null);
            if (typeof updateStatus === 'function') {
                updateStatus('Scrolled right');
            }
        }
        
        return 'handled';
    }
    
    calculateScrollAmount() {
        // Calculate appropriate scroll amount based on viewport
        const ganttContainer = document.getElementById('gantt_here');
        if (ganttContainer) {
            return Math.max(200, ganttContainer.clientWidth / 4);
        }
        return 200;
    }
    
    handleEnterKey(e) {
        const selectedId = gantt.getSelectedId();
        if (!selectedId) return 'continue';
        
        const hasChildren = gantt.hasChild(selectedId);
        
        if (hasChildren > 0) {
            // Toggle expand/collapse for parent tasks
            try {
                const task = gantt.getTask(selectedId);
                const isCurrentlyOpen = task.$open;
                
                if (isCurrentlyOpen) {
                    gantt.close(selectedId);
                } else {
                    gantt.open(selectedId);
                }
                
                return 'handled';
            } catch (error) {
                this.debug('Error in expand/collapse logic', {
                    selectedId: selectedId,
                    error: error.message
                });
                return 'continue';
            }
        } else if (typeof isReadOnly !== 'undefined' && !isReadOnly) {
            // Open lightbox for editing leaf tasks in edit mode
            gantt.showLightbox(selectedId);
            return 'handled';
        }
        
        return 'continue';
    }
    
    // ===================
    // Public API
    // ===================
    
    getCurrentState() {
        return stateStore.getKeyboardState();
    }
    
    forceStateUpdate() {
        this.updateState();
    }
    
    // Register custom handlers from external code
    addHandler(state, handlerFunction) {
        this.registerHandler(state, handlerFunction);
    }
    
    addGlobalHotkey(keyCombo, handlerFunction) {
        this.registerGlobalHotkey(keyCombo, handlerFunction);
    }
}

// ===================
// Navigation Utility Functions
// (Global functions for backward compatibility)
// ===================

function selectNextTask() {
    const allTasks = gantt.getTaskByTime();
    const visibleTasks = allTasks.filter(task => gantt.isTaskVisible(task.id));
    const currentId = gantt.getSelectedId();
    
    if (window.debugLog) {
        window.debugLog('debug', 'Selecting next task', {
            totalTasks: allTasks.length,
            visibleTasks: visibleTasks.length,
            currentSelection: currentId
        });
    }
    
    if (!currentId || visibleTasks.length === 0) {
        if (visibleTasks.length > 0) {
            gantt.selectTask(visibleTasks[0].id);
        }
        return;
    }
    
    const currentIndex = visibleTasks.findIndex(task => task.id === currentId);
    if (currentIndex !== -1 && currentIndex < visibleTasks.length - 1) {
        gantt.selectTask(visibleTasks[currentIndex + 1].id);
    }
}

function selectPreviousTask() {
    const allTasks = gantt.getTaskByTime();
    const visibleTasks = allTasks.filter(task => gantt.isTaskVisible(task.id));
    const currentId = gantt.getSelectedId();
    
    if (window.debugLog) {
        window.debugLog('debug', 'Selecting previous task', {
            totalTasks: allTasks.length,
            visibleTasks: visibleTasks.length,
            currentSelection: currentId
        });
    }
    
    if (!currentId || visibleTasks.length === 0) {
        if (visibleTasks.length > 0) {
            gantt.selectTask(visibleTasks[visibleTasks.length - 1].id);
        }
        return;
    }
    
    const currentIndex = visibleTasks.findIndex(task => task.id === currentId);
    if (currentIndex > 0) {
        gantt.selectTask(visibleTasks[currentIndex - 1].id);
    }
}

// Create global keyboard manager instance
console.log('🚀 Initializing KeyboardManager...');
try {
    window.keyboardManager = new KeyboardManager();
    console.log('✅ KeyboardManager initialized successfully');
} catch (error) {
    console.error('❌ KeyboardManager initialization failed:', error);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyboardManager;
}