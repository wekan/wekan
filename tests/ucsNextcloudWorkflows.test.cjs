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
    const body = source.split(`\n  ${name}:\n`)[1]?.split(/\n  [a-z][a-z-]*:\n/)[0];
    assert.ok(body, `${caller} calls ${name}`);
    assert.ok(body.includes(`uses: ./.github/workflows/${name}.yml`));
    assert.ok(body.includes('secrets: inherit'));
    assert.ok(body.includes('!cancelled()'));
    assert.match(body, /version: \$\{\{ needs\.(prepare|plan)\.outputs\.version \}\}/);
    assert.ok(!body.includes('steps:') && !body.includes('continue-on-error:'));
  }
  const source = read(`${name}.yml`);
  assert.ok(source.includes('workflow_call:') && source.includes('workflow_dispatch:'));
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
const nc = read('nextcloud.yml');
assert.ok(nc.includes('--exclude=.git'));
assert.ok(nc.includes('persist-credentials: false'));
assert.ok(!nc.includes('--clobber'));
assert.ok(!nc.includes('wekan-exapp:latest'));
assert.ok(!nc.includes('|| echo "::warning::Nextcloud App Store upload failed'));
// Register the Python behavioral suites with the ordinary node-suite runner.
for (const file of ['ucsRelease.test.py', 'nextcloudRelease.test.py']) {
  const result = spawnSync('python3', ['-B', path.join(__dirname, file)], { encoding: 'utf8', env: process.env });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  process.stdout.write(result.stderr);
}
console.log('UCS and Nextcloud reusable workflow checks passed');
