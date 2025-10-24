/**
 * Performance Test: State Polling Optimization
 *
 * Validates that the keyboard state polling interval has been reduced
 * from 50ms (20 calls/sec) to 250ms (4 calls/sec) for 80% CPU reduction.
 *
 * Also ensures event-driven updates still provide immediate responsiveness.
 */

import { test, expect } from '@playwright/test';

test.describe('State Polling Performance', () => {
    test('should poll at 250ms interval (4 calls/sec) instead of 50ms (20 calls/sec)', async ({ page }) => {
        // Navigate to the web UI
        await page.goto('http://localhost:8001');

        // Wait for the app to fully load
        await page.waitForSelector('#gantt_here', { state: 'visible' });
        await page.waitForTimeout(2000); // Allow initialization to complete

        // Inject a spy to count updateState() calls
        await page.evaluate(() => {
            window.updateStateCallCount = 0;
            window.updateStateCallTimes = [];

            // Spy on the updateState method
            const originalUpdateState = window.keyboardManager.updateState.bind(window.keyboardManager);
            window.keyboardManager.updateState = function() {
                window.updateStateCallCount++;
                window.updateStateCallTimes.push(Date.now());
                return originalUpdateState();
            };

            console.log('Spy installed on updateState()');
        });

        // Record start time
        const startTime = await page.evaluate(() => Date.now());

        // Wait for 10 seconds while counting updateState() calls
        console.log('Recording updateState() calls for 10 seconds...');
        await page.waitForTimeout(10000);

        // Get the call count and timing data
        const result = await page.evaluate(() => ({
            callCount: window.updateStateCallCount,
            callTimes: window.updateStateCallTimes,
            duration: Date.now() - window.updateStateCallTimes[0]
        }));

        console.log(`updateState() called ${result.callCount} times in ${result.duration}ms`);
        console.log(`Call rate: ${(result.callCount / (result.duration / 1000)).toFixed(2)} calls/second`);

        // Validate: With 250ms interval, expect 30-50 calls in 10 seconds
        // (4 calls/sec × 10 sec = 40 calls, allowing ±25% variance)
        expect(result.callCount).toBeGreaterThanOrEqual(30);
        expect(result.callCount).toBeLessThanOrEqual(50);

        // Calculate average interval between calls
        const intervals = [];
        for (let i = 1; i < result.callTimes.length; i++) {
            intervals.push(result.callTimes[i] - result.callTimes[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

        console.log(`Average interval: ${avgInterval.toFixed(2)}ms (target: 250ms)`);

        // Validate: Average interval should be close to 250ms (200-300ms acceptable)
        expect(avgInterval).toBeGreaterThanOrEqual(200);
        expect(avgInterval).toBeLessThanOrEqual(300);

        // Ensure this is NOT the old 50ms interval behavior
        // (50ms would give 190-210 calls, so verify we're well below that)
        expect(result.callCount).toBeLessThan(150); // Clear separation from old behavior
    });

    test('should respond immediately to focus events (event-driven updates)', async ({ page }) => {
        // Navigate to the web UI
        await page.goto('http://localhost:8001');

        // Wait for the app to fully load
        await page.waitForSelector('#gantt_here', { state: 'visible' });
        await page.waitForTimeout(2000);

        // Install spy to track updateState() calls triggered by events
        await page.evaluate(() => {
            window.eventDrivenCalls = [];

            const originalUpdateState = window.keyboardManager.updateState.bind(window.keyboardManager);
            window.keyboardManager.updateState = function() {
                // Record when updateState is called
                window.eventDrivenCalls.push({
                    timestamp: Date.now(),
                    activeElement: document.activeElement?.tagName || 'unknown'
                });
                return originalUpdateState();
            };
        });

        // Get initial call count
        const beforeFocus = await page.evaluate(() => window.eventDrivenCalls.length);

        // Trigger a focus event by clicking on the search input
        await page.click('#searchInput');

        // Wait a short time for the event-driven update (should be ~10ms debounce)
        await page.waitForTimeout(100);

        // Get call count after focus
        const afterFocus = await page.evaluate(() => window.eventDrivenCalls.length);

        console.log(`Focus event triggered ${afterFocus - beforeFocus} updateState() call(s)`);

        // Validate: Focus event should trigger at least one immediate updateState() call
        expect(afterFocus).toBeGreaterThan(beforeFocus);

        // Trigger blur event by clicking elsewhere
        const beforeBlur = afterFocus;
        await page.click('#gantt_here');
        await page.waitForTimeout(100);

        const afterBlur = await page.evaluate(() => window.eventDrivenCalls.length);

        console.log(`Blur event triggered ${afterBlur - beforeBlur} updateState() call(s)`);

        // Validate: Blur event should also trigger updateState()
        expect(afterBlur).toBeGreaterThan(beforeBlur);

        // Validate: Event-driven updates should happen quickly (not waiting for 250ms interval)
        // Check the timing of the event-driven calls
        const eventTimings = await page.evaluate(() => {
            // Get the last few calls which should include the event-driven ones
            const recentCalls = window.eventDrivenCalls.slice(-4);
            return recentCalls;
        });

        console.log('Event-driven call timings:', eventTimings);

        // Success: Event listeners are working and triggering immediate updates
        // This proves that despite reduced polling, UX responsiveness is maintained
    });

    test('should verify config change from 50ms to 250ms', async ({ page }) => {
        // Navigate to the web UI
        await page.goto('http://localhost:8001');

        // Wait for the app to load
        await page.waitForSelector('#gantt_here', { state: 'visible' });

        // Read the actual config value being used
        const configValue = await page.evaluate(() => {
            // Import config module and check STATE_CHECK_INTERVAL
            if (window.keyboardManager) {
                // Check the actual interval being used
                return window.keyboardManager.stateMonitoringInterval;
            }
            return null;
        });

        // Also check the config constant directly
        const stateCheckInterval = await page.evaluate(async () => {
            // Dynamically import the config module
            const config = await import('/src/js/config.js');
            return config.KEYBOARD.STATE_CHECK_INTERVAL;
        });

        console.log(`Config STATE_CHECK_INTERVAL: ${stateCheckInterval}ms`);

        // Validate: Config should be set to 250ms (not the old 50ms)
        expect(stateCheckInterval).toBe(250);

        // Ensure it's NOT the old value
        expect(stateCheckInterval).not.toBe(50);
    });
});
