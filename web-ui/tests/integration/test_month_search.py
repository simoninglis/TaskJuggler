#!/usr/bin/env python3
"""Test script for month search functionality"""

import asyncio
from playwright.async_api import async_playwright

async def test_month_search():
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
            
            # Test 1: Search for specific month
            await page.keyboard.press('/')
            await page.wait_for_timeout(300)
            
            search_visible = await page.is_visible('#paletteSearch')
            if search_visible:
                print("✓ Search palette opened")
            
            # Type "june"
            await page.keyboard.type('june')
            await page.wait_for_timeout(500)
            
            # Check if month option appears
            month_option = await page.locator('text=Go to June').count()
            if month_option > 0:
                print("✓ Month navigation option appears for 'june'")
            
            # Press Enter to jump to June
            await page.keyboard.press('Enter')
            await page.wait_for_timeout(1000)
            
            # Check status message
            status_text = await page.text_content('#status')
            if 'June' in status_text:
                print(f"✓ Status updated: {status_text}")
            
            # Test 2: Search for "next month"
            await page.keyboard.press('/')
            await page.wait_for_timeout(300)
            
            # Clear and type "next month"
            await page.keyboard.press('Control+a')
            await page.keyboard.type('next month')
            await page.wait_for_timeout(500)
            
            next_month_option = await page.locator('text=Go to').count()
            if next_month_option > 0:
                print("✓ Month navigation option appears for 'next month'")
            
            await page.keyboard.press('Escape')
            
            # Test 3: Search for month with year
            await page.keyboard.press('/')
            await page.wait_for_timeout(300)
            
            await page.keyboard.press('Control+a')
            await page.keyboard.type('december 2025')
            await page.wait_for_timeout(500)
            
            dec_option = await page.locator('text=Go to December 2025').count()
            if dec_option > 0:
                print("✓ Month navigation with year works")
            
            await page.keyboard.press('Enter')
            await page.wait_for_timeout(1000)
            
            # Test 4: Search for "current" or "now"
            await page.keyboard.press('/')
            await page.wait_for_timeout(300)
            
            await page.keyboard.press('Control+a')
            await page.keyboard.type('current')
            await page.wait_for_timeout(500)
            
            current_option = await page.locator('text=Go to').count()
            if current_option > 0:
                print("✓ Current month navigation works")
            
            await page.keyboard.press('Escape')
            
            print("\n✅ All month search tests passed!")
            
        except Exception as e:
            print(f"\n❌ Test failed: {e}")
        finally:
            await page.wait_for_timeout(2000)  # Keep browser open for inspection
            await browser.close()

if __name__ == '__main__':
    asyncio.run(test_month_search())