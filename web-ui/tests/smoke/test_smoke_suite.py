#!/usr/bin/env python3
"""
Smoke Test Suite for TaskJuggler Web UI

Quick tests to verify critical functionality is working.
Should complete in under 2 minutes.
"""

import pytest
from playwright.sync_api import Page, expect
import time

class TestSmokeSuite:
    """Core functionality smoke tests"""
    
    def test_01_app_loads_successfully(self, page: Page):
        """Test that the application loads without errors"""
        # Navigate to app
        page.goto("http://localhost:8001")
        
        # Verify critical elements are present
        expect(page.locator("#gantt_here")).to_be_visible(timeout=10000)
        expect(page.locator("#status")).to_be_visible()
        expect(page.locator(".toolbar")).to_be_visible()
        
        # Check for console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg) if msg.type == "error" else None)
        
        # Wait for app initialization
        time.sleep(2)
        
        # Verify no critical errors
        critical_errors = [e for e in console_errors if "Cannot read" in str(e) or "undefined" in str(e)]
        assert len(critical_errors) == 0, f"Critical console errors found: {critical_errors}"
        
        print("✓ Application loads successfully")
    
    def test_02_gantt_data_loads(self, page: Page):
        """Test that Gantt chart loads with data"""
        page.goto("http://localhost:8001")
        
        # Wait for Gantt to initialize
        page.wait_for_selector("#gantt_here", state="visible")
        time.sleep(2)
        
        # Check that tasks are loaded
        task_count = page.evaluate("""
            () => {
                if (typeof gantt === 'undefined') return 0;
                return gantt.getTaskByTime().length;
            }
        """)
        
        assert task_count > 0, "No tasks loaded in Gantt chart"
        
        # Verify at least one task is visible
        expect(page.locator(".gantt_task_line").first).to_be_visible(timeout=5000)
        
        print(f"✓ Gantt loaded with {task_count} tasks")
    
    def test_03_keyboard_help_opens(self, page: Page):
        """Test that keyboard help (?) opens and closes"""
        page.goto("http://localhost:8001")
        page.wait_for_selector("#gantt_here", state="visible")
        time.sleep(1)
        
        # Press ? to open help
        page.keyboard.press("?")
        
        # Verify help is visible
        help_overlay = page.locator("keyboard-help .keyboard-help-overlay")
        expect(help_overlay).to_be_visible(timeout=3000)
        
        # Press Escape to close
        page.keyboard.press("Escape")
        
        # Verify help is hidden
        expect(help_overlay).not_to_be_visible(timeout=3000)
        
        print("✓ Keyboard help opens and closes")
    
    def test_04_command_palette_opens(self, page: Page):
        """Test that command palette opens with Ctrl+Shift+P"""
        page.goto("http://localhost:8001")
        page.wait_for_selector("#gantt_here", state="visible")
        time.sleep(1)
        
        # Open command palette
        page.keyboard.press("Control+Shift+P")
        
        # Verify palette is visible
        palette = page.locator("#customCommandPalette")
        expect(palette).to_be_visible(timeout=3000)
        
        # Verify search input is focused
        search_input = page.locator(".command-palette-search")
        expect(search_input).to_be_focused()
        
        # Close with Escape
        page.keyboard.press("Escape")
        expect(palette).not_to_be_visible(timeout=3000)
        
        print("✓ Command palette opens and closes")
    
    def test_05_theme_toggle_works(self, page: Page):
        """Test that theme can be toggled"""
        page.goto("http://localhost:8001")
        page.wait_for_selector("#gantt_here", state="visible")
        time.sleep(1)
        
        # Check initial theme
        initial_theme = page.evaluate("() => document.body.classList.contains('dark-theme')")
        
        # Open command palette and search for theme
        page.keyboard.press("Control+Shift+P")
        page.wait_for_selector(".command-palette-search", state="visible")
        page.keyboard.type("theme")
        time.sleep(0.5)
        
        # Execute theme toggle
        page.keyboard.press("Enter")
        time.sleep(0.5)
        
        # Verify theme changed
        new_theme = page.evaluate("() => document.body.classList.contains('dark-theme')")
        assert new_theme != initial_theme, "Theme did not toggle"
        
        print("✓ Theme toggle works")
    
    def test_06_zoom_controls_work(self, page: Page):
        """Test that zoom in/out works"""
        page.goto("http://localhost:8001")
        page.wait_for_selector("#gantt_here", state="visible")
        time.sleep(1)
        
        # Get initial zoom
        initial_zoom = page.evaluate("() => stateStore.getZoom()")
        
        # Zoom in with +
        page.keyboard.press("+")
        time.sleep(0.5)
        
        # Verify zoom changed
        new_zoom = page.evaluate("() => stateStore.getZoom()")
        assert new_zoom != initial_zoom, "Zoom did not change"
        
        # Zoom out with -
        page.keyboard.press("-")
        time.sleep(0.5)
        
        # Verify zoom changed back
        final_zoom = page.evaluate("() => stateStore.getZoom()")
        assert final_zoom == initial_zoom, "Zoom did not return to original"
        
        print(f"✓ Zoom controls work: {initial_zoom} → {new_zoom} → {final_zoom}")
    
    def test_07_search_functionality(self, page: Page):
        """Test that search (/) opens and works"""
        page.goto("http://localhost:8001")
        page.wait_for_selector("#gantt_here", state="visible")
        time.sleep(1)
        
        # Press / to open search
        page.keyboard.press("/")
        
        # Verify search mode is active
        palette = page.locator("#customCommandPalette")
        expect(palette).to_be_visible(timeout=3000)
        
        # Verify it's in search mode
        search_mode = page.evaluate("() => stateStore.get('commandPalette.mode')")
        assert search_mode == "search", f"Expected search mode, got {search_mode}"
        
        # Type a search term
        page.keyboard.type("task")
        time.sleep(0.5)
        
        # Verify results appear
        results = page.locator(".command-palette-item")
        expect(results.first).to_be_visible()
        
        # Close with Escape
        page.keyboard.press("Escape")
        expect(palette).not_to_be_visible()
        
        print("✓ Search functionality works")
    
    def test_08_navigation_keys_work(self, page: Page):
        """Test basic navigation with arrow keys"""
        page.goto("http://localhost:8001")
        page.wait_for_selector("#gantt_here", state="visible")
        time.sleep(1)
        
        # Focus on gantt
        page.click("#gantt_here")
        
        # Get initial selected task
        initial_task = page.evaluate("() => gantt.getSelectedId()")
        
        # Press down arrow
        page.keyboard.press("ArrowDown")
        time.sleep(0.3)
        
        # Verify selection changed
        new_task = page.evaluate("() => gantt.getSelectedId()")
        assert new_task != initial_task, "Task selection did not change"
        
        # Press up arrow
        page.keyboard.press("ArrowUp")
        time.sleep(0.3)
        
        # Verify selection changed back
        final_task = page.evaluate("() => gantt.getSelectedId()")
        assert final_task == initial_task, "Task selection did not return"
        
        print("✓ Navigation keys work")
    
    def test_09_state_store_initialized(self, page: Page):
        """Test that state store is properly initialized"""
        page.goto("http://localhost:8001")
        page.wait_for_selector("#gantt_here", state="visible")
        time.sleep(1)
        
        # Verify state store exists and has expected properties
        state_check = page.evaluate("""
            () => {
                if (typeof stateStore === 'undefined') return { exists: false };
                
                const state = stateStore.getState();
                return {
                    exists: true,
                    hasZoom: 'currentZoom' in state,
                    hasCommandPalette: 'commandPalette' in state,
                    hasKeyboard: 'keyboard' in state,
                    zoomValue: state.currentZoom,
                    isReadOnly: state.isReadOnly
                };
            }
        """)
        
        assert state_check['exists'], "State store not initialized"
        assert state_check['hasZoom'], "State store missing zoom property"
        assert state_check['hasCommandPalette'], "State store missing command palette state"
        assert state_check['hasKeyboard'], "State store missing keyboard state"
        
        print(f"✓ State store initialized with zoom: {state_check['zoomValue']}")
    
    def test_10_mouse_wheel_zoom(self, page: Page):
        """Test that Ctrl+MouseWheel zooms"""
        page.goto("http://localhost:8001")
        page.wait_for_selector("#gantt_here", state="visible")
        time.sleep(1)
        
        # Get initial zoom
        initial_zoom = page.evaluate("() => stateStore.getZoom()")
        
        # Simulate Ctrl+Wheel up (zoom in)
        gantt_element = page.locator("#gantt_here")
        gantt_element.dispatch_event("wheel", {
            "deltaY": -100,
            "ctrlKey": True,
            "bubbles": True
        })
        time.sleep(0.5)
        
        # Verify zoom changed
        new_zoom = page.evaluate("() => stateStore.getZoom()")
        assert new_zoom != initial_zoom, "Mouse wheel zoom did not work"
        
        print(f"✓ Mouse wheel zoom works: {initial_zoom} → {new_zoom}")


@pytest.fixture(scope="function")
def page(browser):
    """Create a new page for each test"""
    page = browser.new_page()
    yield page
    page.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])