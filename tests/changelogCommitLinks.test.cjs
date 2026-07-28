'use strict';

// Guards for the CHANGELOG commit-link repair.
//
// Every CHANGELOG bullet links the commit it describes, and those links are written
// BEFORE the release. Anything that rewrites history in between — a rebase onto an
// upstream change, an amend, a squash, a version-bump rebase — changes the hashes, so
// the links in the not-yet-released section point at commits that no longer exist and
// 404 once pushed. The repair repoints them by matching each old commit's SUBJECT
// AND author date against the commits now on the branch (a rebase keeps the author
// date; the commit date is replaced), falling back to the patch itself.
//
// The logic lives in ONE place, releases/fix-changelog-hashes.sh, shared by
// releases/release-all.sh (before a release) and build.sh (Setup → "Update
// git ..."). These are source guards (the behaviour itself is exercised by running
// the script against a git repo with rewritten history).
//
// Run: node tests/changelogCommitLinks.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const fix = read('releases/fix-changelog-hashes.sh');
const rel = read('releases/release-all.sh');
const rebuild = read('build.sh');

console.log('changelogCommitLinks:');

test('the repair lives in one shared script that runs its function', () => {
  assert.ok(/fix_commit_hashes\(\)/.test(fix), 'shared script defines the repair function');
  assert.ok(/\nfix_commit_hashes\n/.test(fix), 'the function is actually called');
});

test('release-all.sh runs the shared repair before renaming and before commit/push', () => {
  const callIdx = rel.indexOf('fix-changelog-hashes.sh');
  assert.ok(callIdx > -1, 'release-all.sh calls the shared repair script');
  const renameIdx = rel.indexOf("Renaming '# Upcoming WeKan");
  assert.ok(renameIdx > -1 && callIdx < renameIdx, 'repair runs before the rename');
  const commitIdx = rel.indexOf('Committing and pushing pending changes');
  assert.ok(commitIdx > -1 && callIdx < commitIdx, 'repair runs before the commit/push');
  // release-all.sh no longer carries its own copy of the logic.
  assert.ok(!/fix_upcoming_commit_hashes\(\) \{/.test(rel),
    'release-all.sh must not keep a duplicate implementation');
});

test('build.sh reuses the same shared repair script', () => {
  assert.ok(/fix-changelog-hashes\.sh/.test(rebuild),
    'the Update-git option calls the shared repair, not its own copy');
});

test('a link ANY ref can reach is left alone', () => {
  // Changed deliberately: this used to ask "is it an ancestor of HEAD", which
  // called every commit that lives only in an old release TAG stale - and
  // repointing one of those sends the reader to a DIFFERENT change, while the
  // original link was being served by GitHub perfectly well. Staleness is now
  // "no ref in this clone reaches it". tests/changelogHashFix.test.cjs runs the
  // script and pins the behaviour.
  assert.ok(/git rev-list --all/.test(fix),
    'the set of reachable commits comes from ALL refs, branches and tags');
  assert.ok(!/merge-base --is-ancestor "\$h" HEAD/.test(fix),
    'ancestry of HEAD is not the test - a tag-only commit is a working link');
});

test('a stale link is remapped by commit SUBJECT + author date, not by position', () => {
  assert.ok(/git log -1 --format=%s "\$h"/.test(fix),
    "reads the old commit's subject (the pre-rewrite object is still in the clone)");
  assert.ok(/\$2==d && \$3==s \{print \$1\}/.test(fix),
    'matches subject AND author date exactly - a rebase keeps both');
  assert.ok(/grep -c \./.test(fix),
    'and refuses to pick when several commits share the subject ("Updated ChangeLog.")');
  assert.ok(/patch-id/.test(fix),
    'a reworded amend is caught by the patch instead');
});

test('only the unreleased section is rewritten', () => {
  // Earlier sections are already pushed and their hashes are correct - an identical
  // stale hash quoted in an older release entry must NOT be rewritten.
  assert.ok(/NR>=s && NR<=e \{ gsub\("commit\/" old, "commit\/" repl\) \}/.test(fix),
    'the substitution is bounded to the section line range');
  assert.ok(/awk -v s="\$start" 'NR>s && \/\^# v\[0-9\]\+\\\.\[0-9\]\+ \/\{print NR-1; exit\}'/.test(fix),
    'the section ends at the next released heading');
});

test('it works whether or not the Upcoming heading has been renamed yet', () => {
  assert.ok(/grep -nE '\^# Upcoming WeKan'/.test(fix), 'prefers the Upcoming section');
  assert.ok(/\[ -z "\$start" \] && start=.*grep -nE '\^# v\[0-9\]\+/.test(fix),
    'falls back to the newest release heading when already renamed');
});

test('an unresolvable link warns but never aborts (negative)', () => {
  assert.ok(/unresolved\+=\(/.test(fix), 'collects the ones it cannot resolve');
  assert.ok(/WARNING: \$\{#unresolved\[@\]\} commit link\(s\)/.test(fix), 'reports them');
  // The script must not fail the caller: it exits 0 and never exits non-zero.
  assert.ok(/\nexit 0\n/.test(fix), 'the shared script always exits 0');
  assert.ok(!/\bexit 1\b/.test(fix), 'the repair never exits non-zero');
});

test('the release-all.sh header comment still documents the first local step', () => {
  assert.ok(/1\. Repoints stale commit links/.test(rel),
    'the "what this script does locally" list mentions it');
});

console.log(`\n${passed} tests passed`);
