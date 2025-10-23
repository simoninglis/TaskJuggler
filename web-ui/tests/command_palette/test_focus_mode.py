#!/usr/bin/env python3
"""
Test focus mode functionality (F key)
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.async_api import async_playwright
from helpers.command_palette_helpers import (
    is_palette_open, wait_for_palette, get_palette_mode,
    type_in_palette
)

async def test_focus_mode():
    """Test the focus mode functionality triggered by F key"""
    
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
        
        print("\n=== Test 1: Open focus mode with F key ===")
        
        # Press F to open focus mode
        await page.keyboard.press('F')
        await wait_for_palette(page, visible=True)
        
        # Check if palette is in focus mode
        mode = await get_palette_mode(page)
        print(f"Palette mode after F key: {mode}")
        
        if mode and mode['isFocusMode']:
            print("✓ SUCCESS: Opened in focus mode")
        else:
            print("✗ FAIL: Not in focus mode")
        
        # Check placeholder text
        placeholder = await page.evaluate('''() => {
            const input = document.getElementById('paletteSearch');
            return input ? input.placeholder : 'not found';
        }''')
        print(f"Focus placeholder: {placeholder}")
        
        print("\n=== Test 2: Focus on date range ===")
        
        # Type a date range
        await type_in_palette(page, '2024-01')
        await page.wait_for_timeout(300)
        
        # Press Enter to focus
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(500)
        
        # Check if view focused on January 2024
        focus_result = await page.evaluate('''() => {
            const state = window.gantt ? window.gantt.getScrollState() : null;
            if (state) {
                const centerDate = window.gantt.dateFromPos(state.x + 400);
                const isJan2024 = centerDate.getFullYear() === 2024 && 
                                  centerDate.getMonth() === 0; // January is 0
                
                return {
                    focused: isJan2024,
                    centerDate: centerDate.toISOString(),
                    year: centerDate.getFullYear(),
                    month: centerDate.getMonth()
                };
            }
            return null;
        }''')
        
        print(f"Focus on date result: {focus_result}")
        
        if focus_result and focus_result['focused']:
            print("✓ SUCCESS: Focused on January 2024")
        else:
            print("✗ FAIL: Did not focus on correct date")
        
        print("\n=== Test 3: Focus on task name ===")
        
        # Open focus mode again
        await page.keyboard.press('F')
        await wait_for_palette(page, visible=True)
        
        # Type a task name
        await type_in_palette(page, 'Design')
        await page.wait_for_timeout(300)
        
        # Press Enter
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(500)
        
        # Check if a design task is visible and selected
        design_focus = await page.evaluate('''() => {
            const tasks = window.gantt ? window.gantt.getTaskByTime() : [];
            const designTasks = tasks.filter(t => t.text.toLowerCase().includes('design'));
            
            if (designTasks.length > 0) {
                const task = designTasks[0];
                const taskPos = window.gantt.posFromDate(new Date(task.start_date));
                const scrollX = window.gantt.getScrollState().x;
                const visible = taskPos >= scrollX && taskPos <= scrollX + 800;
                const selected = window.gantt.getSelectedId() === task.id;
                
                return {
                    found: true,
                    taskText: task.text,
                    visible: visible,
                    selected: selected
                };
            }
            return { found: false };
        }''')
        
        print(f"Focus on task result: {design_focus}")
        
        if design_focus['found'] and (design_focus['visible'] or design_focus['selected']):
            print("✓ SUCCESS: Focused on design task")
        else:
            print("✗ FAIL: Did not focus on design task")
        
        print("\n=== Test 4: Focus on current selection (Shift+F) ===")
        
        # First select a specific task
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(300)
        
        # Get selected task info
        selected_info = await page.evaluate('''() => {
            const id = window.gantt ? window.gantt.getSelectedId() : null;
            if (id) {
                const task = window.gantt.getTask(id);
                return {
                    id: id,
                    text: task.text,
                    startPos: window.gantt.posFromDate(new Date(task.start_date))
                };
            }
            return null;
        }''')
        
        print(f"Selected task: {selected_info}")
        
        # Scroll away from the task
        await page.keyboard.press('Control+End')  # Go to end
        await page.wait_for_timeout(500)
        
        # Press Shift+F to focus on selection
        await page.keyboard.down('Shift')
        await page.keyboard.press('F')
        await page.keyboard.up('Shift')
        await page.wait_for_timeout(500)
        
        # Check if view centered on selected task
        centered = await page.evaluate('''() => {
            const id = window.gantt ? window.gantt.getSelectedId() : null;
            if (id) {
                const task = window.gantt.getTask(id);
                const taskPos = window.gantt.posFromDate(new Date(task.start_date));
                const scrollX = window.gantt.getScrollState().x;
                const center = scrollX + 400;
                const distance = Math.abs(taskPos - center);
                
                return {
                    centered: distance < 100,
                    distance: distance
                };
            }
            return null;
        }''')
        
        print(f"Center on selection result: {centered}")
        
        if centered and centered['centered']:
            print("✓ SUCCESS: Focused on selected task with Shift+F")
        else:
            print("✗ FAIL: Did not focus on selected task")
        
        print("\n=== Test 5: Focus with empty input ===")
        
        # Open focus mode
        await page.keyboard.press('F')
        await wait_for_palette(page, visible=True)
        
        # Press Enter without typing anything
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(300)
        
        # Check if palette closed without error
        closed = not await is_palette_open(page)
        
        if closed:
            print("✓ SUCCESS: Focus mode handles empty input gracefully")
        else:
            print("✗ FAIL: Focus mode should close on empty input")
            await page.keyboard.press('Escape')
        
        print("\n=== Test 6: Focus mode escape ===")
        
        # Open focus mode
        await page.keyboard.press('F')
        await wait_for_palette(page, visible=True)
        
        # Type something
        await type_in_palette(page, 'test')
        await page.wait_for_timeout(200)
        
        # Press Escape
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(300)
        
        # Check if palette closed and input cleared
        escaped = not await is_palette_open(page)
        
        if escaped:
            print("✓ SUCCESS: Focus mode closes on Escape")
        else:
            print("✗ FAIL: Focus mode should close on Escape")
        
        print("\n\nAll tests completed. Browser will stay open for 10 seconds...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_focus_mode())