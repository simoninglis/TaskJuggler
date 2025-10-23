#!/usr/bin/env python3
"""
Test Enter key with correct theme checking
"""

import pytest
from playwright.sync_api import Page, expect
import time

def test_enter_key_fixed(page: Page):
    """Test Enter key in command palette with correct theme checking"""
    
    # Navigate to the application
    page.goto("http://localhost:8001")
    
    # Wait for gantt to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)
    
    print("Testing Enter key in command palette (fixed)...")
    
    # Get initial theme from body element
    initial_theme = page.evaluate("() => document.body.getAttribute('data-theme') || 'light'")
    print(f"Initial theme: {initial_theme}")
    
    # Open command palette
    page.keyboard.press("Control+Shift+P")
    time.sleep(0.5)
    
    # Check if palette is open
    palette_open = page.evaluate("() => stateStore ? stateStore.isCommandPaletteOpen() : false")
    print(f"Command palette open: {palette_open}")
    
    # Type "dark" to filter to theme toggle command
    page.keyboard.type("dark")
    time.sleep(0.5)
    
    # Check filtered commands
    filtered_info = page.evaluate("""() => {
        const items = document.querySelectorAll('#customCommandPalette .command-item');
        const palette = window.customCommandPalette;
        return {
            visibleCount: items.length,
            filteredCount: palette && palette.filteredCommands ? palette.filteredCommands.length : 0,
            firstCommand: palette && palette.filteredCommands && palette.filteredCommands[0] ? palette.filteredCommands[0].title : 'none'
        };
    }""")
    print(f"Filtered commands: {filtered_info}")
    
    # Press Enter to execute
    print("Pressing Enter to execute theme toggle...")
    page.keyboard.press("Enter")
    time.sleep(0.5)
    
    # Check if theme changed (from body element)
    theme_after_enter = page.evaluate("() => document.body.getAttribute('data-theme') || 'light'")
    print(f"Theme after Enter: {theme_after_enter}")
    
    # Check if palette closed
    palette_closed = page.evaluate("() => stateStore ? !stateStore.isCommandPaletteOpen() : true")
    print(f"Command palette closed: {palette_closed}")
    
    # Summary
    print("\n=== SUMMARY ===")
    if theme_after_enter != initial_theme:
        print("✅ Enter key successfully executed theme toggle command!")
    else:
        print("❌ Enter key didn't execute theme toggle command")
    
    if palette_closed:
        print("✅ Command palette closed after Enter")
    else:
        print("❌ Command palette didn't close after Enter")