"""Test to check console errors and logs"""
import pytest
from playwright.sync_api import Page, expect
import time

def test_check_console_logs(page: Page):
    """Check console logs for errors and debug info"""
    console_messages = []
    
    # Capture console messages
    page.on("console", lambda msg: console_messages.append({
        'type': msg.type,
        'text': msg.text,
        'location': msg.location
    }))
    
    # Also capture page errors
    page_errors = []
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    
    page.goto("http://localhost:8001")
    
    # Wait for page to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(3)  # Give it more time to load data
    
    # Print all console messages
    print("\n=== Console Messages ===")
    for msg in console_messages:
        print(f"{msg['type']}: {msg['text']}")
        if msg['location'].get('url'):
            print(f"  at {msg['location']['url']}:{msg['location'].get('lineNumber', '?')}")
    
    # Print any page errors
    if page_errors:
        print("\n=== Page Errors ===")
        for error in page_errors:
            print(error)
    
    # Check for specific expected logs
    log_texts = [msg['text'] for msg in console_messages]
    
    # Look for initialization messages
    has_init = any('Initializing' in text for text in log_texts)
    has_dhtmlx = any('DHTMLX' in text for text in log_texts)
    has_data_load = any('Loading TaskJuggler data' in text or 'loadTaskJugglerData' in text for text in log_texts)
    
    print(f"\nHas initialization message: {has_init}")
    print(f"Has DHTMLX message: {has_dhtmlx}")
    print(f"Has data loading message: {has_data_load}")
    
    # Check for errors
    error_messages = [msg for msg in console_messages if msg['type'] in ['error', 'warning']]
    if error_messages:
        print("\n=== Errors/Warnings ===")
        for msg in error_messages:
            print(f"{msg['type']}: {msg['text']}")
    
    # Check if loadTaskJugglerData function exists
    has_function = page.evaluate("() => typeof window.loadTaskJugglerData === 'function'")
    print(f"\nloadTaskJugglerData function exists: {has_function}")
    
    # Try to manually call the function
    if has_function:
        print("\nManually calling loadTaskJugglerData...")
        page.evaluate("() => window.loadTaskJugglerData()")
        time.sleep(2)
        
        # Check task count after manual call
        task_count = page.evaluate("""
            () => {
                if (typeof gantt === 'undefined') return -1;
                const tasks = gantt.getTaskByTime();
                return tasks.length;
            }
        """)
        print(f"Task count after manual load: {task_count}")
    
    # No assertions - this is just for debugging