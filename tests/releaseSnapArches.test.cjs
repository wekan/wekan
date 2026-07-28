'use strict';

// Plain-Node guard (no Meteor) for how release-all.yml builds the snap for each
// CPU architecture. Run: node tests/releaseSnapArches.test.cjs
//
// The failure this pins: ppc64el and s390x were built by a `snap-qemu` job using
// diddlesnaps/snapcraft-multiarch-action, which hardcodes a maximum base of
// core22 and is unmaintained. WeKan's snapcraft.yaml is `base: core24`, so BOTH
// legs died before building anything - "Your build requires a base that this tool
// does not support (core24)" - on every single release. They now build on
// Launchpad, which is the only mechanism that does core24 on an arch with no
// native GitHub runner. See docs/Design/Autoupdate/Forks/Snap-Core.md.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const workflow = read('.github/workflows/release-all.yml');
const snapcraft = read('snapcraft.yaml');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok - ${name}`);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

// The body of one top-level job: from "  <name>:" to the next job at the same
// indentation. Good enough to ask which matrix and which options are ITS own.
function job(name) {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  assert.notStrictEqual(start, -1, `release-all.yml has no ${name} job`);
  const rest = workflow.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z][\w-]*:\n/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

test('the QEMU snap job is gone, and so is the action that could not build core24', () => {
  assert.ok(!/\n {2}snap-qemu:/.test(workflow), 'snap-qemu must be deleted, not disabled');
  assert.ok(!/uses: diddlesnaps\/snapcraft-multiarch-action/.test(workflow),
    'the action caps at core22; nothing may USE it while snapcraft.yaml is core24 '
    + '(the comment explaining why is allowed to name it)');
  assert.ok(/^base: core24$/m.test(snapcraft),
    'this guard exists because the snap is core24 - if that changed, re-read Snap-Core.md');
});

test('every platform in snapcraft.yaml is built by some snap job', () => {
  // The platforms: block lists what the snap claims to support. An arch listed
  // there and built by no job is a snap that never appears in the store.
  // The block ends at the next top-level key (parts:, hooks:, ...).
  let block = snapcraft.slice(snapcraft.indexOf('\nplatforms:') + 1);
  const nextKey = block.slice(1).search(/\n[a-z][\w-]*:/);
  if (nextKey !== -1) block = block.slice(0, nextKey + 1);
  const platforms = [...block.matchAll(/^ {2}([a-z0-9]+):$/gm)].map(m => m[1]);
  assert.deepStrictEqual(platforms.sort(),
    ['amd64', 'arm64', 'ppc64el', 'riscv64', 's390x'],
    'the platform list changed - the two jobs below must cover the new list');

  const native = job('snap-native');
  const launchpad = job('snap-launchpad');
  const built = new Set([
    ...[...native.matchAll(/arch: ([a-z0-9]+)/g)].map(m => m[1]),
    ...(launchpad.match(/arch: \[([^\]]+)\]/) || [, ''])[1]
      .split(',').map(a => a.trim()).filter(Boolean),
  ]);
  const missing = platforms.filter(p => !built.has(p));
  assert.deepStrictEqual(missing, [], 'these platforms are in no snap job');
});

test('the mainstream arches build natively, the exotic ones on Launchpad', () => {
  const native = job('snap-native');
  assert.ok(/arch: amd64\s+runner: ubuntu-24\.04\b/.test(native), 'amd64 on a native runner');
  assert.ok(/arch: arm64\s+runner: ubuntu-24\.04-arm\b/.test(native), 'arm64 on a native runner');
  assert.ok(native.includes('snapcore/action-build'), 'built with the official action');

  const launchpad = job('snap-launchpad');
  const arches = (launchpad.match(/arch: \[([^\]]+)\]/) || [, ''])[1]
    .split(',').map(a => a.trim());
  assert.deepStrictEqual(arches, ['ppc64el', 's390x', 'riscv64'],
    'ppc64el and s390x belong here: no native runner, and QEMU cannot do core24');
  assert.ok(/snapcraft remote-build/.test(launchpad), 'built with remote-build');
});

test('a slow Launchpad arch can neither fail the release nor cancel another arch', () => {
  // This is the whole trade of using Launchpad: a build can queue for hours.
  const launchpad = job('snap-launchpad');
  assert.ok(/continue-on-error: true/.test(launchpad), 'continue-on-error');
  assert.ok(/fail-fast: false/.test(launchpad), 'fail-fast: false');
  const timeout = launchpad.match(/timeout-minutes: (\d+)/);
  assert.ok(timeout, 'timeout-minutes must bound a stuck build');
  assert.ok(Number(timeout[1]) >= 120,
    `timeout-minutes: ${timeout[1]} is too short for a Launchpad queue`);
});

test('it names the secret it is missing, and the one Launchpad refused', () => {
  // A remote build needs BOTH: SNAP_AUTH to upload, LP_CREDENTIALS to build. The
  // arches that just moved here did not need LP_CREDENTIALS before, so a missing
  // one would otherwise read as an ordinary build failure.
  const launchpad = job('snap-launchpad');
  for (const secret of ['SNAP_AUTH', 'LP_CREDENTIALS']) {
    assert.ok(launchpad.includes(`missing="$missing ${secret}"`),
      `the first step must name ${secret} when it is unset`);
  }
  assert.ok(/base64 -d/.test(launchpad), 'and decode LP_CREDENTIALS rather than trust it');
  assert.ok(/LP_CREDENTIALS may not work/.test(launchpad),
    'and say so when Launchpad answers unauthorized');
  assert.ok(/SNAP_AUTH did not work/.test(launchpad),
    'and when the Snap Store refuses the upload');
});

test('a remote build that produced no .snap is a failure, not a silent success', () => {
  // remote-build can exit 0 having only downloaded logs. Uploading nothing is how
  // "is not a valid file" (snapcraft upload, exit 64) used to end a release.
  const launchpad = job('snap-launchpad');
  assert.ok(/No wekan_\$\{VERSION\}_\$\{\{ matrix\.arch \}\}\.snap to upload/.test(launchpad),
    'the upload step must refuse to run without the file');
  assert.ok(/failed after \$attempts attempts/.test(launchpad), 'and the build step must retry');
});

console.log(`\n${passed} tests passed`);
