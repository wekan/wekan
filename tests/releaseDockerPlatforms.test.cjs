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

test('the base image is ubuntu:26.04 (which has no i386)', () => {
  assert.ok(/^FROM\s+ubuntu:26\.04/m.test(dockerfile),
    'Dockerfile base is ubuntu:26.04 - the reason linux/386 cannot be an image');
});

test('linux/386 and linux/loong64 are not in the docker image platforms', () => {
  for (const bad of ['linux/386', 'linux/loong64']) {
    assert.ok(!buildPlatforms.includes(bad),
      `${bad} must not be in --platform: ubuntu:26.04 (386) / registries (loong64) do not carry it, so the build fails - it ships as a .zip instead`);
    assert.ok(!wantPlatforms.includes(bad),
      `${bad} must not be in want=: it is not built as an image, so verifying it would always fail`);
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
