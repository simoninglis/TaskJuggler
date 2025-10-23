# Archived Tests

This directory contains test files that have been archived during the test suite cleanup. These files are preserved for historical reference but are not part of the active test suite.

## Directory Structure

- **debug_tests/** - Debug and development test files (bug fixes, debugging variants)
- **data_loading_variants/** - Early iterations of data loading tests
- **enter_key_variants/** - Multiple versions of enter key functionality tests

## Why These Tests Were Archived

These files were moved here during test organization cleanup because they:
- Were superseded by comprehensive tests in the main test suite
- Contained debugging code that's no longer needed
- Were duplicate implementations of the same functionality
- Had inconsistent test patterns or outdated approaches

## Accessing Archived Tests

If you need to reference the archived tests:
```bash
# View archived debug tests
ls tests/archived/debug_tests/

# Run an archived test (if needed for reference)
poetry run python tests/archived/debug_tests/test_command_palette_state_debug.py
```

## Restoration

If any of these tests are needed again, they can be moved back to the appropriate test directory and updated to match current test patterns.