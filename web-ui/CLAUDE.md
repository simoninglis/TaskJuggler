# TaskJuggler Web UI - Claude Instructions

## Design Principles

### VIM-Like Navigation
The web UI follows VIM-like navigation principles where possible:
- **Modal operation**: Different modes for different tasks (navigation, search, edit)
- **Single key commands**: Most common operations use single keys without modifiers
- **Mnemonic keys**: Key choices based on action names (e.g., 'f' for focus, '/' for search)
- **Efficiency**: Minimize keystrokes for common operations
- **Home row focus**: Keep fingers on home row for navigation

Current VIM-inspired bindings:
- `/` - Search (like VIM's search) - includes month navigation
- `?` - Help (like VIM's help)
- `g` - Go navigation (like VIM's 'gg' but opens navigation menu)
- `F` - Focus mode (capital F for special operation)
- `Esc` - Exit modes/cancel operations
- `+/-` - Zoom in/out
- `Space` - Toggle expand/collapse

Future VIM-like enhancements to consider:
- `j/k` - Up/down navigation (supplement arrow keys)
- `h/l` - Left/right navigation (collapse/expand)
- `gg` - Go to first task
- `G` - Go to last task
- `n/N` - Next/previous search result
- `:` - Command mode for advanced operations
- `m{mark}` - Set bookmarks on tasks
- `'{mark}` - Jump to bookmarked task
- `zc/zo` - Close/open folds (task groups)
- `za` - Toggle fold
- `.` - Repeat last action

## Server Management

The user will start the web UI server in a separate tmux session using one of these commands:

**Vite development server (recommended - includes hot module replacement):**
```bash
cd /home/singlis/work/TaskJuggler/web-ui && npm run dev
```

**Vite + WebSocket debug server (for full debugging):**
```bash
cd /home/singlis/work/TaskJuggler/web-ui && poetry run python server/serve-with-vite.py
```

**Legacy servers (deprecated):**
- Debug server: `poetry run python server/serve-with-debug.py`
- Auto-reload server: `python3 server/serve-with-reload.py`
- Standard server: `python3 server/serve.py`

## Server Information

- **Debug server**: HTTP on port 8001, WebSocket on port 8002, file system monitoring with instant reload, logs to `/tmp/webui-debug.log`
- **Auto-reload server**: Runs on port 8001, monitors file changes and auto-refreshes browser (deprecated - use debug server instead)
- **Standard server**: Runs on port 8000, no auto-reload
- **Log locations**: 
  - HTTP requests: `/tmp/webui-server.log`
  - Debug messages: `/tmp/webui-debug.log` (debug server only)
- **Browser URL**: http://localhost:8001 (or 8000 for standard server)

## Debug Server Features

The debug server provides real-time communication via WebSocket:
- **Browser → Server**: Debug messages, keyboard events, focus changes
- **Server → Browser**: File change notifications, live updates, push messages
- Instant auto-reload when files change (no polling)
- Logs all activity to `/tmp/webui-debug.log` for Claude Code to read
- Foundation for real-time TaskJuggler integration

## Poetry Environment

The web UI uses Poetry for dependency management:
```bash
# Install dependencies
cd /home/singlis/work/TaskJuggler/web-ui && poetry install

# Run with Poetry
poetry run python serve-with-debug.py
```

Dependencies:
- `websockets`: For debug WebSocket server and real-time communication
- `watchdog`: For file system monitoring and auto-reload
- `playwright`: For automated testing of UI functionality

## Keyboard Navigation

The web UI implements custom keyboard navigation:
- **?**: Show keyboard help screen
- **Arrow Up/Down**: Navigate between tasks
- **Arrow Left/Right**: Collapse/expand tasks with children
- **+/-**: Zoom in/out on the timeline
- **g**: Go navigation - quick jumps to today, project start/end, milestones, months
- **Ctrl+F**: Focus search box
- **Ctrl+Shift+P**: Open command palette
- **/**: Search tasks in command palette
- **F**: Focus search - zoom to specific area
- **Shift+F**: Focus on current selection
- **Space**: Toggle expand/collapse for parent tasks
- **Enter**: Toggle expand/collapse for parent tasks, or edit leaf tasks (when in edit mode)
- **Escape**: Clear search (when search is focused) or close dialogs

## Known Issues & Solutions

### Focus Management
- DHTMLX Gantt's built-in keyboard navigation can conflict with custom handlers
- Solution: Disabled `gantt.config.keyboard_navigation_cells` to prevent cell navigation
- Keyboard handlers attached at document level using capture phase

### Dual Focus Indicators
- Visual issue where row highlighting and cell outline can get out of sync
- Related to DHTMLX's internal focus management switching between elements
- Focus can be on "DIV", "BODY", or "DIV#gantt_here"

### Command Palette Integration (Ninja Keys)
- Uses Ninja Keys web component for VS Code-style command palette
- Shadow DOM requires special handling for state detection
- **Key insight**: Check for `.backdrop` element in shadow DOM as reliable indicator of open state
- The `.modal.visible` class may persist after closing, making it unreliable
- Event handling must account for web component's shadow DOM encapsulation
- Initialize after `customElements.whenDefined('ninja-keys')` to ensure proper setup

### Web Component Event Handling
- Avoid using capture phase (`true` parameter) in addEventListener when integrating with web components
- Web components may use shadow DOM which affects event propagation
- Use MutationObserver to track attribute changes on custom elements
- Test both light DOM attributes and shadow DOM state for accurate detection

### Keyboard Shortcut Registration
- **Browser key reporting**: When pressing Shift+/, browsers report it as key='?' with shiftKey=true
- **Key combo generation**: The keyboard manager generates combos as "shift+?" not "shift+/"
- **Solution**: Register hotkeys using the exact string the browser will generate
- Example: Use `registerGlobalHotkey('shift+?', ...)` not `registerGlobalHotkey('shift+/', ...)`

### DHTMLX Gantt Scale Configuration
- **Deprecation warning**: `gantt.config.scale_unit` and `gantt.config.date_scale` are deprecated
- **New format**: Use `gantt.config.scales` array with unit/step/format objects
- Example:
  ```javascript
  gantt.config.scales = [
    {unit: "month", step: 1, format: "%F %Y"},
    {unit: "day", step: 1, format: "%d %M"}
  ];
  ```

### Port Already in Use
```bash
# Kill process using port
lsof -ti:8001 | xargs -r kill -9
lsof -ti:8002 | xargs -r kill -9  # For WebSocket port
```

## Inspecting Server Status

To check if the server is running and view logs:
```bash
# Check HTTP server log
cat /tmp/webui-server.log

# Check debug messages (debug server only)
cat /tmp/webui-debug.log

# Check if server is running
ps aux | grep -E "serve(-with-reload|-with-debug)?\.py" | grep -v grep

# Check if port is in use
lsof -i :8001  # or :8000 for standard server
lsof -i :8002  # WebSocket debug port
```

## Development Workflow

### With Vite (Recommended)
1. Install dependencies: `npm install`
2. Start Vite dev server: `npm run dev`
3. Open http://localhost:8001 in browser
4. Edit files - Vite provides instant hot module replacement (HMR)
5. Build for production: `npm run build`

### Benefits of Vite
- **ES Modules**: Native support for modern JavaScript modules
- **Hot Module Replacement**: Instant updates without page reload
- **Dependency Bundling**: Automatic bundling of npm packages like Lit
- **Fast Builds**: Lightning-fast development and production builds
- **TypeScript Ready**: Built-in TypeScript support
- **Web Components**: First-class support for Lit and other frameworks

### Legacy Workflow
1. User starts server in separate tmux session
2. Server logs HTTP requests to `/tmp/webui-server.log`
3. Debug server also logs WebSocket messages to `/tmp/webui-debug.log`
4. Claude can inspect both log files to:
   - Check server status
   - Debug keyboard/focus issues
   - See HTTP requests
   - Monitor file change notifications via WebSocket
   - View real-time debug events and server push messages

## Implementation Details

### Debug Logging
The `window.debugLog()` function is injected by the debug server and sends messages via WebSocket:
```javascript
window.debugLog('event', 'Keydown event', {
    key: e.key,
    keyCode: e.keyCode,
    // ... other event details
});
```

### Auto-Reload
The debug server uses file system monitoring (watchdog) to detect changes and pushes reload notifications to browsers via WebSocket. This eliminates the need for constant polling and reduces server load.

## Command Palette Commands

The command palette (Ctrl+K) provides the following commands:

### Filter Commands
- **Show overdue tasks**: Filter to tasks with end dates before today
- **Show tasks due today**: Filter to tasks ending today
- **Show tasks due this week**: Filter to tasks ending within 7 days
- **Show completed tasks**: Filter to tasks with 100% progress
- **Show in-progress tasks**: Filter to tasks with progress between 1-99%
- **Clear all filters**: Remove all active filters

### View Commands
- **Toggle dark mode**: Switch between light and dark theme
- **Toggle fullscreen**: Enter or exit fullscreen mode
- **Zoom to hour view**: Switch timeline to hourly scale
- **Zoom to day view**: Switch timeline to daily scale
- **Zoom to week view**: Switch timeline to weekly scale
- **Zoom to month view**: Switch timeline to monthly scale
- **Zoom to quarter view**: Switch timeline to quarterly scale
- **Zoom to year view**: Switch timeline to yearly scale
- **Expand all tasks**: Open all parent tasks
- **Collapse all tasks**: Close all parent tasks

### Go Navigation (accessed via 'g' key)
- **Today**: Jump to current date
- **Project Start**: Jump to beginning of project timeline
- **Project End**: Jump to end of project timeline
- **Next Milestone**: Jump to next milestone from today
- **Previous Milestone**: Jump to previous milestone from today
- **Current Month**: Jump to start of current month
- **Next Month**: Jump to start of next month
- **Selected Task**: Center view on currently selected task

## Testing

The web UI uses Playwright with Python for automated testing. Tests are organized by feature area and use Poetry for dependency management.

### Test Structure
```
tests/
├── smoke/             # Quick smoke tests for core functionality
├── command_palette/    # Command palette tests
├── keyboard/          # Keyboard navigation tests
├── integration/       # Integration and feature tests
├── misc/              # Miscellaneous tests (moved from root)
└── fixtures/          # Test data files

scripts/
└── run_tests.py      # Test runner script
```

### Running Tests

**Prerequisites:**
1. Start the debug server in a separate terminal:
   ```bash
   cd /home/singlis/work/TaskJuggler/web-ui
   poetry run python server/serve-with-debug.py
   ```

2. Run tests:
   ```bash
   # Run all tests
   python scripts/run_tests.py all
   
   # Run smoke tests (quick verification of core functionality)
   poetry run pytest tests/smoke/test_smoke_suite.py -v
   
   # Run specific category
   python scripts/run_tests.py command_palette
   python scripts/run_tests.py keyboard
   python scripts/run_tests.py integration
   python scripts/run_tests.py misc
   
   # Run individual test file
   poetry run pytest tests/integration/test_milestones.py -v -s
   ```

### Smoke Tests

The smoke test suite (`tests/smoke/test_smoke_suite.py`) provides quick verification of core functionality:
- Application loads without errors
- Gantt chart loads with data
- Keyboard help opens/closes (?)
- Command palette opens/closes (Ctrl+Shift+P)
- Theme toggle works
- Zoom controls work (+/-)
- Search functionality (/)
- Navigation keys work (Arrow keys)
- State store is initialized
- Mouse wheel zoom works (Ctrl+Scroll)

Run smoke tests in under 30 seconds to verify the web UI is functioning correctly.

### Writing Tests

Example test structure:
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
    
    # Interact with UI
    page.click("#gantt_here")
    page.keyboard.press("?")
    
    # Assert results
    expect(page.locator(".keyboard-help-overlay")).to_be_visible()
```

### Common Test Patterns

**Check Gantt data:**
```python
task_info = page.evaluate("""
    () => {
        if (typeof gantt === 'undefined') return null;
        const tasks = gantt.getTaskByTime();
        return tasks.map(task => ({
            id: task.id,
            text: task.text,
            type: task.type
        }));
    }
""")
```

**Debug console output:**
```python
# Use -s flag with pytest to see print statements
print(f"Found {len(tasks)} tasks")
```

**Wait for dynamic content:**
```python
# Wait for specific element
page.wait_for_selector(".gantt_task_line", state="visible")

# Wait with timeout
page.wait_for_timeout(1000)  # milliseconds
```

## Responsive Layout

The web UI now features a fully responsive layout that adapts to different screen sizes:

### Layout Features
- **Full viewport usage**: Gantt chart uses all available browser space
- **Collapsible status section**: Click header to toggle, state saved in localStorage
- **Dynamic resizing**: Automatically adjusts when browser window is resized
- **Responsive breakpoints**:
  - Desktop (> 1024px): Full layout with all features
  - Tablet (768-1024px): Compact header and spacing
  - Mobile (< 768px): Optimized for small screens
- **Fullscreen mode**: Available via command palette

### Layout Architecture
- CSS Flexbox for main layout structure
- Gantt container fills remaining viewport height
- Minimal margins and padding for maximum content area
- Status section can be collapsed to gain more vertical space

## Important Notes

- The server will run continuously until stopped with Ctrl+C
- Always check the appropriate log file if UI isn't working as expected
- The debug server is most useful for troubleshooting keyboard/focus issues
- Both auto-reload servers inject JavaScript to monitor file changes
- All servers add CORS headers for local development
- When debugging web components, check both light DOM and shadow DOM state
- The command palette uses Ninja Keys which is a web component with shadow DOM

## TaskJuggler JSON Data Format

The web UI supports two JSON formats for TaskJuggler data:

### Legacy Format (simple)
The original format from `sample-gantt.json` with basic task information.

### Comprehensive Format (v1.0)
The new format generated by TaskJuggler's JsonReport includes:
- Full project metadata (timezone, currency, working hours)
- Multiple scenarios support
- Resource assignments and allocation data
- Detailed task attributes (cost, effort, status, flags)
- Dependency types (FS, SS, FF, SF)
- Account/financial information
- View configuration

The web UI automatically detects the format version and handles both formats transparently. The comprehensive format enables:
- Resource allocation display
- Cost tracking
- Multi-scenario comparison
- Critical path highlighting
- Task status indicators

See `/docs/JSON_GANTT_SPECIFICATION.md` for the complete format specification.