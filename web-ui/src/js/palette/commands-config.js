/**
 * Command Palette - Command Definitions
 *
 * Defines all available commands for the command palette including filters,
 * focus commands, view commands, and go navigation options
 *
 * @module palette/commands-config
 */

/**
 * Get all available command palette commands
 * @returns {Array} Array of command objects with id, title, description, section, keywords, icon, handler
 */
export function getCommandDefinitions() {
    return [
        // Filter commands
        {
            id: 'filter-overdue',
            title: 'Show overdue tasks',
            description: 'Filter to tasks with end dates before today',
            section: 'Filters',
            keywords: 'overdue late past due',
            icon: '⏰',
            handler: () => filterOverdueTasks()
        },
        {
            id: 'filter-today',
            title: 'Show tasks due today',
            description: 'Filter to tasks ending today',
            section: 'Filters',
            keywords: 'today current now',
            icon: '📅',
            handler: () => filterTodayTasks()
        },
        {
            id: 'filter-week',
            title: 'Show tasks due this week',
            description: 'Filter to tasks ending within 7 days',
            section: 'Filters',
            keywords: 'week 7 days',
            icon: '📆',
            handler: () => filterWeekTasks()
        },
        {
            id: 'filter-completed',
            title: 'Show completed tasks',
            description: 'Filter to tasks with 100% progress',
            section: 'Filters',
            keywords: 'done finished complete 100%',
            icon: '✅',
            handler: () => filterCompletedTasks()
        },
        {
            id: 'filter-in-progress',
            title: 'Show in-progress tasks',
            description: 'Filter to tasks with progress between 1-99%',
            section: 'Filters',
            keywords: 'progress active working',
            icon: '🔄',
            handler: () => filterInProgressTasks()
        },
        {
            id: 'clear-filters',
            title: 'Clear all filters',
            description: 'Remove all active filters',
            section: 'Filters',
            keywords: 'clear reset remove filters all',
            icon: '🧹',
            handler: () => clearAllFilters()
        },

        // Focus commands
        {
            id: 'focus-area',
            title: 'Focus on area',
            description: 'Filter to show only a specific task and its subtasks',
            section: 'Focus',
            keywords: 'focus area branch isolate concentrate',
            icon: '🎯',
            handler: () => {
                if (window.customCommandPalette) {
                    window.customCommandPalette.close();
                    setTimeout(() => {
                        window.customCommandPalette.openFocusSearch();
                    }, 100);
                }
            }
        },
        {
            id: 'focus-selection',
            title: 'Focus on selection',
            description: 'Focus on the currently selected task and its subtasks',
            section: 'Focus',
            keywords: 'focus current selection selected',
            icon: '🔍',
            handler: () => focusOnCurrentTask()
        },
        {
            id: 'expand-focus',
            title: 'Expand focus',
            description: 'Include parent level in current focus',
            section: 'Focus',
            keywords: 'expand focus parent widen broaden',
            icon: '🔼',
            handler: () => expandFocus()
        },
        {
            id: 'exit-focus',
            title: 'Exit focus mode',
            description: 'Return to full project view',
            section: 'Focus',
            keywords: 'exit focus clear unfocus all',
            icon: '❌',
            handler: () => exitFocusMode()
        },

        // View commands
        {
            id: 'toggle-theme',
            title: 'Toggle dark mode',
            description: 'Switch between light and dark theme',
            section: 'View',
            keywords: 'theme dark light mode toggle switch',
            icon: '🎨',
            handler: () => {
                const themeManager = document.querySelector('theme-manager');
                if (themeManager) {
                    themeManager.toggleTheme();
                }
            }
        },
        {
            id: 'toggle-fullscreen',
            title: 'Toggle fullscreen',
            description: 'Enter or exit fullscreen mode',
            section: 'View',
            keywords: 'fullscreen full screen maximize expand',
            icon: '🖥️',
            handler: () => {
                const layoutManager = document.querySelector('layout-manager');
                if (layoutManager) {
                    layoutManager.toggleFullscreen();
                }
            }
        },
        {
            id: 'zoom-hour',
            title: 'Zoom to hour view',
            description: 'Switch timeline to hourly scale',
            section: 'View',
            keywords: 'zoom hour hourly',
            icon: '🔍',
            handler: () => setZoom('hour')
        },
        {
            id: 'zoom-day',
            title: 'Zoom to day view',
            description: 'Switch timeline to daily scale',
            section: 'View',
            keywords: 'zoom day daily',
            icon: '🔍',
            handler: () => setZoom('day')
        },
        {
            id: 'zoom-week',
            title: 'Zoom to week view',
            description: 'Switch timeline to weekly scale',
            section: 'View',
            keywords: 'zoom week weekly',
            icon: '🔍',
            handler: () => setZoom('week')
        },
        {
            id: 'zoom-month',
            title: 'Zoom to month view',
            description: 'Switch timeline to monthly scale',
            section: 'View',
            keywords: 'zoom month monthly',
            icon: '🔍',
            handler: () => setZoom('month')
        },
        {
            id: 'zoom-quarter',
            title: 'Zoom to quarter view',
            description: 'Switch timeline to quarterly scale',
            section: 'View',
            keywords: 'zoom quarter quarterly',
            icon: '🔍',
            handler: () => setZoom('quarter')
        },
        {
            id: 'zoom-year',
            title: 'Zoom to year view',
            description: 'Switch timeline to yearly scale',
            section: 'View',
            keywords: 'zoom year yearly',
            icon: '🔍',
            handler: () => setZoom('year')
        },
        {
            id: 'expand-all',
            title: 'Expand all tasks',
            description: 'Open all parent tasks',
            section: 'View',
            keywords: 'expand open all show',
            icon: '📂',
            handler: () => expandAll()
        },
        {
            id: 'collapse-all',
            title: 'Collapse all tasks',
            description: 'Close all parent tasks',
            section: 'View',
            keywords: 'collapse close all hide',
            icon: '📁',
            handler: () => collapseAll()
        },
        {
            id: 'toggle-grid',
            title: 'Toggle grid',
            description: 'Show or hide the grid lines',
            section: 'View',
            keywords: 'grid lines toggle show hide',
            icon: '⚏',
            handler: () => toggleGrid()
        },
        {
            id: 'export-json',
            title: 'Export to JSON',
            description: 'Export project data as JSON file',
            section: 'File',
            keywords: 'export json save download',
            icon: '💾',
            handler: () => exportData()
        }
    ];
}

