# TaskJuggler Test Suite - Learnings and Guidelines

This document captures key learnings about TaskJuggler's test infrastructure and best practices for adding new tests.

## Test Suite Structure

### Directory Organization
```
test/
├── TestSuite/
│   ├── Syntax/
│   │   ├── Correct/     # Valid .tjp files that should parse successfully
│   │   └── Errors/      # Invalid .tjp files to test error handling
│   ├── Scheduler/       # Scheduling-specific tests
│   ├── CSV-Reports/     # CSV report generation tests
│   ├── Export-Reports/  # Export functionality tests
│   └── HTML-Reports/    # HTML report generation tests
├── test_*.rb           # Ruby unit test files
└── *.rb               # Test helper files
```

### Test Execution

1. **Rake Tasks** (may have compatibility issues with old RSpec):
   - `rake test` - Runs all tests (unittest + spec)
   - `rake unittest` - Runs only unit tests

2. **Direct Execution** (more reliable):
   ```bash
   # Run specific unit test
   cd test && ruby -I../lib test_ProjectFileScanner.rb
   
   # Run syntax tests
   cd test && ruby -I../lib test_Syntax.rb
   
   # Test individual .tjp file
   tj3 test/TestSuite/Syntax/Correct/SomeTest.tjp
   ```

## Adding New Test Files

### 1. Syntax Test Files (.tjp)

When adding .tjp files to `TestSuite/Syntax/Correct/`:

**Critical Requirements:**
- **Timezone Awareness**: The test runner sets `ENV['TZ'] = 'Europe/Berlin'`
- **Date Boundaries**: Avoid using project start date for credits/tasks
  - Bad: `credits 2025-01-01` when project starts `2025-01-01`
  - Good: `credits 2025-01-02` (one day after project start)
- **Timing Resolution**: Default is 60 minutes unless specified

**Example Template:**
```tjp
project test_name "Test Description" 2025-01-01 +1m {
  timezone "Europe/Berlin"  # Match test runner timezone
  currency "EUR"
}

# Define accounts/resources/tasks
account test_account "Test Account" {
  credits 2025-01-02 "Description" 100.0  # Start after project begin
}

task test_task "Test Task" {
  start 2025-01-02  # Not 2025-01-01!
  duration 5d
}

# Include at least one report
accountreport "test_report" {
  formats html
  columns name, balance
}
```

### 2. Unit Test Files (.rb)

When adding Ruby unit tests:

**Dependencies to Include:**
```ruby
$:.unshift File.join(File.dirname(__FILE__), '..', 'lib')

require 'test/unit'
require 'taskjuggler/TaskJuggler'  # For high-level tests
# Or specific classes:
require 'taskjuggler/ProjectFileScanner'
require 'taskjuggler/TjTime'
```

**Common Issues:**
- Missing constants (e.g., `Log`) - May need full TaskJuggler initialization
- Path issues - Use absolute paths or proper relative paths
- Test isolation - Reset MessageHandler between tests

## Syntax Gotchas and Solutions

### 1. Account References
```tjp
# WRONG - Hierarchical references don't work in chargeset
account ops "Operations" {
  account expenses "Expenses"
}
task work {
  chargeset ops.expenses  # ERROR!
}

# CORRECT - Use flat account structure
account expenses "Expenses"
task work {
  chargeset expenses
}
```

### 2. Column Names in Reports
```tjp
# WRONG
accountreport "report" {
  columns name, total  # 'total' is not valid
}

# CORRECT
accountreport "report" {
  columns name, balance  # Use 'balance' for accounts
}
```

### 3. Balance Statement
```tjp
# WRONG - Only accepts two accounts
balance account1 account2 account3

# CORRECT
balance account1 account2
```

### 4. Resource Allocation
```tjp
# WRONG - No hierarchical references
resource team "Team" {
  resource dev "Developer"
}
task work {
  allocate team.dev  # ERROR!
}

# CORRECT
resource team "Team" {
  resource dev "Developer"
}
task work {
  allocate dev
}
```

## Testing Negative Numbers

✅ **IMPLEMENTED**: Negative number support has been successfully added to TaskJuggler!

