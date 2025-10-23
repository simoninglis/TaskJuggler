# REVISED Implementation Plan: Phase 1 - Critical Fixes (Web UI)

## Executive Summary

This plan addresses three P0 blocking issues identified in the comprehensive code review:

1. **Promise Rejection Bug** (P0 - BLOCKER): Missing `reject` parameter causing ReferenceError when gantt fails to load
2. **XSS Security Vulnerability** (P0 - SECURITY): Unsanitized HTML injection in search highlighting
3. **Memory Leak** (P0 - PERFORMANCE): Uncancelled intervals in keyboard-manager.js and data-watcher.js

**Total Estimated Effort**: 3.5 hours (increased from 3 hours due to additional test coverage)
**Risk Level**: Low (minimal, targeted changes)
**Impact**: Critical bugs resolved, security hardened, performance improved

---

## Technical Design

### Fix 1: Promise Rejection Bug

**Problem**: `waitForGantt()` Promise constructor missing `reject` parameter (line 6), but attempts to call `reject()` on timeout (line 28).

**Root Cause**: Promise constructor signature is `new Promise((resolve, reject) => {...})` but only `resolve` was provided.

**Solution**:
```javascript
// BEFORE (line 6):
return new Promise((resolve) => {

// AFTER:
return new Promise((resolve, reject) => {
```

**Files to Modify**:
- `/home/singlis/work/TaskJuggler/web-ui/src/js/gantt-init.js` (line 6)

**Impact**:
- Fixes ReferenceError when gantt fails to load
- Proper error propagation to calling code
- Better debugging experience

---

### Fix 2: XSS Security Vulnerability

**Problem**: Search highlighting in `gantt-config.js` (lines 42-52) injects unsanitized HTML directly into task text.

**Attack Vector**:
```javascript
// If task.text = '<script>alert("XSS")</script>'
// Current code: task.text.replace(regex, '<span class="highlight">$1</span>')
// Result: Script executes!
```

**Solution**: Use DOMPurify library to sanitize HTML before injection.

**Implementation**:

1. **Install DOMPurify**:
```bash
npm install dompurify --save
```

2. **Import in gantt-config.js**:
```javascript
import DOMPurify from 'dompurify';
```

3. **Sanitize task text BEFORE highlighting**:
```javascript
// AFTER:
gantt.templates.task_text = function(start, end, task) {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.trim() : '';

    if (!task.text) return '';

    // Sanitize task text FIRST (prevent XSS)
    const sanitizedText = DOMPurify.sanitize(task.text, {
        ALLOWED_TAGS: [], // No HTML tags allowed in task text
        KEEP_CONTENT: true // Keep text content
    });

    if (searchTerm) {
        const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
        // Highlighting is safe because sanitizedText contains no HTML
        const highlighted = sanitizedText.replace(regex, '<span class="highlight">$1</span>');
        // Sanitize again to ensure highlight spans are the only HTML
        return DOMPurify.sanitize(highlighted, {
            ALLOWED_TAGS: ['span'],
            ALLOWED_ATTR: ['class']
        });
    }

    return sanitizedText;
};
```

**Files to Modify**:
- `/home/singlis/work/TaskJuggler/web-ui/package.json` (add dompurify dependency)
- `/home/singlis/work/TaskJuggler/web-ui/src/js/gantt-config.js` (lines 1-52)

**Dependencies**:
- DOMPurify ^3.0.0 (npm package)

---

### Fix 3: Memory Leak - Uncancelled Intervals

**Problem**: Two files have `setInterval()` calls without cleanup:

1. **keyboard-manager.js** (line 222): 50ms polling for state updates
2. **data-watcher.js** (line 17): 2000ms polling for file changes

**Root Cause**:
- keyboard-manager.js: Intervals start on module load and never stop, event listeners never removed
- data-watcher.js: Multiple calls to `start()` create duplicate intervals without clearing the previous one

**Solution**: Implement lifecycle management with cleanup mechanism and window unload hooks.

#### Fix 3a: keyboard-manager.js

**Changes Required**:

