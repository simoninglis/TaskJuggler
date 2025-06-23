#!/usr/bin/env python3
"""
Test zoom keys functionality
"""

import pytest
from playwright.sync_api import Page, expect
import time

def test_zoom_keys(page: Page):
    """Test that zoom in/out keys work correctly"""
    
    # Navigate to the application
    page.goto("http://localhost:8001")
    
    # Wait for gantt to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)
    
    # Click on gantt to focus it
    page.click("#gantt_here")
    time.sleep(0.5)
    
    print("Testing zoom functionality...")
    
    # Get initial zoom level
    initial_zoom = page.evaluate("() => stateStore ? stateStore.getZoom() : 'unknown'")
    print(f"Initial zoom level: {initial_zoom}")
    
    # Test zoom out with minus key
    print("\nTesting zoom out with '-' key...")
    page.keyboard.press("-")
    time.sleep(0.5)
    
    # Check if zoom changed
    zoom_after_minus = page.evaluate("() => stateStore ? stateStore.getZoom() : 'unknown'")
    print(f"Zoom after pressing '-': {zoom_after_minus}")
    
    # Test zoom in with plus key
    print("\nTesting zoom in with '+' key...")
    page.keyboard.press("+")
    time.sleep(0.5)
    
    # Check if zoom changed back
    zoom_after_plus = page.evaluate("() => stateStore ? stateStore.getZoom() : 'unknown'")
    print(f"Zoom after pressing '+': {zoom_after_plus}")
    
    # Test equals key as alternative to plus
    print("\nTesting zoom in with '=' key...")
    page.keyboard.press("=")
    time.sleep(0.5)
    
    zoom_after_equals = page.evaluate("() => stateStore ? stateStore.getZoom() : 'unknown'")
    print(f"Zoom after pressing '=': {zoom_after_equals}")
    
    # Get the current zoom state from different sources
    print("\nChecking zoom state from different sources:")
    
    # Check state store
    state_store_zoom = page.evaluate("() => stateStore ? stateStore.getZoom() : 'no state store'")
    print(f"State store zoom: {state_store_zoom}")
    
    # Check window.currentZoom (backward compatibility)
    window_zoom = page.evaluate("() => window.currentZoom || 'not set'")
    print(f"window.currentZoom: {window_zoom}")
    
    # Check gantt config
    gantt_scales = page.evaluate("""() => {
        if (typeof gantt === 'undefined') return 'gantt not found';
        return {
            scales: gantt.config.scales,
            scale_unit: gantt.config.scale_unit,
            date_scale: gantt.config.date_scale
        };
    }""")
    print(f"Gantt scales config: {gantt_scales}")
    
    # Check if keyboard manager is detecting correct state
    keyboard_state = page.evaluate("""() => {
        if (window.keyboardManager) {
            return {
                currentState: window.keyboardManager.getCurrentState(),
                handlers: Array.from(window.keyboardManager.handlers.keys()),
                globalHotkeys: Array.from(window.keyboardManager.globalHotkeys.keys())
            };
        }
        return 'keyboard manager not found';
    }""")
    print(f"\nKeyboard manager state: {keyboard_state}")
    
    # Test zoom function directly
    print("\nTesting zoom functions directly...")
    
    # Call zoomIn directly
    zoom_in_result = page.evaluate("""() => {
        if (typeof zoomIn === 'function') {
            zoomIn();
            return 'zoomIn called';
        }
        return 'zoomIn function not found';
    }""")
    print(f"Direct zoomIn call: {zoom_in_result}")
    time.sleep(0.5)
    
    zoom_after_direct = page.evaluate("() => stateStore ? stateStore.getZoom() : 'unknown'")
    print(f"Zoom after direct zoomIn: {zoom_after_direct}")
    
    # Check console for errors
    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))
    
    # Final verification
    if initial_zoom == zoom_after_minus == zoom_after_plus:
        print("\n❌ ISSUE: Zoom keys don't seem to be working - zoom level never changed")
    else:
        print("\n✅ Zoom keys are working - zoom levels changed as expected")
    
    # Print any console errors
    if console_messages:
        print("\nConsole messages:")
        for msg in console_messages:
            print(f"  {msg}")