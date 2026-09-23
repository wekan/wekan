#!/usr/bin/env python3
"""Offline release tests; remote writes and process execution are mocked."""
import contextlib
import importlib.util
import io
import json
import subprocess
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('release', ROOT / 'releases/remote-release.py')
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        (ROOT / '.tools/tmp').mkdir(parents=True, exist_ok=True)
        self.tmp = tempfile.TemporaryDirectory(dir=ROOT / '.tools/tmp')
        self.root = Path(self.tmp.name)
        (self.root / 'releases').mkdir()
        self.config = {'repo':'wekan/demo','kind':'website','branch':'main',
                       'upcoming':'# Upcoming demo release','audits':[]}
        self.text = self.config['upcoming'] + '\n\n- Working feature.\n'
        (self.root / 'CHANGELOG.md').write_text(self.text)

    def tearDown(self):
        self.tmp.cleanup()

    def test_origin_url_formats(self):
        repo = json.loads((ROOT / 'releases/remote-release.json').read_text())['repo']
        accepted = [prefix + repo + suffix
                    for prefix in ('https://github.com/', 'git@github.com:', 'ssh://git@github.com/')
                    for suffix in ('', '.git')]
        rejected = ['', 'https://github.com.evil/' + repo,
                    'https://github.com/' + repo + '-other.git',
                    'git@github.com:another/repository.git',
                    'ssh://git@github.com.evil/' + repo,
                    'https://github.com/' + repo + '/extra',
                    'https://github.com/' + repo + '.git?redirect=other',
                    'https://github.com@evil/' + repo]
        for remote in accepted + rejected:
            with self.subTest(remote=remote):
                self.assertEqual(r.valid_origin(remote, repo), remote in accepted)
                if repo == 'wekan/wekan':
                    # Exercise the real shell gate without running release actions.
                    source = (ROOT / 'releases/release-all.sh').read_text()
                    start = source.index('case "$(git remote get-url origin)" in')
                    gate = source[start:source.index('esac', start) + 4]
                    result = subprocess.run(['bash', '-c',
                        'git() { printf "%s" "$TEST_ORIGIN"; }; ' + gate],
                        env={**r.os.environ, 'TEST_ORIGIN': remote}, capture_output=True)
                    self.assertEqual(result.returncode == 0, remote in accepted)
                    if remote in rejected:
                        self.assertIn(b'origin must point to wekan/wekan', result.stderr)

    def test_real_notes_required_and_unchanged(self):
        self.assertEqual(r.notes(self.root, self.config), self.text)
        for bad in ['', self.config['upcoming'] + '\n', self.text + self.text]:
            (self.root / 'CHANGELOG.md').write_text(bad)
            with self.assertRaises(ValueError):
                r.notes(self.root, self.config)
            self.assertEqual((self.root / 'CHANGELOG.md').read_text(), bad)

    def test_dependency_inventory_detects_new_changed_deleted_and_symlink(self):
        path = self.root / 'package.json'
        path.write_text('{"version":"1.0.0","dependencies":{"foo":"1"}}')
        with patch.object(r, 'run', return_value='package.json'):
            original = r.inventory(self.root)
            (self.root/'releases/dependency-review.json').write_text(json.dumps({'files':original}))
            r.audit(self.root,self.config)
            path.write_text('{"version":"2.0.0","dependencies":{"foo":"1"}}')
            r.audit(self.root,self.config)
            path.write_text('{"version":"2.0.0","dependencies":{"foo":"2"}}')
            with contextlib.redirect_stderr(io.StringIO()) as findings:
                r.audit(self.root,self.config)
            self.assertIn('::warning::', findings.getvalue())
            path.unlink()
            with contextlib.redirect_stderr(io.StringIO()) as findings:
                r.audit(self.root,self.config)
            self.assertIn('::warning::', findings.getvalue())
            path.symlink_to(self.root/'CHANGELOG.md')
            with self.assertRaisesRegex(ValueError, 'regular file'):
                r.inventory(self.root)
        with patch.object(r,'run',return_value='go.mod'):
            (self.root/'go.mod').write_text('module evil\n')
            with contextlib.redirect_stderr(io.StringIO()) as findings:
                r.audit(self.root,self.config)
            self.assertIn('::warning::', findings.getvalue())

    def test_no_dependencies_accepts_empty_inventory(self):
        (self.root/'releases/dependency-review.json').write_text('{"files":{}}')
        with patch.object(r,'run',return_value='index.html'):
            r.audit(self.root,self.config)

    def test_missing_upstream_baseline_warns_without_blocking(self):
        self.config.update(kind='node',upstream={'review':'releases/upstream.json','url':'unused'})
        (self.root/'releases/upstream.json').write_text('{"upstreamCommit":null}')
        (self.root/'node-major.txt').write_text('26\n')
        with patch.object(r,'run',return_value='a'*40+'\trefs/tags/v26.9.0'), contextlib.redirect_stderr(io.StringIO()) as findings:
            self.assertEqual(r.source_version(self.root,self.config,'v26.9.0'),'v26.9.0')
        self.assertIn('::warning::',findings.getvalue())

    def test_node_resolver_uses_shell_relative_path_on_windows(self):
        self.config.update(kind='node', upstream={'review':'releases/upstream.json','url':'unused'})
        (self.root/'releases/upstream.json').write_text('{"upstreamCommit":null}')
        (self.root/'node-major.txt').write_text('26\n')
        def invoke(root, *args):
            if args[0] == 'bash':
                self.assertEqual(args, ('bash', 'releases/newest-release.sh', '.'))
                return 'v26.10.0'
            return 'a'*40+'\trefs/tags/v26.10.0'
        with patch.object(r, 'run', side_effect=invoke), contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(r.source_version(self.root, self.config), 'v26.10.0')

    def test_changed_upstream_fails_and_reviewed_sha_passes(self):
        sha='a'*40
        self.config.update(kind='mongo-tools',upstream={'review':'releases/upstream.json','url':'unused'})
        (self.root/'releases/upstream.json').write_text(json.dumps({'upstreamCommit':sha}))
        self.assertEqual(r.source_version(self.root,self.config,sha),sha)
        with contextlib.redirect_stderr(io.StringIO()) as findings:
            self.assertEqual(r.source_version(self.root,self.config,'b'*40),'b'*40)
        self.assertIn('::warning::',findings.getvalue())

    def test_missing_preserves_version_and_selects_existing_source(self):
        with patch.object(r,'latest',return_value=['v12','v11']):
            self.assertEqual(r.prepare_version(self.root,self.config,self.text,True,''),'v12')
            self.assertEqual(r.prepare_version(self.root,self.config,self.text,False,''),'v13')
            with self.assertRaises(ValueError):
                r.prepare_version(self.root,self.config,self.text,True,'v99')
        self.config['kind']='mongosh'
        with patch.object(r,'latest',return_value=['main-'+'a'*12]),patch.object(r,'source_version') as verify:
            self.assertEqual(r.prepare_version(self.root,self.config,self.text,True,''),'main-'+'a'*12)
            verify.assert_called_once_with(self.root,self.config,'main-'+'a'*12)

    def test_publish_orders_commit_push_dispatch_including_untracked(self):
        calls=[]
        def run(root,*args):
            calls.append(args)
            return 'new-file' if args[:2]==('git','diff') else ''
        with patch.object(r,'run',side_effect=run),patch.object(r.subprocess,'run',side_effect=lambda args,**kw:calls.append(tuple(args))):
            r.publish(self.root,self.config,self.text,'v3',False)
        self.assertEqual(calls[0],('git','add','--all'))
        self.assertEqual(calls[2][:2],('git','commit'))
        self.assertEqual(calls[3],('git','push','origin','HEAD:refs/heads/main'))
        self.assertEqual(calls[4][:4],('gh','workflow','run','release-all.yml'))
        self.assertIn('# v3 ',(self.root/'CHANGELOG.md').read_text())

    def test_missing_never_renames_notes_or_tags(self):
        with patch.object(r,'run',return_value=''),patch.object(r.subprocess,'run') as process:
            r.publish(self.root,self.config,self.text,'v2',True)
            commands=[c.args[0] for c in process.call_args_list]
            self.assertIn('release-all-missing.yml',commands[-1])
            self.assertFalse(any('tag' in c for c in commands))
        self.assertEqual((self.root/'CHANGELOG.md').read_text(),self.text)

    def test_failed_commit_or_push_prevents_dispatch(self):
        for failure in ['commit','push']:
            calls=[]
            def execute(args,**kwargs):
                calls.append(args)
                if args[0:2]==['git',failure]:
                    raise r.subprocess.CalledProcessError(1,args)
            with patch.object(r,'run',return_value='new'),patch.object(r.subprocess,'run',side_effect=execute):
                with self.assertRaises(r.subprocess.CalledProcessError):
                    r.publish(self.root,self.config,self.text,'v3',False)
            self.assertFalse(any(c[0]=='gh' for c in calls))

    def test_missing_uses_existing_notes_without_new_upcoming(self):
        text = '# v2 2026-09-23 demo release\n\n- Existing feature.\n'
        (self.root / 'CHANGELOG.md').write_text(text)
        self.assertEqual(r.notes(self.root, self.config, True), text)
        with self.assertRaises(ValueError):
            r.notes(self.root, self.config, False)

    def test_audit_failure_stops_main_before_version_or_publish(self):
        (self.root/'releases/remote-release.json').write_text(json.dumps(self.config))
        with patch.object(r, '__file__', str(self.root/'releases/remote-release.py')), \
             patch.object(r, 'audit', side_effect=ValueError('Risk indicators found')), \
             patch.object(r, 'prepare_version') as version, patch.object(r, 'publish') as publish, \
             patch.object(r.sys, 'argv', ['remote-release.py', 'all']):
            with self.assertRaisesRegex(ValueError, 'Risk indicators'):
                r.main()
            version.assert_not_called()
            publish.assert_not_called()
        self.assertEqual((self.root/'CHANGELOG.md').read_text(), self.text)

    def test_check_mode_never_changes_notes_or_publishes(self):
        (self.root/'releases/remote-release.json').write_text(json.dumps(self.config))
        with patch.object(r, '__file__', str(self.root/'releases/remote-release.py')), \
             patch.object(r, 'audit'), patch.object(r, 'run', side_effect=['main', 'git@github.com:wekan/demo.git', '', 'authenticated']), \
             patch.object(r, 'prepare_version', return_value='v4'), patch.object(r, 'publish') as publish, \
             patch.object(r.sys, 'argv', ['remote-release.py', 'all', '--check']):
            r.main()
            publish.assert_not_called()
        self.assertEqual((self.root/'CHANGELOG.md').read_text(), self.text)

    def test_node_tag_must_resolve_to_reviewed_commit(self):
        sha='a'*40
        self.config.update(kind='node',upstream={'review':'releases/upstream.json','url':'unused'})
        (self.root/'releases/upstream.json').write_text(json.dumps({'upstreamCommit':sha}))
        (self.root/'node-major.txt').write_text('26\n')
        with patch.object(r,'run',return_value=sha+'\trefs/tags/v26.9.0^{}'):
            self.assertEqual(r.source_version(self.root,self.config,'v26.9.0'),'v26.9.0')
            with self.assertRaisesRegex(ValueError,'Invalid'):
                r.source_version(self.root,self.config,'v25.0.0')
        with patch.object(r,'run',return_value='b'*40+'\trefs/tags/v26.9.0^{}'):
            with contextlib.redirect_stderr(io.StringIO()) as findings:
                self.assertEqual(r.source_version(self.root,self.config,'v26.9.0'),'v26.9.0')
            self.assertIn('::warning::',findings.getvalue())

    def test_mongosh_commit_must_match_source_and_lockfile_review(self):
        sha='a'*40
        self.config.update(kind='mongosh',upstream={'review':'releases/upstream.json','url':'unused'})
        (self.root/'releases/upstream.json').write_text(json.dumps({'upstreamCommit':sha}))
        for commit in [sha,'b'*40]:
            doc={'commit':commit,'release':'main-'+commit[:12]}
            with patch.object(r,'run',return_value=json.dumps(doc)):
                if commit==sha:
                    self.assertEqual(r.source_version(self.root,self.config),'main-'+sha[:12])
                else:
                    with contextlib.redirect_stderr(io.StringIO()) as findings:
                        self.assertEqual(r.source_version(self.root,self.config),'main-'+commit[:12])
                    self.assertIn('::warning::',findings.getvalue())


if __name__=='__main__':
    unittest.main()