1. **Add instance variables in constructor** (line 12):
```javascript
constructor() {
    // ... existing code ...

    // Instance variable for interval tracking
    this.stateMonitoringInterval = null;

    // Bind handlers for proper event listener removal
    this.focusInHandler = () => {
        setTimeout(() => this.updateState(), 10);
    };

    this.focusOutHandler = () => {
        setTimeout(() => this.updateState(), 10);
    };

    // ... rest of constructor ...
}
```

2. **Update startStateMonitoring()** (lines 220-234):
```javascript
startStateMonitoring() {
    // Clean up existing interval if any
    if (this.stateMonitoringInterval) {
        clearInterval(this.stateMonitoringInterval);
    }

    // Monitor for state changes more frequently for better responsiveness
    this.stateMonitoringInterval = setInterval(() => {
        this.updateState();
    }, 50);

    // Also monitor on focus changes (using bound handlers for proper cleanup)
    document.addEventListener('focusin', this.focusInHandler);
    document.addEventListener('focusout', this.focusOutHandler);
}
```

3. **Add cleanup methods**:
```javascript
stopStateMonitoring() {
    if (this.stateMonitoringInterval) {
        clearInterval(this.stateMonitoringInterval);
        this.stateMonitoringInterval = null;
        this.debug('State monitoring stopped');
    }

    document.removeEventListener('focusin', this.focusInHandler);
    document.removeEventListener('focusout', this.focusOutHandler);
}

cleanup() {
    this.debug('Cleaning up KeyboardManager');
    this.stopStateMonitoring();
}
```

**Files to Modify**:
- `/home/singlis/work/TaskJuggler/web-ui/src/js/keyboard-manager.js` (lines 12-34, add cleanup methods)

#### Fix 3b: data-watcher.js

**Root Cause Correction**: The `intervalId` IS already assigned on line 17. The REAL problem is that calling `start()` multiple times creates duplicate intervals because it doesn't clear the existing one first.

**Fixed Code**:
```javascript
start() {
    console.log('📡 Starting data file watcher...');

    // Stop any existing interval to prevent duplicates (FIX)
    this.stop();

    // Initial load
    this.checkForUpdates();

    // Start polling (intervalId already assigned correctly)
    this.intervalId = setInterval(() => {
        this.checkForUpdates();
    }, this.checkInterval);

    console.log('✅ Data file watcher started');
}
```

**Files to Modify**:
- `/home/singlis/work/TaskJuggler/web-ui/src/js/data-watcher.js` (lines 10-20)

#### Fix 3c: Cleanup Trigger Hooks

**Add window unload handler** to ensure cleanup on page navigation/close:

**Step 1**: Expose `dataWatcher` globally (in `/home/singlis/work/TaskJuggler/web-ui/src/js/main.js`):

```javascript
// After starting the data watcher (around line 70)
const { dataWatcher } = await import('./data-watcher.js');
// ... existing code ...
dataWatcher.start();

// Expose to window for cleanup hook
window.dataWatcher = dataWatcher;
```

**Step 2**: Add cleanup handler (in `/home/singlis/work/TaskJuggler/web-ui/src/js/app.js` or main.js):

```javascript
// Register cleanup on window unload
window.addEventListener('beforeunload', () => {
    console.log('🧹 Cleaning up resources before unload...');

    // Cleanup keyboard manager (already exposed at keyboard-manager.js:853)
    if (window.keyboardManager && window.keyboardManager.cleanup) {
        window.keyboardManager.cleanup();
    }

    // Stop data watcher (exposed in main.js)
    if (window.dataWatcher && window.dataWatcher.stop) {
        window.dataWatcher.stop();
    }
});
```

**Files to Modify**:
- `/home/singlis/work/TaskJuggler/web-ui/src/js/main.js` (expose dataWatcher to window)
- `/home/singlis/work/TaskJuggler/web-ui/src/js/app.js` (add beforeunload handler)

---

## Implementation Steps

### Step 1: Promise Rejection Fix (5 minutes)

