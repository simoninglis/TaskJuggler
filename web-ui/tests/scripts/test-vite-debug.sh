#!/bin/bash
# Test script to verify Vite debug setup

echo "🧪 Testing Vite + Debug WebSocket setup..."
echo "========================================="

# Function to check if port is in use
check_port() {
    local port=$1
    local name=$2
    if lsof -i :$port > /dev/null 2>&1; then
        echo "✅ Port $port ($name) is in use"
        return 0
    else
        echo "❌ Port $port ($name) is free"
        return 1
    fi
}

# Kill any existing servers
echo "🛑 Stopping any existing servers..."
just kill-servers
sleep 2

echo ""
echo "🚀 Starting WebSocket debug server..."
poetry run python server/debug_websocket_server.py &
WS_PID=$!
sleep 2

# Check if WebSocket server started
if check_port 8002 "WebSocket"; then
    echo "✅ WebSocket server started successfully"
else
    echo "❌ Failed to start WebSocket server"
    kill $WS_PID 2>/dev/null
    exit 1
fi

echo ""
echo "📦 Starting Vite dev server..."
echo "Open http://localhost:8001 in your browser"
echo ""
echo "To test debug functionality:"
echo "1. Open browser console"
echo "2. You should see 'Debug mode active' message"
echo "3. Type: window.debugLog('test', 'Hello from browser!')"
echo "4. Check /tmp/webui-debug.log for the message"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start Vite in foreground
npm run dev

# Cleanup on exit
kill $WS_PID 2>/dev/null
echo "✅ Servers stopped"