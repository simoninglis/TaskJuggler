import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataWatcher } from '../src/js/data-watcher.js';

describe('Fix #3: Memory Leak - DataWatcher Duplicate Intervals', () => {
  let dataWatcher;

  beforeEach(() => {
    dataWatcher = new DataWatcher();
    vi.clearAllTimers();
  });

  it('should clear existing interval when start() is called twice', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    // Mock the checkForUpdates method
    dataWatcher.checkForUpdates = vi.fn();

    // Start the watcher
    dataWatcher.start();
    const firstInterval = dataWatcher.intervalId;

    // Start again - should stop the first one
    dataWatcher.start();
    const secondInterval = dataWatcher.intervalId;

    // The first interval should have been cleared
    expect(clearIntervalSpy).toHaveBeenCalledWith(firstInterval);

    // Only one interval should be active
    expect(secondInterval).not.toBe(firstInterval);

    dataWatcher.stop();
    clearIntervalSpy.mockRestore();
  });

  it('should not create duplicate intervals', () => {
    // Mock the checkForUpdates method
    dataWatcher.checkForUpdates = vi.fn();

    // Start multiple times
    dataWatcher.start();
    const firstId = dataWatcher.intervalId;

    dataWatcher.start();
    const secondId = dataWatcher.intervalId;

    dataWatcher.start();
    const thirdId = dataWatcher.intervalId;

    // Only the latest interval ID should be stored
    expect(dataWatcher.intervalId).toBe(thirdId);
    expect(dataWatcher.intervalId).not.toBe(firstId);

    dataWatcher.stop();
  });

  it('should stop interval correctly', () => {
    dataWatcher.checkForUpdates = vi.fn();

    dataWatcher.start();
    expect(dataWatcher.intervalId).not.toBeNull();

    dataWatcher.stop();
    expect(dataWatcher.intervalId).toBeNull();
  });

  it('should handle stop() when no interval is running', () => {
    // Should not throw error
    expect(() => dataWatcher.stop()).not.toThrow();
    expect(dataWatcher.intervalId).toBeNull();
  });

  it('should call stop() before starting new interval', () => {
    const stopSpy = vi.spyOn(dataWatcher, 'stop');
    dataWatcher.checkForUpdates = vi.fn();

    dataWatcher.start();

    // stop() should have been called at the beginning of start()
    expect(stopSpy).toHaveBeenCalled();

    stopSpy.mockRestore();
    dataWatcher.stop();
  });
});