1. Open `/home/singlis/work/TaskJuggler/web-ui/src/js/gantt-init.js`
2. Change line 6 from `(resolve)` to `(resolve, reject)`
3. Test error handling
4. Verify gantt loads normally

---

### Step 2: XSS Protection (1.5 hours)

#### 2.1 Install DOMPurify (5 minutes)

```bash
cd /home/singlis/work/TaskJuggler/web-ui
npm install dompurify --save
```

#### 2.2 Update gantt-config.js (20 minutes)

1. Add import at top of file
2. Replace `gantt.templates.task_text` function with sanitized version
3. Test with malicious inputs

#### 2.3 Setup Vitest (15 minutes)

```bash
# Install Vitest and dependencies
npm install --save-dev vitest jsdom @vitest/ui

# Create vitest.config.js
cat > vitest.config.js << 'EOF'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js'
  }
})
EOF

# Update package.json scripts section
# Add: "test": "vitest",
#      "test:ui": "vitest --ui"
```

#### 2.4 Add Unit Tests (50 minutes)

Create 4 test files for comprehensive XSS coverage:

**File 1**: `/home/singlis/work/TaskJuggler/web-ui/tests/unit/test-xss-script-tags.spec.js`
- Test script tag sanitization
- Test event handler sanitization
- Test data URI sanitization

**File 2**: `/home/singlis/work/TaskJuggler/web-ui/tests/unit/test-xss-edge-cases.spec.js`
- Test nested HTML
- Test malformed tags
- Test unicode/encoded attacks

**File 3**: `/home/singlis/work/TaskJuggler/web-ui/tests/unit/test-dompurify-integration.spec.js`
- Test DOMPurify configuration
- Test ALLOWED_TAGS settings
- Test highlight span preservation

**File 4**: `/home/singlis/work/TaskJuggler/web-ui/tests/unit/test-search-highlighting.spec.js`
- Test legitimate search highlighting works
- Test special characters in search
- Test case-insensitive highlighting

---

### Step 3: Memory Leak Fixes (1.5 hours)

#### 3.1 Fix keyboard-manager.js (45 minutes)

**Changes**:

1. Add instance variables in constructor (stateMonitoringInterval, focusInHandler, focusOutHandler)
2. Update `startStateMonitoring()` to use bound handlers
3. Add `stopStateMonitoring()` method
4. Add `cleanup()` method

#### 3.2 Fix data-watcher.js (15 minutes)

**Changes**:

1. Add `this.stop()` call at beginning of `start()` method
2. Verify `stop()` implementation is correct (it is)

#### 3.3 Add Cleanup Hooks (15 minutes)

**Changes**:

1. Expose `dataWatcher` to `window` in main.js (add `window.dataWatcher = dataWatcher;` after starting)
2. Add `beforeunload` event listener in app.js
3. Call cleanup methods for keyboard manager and data watcher
4. Test cleanup triggers properly

#### 3.4 Testing Memory Leaks (15 minutes)

**Manual Testing**:
1. Open Chrome DevTools Memory tab
2. Take heap snapshot
3. Wait 5 minutes with page idle
4. Take another snapshot
5. Compare snapshots - verify no growing intervals
6. Check Detached DOM tree count

**Unit Tests**:

**File 5**: `/home/singlis/work/TaskJuggler/web-ui/tests/unit/test-memory-keyboard-manager.spec.js`
- Test interval is stored in instance variable
- Test cleanup clears interval
- Test event listeners are removed

**File 6**: `/home/singlis/work/TaskJuggler/web-ui/tests/unit/test-memory-data-watcher.spec.js`
- Test stop() clears interval
- Test multiple start() calls don't create duplicates
- Test cleanup on window unload

---

## Verification Criteria

### Fix 1: Promise Rejection
- [ ] No ReferenceError when gantt fails to load
- [ ] Error properly caught in catch block
- [ ] Error message displayed to user
- [ ] Normal operation when gantt loads successfully

