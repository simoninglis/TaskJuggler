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
 * Cache Invalidation Strategy:
 * - Uses lightweight isConnected checks instead of heavy MutationObserver
 * - Automatically re-queries if cached element is no longer in DOM
 * - Manual invalidation available via invalidateCache() or invalidateElement()
 * - Event-based invalidation on page visibility changes
 *
 * @module dom-cache
 */

/**
 * Debug mode flag - set to true to enable console logging
 * @type {boolean}
 */
const DEBUG = false;

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
  // Check if cached element is still connected to DOM
  if (cachedElements.ganttContainer && !cachedElements.ganttContainer.isConnected) {
    if (DEBUG) console.log('[DOM Cache] ganttContainer disconnected, invalidating');
    cachedElements.ganttContainer = null;
  }

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
  // Check if cached element is still connected to DOM
  if (cachedElements.searchInput && !cachedElements.searchInput.isConnected) {
    if (DEBUG) console.log('[DOM Cache] searchInput disconnected, invalidating');
    cachedElements.searchInput = null;
  }

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
  // Check if cached element is still connected to DOM
  if (cachedElements.keyboardHelp && !cachedElements.keyboardHelp.isConnected) {
    if (DEBUG) console.log('[DOM Cache] keyboardHelp disconnected, invalidating');
    cachedElements.keyboardHelp = null;
  }

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
  // Check if cached element is still connected to DOM
  if (cachedElements.activeFilters && !cachedElements.activeFilters.isConnected) {
    if (DEBUG) console.log('[DOM Cache] activeFilters disconnected, invalidating');
    cachedElements.activeFilters = null;
  }

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
  // Check if cached element is still connected to DOM
  if (cachedElements.filterDescription && !cachedElements.filterDescription.isConnected) {
    if (DEBUG) console.log('[DOM Cache] filterDescription disconnected, invalidating');
    cachedElements.filterDescription = null;
  }

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
  if (DEBUG) console.log('[DOM Cache] Cache invalidated');
}

// ========================
// Event-Based Invalidation
// ========================

/**
 * Flag to track if invalidation triggers have been registered
 * Prevents duplicate event listener registration
 */
let triggersRegistered = false;

/**
 * Event handler references stored at module level
 * Required for proper cleanup in _resetForTesting()
 */
let visibilityChangeHandler = null;
let beforeUnloadHandler = null;

/**
 * Register event-based invalidation triggers
 * These handle specific application events that require cache invalidation
 *
 * This function is idempotent - calling it multiple times is safe
 */
export function registerInvalidationTriggers() {
  // Idempotence guard - prevent duplicate registration
  if (triggersRegistered) {
    if (DEBUG) console.warn('[DOM Cache] Invalidation triggers already registered');
    return;
  }

  // Create handler functions and store references for cleanup
  visibilityChangeHandler = () => {
    if (!document.hidden) {
      // Page became visible again - invalidate to ensure fresh references
      if (DEBUG) console.log('[DOM Cache] Page visible, invalidating cache');
      invalidateCache();
    }
  };

  beforeUnloadHandler = () => {
    invalidateCache();
  };

  // Invalidate cache on page visibility changes (e.g., tab switch, reload)
  document.addEventListener('visibilitychange', visibilityChangeHandler);

  // Invalidate cache before page unload (cleanup)
  window.addEventListener('beforeunload', beforeUnloadHandler);

  triggersRegistered = true;
  if (DEBUG) console.log('[DOM Cache] Invalidation triggers registered');
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
  // Remove event listeners if they were registered
  if (triggersRegistered) {
    if (visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', visibilityChangeHandler);
      visibilityChangeHandler = null;
    }
    if (beforeUnloadHandler) {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      beforeUnloadHandler = null;
    }
  }

  // Reset flags
  triggersRegistered = false;

  // Clear cache
  invalidateCache();
}
