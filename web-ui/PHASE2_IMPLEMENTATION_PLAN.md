# Phase 2: Code Organization - Implementation Plan

**Status**: Ready for Implementation
**Created**: 2025-10-23
**Duration**: 3 weeks (32 hours)
**Branch**: `feature/phase2-code-organization`

---

## Executive Summary

**Recommended Strategy**: **Option C - Hybrid Approach with Sequential Sub-Phases**

- **Branch**: Single feature branch `feature/phase2-code-organization`
- **Approach**: Implement all sub-phases sequentially in one branch with clear commit milestones
- **Rationale**:
  - Sub-phases have dependencies (2.2 utilities are used in 2.3 file splitting)
  - Simpler merge strategy (one PR to dev instead of three)
  - Easier to validate the entire refactor as a cohesive unit
  - Reduces merge conflict risk
  - All tests must pass at each milestone

**Duration**: 3 weeks (32 hours total effort)

---

## 1. Branching Strategy

### Branch Structure
```
dev (current)
  └── feature/phase2-code-organization (new)
      ├── Milestone 1: Extract Magic Numbers (commits 1-3)
      ├── Milestone 2: Shared Utilities (commits 4-7)
      └── Milestone 3: Split Large Files (commits 8-15)
```

### Merge Flow
```
feature/phase2-code-organization → dev → master (eventually)
```

### Commit Strategy

Each sub-phase will have atomic commits:

**Phase 2.1 Commits** (3 commits):
1. `refactor: Create config.js with keyboard and timing constants`
2. `refactor: Replace magic numbers in layout, controls, and data-watcher`
3. `test: Update tests for config.js constants`

**Phase 2.2 Commits** (4 commits):
1. `refactor: Create gantt-utils.js with task traversal functions`
2. `refactor: Replace duplicate traversal in keyboard-manager.js`
3. `refactor: Replace duplicate traversal in gantt-controls.js`
4. `test: Add unit tests for gantt-utils.js`

**Phase 2.3 Commits** (8 commits):
1. `refactor: Split gantt-controls.js into 4 modules`
2. `test: Update tests for gantt-controls modules`
3. `refactor: Split custom-command-palette.js into 3 modules`
4. `test: Update tests for command-palette modules`
5. `refactor: Split keyboard-manager.js into 3 modules`
6. `test: Update tests for keyboard-manager modules`
7. `refactor: Update all imports and exports`
8. `test: Run full test suite and verify all tests pass`

---

## 2. Phase 2.1: Extract Magic Numbers (Week 2)

### Duration
4 hours

### Objective
Create a centralized configuration file to replace magic numbers throughout the codebase.

### Files to Create

#### `src/js/config.js` (~80 lines)
```javascript
// Centralized configuration constants
// Replaces magic numbers throughout the application

export const KEYBOARD = {
  // Polling intervals (milliseconds)
  STATE_CHECK_INTERVAL: 50,
  FOCUS_DEBOUNCE: 10,
  GANTT_REFRESH_DELAY: 10,

  // Scroll amounts
  MIN_SCROLL_AMOUNT: 10,
  DEFAULT_SCROLL_AMOUNT: 200,
  SCROLL_VIEWPORT_DIVISOR: 4,
};

export const DATA_WATCHER = {
  // File monitoring interval (milliseconds)
  POLL_INTERVAL: 2000,

  // Reload delay
  RELOAD_DEBOUNCE: 100,
};

export const LAYOUT = {
  // Breakpoints (pixels)
  MOBILE_MAX: 768,
  TABLET_MAX: 1024,

  // Responsive sizes
  HEADER_HEIGHT_DESKTOP: 60,
  HEADER_HEIGHT_MOBILE: 50,
};

export const SEARCH = {
  // Debounce timing (milliseconds)
  DEBOUNCE_DELAY: 300,

  // Focus delays
  FOCUS_DELAY: 100,
};

export const GANTT = {
  // Zoom configuration
  MIN_COLUMN_WIDTH: {
    hour: 30,
    day: 60,
    week: 60,
    month: 120,
    quarter: 90,
    year: 50,
  },

  // Scroll limits
  MAX_SCROLL_X: 999999,
};

export const THEME = {
  // Storage keys
  STORAGE_KEY: 'gantt-theme',

  // Default theme
  DEFAULT: 'light',
};

// Export all as a single object for convenience
export default {
  KEYBOARD,
  DATA_WATCHER,
  LAYOUT,
  SEARCH,
  GANTT,
  THEME,
};
```

### Files to Modify

#### `src/js/keyboard-manager.js`
**Changes**:
- Import `KEYBOARD` from `./config.js`
- Replace `50` with `KEYBOARD.STATE_CHECK_INTERVAL` (line 236)
- Replace `10` with `KEYBOARD.FOCUS_DEBOUNCE` (lines 192, 215, 227)
- Replace `200` with `KEYBOARD.DEFAULT_SCROLL_AMOUNT` (line 757)
- Replace `Math.max(200, ...)` with `Math.max(KEYBOARD.DEFAULT_SCROLL_AMOUNT, ...)`

