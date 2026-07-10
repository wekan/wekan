'use strict';

// Plain-Node unit test (no Meteor) for the windowed-card publication's selector
// safety check. Run: node tests/mongoSelectorSafety.test.cjs
//
// The lazy card-loading feature (CARDS_LOADING=lazy) lets the client pass the
// exact selector it renders with to the `boardCardsWindow` publication, which
// runs it against the database. hasWhere() must refuse any selector carrying a
// `$where` clause (server-side JS execution) at ANY depth, while never flagging
// an ordinary field/operator selector.

const assert = require('assert');
const { hasWhere } = require('../models/lib/mongoSelectorSafety');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- NEGATIVE (safe selectors → hasWhere returns false) ---------------------
test('empty selector is safe', () => {
  assert.strictEqual(hasWhere({}), false);
});
test('plain field selector is safe', () => {
  assert.strictEqual(hasWhere({ listId: 'l1', archived: false }), false);
});
test('operators and $in arrays are safe', () => {
  assert.strictEqual(
    hasWhere({ swimlaneId: { $in: ['s1', null, ''] }, boardId: 'b1' }),
    false,
  );
});
test('nested $and / $or are safe', () => {
  assert.strictEqual(
    hasWhere({ $and: [{ listId: 'l1' }, { $or: [{ a: 1 }, { b: 2 }] }] }),
    false,
  );
});
test('a field literally named where (no $) is safe', () => {
  assert.strictEqual(hasWhere({ where: 'somewhere', location: { where: 'x' } }), false);
});
test('null / non-object inputs are safe', () => {
  assert.strictEqual(hasWhere(null), false);
  assert.strictEqual(hasWhere(undefined), false);
  assert.strictEqual(hasWhere('string'), false);
  assert.strictEqual(hasWhere(42), false);
});

// --- POSITIVE (malicious selectors → hasWhere returns true) -----------------
test('top-level $where is rejected', () => {
  assert.strictEqual(hasWhere({ $where: 'this.x == 1' }), true);
});
test('$where as a function value is rejected', () => {
  assert.strictEqual(hasWhere({ $where: function () { return true; } }), true);
});
test('$where nested inside $and is rejected', () => {
  assert.strictEqual(
    hasWhere({ $and: [{ listId: 'l1' }, { $where: 'sleep(9999)' }] }),
    true,
  );
});
test('$where deep inside an array element is rejected', () => {
  assert.strictEqual(
    hasWhere({ $or: [{ a: 1 }, { b: { $in: [{ $where: 'x' }] } }] }),
    true,
  );
});
test('$where inside $elemMatch is rejected', () => {
  assert.strictEqual(
    hasWhere({ members: { $elemMatch: { $where: 'evil' } } }),
    true,
  );
});

console.log(`\nmongoSelectorSafety: ${passed} tests passed`);
