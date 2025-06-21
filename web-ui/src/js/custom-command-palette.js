// Custom Command Palette Implementation
// Replaces ninja-keys with a simple, reliable custom solution

class CustomCommandPalette {
    constructor() {
        this.isOpen = false;
        this.isSearchMode = false;
        this.isFocusMode = false;
        this.isGoMode = false;
        this.commands = [];
        this.filteredCommands = [];
        this.selectedIndex = 0;
        this.elements = {};
        this.searchResults = [];
        this.goOptions = [];
        
        // Initialize the palette
        this.initialize();
    }
    
    initialize() {
        this.createElements();
        this.bindEvents();
        this.loadCommands();
        
        if (window.debugLog) {
            window.debugLog('info', 'Custom command palette initialized');
        }
    }
    
    createElements() {
        // Create overlay container
        const overlay = document.createElement('div');
        overlay.id = 'customCommandPalette';
        overlay.className = 'command-palette-overlay';
        overlay.style.display = 'none';
        
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'command-palette-modal';
        
        // Create search input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'paletteSearch';
        searchInput.className = 'palette-search';
        searchInput.placeholder = 'Type a command...';
        searchInput.autocomplete = 'off';
        
        // Create results container
        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'paletteResults';
        resultsContainer.className = 'command-results';
        
        // Assemble the structure
        modal.appendChild(searchInput);
        modal.appendChild(resultsContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Store element references
        this.elements = {
            overlay,
            modal,
            searchInput,
            resultsContainer
        };
    }
    
    bindEvents() {
        // Search input events
        this.elements.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        this.elements.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        // Click outside to close
        this.elements.overlay.addEventListener('click', (e) => {
            if (e.target === this.elements.overlay) {
                this.close();
            }
        });
        
        // Results container click handling
        this.elements.resultsContainer.addEventListener('click', (e) => {
            const commandElement = e.target.closest('.command-item');
            if (commandElement) {
                if (this.isSearchMode) {
                    const taskId = commandElement.dataset.taskId;
                    this.selectTask(taskId);
                } else {
                    const commandId = commandElement.dataset.commandId;
                    this.executeCommand(commandId);
                }
            }
        });
    }
    
    loadCommands() {
        // Define all available commands
        this.commands = [
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
                    if (window.themeManager) {
                        window.themeManager.toggleTheme();
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
                    if (window.layoutManager) {
                        window.layoutManager.toggleFullscreen();
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
        
        // Initially show all commands
        this.filteredCommands = [...this.commands];
    }
    
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (this.isSearchMode) {
            // Handle task search
            this.performTaskSearch(searchTerm);
        } else if (this.isGoMode) {
            // Handle go navigation search
            if (!searchTerm) {
                this.filteredCommands = [...this.goOptions];
            } else {
                this.filteredCommands = this.goOptions.filter(option => {
                    const searchText = `${option.title} ${option.description}`.toLowerCase();
                    return searchText.includes(searchTerm);
                });
            }
            
            this.selectedIndex = 0;
            this.renderGoMode();
        } else {
            // Handle command search
            if (!searchTerm) {
                this.filteredCommands = [...this.commands];
            } else {
                this.filteredCommands = this.commands.filter(command => {
                    const searchText = `${command.title} ${command.description} ${command.keywords}`.toLowerCase();
                    return searchText.includes(searchTerm);
                });
            }
            
            this.selectedIndex = 0;
            this.renderResults();
        }
    }
    
    performTaskSearch(searchTerm) {
        if (!searchTerm) {
            this.searchResults = [];
            this.renderSearchMode();
            return;
        }
        
        // Check if search term is a month
        const monthMatch = this.parseMonthSearch(searchTerm);
        if (monthMatch) {
            this.searchResults = [{
                id: 'month-jump',
                text: `Go to ${monthMatch.displayName}`,
                type: 'month',
                monthData: monthMatch,
                icon: '📅'
            }];
            
            // Also search for tasks
            const allTasks = gantt.getTaskByTime();
            const taskResults = allTasks.filter(task => {
                const taskText = task.text.toLowerCase();
                return taskText.includes(searchTerm);
            });
            
            // Add task results after month result
            this.searchResults = this.searchResults.concat(taskResults);
        } else {
            // Get all tasks from gantt
            const allTasks = gantt.getTaskByTime();
            
            // Filter tasks by search term
            this.searchResults = allTasks.filter(task => {
                const taskText = task.text.toLowerCase();
                return taskText.includes(searchTerm);
            });
        }
        
        this.selectedIndex = 0;
        this.renderSearchResults();
    }
    
    parseMonthSearch(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        // Month names and abbreviations
        const months = {
            'january': 0, 'jan': 0,
            'february': 1, 'feb': 1,
            'march': 2, 'mar': 2,
            'april': 3, 'apr': 3,
            'may': 4,
            'june': 5, 'jun': 5,
            'july': 6, 'jul': 6,
            'august': 7, 'aug': 7,
            'september': 8, 'sep': 8, 'sept': 8,
            'october': 9, 'oct': 9,
            'november': 10, 'nov': 10,
            'december': 11, 'dec': 11
        };
        
        // Check for month name
        for (const [monthName, monthIndex] of Object.entries(months)) {
            if (term.includes(monthName)) {
                const now = new Date();
                let year = now.getFullYear();
                
                // Check if year is specified (e.g., "june 2025")
                const yearMatch = term.match(/\d{4}/);
                if (yearMatch) {
                    year = parseInt(yearMatch[0]);
                }
                
                // If month is in the past this year, assume next year
                if (monthIndex < now.getMonth() && !yearMatch) {
                    year++;
                }
                
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                  'July', 'August', 'September', 'October', 'November', 'December'];
                
                return {
                    month: monthIndex,
                    year: year,
                    displayName: `${monthNames[monthIndex]} ${year}`,
                    date: new Date(year, monthIndex, 1)
                };
            }
        }
        
        // Check for "next month" or "current month"
        if (term === 'next month' || term === 'next') {
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
            
            return {
                month: nextMonth.getMonth(),
                year: nextMonth.getFullYear(),
                displayName: `${monthNames[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`,
                date: nextMonth
            };
        }
        
        if (term === 'current month' || term === 'current' || term === 'this month' || term === 'now') {
            const now = new Date();
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
            
            return {
                month: now.getMonth(),
                year: now.getFullYear(),
                displayName: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
                date: new Date(now.getFullYear(), now.getMonth(), 1)
            };
        }
        
        return null;
    }
    
    handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectNext();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectPrevious();
                break;
                
            case 'Enter':
                e.preventDefault();
                this.executeSelected();
                break;
                
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
        }
    }
    
