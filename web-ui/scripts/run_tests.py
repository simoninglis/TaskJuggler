#!/usr/bin/env python3
"""
Test runner for TaskJuggler Web UI tests
Usage: python run_tests.py [category]
Categories: command_palette, keyboard, integration, all
"""

import sys
import subprocess
import os
from pathlib import Path

def run_test_category(category):
    """Run tests in a specific category"""
    # Get the parent directory (web-ui) from scripts/
    parent_dir = Path(__file__).parent.parent
    test_dir = parent_dir / "tests" / category
    if not test_dir.exists():
        print(f"❌ Test category '{category}' not found")
        return False
    
    print(f"🧪 Running {category} tests...")
    success = True
    
    for test_file in test_dir.glob("test_*.py"):
        print(f"  Running {test_file.name}...")
        try:
            result = subprocess.run(
                ["poetry", "run", "python", str(test_file)], 
                capture_output=True, 
                text=True,
                cwd=parent_dir
            )
            if result.returncode == 0:
                print(f"  ✅ {test_file.name} passed")
            else:
                print(f"  ❌ {test_file.name} failed")
                print(f"     Error: {result.stderr.strip()}")
                success = False
        except Exception as e:
            print(f"  ❌ {test_file.name} error: {e}")
            success = False
    
    return success

def main():
    categories = ["command_palette", "keyboard", "integration", "misc"]
    
    if len(sys.argv) < 2:
        print("Usage: python run_tests.py [category]")
        print(f"Categories: {', '.join(categories)}, all")
        return
    
    category = sys.argv[1]
    
    if category == "all":
        print("🧪 Running all tests...")
        all_success = True
        for cat in categories:
            success = run_test_category(cat)
            all_success = all_success and success
            print()
        
        if all_success:
            print("🎉 All tests passed!")
        else:
            print("❌ Some tests failed")
    elif category in categories:
        success = run_test_category(category)
        if success:
            print(f"🎉 All {category} tests passed!")
        else:
            print(f"❌ Some {category} tests failed")
    else:
        print(f"❌ Unknown category: {category}")
        print(f"Available categories: {', '.join(categories)}, all")

if __name__ == "__main__":
    main()