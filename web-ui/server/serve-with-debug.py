#!/usr/bin/env python3
"""
HTTP server with WebSocket debug logging for development
Includes auto-reload functionality and debug message logging
"""

import asyncio
import websockets
import http.server
import socketserver
import threading
import os
import json
import time
import uuid
from pathlib import Path
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

PORT = 8001
WS_PORT = 8002
WATCH_EXTENSIONS = ['.html', '.js', '.css', '.json']

# Store debug messages
debug_messages = []

# Store client connections
connected_clients = {}
# Store WebSocket connections for push messages
client_websockets = {}

# File watcher for auto-reload
class FileChangeHandler(FileSystemEventHandler):
    def __init__(self):
        self.last_change_time = 0
        self.debounce_time = 0.5  # 500ms debounce
        
    def on_modified(self, event):
        if event.is_directory:
            return
            
        # Check if it's a file we care about
        file_path = Path(event.src_path)
        if file_path.suffix in WATCH_EXTENSIONS:
            current_time = time.time()
            
            # Debounce rapid file changes
            if current_time - self.last_change_time > self.debounce_time:
                self.last_change_time = current_time
                
                # Send reload message to all connected browsers
                asyncio.create_task(self.notify_browsers(file_path))
    
    async def notify_browsers(self, changed_file):
        """Notify browsers about file changes"""
        if client_websockets:
            await broadcast_message(
                'file_changed',
                f'File changed: {changed_file.name}',
                {'file': str(changed_file), 'action': 'reload'}
            )
            print(f"[FILE WATCHER] Notified browsers about {changed_file.name}")

# Global file watcher
file_watcher = None

class AutoReloadHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        
        # For HTML files, inject auto-reload and debug scripts
        if self.path.endswith('.html') or self.path == '/':
            path = self.path
            if path == '/':
                path = '/index.html'
            
            try:
                with open('.' + path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Inject auto-reload and debug script before </body>
                debug_script = """
<script>
// Debug WebSocket connection
(function() {
    let ws = null;
    let reconnectInterval = null;
    let clientId = null;
    
    function connectDebugWS() {
        ws = new WebSocket('ws://localhost:8002');
        
        ws.onopen = function() {
            console.log('Debug WebSocket connected');
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
            }
            
            // Send initial connection info
            const initMessage = {
                timestamp: new Date().toISOString(),
                type: 'init',
                message: 'Browser client initialized',
                user_agent: navigator.userAgent,
                url: window.location.href
            };
            ws.send(JSON.stringify(initMessage));
        };
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.type === 'client_id') {
                clientId = data.client_id;
                console.log(`Debug client ID: ${clientId}`);
                window.debugClientId = clientId;
            } else if (data.type === 'server_push') {
                // Handle server push messages
                console.log('[SERVER PUSH]', data.message_type + ':', data.message);
                if (data.data) {
                    console.log('  Data:', data.data);
                }
                
                // Dispatch custom event for the app to handle
                window.dispatchEvent(new CustomEvent('server-push', {
                    detail: {
                        type: data.message_type,
                        message: data.message,
                        data: data.data,
                        timestamp: data.timestamp
                    }
                }));
                
                // Special handling for certain message types
                if (data.message_type === 'reload') {
                    window.location.reload();
                } else if (data.message_type === 'file_changed') {
                    console.log('File changed, reloading...');
                    setTimeout(() => window.location.reload(), 100);
                } else if (data.message_type === 'alert') {
                    alert(data.message);
                } else if (data.message_type === 'update_status') {
                    if (typeof updateStatus === 'function') {
                        updateStatus(data.message);
                    }
                }
            }
        };
        
        ws.onclose = function() {
            console.log('Debug WebSocket disconnected');
            clientId = null;
            // Try to reconnect every 2 seconds
            if (!reconnectInterval) {
                reconnectInterval = setInterval(connectDebugWS, 2000);
            }
        };
        
        ws.onerror = function(error) {
            console.error('Debug WebSocket error:', error);
        };
    }
    
    // Global debug function
    window.debugLog = function(type, message, data) {
        const logMessage = {
            timestamp: new Date().toISOString(),
            type: type,
            message: message,
            data: data,
            url: window.location.href,
            client_id: clientId
        };
        
        // Log to console with client ID
        if (clientId) {
            console.log(`[${clientId}] [${type}]`, message, data || '');
        } else {
            console.log(`[${type}]`, message, data || '');
        }
        
        // Send to WebSocket if connected
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(logMessage));
        }
    };
    
    // Connect to debug WebSocket
    connectDebugWS();
    
    console.log('Auto-reload via WebSocket and debug logging enabled');
})();
</script>
</body>"""
                
                content = content.replace('</body>', debug_script)
                
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.send_header('Content-Length', str(len(content.encode('utf-8'))))
                self.end_headers()
                self.wfile.write(content.encode('utf-8'))
                return
                
            except Exception as e:
                print(f"Error reading file: {e}")
                
        # Default handling for other files
        super().do_GET()

# WebSocket handler
async def debug_handler(websocket, path):
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
            'client_id': client_id
        }))
        
        async for message in websocket:
            data = json.loads(message)
            
            # Store user agent if provided
            if data.get('type') == 'init' and data.get('user_agent'):
                client_info['user_agent'] = data['user_agent']
            
            timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
            
            # Print to console with color coding
            type_color = {
                'debug': '\033[36m',  # Cyan
                'info': '\033[32m',   # Green
                'warn': '\033[33m',   # Yellow
                'error': '\033[31m',  # Red
                'event': '\033[35m'   # Magenta
            }.get(data['type'], '\033[0m')
            
            console_msg = f"{type_color}[{timestamp.strftime('%H:%M:%S.%f')[:-3]}] [CLIENT:{client_id}] [{data['type'].upper()}] {data['message']}\033[0m"
            print(console_msg)
            if data.get('data'):
                print(f"  Data: {json.dumps(data['data'], indent=2)}")
            
            # Write to debug log file (without color codes)
            log_msg = f"[{timestamp.strftime('%H:%M:%S.%f')[:-3]}] [CLIENT:{client_id}] [{data['type'].upper()}] {data['message']}\n"
            debug_log_file.write(log_msg)
            if data.get('data'):
                debug_log_file.write(f"  Data: {json.dumps(data['data'], indent=2)}\n")
            debug_log_file.flush()  # Ensure it's written immediately
            
            # Store message with client ID
            data['client_id'] = client_id
            debug_messages.append(data)
            if len(debug_messages) > 1000:  # Keep last 1000 messages
                debug_messages.pop(0)
                
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

