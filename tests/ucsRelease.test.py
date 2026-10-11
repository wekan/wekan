#!/usr/bin/env python3
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('ucs_release', ROOT / 'releases/ucs-release.py')
ucs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ucs)
DATABASE_IMAGE = 'ghcr.io/wekan/ferretdb:v1.92.0'


class FakePortal:
    def __init__(self, state='new', broken=False):
        self.calls = []
        self.state = state
        self.broken = broken
        self.files = {}

    def call(self, action, *args, json_result=False):
        self.calls.append((action, args))
        if action == 'list':
            versions = [{'id': 'wekan', 'version': '6.09', 'ucs_version': '4.4'}]
            if self.state != 'new':
                versions.append({'id': 'wekan', 'version': '12.28', 'ucs_version': '5.2',
                                 'in_appcenter': self.state == 'published'})
            return {'vendor': [{'versions': versions}]}
        if action == 'upload':
            self.files = {Path(file).name: Path(file).read_text() for file in args[1:]}
        if action == 'get':
            return {} if self.broken else self.files


class UcsRelease(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix='ucs-release-')
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        component = self.root / 'source/component'
        component.mkdir(parents=True)
        for name in ucs.FILES:
            (component / name).write_text('content ' + name)
        (component / 'compose').write_text('services:\n  wekandb:\n    # Image was: old-mongo:6.09\n    image: '+DATABASE_IMAGE+'\n  wekan:\n    # Image was: older:5.0\n    image: ghcr.io/wekan/wekan:v12.27\n')
        (component / 'preinst').write_text('image=old\nhelper=old-helper\ndbimage=old-db\n')
        (component / 'migration').mkdir()
        (component / 'migration/Dockerfile').write_text('ARG WEKAN_IMAGE=old\nFROM ${WEKAN_IMAGE}\n')
        self.output = self.root / 'output'
        ucs.prepare(self.root / 'source', self.output, '12.28')

    def test_prepare_keeps_history_and_synchronizes_images(self):
        compose = (self.output / 'component/compose').read_text()
        self.assertIn('# Image was: old-mongo:6.09', compose)
        self.assertIn('# Image was: older:5.0', compose)
        self.assertIn('# Image was: ghcr.io/wekan/wekan:v12.27', compose)
        self.assertIn('image: ghcr.io/wekan/wekan:v12.28', compose)
        hook = (self.output / 'component/preinst').read_text()
        self.assertIn('dbimage='+DATABASE_IMAGE, hook)
        self.assertIn('helper=ghcr.io/wekan/wekan-ucs-migration:v12.28', hook)
        self.assertIn('ARG WEKAN_IMAGE=ghcr.io/wekan/wekan:v12.28', (self.output / 'component/migration/Dockerfile').read_text())
        self.assertEqual(ucs.images(compose, {'wekan': 'ghcr.io/wekan/wekan:v12.28', 'wekandb': DATABASE_IMAGE}), compose)

    def test_database_tag_override_updates_compose_and_hook(self):
        selected = 'ghcr.io/wekan/ferretdb:v1.93.0'
        result = ucs.prepare(self.root / 'source', self.output, '12.28', selected)
        self.assertEqual(result['database_image'], selected)
        compose = (self.output / 'component/compose').read_text()
        self.assertIn('    image: ' + selected, compose)
        self.assertIn('# Image was: ' + DATABASE_IMAGE, compose)
        self.assertIn('dbimage=' + selected, (self.output / 'component/preinst').read_text())

    def test_release_selection_uses_published_version_tags(self):
        stable = lambda tag: dict(tagName=tag, isDraft=False, isPrerelease=False)
        selected = ucs.release_selection(stable('v13.01'), stable('v1.95.0'))
        self.assertEqual(selected, {'VERSION': '13.01',
            'UCS_FERRETDB_IMAGE': 'ghcr.io/wekan/ferretdb:v1.95.0'})
        for bad in [stable('v2.0.0'), stable('latest'), dict(tagName='v1.95.0', isDraft=True, isPrerelease=False)]:
            with self.assertRaises(ValueError):
                ucs.release_selection(stable('v13.01'), bad)
        for bad in [stable('v13.01\nBAD=value'), dict(tagName='v13.01', isDraft=False, isPrerelease=True)]:
            with self.assertRaises(ValueError):
                ucs.release_selection(bad, stable('v1.95.0'))

    def test_create_upload_readback(self):
        portal = FakePortal()
        self.assertEqual(ucs.upload(portal, self.output, '4.4/wekan=6.09', '5.2/wekan=12.28'), 'uploaded')
        self.assertEqual([c[0] for c in portal.calls], ['list', 'new-version', 'upload', 'get'])
        self.assertEqual(set(portal.files), set(ucs.FILES))

    def test_retry_existing_draft(self):
        portal = FakePortal('draft')
        ucs.upload(portal, self.output, '4.4/wekan=6.09', '5.2/wekan=12.28')
        self.assertNotIn('new-version', [c[0] for c in portal.calls])

    def test_published_version_is_read_only(self):
        portal = FakePortal('published')
        self.assertEqual(ucs.upload(portal, self.output, '4.4/wekan=6.09', '5.2/wekan=12.28'), 'published')
        self.assertEqual([c[0] for c in portal.calls], ['list'])

    def test_readback_failure_is_not_success(self):
        with self.assertRaisesRegex(RuntimeError, 'read-back'):
            ucs.upload(FakePortal(broken=True), self.output, '4.4/wekan=6.09', '5.2/wekan=12.28')

    def test_missing_source_does_not_create_version(self):
        portal = FakePortal()
        with self.assertRaises(ValueError):
            ucs.plan(portal, '5.2/wekan=absent', '5.2/wekan=12.28')
        self.assertEqual([c[0] for c in portal.calls], ['list'])

    def test_missing_upload_file_fails_before_remote_write(self):
        (self.output / 'component/preinst').unlink()
        portal = FakePortal()
        with self.assertRaises(ValueError):
            ucs.upload(portal, self.output, '4.4/wekan=6.09', '5.2/wekan=12.28')
        self.assertEqual(portal.calls, [])

    def test_unsafe_versions_and_wrong_database_are_rejected(self):
        for value in ['v12.28', '12.28;touch file', '../bad', '12\n28']:
            with self.assertRaises(ValueError):
                ucs.version(value)
        for value in ['ghcr.io/ferretdb/ferretdb:2', 'ghcr.io/wekan/ferretdb:latest',
                      'ghcr.io/wekan/ferretdb@sha256:' + 'a' * 64,
                      'ghcr.io/wekan/ferretdb:v2.0.0']:
            with self.assertRaises(ValueError):
                ucs.prepare(self.root / 'source', self.output, '12.28', value)


if __name__ == '__main__':
    unittest.main()
