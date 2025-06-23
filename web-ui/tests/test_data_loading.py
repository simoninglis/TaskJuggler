"""Test that Gantt data loads correctly"""
import pytest
from playwright.sync_api import Page, expect
import time

def test_data_loads_successfully(page: Page):
    """Test that sample-gantt.json data loads into the Gantt chart"""
    page.goto("http://localhost:8001")
    
    # Wait for Gantt chart to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)
    
    # Check if status shows data loaded
    status = page.locator("#status").text_content()
    print(f"Status: {status}")
    
    # Check if tasks are loaded using JavaScript
    task_count = page.evaluate("""
        () => {
            if (typeof gantt === 'undefined') return -1;
            const tasks = gantt.getTaskByTime();
            return tasks.length;
        }
    """)
    
    print(f"Task count: {task_count}")
    
    # Check for specific tasks from our data
    task_info = page.evaluate("""
        () => {
            if (typeof gantt === 'undefined') return null;
            const tasks = gantt.getTaskByTime();
            return tasks.map(task => ({
                id: task.id,
                text: task.text,
                type: task.type
            }));
        }
    """)
    
    print(f"Tasks found: {task_info}")
    
    # Verify we have tasks
    assert task_count > 0, "Should have loaded tasks from sample-gantt.json"
    
    # Check for specific expected tasks
    task_names = [task['text'] for task in task_info] if task_info else []
    assert "Web Application" in task_names, "Should have 'Web Application' task"
    assert "Design Phase" in task_names, "Should have 'Design Phase' task"
    
    # Check for milestones
    milestones = [task for task in task_info if task['type'] == 'milestone'] if task_info else []
    print(f"Milestones: {milestones}")
    assert len(milestones) > 0, "Should have at least one milestone"

def test_project_title_loads(page: Page):
    """Test that project title is loaded from data"""
    page.goto("http://localhost:8001")
    
    # Wait for page to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)
    
    # Check project title
    project_title = page.locator("#projectTitle").text_content()
    print(f"Project title: {project_title}")
    
    # Should be "Test Gantt Chart" from our sample data
    assert project_title == "Test Gantt Chart", f"Expected 'Test Gantt Chart' but got '{project_title}'"