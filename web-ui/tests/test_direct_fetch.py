"""Test direct fetch of JSON file"""
import pytest
from playwright.sync_api import Page, expect
import time

def test_direct_json_fetch(page: Page):
    """Test fetching the JSON file directly"""
    page.goto("http://localhost:8001")
    
    # Try different URLs to find the correct one
    urls_to_try = [
        '/data/sample-gantt.json',
        'data/sample-gantt.json',
        './data/sample-gantt.json',
        '/src/data/sample-gantt.json',
        'http://localhost:8001/data/sample-gantt.json'
    ]
    
    for url in urls_to_try:
        print(f"\n=== Trying URL: {url} ===")
        
        result = page.evaluate(f"""
            async () => {{
                try {{
                    const response = await fetch('{url}');
                    const text = await response.text();
                    const isJson = text.trim().startsWith('{{');
                    const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
                    
                    return {{
                        url: '{url}',
                        status: response.status,
                        ok: response.ok,
                        contentType: response.headers.get('content-type'),
                        isJson: isJson,
                        isHtml: isHtml,
                        preview: text.substring(0, 100),
                        error: null
                    }};
                }} catch (error) {{
                    return {{
                        url: '{url}',
                        error: error.message
                    }};
                }}
            }}
        """)
        
        print(f"Status: {result.get('status', 'N/A')}")
        print(f"OK: {result.get('ok', False)}")
        print(f"Content-Type: {result.get('contentType', 'N/A')}")
        print(f"Is JSON: {result.get('isJson', False)}")
        print(f"Is HTML: {result.get('isHtml', False)}")
        if result.get('error'):
            print(f"Error: {result['error']}")
        else:
            print(f"Preview: {result.get('preview', '')[:50]}...")
        
        if result.get('isJson'):
            print(f"\n✅ Found working URL: {url}")
            
            # Try to load the data using this URL
            print("\n=== Testing data load with working URL ===")
            
            # Update the loadTaskJugglerData to use this URL
            load_result = page.evaluate(f"""
                async () => {{
                    // Temporarily override the URL
                    const originalFetch = window.fetch;
                    window.fetch = function(url, ...args) {{
                        if (url.includes('sample-gantt.json')) {{
                            console.log('Intercepting fetch, using: {url}');
                            return originalFetch.call(this, '{url}', ...args);
                        }}
                        return originalFetch.call(this, url, ...args);
                    }};
                    
                    // Load the data
                    window.loadTaskJugglerData();
                    
                    // Wait for data to load
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Check results
                    const tasks = gantt.getTaskByTime();
                    return {{
                        taskCount: tasks.length,
                        firstTask: tasks.length > 0 ? tasks[0].text : null
                    }};
                }}
            """)
            
            print(f"Task count after load: {load_result['taskCount']}")
            print(f"First task: {load_result.get('firstTask', 'None')}")
            
            return  # Found working URL, stop testing