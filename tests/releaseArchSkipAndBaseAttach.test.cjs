'use strict';

// Plain-Node guard for release-all.yml, two release-build fixes:
// Run: node tests/releaseArchSkipAndBaseAttach.test.cjs
//
// 1. The BASE bundles (amd64, arm64) are attached to the release the same
//    robust way every other bundle is - by the job that BUILT them, as its
//    last step, through releases/github-release-upload.sh (`gh release upload
//    --clobber`, retried, verified from the release side), loud on a missing
//    file - NOT with softprops `files:`. softprops does not fail on an
//    unmatched file, so when the base bundles were once absent it created a
//    release with none of them and reported success, and every downstream job
//    (snap, docker, AppImage) then 404'd on wekan-<version>-amd64.zip (v10.63
//    shipped no amd64/arm64 bundle for exactly this reason). Their .sha256sum
//    is attached too. The `release` job no longer uploads them; it checks
//    they are there.
//
// 2. An arch with NO Node.js is SKIPPED for the release (a warning, exit 0), not
//    a red failure every run. WeKan takes its Node.js from three sources in
//    order - official nodejs.org, then unofficial-builds.nodejs.org, then
//    wekan/node-patches - and when none of them publishes one for a CPU there is
//    nothing a run can do about it, so that platform is simply not built this
//    time. check-arch-binaries.sh emits skip=true and every build step in
//    build-extra-arches is gated on it, so the arch returns on its own the first
//    run after a Node.js for it appears anywhere. (This is what the guard below
//    used to phrase as "only from the wekan/node fork": the fork was retired in
//    favour of node-patches, and the two sources that DO publish most CPUs are
//    preferred over it - see tests/releaseNodeSources.test.cjs.)

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

test('build-amd64 and build-arm64 each attach their OWN base bundle, loudly and verified', () => {
  // WHY THIS CHANGED: the `release` job used to download both base bundles and
  // upload them together with `gh release upload --clobber`, so the amd64 zip
  // sat finished and unpublished until arm64 was done too. Every release file
  // is now attached by the job that built it, as its last step. What this
  // guard kept pinning still holds, one job earlier: no softprops `files:`
  // (silent on a missing file - v10.63 shipped no base bundles), a loud error
  // on a missing or empty zip, the .sha256sum beside it, and verification from
  // the release side (done by releases/github-release-upload.sh).
  for (const arch of ['amd64', 'arm64']) {
    const body = job(`build-${arch}`);
    assert.ok(/bash releases\/ensure-github-release\.sh/.test(body),
      `build-${arch} must make sure the release exists before attaching to it`);
    const at = body.indexOf(`- name: Attach ${arch} bundle to the GitHub Release`);
    assert.notStrictEqual(at, -1, `build-${arch} must attach its own bundle`);
    const attach = body.slice(at);
    assert.ok(/is missing or empty[\s\S]*exit 1/.test(attach),
      `build-${arch} must fail loudly when its zip or checksum is missing or empty`);
    assert.ok(/bash releases\/github-release-upload\.sh [^\n]*"\$asset" "\$\{asset\}\.sha256sum"/.test(attach),
      `build-${arch} must attach the zip AND its .sha256sum with the shared, verified uploader`);
  }
  const uploader = fs.readFileSync(path.join(repoRoot, 'releases/github-release-upload.sh'), 'utf8');
  assert.ok(/gh release upload --repo "\$repository" "\$tag" "\$@" --clobber/.test(uploader),
    'the uploader names the repository and clobbers, so a retry replaces a partial upload');
  assert.ok(/gh release view --repo[\s\S]*--json assets/.test(uploader),
    'the uploader confirms from the release side that the files landed');
});

test('the release job uploads nothing, but still checks both base bundles are there', () => {
  const body = job('release');
  assert.ok(
    !/files:\s*\|[\s\S]*wekan-\$\{\{[^}]*\}\}-amd64\.zip/.test(body),
    'the release job must not attach the base bundles via softprops files: (it fails silently on a missing file)',
  );
  // Negative: the aggregate upload that held every file back must not return.
  assert.ok(!/gh release upload/.test(body) && !/github-release-upload\.sh/.test(body),
    'the release job must not upload: each build job attaches its own file as soon as it is built');
  assert.ok(!/pattern:\s*bundle-\*/.test(body),
    'the release job must not collect the bundle artifacts to upload them later');
  // It must still verify from the release side, for zip and checksum alike.
  assert.ok(/gh release view[^\n]*"v\$\{VERSION\}"[\s\S]*is not listed in release[\s\S]*exit 1/.test(body),
    'the release job must confirm the base bundles are actually attached');
  assert.ok(/for arch in amd64 arm64/.test(body) && /\.zip\.sha256sum/.test(body),
    'the release job must check both base bundles and their .sha256sum');
});

// ── 2. Best-effort arch skip ─────────────────────────────────────────────────

