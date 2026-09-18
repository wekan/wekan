'use strict';
// Exercise the actual snapshot preparation, including the project hash shape
// used by craft-application.remote.utils._compute_hash (all files, even .git).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/release-all.yml'), 'utf8');
const body = workflow.split('\n  snap-launchpad:\n')[1].split(/\n  [a-z0-9-]+:\n/)[0];
const helper = path.join(root, 'releases/prepare-launchpad-source.sh');
function run(cwd, cmd, args) {
  const result = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, TMPDIR: path.join(root, '.tools/tmp') } });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function projectHash(dir) {
  const files = [];
  function walk(at) {
    for (const name of fs.readdirSync(at)) {
      const file = path.join(at, name);
      if (fs.statSync(file).isDirectory()) walk(file); else files.push(file);
    }
  }
  walk(dir);
  const hashes = files.sort().map(file => crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex')).join('');
  return crypto.createHash('md5').update(hashes).digest('hex');
}
test('Launchpad prepares a complete isolated source before running remote-build', () => {
  assert.ok(body.indexOf('actions/checkout@') < body.indexOf('bash releases/prepare-launchpad-source.sh'));
  assert.ok(body.indexOf('bash releases/prepare-launchpad-source.sh') < body.indexOf('bash "$remote_wrapper" remote-build --launchpad-accept-public-upload'));
  assert.match(body, /fetch-depth: 0/);
  assert.match(body, /cd "\$remote_source"/);
  assert.match(body, /tee "\$remote_log"/);
  assert.match(body, /mv "\$download" \./);
});
test('snapshot is complete, repeatable, architecture-specific and usable from Snapcraft cache', () => {
  const tmp = path.join(root, '.tools/tmp'); fs.mkdirSync(tmp, { recursive: true });
  const dir = fs.mkdtempSync(path.join(tmp, 'launchpad-source-test-'));
  try {
    run(dir, 'git', ['init', '-q']);
    run(dir, 'git', ['config', 'user.name', 'Test Fixture']);
    run(dir, 'git', ['config', 'user.email', 'fixture@example.invalid']);
    fs.writeFileSync(path.join(dir, 'snapcraft.yaml'), 'name: wekan\nversion: 11.85\n');
    fs.writeFileSync(path.join(dir, 'tracked.txt'), 'source');
    run(dir, 'git', ['add', '.']); run(dir, 'git', ['commit', '-qm', 'fixture']);
    fs.writeFileSync(path.join(dir, 'untracked.txt'), 'must not be uploaded');
    run(dir, 'bash', [helper, 'armhf']);
    const source = path.join(dir, '.tools/tmp/snap-launchpad-source');
    assert.equal(run(source, 'git', ['rev-parse', '--is-shallow-repository']), 'false');
    assert.equal(run(source, 'git', ['rev-list', '--count', 'HEAD']), '1');
    assert.ok(fs.statSync(path.join(source, '.git')).isFile());
    assert.ok(!fs.existsSync(path.join(source, 'untracked.txt')));
    const hash = projectHash(source);
    const commit = run(source, 'git', ['rev-parse', 'HEAD']);
    run(source, 'git', ['status', '--porcelain']); // refreshes the external index
    fs.writeFileSync(path.join(dir, '.tools/tmp/retry.log'), 'SSL EOF');
    assert.equal(projectHash(source), hash);
    // craft-application WorkTree.init_repo uses copytree, then GitRepo on it.
    const cache = path.join(dir, 'cache'); fs.cpSync(source, cache, { recursive: true });
    assert.equal(run(cache, 'git', ['status', '--porcelain']), '');
    assert.equal(run(cache, 'git', ['rev-parse', 'HEAD']), commit);
    run(dir, 'bash', [helper, 'armhf']);
    assert.equal(projectHash(source), hash, 'same workspace/architecture must recover the same recipe');
    assert.equal(run(source, 'git', ['rev-parse', 'HEAD']), commit);
    run(dir, 'bash', [helper, 's390x']);
    assert.notEqual(projectHash(source), hash, 'matrix legs must not replace one another');
    const invalid = spawnSync('bash', [helper, 'invalid'], { cwd: dir, encoding: 'utf8' });
    assert.equal(invalid.status, 2);
    assert.equal(run(dir, 'git', ['log', '-1', '--format=%s']), 'fixture', 'original checkout unchanged');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
