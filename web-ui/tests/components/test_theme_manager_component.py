"""Test the theme-manager Web Component functionality."""
import pytest
from playwright.sync_api import Page, expect
import time

def test_theme_manager_component(page: Page):
    """Test the theme manager Web Component functionality."""
    
    # Navigate to the application
    page.goto("http://localhost:8001")
    
    # Wait for component to load
    page.wait_for_selector("theme-manager", state="visible")
    time.sleep(1)
    
    # Verify component exists
    theme_manager = page.locator("theme-manager")
    expect(theme_manager).to_have_count(1)
    
    # Get initial theme
    initial_theme = page.evaluate("""
        () => {
            const el = document.querySelector('theme-manager');
            return el && el.getTheme ? el.getTheme() : null;
        }
    """)
    print(f"Initial theme: {initial_theme}")
    
    # Check that body has correct data-theme attribute
    body_theme = page.locator("body").get_attribute("data-theme")
    assert body_theme == initial_theme, f"Body theme {body_theme} doesn't match component theme {initial_theme}"
    
    # Click theme toggle button (in shadow DOM)
    page.evaluate("""
        () => {
            const el = document.querySelector('theme-manager');
            if (el && el.shadowRoot) {
                const button = el.shadowRoot.querySelector('.theme-toggle');
                if (button) button.click();
            }
        }
    """)
    time.sleep(0.5)
    
    # Check theme changed
    new_theme = page.evaluate("""
        () => {
            const el = document.querySelector('theme-manager');
            return el && el.getTheme ? el.getTheme() : null;
        }
    """)
    print(f"New theme: {new_theme}")
    
    # Verify theme actually changed
    expected_new = 'dark' if initial_theme == 'light' else 'light'
    assert new_theme == expected_new, f"Theme should be {expected_new}, but is {new_theme}"
    
    # Check body class updated
    if new_theme == 'dark':
        expect(page.locator("body")).to_have_class(/dark-theme/)
    else:
        expect(page.locator("body")).not_to_have_class(/dark-theme/)
    
    # Verify localStorage was updated
    stored_theme = page.evaluate("() => localStorage.getItem('taskjuggler-theme')")
    assert stored_theme == new_theme, f"localStorage theme {stored_theme} doesn't match current theme {new_theme}"
    
    # Test programmatic theme change
    page.evaluate("""
        () => {
            const el = document.querySelector('theme-manager');
            if (el && el.setTheme) {
                el.setTheme('light');
            }
        }
    """)
    time.sleep(0.5)
    
    final_theme = page.evaluate("""
        () => {
            const el = document.querySelector('theme-manager');
            return el && el.getTheme ? el.getTheme() : null;
        }
    """)
    assert final_theme == 'light', f"Theme should be light after setTheme, but is {final_theme}"
    
    print("✅ All theme manager component tests passed!")

def test_theme_persistence(page: Page):
    """Test that theme preference persists across page reloads."""
    
    # Navigate and set dark theme
    page.goto("http://localhost:8001")
    page.wait_for_selector("theme-manager", state="visible")
    
    # Set to dark theme
    page.evaluate("""
        () => {
            const el = document.querySelector('theme-manager');
            if (el && el.setTheme) {
                el.setTheme('dark');
            }
        }
    """)
    time.sleep(0.5)
    
    # Reload page
    page.reload()
    page.wait_for_selector("theme-manager", state="visible")
    time.sleep(1)
    
    # Check theme persisted
    theme_after_reload = page.evaluate("""
        () => {
            const el = document.querySelector('theme-manager');
            return el && el.getTheme ? el.getTheme() : null;
        }
    """)
    assert theme_after_reload == 'dark', "Theme should persist as dark after reload"
    
    # Clean up - reset to light
    page.evaluate("""
        () => {
            const el = document.querySelector('theme-manager');
            if (el && el.setTheme) {
                el.setTheme('light');
            }
        }
    """)
    
    print("✅ Theme persistence test passed!")