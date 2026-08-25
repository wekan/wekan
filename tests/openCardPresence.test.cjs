'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { openCardIsUnavailable } = require('../models/lib/openCardPresence');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('an existing card on its original board remains open', () => {
  assert.strictEqual(openCardIsUnavailable({ _id: 'c1', boardId: 'b1' }, 'b1'), false);
});

test('#3114: a remotely removed card closes', () => {
  assert.strictEqual(openCardIsUnavailable(null, 'b1'), true);
  assert.strictEqual(openCardIsUnavailable(undefined, 'b1'), true);
});

test('#3114: a card remotely moved to another board closes', () => {
  assert.strictEqual(openCardIsUnavailable({ _id: 'c1', boardId: 'b2' }, 'b1'), true);
});

test('missing opening context closes defensively', () => {
  assert.strictEqual(openCardIsUnavailable({ _id: 'c1', boardId: 'b1' }, null), true);
});

test('card details clears desktop, mobile route and popup state', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../client/components/cards/cardDetails.js'),
    'utf8',
  );
  assert.ok(source.includes("ReactiveCache.getCard(openedCardId)"));
  assert.ok(source.includes("Session.get('openCards')"));
  assert.ok(source.includes("Session.set('currentCard', null)"));
  assert.ok(source.includes("Session.delete('popupCardId')"));
  assert.ok(source.includes('Utils.goBoardId(openedBoardId)'));
});

console.log(`\nopenCardPresence: ${passed} tests passed`);
