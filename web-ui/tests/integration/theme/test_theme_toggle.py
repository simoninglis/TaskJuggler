#!/usr/bin/env python3
"""
Test theme toggle functionality (dark/light mode)
"""

import asyncio
from playwright.async_api import async_playwright

async def test_theme_toggle():
    """Test the theme toggle button and persistence"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=200)
        page = await browser.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.text}'))
        
        print("Loading application...")
        await page.goto('http://localhost:8001')
        await page.wait_for_timeout(2000)  # Wait for app to load
        
        print("\n=== Test 1: Initial theme state ===")
        
        # Check initial theme
        initial_theme = await page.evaluate('''() => {
            const body = document.body;
            const isDark = body.classList.contains('dark-theme');
            const stored = localStorage.getItem('theme');
            const icon = document.getElementById('themeIcon');
            
            return {
                isDark: isDark,
                storedTheme: stored,
                iconText: icon ? icon.textContent : null,
                bodyClass: body.className
            };
        }''')
        
        print(f"Initial theme state: {initial_theme}")
        
        print("\n=== Test 2: Click theme toggle button ===")
        
        # Click the theme toggle button
        await page.click('#themeToggle')
        await page.wait_for_timeout(500)
        
        # Check theme after toggle
        after_toggle = await page.evaluate('''() => {
            const body = document.body;
            const isDark = body.classList.contains('dark-theme');
            const stored = localStorage.getItem('theme');
            const icon = document.getElementById('themeIcon');
            
            return {
                isDark: isDark,
                storedTheme: stored,
                iconText: icon ? icon.textContent : null
            };
        }''')
        
        print(f"After toggle: {after_toggle}")
        
        # Verify theme changed
        if initial_theme['isDark'] != after_toggle['isDark']:
            print("✓ SUCCESS: Theme toggled successfully")
        else:
            print("✗ FAIL: Theme did not toggle")
        
        # Verify localStorage updated
        if after_toggle['storedTheme'] == ('dark' if after_toggle['isDark'] else 'light'):
            print("✓ SUCCESS: Theme saved to localStorage")
        else:
            print("✗ FAIL: Theme not saved correctly")
        
        # Verify icon changed
        if initial_theme['iconText'] != after_toggle['iconText']:
            print("✓ SUCCESS: Theme icon updated")
        else:
            print("✗ FAIL: Theme icon did not update")
        
        print("\n=== Test 3: Theme persistence across reload ===")
        
        # Remember current theme
        theme_before_reload = after_toggle['isDark']
        
        # Reload the page
        await page.reload()
        await page.wait_for_timeout(2000)
        
        # Check theme after reload
        after_reload = await page.evaluate('''() => {
            const body = document.body;
            const isDark = body.classList.contains('dark-theme');
            const stored = localStorage.getItem('theme');
            
            return {
                isDark: isDark,
                storedTheme: stored
            };
        }''')
        
        print(f"After reload: {after_reload}")
        
        if after_reload['isDark'] == theme_before_reload:
            print("✓ SUCCESS: Theme persisted after reload")
        else:
            print("✗ FAIL: Theme did not persist")
        
        print("\n=== Test 4: Theme affects Gantt chart ===")
        
        # Check if Gantt has dark theme styles
        gantt_theme = await page.evaluate('''() => {
            const ganttEl = document.getElementById('gantt_here');
            const styles = window.getComputedStyle(ganttEl);
            const bgColor = styles.backgroundColor;
            const isDark = document.body.classList.contains('dark-theme');
            
            // Get a task bar color
            const taskBar = document.querySelector('.gantt_task_line');
            const taskColor = taskBar ? window.getComputedStyle(taskBar).backgroundColor : null;
            
            return {
                isDark: isDark,
                ganttBg: bgColor,
                taskColor: taskColor
            };
        }''')
        
        print(f"Gantt theme: {gantt_theme}")
        
        # Toggle theme again to compare
        await page.click('#themeToggle')
        await page.wait_for_timeout(500)
        
        gantt_theme_after = await page.evaluate('''() => {
            const ganttEl = document.getElementById('gantt_here');
            const styles = window.getComputedStyle(ganttEl);
            const bgColor = styles.backgroundColor;
            
            const taskBar = document.querySelector('.gantt_task_line');
            const taskColor = taskBar ? window.getComputedStyle(taskBar).backgroundColor : null;
            
            return {
                ganttBg: bgColor,
                taskColor: taskColor
            };
        }''')
        
        if gantt_theme['ganttBg'] != gantt_theme_after['ganttBg']:
            print("✓ SUCCESS: Gantt background changes with theme")
        else:
            print("✗ FAIL: Gantt background does not change")
        
        print("\n=== Test 5: Theme toggle via command palette ===")
        
        # Open command palette
        await page.keyboard.press('Control+k')
        await page.wait_for_timeout(500)
        
        # Search for theme command
        await page.keyboard.type('theme')
        await page.wait_for_timeout(300)
        
        # Check if theme command exists
        theme_command = await page.evaluate('''() => {
            const items = document.querySelectorAll('.command-item');
            const themeCmd = Array.from(items).find(item => 
                item.textContent.toLowerCase().includes('dark mode')
            );
            return !!themeCmd;
        }''')
        
        if theme_command:
            print("✓ SUCCESS: Theme toggle command found in palette")
            
            # Execute the command
            await page.keyboard.press('Enter')
            await page.wait_for_timeout(500)
            
            # Verify theme toggled
            final_theme = await page.evaluate('() => document.body.classList.contains("dark-theme")')
            print(f"Theme after command: {'dark' if final_theme else 'light'}")
        else:
            print("✗ FAIL: Theme toggle command not found")
            await page.keyboard.press('Escape')
        
        print("\n\nAll tests completed. Browser will stay open for 10 seconds...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_theme_toggle())