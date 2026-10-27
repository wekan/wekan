'use strict';

// Found by the #1946/#6613 browser test: an opened card shows the fields it
// has data in (docs/Features/Cards/Card-Fields.md), but a LINKED card keeps
// its data on its source card - members, labels, dates, custom fields,
// checklists - and the decision read the linked card's own, empty document,
// so a linked card hid every field its source has. The data now comes from
// the source card, the per-card choices (On this card) from the card opened.
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

const src = read('client/components/cards/cardAddFields.js');
const fn = src.slice(src.indexOf('export function shownFieldsOf(card) {'), src.indexOf('\n}\n', src.indexOf('export function shownFieldsOf(card) {')) + 2)
  .replace('export function', 'function');
const countsSeen = [];
const shownFieldsOf = new Function('cardFieldCounts', `${fn}\nreturn shownFieldsOf;`)(card => { countsSeen.push(card._id); return { checklists: card._id === 'source' ? 2 : 0 }; });

const source = { _id: 'source', boardId: 'b2', members: ['u2'], labelIds: ['l1'] };
const linked = { _id: 'link', boardId: 'b1', type: 'cardType-linkedCard', linkedId: 'source', members: [], labelIds: [], hiddenFields: ['labels'], getRealCard: () => source };

test('a linked card shows its source\'s fields, and keeps its own choices', () => {
  const { card, counts } = shownFieldsOf(linked);
  assert.deepStrictEqual(card.members, ['u2']);
  assert.strictEqual(f.isShown('members', card, counts), true, 'the source\'s members');
  assert.strictEqual(f.isShown('checklists', card, counts), true, 'the source\'s checklists, counted on the source');
  assert.strictEqual(f.isShown('labels', card, counts), false, 'hidden on THIS card by its own choice');
  assert.deepStrictEqual(countsSeen.slice(-1), ['source']);
});

test('negative: an ordinary card is itself; a missing source falls back to the card', () => {
  const plain = { _id: 'p', members: [], getRealCard() { return this; } };
  assert.strictEqual(shownFieldsOf(plain).card, plain);
  assert.strictEqual(f.isShown('members', shownFieldsOf(plain).card, {}), false);
  const orphan = { ...linked, getRealCard: () => null };
  assert.strictEqual(shownFieldsOf(orphan).card, orphan);
  assert.deepStrictEqual(shownFieldsOf(null), { card: null, counts: {} });
});

test('every decision of what a card shows goes through it', () => {
  assert.match(src, /const view = shownFieldsOf\(card\);\n\s+return f\.boardForCard\(board, view\.card, view\.counts\);/);
  assert.match(src, /const view = shownFieldsOf\(card\);\n\s+return f\.isShown\(key, view\.card, view\.counts, Utils\.getCurrentBoard\(\)\);/);
  const sidebar = read('client/components/sidebar/sidebar.js');
  assert.match(sidebar, /const \{ card: thisCard, counts \} = shownFieldsOf\(settingsCard\(\)\);/);
  assert.strictEqual((sidebar.match(/const \{ card: view, counts \} = shownFieldsOf\(card\);/g) || []).length, 2);
  // Negative: nothing asks with a card's own counts any more.
  assert.ok(!/cardFieldCounts\(/.test(sidebar), 'sidebar.js');
  assert.ok(!/f\.(isShown|boardForCard)\([^)]*cardFieldCounts\(card\)/.test(src), 'cardAddFields.js');
});

console.log(`linkedCardShownFields: ${passed} passed`);
