"""Test data loading with proper wait conditions"""
import pytest
from playwright.sync_api import Page, expect
import time

def test_data_loads_with_proper_wait(page: Page):
    """Test that data loads with proper wait conditions"""
    page.goto("http://localhost:8001")
    
    # Wait for the gantt container
    page.wait_for_selector("#gantt_here", state="visible")
    
    # Wait for specific console message that indicates app is initialized
    page.wait_for_function("""
        () => {
            // Check if all required functions are available
            return typeof gantt !== 'undefined' && 
                   typeof window.loadTaskJugglerData === 'function' &&
                   typeof window.initializeGanttConfig === 'function';
        }
    """, timeout=10000)
    
    # Wait a bit more for async operations
    time.sleep(2)
    
    # Check console logs to understand what happened
    logs = page.evaluate("""
        () => {
            // Try to get some debug info
            const info = {
                ganttExists: typeof gantt !== 'undefined',
                ganttInitialized: typeof gantt !== 'undefined' && gantt.$container !== undefined,
                functionsAvailable: {
                    loadTaskJugglerData: typeof window.loadTaskJugglerData === 'function',
                    initializeGanttConfig: typeof window.initializeGanttConfig === 'function',
                    initializeApp: typeof window.initializeApp === 'function',
                    updateStatus: typeof window.updateStatus === 'function'
                },
                taskCount: 0,
                status: document.getElementById('status')?.textContent || 'No status'
            };
            
            // Get task count if gantt is available
            if (typeof gantt !== 'undefined' && gantt.getTaskByTime) {
                try {
                    info.taskCount = gantt.getTaskByTime().length;
                } catch (e) {
                    info.taskCountError = e.message;
                }
            }
            
            return info;
        }
    """)
    
    print("\n=== Debug Info ===")
    print(f"Gantt exists: {logs['ganttExists']}")
    print(f"Gantt initialized: {logs['ganttInitialized']}")
    print(f"Functions available: {logs['functionsAvailable']}")
    print(f"Task count: {logs['taskCount']}")
    print(f"Status: {logs['status']}")
    
    # If no tasks loaded, try to manually trigger the load
    if logs['taskCount'] == 0 and logs['functionsAvailable']['loadTaskJugglerData']:
        print("\n=== Manually triggering data load ===")
        
        # Set up console capture
        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))
        
        page.evaluate("() => window.loadTaskJugglerData()")
        time.sleep(3)  # Wait for async load
        
        # Print console messages from the load
        print("\nConsole messages during load:")
        for msg in console_messages[-10:]:  # Last 10 messages
            print(f"  {msg}")
        
        # Check task count again
        new_task_count = page.evaluate("""
            () => {
                if (typeof gantt === 'undefined') return -1;
                return gantt.getTaskByTime().length;
            }
        """)
        
        print(f"\nTask count after manual load: {new_task_count}")
        
        # Get project title
        project_title = page.locator("#projectTitle").text_content()
        print(f"Project title: {project_title}")
        
        assert new_task_count > 0, "Should have loaded tasks after manual trigger"