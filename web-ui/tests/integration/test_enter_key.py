#!/usr/bin/env python3
"""
Test Enter key functionality in command palette
"""

import pytest
from playwright.sync_api import Page, expect
import time

def test_enter_key_in_command_palette(page: Page):
    """Test that Enter key works in command palette"""
    
    # Navigate to the application
    page.goto("http://localhost:8001")
    
    # Wait for gantt to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)
    
    print("Testing Enter key in command palette...")
    
    # Test 1: Command mode with theme toggle
    print("\n1. Testing Enter in command mode (theme toggle)...")
    
    # Open command palette
    page.keyboard.press("Control+Shift+P")
    time.sleep(0.5)
    
    # Check if palette is open
    palette_open = page.evaluate("() => stateStore ? stateStore.isCommandPaletteOpen() : false")
    print(f"Command palette open: {palette_open}")
    
    # Get current theme
    initial_theme = page.evaluate("() => document.documentElement.getAttribute('data-theme') || 'light'")
    print(f"Initial theme: {initial_theme}")
    
    # Type "dark" to filter to theme toggle command
    page.keyboard.type("dark")
    time.sleep(0.5)
    
    # Check filtered commands
    filtered_count = page.evaluate("""() => {
        const items = document.querySelectorAll('#customCommandPalette .command-item');
        return items.length;
    }""")
    print(f"Filtered commands count: {filtered_count}")
    
    # Press Enter to execute
    print("Pressing Enter to execute theme toggle...")
    page.keyboard.press("Enter")
    time.sleep(0.5)
    
    # Check if theme changed
    theme_after_enter = page.evaluate("() => document.documentElement.getAttribute('data-theme') || 'light'")
    print(f"Theme after Enter: {theme_after_enter}")
    
    # Check if palette closed
    palette_closed = page.evaluate("() => stateStore ? !stateStore.isCommandPaletteOpen() : true")
    print(f"Command palette closed: {palette_closed}")
    
    # Test 2: Search mode
    print("\n2. Testing Enter in search mode...")
    
    # Open search mode
    page.keyboard.press("/")
    time.sleep(0.5)
    
    # Check mode
    search_mode = page.evaluate("() => stateStore ? stateStore.getCommandPaletteMode() : 'unknown'")
    print(f"Command palette mode: {search_mode}")
    
    # Type a partial task name
    page.keyboard.type("task")
    time.sleep(0.5)
    
    # Get search results
    search_results = page.evaluate("""() => {
        const items = document.querySelectorAll('#customCommandPalette .command-item');
        return {
            count: items.length,
            firstItem: items[0] ? items[0].textContent.trim() : 'none'
        };
    }""")
    print(f"Search results: {search_results}")
    
    # Press Enter to select first result
    print("Pressing Enter to select first search result...")
    page.keyboard.press("Enter")
    time.sleep(0.5)
    
    # Check if palette closed
    palette_closed_search = page.evaluate("() => stateStore ? !stateStore.isCommandPaletteOpen() : true")
    print(f"Command palette closed after search: {palette_closed_search}")
    
    # Test 3: Go mode
    print("\n3. Testing Enter in go mode...")
    
    # Open go mode
    page.keyboard.press("g")
    time.sleep(0.5)
    
    # Check mode
    go_mode = page.evaluate("() => stateStore ? stateStore.getCommandPaletteMode() : 'unknown'")
    print(f"Command palette mode: {go_mode}")
    
    # Press Enter to execute "Today" (should be first option)
    print("Pressing Enter to go to today...")
    page.keyboard.press("Enter")
    time.sleep(0.5)
    
    # Check if palette closed
    palette_closed_go = page.evaluate("() => stateStore ? !stateStore.isCommandPaletteOpen() : true")
    print(f"Command palette closed after go: {palette_closed_go}")
    
    # Debug: Check keyboard event handling
    print("\n4. Debugging keyboard event handling...")
    
    # Open command palette again
    page.keyboard.press("Control+Shift+P")
    time.sleep(0.5)
    
    # Check handleKeyDown function
    key_handler_exists = page.evaluate("""() => {
        const palette = window.customCommandPalette;
        if (palette && palette.handleKeyDown) {
            // Try to simulate Enter key event
            const event = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            
            // Check if searchInput exists
            const searchInput = document.getElementById('paletteSearch');
            if (searchInput) {
                // Dispatch event on search input
                searchInput.dispatchEvent(event);
                return 'Enter event dispatched';
            }
            return 'Search input not found';
        }
        return 'handleKeyDown not found';
    }""")
    print(f"Key handler check: {key_handler_exists}")
    
    # Check executeSelected method
    execute_method = page.evaluate("""() => {
        const palette = window.customCommandPalette;
        if (palette && palette.executeSelected) {
            return {
                hasMethod: true,
                selectedIndex: palette.selectedIndex,
                filteredCommandsLength: palette.filteredCommands ? palette.filteredCommands.length : 0
            };
        }
        return 'executeSelected not found';
    }""")
    print(f"Execute method check: {execute_method}")
    
    # Close palette
    page.keyboard.press("Escape")
    time.sleep(0.5)
    
    # Summary
    print("\n=== SUMMARY ===")
    if not palette_open:
        print("❌ Command palette didn't open properly")
    elif theme_after_enter == initial_theme:
        print("❌ Enter key didn't execute theme toggle command")
    elif not palette_closed:
        print("❌ Command palette didn't close after Enter")
    else:
        print("✅ Enter key appears to be working in command palette")
    
    # Get console errors
    console_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    
    if console_errors:
        print("\nConsole errors found:")
        for error in console_errors:
            print(f"  ERROR: {error}")