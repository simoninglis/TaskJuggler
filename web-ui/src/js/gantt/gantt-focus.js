/**
 * Gantt Focus Mode Functions
 *
 * Provides focus mode functionality that allows users to zoom in on a specific
 * task and its context (ancestors and descendants)
 *
 * @module gantt/gantt-focus
 */

import stateStore from '../stateStore.js';
import { addAllDescendants } from '../gantt-utils.js';

/**
 * Focus on a specific task
 * Shows only the task, its descendants, and its ancestors
 * @param {string|number} taskId - ID of the task to focus on
 */
export function focusOnTask(taskId) {
    if (!taskId) return;

    // Save original data if not already saved
    if (!window.originalGanttData) {
        window.originalGanttData = gantt.serialize();
    }

    const task = gantt.getTask(taskId);
    if (!task) {
        window.updateStatus('Task not found');
        return;
    }

    // Store focus information in state store
    stateStore.setFocusedTask(taskId, task.text);

    // Get all tasks to include in focused view
    const tasksToShow = new Set();

    // Add the focused task
    tasksToShow.add(taskId);

    // Add all descendants
    addAllDescendants(taskId, tasksToShow);

    // Add all ancestors up to root
    let parentId = task.parent;
    while (parentId && parentId !== 0) {
        tasksToShow.add(parentId);
        const parent = gantt.getTask(parentId);
        if (parent) {
            parentId = parent.parent;
        } else {
            break;
        }
    }

    // Create filtered data
    const allTasks = window.originalGanttData.data;
    const filteredData = {
        data: allTasks.filter(task => tasksToShow.has(task.id)),
        links: window.originalGanttData.links
    };

    // Apply focus filter
    gantt.clearAll();
    gantt.parse(filteredData);

    // Expand all tasks in the focused view
    gantt.eachTask(function(task) {
        if (gantt.hasChild(task.id)) {
            gantt.open(task.id);
        }
    });

    // Select the focused task
    gantt.selectTask(taskId);
    gantt.showTask(taskId);

    window.updateStatus(`Focused on: ${task.text}`);
    showFocusIndicator();
}

/**
 * Focus on the currently selected task
 */
export function focusOnCurrentTask() {
    const selectedId = gantt.getSelectedId();
    if (!selectedId) {
        window.updateStatus('No task selected');
        return;
    }

    focusOnTask(selectedId);
}

/**
 * Expand focus to the parent of the currently focused task
 */
export function expandFocus() {
    const focusedTaskId = stateStore.getFocusedTaskId();
    if (!focusedTaskId) {
        window.updateStatus('No focus active');
        return;
    }

    const task = gantt.getTask(focusedTaskId);
    if (task && task.parent && task.parent !== 0) {
        focusOnTask(task.parent);
    } else {
        window.updateStatus('Already at top level');
    }
}

/**
 * Exit focus mode and restore full gantt view
 */
export function exitFocusMode() {
    const focusedTaskId = stateStore.getFocusedTaskId();
    if (!focusedTaskId) {
        window.updateStatus('Not in focus mode');
        return;
    }

    // Clear focus state
    stateStore.setFocusedTask(null, null);

    // Restore original data
    if (window.originalGanttData) {
        gantt.clearAll();
        gantt.parse(window.originalGanttData);
        window.updateStatus('Focus mode exited');
        hideFocusIndicator();
    }
}

/**
 * Show the focus mode indicator in the UI
 * @private
 */
export function showFocusIndicator() {
    // Update the active filter div to show focus mode
    const filterDiv = document.getElementById('activeFilters');
    const filterDesc = document.getElementById('filterDescription');

    if (filterDiv && filterDesc) {
        filterDiv.style.display = 'block';
        filterDiv.style.background = '#e8f5e9'; // Light green for focus mode
        const focusedTaskName = stateStore.getFocusedTaskName();
        filterDesc.innerHTML = `<strong>Focus Mode:</strong> ${focusedTaskName}`;

        // Update the clear button to exit focus
        const clearButton = filterDiv.querySelector('button');
        if (clearButton) {
            clearButton.textContent = 'Exit Focus';
            clearButton.onclick = exitFocusMode;
        }
    }
}

/**
 * Hide the focus mode indicator in the UI
 * @private
 */
export function hideFocusIndicator() {
    const filterDiv = document.getElementById('activeFilters');
    if (filterDiv) {
        filterDiv.style.display = 'none';
        filterDiv.style.background = '#e3f2fd'; // Reset to original color
    }
}
