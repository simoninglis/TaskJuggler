# Regression Test Suite

Comprehensive tests to ensure no functionality has regressed. These tests cover all features, edge cases, and integration scenarios.

## Test Coverage

The regression test suite includes:

### Gantt Functionality
- Task selection and highlighting
- Expand/collapse parent tasks
- Timeline horizontal scrolling

### Command Palette
- All modes (command, search, go, focus)
- Command execution
- Search with result navigation

### Keyboard Navigation
- VIM-style shortcuts (g, F, /, ?)
- Milestone navigation (]m, [m)
- Arrow key navigation

### Theme and Layout
- Theme persistence across reloads
- Layout responsiveness (desktop/tablet)
- Status section collapse/expand

### Zoom Functionality
- All zoom levels (hour → year)
- Zoom limits enforcement
- Keyboard and mouse wheel zoom

### Focus Mode
- Task hierarchy isolation
- Enter/exit focus mode
- Search within focus

### Web Components
- Component initialization
- Shadow DOM encapsulation
- API functionality

### Error Handling
- Graceful error recovery
- No uncaught exceptions
- App remains functional

### Performance
- Load time < 5 seconds
- Render performance metrics
- Responsive UI interactions

## Running Regression Tests

```bash
# Run full regression suite
python tests/run_test_suites.py regression

# Run after smoke tests pass
python tests/run_test_suites.py all

# Run specific regression area
poetry run pytest tests/regression/test_regression_suite.py::TestRegressionSuite::test_gantt_task_selection -v
```

## Test Organization

Tests are organized by feature area:
- Gantt functionality
- Command palette features
- Keyboard navigation
- Theme and layout
- Zoom controls
- Focus mode
- Web components
- Error handling
- Performance metrics

## Success Criteria

Regression tests should:
- Maintain 100% pass rate
- Complete within 10 minutes
- Cover all user-facing features
- Test edge cases and error conditions

## Adding New Tests

When adding features, include regression tests for:
1. Happy path functionality
2. Edge cases
3. Error conditions
4. Integration with existing features
5. Performance impact

## Debugging Failures

For failing regression tests:

1. Run individual test with debug output:
   ```bash
   poetry run pytest tests/regression/test_regression_suite.py::TestRegressionSuite::test_name -v -s
   ```

2. Check browser console for errors

3. Use headed mode for visual debugging:
   ```bash
   poetry run pytest tests/regression/test_regression_suite.py --headed --slowmo=1000
   ```

4. Review test report: `tests/test_report.txt`