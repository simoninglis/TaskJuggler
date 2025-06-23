"""Test app initialization flow"""
import pytest
from playwright.sync_api import Page, expect
import time

def test_app_initialization_flow(page: Page):
    """Test the complete app initialization flow"""
    console_messages = []
    
    # Capture all console messages
    page.on("console", lambda msg: console_messages.append({
        'type': msg.type,
        'text': msg.text,
        'time': time.time()
    }))
    
    page.goto("http://localhost:8001")
    
    # Wait longer for initialization
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(4)  # Give plenty of time for async loading
    
    # Print all console messages in order
    print("\n=== Console Log Timeline ===")
    start_time = console_messages[0]['time'] if console_messages else time.time()
    
    for msg in console_messages:
        elapsed = msg['time'] - start_time
        print(f"[{elapsed:.3f}s] {msg['type']}: {msg['text']}")
    
    # Look for key initialization steps
    print("\n=== Initialization Steps ===")
    init_steps = {
        'Vite connected': any('[vite] connected' in msg['text'] for msg in console_messages),
        'Components loaded': any('Web Component' in msg['text'] for msg in console_messages),
        'DHTMLX ready': any('DHTMLX Gantt' in msg['text'] for msg in console_messages),
        'Modules loaded': any('All modules loaded' in msg['text'] for msg in console_messages),
        'App initialized': any('Initializing' in msg['text'] and 'UI' in msg['text'] for msg in console_messages),
        'Data loading': any('Loading TaskJuggler data' in msg['text'] for msg in console_messages),
        'Data converting': any('Converting' in msg['text'] for msg in console_messages),
        'Data loaded': any('Loaded' in msg['text'] and 'tasks' in msg['text'] for msg in console_messages),
    }
    
    for step, found in init_steps.items():
        print(f"{step}: {'✅' if found else '❌'}")
    
    # Check functions availability
    print("\n=== Function Availability ===")
    functions = page.evaluate("""
        () => ({
            gantt: typeof gantt !== 'undefined',
            initializeApp: typeof initializeApp === 'function',
            initializeGanttConfig: typeof initializeGanttConfig === 'function',
            loadTaskJugglerData: typeof loadTaskJugglerData === 'function',
            updateStatus: typeof updateStatus === 'function'
        })
    """)
    
    for func, available in functions.items():
        print(f"{func}: {'✅' if available else '❌'}")
    
    # Get current status
    status = page.locator("#status").text_content()
    print(f"\nFinal status: {status}")
    
    # Get task count
    task_count = page.evaluate("""
        () => {
            if (typeof gantt === 'undefined') return -1;
            const tasks = gantt.getTaskByTime();
            return tasks.length;
        }
    """)
    print(f"Task count: {task_count}")
    
    # Try to debug why initializeApp might not be called
    print("\n=== Checking app.js module ===")
    app_info = page.evaluate("""
        () => {
            // Check if the module was loaded
            const scripts = Array.from(document.querySelectorAll('script'));
            const appScript = scripts.find(s => s.src && s.src.includes('app.js'));
            return {
                hasAppScript: !!appScript,
                appScriptSrc: appScript ? appScript.src : null
            };
        }
    """)
    print(f"App script info: {app_info}")