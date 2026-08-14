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

test('the popup says "Import board", and nothing more', () => {
  // It read "Import board (Trello, Jira, WeKan export, CSV, Excel, ...)" - the
  // whole list of sources, in a menu row, above a page that asks which source
  // it is and lists every one of them with room to. Naming them twice makes the
  // menu the thing to read and the page the thing to confirm.
  const sidebar = read('client/components/sidebar/sidebar.jade');
  const popup = sidebar.slice(sidebar.indexOf('template(name="chooseBoardSourcePopup")'),
    sidebar.indexOf('template(name="importDependenciesPopup")'));
  assert.ok(/\{\{_ 'import-board-c'\}\}/.test(popup), 'the row is "Import board"');
  assert.ok(!/import-board-source/.test(popup), 'not the list of sources');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en['import-board-c'], 'Import board');
});

test('both lists are the app\'s own green checkbox', () => {
  // The same `.materialCheckBox` Admin Panel / Announcement uses, rather than a
  // tick icon that is always drawn and only sometimes meant.
  const jade = read('client/components/import/import.jade');
  const sources = jade.slice(jade.indexOf('ul.import-source-list'), jade.indexOf('if hasImportSource'));
  assert.ok(/a\.flex\.js-select-import-source/.test(sources), 'a checkbox row');
  assert.ok(/\.materialCheckBox\(class="\{\{#if selected\}\}is-checked\{\{\/if\}\}"\)/.test(sources),
    'ticked when it is the chosen source');
  const parts = jade.slice(jade.indexOf('ul.import-part-list'));
  assert.ok(/\.materialCheckBox\(class="\{\{#if checked\}\}is-checked\{\{\/if\}\}"\)/
    .test(parts.slice(0, 400)), 'and the parts the same');
  assert.ok(!/i\.fa\.fa-check/.test(sources + parts.slice(0, 400)),
    'no icon pretending to be a checkbox');
});

test('no source to begin with, and choosing one un-chooses the last (negative)', () => {
  // An import reads ONE file in one format, so this is a radio wearing the
  // app's checkbox - and the URL is what holds the answer, so there is only
  // ever one.
  const router = read('config/router.js');
  assert.ok(/Session\.set\('importSource', null\);/.test(router),
    '/import starts with nothing chosen');
  assert.ok(/Session\.set\('importSource', params\.source\);/.test(router),
    'and /import/<source> is what chooses one');
  const js = read('client/components/import/import.js');
  const handler = js.slice(js.indexOf("'click .js-select-import-source'"));
  assert.ok(/FlowRouter\.go\(`\/import\/\$\{source\}`\)/.test(handler.slice(0, 400)),
    'clicking a source goes there, so the previous one cannot stay chosen');
  const helper = js.slice(js.indexOf('importSources() {'));
  assert.ok(/selected: source\.key === current/.test(helper.slice(0, 600)),
    'and exactly one row is ticked');
});

test('the parts start ticked, all of them (negative)', () => {
  // "What to include" starts as everything: an import that silently left parts
  // out would be worse than one that asks.
  const scope = read('client/components/boards/exportScope.js');
  assert.ok(/BOARD_EXPORT_FIELDS\.forEach\(\(\{ field \}\) => selection\.set\(field, true\)\)/.test(scope),
    'every part is on to begin with');
  const js = read('client/components/import/import.js');
  assert.ok(/checked: importSelection\.get\(field\)/.test(js),
    'and the page draws that same selection');
});

test('the two questions sit side by side when there is room', () => {
  const jade = read('client/components/import/import.jade');
  assert.ok(/\.import-columns/.test(jade), 'they share a container');
  assert.ok(jade.indexOf('.import-sources') < jade.indexOf('.import-parts'),
    'the source first, which is the question that comes first');
  const css = read('client/components/import/import.css');
  const rule = css.slice(css.indexOf('.import-page .import-columns {'));
  const body = rule.slice(0, rule.indexOf('}'));
  assert.ok(/grid-template-columns: repeat\(auto-fit, minmax\(280px, 1fr\)\)/.test(body),
    'two columns when the page is wide, one when it is not');
  assert.ok(/align-items: start/.test(body), 'and a short column does not stretch');
});

test('a row is the Announcement row, and nothing on top of it', () => {
  // The Admin Panel's Announcement toggle is `a.flex > .materialCheckBox +
  // span` with no CSS of its own, and that is the whole style: the tick's
  // rotate and its negative offsets are written for the plain flow `.flex`
  // gives it. An `align-items: center` or a `gap` on the row fights them and
  // the tick lands on the first word of the label, which is what this page did.
  const jade = read('client/components/import/import.jade');
  assert.ok(/a\.flex\.js-select-import-source[\s\S]{0,200}\.materialCheckBox/.test(jade),
    'the source row is that row');
  assert.ok(/a\.flex\.js-import-part-toggle[\s\S]{0,200}\.materialCheckBox/.test(jade),
    'and so is the part row');
  const css = read('client/components/import/import.css');
  const rows = css.slice(css.indexOf('.import-page .import-source-list a.flex,'));
  const body = rows.slice(0, rows.indexOf('}'));
  assert.ok(!/align-items|gap:|flex: 0 0/.test(body),
    'and the row itself moves nothing');
});

test('there is a space between the box and its label, ticked or not', () => {
  const css = read('client/components/import/import.css');
  const plain = css.slice(css.indexOf('.import-page .import-source-list a.flex .materialCheckBox,'));
  assert.ok(/margin-inline-end: 8px/.test(plain.slice(0, plain.indexOf('}'))),
    'an unchecked box no longer touches its text');
  const checked = css.slice(css.indexOf('.materialCheckBox.is-checked,'));
  assert.ok(/margin-inline-end: 17px/.test(checked.slice(0, checked.indexOf('}'))),
    'and the tick, which is a narrower shape shifted left, keeps the label in the same place');
  assert.ok(/margin-inline-end/.test(css) && !/margin-right/.test(css),
    'logical, so right-to-left languages get the space on their side');
});

test('both import buttons look like the import they do', () => {
  // "Import without mapping members (map later)" is an import, not a cancel:
  // it was the only unstyled button on the page, which read as disabled.
  const jade = read('client/components/import/import.jade');
  for (const cls of ['js-import-without-mapping', 'js-import-skip-mapping']) {
    const line = jade.split('\n').find(l => l.includes(cls));
    assert.ok(line, `${cls} is still there`);
    assert.ok(/button\.primary\.wide/.test(line), `${cls} is a primary button, like Import beside it`);
  }
  assert.ok(/input\.primary\.wide\(type="submit" value="\{\{_ 'import'\}\}"\)/.test(jade),
    'which is what Import is');
});

console.log(`\nimportPage: ${passed} tests passed`);
