'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync, execFileSync } = require('node:child_process');
if (process.platform === 'win32') {
  console.log('fossilExport: Bash integration requires the Unix test runner; scripts are available through Git Bash');
  process.exit(0);
}
const root = path.resolve(__dirname, '..');
const tmp = path.join(root, '.tools/tmp');
fs.mkdirSync(tmp, { recursive: true });
const task = fs.mkdtempSync(path.join(tmp, 'fossil-export-'));
const repo = path.join(task, 'repo with spaces');
const bin = path.join(task, 'bin');
const quote = value => `'${value.replaceAll("'", "'\"'\"'")}'`;
const realGit = execFileSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim();
const git = (...args) => execFileSync(realGit, ['-C', repo, ...args], {
  encoding: 'utf8', env: { ...process.env, TMPDIR: tmp },
});
const run = (filename, overrides = {}) => spawnSync('/bin/bash', [path.join(repo, 'releases/fossil.sh'), filename], {
  cwd: task, encoding: 'utf8', env: {
    ...process.env, TMPDIR: tmp, PATH: `${bin}:${process.env.PATH}`, ...overrides,
  },
});

try {
  fs.mkdirSync(path.join(repo, 'releases'), { recursive: true });
  fs.mkdirSync(bin);
  fs.copyFileSync(path.join(root, 'releases/fossil.sh'), path.join(repo, 'releases/fossil.sh'));
  fs.copyFileSync(path.join(root, 'releases/fossil-ui.sh'), path.join(repo, 'releases/fossil-ui.sh'));
  git('init', '-q', '--initial-branch=main');
  git('config', 'user.name', 'Regression Test');
  git('config', 'user.email', 'regression@example.invalid');
  git('config', 'commit.gpgsign', 'false');
  fs.writeFileSync(path.join(repo, 'history.txt'), 'main history\n');
  git('add', 'history.txt'); git('commit', '-qm', 'main history');
  git('branch', 'feature');
  git('tag', '-a', 'v1', '-m', 'release one');
  git('update-ref', 'refs/remotes/origin/archived', 'HEAD');
  const tree = git('rev-parse', 'HEAD^{tree}').trim();
  git('update-ref', 'refs/codex/turn-diffs/captures/test/base', tree);
  git('checkout', '-q', '--orphan', 'internal');
  fs.writeFileSync(path.join(repo, 'history.txt'), 'internal-only history\n');
  git('add', 'history.txt'); git('commit', '-qm', 'internal-only history');
  git('update-ref', 'refs/checkpoints/internal', 'HEAD');
  git('checkout', '-q', 'main'); git('branch', '-D', 'internal');

  const original = spawnSync(realGit, ['-C', repo, 'fast-export', '--all', '--reencode=yes'], { encoding: 'utf8' });
  assert.match(original.stderr, /unexpected object of type tree/, 'fixture reproduces the reported warning');

  const mock = path.join(task, 'fossil-mock.cjs');
  fs.writeFileSync(mock, `const fs = require('node:fs');
const args = process.argv.slice(2);
if (args[0] === 'ui') { fs.writeFileSync(process.env.FOSSIL_UI_CAPTURE, JSON.stringify(args)); process.exit(0); }
const input = fs.readFileSync(0, 'utf8');
if (process.env.FOSSIL_MOCK_FAIL) { console.error('fossil import failed'); process.exit(23); }
fs.writeFileSync(args[args.length - 1], JSON.stringify({ args, input }));
`);
  fs.writeFileSync(path.join(bin, 'fossil'), `#!/bin/sh\nexec ${quote(process.execPath)} ${quote(mock)} "$@"\n`, { mode: 0o755 });
  const destination = 'output with spaces/history.fossil';
  const result = run(destination);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /unexpected object|skipping/);
  const output = JSON.parse(fs.readFileSync(path.join(task, destination), 'utf8'));
  assert.deepEqual(output.args, ['import', '--git', path.join(task, destination)]);
  for (const ref of ['refs/heads/main', 'refs/heads/feature', 'refs/remotes/origin/archived']) {
    assert.ok(output.input.includes(ref), `preserve ${ref}`);
  }
  assert.match(output.input, /tag v1\n/);
  assert.doesNotMatch(output.input, /refs\/codex\/|refs\/checkpoints\/|internal-only history/);
  console.log('  ok - real Git history exports branches, tags and remote branches without internal-ref warnings');

  const uiCapture = path.join(task, 'ui.json');
  const runUi = filename => spawnSync('/bin/bash', [path.join(repo, 'releases/fossil-ui.sh'), filename], {
    cwd: task, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, FOSSIL_UI_CAPTURE: uiCapture },
  });
  const ui = runUi(destination);
  assert.equal(ui.status, 0, ui.stderr);
  assert.deepEqual(JSON.parse(fs.readFileSync(uiCapture, 'utf8')), ['ui', path.join(task, destination)]);
  const missingUi = runUi('absent.fossil');
  assert.notEqual(missingUi.status, 0);
  assert.match(missingUi.stderr, /repository not found/);
  console.log('  ok - UI opens the selected local file and diagnoses a missing repository');

  const existing = run(destination);
  assert.equal(existing.status, 0, existing.stderr);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(task, destination), 'utf8')).args,
    ['import', '--git', '--incremental', path.join(task, destination)]);
  console.log('  ok - existing repositories use incremental import without force overwrite');

  const failedImport = run('failed-import.fossil', { FOSSIL_MOCK_FAIL: '1' });
  assert.notEqual(failedImport.status, 0);
  assert.match(failedImport.stderr, /fossil import failed/);
  assert.match(failedImport.stderr, /Git-to-Fossil export failed/);
  console.log('  ok - importer errors stay visible and fail the script');

  fs.writeFileSync(path.join(bin, 'git'), `#!/bin/sh\nif [ "$1" = fast-export ]; then echo 'git export failed' >&2; exit 7; fi\nexec ${quote(realGit)} "$@"\n`, { mode: 0o755 });
  const failedExport = run('failed-export.fossil');
  assert.notEqual(failedExport.status, 0);
  assert.match(failedExport.stderr, /git export failed/);
  console.log('  ok - exporter failure cannot be hidden by a successful importer');

  fs.unlinkSync(path.join(bin, 'fossil'));
  fs.symlinkSync('/usr/bin/dirname', path.join(bin, 'dirname'));
  const missing = run('missing-tool.fossil', { PATH: bin });
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /fossil is required/);
  console.log('  ok - missing Fossil reports the required tool clearly');
  const fossilBin = process.env.WEKAN_TEST_FOSSIL_BIN || spawnSync('sh', ['-c', 'command -v fossil'], { encoding: 'utf8' }).stdout.trim();
  if (fossilBin) {
    fs.unlinkSync(path.join(bin, 'git'));
    fs.writeFileSync(path.join(bin, 'fossil'), `#!/bin/sh\nexec ${quote(fossilBin)} "$@"\n`, { mode: 0o755 });
    const real = run('real-history.fossil');
    assert.equal(real.status, 0, real.stderr);
    assert.doesNotMatch(real.stderr, /unexpected object of type tree/);
    const filename = path.join(task, 'real-history.fossil');
    const timeline = execFileSync(fossilBin, ['timeline', '-R', filename, '-n', '20', '-t', 'ci'], { encoding: 'utf8' });
    assert.match(timeline, /main history/);
    assert.doesNotMatch(timeline, /internal-only history/);
    const tags = execFileSync(fossilBin, ['tag', 'list', '-R', filename], { encoding: 'utf8' });
    assert.match(tags, /v1/);
    fs.appendFileSync(path.join(repo, 'history.txt'), 'new history\n');
    git('add', 'history.txt'); git('commit', '-qm', 'new incremental commit');
    const updated = run('real-history.fossil');
    assert.equal(updated.status, 0, updated.stderr);
    const latest = execFileSync(fossilBin, ['timeline', '-R', filename, '-n', '20', '-t', 'ci'], { encoding: 'utf8' });
    assert.match(latest, /new incremental commit/);
    assert.match(latest, /main history/);
    assert.equal(run('real-history.fossil').status, 0);
    const repeated = execFileSync(fossilBin, ['timeline', '-R', filename, '-n', '20', '-t', 'ci'], { encoding: 'utf8' });
    assert.equal((repeated.match(/new incremental commit/g) || []).length, 1);
    assert.equal((repeated.match(/main history/g) || []).length, 1);
    console.log('  ok - real Fossil imports new commits and repeated runs do not duplicate history');
  } else {
    console.log('  skip - real Fossil import (install Fossil or set WEKAN_TEST_FOSSIL_BIN)');
  }
  console.log('fossilExport: 6 tests passed (real Git export; mocked Fossil failures and UI)');
} finally {
  fs.rmSync(task, { recursive: true, force: true });
}
