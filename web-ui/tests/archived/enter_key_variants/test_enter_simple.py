#!/usr/bin/env python3
"""
Simple test for Enter key functionality
"""

import asyncio
from playwright.async_api import async_playwright

async def test_enter_key_simple():
    """Simple test focusing only on Enter key"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        page = await browser.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.text}'))
        
        print("Loading application...")
        await page.goto('http://localhost:8001')
        await page.wait_for_timeout(3000)  # Wait for gantt to load
        
        # Click on gantt to focus it
        await page.click('#gantt_here')
        await page.wait_for_timeout(500)
        
        print("\nTesting Enter key on project task...")
        
        # Make sure project task is selected
        await page.evaluate('() => { gantt.selectTask("project"); }')
        await page.wait_for_timeout(500)
        
        # Check initial state
        initial = await page.evaluate('''() => {
            const task = gantt.getTask("project");
            return { isOpen: task.$open };
        }''')
        print(f"Initial state: task is {'OPEN' if initial['isOpen'] else 'CLOSED'}")
        
        # Press Enter
        print("Pressing Enter key...")
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(1500)
        
        # Check new state
        after = await page.evaluate('''() => {
            const task = gantt.getTask("project");
            return { isOpen: task.$open };
        }''')
        print(f"After Enter: task is {'OPEN' if after['isOpen'] else 'CLOSED'}")
        
        if initial['isOpen'] != after['isOpen']:
            print("✓ SUCCESS: Enter key toggled the state!")
        else:
            print("✗ FAIL: Enter key did not change the state")
            
        # Wait before closing
        await page.wait_for_timeout(5000)
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_enter_key_simple())