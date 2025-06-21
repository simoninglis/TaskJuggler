# TaskJuggler Web UI - Claude Instructions

## Server Management

The user will start the web UI server in a separate tmux session using one of these commands:

**Debug server with WebSocket logging (recommended for debugging):**
```bash
cd /home/singlis/work/TaskJuggler/web-ui && poetry run python dev/serve-with-debug.py
```

**Auto-reload server (recommended for development):**
```bash
cd /home/singlis/work/TaskJuggler/web-ui && python3 dev/serve-with-reload.py 2>&1 | tee /tmp/webui-server.log
```

**Standard server:**
```bash
cd /home/singlis/work/TaskJuggler/web-ui && python3 dev/serve.py 2>&1 | tee /tmp/webui-server.log
```

## Server Information

- **Debug server**: HTTP on port 8001, WebSocket debug on port 8002, auto-reload enabled, logs to `/tmp/webui-debug.log`
- **Auto-reload server**: Runs on port 8001, monitors file changes and auto-refreshes browser
- **Standard server**: Runs on port 8000, no auto-reload
- **Log locations**: 
  - HTTP requests: `/tmp/webui-server.log`
  - Debug messages: `/tmp/webui-debug.log` (debug server only)
- **Browser URL**: http://localhost:8001 (or 8000 for standard server)

## Debug Server Features

The debug server provides real-time debugging via WebSocket:
- Logs all keyboard events with full details
- Tracks focus changes
- Records custom debug messages
- Writes to `/tmp/webui-debug.log` for Claude Code to read

## Poetry Environment

The web UI uses Poetry for dependency management:
```bash
# Install dependencies
cd /home/singlis/work/TaskJuggler/web-ui && poetry install

# Run with Poetry
poetry run python serve-with-debug.py
```

Dependencies:
- `websockets`: For debug WebSocket server
- `playwright`: For automated testing of UI functionality

## Keyboard Navigation

The web UI implements custom keyboard navigation:
- **?**: Show keyboard help screen
- **Arrow Up/Down**: Navigate between tasks
- **Arrow Left/Right**: Collapse/expand tasks with children
- **+/-**: Zoom in/out on the timeline
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

1. User starts server in separate tmux session
2. Server logs HTTP requests to `/tmp/webui-server.log`
3. Debug server also logs WebSocket messages to `/tmp/webui-debug.log`
4. Claude can inspect both log files to:
   - Check server status
   - Debug keyboard/focus issues
   - See HTTP requests
   - Monitor file change detection (auto-reload)
   - View real-time debug events

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
Both debug and auto-reload servers check for file changes every second and automatically refresh the browser when changes are detected.

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
- **Zoom to hour view**: Switch timeline to hourly scale
- **Zoom to day view**: Switch timeline to daily scale
- **Zoom to week view**: Switch timeline to weekly scale
- **Zoom to month view**: Switch timeline to monthly scale
- **Zoom to quarter view**: Switch timeline to quarterly scale
- **Zoom to year view**: Switch timeline to yearly scale
- **Expand all tasks**: Open all parent tasks
- **Collapse all tasks**: Close all parent tasks

## Testing

Run automated tests with Playwright:
```bash
cd /home/singlis/work/TaskJuggler/web-ui
poetry run python test_keyboard_navigation.py
poetry run python test_command_palette.py
poetry run python test_simple_navigation.py
poetry run python test_keyboard_help.py
poetry run python test_help_palette_interaction.py
```

## Important Notes

- The server will run continuously until stopped with Ctrl+C
- Always check the appropriate log file if UI isn't working as expected
- The debug server is most useful for troubleshooting keyboard/focus issues
- Both auto-reload servers inject JavaScript to monitor file changes
- All servers add CORS headers for local development
- When debugging web components, check both light DOM and shadow DOM state
- The command palette uses Ninja Keys which is a web component with shadow DOM