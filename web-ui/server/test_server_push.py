#!/usr/bin/env python3
"""
Example script to test server push functionality
This shows how to send messages from the server to connected browsers
"""

import asyncio
import websockets
import json
from datetime import datetime

async def send_test_messages():
    """Send test messages to the debug WebSocket server"""
    
    # Connect to the WebSocket server as if we were a control client
    uri = "ws://localhost:8002"
    
    print("This script demonstrates server-to-browser push messages.")
    print("Make sure the debug server is running and a browser is connected.")
    print()
    
    # Example messages to send
    messages = [
        {
            'type': 'info',
            'message': 'Testing server push - Info message',
            'data': {'test': True, 'timestamp': datetime.now().isoformat()}
        },
        {
            'type': 'update_status',
            'message': 'Server push test: Status updated from server!',
            'data': None
        },
        {
            'type': 'milestone_update',
            'message': 'Milestone data has been updated',
            'data': {
                'milestones': [
                    {'id': 'milestone1', 'text': 'Server Push Test Milestone', 'date': '2025-02-01'}
                ]
            }
        },
        {
            'type': 'task_update',
            'message': 'Task data refreshed from TaskJuggler',
            'data': {'source': 'test_server_push.py', 'action': 'refresh'}
        }
    ]
    
    print("To use this in production, you would:")
    print("1. Watch .tjp files for changes")
    print("2. Parse the updated TaskJuggler data")
    print("3. Push updates to all connected browsers")
    print("4. Browser would refresh its Gantt chart automatically")
    print()
    print("Example push messages that would be sent:")
    
    for msg in messages:
        print(f"\n{msg['type']}: {msg['message']}")
        if msg['data']:
            print(f"  Data: {json.dumps(msg['data'], indent=2)}")

    print("\nNote: In the actual implementation, you would import the")
    print("broadcast_message() function from serve-with-debug.py and")
    print("call it directly to push messages to browsers.")

if __name__ == "__main__":
    # This is just a demonstration
    # In real use, you would:
    # from serve_with_debug import broadcast_message
    # asyncio.run(broadcast_message('info', 'Hello from external script!'))
    
    asyncio.run(send_test_messages())