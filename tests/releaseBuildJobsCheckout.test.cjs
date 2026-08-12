'use strict';

// Plain-Node guard for release-all.yml: every build job that runs a repo script
// (releases/require-binaries.sh) must first check the repo out where the call
// looks for it. Run: node tests/releaseBuildJobsCheckout.test.cjs
//
// The bundle-embed jobs download a prebuilt bundle artifact rather than building
// from a checkout, so it is easy to add a `bash releases/...` step to one and
// forget it has no repo on disk. That is exactly what happened when
// require-binaries.sh was wired in: build-arm64 and build-mac-arm64 had NO
// checkout at all and died with exit 127 ("releases/require-binaries.sh: No such
// file or directory"), and build-win64 checked the repo out into src/ but called
// the script at the workspace root. All three failed before building a bundle.
//
// This pins, for each job that runs require-binaries.sh:
//   * the job checks the repo out (actions/checkout), and
//   * the checkout LOCATION matches the path the call uses - `path: src` when the
//     call is `bash src/releases/...`, the workspace root otherwise, and
//   * a root checkout precedes download-artifact, since checkout cleans the
//     workspace and would otherwise wipe the downloaded bundle.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8',
);

// Slice out one job's text block: from its `  name:` line to the next job.
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

// Every build job that runs require-binaries.sh. If a new one is added it should
// be listed here so this guard covers it too.
const JOBS = ['build-amd64', 'build-arm64', 'build-win64', 'build-mac-arm64'];

test('every build job actually runs the binary pre-check', () => {
  for (const name of JOBS) {
    assert.ok(
      // The Windows jobs check out to src/ and name it through $SRC, fixed at
      // the top of the step - a relative path stops resolving as soon as the
      // step pushd's (tests/workflowRepoScripts.test.cjs).
      /bash\s+"?(?:\$SRC\/|src\/)?releases\/require-binaries\.sh/.test(job(name)),
      `${name} should run require-binaries.sh`,
    );
  }
});

for (const name of JOBS) {
  test(`${name} checks the repo out where its require-binaries.sh call looks`, () => {
    const body = job(name);

    // `$SRC/` is the same statement as `src/`, made absolute at the top of the
    // step so it survives a pushd - see tests/workflowRepoScripts.test.cjs.
    const call = body.match(/bash\s+"?(\$SRC\/|src\/)?releases\/require-binaries\.sh/);
    assert.ok(call, `${name} runs require-binaries.sh`);
    const callAtSrc = Boolean(call[1]);

    const checkoutIdx = body.indexOf('actions/checkout@');
    assert.notStrictEqual(
      checkoutIdx, -1,
      `${name} must check the repo out, or require-binaries.sh is absent (exit 127)`,
    );

    // The `with:` of that checkout - enough to see whether it sets `path: src`.
    const checkoutBlock = body.slice(checkoutIdx, checkoutIdx + 220);
    const checkoutAtSrc = /path:\s*src\b/.test(checkoutBlock);
    assert.strictEqual(
      checkoutAtSrc, callAtSrc,
      callAtSrc
        ? `${name} calls src/releases/... so its checkout must set 'path: src'`
        : `${name} calls releases/... at the root, so its checkout must land at the root (no 'path: src')`,
    );

    assert.ok(
      checkoutIdx < body.indexOf(call[0]),
      `${name}: the checkout must precede the require-binaries.sh call`,
    );

    // A root checkout cleans the workspace, so it has to run before the bundle is
    // downloaded into that same workspace; otherwise it wipes it.
    if (!callAtSrc) {
      const dlIdx = body.indexOf('download-artifact@');
      if (dlIdx !== -1) {
        assert.ok(
          checkoutIdx < dlIdx,
          `${name}: a root checkout must precede download-artifact, or it wipes the downloaded bundle`,
        );
      }
    }
  });
}

console.log(`\nreleaseBuildJobsCheckout: all ${passed} tests passed`);
