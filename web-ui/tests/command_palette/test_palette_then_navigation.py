#!/usr/bin/env python3
"""
Test navigation and zoom after using command palette
"""

import asyncio
from playwright.async_api import async_playwright

async def test_palette_then_navigation():
    """Test that navigation and zoom work after using command palette"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=200)
        page = await browser.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.text}'))
        
        print("Loading application...")
        await page.goto('http://localhost:8001')
        await page.wait_for_timeout(3000)  # Wait for gantt to load
        
        # Click on gantt to focus it
        await page.click('#gantt_here')
        await page.wait_for_timeout(500)
        
        print("\n=== Test 1: Navigation BEFORE command palette ===")
        
        # Select project task
        await page.evaluate('() => { gantt.selectTask("project"); }')
        await page.wait_for_timeout(200)
        
        # Try arrow down
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(200)
        
        selected = await page.evaluate('() => gantt.getSelectedId()')
        print(f"After ArrowDown: {selected}")
        
        # Try zoom
        await page.keyboard.press('+')
        await page.wait_for_timeout(200)
        
        zoom = await page.evaluate('() => window.currentZoom')
        print(f"After + key: zoom = {zoom}")
        
        print("\n=== Test 2: Use command palette ===")
        
        # Open command palette
        await page.keyboard.press('Control+k')
        await page.wait_for_timeout(500)
        
        # Type and execute a command
        await page.keyboard.type('clear')
        await page.wait_for_timeout(300)
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(500)
        
        print("Command palette used - executed 'clear filters'")
        
        print("\n=== Test 3: Navigation AFTER command palette ===")
        
        # Click on gantt to ensure focus
        await page.click('#gantt_here')
        await page.wait_for_timeout(300)
        
        # Check active element
        active = await page.evaluate('''() => {
            const el = document.activeElement;
            return {
                tag: el.tagName,
                id: el.id,
                className: el.className
            };
        }''')
        print(f"Active element: {active}")
        
        # Select project task again
        await page.evaluate('() => { gantt.selectTask("project"); }')
        await page.wait_for_timeout(200)
        
        # Try arrow down
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(200)
        
        selected_after = await page.evaluate('() => gantt.getSelectedId()')
        print(f"After ArrowDown: {selected_after}")
        
        if selected_after != 'project':
            print("✓ Navigation still works!")
        else:
            print("✗ Navigation broken after command palette")
        
        print("\n=== Test 4: Zoom AFTER command palette ===")
        
        # Try zoom out
        await page.keyboard.press('-')
        await page.wait_for_timeout(200)
        
        zoom_after = await page.evaluate('() => window.currentZoom')
        print(f"After - key: zoom = {zoom_after}")
        
        if zoom_after == 'week':
            print("✓ Zoom still works!")
        else:
            print("✗ Zoom broken after command palette")
        
        print("\n=== Test 5: Try expand/collapse ===")
        
        # Select project
        await page.evaluate('() => { gantt.selectTask("project"); }')
        await page.wait_for_timeout(200)
        
        # Get initial state
        initial_open = await page.evaluate('() => gantt.getTask("project").$open')
        print(f"Initial state: project is {'open' if initial_open else 'closed'}")
        
        # Press Enter to toggle
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(200)
        
        # Check new state
        final_open = await page.evaluate('() => gantt.getTask("project").$open')
        print(f"After Enter: project is {'open' if final_open else 'closed'}")
        
        if initial_open != final_open:
            print("✓ Enter key toggle still works!")
        else:
            print("✗ Enter key broken after command palette")
        
        print("\n\nTest completed. Browser will stay open for 10 seconds...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_palette_then_navigation())