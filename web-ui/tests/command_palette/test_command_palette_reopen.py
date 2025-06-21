#!/usr/bin/env python3
"""
Test to reproduce the issue where command palette can't be opened a second time
"""

import asyncio
from playwright.async_api import async_playwright

async def test_command_palette_reopen():
    """Test that command palette can be opened multiple times"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=400)
        page = await browser.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.text}'))
        
        print("Loading application...")
        await page.goto('http://localhost:8001')
        await page.wait_for_timeout(3000)
        
        # Focus gantt
        await page.click('#gantt_here')
        await page.wait_for_timeout(500)
        
        for cycle in range(1, 4):  # Test 3 open/close cycles
            print(f"\n=== CYCLE {cycle}: Testing command palette open/close ===")
            
            # Check initial state
            initial_state = await page.evaluate('''() => {
                const ninja = document.getElementById('commandPalette');
                return {
                    hasVisibleAttr: ninja ? ninja.hasAttribute('visible') : false,
                    globalFlag: window.isCommandPaletteOpen || false,
                    shadowBackdrop: ninja && ninja.shadowRoot ? !!ninja.shadowRoot.querySelector('.backdrop') : false
                };
            }''')
            
            print(f"  Initial state: {initial_state}")
            
            if initial_state['hasVisibleAttr'] or initial_state['globalFlag'] or initial_state['shadowBackdrop']:
                print(f"  ❌ ERROR: Palette already appears open at start of cycle {cycle}")
            
            print(f"  Step 1: Opening command palette with Ctrl+Shift+P...")
            
            # Try to open command palette
            await page.keyboard.press('Control+Shift+p')
            await page.wait_for_timeout(1000)  # Give extra time for opening
            
            # Check if it opened
            opened_state = await page.evaluate('''() => {
                const ninja = document.getElementById('commandPalette');
                return {
                    hasVisibleAttr: ninja ? ninja.hasAttribute('visible') : false,
                    globalFlag: window.isCommandPaletteOpen || false,
                    shadowBackdrop: ninja && ninja.shadowRoot ? !!ninja.shadowRoot.querySelector('.backdrop') : false,
                    shadowModal: ninja && ninja.shadowRoot ? !!ninja.shadowRoot.querySelector('.modal') : false,
                    modalOpacity: ninja && ninja.shadowRoot && ninja.shadowRoot.querySelector('.modal') ? 
                                 window.getComputedStyle(ninja.shadowRoot.querySelector('.modal')).opacity : null
                };
            }''')
            
            print(f"  After Ctrl+K: {opened_state}")
            
            palette_opened = (opened_state['hasVisibleAttr'] or 
                            opened_state['globalFlag'] or 
                            opened_state['shadowBackdrop'] or
                            (opened_state['shadowModal'] and opened_state['modalOpacity'] != '0'))
            
            if not palette_opened:
                print(f"  ❌ FAIL: Command palette did not open on cycle {cycle}")
                print(f"      - This is the bug we need to fix!")
                break
            else:
                print(f"  ✅ SUCCESS: Command palette opened on cycle {cycle}")
            
            print(f"  Step 2: Using expand all command...")
            
            # Use expand all command
            await page.keyboard.type('expand all')
            await page.wait_for_timeout(300)
            await page.keyboard.press('Enter')
            await page.wait_for_timeout(1000)
            
            # Check if palette closed properly
            closed_state = await page.evaluate('''() => {
                const ninja = document.getElementById('commandPalette');
                return {
                    hasVisibleAttr: ninja ? ninja.hasAttribute('visible') : false,
                    globalFlag: window.isCommandPaletteOpen || false,
                    shadowBackdrop: ninja && ninja.shadowRoot ? !!ninja.shadowRoot.querySelector('.backdrop') : false,
                    shadowModal: ninja && ninja.shadowRoot ? !!ninja.shadowRoot.querySelector('.modal') : false,
                    modalOpacity: ninja && ninja.shadowRoot && ninja.shadowRoot.querySelector('.modal') ? 
                                 window.getComputedStyle(ninja.shadowRoot.querySelector('.modal')).opacity : null
                };
            }''')
            
            print(f"  After command: {closed_state}")
            
            palette_closed = (not closed_state['hasVisibleAttr'] and 
                            not closed_state['globalFlag'] and 
                            not closed_state['shadowBackdrop'] and
                            closed_state['modalOpacity'] == '0')
            
            if not palette_closed:
                print(f"  ❌ WARNING: Command palette did not close properly on cycle {cycle}")
                # Try to force close it
                await page.keyboard.press('Escape')
                await page.wait_for_timeout(500)
            else:
                print(f"  ✅ SUCCESS: Command palette closed properly on cycle {cycle}")
            
            print(f"  Step 3: Testing keyboard navigation...")
            
            # Test that keyboard navigation works
            await page.click('#gantt_here')
            await page.wait_for_timeout(300)
            
            initial_task = await page.evaluate('() => gantt.getSelectedId()')
            await page.keyboard.press('ArrowDown')
            await page.wait_for_timeout(200)
            new_task = await page.evaluate('() => gantt.getSelectedId()')
            
            if new_task and new_task != initial_task:
                print(f"  ✅ SUCCESS: Keyboard navigation works after cycle {cycle}")
            else:
                print(f"  ❌ FAIL: Keyboard navigation blocked after cycle {cycle}")
            
            # Wait before next cycle
            await page.wait_for_timeout(500)
        
        print(f"\n=== TESTING EDGE CASE: Try opening immediately after closing ===")
        
        # Test rapid open after close
        await page.keyboard.press('Control+Shift+p')
        await page.wait_for_timeout(100)  # Very short wait
        
        rapid_state = await page.evaluate('''() => {
            const ninja = document.getElementById('commandPalette');
            return {
                hasVisibleAttr: ninja ? ninja.hasAttribute('visible') : false,
                globalFlag: window.isCommandPaletteOpen || false,
                shadowBackdrop: ninja && ninja.shadowRoot ? !!ninja.shadowRoot.querySelector('.backdrop') : false
            };
        }''')
        
        print(f"Rapid reopen state: {rapid_state}")
        
        if rapid_state['hasVisibleAttr'] or rapid_state['globalFlag'] or rapid_state['shadowBackdrop']:
            print("✅ SUCCESS: Command palette can be opened immediately after closing")
        else:
            print("❌ FAIL: Command palette cannot be opened immediately after closing")
        
        print("\nTest completed. Browser will stay open for 10 seconds for manual verification...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_command_palette_reopen())