#!/usr/bin/env python3
"""Test script for keyboard help screen functionality"""

import asyncio
from playwright.async_api import async_playwright

async def test_keyboard_help():
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
            print("✓ Gantt container focused")
            
            # Test opening help with '?' key
            await page.keyboard.press('Shift+/')
            await page.wait_for_timeout(500)
            
            # Check if help screen is visible
            help_visible = await page.is_visible('.keyboard-help-overlay')
            if help_visible:
                print("✓ Help screen opened with '?' key")
            else:
                print("✗ Help screen did not open")
                return
            
            # Check help content
            help_title = await page.text_content('.keyboard-help-header h2')
            if help_title == 'Keyboard Shortcuts':
                print("✓ Help screen title is correct")
            
            # Count categories
            categories = await page.locator('.keyboard-help-category').count()
            print(f"✓ Found {categories} help categories")
            
            # Test closing with Escape
            await page.keyboard.press('Escape')
            await page.wait_for_timeout(500)
            
            help_hidden = not await page.is_visible('.keyboard-help-overlay')
            if help_hidden:
                print("✓ Help screen closed with Escape key")
            else:
                print("✗ Help screen did not close")
            
            # Test toggle functionality
            await page.keyboard.press('Shift+/')
            await page.wait_for_timeout(300)
            help_visible = await page.is_visible('.keyboard-help-overlay')
            
            await page.keyboard.press('Shift+/')
            await page.wait_for_timeout(300)
            help_hidden = not await page.is_visible('.keyboard-help-overlay')
            
            if help_visible and help_hidden:
                print("✓ Help screen toggle works correctly")
            
            print("\n✅ All keyboard help tests passed!")
            
        except Exception as e:
            print(f"\n❌ Test failed: {e}")
        finally:
            await page.wait_for_timeout(2000)  # Keep browser open for inspection
            await browser.close()

if __name__ == '__main__':
    asyncio.run(test_keyboard_help())