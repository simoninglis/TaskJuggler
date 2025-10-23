// Custom Command Palette Implementation
// Replaces ninja-keys with a simple, reliable custom solution

// Import state store
import stateStore from './stateStore.js';

// Import specialized palette modules
import { getCommandDefinitions, createGoOptions } from './palette/commands-config.js';
import { performTaskSearch, filterCommands } from './palette/palette-search.js';
import {
    createPaletteElements,
    renderCommandResults,
    renderSearchModePlaceholder,
    renderFocusSearchPlaceholder,
    renderTaskSearchResults,
    renderGoModeResults,
    updateSelectionHighlight
} from './palette/palette-rendering.js';

class CustomCommandPalette {
    constructor() {
        // Local data that doesn't need to be in global state
        this.commands = [];
        this.filteredCommands = [];
        this.elements = {};
        this.searchResults = [];
        this.goOptions = [];
        this.selectedIndex = 0;
        this.lastSelectedIndex = 0;

        // Subscribe to state changes
        this.setupStateSubscriptions();

        // Initialize the palette
        this.initialize();
    }

    setupStateSubscriptions() {
        // Subscribe to command palette state changes
        stateStore.subscribe('commandPalette', (paletteState) => {
            // Update UI based on state changes
            if (paletteState.isOpen && !this.elements.overlay.style.display !== 'none') {
                this.elements.overlay.style.display = 'flex';
            } else if (!paletteState.isOpen && this.elements.overlay.style.display !== 'none') {
                this.elements.overlay.style.display = 'none';
            }

            // Update selected index if changed externally
            if (paletteState.selectedIndex !== this.lastSelectedIndex) {
                this.lastSelectedIndex = paletteState.selectedIndex;
                this.updateSelection();
            }
        });
    }

    initialize() {
        this.elements = createPaletteElements();
        this.bindEvents();
        this.loadCommands();

        if (window.debugLog) {
            window.debugLog('info', 'Custom command palette initialized');
        }
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
                const mode = stateStore.getCommandPaletteMode();
                if (mode === 'search' || mode === 'focus') {
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
        // Load command definitions from config module
        this.commands = getCommandDefinitions();

        // Initially show all commands
        this.filteredCommands = [...this.commands];
    }

    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        const mode = stateStore.getCommandPaletteMode();

        if (mode === 'search' || mode === 'focus') {
            // Handle task search using search module
            this.searchResults = performTaskSearch(searchTerm);
            this.selectedIndex = 0;
            stateStore.setCommandPaletteSelectedIndex(0);

            if (this.searchResults.length === 0 && !searchTerm) {
                renderSearchModePlaceholder(this.elements.resultsContainer);
            } else {
                renderTaskSearchResults(
                    this.elements.resultsContainer,
                    this.searchResults,
                    searchTerm
                );
            }
        } else if (mode === 'go') {
            // Handle go navigation search
            this.filteredCommands = filterCommands(this.goOptions, searchTerm);
            this.selectedIndex = 0;
            renderGoModeResults(this.elements.resultsContainer, this.filteredCommands);
        } else {
            // Handle command search
            this.filteredCommands = filterCommands(this.commands, searchTerm);
            this.selectedIndex = 0;
            renderCommandResults(this.elements.resultsContainer, this.filteredCommands);
        }
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
        const mode = stateStore.getCommandPaletteMode();
        if (mode === 'search' || mode === 'focus') {
            if (this.searchResults.length === 0) return;
            this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
        } else {
            if (this.filteredCommands.length === 0) return;
            this.selectedIndex = (this.selectedIndex + 1) % this.filteredCommands.length;
        }
        stateStore.setCommandPaletteSelectedIndex(this.selectedIndex);
        this.updateSelection();
    }

