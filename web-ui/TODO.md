# TaskJuggler Web UI - TODO List

## Features to Implement

### High Priority

- [ ] **Mouse Wheel Zoom** - Middle scroll wheel to zoom in/out on timeline
  - Ctrl+Scroll or Cmd+Scroll for zoom
  - Zoom centered on mouse position
  - Smooth zoom transitions

### Medium Priority

- [ ] **Task Editing**
  - Inline editing of task names
  - Drag to change task dates
  - Drag to create dependencies
  - Context menu for task operations

- [ ] **Real-time TJP Sync**
  - Watch TJP file for changes
  - Auto-reload on file modification
  - Write changes back to TJP format
  - Preserve comments and formatting

- [ ] **Advanced Filtering**
  - Filter by resource
  - Filter by task status
  - Filter by date range
  - Save/load filter presets

### Low Priority

- [ ] **Additional VIM Navigation**
  - `j/k` - Up/down navigation (supplement arrows)
  - `h/l` - Left/right (collapse/expand)
  - `gg` - Go to first task
  - `G` - Go to last task
  - `n/N` - Next/previous search result
  - `:` - Command mode
  - `m{mark}` - Set bookmarks
  - `'{mark}` - Jump to bookmark

- [ ] **Export Features**
  - Export to PDF
  - Export to PNG/SVG
  - Export filtered views
  - Print optimization

- [ ] **Resource View**
  - Resource allocation chart
  - Resource utilization
  - Resource conflicts highlighting

- [ ] **Critical Path**
  - Highlight critical path
  - Show slack time
  - Critical path analysis

### Completed ✓

- [x] VIM-like keyboard navigation
- [x] Command palette (Ctrl+Shift+P)
- [x] Search with highlighting
- [x] Dark/light theme toggle
- [x] Responsive layout
- [x] Focus mode
- [x] Milestone navigation (`]m`, `[m`)
- [x] Keyboard help screen (`?`)
- [x] Go navigation menu (`g`)

## Technical Debt

- [ ] Upgrade from deprecated `gantt.config.scale_unit` to new format
- [ ] Add unit tests for JavaScript modules
- [ ] Improve error handling for data loading
- [ ] Add loading indicators
- [ ] Optimize performance for large projects (1000+ tasks)

## Documentation

- [ ] User guide with screenshots
- [ ] Keyboard shortcut cheat sheet (printable)
- [ ] Integration guide for TaskJuggler workflow
- [ ] API documentation for extensions

## Notes

- Mouse wheel zoom should feel natural like Google Maps or CAD software
- Consider zoom limits (min: hour view, max: year view)
- Preserve selected task during zoom operations
- Update status bar with current zoom level