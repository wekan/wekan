'use strict';

// #6817 ("card setting not apply"): on v12.65 the reporter ticked Due in Board
// Settings / Card's Show on Card, opened a card without a due date, and saw no
// Due field - an opened card then showed a field only when it had data in it,
// and an empty one only through "Show empty fields", "Show empty" or "On this
// card".
//
// Deliberate change (2026-10-28): those three are gone and empty fields are
// ALWAYS shown, so the reporter's expectation is now simply the rule: Show on
// Card ticked draws Due on every card, empty or not. This suite used to pin
// each of the three ways; it now pins the reporter's board directly, and that
// Show on Card off still hides it.
// Run: node tests/showOnCardEmptyField6817.test.cjs

const assert = require('assert');
const f = require('../models/lib/cardShownFields.js');
const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('showOnCardEmptyField6817:');

const dueFlag = CARD_SETTINGS_ROWS.find(r => r.key === 'dueDate').card.field;
const shows = b => f.boardForCard(b)[dueFlag] === true && f.boardAllows(f.boardForCard(b), 'dueDate');

test('the reporter\'s board: Show on Card ticked draws an empty Due on every card', () => {
  assert.strictEqual(shows({ _id: 'b', [dueFlag]: true }), true);
});

test('negative: Show on Card off still hides it, whatever the legacy settings say', () => {
  assert.strictEqual(shows({ _id: 'b', [dueFlag]: false, showEmptyCardFields: true, cardFieldsAlwaysShown: ['dueDate'] }), false);
});

test('negative: the Date section hidden whole on Show on Card hides it too', () => {
  assert.strictEqual(shows({ _id: 'b', [dueFlag]: true, cardSettingsHiddenOnCard: ['date'] }), false);
});

console.log(`showOnCardEmptyField6817: ${passed} passed`);
