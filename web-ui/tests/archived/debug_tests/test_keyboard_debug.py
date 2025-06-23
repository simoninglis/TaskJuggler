#!/usr/bin/env python3
"""
Debug test to check if KeyboardManager is loading and working
"""

import asyncio
from playwright.async_api import async_playwright

async def test_keyboard_manager_debug():
    """Test to debug KeyboardManager loading and initialization"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        page = await browser.new_page()
        
        # Collect all console messages
        console_messages = []
        page.on('console', lambda msg: console_messages.append(f'[{msg.type}] {msg.text}'))
        
        # Collect any errors
        page.on('pageerror', lambda error: print(f'❌ PAGE ERROR: {error}'))
        
        print("Loading application...")
        await page.goto('http://localhost:8001')
        await page.wait_for_timeout(3000)
        
        print("\n=== CONSOLE MESSAGES ===")
        for msg in console_messages:
            print(msg)
        
        print("\n=== CHECKING KEYBOARDMANAGER LOADING ===")
        
        # Check if keyboard-manager.js file loaded
        keyboard_manager_loaded = await page.evaluate('''() => {
            return {
                fileLoaded: typeof KeyboardManager !== 'undefined',
                instanceExists: !!window.keyboardManager,
                debugLogExists: typeof window.debugLog === 'function'
            }
        }''')
        
        print(f"KeyboardManager class defined: {keyboard_manager_loaded['fileLoaded']}")
        print(f"window.keyboardManager exists: {keyboard_manager_loaded['instanceExists']}")
        print(f"window.debugLog function exists: {keyboard_manager_loaded['debugLogExists']}")
        
        if keyboard_manager_loaded['instanceExists']:
            print("\n✅ KeyboardManager instance found!")
            
            # Test keyboard manager state
            km_state = await page.evaluate('''() => {
                const km = window.keyboardManager;
                return {
                    currentState: km.getCurrentState(),
                    hasHandlers: km.handlers.size > 0,
                    hasGlobalHotkeys: km.globalHotkeys.size > 0
                }
            }''')
            
            print(f"Current state: {km_state['currentState']}")
            print(f"Has handlers: {km_state['hasHandlers']}")
            print(f"Has global hotkeys: {km_state['hasGlobalHotkeys']}")
            
        else:
            print("\n❌ KeyboardManager instance NOT found!")
            
            # Check what's actually on window object
            window_props = await page.evaluate('''() => {
                return Object.keys(window).filter(key => 
                    key.toLowerCase().includes('keyboard') || 
                    key.toLowerCase().includes('manager') ||
                    key === 'keyboardManager'
                );
            }''')
            
            print(f"Window properties related to keyboard: {window_props}")
        
        print("\n=== TESTING KEYBOARD EVENTS ===")
        
        # Focus gantt
        await page.click('#gantt_here')
        await page.wait_for_timeout(500)
        
        print("Pressing Ctrl+Shift+P...")
        await page.keyboard.down('Control')
        await page.keyboard.down('Shift')
        await page.keyboard.press('p')
        await page.keyboard.up('Shift')  
        await page.keyboard.up('Control')
        await page.wait_for_timeout(1000)
        
        print("Pressing Arrow Down...")
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(500)
        
        print("Pressing Arrow Up...")
        await page.keyboard.press('ArrowUp')
        await page.wait_for_timeout(500)
        
        print("\n=== FINAL CONSOLE MESSAGES ===")
        for msg in console_messages[-10:]:  # Last 10 messages
            print(msg)
        
        print("\nTest completed. Browser will stay open for 10 seconds for manual inspection...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_keyboard_manager_debug())