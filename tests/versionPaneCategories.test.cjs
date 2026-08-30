'use strict';

// Admin Panel / Settings / Version was ONE table of ~40 rows read as a flat
// list: the WeKan version, the OS load average, the DDP transport and a V8 heap
// counter all the same kind of thing, with no way to jump to the part you came
// for. It is one table in five CATEGORIES now - Platform, OS, Meteor, Database,
// Node - each introduced by a bold row that spans both columns, over two equal
// 50% columns so every label and every value lines up down the whole pane.
//
// What this guards is what a reader cannot see is missing: a row added later to
// the wrong table, a heading quietly dropped, or a heading grown to the size of
// the pane title so five of them compete with "Version" above. Blaze templates
// are not renderable here, so this reads the .jade the way the other Admin Panel
// guards read their sources.
//
// Run: node tests/versionPaneCategories.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const jade = fs.readFileSync(
  path.join(repoRoot, 'client/components/settings/informationBody.jade'), 'utf8');
const css = fs.readFileSync(
  path.join(repoRoot, 'client/components/settings/informationBody.css'), 'utf8');
const en = JSON.parse(fs.readFileSync(
  path.join(repoRoot, 'imports/i18n/data/en.i18n.json'), 'utf8'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The category rows, in the order they appear in the file.
const headings = [...jade.matchAll(/^\s*tr\.info-category\n\s*th\(colspan="2"\) \{\{_ '([^']+)'\}\}$/gm)]
  .map(m => m[1]);
// Every `{{_ 'key'}}` used as a row label (a th), in order.
const rowKeys = [...jade.matchAll(/^\s*th \{\{_ '([^']+)'\}\}$/gm)].map(m => m[1]);

console.log('versionPaneCategories:');

test('the five categories are there, in the order the pane is read in', () => {
  // Order is not cosmetic: it is what somebody debugging goes through - what this
  // IS, what it runs ON, how it talks to the client, what stores the data, and
  // only then Node's own memory.
  assert.deepStrictEqual(headings, ['Platform', 'OS', 'Meteor', 'Database', 'Node']);
});

test('it is ONE table, and each category is a row spanning both columns', () => {
  // Five tables sized their columns independently, so the values started at a
  // different x in every group. One table, and the category is a row in it.
  const infoTables = jade.match(/^\s*table\.info-table$/gm) || [];
  assert.strictEqual(infoTables.length, 1, 'the pane draws exactly one information table');
  assert.ok(/^\s*table\.info-table$/m.test(jade),
    'and it carries the .info-table class the 50/50 columns are scoped to');

  // Each category row is a `th` spanning BOTH columns - not a label with an
  // empty cell beside it, which is what a plain th would leave.
  const rows = jade.match(/^\s*tr\.info-category$/gm) || [];
  assert.strictEqual(rows.length, headings.length,
    'every category is a tr.info-category');
  const spans = jade.match(/^\s*th\(colspan="2"\) \{\{_ '[^']+'\}\}$/gm) || [];
  assert.strictEqual(spans.length, headings.length,
    'and each of them spans both columns');
});

test('the two columns are declared 50/50, not left to the longest label', () => {
  // A colgroup plus table-layout:fixed is what makes the browser use these
  // widths instead of measuring the content of each cell.
  assert.ok(/^\s*colgroup\n\s*col\n\s*col$/m.test(jade),
    'the table declares a colgroup of two columns');
  assert.ok(/table\.info-table\s*\{[^}]*table-layout:\s*fixed/.test(css),
    '.info-table must be table-layout: fixed, or the colgroup widths are ignored');
  const colRule = css.slice(css.indexOf('table.info-table > colgroup > col'));
  assert.ok(/width:\s*50%/.test(colRule.slice(0, 200)),
    'and each column is 50%');
  // settingBody.css caps admin table headers at 240px; with the width stated
  // outright that cap has nothing to protect and would fight the 50%.
  assert.ok(/max-width:\s*none/.test(css),
    'the 240px header cap from settingBody.css is undone for this table');
});

test('every heading is a translated key that exists in English', () => {
  for (const key of headings) {
    assert.ok(Object.prototype.hasOwnProperty.call(en, key),
      `${key} must be a key in imports/i18n/data/en.i18n.json, not literal text`);
    assert.ok(String(en[key]).trim().length > 0, `${key} must have an English string`);
  }
});

test('the rows are under the category they belong to', () => {
  // The check that matters when somebody adds a row: it lands in the right table.
  // Only the rows whose category is not obvious from their key prefix are named
  // one by one; the prefixed ones are checked as families.
  const categoryOf = key => {
    const at = jade.indexOf(`th {{_ '${key}'}}`);
    assert.notStrictEqual(at, -1, `${key} is a row in the pane`);
    const before = jade.slice(0, at);
    const marks = [...before.matchAll(/th\(colspan="2"\) \{\{_ '([^']+)'\}\}/g)];
    return marks.length ? marks[marks.length - 1][1] : null;
  };

  assert.strictEqual(categoryOf('package'), 'Platform');
  assert.strictEqual(categoryOf('Meteor_version'), 'Meteor');
  // Reactivity and DDP are Meteor's, not the database's: they are how the client
  // is fed, and they were the two rows most often read as database settings.
  assert.strictEqual(categoryOf('Reactivity_mode'), 'Meteor');
  assert.strictEqual(categoryOf('Reactivity_order'), 'Meteor');
  assert.strictEqual(categoryOf('DDP_transport'), 'Meteor');
  // Whether an OpLog EXISTS is a property of the database, unlike the three above.
  assert.strictEqual(categoryOf('MongoDB_Oplog_enabled'), 'Database');
  assert.strictEqual(categoryOf('Database_type'), 'Database');
  assert.strictEqual(categoryOf('FerretDB_version'), 'Database');
  assert.strictEqual(categoryOf('Mongo_sessions_count'), 'Database');
  assert.strictEqual(categoryOf('Node_version'), 'Node');

  for (const key of rowKeys) {
    if (/^OS_/.test(key)) assert.strictEqual(categoryOf(key), 'OS', `${key} belongs to OS`);
    if (/^Node_heap_|^Node_memory_/.test(key)) {
      assert.strictEqual(categoryOf(key), 'Node', `${key} belongs to Node`);
    }
    if (/^MongoDB_|^FerretDB_|^Database_/.test(key)) {
      assert.strictEqual(categoryOf(key), 'Database', `${key} belongs to Database`);
    }
  }
});

test('no row was lost when the flat list became five categories', () => {
  // Every label the flat list had is still shown somewhere, plus the new one.
  const BEFORE = ['info', 'Meteor_version', 'Node_version', 'Database_type', 'MongoDB_version',
    'Database_commit', 'FerretDB_version', 'FerretDB_commit', 'MongoDB_storage_engine',
    'MongoDB_Oplog_enabled', 'Reactivity_mode', 'Reactivity_order', 'DDP_transport',
    'OS_Type', 'OS_Platform', 'OS_Arch', 'OS_Release', 'OS_Uptime', 'OS_Loadavg',
    'OS_Totalmem', 'OS_Freemem', 'OS_Cpus', 'Node_heap_total_heap_size',
    'Node_heap_total_heap_size_executable', 'Node_heap_total_physical_size',
    'Node_heap_total_available_size', 'Node_heap_used_heap_size', 'Node_heap_heap_size_limit',
    'Node_heap_malloced_memory', 'Node_heap_peak_malloced_memory', 'Node_heap_does_zap_garbage',
    'Node_heap_number_of_native_contexts', 'Node_heap_number_of_detached_contexts',
    'Node_memory_usage_rss', 'Node_memory_usage_heap_total', 'Node_memory_usage_heap_used',
    'Node_memory_usage_external', 'Mongo_sessions_count'];
  for (const key of BEFORE) {
    assert.ok(jade.includes(`{{_ '${key}'}}`), `${key} is still shown somewhere in the pane`);
  }
  assert.ok(rowKeys.includes('package'), 'and the packaging row was added');
});

test('the packaging row translates its LABEL and never its VALUE', () => {
  // bundle.zip, Snap, Docker and Sandstorm are the names of the things
  // themselves - a package format, a store, a product - not words describing
  // them. Translating them would give a reader reporting an issue, searching the
  // docs or grepping a log a different string per language for one identifier,
  // and there is nothing to gain in exchange: the four names are the same in
  // every language already.
  assert.ok(/th \{\{_ 'package'\}\}/.test(jade),
    "the label is the translated key 'package'");
  assert.ok(Object.prototype.hasOwnProperty.call(en, 'package'),
    "'package' must be a key in en.i18n.json");
  assert.strictEqual(en.package, 'Package', 'and its English string is Package');

  // The value is printed as it comes from the server: no {{_ ...}}, no helper
  // that could route it through a translation.
  assert.ok(/td \{\{statistics\.platform\.packaging\}\}/.test(jade),
    'the value is rendered raw, straight from statistics.platform.packaging');
  assert.ok(!/\{\{_ statistics\.platform\.packaging\}\}/.test(jade),
    'the value must never be passed through the translation helper');

  // And the four names are not translation keys at all - adding one would be the
  // first step towards translating them somewhere else later.
  const { PACKAGINGS } = require(path.join(repoRoot, 'models/lib/platformPackaging.js'));
  for (const name of PACKAGINGS) {
    assert.ok(!Object.prototype.hasOwnProperty.call(en, name),
      `${name} must NOT be an i18n key: it is an identifier, not UI text`);
  }
});

test('the category title is BOLD, and does not grow into a second pane title', () => {
  const at = css.indexOf('tr.info-category > th');
  assert.notStrictEqual(at, -1, 'the category row must be styled');
  const block = css.slice(at, css.indexOf('}', at));
  assert.ok(/font-weight:\s*(700|bold)/.test(block), 'the category title is bold');
  // `start`, not `left`: a th centres by default, and the label column is on the
  // RIGHT in Arabic and Hebrew (tests/rtl.test.js enforces the logical property).
  assert.ok(/text-align:\s*start/.test(block),
    'and start-aligned, so it sits over the label column in every writing direction');
  assert.ok(/color:\s*inherit/.test(block),
    'and inherits its colour, or it is unreadable on a dark theme');
  // It stays at the table's own size. Growing it to the pane title's size would
  // read as five pane titles with "Version" lost among them - so a font-size
  // here at all is the thing to notice.
  assert.ok(!/font-size:/.test(block),
    'it takes the table\'s font size; a size here would compete with the pane title');
});

console.log(`\nversionPaneCategories: ${passed} tests passed`);
