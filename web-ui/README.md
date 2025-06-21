# TaskJuggler Web UI Prototype

This directory contains a prototype for a modern, interactive Gantt chart interface using DHTMLX Gantt library.

## Design Philosophy

### VIM-Like Keyboard Navigation
This UI is designed with VIM users in mind, implementing keyboard-first navigation:

- **Modal Interface**: Different modes for viewing, searching, and editing
- **Single-Key Commands**: Common operations use unmodified keys
- **Mnemonic Shortcuts**: Keys match action names (F for Focus, / for search)
- **Minimal Keystrokes**: Optimized for efficiency
- **Escape to Exit**: Consistent use of Esc to leave modes

Key bindings follow VIM conventions where applicable:
- `/` - Enter search mode (with month navigation support)
- `?` - Show help
- `g` - Go navigation menu (jump to dates, milestones, etc.)
- `F` - Focus on area (like VIM's fold commands)
- `+/-` - Zoom in/out
- `Space` - Toggle (like VIM's fold toggle)
- Future: `hjkl` for navigation (currently using arrow keys)

## Structure

- `index.html` - Main HTML file for the Gantt interface
- `js/` - JavaScript files (future custom scripts)
- `css/` - Custom styles (currently inline)
- `data/` - JSON data files
  - `sample-gantt.json` - Sample data in TaskJuggler JSON format
- `test-project.tjp` - Sample TaskJuggler project file
- `dev/` - Development tools and servers
  - `serve.py` - Basic HTTP server
  - `serve-with-reload.py` - Auto-reload development server
  - `serve-with-debug.py` - Debug server with WebSocket logging
  - `logs/` - Runtime logs
- `tests/` - Automated test suite
  - `command_palette/` - Command palette functionality tests
  - `keyboard/` - Keyboard navigation tests
  - `integration/` - Integration and UI tests
- `run_tests.py` - Test runner script

## Features

- **Interactive Gantt Chart**: Built with DHTMLX Gantt (open source)
- **TaskJuggler Integration**: Reads JSON data exported from TaskJuggler
- **Modern Controls**: 
  - Toggle edit/read-only mode
  - Zoom in/out (hour/day/week/month)
  - Grid visibility toggle
  - JSON export
- **Real-time Status**: Shows current operations and data loading
- **Claude Code Integration Hooks**: Event handlers prepared for TJP file updates

## Usage

### View the Prototype
1. Open `index.html` in a web browser
2. The page will load sample data automatically
3. Use the controls to interact with the Gantt chart

### With Real TaskJuggler Data
1. Generate JSON output from TaskJuggler (when JSON support is fully implemented):
   ```bash
   tj3 project.tjp
   ```
2. Place the generated JSON file in the `data/` directory
3. Update the fetch URL in `index.html`

### Development Server
1. Start the development server:
   ```bash
   poetry run python dev/serve-with-debug.py  # Recommended for development
   # OR
   python dev/serve-with-reload.py            # Auto-reload server
   # OR  
   python dev/serve.py                        # Basic server
   ```
2. Open http://localhost:8001 in your browser
3. Check `dev/logs/` for debug information

### Running Tests
```bash
# Run all tests
python run_tests.py all

# Run specific test categories
python run_tests.py command_palette
python run_tests.py keyboard
python run_tests.py integration

# Run individual test
poetry run python tests/command_palette/test_command_palette.py
```

## Current Status

- ✅ DHTMLX Gantt integration working
- ✅ Sample data loading and display
- ✅ Interactive controls (zoom, edit mode, etc.)
- ✅ Event handlers for Claude Code integration
- ⚠️ TaskJuggler JSON export needs debugging (warning about format support)
- 🔄 Claude Code integration needs implementation

## Interactive Features

- **Task Management**: Add, edit, delete tasks
- **Dependency Management**: Create and modify task dependencies  
- **Progress Tracking**: Visual progress bars
- **Time Scaling**: Dynamic zoom from hours to months
- **Today Marker**: Shows current date
- **Tooltips**: Hover information for tasks

## Next Steps

1. Debug TaskJuggler JSON export format registration
2. Implement Claude Code communication for live TJP file updates
3. Add more advanced filtering and search capabilities
4. Create task templates and bulk operations
5. Add project statistics and reporting

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **Gantt Library**: DHTMLX Gantt (GPL v2, matches TaskJuggler license)
- **Backend**: TaskJuggler Ruby application
- **Data Format**: JSON (TaskJuggler → DHTMLX conversion)

This prototype demonstrates the potential for a modern, responsive web interface for TaskJuggler project management.