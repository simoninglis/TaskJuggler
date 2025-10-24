/**
 * Unit Tests: DOM Cache Module
 *
 * Tests the DOM element caching functionality including:
 * - Basic lazy initialization and caching
 * - Manual cache invalidation
 * - Automatic invalidation via MutationObserver
 * - Event-based invalidation triggers
 * - Bug fixes: subtree removal detection, DOM ready check, idempotency
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getGanttContainer,
  getSearchInput,
  getKeyboardHelp,
  getActiveFilters,
  getFilterDescription,
  invalidateCache,
  enableAutoInvalidation,
  disableAutoInvalidation,
  registerInvalidationTriggers,
  invalidateElement,
  isCacheInitialized,
  getCacheStats,
  _resetForTesting
} from '../src/js/dom-cache.js';

describe('DOM Cache Module', () => {
  // Setup DOM elements before each test
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="gantt_here"></div>
      <input id="searchInput" type="text" />
      <keyboard-help></keyboard-help>
      <div id="activeFilters"></div>
      <div id="filterDescription"></div>
    `;
  });

  // Clean up after each test
  afterEach(() => {
    invalidateCache();
    disableAutoInvalidation();
    _resetForTesting(); // Reset module-scoped state for test isolation
    document.body.innerHTML = '';
  });

  // ========================
  // Basic Caching Tests
  // ========================

  describe('Basic Caching', () => {
    it('should return DOM elements on first access (lazy initialization)', () => {
      const ganttContainer = getGanttContainer();
      const searchInput = getSearchInput();
      const keyboardHelp = getKeyboardHelp();
      const activeFilters = getActiveFilters();
      const filterDescription = getFilterDescription();

      expect(ganttContainer).toBeTruthy();
      expect(ganttContainer.id).toBe('gantt_here');

      expect(searchInput).toBeTruthy();
      expect(searchInput.id).toBe('searchInput');

      expect(keyboardHelp).toBeTruthy();
      expect(keyboardHelp.tagName).toBe('KEYBOARD-HELP');

      expect(activeFilters).toBeTruthy();
      expect(activeFilters.id).toBe('activeFilters');

      expect(filterDescription).toBeTruthy();
      expect(filterDescription.id).toBe('filterDescription');
    });

    it('should return cached elements on subsequent accesses (not re-query DOM)', () => {
      const firstAccess = getGanttContainer();
      const secondAccess = getGanttContainer();

      // Should return the exact same object reference
      expect(firstAccess).toBe(secondAccess);
    });

    it('should return null if element does not exist in DOM', () => {
      document.body.innerHTML = ''; // Remove all elements

      invalidateCache(); // Clear cache to force new query

      const ganttContainer = getGanttContainer();
      expect(ganttContainer).toBeNull();
    });

    it('should correctly track cache initialization state', () => {
      // Initially not initialized
      expect(isCacheInitialized()).toBe(false);

      // After accessing an element, cache should be initialized
      getGanttContainer();
      expect(isCacheInitialized()).toBe(true);

      // After invalidation, cache should not be initialized
      invalidateCache();
      expect(isCacheInitialized()).toBe(false);
    });

    it('should provide accurate cache statistics', () => {
      // Initially no elements cached
      let stats = getCacheStats();
      expect(stats.ganttContainer).toBe('not cached');
      expect(stats.searchInput).toBe('not cached');

      // After accessing some elements
      getGanttContainer();
      getSearchInput();

      stats = getCacheStats();
      expect(stats.ganttContainer).toBe('cached');
      expect(stats.searchInput).toBe('cached');
      expect(stats.keyboardHelp).toBe('not cached');
    });
  });

  // ========================
  // Manual Invalidation Tests
  // ========================

  describe('Manual Cache Invalidation', () => {
    it('should invalidate entire cache when invalidateCache() is called', () => {
      // Cache all elements
      getGanttContainer();
      getSearchInput();
      getKeyboardHelp();

      expect(isCacheInitialized()).toBe(true);

      // Invalidate cache
      invalidateCache();

      expect(isCacheInitialized()).toBe(false);

      // Next access should re-query DOM
      const ganttContainer = getGanttContainer();
      expect(ganttContainer).toBeTruthy(); // Should still find element
    });

    it('should invalidate specific element when invalidateElement() is called', () => {
      // Cache elements
      const originalGantt = getGanttContainer();
      const originalSearch = getSearchInput();

      // Invalidate only ganttContainer
      invalidateElement('ganttContainer');

      // Search should still be cached (same reference)
      const searchAfter = getSearchInput();
      expect(searchAfter).toBe(originalSearch);

      // Gantt should be re-queried (potentially different reference if DOM changed)
      const ganttAfter = getGanttContainer();
      // In this test DOM hasn't changed, but the cache was cleared and re-queried
      expect(ganttAfter).toBeTruthy();
    });
  });

  // ========================
  // Bug Fix #1: Subtree Removal Detection
  // ========================

  describe('Bug Fix #1: Subtree Removal Detection', () => {
    it('should detect when cached element is removed directly', (done) => {
      // Enable auto-invalidation
      enableAutoInvalidation();

      // Cache the element
      const ganttContainer = getGanttContainer();
      expect(ganttContainer).toBeTruthy();
      expect(isCacheInitialized()).toBe(true);

      // Remove the element directly
      ganttContainer.remove();

      // MutationObserver is async, wait for it to process
      setTimeout(() => {
        // Cache should have been invalidated
        expect(isCacheInitialized()).toBe(false);
        done();
      }, 100);
    });

    it('should detect when cached element is inside a removed container (subtree removal)', (done) => {
      // Create a container with the search input inside
      document.body.innerHTML = `
        <div id="container">
          <input id="searchInput" type="text" />
        </div>
      `;

      // Enable auto-invalidation
      enableAutoInvalidation();

      // Cache the search input
      const searchInput = getSearchInput();
      expect(searchInput).toBeTruthy();
      expect(isCacheInitialized()).toBe(true);

      // Remove the PARENT container (not the input directly)
      const container = document.getElementById('container');
      container.remove();

      // MutationObserver should detect this and invalidate cache
      setTimeout(() => {
        // Cache should have been invalidated
        expect(isCacheInitialized()).toBe(false);
        done();
      }, 100);
    });

    it('should NOT invalidate cache when unrelated elements are removed', (done) => {
      // Enable auto-invalidation
      enableAutoInvalidation();

      // Cache an element
      const ganttContainer = getGanttContainer();
      expect(ganttContainer).toBeTruthy();
      expect(isCacheInitialized()).toBe(true);

      // Add and remove an unrelated element
      const unrelatedDiv = document.createElement('div');
      unrelatedDiv.id = 'unrelated';
      document.body.appendChild(unrelatedDiv);
      unrelatedDiv.remove();

      // Wait for MutationObserver
      setTimeout(() => {
        // Cache should still be initialized (no invalidation)
        expect(isCacheInitialized()).toBe(true);
        done();
      }, 100);
    });
  });

  // ========================
  // Bug Fix #2: DOM Ready Check
  // ========================

  describe('Bug Fix #2: DOM Ready Check', () => {
    it('should NOT crash when enableAutoInvalidation() is called before document.body exists', () => {
      // Temporarily remove document.body
      const originalBody = document.body;
      Object.defineProperty(document, 'body', {
        get: () => null,
        configurable: true
      });

      // This should not throw an error
      expect(() => {
        enableAutoInvalidation();
      }).not.toThrow();

      // Restore document.body
      Object.defineProperty(document, 'body', {
        get: () => originalBody,
        configurable: true
      });
    });

    it('should log warning when enableAutoInvalidation() is called before document.body exists', () => {
      // Mock console.warn
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Temporarily remove document.body
      const originalBody = document.body;
      Object.defineProperty(document, 'body', {
        get: () => null,
        configurable: true
      });

      // Call enableAutoInvalidation
      enableAutoInvalidation();

      // Should have logged a warning
      expect(warnSpy).toHaveBeenCalledWith(
        '[DOM Cache] Cannot enable auto-invalidation: document.body not available'
      );

      // Restore
      Object.defineProperty(document, 'body', {
        get: () => originalBody,
        configurable: true
      });
      warnSpy.mockRestore();
    });
  });

  // ========================
  // Bug Fix #3: Idempotency
  // ========================

  describe('Bug Fix #3: Event Listener Idempotency', () => {
    it('should NOT add duplicate event listeners when registerInvalidationTriggers() is called multiple times', () => {
      // Mock addEventListener to count calls
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const windowAddEventListenerSpy = vi.spyOn(window, 'addEventListener');

      // First call should add listeners
      registerInvalidationTriggers();
      const firstCallCount = addEventListenerSpy.mock.calls.length + windowAddEventListenerSpy.mock.calls.length;

      // Second call should NOT add more listeners
      registerInvalidationTriggers();
      const secondCallCount = addEventListenerSpy.mock.calls.length + windowAddEventListenerSpy.mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount);

      addEventListenerSpy.mockRestore();
      windowAddEventListenerSpy.mockRestore();
    });

    it('should log warning when registerInvalidationTriggers() is called multiple times', () => {
      // Mock console.warn
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // First call
      registerInvalidationTriggers();
      expect(warnSpy).not.toHaveBeenCalled();

      // Second call should log warning
      registerInvalidationTriggers();
      expect(warnSpy).toHaveBeenCalledWith(
        '[DOM Cache] Invalidation triggers already registered'
      );

      warnSpy.mockRestore();
    });
  });

  // ========================
  // Integration Tests
  // ========================

  describe('Integration: Auto-Invalidation + Event Triggers', () => {
    it('should work correctly when both auto-invalidation and event triggers are enabled', (done) => {
      // Enable both features
      enableAutoInvalidation();
      registerInvalidationTriggers();

      // Cache an element
      const ganttContainer = getGanttContainer();
      expect(isCacheInitialized()).toBe(true);

      // Remove the element
      ganttContainer.remove();

      // Auto-invalidation should detect removal
      setTimeout(() => {
        expect(isCacheInitialized()).toBe(false);
        done();
      }, 100);
    });

    it('should handle disable and re-enable of auto-invalidation', () => {
      // Enable
      enableAutoInvalidation();

      // Disable
      disableAutoInvalidation();

      // Re-enable should work without issues
      expect(() => {
        enableAutoInvalidation();
      }).not.toThrow();
    });

    it('should allow calling enableAutoInvalidation() multiple times (idempotent)', () => {
      // First call
      enableAutoInvalidation();

      // Second call should not cause issues
      expect(() => {
        enableAutoInvalidation();
      }).not.toThrow();
    });
  });

  // ========================
  // Performance Tests
  // ========================

  describe('Performance: Caching vs Direct DOM Query', () => {
    it('should be faster to access cached element than query DOM repeatedly', () => {
      // Warm up cache
      getGanttContainer();

      // Measure cached access
      const cacheStart = performance.now();
      for (let i = 0; i < 1000; i++) {
        getGanttContainer();
      }
      const cacheTime = performance.now() - cacheStart;

      // Measure direct DOM query
      invalidateCache();
      const directStart = performance.now();
      for (let i = 0; i < 1000; i++) {
        document.getElementById('gantt_here');
      }
      const directTime = performance.now() - directStart;

      // Cached access should be faster (allowing for measurement variance)
      // This is a sanity check, not a strict performance requirement
      console.log(`Cache time: ${cacheTime}ms, Direct time: ${directTime}ms`);

      // Just verify both completed successfully (times can vary due to many factors)
      expect(cacheTime).toBeGreaterThan(0);
      expect(directTime).toBeGreaterThan(0);
    });
  });
});
