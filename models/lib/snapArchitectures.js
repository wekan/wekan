'use strict';

// ============================================================================
// Snap names, channels, and the two names every architecture has
// ----------------------------------------------------------------------------
// WeKan publishes three snaps of the same application - `wekan`, and the
// `wekan-ondra` and `wekan-gantt-gpl` variants - and each must reach every
// architecture on every channel.
//
// Two things make this less obvious than "three names times eight arches".
//
// 1. ppc64le and ppc64el are the SAME hardware under two names. The release
//    bundles at https://github.com/wekan/wekan are named the way Node.js and the
//    kernel name things (`ppc64le`); the Snap Store names it the way Debian does
//    (`ppc64el`). Nothing warns when the wrong one is used - an unrecognised
//    --arch is simply an architecture the store has never heard of - so the
//    rename is written down once, here.
//
// 2. armhf and armv7 are NOT two names for one thing, and must never be mapped
//    onto each other. They are the same CPU family built to different
//    baselines: node-patches builds `armhf` to the Debian armhf baseline
//    (hard-float, VFPv3-D16, assuming NO NEON) so it runs on any ARMv7-A, and
//    `armv7` with NEON for boards that have it. The Snap Store has ONE 32-bit
//    ARM architecture serving every such device, so it must carry the BASELINE
//    build; the NEON one would be an illegal instruction on a board without
//    NEON. armv7 therefore has no snap - see NOT_SNAP_ARCHITECTURES below.
//
// The list is therefore the six architectures snapcraft.yaml actually declares a
// `build-for` for, not the eight the release bundles cover. Both directions are
// unit tested (tests/snapArchitectures.test.cjs).
//
// Pure and dependency-free: the shell scripts read it through node, so there is
// no second copy of this table in bash.
// ============================================================================

// The three snaps. Same application, three store listings.
const SNAP_NAMES = ['wekan', 'wekan-ondra', 'wekan-gantt-gpl'];

// Every channel a revision is released to. `stable` is included deliberately:
// the old helper released to `edge,beta,candidate` only, so a build reached
// three of the four and somebody had to remember the fourth by hand.
const SNAP_CHANNELS = ['stable', 'candidate', 'beta', 'edge'];

// One row per architecture the Snap Store gets, matching snapcraft.yaml's
// `build-for` list exactly. `bundle` is null where the release bundle goes by
// the same name - all but one - so the single rename stands out.
const ARCHITECTURES = [
  { snap: 'amd64', bundle: null },
  { snap: 'arm64', bundle: null },
  { snap: 'armhf', bundle: null },          // 32-bit Raspberry Pi OS
  { snap: 'ppc64el', bundle: 'ppc64le' },   // the store spells POWER the Debian way
  { snap: 'riscv64', bundle: null },
  { snap: 's390x', bundle: null },
];

// Architectures WeKan SHIPS but does not BUILD a snap for, and why.
//
// "Does not build" is not the same as "the store has no column": the store keeps
// whatever was ever uploaded, so an architecture can appear there with an
// ancient revision on every channel long after it stopped being buildable.
// That is what makes these worth writing down rather than inferring from the
// store's own listing.
// Written down because "it is missing" and "it cannot be there" look identical
// from the outside, and somebody re-adding one of these would be repeating a
// mistake that has already been made.
const NOT_SNAP_ARCHITECTURES = {
  armv6:
    'the Snap Store has no armv6 architecture at all - its only 32-bit ARM is ' +
    'armhf, which is ARMv7-A hard-float. An ARMv6 board (Raspberry Pi 1, Zero) ' +
    'cannot run an armhf snap, and there is nothing to publish it as, so ARMv6 ' +
    'ships as a bundle zip and a linux/arm/v6 Docker image only.',
  i386:
    'core24 (Ubuntu 24.04) has no i386 port, so snapcraft rejects `build-on: i386` - ' +
    'and because that is a PARSE error it failed EVERY architecture\'s snap build, not ' +
    'only i386\'s. The STORE still holds old i386 revisions (wekan-ondra has one, at ' +
    'version 0.X-ci, sitting on all four channels), so the column exists there and is ' +
    'years stale; nothing new can be built for it, and re-releasing what is there would ' +
    'only re-publish 0.X-ci. i386 users are served by the .deb and the AppImage.',
  armv7:
    'the same CPU family as armhf, tuned differently: node-patches builds armhf to the ' +
    'Debian armhf baseline (hard-float, VFPv3-D16, NO NEON assumed) so it runs on any ' +
    'ARMv7-A, and armv7 with NEON for boards that have it (an ODroid-U3, say). The Snap ' +
    'Store has ONE 32-bit ARM architecture and it serves every such device, so it must ' +
    'carry the BASELINE build - shipping the NEON one would be an illegal instruction on ' +
    'any armhf board without NEON. armv7 ships as a bundle only.',
};