**Lines affected**: 6 magic numbers → 6 constants

#### `src/js/gantt-controls.js`
**Changes**:
- Import `GANTT, SEARCH` from `./config.js`
- Replace `300` with `SEARCH.DEBOUNCE_DELAY` (line 78)
- Replace `100` with `SEARCH.FOCUS_DELAY` (line 152)
- Replace `30, 60, 120, 90, 50` with `GANTT.MIN_COLUMN_WIDTH.*` (lines 243-286)
- Replace `10` with `KEYBOARD.MIN_SCROLL_AMOUNT` (line 341)
- Replace `999999` with `GANTT.MAX_SCROLL_X` (lines 672, 679)

**Lines affected**: 10 magic numbers → 10 constants

#### `src/js/data-watcher.js`
**Changes**:
- Import `DATA_WATCHER` from `./config.js`
- Replace `2000` with `DATA_WATCHER.POLL_INTERVAL`
- Replace any reload debounce values with `DATA_WATCHER.RELOAD_DEBOUNCE`

**Lines affected**: 2 magic numbers → 2 constants

#### `src/js/components/layout-manager.js`
**Changes**:
- Import `LAYOUT` from `../config.js`
- Replace breakpoint magic numbers with `LAYOUT.MOBILE_MAX`, `LAYOUT.TABLET_MAX`
- Replace header height values with `LAYOUT.HEADER_HEIGHT_*`

**Lines affected**: 4 magic numbers → 4 constants

### Implementation Steps

1. **Create config.js** (30 min)
   - Create file with all constants organized by category
   - Add JSDoc comments explaining each category
   - Export both named exports and default export

2. **Update keyboard-manager.js** (30 min)
   - Add import statement at top
   - Find-and-replace magic numbers with constants
   - Verify no hardcoded values remain

3. **Update gantt-controls.js** (45 min)
   - Add import statement
   - Replace search debounce values
   - Replace gantt zoom config values
   - Replace scroll values

4. **Update data-watcher.js** (15 min)
   - Add import statement
   - Replace polling interval

5. **Update layout-manager.js** (30 min)
   - Add import statement
   - Replace breakpoints and sizes

6. **Test and verify** (60 min)
   - Run `npm run test` (Vitest tests)
   - Run Playwright smoke tests
   - Manually verify keyboard navigation works
   - Manually verify search debounce works
   - Manually verify zoom levels work

### Testing Strategy

**Unit Tests**: No new tests needed (config is just constants)

**Integration Tests**:
- Verify keyboard polling still works (50ms interval)
- Verify search debounce (300ms delay)
- Verify zoom levels render correctly
- Verify data watcher polling (2000ms interval)

**Validation**:
- All Vitest tests pass
- Smoke test suite passes (Playwright tests)
- No console errors
- Visual regression check (screenshot comparison)

### Success Criteria
- ✅ All magic numbers extracted to config.js
- ✅ All tests passing
- ✅ No behavioral changes (functionality identical)
- ✅ Code more maintainable (single source of truth for constants)

---

## 3. Phase 2.2: Create Shared Utilities (Week 2-3)

### Duration
8 hours

### Objective
Extract duplicate task traversal code into a shared utility module.

### Code Duplication Analysis

**Duplicate Pattern 1**: Task traversal (children)
- `gantt-controls.js`: `addAllChildren()` (lines 159-166), `addAllChildrenForFilter()` (lines 550-557), `addAllDescendants()` (lines 684-691)

**Duplicate Pattern 2**: Task traversal (ancestors/parents)
- `gantt-controls.js`: `addParentHierarchy()` (lines 168-174)

**Duplicate Pattern 3**: Hierarchical filtering
- `gantt-controls.js`: `applyTaskFilter()` (lines 492-548) - creates task sets with parents and children

**Total Duplication**: ~150 lines can be reduced to ~30 lines + shared utilities

### Files to Create

#### `src/js/gantt-utils.js` (~120 lines)

See full implementation in detailed plan section below.

Key functions:
- `traverseTaskChildren(taskId, allTasks, includeSet)`
- `traverseTaskAncestors(taskId, allTasks, includeSet)`
- `traverseTaskDescendants(parentId, includeSet)`
- `createHierarchicalFilter(matchingTasks, allTasks)`
- `createHierarchicalFilterWithGantt(matchingTasks)`
- `getVisibleTasks()`

### Files to Modify

#### `src/js/gantt-controls.js`
**Changes**:
- Import utilities from `./gantt-utils.js`
- Replace duplicate traversal functions
- Simplify `applyTaskFilter()` to use `createHierarchicalFilterWithGantt()`

