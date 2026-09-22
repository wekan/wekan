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
