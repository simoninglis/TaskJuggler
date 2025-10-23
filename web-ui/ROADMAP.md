# TaskJuggler Web UI - Development Roadmap

**Status**: Active Development
**Last Updated**: 2025-10-23
**Code Review**: Comprehensive review completed 2025-10-23 (Rating: B+)

## Executive Summary

The TaskJuggler Web UI is a VIM-inspired keyboard-navigated Gantt chart interface built with vanilla JavaScript, Lit web components, and dhtmlx-gantt. The codebase demonstrates solid architecture with excellent state management and keyboard navigation patterns, but requires immediate attention to critical bugs and performance issues.

**Overall Quality Rating**: B+ (Good foundation, needs refinement)

---

## Critical Issues (Immediate Action Required)

### 1. Promise Rejection Bug 🔴 BLOCKER
**File**: `src/js/gantt-init.js:18-28`
**Issue**: Missing `reject` parameter in Promise causing ReferenceError
**Impact**: Breaks error handling when gantt fails to load
**Priority**: P0 - Fix immediately
**Effort**: 5 minutes

### 2. XSS Security Vulnerability 🔴 SECURITY
**File**: `src/js/gantt-config.js:42-52`
**Issue**: Unsanitized HTML injection in search highlighting
**Impact**: Potential XSS if task names contain malicious HTML
**Priority**: P0 - Fix immediately
**Effort**: 1 hour (requires DOMPurify dependency)

### 3. Memory Leak - Uncancelled Intervals 🔴 PERFORMANCE
**Files**:
- `src/js/keyboard-manager.js:222` (50ms polling)
- `src/js/data-watcher.js:16` (2000ms polling)

**Issue**: setInterval without cleanup
**Impact**: Memory leaks in long-running sessions
**Priority**: P0 - Fix immediately
**Effort**: 2 hours

---

## Development Phases

### Phase 1: Critical Fixes (Week 1) ⚠️ IN PROGRESS

**Objective**: Resolve blocking bugs and security issues

- [ ] Fix Promise rejection handler in gantt-init.js
- [ ] Implement XSS protection in search highlighting
- [ ] Add interval cleanup to keyboard-manager.js
- [ ] Add interval cleanup to data-watcher.js
- [ ] Add unit tests for critical fixes

**Deliverables**:
- All critical bugs resolved
- Security vulnerability patched
- Memory leaks fixed
- Test coverage for fixes

**Success Criteria**: No P0 issues remaining, all tests passing

---

### Phase 2: Code Organization (Weeks 2-4)

**Objective**: Break down large files and reduce technical debt

#### 2.1 Extract Magic Numbers (Week 2)
- [ ] Create `src/js/config.js` with constants
- [ ] Replace magic numbers in keyboard-manager.js
- [ ] Replace magic numbers in gantt-controls.js
- [ ] Replace magic numbers in layout-manager.js
- [ ] Replace magic numbers in data-watcher.js

**Files Affected**: 5 files
**Effort**: 4 hours

#### 2.2 Create Shared Utilities (Week 2-3)
- [ ] Create `src/js/gantt-utils.js` for task traversal
- [ ] Extract `traverseTaskChildren()` function
- [ ] Extract `traverseTaskAncestors()` function
- [ ] Extract `createHierarchicalFilter()` function
- [ ] Update all files to use shared utilities
- [ ] Add unit tests for utilities

**Code Duplication Reduced**: ~150 lines
**Effort**: 8 hours

#### 2.3 Split Large Files (Week 3-4)

**gantt-controls.js** (990 lines → 4 files ~250 lines each)
- [ ] Create `src/js/gantt/gantt-zoom.js` (zoom logic)
- [ ] Create `src/js/gantt/gantt-filters.js` (filter functions)
- [ ] Create `src/js/gantt/gantt-focus.js` (focus mode)
- [ ] Create `src/js/gantt/gantt-navigation.js` (task navigation)
- [ ] Update imports and test

**custom-command-palette.js** (1,195 lines → 3 files)
- [ ] Create `src/js/palette/commands-config.js` (command definitions)
- [ ] Create `src/js/palette/palette-rendering.js` (UI rendering)
- [ ] Create `src/js/palette/palette-search.js` (search logic)
- [ ] Refactor CustomCommandPalette class
- [ ] Update imports and test

