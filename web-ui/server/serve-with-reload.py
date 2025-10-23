#!/usr/bin/env python3
"""
HTTP server with auto-reload functionality for development
Injects a script that monitors for file changes and reloads the browser
"""

import http.server
import socketserver
import os
import json
import time
from pathlib import Path

PORT = 8001
WATCH_EXTENSIONS = ['.html', '.js', '.css', '.json']

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
        
        # For HTML files, inject auto-reload script
        if self.path.endswith('.html') or self.path == '/':
            path = self.path
            if path == '/':
                path = '/index.html'
            
            try:
                with open('.' + path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Inject auto-reload script before </body>
                reload_script = """
<script>
// Auto-reload functionality
(function() {
    let lastModified = 0;
    
    async function checkForChanges() {
        try {
            const response = await fetch('/__check_changes__');
            const data = await response.json();
            
            if (lastModified > 0 && data.last_modified > lastModified) {
                console.log('Files changed, reloading...');
                window.location.reload();
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
    
    console.log('Auto-reload enabled - watching for file changes');
})();
</script>
</body>"""
                
                content = content.replace('</body>', reload_script)
                
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

# Change to src directory to serve index.html and web assets
src_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src')
os.chdir(src_dir)

# Prevent "Address already in use" error during rapid restarts
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), AutoReloadHTTPRequestHandler) as httpd:
    print(f"TaskJuggler Web UI Server with Auto-Reload")
    print(f"==========================================")
    print(f"Serving at: http://localhost:{PORT}")
    print(f"Open in browser: http://localhost:{PORT}/")
    print(f"Auto-reload is enabled - browser will refresh when files change")
    print(f"Press Ctrl+C to stop")
    httpd.serve_forever()