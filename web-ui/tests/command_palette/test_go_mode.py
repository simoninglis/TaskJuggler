#!/usr/bin/env python3
"""
Test go mode navigation functionality (g key)
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.async_api import async_playwright
from helpers.command_palette_helpers import (
    is_palette_open, wait_for_palette, get_palette_mode,
    get_visible_commands, select_command_by_text
)

async def test_go_mode():
    """Test the go mode navigation functionality triggered by g key"""
    
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
        
        print("\n=== Test 1: Open go mode with g key ===")
        
        # Press g to open go mode
        await page.keyboard.press('g')
        await wait_for_palette(page, visible=True)
        
        # Check if palette is in go mode
        mode = await get_palette_mode(page)
        print(f"Palette mode after g key: {mode}")
        
        if mode and mode['isGoMode']:
            print("✓ SUCCESS: Opened in go mode")
        else:
            print("✗ FAIL: Not in go mode")
        
        # Get available go options
        go_options = await get_visible_commands(page)
        print(f"\nAvailable go options: {len(go_options)} items")
        for option in go_options:
            print(f"  - {option['text']}")
        
        # Close palette
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(300)
        
        print("\n=== Test 2: Go to today (gt) ===")
        
        # Get current scroll position
        initial_scroll = await page.evaluate('() => window.gantt ? window.gantt.getScrollState().x : 0')
        
        # Use gt shortcut
        await page.keyboard.press('g')
        await page.keyboard.press('t')
        await page.wait_for_timeout(500)
        
        # Check if view scrolled to today
        today_result = await page.evaluate('''() => {
            const scrollX = window.gantt ? window.gantt.getScrollState().x : 0;
            const centerDate = window.gantt ? window.gantt.dateFromPos(scrollX + 400) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (centerDate) {
                const centered = new Date(centerDate);
                centered.setHours(0, 0, 0, 0);
                const diffDays = Math.abs((centered - today) / (1000 * 60 * 60 * 24));
                
                return {
                    scrollChanged: scrollX !== 0,
                    nearToday: diffDays < 7,
                    centerDate: centerDate.toISOString(),
                    todayDate: today.toISOString()
                };
            }
            return null;
        }''')
        
        print(f"Go to today result: {today_result}")
        
        if today_result and today_result['nearToday']:
            print("✓ SUCCESS: Navigated to today")
        else:
            print("✗ FAIL: Did not navigate to today")
        
        print("\n=== Test 3: Go to project start (gs) ===")
        
        # Use gs shortcut
        await page.keyboard.press('g')
        await page.keyboard.press('s')
        await page.wait_for_timeout(500)
        
        # Check if at project start
        start_result = await page.evaluate('''() => {
            const scrollX = window.gantt ? window.gantt.getScrollState().x : -1;
            const tasks = window.gantt ? window.gantt.getTaskByTime() : [];
            const projectStart = tasks.length > 0 ? 
                Math.min(...tasks.map(t => new Date(t.start_date).getTime())) : null;
            
            return {
                scrollX: scrollX,
                atStart: scrollX <= 50,  // Near beginning
                projectStart: projectStart ? new Date(projectStart).toISOString() : null
            };
        }''')
        
        print(f"Go to start result: {start_result}")
        
        if start_result['atStart']:
            print("✓ SUCCESS: Navigated to project start")
        else:
            print("✗ FAIL: Did not navigate to project start")
        
        print("\n=== Test 4: Go to project end (ge) ===")
        
        # Use ge shortcut
        await page.keyboard.press('g')
        await page.keyboard.press('e')
        await page.wait_for_timeout(500)
        
        # Check if at project end
        end_result = await page.evaluate('''() => {
            const state = window.gantt ? window.gantt.getScrollState() : null;
            const tasks = window.gantt ? window.gantt.getTaskByTime() : [];
            const projectEnd = tasks.length > 0 ? 
                Math.max(...tasks.map(t => new Date(t.end_date).getTime())) : null;
            
            if (state && projectEnd) {
                const centerDate = window.gantt.dateFromPos(state.x + 400);
                const diffDays = Math.abs((centerDate - new Date(projectEnd)) / (1000 * 60 * 60 * 24));
                
                return {
                    nearEnd: diffDays < 30,  // Within a month of project end
                    projectEnd: new Date(projectEnd).toISOString(),
                    centerDate: centerDate.toISOString()
                };
            }
            return null;
        }''')
        
        print(f"Go to end result: {end_result}")
        
        if end_result and end_result['nearEnd']:
            print("✓ SUCCESS: Navigated to project end")
        else:
            print("✗ FAIL: Did not navigate to project end")
        
        print("\n=== Test 5: Go mode with selection ===")
        
        # First select a task
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(300)
        
        selected_before = await page.evaluate('''() => {
            const id = window.gantt ? window.gantt.getSelectedId() : null;
            return id ? window.gantt.getTask(id).text : null;
        }''')
        print(f"Selected task: {selected_before}")
        
        # Open go mode from palette
        await page.keyboard.press('g')
        await wait_for_palette(page, visible=True)
        
        # Select "Go to selected task"
        await select_command_by_text(page, 'selected')
        await page.wait_for_timeout(500)
        
        # Check if view centered on selected task
        centered_result = await page.evaluate('''() => {
            const selectedId = window.gantt ? window.gantt.getSelectedId() : null;
            if (selectedId) {
                const task = window.gantt.getTask(selectedId);
                const taskPos = window.gantt.posFromDate(new Date(task.start_date));
                const scrollX = window.gantt.getScrollState().x;
                const center = scrollX + 400;  // Approximate center
                const distance = Math.abs(taskPos - center);
                
                return {
                    taskText: task.text,
                    centered: distance < 100,  // Within 100px of center
                    distance: distance
                };
            }
            return null;
        }''')
        
        print(f"Center on selected result: {centered_result}")
        
        if centered_result and centered_result['centered']:
            print("✓ SUCCESS: Centered on selected task")
        else:
            print("✗ FAIL: Did not center on selected task")
        
        print("\n=== Test 6: Invalid go shortcut ===")
        
        # Try an invalid shortcut
        await page.keyboard.press('g')
        await page.keyboard.press('x')  # Invalid
        await page.wait_for_timeout(300)
        
        # Check if palette is still open (should close on invalid)
        still_open = await is_palette_open(page)
        
        if not still_open:
            print("✓ SUCCESS: Palette closed on invalid shortcut")
        else:
            print("✗ FAIL: Palette should close on invalid shortcut")
            await page.keyboard.press('Escape')
        
        print("\n\nAll tests completed. Browser will stay open for 10 seconds...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_go_mode())