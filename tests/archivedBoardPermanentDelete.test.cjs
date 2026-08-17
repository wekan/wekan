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

test('Archive multi-selection shows one red Delete button behind both UI gates', () => {
  assert.ok(/if isArchiveSelection\n\s+if canPermanentlyDeleteArchivedBoards/.test(sidebar),
    'Delete belongs only to an Archive selection with permanent delete enabled');
  assert.ok(/button\.sidebar-btn\.negate\.wide\.js-delete-selected-boards/.test(sidebar),
    'the action is a red sidebar button');
  assert.ok(/user && user\.isAdmin/.test(sidebarJs)
    && /setting && setting\.enablePermanentDelete/.test(sidebarJs),
  'the client offers it only to a Global Admin while the setting is enabled');
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
  assert.ok(/!ids\.length \|\| ids\.length > 200/.test(body), 'the batch is bounded');
  assert.ok(/!user \|\| !user\.isAdmin \|\| !getFeatureFlags\(\)\.enablePermanentDelete/.test(body),
    'a forged call cannot bypass either authorization gate');
  assert.ok(/boards\.some\(board => !board\.archived\)/.test(body),
    'a live board cannot be permanently deleted through this method');
  assert.ok(body.indexOf('boards.some') < body.indexOf('Boards.removeAsync'),
    'the whole selection is validated before deletion starts');
});

console.log(`\narchivedBoardPermanentDelete: ${passed} tests passed`);
