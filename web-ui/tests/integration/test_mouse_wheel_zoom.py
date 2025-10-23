"""
Test mouse wheel zoom functionality with Ctrl/Cmd modifier keys.
"""

import pytest
from playwright.sync_api import Page, expect
import time
import sys

def test_mouse_wheel_zoom(page: Page):
    """Test that Ctrl/Cmd + mouse wheel zooms the timeline."""
    
    # Navigate to the application
    page.goto("http://localhost:8001")
    
    # Wait for Gantt to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)  # Allow data to load
    
    # Get initial zoom level
    initial_zoom = page.evaluate("stateStore.getZoom()")
    assert initial_zoom == "day", f"Expected initial zoom to be 'day', got '{initial_zoom}'"
    
    # Click on the gantt chart to focus it
    gantt_element = page.locator("#gantt_here")
    gantt_element.click()
    
    # Simulate Ctrl+Scroll Up (zoom in)
    # On Mac, we'd use Meta key, but Playwright's wheel event uses Control
    gantt_element.dispatch_event("wheel", {
        "deltaY": -100,  # Negative for scroll up
        "ctrlKey": True,
        "bubbles": True
    })
    
    # Give it a moment to process
    time.sleep(0.5)
    
    # Check that zoom level changed to hour (zoomed in)
    new_zoom = page.evaluate("stateStore.getZoom()")
    assert new_zoom == "hour", f"Expected zoom to be 'hour' after zoom in, got '{new_zoom}'"
    
    # Check status message
    status_text = page.locator("#status").text_content()
    assert "Zoomed in" in status_text, f"Expected 'Zoomed in' in status, got: {status_text}"
    
    # Simulate Ctrl+Scroll Down multiple times to zoom out
    for _ in range(3):  # Zoom out 3 times: hour -> day -> week -> month
        gantt_element.dispatch_event("wheel", {
            "deltaY": 100,  # Positive for scroll down
            "ctrlKey": True,
            "bubbles": True
        })
        time.sleep(0.3)
    
    # Check that we're now at month view
    final_zoom = page.evaluate("stateStore.getZoom()")
    assert final_zoom == "month", f"Expected zoom to be 'month' after zooming out, got '{final_zoom}'"
    
    # Check status message
    status_text = page.locator("#status").text_content()
    assert "Zoomed out" in status_text, f"Expected 'Zoomed out' in status, got: {status_text}"
    
    print(f"✓ Mouse wheel zoom test passed: {initial_zoom} -> {new_zoom} -> {final_zoom}")


def test_mouse_wheel_without_modifier(page: Page):
    """Test that mouse wheel without Ctrl/Cmd does NOT zoom."""
    
    # Navigate to the application
    page.goto("http://localhost:8001")
    
    # Wait for Gantt to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)  # Allow data to load
    
    # Get initial zoom level
    initial_zoom = page.evaluate("stateStore.getZoom()")
    
    # Click on the gantt chart to focus it
    gantt_element = page.locator("#gantt_here")
    gantt_element.click()
    
    # Simulate scroll without modifier (should scroll, not zoom)
    gantt_element.dispatch_event("wheel", {
        "deltaY": -100,  # Scroll up
        "ctrlKey": False,  # No modifier key
        "bubbles": True
    })
    
    time.sleep(0.5)
    
    # Verify zoom level didn't change
    new_zoom = page.evaluate("stateStore.getZoom()")
    assert new_zoom == initial_zoom, f"Zoom changed without modifier key: {initial_zoom} -> {new_zoom}"
    
    print(f"✓ Mouse wheel without modifier correctly does not zoom")


def test_mouse_wheel_zoom_limits(page: Page):
    """Test zoom limits - can't zoom beyond hour or year view."""
    
    # Navigate to the application
    page.goto("http://localhost:8001")
    
    # Wait for Gantt to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)  # Allow data to load
    
    gantt_element = page.locator("#gantt_here")
    gantt_element.click()
    
    # First, zoom all the way in (to hour view)
    for _ in range(5):  # More than enough to reach the limit
        gantt_element.dispatch_event("wheel", {
            "deltaY": -100,
            "ctrlKey": True,
            "bubbles": True
        })
        time.sleep(0.2)
    
    # Should be at hour view (minimum zoom)
    min_zoom = page.evaluate("stateStore.getZoom()")
    assert min_zoom == "hour", f"Expected minimum zoom to be 'hour', got '{min_zoom}'"
    
    # Try to zoom in more - should stay at hour
    gantt_element.dispatch_event("wheel", {
        "deltaY": -100,
        "ctrlKey": True,
        "bubbles": True
    })
    time.sleep(0.2)
    
    still_min_zoom = page.evaluate("stateStore.getZoom()")
    assert still_min_zoom == "hour", "Zoom went beyond minimum limit"
    
    # Now zoom all the way out (to year view)
    for _ in range(10):  # More than enough to reach the limit
        gantt_element.dispatch_event("wheel", {
            "deltaY": 100,
            "ctrlKey": True,
            "bubbles": True
        })
        time.sleep(0.2)
    
    # Should be at year view (maximum zoom)
    max_zoom = page.evaluate("stateStore.getZoom()")
    assert max_zoom == "year", f"Expected maximum zoom to be 'year', got '{max_zoom}'"
    
    # Try to zoom out more - should stay at year
    gantt_element.dispatch_event("wheel", {
        "deltaY": 100,
        "ctrlKey": True,
        "bubbles": True
    })
    time.sleep(0.2)
    
    still_max_zoom = page.evaluate("stateStore.getZoom()")
    assert still_max_zoom == "year", "Zoom went beyond maximum limit"
    
    print(f"✓ Zoom limits test passed: hour (min) and year (max) limits enforced")


def test_mouse_wheel_zoom_with_meta_key(page: Page):
    """Test that Meta key (Cmd on Mac) also works for zoom."""
    
    # Navigate to the application
    page.goto("http://localhost:8001")
    
    # Wait for Gantt to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)  # Allow data to load
    
    # Get initial zoom level
    initial_zoom = page.evaluate("stateStore.getZoom()")
    
    gantt_element = page.locator("#gantt_here")
    gantt_element.click()
    
    # Simulate Meta+Scroll (Cmd+Scroll on Mac)
    gantt_element.dispatch_event("wheel", {
        "deltaY": -100,
        "metaKey": True,  # Meta key instead of Ctrl
        "bubbles": True
    })
    
    time.sleep(0.5)
    
    # Check that zoom changed
    new_zoom = page.evaluate("stateStore.getZoom()")
    assert new_zoom != initial_zoom, f"Zoom didn't change with Meta key: still {initial_zoom}"
    
    print(f"✓ Meta key (Cmd) zoom test passed: {initial_zoom} -> {new_zoom}")


if __name__ == "__main__":
    # Run with pytest
    pytest.main([__file__, "-v", "-s"])