**Lines removed**: ~60 lines
**Lines added**: ~10 lines (imports + function calls)
**Net reduction**: ~50 lines

#### `src/js/keyboard-manager.js`
**Changes**:
- Import `{ getVisibleTasks }` from `./gantt-utils.js`
- Replace inline visible task filtering

**Lines removed**: ~4 lines
**Lines added**: ~2 lines
**Net reduction**: ~2 lines

### Implementation Steps

1. **Create gantt-utils.js** (2 hours)
   - Implement all traversal functions
   - Add comprehensive JSDoc comments

2. **Write unit tests for gantt-utils.js** (2 hours)
   - Create `tests/test-gantt-utils.spec.js`
   - Test all functions with nested hierarchies
   - Test edge cases

3. **Refactor gantt-controls.js** (2 hours)
   - Replace duplicate functions
   - Test search filtering

4. **Refactor keyboard-manager.js** (1 hour)
   - Replace visible task filtering
   - Test arrow key navigation

5. **Test and verify** (1 hour)
   - Run all tests
   - Test search, filters, navigation

### Success Criteria
- ✅ ~150 lines of duplicate code eliminated
- ✅ All tests passing
- ✅ New unit tests for gantt-utils.js (>80% coverage)
- ✅ No behavioral changes

---

## 4. Phase 2.3: Split Large Files (Week 3-4)

### Duration
20 hours

### Objective
Break down 3 large files into smaller, focused modules.

### File Split Plan

#### A. gantt-controls.js (990 lines → 4 files)

**Target Files**:

1. **`src/js/gantt/gantt-zoom.js`** (~150 lines)
   - Functions: `zoomIn()`, `zoomOut()`, `setZoom()`, `calculateScrollAmount()`

2. **`src/js/gantt/gantt-filters.js`** (~250 lines)
   - Functions: All filter functions, `applyTaskFilter()`, `clearAllFilters()`

3. **`src/js/gantt/gantt-focus.js`** (~200 lines)
   - Functions: Focus mode functions

4. **`src/js/gantt/gantt-navigation.js`** (~250 lines)
   - Functions: Navigation and search functions

**Remaining**: ~140 lines (helpers, state subscription, re-exports)

#### B. custom-command-palette.js (1,204 lines → 3 files)

**Target Files**:

1. **`src/js/palette/commands-config.js`** (~400 lines)
   - All command definitions

2. **`src/js/palette/palette-rendering.js`** (~300 lines)
   - DOM rendering, highlighting with DOMPurify

3. **`src/js/palette/palette-search.js`** (~200 lines)
   - Search and filtering logic

**Remaining**: ~304 lines (CustomCommandPalette class)

#### C. keyboard-manager.js (862 lines → 3 files)

**Target Files**:

1. **`src/js/keyboard/state-handlers.js`** (~350 lines)
   - All `handle*` methods

2. **`src/js/keyboard/hotkey-definitions.js`** (~200 lines)
   - Global hotkey definitions

3. **`src/js/keyboard/keyboard-core.js`** (~312 lines)
   - Slimmed down KeyboardManager class

### Implementation Steps

#### Step 1: Split gantt-controls.js (6 hours)
1. Create directory: `src/js/gantt/`
2. Create 4 module files
3. Refactor gantt-controls.js to re-export
4. Update tests

#### Step 2: Update tests for gantt modules (2 hours)
1. Update test imports
2. Add module-specific tests

#### Step 3: Split custom-command-palette.js (6 hours)
1. Create directory: `src/js/palette/`
2. Create 3 module files
3. Refactor custom-command-palette.js
4. Update tests

#### Step 4: Update tests for palette modules (2 hours)
1. Update XSS tests
2. Add module-specific tests

#### Step 5: Split keyboard-manager.js (4 hours)
1. Create directory: `src/js/keyboard/`
2. Create 3 module files
3. Refactor keyboard-manager.js
4. Update tests

#### Step 6: Update tests for keyboard modules (2 hours)
1. Update memory leak tests
2. Add module-specific tests

#### Step 7: Integration (2 hours)
1. Update index.html
2. Full integration test
3. Update documentation

---

## 5. Testing Strategy

### Test Execution Points

**After Phase 2.1** (Extract Magic Numbers):
- Run: `npm run test`
- Run: Smoke tests
- **Expected**: All tests pass

**After Phase 2.2** (Shared Utilities):
- Run: `npm run test` (added gantt-utils test)
- Run: Integration tests
- **Expected**: All tests pass

**After Phase 2.3** (Split Large Files):
- Run: Full test suite
- **Expected**: All tests pass

### New Tests to Create

