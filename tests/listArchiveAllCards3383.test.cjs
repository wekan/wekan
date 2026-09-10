'use strict';

// Regression coverage for #3383 ("Move all to archive" - a one-click way to
// archive every card of a list, instead of moving them one at a time or
// having to open the checkbox multi-select sidebar first).
//
// The feature is deliberately NOT a new mutation: the List hamburger menu's
// "Archive all cards in this list" entry builds the list's own card-id list
// (scoped exactly like the existing "Select all cards in this list" entry
// right above it) and hands it to the SAME `archiveSelectedCards` server
// method the checkbox multi-select sidebar's "Archive selection" button
// already calls (see tests/cardMultiSelectionArchive.test.cjs) - confirmed
// first through a popup, the same shape as the existing "Archive list" (the
// list itself) confirmation.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const jade = read('client/components/lists/listHeader.jade');
const client = read('client/components/lists/listHeader.js');
const server = read('server/models/cards.js');
const en = read('imports/i18n/data/en.i18n.json');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('listArchiveAllCards3383:');

test('the List menu offers an "Archive all cards in this list" entry beside "Select all cards"', () => {
  const menuAt = jade.indexOf('a.js-select-cards');
  assert.ok(menuAt >= 0, 'select-cards entry exists');
  const nearby = jade.slice(menuAt, menuAt + 400);
  assert.match(nearby, /a\.js-archive-list-cards/);
  assert.match(nearby, /\{\{_ 'list-archive-cards'\}\}/);
});

test('a confirmation popup exists, reusing the "archive" button label', () => {
  const at = jade.indexOf('template(name="listArchiveCardsPopup")');
  assert.ok(at >= 0, 'listArchiveCardsPopup template exists');
  const body = jade.slice(at, jade.indexOf('\ntemplate(', at + 1));
  assert.match(body, /\{\{_ "list-archive-cards-pop"\}\}/);
  assert.match(body, /js-confirm\.negate\.full\(type="submit"\) \{\{_ 'archive'\}\}/);
});

test('the click handler is gated behind Popup.afterConfirm, like "Archive list"', () => {
  const at = client.indexOf("'click .js-archive-list-cards'");
  assert.ok(at >= 0, 'handler exists');
  const body = client.slice(at, client.indexOf('\n  ),', at) + 5);
  assert.match(body, /Popup\.afterConfirm\(\s*'listArchiveCards'/);
});

test('the handler scopes card ids exactly like "Select all cards" (current swimlane in Swimlanes view, else the whole list) and reuses the shared server method', () => {
  const at = client.indexOf("'click .js-archive-list-cards'");
  const body = client.slice(at, client.indexOf('\n  ),', at) + 5);
  assert.match(body, /Utils\.boardView\(\) === 'board-view-swimlanes' && this\.swimlaneId/);
  assert.match(body, /this\.allCards\(swimlaneId\)\.map\(card => card\._id\)/);
  assert.match(body, /Meteor\.callAsync\(\s*'archiveSelectedCards',\s*Session\.get\('currentBoard'\),\s*cardIds,?\s*\)/);
});

test('NEGATIVE — an empty list does not call the server method', () => {
  const at = client.indexOf("'click .js-archive-list-cards'");
  const body = client.slice(at, client.indexOf('\n  ),', at) + 5);
  const guardAt = body.indexOf('if (!cardIds.length) return;');
  assert.ok(guardAt >= 0, 'guard exists');
  assert.ok(guardAt < body.indexOf("Meteor.callAsync"),
    'the empty-selection guard runs before the server call');
});

test('NEGATIVE — no second/duplicate bulk-archive mutation was written; the server method stays the single shared one', () => {
  const matches = server.match(/archiveSelectedCards\s*\(/g) || [];
  assert.strictEqual(matches.length, 1,
    'exactly one archiveSelectedCards method definition - the list menu calls the existing one, it does not define its own');
  // And the handler itself defines no bespoke Cards.update/.archive() loop -
  // it only ever calls the shared Meteor method.
  const at = client.indexOf("'click .js-archive-list-cards'");
  const body = client.slice(at, client.indexOf('\n  ),', at) + 5);
  assert.doesNotMatch(body, /\.archive\(\)/);
  assert.doesNotMatch(body, /Cards\.update/);
});

test('the "list-archive-cards" / "list-archive-cards-pop" translations already exist in every locale file (added ahead of the UI, now wired up)', () => {
  const dataDir = path.join(root, 'imports/i18n/data');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.i18n.json'));
  assert.ok(files.length > 200, 'sanity: the locale directory is populated');
  const missing = [];
  for (const f of files) {
    const contents = read(path.join('imports/i18n/data', f));
    if (!/"list-archive-cards":/.test(contents) || !/"list-archive-cards-pop":/.test(contents)) {
      missing.push(f);
    }
  }
  assert.deepStrictEqual(missing, [], `every locale must already carry both keys, missing in: ${missing.join(', ')}`);
});

test('the English source reads as an action on the LIST\'s cards, not a placeholder', () => {
  assert.match(en, /"list-archive-cards":\s*"[^"]*[Aa]rchive[^"]*"/);
});

console.log(`\n${passed} tests passed`);