    selectNext() {
        if (this.isSearchMode) {
            if (this.searchResults.length === 0) return;
            this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
        } else {
            if (this.filteredCommands.length === 0) return;
            this.selectedIndex = (this.selectedIndex + 1) % this.filteredCommands.length;
        }
        this.updateSelection();
    }
    
    selectPrevious() {
        if (this.isSearchMode) {
            if (this.searchResults.length === 0) return;
            this.selectedIndex = this.selectedIndex === 0 
                ? this.searchResults.length - 1 
                : this.selectedIndex - 1;
        } else {
            if (this.filteredCommands.length === 0) return;
            this.selectedIndex = this.selectedIndex === 0 
                ? this.filteredCommands.length - 1 
                : this.selectedIndex - 1;
        }
        this.updateSelection();
    }
    
    updateSelection() {
        const commandElements = this.elements.resultsContainer.querySelectorAll('.command-item');
        commandElements.forEach((element, index) => {
            element.classList.toggle('selected', index === this.selectedIndex);
        });
        
        // Scroll selected item into view
        const selectedElement = commandElements[this.selectedIndex];
        if (selectedElement) {
            selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
    
    executeSelected() {
        if (this.isSearchMode) {
            if (this.searchResults.length === 0 || this.selectedIndex < 0) return;
            const selectedTask = this.searchResults[this.selectedIndex];
            this.selectTask(selectedTask.id);
        } else if (this.isGoMode) {
            if (this.filteredCommands.length === 0 || this.selectedIndex < 0) return;
            const selectedCommand = this.filteredCommands[this.selectedIndex];
            this.executeCommand(selectedCommand.id);
        } else {
            if (this.filteredCommands.length === 0 || this.selectedIndex < 0) return;
            const selectedCommand = this.filteredCommands[this.selectedIndex];
            this.executeCommand(selectedCommand.id);
        }
    }
    
    executeCommand(commandId) {
        // Check if we're in go mode
        let command;
        if (this.isGoMode) {
            command = this.goOptions.find(cmd => cmd.id === commandId);
        } else {
            command = this.commands.find(cmd => cmd.id === commandId);
        }
        
        if (!command) {
            console.error('Command not found:', commandId);
            return;
        }
        
        if (window.debugLog) {
            window.debugLog('info', 'Executing command', { id: commandId, title: command.title });
        }
        
        try {
            // Execute the command handler
            command.handler();
            
            // Close the palette after successful execution
            this.close();
            
            if (typeof updateStatus === 'function') {
                updateStatus(`Executed: ${command.title}`);
            }
        } catch (error) {
            console.error('Error executing command:', error);
            if (typeof updateStatus === 'function') {
                updateStatus(`Error: ${error.message}`);
            }
        }
    }
    
    selectTask(taskId) {
        if (!taskId) return;
        
        try {
            // Handle month navigation
            if (taskId === 'month-jump') {
                const monthResult = this.searchResults.find(r => r.id === 'month-jump');
                if (monthResult && monthResult.monthData) {
                    const targetDate = monthResult.monthData.date;
                    
                    // Scroll to the target date
                    gantt.showDate(targetDate);
                    
                    // Close the palette
                    this.close();
                    
                    if (typeof updateStatus === 'function') {
                        updateStatus(`Jumped to ${monthResult.monthData.displayName}`);
                    }
                }
                return;
            }
            
            if (this.isFocusMode) {
                // Focus mode - filter to show only this task and its subtasks
                if (typeof focusOnTask === 'function') {
                    focusOnTask(taskId);
                }
                // Close the palette
                this.close();
                
                if (typeof updateStatus === 'function') {
                    const task = gantt.getTask(taskId);
                    updateStatus(`Focused on: ${task.text}`);
                }
            } else {
                // Regular search mode - just select and show the task
                gantt.selectTask(taskId);
                gantt.showTask(taskId);
                
                // Close the palette
                this.close();
                
                if (typeof updateStatus === 'function') {
                    const task = gantt.getTask(taskId);
                    updateStatus(`Selected: ${task.text}`);
                }
            }
        } catch (error) {
            console.error('Error selecting task:', error);
            if (typeof updateStatus === 'function') {
                updateStatus(`Error: ${error.message}`);
            }
        }
    }
    
    renderResults() {
        const container = this.elements.resultsContainer;
        container.innerHTML = '';
        
        if (this.filteredCommands.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No commands found';
            container.appendChild(noResults);
            return;
        }
        
        // Group commands by section
        const sections = {};
        this.filteredCommands.forEach(command => {
            if (!sections[command.section]) {
                sections[command.section] = [];
            }
            sections[command.section].push(command);
        });
        
        // Render each section
        Object.keys(sections).forEach(sectionName => {
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'section-header';
            sectionHeader.textContent = sectionName;
            container.appendChild(sectionHeader);
            
            sections[sectionName].forEach((command, index) => {
                const commandElement = document.createElement('div');
                commandElement.className = 'command-item';
                commandElement.dataset.commandId = command.id;
                
                const globalIndex = this.filteredCommands.indexOf(command);
                if (globalIndex === this.selectedIndex) {
                    commandElement.classList.add('selected');
                }
                
                commandElement.innerHTML = `
                    <div class="command-icon">${command.icon}</div>
                    <div class="command-content">
                        <div class="command-title">${command.title}</div>
                        <div class="command-description">${command.description}</div>
                    </div>
                `;
                
                container.appendChild(commandElement);
            });
        });
    }
    
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.isSearchMode = false;
        this.elements.overlay.style.display = 'flex';
        
        // Set placeholder for command mode
        this.elements.searchInput.placeholder = 'Type a command...';
        
        // Clear search and reset
        this.elements.searchInput.value = '';
        this.filteredCommands = [...this.commands];
        this.selectedIndex = 0;
        
        // Render results and focus search
        this.renderResults();
        
        // Focus the search input after a brief delay to ensure visibility
        setTimeout(() => {
            this.elements.searchInput.focus();
        }, 10);
        
        if (window.debugLog) {
            window.debugLog('info', 'Custom command palette opened');
        }
    }
    
    openSearch() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.isSearchMode = true;
        this.isFocusMode = false;
        this.elements.overlay.style.display = 'flex';
        
        // Set placeholder for search mode
        this.elements.searchInput.placeholder = 'Search tasks...';
        
        // Clear search and reset
        this.elements.searchInput.value = '';
        this.searchResults = [];
        this.selectedIndex = 0;
        
        // Show search mode UI
        this.renderSearchMode();
        
        // Focus the search input after a brief delay to ensure visibility
        setTimeout(() => {
            this.elements.searchInput.focus();
        }, 10);
        
        if (window.debugLog) {
            window.debugLog('info', 'Custom command palette opened in search mode');
        }
    }
    
