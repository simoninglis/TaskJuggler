"""Test keyboard shortcuts are working"""
import pytest
from playwright.sync_api import Page, expect
import time

def test_keyboard_shortcuts_registered(page: Page):
    """Test that keyboard shortcuts are properly registered"""
    page.goto("http://localhost:8001")
    
    # Wait for everything to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(5)  # Give time for all modules to load
    
    # Check if keyboard manager is initialized
    keyboard_info = page.evaluate("""
        () => {
            const info = {
                keyboardManagerExists: typeof window.keyboardManager !== 'undefined',
                ganttExists: typeof gantt !== 'undefined',
                taskCount: 0,
                globalHotkeys: [],
                currentState: null
            };
            
            if (typeof gantt !== 'undefined' && gantt.getTaskByTime) {
                info.taskCount = gantt.getTaskByTime().length;
            }
            
            if (window.keyboardManager) {
                info.currentState = window.keyboardManager.getCurrentState();
                // Get global hotkeys
                if (window.keyboardManager.globalHotkeys && window.keyboardManager.globalHotkeys.size > 0) {
                    info.globalHotkeys = Array.from(window.keyboardManager.globalHotkeys.keys());
                }
            }
            
            return info;
        }
    """)
    
    print(f"\n=== Keyboard Manager Info ===")
    print(f"Keyboard Manager exists: {keyboard_info['keyboardManagerExists']}")
    print(f"Current state: {keyboard_info['currentState']}")
    print(f"Global hotkeys: {keyboard_info['globalHotkeys']}")
    print(f"Task count: {keyboard_info['taskCount']}")
    
    # Test help shortcut
    page.click("#gantt_here")
    page.keyboard.press("?")
    time.sleep(0.5)
    
    # Check if help is visible
    help_visible = page.locator("keyboard-help").evaluate("el => el.shadowRoot.querySelector('.keyboard-help-overlay') !== null")
    print(f"\nHelp overlay visible after '?': {help_visible}")
    
    if help_visible:
        page.keyboard.press("Escape")
        time.sleep(0.5)
    
    # Test navigation to next milestone
    print("\n=== Testing Milestone Navigation ===")
    
    # Check if navigateToNextMilestone function exists
    nav_functions = page.evaluate("""
        () => ({
            navigateToNextMilestone: typeof window.navigateToNextMilestone === 'function',
            navigateToPreviousMilestone: typeof window.navigateToPreviousMilestone === 'function'
        })
    """)
    
    print(f"navigateToNextMilestone exists: {nav_functions['navigateToNextMilestone']}")
    print(f"navigateToPreviousMilestone exists: {nav_functions['navigateToPreviousMilestone']}")
    
    # Try calling the function directly
    if nav_functions['navigateToNextMilestone']:
        print("\nCalling navigateToNextMilestone directly...")
        page.evaluate("() => window.navigateToNextMilestone()")
        time.sleep(0.5)
        
        status = page.locator("#status").text_content()
        print(f"Status after direct call: {status}")
    
    # Test the actual keyboard shortcut
    print("\nTesting ]m shortcut...")
    page.keyboard.press("]")
    page.keyboard.press("m")
    time.sleep(0.5)
    
    status = page.locator("#status").text_content()
    print(f"Status after ]m: {status}")
    
    assert keyboard_info['keyboardManagerExists'], "Keyboard manager should be initialized"
    assert keyboard_info['taskCount'] > 0, "Should have tasks loaded"