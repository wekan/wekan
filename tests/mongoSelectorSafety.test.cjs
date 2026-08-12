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

// #6588-class follow-up, found by tests/fixedVulnerabilityClasses.test.cjs asking
// whether a fixed mistake exists anywhere else: $where was never the only way a
// FIND filter can run JavaScript. MongoDB 4.4+ takes an aggregation expression in
// a find filter, and $function there runs a JavaScript body with arguments - the
// same capability through the same client-supplied selector.
test('$expr + $function is rejected - the modern spelling of $where', () => {
  assert.strictEqual(
    hasWhere({ $expr: { $function: { body: 'function(){ return true }', args: [], lang: 'js' } } }),
    true,
  );
});
test('$accumulator is rejected too', () => {
  assert.strictEqual(hasWhere({ x: { $accumulator: { init: 'function(){}', lang: 'js' } } }), true);
});
test('$function nested in an array element is rejected', () => {
  assert.strictEqual(
    hasWhere({ $or: [{ a: 1 }, { $expr: { $eq: [{ $function: { body: 'x' } }, 1] } }] }),
    true,
  );
});
test('a field literally named function or accumulator is safe (negative)', () => {
  // No $, no execution: these are ordinary field names a board could really use.
  assert.strictEqual(hasWhere({ function: 'value', accumulator: 2 }), false);
  assert.strictEqual(hasWhere({ meta: { function: { body: 'not an operator' } } }), false);
});
test('$expr WITHOUT a code operator is still safe (negative)', () => {
  // $expr on its own is ordinary comparison, and refusing it would break honest
  // queries - what is refused is the code body inside it.
  assert.strictEqual(hasWhere({ $expr: { $gt: ['$spent', '$budget'] } }), false);
});
test('a selector that refers to itself does not hang the check (negative)', () => {
  const cyclic = { a: 1 };
  cyclic.self = cyclic;
  assert.strictEqual(hasWhere(cyclic), false);
  const cyclicEvil = { $and: [{ $where: 'x' }] };
  cyclicEvil.self = cyclicEvil;
  assert.strictEqual(hasWhere(cyclicEvil), true);
});

console.log(`\nmongoSelectorSafety: ${passed} tests passed`);
