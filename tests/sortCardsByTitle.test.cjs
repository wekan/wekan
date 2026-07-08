/**
 * Test: sortCardsByTitle (models/lib/sortCardsByTitle.js).
 *
 * Feature https://github.com/wekan/wekan/issues/5394 "Link to this card" popup:
 * the Cards pull-down list must be sorted alphabetically by card title
 * (case-insensitive) so a card can be found on boards with many cards.
 *
 * Plain Node script (no Meteor / DB), in the style of
 * tests/boardSortReorder.test.cjs.
 */

const assert = require('assert');
const { sortCardsByTitle, compareCardTitle } = require('../models/lib/sortCardsByTitle');

const titles = cards => cards.map(c => c.title);

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('sorts alphabetically by title', () => {
  const cards = [{ title: 'Banana' }, { title: 'Apple' }, { title: 'Cherry' }];
  assert.deepStrictEqual(titles(sortCardsByTitle(cards)), ['Apple', 'Banana', 'Cherry']);
});

test('is case-insensitive (mixed case)', () => {
  const cards = [{ title: 'banana' }, { title: 'Apple' }, { title: 'CHERRY' }, { title: 'apple' }];
  const sorted = titles(sortCardsByTitle(cards));
  // 'Apple'/'apple' come first (case-insensitive), then banana, then CHERRY.
  assert.strictEqual(sorted[0].toLowerCase(), 'apple');
  assert.strictEqual(sorted[1].toLowerCase(), 'apple');
  assert.strictEqual(sorted[2], 'banana');
  assert.strictEqual(sorted[3], 'CHERRY');
});

test('numeric-aware ordering (Card 2 before Card 10)', () => {
  const cards = [{ title: 'Card 10' }, { title: 'Card 2' }, { title: 'Card 1' }];
  assert.deepStrictEqual(titles(sortCardsByTitle(cards)), ['Card 1', 'Card 2', 'Card 10']);
});

test('stable for equal titles (keeps input order)', () => {
  const cards = [
    { title: 'Same', _id: 'a' },
    { title: 'Same', _id: 'b' },
    { title: 'Same', _id: 'c' },
  ];
  assert.deepStrictEqual(sortCardsByTitle(cards).map(c => c._id), ['a', 'b', 'c']);
});

test('missing / empty / undefined titles do not throw and sort first', () => {
  const cards = [{ title: 'Zebra' }, {}, { title: '' }, { title: undefined }, { title: 'Apple' }];
  let sorted;
  assert.doesNotThrow(() => {
    sorted = sortCardsByTitle(cards);
  });
  // Empty-ish titles collate as '' and come before real titles.
  assert.strictEqual(titles(sorted).pop(), 'Zebra');
  assert.ok(titles(sorted).indexOf('Apple') < titles(sorted).indexOf('Zebra'));
});

test('does not mutate the input array', () => {
  const cards = [{ title: 'B' }, { title: 'A' }];
  const copy = cards.slice();
  sortCardsByTitle(cards);
  assert.deepStrictEqual(cards, copy);
});

test('non-array input is returned unchanged', () => {
  assert.strictEqual(sortCardsByTitle(undefined), undefined);
  assert.strictEqual(sortCardsByTitle(null), null);
});

test('compareCardTitle returns 0 for equal titles regardless of case', () => {
  assert.strictEqual(compareCardTitle({ title: 'Foo' }, { title: 'foo' }), 0);
});

let failed = 0;
tests.forEach(([name, fn]) => {
  try {
    fn();
    console.log('ok - ' + name);
  } catch (e) {
    failed++;
    console.error('FAIL - ' + name);
    console.error('  ' + e.message);
  }
});
if (failed) {
  console.error('\n' + failed + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll ' + tests.length + ' tests passed');
