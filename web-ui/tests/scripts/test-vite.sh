#!/bin/bash
# Test script to verify Vite setup

echo "🧪 Testing Vite setup..."
echo "========================"

# Check if npm packages are installed
echo "📦 Checking dependencies..."
if [ -f "node_modules/vite/bin/vite.js" ]; then
    echo "✅ Vite is installed"
else
    echo "❌ Vite not found. Run: npm install"
    exit 1
fi

if [ -f "node_modules/lit/index.js" ]; then
    echo "✅ Lit is installed"
else
    echo "❌ Lit not found. Run: npm install"
    exit 1
fi

# Check file structure
echo ""
echo "📁 Checking file structure..."
if [ -f "src/index.html" ]; then
    echo "✅ src/index.html exists"
else
    echo "❌ src/index.html not found"
fi

if [ -f "src/js/main.js" ]; then
    echo "✅ src/js/main.js exists"
else
    echo "❌ src/js/main.js not found"
fi

if [ -f "src/js/components/keyboard-help.js" ]; then
    echo "✅ src/js/components/keyboard-help.js exists"
else
    echo "❌ src/js/components/keyboard-help.js not found"
fi

echo ""
echo "🚀 Starting Vite dev server..."
echo "Open http://localhost:8001 in your browser"
echo "Press Ctrl+C to stop"
echo ""

# Run Vite
npm run dev