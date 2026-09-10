'use strict';

// Regression guard for a shape that broke three independent features in one
// sandbox session, each the same mistake: a client file calls a named export
// (`Utils.canModifyCard()`, `ReactiveCache.getCurrentUser()`) without
// importing it. `Utils` and `ReactiveCache` are ordinary ES exports here
// (client/lib/utils.js's `export const Utils = {...}`,
// imports/reactiveCache.js's `export const ReactiveCache = {...}`) - NOT
// Meteor globals like `Template`/`Meteor`/`Tracker` - so a file that uses one
// without importing it throws a plain "Utils is not defined" ReferenceError
// the moment that code path actually runs. That is silent at edit time, at
// build time (rspack does not type-check across the whole app either), and
// under every existing Node test, because none of them execute this code
// with `Utils`/`ReactiveCache` deliberately left undefined - it only shows up
// live, in the browser console, exactly as reported: a new label not
// enlarging on the card (client/components/cards/cardFlowtime.js and
// cardPomodoro.js's canControlFlow/canControlPomodoro helpers threw and broke
// the card's reactive render), a broken Notification Settings popup
// (notificationSettingsPopup.js), and broken header bookmarks
// (client/components/main/bookmarks.js).
//
// This is a source-read test (no Meteor runtime): it walks every client/**/*.js
// file, strips comments, and flags one that CALLS Utils.<method>( or
// ReactiveCache.<method>( without importing that name - the same sweep that
// found the four real bugs above, kept as a standing guard against a fifth.
//
// Run: node tests/clientSingletonImports.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CLIENT_DIR = path.join(ROOT, 'client');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

// Strip // line comments and /* */ block comments (crude but sufficient: this
// codebase has no // or /* inside a string literal that matters for our
// purposes here, and a false negative only means a missed check, not a
// false alarm).
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// Files that themselves DEFINE the singleton (so a bare use of it is a local
// reference, not a missing import) are excluded per-name below.
const SINGLETONS = [
  { name: 'Utils', definedIn: 'client/lib/utils.js' },
  { name: 'ReactiveCache', definedIn: 'imports/reactiveCache.js' },
];

console.log('clientSingletonImports:');

for (const { name, definedIn } of SINGLETONS) {
  test(`every client/**/*.js call to ${name}.<method>( imports ${name}`, () => {
    const offenders = [];
    for (const file of walk(CLIENT_DIR)) {
      const rel = path.relative(ROOT, file).replace(/\\/g, '/');
      if (rel === definedIn) continue;
      const raw = fs.readFileSync(file, 'utf8');
      const src = stripComments(raw);
      const callPattern = new RegExp(`\\b${name}\\.[A-Za-z_$][\\w$]*\\s*\\(`);
      if (!callPattern.test(src)) continue;
      const importPattern = new RegExp(
        `import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from|import\\s+${name}\\s+from`);
      if (!importPattern.test(raw)) offenders.push(rel);
    }
    assert.deepStrictEqual(offenders, [],
      `these files call ${name}.<method>() but never import { ${name} } - a plain `
      + `"${name} is not defined" ReferenceError at runtime: ${offenders.join(', ')}`);
  });
}

console.log(`\nclientSingletonImports: ${passed} tests passed`);
