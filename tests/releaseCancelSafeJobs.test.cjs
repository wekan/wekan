'use strict';

// Guard: the jobs that run AFTER the release is already published cannot be
// skipped by a cancellation somewhere else in the run.
// Run: node tests/releaseCancelSafeJobs.test.cjs
//
// v10.80 is the case this exists for. Everything shipped - the tag, the GitHub
// release, every bundle, the multi-arch image - and then `charts`, `ucs` and
// `nextcloud` were all SKIPPED, in the same second the `docker` job they wait on
// finished. Nothing about them had failed. build-mac-x64 was queued on `macos-13`,
// a runner label GitHub had retired, so it sat there for nearly two hours and was
// cancelled by hand; a cancelled job cancels the RUN, and a cancelling run SKIPS
// every job that has not started yet. The Helm chart for a published WeKan was
// never pushed, and no ::error:: anywhere said why.
//
// A job whose `if` is `always()` still runs while a run is cancelling. So these
// three say `always() && <the needs that actually matter> == 'success'`: the
// condition is then explicit about the only thing that was ever required (the
// image is on the registries before the chart points at it), instead of being
// implied by a default that a cancellation elsewhere quietly overrides.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8');

function job(name) {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  assert.notStrictEqual(start, -1, `release-all.yml has no ${name} job`);
  const rest = workflow.slice(start + 1);
  const next = rest.search(/\n  [a-z0-9-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
}

// The `if:` of a job, i.e. the one at job level (two-space indent), not a step's.
function jobIf(name) {
  const m = job(name).match(/^ {4}if:\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

// The `needs:` of a job, in either the inline-list or the bare-scalar form.
function jobNeeds(name) {
  const body = job(name);
  const inline = body.match(/^ {4}needs:\s*\[([^\]]+)\]/m);
  if (inline) return inline[1].split(',').map(s => s.trim());
  const scalar = body.match(/^ {4}needs:\s*(\S+)\s*$/m);
  if (scalar) return [scalar[1]];
  const block = body.match(/^ {4}needs:\s*\n((?: {6}- .+\n)+)/m);
  if (block) return block[1].trim().split('\n').map(s => s.replace(/^\s*-\s*/, '').trim());
  return [];
}

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Every job that runs after the release is published and must survive a
// cancellation elsewhere in the run.
const POST_RELEASE_JOBS = ['charts', 'ucs', 'nextcloud'];

for (const name of POST_RELEASE_JOBS) {
  test(`${name} runs on always(), so a cancellation elsewhere cannot skip it`, () => {
    const cond = jobIf(name);
    assert.ok(cond, `${name} has no job-level if:, so a cancelled run skips it`);
    assert.ok(/always\(\)/.test(cond),
      `${name} must be guarded with always() - without it a cancelled run (which is ` +
      `what a hand-cancelled build-mac-x64 produces) skips it before it starts. Got: ${cond}`);
  });

  test(`${name} still requires each job it needs to have SUCCEEDED`, () => {
    const cond = jobIf(name);
    const needs = jobNeeds(name);
    assert.ok(needs.length > 0, `${name} has no needs: to guard`);
    for (const dep of needs) {
      assert.ok(cond.includes(`needs.${dep}.result == 'success'`),
        `${name} uses always(), which also runs when ${dep} FAILED - so it has to say ` +
        `needs.${dep}.result == 'success' explicitly. Got: ${cond}`);
    }
  });
}

test('charts waits on docker, so the chart never points at an image that is not pushed', () => {
  assert.deepStrictEqual(jobNeeds('charts'), ['docker'],
    'the chart advertises the freshly published multi-arch image; docker is what pushes it');
});

test('ucs and nextcloud still wait on prepare, release and docker', () => {
  for (const name of ['ucs', 'nextcloud']) {
    assert.deepStrictEqual(jobNeeds(name).sort(), ['docker', 'prepare', 'release'],
      `${name} publishes an app that points at the released image`);
  }
});

test('ucs and nextcloud stay continue-on-error, so neither can fail the release', () => {
  for (const name of ['ucs', 'nextcloud']) {
    assert.ok(/^ {4}continue-on-error:\s*true\s*$/m.test(job(name)),
      `${name} is best-effort reporting; it must not be able to fail the release`);
  }
});

console.log(`\n${passed} passed`);
