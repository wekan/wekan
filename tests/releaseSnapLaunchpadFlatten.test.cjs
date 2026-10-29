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
  // The snapshot is a fresh one-commit repository made with git archive, so the
  // checkout's history is never uploaded: a full clone (fetch-depth: 0, 447 MB
  // of history) was fetched for nothing.
  assert.doesNotMatch(body, /fetch-depth: 0/);
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
    fs.mkdirSync(path.join(dir, 'snap/hooks'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'snap/hooks/configure'), '#!/bin/sh');
    fs.mkdirSync(path.join(dir, 'releases'));
    fs.writeFileSync(path.join(dir, 'releases/fetch.sh'), '#!/bin/sh');
    fs.writeFileSync(path.join(dir, 'releases/unrelated.sh'), 'not for the snap');
    run(dir, 'git', ['add', '.']); run(dir, 'git', ['commit', '-qm', 'fixture']);
    fs.writeFileSync(path.join(dir, 'untracked.txt'), 'must not be uploaded');
    run(dir, 'bash', [helper, 'armhf']);
    const source = path.join(dir, '.tools/tmp/snap-launchpad-source');
    assert.equal(run(source, 'git', ['rev-parse', '--is-shallow-repository']), 'false');
    assert.equal(run(source, 'git', ['rev-list', '--count', 'HEAD']), '1');
    assert.ok(fs.statSync(path.join(source, '.git')).isFile());
    assert.ok(!fs.existsSync(path.join(source, 'untracked.txt')));
    // Only what the recipe reads: present paths in, everything else out.
    assert.ok(fs.existsSync(path.join(source, 'snapcraft.yaml')));
    assert.ok(fs.existsSync(path.join(source, 'snap/hooks/configure')));
    assert.ok(fs.existsSync(path.join(source, 'releases/fetch.sh')));
    assert.ok(!fs.existsSync(path.join(source, 'tracked.txt')), 'a file the recipe does not read is not uploaded');
    assert.ok(!fs.existsSync(path.join(source, 'releases/unrelated.sh')));
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

// Negative, against the real recipe: every project path snapcraft.yaml reads
// must be in the uploaded list, or the Launchpad build fails on a missing file
// - found only after an hour on a release's slowest builders.
test('the uploaded list covers every project path snapcraft.yaml refers to', () => {
  const recipe = fs.readFileSync(path.join(root, 'snapcraft.yaml'), 'utf8');
  const script = fs.readFileSync(helper, 'utf8');
  const listed = script.split('SNAP_SOURCE_PATHS=(')[1].split(')')[0].split(/\s+/).filter(Boolean);
  const covered = (p) => listed.some((l) => p === l || p.startsWith(l + '/'));
  const refs = new Set();
  for (const m of recipe.matchAll(/(?:\.\.\/|PROJECT_DIR[^/\n]*\/)([A-Za-z0-9_.-]+\/[A-Za-z0-9_./-]+)/g)) {
    if (!m[1].startsWith('parts/') && !m[1].startsWith('stage/')) refs.add(m[1]);
  }
  for (const m of recipe.matchAll(/^\s+source: ([A-Za-z0-9_./-]+)\s*$/gm)) {
    if (m[1] !== '.' && !/^[a-z]+:\/\//.test(m[1])) refs.add(m[1]);
  }
  assert.ok(refs.size >= 5, `found ${refs.size} project paths in snapcraft.yaml`);
  for (const ref of refs) assert.ok(covered(ref), `snapcraft.yaml reads ${ref}, which is not uploaded to Launchpad`);
  for (const l of listed) assert.ok(fs.existsSync(path.join(root, l)), `${l} is listed but does not exist`);
});

// v12.69 armhf and s390x: fetch.sh was uploaded without the tools-env.sh it
// sources, so in the Launchpad build it had no TMPDIR, mktemp made nothing and
// curl got an empty -o seven times ("option -o: is badly used here"). A listed
// script's own releases/ dependencies must be listed too.
test('every releases/ file a listed script sources or runs is uploaded as well', () => {
  const script = fs.readFileSync(helper, 'utf8');
  const listed = script.split('SNAP_SOURCE_PATHS=(')[1].split(')')[0].split(/\s+/).filter(Boolean);
  assert.ok(listed.includes('releases/tools-env.sh'));
  for (const l of listed.filter(f => /\.(sh|mjs|py)$/.test(f))) {
    const text = fs.readFileSync(path.join(root, l), 'utf8');
    for (const m of text.matchAll(/(?:^|[\s;])(?:\.|source|bash|node|python3)\s+"?\$\(dirname "\$\{BASH_SOURCE\[0\]\}"\)\/([A-Za-z0-9_.-]+)"?/gm)) {
      assert.ok(listed.includes(`releases/${m[1]}`), `${l} uses releases/${m[1]}, which is not uploaded to Launchpad`);
    }
  }
});

test('negative: in the uploaded tree, with no .git and no TMPDIR, tools-env.sh gives a TMPDIR inside it', () => {
  const tmp = path.join(root, '.tools/tmp'); fs.mkdirSync(tmp, { recursive: true });
  const dir = fs.mkdtempSync(path.join(tmp, 'launchpad-tree-test-'));
  try {
    // What Launchpad builds from: snapcraft.yaml and releases/, nothing else.
    fs.writeFileSync(path.join(dir, 'snapcraft.yaml'), 'name: wekan\n');
    fs.mkdirSync(path.join(dir, 'releases'));
    for (const f of ['fetch.sh', 'tools-env.sh']) fs.copyFileSync(path.join(root, 'releases', f), path.join(dir, 'releases', f));
    const env = { PATH: process.env.PATH, HOME: dir };
    const r = spawnSync('bash', ['-c', '. releases/tools-env.sh && printf %s "$TMPDIR" && t=$(mktemp "$TMPDIR/x.XXXXXX") && test -n "$t"'],
      { cwd: dir, encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(fs.realpathSync(r.stdout), fs.realpathSync(path.join(dir, '.tools/tmp')));
    // fetch.sh itself gets past its TMPDIR: a missing URL is a clean answer.
    const f = spawnSync('bash', ['releases/fetch.sh', '--optional', '-o', 'out', 'http://127.0.0.1:9/none'],
      { cwd: dir, encoding: 'utf8', env: { ...env, FETCH_SLEEPS: '0' } });
    assert.doesNotMatch(f.stderr, /unbound variable|No such file|badly used|blank argument/, f.stderr);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
