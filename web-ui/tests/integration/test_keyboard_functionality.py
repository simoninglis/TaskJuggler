#!/usr/bin/env python3
"""
Comprehensive test of keyboard functionality
"""

import pytest
from playwright.sync_api import Page, expect
import time

def test_keyboard_functionality(page: Page):
    """Test zoom keys and Enter key functionality"""
    
    # Navigate to the application
    page.goto("http://localhost:8001")
    
    # Wait for gantt to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)
    
    # Click on gantt to focus it
    page.click("#gantt_here")
    time.sleep(0.5)
    
    print("=== TESTING ZOOM KEYS ===")
    
    # Get initial zoom
    initial_zoom = page.evaluate("() => stateStore ? stateStore.getZoom() : 'unknown'")
    print(f"Initial zoom: {initial_zoom}")
    
    # Test zoom out
    page.keyboard.press("-")
    time.sleep(0.5)
    zoom_after_minus = page.evaluate("() => stateStore ? stateStore.getZoom() : 'unknown'")
    print(f"After '-' key: {zoom_after_minus}")
    
    # Test zoom in
    page.keyboard.press("+")
    time.sleep(0.5)
    zoom_after_plus = page.evaluate("() => stateStore ? stateStore.getZoom() : 'unknown'")
    print(f"After '+' key: {zoom_after_plus}")
    
    # Test equals as alternative
    page.keyboard.press("=")
    time.sleep(0.5)
    zoom_after_equals = page.evaluate("() => stateStore ? stateStore.getZoom() : 'unknown'")
    print(f"After '=' key: {zoom_after_equals}")
    
    zoom_works = zoom_after_minus != initial_zoom or zoom_after_plus != zoom_after_minus
    
    print("\n=== TESTING ENTER KEY IN COMMAND PALETTE ===")
    
    # Test 1: Theme toggle
    print("\n1. Testing theme toggle...")
    initial_theme = page.evaluate("() => document.body.getAttribute('data-theme') || 'light'")
    print(f"Initial theme: {initial_theme}")
    
    page.keyboard.press("Control+Shift+P")
    time.sleep(0.5)
    page.keyboard.type("dark")
    time.sleep(0.5)
    page.keyboard.press("Enter")
    time.sleep(0.5)
    
    theme_after = page.evaluate("() => document.body.getAttribute('data-theme') || 'light'")
    print(f"Theme after Enter: {theme_after}")
    theme_changed = theme_after != initial_theme
    
    # Test 2: Search mode
    print("\n2. Testing search mode...")
    page.keyboard.press("/")
    time.sleep(0.5)
    
    search_mode = page.evaluate("() => stateStore ? stateStore.getCommandPaletteMode() : 'unknown'")
    print(f"Mode after '/': {search_mode}")
    
    page.keyboard.type("milestone")
    time.sleep(0.5)
    
    results_count = page.evaluate("""() => {
        const items = document.querySelectorAll('#customCommandPalette .command-item');
        return items.length;
    }""")
    print(f"Search results: {results_count}")
    
    page.keyboard.press("Enter")
    time.sleep(0.5)
    
    palette_closed = page.evaluate("() => stateStore ? !stateStore.isCommandPaletteOpen() : true")
    print(f"Palette closed after search Enter: {palette_closed}")
    
    # Test 3: Go mode
    print("\n3. Testing go mode...")
    page.keyboard.press("g")
    time.sleep(0.5)
    
    go_mode = page.evaluate("() => stateStore ? stateStore.getCommandPaletteMode() : 'unknown'")
    print(f"Mode after 'g': {go_mode}")
    
    page.keyboard.press("Enter")
    time.sleep(0.5)
    
    go_palette_closed = page.evaluate("() => stateStore ? !stateStore.isCommandPaletteOpen() : true")
    print(f"Palette closed after go Enter: {go_palette_closed}")
    
    # Test 4: Focus mode
    print("\n4. Testing focus mode...")
    page.keyboard.press("f")
    time.sleep(0.5)
    
    focus_mode = page.evaluate("() => stateStore ? stateStore.getCommandPaletteMode() : 'unknown'")
    print(f"Mode after 'f': {focus_mode}")
    
    page.keyboard.press("Escape")  # Close palette
    
    print("\n=== SUMMARY ===")
    print(f"✅ Zoom keys: {'Working' if zoom_works else 'NOT WORKING'}")
    print(f"✅ Enter key (theme): {'Working' if theme_changed else 'NOT WORKING'}")
    print(f"✅ Enter key (search): {'Working' if palette_closed else 'NOT WORKING'}")
    print(f"✅ Enter key (go): {'Working' if go_palette_closed else 'NOT WORKING'}")
    print(f"✅ Command palette modes: {search_mode == 'search' and go_mode == 'go' and focus_mode == 'focus'}")
    
    # Overall status
    all_working = zoom_works and theme_changed and palette_closed and go_palette_closed
    print(f"\n{'✅ All keyboard functionality working!' if all_working else '❌ Some keyboard functionality not working'}")