### Implementation Details
- **Scanner Level**: Negative numbers are parsed as separate tokens (LITERAL "-" + INTEGER/FLOAT)
- **Grammar Level**: Added `optionalMinus` support to `accountCredit` and `charge` rules
- **Files Modified**:
  - `lib/taskjuggler/TjpSyntaxRules.rb` - Updated credit and charge rules
  - `test/test_ProjectFileScanner.rb` - Updated scanner tests

### Syntax Examples (Now Working!)
1. **Negative Credits**: `credits 2025-01-02 "Refund" - 500.0`
2. **Negative Charges**: `charge - 100.0 onend`
3. **Mixed Credits**: Both positive and negative in same account
4. **Leave Allowances**: `leaveallowances annual 2012-06-01 - 10d`

### Important Notes
- **Space Required**: Must use `- 500` (space between minus and number)
- **Time Ranges**: Still work correctly: `8:00-15:00` (no space in time ranges)
- **Date Compatibility**: Dates like `2025-01-01` parse correctly

### Test File Locations
- Scanner tests: `test/test_ProjectFileScanner.rb` ✅
- Syntax tests: `test/TestSuite/Syntax/Correct/AccountNegativeCredits.tjp` ✅
- Charge tests: `test/TestSuite/Syntax/Correct/ChargeNegative.tjp` ✅
- Mixed tests: `test/TestSuite/Syntax/Correct/MixedCreditsSimple.tjp` ✅

## Common Test Failures and Solutions

### 1. "Date must be within project time frame"
**Cause**: Timezone conversion pushes date outside project bounds
**Solution**: Use dates at least 1 day after project start

### 2. "Unknown account"
**Cause**: Account referenced before definition
**Solution**: Define accounts before using in tasks

### 3. "No chargeset defined"
**Cause**: Task has charge but no chargeset
**Solution**: Add `chargeset account_name` to task

### 4. RSpec/Rake Issues
**Cause**: Old RSpec version (2.x) incompatibility
**Solution**: Run tests directly with Ruby instead of rake

## Best Practices

1. **Test File Naming**: Use descriptive names (e.g., `AccountNegativeCredits.tjp`)
2. **Documentation**: Add comments explaining what each test verifies
3. **Completeness**: Include at least one report to verify full processing
4. **Independence**: Each test file should be self-contained
5. **Real-World Scenarios**: Create examples that demonstrate actual use cases

## Debugging Tips

1. **Verbose Output**: Run tj3 directly to see full error messages
2. **Incremental Testing**: Test small pieces before combining
3. **Time Zone Issues**: Always specify timezone explicitly
4. **Parser Errors**: Check for typos in keywords (e.g., 'follows' vs 'depends')

## RSpec Migration (2.x to 3.x)

✅ **COMPLETED**: Successfully migrated entire RSpec test suite from 2.5 to 3.5

### Migration Steps Taken:
1. **Updated Dependencies**: Changed `taskjuggler.gemspec` from RSpec 2.5 to 3.5
2. **Syntax Conversion**: Converted 132 instances across 13 files:
   - `.should eq(x)` → `expect(result).to eq(x)`
   - `.should be_nil` → `expect(result).to be_nil`
   - `.should raise_error` → `expect { }.to raise_error`
3. **Configuration Updates**: Fixed RSpec config to use `:expect` syntax
4. **Rake Integration**: Rewrote `tasks/spec.rake` for RSpec 3.x compatibility
5. **Nested Describe Fixes**: Quoted constants in describe blocks

### Files Converted:
- All 13 files in `spec/` directory
- `tasks/spec.rake` 
- `taskjuggler.gemspec`

### Test Results:
- **68 RSpec examples** - all passing
- **116 unit tests** - all passing
- **Total: 184 tests** running successfully

### Key Learnings:
1. **Pattern Conflicts**: Scanner token patterns can conflict - order matters
2. **Negative Lookaheads**: Used `(?!<-|:)` to prevent unwanted matches
3. **Grammar vs Scanner**: Better to handle complex parsing at grammar level
4. **Ruby Compatibility**: RSpec 2.x incompatible with Ruby 3.4+
5. **Bulk Conversion**: Custom script effective for mass syntax changes

## Integration with CI/CD

✅ **FULLY INTEGRATED**: Test suite now properly integrated:
- `rake test` runs all 184 tests automatically (unit + RSpec)
- New .tjp files in TestSuite directories are auto-discovered
- Failed tests prevent commits/merges
- RSpec compatibility issues resolved