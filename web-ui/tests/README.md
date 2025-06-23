# TaskJuggler Web UI Tests

This directory contains all automated tests for the TaskJuggler Web UI, organized by functionality and purpose.

## Directory Structure

- **command_palette/** - Tests for command palette functionality (Ctrl+Shift+P)
  - Basic open/close behavior
  - Search mode, go mode, focus mode
  - Command execution and keyboard navigation
- **keyboard/** - Tests for keyboard navigation and shortcuts
  - Arrow key navigation, comprehensive keyboard tests
  - Zoom shortcuts (+/-, mouse wheel)
  - VIM-like navigation (g, F, /, ?, etc.)
- **integration/** - Full UI integration tests
  - **theme/** - Theme toggling and theme management
  - Data loading and Gantt chart functionality
  - Mouse wheel zoom, Enter key behavior
  - App initialization and error handling
- **components/** - Web Component tests
  - Lit component functionality (keyboard-help, theme-manager)
  - Component isolation and API testing
- **helpers/** - Shared test utilities and helper functions
- **scripts/** - Test execution scripts and utilities  
- **debug/** - Debug-specific test files
- **documentation/** - Test-related documentation
- **archived/** - Archived debug and variant test files

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install
poetry install

# Start development server
npm run dev
# OR with debug WebSocket
poetry run python server/serve-with-vite.py
```

### Run all tests:
```bash
python scripts/run_tests.py all
```

### Run specific category:
```bash
python scripts/run_tests.py command_palette
python scripts/run_tests.py keyboard
python scripts/run_tests.py integration
python scripts/run_tests.py components
```

### Run individual test:
```bash
poetry run pytest tests/integration/test_mouse_wheel_zoom.py -v -s
```

## Test Architecture

### Test Helpers
- **command_palette_helpers.py** - Utilities for command palette testing
- Common functions for state detection, interaction, and validation

### Test Patterns
```python
import pytest
from playwright.sync_api import Page, expect
import time

def test_feature_name(page: Page):
    """Test description"""
    page.goto("http://localhost:8001")
    
    # Wait for Gantt to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)  # Allow data to load
    
    # Test interaction
    page.click("#gantt_here")
    page.keyboard.press("?")
    
    # Assert results
    expect(page.locator(".keyboard-help-overlay")).to_be_visible()
```

## Test Requirements

- **Python 3.8+** with Poetry for dependency management
- **Node.js** for Vite development server
- **Web UI server** running on localhost:8001
- **Playwright** for browser automation

## Adding New Tests

1. **Choose appropriate directory** based on functionality:
   - Web Component behavior → **components/**
   - Keyboard interactions → **keyboard/**
   - Command palette features → **command_palette/**
   - Complex workflows → **integration/**

2. **Follow naming conventions**:
   - Files: `test_feature_name.py`
   - Functions: `test_specific_behavior()`
   - Use descriptive names that explain what is being tested

3. **Use test helpers** for common operations:
   - Import from `helpers/command_palette_helpers.py`
   - Follow existing patterns for consistency

4. **Include proper documentation**:
   - Docstrings explaining test purpose
   - Comments for complex test logic
   - Clear assertions with meaningful error messages

## Debugging Tests

- Run with `-s` flag to see print statements: `pytest test_file.py -v -s`
- Check server logs: `tail -f /tmp/webui-server.log`
- Use browser debug mode: `pytest test_file.py --headed --slowmo=1000`
- Monitor debug WebSocket: `tail -f /tmp/webui-debug.log`

## Test Coverage

Current test coverage includes:
- ✅ Command palette (all modes and interactions)
- ✅ Keyboard navigation (arrows, shortcuts, VIM-like keys)
- ✅ Theme management and layout responsiveness
- ✅ Mouse wheel zoom functionality
- ✅ Web Components (Lit components)
- ✅ State management and synchronization
- 🔄 Task editing and data manipulation (in progress)
- 📋 Export features and advanced filtering (planned)