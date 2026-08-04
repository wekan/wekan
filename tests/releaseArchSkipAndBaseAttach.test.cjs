'use strict';

// Plain-Node guard for release-all.yml, two release-build fixes:
// Run: node tests/releaseArchSkipAndBaseAttach.test.cjs
//
// 1. The BASE bundles (amd64, arm64) are attached to the release the same
//    robust way every other bundle is - `gh release upload --clobber`, loud on
//    a missing file, verified from the release side - NOT with softprops
//    `files:`. softprops does not fail on an unmatched file, so when the base
//    bundles were once absent it created a release with none of them and
//    reported success, and every downstream job (snap, docker, AppImage) then
//    404'd on wekan-<version>-amd64.zip (v10.63 shipped no amd64/arm64 bundle
//    for exactly this reason). Their .sha256sum is attached too, which the old
//    softprops `files:` never listed.
//
// 2. A BEST-EFFORT arch (i386, armhf) whose Node.js exists nowhere - Node has no
//    linux-x86 build at all, and no source builds Node 24 for armv7l - is
//    SKIPPED for the release (a warning, exit 0), not a red failure every run.
//    check-arch-binaries.sh emits skip=true and every build step in
//    build-extra-arches is gated on it, so the arch returns on its own once
//    wekan/node publishes node-<arch>.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8',
);
const checkArch = fs.readFileSync(
  path.join(repoRoot, 'releases/check-arch-binaries.sh'), 'utf8',
);

function job(name) {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  assert.notStrictEqual(start, -1, `release-all.yml has no ${name} job`);
  const rest = workflow.slice(start + 1);
  const next = rest.search(/\n  [a-z0-9-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
}

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// ── 1. Base-bundle attachment ────────────────────────────────────────────────

test('the release job attaches amd64/arm64 with gh release upload, not softprops files:', () => {
  const body = job('release');
  // softprops must NOT carry the bundle files any more (that was the silent path).
  assert.ok(
    !/files:\s*\|[\s\S]*wekan-\$\{\{[^}]*\}\}-amd64\.zip/.test(body),
    'the release job must not attach the base bundles via softprops files: (it fails silently on a missing file)',
  );
  // It must upload them explicitly, and clobber like the other bundle jobs.
  assert.ok(/gh release upload "v\$\{VERSION\}"[\s\S]*--clobber/.test(body),
    'the release job must attach the base bundles with gh release upload --clobber');
  // A missing/empty base bundle must be fatal here, not a silent skip.
  assert.ok(/is missing or empty[\s\S]*exit 1/.test(body),
    'the release job must fail loudly when a base bundle zip is missing or empty');
  // And it must verify from the release side that they landed.
  assert.ok(/gh release view "v\$\{VERSION\}"[\s\S]*is not listed in release[\s\S]*exit 1/.test(body),
    'the release job must confirm the base bundles are actually attached');
  // The .sha256sum goes up with each base zip.
  assert.ok(/sha256sum "\$asset" > "\$\{asset\}\.sha256sum"/.test(body),
    'the release job must attach a .sha256sum beside each base bundle');
});

// ── 2. Best-effort arch skip ─────────────────────────────────────────────────

test('i386 and armhf are marked best-effort (optional: true)', () => {
  const body = job('build-extra-arches');
  for (const arch of ['i386', 'armhf']) {
    const m = new RegExp(`- arch: ${arch}\\b[\\s\\S]*?optional: true`);
    assert.ok(m.test(body), `${arch} must be marked optional: true in the matrix`);
  }
  // A non-best-effort arch must NOT be optional (a missing Node there is a real
  // failure, not a skip). Isolate riscv64's own matrix entry and check within it.
  const rv = body.slice(body.indexOf('- arch: riscv64'));
  const rvEntry = rv.slice(0, rv.indexOf('- arch:', 1));
  assert.ok(!/optional: true/.test(rvEntry), 'riscv64 must not be optional');
});

test('the preflight passes optional through and captures skip', () => {
  const body = job('build-extra-arches');
  assert.ok(/check-arch-binaries\.sh[\s\S]*?matrix\.optional/.test(body),
    'preflight must pass ${{ matrix.optional }} to check-arch-binaries.sh');
  assert.ok(/grep -E '\^\(node_full\|node_from\|node_url\|node_sha256\|skip\)='/.test(body),
    'preflight must capture skip into $GITHUB_OUTPUT');
});

test('every extra-arches build step is gated on skip', () => {
  const body = job('build-extra-arches');
  // From the preflight to the always()-run Job result, the build/attach steps
  // must all be gated. Pin the count so a newly-added step is not left ungated.
  const gates = (body.match(/if: steps\.preflight\.outputs\.skip != 'true'/g) || []).length;
  assert.ok(gates >= 8,
    `expected >= 8 skip-gated steps in build-extra-arches, found ${gates}`);
  // The named steps that MUST be gated (they need a Node.js that a skipped arch
  // does not have).
  for (const step of [
    'Record where this bundle\'s Node.js came from',
    'Rebuild native modules',
    'Embed FerretDB',
    'Attach ${{ matrix.arch }} bundle to the GitHub Release',
  ]) {
    const idx = body.indexOf(step);
    assert.notStrictEqual(idx, -1, `build-extra-arches must have a "${step}" step`);
    const around = body.slice(idx, idx + 200);
    assert.ok(/if: steps\.preflight\.outputs\.skip != 'true'/.test(around),
      `"${step}" must be gated on skip`);
  }
});

test('check-arch-binaries.sh skips a best-effort arch instead of failing', () => {
  // The optional branch: no node anywhere + optional=true -> skip, not fatal.
  assert.ok(/optional="\$\{7:-\}"/.test(checkArch),
    'check-arch-binaries.sh must read the optional arg (7th)');
  assert.ok(/if \[ "\$optional" = "true" \];/.test(checkArch),
    'a missing Node for an optional arch must take a different branch');
  assert.ok(/skip=1/.test(checkArch),
    'the optional branch must set skip rather than missing');
  // The skip is exit 0 and emits skip=true, ahead of the fatal missing gate.
  assert.ok(/if \[ "\$skip" -ne 0 \];[\s\S]*?printf 'skip=true[\s\S]*?exit 0/.test(checkArch),
    'a skipped arch must print skip=true and exit 0 before the missing gate');
  const skipIdx = checkArch.indexOf("printf 'skip=true");
  const missingIdx = checkArch.indexOf('stopped before building');
  assert.ok(skipIdx !== -1 && missingIdx !== -1 && skipIdx < missingIdx,
    'the skip exit must come before the fatal missing gate, so a skipped arch is not failed by it');
});

console.log(`\nreleaseArchSkipAndBaseAttach: all ${passed} tests passed`);
