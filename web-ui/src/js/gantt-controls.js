/**
 * Gantt Controls - Main Entry Point
 *
 * This module imports and re-exports all gantt control functions from specialized modules.
 * Acts as the central export point for all gantt UI controls.
 *
 * @module gantt-controls
 */

// Import state store
import stateStore from './stateStore.js';

// Import all specialized modules
import {
    zoomIn,
    zoomOut,
    setZoom,
    calculateScrollAmount,
    initializeMouseWheelZoom
} from './gantt/gantt-zoom.js';

import {
    handleSearchKeyUp,
    debounceSearch,
    filterTasks,
    clearSearch,
    filterOverdueTasks,
    filterTodayTasks,
    filterWeekTasks,
    filterCompletedTasks,
    filterInProgressTasks,
    applyTaskFilter,
    clearAllFilters
} from './gantt/gantt-filters.js';

import {
    focusOnTask,
    focusOnCurrentTask,
    expandFocus,
    exitFocusMode
} from './gantt/gantt-focus.js';

import {
    navigateToNextMilestone,
    navigateToPreviousMilestone,
    selectNextTask,
    selectPreviousTask
} from './gantt/gantt-navigation.js';

// Initialize state subscriptions
initializeStateSubscriptions();

// Helper function to save original gantt data
function saveOriginalGanttData() {
    if (!window.originalGanttData) {
        window.originalGanttData = gantt.serialize();
        // Also save to state store for consistency
        stateStore.set('originalData', window.originalGanttData);
    }
}

// Helper function to get original gantt data
function getOriginalGanttData() {
    return window.originalGanttData || stateStore.get('originalData');
}

// Function to set up state change listeners
function initializeStateSubscriptions() {
    // Subscribe to zoom changes
    stateStore.subscribe('currentZoom', (newZoom, oldZoom) => {
        if (window.debugLog) {
            window.debugLog('state', 'Zoom changed', { from: oldZoom, to: newZoom });
        }
        // Expose for testing
        window.currentZoom = newZoom;
    });

    // Subscribe to read-only mode changes
    stateStore.subscribe('isReadOnly', (isReadOnly) => {
        // Update gantt configuration
        if (typeof gantt !== 'undefined') {
            gantt.config.readonly = isReadOnly;
            gantt.config.drag_move = !isReadOnly;
            gantt.config.drag_resize = !isReadOnly;
            gantt.config.drag_progress = !isReadOnly;
        }
    });

    // Subscribe to focus mode changes
    stateStore.subscribe('focusedTaskId', (taskId) => {
        if (window.debugLog) {
            window.debugLog('state', 'Focus task changed', { taskId });
        }
    });

    // Initialize window.currentZoom for backward compatibility
    window.currentZoom = stateStore.getZoom();
}

// Toggle read-only mode
function toggleReadOnly() {
    const currentReadOnly = stateStore.isReadOnly();
    const newReadOnly = !currentReadOnly;
    stateStore.setReadOnly(newReadOnly);

    gantt.render();

    // Update visual indicators
    const modeText = document.getElementById('modeText');
    const checkbox = document.getElementById('editModeToggle');

    if (newReadOnly) {
        modeText.textContent = 'View Only';
        modeText.classList.remove('edit-mode');
        checkbox.checked = false;
    } else {
        modeText.textContent = 'Edit Mode';
        modeText.classList.add('edit-mode');
        checkbox.checked = true;
    }

    window.updateStatus(newReadOnly ? "Switched to read-only mode" : "Switched to edit mode");
}

// Toggle grid visibility
function toggleGrid() {
    gantt.config.show_grid = !gantt.config.show_grid;
    gantt.render();
    window.updateStatus(gantt.config.show_grid ? "Grid shown" : "Grid hidden");
}

// Export gantt data to console
function exportData() {
    const data = gantt.serialize();
    console.log("Current gantt data:", data);
    window.updateStatus("Data exported to console. Check browser developer tools.");
}

// Make updateStatus available globally
window.updateStatus = function updateStatus(message) {
    document.getElementById('status').textContent = new Date().toLocaleTimeString() + ": " + message;
}

