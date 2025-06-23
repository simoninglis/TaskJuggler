#!/usr/bin/env python3
"""
Test to reproduce the command palette bug where it gets stuck after collapse all
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.async_api import async_playwright
from helpers.command_palette_helpers import (
    is_palette_open, wait_for_palette, type_in_palette
)

async def test_command_palette_bug():
    """Reproduce the specific bug: command palette stays stuck after collapse all"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=300)
        page = await browser.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.text}'))
        
        print("Loading application...")
        await page.goto('http://localhost:8001')
        await page.wait_for_timeout(3000)  # Wait for gantt to load
        
        # Focus the gantt to ensure proper initialization
        await page.click('#gantt_here')
        await page.wait_for_timeout(500)
        
        print("\n=== STEP 1: Initial state check ===")
        
        # Check initial state
        initial_state = await page.evaluate('''() => {
            const palette = document.getElementById('customCommandPalette');
            const paletteObj = window.customCommandPalette;
            return {
                domExists: !!palette,
                objExists: !!paletteObj,
                isOpen: paletteObj ? paletteObj.getState().isOpen : false,
                display: palette ? palette.style.display : 'not found'
            };
        }''')
        
        print(f"Initial state: {initial_state}")
        
        print("\n=== STEP 2: Open command palette with Ctrl+K ===")
        
        # Open command palette
        await page.keyboard.press('Control+k')
        await wait_for_palette(page, visible=True)
        
        # Check state after opening
        opened_state = await page.evaluate('''() => {
            const palette = document.getElementById('customCommandPalette');
            const paletteObj = window.customCommandPalette;
            const state = paletteObj ? paletteObj.getState() : null;
            return {
                isOpen: state ? state.isOpen : false,
                display: palette ? palette.style.display : 'not found',
                activeElement: document.activeElement.tagName + (document.activeElement.id ? '#' + document.activeElement.id : ''),
                inputFocused: document.activeElement === document.getElementById('paletteSearch')
            };
        }''')
        
        print(f"After opening: {opened_state}")
        
        if not opened_state['isOpen']:
            print("❌ FAIL: Command palette did not open properly")
            await browser.close()
            return
        else:
            print("✅ SUCCESS: Command palette opened correctly")
        
        print("\n=== STEP 3: Type 'collapse all' command ===")
        
        # Type the command
        await type_in_palette(page, 'collapse all')
        await page.wait_for_timeout(500)
        
        # Check if command is found
        command_visible = await page.evaluate('''() => {
            const items = document.querySelectorAll('.command-item');
            const collapseCommand = Array.from(items).find(item => 
                item.textContent.toLowerCase().includes('collapse all')
            );
            return !!collapseCommand;
        }''')
        
        print(f"Collapse all command visible: {command_visible}")
        
        print("\n=== STEP 4: Execute collapse all command with Enter ===")
        
        # Execute the command
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(1000)  # Give time for command to execute and palette to close
        
        print("\n=== STEP 5: Check state after command execution ===")
        
        # Check state after command execution
        after_command_state = await page.evaluate('''() => {
            const palette = document.getElementById('customCommandPalette');
            const paletteObj = window.customCommandPalette;
            const state = paletteObj ? paletteObj.getState() : null;
            return {
                isOpen: state ? state.isOpen : false,
                display: palette ? palette.style.display : 'not found',
                activeElement: document.activeElement.tagName + (document.activeElement.id ? '#' + document.activeElement.id : ''),
                overlayClass: palette ? palette.className : 'not found'
            };
        }''')
        
        print(f"After command execution: {after_command_state}")
        
        # Determine if bug is present
        palette_stuck = False
        
        # Check multiple indicators to see if palette is stuck
        if after_command_state['isOpen']:
            print("🔍 ANALYSIS: Palette still reports as open")
            palette_stuck = True
        
        if after_command_state['display'] !== 'none' and after_command_state['display'] !== 'not found':
            print(f"🔍 ANALYSIS: Palette display is '{after_command_state['display']}' instead of 'none'")
            palette_stuck = True
        
        print("\n=== STEP 6: Test navigation after command ===")
        
        # Try to navigate with arrow keys
        print("Attempting to navigate with arrow keys...")
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(300)
        
        # Check if gantt navigation works
        nav_works = await page.evaluate('''() => {
            // Check if we can get selected task
            const selectedId = window.gantt ? window.gantt.getSelectedId() : null;
            return {
                hasSelection: !!selectedId,
                selectedTask: selectedId
            };
        }''')
        
        print(f"Navigation after command: {nav_works}")
        
        if palette_stuck and not nav_works['hasSelection']:
            print("\n❌ BUG CONFIRMED: Command palette is stuck and blocking navigation!")
        elif palette_stuck:
            print("\n⚠️  PARTIAL BUG: Palette stuck visually but navigation still works")
        else:
            print("\n✅ NO BUG: Command palette closed properly and navigation works")
        
        print("\n=== STEP 7: Try to open palette again ===")
        
        # Try to open palette again
        await page.keyboard.press('Control+k')
        await page.wait_for_timeout(500)
        
        reopen_state = await is_palette_open(page)
        
        if reopen_state:
            print("✅ Can reopen palette - recovery possible")
        else:
            print("❌ Cannot reopen palette - system stuck")
        
        print("\n=== STEP 8: Manual recovery attempt ===")
        
        if palette_stuck:
            # Try escape key multiple times
            print("Attempting recovery with multiple Escape presses...")
            for i in range(3):
                await page.keyboard.press('Escape')
                await page.wait_for_timeout(200)
            
            final_state = await is_palette_open(page)
            
            if not final_state:
                print("✅ Recovery successful with Escape key")
            else:
                print("❌ Recovery failed - palette still stuck")
        
        print("\nTest completed. Browser will stay open for 10 seconds...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_command_palette_bug())