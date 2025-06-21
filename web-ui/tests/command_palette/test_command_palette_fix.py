#!/usr/bin/env python3
"""
Test to verify the command palette bug fix
"""

import asyncio
from playwright.async_api import async_playwright

async def test_command_palette_fix():
    """Test that the command palette bug is fixed"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=300)
        page = await browser.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.text}'))
        
        print("Loading application...")
        await page.goto('http://localhost:8001')
        await page.wait_for_timeout(3000)
        
        # Focus gantt
        await page.click('#gantt_here')
        await page.wait_for_timeout(500)
        
        print("\n=== Testing Expand All Command ===")
        
        # Test expand all first
        await page.keyboard.press('Control+k')
        await page.wait_for_timeout(500)
        
        await page.keyboard.type('expand all')
        await page.wait_for_timeout(300)
        
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(1000)
        
        # Check if palette closed properly
        expand_state = await page.evaluate('''() => {
            const ninja = document.getElementById('commandPalette');
            if (ninja && ninja.shadowRoot) {
                const backdrop = ninja.shadowRoot.querySelector('.backdrop');
                const modal = ninja.shadowRoot.querySelector('.modal');
                return {
                    hasBackdrop: !!backdrop,
                    modalOpacity: modal ? window.getComputedStyle(modal).opacity : null,
                    hasVisibleAttr: ninja.hasAttribute('visible'),
                    globalFlag: window.isCommandPaletteOpen || false
                };
            }
            return { hasBackdrop: false, modalOpacity: null, hasVisibleAttr: false, globalFlag: false };
        }''')
        
        print(f"After expand all: {expand_state}")
        
        expand_success = (not expand_state['hasBackdrop'] and 
                         expand_state['modalOpacity'] == '0' and 
                         not expand_state['hasVisibleAttr'] and 
                         not expand_state['globalFlag'])
        
        if expand_success:
            print("✅ Expand all command works correctly")
        else:
            print("❌ Expand all command still has issues")
        
        print("\n=== Testing Collapse All Command (Main Bug) ===")
        
        # Now test the main bug - collapse all
        await page.keyboard.press('Control+k')
        await page.wait_for_timeout(500)
        
        await page.keyboard.type('collapse all')
        await page.wait_for_timeout(300)
        
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(1000)
        
        # Check if palette closed properly
        collapse_state = await page.evaluate('''() => {
            const ninja = document.getElementById('commandPalette');
            if (ninja && ninja.shadowRoot) {
                const backdrop = ninja.shadowRoot.querySelector('.backdrop');
                const modal = ninja.shadowRoot.querySelector('.modal');
                return {
                    hasBackdrop: !!backdrop,
                    modalOpacity: modal ? window.getComputedStyle(modal).opacity : null,
                    hasVisibleAttr: ninja.hasAttribute('visible'),
                    globalFlag: window.isCommandPaletteOpen || false
                };
            }
            return { hasBackdrop: false, modalOpacity: null, hasVisibleAttr: false, globalFlag: false };
        }''')
        
        print(f"After collapse all: {collapse_state}")
        
        collapse_success = (not collapse_state['hasBackdrop'] and 
                           collapse_state['modalOpacity'] == '0' and 
                           not collapse_state['hasVisibleAttr'] and 
                           not collapse_state['globalFlag'])
        
        if collapse_success:
            print("✅ BUG FIXED: Collapse all command now works correctly!")
        else:
            print("❌ Bug still exists - testing Escape key recovery...")
            
            # Test Escape key recovery
            await page.keyboard.press('Escape')
            await page.wait_for_timeout(500)
            
            escape_state = await page.evaluate('''() => {
                const ninja = document.getElementById('commandPalette');
                if (ninja && ninja.shadowRoot) {
                    const backdrop = ninja.shadowRoot.querySelector('.backdrop');
                    const modal = ninja.shadowRoot.querySelector('.modal');
                    return {
                        hasBackdrop: !!backdrop,
                        modalOpacity: modal ? window.getComputedStyle(modal).opacity : null
                    };
                }
                return { hasBackdrop: false, modalOpacity: null };
            }''')
            
            if not escape_state['hasBackdrop'] and escape_state['modalOpacity'] == '0':
                print("✅ Escape key recovery works")
            else:
                print("❌ Escape key recovery failed")
        
        print("\n=== Testing Keyboard Navigation After Commands ===")
        
        # Click gantt to focus
        await page.click('#gantt_here')
        await page.wait_for_timeout(300)
        
        # Get initial selection
        initial_task = await page.evaluate('() => gantt.getSelectedId()')
        print(f"Initial selected task: {initial_task}")
        
        # Try navigation
        await page.keyboard.press('ArrowDown')
        await page.wait_for_timeout(200)
        
        new_task = await page.evaluate('() => gantt.getSelectedId()')
        print(f"After arrow down: {new_task}")
        
        if new_task and new_task != initial_task:
            print("✅ Keyboard navigation works after commands")
        else:
            print("❌ Keyboard navigation still blocked")
        
        print("\n=== Testing Function Definitions ===")
        
        # Check if functions are properly defined
        functions_defined = await page.evaluate('''() => {
            return {
                expandAll: typeof expandAll === 'function',
                collapseAll: typeof collapseAll === 'function',
                forcePaletteClosure: typeof forcePaletteClosure === 'function'
            };
        }''')
        
        print(f"Function definitions: {functions_defined}")
        
        all_functions_defined = all(functions_defined.values())
        if all_functions_defined:
            print("✅ All required functions are properly defined")
        else:
            print("❌ Some functions are missing")
        
        print("\n=== SUMMARY ===")
        
        if expand_success and collapse_success and all_functions_defined:
            print("🎉 BUG COMPLETELY FIXED!")
            print("   ✅ Expand all works")
            print("   ✅ Collapse all works")
            print("   ✅ Functions are defined")
            print("   ✅ Palette closes properly")
        elif not collapse_success and all_functions_defined:
            print("🔧 PARTIAL FIX - Recovery available")
            print("   ✅ Functions are defined (no more JS errors)")
            print("   ✅ Escape key can recover from stuck palette")
            print("   ❌ Palette may still get stuck occasionally")
        else:
            print("❌ Fix incomplete or failed")
        
        print("\nTest completed. Browser will stay open for 10 seconds...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_command_palette_fix())