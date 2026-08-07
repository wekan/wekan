'use strict';

// Nothing the SERVER loads may pull in a browser-only package.
//
// The server bundle runs in plain Node: there is no window and no document. A
// package that expects one does not degrade, it throws while the bundle is
// still being evaluated, so the whole app dies at boot with no route, no
// publication and no error page - only a stack trace in the terminal:
//
//   [uncaughtException] WeKan is stopping: Error: jQuery requires a window with
//   a document
//       at Object../models/csvCreator.js
//       at Module../server/imports.js
//
// That is exactly what happened: models/csvCreator.js carried
// `import { isEmptyObject } from 'jquery'` - an import nothing in the file even
// used - and server/imports.js loads csvCreator for the CSV/TSV import feature,
// so jQuery ended up in the server bundle and every start crashed.
//
// An unused import is invisible in review and free on the client, which is why
// this is a guard and not a comment: it walks the import graph from the server
// entry point and pins that no file it reaches names a package that needs a
// DOM.
//
// Run: node tests/serverBundleBrowserImports.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const rel = p => path.relative(root, p).split(path.sep).join('/');

// ── the import graph, from the server entry point ────────────────────────────

// `import '/x/y'`, `import a from './y'`, `export … from '…'` and the
// `require('…')` WeKan still uses in a few places.
const SPECIFIER = /(?:\bimport\s[^;]*?from\s*|\bimport\s*|\bexport\s[^;]*?from\s*|\brequire\s*\()\s*['"]([^'"]+)['"]/g;
const EXTENSIONS = ['', '.js', '.jsx', '.ts', '.cjs', '.mjs', '.json'];

function resolve(spec, fromFile) {
  if (!spec.startsWith('/') && !spec.startsWith('.')) return null; // a package
  const base = spec.startsWith('/')
    ? path.join(root, spec)
    : path.resolve(path.dirname(fromFile), spec);
  for (const ext of EXTENSIONS) {
    const candidate = base + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  for (const ext of ['.js', '.jsx', '.ts']) {
    const candidate = path.join(base, 'index' + ext);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

// Walks the repo files reachable from `entry` and records, per file, the bare
// package specifiers it imports. Meteor packages (`meteor/…`) are the platform's
// own and are not what this guard is about.
function walk(entry) {
  const files = new Set();
  const packages = new Map(); // repo file -> Set of package specifiers
  const queue = [path.join(root, entry)];
  while (queue.length) {
    const file = queue.pop();
    if (files.has(file)) continue;
    files.add(file);
    if (!/\.(js|jsx|ts|cjs|mjs)$/.test(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    let m;
    SPECIFIER.lastIndex = 0;
    while ((m = SPECIFIER.exec(src)) !== null) {
      const spec = m[1];
      const target = resolve(spec, file);
      if (target) {
        if (!files.has(target)) queue.push(target);
      } else if (!spec.startsWith('meteor/')) {
        const key = rel(file);
        if (!packages.has(key)) packages.set(key, new Set());
        packages.get(key).add(spec);
      }
    }
  }
  return { files: new Set([...files].map(rel)), packages };
}

const server = walk('server/main.js');

// The walk has to be right before anything it says means anything: if it
// resolved nothing, the graph would be one file and the guard below would pass
// on an empty set.
test('the walk reaches the server entry point and what it loads', () => {
  for (const known of [
    'server/main.js',
    'server/imports.js',
    'models/csvCreator.js',
    'models/import.js',
    'models/wekanCreator.js',
  ]) {
    assert.ok(server.files.has(known), `${known} is reached`);
  }
  assert.ok(server.files.size > 100,
    `the graph is the whole server, not a few files (${server.files.size})`);
});

// ── no browser-only package in it ────────────────────────────────────────────

// Packages whose module body touches window/document as it loads, so importing
// one on the server throws at boot rather than failing later at a call site.
// The root of a package is what matters: `jquery` and `jquery/dist/jquery.js`
// are the same thing.
const BROWSER_ONLY = [
  'jquery',
  'jquery-ui',
  '@rwap/jquery-ui-touch-punch',
  '@wekanteam/dragscroll',
  'blaze',
  'bootstrap',
  'jquery-textcomplete',
  'photoswipe',
];

const packageRoot = spec =>
  spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];

function browserOnlyImports(packages) {
  const found = [];
  for (const [file, specs] of packages) {
    for (const spec of specs) {
      if (BROWSER_ONLY.includes(packageRoot(spec))) found.push(`${file} -> ${spec}`);
    }
  }
  return found.sort();
}

test('no file the server loads imports a browser-only package', () => {
  assert.deepStrictEqual(browserOnlyImports(server.packages), [],
    'these would crash the server bundle at boot ("requires a window with a document"):\n  ' +
      browserOnlyImports(server.packages).join('\n  '));
});

test('csvCreator, the file that crashed the boot, imports no jQuery', () => {
  const src = read('models/csvCreator.js');
  assert.ok(!/['"]jquery/.test(src), 'no jquery specifier');
  // The import was unused even on the client - it named isEmptyObject and the
  // file never called it. Nothing may reintroduce it under another name either.
  assert.ok(!/isEmptyObject/.test(src), 'no leftover jQuery helper reference');
});

// ── the negative: the guard has to FAIL when the import comes back ───────────

test('re-adding the jQuery import to a server file is caught', () => {
  const withJquery = new Map(server.packages);
  withJquery.set('models/csvCreator.js', new Set(['jquery']));
  assert.deepStrictEqual(browserOnlyImports(withJquery),
    ['models/csvCreator.js -> jquery'],
    'the bug as it actually was is reported');
});

test('a deep path into a browser-only package is caught too', () => {
  const withDeepPath = new Map(server.packages);
  withDeepPath.set('models/export.js', new Set(['jquery/dist/jquery.js']));
  assert.deepStrictEqual(browserOnlyImports(withDeepPath),
    ['models/export.js -> jquery/dist/jquery.js'],
    'the package root is what decides, not the exact specifier');
});

test('ordinary server packages are not flagged', () => {
  const ordinary = new Map([['models/export.js', new Set(['moment', 'fs', 'exceljs'])]]);
  assert.deepStrictEqual(browserOnlyImports(ordinary), [],
    'only the browser-only list is refused');
});

console.log(`\nserverBundleBrowserImports: ${passed} tests passed`);
