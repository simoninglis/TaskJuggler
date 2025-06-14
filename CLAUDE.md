# TaskJuggler

**This is a working fork of the TaskJuggler III Project Management Software for development and enhancement purposes.**

Original project: https://github.com/taskjuggler/TaskJuggler  
License: GPL v2

## Current Work

### ✅ Completed Features
- **Negative Number Support**: Added support for negative credits and charges for real-world accounting scenarios (refunds, reversals, corrections)
- **RSpec Migration**: Upgraded test suite from RSpec 2.5 to 3.x for Ruby 3.4+ compatibility
- **Test Infrastructure**: All 184 tests now passing (116 unit + 68 RSpec)

### Implementation Details
- **Grammar-level approach**: Uses `optionalMinus` pattern for clean separation
- **Backward compatible**: All existing functionality preserved
- **New syntax**: `credits 2025-01-02 "Refund" - 500.0` and `charge - 100.0 onend`

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
# (Creates symlinks in ~/.local/bin)
mkdir -p ~/.local/bin
ln -sf $PWD/tj3-enhanced ~/.local/bin/tj3-enhanced
ln -sf $PWD/tj3-enhanced ~/.local/bin/tj3
ln -sf $PWD/tj3client-enhanced ~/.local/bin/tj3client-enhanced
ln -sf $PWD/tj3d-enhanced ~/.local/bin/tj3d-enhanced

# Ensure ~/.local/bin is in PATH (add to ~/.bashrc if needed)
export PATH="$HOME/.local/bin:$PATH"
```

### Usage
```bash
# Use enhanced TaskJuggler with negative number support
tj3 project.tjp                    # Process project file
tj3-enhanced project.tjp           # Same as above
tj3client-enhanced status          # Client commands
tj3d-enhanced                      # Daemon

# Test negative numbers example
tj3 test_negative_example.tjp --no-reports

# Development/Testing
rake test                          # Run all tests
ruby -I lib bin/tj3 file.tjp      # Direct execution
rake unittest                      # Unit tests only
rake spec                         # RSpec tests only
```

## Branch Status
- **Current branch**: `fix-rspec-compatibility`
- **Commit**: `c1726169` - Contains negative number support and RSpec migration
- **Status**: Ready for pull request to upstream project
- **All tests**: ✅ Passing (184 total)

## Contributing Back
To contribute these changes to the main TaskJuggler project:
1. Fork https://github.com/taskjuggler/TaskJuggler to your GitHub account
2. Push the `fix-rspec-compatibility` branch to your fork
3. Create a Pull Request with the negative number support and RSpec migration features
