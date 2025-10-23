/**
 * Keyboard Manager - Global Hotkey Definitions
 *
 * Defines all global keyboard shortcuts that work across all application states.
 * Global hotkeys are checked before state-specific handlers and can prevent
 * further event processing by returning 'handled' or 'blocked'.
 *
 * @module keyboard/hotkey-definitions
 */

/**
 * Register all global hotkeys with the keyboard manager
 * Global hotkeys work from any application state
 * @param {KeyboardManager} manager - The keyboard manager instance
 */
export function registerGlobalHotkeys(manager) {
    // Ctrl+Shift+P / Cmd+Shift+P - Command palette (works from any state)
    manager.registerGlobalHotkey('ctrl+shift+p', (e, currentState) => {
        manager.debug('Global Ctrl+Shift+P pressed', { currentState });

        if (window.customCommandPalette) {
            window.customCommandPalette.open();
            manager.debug('Opened custom command palette');
            manager.updateState();
        }

        return 'handled'; // Prevent routing to other handlers
    });

    manager.registerGlobalHotkey('cmd+shift+p', (e, currentState) => {
        manager.debug('Global Cmd+Shift+P pressed', { currentState });

        if (window.customCommandPalette) {
            window.customCommandPalette.open();
            manager.debug('Opened custom command palette');
            manager.updateState();
        }

        return 'handled'; // Prevent routing to other handlers
    });

    // '/' key - Open search in command palette
    manager.registerGlobalHotkey('/', (e, currentState) => {
        if (currentState === manager.States.CUSTOM_PALETTE_OPEN) {
            return 'continue'; // Let palette handle it
        }

        manager.debug('Global / pressed - opening search palette');
        if (window.customCommandPalette) {
            window.customCommandPalette.openSearch();
            manager.debug('Opened custom command palette in search mode');
            manager.updateState();
        }

        return 'handled';
    });

    // 'f' key - Open focus search (lowercase)
    manager.registerGlobalHotkey('f', (e, currentState) => {
        if (currentState === manager.States.CUSTOM_PALETTE_OPEN) {
            return 'continue'; // Let palette handle it
        }

        // Check if shift is pressed for fullscreen
        if (e.shiftKey) {
            return 'continue'; // Let shift+f be handled separately
        }

        manager.debug('Global f pressed - opening focus search');
        if (window.customCommandPalette) {
            window.customCommandPalette.openFocusSearch();
            manager.debug('Opened custom command palette in focus search mode');
            manager.updateState();
        }

        return 'handled';
    });

    // 'Shift+F' - Focus on current selection
    manager.registerGlobalHotkey('shift+f', (e, currentState) => {
        if (currentState === manager.States.CUSTOM_PALETTE_OPEN) {
            return 'continue'; // Let palette handle it
        }

        manager.debug('Global Shift+F pressed - focusing on current task');
        if (typeof focusOnCurrentTask === 'function') {
            focusOnCurrentTask();
        }

        return 'handled';
    });

    // 'g' key - Go navigation
    manager.registerGlobalHotkey('g', (e, currentState) => {
        if (currentState === manager.States.CUSTOM_PALETTE_OPEN ||
            currentState === manager.States.HELP_OPEN) {
            return 'continue'; // Let palette/help handle it
        }

        manager.debug('Global g pressed - opening go navigation');
        if (window.customCommandPalette) {
            window.customCommandPalette.openGoNavigation();
            manager.debug('Opened go navigation palette');
            manager.updateState();
        }

        return 'handled';
    });

    // '?' key - Show keyboard help
    // Register as 'shift+?' because that's what the browser reports when pressing Shift+/
    manager.registerGlobalHotkey('shift+?', (e, currentState) => {
        manager.debug('Shift+? hotkey triggered', { currentState });

        if (currentState === manager.States.CUSTOM_PALETTE_OPEN ||
            currentState === manager.States.HELP_OPEN) {
            manager.debug('Hotkey blocked - palette or help already open');
            return 'continue'; // Let palette/help handle it
        }

        manager.debug('Global ? pressed - toggling keyboard help');
        const keyboardHelp = document.querySelector('keyboard-help');
        if (keyboardHelp) {
            keyboardHelp.toggle();
            manager.debug('Toggled keyboard help');
            manager.updateState();
        } else {
            manager.debug('ERROR: keyboard-help element not found!');
        }

        return 'handled';
    });

    // Also register '?' without shift (some keyboards/browsers handle it differently)
    manager.registerGlobalHotkey('?', (e, currentState) => {
        manager.debug('? hotkey triggered (without shift)', { currentState });

        if (currentState === manager.States.CUSTOM_PALETTE_OPEN ||
            currentState === manager.States.HELP_OPEN) {
            manager.debug('Hotkey blocked - palette or help already open');
            return 'continue'; // Let palette/help handle it
        }

        manager.debug('Global ? pressed - toggling keyboard help');
        const keyboardHelp = document.querySelector('keyboard-help');
        if (keyboardHelp) {
            keyboardHelp.toggle();
            manager.debug('Toggled keyboard help');
            manager.updateState();
        } else {
            manager.debug('ERROR: keyboard-help element not found!');
        }

        return 'handled';
    });

    // Escape key - Context-sensitive escape handling
    manager.registerGlobalHotkey('escape', (e, currentState) => {
        manager.debug('Global Escape pressed', { currentState });

        if (currentState === manager.States.HELP_OPEN) {
            // Close help screen
            if (window.keyboardHelp) {
                window.keyboardHelp.close();
            }
            return 'handled';
        }

        if (currentState === manager.States.CUSTOM_PALETTE_OPEN) {
            // Close custom palette
            if (window.customCommandPalette) {
                window.customCommandPalette.close();
            }
            return 'handled';
        }

        return 'continue';
    });
}
