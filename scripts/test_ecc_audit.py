#!/usr/bin/env python3
"""Exercise the real CLI on isolated conforming and deliberately broken apps."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent.parent
CSS = ('ecc-tokens.css', 'ecc-ces-compat.css', 'ecc-components.base.css', 'ecc-app.css')


class AuditContract(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='ecc-selftest-')
        self.addCleanup(self.temp.cleanup)
        self.app = Path(self.temp.name) / 'app'
        self.app.mkdir()
        self.report = Path(self.temp.name) / 'report.json'
        self.app.joinpath('index.html').write_text('''<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Montserrat" rel="stylesheet">
<link rel="stylesheet" href="ecc-tokens.css"></head><body><p>Fictional preview</p>
<input id="question" type="text" aria-label="Question"></body></html>''')
        for name in CSS:
            shutil.copyfile(ROOT / 'css' / name, self.app / name)

    def audit(self):
        result = subprocess.run([sys.executable, str(ROOT / 'scripts/ecc_audit_static.py'),
                                 str(self.app), '--json', str(self.report)],
                                capture_output=True, text=True, check=False)
        findings = [f for group in json.loads(self.report.read_text()).values() for f in group]
        return result.returncode, {f['code'] for f in findings if f['severity'] == 'FAIL'}

    def test_conforming_app_passes(self):
        self.assertEqual(self.audit(), (0, set()))

    def test_layout_violations_fail(self):
        self.app.joinpath('app.css').write_text(
            '.app-container { font-size:12px; max-width:900px; overscroll-behavior:contain; }')
        code, failures = self.audit()
        self.assertEqual(code, 1)
        self.assertTrue({'text-below-floor', 'width-cap', 'scroll-trap'} <= failures)

    def test_missing_vendor_fails(self):
        self.app.joinpath('ecc-app.css').unlink()
        code, failures = self.audit()
        self.assertEqual(code, 1)
        self.assertIn('ds-missing', failures)

    def test_stale_vendor_fails(self):
        self.app.joinpath('ecc-app.css').write_text('/* stale */')
        code, failures = self.audit()
        self.assertEqual(code, 1)
        self.assertIn('ds-stale', failures)


if __name__ == '__main__':
    unittest.main()
