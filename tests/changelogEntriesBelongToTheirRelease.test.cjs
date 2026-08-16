'use strict';

// Guard: an entry in a RELEASED section must describe work that release contains.
// Run: node tests/changelogEntriesBelongToTheirRelease.test.cjs
//
// Releases here are frequent - the normal maintenance loop is build.sh option 1
// (git pull + git push) and releases/release-all.sh, several times a day - so
// work continues immediately after a release. That makes one mistake easy and
// expensive: `release-all.sh` renames `# Upcoming WeKan ® release` to
// `# v<NEW> ...`, and an entry written afterwards has nowhere correct to go. It
// gets appended above the first "Thanks to above GitHub users" line, which is now
// INSIDE the release just published.
//
// v10.96 and v10.97 both ended up that way. The second was worse than misplaced:
// an entry already published was EDITED afterwards, so the notes described a
// smaller, tidier change than the one that shipped - and the one that shipped was
// the one that stopped the bundle starting.
//
// releases/release-all.sh now opens the next Upcoming as soon as it names a
// release, so entries have a home. This is the check that the home was used: git
// knows exactly which commits a release contains, so an entry linking a commit
// that is NOT an ancestor of its release is an entry in the wrong section.
//
// Everything here degrades to a skip rather than a false alarm - a shallow clone,
// a rewritten hash, a release with no tag yet - because a CHANGELOG guard that
// cries wolf on a fresh clone teaches people to ignore it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function git(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

const inRepo = git(['rev-parse', '--git-dir']) !== null;

// Sections, newest first: heading -> the commit links inside it.
function sections() {
  const lines = changelog.split('\n');
  const out = [];
  let current = null;
  for (const line of lines) {
    const heading = /^# v(\d+\.\d+) /.exec(line);
    if (heading) {
      current = { version: heading[1], commits: [] };
      out.push(current);
      continue;
    }
    if (/^# /.test(line)) { current = null; continue; }   // Upcoming, Platforms, TODO Later
    if (!current) continue;
    for (const m of line.matchAll(/github\.com\/wekan\/wekan\/commit\/([0-9a-f]{7,40})/g)) {
      current.commits.push(m[1]);
    }
  }
  return out;
}

// The commit a release was cut at: its tag if there is one, else the version
// bump the release workflow makes.
function releaseCommit(version) {
  const tagged = git(['rev-list', '-n', '1', `v${version}`]);
  if (tagged) return tagged;
  const bump = git(['log', '--format=%H', '-n', '1', '--grep',
    `^Bump versions for v${version}$`, '--extended-regexp']);
  return bump || null;
}

const known = sha => git(['cat-file', '-e', `${sha}^{commit}`]) !== null;

test('no released section links a commit that came after it', () => {
  if (!inRepo) {
    console.log('    (not a git repository - nothing to check)');
    return;
  }
  // THE NEWEST FEW ONLY, and that is a deliberate limit rather than laziness.
  // Run over the whole file this flags 83 entries across thirteen releases going
  // back to v2.99 - old release practices, history rewrites, and links repointed
  // by fix-changelog-hashes.sh onto commits that postdate their tag. None of that
  // is repairable now, and a guard that reports 83 things nobody will act on is a
  // guard people learn to skip. The window that matters is the one where an entry
  // can still land in the wrong section and still be moved.
  const RECENT = 3;
  const misplaced = [];
  let checked = 0;
  for (const section of sections().slice(0, RECENT)) {
    const release = releaseCommit(section.version);
    if (!release || !known(release)) continue;   // no tag, no bump commit, or shallow
    for (const sha of section.commits) {
      if (!known(sha)) continue;                 // a hash from before a history rewrite
      checked += 1;
      // Ancestor of the release commit = contained in that release.
      const contained = git(['merge-base', '--is-ancestor', sha, release]) !== null;
      if (!contained) {
        const subject = git(['log', '--format=%s', '-n', '1', sha]) || '(unknown)';
        misplaced.push(`  v${section.version} links ${sha.slice(0, 9)} "${subject}", `
          + 'which that release does not contain');
      }
    }
  }
  if (checked === 0) {
    console.log('    (no released entry could be resolved in this clone - nothing to check)');
    return;
  }
  assert.deepStrictEqual(misplaced, [],
    'these entries sit in a section that was already published and describe work it does '
    + 'not include. A released section is a record: move the entry to '
    + '"# Upcoming WeKan ® release" rather than leaving it where it landed.\\n'
    + misplaced.join('\\n'));
});

test('release-all.sh opens the next Upcoming when it names a release', () => {
  // The other half: this guard reports the mistake, and that one removes the
  // opportunity to make it.
  const sh = fs.readFileSync(path.join(ROOT, 'releases', 'release-all.sh'), 'utf8');
  const renameAt = sh.indexOf('# v$NEW $DATE WeKan ® release|');
  assert.notStrictEqual(renameAt, -1, 'release-all.sh no longer renames the Upcoming heading');
  const openAt = sh.indexOf('changelog-open-next.mjs');
  assert.notStrictEqual(openAt, -1,
    'release-all.sh must open the next Upcoming, or the next entry written has nowhere '
    + 'to go but inside the release just published');
  assert.ok(openAt > renameAt, 'and it has to happen after the rename, not before');
});

test('opening it twice does not give the file two Upcoming sections', () => {
  const src = fs.readFileSync(path.join(ROOT, 'releases', 'changelog-open-next.mjs'), 'utf8');
  assert.ok(/an Upcoming section is already there; nothing to do/.test(src),
    'a re-run must be a no-op: release-all.sh can be run again after a failure');
});

test('the version is never built into a regular expression (negative)', () => {
  // GitHub CodeQL flagged one line of changelog-open-next.mjs twice:
  // js/incomplete-sanitization (#433), because `.replace(/\./g, '\\.')` escapes
  // dots and not backslashes, and js/regex-injection (#432), because the version
  // is an argv value reaching `new RegExp` as a pattern. Neither is exploitable
  // with a version release-all.sh computed - but a matcher built by string
  // concatenation is the thing to not have, so there is none.
  const src = fs.readFileSync(path.join(ROOT, 'releases', 'changelog-open-next.mjs'), 'utf8');
  const code = src.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  assert.ok(!/new RegExp\(/.test(code),
    'changelog-open-next.mjs builds a RegExp again. Match the heading with '
    + 'startsWith on the exact text instead - it needs no escaping and cannot be '
    + 'injected into.');
  assert.ok(/startsWith\(needle\)/.test(code),
    'the heading is found by a literal prefix, which is what makes the escaping '
    + 'question go away rather than answering it');
});

console.log(`\nchangelogEntriesBelongToTheirRelease: ${passed} tests passed`);
