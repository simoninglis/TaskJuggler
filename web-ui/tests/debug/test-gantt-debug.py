#!/usr/bin/env python3
"""Debug test to check why Gantt chart isn't showing."""
from playwright.sync_api import sync_playwright
import time
import json

def test_gantt_loading():
    with sync_playwright() as p:
        # Launch browser with devtools
        browser = p.chromium.launch(headless=False, devtools=True)
        page = browser.new_page()
        
        # Collect console messages and errors
        console_messages = []
        page_errors = []
        
        page.on("console", lambda msg: console_messages.append({
            'type': msg.type,
            'text': msg.text,
            'location': msg.location
        }))
        page.on("pageerror", lambda err: page_errors.append(str(err)))
        
        print("🌐 Navigating to http://localhost:8001...")
        page.goto("http://localhost:8001")
        
        # Wait for page to load
        print("⏳ Waiting for page to load...")
        time.sleep(3)
        
        # Check if DHTMLX Gantt is defined
        gantt_info = page.evaluate("""
            () => {
                return {
                    ganttDefined: typeof gantt !== 'undefined',
                    ganttVersion: typeof gantt !== 'undefined' ? gantt.version : null,
                    ganttConfig: typeof gantt !== 'undefined' && gantt.config ? {
                        container: gantt.config.container,
                        scale_unit: gantt.config.scale_unit,
                        readonly: gantt.config.readonly
                    } : null,
                    ganttContainer: !!document.getElementById('gantt_here'),
                    ganttTasks: typeof gantt !== 'undefined' && gantt.getTaskByTime ? gantt.getTaskByTime().length : 0
                };
            }
        """)
        
        print("\n📊 DHTMLX Gantt Status:")
        print(json.dumps(gantt_info, indent=2))
        
        # Check for web components
        components_info = page.evaluate("""
            () => {
                return {
                    keyboardHelp: !!customElements.get('keyboard-help'),
                    themeManager: !!customElements.get('theme-manager'),
                    layoutManager: !!customElements.get('layout-manager'),
                    componentsInDOM: {
                        keyboardHelp: !!document.querySelector('keyboard-help'),
                        themeManager: !!document.querySelector('theme-manager'),
                        layoutManager: !!document.querySelector('layout-manager')
                    }
                };
            }
        """)
        
        print("\n🧩 Web Components Status:")
        print(json.dumps(components_info, indent=2))
        
        # Check module loading
        modules_info = page.evaluate("""
            () => {
                return {
                    debugLog: typeof window.debugLog === 'function',
                    updateStatus: typeof window.updateStatus === 'function',
                    customCommandPalette: !!window.customCommandPalette,
                    keyboardManager: !!window.keyboardManager
                };
            }
        """)
        
        print("\n📦 Modules Status:")
        print(json.dumps(modules_info, indent=2))
        
        # Check for errors
        print(f"\n❌ Page Errors ({len(page_errors)}):")
        for error in page_errors:
            print(f"  - {error}")
        
        print(f"\n📝 Console Messages ({len(console_messages)}):")
        # Filter and show important messages
        for msg in console_messages:
            if msg['type'] in ['error', 'warning']:
                print(f"  [{msg['type'].upper()}] {msg['text']}")
                if msg['location']:
                    print(f"    at {msg['location']}")
        
        # Show some regular console logs too
        print("\n📋 Recent Console Logs:")
        for msg in console_messages[-10:]:
            if msg['type'] == 'log':
                print(f"  {msg['text']}")
        
        # Check Gantt container visibility
        container_info = page.evaluate("""
            () => {
                const container = document.getElementById('gantt_here');
                if (!container) return null;
                
                const rect = container.getBoundingClientRect();
                const computed = window.getComputedStyle(container);
                
                return {
                    exists: true,
                    visible: computed.display !== 'none' && computed.visibility !== 'hidden',
                    dimensions: {
                        width: rect.width,
                        height: rect.height
                    },
                    style: {
                        display: computed.display,
                        visibility: computed.visibility,
                        position: computed.position
                    },
                    hasContent: container.innerHTML.length > 0
                };
            }
        """)
        
        print("\n📐 Gantt Container Info:")
        print(json.dumps(container_info, indent=2))
        
        # Wait for user to inspect
        input("\n🔍 Browser is open with DevTools. Press Enter to close...")
        browser.close()

if __name__ == "__main__":
    print("🧪 Starting Gantt Debug Test...")
    print("=" * 50)
    print("Make sure Vite server is running: npm run dev")
    print("=" * 50)
    test_gantt_loading()