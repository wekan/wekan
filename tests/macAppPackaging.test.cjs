const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (name) => readFileSync(path.join(root, name), 'utf8');

test('both Mac app architectures are released and can be rebuilt if missing', () => {
  const mac = read('.github/workflows/mac.yml');
  const all = read('.github/workflows/release-all.yml');
  const missing = read('.github/workflows/release-all-missing.yml');
  const assets = execFileSync('bash', ['releases/expected-assets.sh', '99.1'], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.match(mac, /arch: arm64\s+bundle_arch: mac-arm64\s+runner: macos-15/);
  assert.match(mac, /arch: amd64\s+bundle_arch: mac-x64\s+runner: macos-15-intel/);
  assert.match(mac, /shasum -a 256 -c "\$zip\.sha256sum"/);
  assert.match(mac, /for file in main\.js node ferretdb start-wekan\.sh/);
  assert.match(mac, /Smoke test Node\.js, FerretDB and Meteor/);
  assert.match(all, /mac-app:[\s\S]*?needs: \[prepare, release, build-mac-arm64, build-mac-x64\]/);
  assert.match(missing, /mac:[\s\S]*?uses: \.\/\.github\/workflows\/mac\.yml/);
  for (const arch of ['arm64', 'amd64']) {
    assert.ok(assets.includes(`mac ${arch} WeKan-99.1-mac-${arch}.app.zip sums`));
  }
});

test('Mac workflow lists the ZIP using a supported archive command', () => {
  const mac = read('.github/workflows/mac.yml');
  assert.doesNotMatch(mac, /ditto -t/);
  assert.match(mac, /unzip -Z1 "dist\/WeKan-\$\{VERSION\}-mac-\$\{MAC_ARCH\}\.app\.zip"/);
});

test('macOS can list a ditto-created app ZIP and reject a missing ZIP', { skip: process.platform !== 'darwin' }, () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const { spawnSync } = require('node:child_process');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-mac-zip-'));
  try {
    const app = 'WeKan-test-mac-arm64.app';
    fs.mkdirSync(path.join(dir, app, 'Contents/MacOS'), { recursive: true });
    fs.writeFileSync(path.join(dir, app, 'Contents/MacOS/WeKan'), '#!/bin/sh\n');
    execFileSync('ditto', ['-c', '-k', '--keepParent', app, 'app.zip'], { cwd: dir });
    const listing = execFileSync('unzip', ['-Z1', 'app.zip'], { cwd: dir, encoding: 'utf8' });
    assert.ok(listing.split('\n').includes(`${app}/Contents/MacOS/WeKan`));
    assert.notEqual(spawnSync('unzip', ['-Z1', 'missing.zip'], { cwd: dir }).status, 0);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('Mac smoke test stops the whole app group without an unbounded wait', { skip: process.platform === 'win32' }, () => {
  const { spawnSync } = require('node:child_process');
  const workflow = read('.github/workflows/mac.yml');
  assert.match(workflow, /python3 releases\/mac\/smoke-app.py/);
  assert.doesNotMatch(workflow, /trap 'kill.*wait/);
  const result = spawnSync('python3', ['-B', 'tests/mac-smoke-app.py'], {
    cwd: root, encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
