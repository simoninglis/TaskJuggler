#!/usr/bin/env python3
"""
Test horizontal scrolling functionality in the Gantt chart
"""

import asyncio
from playwright.async_api import async_playwright

async def test_horizontal_scrolling():
    """Test the new horizontal scrolling features"""
    
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
        
        print("\n=== Test 1: Shift+Left/Right scrolling ===")
        
        # Get initial scroll position
        initial_scroll = await page.evaluate('() => gantt.getScrollState()')
        print(f"Initial scroll position: x={initial_scroll['x']}, y={initial_scroll['y']}")
        
        # Test Shift+Right to scroll right
        print("\nPressing Shift+Right...")
        await page.keyboard.down('Shift')
        await page.keyboard.press('ArrowRight')
        await page.keyboard.up('Shift')
        await page.wait_for_timeout(500)
        
        after_right = await page.evaluate('() => gantt.getScrollState()')
        print(f"After Shift+Right: x={after_right['x']}, y={after_right['y']}")
        
        if after_right['x'] > initial_scroll['x']:
            print("✓ SUCCESS: Scrolled right")
        else:
            print("✗ FAIL: Did not scroll right")
        
        # Test Shift+Left to scroll back
        print("\nPressing Shift+Left...")
        await page.keyboard.down('Shift')
        await page.keyboard.press('ArrowLeft')
        await page.keyboard.up('Shift')
        await page.wait_for_timeout(500)
        
        after_left = await page.evaluate('() => gantt.getScrollState()')
        print(f"After Shift+Left: x={after_left['x']}, y={after_left['y']}")
        
        if after_left['x'] < after_right['x']:
            print("✓ SUCCESS: Scrolled left")
        else:
            print("✗ FAIL: Did not scroll left")
        
        print("\n=== Test 2: Home/End keys ===")
        
        # Test End key to jump to timeline end
        print("\nPressing End key...")
        await page.keyboard.press('End')
        await page.wait_for_timeout(500)
        
        after_end = await page.evaluate('() => gantt.getScrollState()')
        print(f"After End: x={after_end['x']}, y={after_end['y']}")
        
        if after_end['x'] > after_left['x']:
            print("✓ SUCCESS: Jumped to end of timeline")
        else:
            print("✗ FAIL: Did not jump to end")
        
        # Test Home key to jump back to start
        print("\nPressing Home key...")
        await page.keyboard.press('Home')
        await page.wait_for_timeout(500)
        
        after_home = await page.evaluate('() => gantt.getScrollState()')
        print(f"After Home: x={after_home['x']}, y={after_home['y']}")
        
        if after_home['x'] == 0:
            print("✓ SUCCESS: Jumped to start of timeline")
        else:
            print("✗ FAIL: Did not jump to start")
        
        print("\n=== Test 3: Scrolling at different zoom levels ===")
        
        # Test scrolling with different zoom levels
        zoom_levels = ['day', 'week', 'month']
        
        for zoom in zoom_levels:
            print(f"\nTesting with zoom level: {zoom}")
            
            # Set zoom level
            await page.evaluate(f'() => setZoom("{zoom}")')
            await page.wait_for_timeout(500)
            
            # Scroll to start first
            await page.keyboard.press('Home')
            await page.wait_for_timeout(300)
            
            start_pos = await page.evaluate('() => gantt.getScrollState()')
            
            # Scroll right
            await page.keyboard.down('Shift')
            await page.keyboard.press('ArrowRight')
            await page.keyboard.up('Shift')
            await page.wait_for_timeout(300)
            
            end_pos = await page.evaluate('() => gantt.getScrollState()')
            scroll_amount = end_pos['x'] - start_pos['x']
            
            print(f"  Scroll amount at {zoom} zoom: {scroll_amount}px")
            
            if scroll_amount > 0:
                print(f"  ✓ Scrolling works at {zoom} zoom level")
            else:
                print(f"  ✗ Scrolling failed at {zoom} zoom level")
        
        print("\n=== Test 4: Regular navigation still works ===")
        
        # Verify that regular arrow keys still work for navigation
        await page.evaluate('() => { gantt.selectTask("project"); }')
        await page.wait_for_timeout(200)
        
        # Press arrow down without Shift
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(200)
        
        selected_after_down = await page.evaluate('() => gantt.getSelectedId()')
        print(f"\nAfter ArrowDown (no Shift): selected task = {selected_after_down}")
        
        if selected_after_down != 'project':
            print("✓ SUCCESS: Regular navigation still works")
        else:
            print("✗ FAIL: Regular navigation broken")
        
        # Press arrow right without Shift (should collapse/expand)
        initial_open_state = await page.evaluate('''() => {
            const task = gantt.getTask("project");
            return task.$open;
        }''')
        
        await page.keyboard.press('ArrowRight')
        await page.wait_for_timeout(200)
        
        final_open_state = await page.evaluate('''() => {
            const task = gantt.getTask("project");
            return task.$open;
        }''')
        
        if initial_open_state != final_open_state:
            print("✓ SUCCESS: Expand/collapse still works with arrow keys")
        else:
            print("✗ FAIL: Expand/collapse not working")
        
        print("\n\nAll tests completed. Browser will stay open for 10 seconds...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_horizontal_scrolling())