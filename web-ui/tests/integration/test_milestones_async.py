#!/usr/bin/env python3
"""
Test milestone functionality
"""

import asyncio
from playwright.async_api import async_playwright

async def test_milestones():
    """Test milestone display and navigation"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=200)
        page = await browser.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.text}'))
        
        print("Loading application...")
        await page.goto('http://localhost:8001')
        await page.wait_for_timeout(3000)  # Wait for gantt to load
        
        print("\n=== Checking milestone data ===")
        
        # Get task information
        task_info = await page.evaluate('''() => {
            if (typeof gantt === 'undefined') return null;
            
            const tasks = gantt.getTaskByTime();
            return tasks.map(task => ({
                id: task.id,
                text: task.text,
                type: task.type,
                duration: task.duration,
                start_date: task.start_date
            }));
        }''')
        
        if task_info:
            print(f"\nTotal tasks: {len(task_info)}")
            for task in task_info:
                print(f"- {task['id']}: {task['text']} (type: {task.get('type', 'undefined')}, duration: {task.get('duration', 'N/A')})")
        
        # Check milestone type configuration
        type_config = await page.evaluate('''() => {
            if (typeof gantt === 'undefined') return null;
            
            return {
                types: gantt.config.types,
                hasMilestoneType: gantt.config.types.hasOwnProperty('milestone'),
                milestoneValue: gantt.config.types.milestone
            };
        }''')
        
        print(f"\nType configuration: {type_config}")
        
        # Count milestones
        milestone_count = await page.evaluate('''() => {
            if (typeof gantt === 'undefined') return -1;
            
            const tasks = gantt.getTaskByTime();
            const milestones = tasks.filter(task => task.type === gantt.config.types.milestone);
            
            console.log('Milestone tasks:', milestones);
            
            return milestones.length;
        }''')
        
        print(f"\nMilestone count: {milestone_count}")
        
        # Check milestone elements in DOM
        milestone_elements = await page.locator('.gantt_task_line.gantt_milestone').count()
        print(f"Milestone DOM elements: {milestone_elements}")
        
        # Get rightside text (where milestone labels should appear)
        rightside_texts = await page.locator('.gantt_side_content.gantt_right').all_text_contents()
        print(f"\nRightside texts: {rightside_texts}")
        
        print("\n=== Testing milestone navigation ===")
        
        # Click on gantt to focus it
        await page.click('#gantt_here')
        await page.wait_for_timeout(500)
        
        # Get initial status
        initial_status = await page.locator('#status').text_content()
        print(f"Initial status: {initial_status}")
        
        # Press ]m to go to next milestone
        print("\nPressing ]m...")
        await page.keyboard.press(']')
        await page.keyboard.press('m')
        await page.wait_for_timeout(500)
        
        # Check if status updated
        status_after_next = await page.locator('#status').text_content()
        print(f"Status after ]m: {status_after_next}")
        
        # Press [m to go to previous milestone
        print("\nPressing [m...")
        await page.keyboard.press('[')
        await page.keyboard.press('m')
        await page.wait_for_timeout(500)
        
        # Check if status updated again
        status_after_prev = await page.locator('#status').text_content()
        print(f"Status after [m: {status_after_prev}")
        
        # Check raw data file
        print("\n=== Checking data source ===")
        data_check = await page.evaluate('''() => {
            return fetch('data/sample-gantt.json')
                .then(response => response.json())
                .then(data => {
                    const milestones = data.tasks.filter(t => t.type === 'milestone');
                    return {
                        totalTasks: data.tasks.length,
                        milestones: milestones
                    };
                })
                .catch(err => ({ error: err.message }));
        }''')
        
        print(f"Data source check: {data_check}")
        
        await page.wait_for_timeout(2000)  # Keep browser open for observation
        await browser.close()
        
        # Assertions
        if milestone_count == 3:
            print("\n✅ Test passed: Found 3 milestones")
        else:
            print(f"\n❌ Test failed: Expected 3 milestones, found {milestone_count}")
            return False
        
        return True

if __name__ == '__main__':
    success = asyncio.run(test_milestones())
    exit(0 if success else 1)