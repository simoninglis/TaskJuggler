# TaskJuggler Claude Code Agents

This directory contains specialized agents for TaskJuggler development. Agents are automatically loaded by Claude Code and provide expert assistance for specific tasks.

## Available Agents

### 1. architect-planner

**Purpose**: Senior architect who designs features, creates technical specs, and makes architectural decisions.

**When to Use**: BEFORE implementing any feature or significant architectural change.

**What It Does**:
1. Analyzes feature requests
2. Creates implementation plans with clear phases
3. Designs scanner/parser/grammar changes
4. Creates ADRs for significant decisions
5. Plans Git branching strategy
6. Assesses risks and provides mitigation strategies
7. Ensures backward compatibility

**Tools Available**: Read, Bash, Grep, Glob

**Invocation**:
- Automatic: Mention "plan", "architect", "design"
- Manual: "Use architect-planner to analyze [feature]"

**Example**:
```
User: "Plan support for JSON export of resources and accounts"

Architect:
1. Reads existing JsonReport.rb implementation
2. Reads JSON_GANTT_SPECIFICATION.md
3. Analyzes missing components
4. Creates phased implementation plan:
   - Phase 1: Add generateResourcesData method
   - Phase 2: Add generateAccountsData method
   - Phase 3: Update tests
   - Phase 4: Verify against specification
5. Identifies risks (complex hierarchies, nested structures)
6. Recommends testing strategy
7. Documents in implementation plan format
```

**What It Doesn't Do**:
- ❌ Write implementation code
- ❌ Create or commit files
- ❌ Make Git branches
- ❌ Estimate timelines

---

### 2. test-runner

**Purpose**: Testing specialist who writes tests, runs test suites, and ensures coverage.

**When to Use**: For ALL testing activities - writing tests, running suites, fixing failures, checking coverage.

