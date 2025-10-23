/**
 * Keyboard Manager - State-Specific Handlers
 *
 * Contains all state-specific keyboard event handlers and their helper methods.
 * Each handler processes keyboard events for a specific application state.
 *
 * @module keyboard/state-handlers
 */

// Import configuration constants
import { KEYBOARD } from '../config.js';

// Import state store
import stateStore from '../stateStore.js';

/**
 * Handle keyboard events when Gantt chart has focus
 * Implements VIM-like navigation with arrow keys, prefix keys, and shortcuts
 * @param {KeyboardEvent} e - The keyboard event
 * @param {string} state - Current application state
 * @param {Object} context - Context object with debug method and state references
 * @returns {string} 'handled', 'blocked', or 'continue'
 */
export function handleGanttFocused(e, state, context) {
    context.debug('Handling gantt-focused key', {
        key: e.key,
        activeElement: document.activeElement.tagName + (document.activeElement.id ? '#' + document.activeElement.id : ''),
        selectedTask: typeof gantt !== 'undefined' && gantt.getSelectedId ? gantt.getSelectedId() : 'unknown'
    });

    // Handle prefix keys for multi-key sequences
    if (e.key === ']' || e.key === '[') {
        stateStore.setPrefixKey(e.key);
        context.debug('Prefix key captured', { prefix: e.key });
        return 'handled';
    }

    // Handle multi-key sequences
    const prefixKey = stateStore.get('keyboard.prefixKey');
    if (prefixKey) {
        const sequence = prefixKey + e.key;
        context.debug('Multi-key sequence', { sequence });

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
            context.debug('⬆️ Arrow Up pressed - calling selectPreviousTask');
            if (typeof selectPreviousTask === 'function') {
                selectPreviousTask();
                context.debug('✅ selectPreviousTask completed');
            } else {
                context.debug('❌ selectPreviousTask function not available!');
            }
            return 'handled';

        case 'ArrowDown':
            context.debug('⬇️ Arrow Down pressed - calling selectNextTask');
            if (typeof selectNextTask === 'function') {
                selectNextTask();
                context.debug('✅ selectNextTask completed');
            } else {
                context.debug('❌ selectNextTask function not available!');
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
                return handleHorizontalScroll(e, 'right', context);
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
                return handleHorizontalScroll(e, 'left', context);
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
            return handleEnterKey(e, context);

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

/**
 * Handle keyboard events when search input has focus
 * Most keys pass through to the search input
 * @param {KeyboardEvent} e - The keyboard event
 * @param {string} state - Current application state
 * @param {Object} context - Context object with debug method
 * @returns {string} 'continue' to allow default behavior
 */
export function handleSearchFocused(e, state, context) {
    context.debug('Handling search-focused key', { key: e.key });

    // Most keys should pass through to the search input
    // Escape is handled by global hotkey
    return 'continue';
}

/**
 * Handle keyboard events when custom command palette is open
 * Delegates all handling to the palette's internal keyboard system
 * @param {KeyboardEvent} e - The keyboard event
 * @param {string} state - Current application state
 * @param {Object} context - Context object with debug method
 * @returns {string} 'continue' to let palette handle events
 */
export function handleCustomPaletteOpen(e, state, context) {
    context.debug('Handling custom-palette-open key', { key: e.key });

    // Let the custom command palette handle all keys
    // The palette has its own internal keyboard handling
    return 'continue';
}

/**
 * Handle keyboard events when DHTMLX Gantt lightbox is open
 * Delegates all handling to the Gantt library
 * @param {KeyboardEvent} e - The keyboard event
 * @param {string} state - Current application state
 * @param {Object} context - Context object with debug method
 * @returns {string} 'continue' to let Gantt handle events
 */
export function handleLightboxOpen(e, state, context) {
    context.debug('Handling lightbox-open key', { key: e.key });

    // Let DHTMLX Gantt handle lightbox events
    return 'continue';
}

/**
 * Handle keyboard events when focus is on external elements
 * Does not interfere with external element behavior
 * @param {KeyboardEvent} e - The keyboard event
 * @param {string} state - Current application state
 * @param {Object} context - Context object with debug method
 * @returns {string} 'continue' to allow default behavior
 */
export function handleExternalFocused(e, state, context) {
    context.debug('Handling external-focused key', { key: e.key });

    // Don't interfere with external elements
    return 'continue';
}

/**
 * Handle keyboard events when help screen is open
 * Delegates handling to the help screen component
 * @param {KeyboardEvent} e - The keyboard event
 * @param {string} state - Current application state
 * @param {Object} context - Context object with debug method
 * @returns {string} 'continue' to let help screen handle events
 */
export function handleHelpOpen(e, state, context) {
    context.debug('Handling help-open key', { key: e.key });

    // Let the help screen handle its own keyboard events
    // Escape is handled by global hotkey
    return 'continue';
}

/**
 * Handle horizontal scrolling of the Gantt timeline
 * @param {KeyboardEvent} e - The keyboard event
 * @param {string} direction - 'left' or 'right'
 * @param {Object} context - Context object with debug method
 * @returns {string} 'handled'
 */
function handleHorizontalScroll(e, direction, context) {
    const scrollState = gantt.getScrollState();
    const scrollAmount = calculateScrollAmount();

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

/**
 * Calculate appropriate horizontal scroll amount based on viewport size
 * @returns {number} Scroll amount in pixels
 */
function calculateScrollAmount() {
    // Calculate appropriate scroll amount based on viewport
    const ganttContainer = document.getElementById('gantt_here');
    if (ganttContainer) {
        return Math.max(KEYBOARD.DEFAULT_SCROLL_AMOUNT, ganttContainer.clientWidth / KEYBOARD.SCROLL_VIEWPORT_DIVISOR);
    }
    return KEYBOARD.DEFAULT_SCROLL_AMOUNT;
}

/**
 * Handle Enter key press - toggle expand/collapse or open lightbox for editing
 * @param {KeyboardEvent} e - The keyboard event
 * @param {Object} context - Context object with debug method
 * @returns {string} 'handled' or 'continue'
 */
function handleEnterKey(e, context) {
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
            context.debug('Error in expand/collapse logic', {
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
