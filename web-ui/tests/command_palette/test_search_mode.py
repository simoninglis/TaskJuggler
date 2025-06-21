#!/usr/bin/env python3
"""
Test search mode functionality (/ key)
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.async_api import async_playwright
from helpers.command_palette_helpers import (
    is_palette_open, wait_for_palette, get_palette_mode,
    type_in_palette, get_visible_commands
)

async def test_search_mode():
    """Test the search mode functionality triggered by / key"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=200)
        page = await browser.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.text}'))
        
        print("Loading application...")
        await page.goto('http://localhost:8001')
        await page.wait_for_timeout(3000)  # Wait for gantt to load
        
        # Focus the gantt
        await page.click('#gantt_here')
        await page.wait_for_timeout(500)
        
        print("\n=== Test 1: Open search mode with / key ===")
        
        # Press / to open search mode
        await page.keyboard.press('/')
        await wait_for_palette(page, visible=True)
        
        # Check if palette is in search mode
        mode = await get_palette_mode(page)
        print(f"Palette mode after / key: {mode}")
        
        if mode and mode['isSearchMode']:
            print("✓ SUCCESS: Opened in search mode")
        else:
            print("✗ FAIL: Not in search mode")
        
        # Check placeholder text
        placeholder = await page.evaluate('''() => {
            const input = document.getElementById('paletteSearch');
            return input ? input.placeholder : 'not found';
        }''')
        print(f"Search placeholder: {placeholder}")
        
        print("\n=== Test 2: Search for tasks ===")
        
        # Type a search term
        await type_in_palette(page, 'Design')
        await page.wait_for_timeout(500)
        
        # Get search results
        results = await get_visible_commands(page)
        print(f"Search results for 'Design': {len(results)} items")
        
        if results:
            print("First few results:")
            for i, result in enumerate(results[:3]):
                print(f"  {i+1}. {result['text']}")
        
        print("\n=== Test 3: Navigate search results ===")
        
        # Navigate with arrow keys
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(200)
        
        # Check which item is selected
        results_after_nav = await get_visible_commands(page)
        selected = [r for r in results_after_nav if r['isSelected']]
        
        if selected:
            print(f"✓ Selected item: {selected[0]['text']}")
        else:
            print("✗ No item selected after navigation")
        
        print("\n=== Test 4: Select a task from search ===")
        
        # Press Enter to select the task
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(500)
        
        # Check if palette closed and task is selected
        palette_closed = not await is_palette_open(page)
        
        # Check if a task is selected in Gantt
        selected_task = await page.evaluate('''() => {
            const selectedId = window.gantt ? window.gantt.getSelectedId() : null;
            if (selectedId) {
                const task = window.gantt.getTask(selectedId);
                return {
                    id: selectedId,
                    text: task ? task.text : null
                };
            }
            return null;
        }''')
        
        print(f"Palette closed: {palette_closed}")
        print(f"Selected task: {selected_task}")
        
        if palette_closed and selected_task:
            print("✓ SUCCESS: Task selected from search")
        else:
            print("✗ FAIL: Task selection failed")
        
        print("\n=== Test 5: Search with no results ===")
        
        # Open search mode again
        await page.keyboard.press('/')
        await wait_for_palette(page, visible=True)
        
        # Search for something that doesn't exist
        await type_in_palette(page, 'xyznonexistent')
        await page.wait_for_timeout(500)
        
        no_results = await get_visible_commands(page)
        print(f"Results for 'xyznonexistent': {len(no_results)} items")
        
        # Check for "no results" message
        no_results_msg = await page.evaluate('''() => {
            const results = document.getElementById('paletteResults');
            return results ? results.textContent : '';
        }''')
        
        if 'no' in no_results_msg.lower() or len(no_results) == 0:
            print("✓ SUCCESS: Shows no results appropriately")
        else:
            print("✗ FAIL: Should show no results")
        
        # Close palette
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(300)
        
        print("\n=== Test 6: Search for months ===")
        
        # Open search mode
        await page.keyboard.press('/')
        await wait_for_palette(page, visible=True)
        
        # Search for a month
        await type_in_palette(page, 'January')
        await page.wait_for_timeout(500)
        
        month_results = await get_visible_commands(page)
        print(f"Results for 'January': {len(month_results)} items")
        
        # Select if found
        if month_results:
            await page.keyboard.press('Enter')
            await page.wait_for_timeout(500)
            
            # Check if view scrolled to January
            current_date = await page.evaluate('''() => {
                const center = window.gantt ? window.gantt.getScrollState().x : 0;
                const date = window.gantt ? window.gantt.dateFromPos(center + 400) : null;
                return date ? date.toISOString() : null;
            }''')
            
            print(f"View centered on: {current_date}")
            
            if current_date and '01' in current_date.split('-')[1]:
                print("✓ SUCCESS: Navigated to January")
            else:
                print("✗ FAIL: Did not navigate to January")
        
        print("\n\nAll tests completed. Browser will stay open for 10 seconds...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_search_mode())