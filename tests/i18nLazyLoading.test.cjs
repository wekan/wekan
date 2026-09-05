'use strict';

// The browser downloads ONE language, not 246 of them.
// Run: node tests/i18nLazyLoading.test.cjs
//
// imports/i18n/data/ is 37 MB across 246 files. Every one of them is reachable
// from the client, and the only thing keeping all 37 MB out of the initial
// bundle is that each entry in languages.js loads its file through
// `() => import('./data/<tag>.i18n.json')` - a call Meteor's `dynamic-import`
// package code-splits into a module fetched on demand. English is the one
// deliberate exception: tap.js imports it statically so the UI is readable even
// when dynamic import is broken (#6503).
//
// A single `import data from './data/xx.i18n.json'` anywhere on the client
// undoes that for that file, and nothing about the app would look wrong - it
// would just be a heavier download, which no other test measures. Hence this
// guard: the loaders stay dynamic, the static import stays alone, and the
// package that splits them stays installed.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  parseLanguageMetadata,
  parseLanguageLoaders,
} = require('./lib/languageRegistrySource.cjs');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('i18nLazyLoading:');

const registry = read('imports/i18n/languages.js');
const tap = read('imports/i18n/tap.js');
const metadataRows = parseLanguageMetadata(registry);
const loaderRows = parseLanguageLoaders(registry);

test('the registry parser handles long names without regular-expression backtracking', () => {
  const longName = 'a'.repeat(1_000_000) + '\\\"name';
  const source = `const languageMetadata = [\n${JSON.stringify([
    'test', 'test', 'test', longName, false,
  ])},\n];`;
  assert.strictEqual(parseLanguageMetadata(source)[0][3], longName);
});

test('the registry parser rejects a malformed row (negative)', () => {
  assert.throws(
    () => parseLanguageMetadata('const languageMetadata = [\n  not a row\n];'),
    /Invalid language metadata row/,
  );
});

// Every static `import ... from '<path>'` / `require('<path>')` that names a
// translation data file, in any file we are given.
const STATIC_DATA_IMPORT =
  /(?:^|\n)\s*import[^\n;]*?from\s*['"]([^'"]*data\/[\w@.-]+\.i18n\.json)['"]|require\(\s*['"]([^'"]*data\/[\w@.-]+\.i18n\.json)['"]\s*\)/g;
function staticDataImports(source) {
  const found = [];
  for (const m of source.matchAll(STATIC_DATA_IMPORT)) found.push(m[1] || m[2]);
  return found;
}

test('every registered language loads through a dynamic import()', () => {
  const entries = metadataRows;
  const loaders = loaderRows;
  assert.ok(entries.length > 150, `expected the full registry, got ${entries.length} entries`);
  assert.strictEqual(loaders.length, entries.length,
    `${entries.length} languages but ${loaders.length} dynamic loaders - ` +
    'an entry without `load: () => import(...)` is either never loaded or loaded eagerly');
});

test('metadata keys and tags are unique, and each key has one loader', () => {
  const unique = values => new Set(values).size === values.length;
  const keys = metadataRows.map(row => row[0]);
  const tags = metadataRows.map(row => row[2]);
  const loaderKeys = loaderRows.map(row => row[0]);
  assert.ok(unique(keys), 'duplicate language metadata key');
  assert.ok(unique(tags), 'duplicate language tag');
  assert.ok(unique(loaderKeys), 'duplicate language loader key');
  assert.deepStrictEqual(loaderKeys.sort(), keys.sort(),
    'metadata and loader maps must have exactly the same keys');
});

test('languages.js itself imports no translation data', () => {
  // The registry is imported at startup by client/imports.js. Anything it pulls
  // in statically is in the initial bundle for every visitor, in every language.
  assert.deepStrictEqual(staticDataImports(registry), [],
    'languages.js must only reference data files inside the () => import() loaders');
});

test('tap.js statically imports English and nothing else', () => {
  assert.deepStrictEqual(staticDataImports(tap), ['./data/en.i18n.json'],
    'only the #6503 English fallback may be bundled statically');
});

test('the dynamic loader is called once, for the resolved language only', () => {
  // `languages[key].load()` with a single resolved key - never a map/loop over
  // the registry, which would fetch every language at once.
  const calls = tap.match(/\.load\(\)/g) || [];
  assert.strictEqual(calls.length, 1, `expected exactly one .load() call, found ${calls.length}`);
  assert.ok(/languages\[key\]\.load\(\)/.test(tap),
    'the one call must be indexed by the single resolved tag `key`');
  const bulkLoads = [
    /Object\.(keys|values|entries)\(languages\)[^\n]*\.load\(/,
    /for\s*\([^)]*languages[^)]*\)\s*\{[^}]*\.load\(/,
  ];
  for (const bulk of bulkLoads) {
    assert.ok(!bulk.test(tap), `tap.js must not load every language: ${bulk}`);
  }
});

test('negative: the detector really does see a static translation import', () => {
  // Otherwise the checks above pass by failing to look.
  assert.deepStrictEqual(
    staticDataImports("import all from './data/fi.i18n.json';\n"), ['./data/fi.i18n.json']);
  assert.deepStrictEqual(
    staticDataImports("const x = require('/imports/i18n/data/fi.i18n.json');"),
    ['/imports/i18n/data/fi.i18n.json']);
  // ...and does NOT flag the dynamic loader it is meant to allow.
  assert.deepStrictEqual(
    staticDataImports("load: () => import('./data/fi.i18n.json'),"), []);
});

test('no client file bundles a translation file statically', () => {
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(rel); continue; }
      if (!/\.(js|jsx|ts)$/.test(entry.name)) continue;
      const hits = staticDataImports(read(rel))
        .filter(p => !/\/en\.i18n\.json$/.test(p));   // English is the allowed one
      if (hits.length) offenders.push(`${rel}: ${hits.join(', ')}`);
    }
  };
  walk('client');
  walk('imports/i18n');
  assert.deepStrictEqual(offenders, [],
    'a static import ships that language to everyone, in every language');
});

test('the dynamic-import package that code-splits them is installed', () => {
  // Without it Meteor cannot serve a module on demand and the loaders above
  // would land in the initial bundle after all.
  assert.ok(/^dynamic-import@/m.test(read('.meteor/packages')),
    'dynamic-import missing from .meteor/packages');
  assert.ok(/^dynamic-import@/m.test(read('.meteor/versions')),
    'dynamic-import missing from .meteor/versions');
});

test('the custom-translation subscription asks for one language', () => {
  // The DB overrides an admin typed in Admin Panel / Translation are fetched per
  // language too, so switching language does not pull every override ever saved.
  assert.ok(/Meteor\.subscribe\('translation',\s*\{language: language\}/.test(tap),
    "loadTranslation must subscribe with {language: language}");
});

console.log(`\ni18nLazyLoading: ${passed} checks passed`);