### Fix 2: XSS Protection
- [ ] DOMPurify installed (check package.json)
- [ ] Script tags sanitized: `<script>alert('XSS')</script>` → text only
- [ ] Event handlers sanitized: `<img src=x onerror=alert('XSS')>` → safe
- [ ] Data URIs sanitized: `<a href="javascript:alert('XSS')">` → safe
- [ ] Legitimate search highlighting works
- [ ] All 4 XSS unit test files pass
- [ ] No console warnings
- [ ] Vitest configured and running

### Fix 3: Memory Leaks
- [ ] keyboard-manager interval stored in instance variable
- [ ] keyboard-manager focusInHandler/focusOutHandler defined as bound methods
- [ ] keyboard-manager cleanup method works
- [ ] keyboard-manager event listeners properly removed
- [ ] data-watcher start() calls stop() first
- [ ] data-watcher stop() clears interval
- [ ] beforeunload handler registered in app.js
- [ ] beforeunload handler calls cleanup methods
- [ ] No memory growth over 5 minutes
- [ ] CPU usage <1% when idle
- [ ] All 2 memory leak unit tests pass
- [ ] Chrome DevTools shows no detached intervals

---

## Risk Assessment

### Risk 1: DOMPurify Bundle Size
**Impact**: Medium
**Probability**: Low
**Description**: DOMPurify adds ~10KB gzipped to bundle

**Mitigation**:
- Use tree-shaking (Vite default)
- Consider escapeHtml fallback if bundle size critical
- Monitor bundle size with `npm run build`

---

### Risk 2: Breaking Existing Search Functionality
**Impact**: High
**Probability**: Low
**Description**: Sanitization might break regex highlighting

**Mitigation**:
- Comprehensive unit tests before deployment
- Test with actual TaskJuggler data
- Keep original code in git history
- Staged rollout

---

### Risk 3: Performance Regression from Sanitization
**Impact**: Low
**Probability**: Low
**Description**: DOMPurify might slow down task rendering

**Mitigation**:
- Benchmark with large datasets (1000+ tasks)
- Consider caching sanitized text
- Profile with Chrome DevTools
- Acceptable threshold: <50ms for 1000 tasks

---

### Risk 4: Memory Leak Fix Breaks State Management
**Impact**: High
**Probability**: Very Low
**Description**: Clearing intervals might stop state updates

**Mitigation**:
- Thorough testing of keyboard navigation
- Verify state updates still work
- Test all navigation modes
- Keep cleanup separate from start

---

### Risk 5: Bound Handlers Break Existing Logic
**Impact**: Medium
**Probability**: Very Low
**Description**: Using bound handlers in constructor might cause issues if handlers reference 'this'

**Mitigation**:
- Test focus change detection thoroughly
- Verify state transitions work correctly
- Keep handler logic simple (just call updateState)
- Add debug logging to verify handlers execute

---

## Timeline Estimate

| Task | Duration | Cumulative |
|------|----------|------------|
| **Fix 1: Promise Rejection** | 5 min | 5 min |
| - Code change | 2 min | |
| - Testing | 3 min | |
| **Fix 2: XSS Protection** | 1h 30min | 1h 35min |
| - Install DOMPurify | 5 min | |
| - Update gantt-config.js | 20 min | |
| - Setup Vitest | 15 min | |
| - Write 4 unit test files | 50 min | |
| **Fix 3: Memory Leaks** | 1h 30min | 3h 5min |
| - Fix keyboard-manager.js | 45 min | |
| - Fix data-watcher.js | 15 min | |
| - Add cleanup hooks (app.js) | 15 min | |
| - Write 2 memory test files | 15 min | |
| **Manual Memory Testing** | 15 min | 3h 20min |
| **Final Verification** | 15 min | 3h 35min |
| **Documentation** | 10 min | 3h 45min |

**Total Estimated Time**: 3 hours 45 minutes

---

## Success Criteria

### Phase 1 Complete When:

1. **All Critical Bugs Resolved**:
   - [ ] Promise rejection fixed
   - [ ] XSS vulnerability patched
   - [ ] Memory leaks eliminated

2. **All Tests Passing**:
   - [ ] 6 new unit test files written and passing (4 XSS + 2 memory)
   - [ ] Vitest configured and running
   - [ ] Manual memory testing checklist completed
   - [ ] No console errors

