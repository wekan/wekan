'use strict';

// A mocha suite that runs on the CLIENT may not import a Node-only builtin.
//
// The mirror of serverBundleBrowserImports.test.cjs, which keeps browser-only
// packages out of the server bundle. This is the other direction, and it went
// unnoticed for as long as the client bundle happened to carry shims for it:
// `client/lib/tests/boardTriggersClass.tests.js` read boardTriggers.jade and
// boardTriggers.js off disk with `fs` and `path` to compare their class names,
// and node-polyfill-webpack-plugin's browser shims let rspack bundle that.
//
// The @meteorjs/rspack 2.1.0 update dropped that plugin, and the whole `meteor
// test` client build stopped on one line:
//
//     ERROR in ./client/lib/tests/boardTriggersClass.tests.js 13:22-27
//     × Cannot find module 'path' for matched aliased key 'path'
//
// which is not one suite failing - it is the client bundle failing to build, so
// EVERY mocha suite is skipped and the stage reports a crash instead of test
// results. One file's import took out the whole stage.
//
// The suite itself was fine; it was on the wrong side. A test that reads the
// repository belongs where there is a filesystem, so it now lives in
// server/lib/tests. This guard pins that: the client test suites use no Node
// builtin, and the file that taught us this is on the server side.
//
// Run: node tests/clientTestsNoNodeBuiltins.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CLIENT_TESTS = 'client/lib/tests';

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Node's own modules, as a client bundle would have to shim them. Only the ones
// a test might plausibly reach for; the point is the class of mistake, not a
// complete list of Node's API surface.
const BUILTINS = [
  'fs', 'fs/promises', 'path', 'os', 'child_process', 'net', 'tls', 'dns',
  'http', 'https', 'zlib', 'stream', 'worker_threads', 'cluster', 'vm',
  'module', 'readline', 'perf_hooks', 'v8', 'node:fs', 'node:path', 'node:os',
];

// `require('fs')`, `import fs from 'fs'`, `import 'fs'`, `export … from 'fs'`.
const SPECIFIER = /(?:\brequire\s*\(\s*|\bimport\s[^;]*?from\s*|\bimport\s*|\bexport\s[^;]*?from\s*)['"]([^'"]+)['"]/g;

function specifiers(source) {
  // Comments describe the very thing this forbids - "only uses the node
  // fs/path builtins" - so strip them before looking, or the guard reports the
  // explanation of a fixed bug as the bug.
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  const out = [];
  let m;
  while ((m = SPECIFIER.exec(code)) !== null) out.push(m[1]);
  return out;
}

console.log('clientTestsNoNodeBuiltins:');

test('no client-side mocha suite imports a Node builtin', () => {
  const dir = path.join(ROOT, CLIENT_TESTS);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  assert.ok(files.length > 5, `expected the client suites to be there, found ${files.length}`);

  const bad = [];
  for (const f of files) {
    for (const spec of specifiers(fs.readFileSync(path.join(dir, f), 'utf8'))) {
      if (BUILTINS.includes(spec)) bad.push(`${CLIENT_TESTS}/${f} imports '${spec}'`);
    }
  }
  assert.deepStrictEqual(bad, [],
    'a Node builtin in a client suite does not fail that suite - it fails the '
    + 'client BUILD, and every mocha suite with it');
});

test('the suite that reads the repository runs on the server', () => {
  // Where it went, and that it is registered there - an unregistered suite is
  // silently skipped (see testsAreRegistered.test.cjs).
  const moved = 'server/lib/tests/boardTriggersClass.tests.js';
  assert.ok(fs.existsSync(path.join(ROOT, moved)), `${moved} must exist`);
  assert.ok(!fs.existsSync(path.join(ROOT, CLIENT_TESTS, 'boardTriggersClass.tests.js')),
    'and must not be on the client side, where there is no filesystem');
  const index = fs.readFileSync(path.join(ROOT, 'server/lib/tests/index.js'), 'utf8');
  assert.ok(index.includes("./boardTriggersClass.tests"),
    'server/lib/tests/index.js must import it, or it never runs');
  const clientIndex = fs.readFileSync(path.join(ROOT, CLIENT_TESTS, 'index.js'), 'utf8');
  assert.ok(!clientIndex.includes('boardTriggersClass'),
    'and the client index must not still import it');
});

console.log(`\n${passed} tests passed`);
