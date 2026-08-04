'use strict';

// Plain-Node guard for release-all.yml: the `release` job must not let a later
// checkout wipe the bundles it just downloaded. Run:
//   node tests/releaseBundlesSurviveCheckout.test.cjs
//
// The `release` job downloads the per-arch bundles (download-artifact,
// pattern: bundle-*, merge-multiple) to the workspace root, then attaches them to
// the GitHub Release with `files: wekan-<version>-<arch>.zip`. It ALSO checks the
// repo out (for the provenance script). actions/checkout's default clean: true
// runs `git clean -ffdx`, which DELETES those untracked zips - and because it
// runs AFTER the download, `files:` then matched nothing. softprops does not fail
// on unmatched files, so the release was created ("success") with NO BUNDLES, and
// every downstream job (snap, docker, AppImage) 404'd on wekan-<version>-amd64.zip.
//
// So: in any job that downloads bundle-* AND later checks out, the checkout must
// set `clean: false` (if it comes before the download instead, that is fine too).

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
  assert.ok(/gh release upload "v\$\{VERSION\}"[\s\S]*--clobber/.test(body),
    'attaches the base bundles to the release with gh release upload --clobber');
});

test('a checkout AFTER the bundle download uses clean: false, or comes before it', () => {
  const body = job('release');
  const dlIdx = body.indexOf('pattern: bundle-*');
  const coIdx = body.indexOf('actions/checkout@');
  assert.notStrictEqual(coIdx, -1, 'the release job checks the repo out for the provenance script');
  if (coIdx > dlIdx) {
    // checkout runs after the bundles are on disk -> it must not clean them away.
    const coBlock = body.slice(coIdx, coIdx + 200);
    assert.ok(/clean:\s*false/.test(coBlock),
      'a checkout after "download bundle-*" MUST set clean: false, or `git clean -ffdx` deletes the bundles and the release ships with none');
  }
  // If the checkout comes first, the download lands on top of it - also safe.
});

console.log(`\nreleaseBundlesSurviveCheckout: all ${passed} tests passed`);
