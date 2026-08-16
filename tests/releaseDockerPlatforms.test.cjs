'use strict';

// Guard for release-all.yml's docker job: the multi-arch image is built for the
// platforms whose bundles actually landed on the release, VERIFIED against the
// same set, and never skipped or failed because one exotic arch did not build.
// Run: node tests/releaseDockerPlatforms.test.cjs
//
// Two failures this pins against:
//  1. The docker job `needs: build-extra-arches`, a matrix. When one leg failed
//     (e.g. ppc64le) the whole matrix job was "failed", so docker was SKIPPED -
//     one exotic CPU took the entire image down. docker now runs on
//     `always() && needs.release.result == 'success'` and a "Decide which
//     platforms" step builds only the arches whose wekan-<v>-<arch>.zip is on the
//     release, so a failed extra-arch drops only itself.
//  2. buildx builds linux/arm/v7 but the registry records it as architecture
//     "arm" with variant "v7" in a separate field, so an OS/Architecture-only
//     verify format read it back as bare "linux/arm" and failed a correct image.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8',
);
const dockerfile = fs.readFileSync(path.join(repoRoot, 'Dockerfile'), 'utf8');

function job(name) {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  assert.notStrictEqual(start, -1, `release-all.yml has no ${name} job`);
  const rest = workflow.slice(start + 1);
  const next = rest.search(/\n  [a-z0-9-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
}

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const body = job('docker');

// The candidate platforms are declared in the "Decide which platforms" step as
// `req="<plat>:<bundle-arch> ..."` (required) and `opt="..."` (optional).
function pairs(varName) {
  const m = body.match(new RegExp(`\\n\\s*${varName}="([^"]+)"`));
  assert.ok(m, `docker Decide step must define ${varName}="..."`);
  return m[1].trim().split(/\s+/).map(tok => {
    const [plat, arch] = tok.split(':');
    return { plat, arch };
  });
}
const req = pairs('req');
const opt = pairs('opt');
const reqPlats = req.map(p => p.plat);
const optPlats = opt.map(p => p.plat);
const allPlats = [...reqPlats, ...optPlats];

test('docker runs on !cancelled() + release success, so a failed extra-arch cannot skip it', () => {
  // It was always() until v10.95, when Cancel stopped working on this job: always()
  // is true while a run is CANCELLING, so a build that pushes an image kept going
  // after the maintainer asked it to stop. !cancelled() keeps the half that matters
  // here - a failed ppc64le leg must not skip the image - and honours Cancel.
  // See tests/releaseCancelSafeJobs.test.cjs for both incidents.
  assert.ok(/if:\s*\$\{\{\s*!cancelled\(\)\s*&&\s*needs\.release\.result\s*==\s*'success'\s*\}\}/.test(body),
    "docker job must be `if: ${{ !cancelled() && needs.release.result == 'success' }}` "
    + '- otherwise a failed build-extra-arches matrix leg skips the whole image');
});

test('amd64 and arm64 are REQUIRED; the exotic arches are OPTIONAL; loong64 is neither', () => {
  assert.deepStrictEqual(reqPlats.sort(), ['linux/amd64', 'linux/arm64'],
    'the required (core) docker platforms must be exactly amd64 and arm64');
  for (const need of ['linux/ppc64le', 'linux/s390x', 'linux/riscv64', 'linux/386',
    'linux/arm/v6', 'linux/arm/v7']) {
    assert.ok(optPlats.includes(need), `${need} must be an OPTIONAL docker platform (built if its bundle landed)`);
  }
  // loong64: no Docker base publishes it and the registries do not agree on its
  // manifest - it ships as a .zip bundle only, so it is not a candidate at all.
  assert.ok(!allPlats.includes('linux/loong64'), 'linux/loong64 must not be a docker platform');
});

test('a missing optional bundle is a warning, a missing core bundle is fatal', () => {
  // The core loop must exit non-zero if amd64/arm64 is absent; the optional loop
  // must only ::warning and drop the platform.
  assert.ok(/Core bundle wekan-[\s\S]*exit 1/.test(body),
    'a missing amd64/arm64 bundle must fail the docker job (there is no image without them)');
  assert.ok(/::warning::\$p is dropped from the image/.test(body),
    'a missing optional bundle must drop that platform with a warning, not fail');
});

test('the build list, the verify list and the wait loop all come from the decided set', () => {
  // --platform, want= and the wait loop must use the computed variables, so they
  // can never disagree (a platform built but not verified is the classic gap).
  assert.ok(/--platform\s+"\$\{PLATFORMS\}"/.test(body),
    'buildx must build --platform "${PLATFORMS}" (the decided set), not a hardcoded list');
  assert.ok(/want="\$\{WANT\}"/.test(body),
    'the verify must use want="${WANT}" (the same decided set)');
  assert.ok(/for arch in \$BUNDLE_ARCHES/.test(body),
    'the wait loop must iterate $BUNDLE_ARCHES (only the arches actually being built)');
  // And the Decide step must write all three from one place.
  for (const v of ['PLATFORMS', 'WANT', 'BUNDLE_ARCHES']) {
    assert.ok(new RegExp(`echo "${v}=[\\s\\S]*>> "\\$GITHUB_ENV"`).test(body),
      `the Decide step must export ${v} to $GITHUB_ENV`);
  }
});

test('the manifest verify reads the CPU variant, so linux/arm/v7 is not misread as linux/arm', () => {
  assert.ok(/\{\{if \.Platform\.Variant\}\}\/\{\{\.Platform\.Variant\}\}\{\{end\}\}/.test(body),
    'docker verify --format must append /{{.Platform.Variant}} when a variant is present, '
    + 'or linux/arm/v7 reads back as bare linux/arm and the correct manifest is failed');
  assert.ok(/sed 's#\/v8 # #g'/.test(body),
    "docker verify must strip a trailing /v8 so arm64 (recorded as arm64/v8) matches 'linux/arm64'");
});

test('the base image is debian:trixie (which publishes i386 and arm/v7)', () => {
  assert.ok(/^FROM\s+debian:trixie/m.test(dockerfile),
    'Dockerfile base must be debian:trixie - the base that lets linux/386 be an image');
});

test('the Dockerfile can install Node for every candidate platform, with the right bundle', () => {
  // Each candidate platform's TARGETARCH must have a branch in the Dockerfile arch
  // case, or the RUN exits "Unsupported architecture" (how arm/v7 broke once).
  //
  // TARGETARCH alone does NOT identify a platform: linux/arm/v6 and linux/arm/v7
  // are both TARGETARCH=arm and differ only in TARGETVARIANT, so the expected
  // bundle is keyed on the pair. Handing an ARMv6 board the armhf bundle - which
  // is what mapping "arm" straight to armhf did - ships ARMv7-A instructions to a
  // CPU that cannot execute them.
  const platform = {
    'linux/amd64':   { ta: 'amd64',   bundle: 'amd64' },
    'linux/arm64':   { ta: 'arm64',   bundle: 'arm64' },
    'linux/ppc64le': { ta: 'ppc64le', bundle: 'ppc64le' },
    'linux/s390x':   { ta: 's390x',   bundle: 's390x' },
    'linux/riscv64': { ta: 'riscv64', bundle: 'riscv64' },
    'linux/386':     { ta: '386',     bundle: 'i386' },
    'linux/arm/v6':  { ta: 'arm', variant: 'v6', bundle: 'armv6' },
    'linux/arm/v7':  { ta: 'arm', variant: 'v7', bundle: 'armhf' },
  };
  for (const { plat, arch } of [...req, ...opt]) {
    const p = platform[plat];
    assert.ok(p, `test needs a TARGETARCH mapping for ${plat}`);
    assert.ok(new RegExp(`"${p.ta}"\\)`).test(dockerfile),
      `Dockerfile arch case has no "${p.ta}") branch for ${plat}`);
    // The bundle the Decide step pairs with the platform must be the one the
    // Dockerfile resolves for it, or the image downloads another CPU's .zip.
    assert.strictEqual(arch, p.bundle,
      `Decide step pairs ${plat} with bundle "${arch}", but the Dockerfile resolves it to "${p.bundle}"`);
  }

  // The 32-bit ARM branch reads the VARIANT, and each variant picks its own
  // bundle. Pinned as text because there is no way to run the case here.
  const armBranch = dockerfile.slice(dockerfile.indexOf('    "arm")'));
  assert.ok(/TARGETVARIANT/.test(armBranch.slice(0, 600)),
    'the "arm") branch must read TARGETVARIANT - TARGETARCH=arm is ARMv6 as well as ARMv7');
  assert.ok(/"v6"\)\s*WEKAN_ARCH="armv6"/.test(armBranch),
    'TARGETVARIANT v6 must select the armv6 bundle (Raspberry Pi 1 and Zero)');
  assert.ok(/"v7"\|""\)\s*WEKAN_ARCH="armhf"/.test(armBranch),
    'TARGETVARIANT v7 (and an unset variant) must select the armhf bundle');
  // v5 is armel: Go builds it, Node.js does not exist for ARMv5, so there is no
  // bundle. It must be refused rather than falling through to armhf.
  assert.ok(/Unsupported 32-bit ARM variant/.test(armBranch),
    'an ARM variant with no bundle (v5 / armel) must exit, not fall through to armhf');
});

