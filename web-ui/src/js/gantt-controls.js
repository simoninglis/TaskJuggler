// UI Control Functions
// This file contains all the UI control functions for zoom, search, filters, and view modes

// Import state store
import stateStore from './stateStore.js';

// Local variables (not part of global state)
let searchTimeout = null;

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

// Search and filter functions
function handleSearchKeyUp(event) {
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

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const searchTerm = document.getElementById('searchInput').value.trim();
        filterTasks(searchTerm, false); // false = don't focus
    }, 300); // 300ms delay for debouncing
}

function filterTasks(searchTerm, focusFirstMatch = false) {
    const originalData = stateStore.get('originalData');
    if (!originalData) return;
    
    if (!searchTerm) {
        clearSearch();
        return;
    }
    
    updateStatus(`Searching for: "${searchTerm}"`);
    
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
        }, 100);
    }
    
    stateStore.set('isFiltered', true);
    updateStatus(`Found ${matchingTaskIds.size} matching tasks, showing ${filteredData.data.length} total tasks with context`);
}

function addAllChildren(parentId, allTasks, includeSet) {
    allTasks.forEach(task => {
        if (task.parent === parentId) {
            includeSet.add(task.id);
            addAllChildren(task.id, allTasks, includeSet); // Recursive
        }
    });
}

function addParentHierarchy(taskId, allTasks, includeSet) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task || !task.parent || task.parent === 0) return;
    
    includeSet.add(task.parent);
    addParentHierarchy(task.parent, allTasks, includeSet); // Recursive
}

function clearSearch() {
    const originalData = stateStore.get('originalData');
    if (!originalData) return;
    
    document.getElementById('searchInput').value = '';
    
    // Just reload the original data
    gantt.clearAll();
    gantt.parse(originalData);
    
    stateStore.set('isFiltered', false);
    updateStatus("Search cleared, showing all tasks");
}

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
    
    updateStatus(newReadOnly ? "Switched to read-only mode" : "Switched to edit mode");
}

function zoomIn() {
    const zooms = ["hour", "day", "week", "month", "quarter", "year"];
    const currentZoom = stateStore.getZoom();
    const currentIndex = zooms.indexOf(currentZoom);
    if (currentIndex > 0) {
        const newZoom = zooms[currentIndex - 1];
        setZoom(newZoom);
    }
}

function zoomOut() {
    const zooms = ["hour", "day", "week", "month", "quarter", "year"];
    const currentZoom = stateStore.getZoom();
    const currentIndex = zooms.indexOf(currentZoom);
    if (currentIndex < zooms.length - 1) {
        const newZoom = zooms[currentIndex + 1];
        setZoom(newZoom);
    }
}

function setZoom(zoom) {
    // Update zoom level in state store
    stateStore.setZoom(zoom);
    
    // Configure scales based on zoom level (using new scales configuration)
    switch(zoom) {
        case "hour":
            gantt.config.scales = [
                {unit: "day", step: 1, format: "%d %M"},
                {unit: "hour", step: 1, format: "%H:%i"}
            ];
            gantt.config.min_column_width = 30;
            break;
        case "day":
            gantt.config.scales = [
                {unit: "month", step: 1, format: "%F %Y"},
                {unit: "day", step: 1, format: "%d %M"}
            ];
            gantt.config.min_column_width = 60;
            break;
        case "week":
            gantt.config.scales = [
                {unit: "week", step: 1, format: "Week #%W"},
                {unit: "day", step: 1, format: "%d"}
            ];
            gantt.config.min_column_width = 60;
            break;
        case "month":
            gantt.config.scales = [
                {unit: "month", step: 1, format: "%F %Y"},
                {unit: "week", step: 1, format: "#%W"}
            ];
            gantt.config.min_column_width = 120;
            break;
        case "quarter":
            gantt.config.scales = [
                {unit: "quarter", step: 1, format: function(date) {
                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                    return "Q" + quarter + " " + date.getFullYear();
                }},
                {unit: "month", step: 1, format: "%M"}
            ];
            gantt.config.min_column_width = 90;
            break;
        case "year":
            gantt.config.scales = [
                {unit: "year", step: 1, format: "%Y"},
                {unit: "quarter", step: 1, format: function(date) {
                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                    return "Q" + quarter;
                }}
            ];
            gantt.config.min_column_width = 50;
            break;
    }
    gantt.render();
    updateStatus(`Zoom level: ${zoom}`);
}

