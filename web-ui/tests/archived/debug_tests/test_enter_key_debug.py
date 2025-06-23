#!/usr/bin/env python3
"""
Debug Enter key functionality in command palette
"""

import pytest
from playwright.sync_api import Page, expect
import time

def test_enter_key_debug(page: Page):
    """Debug why Enter key isn't working in command palette"""
    
    # Navigate to the application
    page.goto("http://localhost:8001")
    
    # Wait for gantt to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)
    
    print("Debugging Enter key in command palette...")
    
    # Open command palette
    page.keyboard.press("Control+Shift+P")
    time.sleep(0.5)
    
    # Type "dark" to filter
    page.keyboard.type("dark")
    time.sleep(0.5)
    
    # Debug state before Enter
    debug_info = page.evaluate("""() => {
        const palette = window.customCommandPalette;
        const storeState = stateStore.getState();
        
        return {
            paletteExists: !!palette,
            filteredCommands: palette ? palette.filteredCommands : null,
            selectedIndex: palette ? palette.selectedIndex : null,
            storeSelectedIndex: storeState.commandPalette.selectedIndex,
            storeMode: storeState.commandPalette.mode,
            executeSelectedExists: palette ? typeof palette.executeSelected === 'function' : false,
            executeCommandExists: palette ? typeof palette.executeCommand === 'function' : false,
            commandsLength: palette && palette.commands ? palette.commands.length : 0,
            firstFilteredCommand: palette && palette.filteredCommands && palette.filteredCommands[0] ? {
                id: palette.filteredCommands[0].id,
                title: palette.filteredCommands[0].title,
                handler: typeof palette.filteredCommands[0].handler
            } : null
        };
    }""")
    
    print(f"Debug info before Enter: {debug_info}")
    
    # Try calling executeSelected directly
    execute_result = page.evaluate("""() => {
        const palette = window.customCommandPalette;
        if (palette && palette.executeSelected) {
            try {
                palette.executeSelected();
                return 'executeSelected called successfully';
            } catch (error) {
                return 'Error: ' + error.message;
            }
        }
        return 'executeSelected not available';
    }""")
    
    print(f"Direct executeSelected call: {execute_result}")
    
    # Check theme after
    theme_after = page.evaluate("() => document.documentElement.getAttribute('data-theme') || 'light'")
    print(f"Theme after direct call: {theme_after}")
    
    # Now test with actual Enter key
    page.keyboard.press("Control+Shift+P")
    time.sleep(0.5)
    page.keyboard.type("dark")
    time.sleep(0.5)
    
    # Check event listeners
    event_info = page.evaluate("""() => {
        const searchInput = document.getElementById('paletteSearch');
        if (searchInput) {
            // Get event listeners (this is a debugging trick)
            const listeners = getEventListeners ? getEventListeners(searchInput) : 'getEventListeners not available';
            
            // Try to trigger keydown directly
            const event = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
            });
            
            const defaultPrevented = !searchInput.dispatchEvent(event);
            
            return {
                inputExists: true,
                listeners: listeners,
                eventDispatched: true,
                defaultPrevented: defaultPrevented
            };
        }
        return 'Search input not found';
    }""")
    
    print(f"Event info: {event_info}")
    
    # Check handleKeyDown binding
    binding_info = page.evaluate("""() => {
        const palette = window.customCommandPalette;
        if (palette) {
            // Check if handleKeyDown is bound correctly
            const handleKeyDownExists = typeof palette.handleKeyDown === 'function';
            
            // Try calling it directly with a fake Enter event
            if (handleKeyDownExists) {
                const fakeEvent = {
                    key: 'Enter',
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                
                try {
                    palette.handleKeyDown(fakeEvent);
                    return 'handleKeyDown called successfully';
                } catch (error) {
                    return 'Error in handleKeyDown: ' + error.message;
                }
            }
            
            return 'handleKeyDown not found';
        }
        return 'Palette not found';
    }""")
    
    print(f"handleKeyDown binding: {binding_info}")
    
    # Final theme check
    final_theme = page.evaluate("() => document.documentElement.getAttribute('data-theme') || 'light'")
    print(f"Final theme: {final_theme}")
    
    # Close palette
    page.keyboard.press("Escape")