test('a candidate platform the BASE image does not publish is dropped, not silently downgraded', () => {
  // debian:trixie's manifest list has arm/v5 and arm/v7 and nothing between them.
  // containerd treats a lower ARM variant as compatible, so a linux/arm/v6 request
  // does not fail - it resolves to arm/v5 (armel, soft-float), whose loader cannot
  // run the hard-float node-armv6 the armv6 bundle carries. The Decide step must
  // therefore ask the base what it publishes and treat a platform it lacks like a
  // bundle that did not land.
  assert.ok(/base_image="\$\(awk '\/\^FROM \/\{print \$2; exit\}' Dockerfile\)"/.test(body),
    'the base image name must be read out of the Dockerfile, not written a second time here');
  assert.ok(/docker buildx imagetools inspect "\$base_image"/.test(body),
    'the Decide step must ask the base image which platforms it publishes');
  assert.ok(/base_has\(\)/.test(body) && /if ! base_has "\$p"; then/.test(body),
    'both the core and the optional loop must check the base publishes the platform');
  assert.ok(/publishes no \$p, and a request for it would resolve to a lower-variant base/.test(body),
    'the warning must say WHY a base-less platform is dropped, or the next reader re-adds it');
});

console.log(`\nreleaseDockerPlatforms: all ${passed} tests passed`);
