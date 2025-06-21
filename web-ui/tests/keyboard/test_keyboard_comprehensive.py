#!/usr/bin/env python3
"""
Comprehensive test for keyboard navigation in the Gantt chart UI
"""

import asyncio
from playwright.async_api import async_playwright
import json
import time

async def test_keyboard_navigation_comprehensive():
    """Comprehensive test of keyboard navigation including Enter key"""
    
    async with async_playwright() as p:
        # Launch browser with debug options
        browser = await p.chromium.launch(
            headless=False,  # Show browser for debugging
            slow_mo=200      # Slow down actions for visibility
        )
        
        # Create context and page
        context = await browser.new_context()
        page = await context.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.type}: {msg.text}'))
        
        # Navigate to the app
        print("=== Loading application ===")
        await page.goto('http://localhost:8001')
        
        # Wait for gantt to load
        await page.wait_for_selector('#gantt_here', state='visible')
        await page.wait_for_timeout(3000)  # Give gantt time to initialize
        
        # Focus the gantt container
        await page.click('#gantt_here')
        await page.wait_for_timeout(500)
        
        print("\n=== Testing Enter key on parent tasks ===")
        
        # Test 1: Select root project task
        print("\n1. Testing root project task")
        await page.evaluate('''() => {
            gantt.selectTask("project");
            gantt.showTask("project");
        }''')
        await page.wait_for_timeout(500)
        
        # Get initial state
        initial_state = await page.evaluate('''() => {
            const task = gantt.getTask("project");
            const state = gantt.getState();
            return {
                taskId: "project",
                task$open: task.$open,
                stateOpened: state.opened["project"],
                hasChildren: gantt.hasChild("project"),
                visibleChildren: gantt.getChildren("project").filter(id => gantt.isTaskVisible(id)).length
            };
        }''')
        print(f"Initial state: {json.dumps(initial_state, indent=2)}")
        
        # Press Enter
        print("Pressing Enter...")
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(1000)
        
        # Get new state
        new_state = await page.evaluate('''() => {
            const task = gantt.getTask("project");
            const state = gantt.getState();
            return {
                taskId: "project",
                task$open: task.$open,
                stateOpened: state.opened["project"],
                hasChildren: gantt.hasChild("project"),
                visibleChildren: gantt.getChildren("project").filter(id => gantt.isTaskVisible(id)).length
            };
        }''')
        print(f"New state: {json.dumps(new_state, indent=2)}")
        
        if initial_state['task$open'] != new_state['task$open']:
            print("✓ SUCCESS: Enter key changed task.$open state")
        else:
            print("✗ FAIL: Enter key did not change task.$open state")
            
        if initial_state['visibleChildren'] != new_state['visibleChildren']:
            print("✓ SUCCESS: Visible children changed")
        else:
            print("✗ FAIL: Visible children did not change")
            
        # Test 2: Try arrow right to expand
        print("\n2. Testing Arrow Right to expand")
        if not new_state['task$open']:
            print("Pressing Arrow Right...")
            await page.keyboard.press('ArrowRight')
            await page.wait_for_timeout(1000)
            
            arrow_state = await page.evaluate('''() => {
                const task = gantt.getTask("project");
                return {
                    task$open: task.$open,
                    visibleChildren: gantt.getChildren("project").filter(id => gantt.isTaskVisible(id)).length
                };
            }''')
            print(f"After Arrow Right: {json.dumps(arrow_state, indent=2)}")
            
            if arrow_state['task$open']:
                print("✓ SUCCESS: Arrow Right expanded the task")
            else:
                print("✗ FAIL: Arrow Right did not expand the task")
        
        # Test 3: Direct API test
        print("\n3. Testing direct API calls")
        
        # Test gantt.open()
        print("Calling gantt.open('project')...")
        await page.evaluate('() => gantt.open("project")')
        await page.wait_for_timeout(500)
        
        open_result = await page.evaluate('''() => {
            const task = gantt.getTask("project");
            return {
                task$open: task.$open,
                visibleChildren: gantt.getChildren("project").filter(id => gantt.isTaskVisible(id)).length
            };
        }''')
        print(f"After gantt.open(): {json.dumps(open_result, indent=2)}")
        
        # Test gantt.close()
        print("\nCalling gantt.close('project')...")
        await page.evaluate('() => gantt.close("project")')
        await page.wait_for_timeout(500)
        
        close_result = await page.evaluate('''() => {
            const task = gantt.getTask("project");
            return {
                task$open: task.$open,
                visibleChildren: gantt.getChildren("project").filter(id => gantt.isTaskVisible(id)).length
            };
        }''')
        print(f"After gantt.close(): {json.dumps(close_result, indent=2)}")
        
        # Test 4: Check event handlers
        print("\n4. Checking event handlers and configuration")
        handlers_info = await page.evaluate('''() => {
            return {
                ganttConfig: {
                    keyboard_navigation: gantt.config.keyboard_navigation,
                    keyboard_navigation_cells: gantt.config.keyboard_navigation_cells,
                    readonly: gantt.config.readonly
                },
                ganttVersion: gantt.version
            };
        }''')
        print(f"Gantt configuration: {json.dumps(handlers_info, indent=2)}")
        
        # Test 5: Try Space key
        print("\n5. Testing Space key")
        await page.keyboard.press('Space')
        await page.wait_for_timeout(1000)
        
        space_result = await page.evaluate('''() => {
            const task = gantt.getTask("project");
            return {
                task$open: task.$open,
                visibleChildren: gantt.getChildren("project").filter(id => gantt.isTaskVisible(id)).length
            };
        }''')
        print(f"After Space key: {json.dumps(space_result, indent=2)}")
        
        # Test 6: Test on a different parent task
        print("\n6. Testing on development task")
        
        # First ensure project is open
        await page.evaluate('() => gantt.open("project")')
        await page.wait_for_timeout(500)
        
        # Select development task
        await page.evaluate('''() => {
            gantt.selectTask("project.development");
            gantt.showTask("project.development");
        }''')
        await page.wait_for_timeout(500)
        
        dev_initial = await page.evaluate('''() => {
            const task = gantt.getTask("project.development");
            return {
                taskId: "project.development",
                task$open: task.$open,
                hasChildren: gantt.hasChild("project.development")
            };
        }''')
        print(f"Development task initial: {json.dumps(dev_initial, indent=2)}")
        
        # Press Enter on development task
        print("Pressing Enter on development task...")
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(1000)
        
        dev_new = await page.evaluate('''() => {
            const task = gantt.getTask("project.development");
            return {
                taskId: "project.development",
                task$open: task.$open,
                hasChildren: gantt.hasChild("project.development")
            };
        }''')
        print(f"Development task after Enter: {json.dumps(dev_new, indent=2)}")
        
        # Keep browser open for inspection
        print("\n=== Test completed. Browser will stay open for 15 seconds... ===")
        await page.wait_for_timeout(15000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_keyboard_navigation_comprehensive())