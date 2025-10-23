# Smoke Test Suite

Quick verification tests to ensure critical functionality is working. These tests should complete in under 2 minutes and catch major breaking changes.

## Test Coverage

The smoke test suite covers:

1. **Application Loading** - Verifies the app loads without critical errors
2. **Gantt Data Loading** - Ensures tasks are loaded and displayed
3. **Keyboard Help** - Tests help screen opens/closes with `?`
4. **Command Palette** - Verifies Ctrl+Shift+P opens command interface
5. **Theme Toggle** - Tests dark/light theme switching
6. **Zoom Controls** - Verifies zoom in/out with +/- keys
7. **Search Functionality** - Tests `/` opens search mode
8. **Navigation Keys** - Verifies arrow key navigation works
9. **State Store** - Ensures centralized state is initialized
10. **Mouse Wheel Zoom** - Tests Ctrl+scroll wheel zoom

## Running Smoke Tests

```bash
# Run smoke tests only
python tests/run_test_suites.py smoke

# Run individual smoke test
poetry run pytest tests/smoke/test_smoke_suite.py -v

# Run specific test function
poetry run pytest tests/smoke/test_smoke_suite.py::TestSmokeSuite::test_01_app_loads_successfully -v
```

## Success Criteria

All smoke tests must pass before:
- Deploying to production
- Running full regression suite
- Merging pull requests

## Test Philosophy

Smoke tests should be:
- **Fast** - Complete in seconds, not minutes
- **Reliable** - No flaky tests allowed
- **Critical** - Only test essential functionality
- **Independent** - Each test can run in isolation

## Troubleshooting

If smoke tests fail:

1. Check server is running: `npm run dev`
2. Verify no console errors in browser
3. Check test logs: `tests/test_report.txt`
4. Run individual failing test with `-s` for debug output