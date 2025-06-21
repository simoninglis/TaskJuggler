#!/usr/bin/env python3
"""
Test to understand how Ninja Keys indicates it's open
"""

import asyncio
from playwright.async_api import async_playwright

async def test_ninja_keys_state():
    """Check the actual state of Ninja Keys when open"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=200)
        page = await browser.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.text}'))
        
        print("Loading application...")
        await page.goto('http://localhost:8001')
        await page.wait_for_timeout(3000)
        
        # Focus gantt
        await page.click('#gantt_here')
        await page.wait_for_timeout(500)
        
        print("\n=== Checking Ninja Keys state BEFORE opening ===")
        
        # Check initial state
        initial_state = await page.evaluate('''() => {
            const ninja = document.getElementById('commandPalette');
            const result = {
                exists: !!ninja,
                hasVisibleAttr: ninja ? ninja.hasAttribute('visible') : false,
                attributes: ninja ? Array.from(ninja.attributes).map(a => a.name + '=' + a.value) : [],
                classList: ninja ? Array.from(ninja.classList) : [],
                shadowRoot: ninja ? !!ninja.shadowRoot : false
            };
            
            if (ninja && ninja.shadowRoot) {
                const modal = ninja.shadowRoot.querySelector('.modal');
                result.shadowModal = !!modal;
                if (modal) {
                    result.modalDisplay = modal.style.display;
                    result.modalClasses = Array.from(modal.classList);
                }
            }
            
            return result;
        }''')
        
        print(f"Initial state: {initial_state}")
        
        print("\n=== Opening command palette with Ctrl+K ===")
        
        # Open palette
        await page.keyboard.press('Control+k')
        await page.wait_for_timeout(500)
        
        # Check state after opening
        open_state = await page.evaluate('''() => {
            const ninja = document.getElementById('commandPalette');
            const result = {
                exists: !!ninja,
                hasVisibleAttr: ninja ? ninja.hasAttribute('visible') : false,
                attributes: ninja ? Array.from(ninja.attributes).map(a => a.name + '=' + a.value) : [],
                classList: ninja ? Array.from(ninja.classList) : [],
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
                    result.modalDisplay = modal.style.display;
                    result.modalClasses = Array.from(modal.classList);
                }
                
                if (backdrop) {
                    result.backdropDisplay = backdrop.style.display;
                }
                
                if (input) {
                    result.inputFocused = input === ninja.shadowRoot.activeElement;
                }
            }
            
            return result;
        }''')
        
        print(f"Open state: {open_state}")
        
        print("\n=== Testing keyboard input ===")
        
        # Type something
        await page.keyboard.type('test')
        await page.wait_for_timeout(300)
        
        # Check if text went to palette
        typed_state = await page.evaluate('''() => {
            const ninja = document.getElementById('commandPalette');
            if (ninja && ninja.shadowRoot) {
                const input = ninja.shadowRoot.querySelector('input');
                return {
                    inputValue: input ? input.value : null,
                    activeElement: document.activeElement.tagName
                };
            }
            return null;
        }''')
        
        print(f"After typing: {typed_state}")
        
        print("\n=== Closing palette ===")
        
        # Close with Escape
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(300)
        
        # Check final state
        closed_state = await page.evaluate('''() => {
            const ninja = document.getElementById('commandPalette');
            const result = {
                exists: !!ninja,
                hasVisibleAttr: ninja ? ninja.hasAttribute('visible') : false,
                attributes: ninja ? Array.from(ninja.attributes).map(a => a.name + '=' + a.value) : []
            };
            
            if (ninja && ninja.shadowRoot) {
                const modal = ninja.shadowRoot.querySelector('.modal');
                const visibleModal = ninja.shadowRoot.querySelector('.modal.visible');
                const backdrop = ninja.shadowRoot.querySelector('.backdrop');
                result.shadowModal = !!modal;
                result.shadowModalVisible = !!visibleModal;
                result.shadowBackdrop = !!backdrop;
                if (modal) {
                    result.modalDisplay = modal.style.display;
                    result.modalClasses = Array.from(modal.classList);
                    result.modalOpacity = window.getComputedStyle(modal).opacity;
                    result.modalVisibility = window.getComputedStyle(modal).visibility;
                }
                if (backdrop) {
                    result.backdropClasses = Array.from(backdrop.classList);
                    result.backdropOpacity = window.getComputedStyle(backdrop).opacity;
                }
            }
            
            return result;
        }''')
        
        print(f"Closed state: {closed_state}")
        
        print("\n\nTest completed. Browser will stay open for 5 seconds...")
        await page.wait_for_timeout(5000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_ninja_keys_state())