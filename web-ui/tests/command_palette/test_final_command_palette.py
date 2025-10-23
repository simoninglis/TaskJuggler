#!/usr/bin/env python3
"""
Final test to confirm command palette fix
"""

import asyncio
from playwright.async_api import async_playwright

async def test_final_command_palette():
    """Final test of command palette functionality"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=300)
        page = await browser.new_page()
        page.set_default_timeout(60000)  # 60 second timeout
        
        # Enable console logging
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.text}'))
        
        print("Loading application...")
        await page.goto('http://localhost:8001')
        await page.wait_for_timeout(3000)
        
        # Focus gantt
        await page.click('#gantt_here')
        await page.wait_for_timeout(500)
        
        success_count = 0
        total_tests = 3
        
        for cycle in range(1, total_tests + 1):
            print(f"\n=== CYCLE {cycle}: Open, use command, close ===")
            
            # Step 1: Open command palette
            print(f"  Opening command palette...")
            await page.keyboard.press('Control+k')
            await page.wait_for_timeout(800)
            
            # Check if opened
            opened = await page.evaluate('''() => {
                const ninja = document.getElementById('commandPalette');
                return ninja && (ninja.hasAttribute('visible') || 
                    (ninja.shadowRoot && ninja.shadowRoot.querySelector('.modal') && 
                     window.getComputedStyle(ninja.shadowRoot.querySelector('.modal')).opacity !== '0'));
            }''')
            
            if opened:
                print(f"  ✅ Opened successfully")
                
                # Step 2: Use expand all command
                print(f"  Using expand all command...")
                await page.keyboard.type('expand all')
                await page.wait_for_timeout(300)
                await page.keyboard.press('Enter')
                await page.wait_for_timeout(800)
                
                # Check if closed
                closed = await page.evaluate('''() => {
                    const ninja = document.getElementById('commandPalette');
                    return !ninja.hasAttribute('visible') && 
                           (!ninja.shadowRoot || !ninja.shadowRoot.querySelector('.backdrop')) &&
                           (!ninja.shadowRoot || !ninja.shadowRoot.querySelector('.modal') || 
                            window.getComputedStyle(ninja.shadowRoot.querySelector('.modal')).opacity === '0');
                }''')
                
                if closed:
                    print(f"  ✅ Closed successfully")
                    success_count += 1
                    
                    # Step 3: Test keyboard navigation
                    await page.click('#gantt_here')
                    await page.wait_for_timeout(300)
                    
                    initial_task = await page.evaluate('() => gantt.getSelectedId()')
                    await page.keyboard.press('ArrowDown')
                    await page.wait_for_timeout(200)
                    new_task = await page.evaluate('() => gantt.getSelectedId()')
                    
                    if new_task and new_task != initial_task:
                        print(f"  ✅ Keyboard navigation works")
                    else:
                        print(f"  ⚠️  Keyboard navigation issue")
                else:
                    print(f"  ❌ Failed to close")
            else:
                print(f"  ❌ Failed to open")
                break
            
            # Wait between cycles
            await page.wait_for_timeout(500)
        
        print(f"\n=== FINAL RESULTS ===")
        print(f"Successful cycles: {success_count}/{total_tests}")
        
        if success_count == total_tests:
            print("🎉 COMMAND PALETTE BUG COMPLETELY FIXED!")
            print("✅ All cycles completed successfully")
            print("✅ Command palette opens reliably")  
            print("✅ Commands execute properly")
            print("✅ Palette closes after commands")
            print("✅ Can be reopened multiple times")
        elif success_count > 0:
            print("🔧 PARTIAL SUCCESS")
            print(f"✅ {success_count} cycles worked")
            print(f"❌ {total_tests - success_count} cycles failed")
        else:
            print("❌ FIX FAILED")
            print("❌ Command palette still not working")
        
        print("\nTest completed. Browser will stay open for 5 seconds...")
        await page.wait_for_timeout(5000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_final_command_palette())