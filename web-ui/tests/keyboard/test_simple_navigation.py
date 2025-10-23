#!/usr/bin/env python3
"""
Simple test for basic navigation
"""

import asyncio
from playwright.async_api import async_playwright

async def test_simple_navigation():
    """Test basic navigation without command palette"""
    
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
        
        print("\n=== Test basic navigation ===")
        
        # Expand all tasks first
        await page.evaluate('''() => {
            gantt.eachTask(function(task) {
                if (gantt.hasChild(task.id)) {
                    gantt.open(task.id);
                }
            });
            gantt.render();
        }''')
        await page.wait_for_timeout(500)
        
        # Select project
        await page.evaluate('() => { gantt.selectTask("project"); }')
        await page.wait_for_timeout(200)
        
        # Try navigation
        for i in range(5):
            await page.keyboard.press('ArrowDown')
            await page.wait_for_timeout(200)
            
            selected = await page.evaluate('''() => {
                const id = gantt.getSelectedId();
                const task = id ? gantt.getTask(id) : null;
                return {
                    id: id,
                    text: task ? task.text : 'none'
                };
            }''')
            print(f"Step {i+1}: Selected = {selected['text']} (id: {selected['id']})")
        
        print("\n=== Test zoom ===")
        
        # Test zoom
        current_zoom = await page.evaluate('() => window.currentZoom')
        print(f"Initial zoom: {current_zoom}")
        
        await page.keyboard.press('+')
        await page.wait_for_timeout(200)
        zoom_after_plus = await page.evaluate('() => window.currentZoom')
        print(f"After + key: {zoom_after_plus}")
        
        await page.keyboard.press('-')
        await page.wait_for_timeout(200)
        zoom_after_minus = await page.evaluate('() => window.currentZoom')
        print(f"After - key: {zoom_after_minus}")
        
        print("\n=== Test Enter key ===")
        
        # Select project again
        await page.evaluate('() => { gantt.selectTask("project"); }')
        await page.wait_for_timeout(200)
        
        # Get initial state
        initial_open = await page.evaluate('() => gantt.getTask("project").$open')
        print(f"Initial: project is {'open' if initial_open else 'closed'}")
        
        # Press Enter
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(500)
        
        # Get final state
        final_open = await page.evaluate('() => gantt.getTask("project").$open')
        print(f"After Enter: project is {'open' if final_open else 'closed'}")
        
        if initial_open != final_open:
            print("✓ Enter key works!")
        else:
            print("✗ Enter key not working")
        
        print("\n\nTest completed. Browser will stay open for 5 seconds...")
        await page.wait_for_timeout(5000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_simple_navigation())