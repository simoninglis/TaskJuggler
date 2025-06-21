#!/usr/bin/env python3
"""
Test to reproduce the command palette bug where it gets stuck after collapse all
"""

import asyncio
from playwright.async_api import async_playwright

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
            const ninja = document.getElementById('commandPalette');
            const result = {
                exists: !!ninja,
                hasVisibleAttr: ninja ? ninja.hasAttribute('visible') : false,
                shadowRoot: ninja ? !!ninja.shadowRoot : false
            };
            
            if (ninja && ninja.shadowRoot) {
                const modal = ninja.shadowRoot.querySelector('.modal');
                const backdrop = ninja.shadowRoot.querySelector('.backdrop');
                result.shadowModal = !!modal;
                result.shadowBackdrop = !!backdrop;
                if (modal) {
                    result.modalClasses = Array.from(modal.classList);
                    result.modalOpacity = window.getComputedStyle(modal).opacity;
                    result.modalDisplay = window.getComputedStyle(modal).display;
                }
                if (backdrop) {
                    result.backdropOpacity = window.getComputedStyle(backdrop).opacity;
                    result.backdropDisplay = window.getComputedStyle(backdrop).display;
                }
            }
            
            return result;
        }''')
        
        print(f"Initial state: {initial_state}")
        
        print("\n=== STEP 2: Open command palette with Ctrl+K ===")
        
        # Open command palette
        await page.keyboard.press('Control+k')
        await page.wait_for_timeout(1000)  # Give time for palette to fully open
        
        # Check state after opening
        opened_state = await page.evaluate('''() => {
            const ninja = document.getElementById('commandPalette');
            const result = {
                exists: !!ninja,
                hasVisibleAttr: ninja ? ninja.hasAttribute('visible') : false,
                shadowRoot: ninja ? !!ninja.shadowRoot : false,
                activeElement: document.activeElement.tagName + (document.activeElement.id ? '#' + document.activeElement.id : '')
            };
            
            if (ninja && ninja.shadowRoot) {
                const modal = ninja.shadowRoot.querySelector('.modal');
                const backdrop = ninja.shadowRoot.querySelector('.backdrop');
                const input = ninja.shadowRoot.querySelector('input');
                
                result.shadowModal = !!modal;
                result.shadowBackdrop = !!backdrop;
                result.shadowInput = !!input;
                
                if (modal) {
                    result.modalClasses = Array.from(modal.classList);
                    result.modalOpacity = window.getComputedStyle(modal).opacity;
                    result.modalDisplay = window.getComputedStyle(modal).display;
                    result.modalVisibility = window.getComputedStyle(modal).visibility;
                }
                if (backdrop) {
                    result.backdropOpacity = window.getComputedStyle(backdrop).opacity;
                    result.backdropDisplay = window.getComputedStyle(backdrop).display;
                    result.backdropVisibility = window.getComputedStyle(backdrop).visibility;
                }
                if (input) {
                    result.inputFocused = input === ninja.shadowRoot.activeElement;
                    result.inputValue = input.value;
                }
            }
            
            return result;
        }''')
        
        print(f"After opening: {opened_state}")
        
        if not opened_state['shadowBackdrop']:
            print("❌ FAIL: Command palette did not open properly")
            await browser.close()
            return
        else:
            print("✅ SUCCESS: Command palette opened correctly")
        
        print("\n=== STEP 3: Type 'collapse all' command ===")
        
        # Type the command
        await page.keyboard.type('collapse all')
        await page.wait_for_timeout(500)
        
        # Check if command is found
        command_visible = await page.evaluate('''() => {
            const ninja = document.getElementById('commandPalette');
            if (ninja && ninja.shadowRoot) {
                const items = ninja.shadowRoot.querySelectorAll('.ninja-action');
                const collapseCommand = Array.from(items).find(item => 
                    item.textContent.toLowerCase().includes('collapse all')
                );
                return !!collapseCommand;
            }
            return false;
        }''')
        
        print(f"Collapse all command visible: {command_visible}")
        
        print("\n=== STEP 4: Execute collapse all command with Enter ===")
        
        # Execute the command
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(1000)  # Give time for command to execute and palette to close
        
        print("\n=== STEP 5: Check state after command execution ===")
        
        # Check state after command execution
        after_command_state = await page.evaluate('''() => {
            const ninja = document.getElementById('commandPalette');
            const result = {
                exists: !!ninja,
                hasVisibleAttr: ninja ? ninja.hasAttribute('visible') : false,
                shadowRoot: ninja ? !!ninja.shadowRoot : false,
                activeElement: document.activeElement.tagName + (document.activeElement.id ? '#' + document.activeElement.id : ''),
                isCommandPaletteOpen: window.isCommandPaletteOpen || false
            };
            
            if (ninja && ninja.shadowRoot) {
                const modal = ninja.shadowRoot.querySelector('.modal');
                const backdrop = ninja.shadowRoot.querySelector('.backdrop');
                const input = ninja.shadowRoot.querySelector('input');
                
                result.shadowModal = !!modal;
                result.shadowBackdrop = !!backdrop;
                result.shadowInput = !!input;
                
                if (modal) {
                    result.modalClasses = Array.from(modal.classList);
                    result.modalOpacity = window.getComputedStyle(modal).opacity;
                    result.modalDisplay = window.getComputedStyle(modal).display;
                    result.modalVisibility = window.getComputedStyle(modal).visibility;
                    result.modalPointerEvents = window.getComputedStyle(modal).pointerEvents;
                }
                if (backdrop) {
                    result.backdropOpacity = window.getComputedStyle(backdrop).opacity;
                    result.backdropDisplay = window.getComputedStyle(backdrop).display;
                    result.backdropVisibility = window.getComputedStyle(backdrop).visibility;
                    result.backdropPointerEvents = window.getComputedStyle(backdrop).pointerEvents;
                }
                if (input) {
                    result.inputValue = input.value;
                    result.inputFocused = input === ninja.shadowRoot.activeElement;
                }
            }
            
            return result;
        }''')
        
        print(f"After command execution: {after_command_state}")
        
        # Determine if bug is present
        palette_stuck = False
        
        # Check multiple indicators to see if palette is stuck
        if after_command_state['shadowBackdrop']:
            print("🔍 ANALYSIS: Backdrop element still exists")
            palette_stuck = True
        
        if after_command_state['shadowModal'] and after_command_state['modalOpacity'] != '0':
            print("🔍 ANALYSIS: Modal still visible (opacity > 0)")
            palette_stuck = True
        
        if after_command_state['hasVisibleAttr']:
            print("🔍 ANALYSIS: Visible attribute still present")
            palette_stuck = True
        
        if palette_stuck:
            print("\n🐛 BUG REPRODUCED: Command palette is stuck on screen!")
        else:
            print("\n✅ NO BUG: Command palette closed properly")
        
        print("\n=== STEP 6: Test keyboard navigation after command ===")
        
        # Click on gantt to ensure focus
        await page.click('#gantt_here')
        await page.wait_for_timeout(300)
        
        # Try to navigate with arrow keys
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(200)
        
        # Check if navigation worked
        navigation_state = await page.evaluate('''() => {
            return {
                selectedTask: gantt.getSelectedId(),
                activeElement: document.activeElement.tagName + (document.activeElement.id ? '#' + document.activeElement.id : ''),
                paletteStillBlocking: window.isCommandPaletteOpen || false
            };
        }''')
        
        print(f"Navigation test: {navigation_state}")
        
        if navigation_state['selectedTask']:
            print("✅ Keyboard navigation works")
        else:
            print("❌ Keyboard navigation blocked")
        
        print("\n=== STEP 7: Test Escape key to close stuck palette ===")
        
        if palette_stuck:
            print("Attempting to close stuck palette with Escape...")
            await page.keyboard.press('Escape')
            await page.wait_for_timeout(500)
            
            # Check if Escape fixed it
            escape_state = await page.evaluate('''() => {
                const ninja = document.getElementById('commandPalette');
                if (ninja && ninja.shadowRoot) {
                    const backdrop = ninja.shadowRoot.querySelector('.backdrop');
                    const modal = ninja.shadowRoot.querySelector('.modal');
                    return {
                        hasBackdrop: !!backdrop,
                        modalOpacity: modal ? window.getComputedStyle(modal).opacity : null,
                        hasVisibleAttr: ninja.hasAttribute('visible')
                    };
                }
                return { hasBackdrop: false, modalOpacity: null, hasVisibleAttr: false };
            }''')
            
            print(f"After Escape: {escape_state}")
            
            if not escape_state['hasBackdrop'] and escape_state['modalOpacity'] == '0':
                print("✅ Escape key fixed the stuck palette")
            else:
                print("❌ Escape key did not fix the stuck palette")
        
        print("\n=== SUMMARY ===")
        if palette_stuck:
            print("🐛 BUG CONFIRMED: Command palette gets stuck after 'collapse all'")
            print("   - Backdrop element remains in DOM")
            print("   - Modal may still be visible")
            print("   - May interfere with keyboard navigation")
        else:
            print("✅ NO BUG DETECTED: Command palette behaves correctly")
        
        print("\nTest completed. Browser will stay open for 10 seconds for manual verification...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_command_palette_bug())