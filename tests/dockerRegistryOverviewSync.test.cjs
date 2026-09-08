'use strict';

// Docker Hub and Quay.io repository overviews stay in sync with README.md.
// Run: node tests/dockerRegistryOverviewSync.test.cjs
//
// Neither registry updates its long-form repository description on its own,
// so the overview page drifts from what README.md actually documents unless
// something pushes it. release-all.yml's docker job now does that as its own
// step, after the multi-arch image is pushed and verified, reusing the
// DOCKERHUB_AUTH/QUAY_AUTH secrets already decoded for docker login. GHCR
// needs no such call: a package linked to a GitHub repository already shows
// that repository's own README automatically.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const workflow = read('.github/workflows/release-all.yml');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('dockerRegistryOverviewSync:');

const stepStart = workflow.indexOf(
  'name: Sync the repository overview to Docker Hub and Quay.io from README.md');

test('the sync step exists, after the anonymous-pull verify and before Job result', () => {
  assert.ok(stepStart !== -1, 'the overview-sync step is present');
  const verifyStart = workflow.indexOf('name: Verify every pushed tag can be pulled ANONYMOUSLY');
  const jobResultStart = workflow.indexOf('name: Job result', stepStart);
  assert.ok(verifyStart < stepStart && stepStart < jobResultStart,
    'runs after the image is verified pullable and before the closing summary step');
});

const stepEnd = workflow.indexOf('name: Job result', stepStart);
const step = workflow.slice(stepStart, stepEnd);

test('reads README.md as the single source of truth', () => {
  assert.ok(/readme="\$\(cat README\.md\)"/.test(step));
});

test('syncs Docker Hub via login-for-JWT then PATCH full_description', () => {
  assert.ok(step.includes('https://hub.docker.com/v2/users/login'));
  assert.ok(step.includes('https://hub.docker.com/v2/repositories/wekanteam/wekan'));
  assert.ok(step.includes('full_description'));
  assert.ok(step.includes('Authorization: JWT $jwt'));
});

test('syncs Quay.io via PUT description with a Bearer token', () => {
  assert.ok(step.includes('https://quay.io/api/v1/repository/wekan/wekan'));
  assert.ok(step.includes("'{description:$d}'"));
  assert.ok(step.includes('Authorization: Bearer $quay_token'));
});

test('says why GHCR needs no sync call', () => {
  assert.ok(/GHCR needs no such call/.test(workflow.slice(
    workflow.lastIndexOf('\n\n', stepStart), stepStart)));
});

test('never echoes a credential or JWT, and never turns on shell tracing', () => {
  assert.ok(!/echo.*\$(token|jwt|quay_token|DOCKERHUB_AUTH|QUAY_AUTH)\b/.test(step));
  assert.ok(!step.includes('set -x'));
});

test('each registry is synced independently: one failing does not skip the other', () => {
  // Both curl calls run unconditionally - neither is gated on the other's
  // outcome - so a Docker Hub failure still lets the Quay.io attempt run.
  const dockerHubBlock = step.slice(step.indexOf('Sync overview to Docker Hub'),
    step.indexOf('Sync overview to Quay.io'));
  const quayBlock = step.slice(step.indexOf('Sync overview to Quay.io'));
  assert.ok(/::warning::Docker Hub overview sync failed/.test(dockerHubBlock));
  assert.ok(/::warning::Quay.io overview sync failed/.test(quayBlock));
});

test('a sync failure never fails the job (negative)', () => {
  // v11.62's release-all.yml run found out why this matters: the image was
  // built, pushed and verified pullable, but this step alone exited 1 on a
  // 403 (DOCKERHUB_AUTH/QUAY_AUTH are scoped for push, not repo-admin), which
  // failed the whole docker job and blocked everything gated on
  // needs.docker.result == 'success' - even though the release had actually
  // published. A stale repository description must never do that again.
  assert.ok(!/fail=1/.test(step), 'no failure flag should exist to act on');
  assert.ok(!/echo "::error::(Docker Hub|Quay\.io) overview sync failed/.test(step),
    'a sync failure must not be reported as ::error:: (that is what fails a job)');
  assert.ok(!/if \[ "\$fail" -ne 0 \]; then/.test(step),
    'no fail-the-step check should remain');
});

console.log(`\ndockerRegistryOverviewSync: ${passed} tests passed`);
