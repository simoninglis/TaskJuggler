# TaskJuggler Development Workflow

This document describes the git workflow for contributing to TaskJuggler while maintaining a local development branch.

## Overview

This workflow allows you to:
- Develop freely on a local `dev` branch
- Selectively contribute features back to the upstream TaskJuggler project
- Maintain clean, focused pull requests
- Keep experimental code separate from production-ready contributions

## Repository Structure

- **Upstream**: https://github.com/taskjuggler/TaskJuggler (original project - read-only)
- **Origin**: Your fork on GitHub (where you push branches for PRs)
- **Local**: Your local repository with development branches

## Initial Setup

```bash
# 1. Clone your fork
git clone https://github.com/simoninglis/TaskJuggler
cd TaskJuggler

# 2. Add upstream remote
git remote add upstream https://github.com/taskjuggler/TaskJuggler

# 3. Fetch from upstream
git fetch upstream

# 4. Create local dev branch from upstream master
git checkout -b dev upstream/master

# 5. Merge any existing work
git merge fix-rspec-compatibility  # or any other feature branches
```

## Working Across Multiple PCs

Pushing your `dev` branch to origin is good practice for several reasons:
- **Backup**: Your work is safely stored on GitHub in case of local issues
- **Portability**: Access your development work from any machine
- **Continuity**: Switch between desktop, laptop, or cloud environments seamlessly

### Setting Up on a New PC

When you need to work on TaskJuggler from a different machine:

```bash
# 1. Clone your fork (not upstream)
git clone https://github.com/simoninglis/TaskJuggler
cd TaskJuggler

# 2. Add upstream remote
git remote add upstream https://github.com/taskjuggler/TaskJuggler

# 3. Fetch all branches from origin
git fetch origin

# 4. Check out the dev branch from origin
git checkout -b dev origin/dev

# 5. Ensure dev is tracking origin/dev
git branch --set-upstream-to=origin/dev dev

# 6. Sync with upstream (optional but recommended)
git fetch upstream
git merge upstream/master
```

### Keeping Dev Branches in Sync

When switching between PCs, always sync your `dev` branch:

```bash
# On PC 1 - Push your latest work
git checkout dev
git push origin dev

# On PC 2 - Pull the latest changes
git checkout dev
git pull origin dev

# If you've made changes on both PCs, merge them
git fetch origin
git merge origin/dev
# Resolve any conflicts if they arise
git push origin dev
```

### Best Practices for Multi-PC Development

1. **Always push before switching PCs**
   ```bash
   git push origin dev
   ```

2. **Always pull when starting work on a different PC**
   ```bash
   git pull origin dev
   ```

3. **Use stash for temporary work**
   ```bash
   # Before switching PCs with uncommitted changes
   git stash push -m "WIP: feature description"
   git push origin dev
   
   # On the other PC
   git pull origin dev
   git stash pop  # If you pushed the stash branch
   ```

4. **Keep commits atomic**
   - Make small, complete commits that can be easily moved between machines
   - Avoid leaving work in a half-finished state

## Daily Development Workflow

### Working on the dev branch

```bash
# Always start by syncing with upstream
git checkout dev
git fetch upstream
git merge upstream/master  # Keep dev updated with upstream

# Do your development work
# Edit files, test, commit freely
git add .
git commit -m "feat: experimental feature X"

# Optionally backup to your fork
git push origin dev  # First time: git push -u origin dev
```

### Contributing Features Upstream

When you have a feature ready to contribute:

```bash
# 1. Create a clean feature branch from upstream master
git fetch upstream
git checkout -b feature-name upstream/master

# 2. Cherry-pick specific commits from dev
git cherry-pick <commit-hash>  # Select specific commits
# OR manually apply changes if cherry-pick is too messy

# 3. Push feature branch to your fork
git push origin feature-name

# 4. Create PR from GitHub
# Go to your fork and create PR from feature-name to upstream/master
```

## Example: Contributing the Negative Numbers Feature

```bash
# Create clean branch for the feature
git checkout -b negative-numbers-support upstream/master

# Cherry-pick the specific commit
git cherry-pick c1726169  # The negative numbers commit

# Push to fork
git push origin negative-numbers-support

# Create PR on GitHub
```

## Best Practices

### For Local Development (dev branch)
- Commit frequently with descriptive messages
- Don't worry about perfect commit history
- Experiment freely
- Include debugging code, test files, etc.

### For Upstream Contributions (feature branches)
- One feature per branch
- Clean, focused commits
- No debugging code or unrelated changes
- Follow upstream's commit message conventions
- Ensure all tests pass

### Keeping Branches Organised

```bash
# List all branches
git branch -a

# Delete merged feature branches
git branch -d feature-name  # Local
git push origin --delete feature-name  # Remote

# Keep dev branch clean by rebasing occasionally
git checkout dev
git fetch upstream
git rebase upstream/master  # Careful with this if dev is pushed
```

## Handling Conflicts

If conflicts arise when merging upstream changes:

```bash
# On dev branch
git fetch upstream
git merge upstream/master
# Resolve conflicts in your editor
git add <resolved-files>
git commit

# For feature branches, consider starting fresh
git checkout -b feature-name-v2 upstream/master
# Manually apply changes rather than cherry-pick
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `git checkout dev` | Switch to development branch |
| `git fetch upstream` | Get latest from upstream |
| `git merge upstream/master` | Update dev with upstream changes |
| `git checkout -b feature-x upstream/master` | Start new feature for PR |
| `git cherry-pick <hash>` | Copy specific commit to current branch |
| `git push origin feature-x` | Push feature branch to fork |

## Workflow Diagram

```
upstream/master ─────┬────────────────┬─────────────► (main project)
                     │                │
                     ▼                ▼
                  (fetch)          (PR from fork)
                     │                ▲
                     ▼                │
local/dev ──────────┬────────────────┤ (your development)
                    │                │
                    ▼                │
              (cherry-pick)          │
                    │                │
                    ▼                │
local/feature-x ────┴────────────────┘ (clean feature branch)
                              │
                              ▼
                         (push to fork)
```

## Notes

- The `dev` branch is your playground - it never gets pushed to upstream
- Feature branches should be minimal and focused
- Always create PRs from your fork, not by pushing directly to upstream
- Delete feature branches after PRs are merged to keep things clean