**Vitest Unit Tests** (7 new test files):
1. `tests/test-gantt-utils.spec.js`
2. `tests/test-gantt-zoom.spec.js`
3. `tests/test-gantt-filters.spec.js`
4. `tests/test-gantt-navigation.spec.js`
5. `tests/test-palette-rendering.spec.js`
6. `tests/test-palette-search.spec.js`
7. `tests/test-state-handlers.spec.js`

### Regression Testing

**Critical Paths**:
- Keyboard navigation
- Command palette
- Search
- Focus mode
- Zoom
- Milestone navigation
- Theme toggle
- Data loading

---

## 6. Risk Mitigation

### Risk 1: Breaking Changes
**Mitigation**: Atomic commits, test after each change, git revert if needed

### Risk 2: Circular Dependencies
**Mitigation**: Clear hierarchy (config → utils → modules → managers)

### Risk 3: Test Breakage
**Mitigation**: Update tests immediately, don't progress without 100% pass rate

### Risk 4: Performance Regressions
**Mitigation**: Benchmark keyboard response, no algorithmic changes

---

## 7. Rollback Plan

### If any phase breaks:
```bash
# Revert specific commits
git reset --hard <commit-hash>

# Or revert individual commits
git revert <commit-hash>
```

### Recovery Process
1. Identify failing test
2. Check console errors
3. Verify imports
4. Revert commit
5. Re-run tests
6. Fix issue before re-applying

---

## 8. Timeline & Milestones

### Week 2 (8 hours)
**Monday-Tuesday** (4 hours):
- ✅ Create feature branch
- ✅ Phase 2.1: Extract magic numbers
- ✅ All tests pass

**Wednesday-Friday** (4 hours):
- ✅ Phase 2.2: Create gantt-utils.js
- ✅ Unit tests for utilities

### Week 3 (12 hours)
**Monday-Tuesday** (4 hours):
- ✅ Phase 2.2: Refactor to use utilities
- ✅ All tests pass

**Wednesday-Friday** (8 hours):
- ✅ Phase 2.3: Split gantt-controls.js
- ✅ Update tests

### Week 4 (12 hours)
**Monday-Wednesday** (12 hours):
- ✅ Phase 2.3: Split command palette
- ✅ Phase 2.3: Split keyboard manager
- ✅ Full integration

**Thursday-Friday** (6 hours):
- ✅ Final testing
- ✅ Create PR
- ✅ Code review
- ✅ Merge to dev

---

## 9. Success Criteria

### Quantitative
- [ ] All files under 400 lines
- [ ] ~150 lines duplication eliminated
- [ ] 22 magic numbers → 0
- [ ] 15+ unit tests
- [ ] 100% test pass rate

### Qualitative
- [ ] Single responsibility per module
- [ ] Clear module names
- [ ] JSDoc comments
- [ ] No regressions
- [ ] No console errors
- [ ] No circular dependencies

### Feature Validation
- [ ] Keyboard navigation works
- [ ] Command palette works
- [ ] Search works
- [ ] Filters work
- [ ] Focus mode works
- [ ] Zoom works
- [ ] Milestone navigation works
- [ ] Theme toggle works

---

## 10. File Structure After Phase 2

```
src/js/
├── config.js                      [NEW] 80 lines
├── gantt-utils.js                 [NEW] 120 lines
├── gantt/                         [NEW DIRECTORY]
│   ├── gantt-zoom.js             [NEW] 150 lines
│   ├── gantt-filters.js          [NEW] 250 lines
│   ├── gantt-focus.js            [NEW] 200 lines
│   └── gantt-navigation.js       [NEW] 250 lines
├── palette/                       [NEW DIRECTORY]
│   ├── commands-config.js        [NEW] 400 lines
│   ├── palette-rendering.js      [NEW] 300 lines
│   └── palette-search.js         [NEW] 200 lines
├── keyboard/                      [NEW DIRECTORY]
│   ├── state-handlers.js         [NEW] 350 lines
│   ├── hotkey-definitions.js     [NEW] 200 lines
│   └── keyboard-core.js          [RENAMED] 312 lines
├── gantt-controls.js             [REFACTORED] 990 → 140 lines
├── custom-command-palette.js     [REFACTORED] 1,204 → 304 lines
├── stateStore.js                 [UNCHANGED]
└── components/                    [UNCHANGED]
```

**Total LOC Reduction**: ~6% from eliminating duplication
**Largest File**: commands-config.js (400 lines) - 67% smaller than before

---

## Next Steps

After Phase 2 completes, the codebase will be ready for:
- **Phase 3**: Performance Optimization
- **Phase 4**: Input Validation & Security
- **Phase 5**: Architecture Improvements

---

## Notes

- All phases maintain backward compatibility
- Each phase includes comprehensive testing
- Priority adjustable based on feedback
- Estimated efforts assume single developer part-time

**Ready for implementation** - Start with:
```bash
git checkout dev
git pull origin dev
git checkout -b feature/phase2-code-organization
```
