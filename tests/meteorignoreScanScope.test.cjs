'use strict';

// What Meteor is allowed to walk when it builds.
//
// Meteor scans the app directory. It honours .meteorignore and it does NOT read
// .gitignore, so a repository cloned in beside the app is invisible to git and
// fully visible to the build - and the build pays for it twice: one inotify
// watch per directory (the limit is shared with every other watcher the user
// runs), and one ignore matcher per directory descended into, each carrying the
// whole accumulated pattern list.
//
// That second cost is what this guard exists for, because it is the one that
// killed the build rather than merely slowing it. A heap snapshot taken as
// `meteor build` died showed 945 matchers holding 14.3 million IgnoreRule
// objects - 980 MB of them, plus 667 MB of sliced strings, 308 MB of
// concatenated strings and 274 MB in 945 copies of a single 296 KB pattern
// list. About 2.5 GB of a 4.1 GB heap, and only 945 directories in. With the
// sibling clones present there were 6,867 directories to walk and roughly 1,000
// of them were WeKan; the rest were a Node.js fork checkout (4,132), FerretDB
// (9,568 before it was excluded), .tools (20,535), mongo-tools, TSC, the TSC
// website, two more WeKan checkouts and Meteor's own build output. Raising
// --max-old-space-size cannot fix that shape - the cost scales with the
// directory count, so the ceiling was never the variable.
//
// So: every top-level directory that is NOT WeKan must be excluded here. This
// guard pins the ones already known, and - the part that matters for the next
// person - fails on any NEW top-level directory that .gitignore excludes while
// .meteorignore does not, which is exactly how each of these arrived.
//
// Run: node tests/meteorignoreScanScope.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The entries, with the comments and blank lines dropped. .meteorignore uses
// gitignore syntax, so a leading "/" anchors to the directory holding the file.
function entries(rel) {
  return read(rel)
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

const meteorignore = entries('.meteorignore');
const ignored = new Set(meteorignore.map(l => l.replace(/^\/+/, '').replace(/\/+$/, '')));

console.log('meteorignoreScanScope:');

test('the foreign checkouts that share this directory are all excluded', () => {
  // Each of these is a whole other project cloned in beside WeKan. Nothing in
  // the app imports any of them: the Node.js, FerretDB and mongo-tools binaries
  // are downloaded from their releases at build time, and TSC and its website
  // are not WeKan at all.
  const foreign = [
    '.tools',                    // Node headers + a Go toolchain, 20,535 dirs
    'FerretDB',                  // the v1 fork checkout, 9,568 dirs
    'node',                      // the Node.js fork checkout, 4,132 dirs, 2.3 GB
    'mongo-tools',               // another Go project, 738 dirs
    'TSC',                       // the game, 472 dirs
    'secretchronicles.github.io' // its website, 512 dirs
  ];
  const missing = foreign.filter(d => !ignored.has(d));
  assert.deepStrictEqual(missing, [], 'foreign checkouts Meteor would still walk');
});

test('and so are the two variant WeKan checkouts, which are worse than the rest', () => {
  // wekan-ondra and wekan-gantt-gpl each contain client/, server/ and models/.
  // Meteor loads server/ and client/ EAGERLY, so these are not merely scanned -
  // leaving them in pulls a second and third copy of the whole app into the
  // build.
  for (const d of ['wekan-ondra', 'wekan-gantt-gpl']) {
    assert.ok(ignored.has(d), `${d} is app code Meteor would load eagerly`);
  }
});

test('and Meteor\'s own build output, which it would otherwise scan', () => {
  // `meteor build` writes _build/ and the test run writes _build-local-test/,
  // both inside the tree being scanned to produce them. They were the first two
  // entries of that 296 KB pattern list, which is how they were spotted.
  for (const d of ['_build', '_build-local-test']) {
    assert.ok(ignored.has(d), `${d} is build output being scanned as source`);
  }
});

test('the excludes are anchored to the repo root, not matched at any depth', () => {
  // A naked "tests/" matches a directory named tests at ANY depth and would hide
  // server/lib/tests/ and client/lib/tests/ - the Mocha suites loaded via
  // meteor.testModule - making `meteor test` report "0 passing". The same trap
  // applies to "node/" (there is no such subdirectory today, but a bare pattern
  // is a landmine) and to "log/". Everything that names a top-level directory
  // gets a leading slash.
  const unanchored = meteorignore.filter(l =>
    !l.startsWith('/') && l !== 'npm-packages/');
  assert.deepStrictEqual(unanchored, [],
    'unanchored patterns match at any depth');
});

test('nothing gitignored at the top level is left for Meteor to walk', () => {
  // The general rule, so the NEXT clone dropped in here is caught by a test
  // rather than by a build running out of memory. Any top-level directory that
  // .gitignore excludes is by definition not part of the app, so Meteor has no
  // business scanning it either.
  //
  // The exceptions are the directories Meteor and npm own and handle
  // themselves - excluding those would break the build rather than speed it up.
  const meteorOwns = new Set(['node_modules', '.meteor', '.build', '.git']);

  const gitignored = entries('.gitignore')
    .filter(l => l.startsWith('/') && l.endsWith('/') && !l.startsWith('/*'))
    .map(l => l.replace(/^\/+/, '').replace(/\/+$/, ''));

  const unguarded = [...new Set(gitignored)]
    .filter(d => !meteorOwns.has(d))
    .filter(d => !ignored.has(d))
    // Only what is actually here: .gitignore names clones that a given checkout
    // may not have, and a guard that demands .meteorignore list directories
    // that do not exist would fail on a clean CI checkout.
    .filter(d => fs.existsSync(path.join(ROOT, d)));

  assert.deepStrictEqual(unguarded, [],
    'top-level directories git ignores but Meteor would still scan - add them ' +
    'to .meteorignore, or to meteorOwns here if Meteor genuinely needs them');
});

console.log(`meteorignoreScanScope: ${passed} passed`);
