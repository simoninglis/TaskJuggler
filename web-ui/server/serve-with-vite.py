#!/usr/bin/env python3
"""
Development server using Vite for the front-end bundling.
Maintains WebSocket debug server for real-time communication.
"""

import asyncio
import subprocess
import sys
import signal
import os
from pathlib import Path

# Add the server directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from debug_websocket_server import start_websocket_server

def signal_handler(sig, frame):
    print("\n✋ Shutting down servers...")
    sys.exit(0)

async def run_vite():
    """Run Vite dev server."""
    print("🚀 Starting Vite dev server on http://localhost:8001")
    
    # Change to web-ui directory
    web_ui_dir = Path(__file__).parent.parent
    os.chdir(web_ui_dir)
    
    # Run npm run dev
    process = await asyncio.create_subprocess_exec(
        'npm', 'run', 'dev',
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    # Stream output
    async def stream_output(stream, prefix):
        async for line in stream:
            print(f"{prefix}: {line.decode().strip()}")
    
    await asyncio.gather(
        stream_output(process.stdout, "Vite"),
        stream_output(process.stderr, "Vite")
    )
    
    await process.wait()

async def main():
    """Run both Vite and WebSocket servers."""
    print("="*60)
    print("🚀 TaskJuggler Web UI Development Server (Vite + WebSocket)")
    print("="*60)
    print("📦 Using Vite for bundling and hot module replacement")
    print("🔌 WebSocket server for debug communication on ws://localhost:8002")
    print("="*60)
    
    # Set up signal handler
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        # Run both servers concurrently
        await asyncio.gather(
            run_vite(),
            start_websocket_server()
        )
    except KeyboardInterrupt:
        print("\n✋ Servers stopped")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())