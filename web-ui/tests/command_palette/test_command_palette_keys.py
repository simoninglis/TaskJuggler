#!/usr/bin/env python3
"""
Test that command palette receives keyboard events properly
"""

import asyncio
from playwright.async_api import async_playwright

async def test_command_palette_keys():
    """Test keyboard handling when command palette is open"""
    
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
        
        print("\n=== Test 1: Navigation while palette is open ===")
        
        # Expand all tasks and select a task first
        await page.evaluate('''() => {
            gantt.eachTask(function(task) {
                if (gantt.hasChild(task.id)) {
                    gantt.open(task.id);
                }
            });
            gantt.render();
            gantt.selectTask("project");
        }''')
        await page.wait_for_timeout(200)
        
        # Open command palette
        await page.keyboard.press('Control+k')
        await page.wait_for_timeout(500)
        
        # Check if palette is visible
        is_visible = await page.evaluate('''() => {
            const cp = document.getElementById('commandPalette');
            return cp && cp.hasAttribute('visible');
        }''')
        print(f"Command palette visible: {is_visible}")
        
        # Try arrow keys - should navigate in palette, not gantt
        initial_task = await page.evaluate('() => gantt.getSelectedId()')
        print(f"Selected task before arrows: {initial_task}")
        
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(200)
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(200)
        
        task_after_arrows = await page.evaluate('() => gantt.getSelectedId()')
        print(f"Selected task after arrows: {task_after_arrows}")
        
        if initial_task == task_after_arrows:
            print("✓ SUCCESS: Arrow keys handled by palette, not gantt")
        else:
            print("✗ FAIL: Arrow keys still affecting gantt")
        
        print("\n=== Test 2: Enter key in palette ===")
        
        # Type a command
        await page.keyboard.type('clear')
        await page.wait_for_timeout(300)
        
        # Press Enter - should execute command, not toggle task
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(500)
        
        # Check if palette closed
        is_still_visible = await page.evaluate('''() => {
            const cp = document.getElementById('commandPalette');
            return cp && cp.hasAttribute('visible');
        }''')
        print(f"Palette visible after Enter: {is_still_visible}")
        
        if not is_still_visible:
            print("✓ SUCCESS: Enter executed command and closed palette")
        else:
            print("✗ FAIL: Enter didn't work in palette")
        
        print("\n=== Test 3: Escape closes palette ===")
        
        # Open palette again
        await page.keyboard.press('Control+k')
        await page.wait_for_timeout(500)
        
        # Press Escape
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(300)
        
        # Check if closed
        is_visible_after_esc = await page.evaluate('''() => {
            const cp = document.getElementById('commandPalette');
            return cp && cp.hasAttribute('visible');
        }''')
        
        if not is_visible_after_esc:
            print("✓ SUCCESS: Escape closed the palette")
        else:
            print("✗ FAIL: Escape didn't close palette")
        
        print("\n=== Test 4: Navigation works after palette closes ===")
        
        # Now test regular navigation
        before_nav = await page.evaluate('() => gantt.getSelectedId()')
        
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(200)
        
        after_nav = await page.evaluate('() => gantt.getSelectedId()')
        
        if before_nav != after_nav:
            print("✓ SUCCESS: Navigation works after palette closes")
        else:
            print("✗ FAIL: Navigation still broken")
        
        print("\n\nTest completed. Browser will stay open for 5 seconds...")
        await page.wait_for_timeout(5000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_command_palette_keys())