#!/usr/bin/env python3
"""
Test command palette functionality in the Gantt chart
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.async_api import async_playwright
from helpers.command_palette_helpers import (
    is_palette_open, wait_for_palette, get_visible_commands,
    select_command_by_text, get_palette_mode, type_in_palette
)

async def test_command_palette():
    """Test the command palette features"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=200)
        page = await browser.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.text}'))
        
        print("Loading application...")
        await page.goto('http://localhost:8001')
        await page.wait_for_timeout(3000)  # Wait for gantt to load
        
        print("\n=== Test 1: Open command palette with Ctrl+K ===")
        
        # Press Ctrl+K to open command palette
        await page.keyboard.press('Control+k')
        await wait_for_palette(page, visible=True)
        
        # Check if command palette is visible
        palette_open = await is_palette_open(page)
        
        if palette_open:
            print("✓ SUCCESS: Command palette opened with Ctrl+K")
        else:
            print("✗ FAIL: Command palette did not open")
        
        # Close it with Escape
        await page.keyboard.press('Escape')
        await wait_for_palette(page, visible=False)
        
        print("\n=== Test 2: Filter overdue tasks ===")
        
        # Open command palette
        await page.keyboard.press('Control+k')
        await wait_for_palette(page, visible=True)
        
        # Type "overdue" to search for the command
        await type_in_palette(page, 'overdue')
        await page.wait_for_timeout(300)
        
        # Press Enter to execute the first matching command
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(500)
        
        # Check status message
        status = await page.evaluate('() => document.getElementById("status").textContent')
        print(f"Status after filter: {status}")
        
        if "overdue" in status.lower():
            print("✓ SUCCESS: Overdue filter applied")
        else:
            print("✗ FAIL: Overdue filter not applied")
        
        print("\n=== Test 3: Clear filters ===")
        
        # Open command palette
        await page.keyboard.press('Control+k')
        await wait_for_palette(page, visible=True)
        
        # Type "clear" to find clear filters command
        await type_in_palette(page, 'clear')
        await page.wait_for_timeout(300)
        
        # Execute clear filters
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(500)
        
        # Check status
        status = await page.evaluate('() => document.getElementById("status").textContent')
        print(f"Status after clear: {status}")
        
        if "cleared" in status.lower():
            print("✓ SUCCESS: Filters cleared")
        else:
            print("✗ FAIL: Filters not cleared")
        
        print("\n=== Test 4: Zoom commands ===")
        
        # Test zoom to month
        await page.keyboard.press('Control+k')
        await wait_for_palette(page, visible=True)
        await type_in_palette(page, 'zoom month')
        await page.wait_for_timeout(300)
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(500)
        
        # Check if zoom changed
        zoom_level = await page.evaluate('() => window.currentZoom')
        print(f"Current zoom level: {zoom_level}")
        
        if zoom_level == "month":
            print("✓ SUCCESS: Zoom command worked")
        else:
            print("✗ FAIL: Zoom command failed")
        
        print("\n=== Test 5: Today's tasks filter ===")
        
        # Filter today's tasks
        await page.keyboard.press('Control+k')
        await wait_for_palette(page, visible=True)
        await type_in_palette(page, 'today')
        await page.wait_for_timeout(300)
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(500)
        
        status = await page.evaluate('() => document.getElementById("status").textContent')
        print(f"Status after today filter: {status}")
        
        if "today" in status.lower():
            print("✓ SUCCESS: Today filter applied")
        else:
            print("✗ FAIL: Today filter not applied")
        
        print("\n=== Test 6: Expand/Collapse all ===")
        
        # Collapse all
        await page.keyboard.press('Control+k')
        await wait_for_palette(page, visible=True)
        await type_in_palette(page, 'collapse all')
        await page.wait_for_timeout(300)
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(500)
        
        # Check if tasks are collapsed
        collapsed_state = await page.evaluate('''() => {
            const tasks = gantt.getTaskByTime();
            const expandedCount = tasks.filter(t => t.$open).length;
            return { total: tasks.length, expanded: expandedCount };
        }''')
        
        print(f"After collapse all: {collapsed_state['expanded']} of {collapsed_state['total']} tasks expanded")
        
        # Expand all
        await page.keyboard.press('Control+k')
        await wait_for_palette(page, visible=True)
        await type_in_palette(page, 'expand all')
        await page.wait_for_timeout(300)
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(500)
        
        # Check if tasks are expanded
        expanded_state = await page.evaluate('''() => {
            const tasks = gantt.getTaskByTime();
            const expandedCount = tasks.filter(t => t.$open).length;
            return { total: tasks.length, expanded: expandedCount };
        }''')
        
        print(f"After expand all: {expanded_state['expanded']} of {expanded_state['total']} tasks expanded")
        
        if expanded_state['expanded'] > collapsed_state['expanded']:
            print("✓ SUCCESS: Expand/collapse commands work")
        else:
            print("✗ FAIL: Expand/collapse commands not working")
        
        print("\n\nAll tests completed. Browser will stay open for 10 seconds...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_command_palette())