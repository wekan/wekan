'use strict';

// Guard for releases/backfill-charts.sh - the script that answers "which WeKan
// releases should the Helm index list?" and repairs what release-charts.sh left.
// Run: node tests/backfillCharts.test.cjs
//
// Two facts about the live wekan/charts index this is written against:
//
//  * It is INCOMPLETE. An entry is written once, by release-charts.sh, during
//    the release it belongs to - so a release whose charts job did not run
//    leaves a hole nothing ever fills. v10.80 is one of those (its charts job
//    was skipped when a cancelled build-mac-x64 cancelled the run) and it is far
//    from alone: 216 of 690 releases have an entry.
//
//  * It has DUPLICATES, and they are the dangerous kind. 9.36.0 appears four
//    times and 10.30.0 twice, every copy with a DIFFERENT digest and the SAME
//    url - because release-charts.sh PREPENDS an entry each time it runs, so
//    re-running a release duplicated its version instead of replacing it. At
//    most one of those digests can belong to the wekan-9.36.0.tgz that is
//    actually served; a helm client that picks another fails the integrity check
//    on a file that is perfectly good.
//
// The dedup rule is checked here by running the script's own embedded python
// against a synthesised index, because the rule is the part with a decision in
// it: the entry whose digest MATCHES the package on disk wins - not the newest,
// which is only the fallback for when no package is there to compare against.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(repoRoot, 'releases/backfill-charts.sh');
const script = fs.readFileSync(scriptPath, 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('the script exists and is executable', () => {
  assert.ok(fs.existsSync(scriptPath), 'releases/backfill-charts.sh is missing');
  assert.ok(fs.statSync(scriptPath).mode & 0o111, 'backfill-charts.sh must be executable');
});

test('it writes nothing without --apply, and pushes nothing without --push', () => {
  assert.ok(/if \[ "\$APPLY" != true \]; then/.test(script),
    'the plan must return before anything is written');
  assert.ok(/if \[ "\$PUSH" != true \]; then/.test(script),
    'even --apply must not push a rewritten public index without --push');
  const applyGate = script.indexOf('if [ "$APPLY" != true ]; then');
  const helmPackage = script.indexOf('helm package');
  const gitPush = script.indexOf('git push origin gh-pages');
  assert.ok(applyGate !== -1 && helmPackage > applyGate,
    'nothing may be packaged before the --apply gate');
  assert.ok(gitPush > script.indexOf('if [ "$PUSH" != true ]; then'),
    'the push must come after the --push gate');
});

test('a release with no container image is omitted, not listed', () => {
  assert.ok(/omit\s*=\s*\[v for v, ok in zip\(candidates, have_image\) if ok is False\]/.test(script),
    'a release whose image does not exist must land in "omit"');
  assert.ok(/return None/.test(script) && /if ok is None/.test(script),
    'a network failure must be "unknown", not "no image" - otherwise a hiccup ' +
    'omits a release that has one');
});

test('an already-published chart is never repackaged', () => {
  assert.ok(/if f"\{ver\}\.0" in published:\s*\n\s*keep\.append\(ver\)/.test(script),
    'a version already in the index goes to "keep"; repackaging it would change ' +
    'a digest that helm clients have already seen');
});

test('the published-chart scan reads entry versions, not dependency versions', () => {
  assert.ok(/\^ \{4\}version:/.test(script),
    "the index's own entries are at four spaces; the mongodb subchart's " +
    "version: is at six, and a loose \\s* counts 0.7.2 as a published WeKan chart");
});

// THE DEDUP RULE MOVED, with the tool that needed it.
//
// This file used to extract the python block that repaired `helm repo index
// --merge`'s duplicates and run it for real. That block is gone, because the
// index is no longer rebuilt by a tool that produces duplicates: backfill calls
// releases/reindex-charts.py, which writes ONE entry per package, keyed on the
// version inside the package. A duplicate cannot be written, so there is nothing
// left to repair - and the rule itself (keep the entry whose digest matches the
// package on disk) is exercised where it now lives, in
// tests/reindexCharts.test.cjs.
//
// What is checked here instead is that backfill really does use that tool - the
// reason being an Artifact Hub scan report:
//
//   error scanning image ghcr.io/wekan/wekan:v9.62: image not found (package wekan:9.62.0)
//
// Six WeKan images that were never published, and 129 charts vendoring a Bitnami
// MongoDB image Bitnami deleted, are on that branch as .tgz files. `helm repo
// index` indexes what it FINDS, so one backfill run would have put every one of
// them back into the index and mailed the repository owner again.

test('the index is rebuilt by the tool that checks images, not by helm', () => {
  const code = script.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');
  assert.ok(!/helm repo index/.test(code),
    'helm repo index cannot tell a live image from a deleted one, and the '
    + 'difference is what Artifact Hub mails about');
  assert.ok(/reindex-charts\.py"? --write/.test(code),
    'reindex-charts.py asks the registry about every image a package pins');
  assert.ok(/--charts-dir/.test(code), 'and is pointed at the checkout being backfilled');
});

test('helm is still needed for what only helm does', () => {
  // Packaging, not indexing. If this ever stops being true the dependency check
  // at the top of --apply should go with it.
  assert.ok(/helm package/.test(script), 'packaging a chart is helm\'s job');
  assert.ok(/command -v helm/.test(script),
    'and --apply says so up front rather than failing in the middle');
});

console.log(`\n${passed} passed`);
