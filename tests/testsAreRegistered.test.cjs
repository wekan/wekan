'use strict';

// Every mocha suite must be imported by its index, or `meteor test` silently skips it.
//
// `meteor.testModule` in package.json points at client/lib/tests/index.js and
// server/lib/tests/index.js, and those indexes list their suites with explicit
// imports. A suite file that nobody adds to the index still sits in the tree, still
// looks like it is being run, and never executes. Five suites had drifted out that
// way - including checklistbleed and proxybleed, two *bleed security regression
// suites, exactly the kind of test whose silent absence lets a fixed vulnerability
// come back unnoticed.
//
// This guard fails the moment a suite file is not registered, so the drift cannot
// happen again quietly.
//
// Run: node tests/testsAreRegistered.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Escape a literal string for use inside a RegExp. The backslash MUST be in the
// character class (and, being first in the alternation order of the class, is
// escaped along with everything else) - escaping only some metacharacters leaves
// the rest able to change the meaning of the pattern it is spliced into.
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function suiteDir(dir) {
  const abs = path.join(ROOT, dir);
  const index = fs.readFileSync(path.join(abs, 'index.js'), 'utf8');
  const files = fs.readdirSync(abs)
    .filter(f => f.endsWith('.tests.js'))
    .sort();
  const missing = files.filter(f => {
    const stem = f.replace(/\.js$/, '');
    // The index imports without the extension: import './foo.tests';
    // Escape EVERY regex metacharacter, backslash included - escaping only dots
    // left a backslash in a file name able to alter the pattern it is spliced into.
    return !new RegExp(`(['"])\\./${escapeRegExp(stem)}\\1`).test(index);
  });
  return { files, missing };
}

console.log('testsAreRegistered:');

for (const dir of ['server/lib/tests', 'client/lib/tests']) {
  test(`every suite in ${dir} is imported by its index.js`, () => {
    const { files, missing } = suiteDir(dir);
    assert.ok(files.length > 0, `${dir} has no *.tests.js files - wrong path?`);
    assert.deepStrictEqual(
      missing, [],
      `${dir}/index.js does not import: ${missing.join(', ')} — ` +
      'these suites exist but never run',
    );
  });
}

// The two security suites that had drifted out are named explicitly, so a future
// "tidy up the index" cannot drop them again without this test naming the loss.
test('the *bleed security suites are registered', () => {
  const index = fs.readFileSync(path.join(ROOT, 'server/lib/tests/index.js'), 'utf8');
  for (const suite of ['checklistbleed.security.tests', 'proxybleed.security.tests']) {
    assert.ok(index.includes(suite), `server/lib/tests/index.js must import ${suite}`);
  }
});

console.log(`\n${passed} tests passed`);
