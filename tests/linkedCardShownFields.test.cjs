'use strict';

// Found by the #1946/#6613 browser test: an opened card showed the fields it
// had data in, but a LINKED card keeps its data on its source card - members,
// labels, dates, custom fields, checklists - and the decision read the linked
// card's own, empty document, so a linked card hid every field its source has.
//
// Deliberate change (2026-10-28): an opened card no longer decides by its data
// at all - every card shows every field its board shows on cards, empty or not
// (docs/Features/Cards/Card-Fields.md). So the whole class of fault is gone: a
// linked card and its source see the very same board view, whatever either
// document holds. This suite pins that, and that the data-reading helpers
// (shownFieldsOf, cardFieldCounts) that could get it wrong are gone.
// Run: node tests/linkedCardShownFields.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const f = require('../models/lib/cardShownFields.js');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('linkedCardShownFields:');

const board = { _id: 'b1', allowsMembers: true, allowsLabels: true, allowsChecklists: true };

test('a linked card shows what its board shows, like any card', () => {
  const view = f.boardForCard(board);
  for (const key of ['members', 'labels', 'checklists']) assert.ok(f.boardAllows(view, key), key);
});

test('negative: no decision reads a card\'s data any more', () => {
  const src = read('client/components/cards/cardAddFields.js');
  for (const gone of ['shownFieldsOf', 'cardFieldCounts', 'getRealCard', 'cardShowsField']) {
    assert.ok(!src.includes(gone), `cardAddFields.js: ${gone}`);
  }
  assert.match(src, /export function cardBoardView\(data\) \{[^\n]*\n\s+return f\.boardForCard\(Utils\.getCurrentBoard\(\)\);/);
  const sidebar = read('client/components/sidebar/sidebar.js');
  assert.ok(!/shownFieldsOf|cardFieldCounts/.test(sidebar), 'sidebar.js');
});

console.log(`linkedCardShownFields: ${passed} passed`);
