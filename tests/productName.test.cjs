'use strict';
(async () => {

// Unit tests for the Product-name helper (models/lib/productName.js) and the
// migration-progress modal branding that uses it.
// Run: node tests/productName.test.cjs
//
// Admin Panel / Settings / Layout / Product name (Settings.productName) lets an
// admin white-label WeKan. Migrations (e.g. the #6484 board-repair) must show
// that Product name, falling back to 'WeKan' only when none is configured.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { productNameOrDefault } = await import('../models/lib/productName.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

check('returns the configured Product name when set', () => {
  assert.strictEqual(productNameOrDefault('MyKanban'), 'MyKanban');
  assert.strictEqual(productNameOrDefault('Acme Boards'), 'Acme Boards');
});

check('trims surrounding whitespace', () => {
  assert.strictEqual(productNameOrDefault('  Trello-ish  '), 'Trello-ish');
});

check('falls back to WeKan when unset / blank / non-string', () => {
  assert.strictEqual(productNameOrDefault(undefined), 'WeKan');
  assert.strictEqual(productNameOrDefault(null), 'WeKan');
  assert.strictEqual(productNameOrDefault(''), 'WeKan');
  assert.strictEqual(productNameOrDefault('   '), 'WeKan');
  assert.strictEqual(productNameOrDefault(42), 'WeKan');
  assert.strictEqual(productNameOrDefault({}), 'WeKan');
});

// ── source guard: the migration-progress modal is branded with the Product name
check('migrationProgress modal uses the Product-name helper', () => {
  const js = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'settings', 'migrationProgress.js'), 'utf8');
  assert.ok(/from '\/models\/lib\/productName'/.test(js), 'must import the helper');
  const start = js.indexOf('productName() {');
  assert.ok(start > -1, 'must expose a productName template helper');
  const body = js.slice(start, start + 200);
  assert.ok(/getCurrentSetting\(\)/.test(body), 'must read the current setting');
  assert.ok(/productNameOrDefault\(setting && setting\.productName\)/.test(body),
    'must resolve via the tested helper (Product name or WeKan fallback)');
});

check('migrationProgress.jade shows the Product name in the title', () => {
  const jade = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'settings', 'migrationProgress.jade'), 'utf8');
  assert.ok(/\{\{productName\}\} \{\{_ 'migration-progress-title'\}\}/.test(jade),
    'the modal title must be prefixed with the configured Product name');
});

console.log(`\nproductName: ${passed} checks passed`);

})().catch(e => { console.error(e); process.exit(1); });