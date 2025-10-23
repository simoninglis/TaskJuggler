/**
 * Gantt Utility Functions
 *
 * Shared utilities for task tree traversal and manipulation.
 * These functions reduce code duplication across gantt-controls.js,
 * keyboard-manager.js, and other modules.
 *
 * @module gantt-utils
 */

/**
 * Recursively add all child tasks to a set
 * Uses array iteration for when working with serialized task data
 *
 * @param {string|number} parentId - ID of the parent task
 * @param {Array} allTasks - Array of all task objects
 * @param {Set} includeSet - Set to add task IDs to
 */
export function addAllChildren(parentId, allTasks, includeSet) {
    allTasks.forEach(task => {
        if (task.parent === parentId) {
            includeSet.add(task.id);
            addAllChildren(task.id, allTasks, includeSet); // Recursive
        }
    });
}

/**
 * Recursively add all parent tasks up the hierarchy
 * Uses array iteration for when working with serialized task data
 *
 * @param {string|number} taskId - ID of the task
 * @param {Array} allTasks - Array of all task objects
 * @param {Set} includeSet - Set to add task IDs to
 */
export function addParentHierarchy(taskId, allTasks, includeSet) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task || !task.parent || task.parent === 0) return;

    includeSet.add(task.parent);
    addParentHierarchy(task.parent, allTasks, includeSet); // Recursive
}

/**
 * Recursively add all descendant tasks using gantt API
 * Uses gantt.eachTask() for when working with live gantt instance
 *
 * @param {string|number} parentId - ID of the parent task
 * @param {Set} includeSet - Set to add task IDs to
 */
export function addAllDescendants(parentId, includeSet) {
    // This function requires the global gantt object
    if (typeof gantt === 'undefined') {
        console.error('addAllDescendants: gantt is not defined');
        return;
    }

    gantt.eachTask(function(child) {
        includeSet.add(child.id);
        if (gantt.hasChild(child.id)) {
            addAllDescendants(child.id, includeSet);
        }
    }, parentId);
}

/**
 * Recursively add all ancestor tasks up the hierarchy using gantt API
 * Uses gantt.getTask() for when working with live gantt instance
 *
 * @param {string|number} taskId - ID of the task
 * @param {Set} includeSet - Set to add task IDs to
 */
export function addAncestorHierarchy(taskId, includeSet) {
    // This function requires the global gantt object
    if (typeof gantt === 'undefined') {
        console.error('addAncestorHierarchy: gantt is not defined');
        return;
    }

    try {
        const task = gantt.getTask(taskId);
        if (!task || !task.parent || task.parent === 0) return;

        includeSet.add(task.parent);
        addAncestorHierarchy(task.parent, includeSet); // Recursive
    } catch (error) {
        // Task might not exist in current view
        console.warn(`addAncestorHierarchy: Could not find task ${taskId}`, error);
    }
}

/**
 * Create a hierarchical filter that includes matching tasks plus their context
 * This is a higher-order function that combines children and parent inclusion
 *
 * @param {Array} matchingTasks - Tasks that match filter criteria
 * @param {Array} allTasks - All tasks in the dataset
 * @returns {Set} Set of task IDs to include (matches + context)
 */
export function createHierarchicalFilter(matchingTasks, allTasks) {
    const tasksToShow = new Set();

    matchingTasks.forEach(task => {
        // Add the matching task
        tasksToShow.add(task.id);

        // Add all children
        addAllChildren(task.id, allTasks, tasksToShow);

        // Add parent hierarchy
        addParentHierarchy(task.id, allTasks, tasksToShow);
    });

    return tasksToShow;
}

/**
 * Create a hierarchical filter using gantt API
 * Similar to createHierarchicalFilter but uses live gantt instance
 *
 * @param {Array} matchingTaskIds - IDs of tasks that match filter criteria
 * @returns {Set} Set of task IDs to include (matches + context)
 */
export function createHierarchicalFilterFromIds(matchingTaskIds) {
    const tasksToShow = new Set();

    matchingTaskIds.forEach(taskId => {
        // Add the matching task
        tasksToShow.add(taskId);

        // Add all descendants
        addAllDescendants(taskId, tasksToShow);

        // Add ancestor hierarchy
        addAncestorHierarchy(taskId, tasksToShow);
    });

    return tasksToShow;
}

/**
 * Default export provides all utilities as a single object
 */
export default {
    addAllChildren,
    addParentHierarchy,
    addAllDescendants,
    addAncestorHierarchy,
    createHierarchicalFilter,
    createHierarchicalFilterFromIds
};
