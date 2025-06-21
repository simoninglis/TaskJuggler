# TaskJuggler Web UI Tests

This directory contains all automated tests for the TaskJuggler Web UI.

## Directory Structure

- **command_palette/** - Tests for command palette functionality (Ctrl+K)
- **keyboard/** - Tests for keyboard navigation and shortcuts
- **integration/** - Integration tests and miscellaneous UI tests

## Running Tests

### Run all tests:
```bash
python run_tests.py all
```

### Run specific category:
```bash
python run_tests.py command_palette
python run_tests.py keyboard
python run_tests.py integration
```

### Run individual test:
```bash
poetry run python tests/command_palette/test_command_palette.py
```

## Test Requirements

Tests require:
- Poetry environment with playwright installed
- Web UI server running on localhost:8001
- Start server with: `poetry run python dev/serve-with-debug.py`

## Adding New Tests

1. Place tests in the appropriate category directory
2. Name files with `test_` prefix
3. Use playwright for browser automation
4. Follow existing test patterns for consistency