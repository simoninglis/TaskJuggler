#!/usr/bin/env python3
"""
Test keyboard navigation in the Gantt chart UI
"""

import asyncio
from playwright.async_api import async_playwright
import time

async def test_enter_key_toggle():
    """Test that Enter key toggles expand/collapse on parent tasks"""
    
    async with async_playwright() as p:
        # Launch browser with debug options
        browser = await p.chromium.launch(
            headless=False,  # Show browser for debugging
            slow_mo=500      # Slow down actions for visibility
        )
        
        # Create context and page
        context = await browser.new_context()
        page = await context.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.type}: {msg.text}'))
        
        # Navigate to the app
        await page.goto('http://localhost:8001')
        
        # Wait for gantt to load
        await page.wait_for_selector('#gantt_here', state='visible')
        await page.wait_for_timeout(2000)  # Give gantt time to initialize
        
        # Focus the gantt container
        await page.click('#gantt_here')
        await page.wait_for_timeout(500)
        
        print("Testing keyboard navigation...")
        
        # First, check if any task is selected
        selected_task_id = await page.evaluate('''() => {
            return gantt.getSelectedId();
        }''')
        print(f"Initially selected task: {selected_task_id}")
        
        # If no task selected, select the first one
        if not selected_task_id:
            await page.evaluate('''() => {
                const tasks = gantt.getTaskByTime();
                if (tasks.length > 0) {
                    gantt.selectTask(tasks[0].id);
                    return tasks[0].id;
                }
                return null;
            }''')
            selected_task_id = await page.evaluate('() => gantt.getSelectedId()')
            print(f"Selected first task: {selected_task_id}")
        
        # Check if selected task has children
        task_info = await page.evaluate('''(taskId) => {
            const task = gantt.getTask(taskId);
            const hasChildren = gantt.hasChild(taskId);
            return {
                id: taskId,
                text: task.text,
                hasChildren: hasChildren,
                isOpen: task.$open,
                type: task.type
            };
        }''', selected_task_id)
        
        print(f"Task info: {task_info}")
        
        # If task has children, test Enter key
        if task_info['hasChildren'] > 0:
            print(f"Task '{task_info['text']}' has {task_info['hasChildren']} children")
            print(f"Current open state: {task_info['isOpen']}")
            
            # Press Enter key
            print("Pressing Enter key...")
            await page.keyboard.press('Enter')
            await page.wait_for_timeout(1000)
            
            # Check new state
            new_state = await page.evaluate('''(taskId) => {
                const task = gantt.getTask(taskId);
                return task.$open;
            }''', selected_task_id)
            
            print(f"New open state: {new_state}")
            
            if new_state != task_info['isOpen']:
                print("✓ SUCCESS: Enter key toggled the expand/collapse state!")
            else:
                print("✗ FAIL: Enter key did not change the state")
                
                # Try to debug why
                debug_info = await page.evaluate('''(taskId) => {
                    const openedState = gantt.getState().opened;
                    return {
                        ganttOpened: openedState,
                        taskInOpened: taskId in openedState,
                        taskOpenedValue: openedState[taskId],
                        ganttConfig: {
                            keyboard_navigation: gantt.config.keyboard_navigation,
                            keyboard_navigation_cells: gantt.config.keyboard_navigation_cells,
                            readonly: gantt.config.readonly
                        }
                    };
                }''', selected_task_id)
                print(f"Debug info: {debug_info}")
                
                # Check what happened in the logs
                print("\nChecking debug logs...")
                await page.wait_for_timeout(1000)
        
        # Test arrow keys
        print("\nTesting arrow key navigation...")
        
        # Press arrow down
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(500)
        
        new_selected = await page.evaluate('() => gantt.getSelectedId()')
        print(f"After ArrowDown, selected: {new_selected}")
        
        # Press arrow up
        await page.keyboard.press('ArrowUp')
        await page.wait_for_timeout(500)
        
        new_selected = await page.evaluate('() => gantt.getSelectedId()')
        print(f"After ArrowUp, selected: {new_selected}")
        
        # Keep browser open for inspection
        print("\nTest completed. Browser will stay open for 10 seconds...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_enter_key_toggle())