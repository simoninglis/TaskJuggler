# TaskJuggler Web UI

A modern, interactive Gantt chart interface for TaskJuggler project management software, built with Web Components and featuring VIM-inspired keyboard navigation.

## Features

### 🎯 Core Functionality
- **Interactive Gantt Chart**: Built with DHTMLX Gantt (open source)
- **TaskJuggler Integration**: Reads JSON data exported from TaskJuggler
- **Real-time Updates**: Live communication between server and browser
- **Modern Architecture**: Built with Lit Web Components and centralized state management

### ⌨️ VIM-Like Navigation
This UI is designed with VIM users in mind, implementing keyboard-first navigation:

- **Modal Interface**: Different modes for viewing, searching, and editing
- **Single-Key Commands**: Common operations use unmodified keys
- **Mnemonic Shortcuts**: Keys match action names (F for Focus, / for search)
- **Minimal Keystrokes**: Optimized for efficiency
- **Escape to Exit**: Consistent use of Esc to leave modes

#### Key Bindings
- `/` - Enter search mode (with month navigation support)
- `?` - Show help screen
- `g` - Go navigation menu (jump to dates, milestones, etc.)
- `F` - Focus mode (zoom to specific area)
- `Shift+F` - Focus on current selection
- `+/-` - Zoom in/out
- `Ctrl/Cmd + Scroll` - Mouse wheel zoom
- `Space` - Toggle expand/collapse
- `Enter` - Execute commands or toggle tasks
- `]m / [m` - Jump to next/previous milestone
- `Ctrl+Shift+P` - Command palette

### 🎨 Modern UI
- **Responsive Layout**: Uses full browser viewport, adapts to screen sizes
- **Dark/Light Theme**: Toggle with automatic system preference detection
- **Collapsible Sections**: Status section can be minimized for more space
- **Fullscreen Mode**: Distraction-free project viewing
- **Visual Feedback**: Status updates and smooth transitions

### 🔍 Advanced Features
- **Command Palette**: VS Code-style command interface (Ctrl+Shift+P)
- **Smart Search**: Search tasks with context-aware filtering
- **Focus Mode**: Isolate task hierarchies for detailed work
- **Milestone Navigation**: Quick jumps between project milestones
- **Filter System**: Show overdue, current, completed tasks
- **Zoom Levels**: Hour, day, week, month, quarter, year views

## Quick Start

### Prerequisites
- Node.js (for Vite development server)
- Python 3.8+ with Poetry (for testing and debug server)

### Development Setup
1. **Install dependencies:**
   ```bash
   npm install              # Frontend dependencies
   poetry install          # Python testing dependencies
   ```

2. **Start development server:**
   ```bash
   npm run dev             # Vite server with hot reload (recommended)
   # OR
   poetry run python server/serve-with-vite.py  # Vite + WebSocket debug
   ```

3. **Open your browser:**
   Navigate to http://localhost:8001

### Running Tests
```bash
# Run all tests
python scripts/run_tests.py all

# Run specific categories
python scripts/run_tests.py command_palette
python scripts/run_tests.py keyboard
python scripts/run_tests.py integration

# Run individual test
poetry run pytest tests/integration/test_mouse_wheel_zoom.py -v
```

## Project Structure

```
web-ui/
├── src/                           # Source code
│   ├── index.html                # Main application entry point
│   ├── css/                      # Stylesheets
│   │   ├── main.css             # Base styles
│   │   ├── dark-theme.css       # Dark theme variables
│   │   └── responsive-layout.css # Responsive design
│   ├── js/                       # JavaScript modules
│   │   ├── main.js              # Application entry point
│   │   ├── stateStore.js        # Centralized state management
│   │   ├── components/          # Lit Web Components
│   │   │   ├── keyboard-help.js # Help screen component
│   │   │   ├── theme-manager.js # Theme management
│   │   │   └── layout-manager.js# Layout management
│   │   ├── gantt-*.js           # Gantt chart modules
│   │   ├── keyboard-manager.js   # Keyboard event handling
│   │   └── custom-command-palette.js # Command system
│   └── data/                     # Sample data
│       └── sample-gantt.json    # Demo project data
├── tests/                        # Test suite
│   ├── command_palette/         # Command palette tests
│   ├── keyboard/                # Keyboard navigation tests
│   ├── integration/             # UI integration tests
│   ├── scripts/                 # Test utility scripts
│   └── helpers/                 # Test helper functions
├── server/                       # Development servers
│   ├── serve-with-vite.py       # Vite + WebSocket debug server
│   ├── serve-with-debug.py      # WebSocket debug server
│   └── logs/                    # Server logs
├── docs/                         # Documentation
│   └── archive/                 # Archived plans and documents
├── package.json                  # Node.js dependencies
├── vite.config.js               # Vite configuration
├── pyproject.toml               # Python dependencies
└── justfile                     # Build automation (see below)
```

