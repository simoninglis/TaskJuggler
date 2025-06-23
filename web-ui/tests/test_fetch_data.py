"""Test the fetch request for data"""
import pytest
from playwright.sync_api import Page, expect
import time

def test_fetch_data_url(page: Page):
    """Test if the data fetch URL is correct"""
    console_messages = []
    network_requests = []
    
    # Capture console messages
    page.on("console", lambda msg: console_messages.append({
        'type': msg.type,
        'text': msg.text
    }))
    
    # Capture network requests
    page.on("request", lambda request: network_requests.append({
        'url': request.url,
        'method': request.method,
        'resource_type': request.resource_type
    }))
    
    # Capture network responses
    network_responses = []
    page.on("response", lambda response: network_responses.append({
        'url': response.url,
        'status': response.status,
        'ok': response.ok
    }))
    
    page.goto("http://localhost:8001")
    
    # Wait for page to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)
    
    # Manually trigger data loading
    page.evaluate("() => window.loadTaskJugglerData()")
    time.sleep(2)
    
    # Print all network requests
    print("\n=== Network Requests ===")
    json_requests = [req for req in network_requests if 'json' in req['url']]
    for req in json_requests:
        print(f"{req['method']} {req['url']}")
    
    # Print responses for JSON files
    print("\n=== JSON Responses ===")
    json_responses = [resp for resp in network_responses if 'json' in resp['url']]
    for resp in json_responses:
        print(f"{resp['status']} {resp['url']} (ok: {resp['ok']})")
    
    # Check console for errors
    print("\n=== Console Messages (after data load) ===")
    for msg in console_messages:
        if any(keyword in msg['text'] for keyword in ['Loading', 'Error', 'error', 'Converting', 'Loaded']):
            print(f"{msg['type']}: {msg['text']}")
    
    # Check if we tried to fetch the correct URL
    expected_url = "http://localhost:8001/src/data/sample-gantt.json"
    json_urls = [req['url'] for req in json_requests]
    print(f"\nExpected URL: {expected_url}")
    print(f"Actual JSON requests: {json_urls}")
    
    # Test if the file is accessible directly
    print("\n=== Direct Fetch Test ===")
    fetch_result = page.evaluate("""
        async () => {
            try {
                const response = await fetch('src/data/sample-gantt.json');
                return {
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url
                };
            } catch (error) {
                return {
                    error: error.message
                };
            }
        }
    """)
    print(f"Direct fetch result: {fetch_result}")