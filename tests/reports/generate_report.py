"""
generate_report.py — Generates a professional HTML validation report from test results.
"""

import json
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime

REPORT_DIR = Path(__file__).resolve().parent
ROOT = REPORT_DIR.parents[1]


def load_junit(path=None):
    if path is None:
        path = REPORT_DIR / "junit_results.xml"
    if not path.exists():
        return None
    tree = ET.parse(str(path))
    root = tree.getroot()
    testsuite = root[0] if len(root) else root
    return {
        "total": int(testsuite.get("tests", 0)),
        "passed": int(testsuite.get("tests", 0)) - int(testsuite.get("failures", 0)) - int(testsuite.get("errors", 0)),
        "failed": int(testsuite.get("failures", 0)),
        "errors": int(testsuite.get("errors", 0)),
        "skipped": int(testsuite.get("skipped", 0)),
        "time": float(testsuite.get("time", 0)),
    }


def load_json_report(path=None):
    if path is None:
        path = REPORT_DIR / "json_report.json"
    if not path.exists():
        return None
    with open(str(path)) as f:
        return json.load(f)


def generate_html_report(junit_path=None, json_path=None):
    junit = load_junit(junit_path)
    json_data = load_json_report(json_path)

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    total = junit["total"] if junit else 0
    passed = junit["passed"] if junit else 0
    failed = junit["failed"] if junit else 0
    errors = junit["errors"] if junit else 0
    skipped = junit["skipped"] if junit else 0
    duration = junit["time"] if junit else 0
    success_rate = (passed / total * 100) if total > 0 else 0

    verdict = "PASS" if failed == 0 and errors == 0 else "FAIL"
    verdict_color = "#22c55e" if verdict == "PASS" else "#ef4444"

    test_details = ""
    if json_data and "tests" in json_data:
        for test in json_data["tests"]:
            name = test.get("name", "unknown")
            outcome = test.get("outcome", "passed")
            call = test.get("call", {})
            has_error = call and call.get("longrepr")
            color = "#22c55e" if outcome == "passed" else "#ef4444"
            symbol = "✓" if outcome == "passed" else "✗"
            test_details += f"""
            <tr>
                <td style="color:{color};font-weight:600;">{symbol}</td>
                <td>{name}</td>
                <td style="color:{color}">{outcome.upper()}</td>
            </tr>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Scheduling Algorithm Validation Report</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 40px 20px; }}
  .container {{ max-width: 1000px; margin: 0 auto; }}
  h1 {{ font-size: 28px; border-bottom: 2px solid #334155; padding-bottom: 12px; }}
  h2 {{ color: #94a3b8; font-size: 18px; margin-top: 30px; }}
  .verdict {{ display: inline-block; padding: 8px 24px; border-radius: 8px; font-weight: 700; font-size: 24px; color: white; background: {verdict_color}; }}
  .stats {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }}
  .stat {{ background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; }}
  .stat-value {{ font-size: 32px; font-weight: 700; }}
  .stat-label {{ color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }}
  .pass {{ color: #22c55e; }} .fail {{ color: #ef4444; }} .skip {{ color: #eab308; }}
  table {{ width: 100%; border-collapse: collapse; margin: 16px 0; }}
  th, td {{ padding: 10px 14px; text-align: left; border-bottom: 1px solid #1e293b; font-size: 13px; }}
  th {{ color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }}
  tr:hover {{ background: #1e293b; }}
  .meta {{ color: #64748b; font-size: 13px; }}
</style>
</head>
<body>
<div class="container">

<h1>🧪 Scheduling Algorithm Validation Report</h1>
<p class="meta">Generated: {now} | Duration: {duration:.2f}s</p>

<div style="display:flex;align-items:center;gap:20px;margin:20px 0;">
  <div class="verdict">{verdict}</div>
  <span style="font-size:14px;color:#94a3b8;">Success Rate: {success_rate:.1f}%</span>
</div>

<div class="stats">
  <div class="stat"><div class="stat-value pass">{total}</div><div class="stat-label">Total Tests</div></div>
  <div class="stat"><div class="stat-value pass">{passed}</div><div class="stat-label">Passed</div></div>
  <div class="stat"><div class="stat-value fail">{failed + errors}</div><div class="stat-label">Failed / Errors</div></div>
  <div class="stat"><div class="stat-value skip">{skipped}</div><div class="stat-label">Skipped</div></div>
</div>

<h2>Test Results</h2>
<table>
  <tr><th style="width:30px"></th><th>Test Name</th><th style="width:80px">Status</th></tr>
  {test_details}
</table>

<div style="margin-top:40px;padding:20px;background:#1e293b;border-radius:12px;border:1px solid #334155;">
<h3 style="margin:0 0 12px 0;color:#94a3b8;">Summary</h3>
<ul style="margin:0;padding-left:18px;color:#cbd5e1;line-height:1.8;">
  <li><strong>Algorithms:</strong> Genetic Algorithm + Greedy Scheduler</li>
  <li><strong>Constraints:</strong> CT1 (No Double-Booking), CT2 (No Student Clash), CT2b (One Exam/Day), CT3 (Even Spread), CT4 (Room Assignment)</li>
  <li><strong>Dataset:</strong> {ROOT.name}/data/</li>
  <li><strong>Verdict:</strong> {"All tests passing — algorithms are logically correct and outputs are valid." if verdict == "PASS" else "Some tests failed — review details above."}</li>
</ul>
</div>

</div>
</body>
</html>"""

    out_path = REPORT_DIR / "validation_report.html"
    with open(str(out_path), "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  Report saved: {out_path}")
    return out_path


if __name__ == "__main__":
    generate_html_report()
