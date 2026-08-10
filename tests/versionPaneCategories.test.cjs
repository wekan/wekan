'use strict';

// Admin Panel / Settings / Version was ONE table of ~40 rows: the WeKan version,
// the OS load average, the DDP transport and a V8 heap counter all in the same
// flat list, read top to bottom, with no way to jump to the part you came for.
// It is five tables now - Platform, OS, Meteor, Database, Node - each under a
// small heading.
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

// The headings, in the order they appear in the file.
const headings = [...jade.matchAll(/^\s*h3\.info-category \{\{_ '([^']+)'\}\}$/gm)].map(m => m[1]);
// Every `{{_ 'key'}}` used as a row label (a th), in order.
const rowKeys = [...jade.matchAll(/^\s*th \{\{_ '([^']+)'\}\}$/gm)].map(m => m[1]);

console.log('versionPaneCategories:');

test('the five categories are there, in the order the pane is read in', () => {
  // Order is not cosmetic: it is what somebody debugging goes through - what this
  // IS, what it runs ON, how it talks to the client, what stores the data, and
  // only then Node's own memory.
  assert.deepStrictEqual(headings, ['Platform', 'OS', 'Meteor', 'Database', 'Node']);
});

test('each category has its own table, so a row cannot drift between them', () => {
  // One `table` per heading, and the first thing after each heading.
  const blocks = jade.split(/^\s*h3\.info-category /m).slice(1);
  assert.strictEqual(blocks.length, headings.length, 'one block per heading');
  for (const [i, block] of blocks.entries()) {
    assert.ok(/^\s*\{\{_ '[^']+'\}\}\n\s*table\n/.test(block),
      `${headings[i]} must be followed directly by its own table`);
    assert.strictEqual((block.match(/^\s{4}table$/gm) || []).length, 1,
      `${headings[i]} has exactly one table`);
  }
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
    const marks = [...before.matchAll(/h3\.info-category \{\{_ '([^']+)'\}\}/g)];
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

test('no row was lost when the one table became five', () => {
  // Every label the flat table had is still shown somewhere, plus the new one.
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

test('the category heading is SMALLER than the pane title above it', () => {
  // Five headings at the pane title's size read as five pane titles, and
  // "Version" is lost among them. An unstyled h3 is larger still, which is what
  // this class exists to prevent.
  const settingBody = fs.readFileSync(
    path.join(repoRoot, 'client/components/settings/settingBody.css'), 'utf8');
  const sizeOf = (text, selector) => {
    const at = text.indexOf(`${selector} {`);
    assert.notStrictEqual(at, -1, `${selector} must be styled`);
    const block = text.slice(at, text.indexOf('}', at));
    const m = block.match(/font-size:\s*([\d.]+)rem/);
    assert.ok(m, `${selector} must set font-size in rem, so it follows the browser's font size`);
    return parseFloat(m[1]);
  };
  const category = sizeOf(css, '.info-category');
  const paneTitle = sizeOf(settingBody, '.admin-pane-title');
  assert.ok(category < paneTitle,
    `.info-category (${category}rem) must be smaller than .admin-pane-title (${paneTitle}rem)`);
  assert.ok(/color:\s*inherit/.test(css.slice(css.indexOf('.info-category {'))),
    'and inherit its colour, or it is unreadable on a dark theme');
});

console.log(`\nversionPaneCategories: ${passed} tests passed`);
