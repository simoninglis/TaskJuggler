import { LitElement, html, css } from 'lit';

export class KeyboardHelp extends LitElement {
  static properties = {
    isOpen: { type: Boolean, state: true }
  };

  static styles = css`
    /* Keyboard Help Screen Styles */
    .keyboard-help-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      animation: helpOverlayFadeIn 0.2s ease-out;
    }

    .keyboard-help-modal {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      width: 90%;
      max-width: 800px;
      max-height: 85vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: helpModalSlideIn 0.2s ease-out;
    }

    .keyboard-help-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .keyboard-help-header h2 {
      margin: 0;
      font-size: 24px;
      color: #333;
    }

    .keyboard-help-close {
      background: none;
      border: none;
      font-size: 32px;
      line-height: 1;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.15s ease;
    }

    .keyboard-help-close:hover {
      background-color: #f0f0f0;
      color: #333;
    }

    .keyboard-help-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 32px;
    }

    .keyboard-help-category {
      margin-bottom: 8px;
    }

    .keyboard-help-category-title {
      display: flex;
      align-items: center;
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .category-icon {
      font-size: 24px;
      margin-right: 8px;
    }

    .keyboard-help-shortcuts {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .keyboard-help-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background-color: #f8f9fa;
      border-radius: 6px;
      transition: background-color 0.15s ease;
    }

    .keyboard-help-item:hover {
      background-color: #e9ecef;
    }

    .keyboard-help-keys {
      flex-shrink: 0;
      margin-right: 16px;
      min-width: 120px;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      font-size: 14px;
    }

    .keyboard-help-keys kbd {
      display: inline-block;
      padding: 3px 8px;
      font-size: 12px;
      font-weight: 500;
      line-height: 1;
      color: #444;
      vertical-align: middle;
      background-color: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 1px 0 rgba(0,0,0,0.1);
      margin: 0 2px;
    }

    .keyboard-help-description {
      flex: 1;
      color: #555;
      font-size: 14px;
    }

    .keyboard-help-footer {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 14px;
    }

    .keyboard-help-footer kbd {
      display: inline-block;
      padding: 2px 6px;
      font-size: 12px;
      font-weight: 500;
      line-height: 1;
      color: #444;
      vertical-align: middle;
      background-color: #f8f9fa;
      border: 1px solid #ccc;
      border-radius: 3px;
      margin: 0 2px;
    }

    /* Dark theme support */
    :host-context(.dark-theme) .keyboard-help-overlay {
      background-color: rgba(0, 0, 0, 0.8);
    }

    :host-context(.dark-theme) .keyboard-help-modal {
      background: #2d2d2d;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    :host-context(.dark-theme) .keyboard-help-header {
      border-bottom-color: #444;
    }

    :host-context(.dark-theme) .keyboard-help-header h2 {
      color: #e0e0e0;
    }

    :host-context(.dark-theme) .keyboard-help-close {
      color: #999;
    }

    :host-context(.dark-theme) .keyboard-help-close:hover {
      background-color: #3a3a3a;
      color: #e0e0e0;
    }

    :host-context(.dark-theme) .keyboard-help-category-title {
      color: #e0e0e0;
    }

    :host-context(.dark-theme) .keyboard-help-item {
      background-color: #3a3a3a;
    }

    :host-context(.dark-theme) .keyboard-help-item:hover {
      background-color: #4a4a4a;
    }

    :host-context(.dark-theme) .keyboard-help-keys kbd {
      background-color: #2d2d2d;
      border-color: #555;
      color: #d0d0d0;
      box-shadow: 0 1px 0 rgba(255,255,255,0.1);
    }

    :host-context(.dark-theme) .keyboard-help-description {
      color: #b0b0b0;
    }

    :host-context(.dark-theme) .keyboard-help-footer {
      border-top-color: #444;
      color: #999;
    }

    :host-context(.dark-theme) .keyboard-help-footer kbd {
      background-color: #3a3a3a;
      border-color: #555;
      color: #d0d0d0;
    }

    /* Animations */
    @keyframes helpOverlayFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes helpModalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-30px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;

  constructor() {
    super();
    this.isOpen = false;
    this.previousFocus = null;
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.boundHandleKeyDown);
    console.log('✅ KeyboardHelp Web Component connected');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.boundHandleKeyDown);
  }

  // Define shortcuts organized by category
  get categories() {
    return [
      {
        name: 'Navigation',
        icon: '🧭',
        shortcuts: [
          { keys: '↑ / ↓', description: 'Navigate between tasks' },
          { keys: '← / →', description: 'Collapse/Expand parent tasks' },
          { keys: 'Space', description: 'Toggle expand/collapse for parent tasks' },
          { keys: 'Enter', description: 'Toggle expand (parent) or Edit (leaf in edit mode)' },
          { keys: 'g', description: 'Go to... (today, project start/end, milestones, months)' },
          { keys: ']m', description: 'Jump to next milestone' },
          { keys: '[m', description: 'Jump to previous milestone' },
          { keys: 'Home', description: 'Jump to timeline start' },
          { keys: 'End', description: 'Jump to timeline end' }
        ]
      },
      {
        name: 'View Controls',
        icon: '🔍',
        shortcuts: [
          { keys: '+ / -', description: 'Zoom in/out on timeline' },
          { keys: 'Ctrl/Cmd + Scroll', description: 'Zoom in/out with mouse wheel' },
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
  }

  render() {
    return this.isOpen ? html`
      <div 
        class="keyboard-help-overlay" 
        @click=${this.handleOverlayClick}
        aria-hidden="false"
      >
        <div 
          class="keyboard-help-modal" 
          @click=${(e) => e.stopPropagation()}
          role="dialog"
          aria-labelledby="keyboard-help-title"
          tabindex="-1"
        >
          <div class="keyboard-help-header">
            <h2 id="keyboard-help-title">Keyboard Shortcuts</h2>
            <button 
              class="keyboard-help-close" 
              @click=${this.close}
              aria-label="Close help"
            >
              ×
            </button>
          </div>

