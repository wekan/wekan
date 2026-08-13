'use strict';

// One import page, for every source.
// Run: node tests/importPage.test.cjs
//
// wekan/wekan#1173 asked for the import options to be one template. They were
// fourteen: a link per source in a pop-over, each going to its own address, and
// the page it landed on never said which other sources existed - so "where do I
// import a Jira export" was answered by a menu somewhere else, if you knew it
// was there.
//
// The page picks the source itself now, offers the SAME "what to include"
// checkboxes every export offers, and keeps `/import/:source` working so every
// existing link, bookmark and back button still lands where it did.
//
// The parts selection is honest about how it works: rather than teaching five
// creators (WeKan, Trello, Jira, CSV, Kanboard) a selection each, the unticked
// parts are taken OUT of the parsed document before any creator sees it. A
// creator that never sees a comment cannot import one.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const importJs = read('client/components/import/import.js');
const importJade = read('client/components/import/import.jade');
const sidebarJade = read('client/components/sidebar/sidebar.jade');
const router = read('config/router.js');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const { pruneImportDocument, PART_ARRAYS } = require('../models/lib/importParts.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('importPage:');

// ── one page ────────────────────────────────────────────────────────────────

test('the page lists every source it can read', () => {
  const list = importJs.slice(importJs.indexOf('const IMPORT_SOURCES'),
    importJs.indexOf('];', importJs.indexOf('const IMPORT_SOURCES')));
  for (const source of ['wekan', 'trello', 'csv', 'excel', 'jira', 'kanboard',
    'deck', 'openproject', 'github', 'gitlab', 'gitea', 'forgejo', 'asana', 'zenkit']) {
    assert.ok(new RegExp(`key: '${source}'`).test(list), `${source} is offered`);
  }
  assert.ok(/js-select-import-source/.test(importJade), 'and the page can pick one');
});

test('the WeKan entry is named after the Product name of this instance', () => {
  // A rebranded WeKan should offer "a previous export of <its own name>", not of
  // a product the person has never seen.
  assert.ok(/productNameOrDefault/.test(importJs), 'the setting is read');
  assert.ok(/product: true/.test(importJs), 'and the entry is marked as the branded one');
});

test('the fourteen per-source links are gone from the pop-over', () => {
  const popup = sidebarJade.slice(sidebarJade.indexOf('template(name="chooseBoardSourcePopup")'),
    sidebarJade.indexOf('template(name="importDependenciesPopup")'));
  for (const source of ['trello', 'jira', 'kanboard', 'zenkit']) {
    assert.ok(!new RegExp(`/import/${source}`).test(popup),
      `${source} is not a link of its own any more`);
  }
  assert.ok(/pathFor '\/import'/.test(popup), 'one entry, to the page');
  // The one import that is NOT a board stays where it was.
  assert.ok(/js-import-dependencies/.test(popup), 'card dependencies is still offered');
});

test('every old address still works (negative)', () => {
  // /import/trello is in READMEs, in issues and in people's bookmarks.
  assert.ok(/FlowRouter\.route\('\/import\/:source'/.test(router),
    'the per-source route is still there');
  assert.ok(/FlowRouter\.route\('\/import'/.test(router),
    'and the page has an address of its own now');
  assert.ok(/name: 'import-start'/.test(router),
    'under a different route name, so neither shadows the other');
});

// ── one selection ───────────────────────────────────────────────────────────

test('the page uses the SAME selection the exports use', () => {
  assert.ok(/from '\/client\/components\/boards\/exportScope'/.test(importJs),
    'the selection is imported, not a second copy');
  assert.ok(/BOARD_EXPORT_FIELDS/.test(importJs), 'and so is the list of parts');
  assert.ok(/export-select-what-to-include/.test(importJade),
    'under the same heading the export popups use');
});

test('unticked parts are removed before any creator sees them', () => {
  const doc = {
    cards: [{ _id: 'c1' }],
    comments: [{ text: 'hi' }],
    checklists: [{ _id: 'l1' }],
    checklistItems: [{ _id: 'i1' }],
    attachments: [{ _id: 'a1' }],
    activities: [{ _id: 'v1' }],
  };
  const pruned = pruneImportDocument(doc, ['cards', 'checklists']);
  assert.deepStrictEqual(pruned.comments, [], 'comments were not asked for');
  assert.deepStrictEqual(pruned.attachments, [], 'nor attachments');
  assert.deepStrictEqual(pruned.activities, [], 'nor activities');
  assert.strictEqual(pruned.checklists.length, 1, 'checklists were');
  assert.strictEqual(pruned.checklistItems.length, 1, 'with their items');
  assert.strictEqual(pruned.cards.length, 1, 'and the cards are never touched');
});

test('an unselected section is EMPTIED, not deleted (negative)', () => {
  // The creators read board.comments directly; undefined is a crash where an
  // empty array is "there were none".
  const pruned = pruneImportDocument({ comments: [{ text: 'x' }] }, ['cards']);
  assert.ok(Array.isArray(pruned.comments), 'the key is still an array');
});

test('no selection means everything, as everywhere else', () => {
  const doc = { comments: [{ text: 'x' }] };
  assert.strictEqual(pruneImportDocument(doc, []).comments.length, 1, 'empty selection');
  assert.strictEqual(pruneImportDocument(doc, null).comments.length, 1, 'no selection');
  assert.strictEqual(pruneImportDocument(null, ['cards']), null, 'and no document is no crash');
});

test('a source\'s own name for a part is pruned too', () => {
  // Trello calls its comments "actions"; the pruning happens after parsing and
  // before creation, which is the one point every source passes through.
  assert.ok(PART_ARRAYS.comments.includes('actions'), 'Trello actions count as comments');
  const pruned = pruneImportDocument({ actions: [{ type: 'commentCard' }] }, ['cards']);
  assert.deepStrictEqual(pruned.actions, [], 'and are removed with them');
});

test('an unknown key is left alone (negative)', () => {
  // A document has more in it than the parts this list knows about, and pruning
  // something nobody asked about would silently drop data.
  const pruned = pruneImportDocument({ somethingElse: [1, 2, 3] }, ['cards']);
  assert.deepStrictEqual(pruned.somethingElse, [1, 2, 3]);
});

test('the strings it needs exist in English', () => {
  for (const key of ['import-source-heading', 'import-parts-instruction',
    'import-board-source', 'export-select-what-to-include']) {
    assert.ok(en[key], `${key} is translatable`);
  }
});

console.log(`\nimportPage: ${passed} tests passed`);
