// Custom Command Palette Implementation
// Replaces ninja-keys with a simple, reliable custom solution

class CustomCommandPalette {
    constructor() {
        this.isOpen = false;
        this.commands = [];
        this.filteredCommands = [];
        this.selectedIndex = 0;
        this.elements = {};
        
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
                const commandId = commandElement.dataset.commandId;
                this.executeCommand(commandId);
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
            
            // View commands
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
            }
        ];
        
        // Initially show all commands
        this.filteredCommands = [...this.commands];
    }
    
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
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
        if (this.filteredCommands.length === 0) return;
        
        this.selectedIndex = (this.selectedIndex + 1) % this.filteredCommands.length;
        this.updateSelection();
    }
    
    selectPrevious() {
        if (this.filteredCommands.length === 0) return;
        
        this.selectedIndex = this.selectedIndex === 0 
            ? this.filteredCommands.length - 1 
            : this.selectedIndex - 1;
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
        if (this.filteredCommands.length === 0 || this.selectedIndex < 0) return;
        
        const selectedCommand = this.filteredCommands[this.selectedIndex];
        this.executeCommand(selectedCommand.id);
    }
    
    executeCommand(commandId) {
        const command = this.commands.find(cmd => cmd.id === commandId);
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
        this.elements.overlay.style.display = 'flex';
        
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
    
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
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