// Expand all parent tasks
function expandAll() {
    try {
        const allTasks = gantt.getTaskByTime();
        let expandedCount = 0;

        allTasks.forEach(task => {
            if (gantt.hasChild(task.id)) {
                gantt.open(task.id);
                expandedCount++;
            }
        });

        window.updateStatus(`Expanded ${expandedCount} parent tasks`);

        // Force gantt to re-render to show changes
        gantt.render();

        if (window.debugLog) {
            window.debugLog('debug', 'Expand all completed', {
                totalTasks: allTasks.length,
                expandedTasks: expandedCount
            });
        }
    } catch (error) {
        console.error('Error in expandAll:', error);
        window.updateStatus('Error expanding tasks: ' + error.message);
        if (window.debugLog) {
            window.debugLog('error', 'Expand all failed', {
                error: error.message,
                stack: error.stack
            });
        }
    }
}

// Collapse all parent tasks
function collapseAll() {
    try {
        const allTasks = gantt.getTaskByTime();
        let collapsedCount = 0;

        allTasks.forEach(task => {
            if (gantt.hasChild(task.id)) {
                gantt.close(task.id);
                collapsedCount++;
            }
        });

        window.updateStatus(`Collapsed ${collapsedCount} parent tasks`);

        // Force gantt to re-render to show changes
        gantt.render();

        if (window.debugLog) {
            window.debugLog('debug', 'Collapse all completed', {
                totalTasks: allTasks.length,
                collapsedTasks: collapsedCount
            });
        }
    } catch (error) {
        console.error('Error in collapseAll:', error);
        window.updateStatus('Error collapsing tasks: ' + error.message);
        if (window.debugLog) {
            window.debugLog('error', 'Collapse all failed', {
                error: error.message,
                stack: error.stack
            });
        }
    }
}

// Make milestone navigation functions globally available
window.navigateToNextMilestone = navigateToNextMilestone;
window.navigateToPreviousMilestone = navigateToPreviousMilestone;

// Make task navigation functions globally available
window.selectNextTask = selectNextTask;
window.selectPreviousTask = selectPreviousTask;

// Make zoom functions globally available
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.setZoom = setZoom;

// Make filter functions globally available
window.filterOverdueTasks = filterOverdueTasks;
window.filterTodayTasks = filterTodayTasks;
window.filterWeekTasks = filterWeekTasks;
window.filterCompletedTasks = filterCompletedTasks;
window.filterInProgressTasks = filterInProgressTasks;
window.clearAllFilters = clearAllFilters;

// Make focus functions globally available
window.focusOnTask = focusOnTask;
window.focusOnCurrentTask = focusOnCurrentTask;
window.expandFocus = expandFocus;
window.exitFocusMode = exitFocusMode;

// Make other control functions globally available
window.expandAll = expandAll;
window.collapseAll = collapseAll;
window.toggleReadOnly = toggleReadOnly;
window.toggleGrid = toggleGrid;

// Make mouse wheel zoom initialization globally available
window.initializeMouseWheelZoom = initializeMouseWheelZoom;

// Export for ES6 module usage (if needed)
export {
    // Zoom functions
    zoomIn,
    zoomOut,
    setZoom,
    calculateScrollAmount,
    initializeMouseWheelZoom,

    // Filter functions
    handleSearchKeyUp,
    debounceSearch,
    filterTasks,
    clearSearch,
    filterOverdueTasks,
    filterTodayTasks,
    filterWeekTasks,
    filterCompletedTasks,
    filterInProgressTasks,
    clearAllFilters,

    // Focus functions
    focusOnTask,
    focusOnCurrentTask,
    expandFocus,
    exitFocusMode,

    // Navigation functions
    navigateToNextMilestone,
    navigateToPreviousMilestone,
    selectNextTask,
    selectPreviousTask,

    // Utility functions
    toggleReadOnly,
    toggleGrid,
    exportData,
    expandAll,
    collapseAll,
    saveOriginalGanttData,
    getOriginalGanttData
};
