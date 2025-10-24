// Centralized Keyboard Event Management System
// Single source of truth for all keyboard handling in the application

// Import configuration constants
import { KEYBOARD } from './config.js';

// Import state store
import stateStore from './stateStore.js';

// Import state-specific handlers
import {
    handleGanttFocused,
    handleSearchFocused,
    handleCustomPaletteOpen,
    handleLightboxOpen,
    handleExternalFocused,
    handleHelpOpen
} from './keyboard/state-handlers.js';

// Import global hotkey definitions
import { registerGlobalHotkeys } from './keyboard/hotkey-definitions.js';

// Import navigation functions from gantt-navigation module
import { selectNextTask, selectPreviousTask } from './gantt/gantt-navigation.js';

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

        // Instance variable for interval tracking
        this.stateMonitoringInterval = null;

        // Bind handlers for proper event listener removal
        this.focusInHandler = () => {
            setTimeout(() => this.updateState(), KEYBOARD.FOCUS_DEBOUNCE);
        };

        this.focusOutHandler = () => {
            setTimeout(() => this.updateState(), KEYBOARD.FOCUS_DEBOUNCE);
        };

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
        registerGlobalHotkeys(this);

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
                }, KEYBOARD.GANTT_REFRESH_DELAY);
            }, KEYBOARD.GANTT_REFRESH_DELAY);
        }, KEYBOARD.GANTT_REFRESH_DELAY);
    }

    startStateMonitoring() {
        // Monitor for state changes periodically to catch edge cases
        // Event listeners (focusin/focusout) provide immediate responsiveness
        this.stateMonitoringInterval = setInterval(() => {
            this.updateState();
        }, KEYBOARD.STATE_CHECK_INTERVAL);

        // Also monitor on focus changes using bound handlers for proper cleanup
        document.addEventListener('focusin', this.focusInHandler);
        document.addEventListener('focusout', this.focusOutHandler);
    }

    stopStateMonitoring() {
        // Clear the interval to prevent memory leak
        if (this.stateMonitoringInterval !== null) {
            clearInterval(this.stateMonitoringInterval);
            this.stateMonitoringInterval = null;
        }

        // Remove event listeners using the same bound handlers
        document.removeEventListener('focusin', this.focusInHandler);
        document.removeEventListener('focusout', this.focusOutHandler);
    }

    cleanup() {
        // Public method to clean up all resources
        this.stopStateMonitoring();
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
        // Create context object for handlers
        const context = {
            debug: this.debug.bind(this)
        };

        // Register handlers for each state, passing context
        this.registerHandler(this.States.GANTT_FOCUSED, (e, state) => handleGanttFocused(e, state, context));
        this.registerHandler(this.States.SEARCH_FOCUSED, (e, state) => handleSearchFocused(e, state, context));
        this.registerHandler(this.States.CUSTOM_PALETTE_OPEN, (e, state) => handleCustomPaletteOpen(e, state, context));
        this.registerHandler(this.States.LIGHTBOX_OPEN, (e, state) => handleLightboxOpen(e, state, context));
        this.registerHandler(this.States.EXTERNAL_FOCUSED, (e, state) => handleExternalFocused(e, state, context));
        this.registerHandler(this.States.HELP_OPEN, (e, state) => handleHelpOpen(e, state, context));
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
// (Imported from gantt-navigation.js for backward compatibility)
// ===================

// Export to window for backward compatibility with existing code
window.selectNextTask = selectNextTask;
window.selectPreviousTask = selectPreviousTask;

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
