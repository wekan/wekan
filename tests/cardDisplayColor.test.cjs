'use strict';
// #4756: "List colors had an option to apply to all cards in them by default,
// so by merely dragging cards around the colors would change." A list can
// now say so; a card without a colour of its own is SHOWN in its list's
// colour, and nothing is written to the card.
//
// Run: node tests/cardDisplayColor.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { effectiveCardColor } = require('../models/lib/cardDisplayColor');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('cardDisplayColor:');

const done = { color: 'green', cardsUseListColor: true };
test('a card without a colour shows its list\'s when the list asks for it', () => {
  assert.equal(effectiveCardColor({}, done), 'green');
  assert.equal(effectiveCardColor({ color: null }, { color: '#123abc', cardsUseListColor: true }), '#123abc', 'a custom hex too');
});

test('a card\'s own colour always wins', () => {
  assert.equal(effectiveCardColor({ color: 'red' }, done), 'red');
});

test('negative: a list that does not ask, has no colour or is white colours nothing', () => {
  assert.equal(effectiveCardColor({}, { color: 'green' }), null);
  assert.equal(effectiveCardColor({}, { color: 'green', cardsUseListColor: 'yes' }), null, 'only true');
  assert.equal(effectiveCardColor({}, { cardsUseListColor: true }), null);
  assert.equal(effectiveCardColor({}, { color: 'white', cardsUseListColor: true }), null, 'white is the palette\'s no colour');
  assert.equal(effectiveCardColor({}, null), null);
  assert.equal(effectiveCardColor(null, null), null);
});

test('the card helpers use it, from the list the card is shown in, and write nothing', () => {
  const cards = read('models/cards.js');
  const display = cards.slice(cards.indexOf('  displayColor() {'), cards.indexOf('  colorClass() {'));
  assert.match(display, /this\.listId \? ReactiveCache\.getList\(this\.listId\)/);
  assert.doesNotMatch(display, /updateAsync|\$set/);
  assert.match(cards, /colorClass\(\) \{\s*const color = this\.displayColor\(\);/);
  assert.match(cards, /colorStyle\(\) \{\s*const color = this\.displayColor\(\);/);
  assert.match(read('models/lists.js'), /cardsUseListColor: \{[\s\S]*?type: Boolean,\s*optional: true,/);
  assert.match(read('client/components/lists/listHeader.jade'), /a\.flex\.js-cards-use-list-color/);
});

console.log(`\ncardDisplayColor: ${passed} tests passed`);
