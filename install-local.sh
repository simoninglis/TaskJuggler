#!/bin/bash
# TaskJuggler Enhanced Local Installation Script
# This script installs dependencies and creates symlinks in ~/.local/bin for the enhanced TaskJuggler commands
#
# Usage: ./install-local.sh [--force]
#   --force: Force reinstall all components even if already installed

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$HOME/.local/bin"

# Parse command line arguments
FORCE_INSTALL=false
if [[ "$1" == "--force" ]]; then
    FORCE_INSTALL=true
fi

echo "TaskJuggler Enhanced Local Installation"
echo "======================================="
if [ "$FORCE_INSTALL" = true ]; then
    echo -e "${YELLOW}Force mode: Reinstalling all components${NC}"
fi
echo ""

# Check if Ruby is installed
if ! command -v ruby &> /dev/null; then
    echo -e "${RED}Error: Ruby is not installed!${NC}"
    echo "Please install Ruby 3.4+ first:"
    echo "  snap install ruby --channel=3.4/stable"
    exit 1
fi

# Show Ruby version
echo -e "${GREEN}Ruby version:${NC}"
ruby --version
echo ""

# Install required gems
echo -e "${GREEN}Checking required Ruby gems...${NC}"
REQUIRED_GEMS=("term-ansicolor" "mail")
for gem in "${REQUIRED_GEMS[@]}"; do
    if [ "$FORCE_INSTALL" = true ]; then
        echo "  Reinstalling ${gem}..."
        if gem install "${gem}" --user-install > /dev/null 2>&1; then
            echo "  ✓ ${gem} reinstalled"
        else
            echo -e "  ${RED}✗ Failed to install ${gem}${NC}"
            exit 1
        fi
    else
        # Check if gem is already installed by looking for it in gem directories
        GEM_HOME_CHECK="$HOME/.gem/ruby/3.4.0"
        if ls "$GEM_HOME_CHECK/gems/${gem}-"* >/dev/null 2>&1; then
            echo "  ✓ ${gem} already installed"
        else
            echo "  Installing ${gem}..."
            if gem install "${gem}" --user-install > /dev/null 2>&1; then
                echo "  ✓ ${gem} installed successfully"
            else
                echo -e "  ${RED}✗ Failed to install ${gem}${NC}"
                exit 1
            fi
        fi
    fi
done
echo ""

# Create ~/.local/bin if it doesn't exist
if [ ! -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Creating $INSTALL_DIR directory...${NC}"
    mkdir -p "$INSTALL_DIR"
fi

# Make all enhanced scripts executable
echo -e "${GREEN}Making enhanced scripts executable...${NC}"
chmod +x "$SCRIPT_DIR"/tj3*-enhanced

# Array of commands to install
COMMANDS=(
    "tj3-enhanced"
    "tj3client-enhanced"
    "tj3d-enhanced"
    "tj3man-enhanced"
)

# Create symlinks
echo -e "${GREEN}Checking symlinks in $INSTALL_DIR...${NC}"
updated=0
for cmd in "${COMMANDS[@]}"; do
    if [ -f "$SCRIPT_DIR/$cmd" ]; then
        # Check if symlink exists and points to the right place
        if [ "$FORCE_INSTALL" = true ] || ! [ -L "$INSTALL_DIR/$cmd" ] || [ "$(readlink -f "$INSTALL_DIR/$cmd")" != "$SCRIPT_DIR/$cmd" ]; then
            # Remove existing symlink if it exists
            if [ -L "$INSTALL_DIR/$cmd" ]; then
                rm "$INSTALL_DIR/$cmd"
            fi
            # Create new symlink
            ln -sf "$SCRIPT_DIR/$cmd" "$INSTALL_DIR/$cmd"
            if [ "$FORCE_INSTALL" = true ]; then
                echo "  ✓ $cmd (reinstalled)"
            else
                echo "  ✓ $cmd (installed)"
            fi
            updated=$((updated + 1))
        else
            echo "  ✓ $cmd (already installed)"
        fi
        
        # Also create version without -enhanced suffix for convenience
        cmd_base="${cmd%-enhanced}"
        if [ "$FORCE_INSTALL" = true ] || ! [ -L "$INSTALL_DIR/$cmd_base" ] || [ "$(readlink -f "$INSTALL_DIR/$cmd_base")" != "$SCRIPT_DIR/$cmd" ]; then
            if [ -L "$INSTALL_DIR/$cmd_base" ]; then
                rm "$INSTALL_DIR/$cmd_base"
            fi
            ln -sf "$SCRIPT_DIR/$cmd" "$INSTALL_DIR/$cmd_base"
            if [ "$FORCE_INSTALL" = true ]; then
                echo "  ✓ $cmd_base (alias reinstalled)"
            else
                echo "  ✓ $cmd_base (alias installed)"
            fi
            updated=$((updated + 1))
        else
            echo "  ✓ $cmd_base (alias already installed)"
        fi
    else
        echo -e "  ${RED}✗ $cmd not found!${NC}"
    fi
done

echo ""

# Check if ~/.local/bin is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo -e "${YELLOW}WARNING: $INSTALL_DIR is not in your PATH!${NC}"
    echo ""
    echo "To use the TaskJuggler Enhanced commands, add this line to your ~/.bashrc or ~/.bash_profile:"
    echo ""
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
    echo "Then reload your shell configuration:"
    echo "  source ~/.bashrc"
    echo ""
else
    echo -e "${GREEN}Installation complete!${NC}"
    echo ""
    echo "You can now use the following commands:"
    for cmd in "${COMMANDS[@]}"; do
        echo "  - $cmd"
        echo "  - ${cmd%-enhanced}"
    done
fi

echo ""
echo "To uninstall, run: $SCRIPT_DIR/uninstall-local.sh"