3. **Performance Targets Met**:
   - [ ] Memory growth <100KB/minute
   - [ ] CPU usage <1% idle
   - [ ] No detached intervals in heap
   - [ ] No growing event listener count

4. **Security Hardened**:
   - [ ] XSS attacks blocked (script tags, event handlers, data URIs)
   - [ ] DOMPurify integrated
   - [ ] All malicious inputs sanitized
   - [ ] Legitimate content preserved

5. **Code Quality Maintained**:
   - [ ] No breaking changes
   - [ ] Existing functionality preserved
   - [ ] Code style consistent
   - [ ] Bound handlers properly defined

6. **Cleanup Lifecycle Implemented**:
   - [ ] beforeunload handler registered
   - [ ] All intervals cleared on cleanup
   - [ ] All event listeners removed on cleanup
   - [ ] No memory leaks on page navigation

7. **Documentation Updated**:
   - [ ] ROADMAP.md updated with completion status
   - [ ] Comments added to changed code
   - [ ] Test strategy documented

---

## Files Modified Summary

```
/home/singlis/work/TaskJuggler/web-ui/
├── package.json                                  # Add dompurify, vitest, jsdom
├── vitest.config.js                              # NEW - Vitest configuration
├── src/js/
│   ├── gantt-init.js                             # Fix Promise rejection (1 line)
│   ├── gantt-config.js                           # Add XSS protection (~30 lines)
│   ├── keyboard-manager.js                       # Fix memory leak (~40 lines)
│   ├── data-watcher.js                           # Fix memory leak (2 lines)
│   ├── main.js                                   # Expose dataWatcher to window (1 line)
│   └── app.js                                    # Add cleanup hooks (~10 lines)
└── tests/
    ├── setup.js                                  # NEW - Vitest setup
    └── unit/
        ├── test-xss-script-tags.spec.js          # NEW - XSS test 1
        ├── test-xss-edge-cases.spec.js           # NEW - XSS test 2
        ├── test-dompurify-integration.spec.js    # NEW - XSS test 3
        ├── test-search-highlighting.spec.js      # NEW - XSS test 4
        ├── test-memory-keyboard-manager.spec.js  # NEW - Memory test 1
        └── test-memory-data-watcher.spec.js      # NEW - Memory test 2
```

**Total Files Modified**: 6 (gantt-init.js, gantt-config.js, keyboard-manager.js, data-watcher.js, main.js, app.js)
**Total Files Created**: 9 (vitest.config.js, setup.js, 6 test files, package.json updated)
**Lines Changed**: ~91 lines total

---

## Implementation Notes

### Critical Fixes Applied Based on External Review

1. **Focus Handlers Defined**: Added `this.focusInHandler` and `this.focusOutHandler` as bound arrow functions in constructor to ensure proper event listener cleanup

2. **Data Watcher Root Cause Corrected**: The issue is NOT missing intervalId assignment (it's already there), but duplicate intervals from multiple start() calls. Fixed by calling stop() at beginning of start()

3. **Cleanup Trigger Added**: Registered `beforeunload` event listener in app.js to trigger cleanup methods when user navigates away or closes page

4. **Test Strategy Realistic**: 6 unit test files (not 10) with specific focus areas: 4 for XSS coverage (script tags, edge cases, DOMPurify config, search highlighting) + 2 for memory leaks (keyboard manager, data watcher)

5. **Verification Criteria Updated**: Removed irrelevant "SQL injection" criterion, added specific XSS test cases (script tags, event handlers, data URIs)

### Key Technical Decisions

- **Bound Handlers**: Using arrow functions assigned in constructor preserves 'this' context and enables proper removeEventListener
- **Stop Before Start**: Calling stop() at beginning of start() is idiomatic pattern to prevent duplicate resources
- **beforeunload Hook**: Industry standard for cleanup, fires before page unload/navigation
- **Vitest over Jest**: Faster, better Vite integration, modern ESM support
- **6 Test Files**: Focused, single-responsibility test files for better maintainability

---
