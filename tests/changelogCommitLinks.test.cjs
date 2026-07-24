'use strict';

// Guards for the CHANGELOG commit-link repair in releases/release-all.sh.
//
// Every CHANGELOG bullet links the commit it describes, and those links are written
// BEFORE the release. Anything that rewrites history in between — a rebase onto an
// upstream change, an amend, a squash — changes the hashes, so the links in the
// not-yet-released section point at commits that no longer exist and 404 once pushed.
// release-all.sh repoints them by matching each old commit's SUBJECT against the
// commits now on the branch.
//
// These are source guards (the behaviour itself is exercised by running the function
// against a fixture CHANGELOG, which needs a git repo with rewritten history).
//
// Run: node tests/changelogCommitLinks.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const sh = read('releases/release-all.sh');

console.log('changelogCommitLinks:');

test('release-all.sh repairs stale commit links before the release is prepared', () => {
  assert.ok(/fix_upcoming_commit_hashes\(\)/.test(sh), 'defines the repair function');
  // It must RUN, not merely be defined.
  const callIdx = sh.indexOf('\nfix_upcoming_commit_hashes\n');
  assert.ok(callIdx > -1, 'the function is actually called');
  // ...and run BEFORE the Upcoming heading is renamed, or there would be no
  // Upcoming section left to scope the repair to.
  const renameIdx = sh.indexOf("Renaming '# Upcoming WeKan");
  assert.ok(renameIdx > -1 && callIdx < renameIdx, 'repair runs before the rename');
  // ...and before the commit/push step, so the repair is included in the release commit.
  const commitIdx = sh.indexOf('Committing and pushing pending changes');
  assert.ok(commitIdx > -1 && callIdx < commitIdx, 'repair runs before the commit/push');
});

test('a link still on this branch is left alone', () => {
  assert.ok(/git merge-base --is-ancestor "\$h" HEAD/.test(sh),
    'ancestry check decides whether a hash is stale');
});

test('a stale link is remapped by commit SUBJECT, not by position', () => {
  assert.ok(/git log -1 --format=%s "\$h"/.test(sh),
    "reads the old commit's subject (the pre-rewrite object is still in the clone)");
  assert.ok(/\$2==s \{print \$1; exit\}/.test(sh),
    'matches the subject EXACTLY against commits on this branch');
});

test('only the unreleased section is rewritten', () => {
  // Earlier sections are already pushed and their hashes are correct - an identical
  // stale hash quoted in an older release entry must NOT be rewritten.
  assert.ok(/NR>=s && NR<=e \{ gsub\("commit\/" old, "commit\/" repl\) \}/.test(sh),
    'the substitution is bounded to the section line range');
  assert.ok(/awk -v s="\$start" 'NR>s && \/\^# v\[0-9\]\+\\\.\[0-9\]\+ \/\{print NR-1; exit\}'/.test(sh),
    'the section ends at the next released heading');
});

test('it works whether or not the Upcoming heading has been renamed yet', () => {
  assert.ok(/grep -nE '\^# Upcoming WeKan'/.test(sh), 'prefers the Upcoming section');
  assert.ok(/\[ -z "\$start" \] && start=.*grep -nE '\^# v\[0-9\]\+/.test(sh),
    'falls back to the newest release heading when already renamed');
});

test('an unresolvable link warns but never aborts the release (negative)', () => {
  assert.ok(/unresolved\+=\(/.test(sh), 'collects the ones it cannot resolve');
  assert.ok(/WARNING: \$\{#unresolved\[@\]\} commit link\(s\)/.test(sh), 'reports them');
  // No exit / return non-zero on the unresolved path: a doc link must not stop a release.
  const fnStart = sh.indexOf('fix_upcoming_commit_hashes() {');
  const fnEnd = sh.indexOf('\n}', sh.indexOf('unresolved[@]'));
  const body = sh.slice(fnStart, fnEnd);
  assert.ok(!/\bexit 1\b/.test(body), 'the repair never exits non-zero');
});

test('the header comment documents the new first local step', () => {
  assert.ok(/1\. Repoints stale commit links/.test(sh),
    'the "what this script does locally" list mentions it');
});

console.log(`\n${passed} tests passed`);