## Build System

The project uses [Just](https://github.com/casey/just) for build automation. Common commands:

```bash
just dev        # Start development server
just build      # Build for production
just test       # Run test suite
just clean      # Clean build artifacts
just help       # Show all available commands
```

*Note: Install Just with `cargo install just` or your package manager*

## Architecture

### State Management
- **Centralized Store**: All application state managed by `stateStore.js`
- **Reactive Updates**: Components automatically update when state changes
- **Subscription System**: Modules can subscribe to specific state changes
- **Dot Notation Paths**: Access nested state with paths like `'commandPalette.isOpen'`

### Web Components
- **Lit Framework**: Modern, lightweight Web Components library
- **Shadow DOM**: Encapsulated styles and behavior
- **Reactive Properties**: Automatic re-rendering on property changes
- **Custom Elements**: Standard Web Components API

### Module System
- **ES Modules**: Native JavaScript modules with imports/exports
- **Vite Integration**: Fast development with hot module replacement
- **Tree Shaking**: Optimized production builds

## Technology Stack

- **Frontend Framework**: [Lit](https://lit.dev/) Web Components
- **Build Tool**: [Vite](https://vitejs.dev/) for development and bundling
- **Gantt Library**: [DHTMLX Gantt](https://dhtmlx.com/docs/products/dhtmlxGantt/) (GPL v2)
- **Testing**: [Playwright](https://playwright.dev/) with Python
- **State Management**: Custom reactive store
- **Backend**: TaskJuggler Ruby application
- **Data Format**: JSON (TaskJuggler → DHTMLX conversion)

## Current Status

### ✅ Completed Features
- Interactive Gantt chart with full DHTMLX integration
- VIM-inspired keyboard navigation system
- Command palette with search, go, and focus modes
- Lit Web Components migration (keyboard-help, theme-manager, layout-manager)
- Centralized state management with reactive updates
- Mouse wheel zoom with Ctrl/Cmd modifier
- Dark/light theme system with persistence
- Responsive layout with collapsible sections
- Comprehensive test suite with Playwright
- Modern development setup with Vite and HMR

### 🚧 Work in Progress
- Command palette migration to Lit Web Component
- Additional VIM navigation shortcuts (hjkl, gg, G, etc.)
- Real-time TaskJuggler file synchronization

### 📋 Planned Features
- Task editing (inline name editing, drag dates/dependencies)
- Advanced filtering (by resource, status, date range)
- Export features (PDF, PNG/SVG, filtered views)
- Resource view and utilization charts
- Critical path highlighting

## Development Workflow

### With Vite (Recommended)
1. `npm run dev` - Start development server with hot reload
2. Edit files - Changes apply instantly
3. `npm run build` - Build for production

### With Debug Server
1. `poetry run python server/serve-with-debug.py` - Start WebSocket debug server
2. Monitor `/tmp/webui-debug.log` for real-time debug info
3. Use `window.debugLog()` in browser for custom debug messages

### Testing
1. Start debug server: `poetry run python server/serve-with-debug.py`
2. Run tests: `python scripts/run_tests.py all`
3. Check test results and logs

## Contributing

1. Follow existing code patterns and naming conventions
2. Write tests for new features
3. Update documentation when adding functionality
4. Use the centralized state store for shared state
5. Follow VIM-inspired design principles for keyboard shortcuts

## License

GPL v2 (matches TaskJuggler license)

---

This project demonstrates the potential for a modern, responsive web interface for TaskJuggler project management, combining the power of traditional project management tools with modern web development practices.