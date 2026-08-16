'use strict';

// Guard: a FAILED job cannot skip the jobs that run after the release is
// published, and pressing Cancel really does stop the run.
// Run: node tests/releaseCancelSafeJobs.test.cjs
//
// TWO incidents, pulling in opposite directions, and the fix has to satisfy both.
//
// v10.80 - everything shipped (the tag, the GitHub release, every bundle, the
// multi-arch image) and then `charts`, `ucs` and `nextcloud` were all SKIPPED, in
// the same second the `docker` job they wait on finished. Nothing about them had
// failed. build-mac-x64 was queued on `macos-13`, a runner label GitHub had
// retired, so it sat there for nearly two hours and was cancelled by hand; a
// cancelled job cancels the RUN, and a cancelling run SKIPS every job that has
// not started yet. The Helm chart for a published WeKan was never pushed, and no
// ::error:: anywhere said why. The fix then was `always() && <needs> == 'success'`.
//
// v10.95 - the opposite. `always()` is true WHILE A RUN IS CANCELLING, which is
// the whole reason it worked above, so pressing Cancel could no longer stop
// `docker`: it kept going and would have PUSHED an image for a release the
// maintainer was trying to abandon. Cancel is the one control there is over a
// job that takes hours (eight platforms under QEMU, each downloading its own
// ~311 MB bundle), and it had been disabled on purpose.
//
// The resolution is `!cancelled()` plus a timeout on every job. `!cancelled()`
// keeps the "do not skip me because a SIBLING failed" half of always() and drops
// the "ignore the Cancel button" half. And the v10.80 trigger - a job stuck on a
// dead runner label - no longer needs a human to cancel it: every job in
// release-all.yml now carries `timeout-minutes`, so it FAILS on its own, and a
// failure satisfies `!cancelled()` exactly as always() did. Cancel is left
// meaning only what a person meant by it.

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
  test(`${name} runs on !cancelled(), so a FAILED sibling cannot skip it`, () => {
    const cond = jobIf(name);
    assert.ok(cond, `${name} has no job-level if:, so one failed sibling skips it`);
    assert.ok(/!cancelled\(\)/.test(cond),
      `${name} must be guarded with !cancelled() - without it a failed build-<arch> ` +
      `skips it before it starts, which is what left v10.80's Helm chart unpushed. ` +
      `Got: ${cond}`);
  });

  test(`${name} still requires each job it needs to have SUCCEEDED`, () => {
    const cond = jobIf(name);
    const needs = jobNeeds(name);
    assert.ok(needs.length > 0, `${name} has no needs: to guard`);
    for (const dep of needs) {
      assert.ok(cond.includes(`needs.${dep}.result == 'success'`),
        `${name} uses !cancelled(), which also runs when ${dep} FAILED - so it has to ` +
        `say needs.${dep}.result == 'success' explicitly. Got: ${cond}`);
    }
  });
}

test('NO job is guarded with always(), so Cancel stops the run (negative)', () => {
  // always() is true while a run is CANCELLING. A job carrying it starts anyway,
  // and `docker` carrying it meant Cancel could not stop a build that pushes an
  // image. Step-level `if: always()` (eight-space indent) is a different thing -
  // those are the "Job result" reporting steps, which correctly print CANCELLED -
  // so this looks only at job level, four spaces in.
  const offenders = workflow.split('\n')
    .filter(line => /^ {4}if:.*\balways\(\)/.test(line));
  assert.deepStrictEqual(offenders, [],
    'these job-level conditions use always() and so ignore Cancel; use !cancelled():\n' +
    offenders.map(l => '  ' + l.trim()).join('\n'));
});

test('every job has a timeout, so no job needs a human to cancel it', () => {
  // This is the other half of dropping always(). A job stuck on a retired runner
  // label used to sit for hours until somebody cancelled it by hand, and THAT
  // cancellation skipped the post-release jobs. With a timeout it fails on its
  // own, and a failure passes !cancelled() the same way always() let it through.
  const names = [...workflow.matchAll(/^ {2}([a-z0-9-]+):$/gm)]
    .map(m => m[1])
    .filter(n => n !== 'jobs');
  assert.ok(names.length > 10, `expected the job list, got ${names.length}`);
  const untimed = names.filter(n => !/^ {4}timeout-minutes:\s*\d+\s*$/m.test(job(n)));
  assert.deepStrictEqual(untimed, [],
    `these jobs have no timeout-minutes, so they can hang for GitHub's 6-hour ` +
    `default and only a hand cancellation ends them: ${untimed.join(', ')}`);
});

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
