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
from pathlib import Path
from datetime import datetime

PORT = 8001
WS_PORT = 8002
WATCH_EXTENSIONS = ['.html', '.js', '.css', '.json']

# Store debug messages
debug_messages = []

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
        if self.path == '/__check_changes__':
            # Return the last modification time of watched files
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            last_modified = 0
            for ext in WATCH_EXTENSIONS:
                for file in Path('.').rglob(f'*{ext}'):
                    if not str(file).startswith('.'):  # Skip hidden files
                        mtime = os.path.getmtime(file)
                        if mtime > last_modified:
                            last_modified = mtime
            
            self.wfile.write(json.dumps({'last_modified': last_modified}).encode())
            return
        
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
    
    function connectDebugWS() {
        ws = new WebSocket('ws://localhost:8002');
        
        ws.onopen = function() {
            console.log('Debug WebSocket connected');
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
            }
            // Send initial connection message
            window.debugLog('debug', 'Debug WebSocket connected from browser');
        };
        
        ws.onclose = function() {
            console.log('Debug WebSocket disconnected');
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
            url: window.location.href
        };
        
        // Log to console
        console.log(`[${type}]`, message, data || '');
        
        // Send to WebSocket if connected
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(logMessage));
        }
    };
    
    // Connect to debug WebSocket
    connectDebugWS();
    
    // Auto-reload functionality
    let lastModified = 0;
    
    async function checkForChanges() {
        try {
            const response = await fetch('/__check_changes__');
            const data = await response.json();
            
            if (lastModified > 0 && data.last_modified > lastModified) {
                window.debugLog('info', 'Files changed, reloading...');
                setTimeout(() => window.location.reload(), 100);
            }
            
            lastModified = data.last_modified;
        } catch (e) {
            console.error('Auto-reload check failed:', e);
        }
    }
    
    // Check every 1 second
    setInterval(checkForChanges, 1000);
    
    // Initial check
    checkForChanges();
    
    console.log('Auto-reload and debug logging enabled');
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
    print(f"Debug client connected from {websocket.remote_address}")
    
    # Open debug log file for writing
    debug_log_file = open('/tmp/webui-debug.log', 'a')
    
    try:
        async for message in websocket:
            data = json.loads(message)
            timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
            
            # Print to console with color coding
            type_color = {
                'debug': '\033[36m',  # Cyan
                'info': '\033[32m',   # Green
                'warn': '\033[33m',   # Yellow
                'error': '\033[31m',  # Red
                'event': '\033[35m'   # Magenta
            }.get(data['type'], '\033[0m')
            
            console_msg = f"{type_color}[{timestamp.strftime('%H:%M:%S.%f')[:-3]}] [{data['type'].upper()}] {data['message']}\033[0m"
            print(console_msg)
            if data.get('data'):
                print(f"  Data: {json.dumps(data['data'], indent=2)}")
            
            # Write to debug log file (without color codes)
            log_msg = f"[{timestamp.strftime('%H:%M:%S.%f')[:-3]}] [{data['type'].upper()}] {data['message']}\n"
            debug_log_file.write(log_msg)
            if data.get('data'):
                debug_log_file.write(f"  Data: {json.dumps(data['data'], indent=2)}\n")
            debug_log_file.flush()  # Ensure it's written immediately
            
            # Store message
            debug_messages.append(data)
            if len(debug_messages) > 1000:  # Keep last 1000 messages
                debug_messages.pop(0)
                
    except websockets.exceptions.ConnectionClosed:
        print(f"Debug client disconnected")
        debug_log_file.write(f"[{datetime.now().strftime('%H:%M:%S')}] Debug client disconnected\n")
    except Exception as e:
        print(f"Debug handler error: {e}")
        debug_log_file.write(f"[{datetime.now().strftime('%H:%M:%S')}] Debug handler error: {e}\n")
    finally:
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

# Start WebSocket server in background thread
ws_thread = threading.Thread(target=run_ws_server, daemon=True)
ws_thread.start()

# Start HTTP server
os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), AutoReloadHTTPRequestHandler) as httpd:
    print(f"\nTaskJuggler Web UI Server with Debug Logging")
    print(f"============================================")
    print(f"HTTP Server: http://localhost:{PORT}")
    print(f"Debug WebSocket: ws://localhost:{WS_PORT}")
    print(f"Open in browser: http://localhost:{PORT}/index.html")
    print(f"\nDebug messages will appear here in real-time")
    print(f"Auto-reload is enabled - browser will refresh when files change")
    print(f"Press Ctrl+C to stop\n")
    httpd.serve_forever()