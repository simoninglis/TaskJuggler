# TaskJuggler Web UI Prototype

This directory contains a prototype for a modern, interactive Gantt chart interface using DHTMLX Gantt library.

## Structure

- `index.html` - Main HTML file for the Gantt interface
- `js/` - JavaScript files (future custom scripts)
- `css/` - Custom styles (currently inline)
- `data/` - JSON data files
  - `sample-gantt.json` - Sample data in TaskJuggler JSON format
- `test-project.tjp` - Sample TaskJuggler project file

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