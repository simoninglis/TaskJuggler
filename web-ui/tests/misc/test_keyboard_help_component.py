"""Test the keyboard help Web Component functionality."""
import pytest
from playwright.sync_api import Page, expect
import time

def test_keyboard_help_web_component(page: Page):
    """Test the keyboard help Web Component functionality."""
    
    # Navigate to the application
    page.goto("http://localhost:8001")
    
    # Wait for gantt to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)  # Allow gantt data to load
    
    # Wait for custom element to be defined
    page.evaluate("""
        () => {
            return customElements.whenDefined('keyboard-help');
        }
    """)
    time.sleep(0.5)  # Give component time to initialize
    
    # Verify component exists in DOM
    keyboard_help = page.locator("keyboard-help")
    expect(keyboard_help).to_have_count(1)
    
    # Initially, help should not be visible (shadowRoot content)
    overlay = page.locator("keyboard-help")
    
    # Open help with keyboard shortcut
    page.keyboard.press("Shift+?")
    time.sleep(0.5)  # Allow animation
    
    # Debug: Check component status
    debug_info = page.evaluate("""
        () => {
            const el = document.querySelector('keyboard-help');
            return {
                elementExists: !!el,
                hasShadowRoot: !!(el && el.shadowRoot),
                hasGetState: !!(el && el.getState),
                isOpen: el && el.getState ? el.getState().isOpen : null,
                shadowContent: el && el.shadowRoot ? el.shadowRoot.innerHTML.substring(0, 100) : null
            };
        }
    """)
    print(f"Debug info: {debug_info}")
    
    # Check if help is displayed (component has isOpen state)
    # We need to check shadow DOM content
    is_open = page.evaluate("""
        () => {
            const el = document.querySelector('keyboard-help');
            if (el && el.shadowRoot) {
                const overlay = el.shadowRoot.querySelector('.keyboard-help-overlay');
                return overlay && window.getComputedStyle(overlay).display !== 'none';
            }
            return false;
        }
    """)
    assert is_open, f"Keyboard help should be open after pressing Shift+? Debug: {debug_info}"
    
    # Verify title in shadow DOM
    title = page.evaluate("""
        () => {
            const el = document.querySelector('keyboard-help');
            if (el && el.shadowRoot) {
                const h2 = el.shadowRoot.querySelector('h2');
                return h2 ? h2.textContent : null;
            }
            return null;
        }
    """)
    assert title == "Keyboard Shortcuts", f"Expected 'Keyboard Shortcuts', got '{title}'"
    
    # Verify categories exist
    categories_count = page.evaluate("""
        () => {
            const el = document.querySelector('keyboard-help');
            if (el && el.shadowRoot) {
                const categories = el.shadowRoot.querySelectorAll('.keyboard-help-category');
                return categories.length;
            }
            return 0;
        }
    """)
    assert categories_count == 4, f"Expected 4 categories, found {categories_count}"
    
    # Close with Escape
    page.keyboard.press("Escape")
    time.sleep(0.5)  # Allow animation
    
    # Verify help is closed
    is_closed = page.evaluate("""
        () => {
            const el = document.querySelector('keyboard-help');
            if (el && el.shadowRoot) {
                const overlay = el.shadowRoot.querySelector('.keyboard-help-overlay');
                return !overlay || window.getComputedStyle(overlay).display === 'none';
            }
            return true;
        }
    """)
    assert is_closed, "Keyboard help should be closed after pressing Escape"
    
    # Test toggle functionality with '?'
    page.keyboard.press("?")
    time.sleep(0.5)
    
    is_open = page.evaluate("""
        () => {
            const el = document.querySelector('keyboard-help');
            return el && el.getState && el.getState().isOpen;
        }
    """)
    assert is_open, "Keyboard help should be open after pressing ?"
    
    # Toggle again to close
    page.keyboard.press("?")
    time.sleep(0.5)
    
    is_closed = page.evaluate("""
        () => {
            const el = document.querySelector('keyboard-help');
            return el && el.getState && !el.getState().isOpen;
        }
    """)
    assert is_closed, "Keyboard help should be closed after pressing ? again"
    
    print("✅ All keyboard help Web Component tests passed!")

def test_keyboard_help_dark_theme(page: Page):
    """Test keyboard help in dark theme."""
    
    page.goto("http://localhost:8001")
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)
    
    # Switch to dark theme
    page.click("#themeToggle")
    time.sleep(0.5)
    
    # Open keyboard help
    page.keyboard.press("?")
    time.sleep(0.5)
    
    # Verify dark theme styles are applied
    has_dark_theme = page.evaluate("""
        () => {
            return document.body.classList.contains('dark-theme');
        }
    """)
    assert has_dark_theme, "Dark theme should be active"
    
    # Check component still works in dark theme
    is_open = page.evaluate("""
        () => {
            const el = document.querySelector('keyboard-help');
            return el && el.getState && el.getState().isOpen;
        }
    """)
    assert is_open, "Keyboard help should work in dark theme"
    
    # Close help
    page.keyboard.press("Escape")
    
    print("✅ Dark theme keyboard help tests passed!")