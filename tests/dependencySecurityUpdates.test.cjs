const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const semver = require('semver');
const root = path.resolve(__dirname, '..');
const manifest = require('../package.json');
const lock = require('../package-lock.json');

test('every local dependency has a tracked package manifest for Dependabot', () => {
  const tracked = new Set(execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0'));
  for (const [name, spec] of Object.entries({ ...manifest.dependencies, ...manifest.devDependencies })) {
    if (!spec.startsWith('file:')) continue;
    const relative = path.posix.join(spec.slice(5), 'package.json');
    assert.ok(tracked.has(relative), `${name}: missing tracked ${relative}`);
    assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8')));
  }
  const stubs = lock.packages['node_modules/meteor-node-stubs'];
  assert.ok(stubs.resolved.startsWith('https://registry.npmjs.org/meteor-node-stubs/'));
  assert.ok(stubs.integrity);
  assert.ok(semver.satisfies(stubs.version, manifest.dependencies['meteor-node-stubs']));
  assert.ok(!stubs.link);
  assert.ok(!lock.packages['npm-packages/meteor-node-stubs']);
});

test('Rsdoctor manifest and lock exclude CVE-2026-61782 affected releases', () => {
  const name = '@rsdoctor/rspack-plugin';
  const minimum = semver.minVersion(manifest.devDependencies[name]);
  assert.ok(semver.gte(minimum, '1.5.16'));
  const plugin = lock.packages[`node_modules/${name}`];
  assert.ok(semver.gte(plugin.version, '1.5.16'));
  assert.ok(semver.satisfies(plugin.version, manifest.devDependencies[name]));
  for (const [name, spec] of Object.entries(plugin.dependencies)) {
    if (!name.startsWith('@rsdoctor/')) continue;
    const dependency = lock.packages[`node_modules/${name}`];
    assert.ok(semver.satisfies(dependency.version, spec), name);
    assert.ok(semver.gte(dependency.version, '1.5.16'), name);
  }
});

test('Dependabot no longer excludes build-tool security updates', () => {
  const config = fs.readFileSync(path.join(root, '.github/dependabot.yml'), 'utf8');
  for (const name of ['@rsdoctor/rspack-plugin', '@meteorjs/rspack', '@rspack/core', '@rspack/cli', 'css-loader', 'style-loader']) {
    assert.ok(!config.includes(`dependency-name: "${name}"`), name);
  }
});

test('the locked S3 client satisfies the upload library peer dependency', () => {
  const upload = lock.packages['node_modules/@aws-sdk/lib-storage'];
  const client = lock.packages['node_modules/@aws-sdk/client-s3'];
  const required = upload.peerDependencies['@aws-sdk/client-s3'];
  assert.ok(semver.satisfies(client.version, required), `${client.version} must satisfy ${required}`);
  assert.ok(semver.satisfies(client.version, manifest.dependencies['@aws-sdk/client-s3']));
});

// GHSA-477h-4r7f-fvrx / CVE-2026-102414: pbkdf2 <= 3.1.6 re-hashes an
// over-long password on every iteration. meteor-node-stubs bundles 3.1.3, out
// of reach of npm overrides, so scripts/patch-meteor-node-stubs-pbkdf2.cjs
// removes the bundled copy in favour of the top-level pbkdf2 ^3.1.7.
const pbkdf2Patch = require('../scripts/patch-meteor-node-stubs-pbkdf2.cjs');

function vulnerablePbkdf2(lockfile) {
  return Object.entries(lockfile.packages || {})
    .filter(([key, entry]) => /(^|\/)node_modules\/pbkdf2$/.test(key) && entry.version && semver.lte(entry.version, '3.1.6'))
    .map(([key, entry]) => `${key}@${entry.version}`);
}

function trackedLockfiles() {
  return execFileSync('git', ['ls-files', '-z', '--', '*package-lock.json'], { cwd: root, encoding: 'utf8' })
    .split('\0')
    .filter((file) => file && !/(^|\/)(node_modules|\.tools|_build[^/]*|\.build)\//.test(file));
}

test('no tracked lockfile resolves pbkdf2 <= 3.1.6 (GHSA-477h-4r7f-fvrx)', () => {
  const files = trackedLockfiles();
  assert.ok(files.includes('package-lock.json'));
  assert.ok(files.includes('npm-packages/meteor-jade-loader/lib/vendor/jade/package-lock.json'));
  for (const file of files) {
    const found = vulnerablePbkdf2(JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')));
    assert.deepEqual(found, [], `${file}: vulnerable pbkdf2 ${found.join(', ')}`);
  }
  assert.ok(semver.gte(lock.packages['node_modules/pbkdf2'].version, '3.1.7'));
});

test('the pbkdf2 lockfile check flags a vulnerable bundled or hoisted copy', () => {
  const synthetic = { packages: {
    'node_modules/meteor-node-stubs/node_modules/pbkdf2': { version: '3.1.3', inBundle: true },
    'node_modules/x/node_modules/pbkdf2': { version: '3.1.6' },
    'node_modules/pbkdf2': { version: '3.1.7' },
    'node_modules/pbkdf2-extra': { version: '1.0.0' },
  } };
  assert.deepEqual(vulnerablePbkdf2(synthetic), [
    'node_modules/meteor-node-stubs/node_modules/pbkdf2@3.1.3',
    'node_modules/x/node_modules/pbkdf2@3.1.6',
  ]);
});

test('package.json installs patched pbkdf2 and runs the bundled-copy replacement', () => {
  assert.ok(semver.gte(semver.minVersion(manifest.dependencies.pbkdf2), '3.1.7'));
  assert.match(manifest.scripts.postinstall, /node scripts\/patch-meteor-node-stubs-pbkdf2\.cjs/);
  assert.equal(pbkdf2Patch.MINIMUM, '3.1.7');
});

function pbkdf2Fixture(t, { top, bundled }) {
  const base = fs.mkdtempSync(path.join(process.env.TMPDIR || path.join(root, '.tools', 'tmp'), 'pbkdf2-patch-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const write = (dir, json) => {
    fs.mkdirSync(path.join(base, dir), { recursive: true });
    fs.writeFileSync(path.join(base, dir, 'package.json'), JSON.stringify(json));
  };
  write('node_modules/meteor-node-stubs', { name: 'meteor-node-stubs', version: '1.2.30' });
  write('node_modules/meteor-node-stubs/node_modules/@meteorjs/crypto-browserify', { name: '@meteorjs/crypto-browserify', version: '3.12.4' });
  if (top) write('node_modules/pbkdf2', { name: 'pbkdf2', version: top });
  if (bundled) write('node_modules/meteor-node-stubs/node_modules/pbkdf2', { name: 'pbkdf2', version: bundled });
  const packages = {
    'node_modules/meteor-node-stubs/node_modules/pbkdf2': { version: bundled || '3.1.3', inBundle: true },
    'node_modules/meteor-node-stubs/node_modules/pbkdf2/node_modules/create-hash': { version: '1.1.3', inBundle: true },
    'node_modules/meteor-node-stubs/node_modules/pbkdf2-other': { version: '1.0.0' },
  };
  if (top) packages['node_modules/pbkdf2'] = { version: top };
  fs.writeFileSync(path.join(base, 'package-lock.json'), JSON.stringify({ packages }, null, 2));
  return base;
}

test('the postinstall replacement removes the vulnerable bundled pbkdf2 and its lock entries', (t) => {
  const base = pbkdf2Fixture(t, { top: '3.1.7', bundled: '3.1.3' });
  const result = pbkdf2Patch.run(base);
  assert.equal(result.removed, true);
  assert.equal(result.pruned, 2);
  assert.ok(!fs.existsSync(path.join(base, 'node_modules/meteor-node-stubs/node_modules/pbkdf2')));
  const pruned = JSON.parse(fs.readFileSync(path.join(base, 'package-lock.json'), 'utf8'));
  assert.deepEqual(vulnerablePbkdf2(pruned), []);
  assert.ok(pruned.packages['node_modules/meteor-node-stubs/node_modules/pbkdf2-other']);
  const again = pbkdf2Patch.run(base);
  assert.deepEqual([again.removed, again.pruned], [false, 0]);
});

test('the postinstall replacement refuses to pass without a patched top-level pbkdf2', (t) => {
  assert.throws(() => pbkdf2Patch.run(pbkdf2Fixture(t, { bundled: '3.1.3' })), /GHSA-477h-4r7f-fvrx/);
  assert.throws(() => pbkdf2Patch.run(pbkdf2Fixture(t, { top: '3.1.6', bundled: '3.1.3' })), /3\.1\.6/);
  const patchedBundle = pbkdf2Fixture(t, { top: '3.1.7', bundled: '3.1.8' });
  assert.equal(pbkdf2Patch.run(patchedBundle).removed, false);
  assert.ok(fs.existsSync(path.join(patchedBundle, 'node_modules/meteor-node-stubs/node_modules/pbkdf2')));
});
