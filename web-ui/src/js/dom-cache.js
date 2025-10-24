/**
 * DOM Cache Module
 *
 * Caches frequently accessed DOM elements in module scope to reduce
 * repeated document.getElementById() and document.querySelector() calls.
 *
 * Performance Impact:
 * - Eliminates O(n) DOM tree traversal on every query
 * - Reduces from multiple queries per interaction to single cached reference
 * - Especially beneficial for elements accessed in polling loops or event handlers
 *
 * @module dom-cache
 */

/**
 * Cached DOM element references
 * Initialized on first access via getter functions
 */
let cachedElements = {
  ganttContainer: null,
  searchInput: null,
  keyboardHelp: null,
  activeFilters: null,
  filterDescription: null,
};

/**
 * Get the gantt container element (#gantt_here)
 * Frequently accessed in keyboard state detection and focus management
 *
 * @returns {HTMLElement|null} The gantt container element
 */
export function getGanttContainer() {
  if (!cachedElements.ganttContainer) {
    cachedElements.ganttContainer = document.getElementById('gantt_here');
  }
  return cachedElements.ganttContainer;
}

/**
 * Get the search input element (#searchInput)
 * Frequently accessed in keyboard state detection and search operations
 *
 * @returns {HTMLInputElement|null} The search input element
 */
export function getSearchInput() {
  if (!cachedElements.searchInput) {
    cachedElements.searchInput = document.getElementById('searchInput');
  }
  return cachedElements.searchInput;
}

/**
 * Get the keyboard help element (keyboard-help)
 * Accessed in keyboard state detection to determine if help is open
 *
 * @returns {HTMLElement|null} The keyboard help custom element
 */
export function getKeyboardHelp() {
  if (!cachedElements.keyboardHelp) {
    cachedElements.keyboardHelp = document.querySelector('keyboard-help');
  }
  return cachedElements.keyboardHelp;
}

/**
 * Get the active filters display element (#activeFilters)
 * Accessed when updating filter UI
 *
 * @returns {HTMLElement|null} The active filters display element
 */
export function getActiveFilters() {
  if (!cachedElements.activeFilters) {
    cachedElements.activeFilters = document.getElementById('activeFilters');
  }
  return cachedElements.activeFilters;
}

/**
 * Get the filter description element (#filterDescription)
 * Accessed when updating filter UI
 *
 * @returns {HTMLElement|null} The filter description element
 */
export function getFilterDescription() {
  if (!cachedElements.filterDescription) {
    cachedElements.filterDescription = document.getElementById('filterDescription');
  }
  return cachedElements.filterDescription;
}

/**
 * Invalidate all cached DOM elements
 * Call this when the DOM structure changes (e.g., after page navigation,
 * full reload, or dynamic element removal/recreation)
 */
export function invalidateCache() {
  cachedElements = {
    ganttContainer: null,
    searchInput: null,
    keyboardHelp: null,
    activeFilters: null,
    filterDescription: null,
  };
}

// ========================
// Automatic Invalidation
// ========================

/**
 * MutationObserver instance for automatic cache invalidation
 * Watches for DOM changes that might affect cached elements
 */
let mutationObserver = null;

/**
 * Flag to track if automatic invalidation is enabled
 */
let autoInvalidationEnabled = false;

/**
 * Flag to track if invalidation triggers have been registered
 * Prevents duplicate event listener registration
 */
let triggersRegistered = false;

/**
 * Enable automatic cache invalidation using MutationObserver
 *
 * This monitors the DOM for:
 * - Element removal (cached elements deleted from DOM)
 * - Attribute changes on cached elements
 * - Child list changes in parent containers
 *
 * Call this after initial page load to enable automatic cache management.
 */
