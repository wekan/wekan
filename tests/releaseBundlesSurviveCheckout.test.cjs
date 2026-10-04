'use strict';

// Plain-Node guard for release-all.yml: the `release` job must not let its
// checkout wipe the bundles it downloads. Run:
//   node tests/releaseBundlesSurviveCheckout.test.cjs
//
// The `release` job downloads the per-arch bundles (download-artifact,
// pattern: bundle-*, merge-multiple) to the workspace, checks the repo out (for
// the provenance script), and attaches the base bundles to the GitHub Release.
//
// The order is what matters, and `clean: false` is NOT enough. The workspace
// starts empty and is not a git repo, so actions/checkout's FIRST act is
// "Deleting the contents of '<workspace>'" to make room for a fresh clone - and
// it does that even with `clean: false` (that flag only skips the `git clean` in
// an already-checked-out repo). So a checkout placed AFTER "Download all bundles"
// deletes wekan-<version>-{amd64,arm64}.zip, and the release ships with no base
// bundles - every downstream job (snap, docker, AppImage) then 404s on
// wekan-<version>-amd64.zip (v10.63 and v10.64 both failed exactly here).
//
// So: the checkout MUST come BEFORE the bundle download, so the bundles land on
// top of the checked-out tree and survive.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8',
);

function job(name) {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  assert.notStrictEqual(start, -1, `release-all.yml has no ${name} job`);
  const rest = workflow.slice(start + 1);
  const next = rest.search(/\n  [a-z0-9-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
}

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// WHY THIS CHANGED: the `release` job no longer downloads the bundles at all -
// build-amd64 and build-arm64 attach their own zips as their last step (see
// tests/releaseAttachOwnFiles.test.cjs) - so the job this guard was written
// for has nothing left for a checkout to wipe. The hazard itself is general,
// though: ANY job that checks out after downloading a bundle artifact loses
// it. So the rule is now pinned for every job that downloads one.

function jobNames() {
  return [...workflow.matchAll(/^ {2}([a-z0-9-]+):$/gm)].map(m => m[1]).filter(n => n !== 'jobs');
}

test('the release job does not download the bundles any more (nothing to wipe)', () => {
  const body = job('release');
  assert.ok(!/pattern:\s*bundle-\*/.test(body),
    'the release job must not collect the bundle artifacts; each build job attaches its own');
});

test('every job that downloads a bundle artifact checks out BEFORE the download', () => {
  let checked = 0;
  for (const name of jobNames()) {
    const body = job(name);
    // A download-artifact step whose artifact is a bundle-* (by name or pattern).
    const m = /download-artifact@[^\n]*\n(?:[^\n]*\n){0,3}?\s*(?:name|pattern):\s*bundle-/.exec(body);
    if (!m) continue;
    const dl = m.index;
    checked += 1;
    const co = body.indexOf('actions/checkout@');
    // clean: false is NOT enough - checkout deletes the workspace contents on its
    // initial clone regardless. The only safe order is checkout first, then
    // download the bundles on top of the checked-out tree.
    assert.ok(co !== -1 && co < dl,
      `${name}: actions/checkout must come BEFORE the bundle download; a checkout after it `
      + 'deletes the untracked zips even with clean: false (v10.63/v10.64 both failed here)');
  }
  assert.ok(checked >= 3, `expected several jobs that download bundle-amd64, found ${checked}`);
});

console.log(`\nreleaseBundlesSurviveCheckout: all ${passed} tests passed`);
