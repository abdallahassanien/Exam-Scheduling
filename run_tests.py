#!/usr/bin/env python3
"""
run_tests.py — Master test runner for the scheduling algorithm validation suite.

Usage:
    python run_tests.py              # run all tests
    python run_tests.py --unit       # only unit tests
    python run_tests.py --benchmark  # include slow benchmarks
    python run_tests.py --stress     # include stress tests
    python run_tests.py --report     # run all tests and generate report
"""

import argparse
import subprocess
import sys
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def run_tests(markers=None, args=None, report=False):
    pytest_args = [sys.executable, "-m", "pytest", str(ROOT / "tests")]

    if markers:
        for m in markers:
            pytest_args.extend(["-m", m])

    if args:
        pytest_args.extend(args.split())

    pytest_args.extend([
        "-v",
        "--tb=short",
        "--no-header",
    ])

    if report:
        report_dir = ROOT / "tests" / "reports"
        os.makedirs(str(report_dir), exist_ok=True)
        pytest_args.extend([
            "--junitxml", str(report_dir / "junit_results.xml"),
            "-p", "pytest_jsonreport",
            "--json-report", str(report_dir / "json_report.json"),
        ])

    print(f"Running: {' '.join(pytest_args)}")
    result = subprocess.run(pytest_args, cwd=str(ROOT))
    return result.returncode


def main():
    parser = argparse.ArgumentParser(description="Scheduling Algorithm Validation Suite")
    parser.add_argument("--unit", action="store_true", help="Run only unit tests (excludes slow/stress)")
    parser.add_argument("--integration", action="store_true", help="Run only integration tests")
    parser.add_argument("--edge", action="store_true", help="Run only edge case tests")
    parser.add_argument("--benchmark", action="store_true", help="Include benchmark tests")
    parser.add_argument("--stress", action="store_true", help="Include stress tests")
    parser.add_argument("--mathematical", action="store_true", help="Run only mathematical tests")
    parser.add_argument("--all", action="store_true", help="Run ALL tests including slow/stress")
    parser.add_argument("--report", action="store_true", help="Generate JUnit/JSON report files")
    parser.add_argument("--args", type=str, default="", help="Extra pytest arguments")
    parser.add_argument("--generate-report", action="store_true", help="Run all tests then generate HTML report")
    args = parser.parse_args()

    markers = []
    skip_markers = []

    if args.all or args.generate_report:
        markers = None
    elif args.stress:
        markers = ["stress"]
    elif args.benchmark:
        markers = ["benchmark"]
    elif args.unit:
        markers = ["not slow and not stress"]
    elif args.integration:
        markers = ["not slow and not stress"]
    elif args.edge:
        markers = ["not slow and not stress"]
    elif args.mathematical:
        markers = ["not slow and not stress"]
    else:
        markers = ["not slow and not stress"]

    target = str(ROOT / "tests")
    if args.unit:
        target = str(ROOT / "tests" / "unit")
    elif args.integration:
        target = str(ROOT / "tests" / "integration")
    elif args.edge:
        target = str(ROOT / "tests" / "edge_cases")
    elif args.benchmark:
        target = str(ROOT / "tests" / "benchmark")
    elif args.stress:
        target = str(ROOT / "tests" / "stress")
    elif args.mathematical:
        target = str(ROOT / "tests" / "mathematical")

    pytest_args = [sys.executable, "-m", "pytest", target]

    if markers:
        for m in markers:
            pytest_args.extend(["-m", m])

    if args.args:
        pytest_args.extend(args.args.split())

    pytest_args.extend(["-v", "--tb=short", "--no-header"])

    if args.report or args.generate_report:
        report_dir = ROOT / "tests" / "reports"
        os.makedirs(str(report_dir), exist_ok=True)
        pytest_args.extend(["--junitxml", str(report_dir / "junit_results.xml")])

    if args.generate_report:
        try:
            import pytest_jsonreport
        except ImportError:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pytest-json-report"])
        pytest_args.extend(["--json-report", str(report_dir / "json_report.json")])

    print(f"\n{'='*60}")
    print(f"  SCHEDULING ALGORITHM VALIDATION SUITE")
    print(f"{'='*60}")
    print(f"  Target: {target}")
    print(f"{'='*60}\n")

    result = subprocess.run(pytest_args, cwd=str(ROOT))

    if args.generate_report or args.report:
        try:
            from tests.reports.generate_report import generate_html_report
            report_path = generate_html_report()
            print(f"\n  HTML Report: {report_path}")
        except ImportError:
            print("\n  Report generation module not found. Run tests first.")
        except Exception as e:
            print(f"\n  Report generation failed: {e}")

    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
