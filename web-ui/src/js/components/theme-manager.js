import { LitElement, html, css } from 'lit';

export class ThemeManager extends LitElement {
  static properties = {
    currentTheme: { type: String, state: true }
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    .theme-toggle {
      background: none;
      border: 2px solid var(--border-primary, #ddd);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 20px;
    }

    .theme-toggle:hover {
      background-color: var(--bg-hover, rgba(0, 0, 0, 0.05));
      transform: scale(1.1);
    }

    .theme-toggle:active {
      transform: scale(0.95);
    }

    /* Dark theme adjustments */
    :host-context(.dark-theme) .theme-toggle {
      border-color: var(--border-primary, #555);
    }

    :host-context(.dark-theme) .theme-toggle:hover {
      background-color: var(--bg-hover, rgba(255, 255, 255, 0.1));
    }
  `;

  constructor() {
    super();
    this.currentTheme = 'light';
    this.boundHandleSystemThemeChange = this.handleSystemThemeChange.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    
    // Load saved theme preference
    this.loadTheme();
    
    // Listen for system theme changes
    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.boundHandleSystemThemeChange);
    }
    
    console.log('✅ ThemeManager Web Component initialized with theme:', this.currentTheme);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    
    // Clean up event listener
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.boundHandleSystemThemeChange);
    }
  }

  loadTheme() {
    // Check localStorage for saved theme
    const savedTheme = localStorage.getItem('taskjuggler-theme');
    
    // Check system preference if no saved theme
    if (!savedTheme) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? 'dark' : 'light';
    } else {
      this.currentTheme = savedTheme;
    }
    
    // Apply theme
    this.applyTheme(this.currentTheme);
  }

  applyTheme(theme) {
    // Update data attribute on body
    document.body.setAttribute('data-theme', theme);
    
    // Add/remove dark-theme class for CSS
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    
    // Special handling for DHTMLX Gantt
    this.updateGanttTheme(theme);
    
    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme },
      bubbles: true,
      composed: true
    }));
    
    // Log theme change
    if (window.debugLog) {
      window.debugLog('theme', 'Theme changed', { theme });
    }
  }

  updateGanttTheme(theme) {
    if (typeof gantt === 'undefined') return;
    
    // DHTMLX Gantt doesn't have a built-in dark theme switch,
    // but we can trigger a re-render to apply our CSS overrides
    if (gantt.render) {
      setTimeout(() => {
        gantt.render();
      }, 10);
    }
  }

  handleSystemThemeChange(e) {
    // Only auto-switch if user hasn't manually set a preference
    if (!localStorage.getItem('taskjuggler-theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      this.currentTheme = newTheme;
      this.applyTheme(newTheme);
    }
  }

  toggleTheme() {
    // Switch theme
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    
    // Apply new theme
    this.applyTheme(this.currentTheme);
    
    // Save preference
    localStorage.setItem('taskjuggler-theme', this.currentTheme);
    
    // Update status
    if (typeof updateStatus === 'function') {
      updateStatus(`Switched to ${this.currentTheme} mode`);
    }
  }

  render() {
    const icon = this.currentTheme === 'dark' ? '☀️' : '🌙';
    const title = this.currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    
    return html`
      <button 
        class="theme-toggle" 
        @click=${this.toggleTheme}
        title=${title}
        aria-label=${title}
      >
        <span>${icon}</span>
      </button>
    `;
  }

  // Public API methods
  getTheme() {
    return this.currentTheme;
  }

  setTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      this.currentTheme = theme;
      this.applyTheme(theme);
      localStorage.setItem('taskjuggler-theme', theme);
    }
  }
}

// Register the custom element
customElements.define('theme-manager', ThemeManager);

console.log('✅ theme-manager Web Component defined');