**What It Does**:
1. Writes Test::Unit tests (test/test_*.rb)
2. Writes RSpec 3.x tests (spec/*_spec.rb)
3. Creates integration tests (test/TestSuite/Syntax/Correct/*.tjp)
4. Runs test suites (`rake test`, `rake unittest`, `rake spec`)
5. Analyzes test failures
6. Monitors code coverage
7. Supports TDD workflow

**Tools Available**: Bash, Read, Write, Edit

**Invocation**:
- Automatic: Mention "test", "testing", "coverage", "TDD"
- Manual: "Use test-runner to test [feature]"

**Example**:
```
User: "Write tests for JSON export resources"

Test-Runner:
1. Creates test/test_json_export.rb
2. Adds test_exports_resources
3. Adds test_resource_structure
4. Adds test_handles_resource_hierarchies
5. Creates integration test with sample project
6. Runs: rake test
7. Reports: 184/184 passing, 95% coverage
```

**What It Doesn't Do**:
- ❌ Write implementation code
- ❌ Skip tests to save time
- ❌ Use deprecated RSpec 2.x syntax

**Important Notes**:
- Must use RSpec 3.x syntax (`expect()`, not `.should`)
- All 184 tests must pass (116 unit + 68 RSpec)
- Integration tests use actual .tjp files

---

### 3. code-reviewer

**Purpose**: Code review specialist using OpenAI Codex for external validation.

**When to Use**: For validation, pre-commit checks, second opinions, or cross-model verification.

**What It Does**:
1. Uses OpenAI Codex (via `codex exec`) for external review
2. Validates architecture decisions
3. Performs pre-commit quality checks
4. Checks Ruby best practices
5. Verifies TaskJuggler pattern compliance
6. Provides OpenAI perspective (vs Anthropic Claude)
7. Reviews last commit, feature branches, or specific files

**Tools Available**: Bash (for Codex execution), Read, Grep, Glob

**Invocation**:
- Automatic: Mention "review", "codex", "validate", "second opinion"
- Manual: "Use code-reviewer to review [code]"

**Example**:
```
User: "Review before commit"

Code-Reviewer:
1. Gets staged changes: git diff --cached
2. Executes: codex exec "Review staged changes for:
   - Code quality
   - Ruby best practices
   - TaskJuggler patterns
   - Potential bugs
   - Test coverage"
3. Parses Codex output
4. Formats findings:
   - Critical issues: 0
   - Recommendations: 2
   - Positive findings: 3
5. Provides: ✅ APPROVED or ❌ CHANGES REQUIRED
```

**What It Doesn't Do**:
- ❌ Write implementation code
- ❌ Commit changes
- ❌ Skip Codex execution
- ❌ Approve code with critical issues

**Important Notes**:
- Codex doesn't support `--timeout` parameter
- Use plain `codex exec "prompt"`
- Run from project root for proper context
- Codex provides summaries, not exhaustive analysis

---

### 4. release-coordinator

**Purpose**: GitFlow release coordinator with multi-layer validation.

**When to Use**: When ready to merge feature branches, create releases, or ship to production.

**What It Does**:

**5-Layer Validation Pipeline**:
1. **Automated Checks**: CHANGELOG, versions, conflicts, docs
2. **Claude Self-Review**: Architecture, patterns, code quality
3. **Codex Peer Review**: Independent validation via code-reviewer
4. **Test Verification**: Run full test suite (184 tests)
5. **Human Decision**: Consolidated report with recommendation

**Core Workflows**:
- **PR Review & Merge** (feature → develop): Comprehensive validation + GitFlow merge
- **Release Creation** (develop → release/vX.Y.Z): Future
- **Production Release** (release → master): Future
- **Hotfix Management** (master → hotfix → master + develop): Future

**Tools Available**: Bash (git, rake), Read, Grep, Glob, Task (for code-reviewer delegation)

**Invocation**:
- Automatic: Mention "merge PR", "release", "merge to develop"
- Manual: "Use release-coordinator to review PR [number]"

**Example**:
```
User: "Review feature/json-export for merge to dev"

Release-Coordinator:
[1/5] Automated Checks...
✓ CHANGELOG updated
✓ No conflicts
✓ Docs updated

[2/5] Claude Self-Review...
✓ Architecture sound
✓ Patterns compliant

[3/5] Codex Peer Review...
Delegating to code-reviewer...
✓ 2 recommendations, 0 critical

[4/5] Test Verification...
✓ 184/184 tests passed

[5/5] Report & Recommendation...
✅ READY TO MERGE

Proceed? [y/N]

User: y

✅ Merged feature/json-export to dev
```

**What It Doesn't Do**:
- ❌ Auto-merge without approval
- ❌ Skip validation layers
- ❌ Force push without confirmation
- ❌ Merge with failing tests

**Important Notes**:
- All 184 tests MUST pass
- CHANGELOG update required
- User approval required (never auto-merge)
- Uses `git merge --no-ff` for feature branches

---

## Complete Development Workflow

### Feature Implementation Example

```
Step 1: Planning (architect-planner)
User: "Plan JSON export for resources and accounts"
→ Architect analyzes requirements
→ Creates implementation plan with phases
→ Documents risks and mitigation
→ Recommends testing strategy

Step 2: Implementation (developer or main Claude)
→ Create feature branch: git checkout -b feature/json-export
→ Implement according to plan
→ Follow TaskJuggler patterns

Step 3: Testing (test-runner)
User: "Write tests for JSON export"
→ Writes unit tests for new methods
→ Creates integration tests with sample .tjp
→ Runs test suite: rake test
→ Reports coverage

Step 4: Review (code-reviewer)
User: "Review before commit"
→ Executes Codex analysis
→ Validates patterns and quality
→ Flags any issues
→ Provides approval/recommendations

Step 5: Commit & Create PR
→ git add lib/taskjuggler/reports/JsonReport.rb test/test_json_export.rb
→ git commit -m "feat: add resources/accounts to JSON export"
→ git push origin feature/json-export

Step 6: Merge Coordination (release-coordinator)
User: "Review feature/json-export for merge to dev"
→ 5-layer validation pipeline
→ On approval: Execute GitFlow merge (--no-ff)
→ Verify success
→ Suggest cleanup (delete feature branch)
```

## Agent Configuration

### Settings Location

`.claude/settings.local.json` (optional):

```json
{
  "agents": {
    "enabled": true,
    "directory": ".claude/agents",
    "autoload": true
  }
}
```

### Loading Agents

**IMPORTANT**: Claude Code must be restarted to load new or updated agents.

```bash
# 1. Exit Claude Code
# 2. Restart Claude Code
# 3. Agents auto-discovered from .claude/agents/
```

### Verifying Agents Loaded

Test agent invocation:
```
User: "Use architect-planner to plan [something]"
# Should trigger architect-planner agent

User: "Run tests"
# Should trigger test-runner agent automatically
```

## Troubleshooting

### Agent Not Responding

**Problem**: Agent doesn't respond to invocation

**Solutions**:
1. **Restart Claude Code** - Required to load agents
2. **Check filename** - Must be in `.claude/agents/` with `.md` extension
3. **Check frontmatter** - Verify YAML frontmatter is valid
4. **Check name field** - Ensure `name:` in frontmatter matches invocation

### Codex Execution Fails

**Problem**: code-reviewer can't run Codex

**Solutions**:
1. **Check Codex installed**: `which codex`
2. **No --timeout parameter**: Use `codex exec "prompt"` (not `--timeout 300`)
3. **Run from project root**: Ensure in /home/singlis/work/TaskJuggler

### Tests Not Found

**Problem**: test-runner can't find tests

**Solutions**:
1. **Check rake tasks**: `rake -T` to list available tasks
2. **Verify test files exist**: `ls test/ spec/`
3. **Check Ruby version**: `ruby --version` (need 3.0+)
4. **Install dependencies**: `bundle install`

## Best Practices

### Do's

✅ Use agents for their specialized tasks
✅ Trust agent expertise and recommendations
✅ Run full validation pipeline before merges
✅ Let architect-planner guide implementation approach
✅ Let test-runner ensure comprehensive coverage
✅ Let code-reviewer catch quality issues early
✅ Let release-coordinator orchestrate merges

### Don'ts

❌ Don't skip planning phase (architect-planner)
❌ Don't skip testing (test-runner)
❌ Don't skip review (code-reviewer)
❌ Don't skip validation (release-coordinator)
❌ Don't manually merge without release-coordinator
❌ Don't ignore agent recommendations without reason

## Related Documentation

- [Claude Code Agent Documentation](../../dev-manual/docs/claude-code/agents.md)
- [Claude Code Setup Guide](../../dev-manual/docs/claude-code/setup.md)
- [TaskJuggler CLAUDE.md](../CLAUDE.md)
- [TaskJuggler README.md](../README.md)

## Notes for Claude Code

- **Agents are autonomous** - They operate independently and return results
- **Agents preserve context** - Main conversation not cluttered with agent work
- **Agents are composable** - Work together in workflows
- **Agents are project-specific** - Understand TaskJuggler architecture
- **Restart required** - After adding/updating agents
