#!/usr/bin/env python3
"""
WebSocket debug server for TaskJuggler Web UI
Handles debug logging and real-time communication with browsers
"""

import asyncio
import websockets
import json
import uuid
from datetime import datetime

# Store debug messages
debug_messages = []

# Store client connections
connected_clients = {}
# Store WebSocket connections for push messages
client_websockets = {}

async def broadcast_message(msg_type, message, data=None):
    """Broadcast a message to all connected clients"""
    if client_websockets:
        payload = {
            'type': msg_type,
            'message': message,
            'data': data or {},
            'timestamp': datetime.now().isoformat()
        }
        
        # Send to all connected clients
        disconnected = []
        for client_id, ws in client_websockets.items():
            try:
                await ws.send(json.dumps(payload))
            except:
                disconnected.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected:
            if client_id in client_websockets:
                del client_websockets[client_id]
            if client_id in connected_clients:
                del connected_clients[client_id]

async def debug_handler(websocket, path):
    """Handle WebSocket connections for debug logging"""
    # Generate unique client ID
    client_id = str(uuid.uuid4())[:8]  # Short ID for readability
    client_info = {
        'id': client_id,
        'address': websocket.remote_address,
        'user_agent': None,
        'connection_time': datetime.now()
    }
    connected_clients[client_id] = client_info
    client_websockets[client_id] = websocket
    
    print(f"Debug client {client_id} connected from {websocket.remote_address}")
    
    # Open debug log file for writing
    debug_log_file = open('/tmp/webui-debug.log', 'a')
    debug_log_file.write(f"[{datetime.now().strftime('%H:%M:%S')}] [CLIENT:{client_id}] Connected from {websocket.remote_address}\n")
    
    try:
        # Send client ID to the browser
        await websocket.send(json.dumps({
            'type': 'client_id',
            'data': client_id
        }))
        
        async for message in websocket:
            try:
                data = json.loads(message)
                
                # Store user agent if provided
                if data.get('type') == 'connect' and data.get('data', {}).get('userAgent'):
                    client_info['user_agent'] = data['data']['userAgent']
                
                timestamp = data.get('timestamp', datetime.now().isoformat())
                if isinstance(timestamp, str):
                    timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                
                # Print to console with color coding
                type_color = {
                    'debug': '\033[36m',  # Cyan
                    'info': '\033[32m',   # Green
                    'warn': '\033[33m',   # Yellow
                    'error': '\033[31m',  # Red
                    'event': '\033[35m'   # Magenta
                }.get(data.get('type', 'info'), '\033[0m')
                
                console_msg = f"{type_color}[{timestamp.strftime('%H:%M:%S.%f')[:-3]}] [CLIENT:{client_id}] [{data.get('type', 'INFO').upper()}] {data.get('message', '')}\033[0m"
                print(console_msg)
                if data.get('data'):
                    print(f"  Data: {json.dumps(data['data'], indent=2)}")
                
                # Write to debug log file (without color codes)
                log_msg = f"[{timestamp.strftime('%H:%M:%S.%f')[:-3]}] [CLIENT:{client_id}] [{data.get('type', 'INFO').upper()}] {data.get('message', '')}\n"
                debug_log_file.write(log_msg)
                if data.get('data'):
                    debug_log_file.write(f"  Data: {json.dumps(data['data'], indent=2)}\n")
                debug_log_file.flush()  # Ensure it's written immediately
                
                # Store message with client ID
                data['client_id'] = client_id
                debug_messages.append(data)
                if len(debug_messages) > 1000:  # Keep last 1000 messages
                    debug_messages.pop(0)
                    
            except json.JSONDecodeError as e:
                print(f"Failed to parse message from client {client_id}: {e}")
            except Exception as e:
                print(f"Error handling message from client {client_id}: {e}")
                
    except websockets.exceptions.ConnectionClosed:
        print(f"Debug client {client_id} disconnected")
        debug_log_file.write(f"[{datetime.now().strftime('%H:%M:%S')}] [CLIENT:{client_id}] Disconnected\n")
    except Exception as e:
        print(f"Debug handler error for client {client_id}: {e}")
        debug_log_file.write(f"[{datetime.now().strftime('%H:%M:%S')}] [CLIENT:{client_id}] Error: {e}\n")
    finally:
        # Remove client from connected lists
        if client_id in connected_clients:
            del connected_clients[client_id]
        if client_id in client_websockets:
            del client_websockets[client_id]
        debug_log_file.close()

async def start_websocket_server():
    """Start the WebSocket debug server"""
    WS_PORT = 8002
    print(f"Starting debug WebSocket server on ws://localhost:{WS_PORT}")
    print(f"Debug messages will be logged to /tmp/webui-debug.log")
    
    # Create/clear debug log file
    with open('/tmp/webui-debug.log', 'w') as f:
        f.write(f"=== Debug WebSocket Server Started at {datetime.now()} ===\n")
    
    await websockets.serve(debug_handler, 'localhost', WS_PORT)
    
    # Keep the server running
    await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(start_websocket_server())