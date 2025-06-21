"""
Helper functions for command palette testing
"""

async def is_palette_open(page):
    """Check if the custom command palette is visible"""
    return await page.evaluate('''() => {
        const palette = document.getElementById('customCommandPalette');
        if (!palette) return false;
        
        // Check both display style and the palette object state
        const isDisplayed = palette.style.display !== 'none';
        const paletteState = window.customCommandPalette ? window.customCommandPalette.getState() : null;
        
        return isDisplayed && paletteState && paletteState.isOpen;
    }''')

async def wait_for_palette(page, visible=True, timeout=2000):
    """Wait for palette to be visible or hidden"""
    if visible:
        await page.wait_for_function(
            '''() => {
                const palette = document.getElementById('customCommandPalette');
                return palette && palette.style.display !== 'none';
            }''',
            timeout=timeout
        )
    else:
        await page.wait_for_function(
            '''() => {
                const palette = document.getElementById('customCommandPalette');
                return !palette || palette.style.display === 'none';
            }''',
            timeout=timeout
        )

async def get_visible_commands(page):
    """Get list of visible command items in the palette"""
    return await page.evaluate('''() => {
        const results = document.querySelectorAll('.command-item');
        return Array.from(results).map(item => ({
            text: item.textContent.trim(),
            isSelected: item.classList.contains('selected')
        }));
    }''')

async def select_command_by_text(page, text):
    """Select a command by its text content"""
    return await page.evaluate('''(searchText) => {
        const results = document.querySelectorAll('.command-item');
        for (const item of results) {
            if (item.textContent.includes(searchText)) {
                item.click();
                return true;
            }
        }
        return false;
    }''', text)

async def get_palette_mode(page):
    """Get the current mode of the command palette"""
    return await page.evaluate('''() => {
        if (!window.customCommandPalette) return null;
        const state = window.customCommandPalette.getState();
        return {
            isSearchMode: state.isSearchMode,
            isFocusMode: state.isFocusMode,
            isGoMode: state.isGoMode
        };
    }''')

async def get_search_input_value(page):
    """Get the current value of the palette search input"""
    return await page.evaluate('''() => {
        const input = document.getElementById('paletteSearch');
        return input ? input.value : '';
    }''')

async def type_in_palette(page, text):
    """Type text into the palette search input"""
    await page.fill('#paletteSearch', text)

async def clear_palette_search(page):
    """Clear the palette search input"""
    await page.fill('#paletteSearch', '')