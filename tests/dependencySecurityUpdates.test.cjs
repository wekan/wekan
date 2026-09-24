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