/** Every Snap Store architecture, in a stable order. */
function snapArchitectures() {
  return ARCHITECTURES.map(a => a.snap);
}

/** Every release-bundle architecture name, in the same order. */
function bundleArchitectures() {
  return ARCHITECTURES.map(a => a.bundle || a.snap);
}

/**
 * The Snap Store's name for a bundle architecture.
 *
 * Accepts either spelling, so a caller that already has the store's name is not
 * punished for it - `snapArchOf('ppc64el')` is `ppc64el`. Unknown input returns
 * '' rather than being passed through: an architecture nobody recognises must
 * not reach `snapcraft release`, where it would be a silent no-op.
 *
 * @param {string} name
 * @return {string} the Snap Store architecture, or '' when it is not one
 */
function snapArchOf(name) {
  if (typeof name !== 'string' || !name) return '';
  const key = name.trim().toLowerCase();

  const row = ARCHITECTURES.find(a => a.snap === key || a.bundle === key);
  if (row) return row.snap;

  // Names the same hardware also goes by upstream. armv7/armv7l is NOT here:
  // it is a different CPU from armhf, not another spelling of it.
  const ALIASES = { x64: 'amd64', 'x86_64': 'amd64', aarch64: 'arm64' };
  return ALIASES[key] || '';
}

/**
 * The release bundle's name for an architecture. Same tolerance in reverse.
 * @param {string} name
 * @return {string} the bundle architecture, or '' when it is not one
 */
function bundleArchOf(name) {
  const snap = snapArchOf(name);
  if (!snap) return '';
  const row = ARCHITECTURES.find(a => a.snap === snap);
  return row.bundle || row.snap;
}

/**
 * Every (snap, architecture) pair that has to be released, in a stable order.
 * The channels are not part of the pair: one `snapcraft release` call takes them
 * all at once, so a revision reaches all four or none.
 * @return {Array<{snap: string, arch: string, bundleArch: string}>}
 */
function releaseTargets() {
  const targets = [];
  SNAP_NAMES.forEach(snap => {
    ARCHITECTURES.forEach(a => {
      targets.push({ snap, arch: a.snap, bundleArch: a.bundle || a.snap });
    });
  });
  return targets;
}

/**
 * Pick the revision to release for one architecture out of `snapcraft
 * list-revisions` rows.
 *
 * Revisions are PER ARCHITECTURE - amd64 revision 42 and arm64 revision 42 are
 * different uploads - which is why one revision number can never be released to
 * every architecture at once, and why this exists at all.
 *
 * The highest revision wins, not the first row: the store's ordering is not
 * something to depend on. When `version` is given, only that version's rows are
 * considered, so a release publishes what it built rather than whatever was
 * uploaded last.
 *
 * @param {Array<{revision: number, arch: string, version: string}>} rows
 * @param {string} arch a Snap Store architecture
 * @param {string} [version]
 * @return {number|null}
 */
function pickRevision(rows, arch, version) {
  if (!Array.isArray(rows)) return null;
  const want = snapArchOf(arch);
  if (!want) return null;

  const candidates = rows.filter(r => {
    if (!r || snapArchOf(r.arch) !== want) return false;
    if (!Number.isFinite(Number(r.revision))) return false;
    if (version && String(r.version) !== String(version)) return false;
    return true;
  });

  if (!candidates.length) return null;
  return candidates.reduce((best, r) => Math.max(best, Number(r.revision)), -Infinity);
}

/**
 * Parse `snapcraft list-revisions` output.
 *
 * Its columns are `Rev. Uploaded Arch Version Channels`, the header is skipped,
 * and a revision with no channels has an empty last column - so the parse keys
 * on the leading revision number and takes the next three fields, rather than
 * counting columns from the right.
 *
 * @param {string} text
 * @return {Array<{revision: number, uploaded: string, arch: string, version: string, channels: string}>}
 */
function parseRevisions(text) {
  if (typeof text !== 'string') return [];

  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^\d+\s/.test(line))
    .map(line => {
      const [revision, uploaded, arch, version, ...rest] = line.split(/\s+/);
      return {
        revision: Number(revision),
        uploaded,
        arch,
        version,
        channels: rest.join(' '),
      };
    })
    .filter(r => r.arch && r.version);
}

module.exports = {
  SNAP_NAMES,
  SNAP_CHANNELS,
  ARCHITECTURES,
  NOT_SNAP_ARCHITECTURES,
  snapArchitectures,
  bundleArchitectures,
  snapArchOf,
  bundleArchOf,
  releaseTargets,
  pickRevision,
  parseRevisions,
};
