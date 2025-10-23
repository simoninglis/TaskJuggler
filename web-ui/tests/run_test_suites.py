#!/usr/bin/env python3
"""
Test Suite Runner for TaskJuggler Web UI

Run smoke and regression test suites with detailed reporting.
"""

import sys
import subprocess
import time
from pathlib import Path
from datetime import datetime

class TestSuiteRunner:
    def __init__(self):
        self.base_path = Path(__file__).parent
        self.results = {}
        
    def run_smoke_tests(self):
        """Run smoke test suite"""
        print("\n" + "="*60)
        print("🔥 SMOKE TEST SUITE")
        print("="*60)
        print("Quick tests to verify critical functionality...")
        print("-"*60)
        
        start_time = time.time()
        
        result = subprocess.run(
            ["poetry", "run", "pytest", str(self.base_path / "smoke" / "test_smoke_suite.py"), 
             "-v", "--tb=short"],
            capture_output=True,
            text=True
        )
        
        duration = time.time() - start_time
        
        self.results['smoke'] = {
            'passed': result.returncode == 0,
            'duration': duration,
            'output': result.stdout,
            'errors': result.stderr
        }
        
        if result.returncode == 0:
            print(f"✅ SMOKE TESTS PASSED in {duration:.2f}s")
        else:
            print(f"❌ SMOKE TESTS FAILED in {duration:.2f}s")
            print("\nErrors:")
            print(result.stdout)
        
        return result.returncode == 0
    
    def run_regression_tests(self):
        """Run regression test suite"""
        print("\n" + "="*60)
        print("🔄 REGRESSION TEST SUITE")
        print("="*60)
        print("Comprehensive tests to ensure no functionality has regressed...")
        print("-"*60)
        
        start_time = time.time()
        
        result = subprocess.run(
            ["poetry", "run", "pytest", str(self.base_path / "regression" / "test_regression_suite.py"), 
             "-v", "--tb=short"],
            capture_output=True,
            text=True
        )
        
        duration = time.time() - start_time
        
        self.results['regression'] = {
            'passed': result.returncode == 0,
            'duration': duration,
            'output': result.stdout,
            'errors': result.stderr
        }
        
        if result.returncode == 0:
            print(f"✅ REGRESSION TESTS PASSED in {duration:.2f}s")
        else:
            print(f"❌ REGRESSION TESTS FAILED in {duration:.2f}s")
            print("\nErrors:")
            print(result.stdout)
        
        return result.returncode == 0
    
    def run_suite(self, suite_name):
        """Run specific test suite"""
        if suite_name == "smoke":
            return self.run_smoke_tests()
        elif suite_name == "regression":
            return self.run_regression_tests()
        else:
            print(f"❌ Unknown test suite: {suite_name}")
            return False
    
    def run_all(self):
        """Run all test suites"""
        print(f"\n🧪 TaskJuggler Web UI Test Suites")
        print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        all_passed = True
        
        # Run smoke tests first (quick check)
        if not self.run_smoke_tests():
            all_passed = False
            print("\n⚠️  Skipping regression tests due to smoke test failures")
        else:
            # Run regression tests only if smoke tests pass
            if not self.run_regression_tests():
                all_passed = False
        
        # Print summary
        self.print_summary()
        
        return all_passed
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        total_duration = sum(r['duration'] for r in self.results.values())
        
        for suite, result in self.results.items():
            status = "✅ PASSED" if result['passed'] else "❌ FAILED"
            print(f"{suite.upper():12} {status:12} ({result['duration']:.2f}s)")
        
        print("-"*60)
        print(f"Total Duration: {total_duration:.2f}s")
        
        all_passed = all(r['passed'] for r in self.results.values())
        if all_passed:
            print("\n🎉 All tests passed!")
        else:
            print("\n❌ Some tests failed. Check output above for details.")
    
    def save_report(self, filename="test_report.txt"):
        """Save detailed test report"""
        report_path = self.base_path / filename
        
        with open(report_path, 'w') as f:
            f.write(f"TaskJuggler Web UI Test Report\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("="*80 + "\n\n")
            
            for suite, result in self.results.items():
                f.write(f"{suite.upper()} TEST SUITE\n")
                f.write("-"*80 + "\n")
                f.write(f"Status: {'PASSED' if result['passed'] else 'FAILED'}\n")
                f.write(f"Duration: {result['duration']:.2f}s\n\n")
                f.write("Output:\n")
                f.write(result['output'])
                f.write("\n" + "="*80 + "\n\n")
        
        print(f"\n📄 Detailed report saved to: {report_path}")


def main():
    """Main entry point"""
    runner = TestSuiteRunner()
    
    if len(sys.argv) > 1:
        suite = sys.argv[1].lower()
        if suite == "all":
            success = runner.run_all()
        else:
            success = runner.run_suite(suite)
    else:
        print("Usage: python run_test_suites.py [smoke|regression|all]")
        print("\nAvailable suites:")
        print("  smoke      - Quick critical functionality tests (~2 min)")
        print("  regression - Comprehensive feature tests (~10 min)")
        print("  all        - Run both suites (smoke first)")
        sys.exit(1)
    
    # Save report if any tests were run
    if runner.results:
        runner.save_report()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()