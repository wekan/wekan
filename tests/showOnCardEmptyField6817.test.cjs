'use strict';

// #6817 ("card setting not apply"): on v12.65 the reporter ticked Due in Board
// Settings / Card's Show on Card, opened a card without a due date, and saw no
// Due field. Show on Card says what a card CAN show; since v12.65 an opened
// card shows a field when it has data in it. What shows an EMPTY field is,
// since #6806: Card Settings / Card's "Show empty fields" (every field, every
// card), the "Show empty" column (one field, every card), or "+ Add" / On this
// card (one field, one card). This pins the reporter's board through each.
// Run: node tests/showOnCardEmptyField6817.test.cjs

const assert = require('assert');
const f = require('../models/lib/cardShownFields.js');
const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('showOnCardEmptyField6817:');

const dueFlag = CARD_SETTINGS_ROWS.find(r => r.key === 'dueDate').card.field;
const board = extra => ({ _id: 'b', [dueFlag]: true, ...extra });
const card = { _id: 'c', boardId: 'b' }; // no due date
const shows = (b, c = card) => f.isShown('dueDate', c, {}, b) && f.boardForCard(b, c, {})[dueFlag] === true;

test('the reporter\'s board: Show on Card ticked alone does not draw an empty Due', () => {
  assert.strictEqual(shows(board()), false);
  // ... and does once the card has a due date.
  assert.strictEqual(shows(board(), { ...card, dueAt: new Date() }), true);
});

test('each way to show it empty works', () => {
  assert.strictEqual(shows(board({ showEmptyCardFields: true })), true, 'Show empty fields');
  assert.strictEqual(shows(board({ cardFieldsAlwaysShown: ['dueDate'] })), true, 'Show empty for Due');
  assert.strictEqual(shows(board(), { ...card, shownFields: ['dueDate'] }), true, 'On this card');
});

test('negative: Show on Card off still wins over all three', () => {
  const off = { _id: 'b', [dueFlag]: false, showEmptyCardFields: true, cardFieldsAlwaysShown: ['dueDate'] };
  assert.strictEqual(f.boardForCard(off, { ...card, shownFields: ['dueDate'] }, {})[dueFlag], false);
});

console.log(`showOnCardEmptyField6817: ${passed} passed`);
