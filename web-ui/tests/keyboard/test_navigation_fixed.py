#!/usr/bin/env python3
"""
Test to verify the navigation fix works correctly
"""

import asyncio
from playwright.async_api import async_playwright
import json

async def test_navigation_fixed():
    """Test that navigation now correctly skips hidden tasks"""
    
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
        
        print("\n=== Setting up test scenario ===")
        
        # First expand all, then strategically collapse some tasks
        await page.evaluate('''() => {
            // First expand all
            gantt.eachTask(function(task) {
                if (gantt.hasChild(task.id)) {
                    gantt.open(task.id);
                }
            });
            gantt.render();
        }''')
        await page.wait_for_timeout(500)
        
        # Now create a mixed state - collapse development but leave others open
        await page.evaluate('''() => {
            gantt.close("project.development");
            gantt.render();
        }''')
        await page.wait_for_timeout(500)
        
        # Get current state
        state_info = await page.evaluate('''() => {
            const allTasks = gantt.getTaskByTime();
            const visibleTasks = allTasks.filter(task => gantt.isTaskVisible(task.id));
            return {
                totalTasks: allTasks.length,
                visibleTasks: visibleTasks.length,
                visibleTaskList: visibleTasks.map(t => ({id: t.id, text: t.text}))
            };
        }''')
        
        print(f"\nTest scenario setup:")
        print(f"Total tasks: {state_info['totalTasks']}")
        print(f"Visible tasks: {state_info['visibleTasks']}")
        print(f"Development subtasks should be hidden")
        
        # Test 1: Navigate from project to next visible task
        print("\n=== Test 1: Navigate DOWN from 'project' ===")
        await page.evaluate('() => { gantt.selectTask("project"); }')
        await page.wait_for_timeout(200)
        
        # Press arrow down once
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(200)
        
        after_down = await page.evaluate('''() => {
            const selectedId = gantt.getSelectedId();
            const task = selectedId ? gantt.getTask(selectedId) : null;
            return {
                selectedId: selectedId,
                text: task ? task.text : 'none',
                isVisible: selectedId ? gantt.isTaskVisible(selectedId) : false
            };
        }''')
        
        print(f"After 1 ArrowDown press: {after_down['text']} (visible: {after_down['isVisible']})")
        
        if after_down['selectedId'] == 'project.design' and after_down['isVisible']:
            print("✓ SUCCESS: Navigated directly to next visible task (Design Phase)")
        else:
            print("✗ FAIL: Did not navigate to expected visible task")
        
        # Test 2: Navigate past collapsed development section
        print("\n=== Test 2: Navigate past collapsed section ===")
        
        # Navigate to just before development
        await page.evaluate('() => { gantt.selectTask("project.design"); }')
        await page.wait_for_timeout(200)
        
        # Press arrow down once - should skip development children
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(200)
        
        after_skip = await page.evaluate('''() => {
            const selectedId = gantt.getSelectedId();
            const task = selectedId ? gantt.getTask(selectedId) : null;
            return {
                selectedId: selectedId,
                text: task ? task.text : 'none',
                isVisible: selectedId ? gantt.isTaskVisible(selectedId) : false
            };
        }''')
        
        print(f"After navigating past collapsed development: {after_skip['text']}")
        
        if after_skip['selectedId'] == 'project.development' and after_skip['isVisible']:
            print("✓ SUCCESS: Navigated to Development (parent visible, children hidden)")
        else:
            print(f"✗ Unexpected result: {after_skip['selectedId']}")
        
        # Test 3: Navigate UP correctly
        print("\n=== Test 3: Navigate UP test ===")
        
        # Start from testing
        await page.evaluate('() => { gantt.selectTask("project.testing"); }')
        await page.wait_for_timeout(200)
        
        # Navigate up multiple times
        navigation_log = []
        for i in range(3):
            before = await page.evaluate('() => gantt.getSelectedId()')
            
            await page.keyboard.press('ArrowUp')
            await page.wait_for_timeout(200)
            
            after = await page.evaluate('''() => {
                const selectedId = gantt.getSelectedId();
                const task = selectedId ? gantt.getTask(selectedId) : null;
                return {
                    selectedId: selectedId,
                    text: task ? task.text : 'none',
                    isVisible: selectedId ? gantt.isTaskVisible(selectedId) : false
                };
            }''')
            
            navigation_log.append(after)
            print(f"Step {i+1}: {after['text']} (visible: {after['isVisible']})")
        
        # Test 4: Complex scenario with deeply nested collapsed
        print("\n=== Test 4: Complex nested scenario ===")
        
        # Collapse testing.integration (has children)
        await page.evaluate('''() => {
            gantt.close("project.testing.integration");
            gantt.render();
        }''')
        await page.wait_for_timeout(500)
        
        # Navigate from testing down
        await page.evaluate('() => { gantt.selectTask("project.testing"); }')
        await page.wait_for_timeout(200)
        
        # Should skip to integration, then to system, skipping integration's children
        for i in range(3):
            await page.keyboard.press('ArrowDown')
            await page.wait_for_timeout(200)
            
            current = await page.evaluate('''() => {
                const selectedId = gantt.getSelectedId();
                const task = selectedId ? gantt.getTask(selectedId) : null;
                return {
                    selectedId: selectedId,
                    text: task ? task.text : 'none'
                };
            }''')
            print(f"Navigate step {i+1}: {current['text']}")
        
        print("\n=== Summary ===")
        print("The fix should ensure that:")
        print("1. Navigation skips hidden tasks")
        print("2. Single keypress moves to next/previous visible task")
        print("3. Complex nested structures are handled correctly")
        
        print("\nTest completed. Browser will stay open for 10 seconds...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_navigation_fixed())