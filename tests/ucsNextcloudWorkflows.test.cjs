'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, '.github/workflows', name), 'utf8');
for (const name of ['ucs', 'nextcloud']) {
  for (const caller of ['release-all.yml', 'release-all-missing.yml']) {
    const source = read(caller);
    assert.ok(!source.includes(`\n  ${name}:\n`), `${caller} must not contain ${name}`);
    assert.ok(!source.includes(`uses: ./.github/workflows/${name}.yml`));
  }
  const source = read(`${name}.yml`);
  assert.ok(source.includes('workflow_dispatch:'));
  assert.ok(!source.includes('workflow_call:'), 'publisher is manual-only');
  assert.ok(source.includes('cancel-in-progress: false'));
  assert.match(source, /timeout-minutes: \d+/);
  assert.ok(!source.includes('git push'), 'backfilling does not downgrade companion branches');
  assert.ok(!source.includes('continue-on-error: true'), 'real failures remain visible');
}
const ucs = read('ucs.yml');
assert.ok(ucs.includes('bash releases/fetch.sh'));
assert.ok(ucs.includes('ucs-release.py upload'));
assert.ok(ucs.includes('UCS_SOURCE_APP') && ucs.includes('UCS_TARGET_UCS'));
assert.ok(ucs.includes('steps.portal.outputs.skip'));
assert.ok(ucs.includes('gh release view --repo wekan/wekan'));
assert.ok(ucs.includes('gh release view --repo wekan/FerretDB'));
assert.ok(ucs.includes('ucs-release.py resolve'));
assert.ok(!ucs.includes('vars.UCS_FERRETDB_IMAGE'));
assert.ok(ucs.includes('required: false'));
assert.ok(ucs.includes('group: wekan-ucs-publish'));
// Migration is a command in the standard image, never a fourth package.
assert.ok(!ucs.includes('docker buildx build'));
assert.ok(!ucs.includes('GHCR_AUTH'));
assert.ok(!ucs.includes('packages: write'));
assert.ok(read('release-all.yml').includes('ucs-release.py check-image --version "$VERSION"'));
assert.ok(read('release-all-missing.yml').includes('releases/retry-failed-release.py'));
const dockerfile = fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8');
assert.match(dockerfile, /apt-get install --assume-yes --no-install-recommends file libatomic1\n/);
assert.match(dockerfile, /COPY releases\/ucs-migration \/opt\/ucs-migration/);
assert.match(dockerfile, /USER wekan/);
assert.match(dockerfile, /CMD \["bash", "\/build\/wekan-entrypoint.sh"\]/);
assert.ok(!dockerfile.includes('VOLUME /var/run/docker.sock'));
const nc = read('nextcloud.yml');
assert.ok(nc.includes('--exclude=.git'));
assert.ok(nc.includes('--transform "s,^\\.$,${APP_ID},;s,^\\./,${APP_ID}/,"'));
assert.ok(nc.includes('openssl dgst -sha512 -verify'));
assert.ok(nc.includes("trap ") && nc.includes('EXIT'), 'private signing material is removed on failure too');
assert.ok(nc.includes('curl --fail-with-body'), 'App Store HTTP rejection fails the publication');
assert.ok(nc.includes('if [ "$new_archive" = true ]'), 'published tarballs are reused rather than overwritten');
assert.ok(nc.includes('persist-credentials: false'));
assert.ok(nc.includes('nextcloud-exapp-capability.json'));
assert.ok(nc.includes('node --test exapp/tests/*.test.mjs'));
assert.ok(nc.includes('--platform linux/amd64,linux/arm64'));
assert.ok(!nc.includes('--clobber'));
assert.ok(!nc.includes('wekan-exapp:latest'));
assert.ok(!nc.includes('|| echo "::warning::Nextcloud App Store upload failed'));
// Register the Python behavioral suites with the ordinary node-suite runner.
for (const file of ['ucsRelease.test.py', 'nextcloudRelease.test.py']) {
  const result = spawnSync('python3', ['-B', path.join(__dirname, file)], { encoding: 'utf8', env: process.env });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  process.stdout.write(result.stderr);
}
console.log('UCS and Nextcloud manual workflow checks passed');
