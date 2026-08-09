'use strict';

// Which snaps, on which architectures, to which channels - and the two
// architectures that are NOT the two names of one thing.
//
// WeKan publishes three snaps of the same application across six Snap Store
// architectures, and each has to reach four channels. The helper this replaces
// released ONE snap, ONE revision, to THREE channels - and a revision number is
// per architecture, so a single number could only ever be right for one of them.
//
// The mapping is where the real hazard is, and most of this suite is about it:
//
//   ppc64le and ppc64el   ARE the same hardware under two names.
//   armhf and armv7       are NOT. armhf is 32-bit Raspberry Pi OS; armv7 is
//                         the ODroid-U3. Mapping one onto the other would hand
//                         Raspberry Pi users the ODroid build, which is why the
//                         negative test below exists at all.
//
// Run: node tests/snapArchitectures.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const {
  SNAP_NAMES,
  SNAP_CHANNELS,
  NOT_SNAP_ARCHITECTURES,
  snapArchitectures,
  bundleArchitectures,
  snapArchOf,
  bundleArchOf,
  releaseTargets,
  pickRevision,
  parseRevisions,
} = require('../models/lib/snapArchitectures');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// ───────────────────────────────────────────────── the three snaps, four channels

test('all three snaps are published, not just wekan', () => {
  assert.deepStrictEqual(SNAP_NAMES, ['wekan', 'wekan-ondra', 'wekan-gantt-gpl']);
});

test('all FOUR channels, stable included', () => {
  // The old helper released to edge,beta,candidate - so a build reached three of
  // the four and somebody had to remember stable by hand, every time.
  assert.deepStrictEqual([...SNAP_CHANNELS].sort(),
    ['beta', 'candidate', 'edge', 'stable']);
});

test('every snap gets every architecture', () => {
  const targets = releaseTargets();
  assert.strictEqual(targets.length, SNAP_NAMES.length * snapArchitectures().length);
  SNAP_NAMES.forEach(snap => {
    const forSnap = targets.filter(t => t.snap === snap).map(t => t.arch);
    assert.deepStrictEqual(forSnap, snapArchitectures(), `${snap} is missing architectures`);
  });
});

// ────────────────────────────────────────────── ppc64le and ppc64el: one thing

test('ppc64le (bundle) and ppc64el (store) are the same architecture', () => {
  assert.strictEqual(snapArchOf('ppc64le'), 'ppc64el');
  assert.strictEqual(snapArchOf('ppc64el'), 'ppc64el', 'the store name maps to itself');
  assert.strictEqual(bundleArchOf('ppc64el'), 'ppc64le');
  assert.strictEqual(bundleArchOf('ppc64le'), 'ppc64le');
});

test('it is the ONLY architecture whose two names differ', () => {
  const renamed = snapArchitectures().filter(a => bundleArchOf(a) !== a);
  assert.deepStrictEqual(renamed, ['ppc64el'],
    'a second rename would need its own reason written down');
});

// ─────────────────────────────── armhf and armv7: two things, and must stay two

test('NEGATIVE, THE IMPORTANT ONE: armv7 is not another name for armhf', () => {
  // armhf is 32-bit Raspberry Pi OS. armv7 is the ODroid-U3. They are different
  // CPUs with different bundles, and mapping one onto the other would publish
  // the ODroid build to Raspberry Pi users.
  assert.strictEqual(snapArchOf('armhf'), 'armhf');
  assert.strictEqual(snapArchOf('armv7'), '',
    'armv7 must NOT resolve to a Snap Store architecture');
  assert.strictEqual(snapArchOf('armv7l'), '',
    'nor its Node.js spelling');
  assert.strictEqual(bundleArchOf('armhf'), 'armhf',
    "armhf's bundle is armhf, not armv7");
});

