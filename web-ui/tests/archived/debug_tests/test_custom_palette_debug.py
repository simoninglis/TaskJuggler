#!/usr/bin/env python3
"""
Debug Custom Command Palette behavior
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.async_api import async_playwright
from helpers.command_palette_helpers import (
    is_palette_open, wait_for_palette, get_visible_commands,
    get_palette_mode
)

async def test_custom_palette_debug():
    """Debug what's happening with Custom Command Palette"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        page = await browser.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.text}'))
        
        print("Loading application...")
        await page.goto('http://localhost:8001')
        await page.wait_for_timeout(3000)
        
        # Focus gantt
        await page.click('#gantt_here')
        await page.wait_for_timeout(500)
        
        print("\n=== INITIAL STATE ===")
        initial = await page.evaluate('''() => {
            const palette = document.getElementById('customCommandPalette');
            const paletteObj = window.customCommandPalette;
            return {
                domExists: !!palette,
                objExists: !!paletteObj,
                isOpen: paletteObj ? paletteObj.getState().isOpen : false,
                display: palette ? palette.style.display : 'not found',
                commandCount: paletteObj ? paletteObj.commands.length : 0
            };
        }''')
        print(f"Initial palette state: {initial}")
        
        print("\n=== CYCLE 1: First open ===")
        
        # First open
        print("Pressing Ctrl+K...")
        await page.keyboard.press('Control+k')
        await page.wait_for_timeout(1000)
        
        after_first = await page.evaluate('''() => {
            const palette = document.getElementById('customCommandPalette');
            const paletteObj = window.customCommandPalette;
            const state = paletteObj ? paletteObj.getState() : null;
            return {
                isOpen: state ? state.isOpen : false,
                display: palette ? palette.style.display : 'not found',
                overlayVisible: palette && palette.classList.contains('visible'),
                inputValue: document.getElementById('paletteSearch') ? 
                           document.getElementById('paletteSearch').value : 'not found',
                mode: state ? {
                    isSearchMode: state.isSearchMode,
                    isFocusMode: state.isFocusMode,
                    isGoMode: state.isGoMode
                } : null
            };
        }''')
        
        print(f"After first Ctrl+K: {after_first}")
        
        if after_first['isOpen']:
            print("✅ First open successful")
            
            # Get visible commands
            commands = await get_visible_commands(page)
            print(f"Visible commands: {len(commands)} items")
            if len(commands) > 0:
                print(f"First few commands: {[c['text'] for c in commands[:3]]}")
            
            print("Closing with Escape...")
            await page.keyboard.press('Escape')
            await page.wait_for_timeout(1000)
            
            after_close = await page.evaluate('''() => {
                const palette = document.getElementById('customCommandPalette');
                const paletteObj = window.customCommandPalette;
                const state = paletteObj ? paletteObj.getState() : null;
                return {
                    isOpen: state ? state.isOpen : false,
                    display: palette ? palette.style.display : 'not found'
                };
            }''')
            
            print(f"After Escape: {after_close}")
            
            print("\n=== CYCLE 2: Second open attempt ===")
            
            # Try to open again
            print("Pressing Ctrl+K again...")
            await page.keyboard.press('Control+k')
            await page.wait_for_timeout(1000)
            
            after_second = await page.evaluate('''() => {
                const palette = document.getElementById('customCommandPalette');
                const paletteObj = window.customCommandPalette;
                const state = paletteObj ? paletteObj.getState() : null;
                return {
                    isOpen: state ? state.isOpen : false,
                    display: palette ? palette.style.display : 'not found',
                    inputFocused: document.activeElement === document.getElementById('paletteSearch')
                };
            }''')
            
            print(f"After second Ctrl+K: {after_second}")
            
            if after_second['isOpen']:
                print("✅ Second open successful - palette works correctly!")
            else:
                print("❌ Second open failed - debugging issue")
                
                print("\n=== DEBUGGING: Direct palette interaction ===")
                
                # Try to directly call open method
                direct_result = await page.evaluate('''() => {
                    const paletteObj = window.customCommandPalette;
                    try {
                        if (paletteObj) {
                            paletteObj.open();
                            return {
                                success: true,
                                isOpen: paletteObj.getState().isOpen
                            };
                        }
                        return { success: false, error: 'Palette object not found' };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                }''')
                
                print(f"Direct open() call: {direct_result}")
                
        else:
            print("❌ First open failed")
            
            # Check if palette is initialized
            init_check = await page.evaluate('''() => {
                return {
                    hasCustomPalette: !!window.customCommandPalette,
                    hasKeyboardManager: !!window.keyboardManager,
                    documentReady: document.readyState
                };
            }''')
            print(f"Initialization check: {init_check}")
        
        print("\n=== Testing different palette modes ===")
        
        # Test search mode
        print("Testing search mode (/)...")
        await page.keyboard.press('/')
        await page.wait_for_timeout(500)
        
        search_mode = await get_palette_mode(page)
        print(f"After '/' key: {search_mode}")
        
        if search_mode and search_mode['isSearchMode']:
            print("✅ Search mode works")
        else:
            print("❌ Search mode failed")
        
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(500)
        
        # Test go mode
        print("Testing go mode (g)...")
        await page.keyboard.press('g')
        await page.wait_for_timeout(500)
        
        go_mode = await get_palette_mode(page)
        print(f"After 'g' key: {go_mode}")
        
        if go_mode and go_mode['isGoMode']:
            print("✅ Go mode works")
        else:
            print("❌ Go mode failed")
        
        print("\nTest completed. Browser will stay open for 15 seconds...")
        await page.wait_for_timeout(15000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_custom_palette_debug())