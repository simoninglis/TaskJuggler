#!/usr/bin/env python3
"""
Test theme toggle functionality
"""

import pytest
from playwright.sync_api import Page, expect
import time

def test_theme_toggle(page: Page):
    """Test theme toggle functionality"""
    
    # Navigate to the application
    page.goto("http://localhost:8001")
    
    # Wait for gantt to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)
    
    # Check if theme-manager exists
    theme_manager_check = page.evaluate("""() => {
        const themeManager = document.querySelector('theme-manager');
        if (!themeManager) return 'Theme manager not found';
        
        return {
            exists: true,
            hasToggleTheme: typeof themeManager.toggleTheme === 'function',
            currentTheme: themeManager.getTheme ? themeManager.getTheme() : 'unknown',
            elementTag: themeManager.tagName
        };
    }""")
    
    print(f"Theme manager check: {theme_manager_check}")
    
    # Get initial theme
    initial_theme = page.evaluate("() => document.documentElement.getAttribute('data-theme') || 'light'")
    print(f"Initial theme: {initial_theme}")
    
    # Try to toggle theme directly
    toggle_result = page.evaluate("""() => {
        const themeManager = document.querySelector('theme-manager');
        if (themeManager && themeManager.toggleTheme) {
            themeManager.toggleTheme();
            return 'Theme toggled';
        }
        return 'Could not toggle theme';
    }""")
    
    print(f"Toggle result: {toggle_result}")
    
    # Check theme after toggle
    theme_after = page.evaluate("() => document.documentElement.getAttribute('data-theme') || 'light'")
    print(f"Theme after toggle: {theme_after}")
    
    # Check if the issue is with how the command palette calls it
    palette_handler_result = page.evaluate("""() => {
        // Simulate what the command palette does
        const handler = () => {
            const themeManager = document.querySelector('theme-manager');
            if (themeManager) {
                themeManager.toggleTheme();
            }
        };
        
        try {
            handler();
            return 'Handler executed';
        } catch (error) {
            return 'Handler error: ' + error.message;
        }
    }""")
    
    print(f"Palette handler simulation: {palette_handler_result}")
    
    # Final theme check
    final_theme = page.evaluate("() => document.documentElement.getAttribute('data-theme') || 'light'")
    print(f"Final theme: {final_theme}")
    
    # Check console errors
    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))
    
    if console_messages:
        print("\nConsole messages:")
        for msg in console_messages:
            print(f"  {msg}")