const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
test('release launcher positive and negative behavior (no remote writes)', () => {
  for (const file of ['tests/remoteRelease.test.py', 'tests/retryFailedRelease.test.py', 'tests/riskAudit.test.py']) {
    const result = spawnSync('python3', ['-B', file], {cwd: root, encoding: 'utf8'});
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
});
test('shell and Windows menus expose both release actions', () => {
  for (const extension of ['sh', 'bat']) {
    const source = fs.readFileSync(path.join(root, 'build.' + extension), 'utf8');
    for (const label of ['Release All', 'Release All Missing']) assert.ok(source.includes(label));
    for (const script of ['release-all.sh', 'release-all-missing.sh']) assert.ok(source.includes(script));
  }
});
test('release version preparation discovers updates and audits the result', () => {
  const source = fs.readFileSync(path.join(root, 'releases/version.sh'), 'utf8');
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/release-all.yml'), 'utf8');
  assert.ok(!source.includes('RELEASE_KEEP_DEPENDENCIES'));
  assert.ok(!workflow.includes('RELEASE_KEEP_DEPENDENCIES'));
  assert.ok(source.includes('dependency-versions.py'));
  assert.ok(workflow.includes('Recheck dependency review after version preparation'));
});
