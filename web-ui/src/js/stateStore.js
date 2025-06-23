// Centralized State Management Store
// Single source of truth for application state

class StateStore {
    constructor() {
        // Private state object
        this._state = {
            // Gantt view state
            currentZoom: 'day',
            isReadOnly: true,
            focusedTaskId: null,
            focusedTaskName: null,
            
            // Command palette state
            commandPalette: {
                isOpen: false,
                mode: 'command', // 'command', 'search', 'go', 'focus'
                searchTerm: '',
                selectedIndex: 0,
                filteredItems: []
            },
            
            // Keyboard manager state
            keyboard: {
                currentState: 'gantt_focused',
                prefixKey: null,
                lastKeyCombo: null
            },
            
            // UI state
            theme: 'light',
            statusCollapsed: false,
            isFullscreen: false,
            
            // Data state
            originalData: null,
            isFiltered: false,
            taskCount: 0
        };
        
        // Subscribers for state changes
        this._subscribers = new Map();
        
        // Debug mode
        this._debug = true;
    }
    
    // Generic getter for any state path
    get(path) {
        const keys = path.split('.');
        let value = this._state;
        
        for (const key of keys) {
            value = value[key];
            if (value === undefined) {
                console.warn(`State path not found: ${path}`);
                return undefined;
            }
        }
        
        return value;
    }
    
    // Generic setter with dot notation support
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this._state;
        
        // Navigate to the target object
        for (const key of keys) {
            if (!target[key]) {
                target[key] = {};
            }
            target = target[key];
        }
        
        // Check if value actually changed
        const oldValue = target[lastKey];
        if (oldValue === value) {
            return; // No change, no need to notify
        }
        
        // Set the value
        target[lastKey] = value;
        
        // Debug logging
        if (this._debug) {
            console.log(`[StateStore] ${path}: ${JSON.stringify(oldValue)} → ${JSON.stringify(value)}`);
        }
        
        // Notify subscribers
        this._notify(path, value, oldValue);
    }
    
    // Specific getters for common access patterns
    getZoom() { return this._state.currentZoom; }
    isReadOnly() { return this._state.isReadOnly; }
    getFocusedTaskId() { return this._state.focusedTaskId; }
    getFocusedTaskName() { return this._state.focusedTaskName; }
    getTheme() { return this._state.theme; }
    isCommandPaletteOpen() { return this._state.commandPalette.isOpen; }
    getCommandPaletteMode() { return this._state.commandPalette.mode; }
    getKeyboardState() { return this._state.keyboard.currentState; }
    
    // Get full state (returns a deep copy)
    getState() { 
        return JSON.parse(JSON.stringify(this._state));
    }
    
    // Specific setters with validation
    setZoom(zoom) {
        const validZooms = ['hour', 'day', 'week', 'month', 'quarter', 'year'];
        if (validZooms.includes(zoom)) {
            this.set('currentZoom', zoom);
        } else {
            console.error(`Invalid zoom level: ${zoom}`);
        }
    }
    
    setReadOnly(readOnly) {
        this.set('isReadOnly', Boolean(readOnly));
    }
    
    setFocusedTask(taskId, taskName = null) {
        this.set('focusedTaskId', taskId);
        this.set('focusedTaskName', taskName);
    }
    
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.set('theme', theme);
        }
    }
    
    // Command palette specific methods
    setCommandPaletteOpen(isOpen) {
        this.set('commandPalette.isOpen', Boolean(isOpen));
    }
    
    setCommandPaletteMode(mode) {
        const validModes = ['command', 'search', 'go', 'focus'];
        if (validModes.includes(mode)) {
            this.set('commandPalette.mode', mode);
        }
    }
    
    setCommandPaletteSearchTerm(term) {
        this.set('commandPalette.searchTerm', term);
    }
    
    setCommandPaletteSelectedIndex(index) {
        this.set('commandPalette.selectedIndex', index);
    }
    
    // Keyboard state methods
    setKeyboardState(state) {
        this.set('keyboard.currentState', state);
    }
    
    setPrefixKey(key) {
        this.set('keyboard.prefixKey', key);
    }
    
    // Batch update method for multiple state changes
    update(updates) {
        Object.entries(updates).forEach(([path, value]) => {
            this.set(path, value);
        });
    }
    
    // Subscription mechanism
    subscribe(path, callback) {
        if (!this._subscribers.has(path)) {
            this._subscribers.set(path, new Set());
        }
        this._subscribers.get(path).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this._subscribers.get(path);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this._subscribers.delete(path);
                }
            }
        };
    }
    
    // Subscribe to multiple paths
    subscribeMultiple(paths, callback) {
        const unsubscribers = paths.map(path => this.subscribe(path, callback));
        
        // Return function to unsubscribe from all
        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }
    
    // Private notification method
    _notify(path, newValue, oldValue) {
        // Notify specific path subscribers
        const callbacks = this._subscribers.get(path);
        if (callbacks) {
            callbacks.forEach(cb => {
                try {
                    cb(newValue, oldValue, path);
                } catch (error) {
                    console.error(`Error in state subscriber for ${path}:`, error);
                }
            });
        }
        
        // Notify wildcard subscribers
        const wildcardCallbacks = this._subscribers.get('*');
        if (wildcardCallbacks) {
            wildcardCallbacks.forEach(cb => {
                try {
                    cb(path, newValue, oldValue, this._state);
                } catch (error) {
                    console.error('Error in wildcard state subscriber:', error);
                }
            });
        }
        
        // Check for parent path subscribers (e.g., 'commandPalette' when 'commandPalette.isOpen' changes)
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            const parentCallbacks = this._subscribers.get(parentPath);
            if (parentCallbacks) {
                parentCallbacks.forEach(cb => {
                    try {
                        const parentValue = this.get(parentPath);
                        cb(parentValue, null, parentPath);
                    } catch (error) {
                        console.error(`Error in parent state subscriber for ${parentPath}:`, error);
                    }
                });
            }
        }
    }
    
    // Debug helpers
    enableDebug() {
        this._debug = true;
    }
    
    disableDebug() {
        this._debug = false;
    }
    
    // Get all current subscriptions (for debugging)
    getSubscriptions() {
        const subs = {};
        this._subscribers.forEach((callbacks, path) => {
            subs[path] = callbacks.size;
        });
        return subs;
    }
    
    // Reset state to defaults (useful for testing)
    reset() {
        this._state = {
            currentZoom: 'day',
            isReadOnly: true,
            focusedTaskId: null,
            focusedTaskName: null,
            commandPalette: {
                isOpen: false,
                mode: 'command',
                searchTerm: '',
                selectedIndex: 0,
                filteredItems: []
            },
            keyboard: {
                currentState: 'gantt_focused',
                prefixKey: null,
                lastKeyCombo: null
            },
            theme: 'light',
            statusCollapsed: false,
            isFullscreen: false,
            originalData: null,
            isFiltered: false,
            taskCount: 0
        };
        
        // Notify all subscribers of reset
        this._notify('*', this._state, null);
    }
}

// Create singleton instance
const stateStore = new StateStore();

// Make available globally for debugging and modules
if (typeof window !== 'undefined') {
    window.stateStore = stateStore;
}

// Export for ES modules
export default stateStore;