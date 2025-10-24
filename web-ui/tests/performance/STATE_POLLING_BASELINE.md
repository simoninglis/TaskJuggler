# State Polling Performance Baseline

**Date**: 2025-10-24
**Phase**: 3.1 Step 1
**Objective**: Document baseline state polling performance before optimization

---

## Current Implementation

**File**: `src/js/keyboard-manager.js:253`
```javascript
startStateMonitoring() {
    this.stateMonitoringInterval = setInterval(() => {
        this.updateState();
    }, KEYBOARD.STATE_CHECK_INTERVAL);  // Currently 50ms

    document.addEventListener('focusin', this.focusInHandler);
    document.addEventListener('focusout', this.focusOutHandler);
}
```

**Configuration**: `src/js/config.js:20`
```javascript
export const KEYBOARD = {
    STATE_CHECK_INTERVAL: 50,  // 20 polling calls per second
    // ...
};
```

---

## Baseline Measurements

### Methodology

**Tool**: Chrome DevTools Performance Tab
**Steps**:
1. Open web UI at http://localhost:8001
2. Open Chrome DevTools (F12)
3. Navigate to Performance tab
4. Start recording
5. Wait 10 seconds (idle time - no user interaction)
6. Stop recording
7. Search for "updateState" in the flame graph
8. Count total calls over the 10-second period

### Expected Baseline Results

**Interval**: 50ms = 20 calls/second
**Duration**: 10 seconds
**Expected calls**: 190-210 calls (allowing for slight timing variance)

**Call rate calculation**:
```
Rate = 1000ms / interval
Rate = 1000ms / 50ms = 20 calls/second
Total = rate × duration = 20 × 10 = 200 calls
```

### Success Criteria

**Acceptable baseline range**: 190-210 `updateState()` calls in 10 seconds

If measurements fall outside this range, investigate:
- Browser throttling (tab backgrounded?)
- System performance issues
- JavaScript execution delays

---

## Post-Optimization Target

**New interval**: 250ms = 4 calls/second
**Duration**: 10 seconds
**Expected calls**: 30-50 calls (80% reduction)

**Reduction calculation**:
```
Old rate: 1000/50 = 20 calls/sec
New rate: 1000/250 = 4 calls/sec
Reduction: 1 - (oldInterval / newInterval)
Reduction: 1 - (50/250) = 1 - 0.2 = 0.8 = 80%
```

---

## Manual Measurement Log

### Pre-Optimization (Current State)

**Date**: _To be recorded_
**Browser**: _To be recorded_
**Duration**: 10 seconds
**`updateState()` calls**: _To be recorded_
**Call rate**: _To be calculated_

**Notes**: _Any observations during baseline measurement_

---

### Post-Optimization

**Date**: _To be recorded after Step 2_
**Browser**: _Same as baseline_
**Duration**: 10 seconds
**`updateState()` calls**: _To be recorded_
**Call rate**: _To be calculated_
**Reduction**: _To be calculated_

**Notes**: _Observations after polling interval changed to 250ms_

---

## Automated Test (To be created in Step 4)

**File**: `tests/performance/test-state-polling-performance.spec.js`

This automated test will:
- Spy on `updateState()` method
- Count calls over a 10-second period
- Verify the call rate matches expected 250ms interval (4 calls/sec)
- Ensure event-driven updates still trigger immediately

**Note**: Automated test created in Phase 3.1 Step 4, after manual baseline is established.

---

## Event-Driven Updates (Unchanged)

The current implementation already has event listeners that supplement polling:
- `focusin` events trigger immediate state updates (line 258)
- `focusout` events trigger immediate state updates (line 259)

These provide responsive UX for most state changes, while polling catches edge cases.

**Verification**: In Step 3, we'll verify that event-driven updates continue to work correctly with reduced polling frequency.