          <div class="keyboard-help-content">
            ${this.renderCategories()}
          </div>

          <div class="keyboard-help-footer">
            Press <kbd>?</kbd> to toggle help • Press <kbd>Esc</kbd> to close
          </div>
        </div>
      </div>
    ` : html``;
  }

  renderCategories() {
    return html`
      ${this.categories.map(category => html`
        <div class="keyboard-help-category">
          <h3 class="keyboard-help-category-title">
            <span class="category-icon">${category.icon}</span>
            ${category.name}
          </h3>
          <div class="keyboard-help-shortcuts">
            ${category.shortcuts.map(shortcut => html`
              <div class="keyboard-help-item">
                <span class="keyboard-help-keys">
                  ${this.formatKeys(shortcut.keys)}
                </span>
                <span class="keyboard-help-description">
                  ${shortcut.description}
                </span>
              </div>
            `)}
          </div>
        </div>
      `)}
    `;
  }

  formatKeys(keys) {
    // Split by separators but keep them
    const parts = keys.split(/(\s*[/+]\s*)/);
    return html`${parts.map(part => {
      const trimmed = part.trim();
      if (trimmed === '/' || trimmed === '+') {
        return html` ${trimmed} `;
      } else if (trimmed) {
        return html`<kbd>${trimmed}</kbd>`;
      }
      return '';
    })}`;
  }

  handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      this.close();
    }
  }

  handleKeyDown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      e.preventDefault();
      this.close();
    }
  }

  // Public API methods
  open() {
    if (this.isOpen) return;
    
    this.previousFocus = document.activeElement;
    this.isOpen = true;
    
    // Wait for render then focus modal
    this.updateComplete.then(() => {
      const modal = this.shadowRoot.querySelector('.keyboard-help-modal');
      if (modal) {
        modal.focus();
      }
    });
    
    console.log('📖 Keyboard help opened');
    
    if (window.debugLog) {
      window.debugLog('ui', 'Keyboard help screen opened');
    }
  }

  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    
    // Restore focus
    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    } else if (window.keyboardManager) {
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

// Register the custom element
customElements.define('keyboard-help', KeyboardHelp);

console.log('✅ keyboard-help Web Component defined');