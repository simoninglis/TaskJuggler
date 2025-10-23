import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Fix #1: Promise Rejection Handler', () => {
  let originalGantt;

  beforeEach(() => {
    // Save original gantt if it exists
    originalGantt = global.gantt;
  });

  afterEach(() => {
    // Restore original gantt
    if (originalGantt !== undefined) {
      global.gantt = originalGantt;
    } else {
      delete global.gantt;
    }
  });

  it('should call reject when gantt is not available after timeout', async () => {
    // Remove gantt to simulate failure
    delete global.gantt;

    // Mock setInterval and clearInterval
    vi.useFakeTimers();

    // Import the waitForGantt function dynamically
    const module = await import('../src/js/gantt-init.js');
    const { waitForGantt } = module;

    // Start the waitForGantt promise
    const promise = waitForGantt();

    // Fast-forward time to exceed maxAttempts (50 attempts * 100ms = 5000ms)
    vi.advanceTimersByTime(5100);

    // The promise should reject
    await expect(promise).rejects.toThrow('DHTMLX Gantt not found');

    vi.useRealTimers();
  });

  it('should resolve when gantt becomes available', async () => {
    // Start without gantt
    delete global.gantt;

    vi.useFakeTimers();

    const module = await import('../src/js/gantt-init.js');
    const { waitForGantt } = module;

    const promise = waitForGantt();

    // Simulate gantt loading after 500ms (5 attempts)
    vi.advanceTimersByTime(500);
    global.gantt = { config: {}, init: vi.fn() };

    // Advance one more interval to trigger the check
    vi.advanceTimersByTime(100);

    // The promise should resolve
    await expect(promise).resolves.toBeUndefined();

    vi.useRealTimers();
  });

  it('should resolve immediately if gantt is already available', async () => {
    // Set up gantt before calling waitForGantt
    global.gantt = { config: {}, init: vi.fn() };

    const module = await import('../src/js/gantt-init.js');
    const { waitForGantt } = module;

    // Should resolve immediately without any timers
    await expect(waitForGantt()).resolves.toBeUndefined();
  });
});
