#!/usr/bin/env python3
"""
Debug Ninja Keys behavior specifically
"""

import asyncio
from playwright.async_api import async_playwright

async def test_ninja_keys_debug():
    """Debug what's happening with Ninja Keys"""
    
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
            const ninja = document.getElementById('commandPalette');
            return {
                exists: !!ninja,
                hotkeys: ninja ? ninja.getAttribute('hotkeys') : null,
                data: ninja ? ninja.data?.length : null,
                visible: ninja ? ninja.hasAttribute('visible') : false,
                globalFlag: window.isCommandPaletteOpen
            };
        }''')
        print(f"Initial ninja state: {initial}")
        
        print("\n=== CYCLE 1: First open ===")
        
        # First open
        print("Pressing Ctrl+K...")
        await page.keyboard.press('Control+k')
        await page.wait_for_timeout(1000)
        
        after_first = await page.evaluate('''() => {
            const ninja = document.getElementById('commandPalette');
            return {
                visible: ninja ? ninja.hasAttribute('visible') : false,
                globalFlag: window.isCommandPaletteOpen,
                shadowModal: ninja && ninja.shadowRoot ? !!ninja.shadowRoot.querySelector('.modal') : false,
                modalOpacity: ninja && ninja.shadowRoot && ninja.shadowRoot.querySelector('.modal') ? 
                             window.getComputedStyle(ninja.shadowRoot.querySelector('.modal')).opacity : null,
                backdrop: ninja && ninja.shadowRoot ? !!ninja.shadowRoot.querySelector('.backdrop') : false
            };
        }''')
        
        print(f"After first Ctrl+K: {after_first}")
        
        if after_first['visible'] or after_first['backdrop']:
            print("✅ First open successful")
            
            print("Closing with Escape...")
            await page.keyboard.press('Escape')
            await page.wait_for_timeout(1000)
            
            after_close = await page.evaluate('''() => {
                const ninja = document.getElementById('commandPalette');
                return {
                    visible: ninja ? ninja.hasAttribute('visible') : false,
                    globalFlag: window.isCommandPaletteOpen,
                    shadowModal: ninja && ninja.shadowRoot ? !!ninja.shadowRoot.querySelector('.modal') : false,
                    modalOpacity: ninja && ninja.shadowRoot && ninja.shadowRoot.querySelector('.modal') ? 
                                 window.getComputedStyle(ninja.shadowRoot.querySelector('.modal')).opacity : null,
                    backdrop: ninja && ninja.shadowRoot ? !!ninja.shadowRoot.querySelector('.backdrop') : false
                };
            }''')
            
            print(f"After Escape: {after_close}")
            
            print("\n=== CYCLE 2: Second open attempt ===")
            
            # Try to open again
            print("Pressing Ctrl+K again...")
            await page.keyboard.press('Control+k')
            await page.wait_for_timeout(1000)
            
            after_second = await page.evaluate('''() => {
                const ninja = document.getElementById('commandPalette');
                return {
                    visible: ninja ? ninja.hasAttribute('visible') : false,
                    globalFlag: window.isCommandPaletteOpen,
                    shadowModal: ninja && ninja.shadowRoot ? !!ninja.shadowRoot.querySelector('.modal') : false,
                    modalOpacity: ninja && ninja.shadowRoot && ninja.shadowRoot.querySelector('.modal') ? 
                                 window.getComputedStyle(ninja.shadowRoot.querySelector('.modal')).opacity : null,
                    backdrop: ninja && ninja.shadowRoot ? !!ninja.shadowRoot.querySelector('.backdrop') : false
                };
            }''')
            
            print(f"After second Ctrl+K: {after_second}")
            
            if after_second['visible'] or after_second['backdrop']:
                print("✅ Second open successful - bug is fixed!")
            else:
                print("❌ Second open failed - bug still exists")
                
                print("\n=== DEBUGGING: Direct ninja-keys interaction ===")
                
                # Try to directly call ninja-keys methods
                direct_result = await page.evaluate('''() => {
                    const ninja = document.getElementById('commandPalette');
                    try {
                        // Try to directly set visible attribute
                        ninja.setAttribute('visible', '');
                        const afterDirect = {
                            visible: ninja.hasAttribute('visible'),
                            shadowModal: ninja.shadowRoot ? !!ninja.shadowRoot.querySelector('.modal') : false
                        };
                        return { success: true, afterDirect };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                }''')
                
                print(f"Direct attribute setting: {direct_result}")
                
                # Try dispatching the event manually
                print("Trying manual hotkey event...")
                await page.evaluate('''() => {
                    const ninja = document.getElementById('commandPalette');
                    const event = new KeyboardEvent('keydown', {
                        key: 'k',
                        ctrlKey: true,
                        bubbles: true,
                        cancelable: true
                    });
                    ninja.dispatchEvent(event);
                }''')
                
                await page.wait_for_timeout(500)
                
                manual_result = await page.evaluate('''() => {
                    const ninja = document.getElementById('commandPalette');
                    return {
                        visible: ninja ? ninja.hasAttribute('visible') : false,
                        shadowModal: ninja && ninja.shadowRoot ? !!ninja.shadowRoot.querySelector('.modal') : false
                    };
                }''')
                
                print(f"After manual event: {manual_result}")
                
        else:
            print("❌ First open failed")
        
        print("\nTest completed. Browser will stay open for 15 seconds...")
        await page.wait_for_timeout(15000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_ninja_keys_debug())