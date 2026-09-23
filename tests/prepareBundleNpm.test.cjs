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

test('bundle rebuild keeps lifecycle execution and custom flags without the obsolete default', async () => {
  const { prepareBundleNpm } = await import('../releases/prepare-bundle-npm.mjs');
  const vm = require('node:vm');
  const bundle = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-rebuild-'));
  const server = path.join(bundle, 'programs/server');
  fs.mkdirSync(server, { recursive: true });
  fs.writeFileSync(path.join(server, 'package.json'), JSON.stringify({ name: 'meteor-dev-bundle' }));
  const file = path.join(server, 'npm-rebuild-args.js');
  const original = `var args = ["rebuild",
// The --update-binary flag tells node-pre-gyp to replace installed binaries.
"--update-binary"];
var flags = process.env.METEOR_NPM_REBUILD_FLAGS;
if (flags) {
  args = ["rebuild"];
  flags.split(/\\s+/g).forEach(function (flag) { if (flag) args.push(flag); });
}
exports.get = function () { return args.slice(0); };
`;
  try {
    fs.writeFileSync(file, original, { mode: 0o444 });
    assert.equal(prepareBundleNpm(bundle), true);
    assert.equal(prepareBundleNpm(bundle), false);
    const source = fs.readFileSync(file, 'utf8');
    for (const [flags, expected] of [['', ['rebuild']], ['--foreground-scripts', ['rebuild', '--foreground-scripts']]]) {
      const context = { exports: {}, process: { env: { METEOR_NPM_REBUILD_FLAGS: flags } } };
      vm.runInNewContext(source, context);
      assert.deepEqual(Array.from(context.exports.get()), expected);
      context.exports.get().push('mutated');
      assert.deepEqual(Array.from(context.exports.get()), expected);
    }
    fs.writeFileSync(file, 'var args = ["rebuild", "other", "--update-binary"];');
    assert.throws(() => prepareBundleNpm(bundle), /unexpected Meteor npm rebuild/);
  } finally { fs.rmSync(bundle, { recursive: true, force: true }); }
});

test('npm 12 rebuild policy is scoped to reviewed installers and bundle paths', async () => {
  const { prepareBundleNpm } = await import('../releases/prepare-bundle-npm.mjs');
  const bundle = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-policy-'));
  const server = path.join(bundle, 'programs/server');
  fs.mkdirSync(path.join(server, 'npm'), { recursive: true });
  fs.writeFileSync(path.join(server, 'package.json'), JSON.stringify({ name: 'meteor-dev-bundle' }));
  const rebuilds = path.join(server, 'npm-rebuilds.json');
  try {
    fs.writeFileSync(rebuilds, '["npm"]');
    assert.equal(prepareBundleNpm(bundle), true);
    assert.equal(prepareBundleNpm(bundle), false);
    for (const dir of [server, path.join(server, 'npm')]) {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      assert.deepEqual(pkg.allowScripts, { argon2: true, bcrypt: true, 'useragent-ng': true });
      assert.equal(pkg.allowScripts['unreviewed-installer'], undefined);
      assert.equal(fs.existsSync(path.join(dir, '.npmrc')), false);
    }
    for (const dirs of [['../outside'], ['/outside'], [null], {}]) {
      fs.writeFileSync(rebuilds, JSON.stringify(dirs));
      assert.throws(() => prepareBundleNpm(bundle), /Invalid Meteor rebuild director/);
    }
  } finally { fs.rmSync(bundle, { recursive: true, force: true }); }
});
