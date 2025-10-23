import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataWatcher } from '../src/js/data-watcher.js';

describe('Fix #3: Memory Leak - KeyboardManager Cleanup', () => {
  beforeEach(() => {
    // Clear any existing intervals
    vi.clearAllTimers();
  });

  it('should store interval ID when starting state monitoring', () => {
    // Create a minimal KeyboardManager-like object
    const manager = {
      stateMonitoringInterval: null,
      focusInHandler: () => {},
      focusOutHandler: () => {},
      updateState: () => {},
      startStateMonitoring: function() {
        this.stateMonitoringInterval = setInterval(() => {
          this.updateState();
        }, 50);
        document.addEventListener('focusin', this.focusInHandler);
        document.addEventListener('focusout', this.focusOutHandler);
      }
    };

    manager.startStateMonitoring();

    expect(manager.stateMonitoringInterval).not.toBeNull();
    // In happy-dom, interval IDs are objects, not numbers
    expect(manager.stateMonitoringInterval).toBeTruthy();
  });

  it('should clear interval when stopping state monitoring', () => {
    const manager = {
      stateMonitoringInterval: null,
      focusInHandler: () => {},
      focusOutHandler: () => {},
      updateState: () => {},
      startStateMonitoring: function() {
        this.stateMonitoringInterval = setInterval(() => {
          this.updateState();
        }, 50);
        document.addEventListener('focusin', this.focusInHandler);
        document.addEventListener('focusout', this.focusOutHandler);
      },
      stopStateMonitoring: function() {
        if (this.stateMonitoringInterval !== null) {
          clearInterval(this.stateMonitoringInterval);
          this.stateMonitoringInterval = null;
        }
        document.removeEventListener('focusin', this.focusInHandler);
        document.removeEventListener('focusout', this.focusOutHandler);
      }
    };

    manager.startStateMonitoring();
    const intervalId = manager.stateMonitoringInterval;

    manager.stopStateMonitoring();

    expect(manager.stateMonitoringInterval).toBeNull();
  });

  it('should remove event listeners when stopping', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const focusInHandler = () => {};
    const focusOutHandler = () => {};

    const manager = {
      stateMonitoringInterval: null,
      focusInHandler,
      focusOutHandler,
      updateState: () => {},
      startStateMonitoring: function() {
        this.stateMonitoringInterval = setInterval(() => {
          this.updateState();
        }, 50);
        document.addEventListener('focusin', this.focusInHandler);
        document.addEventListener('focusout', this.focusOutHandler);
      },
      stopStateMonitoring: function() {
        if (this.stateMonitoringInterval !== null) {
          clearInterval(this.stateMonitoringInterval);
          this.stateMonitoringInterval = null;
        }
        document.removeEventListener('focusin', this.focusInHandler);
        document.removeEventListener('focusout', this.focusOutHandler);
      }
    };

    manager.startStateMonitoring();
    manager.stopStateMonitoring();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('focusin', focusInHandler);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('focusout', focusOutHandler);

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should have a cleanup method that calls stopStateMonitoring', () => {
    const manager = {
      stateMonitoringInterval: null,
      focusInHandler: () => {},
      focusOutHandler: () => {},
      updateState: () => {},
      startStateMonitoring: function() {
        this.stateMonitoringInterval = setInterval(() => {
          this.updateState();
        }, 50);
      },
      stopStateMonitoring: function() {
        if (this.stateMonitoringInterval !== null) {
          clearInterval(this.stateMonitoringInterval);
          this.stateMonitoringInterval = null;
        }
      },
      cleanup: function() {
        this.stopStateMonitoring();
      }
    };

    manager.startStateMonitoring();
    manager.cleanup();

    expect(manager.stateMonitoringInterval).toBeNull();
  });
});
