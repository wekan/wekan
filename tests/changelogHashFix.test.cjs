'use strict';

// Guard for releases/fix-changelog-hashes.sh — the script build.sh ("Update git
// …") and releases/release-all.sh run to repoint CHANGELOG commit links that a
// rebase, amend or squash made stale.
//
// The rule that matters most here is what it must NOT touch. A commit that is
// reachable only from an old release TAG is not on this branch, but GitHub
// serves it perfectly well; "repointing" it sends the reader to a different
// change. Repointing a link is destructive in a way that leaving it alone is
// not, so the test for staleness is "no ref in this clone reaches it", not "it
// is not an ancestor of HEAD" — which is what the script used to ask, and which
// would rewrite every 2019-era tag-only link in the file.
//
// Run: node tests/changelogHashFix.test.cjs

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const script = path.join(repoRoot, 'releases/fix-changelog-hashes.sh');
const source = fs.readFileSync(script, 'utf8');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

function git(...args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

// A commit reachable ONLY from a tag: the case the script must leave alone.
// Found rather than hard-coded, so it keeps working as history grows.
function tagOnlyCommit() {
  // Reachable from a tag but from no branch: exactly the link the script must
  // not touch. `git rev-list --tags --not --branches --remotes` is the direct
  // question, so this keeps working however the history grows.
  const out = git('rev-list', '--tags', '--not', '--branches', '--remotes', '--max-count=1');
  return out.split('\n').filter(Boolean)[0] || null;
}

function runOn(content) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'clhash-')), 'CHANGELOG.md');
  fs.writeFileSync(file, content);
  const out = execFileSync('bash', [script, file], { cwd: repoRoot, encoding: 'utf8' });
  return { out, text: fs.readFileSync(file, 'utf8') };
}

const link = h => `<summary><a href="https://github.com/wekan/wekan/commit/${h}">x</a>. Thanks to xet7.</summary>`;
const wrap = body => `# Upcoming WeKan ® release\n\n<details>\n${body}\n\nbody\n\n</details>\n\n# v1.00 2020-01-01 WeKan ® release\n`;

console.log('changelogHashFix:');

test('a commit on this branch is left alone', () => {
  const head = git('rev-parse', 'HEAD');
  const { text } = runOn(wrap(link(head.slice(0, 9))));
  assert.ok(text.includes(head.slice(0, 9)), 'a current link must not be rewritten');
});

test('a commit reachable only from a TAG is left alone', () => {
  const sha = tagOnlyCommit();
  if (!sha) {
    console.log('    (no tag-only commit in this clone; nothing to check)');
    return;
  }
  const { text, out } = runOn(wrap(link(sha)));
  assert.ok(text.includes(sha),
    'a tag-only commit is served by GitHub - repointing it would send the reader '
    + 'to a DIFFERENT change:\n' + out);
});

test('a hash padded past the commit it names is repointed to that commit', () => {
  // The failure this comes from: 40-character hashes whose first nine characters
  // were right and whose tail was invented, so the link 404'd.
  const real = git('rev-parse', 'HEAD~1');
  const padded = real.slice(0, 10) + 'deadbeef'.repeat(4).slice(0, 30);
  assert.strictEqual(padded.length, 40);
  const { text } = runOn(wrap(link(padded)));
  assert.ok(!text.includes(padded), 'the invented hash must not survive');
  assert.ok(text.includes(real.slice(0, 40)) || text.includes(real.slice(0, 10)),
    'and it is replaced by the commit its prefix names');
});

test('a hash that names nothing is reported, not guessed', () => {
  const junk = 'f'.repeat(40);
  const { text, out } = runOn(wrap(link(junk)));
  assert.ok(text.includes(junk), 'an unresolvable link is left as it is');
  assert.ok(/WARNING: 1 commit link/.test(out), 'and is reported:\n' + out);
});

test('only wekan/wekan links are considered', () => {
  // A link to another repo (wekan/charts, wekan-ldap, a fork) is resolved
  // against THAT repo, which this clone cannot see - so it must be skipped
  // rather than matched against this history.
  const junk = 'a'.repeat(40);
  const { text, out } = runOn(
    `# Upcoming WeKan ® release\n\n- [x](https://github.com/wekan/charts/commit/${junk}).\n\n# v1.00 2020-01-01 WeKan ® release\n`,
  );
  assert.ok(text.includes(junk), 'another repo\'s link is not this script\'s business');
  assert.ok(/No commit links in the section/.test(out), out);
});

test('the source states the rules it applies', () => {
  assert.ok(/for-each-ref|rev-list --all/.test(source),
    'staleness is decided by reachability from ANY ref, not by ancestry of HEAD');
  assert.ok(/%ad/.test(source),
    'the rewritten copy is matched on AUTHOR date - a rebase keeps it, the commit date is replaced');
  assert.ok(/patch-id/.test(source),
    'and on the patch itself, which is what survives a reword');
  assert.ok(/grep -c \./.test(source),
    'a subject shared by several commits ("Updated ChangeLog.") must not be used to pick one');
  assert.ok(/--all-sections/.test(source),
    'the whole file can be checked, not only the section being released');
});

console.log(`\n${passed} tests passed`);
