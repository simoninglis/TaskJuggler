#!/usr/bin/env python3
"""
Debug test for command palette state management during bug reproduction
"""

import asyncio
from playwright.async_api import async_playwright

async def test_command_palette_state_debug():
    """Detailed debugging of command palette state changes"""
    
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
        
        # Function to get detailed state
        async def get_detailed_state(step_name):
            state = await page.evaluate('''() => {
                const ninja = document.getElementById('commandPalette');
                const result = {
                    timestamp: new Date().toISOString(),
                    globalFlag: window.isCommandPaletteOpen || false,
                    activeElement: document.activeElement.tagName + (document.activeElement.id ? '#' + document.activeElement.id : ''),
                    exists: !!ninja
                };
                
                if (!ninja) return result;
                
                // Light DOM attributes
                result.lightDOM = {
                    hasVisible: ninja.hasAttribute('visible'),
                    visibleValue: ninja.getAttribute('visible'),
                    classList: Array.from(ninja.classList),
                    allAttributes: Array.from(ninja.attributes).map(a => a.name + '=' + (a.value || ''))
                };
                
                // Shadow DOM analysis
                if (ninja.shadowRoot) {
                    const shadow = ninja.shadowRoot;
                    result.shadowDOM = {
                        exists: true,
                        activeElement: shadow.activeElement ? shadow.activeElement.tagName + (shadow.activeElement.className ? '.' + shadow.activeElement.className : '') : null
                    };
                    
                    // Find all relevant elements
                    const modal = shadow.querySelector('.modal');
                    const backdrop = shadow.querySelector('.backdrop');
                    const input = shadow.querySelector('input');
                    const visibleModal = shadow.querySelector('.modal.visible');
                    
                    result.shadowDOM.elements = {
                        modal: !!modal,
                        backdrop: !!backdrop,
                        input: !!input,
                        visibleModal: !!visibleModal
                    };
                    
                    // Modal details
                    if (modal) {
                        const modalStyles = window.getComputedStyle(modal);
                        result.shadowDOM.modal = {
                            classes: Array.from(modal.classList),
                            opacity: modalStyles.opacity,
                            display: modalStyles.display,
                            visibility: modalStyles.visibility,
                            pointerEvents: modalStyles.pointerEvents,
                            transform: modalStyles.transform,
                            zIndex: modalStyles.zIndex
                        };
                    }
                    
                    // Backdrop details
                    if (backdrop) {
                        const backdropStyles = window.getComputedStyle(backdrop);
                        result.shadowDOM.backdrop = {
                            classes: Array.from(backdrop.classList),
                            opacity: backdropStyles.opacity,
                            display: backdropStyles.display,
                            visibility: backdropStyles.visibility,
                            pointerEvents: backdropStyles.pointerEvents
                        };
                    }
                    
                    // Input details
                    if (input) {
                        result.shadowDOM.input = {
                            value: input.value,
                            focused: input === shadow.activeElement,
                            placeholder: input.placeholder
                        };
                    }
                    
                    // Check for any other potentially relevant elements
                    const allElements = shadow.querySelectorAll('*');
                    result.shadowDOM.elementCount = allElements.length;
                    result.shadowDOM.elementTypes = [...new Set(Array.from(allElements).map(el => el.tagName))];
                } else {
                    result.shadowDOM = { exists: false };
                }
                
                return result;
            }''')
            
            print(f"\n=== {step_name} ===")
            print(f"Timestamp: {state['timestamp']}")
            print(f"Global flag: {state['globalFlag']}")
            print(f"Active element: {state['activeElement']}")
            print(f"Element exists: {state['exists']}")
            
            if state['exists']:
                print(f"Light DOM: {state['lightDOM']}")
                if state['shadowDOM']['exists']:
                    print(f"Shadow DOM active element: {state['shadowDOM']['activeElement']}")
                    print(f"Shadow DOM elements: {state['shadowDOM']['elements']}")
                    if state['shadowDOM'].get('modal'):
                        print(f"Modal state: {state['shadowDOM']['modal']}")
                    if state['shadowDOM'].get('backdrop'):
                        print(f"Backdrop state: {state['shadowDOM']['backdrop']}")
                    if state['shadowDOM'].get('input'):
                        print(f"Input state: {state['shadowDOM']['input']}")
                    print(f"Total shadow elements: {state['shadowDOM']['elementCount']}")
                    print(f"Element types: {state['shadowDOM']['elementTypes']}")
                else:
                    print("No shadow DOM")
            
            return state
        
        # Step 1: Initial state
        initial = await get_detailed_state("INITIAL STATE")
        
        # Step 2: Open palette
        print("\n>>> Opening command palette with Ctrl+K")
        await page.keyboard.press('Control+k')
        await page.wait_for_timeout(500)
        opened = await get_detailed_state("AFTER OPENING")
        
        # Step 3: Type command
        print("\n>>> Typing 'collapse all'")
        await page.keyboard.type('collapse all')
        await page.wait_for_timeout(300)
        typed = await get_detailed_state("AFTER TYPING")
        
        # Step 4: Execute command
        print("\n>>> Pressing Enter to execute command")
        await page.keyboard.press('Enter')
        
        # Check state immediately after Enter
        await page.wait_for_timeout(100)
        immediate = await get_detailed_state("IMMEDIATELY AFTER ENTER")
        
        # Check state after short delay
        await page.wait_for_timeout(500)
        delayed = await get_detailed_state("500ms AFTER ENTER")
        
        # Check state after longer delay
        await page.wait_for_timeout(1000)
        final = await get_detailed_state("1500ms AFTER ENTER")
        
        # Analysis
        print("\n=== BUG ANALYSIS ===")
        
        # Check if palette should be closed but isn't
        should_be_closed = not final['globalFlag'] and not final['lightDOM']['hasVisible']
        actually_visible = (final['shadowDOM']['exists'] and 
                          final['shadowDOM']['elements']['backdrop'] and
                          final['shadowDOM'].get('backdrop', {}).get('opacity') != '0')
        
        if should_be_closed and actually_visible:
            print("🐛 BUG DETECTED: App thinks palette is closed but it's still visible")
            print(f"   - Global flag: {final['globalFlag']}")
            print(f"   - Visible attribute: {final['lightDOM']['hasVisible']}")
            print(f"   - Backdrop exists: {final['shadowDOM']['elements']['backdrop']}")
            print(f"   - Backdrop opacity: {final['shadowDOM'].get('backdrop', {}).get('opacity')}")
        elif not should_be_closed and actually_visible:
            print("ℹ️  Palette is intentionally open")
        elif should_be_closed and not actually_visible:
            print("✅ Palette closed correctly")
        else:
            print("❓ Unclear state")
        
        # Check for state transitions
        print("\n=== STATE TRANSITIONS ===")
        
        transitions = [
            ("Initial → Opened", initial, opened),
            ("Opened → Typed", opened, typed), 
            ("Typed → Immediate", typed, immediate),
            ("Immediate → Delayed", immediate, delayed),
            ("Delayed → Final", delayed, final)
        ]
        
        for name, before, after in transitions:
            changes = []
            
            if before['globalFlag'] != after['globalFlag']:
                changes.append(f"globalFlag: {before['globalFlag']} → {after['globalFlag']}")
            
            if before['lightDOM']['hasVisible'] != after['lightDOM']['hasVisible']:
                changes.append(f"visible attr: {before['lightDOM']['hasVisible']} → {after['lightDOM']['hasVisible']}")
            
            if (before['shadowDOM']['exists'] and after['shadowDOM']['exists'] and
                before['shadowDOM']['elements']['backdrop'] != after['shadowDOM']['elements']['backdrop']):
                changes.append(f"backdrop: {before['shadowDOM']['elements']['backdrop']} → {after['shadowDOM']['elements']['backdrop']}")
            
            if changes:
                print(f"{name}: {', '.join(changes)}")
            else:
                print(f"{name}: No significant changes")
        
        # Test recovery
        if actually_visible:
            print("\n=== TESTING RECOVERY METHODS ===")
            
            # Try Escape
            print("Trying Escape key...")
            await page.keyboard.press('Escape')
            await page.wait_for_timeout(300)
            after_escape = await get_detailed_state("AFTER ESCAPE")
            
            escape_worked = (after_escape['shadowDOM']['exists'] == False or
                           not after_escape['shadowDOM']['elements']['backdrop'] or
                           after_escape['shadowDOM'].get('backdrop', {}).get('opacity') == '0')
            
            if escape_worked:
                print("✅ Escape key successfully closed stuck palette")
            else:
                print("❌ Escape key did not close stuck palette")
                
                # Try clicking outside
                print("Trying click outside...")
                await page.click('#gantt_here')
                await page.wait_for_timeout(300)
                after_click = await get_detailed_state("AFTER CLICK OUTSIDE")
                
                click_worked = (after_click['shadowDOM']['exists'] == False or
                              not after_click['shadowDOM']['elements']['backdrop'] or
                              after_click['shadowDOM'].get('backdrop', {}).get('opacity') == '0')
                
                if click_worked:
                    print("✅ Click outside successfully closed stuck palette")
                else:
                    print("❌ Click outside did not close stuck palette")
        
        print("\nDebug test completed. Browser will stay open for 10 seconds...")
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_command_palette_state_debug())