**keyboard-manager.js** (862 lines → 3 files)
- [ ] Create `src/js/keyboard/state-handlers.js` (state-specific handlers)
- [ ] Create `src/js/keyboard/hotkey-definitions.js` (hotkey configurations)
- [ ] Slim down KeyboardManager class to core logic
- [ ] Update imports and test

**Effort**: 20 hours

---

### Phase 3: Performance Optimization (Weeks 5-6)

**Objective**: Improve runtime performance and reduce resource usage

#### 3.1 Optimize State Polling
- [ ] Reduce keyboard state check from 50ms to 250ms
- [ ] Add event-driven state updates (focusin, focusout)
- [ ] Implement debounced render wrapper for gantt
- [ ] Measure performance improvements

**Expected Impact**: 80% reduction in polling CPU usage
**Effort**: 6 hours

#### 3.2 Cache DOM Queries
- [ ] Cache gantt container references in modules
- [ ] Cache search input references
- [ ] Cache status bar references
- [ ] Benchmark query reduction

**Expected Impact**: Faster DOM access, reduced reflows
**Effort**: 2 hours

#### 3.3 Optimize Search Performance
- [ ] Create task index/cache for faster lookups
- [ ] Implement incremental search with better debouncing
- [ ] Cache task hierarchy for traversal
- [ ] Add virtual scrolling for large result sets

**Expected Impact**: O(1) lookup vs O(n) iteration
**Effort**: 12 hours

---

### Phase 4: Input Validation & Security (Week 7)

**Objective**: Harden security and add comprehensive validation

- [ ] Add JSON schema validation (Zod or Yup)
- [ ] Validate all data from JSON files on load
- [ ] Add task ID validation throughout
- [ ] Add search term sanitization
- [ ] Implement input validation utility module
- [ ] Add security-focused unit tests

**Effort**: 10 hours

---

### Phase 5: Architecture Improvements (Weeks 8-10)

**Objective**: Reduce coupling and improve maintainability

#### 5.1 Create Gantt Abstraction Layer
- [ ] Design `GanttAdapter` interface
- [ ] Implement adapter for dhtmlx-gantt
- [ ] Refactor all direct `gantt.*` calls
- [ ] Add adapter unit tests

**Coupling Reduction**: 50+ direct gantt calls → single adapter
**Effort**: 16 hours

#### 5.2 Standardize Module Pattern
- [ ] Convert all files to ES modules
- [ ] Remove `window.*` global exports
- [ ] Implement explicit imports/exports
- [ ] Update build configuration

**Effort**: 12 hours

#### 5.3 Add JSDoc Type Annotations
- [ ] Document StateStore API
- [ ] Document KeyboardManager API
- [ ] Document GanttAdapter API
- [ ] Document utility functions
- [ ] Configure TypeScript checking (optional)

**Effort**: 8 hours

---

### Phase 6: Testing Infrastructure (Weeks 11-12)

**Objective**: Establish comprehensive test coverage

#### 6.1 Unit Tests (Target: 80% coverage)
- [ ] StateStore tests (priority 1)
- [ ] Utility function tests (priority 1)
- [ ] Command definition tests (priority 2)
- [ ] KeyboardManager tests (priority 2)
- [ ] GanttAdapter tests (priority 2)

**Effort**: 20 hours

#### 6.2 Integration Tests
- [ ] Keyboard navigation flows
- [ ] Command palette modes
- [ ] Filter application scenarios
- [ ] Search and focus workflows

**Effort**: 12 hours

#### 6.3 E2E Tests (Playwright or Cypress)
- [ ] VIM-style navigation sequences
- [ ] Theme switching persistence
- [ ] Data loading and refresh
- [ ] Error recovery scenarios

**Effort**: 16 hours

---

### Phase 7: Documentation & Developer Experience (Week 13)

**Objective**: Improve maintainability and onboarding

- [ ] Create ARCHITECTURE.md documenting design patterns
- [ ] Create CONTRIBUTING.md with development guidelines
- [ ] Add inline code comments for complex logic
- [ ] Create component usage examples
- [ ] Document VIM navigation patterns
- [ ] Create video walkthrough of features

**Effort**: 12 hours

---

## Performance Targets

