/**
 * Gantt Navigation Functions
 *
 * Provides navigation functionality for moving between tasks and milestones
 *
 * @module gantt/gantt-navigation
 */

/**
 * Navigate to the next milestone after the current selection
 */
export function navigateToNextMilestone() {
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
        window.updateStatus('No milestones found in project');
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
        window.updateStatus(`Jumped to milestone: ${nextMilestone.text}`);

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

/**
 * Navigate to the previous milestone before the current selection
 */
export function navigateToPreviousMilestone() {
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
        window.updateStatus('No milestones found in project');
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
        window.updateStatus(`Jumped to milestone: ${prevMilestone.text}`);
    }
}

/**
 * Select the next task in the gantt view
 */
export function selectNextTask() {
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

/**
 * Select the previous task in the gantt view
 */
export function selectPreviousTask() {
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
