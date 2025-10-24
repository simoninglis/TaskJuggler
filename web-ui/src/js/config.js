/**
 * Centralized Configuration Constants
 *
 * This module provides a single source of truth for all configuration values
 * used throughout the TaskJuggler Web UI application. Extracting these values
 * from inline magic numbers improves maintainability and makes it easier to
 * adjust timing, sizing, and other parameters without hunting through code.
 *
 * @module config
 */

/**
 * Keyboard-related timing and scroll configuration
 */
export const KEYBOARD = {
  /**
   * How often to poll keyboard state (milliseconds)
   * Used by KeyboardManager for state monitoring
   *
   * Optimized from 50ms (20 calls/sec) to 250ms (4 calls/sec)
   * This reduces polling frequency by 80% while event listeners
   * provide immediate responsiveness for focus changes.
   */
  STATE_CHECK_INTERVAL: 250,

  /**
   * Debounce delay for focus events (milliseconds)
   * Prevents excessive updates when focus changes rapidly
   */
  FOCUS_DEBOUNCE: 10,

  /**
   * Delay before refreshing gantt after keyboard action (milliseconds)
   */
  GANTT_REFRESH_DELAY: 10,

  /**
   * Minimum scroll amount (pixels)
   * Used when viewport is very small
   */
  MIN_SCROLL_AMOUNT: 10,

  /**
   * Default scroll amount for keyboard navigation (pixels)
   */
  DEFAULT_SCROLL_AMOUNT: 200,

  /**
   * Divisor for calculating scroll from viewport size
   * Actual scroll = viewport_height / SCROLL_VIEWPORT_DIVISOR
   */
  SCROLL_VIEWPORT_DIVISOR: 4,
};

/**
 * Data watcher configuration for file monitoring and auto-refresh
 */
export const DATA_WATCHER = {
  /**
   * Polling interval for checking file changes (milliseconds)
   */
  POLL_INTERVAL: 2000,

  /**
   * Debounce delay before reloading after file change (milliseconds)
   */
  RELOAD_DEBOUNCE: 100,
};

/**
 * Layout and responsive design breakpoints
 */
export const LAYOUT = {
  /**
   * Maximum width for mobile devices (pixels)
   * Below this: mobile layout
   */
  MOBILE_MAX: 768,

  /**
   * Maximum width for tablet devices (pixels)
   * Between MOBILE_MAX and this: tablet layout
   */
  TABLET_MAX: 1024,

  /**
   * Header height on desktop (pixels)
   */
  HEADER_HEIGHT_DESKTOP: 60,

  /**
   * Header height on mobile (pixels)
   */
  HEADER_HEIGHT_MOBILE: 50,
};

/**
 * Search and filtering configuration
 */
export const SEARCH = {
  /**
   * Debounce delay for search input (milliseconds)
   * Prevents excessive filtering while user is typing
   * Reduced from 300ms to 150ms for snappier feel
   */
  DEBOUNCE_DELAY: 150,

  /**
   * Minimum search length before triggering search (characters)
   * Don't search until 2+ characters are entered
   */
  MIN_SEARCH_LENGTH: 2,

  /**
   * Delay before focusing search input (milliseconds)
   */
  FOCUS_DELAY: 100,
};

/**
 * Gantt chart display configuration
 */
export const GANTT = {
  /**
   * Minimum column width for different zoom levels (pixels)
   * Prevents columns from becoming too narrow at high zoom
   */
  MIN_COLUMN_WIDTH: {
    hour: 30,
    day: 60,
    week: 60,
    month: 120,
    quarter: 90,
    year: 50,
  },

  /**
   * Maximum horizontal scroll position (pixels)
   * Prevents scrolling beyond reasonable bounds
   */
  MAX_SCROLL_X: 999999,
};

/**
 * Theme configuration
 */
export const THEME = {
  /**
   * LocalStorage key for storing theme preference
   */
  STORAGE_KEY: 'gantt-theme',

  /**
   * Default theme when none is set
   */
  DEFAULT: 'light',
};

/**
 * Default export provides all config categories as a single object
 * for convenience when importing multiple categories
 */
export default {
  KEYBOARD,
  DATA_WATCHER,
  LAYOUT,
  SEARCH,
  GANTT,
  THEME,
};
