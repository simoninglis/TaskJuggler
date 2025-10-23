import { LitElement, html, css } from 'lit';

export class LayoutManager extends LitElement {
  static properties = {
    statusCollapsed: { type: Boolean, state: true },
    fullscreenMode: { type: Boolean, state: true },
    windowWidth: { type: Number, state: true },
    windowHeight: { type: Number, state: true }
  };

  static styles = css`
    :host {
      display: none; /* Layout manager doesn't render anything visible */
    }
  `;

  constructor() {
    super();
    this.statusCollapsed = false;
    this.fullscreenMode = false;
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;
    this.resizeTimeout = null;
    this.boundHandleResize = this.handleResize.bind(this);
    this.boundHandleFullscreenChange = this.handleFullscreenChange.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    
    // Load saved preferences
    this.loadPreferences();
    
    // Set initial layout
    this.updateLayout();
    
    // Register event handlers
    window.addEventListener('resize', this.boundHandleResize);
    document.addEventListener('fullscreenchange', this.boundHandleFullscreenChange);
    
    // Initial resize to set proper dimensions
    setTimeout(() => {
      this.handleResize();
    }, 100);
    
    console.log('✅ LayoutManager Web Component initialized');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    
    // Clean up event listeners
    window.removeEventListener('resize', this.boundHandleResize);
    document.removeEventListener('fullscreenchange', this.boundHandleFullscreenChange);
    
    // Clear timeout if any
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }

  loadPreferences() {
    // Load status collapsed state
    const savedStatusState = localStorage.getItem('taskjuggler-status-collapsed');
    if (savedStatusState === 'true') {
      this.statusCollapsed = true;
      const statusSection = document.getElementById('statusSection');
      if (statusSection) {
        statusSection.classList.add('collapsed');
      }
    }
  }

  handleResize() {
    // Debounce resize events
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.windowWidth = window.innerWidth;
      this.windowHeight = window.innerHeight;
      
      if (window.debugLog) {
        window.debugLog('layout', 'Window resized', {
          width: this.windowWidth,
          height: this.windowHeight
        });
      }
      
      // Update layout calculations
      this.updateLayout();
      
      // Refresh gantt chart
      if (typeof gantt !== 'undefined' && gantt.render) {
        gantt.render();
        
        // Re-center on selected task if any
        const selectedId = gantt.getSelectedId();
        if (selectedId && gantt.isTaskExists(selectedId)) {
          setTimeout(() => {
            gantt.showTask(selectedId);
          }, 50);
        }
      }
      
      // Update status if needed
      if (typeof updateStatus === 'function') {
        updateStatus(`Layout updated (${this.windowWidth}x${this.windowHeight})`);
      }
      
      // Dispatch resize event
      this.dispatchEvent(new CustomEvent('layout-resized', {
        detail: {
          width: this.windowWidth,
          height: this.windowHeight
        },
        bubbles: true,
        composed: true
      }));
    }, 250); // Debounce for 250ms
  }

  updateLayout() {
    // Calculate available height for gantt
    const header = document.querySelector('.header');
    const statusSection = document.getElementById('statusSection');
    const mainContent = document.querySelector('.main-content');
    
    if (!header || !mainContent) return;
    
    const headerHeight = header.offsetHeight;
    const statusHeight = this.statusCollapsed ? 40 : (statusSection ? statusSection.offsetHeight : 0);
    const mainPadding = 20; // Total vertical padding
    
    // Calculate gantt container height
    const availableHeight = window.innerHeight - headerHeight - statusHeight - mainPadding;
    
    const ganttContainer = document.querySelector('.gantt-container');
    if (ganttContainer) {
      // Set a minimum height to keep it usable
      const minHeight = 300;
      const finalHeight = Math.max(availableHeight, minHeight);
      
      // Update CSS custom property for other components to use
      document.documentElement.style.setProperty('--gantt-height', `${finalHeight}px`);
    }
  }

  toggleStatus() {
    const statusSection = document.getElementById('statusSection');
    if (!statusSection) return;
    
    this.statusCollapsed = !this.statusCollapsed;
    statusSection.classList.toggle('collapsed');
    
    // Save preference
    localStorage.setItem('taskjuggler-status-collapsed', this.statusCollapsed);
    
    // Update layout after animation
    setTimeout(() => {
      this.handleResize();
    }, 350);
    
    if (window.debugLog) {
      window.debugLog('ui', 'Status section toggled', { collapsed: this.statusCollapsed });
    }
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('status-toggled', {
      detail: { collapsed: this.statusCollapsed },
      bubbles: true,
      composed: true
    }));
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error('Error exiting fullscreen:', err);
      });
    }
  }

  handleFullscreenChange() {
    this.fullscreenMode = !!document.fullscreenElement;
    document.body.classList.toggle('fullscreen', this.fullscreenMode);
    
    // Force resize after transition
    setTimeout(() => {
      this.handleResize();
    }, 100);
    
    if (typeof updateStatus === 'function') {
      updateStatus(this.fullscreenMode ? 'Entered fullscreen mode' : 'Exited fullscreen mode');
    }
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('fullscreen-changed', {
      detail: { fullscreen: this.fullscreenMode },
      bubbles: true,
      composed: true
    }));
  }

  // Public API
  getState() {
    return {
      statusCollapsed: this.statusCollapsed,
      fullscreenMode: this.fullscreenMode,
      windowWidth: this.windowWidth,
      windowHeight: this.windowHeight
    };
  }

  render() {
    // Layout manager doesn't render any visible content
    return html``;
  }
}

// Register the custom element
customElements.define('layout-manager', LayoutManager);

// Create global function for status toggle (called from HTML onclick)
window.toggleStatus = function() {
  const layoutManager = document.querySelector('layout-manager');
  if (layoutManager) {
    layoutManager.toggleStatus();
  }
};

console.log('✅ layout-manager Web Component defined');