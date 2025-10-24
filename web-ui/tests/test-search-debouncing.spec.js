/**
 * Search Debouncing Performance Tests
 *
 * Tests for performSearchDebounced() function behavior:
 * - MIN_SEARCH_LENGTH threshold enforcement
 * - Debouncing timer cancellation on rapid typing
 * - Null/undefined input handling
 * - Performance characteristics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performSearchDebounced } from '../src/js/palette/palette-search.js';
import { SEARCH } from '../src/js/config.js';

describe('Search Debouncing', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('should enforce MIN_SEARCH_LENGTH threshold (2 chars)', () => {
        const callback = vi.fn();

        // 0 chars - should return empty immediately
        performSearchDebounced('', callback);
        expect(callback).toHaveBeenCalledWith([]);
        expect(callback).toHaveBeenCalledTimes(1);

        callback.mockClear();

        // 1 char - should return empty immediately
        performSearchDebounced('a', callback);
        expect(callback).toHaveBeenCalledWith([]);
        expect(callback).toHaveBeenCalledTimes(1);

        callback.mockClear();

        // 2 chars - should debounce and search after delay
        performSearchDebounced('ab', callback);
        expect(callback).not.toHaveBeenCalled();  // Not called immediately

        vi.advanceTimersByTime(SEARCH.DEBOUNCE_DELAY);
        expect(callback).toHaveBeenCalledTimes(1);  // Called after delay
    });

    it('should debounce rapid typing (cancel previous timers)', () => {
        const callback = vi.fn();

        // Simulate rapid typing: "t" -> "te" -> "tes" -> "test"
        performSearchDebounced('te', callback);
        vi.advanceTimersByTime(50);  // Only 50ms elapsed

        performSearchDebounced('tes', callback);
        vi.advanceTimersByTime(50);  // Another 50ms

        performSearchDebounced('test', callback);
        vi.advanceTimersByTime(50);  // Another 50ms

        // Still haven't reached full DEBOUNCE_DELAY (150ms)
        expect(callback).not.toHaveBeenCalled();

        // Now advance to complete the final debounce delay
        vi.advanceTimersByTime(SEARCH.DEBOUNCE_DELAY);

        // Should only be called ONCE with final search term
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle null input safely (critical bug fix)', () => {
        const callback = vi.fn();

        // Null input - should not throw, should return empty
        expect(() => {
            performSearchDebounced(null, callback);
        }).not.toThrow();

        expect(callback).toHaveBeenCalledWith([]);
        expect(callback).toHaveBeenCalledTimes(1);

        callback.mockClear();

        // Undefined input - should not throw, should return empty
        expect(() => {
            performSearchDebounced(undefined, callback);
        }).not.toThrow();

        expect(callback).toHaveBeenCalledWith([]);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle whitespace-only input correctly', () => {
        const callback = vi.fn();

        // Whitespace only: "  " (2 spaces after trim = 0 length)
        performSearchDebounced('  ', callback);
        expect(callback).toHaveBeenCalledWith([]);

        callback.mockClear();

        // Whitespace with text: "  ab  " (trims to "ab" = 2 chars)
        performSearchDebounced('  ab  ', callback);
        expect(callback).not.toHaveBeenCalled();  // Should debounce

        vi.advanceTimersByTime(SEARCH.DEBOUNCE_DELAY);
        expect(callback).toHaveBeenCalledTimes(1);  // Should search
    });

    it('should use correct DEBOUNCE_DELAY from config (150ms)', () => {
        const callback = vi.fn();

        performSearchDebounced('test', callback);

        // Before 150ms - not called
        vi.advanceTimersByTime(149);
        expect(callback).not.toHaveBeenCalled();

        // After 150ms - called
        vi.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should verify MIN_SEARCH_LENGTH is 2 from config', () => {
        // Verify config constant matches expected value
        expect(SEARCH.MIN_SEARCH_LENGTH).toBe(2);

        const callback = vi.fn();

        // Test exactly at threshold boundary
        performSearchDebounced('ab', callback);  // Exactly 2 chars
        expect(callback).not.toHaveBeenCalled();  // Should debounce, not reject

        vi.advanceTimersByTime(SEARCH.DEBOUNCE_DELAY);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle deletion back below threshold', () => {
        const callback = vi.fn();

        // Type "test" (4 chars)
        performSearchDebounced('test', callback);
        vi.advanceTimersByTime(SEARCH.DEBOUNCE_DELAY);
        expect(callback).toHaveBeenCalledTimes(1);

        callback.mockClear();

        // Delete to "t" (1 char) - below threshold
        performSearchDebounced('t', callback);
        expect(callback).toHaveBeenCalledWith([]);  // Immediately returns empty
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not leak memory from uncancelled timers', () => {
        const callback = vi.fn();

        // Create 100 rapid searches (simulating aggressive typing)
        for (let i = 0; i < 100; i++) {
            performSearchDebounced(`test${i}`, callback);
            vi.advanceTimersByTime(10);  // 10ms between each
        }

        // Only the LAST search should execute
        vi.advanceTimersByTime(SEARCH.DEBOUNCE_DELAY);
        expect(callback).toHaveBeenCalledTimes(1);

        // Verify no pending timers
        expect(vi.getTimerCount()).toBe(0);
    });
});
