'use strict';

// docs/Features/ImportExport/External-Tools.md is the page the README links
// for "what can WeKan import and export". It went stale once (ten tools when
// WeKan read fifty), so every source on the import page and every format in
// the export menu has to be named on it. Run:
// node tests/importExportDocsCoverage.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const doc = read('docs/Features/ImportExport/External-Tools.md');
const importPage = read('client/components/import/import.js');
const exportMenu = read('client/components/boards/exportScope.js');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

// How a name in the code is written on the page, when it differs.
const ON_PAGE = { 'CSV / TSV': 'CSV / TSV', 'NextCloud Deck': 'Nextcloud Deck', '(,)': 'CSV', '(;)': 'CSV', 'Org mode': 'Org mode' };
const named = name => doc.includes(ON_PAGE[name] || name);

test('every import source is on the page', () => {
  const sources = [...importPage.matchAll(/\{ key: '([a-z]+)', name: '([^']+)' \}/g)].map(m => m[2]);
  assert.ok(sources.length >= 40, `the import sources are found (${sources.length})`);
  assert.deepEqual(sources.filter(name => !named(name)), []);
});

test('every export format is on the page', () => {
  const labels = [
    ...[...exportMenu.matchAll(/key: '[a-z-]+', icon: '[^']+', label: '([^']+)', path: 'export\//g)].map(m => m[1]),
    ...[...exportMenu.matchAll(/\['[a-z]+', '([^']+)'\]/g)].map(m => m[1]),
  ];
  assert.ok(labels.length >= 40, `the export formats are found (${labels.length})`);
  assert.deepEqual(labels.filter(label => !named(label)), []);
  assert.match(doc, /\| Wrike workflow \|/, 'the Wrike workflow has its own row');
});

test('the README links the page from its import and export lists', () => {
  const readme = read('README.md');
  assert.match(readme, /Add Board \/ Import \(\[all import and export formats\]\(docs\/Features\/ImportExport\/External-Tools\.md\)\):/);
  assert.match(readme, /Export to \(\[all formats\]\(docs\/Features\/ImportExport\/External-Tools\.md\)\):/);
});

test('negative: a name missing from the page is caught', () => {
  assert.equal(named('Some Tool WeKan Does Not Know'), false);
});

console.log(`\nimportExportDocsCoverage: ${passed} checks passed`);
