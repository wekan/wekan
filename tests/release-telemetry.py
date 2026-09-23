#!/usr/bin/env python3
"""Offline positive/negative coverage for source and release artifact gates."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile
sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
CHECK = ROOT / 'releases/check-telemetry.py'
if not CHECK.exists():
    CHECK = ROOT / 'build/ferretdb/check-telemetry.py'
spec = importlib.util.spec_from_file_location('audit', CHECK)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class ReleaseTelemetry(unittest.TestCase):
    def test_artifacts_reject_reporters_preserve_logging(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'binary'
            path.write_bytes(b'local telemetry diagnostics logger metrics otel optional exporter')
            for kind in ('wekan', 'mongo-tools', 'ferretdb', 'mongosh'):
                audit.scan_file(path, kind)
            for kind, tokens in [('wekan', audit.COMMON), ('mongosh', audit.MONGOSH),
                                 ('mongo-tools', audit.CLOUD + audit.NATIVE_CLOUD), ('ferretdb', audit.FERRET)]:
                for token in tokens:
                    path.write_bytes(b'\x00native-code\x00' + token.encode() + b'\x00')
                    with self.assertRaisesRegex(ValueError, 'Telemetry implementation remains'):
                        audit.scan_file(path, kind)
            path.write_bytes(b'')
            with self.assertRaises(ValueError):
                audit.scan_file(path, 'wekan')

    def test_error_is_fatal_and_annotated(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'ferretdb'
            path.write_bytes(b'beacon.ferretdb.com')
            result = subprocess.run([sys.executable, str(CHECK), '--kind', 'ferretdb', str(path)],
                                    capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('::error::Telemetry audit failed:', result.stderr)
            self.assertIn(str(path), result.stderr)

    def test_source_drift_and_version_normalization(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'server').mkdir()
            source = root / 'server/logger.js'
            source.write_text('console.log("local metrics");\n')
            package = root / 'package.json'
            package.write_text('{"version":"v1","dependencies":{"logger":"1"}}')
            policy = dict(roots=['server'], files=['package.json'], normalizeAppVersion=True)
            policy['reviewed'] = audit.snapshot(root, policy)
            audit.audit_source(root, policy)
            package.write_text('{"version":"v2","dependencies":{"logger":"1"}}')
            audit.audit_source(root, policy)
            added = root / 'server/new-reporter.js'
            added.write_text('code without known keywords')
            with self.assertRaises(ValueError):
                audit.audit_source(root, policy)
            added.unlink()
            source.write_text('changed')
            with self.assertRaises(ValueError):
                audit.audit_source(root, policy)
            source.unlink()
            with self.assertRaises(ValueError):
                audit.audit_source(root, policy)

    def test_bundle_and_compressed_archive(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / 'bundle'
            (root / 'programs/server').mkdir(parents=True)
            (root / 'main.js').write_text('console.log("local telemetry");')
            audit.scan_bundle(root)
            binary = root / 'ferretdb'
            binary.write_bytes(b'beacon.ferretdb.com')
            with self.assertRaises(ValueError):
                audit.scan_bundle(root)
            archive = Path(tmp) / 'payload.zip'
            with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as out:
                out.write(root / 'main.js', 'bundle/main.js')
                # Marker crosses the streaming chunk boundary.
                out.writestr('bundle/programs/server/binary', b'x' * (1024 * 1024 - 5) + binary.read_bytes())
            with self.assertRaisesRegex(ValueError, 'payload.zip!bundle/programs/server/binary'):
                audit.scan_archive(archive)
            binary.unlink()
            outside = Path(tmp) / 'outside.js'
            outside.write_text('hidden payload')
            (root / 'escape').symlink_to(outside)
            with self.assertRaisesRegex(ValueError, 'escapes'):
                audit.scan_bundle(root)


if __name__ == '__main__':
    unittest.main()
