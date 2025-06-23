#!/usr/bin/env python3
"""
Test theme toggle with async wait
"""

import pytest
from playwright.sync_api import Page, expect
import time

def test_theme_async(page: Page):
    """Test theme toggle with proper waiting"""
    
    # Navigate to the application
    page.goto("http://localhost:8001")
    
    # Wait for gantt to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)
    
    # Get initial theme
    initial_theme = page.evaluate("() => document.documentElement.getAttribute('data-theme') || 'light'")
    print(f"Initial theme: {initial_theme}")
    
    # Toggle theme and wait for the change
    page.evaluate("""() => {
        const themeManager = document.querySelector('theme-manager');
        if (themeManager && themeManager.toggleTheme) {
            themeManager.toggleTheme();
        }
    }""")
    
    # Wait a bit for the theme to change
    time.sleep(0.5)
    
    # Check theme after toggle with wait
    theme_after = page.evaluate("() => document.documentElement.getAttribute('data-theme') || 'light'")
    print(f"Theme after toggle with wait: {theme_after}")
    
    # Try using setTheme directly
    set_theme_result = page.evaluate("""() => {
        const themeManager = document.querySelector('theme-manager');
        if (themeManager && themeManager.setTheme) {
            const currentTheme = themeManager.getTheme();
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            themeManager.setTheme(newTheme);
            return `Set theme to ${newTheme}`;
        }
        return 'setTheme not available';
    }""")
    
    print(f"setTheme result: {set_theme_result}")
    time.sleep(0.5)
    
    # Check theme after setTheme
    theme_after_set = page.evaluate("() => document.documentElement.getAttribute('data-theme') || 'light'")
    print(f"Theme after setTheme: {theme_after_set}")
    
    # Check if theme is stored correctly
    stored_theme = page.evaluate("""() => {
        const themeManager = document.querySelector('theme-manager');
        return {
            getTheme: themeManager && themeManager.getTheme ? themeManager.getTheme() : 'no getTheme',
            localStorage: localStorage.getItem('theme'),
            dataAttribute: document.documentElement.getAttribute('data-theme')
        };
    }""")
    
    print(f"Stored theme info: {stored_theme}")
    
    # Try the actual command palette flow
    print("\nTesting command palette flow:")
    
    # Open command palette
    page.keyboard.press("Control+Shift+P")
    time.sleep(0.5)
    
    # Type "dark"
    page.keyboard.type("dark")
    time.sleep(0.5)
    
    # Press Enter
    page.keyboard.press("Enter")
    time.sleep(1)  # Give more time
    
    # Check final theme
    final_theme = page.evaluate("() => document.documentElement.getAttribute('data-theme') || 'light'")
    print(f"Final theme after Enter key: {final_theme}")
    
    # Check if palette closed
    palette_closed = page.evaluate("() => !stateStore.isCommandPaletteOpen()")
    print(f"Palette closed: {palette_closed}")