function calculateScrollAmount() {
    // Calculate scroll amount based on the minor unit size of current zoom level
    // This makes scrolling consistent - one keypress = one minor grid unit
    
    // Get the current date range visible in the gantt
    const state = gantt.getState();
    const minDate = state.min_date;
    const maxDate = state.max_date;
    
    // Calculate dates for one minor unit movement
    let nextDate;
    const currentZoom = stateStore.getZoom();
    switch(currentZoom) {
        case "hour":
            // Minor unit is hour - scroll by 1 hour
            nextDate = gantt.date.add(minDate, 1, "hour");
            break;
        case "day":
            // Minor unit is day - scroll by 1 day
            nextDate = gantt.date.add(minDate, 1, "day");
            break;
        case "week":
            // Minor unit is day (subscale) - scroll by 1 day
            nextDate = gantt.date.add(minDate, 1, "day");
            break;
        case "month":
            // Minor unit is week (subscale) - scroll by 1 week
            nextDate = gantt.date.add(minDate, 1, "week");
            break;
        case "quarter":
            // Minor unit is month (subscale) - scroll by 1 month
            nextDate = gantt.date.add(minDate, 1, "month");
            break;
        case "year":
            // Minor unit is quarter (subscale) - scroll by 3 months
            nextDate = gantt.date.add(minDate, 3, "month");
            break;
        default:
            // Default to 1 day
            nextDate = gantt.date.add(minDate, 1, "day");
    }
    
    // Convert the date difference to pixels
    const startPos = gantt.posFromDate(minDate);
    const nextPos = gantt.posFromDate(nextDate);
    const scrollAmount = Math.abs(nextPos - startPos);
    
    // Ensure minimum scroll amount
    return Math.max(scrollAmount, 10);
}

function toggleGrid() {
    gantt.config.show_grid = !gantt.config.show_grid;
    gantt.render();
    updateStatus(gantt.config.show_grid ? "Grid shown" : "Grid hidden");
}

function exportData() {
    const data = gantt.serialize();
    console.log("Current gantt data:", data);
    updateStatus("Data exported to console. Check browser developer tools.");
}

// Make updateStatus available globally
window.updateStatus = function updateStatus(message) {
    document.getElementById('status').textContent = new Date().toLocaleTimeString() + ": " + message;
}

// Expand/Collapse all functions
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
        
        updateStatus(`Expanded ${expandedCount} parent tasks`);
        
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
        updateStatus('Error expanding tasks: ' + error.message);
        if (window.debugLog) {
            window.debugLog('error', 'Expand all failed', {
                error: error.message,
                stack: error.stack
            });
        }
    }
}

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
        
        updateStatus(`Collapsed ${collapsedCount} parent tasks`);
        
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
        updateStatus('Error collapsing tasks: ' + error.message);
        if (window.debugLog) {
            window.debugLog('error', 'Collapse all failed', {
                error: error.message,
                stack: error.stack
            });
        }
    }
}

// Command Palette Filter Functions
function filterOverdueTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allTasks = gantt.getTaskByTime();
    const overdueTasks = allTasks.filter(task => {
        const endDate = new Date(task.end_date);
        return endDate < today && task.progress < 1;
    });
    
    applyTaskFilter(overdueTasks, 'Showing overdue tasks');
}

