'use strict';

// Regression coverage for #6608: selected cards are archived by one awaited,
// server-authoritative operation instead of fire-and-forget client updates.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const client = read('client/components/sidebar/sidebarFilters.js');
const server = read('server/models/cards.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardMultiSelectionArchive:');

test('the client sends the complete selection to one awaited method', () => {
  const at = client.indexOf("async 'click .js-archive-selection'");
  const body = client.slice(at, client.indexOf('\n  },', at));
  assert.ok(at >= 0, 'archive handler exists and is async');
  assert.match(body, /getSelectedCardsSorted\(\)/);
  assert.match(body, /await Meteor\.callAsync\(\s*'archiveSelectedCards'/);
  assert.ok(body.indexOf("await Meteor.callAsync(")
    < body.indexOf("EscapeActions.executeUpTo('multiselection')"),
  'selection closes only after the server confirms success');
});

test('NEGATIVE — a failed archive stays selected and reports its error', () => {
  const at = client.indexOf("async 'click .js-archive-selection'");
  const body = client.slice(at, client.indexOf('\n  },', at));
  const catchAt = body.indexOf('catch (error)');
  assert.ok(catchAt >= 0, 'failure is handled');
  assert.match(body.slice(catchAt), /alert\(error\.reason \|\| error\.message/);
  assert.doesNotMatch(body.slice(catchAt), /EscapeActions\.executeUpTo/);
  assert.doesNotMatch(body, /mutateSelectedCards\('archive'\)/);
});

test('the server checks arguments before async work and scopes cards to the board', () => {
  const at = server.indexOf('async archiveSelectedCards(boardId, cardIds)');
  const body = server.slice(at, server.indexOf('\n  },', at));
  assert.ok(at >= 0, 'bulk archive method exists');
  assert.ok(body.indexOf('check(boardId, String)') < body.indexOf('await '));
  assert.ok(body.indexOf('check(cardIds, [String])') < body.indexOf('await '));
  assert.match(body, /!ids\.length \|\| ids\.length > 5000/);
  assert.match(body, /allowIsBoardMemberWithWriteAccess\(this\.userId, board\)/);
  assert.match(body, /_id: \{ \$in: ids \}[\s\S]*boardId,[\s\S]*archived: false/);
});

test('NEGATIVE — every card is validated before the first archive', () => {
  const at = server.indexOf('async archiveSelectedCards(boardId, cardIds)');
  const body = server.slice(at, server.indexOf('\n  },', at));
  assert.ok(body.indexOf('cards.length !== ids.length') < body.indexOf('.archive()'));
  assert.match(body, /throw new Meteor\.Error\('invalid-card-selection'\)/);
});

console.log(`\n${passed} tests passed`);
