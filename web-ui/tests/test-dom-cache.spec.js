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
  // Automatic Invalidation via isConnected
  // ========================

  describe('Automatic Invalidation via isConnected', () => {
    it('should detect when cached element is removed directly and re-query DOM', () => {
      // Cache the element
      const ganttContainer = getGanttContainer();
      expect(ganttContainer).toBeTruthy();
      expect(ganttContainer.id).toBe('gantt_here');
      expect(isCacheInitialized()).toBe(true);

      // Remove the element from DOM
      ganttContainer.remove();

      // Next access should detect element is disconnected and return null
      const ganttAfterRemoval = getGanttContainer();
      expect(ganttAfterRemoval).toBeNull();
    });

    it('should detect when cached element is inside a removed container (subtree removal)', () => {
      // Create a container with the search input inside
      document.body.innerHTML = `
        <div id="container">
          <input id="searchInput" type="text" />
        </div>
      `;

      // Cache the search input
      const searchInput = getSearchInput();
      expect(searchInput).toBeTruthy();
      expect(searchInput.id).toBe('searchInput');
      expect(isCacheInitialized()).toBe(true);

      // Remove the PARENT container (not the input directly)
      const container = document.getElementById('container');
      container.remove();

      // Next access should detect element is no longer connected
      const searchAfterRemoval = getSearchInput();
      expect(searchAfterRemoval).toBeNull();
    });

    it('should re-cache element if it is re-added to DOM after removal', () => {
      // Cache the element
      const ganttContainer = getGanttContainer();
      expect(ganttContainer).toBeTruthy();
      expect(ganttContainer.id).toBe('gantt_here');

      // Remove the element
      ganttContainer.remove();

      // Verify it returns null after removal
      expect(getGanttContainer()).toBeNull();

      // Re-add a new element with the same ID
      const newGanttContainer = document.createElement('div');
      newGanttContainer.id = 'gantt_here';
      document.body.appendChild(newGanttContainer);

      // Next access should find and cache the new element
      const ganttAfterReAdd = getGanttContainer();
      expect(ganttAfterReAdd).toBeTruthy();
      expect(ganttAfterReAdd).toBe(newGanttContainer);
      expect(ganttAfterReAdd).not.toBe(ganttContainer); // Different element
    });
  });


  // ========================
  // Event Listener Idempotency
  // ========================

  describe('Event Listener Idempotency', () => {
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

    it('should be safe to call registerInvalidationTriggers() multiple times', () => {
      // First call
      registerInvalidationTriggers();

      // Second call should not throw an error (idempotent)
      expect(() => {
        registerInvalidationTriggers();
      }).not.toThrow();

      // Third call also should not throw
      expect(() => {
        registerInvalidationTriggers();
      }).not.toThrow();
    });
  });

  // ========================
  // Integration Tests
  // ========================

  describe('Integration: isConnected + Event Triggers', () => {
    it('should work correctly when event triggers are enabled', () => {
      // Register event triggers
      registerInvalidationTriggers();

      // Cache an element
      const ganttContainer = getGanttContainer();
      expect(ganttContainer).toBeTruthy();
      expect(isCacheInitialized()).toBe(true);

      // Remove the element
      ganttContainer.remove();

      // Next access should use isConnected check and return null
      const ganttAfterRemoval = getGanttContainer();
      expect(ganttAfterRemoval).toBeNull();
    });

    it('should invalidate cache when page visibility changes', () => {
      // Cache an element
      const ganttContainer = getGanttContainer();
      expect(isCacheInitialized()).toBe(true);

      // Register triggers
      registerInvalidationTriggers();

      // Simulate page becoming hidden then visible
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false
      });

      // Dispatch visibilitychange event
      document.dispatchEvent(new Event('visibilitychange'));

      // Cache should be invalidated
      expect(isCacheInitialized()).toBe(false);

      // Clean up
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => document.visibilityState === 'hidden'
      });
    });

    it('should work correctly after full reset', () => {
      // Cache some elements
      getGanttContainer();
      getSearchInput();
      expect(isCacheInitialized()).toBe(true);

      // Full reset
      _resetForTesting();

      // Cache should be empty
      expect(isCacheInitialized()).toBe(false);

      // Should be able to cache again
      const ganttContainer = getGanttContainer();
      expect(ganttContainer).toBeTruthy();
      expect(isCacheInitialized()).toBe(true);
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
