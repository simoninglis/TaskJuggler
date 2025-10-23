/**
 * Gantt Filter Functions
 *
 * Provides task filtering functionality including date-based, status-based,
 * and search-based filters
 *
 * @module gantt/gantt-filters
 */

import stateStore from '../stateStore.js';
import { SEARCH } from '../config.js';
import { addAllChildren, addParentHierarchy, addAllDescendants } from '../gantt-utils.js';

// Local variables
let searchTimeout = null;

/**
 * Handle search input keyup events
 * Triggers immediate search on Enter, debounced search otherwise
 * @param {KeyboardEvent} event - The keyup event
 */
export function handleSearchKeyUp(event) {
    if (event.key === 'Enter') {
        // On Enter, immediately search and focus first match
        clearTimeout(searchTimeout);
        const searchTerm = document.getElementById('searchInput').value.trim();
        filterTasks(searchTerm, true); // true = focus first match
    } else {
        // Otherwise, use debounced search
        debounceSearch();
    }
}

/**
 * Debounced search function to prevent excessive filtering
 */
export function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const searchTerm = document.getElementById('searchInput').value.trim();
        filterTasks(searchTerm, false); // false = don't focus
    }, SEARCH.DEBOUNCE_DELAY);
}

/**
 * Filter tasks by search term
 * Shows matching tasks along with their hierarchical context (parents and children)
 * @param {string} searchTerm - The text to search for
 * @param {boolean} focusFirstMatch - Whether to focus and select the first matching task
 */
export function filterTasks(searchTerm, focusFirstMatch = false) {
    const originalData = stateStore.get('originalData');
    if (!originalData) return;

    if (!searchTerm) {
        clearSearch();
        return;
    }

    window.updateStatus(`Searching for: "${searchTerm}"`);

    // Find all tasks that match the search term
    const matchingTaskIds = new Set();
    const allTasks = originalData.data;
    let firstMatchId = null;

    // First pass: find direct matches
    allTasks.forEach(task => {
        if (task.text.toLowerCase().includes(searchTerm.toLowerCase())) {
            matchingTaskIds.add(task.id);
            if (!firstMatchId) {
                firstMatchId = task.id;
            }
        }
    });

    // Second pass: build inclusion set with hierarchical context
    const tasksToShow = new Set();

    matchingTaskIds.forEach(taskId => {
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return;

        // Include the matching task
        tasksToShow.add(taskId);

        // Include all children if this task matches
        addAllChildren(taskId, allTasks, tasksToShow);

        // Include parent hierarchy
        addParentHierarchy(taskId, allTasks, tasksToShow);
    });

    // Filter data and update gantt
    const filteredData = {
        data: allTasks.filter(task => tasksToShow.has(task.id)),
        links: originalData.links.filter(link =>
            tasksToShow.has(link.source) && tasksToShow.has(link.target)
        )
    };

    gantt.clearAll();
    gantt.parse(filteredData);

    // Auto-expand all parent tasks to show matches
    filteredData.data.forEach(task => {
        if (task.type === gantt.config.types.project ||
            task.type === undefined) { // container tasks
            gantt.open(task.id);
        }
    });

    // Force re-render to update highlighting
    gantt.render();

    // Focus first match if requested
    if (focusFirstMatch && firstMatchId) {
        setTimeout(() => {
            gantt.selectTask(firstMatchId);
            gantt.showTask(firstMatchId);
            document.getElementById('gantt_here').focus();
        }, SEARCH.FOCUS_DELAY);
    }

    stateStore.set('isFiltered', true);
    window.updateStatus(`Found ${matchingTaskIds.size} matching tasks, showing ${filteredData.data.length} total tasks with context`);
}

/**
 * Clear the current search filter and restore all tasks
 */
export function clearSearch() {
    const originalData = stateStore.get('originalData');
    if (!originalData) return;

    document.getElementById('searchInput').value = '';

    // Just reload the original data
    gantt.clearAll();
    gantt.parse(originalData);

    stateStore.set('isFiltered', false);
    window.updateStatus("Search cleared, showing all tasks");
}

