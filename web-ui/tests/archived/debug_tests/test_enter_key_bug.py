#!/usr/bin/env python3
"""
Test to replicate the Enter key bug in command palette
- First command (overdue tasks) works
- Second command (clear filters) Enter key doesn't work
"""

import asyncio
from playwright.async_api import async_playwright

async def test_enter_key_bug():
    """Test that reproduces the Enter key bug on second palette usage"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        page = await browser.new_page()
        
        # Collect all console messages with real-time logging
        console_messages = []
        def log_console(msg):
            formatted_msg = f'[{msg.type.upper()}] {msg.text}'
            console_messages.append(formatted_msg)
            # Print KeyboardManager and Enter key messages in real-time
            if ('KeyboardManager' in msg.text or 'Enter' in msg.text or 
                '🔍' in msg.text or '⚠️' in msg.text or '🔄' in msg.text):
                print(f"CONSOLE: {formatted_msg}")
        
        page.on('console', log_console)
        
        # Also capture page errors
        page.on('pageerror', lambda error: print(f'❌ PAGE ERROR: {error}'))
        
        print("Loading application...")
        await page.goto('http://localhost:8001')
        await page.wait_for_timeout(3000)
        
        # Focus gantt
        await page.click('#gantt_here')
        await page.wait_for_timeout(500)
        
        print("\n=== FIRST COMMAND: 'overdue tasks' (should work) ===")
        
        # Open command palette
        await page.keyboard.press('Control+Shift+p')
        await page.wait_for_timeout(1000)
        
        # Type 'over' to find overdue tasks
        await page.keyboard.type('over')
        await page.wait_for_timeout(500)
        
        # Press Enter - this should work
        print("Pressing Enter for 'overdue tasks' command...")
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(2000)
        
        # Check if the command executed (palette should be closed)
        palette_closed = await page.evaluate('''() => {
            const ninja = document.getElementById('commandPalette');
            return !ninja.hasAttribute('visible');
        }''')
        
        if palette_closed:
            print("✅ First command executed successfully - palette closed")
        else:
            print("❌ First command failed - palette still open")
            
        print("\n=== SECOND COMMAND: 'clear' (Enter key bug occurs here) ===")
        
        # Open command palette again
        await page.keyboard.press('Control+Shift+p')
        await page.wait_for_timeout(1000)
        
        # Type 'clear' to find clear filters command
        await page.keyboard.type('clear')
        await page.wait_for_timeout(500)
        
        # Check if clear command is found and highlighted
        clear_command_found = await page.evaluate('''() => {
            const ninja = document.getElementById('commandPalette');
            if (!ninja || !ninja.shadowRoot) return false;
            
            const items = ninja.shadowRoot.querySelectorAll('.ninja-option');
            for (let item of items) {
                if (item.textContent.toLowerCase().includes('clear')) {
                    return item.classList.contains('ninja-selected') || 
                           item.hasAttribute('selected') ||
                           item.getAttribute('aria-selected') === 'true';
                }
            }
            return false;
        }''')
        
        print(f"Clear command found and selected: {clear_command_found}")
        
        # Press Enter - this is where the bug occurs
        print("Pressing Enter for 'clear filters' command...")
        
        # Try multiple times to replicate the bug
        for attempt in range(1, 4):
            print(f"  Attempt {attempt}: Pressing Enter...")
            
            # Get pre-press state
            pre_state = await page.evaluate('''() => {
                const ninja = document.getElementById('commandPalette');
                return {
                    hasVisible: ninja.hasAttribute('visible'),
                    activeElement: document.activeElement ? {
                        tag: document.activeElement.tagName,
                        id: document.activeElement.id
                    } : null,
                    kmState: window.keyboardManager ? window.keyboardManager.getCurrentState() : 'no-km'
                };
            }''')
            print(f"    Pre-Enter state: {pre_state}")
            
            await page.keyboard.press('Enter')
            await page.wait_for_timeout(1000)  # Give more time for processing
            
            # Get post-press state
            post_state = await page.evaluate('''() => {
                const ninja = document.getElementById('commandPalette');
                return {
                    hasVisible: ninja.hasAttribute('visible'),
                    activeElement: document.activeElement ? {
                        tag: document.activeElement.tagName,
                        id: document.activeElement.id
                    } : null,
                    kmState: window.keyboardManager ? window.keyboardManager.getCurrentState() : 'no-km'
                };
            }''')
            print(f"    Post-Enter state: {post_state}")
            
            # Check if palette closed
            closed = not post_state['hasVisible']
            if closed:
                print(f"  ✅ Command executed on attempt {attempt}")
                break
            else:
                print(f"  ❌ Enter key failed on attempt {attempt}")
                
        await page.wait_for_timeout(500)
        
        # Check if the command executed (palette should be closed)
        palette_closed_second = await page.evaluate('''() => {
            const ninja = document.getElementById('commandPalette');
            return !ninja.hasAttribute('visible');
        }''')
        
        if palette_closed_second:
            print("✅ Second command executed successfully - palette closed")
        else:
            print("❌ BUG REPRODUCED: Second command failed - palette still open")
            
        print("\n=== DEBUGGING INFO ===")
        
        # Get detailed state info
        debug_info = await page.evaluate('''() => {
            const ninja = document.getElementById('commandPalette');
            return {
                ninjaExists: !!ninja,
                hasVisible: ninja ? ninja.hasAttribute('visible') : false,
                activeElement: document.activeElement ? {
                    tag: document.activeElement.tagName,
                    id: document.activeElement.id,
                    isNinja: document.activeElement === ninja
                } : null,
                shadowRoot: ninja && ninja.shadowRoot ? {
                    modal: !!ninja.shadowRoot.querySelector('.modal'),
                    modalOpacity: ninja.shadowRoot.querySelector('.modal')?.style.opacity || 'not set',
                    backdrop: !!ninja.shadowRoot.querySelector('.backdrop')
                } : null
            };
        }''')
        
        print("Debug info:", debug_info)
        
        print("\n=== CONSOLE MESSAGES (all Enter and debugging) ===")
        for msg in console_messages:
            if ('Enter' in msg or 'enter' in msg.lower() or 
                '🔍' in msg or '⚠️' in msg or '🔄' in msg or
                'ninja-keys' in msg.lower() or 'focused' in msg.lower()):
                print(msg)
        
        print("\nTest completed. Browser will stay open for 10 seconds for manual inspection...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_enter_key_bug())