export function enableAutoInvalidation() {
  if (autoInvalidationEnabled) {
    return; // Already enabled
  }

  // Guard: Ensure DOM is ready before observing
  if (!document.body) {
    console.warn('[DOM Cache] Cannot enable auto-invalidation: document.body not available');
    return;
  }

  // Create mutation observer to watch for DOM changes
  mutationObserver = new MutationObserver((mutations) => {
    let shouldInvalidate = false;

    for (const mutation of mutations) {
      // Check if any cached element was removed
      if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
        for (const node of mutation.removedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if removed node IS any of our cached elements
            if (
              node === cachedElements.ganttContainer ||
              node === cachedElements.searchInput ||
              node === cachedElements.keyboardHelp ||
              node === cachedElements.activeFilters ||
              node === cachedElements.filterDescription ||
              node.id === 'gantt_here' ||
              node.id === 'searchInput' ||
              node.id === 'activeFilters' ||
              node.id === 'filterDescription' ||
              node.tagName === 'KEYBOARD-HELP'
            ) {
              shouldInvalidate = true;
              break;
            }

            // Also check if removed node CONTAINS any of our cached elements (subtree removal)
            if (
              (cachedElements.ganttContainer && node.contains(cachedElements.ganttContainer)) ||
              (cachedElements.searchInput && node.contains(cachedElements.searchInput)) ||
              (cachedElements.keyboardHelp && node.contains(cachedElements.keyboardHelp)) ||
              (cachedElements.activeFilters && node.contains(cachedElements.activeFilters)) ||
              (cachedElements.filterDescription && node.contains(cachedElements.filterDescription))
            ) {
              shouldInvalidate = true;
              break;
            }
          }
        }
      }
    }

    if (shouldInvalidate) {
      console.log('[DOM Cache] Detected DOM mutation, invalidating cache');
      invalidateCache();
    }
  });

  // Observe the entire document body for changes
  mutationObserver.observe(document.body, {
    childList: true,    // Watch for added/removed elements
    subtree: true,      // Watch all descendants
    attributes: false,  // Don't watch attribute changes (too noisy)
    characterData: false // Don't watch text changes (too noisy)
  });

  autoInvalidationEnabled = true;
  console.log('[DOM Cache] Auto-invalidation enabled');
}

/**
 * Disable automatic cache invalidation
 * Call this during cleanup or if you want manual control
 */
export function disableAutoInvalidation() {
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  autoInvalidationEnabled = false;
  console.log('[DOM Cache] Auto-invalidation disabled');
}

/**
 * Register event-based invalidation triggers
 * These handle specific application events that require cache invalidation
 *
 * This function is idempotent - calling it multiple times is safe
 */
export function registerInvalidationTriggers() {
  // Idempotence guard - prevent duplicate registration
  if (triggersRegistered) {
    console.warn('[DOM Cache] Invalidation triggers already registered');
    return;
  }

  // Invalidate cache on page visibility changes (e.g., tab switch, reload)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Page became visible again - invalidate to ensure fresh references
      console.log('[DOM Cache] Page visible, invalidating cache');
      invalidateCache();
    }
  });

  // Invalidate cache before page unload (cleanup)
  window.addEventListener('beforeunload', () => {
    invalidateCache();
    disableAutoInvalidation();
  });

  triggersRegistered = true;
  console.log('[DOM Cache] Invalidation triggers registered');
}

/**
 * Invalidate a specific cached element
 * Useful when you know only one element has changed
 *
 * @param {string} elementName - Name of the cached element to invalidate
 *   Valid names: 'ganttContainer', 'searchInput', 'keyboardHelp',
 *                'activeFilters', 'filterDescription'
 */
export function invalidateElement(elementName) {
  if (elementName in cachedElements) {
    cachedElements[elementName] = null;
  }
}

/**
 * Check if cache is initialized
 * Useful for testing and debugging
 *
 * @returns {boolean} True if at least one element is cached
 */
export function isCacheInitialized() {
  return Object.values(cachedElements).some(el => el !== null);
}

/**
 * Get cache statistics
 * Useful for performance monitoring and debugging
 *
 * @returns {Object} Object with cache statistics
 */
export function getCacheStats() {
  const stats = {};
  for (const [key, value] of Object.entries(cachedElements)) {
    stats[key] = value !== null ? 'cached' : 'not cached';
  }
  return stats;
}

/**
 * Reset internal state for testing
 * This function should ONLY be called from unit tests
 * @private
 */
export function _resetForTesting() {
  triggersRegistered = false;
  autoInvalidationEnabled = false;
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
}
