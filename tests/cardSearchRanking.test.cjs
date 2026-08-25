'use strict';

const assert = require('assert');
const {
  cardTextScore,
  retainRankedCard,
} = require('../models/lib/cardSearchRanking');

const regex = /needle/i;
assert.strictEqual(cardTextScore({ title: 'Needle', description: 'needle' }, regex), 10);
assert.strictEqual(cardTextScore({ description: 'needle' }, regex), 5);
assert.strictEqual(cardTextScore({ customFields: [{ value: 'needle' }] }, regex), 1);
assert.strictEqual(cardTextScore({}, regex), 0);

const best = [];
[
  { _id: 'd', title: 'z', description: 'needle' },
  { _id: 'b', title: 'Needle beta' },
  { _id: 'c', title: 'Needle alpha' },
  { _id: 'a', title: 'a', customFields: [{ value: 'needle' }] },
].forEach(card => retainRankedCard(best, card, regex, 2));

assert.deepStrictEqual(best.map(card => card._id), ['c', 'b']);
assert.strictEqual(best.length, 2, 'the retained working set never exceeds skip + limit');

console.log('card search ranking tests passed');