    openFocusSearch() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.isSearchMode = true;
        this.isFocusMode = true;
        this.elements.overlay.style.display = 'flex';
        
        // Set placeholder for focus mode
        this.elements.searchInput.placeholder = 'Search for area to focus on...';
        
        // Clear search and reset
        this.elements.searchInput.value = '';
        this.searchResults = [];
        this.selectedIndex = 0;
        
        // Show focus search mode UI
        this.renderFocusSearchMode();
        
        // Focus the search input after a brief delay to ensure visibility
        setTimeout(() => {
            this.elements.searchInput.focus();
        }, 10);
        
        if (window.debugLog) {
            window.debugLog('info', 'Custom command palette opened in focus search mode');
        }
    }
    
    openGoNavigation() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.isSearchMode = false;
        this.isGoMode = true;
        this.elements.overlay.style.display = 'flex';
        
        // Set placeholder for go mode
        this.elements.searchInput.placeholder = 'Go to...';
        
        // Clear search and reset
        this.elements.searchInput.value = '';
        this.selectedIndex = 0;
        
        // Create go navigation options
        this.goOptions = this.createGoOptions();
        this.filteredCommands = [...this.goOptions];
        
        // Show go navigation UI
        this.renderGoMode();
        
        // Focus the search input after a brief delay
        setTimeout(() => {
            this.elements.searchInput.focus();
        }, 10);
        
        if (window.debugLog) {
            window.debugLog('info', 'Go navigation palette opened');
        }
    }
    
    createGoOptions() {
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
    
    renderSearchMode() {
        const container = this.elements.resultsContainer;
        container.innerHTML = '';
        
        if (this.searchResults.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'search-placeholder';
            placeholder.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #666;">
                    <div style="font-size: 16px; margin-bottom: 8px;">Search for tasks</div>
                    <div style="font-size: 14px; opacity: 0.8;">Type to search through all tasks in the project</div>
                </div>
            `;
            container.appendChild(placeholder);
        }
    }
    
    renderFocusSearchMode() {
        const container = this.elements.resultsContainer;
        container.innerHTML = '';
        
        const placeholder = document.createElement('div');
        placeholder.className = 'search-placeholder';
        placeholder.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #666;">
                <div style="font-size: 16px; margin-bottom: 8px;">Search for area to focus on</div>
                <div style="font-size: 14px; opacity: 0.8;">Type to find a parent task. Selecting it will show only that task and its subtasks.</div>
            </div>
        `;
        container.appendChild(placeholder);
    }
    
    renderSearchResults() {
        const container = this.elements.resultsContainer;
        container.innerHTML = '';
        
        if (this.searchResults.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No tasks found';
            container.appendChild(noResults);
            return;
        }
        
        // Render search results
        this.searchResults.forEach((task, index) => {
            const taskElement = document.createElement('div');
            taskElement.className = 'command-item';
            taskElement.dataset.taskId = task.id;
            
            if (index === this.selectedIndex) {
                taskElement.classList.add('selected');
            }
            
            // Special handling for month navigation
            if (task.type === 'month') {
                taskElement.innerHTML = `
                    <span class="command-icon">${task.icon}</span>
                    <div class="command-content">
                        <div class="command-title">${task.text}</div>
                        <div class="command-description">Jump to the beginning of ${task.monthData.displayName}</div>
                    </div>
                `;
            } else {
                // Format dates
                const startDate = new Date(task.start_date).toLocaleDateString();
                const endDate = new Date(task.end_date).toLocaleDateString();
                
                taskElement.innerHTML = `
                    <div class="command-icon">📋</div>
                    <div class="command-content">
                        <div class="command-title">${this.highlightMatch(task.text, this.elements.searchInput.value)}</div>
                        <div class="command-description">${startDate} - ${endDate} | Progress: ${Math.round(task.progress * 100)}%</div>
                    </div>
                `;
            }
            
            container.appendChild(taskElement);
        });
    }
    
    highlightMatch(text, searchTerm) {
        if (!searchTerm) return text;
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    renderGoMode() {
        const container = this.elements.resultsContainer;
        container.innerHTML = '';
        
        if (this.filteredCommands.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No navigation options found';
            container.appendChild(noResults);
            return;
        }
        
        // Group commands by section
        const sections = {};
        this.filteredCommands.forEach(command => {
            if (!sections[command.section]) {
                sections[command.section] = [];
            }
            sections[command.section].push(command);
        });
        
        // Render sections
        let globalIndex = 0;
        Object.entries(sections).forEach(([section, commands]) => {
            // Section header
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'section-header';
            sectionHeader.textContent = section;
            container.appendChild(sectionHeader);
            
            // Commands in section
            commands.forEach(command => {
                const commandElement = document.createElement('div');
                commandElement.className = 'command-item';
                commandElement.dataset.commandId = command.id;
                
                if (globalIndex === this.selectedIndex) {
                    commandElement.classList.add('selected');
                }
                
                commandElement.innerHTML = `
                    <span class="command-icon">${command.icon}</span>
                    <div class="command-content">
                        <div class="command-title">${command.title}</div>
                        <div class="command-description">${command.description}</div>
                    </div>
                `;
                
                container.appendChild(commandElement);
                globalIndex++;
            });
        });
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.isSearchMode = false;
        this.isFocusMode = false;
        this.isGoMode = false;
        this.elements.overlay.style.display = 'none';
        
        // Return focus to gantt
        const ganttContainer = document.getElementById('gantt_here');
        if (ganttContainer) {
            ganttContainer.focus();
        }
        
        if (window.debugLog) {
            window.debugLog('info', 'Custom command palette closed');
        }
    }
    
    // Public API
    getState() {
        return {
            isOpen: this.isOpen,
            commandCount: this.commands.length,
            filteredCount: this.filteredCommands.length,
            selectedIndex: this.selectedIndex
        };
    }
}

// Create global instance
window.customCommandPalette = new CustomCommandPalette();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomCommandPalette;
}