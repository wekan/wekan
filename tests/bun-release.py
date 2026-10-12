import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('bun_assets', ROOT / 'releases/bun/assets.py')
assets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)


class BunReleaseTests(unittest.TestCase):
    def setUp(self):
        self.release = {'tag_name': 'v12.34', 'assets': []}
        self.bun = {'tag_name': 'bun-v1.4.3', 'assets': [{'name': row['asset']} for row in assets.TARGETS]}

    def test_all_runtime_targets_are_planned(self):
        self.assertEqual(assets.plan(self.release, self.bun)['count'], 12)

    def test_aliases_and_profiles_are_not_platforms(self):
        self.bun['assets'] += [{'name': 'bun-linux-x64-baseline.zip'}, {'name': 'bun-linux-x64-profile.zip'}]
        self.assertEqual(assets.plan(self.release, self.bun)['count'], 12)

    def test_new_or_removed_platform_fails_visibly(self):
        self.bun['assets'].append({'name': 'bun-linux-riscv64.zip'})
        with self.assertRaises(ValueError): assets.plan(self.release, self.bun)
        self.bun['assets'] = self.bun['assets'][1:-1]
        with self.assertRaises(ValueError): assets.plan(self.release, self.bun)

    def test_missing_checksum_requires_rebuild(self):
        name = assets.asset_name('v12.34', 'android-arm64')
        self.release['assets'] = [{'name': name}]
        self.assertEqual(assets.plan(self.release, self.bun, '["android-arm64"]', True)['count'], 1)
        self.release['assets'].append({'name': name + '.sha256sum'})
        self.assertEqual(assets.plan(self.release, self.bun, '["android-arm64"]', True)['count'], 0)
        self.assertEqual(assets.plan(self.release, self.bun, '["android-arm64"]')['count'], 1)

    def test_old_tar_assets_do_not_skip_zip_builds(self):
        name = 'wekan-12.34-bun-linux-x64.tar.gz'
        self.release['assets'] = [{'name': name}, {'name': name + '.sha256sum'}]
        self.assertEqual(assets.plan(self.release, self.bun, '["linux-x64"]', True)['count'], 1)

    def test_bad_selectors_and_tags_fail(self):
        for value in ['[]', '{}', '["unknown"]', '[12]', '"linux-x64"']:
            with self.assertRaises(ValueError): assets.plan(self.release, self.bun, value)
        for tag in ['main', '../v12.34', 'v12.34\nx=y', 'v12.34;echo hello']:
            with self.assertRaises(ValueError): assets.asset_name(tag, 'linux-x64')
        self.release['draft'] = True
        with self.assertRaises(ValueError): assets.plan(self.release, self.bun)

    def test_archive_requires_smoke_and_preserves_launcher_mode(self):
        import hashlib
        import zipfile
        with tempfile.TemporaryDirectory(dir=ROOT / '.tools/tmp') as tmp:
            previous = Path.cwd()
            try:
                os.chdir(tmp)
                Path('bundle').mkdir()
                with self.assertRaises(ValueError): assets.package('v12.34', 'linux-x64')
                Path('bundle/.bun-smoke-ok').write_text('ok')
                launcher = Path('bundle/start-wekan.sh')
                launcher.write_text('#!/bin/sh\nexit 0\n')
                launcher.chmod(0o755)
                Path('bundle/empty').mkdir()
                Path('bundle/dependency').mkdir()
                Path('bundle/dependency/index.js').write_text('module.exports = 42;')
                Path('bundle/linked-dependency').symlink_to('dependency', target_is_directory=True)
                Path('bundle/linked-launcher').symlink_to('start-wekan.sh')
                assets.package('v12.34', 'linux-x64')
                name = assets.asset_name('v12.34', 'linux-x64')
                archive = Path('dist') / name
                self.assertEqual(name, 'wekan-12.34-bun-linux-x64.zip')
                with zipfile.ZipFile(archive) as zipped:
                    self.assertIsNone(zipped.testzip())
                    self.assertEqual(zipped.getinfo('bundle/start-wekan.sh').external_attr >> 16 & 0o777, 0o755)
                    self.assertEqual(zipped.read('bundle/linked-launcher'), launcher.read_bytes())
                    self.assertEqual(zipped.read('bundle/linked-dependency/index.js'), b'module.exports = 42;')
                    self.assertIn('bundle/empty/', zipped.namelist())
                    self.assertNotIn('bundle/.bun-smoke-ok', zipped.namelist())
                self.assertEqual(Path(str(archive) + '.sha256sum').read_text(),
                                 hashlib.sha256(archive.read_bytes()).hexdigest() + '  ' + name + '\n')
            finally:
                os.chdir(previous)

    def test_wrong_runtime_checksum_is_rejected(self):
        with tempfile.TemporaryDirectory(dir=ROOT / '.tools/tmp') as tmp:
            previous = Path.cwd()
            def fake_download(url, dest):
                Path(dest).write_bytes(b'bad archive' if url.endswith('.zip') else b'0000  bun-linux-x64.zip\n')
            try:
                os.chdir(tmp)
                with patch.object(assets, 'download', fake_download):
                    with self.assertRaisesRegex(ValueError, 'checksum mismatch'):
                        assets.fetch_runtime('bun-v1.4.3', 'linux-x64')
                self.assertFalse(Path('bundle/bun').exists())
            finally:
                os.chdir(previous)


if __name__ == '__main__':
    unittest.main()
