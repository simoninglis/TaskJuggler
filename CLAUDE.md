# TaskJuggler

**This is a working fork of the TaskJuggler III Project Management Software for development and enhancement purposes.**

Original project: https://github.com/taskjuggler/TaskJuggler  
License: GPL v2

For development workflow and contribution guidelines, see WORKFLOW.md.

## Design Guidelines

### Web UI - VIM-Like Navigation
The web UI follows VIM-inspired keyboard navigation principles:
- Modal operation (different modes for different tasks)
- Single-key commands for common operations
- Mnemonic key choices (/ for search, ? for help, F for focus)
- Minimal modifier keys required
- Consistent escape to exit modes

This makes the UI efficient for keyboard users and maintains consistency with developer tools.

## Current Work

### ✅ Completed Features
- **Negative Number Support**: Added support for negative credits and charges for real-world accounting scenarios (refunds, reversals, corrections)
- **RSpec Migration**: Upgraded test suite from RSpec 2.5 to 3.x for Ruby 3.4+ compatibility
- **Test Infrastructure**: All 184 tests now passing (116 unit + 68 RSpec)
- **TJP Include Support**: Fixed restriction that prevented .tjp files from including other .tjp files (now both .tjp and .tji extensions are allowed)
- **Version Identifier**: Changed version to 3.8.1-DEV to clearly indicate this is a development fork
- **JSON Export**: Added comprehensive JSON export format for web UI integration with full project data export

### Implementation Details
- **Grammar-level approach**: Uses `optionalMinus` pattern for clean separation
- **Backward compatible**: All existing functionality preserved
- **New syntax**: `credits 2025-01-02 "Refund" - 500.0` and `charge - 100.0 onend`
- **JSON Export**: New `jsonreport` type generates comprehensive project data following JSON specification v1.0
  - Includes tasks, resources, dependencies, costs, and project metadata
  - Supports multiple scenarios
  - Enhanced GanttChart JSON output for task reports
  - See `docs/JSON_GANTT_SPECIFICATION.md` for format details

## Architecture
TaskJuggler uses a scanner/parser architecture:
- **Scanner**: `lib/taskjuggler/ProjectFileScanner.rb` - Tokenizes input
- **Grammar**: `lib/taskjuggler/TjpSyntaxRules.rb` - Defines syntax rules
- **Core**: Project scheduling and resource management engine

## Development
- Ruby 3.4+ required
- Follow existing code patterns and conventions
- All changes must pass full test suite: `rake test`
- See `test/CLAUDE.md` for detailed testing guidelines

## Key Files
- **Main entry point**: `bin/tj3` (command-line interface)
- **Scanner**: `lib/taskjuggler/ProjectFileScanner.rb`
- **Grammar rules**: `lib/taskjuggler/TjpSyntaxRules.rb`
- **Tests**: `test/` (unit tests) and `spec/` (RSpec tests)
- **Test documentation**: `test/CLAUDE.md`

## Local Development

### Installation
```bash
# Install Ruby 3.4+ (if not already installed)
snap install ruby --channel=3.4/stable

# Install TaskJuggler Enhanced commands locally
# (This will automatically install required Ruby gems)
./install-local.sh

# If prompted, add ~/.local/bin to PATH in ~/.bashrc:
export PATH="$HOME/.local/bin:$PATH"

# Reload shell configuration
source ~/.bashrc
```

### Uninstallation
```bash
# Remove all TaskJuggler Enhanced symlinks
./uninstall-local.sh
```

### Usage
```bash
# Use enhanced TaskJuggler with negative number support
tj3 project.tjp                    # Process project file
tj3-enhanced project.tjp           # Same as above
tj3client-enhanced status          # Client commands
tj3d-enhanced                      # Daemon
tj3man-enhanced account            # View manual for 'account' property

# The install script creates both versions:
# - tj3-enhanced, tj3client-enhanced, tj3d-enhanced, tj3man-enhanced
# - tj3, tj3client, tj3d, tj3man (aliases without -enhanced suffix)

# Test negative numbers example
tj3 test_negative_example.tjp --no-reports

# Generate JSON export for web UI
tj3 project.tjp  # Generates project_data.json if jsonreport is defined

# Example JSON report in .tjp file:
# jsonreport "project_export" {
#   formats json
# }

# Development/Testing
rake test                          # Run all tests
ruby -I lib bin/tj3 file.tjp      # Direct execution
rake unittest                      # Unit tests only
rake spec                         # RSpec tests only
```

## Repository Information
- **This is a fork**: Always commit and push to this fork, NOT the upstream repository
- **Fork URL**: https://github.com/simoninglis/TaskJuggler
- **Upstream**: https://github.com/taskjuggler/TaskJuggler (original project - do not push directly)
- **Version**: 3.8.1-DEV (upstream is 3.8.1)

## Branch Organization
- **dev**: Main development branch with all enhancements
- **fix-rspec-compatibility**: Feature branch containing negative number support, RSpec migration, and TJP include support (ready for PR to upstream)
- **master**: Tracks upstream master branch

## Test Status
- **All tests**: ✅ Passing (184 total - 116 unit + 68 RSpec)

## Contributing Back to Upstream
When ready to contribute changes to the main TaskJuggler project:
1. Ensure all commits are in your fork
2. Create a Pull Request from your fork to the upstream repository
3. Include description of negative number support, RSpec migration, and TJP include features
