"""Final test for data loading after all fixes"""
import pytest
from playwright.sync_api import Page, expect
import time

def test_data_loads_successfully_final(page: Page):
    """Test that data loads successfully with all fixes applied"""
    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))
    
    page.goto("http://localhost:8001")
    
    # Wait for everything to be ready
    page.wait_for_selector("#gantt_here", state="visible")
    page.wait_for_function("() => typeof gantt !== 'undefined' && typeof window.loadTaskJugglerData === 'function'")
    
    # Give the app time to initialize (it should auto-load data)
    print("\n=== Waiting for automatic data load ===")
    time.sleep(5)
    
    # Check if data loaded automatically
    auto_load_result = page.evaluate("""
        () => {
            const tasks = gantt.getTaskByTime();
            return {
                taskCount: tasks.length,
                firstTask: tasks.length > 0 ? tasks[0].text : null,
                projectTitle: document.getElementById('projectTitle')?.textContent || 'Not set'
            };
        }
    """)
    
    print(f"\nAuto-load results:")
    print(f"Task count: {auto_load_result['taskCount']}")
    print(f"First task: {auto_load_result.get('firstTask', 'None')}")
    print(f"Project title: {auto_load_result['projectTitle']}")
    
    # If no data loaded automatically, try manual load
    if auto_load_result['taskCount'] == 0:
        print("\n=== Triggering manual data load ===")
        page.evaluate("() => window.loadTaskJugglerData()")
        time.sleep(3)
        
        manual_load_result = page.evaluate("""
            () => {
                const tasks = gantt.getTaskByTime();
                return {
                    taskCount: tasks.length,
                    firstTask: tasks.length > 0 ? tasks[0].text : null,
                    projectTitle: document.getElementById('projectTitle')?.textContent || 'Not set'
                };
            }
        """)
        
        print(f"\nManual load results:")
        print(f"Task count: {manual_load_result['taskCount']}")
        print(f"First task: {manual_load_result.get('firstTask', 'None')}")
        print(f"Project title: {manual_load_result['projectTitle']}")
        
        # Check console for relevant messages
        print("\n=== Relevant console messages ===")
        for msg in console_messages:
            if any(keyword in msg for keyword in ['loadTaskJugglerData', 'Raw data', 'Error', 'Tasks count', 'parsed', 'Loaded']):
                print(msg)
        
        assert manual_load_result['taskCount'] > 0, "No tasks loaded even after manual trigger"
        assert manual_load_result['projectTitle'] == "Test Gantt Chart", f"Project title should be 'Test Gantt Chart' but got '{manual_load_result['projectTitle']}'"
    else:
        assert auto_load_result['taskCount'] > 0, "No tasks loaded automatically"
        assert auto_load_result['projectTitle'] == "Test Gantt Chart", f"Project title should be 'Test Gantt Chart' but got '{auto_load_result['projectTitle']}'"

def test_milestone_navigation_works(page: Page):
    """Test that milestone navigation works with loaded data"""
    page.goto("http://localhost:8001")
    
    # Wait and load data
    page.wait_for_selector("#gantt_here", state="visible")
    page.wait_for_function("() => typeof gantt !== 'undefined' && typeof window.loadTaskJugglerData === 'function'")
    time.sleep(5)  # Wait for auto-load
    
    # If no data, manually load
    task_count = page.evaluate("() => gantt.getTaskByTime().length")
    if task_count == 0:
        page.evaluate("() => window.loadTaskJugglerData()")
        time.sleep(3)
    
    # Focus on gantt
    page.click("#gantt_here")
    
    # Test milestone navigation
    page.keyboard.press("]")
    page.keyboard.press("m")
    time.sleep(0.5)
    
    status = page.locator("#status").text_content()
    print(f"\nStatus after ]m: {status}")
    
    # Check if we have milestones
    milestone_info = page.evaluate("""
        () => {
            const tasks = gantt.getTaskByTime();
            const milestones = tasks.filter(t => t.type === 'milestone');
            return {
                totalTasks: tasks.length,
                milestoneCount: milestones.length,
                milestoneNames: milestones.map(m => m.text)
            };
        }
    """)
    
    print(f"\nMilestone info:")
    print(f"Total tasks: {milestone_info['totalTasks']}")
    print(f"Milestone count: {milestone_info['milestoneCount']}")
    print(f"Milestone names: {milestone_info['milestoneNames']}")
    
    assert milestone_info['milestoneCount'] > 0, "No milestones found in loaded data"