const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('Meteor bundle permits only reviewed, commit-pinned root tarballs', async () => {
  const { prepareBundleNpm } = await import('../releases/prepare-bundle-npm.mjs');
  const bundle = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-npm-'));
  const server = path.join(bundle, 'programs/server');
  fs.mkdirSync(server, { recursive: true });
  const manifest = (dependencies, name = 'meteor-dev-bundle') => fs.writeFileSync(path.join(server, 'package.json'), JSON.stringify({ name, dependencies }));
  try {
    manifest({ promise: '8.3.0' });
    assert.equal(prepareBundleNpm(bundle), false);
    assert.equal(fs.existsSync(path.join(server, '.npmrc')), false);
    manifest({ 'source-map-support': 'https://github.com/meteor/node-source-map-support/tarball/' + 'a'.repeat(40) });
    fs.writeFileSync(path.join(server, '.npmrc'), 'audit=false\nallow-remote=all\n');
    assert.equal(prepareBundleNpm(bundle), true);
    assert.equal(fs.readFileSync(path.join(server, '.npmrc'), 'utf8'), 'audit=false\nallow-remote=root\n');
    assert.equal(prepareBundleNpm(bundle), false);
    for (const deps of [
      { 'source-map-support': 'https://github.com/meteor/node-source-map-support/tarball/main' },
      { 'source-map-support': 'https://example.org/' + 'a'.repeat(40) },
      { unexpected: 'https://github.com/meteor/node-source-map-support/tarball/' + 'a'.repeat(40) },
    ]) {
      manifest(deps);
      assert.throws(() => prepareBundleNpm(bundle), /unexpected bundle URL/);
    }
    manifest({}, 'unrelated');
    assert.throws(() => prepareBundleNpm(bundle), /Expected a Meteor/);
  } finally { fs.rmSync(bundle, { recursive: true, force: true }); }
});

test('production install paths prepare the bundle before npm installation', () => {
  for (const name of ['releases/build-release-bundle.sh', '.github/workflows/release-all.yml', 'Dockerfile']) {
    const text = fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
    assert.match(text, /node [^\n]*prepare-bundle-npm\.mjs/);
    const call = text.search(/node [^\n]*prepare-bundle-npm\.mjs/);
    assert.match(text.slice(call), /npm install/);
  }
});