/**
 * Filter to show only overdue tasks
 * Overdue = tasks with end date before today and progress < 100%
 */
export function filterOverdueTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allTasks = gantt.getTaskByTime();
    const overdueTasks = allTasks.filter(task => {
        const endDate = new Date(task.end_date);
        return endDate < today && task.progress < 1;
    });

    applyTaskFilter(overdueTasks, 'Showing overdue tasks');
}

/**
 * Filter to show only tasks active today
 * Today = tasks whose date range includes today
 */
export function filterTodayTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const allTasks = gantt.getTaskByTime();
    const todayTasks = allTasks.filter(task => {
        const start = new Date(task.start_date);
        const end = new Date(task.end_date);
        return start <= tomorrow && end >= today;
    });

    applyTaskFilter(todayTasks, 'Showing tasks active today');
}

/**
 * Filter to show only tasks due within the next 7 days
 */
export function filterWeekTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const allTasks = gantt.getTaskByTime();
    const weekTasks = allTasks.filter(task => {
        const start = new Date(task.start_date);
        const end = new Date(task.end_date);
        return (start <= weekEnd && end >= today) || (start >= today && start <= weekEnd);
    });

    applyTaskFilter(weekTasks, 'Showing tasks for this week');
}

/**
 * Filter to show only completed tasks (100% progress)
 */
export function filterCompletedTasks() {
    const allTasks = gantt.getTaskByTime();
    const completedTasks = allTasks.filter(task => task.progress >= 1);

    applyTaskFilter(completedTasks, 'Showing completed tasks');
}

/**
 * Filter to show only in-progress tasks (progress between 1% and 99%)
 */
export function filterInProgressTasks() {
    const allTasks = gantt.getTaskByTime();
    const inProgressTasks = allTasks.filter(task => task.progress > 0 && task.progress < 1);

    applyTaskFilter(inProgressTasks, 'Showing in-progress tasks');
}

/**
 * Apply a task filter
 * Shows filtered tasks along with their hierarchical context (parents and children)
 * @param {Array} filteredTasks - Array of tasks that match the filter criteria
 * @param {string} message - Status message to display
 */
export function applyTaskFilter(filteredTasks, message) {
    // Save original data if not already saved
    if (!window.originalGanttData) {
        window.originalGanttData = gantt.serialize();
    }

    // Get all task IDs that should be shown (including parents)
    const tasksToShow = new Set();

    filteredTasks.forEach(task => {
        // Add the task itself
        tasksToShow.add(task.id);

        // Add all parent tasks
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

        // Add all children of filtered tasks
        addAllDescendants(task.id, tasksToShow);
    });

    // Create filtered data
    const allTasks = window.originalGanttData.data;
    const filteredData = {
        data: allTasks.filter(task => tasksToShow.has(task.id)),
        links: window.originalGanttData.links
    };

    // Apply filter
    gantt.clearAll();
    gantt.parse(filteredData);

    // Expand filtered parent tasks
    filteredData.data.forEach(task => {
        if (task.type === gantt.config.types.project || gantt.hasChild(task.id)) {
            gantt.open(task.id);
        }
    });

    window.updateStatus(message + ` (${filteredTasks.length} tasks)`);

    // Show active filter indicator
    const filterDiv = document.getElementById('activeFilters');
    const filterDesc = document.getElementById('filterDescription');
    if (filterDiv && filterDesc) {
        filterDiv.style.display = 'block';
        filterDesc.textContent = message;
    }
}

/**
 * Clear all active filters and restore original gantt data
 */
export function clearAllFilters() {
    if (window.originalGanttData) {
        gantt.clearAll();
        gantt.parse(window.originalGanttData);
        window.updateStatus('All filters cleared');

        // Hide active filter indicator
        const filterDiv = document.getElementById('activeFilters');
        if (filterDiv) {
            filterDiv.style.display = 'none';
        }
    } else {
        window.updateStatus('No filters to clear');
    }
}
