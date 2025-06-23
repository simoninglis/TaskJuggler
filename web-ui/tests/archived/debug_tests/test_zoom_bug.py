#!/usr/bin/env python3
"""
Test to reproduce and verify fix for zoom quarter scale bug
"""

import asyncio
from playwright.async_api import async_playwright
import re

async def test_zoom_quarter_bug():
    """Test that zooming to quarter level displays correctly"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=200)
        page = await browser.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.text}'))
        
        print("Loading application...")
        await page.goto('http://localhost:8001')
        await page.wait_for_timeout(3000)  # Wait for gantt to load
        
        # Click on gantt to focus it
        await page.click('#gantt_here')
        await page.wait_for_timeout(500)
        
        print("\nTesting zoom levels...")
        
        # Start from day view (default)
        current_zoom = "day"
        print(f"Starting zoom level: {current_zoom}")
        
        # Test zooming out to each level
        zoom_levels = ["day", "week", "month", "quarter", "year"]
        
        for i in range(len(zoom_levels) - 1):
            print(f"\nZooming out from {zoom_levels[i]} to {zoom_levels[i+1]}...")
            
            # Press minus key to zoom out
            await page.keyboard.press('-')
            await page.wait_for_timeout(1000)
            
            # Get the current scale text
            scale_text = await page.evaluate('''() => {
                // Find all scale unit cells
                const scaleCells = document.querySelectorAll('.gantt_scale_cell');
                const scaleTexts = [];
                
                // Get text from first few cells
                for (let i = 0; i < Math.min(5, scaleCells.length); i++) {
                    scaleTexts.push(scaleCells[i].textContent.trim());
                }
                
                return {
                    scaleTexts: scaleTexts,
                    currentZoom: currentZoom,
                    scaleUnit: gantt.config.scale_unit,
                    dateScale: gantt.config.date_scale
                };
            }''')
            
            print(f"Scale unit: {scale_text['scaleUnit']}")
            print(f"Date format: {scale_text['dateScale']}")
            print(f"Sample scale texts: {scale_text['scaleTexts']}")
            
            # Check for the bug pattern
            if scale_text['scaleUnit'] == 'quarter':
                print("\n=== QUARTER SCALE CHECK ===")
                
                # Look for the Q%q pattern
                has_bug = any('Q%q' in text for text in scale_text['scaleTexts'])
                
                if has_bug:
                    print("✗ BUG FOUND: Quarter scale shows 'Q%q' pattern")
                    print(f"Actual texts: {scale_text['scaleTexts']}")
                else:
                    # Check if it's showing proper quarter format
                    has_proper_format = any(re.match(r'Q[1-4]\s+\d{4}', text) for text in scale_text['scaleTexts'])
                    if has_proper_format:
                        print("✓ SUCCESS: Quarter scale shows proper format (e.g., 'Q1 2025')")
                    else:
                        print("? UNKNOWN: Quarter scale format not recognized")
                        print(f"Actual texts: {scale_text['scaleTexts']}")
        
        # Test zooming back in
        print("\n\nTesting zoom in...")
        for i in range(3):
            await page.keyboard.press('+')
            await page.wait_for_timeout(500)
        
        # Get final state
        final_scale = await page.evaluate('''() => {
            return {
                scaleUnit: gantt.config.scale_unit,
                dateScale: gantt.config.date_scale
            };
        }''')
        
        print(f"\nFinal zoom level: {final_scale['scaleUnit']}")
        
        print("\nTest completed. Browser will stay open for 10 seconds...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_zoom_quarter_bug())