# Start WebSocket server in a separate thread
async def start_ws_server():
    print(f"Starting debug WebSocket server on ws://localhost:{WS_PORT}")
    # Clear debug log file at startup
    with open('/tmp/webui-debug.log', 'w') as f:
        f.write(f"[{datetime.now().strftime('%H:%M:%S')}] Debug WebSocket server started\n")
    async with websockets.serve(debug_handler, "localhost", WS_PORT):
        await asyncio.Future()  # run forever

def run_ws_server():
    asyncio.run(start_ws_server())

# Function to send message to all connected clients
async def broadcast_message(message_type, message, data=None):
    """Send a message to all connected browser clients"""
    if not client_websockets:
        return
    
    msg = {
        'type': 'server_push',
        'message_type': message_type,
        'message': message,
        'data': data,
        'timestamp': datetime.now().isoformat()
    }
    
    disconnected = []
    for client_id, websocket in client_websockets.items():
        try:
            await websocket.send(json.dumps(msg))
        except:
            disconnected.append(client_id)
    
    # Clean up disconnected clients
    for client_id in disconnected:
        if client_id in client_websockets:
            del client_websockets[client_id]
        if client_id in connected_clients:
            del connected_clients[client_id]

# Function to send message to specific client
async def send_to_client(client_id, message_type, message, data=None):
    """Send a message to a specific browser client"""
    if client_id not in client_websockets:
        return False
    
    msg = {
        'type': 'server_push',
        'message_type': message_type,
        'message': message,
        'data': data,
        'timestamp': datetime.now().isoformat()
    }
    
    try:
        await client_websockets[client_id].send(json.dumps(msg))
        return True
    except:
        # Clean up disconnected client
        if client_id in client_websockets:
            del client_websockets[client_id]
        if client_id in connected_clients:
            del connected_clients[client_id]
        return False

# Function to display connected clients
def show_connected_clients():
    if connected_clients:
        print("\nConnected clients:")
        for client_id, info in connected_clients.items():
            print(f"  [{client_id}] from {info['address']}")
            if info['user_agent']:
                ua = info['user_agent']
                # Simplify user agent for display
                if 'Playwright' in ua:
                    ua_short = "Playwright Test"
                elif 'Chrome' in ua:
                    ua_short = "Chrome Browser"
                elif 'Firefox' in ua:
                    ua_short = "Firefox Browser"
                else:
                    ua_short = ua.split(' ')[0]
                print(f"       {ua_short}")
    else:
        print("\nNo clients connected")

# Start file watcher
def start_file_watcher():
    """Start watching for file changes"""
    global file_watcher
    
    event_handler = FileChangeHandler()
    file_watcher = Observer()
    
    # Watch the current directory and subdirectories
    file_watcher.schedule(event_handler, '.', recursive=True)
    file_watcher.start()
    print(f"File watcher started for extensions: {WATCH_EXTENSIONS}")

# Start WebSocket server in background thread
ws_thread = threading.Thread(target=run_ws_server, daemon=True)
ws_thread.start()

# Start file watcher
start_file_watcher()

# Start HTTP server
# Change to src directory to serve index.html and web assets
src_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src')
os.chdir(src_dir)

# Prevent "Address already in use" error during rapid restarts
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), AutoReloadHTTPRequestHandler) as httpd:
    print(f"\nTaskJuggler Web UI Server with Debug Logging")
    print(f"============================================")
    print(f"HTTP Server: http://localhost:{PORT}")
    print(f"Debug WebSocket: ws://localhost:{WS_PORT}")
    print(f"Debug Log: /tmp/webui-debug.log")
    print(f"Open in browser: http://localhost:{PORT}/")
    print(f"\nDebug messages will appear here in real-time")
    print(f"Each client gets a unique ID like [a1b2c3d4]")
    print(f"Auto-reload via WebSocket - no more polling!")
    print(f"File watcher monitoring: {WATCH_EXTENSIONS}")
    print(f"Press Ctrl+C to stop\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        if file_watcher:
            file_watcher.stop()
            file_watcher.join()
        httpd.shutdown()