/**
 * Create go navigation options dynamically based on current project state
 * @returns {Array} Array of go navigation command objects
 */
export function createGoOptions() {
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

    return [
        {
            id: 'go-today',
            title: 'Today',
            description: `Go to ${now.toLocaleDateString()}`,
            section: 'Quick Navigation',
            icon: '📅',
            handler: () => {
                gantt.showDate(now);
                updateStatus('Jumped to today');
            }
        },
        {
            id: 'go-project-start',
            title: 'Project Start',
            description: 'Go to the beginning of the project',
            section: 'Quick Navigation',
            icon: '🏁',
            handler: () => {
                const state = gantt.getState();
                gantt.showDate(state.min_date);
                updateStatus('Jumped to project start');
            }
        },
        {
            id: 'go-project-end',
            title: 'Project End',
            description: 'Go to the end of the project',
            section: 'Quick Navigation',
            icon: '🎯',
            handler: () => {
                const state = gantt.getState();
                gantt.showDate(state.max_date);
                updateStatus('Jumped to project end');
            }
        },
        {
            id: 'go-next-milestone',
            title: 'Next Milestone',
            description: 'Go to the next milestone from today',
            section: 'Milestones',
            icon: '🚩',
            handler: () => {
                const milestones = gantt.getTaskByTime().filter(task =>
                    task.type === gantt.config.types.milestone &&
                    new Date(task.start_date) > now
                ).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

                if (milestones.length > 0) {
                    gantt.showTask(milestones[0].id);
                    gantt.selectTask(milestones[0].id);
                    updateStatus(`Jumped to milestone: ${milestones[0].text}`);
                } else {
                    updateStatus('No future milestones found');
                }
            }
        },
        {
            id: 'go-previous-milestone',
            title: 'Previous Milestone',
            description: 'Go to the previous milestone from today',
            section: 'Milestones',
            icon: '🚩',
            handler: () => {
                const milestones = gantt.getTaskByTime().filter(task =>
                    task.type === gantt.config.types.milestone &&
                    new Date(task.start_date) < now
                ).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

                if (milestones.length > 0) {
                    gantt.showTask(milestones[0].id);
                    gantt.selectTask(milestones[0].id);
                    updateStatus(`Jumped to milestone: ${milestones[0].text}`);
                } else {
                    updateStatus('No past milestones found');
                }
            }
        },
        {
            id: 'go-current-month',
            title: 'Current Month',
            description: `Go to ${monthNames[now.getMonth()]} ${now.getFullYear()}`,
            section: 'Calendar',
            icon: '📆',
            handler: () => {
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                gantt.showDate(monthStart);
                updateStatus(`Jumped to ${monthNames[now.getMonth()]} ${now.getFullYear()}`);
            }
        },
        {
            id: 'go-next-month',
            title: 'Next Month',
            description: `Go to ${monthNames[(now.getMonth() + 1) % 12]} ${now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()}`,
            section: 'Calendar',
            icon: '📆',
            handler: () => {
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                gantt.showDate(nextMonth);
                updateStatus(`Jumped to ${monthNames[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`);
            }
        },
        {
            id: 'go-selected-task',
            title: 'Selected Task',
            description: 'Center view on currently selected task',
            section: 'Task Navigation',
            icon: '🎯',
            handler: () => {
                const selectedId = gantt.getSelectedId();
                if (selectedId) {
                    gantt.showTask(selectedId);
                    const task = gantt.getTask(selectedId);
                    updateStatus(`Centered on: ${task.text}`);
                } else {
                    updateStatus('No task selected');
                }
            }
        }
    ];
}