test('armv7 is recorded as not-a-snap, with the reason', () => {
  assert.ok(NOT_SNAP_ARCHITECTURES.armv7, 'it is written down, not merely absent');
  // The reason is NEON, not the CPU generation: node-patches builds armhf to the
  // Debian baseline (VFPv3-D16, no NEON) and armv7 with NEON. The store's single
  // 32-bit ARM architecture must carry the baseline, or the snap is an illegal
  // instruction on any board without NEON.
  assert.ok(/NEON/.test(NOT_SNAP_ARCHITECTURES.armv7));
  assert.ok(/baseline/i.test(NOT_SNAP_ARCHITECTURES.armv7),
    'and says which build the store must carry');
  assert.ok(/illegal instruction/i.test(NOT_SNAP_ARCHITECTURES.armv7),
    'and what happens if it carries the other one');
});

test('the reason matches what node-patches actually builds', () => {
  // The single thing that would make the note above a story rather than a fact.
  const wf = path.join(repoRoot, '.tools/node-patches/.github/workflows/release-all.yml');
  if (!fs.existsSync(wf)) {
    console.log('  -- .tools/node-patches not cloned; skipping the cross-check');
    return;
  }
  const src = fs.readFileSync(wf, 'utf8');
  assert.ok(/node-armhf[\s\S]{0,200}?VFPv3-D16/.test(src),
    'armhf is the VFPv3-D16 Debian baseline');
  assert.ok(/node-armv7[\s\S]{0,200}?NEON/.test(src),
    'armv7 is the NEON-tuned build');
});

test('i386 is recorded as not-a-snap, with the reason', () => {
  assert.ok(NOT_SNAP_ARCHITECTURES.i386);
  assert.ok(/core24/i.test(NOT_SNAP_ARCHITECTURES.i386));
  assert.strictEqual(snapArchOf('i386'), '', 'and it does not resolve');
});

test('the architecture list matches what snapcraft.yaml actually builds', () => {
  // The single thing that would make this whole table a lie.
  const yaml = read('snapcraft.yaml');
  const buildFor = [...yaml.matchAll(/^\s*build-for:\s*(\S+)\s*$/gm)].map(m => m[1]).sort();
  assert.deepStrictEqual([...new Set(buildFor)], [...snapArchitectures()].sort(),
    'snapcraft.yaml and the table disagree about which architectures are built');
});

test('negative: junk is refused rather than passed through to snapcraft', () => {
  // An unrecognised --arch reaching `snapcraft release` is a silent no-op, which
  // is the worst outcome: it looks like it worked.
  ['', null, undefined, 'x86', 'sparc', 'ppc64', 'arm', 42, {}]
    .forEach(bad => assert.strictEqual(snapArchOf(bad), '', String(bad)));
  assert.strictEqual(bundleArchOf('sparc'), '');
});

test('either spelling and any case is accepted, whitespace trimmed', () => {
  assert.strictEqual(snapArchOf('  PPC64LE '), 'ppc64el');
  assert.strictEqual(snapArchOf('x64'), 'amd64');
  assert.strictEqual(snapArchOf('aarch64'), 'arm64');
});

// ───────────────────────────────────── revisions are per architecture

test('the newest revision for THAT architecture wins', () => {
  const rows = [
    { revision: 10, arch: 'amd64', version: '10.75' },
    { revision: 11, arch: 'arm64', version: '10.75' },
    { revision: 12, arch: 'amd64', version: '10.75' },
  ];
  assert.strictEqual(pickRevision(rows, 'amd64', '10.75'), 12);
  assert.strictEqual(pickRevision(rows, 'arm64', '10.75'), 11,
    "arm64 must not be given amd64's higher revision");
});

test('the highest wins, not whichever row came first', () => {
  const rows = [
    { revision: 30, arch: 'amd64', version: '10.75' },
    { revision: 9, arch: 'amd64', version: '10.75' },
  ];
  assert.strictEqual(pickRevision(rows, 'amd64'), 30);
});

test('a version filter publishes what was built, not whatever was uploaded last', () => {
  const rows = [
    { revision: 40, arch: 'amd64', version: '10.76' },
    { revision: 39, arch: 'amd64', version: '10.75' },
  ];
  assert.strictEqual(pickRevision(rows, 'amd64', '10.75'), 39);
  assert.strictEqual(pickRevision(rows, 'amd64'), 40, 'and without one, the newest');
});

