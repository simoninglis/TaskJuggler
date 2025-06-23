#!/usr/bin/env python3
"""
Simple debug of Enter key issue
"""

import pytest
from playwright.sync_api import Page, expect
import time

def test_enter_key_simple(page: Page):
    """Simple test of Enter key issue"""
    
    # Navigate to the application
    page.goto("http://localhost:8001")
    
    # Wait for gantt to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)
    
    # Open command palette
    page.keyboard.press("Control+Shift+P")
    time.sleep(0.5)
    
    # Type "dark" to filter
    page.keyboard.type("dark")
    time.sleep(0.5)
    
    # Check what happens when we call the handler directly
    handler_test = page.evaluate("""() => {
        const palette = window.customCommandPalette;
        if (!palette || !palette.filteredCommands || palette.filteredCommands.length === 0) {
            return 'No filtered commands';
        }
        
        const firstCommand = palette.filteredCommands[0];
        if (!firstCommand || !firstCommand.handler) {
            return 'No handler on first command';
        }
        
        // Log the handler
        console.log('Handler:', firstCommand.handler);
        
        // Try to execute the handler
        try {
            firstCommand.handler();
            return 'Handler executed successfully';
        } catch (error) {
            return 'Handler error: ' + error.message;
        }
    }""")
    
    print(f"Handler test result: {handler_test}")
    
    # Check theme
    theme1 = page.evaluate("() => document.documentElement.getAttribute('data-theme') || 'light'")
    print(f"Theme after handler: {theme1}")
    
    # Now check why executeCommand might not be working
    execute_command_test = page.evaluate("""() => {
        const palette = window.customCommandPalette;
        if (!palette) return 'No palette';
        
        const firstCommand = palette.filteredCommands[0];
        if (!firstCommand) return 'No first command';
        
        try {
            palette.executeCommand(firstCommand.id);
            return 'executeCommand called';
        } catch (error) {
            return 'executeCommand error: ' + error.message + ' - ' + error.stack;
        }
    }""")
    
    print(f"executeCommand test: {execute_command_test}")
    
    # Check if the command's handler is properly set
    command_check = page.evaluate("""() => {
        const palette = window.customCommandPalette;
        if (!palette || !palette.commands) return 'No commands';
        
        const themeCommand = palette.commands.find(cmd => cmd.id === 'toggle-theme');
        if (!themeCommand) return 'Theme command not found';
        
        return {
            id: themeCommand.id,
            title: themeCommand.title,
            hasHandler: !!themeCommand.handler,
            handlerType: typeof themeCommand.handler,
            handlerString: themeCommand.handler ? themeCommand.handler.toString().substring(0, 100) : 'null'
        };
    }""")
    
    print(f"Theme command check: {command_check}")
    
    # Final theme check
    theme2 = page.evaluate("() => document.documentElement.getAttribute('data-theme') || 'light'")
    print(f"Final theme: {theme2}")