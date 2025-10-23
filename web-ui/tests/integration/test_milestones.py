import pytest
from playwright.sync_api import Page, expect
import time

def test_milestones_visible(page: Page):
    """Test that milestones are visible in the Gantt chart"""
    page.goto("http://localhost:8001")
    
    # Wait for Gantt chart to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)  # Give time for data to load
    
    # Check if milestone elements exist
    milestone_elements = page.locator(".gantt_task_line.gantt_milestone").count()
    print(f"Found {milestone_elements} milestone elements")
    
    # Debug: Check what task types are present
    task_info = page.evaluate("""
        () => {
            if (typeof gantt === 'undefined') return null;
            
            const tasks = gantt.getTaskByTime();
            return tasks.map(task => ({
                id: task.id,
                text: task.text,
                type: task.type,
                duration: task.duration
            }));
        }
    """)
    
    print("\nAll tasks in gantt:")
    if task_info:
        for task in task_info:
            print(f"- {task['id']}: {task['text']} (type: {task.get('type', 'undefined')}, duration: {task.get('duration', 'N/A')})")
    
    # Check milestone type configuration
    type_config = page.evaluate("""
        () => {
            if (typeof gantt === 'undefined') return null;
            
            return {
                types: gantt.config.types,
                hasMilestoneType: gantt.config.types.hasOwnProperty('milestone'),
                milestoneValue: gantt.config.types.milestone
            };
        }
    """)
    
    print(f"\nType configuration: {type_config}")
    
    # Count milestones in data
    milestone_count = page.evaluate("""
        () => {
            if (typeof gantt === 'undefined') return -1;
            
            const tasks = gantt.getTaskByTime();
            const milestones = tasks.filter(task => task.type === gantt.config.types.milestone);
            
            console.log('Milestone tasks:', milestones);
            
            return milestones.length;
        }
    """)
    
    print(f"\nMilestone count: {milestone_count}")
    
    # We should have 3 milestones
    assert milestone_count == 3, f"Expected 3 milestones, found {milestone_count}"

def test_milestone_navigation(page: Page):
    """Test milestone navigation with ]m and [m shortcuts"""
    page.goto("http://localhost:8001")
    
    # Wait for Gantt chart to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)
    
    # Focus on the Gantt chart
    page.click("#gantt_here")
    
    # Get initial status
    initial_status = page.locator("#status").text_content()
    print(f"Initial status: {initial_status}")
    
    # Press ]m to go to next milestone
    page.keyboard.press("]")
    page.keyboard.press("m")
    time.sleep(0.5)
    
    # Check if status updated
    status_after_next = page.locator("#status").text_content()
    print(f"Status after ]m: {status_after_next}")
    assert "milestone" in status_after_next.lower(), "Status should mention milestone after ]m"
    
    # Press [m to go to previous milestone
    page.keyboard.press("[")
    page.keyboard.press("m")
    time.sleep(0.5)
    
    # Check if status updated again
    status_after_prev = page.locator("#status").text_content()
    print(f"Status after [m: {status_after_prev}")
    assert "milestone" in status_after_prev.lower(), "Status should mention milestone after [m"

def test_milestone_labels(page: Page):
    """Test that milestone labels are displayed"""
    page.goto("http://localhost:8001")
    
    # Wait for Gantt chart to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)
    
    # Check for rightside text elements (where milestone labels should appear)
    rightside_texts = page.locator(".gantt_task_row .gantt_side_content.gantt_right").all_text_contents()
    print(f"\nRightside texts found: {rightside_texts}")
    
    # Check if our milestone names appear
    all_text = " ".join(rightside_texts)
    assert "Design Phase Complete" in all_text or "Beta Release" in all_text or "Go-Live" in all_text, \
        "At least one milestone label should be visible"

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])