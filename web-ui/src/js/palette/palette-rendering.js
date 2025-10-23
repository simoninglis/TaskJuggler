/**
 * Command Palette - Rendering Functions
 *
 * Handles all DOM manipulation and rendering for the command palette
 * Includes XSS protection via DOMPurify for user-generated content
 *
 * @module palette/palette-rendering
 */

// Import DOMPurify for XSS protection
import DOMPurify from 'dompurify';
import stateStore from '../stateStore.js';

/**
 * Create the command palette DOM structure
 * @returns {Object} Object containing references to created DOM elements
 */
export function createPaletteElements() {
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

    // Return element references
    return {
        overlay,
        modal,
        searchInput,
        resultsContainer
    };
}

/**
 * Render command results grouped by section
 * @param {HTMLElement} container - The results container element
 * @param {Array} filteredCommands - The filtered command list to render
 */
export function renderCommandResults(container, filteredCommands) {
    container.innerHTML = '';

    if (filteredCommands.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No commands found';
        container.appendChild(noResults);
        return;
    }

    // Group commands by section
    const sections = {};
    filteredCommands.forEach(command => {
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

        sections[sectionName].forEach((command) => {
            const commandElement = document.createElement('div');
            commandElement.className = 'command-item';
            commandElement.dataset.commandId = command.id;

            const globalIndex = filteredCommands.indexOf(command);
            const selectedIndex = stateStore.get('commandPalette.selectedIndex');
            if (globalIndex === selectedIndex) {
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

/**
 * Render empty search mode state
 * @param {HTMLElement} container - The results container element
 */
export function renderSearchModePlaceholder(container) {
    container.innerHTML = '';

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

/**
 * Render empty focus search mode state
 * @param {HTMLElement} container - The results container element
 */
export function renderFocusSearchPlaceholder(container) {
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

/**
 * Render task search results with XSS protection
 * @param {HTMLElement} container - The results container element
 * @param {Array} searchResults - Array of task search results
 * @param {string} searchTerm - The search term for highlighting
 */
export function renderTaskSearchResults(container, searchResults, searchTerm) {
    container.innerHTML = '';

    if (searchResults.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No tasks found';
        container.appendChild(noResults);
        return;
    }

    // Render search results
    searchResults.forEach((task, index) => {
        const taskElement = document.createElement('div');
        taskElement.className = 'command-item';
        taskElement.dataset.taskId = task.id;

        const selectedIndex = stateStore.get('commandPalette.selectedIndex');
        if (index === selectedIndex) {
            taskElement.classList.add('selected');
        }

        // Special handling for month navigation
        if (task.type === 'month') {
            // Sanitize task text to prevent XSS
            const sanitizedText = DOMPurify.sanitize(task.text, { ALLOWED_TAGS: [] });
            const sanitizedMonthName = DOMPurify.sanitize(task.monthData.displayName, { ALLOWED_TAGS: [] });

            taskElement.innerHTML = `
                <span class="command-icon">${task.icon}</span>
                <div class="command-content">
                    <div class="command-title">${sanitizedText}</div>
                    <div class="command-description">Jump to the beginning of ${sanitizedMonthName}</div>
                </div>
            `;
        } else {
            // Format dates
            const startDate = new Date(task.start_date).toLocaleDateString();
            const endDate = new Date(task.end_date).toLocaleDateString();

            taskElement.innerHTML = `
                <div class="command-icon">📋</div>
                <div class="command-content">
                    <div class="command-title">${highlightMatch(task.text, searchTerm)}</div>
                    <div class="command-description">${startDate} - ${endDate} | Progress: ${Math.round(task.progress * 100)}%</div>
                </div>
            `;
        }

        container.appendChild(taskElement);
    });
}

/**
 * Highlight matching text in search results with XSS protection
 * @param {string} text - The text to highlight matches in
 * @param {string} searchTerm - The search term to highlight
 * @returns {string} HTML string with highlighted matches
 */
export function highlightMatch(text, searchTerm) {
    // Sanitize text first to prevent XSS
    const sanitizedText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });

    if (!searchTerm) return sanitizedText;

    // Escape special regex characters to prevent ReDoS and regex injection
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    return sanitizedText.replace(regex, '<mark>$1</mark>');
}

/**
 * Render go navigation mode results
 * @param {HTMLElement} container - The results container element
 * @param {Array} filteredCommands - The filtered go navigation options to render
 */
export function renderGoModeResults(container, filteredCommands) {
    container.innerHTML = '';

    if (filteredCommands.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No navigation options found';
        container.appendChild(noResults);
        return;
    }

    // Group commands by section
    const sections = {};
    filteredCommands.forEach(command => {
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

            const selectedIndex = stateStore.get('commandPalette.selectedIndex');
            if (globalIndex === selectedIndex) {
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

/**
 * Update the selection highlight for the currently selected item
 * @param {HTMLElement} container - The results container element
 */
export function updateSelectionHighlight(container) {
    const selectedIndex = stateStore.get('commandPalette.selectedIndex');
    const commandElements = container.querySelectorAll('.command-item');

    commandElements.forEach((element, index) => {
        element.classList.toggle('selected', index === selectedIndex);
    });

    // Scroll selected item into view
    const selectedElement = commandElements[selectedIndex];
    if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}