| Metric | Current | Target | Phase |
|--------|---------|--------|-------|
| State polling frequency | 50ms | 250ms | 3.1 |
| Search complexity | O(n) | O(1) | 3.3 |
| Code duplication | ~150 lines | 0 lines | 2.2 |
| Largest file size | 1,195 lines | <400 lines | 2.3 |
| Test coverage | 0% | 80% | 6.1 |
| XSS vulnerabilities | 2 | 0 | 1, 4 |
| Memory leaks | 2+ | 0 | 1 |
| Global namespace pollution | 15+ symbols | 0 | 5.2 |

---

## Technical Debt Tracking

### High Priority Debt
1. ✅ Large files (990-1,195 lines) → Phase 2.3
2. ✅ Magic numbers throughout → Phase 2.1
3. ✅ Code duplication in task traversal → Phase 2.2
4. ✅ No unit tests → Phase 6.1
5. ✅ Global namespace pollution → Phase 5.2

### Medium Priority Debt
1. ⏸️ Tight coupling to dhtmlx-gantt → Phase 5.1
2. ⏸️ Mixed module patterns → Phase 5.2
3. ⏸️ Missing JSDoc annotations → Phase 5.3
4. ⏸️ No input validation → Phase 4
5. ⏸️ Unoptimized search → Phase 3.3

### Low Priority Debt
1. ⏸️ Inconsistent naming conventions
2. ⏸️ Dead code (toggleGrid, exportData)
3. ⏸️ Excessive console logging
4. ⏸️ No error boundaries

---

## Dependencies & Tools

### Required
- **DOMPurify** - XSS protection (Phase 1)
- **Zod** or **Yup** - JSON schema validation (Phase 4)
- **Vitest** - Unit testing framework (Phase 6)
- **Playwright** or **Cypress** - E2E testing (Phase 6)

### Optional
- **TypeScript** - Type checking with JSDoc (Phase 5.3)
- **ESLint** - Code quality enforcement
- **Prettier** - Code formatting
- **Bundle analyzer** - Build optimization

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking changes during refactor | High | Medium | Comprehensive test suite before refactoring |
| dhtmlx-gantt API changes | Medium | Low | Create abstraction layer early |
| Performance regression | Medium | Medium | Benchmark before/after each phase |
| Scope creep | Medium | High | Strict phase boundaries, regular reviews |
| Third-party dependency issues | Low | Low | Use well-maintained libraries only |

---

## Success Metrics

### Code Quality
- [ ] All files under 400 lines
- [ ] No magic numbers
- [ ] No code duplication
- [ ] 80%+ test coverage
- [ ] Zero security vulnerabilities
- [ ] Zero memory leaks

### Performance
- [ ] <100ms time to interactive
- [ ] <50ms keyboard response time
- [ ] <200ms search response time
- [ ] <5MB memory footprint

### Developer Experience
- [ ] Complete documentation
- [ ] Easy local setup
- [ ] Fast test execution (<10s)
- [ ] Clear contribution guidelines

---

## Timeline Summary

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Critical Fixes | 1 week | Week 1 | Week 1 |
| Phase 2: Code Organization | 3 weeks | Week 2 | Week 4 |
| Phase 3: Performance | 2 weeks | Week 5 | Week 6 |
| Phase 4: Security | 1 week | Week 7 | Week 7 |
| Phase 5: Architecture | 3 weeks | Week 8 | Week 10 |
| Phase 6: Testing | 2 weeks | Week 11 | Week 12 |
| Phase 7: Documentation | 1 week | Week 13 | Week 13 |

**Total Duration**: 13 weeks (3.25 months)

---

## References

- **Code Review Report**: 2025-10-23 (this document based on findings)
- **VIM Navigation Design**: CLAUDE.md (design guidelines)
- **JSON Specification**: `docs/JSON_GANTT_SPECIFICATION.md`
- **Current Status**: All 184 tests passing (116 unit + 68 RSpec)

---

## Maintenance Plan

After Phase 7 completion:

### Weekly
- Run full test suite
- Review code quality metrics
- Address new issues within 48 hours

### Monthly
- Dependency updates
- Security audit
- Performance benchmarking
- Technical debt review

### Quarterly
- Architecture review
- User feedback integration
- Feature planning
- Documentation updates

---

## Notes

- This roadmap is based on the comprehensive code review completed 2025-10-23
- All phases are designed to maintain backwards compatibility
- Each phase includes testing to prevent regressions
- Priority can be adjusted based on user feedback and business needs
- Estimated efforts assume single developer working part-time

**Next Step**: Create detailed implementation plan for Phase 1 (Critical Fixes)
