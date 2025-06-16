#!/bin/bash
# TaskJuggler Enhanced Local Uninstallation Script
# This script removes symlinks from ~/.local/bin for the enhanced TaskJuggler commands

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

INSTALL_DIR="$HOME/.local/bin"

echo "TaskJuggler Enhanced Local Uninstallation"
echo "========================================="
echo ""

# Array of commands to uninstall
COMMANDS=(
    "tj3-enhanced"
    "tj3client-enhanced"
    "tj3d-enhanced"
    "tj3man-enhanced"
    "tj3"
    "tj3client"
    "tj3d"
    "tj3man"
)

# Remove symlinks
echo -e "${YELLOW}Removing symlinks from $INSTALL_DIR...${NC}"
removed_count=0
for cmd in "${COMMANDS[@]}"; do
    if [ -L "$INSTALL_DIR/$cmd" ]; then
        rm "$INSTALL_DIR/$cmd"
        echo "  ✓ Removed $cmd"
        ((removed_count++))
    fi
done

echo ""

if [ $removed_count -gt 0 ]; then
    echo -e "${GREEN}Uninstallation complete!${NC}"
    echo "Removed $removed_count symlinks."
else
    echo -e "${YELLOW}No TaskJuggler Enhanced symlinks found in $INSTALL_DIR${NC}"
fi

echo ""
echo "To reinstall, run: ./install-local.sh from the TaskJuggler directory"