function filterTodayTasks() {
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

function filterWeekTasks() {
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

function filterCompletedTasks() {
    const allTasks = gantt.getTaskByTime();
    const completedTasks = allTasks.filter(task => task.progress >= 1);
    
    applyTaskFilter(completedTasks, 'Showing completed tasks');
}

function filterInProgressTasks() {
    const allTasks = gantt.getTaskByTime();
    const inProgressTasks = allTasks.filter(task => task.progress > 0 && task.progress < 1);
    
    applyTaskFilter(inProgressTasks, 'Showing in-progress tasks');
}

function applyTaskFilter(filteredTasks, message) {
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
        addAllChildrenForFilter(task.id, tasksToShow);
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
    
    updateStatus(message + ` (${filteredTasks.length} tasks)`);
    
    // Show active filter indicator
    const filterDiv = document.getElementById('activeFilters');
    const filterDesc = document.getElementById('filterDescription');
    if (filterDiv && filterDesc) {
        filterDiv.style.display = 'block';
        filterDesc.textContent = message;
    }
}

function addAllChildrenForFilter(parentId, includeSet) {
    gantt.eachTask(function(child) {
        includeSet.add(child.id);
        if (gantt.hasChild(child.id)) {
            addAllChildrenForFilter(child.id, includeSet);
        }
    }, parentId);
}

function clearAllFilters() {
    if (window.originalGanttData) {
        gantt.clearAll();
        gantt.parse(window.originalGanttData);
        updateStatus('All filters cleared');
        
        // Hide active filter indicator
        const filterDiv = document.getElementById('activeFilters');
        if (filterDiv) {
            filterDiv.style.display = 'none';
        }
    } else {
        updateStatus('No filters to clear');
    }
}

// Focus Mode Functions
function focusOnTask(taskId) {
    if (!taskId) return;
    
    // Save original data if not already saved
    if (!window.originalGanttData) {
        window.originalGanttData = gantt.serialize();
    }
    
    const task = gantt.getTask(taskId);
    if (!task) {
        updateStatus('Task not found');
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
    
    updateStatus(`Focused on: ${task.text}`);
    showFocusIndicator();
}

function focusOnCurrentTask() {
    const selectedId = gantt.getSelectedId();
    if (!selectedId) {
        updateStatus('No task selected');
        return;
    }
    
    focusOnTask(selectedId);
}

function expandFocus() {
    const focusedTaskId = stateStore.getFocusedTaskId();
    if (!focusedTaskId) {
        updateStatus('No focus active');
        return;
    }
    
    const task = gantt.getTask(focusedTaskId);
    if (task && task.parent && task.parent !== 0) {
        focusOnTask(task.parent);
    } else {
        updateStatus('Already at top level');
    }
}

function exitFocusMode() {
    const focusedTaskId = stateStore.getFocusedTaskId();
    if (!focusedTaskId) {
        updateStatus('Not in focus mode');
        return;
    }
    
    // Clear focus state
    stateStore.setFocusedTask(null, null);
    
    // Restore original data
    if (window.originalGanttData) {
        gantt.clearAll();
        gantt.parse(window.originalGanttData);
        updateStatus('Focus mode exited');
        hideFocusIndicator();
    }
}

function addAllDescendants(parentId, includeSet) {
    gantt.eachTask(function(child) {
        includeSet.add(child.id);
        if (gantt.hasChild(child.id)) {
            addAllDescendants(child.id, includeSet);
        }
    }, parentId);
}

function showFocusIndicator() {
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

function hideFocusIndicator() {
    const filterDiv = document.getElementById('activeFilters');
    if (filterDiv) {
        filterDiv.style.display = 'none';
        filterDiv.style.background = '#e3f2fd'; // Reset to original color
    }
}

// Milestone Navigation Functions
function navigateToNextMilestone() {
    const allTasks = gantt.getTaskByTime();
    const milestones = allTasks.filter(task => task.type === gantt.config.types.milestone);
    
    // Debug logging
    if (window.debugLog) {
        window.debugLog('milestone', 'Navigating to next milestone', {
            totalTasks: allTasks.length,
            milestonesFound: milestones.length,
            milestoneDetails: milestones.map(m => ({
                id: m.id,
                text: m.text,
                date: m.start_date
            }))
        });
    }
    
    if (milestones.length === 0) {
        updateStatus('No milestones found in project');
        if (window.debugLog) {
            window.debugLog('milestone', 'No milestones found - checking task types', {
                taskTypes: allTasks.map(t => ({ id: t.id, type: t.type })).slice(0, 10)
            });
        }
        return;
    }
    
    const currentId = gantt.getSelectedId();
    let nextMilestone = null;
    
    if (!currentId) {
        // No selection, go to first milestone
        nextMilestone = milestones[0];
    } else {
        // Find current task position
        const currentTask = gantt.getTask(currentId);
        const currentDate = new Date(currentTask.start_date);
        
        // Find next milestone after current position
        const futureMilestones = milestones.filter(m => new Date(m.start_date) > currentDate);
        
        if (futureMilestones.length > 0) {
            // Sort by date and get the earliest
            futureMilestones.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
            nextMilestone = futureMilestones[0];
        } else {
            // Wrap around to first milestone
            milestones.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
            nextMilestone = milestones[0];
        }
    }
    
    if (nextMilestone) {
        gantt.selectTask(nextMilestone.id);
        gantt.showTask(nextMilestone.id);
        updateStatus(`Jumped to milestone: ${nextMilestone.text}`);
        
        if (window.debugLog) {
            window.debugLog('milestone', 'Successfully navigated to milestone', {
                milestone: {
                    id: nextMilestone.id,
                    text: nextMilestone.text,
                    date: nextMilestone.start_date
                }
            });
        }
    }
}

function navigateToPreviousMilestone() {
    const allTasks = gantt.getTaskByTime();
    const milestones = allTasks.filter(task => task.type === gantt.config.types.milestone);
    
    // Debug logging
    if (window.debugLog) {
        window.debugLog('milestone', 'Navigating to previous milestone', {
            totalTasks: allTasks.length,
            milestonesFound: milestones.length,
            milestoneDetails: milestones.map(m => ({
                id: m.id,
                text: m.text,
                date: m.start_date
            }))
        });
    }
    
    if (milestones.length === 0) {
        updateStatus('No milestones found in project');
        return;
    }
    
    const currentId = gantt.getSelectedId();
    let prevMilestone = null;
    
    if (!currentId) {
        // No selection, go to last milestone
        prevMilestone = milestones[milestones.length - 1];
    } else {
        // Find current task position
        const currentTask = gantt.getTask(currentId);
        const currentDate = new Date(currentTask.start_date);
        
        // Find previous milestone before current position
        const pastMilestones = milestones.filter(m => new Date(m.start_date) < currentDate);
        
        if (pastMilestones.length > 0) {
            // Sort by date and get the latest
            pastMilestones.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
            prevMilestone = pastMilestones[0];
        } else {
            // Wrap around to last milestone
            milestones.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
            prevMilestone = milestones[0];
        }
    }
    
    if (prevMilestone) {
        gantt.selectTask(prevMilestone.id);
        gantt.showTask(prevMilestone.id);
        updateStatus(`Jumped to milestone: ${prevMilestone.text}`);
    }
}

// Task navigation functions
function selectNextTask() {
    const currentId = gantt.getSelectedId();
    const tasks = gantt.getTaskByTime();
    
    console.log('[selectNextTask] Called with currentId:', currentId, 'tasks:', tasks.length);
    
    if (tasks.length === 0) return;
    
    // All tasks are navigable in order
    const navigableTasks = tasks;
    
    if (!currentId) {
        // No selection, select first navigable task
        if (navigableTasks.length > 0) {
            gantt.selectTask(navigableTasks[0].id);
            gantt.showTask(navigableTasks[0].id);
        }
        return;
    }
    
    // Find current task index in navigable tasks
    const currentIndex = navigableTasks.findIndex(task => task.id === currentId);
    
    if (currentIndex < navigableTasks.length - 1) {
        // Select next task
        const nextTask = navigableTasks[currentIndex + 1];
        gantt.selectTask(nextTask.id);
        gantt.showTask(nextTask.id);
    } else if (currentIndex === -1 && navigableTasks.length > 0) {
        // Current task not in navigable list, select first navigable
        gantt.selectTask(navigableTasks[0].id);
        gantt.showTask(navigableTasks[0].id);
    }
}

function selectPreviousTask() {
    const currentId = gantt.getSelectedId();
    const tasks = gantt.getTaskByTime();
    
    if (tasks.length === 0) return;
    
    // All tasks are navigable in order
    const navigableTasks = tasks;
    
    if (!currentId) {
        // No selection, select last navigable task
        if (navigableTasks.length > 0) {
            gantt.selectTask(navigableTasks[navigableTasks.length - 1].id);
            gantt.showTask(navigableTasks[navigableTasks.length - 1].id);
        }
        return;
    }
    
    // Find current task index in navigable tasks
    const currentIndex = navigableTasks.findIndex(task => task.id === currentId);
    
    if (currentIndex > 0) {
        // Select previous task
        const prevTask = navigableTasks[currentIndex - 1];
        gantt.selectTask(prevTask.id);
        gantt.showTask(prevTask.id);
    } else if (currentIndex === -1 && navigableTasks.length > 0) {
        // Current task not in navigable list, select last navigable
        gantt.selectTask(navigableTasks[navigableTasks.length - 1].id);
        gantt.showTask(navigableTasks[navigableTasks.length - 1].id);
    }
}

// Make task navigation functions globally available
window.selectNextTask = selectNextTask;
window.selectPreviousTask = selectPreviousTask;

// Make milestone navigation functions globally available
window.navigateToNextMilestone = navigateToNextMilestone;
window.navigateToPreviousMilestone = navigateToPreviousMilestone;

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

// Mouse Wheel Zoom
// Make available globally
window.initializeMouseWheelZoom = function initializeMouseWheelZoom() {
    const ganttElement = document.getElementById('gantt_here');
    if (!ganttElement) return;
    
    ganttElement.addEventListener('wheel', function(event) {
        // Check if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
        const isModifierPressed = event.ctrlKey || event.metaKey;
        
        // Only zoom if modifier key is pressed and it's vertical scrolling
        if (isModifierPressed && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
            // Prevent default scrolling/zooming behavior
            event.preventDefault();
            event.stopPropagation();
            
            // Determine zoom direction
            if (event.deltaY < 0) {
                // Scroll up = zoom in
                zoomIn();
                updateStatus('Zoomed in');
            } else {
                // Scroll down = zoom out
                zoomOut();
                updateStatus('Zoomed out');
            }
            
            // Log for debugging
            if (window.debugLog) {
                window.debugLog('zoom', 'Mouse wheel zoom', {
                    deltaY: event.deltaY,
                    currentZoom: stateStore.getZoom()
                });
            }
        }
        // Without modifier, let browser handle scrolling naturally
    }, { passive: false });
    
    // Log initialization
    if (window.debugLog) {
        window.debugLog('info', 'Mouse wheel zoom initialized (Ctrl/Cmd+Scroll)');
    }
}
