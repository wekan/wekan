'use strict';

// The release workflow must reject any stale version consumer before commit/push.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const node = process.execPath;
const verifier = path.join(root, 'releases/verify-release-versions.mjs');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/release-all.yml'), 'utf8');
const expected = fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8')
  .match(/^ARG VERSION=([^\s]+)$/m)[1];
const run = (cwd = root) => spawnSync(node, [verifier, expected], {
  encoding: 'utf8', env: { ...process.env, WEKAN_VERSION_ROOT: cwd },
});

assert.equal(run().status, 0, run().stderr);
assert.match(workflow, /name: Verify every release version reference[\s\S]*verify-release-versions\.mjs "\$\{\{ inputs\.new_version \}\}"/,
  'release-all verifies the bumped checkout before committing it');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-release-versions-'));
for (const file of [
  'package.json', 'package-lock.json', 'Dockerfile', 'Stackerfile.yml',
  'snapcraft.yaml', 'sandstorm-pkgdef.capnp', '.meteor/release',
]) {
  const destination = path.join(temp, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(root, file), destination);
}
fs.writeFileSync(path.join(temp, 'Dockerfile'),
  fs.readFileSync(path.join(temp, 'Dockerfile'), 'utf8')
    .replace(/METEOR_RELEASE=METEOR@[^\s\\]+/, 'METEOR_RELEASE=METEOR@0.0.0'));
const staleMeteor = run(temp);
assert.equal(staleMeteor.status, 1, 'stale Meteor metadata fails the release');
assert.match(staleMeteor.stderr, /Dockerfile: Meteor metadata is 0\.0\.0/);

fs.copyFileSync(path.join(root, 'Dockerfile'), path.join(temp, 'Dockerfile'));
fs.writeFileSync(path.join(temp, 'snapcraft.yaml'),
  fs.readFileSync(path.join(temp, 'snapcraft.yaml'), 'utf8')
    .replace(/^version:.*$/m, "version: '0.0'"));
const staleApp = run(temp);
assert.equal(staleApp.status, 1, 'any stale application version fails the release');
assert.match(staleApp.stderr, /snapcraft\.yaml: snap version is 0\.0/);

fs.rmSync(temp, { recursive: true, force: true });
console.log('releaseVersionConsistency: positive and stale-version checks passed');
