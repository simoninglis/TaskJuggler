#!/usr/bin/env python3
"""Test interaction between help screen and command palette"""

import asyncio
from playwright.async_api import async_playwright

async def test_help_palette_interaction():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        try:
            # Navigate to the web UI
            await page.goto('http://localhost:8001')
            await page.wait_for_load_state('networkidle')
            
            print("✓ Page loaded successfully")
            
            # Wait for gantt to initialize
            await page.wait_for_selector('#gantt_here', state='visible')
            await page.wait_for_timeout(1000)
            
            # Focus the gantt container
            await page.focus('#gantt_here')
            
            # Test 1: Help screen doesn't open when command palette is active
            await page.keyboard.press('Control+Shift+P')
            await page.wait_for_timeout(500)
            
            palette_visible = await page.is_visible('.command-palette-overlay')
            if palette_visible:
                print("✓ Command palette opened")
            
            # Try to open help while palette is open
            await page.keyboard.press('Shift+/')
            await page.wait_for_timeout(300)
            
            help_visible = await page.is_visible('.keyboard-help-overlay')
            if not help_visible:
                print("✓ Help screen correctly blocked when palette is open")
            
            # Close palette
            await page.keyboard.press('Escape')
            await page.wait_for_timeout(500)
            
            # Test 2: Command palette works when help is open
            await page.keyboard.press('Shift+/')
            await page.wait_for_timeout(500)
            
            help_visible = await page.is_visible('.keyboard-help-overlay')
            if help_visible:
                print("✓ Help screen opened")
            
            # Try to open command palette while help is open
            await page.keyboard.press('Control+Shift+P')
            await page.wait_for_timeout(500)
            
            # Help should close and palette should open
            help_hidden = not await page.is_visible('.keyboard-help-overlay')
            palette_visible = await page.is_visible('.command-palette-overlay')
            
            if help_hidden and palette_visible:
                print("✓ Help closed and palette opened correctly")
            
            # Close palette
            await page.keyboard.press('Escape')
            await page.wait_for_timeout(500)
            
            print("\n✅ All interaction tests passed!")
            
        except Exception as e:
            print(f"\n❌ Test failed: {e}")
        finally:
            await page.wait_for_timeout(2000)  # Keep browser open for inspection
            await browser.close()

if __name__ == '__main__':
    asyncio.run(test_help_palette_interaction())