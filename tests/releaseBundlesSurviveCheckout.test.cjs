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

test('the release job still downloads the bundles and attaches them', () => {
  const body = job('release');
  assert.ok(/pattern:\s*bundle-\*/.test(body), 'downloads the bundle-* artifacts');
  // The attach mechanism deliberately CHANGED: it used to be softprops `files:`,
  // which fails silently on a missing file (that shipped v10.63 with no
  // amd64/arm64 bundle). It is now `gh release upload --clobber`, loud on a
  // missing file and verified from the release side - see
  // tests/releaseArchSkipAndBaseAttach.test.cjs. The bundles must still be
  // downloaded and attached; this only stops pinning the old silent path.
  assert.ok(/gh release upload[^\n]*"v\$\{VERSION\}"[\s\S]*--clobber/.test(body),
    'attaches the base bundles to the release with gh release upload --clobber');
  assert.ok(/gh release upload --repo/.test(body),
    'naming the repository, since gh cannot infer it without a git remote');
});

test('the checkout comes BEFORE the bundle download, so it cannot wipe them', () => {
  const body = job('release');
  const dlIdx = body.indexOf('pattern: bundle-*');
  const coIdx = body.indexOf('actions/checkout@');
  assert.notStrictEqual(coIdx, -1, 'the release job checks the repo out for the provenance script');
  assert.notStrictEqual(dlIdx, -1, 'the release job downloads the bundle-* artifacts');
  // clean: false is NOT enough - checkout deletes the workspace contents on its
  // initial clone regardless. The only safe order is checkout first, then
  // download the bundles on top of the checked-out tree.
  assert.ok(coIdx < dlIdx,
    'actions/checkout must come BEFORE "Download all bundles" (pattern: bundle-*); '
    + 'a checkout after the download deletes the untracked zips even with clean: false, '
    + 'and the release ships with no base bundles (v10.63/v10.64 both failed here)');
});

console.log(`\nreleaseBundlesSurviveCheckout: all ${passed} tests passed`);
