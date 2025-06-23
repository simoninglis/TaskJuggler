"""Test that waits for fetch to complete"""
import pytest
from playwright.sync_api import Page, expect
import time

def test_fetch_completes_and_loads_data(page: Page):
    """Test that the fetch completes and data loads"""
    # Capture console messages
    console_messages = []
    page.on("console", lambda msg: console_messages.append({
        'type': msg.type,
        'text': msg.text
    }))
    
    page.goto("http://localhost:8001")
    
    # Wait for gantt to be ready
    page.wait_for_selector("#gantt_here", state="visible")
    page.wait_for_function("() => typeof gantt !== 'undefined' && typeof window.loadTaskJugglerData === 'function'")
    
    # Manually trigger the data load and wait for it
    print("\n=== Triggering data load ===")
    
    # Execute the load and wait for the response
    result = page.evaluate("""
        async () => {
            console.log('Starting async data load test...');
            
            // Create a promise that resolves when data is loaded
            return new Promise(async (resolve) => {
                try {
                    // Override gantt.parse to capture when it's called
                    const originalParse = gantt.parse;
                    let parseCallCount = 0;
                    let parsedData = null;
                    
                    gantt.parse = function(data) {
                        parseCallCount++;
                        parsedData = data;
                        console.log('gantt.parse called with data:', data);
                        // Call the original parse
                        originalParse.call(this, data);
                        
                        // Resolve with the results
                        setTimeout(() => {
                            const tasks = gantt.getTaskByTime();
                            resolve({
                                success: true,
                                parseCallCount: parseCallCount,
                                taskCount: tasks.length,
                                parsedDataLength: parsedData ? parsedData.data.length : 0,
                                firstTask: tasks.length > 0 ? tasks[0].text : null
                            });
                        }, 100);
                    };
                    
                    // Call loadTaskJugglerData
                    window.loadTaskJugglerData();
                    
                    // Also set a timeout in case parse is never called
                    setTimeout(() => {
                        resolve({
                            success: false,
                            parseCallCount: parseCallCount,
                            error: 'Timeout - gantt.parse was never called'
                        });
                    }, 5000);
                    
                } catch (error) {
                    resolve({
                        success: false,
                        error: error.message
                    });
                }
            });
        }
    """)
    
    print(f"\n=== Result ===")
    print(f"Success: {result.get('success', False)}")
    print(f"Parse call count: {result.get('parseCallCount', 0)}")
    print(f"Task count: {result.get('taskCount', 0)}")
    print(f"Parsed data length: {result.get('parsedDataLength', 0)}")
    print(f"First task: {result.get('firstTask', 'None')}")
    if 'error' in result:
        print(f"Error: {result['error']}")
    
    # Print recent console messages
    print("\n=== Console messages ===")
    for msg in console_messages[-20:]:
        if any(keyword in msg['text'] for keyword in ['loadTaskJugglerData', 'Fetching', 'Response', 'Raw data', 'Error', 'Tasks count', 'Converted', 'Parsing']):
            print(f"{msg['type']}: {msg['text']}")
    
    # Check project title as additional verification
    time.sleep(1)
    project_title = page.locator("#projectTitle").text_content()
    print(f"\nProject title: {project_title}")
    
    assert result.get('success', False), f"Data loading failed: {result.get('error', 'Unknown error')}"
    assert result.get('taskCount', 0) > 0, "No tasks were loaded"