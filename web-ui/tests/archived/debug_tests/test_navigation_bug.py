#!/usr/bin/env python3
"""
Test to reproduce and verify fix for hidden task navigation bug
"""

import asyncio
from playwright.async_api import async_playwright
import json

async def test_navigation_bug():
    """Test that reproduces the navigation bug with hidden tasks"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=300)
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
        
        # First, make sure all tasks are visible by expanding everything
        await page.evaluate('''() => {
            // Expand all tasks
            gantt.eachTask(function(task) {
                if (gantt.hasChild(task.id)) {
                    gantt.open(task.id);
                }
            });
            gantt.render();
        }''')
        await page.wait_for_timeout(1000)
        
        # Count visible tasks when all expanded
        all_expanded_info = await page.evaluate('''() => {
            const allTasks = gantt.getTaskByTime();
            const visibleTasks = allTasks.filter(task => gantt.isTaskVisible(task.id));
            return {
                totalTasks: allTasks.length,
                visibleTasks: visibleTasks.length,
                taskList: visibleTasks.map(t => ({id: t.id, text: t.text}))
            };
        }''')
        print(f"\nWith all tasks expanded:")
        print(f"Total tasks: {all_expanded_info['totalTasks']}")
        print(f"Visible tasks: {all_expanded_info['visibleTasks']}")
        
        # Now collapse the project and development tasks
        print("\n=== Collapsing project and development tasks ===")
        await page.evaluate('''() => {
            gantt.close("project");
            gantt.close("project.development");
            gantt.render();
        }''')
        await page.wait_for_timeout(1000)
        
        # Count visible tasks after collapsing
        collapsed_info = await page.evaluate('''() => {
            const allTasks = gantt.getTaskByTime();
            const visibleTasks = allTasks.filter(task => gantt.isTaskVisible(task.id));
            return {
                totalTasks: allTasks.length,
                visibleTasks: visibleTasks.length,
                visibleTaskList: visibleTasks.map(t => ({id: t.id, text: t.text})),
                hiddenCount: allTasks.length - visibleTasks.length
            };
        }''')
        print(f"\nAfter collapsing:")
        print(f"Total tasks: {collapsed_info['totalTasks']}")
        print(f"Visible tasks: {collapsed_info['visibleTasks']}")
        print(f"Hidden tasks: {collapsed_info['hiddenCount']}")
        print(f"Visible task list: {[t['text'] for t in collapsed_info['visibleTaskList']]}")
        
        # Select the first task (project)
        print("\n=== Testing navigation with hidden tasks ===")
        await page.evaluate('() => { gantt.selectTask("project"); }')
        await page.wait_for_timeout(500)
        
        # Track navigation steps
        navigation_log = []
        
        # Try to navigate down multiple times and log what happens
        print("\nNavigating DOWN from 'project' task...")
        for i in range(10):  # Try up to 10 times
            # Get current selection before keypress
            before = await page.evaluate('''() => {
                const selectedId = gantt.getSelectedId();
                const task = selectedId ? gantt.getTask(selectedId) : null;
                return {
                    selectedId: selectedId,
                    text: task ? task.text : 'none',
                    isVisible: selectedId ? gantt.isTaskVisible(selectedId) : false
                };
            }''')
            
            # Press arrow down
            await page.keyboard.press('ArrowDown')
            await page.wait_for_timeout(200)
            
            # Get current selection after keypress
            after = await page.evaluate('''() => {
                const selectedId = gantt.getSelectedId();
                const task = selectedId ? gantt.getTask(selectedId) : null;
                return {
                    selectedId: selectedId,
                    text: task ? task.text : 'none',
                    isVisible: selectedId ? gantt.isTaskVisible(selectedId) : false
                };
            }''')
            
            navigation_log.append({
                'step': i + 1,
                'before': before,
                'after': after,
                'changed': before['selectedId'] != after['selectedId']
            })
            
            print(f"Step {i+1}: {before['text']} -> {after['text']} (visible: {after['isVisible']})")
            
            # Stop if we've reached a different visible task
            if after['isVisible'] and after['selectedId'] != 'project':
                print(f"\nReached next visible task '{after['text']}' after {i+1} keypresses")
                break
        
        # Analyze the results
        print("\n=== Navigation Analysis ===")
        hidden_steps = sum(1 for step in navigation_log if not step['after']['isVisible'])
        print(f"Keypresses needed: {len(navigation_log)}")
        print(f"Hidden tasks traversed: {hidden_steps}")
        
        if len(navigation_log) > 1:
            print("\n✗ BUG CONFIRMED: Multiple keypresses needed to navigate between visible tasks")
            print("   The navigation is moving through hidden tasks")
        else:
            print("\n✓ Navigation working correctly: Single keypress moves to next visible task")
        
        # Test navigation up as well
        print("\n\nTesting navigation UP...")
        # First navigate to a task further down
        await page.evaluate('() => { gantt.selectTask("project.deployment"); }')
        await page.wait_for_timeout(500)
        
        up_navigation_log = []
        print("\nNavigating UP from 'deployment' task...")
        for i in range(10):
            before = await page.evaluate('''() => {
                const selectedId = gantt.getSelectedId();
                const task = selectedId ? gantt.getTask(selectedId) : null;
                return {
                    selectedId: selectedId,
                    text: task ? task.text : 'none',
                    isVisible: selectedId ? gantt.isTaskVisible(selectedId) : false
                };
            }''')
            
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
            
            up_navigation_log.append({
                'step': i + 1,
                'before': before,
                'after': after
            })
            
            print(f"Step {i+1}: {before['text']} -> {after['text']} (visible: {after['isVisible']})")
            
            # Stop if we've reached a different visible task
            if after['isVisible'] and after['selectedId'] != before['selectedId'] and before['selectedId'] != 'project.deployment':
                print(f"\nReached previous visible task '{after['text']}' after {i+1} keypresses")
                break
        
        print("\nTest completed. Browser will stay open for 10 seconds...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_navigation_bug())