    selectPrevious() {
        const mode = stateStore.getCommandPaletteMode();
        if (mode === 'search' || mode === 'focus') {
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
        stateStore.setCommandPaletteSelectedIndex(this.selectedIndex);
        this.updateSelection();
    }

    updateSelection() {
        updateSelectionHighlight(this.elements.resultsContainer);
    }

    executeSelected() {
        const mode = stateStore.getCommandPaletteMode();
        if (mode === 'search' || mode === 'focus') {
            if (this.searchResults.length === 0 || this.selectedIndex < 0) {
                // Close palette even if no results
                this.close();
                return;
            }
            const selectedTask = this.searchResults[this.selectedIndex];
            this.selectTask(selectedTask.id);
        } else if (mode === 'go') {
            if (this.filteredCommands.length === 0 || this.selectedIndex < 0) {
                // Close palette even if no results
                this.close();
                return;
            }
            const selectedCommand = this.filteredCommands[this.selectedIndex];
            this.executeCommand(selectedCommand.id);
        } else {
            if (this.filteredCommands.length === 0 || this.selectedIndex < 0) {
                // Close palette even if no results
                this.close();
                return;
            }
            const selectedCommand = this.filteredCommands[this.selectedIndex];
            this.executeCommand(selectedCommand.id);
        }
    }

    executeCommand(commandId) {
        // Check if we're in go mode
        let command;
        const mode = stateStore.getCommandPaletteMode();
        if (mode === 'go') {
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

            const mode = stateStore.getCommandPaletteMode();
            if (mode === 'focus') {
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

    open() {
        if (stateStore.isCommandPaletteOpen()) return;

        // Update state store
        stateStore.setCommandPaletteOpen(true);
        stateStore.setCommandPaletteMode('command');

        this.elements.overlay.style.display = 'flex';

        // Set placeholder for command mode
        this.elements.searchInput.placeholder = 'Type a command...';

        // Clear search and reset
        this.elements.searchInput.value = '';
        this.filteredCommands = [...this.commands];
        this.selectedIndex = 0;
        stateStore.setCommandPaletteSelectedIndex(0);

        // Render results and focus search
        renderCommandResults(this.elements.resultsContainer, this.filteredCommands);

        // Focus the search input after a brief delay to ensure visibility
        setTimeout(() => {
            this.elements.searchInput.focus();
        }, 10);

        if (window.debugLog) {
            window.debugLog('info', 'Custom command palette opened');
        }
    }

    openSearch() {
        const wasOpen = stateStore.isCommandPaletteOpen();

        // Update state store
        if (!wasOpen) {
            stateStore.setCommandPaletteOpen(true);
        }
        stateStore.setCommandPaletteMode('search');

        this.elements.overlay.style.display = 'flex';

        // Set placeholder for search mode
        this.elements.searchInput.placeholder = 'Search tasks...';

        // Clear search and reset
        this.elements.searchInput.value = '';
        this.searchResults = [];
        this.selectedIndex = 0;
        stateStore.setCommandPaletteSelectedIndex(0);

        // Show search mode UI
        renderSearchModePlaceholder(this.elements.resultsContainer);

        // Focus the search input after a brief delay to ensure visibility
        setTimeout(() => {
            this.elements.searchInput.focus();
        }, 10);

        if (window.debugLog) {
            window.debugLog('info', 'Custom command palette opened in search mode');
        }
    }

    openFocusSearch() {
        const wasOpen = stateStore.isCommandPaletteOpen();

        // Update state store
        if (!wasOpen) {
            stateStore.setCommandPaletteOpen(true);
        }
        stateStore.setCommandPaletteMode('focus');

        this.elements.overlay.style.display = 'flex';

        // Set placeholder for focus mode
        this.elements.searchInput.placeholder = 'Search for area to focus on...';

        // Clear search and reset
        this.elements.searchInput.value = '';
        this.searchResults = [];
        this.selectedIndex = 0;
        stateStore.setCommandPaletteSelectedIndex(0);

        // Show focus search mode UI
        renderFocusSearchPlaceholder(this.elements.resultsContainer);

        // Focus the search input after a brief delay to ensure visibility
        setTimeout(() => {
            this.elements.searchInput.focus();
        }, 10);

        if (window.debugLog) {
            window.debugLog('info', 'Custom command palette opened in focus search mode');
        }
    }

    openGoNavigation() {
        const wasOpen = stateStore.isCommandPaletteOpen();

        // Update state store
        if (!wasOpen) {
            stateStore.setCommandPaletteOpen(true);
        }
        stateStore.setCommandPaletteMode('go');

        this.elements.overlay.style.display = 'flex';

        // Set placeholder for go mode
        this.elements.searchInput.placeholder = 'Go to...';

        // Clear search and reset
        this.elements.searchInput.value = '';
        this.selectedIndex = 0;

        // Create go navigation options from config module
        this.goOptions = createGoOptions();
        this.filteredCommands = [...this.goOptions];
        stateStore.setCommandPaletteSelectedIndex(0);

        // Show go navigation UI
        renderGoModeResults(this.elements.resultsContainer, this.filteredCommands);

        // Focus the search input after a brief delay
        setTimeout(() => {
            this.elements.searchInput.focus();
        }, 10);

        if (window.debugLog) {
            window.debugLog('info', 'Go navigation palette opened');
        }
    }

    close() {
        if (!stateStore.isCommandPaletteOpen()) return;

        // Update state store
        stateStore.setCommandPaletteOpen(false);
        stateStore.setCommandPaletteMode('command');
        stateStore.setCommandPaletteSearchTerm('');
        stateStore.setCommandPaletteSelectedIndex(0);

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
            isOpen: stateStore.isCommandPaletteOpen(),
            commandCount: this.commands.length,
            filteredCount: this.filteredCommands.length,
            selectedIndex: stateStore.get('commandPalette.selectedIndex')
        };
    }
}

// Create global instance
window.customCommandPalette = new CustomCommandPalette();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomCommandPalette;
}
