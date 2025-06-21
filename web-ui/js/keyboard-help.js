// Keyboard Help Screen Module
// Displays a modal with all keyboard shortcuts organized by category

console.log('🎹 keyboard-help.js is loading...');

class KeyboardHelp {
    constructor() {
        this.isOpen = false;
        this.container = null;
        this.initialize();
    }
    
    initialize() {
        // Create the help screen container
        this.createHelpScreen();
        
        // Register event handlers
        this.registerEventHandlers();
        
        console.log('✅ KeyboardHelp initialized');
    }
    
    createHelpScreen() {
        // Create container div
        this.container = document.createElement('div');
        this.container.className = 'keyboard-help-overlay';
        this.container.style.display = 'none';
        
        // Define shortcuts organized by category
        const categories = [
            {
                name: 'Navigation',
                icon: '🧭',
                shortcuts: [
                    { keys: '↑ / ↓', description: 'Navigate between tasks' },
                    { keys: '← / →', description: 'Collapse/Expand parent tasks' },
                    { keys: 'Space', description: 'Toggle expand/collapse for parent tasks' },
                    { keys: 'Enter', description: 'Toggle expand (parent) or Edit (leaf in edit mode)' },
                    { keys: 'g', description: 'Go to... (today, project start/end, milestones, months)' },
                    { keys: 'Home', description: 'Jump to timeline start' },
                    { keys: 'End', description: 'Jump to timeline end' }
                ]
            },
            {
                name: 'View Controls',
                icon: '🔍',
                shortcuts: [
                    { keys: '+ / -', description: 'Zoom in/out on timeline' },
                    { keys: 'Shift + ← / →', description: 'Scroll timeline horizontally' },
                    { keys: 'F', description: 'Focus search - zoom to specific area' },
                    { keys: 'Shift + F', description: 'Focus on current selection' }
                ]
            },
            {
                name: 'Search & Commands',
                icon: '🔎',
                shortcuts: [
                    { keys: '/', description: 'Search tasks or jump to month (e.g., "june", "next month")' },
                    { keys: 'Ctrl/Cmd + Shift + P', description: 'Open command palette' },
                    { keys: 'Esc', description: 'Close dialogs/Clear search' }
                ]
            },
            {
                name: 'Help',
                icon: '❓',
                shortcuts: [
                    { keys: '?', description: 'Show this help screen' },
                    { keys: 'Esc', description: 'Close help screen' }
                ]
            }
        ];
        
        // Build the HTML content
        const content = `
            <div class="keyboard-help-modal">
                <div class="keyboard-help-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button class="keyboard-help-close" aria-label="Close help">×</button>
                </div>
                <div class="keyboard-help-content">
                    ${categories.map(category => `
                        <div class="keyboard-help-category">
                            <h3 class="keyboard-help-category-title">
                                <span class="category-icon">${category.icon}</span>
                                ${category.name}
                            </h3>
                            <div class="keyboard-help-shortcuts">
                                ${category.shortcuts.map(shortcut => `
                                    <div class="keyboard-help-item">
                                        <span class="keyboard-help-keys">${this.formatKeys(shortcut.keys)}</span>
                                        <span class="keyboard-help-description">${shortcut.description}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="keyboard-help-footer">
                    Press <kbd>?</kbd> to toggle help • Press <kbd>Esc</kbd> to close
                </div>
            </div>
        `;
        
        this.container.innerHTML = content;
        document.body.appendChild(this.container);
    }
    
    formatKeys(keys) {
        // Convert key strings to proper <kbd> elements
        return keys.split(/(\s*[/+]\s*)/).map(part => {
            if (part.trim() === '/' || part.trim() === '+') {
                return ` ${part.trim()} `;
            }
            const trimmed = part.trim();
            if (trimmed) {
                return `<kbd>${trimmed}</kbd>`;
            }
            return '';
        }).join('');
    }
    
    registerEventHandlers() {
        // Click on overlay to close
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.close();
            }
        });
        
        // Click on close button
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('keyboard-help-close')) {
                this.close();
            }
        });
    }
    
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.container.style.display = 'flex';
        
        // Announce to screen readers
        this.container.setAttribute('aria-hidden', 'false');
        
        // Focus the modal for keyboard navigation
        const modal = this.container.querySelector('.keyboard-help-modal');
        if (modal) {
            modal.setAttribute('tabindex', '-1');
            modal.focus();
        }
        
        console.log('📖 Keyboard help opened');
        
        if (window.debugLog) {
            window.debugLog('ui', 'Keyboard help screen opened');
        }
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.container.style.display = 'none';
        
        // Update accessibility
        this.container.setAttribute('aria-hidden', 'true');
        
        // Return focus to gantt
        if (window.keyboardManager) {
            window.keyboardManager.restoreGanttFocus();
        }
        
        console.log('📕 Keyboard help closed');
        
        if (window.debugLog) {
            window.debugLog('ui', 'Keyboard help screen closed');
        }
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    getState() {
        return {
            isOpen: this.isOpen
        };
    }
}

// Create global instance
console.log('🚀 Initializing KeyboardHelp...');
try {
    window.keyboardHelp = new KeyboardHelp();
    console.log('✅ KeyboardHelp instance created');
    console.log('KeyboardHelp available at window.keyboardHelp:', window.keyboardHelp);
    
    // Add to window for debugging
    window.testHelp = function() {
        console.log('Testing help toggle...');
        window.keyboardHelp.toggle();
    };
} catch (error) {
    console.error('❌ KeyboardHelp initialization failed:', error);
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyboardHelp;
}