#!/usr/bin/env python3
import importlib.util
import json
import os
import subprocess
from unittest.mock import patch
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
        (component / 'preinst').write_text('image=old\nhelper=old-helper\ndbimage=old-db\ndocker pull "$image"\ndocker pull "$dbimage"\ndocker pull "$helper"\ndocker run -v /var/run/docker.sock:/var/run/docker.sock -v "$target:/data" "$helper"\n')
        (component / 'migration').mkdir()
        (component / 'migration/Dockerfile').write_text('ARG WEKAN_IMAGE=old\nFROM ${WEKAN_IMAGE}\n')
        self.output = self.root / 'output'
        ucs.prepare(self.root / 'source', self.output, '12.28')
        self.public_patcher = patch.object(ucs, 'verify_public_images')
        self.public_check = self.public_patcher.start()
        self.addCleanup(self.public_patcher.stop)

    def test_anonymous_pulls_use_empty_config_for_every_image(self):
        self.public_patcher.stop()
        configs = []
        def pull(command, **kwargs):
            if command[0] == 'docker':
                self.assertEqual(command[1], '--config')
                config = Path(command[2])
                self.assertEqual(command[3:5], ['run', '--rm'])
            else:
                self.assertEqual(command[:2], ['bash', '-c'])
                config = Path(kwargs['env']['DOCKER_CONFIG'])
            self.assertTrue(config.is_dir())
            self.assertEqual(list(config.iterdir()), [])
            configs.append(config)
            return subprocess.CompletedProcess(command, 0, stdout='1000\n' if command[-1] == '-u' else '')
        with patch.object(ucs.subprocess, 'run', side_effect=pull) as run:
            ucs.verify_public_images(self.output)
        self.assertEqual([call.args[0][-1] for call in run.call_args_list[:2]], [
            'ghcr.io/wekan/wekan:v12.28', DATABASE_IMAGE])
        self.assertTrue(all(not config.exists() for config in configs))

    def test_private_or_missing_image_blocks_new_and_existing_drafts(self):
        self.public_patcher.stop()
        for state in ('new', 'draft'):
            for failed_image in range(2):
                portal = FakePortal(state)
                responses = [subprocess.CompletedProcess([], 0)] * failed_image
                responses.append(subprocess.CompletedProcess([], 1, '', 'unauthorized'))
                with patch.object(ucs.subprocess, 'run', side_effect=responses) as run:
                    with self.assertRaisesRegex(RuntimeError, 'anonymously.*Portal draft not uploaded'):
                        ucs.upload(portal, self.output, '4.4/wekan=6.09', '5.2/wekan=12.28')
                self.assertEqual([call[0] for call in portal.calls], ['list'])
                self.assertFalse(Path(run.call_args.kwargs['env']['DOCKER_CONFIG']).exists())

    def test_old_image_without_bundled_tools_cannot_create_a_portal_draft(self):
        self.public_patcher.stop()
        portal = FakePortal()
        responses = [subprocess.CompletedProcess([], 0)] * 2 + [subprocess.CompletedProcess([], 1)]
        with patch.object(ucs.subprocess, 'run', side_effect=responses):
            with self.assertRaisesRegex(RuntimeError, 'lacks working bundled UCS migration tools'):
                ucs.upload(portal, self.output, '4.4/wekan=6.09', '5.2/wekan=12.28')
        self.assertEqual([call[0] for call in portal.calls], ['list'])

    def test_wrong_database_uid_blocks_portal_write(self):
        self.public_patcher.stop()
        portal = FakePortal()
        responses = [subprocess.CompletedProcess([], 0)] * 4 + [subprocess.CompletedProcess([], 0, '0\n')]
        with patch.object(ucs.subprocess, 'run', side_effect=responses):
            with self.assertRaisesRegex(RuntimeError, 'UID 1000'):
                ucs.upload(portal, self.output, '4.4/wekan=6.09', '5.2/wekan=12.28')
        self.assertEqual([call[0] for call in portal.calls], ['list'])

    def test_invalid_or_duplicate_image_is_rejected_before_pull(self):
        self.public_patcher.stop()
        hook = self.output / 'component/preinst'
        valid = hook.read_text()
        for bad in (valid + 'image=duplicate\n', valid.replace('dbimage=', '#dbimage='),
                    valid.replace('ghcr.io/wekan/wekan:v12.28', '--all-tags')):
            hook.write_text(bad)
            with patch.object(ucs.subprocess, 'run') as run:
                with self.assertRaises(ValueError):
                    ucs.verify_public_images(self.output)
                run.assert_not_called()

    def test_cli_reads_password_from_fresh_pipe_without_disk_storage(self):
        cli = self.root / 'fake-cli.py'
        cli.write_text("""import json, os, sys
password = open(sys.argv[sys.argv.index('--pwdfile') + 1]).read()
assert password == 'test-provider-secret'
assert password not in ' '.join(sys.argv)
assert 'UNIVENTION_APP_PROVIDER_PASSWORD' not in os.environ
print(json.dumps({'authenticated': True}))
""")
        before = set(self.root.rglob('*'))
        portal = ucs.Portal(str(cli), 'test-user', 'test-provider-secret')
        with patch.dict(os.environ, UNIVENTION_APP_PROVIDER_PASSWORD='test-provider-secret'), \
             patch.object(ucs.Path, 'write_text', side_effect=AssertionError('no credential files')):
            for action in ('list', 'get'):
                self.assertEqual(portal.call(action, json_result=True), {'authenticated': True})
        self.assertEqual(set(self.root.rglob('*')), before)

    def test_cli_failure_does_not_expose_credentials_or_private_output(self):
        portal = ucs.Portal('unused', 'test-user', 'test-provider-secret')
        failure = subprocess.CompletedProcess([], 1, 'test-provider-secret private settings',
                                               'test-provider-secret authentication failed')
        with patch.object(ucs.subprocess, 'run', return_value=failure):
            with self.assertRaises(RuntimeError) as error:
                portal.call('list', json_result=True)
        self.assertNotIn('test-provider-secret', str(error.exception))
        self.assertNotIn('private settings', str(error.exception))
        self.assertIn('exit 1', str(error.exception))

    def test_prepare_keeps_history_and_synchronizes_images(self):
        compose = (self.output / 'component/compose').read_text()
        self.assertIn('# Image was: old-mongo:6.09', compose)
        self.assertIn('# Image was: older:5.0', compose)
        self.assertIn('# Image was: ghcr.io/wekan/wekan:v12.27', compose)
        self.assertIn('image: ghcr.io/wekan/wekan:v12.28', compose)
        hook = (self.output / 'component/preinst').read_text()
        self.assertIn('dbimage='+DATABASE_IMAGE, hook)
        self.assertIn('helper=ghcr.io/wekan/wekan:v12.28', hook)
        self.assertIn('\"$helper\" bash /opt/ucs-migration/start.sh', hook)
        self.assertIn('ucs_pull_image \"$image\"', hook)
        self.assertNotIn('docker pull \"$helper\"', hook)
        self.assertFalse((self.output / 'component/migration/Dockerfile').exists())
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
        self.public_check.assert_not_called()

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
