#!/usr/bin/env python3
"""
Test document root and theme attribute
"""

import pytest
from playwright.sync_api import Page, expect
import time

def test_document_root(page: Page):
    """Test document root and theme attribute"""
    
    # Navigate to the application
    page.goto("http://localhost:8001")
    
    # Wait for gantt to load
    page.wait_for_selector("#gantt_here", state="visible")
    time.sleep(2)
    
    # Check document structure
    doc_check = page.evaluate("""() => {
        return {
            documentElement: document.documentElement ? document.documentElement.tagName : 'no documentElement',
            htmlElement: document.querySelector('html') ? 'html found' : 'no html',
            bodyElement: document.body ? 'body found' : 'no body',
            dataThemeOnHtml: document.documentElement ? document.documentElement.getAttribute('data-theme') : 'no documentElement',
            dataThemeOnBody: document.body ? document.body.getAttribute('data-theme') : 'no body',
            classOnHtml: document.documentElement ? document.documentElement.className : 'no class',
            classOnBody: document.body ? document.body.className : 'no class'
        };
    }""")
    
    print(f"Document structure: {doc_check}")
    
    # Check if theme manager is setting attributes correctly
    theme_manager_behavior = page.evaluate("""() => {
        const themeManager = document.querySelector('theme-manager');
        if (!themeManager) return 'No theme manager';
        
        // Try to see what setTheme does
        const originalTheme = themeManager.getTheme ? themeManager.getTheme() : 'unknown';
        
        // Manually set data-theme to test
        document.documentElement.setAttribute('data-theme', 'test-theme');
        const afterManualSet = document.documentElement.getAttribute('data-theme');
        
        // Now try theme manager
        if (themeManager.setTheme) {
            themeManager.setTheme('dark');
        }
        
        const afterThemeManager = document.documentElement.getAttribute('data-theme');
        
        return {
            originalTheme,
            afterManualSet,
            afterThemeManager,
            themeManagerTheme: themeManager.getTheme ? themeManager.getTheme() : 'no getTheme'
        };
    }""")
    
    print(f"Theme manager behavior: {theme_manager_behavior}")
    
    # Check if it's a shadow DOM issue
    shadow_check = page.evaluate("""() => {
        const themeManager = document.querySelector('theme-manager');
        if (!themeManager) return 'No theme manager';
        
        return {
            hasShadowRoot: !!themeManager.shadowRoot,
            isCustomElement: themeManager instanceof HTMLElement,
            connectedCallback: typeof themeManager.connectedCallback
        };
    }""")
    
    print(f"Shadow DOM check: {shadow_check}")
    
    # Wait and check again
    time.sleep(1)
    
    final_theme = page.evaluate("() => document.documentElement.getAttribute('data-theme')")
    print(f"Final theme attribute: {final_theme}")