test('EVERY extra-arch is best-effort (optional: true), so one exotic CPU cannot fail the matrix', () => {
  const body = job('build-extra-arches');
  // All of them: each is built by running the fork's target-CPU node UNDER QEMU,
  // and any one can fail for reasons this release cannot fix (fork Node not
  // published yet - s390x; no base image - loong64; qemu cannot run the target
  // node - ppc64le's V8 heap check; a plain fork hiccup). None of those must fail
  // the whole matrix job: with every leg optional the matrix never "fails", the
  // docker job (which builds only the bundles that landed) is never skipped, and
  // the release ships whatever built. amd64/arm64 (native, not here) stay the
  // required core.
  for (const arch of ['s390x', 'ppc64le', 'riscv64', 'i386', 'armhf', 'armv7', 'loong64']) {
    // Bound the match to the arch's own entry (up to the next '- arch:').
    const start = body.indexOf(`- arch: ${arch}`);
    assert.notStrictEqual(start, -1, `matrix must have ${arch}`);
    const entry = body.slice(start, body.indexOf('- arch:', start + 1) === -1
      ? undefined : body.indexOf('- arch:', start + 1));
    assert.ok(/optional: true/.test(entry), `${arch} must be marked optional: true in the matrix`);
  }
});

test('the preflight asks the one resolver where this arch\'s Node.js comes from', () => {
  // WHY THIS CHANGED: the guard here used to require "only from the wekan/node
  // fork". That fork is retired; WeKan now prefers official nodejs.org, then
  // unofficial-builds, then wekan/node-patches, and the ORDER lives in exactly
  // one file so the bundles, the extra arches and the Dockerfile cannot disagree.
  // What must not come back is this preflight growing its OWN copy of that walk.
  assert.ok(/resolve-node-source\.sh/.test(checkArch),
    'check-arch-binaries.sh must resolve the Node.js source with resolve-node-source.sh');
  assert.ok(!/api\.github\.com\/repos\/wekan\/node\/releases/.test(checkArch),
    'the preflight must not walk the retired wekan/node fork\'s releases itself');
  assert.ok(!/https:\/\/nodejs\.org\/dist\/\$\{?v/.test(checkArch),
    'the preflight must not build download URLs itself - the resolver returns them');

  // The container script unpacks whatever shape that source publishes, and the
  // preflight must tell it which: nodejs.org and unofficial-builds ship a
  // tarball, node-patches a bare binary. Guessing from the URL is what this
  // replaced.
  const install = fs.readFileSync(
    path.join(repoRoot, 'releases/install-node-for-arch.sh'), 'utf8');
  assert.ok(/NODE_KIND/.test(install) && /NODE_MEMBER/.test(install),
    'install-node-for-arch.sh must unpack by NODE_KIND/NODE_MEMBER, not by guessing');
  assert.ok(/tar\.xz\|tar\.gz\|tar\)/.test(install),
    'install-node-for-arch.sh must handle the tarball the official sources publish');
  assert.ok(/\bbinary\)/.test(install),
    'install-node-for-arch.sh must handle the bare binary node-patches publishes');
  assert.ok(!/NODE_FROM.*!= "fork"/.test(install),
    'install-node-for-arch.sh must not require the retired fork as the source');
});

test('the preflight passes optional through and captures skip', () => {
  const body = job('build-extra-arches');
  assert.ok(/check-arch-binaries\.sh[\s\S]*?matrix\.optional/.test(body),
    'preflight must pass ${{ matrix.optional }} to check-arch-binaries.sh');
  assert.ok(/grep -E '\^\(node_full\|node_from\|node_url\|node_kind\|node_member\|node_sha256\|skip\)='/.test(body),
    'preflight must capture skip - and the kind/member the container unpacks by - into $GITHUB_OUTPUT');
});

test('every extra-arches build step is gated on skip', () => {
  const body = job('build-extra-arches');
  // From the preflight to the always()-run Job result, the build/attach steps
  // must all be gated. Pin the count so a newly-added step is not left ungated.
  const gates = (body.match(/if: (\$\{\{ always\(\) && [^\n]*)?steps\.preflight\.outputs\.skip != 'true'/g) || []).length;
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
    // The attach step is `always() && steps.checksum.outcome == 'success' &&
    // <skip gate>` so a cancel after the build still attaches the zip; the skip
    // gate must still be part of it.
    assert.ok(/if: (\$\{\{ always\(\) && [^\n]*)?steps\.preflight\.outputs\.skip != 'true'/.test(around),
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
  // BOTH gates skip an optional arch, not just the Node one: the base-image
  // check (loong64 - no linux/loong64 image) must skip too, not set missing.
  // Anchor on the image-skip warning (unique to that path); skip=1 follows it.
  assert.ok(/userland to build the bundle in[\s\S]{0,400}skip=1/.test(checkArch),
    'a missing BASE IMAGE for an optional arch must skip, not fail the matrix job (loong64 -> docker skip)');
  // The skip is exit 0 and emits skip=true, ahead of the fatal missing gate.
  assert.ok(/if \[ "\$skip" -ne 0 \];[\s\S]*?printf 'skip=true[\s\S]*?exit 0/.test(checkArch),
    'a skipped arch must print skip=true and exit 0 before the missing gate');
  const skipIdx = checkArch.indexOf("printf 'skip=true");
  const missingIdx = checkArch.indexOf('stopped before building');
  assert.ok(skipIdx !== -1 && missingIdx !== -1 && skipIdx < missingIdx,
    'the skip exit must come before the fatal missing gate, so a skipped arch is not failed by it');
});

console.log(`\nreleaseArchSkipAndBaseAttach: all ${passed} tests passed`);