test('the bundle spelling works here too', () => {
  const rows = [{ revision: 7, arch: 'ppc64el', version: '10.75' }];
  assert.strictEqual(pickRevision(rows, 'ppc64le'), 7,
    'asking with the bundle name finds the store row');
});

test('negative: no revision for an architecture is null, not a wrong one', () => {
  const rows = [{ revision: 5, arch: 'amd64', version: '10.75' }];
  assert.strictEqual(pickRevision(rows, 'riscv64'), null);
  assert.strictEqual(pickRevision(rows, 'armv7'), null, 'and an unknown arch is null');
  assert.strictEqual(pickRevision(rows, 'amd64', '9.99'), null, 'wrong version, no guess');
  assert.strictEqual(pickRevision(null, 'amd64'), null);
  assert.strictEqual(pickRevision([], 'amd64'), null);
});

// ─────────────────────────────────────────── parsing what the store prints

test('snapcraft list-revisions output is parsed', () => {
  const out = [
    'Rev.    Uploaded              Arch      Version    Channels',
    '42      2026-08-09T04:00:00Z  amd64     10.75      stable*',
    '41      2026-08-09T03:00:00Z  ppc64el   10.75      -',
    '40      2026-08-08T03:00:00Z  armhf     10.74      ',
  ].join('\n');
  const rows = parseRevisions(out);
  assert.strictEqual(rows.length, 3, 'the header is skipped');
  assert.deepStrictEqual(rows[0], {
    revision: 42, uploaded: '2026-08-09T04:00:00Z', arch: 'amd64',
    version: '10.75', channels: 'stable*',
  });
  // A revision with no channels still parses: the columns are taken from the
  // left, not counted from the right.
  assert.strictEqual(rows[2].arch, 'armhf');
  assert.strictEqual(rows[2].version, '10.74');
  assert.strictEqual(pickRevision(rows, 'ppc64le'), 41);
});

test('negative: junk output yields no rows rather than nonsense', () => {
  assert.deepStrictEqual(parseRevisions(''), []);
  assert.deepStrictEqual(parseRevisions(null), []);
  assert.deepStrictEqual(parseRevisions('error: not logged in'), []);
  assert.deepStrictEqual(parseRevisions('Rev. Uploaded Arch Version Channels'), []);
});

// ─────────────────────────────────────────────────────────── the script

test('the release script reads the table instead of copying it', () => {
  const sh = read('releases/snap-release-all-channels.sh');
  assert.ok(/models\/lib\/snapArchitectures/.test(sh));
  // A second copy of the arch list in bash is how the two would drift.
  assert.ok(!/ppc64el\s+riscv64\s+s390x/.test(sh.replace(/#.*$/gm, '')),
    'no hardcoded architecture list outside the comments');
});

test('it releases to every channel in ONE call', () => {
  const sh = read('releases/snap-release-all-channels.sh');
  assert.ok(/snapcraft release "\$snap" "\$revision" "\$channels"/.test(sh),
    'a revision reaches all four channels or none');
});

test('one architecture failing does not stop the rest', () => {
  const sh = read('releases/snap-release-all-channels.sh');
  assert.ok(/failed=\$\(\(failed \+ 1\)\)/.test(sh));
  assert.ok(/RELEASE FAILED/.test(sh));
});

test('it says what it is NOT publishing, every run', () => {
  const sh = read('releases/snap-release-all-channels.sh');
  assert.ok(/NOT_SNAP_ARCHITECTURES/.test(sh),
    '"it is missing" and "it cannot be there" look identical without this');
});

test('the superseded three-channel helper is not what a release calls', () => {
  const old = read('releases/snap-store-release-revision-to-channels.sh');
  assert.ok(/edge,beta,candidate/.test(old), 'it is still there for a single manual release');
  // ...but the new one is what covers everything.
  const sh = read('releases/snap-release-all-channels.sh');
  assert.ok(/stable/.test(sh));
});

console.log(`\n${passed} tests passed`);
