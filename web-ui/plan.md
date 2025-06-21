# Plan: Replace ninja-keys with Custom Command Palette

## Status: Complete
Started: 2025-06-21

## Current State
- Using ninja-keys web component for command palette
- Intermittent Enter key bug: first command works, subsequent fail
- Complex debugging due to Shadow DOM
- Architectural conflicts with KeyboardManager
- 11 commands currently implemented

## Problem Analysis
- ninja-keys has unreliable Enter key handling after first use
- Shadow DOM makes debugging difficult
- Web component conflicts with our centralized keyboard management
- Over-engineered solution for simple requirements
- Playwright tests pass but manual testing fails (timing/state issues)

## Validated Approach
Building a custom command palette is the right solution because:
- Complete control over behavior and reliability
- Perfect integration with existing KeyboardManager
- Simpler architecture (vanilla JS vs web component)
- Easier debugging and maintenance
- No external dependencies or Shadow DOM complexity

## Prerequisites & Workarounds
- Required: Existing KeyboardManager system (✅ already implemented)
- Required: Current command definitions in command-palette.js
- Recommended: Keep existing keyboard shortcuts (Ctrl+Shift+P)
- Workaround: Temporarily keep ninja-keys until replacement is complete

## Implementation Steps (for Claude Code)

### Step 1: Create Custom Command Palette Components
1. Create `js/custom-command-palette.js` with:
   - Modal overlay structure
   - Search input with fuzzy filtering
   - Command list with keyboard navigation
   - Clean integration with KeyboardManager

### Step 2: Update HTML Structure
1. Remove ninja-keys element from `index.html`
2. Add simple div container for custom palette
3. Update script includes

### Step 3: Migrate Command Definitions
1. Extract command definitions from existing `command-palette.js`
2. Convert to simple JavaScript array format
3. Preserve all 11 existing commands and their functionality

### Step 4: Integrate with KeyboardManager
1. Update KeyboardManager to handle custom palette state
2. Remove ninja-keys specific state detection
3. Simplify palette open/close state management
4. Ensure clean Enter key handling

### Step 5: Update CSS Styling
1. Create modal overlay styles
2. Style search input and command list
3. Add hover/selection states
4. Ensure responsive design

### Step 6: Remove ninja-keys Dependencies
1. Remove ninja-keys from package.json
2. Delete old command-palette.js
3. Clean up any ninja-keys references
4. Update keyboard shortcuts help text

### Step 7: Testing & Validation
1. Test all 11 commands work correctly
2. Verify Enter key works reliably on repeated use
3. Test keyboard navigation (arrows, escape, enter)
4. Verify integration with KeyboardManager
5. Test rapid open/close cycles

## Validation Steps
- All 11 commands execute correctly
- Enter key works consistently on every use
- Keyboard navigation works smoothly
- No console errors or timing issues
- Palette opens/closes reliably with Ctrl+Shift+P

## Rollback Plan
- Keep ninja-keys implementation in backup branch
- If critical issues, temporarily revert to ninja-keys
- Document specific issues for future reference

## Technical Details

### Custom Palette Structure
```html
<div id="customCommandPalette" class="command-palette-overlay" style="display: none;">
  <div class="command-palette-modal">
    <input type="text" id="paletteSearch" placeholder="Type a command...">
    <div id="paletteResults" class="command-results"></div>
  </div>
</div>
```

### Commands Array Format
```javascript
const commands = [
  {
    id: 'overdue-tasks',
    title: 'Show overdue tasks',
    description: 'Filter to tasks with end dates before today',
    handler: () => filterOverdueTasks()
  },
  // ... etc
];
```

### KeyboardManager Integration
- Single state: `CUSTOM_PALETTE_OPEN`
- Clean Enter key handling without conflicts
- Direct event routing to palette handlers

## Estimated Implementation Time
- Custom palette creation: 1-2 hours
- Migration and integration: 1 hour  
- Testing and refinement: 30 minutes
- **Total: 2.5-3.5 hours**

## Benefits After Implementation
1. **Reliability**: Enter key works consistently every time
2. **Maintainability**: Simple vanilla JS, easy to debug
3. **Performance**: Lighter weight, no Shadow DOM
4. **Integration**: Perfect fit with KeyboardManager architecture
5. **Control**: Full control over behavior and styling
6. **Debugging**: Easy to troubleshoot with standard DOM tools

## Success Criteria
- ✅ All 11 commands work reliably
- ✅ Enter key never fails on subsequent uses  
- ✅ Keyboard navigation is smooth and predictable
- ✅ No console errors or timing issues
- ✅ Clean integration with existing codebase
- ✅ Faster and more responsive than ninja-keys