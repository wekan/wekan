'use strict';

// Guard: a test that walks the repository skips EVERY rspack output directory,
// not only the one called `_build`.
// Run: node tests/sourceWalkersSkipBuildOutput.test.cjs
//
// Meteor's rspack writes its compiled output to `_build/`, and a test build to
// `_build-local-test/` (and other `_build-*` names). Each one holds a bundled
// second copy of every source file (CLAUDE.md). 62 source-scanning tests
// skipped `_build` by exact name only, so as soon as the Mocha stage of a full
// run had compiled `_build-local-test/`, tests/publishFilesCursor.test.cjs read
// server-rspack.js there and failed on nine lines of generated code nobody can
// edit. The others passed only because the bundle happened to hold nothing
// they look for. The skip is by PREFIX: `name.startsWith('_build')`.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const testsDir = __dirname;

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// A file that lists '_build' in a skip set or list is one that walks the tree
// and means to leave rspack's output alone.
function skipsBuildByName(text) {
  return /new Set\(\[[^\]]*'_build'/.test(text) || /\[[^\]]*'_build'[^\]]*\]\.includes\(/.test(text);
}
function skipsBuildByPrefix(text) {
  return /\.startsWith\(\s*'_build'\s*\)/.test(text)
    || /\/\^_build/.test(text)
    || /'_build-local-test'/.test(text);
}

const walkers = fs.readdirSync(testsDir)
  .filter(f => /\.(cjs|mjs|js)$/.test(f) && f !== path.basename(__filename))
  .map(f => ({ f, text: fs.readFileSync(path.join(testsDir, f), 'utf8') }))
  .filter(({ text }) => /readdirSync/.test(text) && skipsBuildByName(text));

test('the scan finds the tree walkers (it is not silently empty)', () => {
  assert.ok(walkers.length >= 60, `expected at least 60 walkers, found ${walkers.length}`);
});

test('the prefix check is recognised and the exact-name skip alone is not', () => {
  assert.ok(skipsBuildByPrefix("if (SKIP.has(e.name) || e.name.startsWith('_build')) continue;"));
  assert.ok(!skipsBuildByPrefix("const SKIP = new Set(['_build', 'node_modules']);"));
  assert.ok(skipsBuildByName("const SKIP = new Set(['node_modules', '_build']);"));
});

test('every walker that skips _build also skips _build-local-test and the like', () => {
  const missing = walkers.filter(({ text }) => !skipsBuildByPrefix(text)).map(({ f }) => f);
  assert.deepStrictEqual(missing, [],
    'these tests skip _build by exact name only, so they read the bundled copy in ' +
    "_build-local-test/ after a test build; add `|| name.startsWith('_build')`:\n  " +
    missing.join('\n  '));
});

test('a walker skips a _build-local-test directory with real bundled code in it', () => {
  // Drive one of the fixed walkers against the tree as it is: with or without
  // a test build present, publishFilesCursor must report nothing generated.
  const text = fs.readFileSync(path.join(testsDir, 'publishFilesCursor.test.cjs'), 'utf8');
  assert.match(text, /SKIP\.has\(entry\.name\) \|\| entry\.name\.startsWith\('_build'\)/);
});

console.log(`\n${passed} passed`);
