'use strict';
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
test('Snapcraft compatibility handles the v11.86 failures without network writes', () => {
  const script = String.raw`
import importlib.util
from pathlib import Path
from types import SimpleNamespace
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('compat', 'releases/snapcraft-remote-compat.py')
compat = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compat)

class BadRequest(Exception):
    def __init__(self, content):
        self.content = content

class Tests(unittest.TestCase):
    def service(self, recipe=None, fetch=None):
        class Service:
            def _new_recipe(self, *args, **kwargs):
                return recipe(*args, **kwargs) if recipe else 'recipe'
            def fetch_artifacts(self, directory):
                return fetch(directory) if fetch else []
        now = [0]
        def sleep(seconds):
            now[0] += seconds
        compat.apply_workarounds(Service, BadRequest, clock=lambda: now[0], sleep=sleep)
        return Service(), now

    def test_recovery_uses_submission_project(self):
        service, _ = self.service()
        service._name = 'snapcraft-wekan-hash'
        service._lp_project = SimpleNamespace(name='xet7-craft-remote-build')
        service.lp = SimpleNamespace(username='xet7', get_repository=lambda **kw: kw)
        self.assertEqual(service._get_repository(), dict(name=service._name, owner='xet7', project='xet7-craft-remote-build'))
        service._lp_project = None
        with self.assertRaises(RuntimeError):
            service._get_repository()

    def test_ref_index_delay_retries_recipe_without_resubmitting(self):
        calls = []
        def recipe(*args, **kwargs):
            calls.append((args, kwargs))
            if len(calls) < 3:
                raise BadRequest(b'git_ref: No such object "/~xet7/project/+git/name/+ref/main".')
            return 'ready'
        service, now = self.service(recipe=recipe)
        self.assertEqual(service._new_recipe('name', 'repository', architectures=['s390x']), 'ready')
        self.assertEqual(len(calls), 3)
        self.assertEqual(now[0], 30)
        self.assertTrue(all(call == calls[0] for call in calls))

    def test_unrelated_errors_fail_immediately_and_ref_wait_is_bounded(self):
        for error in [BadRequest(b'name: already exists'), PermissionError('401'), BadRequest(b'git_ref: invalid format')]:
            def recipe(*args, **kwargs):
                raise error
            service, now = self.service(recipe=recipe)
            with self.assertRaises(type(error)):
                service._new_recipe('name', 'repo')
            self.assertEqual(now[0], 0)
        def recipe(*args, **kwargs):
            raise BadRequest(b'git_ref: No such object /+ref/main')
        service, now = self.service(recipe=recipe)
        with self.assertRaises(BadRequest):
            service._new_recipe('name', 'repo')
        self.assertEqual(now[0], 900)

    def test_invalid_download_is_deleted_and_retried_before_cleanup(self):
        with tempfile.TemporaryDirectory() as directory:
            calls = []
            def fetch(at):
                snap = Path(at) / 'wekan.snap'
                self.assertFalse(snap.exists())
                calls.append(1)
                with snap.open('wb') as stream:
                    if len(calls) == 1:
                        stream.write(b'<html>error</html>')
                    else:
                        stream.write(b'hsqs')
                        stream.truncate(compat.MIN_SNAP_BYTES)
                return [snap]
            service, _ = self.service(fetch=fetch)
            files = service.fetch_artifacts(Path(directory))
            self.assertEqual(len(calls), 2)
            self.assertTrue(compat.valid_snap(files[0]))

    def test_repeated_bad_download_raises_so_upstream_cannot_cleanup(self):
        with tempfile.TemporaryDirectory() as directory:
            calls = []
            def fetch(at):
                snap = Path(at) / 'wekan.snap'
                self.assertFalse(snap.exists())
                calls.append(1)
                with snap.open('wb') as stream:
                    stream.write(b'html')
                    stream.truncate(compat.MIN_SNAP_BYTES)
                return [snap]
            service, _ = self.service(fetch=fetch)
            cleaned = False
            try:
                service.fetch_artifacts(Path(directory))
            except RuntimeError as error:
                self.assertIn('remote build retained', str(error))
            else:
                cleaned = True
            self.assertFalse(cleaned)
            self.assertEqual(len(calls), 3)
            self.assertFalse((Path(directory) / 'wekan.snap').exists())

    def test_empty_build_and_transport_errors_are_not_hidden(self):
        service, _ = self.service()
        self.assertEqual(service.fetch_artifacts(Path('.')), [])
        def fetch(at):
            raise ConnectionError('TLS EOF')
        service, now = self.service(fetch=fetch)
        with self.assertRaises(ConnectionError):
            service.fetch_artifacts(Path('.'))
        self.assertEqual(now[0], 0)

unittest.main()
`;
  const result = spawnSync('python3', ['-B', '-c', script], {
    cwd: root, encoding: 'utf8', timeout: 10000,
    env: { ...process.env, TMPDIR: path.join(root, '.tools/tmp'), PYTHONDONTWRITEBYTECODE: '1' },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('launcher enters the Snapcraft environment and preserves arguments exactly', () => {
  const fs = require('node:fs');
  const dir = fs.mkdtempSync(path.join(root, '.tools/tmp/snapcraft-launcher-'));
  try {
    const bin = path.join(dir, 'bin'); fs.mkdirSync(bin);
    const snapRoot = path.join(dir, 'snap runtime'); fs.mkdirSync(path.join(snapRoot, 'bin'), { recursive: true });
    fs.writeFileSync(path.join(bin, 'snap'), `#!/bin/bash
[ "$1" = run ] && [ "$2" = --shell ] && [ "$3" = snapcraft ] || exit 2
shift 3
exec /bin/bash "$@"
`, { mode: 0o755 });
    fs.writeFileSync(path.join(snapRoot, 'bin/python'), `#!${process.execPath}
process.stdout.write(JSON.stringify(process.argv.slice(2)));
`, { mode: 0o755 });
    const args = ['remote-build', '--recover', '--project', 'project with spaces', '--build-for', 's390x'];
    const result = spawnSync('bash', ['releases/snapcraft-remote-compat.sh', ...args], {
      cwd: root, encoding: 'utf8', timeout: 10000,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, SNAP: snapRoot, TMPDIR: dir },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), [path.join(root, 'releases/snapcraft-remote-compat.py'), ...args]);
    const unsupported = spawnSync('python3', ['-B', 'releases/snapcraft-remote-compat.py', 'upload'], {
      cwd: root, encoding: 'utf8', env: { ...process.env, TMPDIR: dir },
    });
    assert.notEqual(unsupported.status, 0);
    assert.match(unsupported.stderr, /remote-build only/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
