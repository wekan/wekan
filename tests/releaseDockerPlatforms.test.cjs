'use strict';

// Guard for release-all.yml's docker job: the multi-arch image is built and
// VERIFIED for the same set of platforms, and that set only contains platforms
// the Dockerfile base (ubuntu:26.04) actually publishes.
// Run: node tests/releaseDockerPlatforms.test.cjs
//
// The image is FROM ubuntu:26.04, which publishes no i386. `docker buildx build
// --platform ...,linux/386,...` therefore stopped at the base with
//   ubuntu:26.04: no match for platform in manifest: not found
// and the whole docker job failed (it had only just started running again after
// loong64 stopped skipping it). linux/386 - like linux/loong64 - ships as a .zip
// bundle (built on debian:trixie, which has 386) but NOT as a Docker image. This
// pins that neither is in the build's --platform list nor the want= list that
// verifies the pushed manifest, and that the two lists match (a platform built
// but not verified, or verified but not built, is the bug this catches).

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

// The buildx --platform value (comma-separated) and the want= value (space-sep).
const platformLine = body.match(/--platform\s+([^\s\\]+)/);
assert.ok(platformLine, 'docker job must have a buildx --platform list');
const buildPlatforms = platformLine[1].split(',').map(s => s.trim()).filter(Boolean);

const wantLine = body.match(/want="([^"]+)"/);
assert.ok(wantLine, 'docker job must have a want="..." verification list');
const wantPlatforms = wantLine[1].split(/\s+/).map(s => s.trim()).filter(Boolean);

test('the manifest verify reads the CPU variant, so linux/arm/v7 is not misread as linux/arm', () => {
  // The whole image built and pushed for all seven platforms; the verify step
  // then FAILED it, because its imagetools --format printed only OS/Architecture.
  // buildx builds linux/arm/v7 but the registry records architecture "arm" with
  // variant "v7" in a SEPARATE field, so the format printed bare "linux/arm",
  // which never matched the "linux/arm/v7" in want=. The format must include the
  // variant, and normalise arm64's implied /v8 away (want= writes it linux/arm64).
  assert.ok(/\{\{if \.Platform\.Variant\}\}\/\{\{\.Platform\.Variant\}\}\{\{end\}\}/.test(body),
    'docker verify --format must append /{{.Platform.Variant}} when a variant is present, '
    + 'or linux/arm/v7 reads back as bare linux/arm and the correct manifest is failed');
  assert.ok(/sed 's#\/v8 # #g'/.test(body),
    "docker verify must strip a trailing /v8 so arm64 (recorded as arm64/v8) matches want='linux/arm64'");
  // want= must still ask for arm/v7 by its full name - that is the whole point.
  assert.ok(wantPlatforms.includes('linux/arm/v7'),
    'want= must verify linux/arm/v7 explicitly');
});

test('the base image is debian:trixie (which publishes i386 and arm/v7)', () => {
  // Debian, not Ubuntu: Ubuntu publishes no linux/386, Debian does - and it
  // carries every arch this image targets, so one base covers them all.
  assert.ok(/^FROM\s+debian:trixie/m.test(dockerfile),
    'Dockerfile base must be debian:trixie - the base that lets linux/386 be an image');
});

test('linux/386 and linux/arm/v7 ARE docker platforms; only linux/loong64 is out', () => {
  // 386 + arm/v7: debian:trixie has the base, and the Dockerfile installs their
  // Node 24 from the wekan/node fork (node-i386 / node-armhf).
  for (const need of ['linux/386', 'linux/arm/v7']) {
    assert.ok(buildPlatforms.includes(need), `${need} must be in --platform`);
    assert.ok(wantPlatforms.includes(need), `${need} must be in want=`);
  }
  // loong64: no Docker base image publishes it and the registries do not agree
  // on its manifest yet - it ships as a .zip bundle only.
  assert.ok(!buildPlatforms.includes('linux/loong64'), 'linux/loong64 must not be built as an image');
  assert.ok(!wantPlatforms.includes('linux/loong64'), 'linux/loong64 must not be verified');
});

test('the Dockerfile can install Node for every platform it is built for', () => {
  // Each platform's TARGETARCH must have a branch in the Dockerfile arch case,
  // or the RUN ends with "Unsupported architecture" (which is how arm/v7 broke
  // once). Map the docker platform to the TARGETARCH the case switches on.
  const targetArch = { 'linux/amd64': 'amd64', 'linux/arm64': 'arm64',
    'linux/ppc64le': 'ppc64le', 'linux/s390x': 's390x', 'linux/riscv64': 'riscv64',
    'linux/386': '386', 'linux/arm/v7': 'arm' };
  for (const p of buildPlatforms) {
    const ta = targetArch[p];
    assert.ok(ta, `test needs a TARGETARCH mapping for ${p}`);
    assert.ok(new RegExp(`"${ta}"\\)`).test(dockerfile),
      `Dockerfile arch case has no "${ta}") branch for ${p} - the RUN would exit "Unsupported architecture"`);
  }
});

test('the build list and the verify list are identical', () => {
  assert.deepStrictEqual(
    [...buildPlatforms].sort(), [...wantPlatforms].sort(),
    'the buildx --platform list and the want= verify list must be the same set - '
    + 'a platform built but not verified (or the reverse) is a silent gap');
});

test('the core platforms are still built', () => {
  for (const need of ['linux/amd64', 'linux/arm64']) {
    assert.ok(buildPlatforms.includes(need), `${need} must be built`);
  }
});

console.log(`\nreleaseDockerPlatforms: all ${passed} tests passed`);
