'use strict';

// ============================================================================
// Which PACKAGING of WeKan is this - bundle.zip, Snap, Docker or Sandstorm?
// ----------------------------------------------------------------------------
// Admin Panel / Settings / Version answers "what am I running" with a version
// number, an OS and a database. The one thing it never said is the one thing a
// support answer usually turns on: HOW WeKan was installed. The same version
// behaves differently in a snap (its own confined $SNAP_COMMON, its own bundled
// database), in Docker (an image whose data lives in a volume), in a Sandstorm
// grain (one grain per board set, no admin over the machine) and from the plain
// bundle .zip - and the first question on every issue is which of the four it
// is.
//
// The detection is pure and dependency-free on purpose: it takes the
// environment, the Sandstorm flag and a "does this file exist" function, so the
// whole of it can be tested without a snap, a container or a grain. The server
// passes the real ones (server/statistics.js).
//
// ORDER MATTERS, and it is most-specific-first:
//
//   1. WEKAN_PACKAGING, when set, is the answer. A packaging that KNOWS what it
//      is should say so rather than be guessed at, and it is the only way a
//      future packaging (a .deb, a Kubernetes chart) can name itself without
//      this file learning about it.
//   2. Sandstorm, from METEOR_SETTINGS - a grain is a container too, so asking
//      the container questions first would answer "Docker" for it.
//   3. Snap, from snapd's own SNAP/SNAP_NAME. A snap on some systems ALSO looks
//      like a container to the checks below, for the same reason.
//   4. Docker/Podman/Kubernetes, from the marker files a container runtime
//      leaves behind.
//   5. Otherwise the bundle .zip, which is what is left: the tarball a person
//      unpacked and started with start-wekan.sh.
//
// What this deliberately does NOT do is claim more than it knows. There is no
// "source checkout" answer, because a `meteor run` from a checkout and an
// unpacked bundle look identical from inside the process - both are a Node
// process with no marker of any kind - and inventing a difference would make
// the field untrustworthy in the one case somebody reads it carefully.
// ============================================================================

// The four the Version pane names, in the order that page lists them.
//
// THESE ARE NOT TRANSLATED, anywhere, and none of them is an i18n key. They are
// the names of the things themselves - a package format, a store, a product -
// not words describing them, so one identifier stays one string in every
// language: what an admin reads in the pane is what they can put in an issue,
// search the docs for and grep a log with. The pane's LABEL beside them is
// translated (`package`), because that is ordinary UI text.
// tests/versionPaneCategories.test.cjs holds both halves of that.
const PACKAGINGS = ['bundle.zip', 'Snap', 'Docker', 'Sandstorm'];

// Files a container runtime leaves in the filesystem root. Docker writes
// /.dockerenv; Podman (and CRI-O) write /run/.containerenv. Neither is in an
// ordinary install, a snap or a Sandstorm grain.
const CONTAINER_MARKERS = ['/.dockerenv', '/run/.containerenv'];

/**
 * @param {object} [opts]
 * @param {object} [opts.env] process.env, or a fake one
 * @param {boolean} [opts.isSandstorm] the Meteor settings flag
 * @param {function(string): boolean} [opts.fileExists] fs.existsSync, or a fake
 * @return {string} one of PACKAGINGS, or whatever WEKAN_PACKAGING says
 */
function detectPackaging(opts) {
  const { env = {}, isSandstorm = false, fileExists = () => false } = opts || {};

  // An explicit answer wins over every guess below, including Sandstorm's: a
  // packaging that sets this is telling us what it is.
  const explicit = typeof env.WEKAN_PACKAGING === 'string' && env.WEKAN_PACKAGING.trim();
  if (explicit) return explicit;

  if (isSandstorm) return 'Sandstorm';

  // snapd exports both to every app it starts. SNAP is the mount point of the
  // snap, SNAP_NAME its name; either alone is enough, and neither exists
  // outside a snap.
  if ((env.SNAP && String(env.SNAP).trim()) || (env.SNAP_NAME && String(env.SNAP_NAME).trim())) {
    return 'Snap';
  }

  for (const marker of CONTAINER_MARKERS) {
    let found = false;
    try {
      found = !!fileExists(marker);
    } catch (e) {
      // An unreadable root is not a container answer; keep looking.
      found = false;
    }
    if (found) return 'Docker';
  }

  return 'bundle.zip';
}

module.exports = { PACKAGINGS, CONTAINER_MARKERS, detectPackaging };
