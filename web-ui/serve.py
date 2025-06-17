#!/usr/bin/env python3
"""
Simple HTTP server for the TaskJuggler Web UI
Serves files with proper CORS headers to allow local development
"""

import http.server
import socketserver
import os

PORT = 8000

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
    print(f"TaskJuggler Web UI Server")
    print(f"========================")
    print(f"Serving at: http://localhost:{PORT}")
    print(f"Open in browser: http://localhost:{PORT}/index.html")
    print(f"Press Ctrl+C to stop")
    httpd.serve_forever()