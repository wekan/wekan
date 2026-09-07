'use strict';

// Board Archive deletes only through an explicit, bulk permanent-delete action.
// Run: node tests/archivedBoardPermanentDelete.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const legacyJade = read('client/components/boards/boardArchive.jade');
const legacyJs = read('client/components/boards/boardArchive.js');
const sidebar = read('client/components/boards/allBoardsSidebar.jade');
const sidebarJs = read('client/components/boards/allBoardsSidebar.js');
const allBoardsJade = read('client/components/boards/boardsList.jade');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const server = read('server/models/boards.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('archivedBoardPermanentDelete:');

test('board rows have no trashcan or per-board delete action (negative)', () => {
  assert.ok(!/js-delete-board|fa-trash|delete-board/.test(legacyJade),
    'the legacy archive rows must not offer permanent deletion');
  assert.ok(!/js-delete-board|Boards\.removeAsync\(this\._id\)/.test(legacyJs),
    'and no old client-side row deletion handler remains');
});

test('archived board tiles have no lower-left archive action icon', () => {
  const archivedMetadata =
    /if isSelectedMenu 'archive'\s+p\.board-list-item-archived-at([\s\S]*?)(?=\n\s+if |\n\s+(?:span|a)\.)/g;
  const blocks = [...allBoardsJade.matchAll(archivedMetadata)].map(match => match[1]);

  assert.strictEqual(blocks.length, 2, 'both board tile variants show archived metadata');
  for (const block of blocks) {
    assert.ok(!/fa-archive/.test(block), 'archived metadata must not look like an action');
    assert.ok(/'archived-at'/.test(block), 'the useful archived date label remains');
  }
});

test('Archive multi-selection shows one red Delete button behind both UI gates', () => {
  assert.ok(/if isArchiveSelection\n\s+if canPermanentlyDeleteArchivedBoards/.test(sidebar),
    'Delete belongs only to an Archive selection with permanent delete enabled');
  assert.ok(/button\.sidebar-btn\.negate\.wide\.js-delete-selected-boards/.test(sidebar),
    'the action is a red sidebar button');
  assert.ok(/user\?\.isAdmin === true/.test(sidebarJs)
    && /setting && setting\.enablePermanentDelete/.test(sidebarJs),
  'the client requires the site-wide Boolean Global Admin flag and the setting');
});

test('disabled permanent delete replaces the selection hint and Delete button', () => {
  assert.match(
    sidebar,
    /if isArchiveSelection\n\s+if canPermanentlyDeleteArchivedBoards\n\s+p[^\n]*multi-selection-active[\s\S]*?js-delete-selected-boards[\s\S]*?\n\s+else\n\s+p[^\n]*archive-permanent-delete-disabled-hint/,
    'Archive has distinct enabled and disabled content',
  );
  assert.match(
    sidebar,
    /\n    else\n      p\.sidebar-multiselection-hint \{\{_ 'archive-permanent-delete-disabled-hint'\}\}\n  else\n/,
    'the disabled branch contains only its explanation before the non-Archive branch',
  );
  assert.strictEqual(
    en['archive-permanent-delete-disabled-hint'],
    'If at Admin Panel / Problems / Delete is checked Enable permanent delete for Global Admin then here will become visible button for Delete.',
  );
});

test('the client confirms, calls one bulk method, and clears only on success', () => {
  const at = sidebarJs.indexOf("'click .js-delete-selected-boards'");
  const body = sidebarJs.slice(at, sidebarJs.indexOf('\n  },', at));
  assert.ok(/confirm\(TAPi18n\.__\('delete-board-confirm-popup'\)\)/.test(body),
    'the existing permanent board-delete warning is shown');
  assert.ok(/Meteor\.call\('permanentlyDeleteArchivedBoards', ids/.test(body),
    'one server method receives the whole selection');
  assert.ok(body.indexOf('if (err)') < body.indexOf('BoardMultiSelection.reset()'),
    'a refused delete keeps the selection so it can be retried');
});

test('the server independently enforces admin, flag, archive and bounded input', () => {
  const at = server.indexOf('async permanentlyDeleteArchivedBoards(boardIds) {');
  assert.notStrictEqual(at, -1, 'the method exists');
  const body = server.slice(at, server.indexOf('\n  },', at));
  assert.ok(/check\(boardIds, \[String\]\)/.test(body), 'ids have a shape');
  assert.ok(body.indexOf('check(boardIds, [String])') < body.indexOf('await ReactiveCache.getUser'),
    'Meteor audits the argument before the first asynchronous boundary');
  assert.ok(/!ids\.length \|\| ids\.length > 200/.test(body), 'the batch is bounded');
  assert.ok(/user\?\.isAdmin !== true \|\| !getFeatureFlags\(\)\.enablePermanentDelete/.test(body),
    'a forged call, board admin, or truthy non-Boolean flag cannot bypass either gate');
  assert.ok(/foundBoards\.some\(board => !board\.archived\)/.test(body),
    'a live board cannot be permanently deleted through this method');
  assert.ok(body.indexOf('foundBoards.some') < body.indexOf('Boards.removeAsync'),
    'the whole selection is validated before deletion starts');
});

console.log(`\narchivedBoardPermanentDelete: ${passed} tests passed`);
