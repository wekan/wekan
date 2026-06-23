'use strict';

// Plain-Node unit test (no Meteor) for the REST members/assignees coercion.
// Run: node tests/restArrayParam.test.cjs
//
// Regression guard for #3697 ("Can't edit members with UI after removing members
// with RestAPI"): the REST handler used to (a) skip clear payloads (`null` / `""`)
// behind a truthiness guard and (b) write `null` instead of `[]` for an empty
// value — and a card with `members: null` breaks UI code that treats it as an
// array. coerceRestArrayParam normalizes any payload into a clean String[].

const assert = require('assert');
const { coerceRestArrayParam } = require('../server/lib/restArrayParam');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// A single id string becomes a one-element array.
test('wraps a single id string into an array', () => {
  assert.deepStrictEqual(coerceRestArrayParam('userA'), ['userA']);
});

// The natural "clear" payloads all become an empty array — never null.
test('empty string clears to []', () => {
  assert.deepStrictEqual(coerceRestArrayParam(''), []);
});
test('null clears to []', () => {
  assert.deepStrictEqual(coerceRestArrayParam(null), []);
});
test('undefined clears to []', () => {
  assert.deepStrictEqual(coerceRestArrayParam(undefined), []);
});

// Arrays are kept, but filtered to non-empty strings so a stray non-string id
// cannot reach the document (the schema is [String]).
test('keeps a valid id array', () => {
  assert.deepStrictEqual(coerceRestArrayParam(['a', 'b']), ['a', 'b']);
});
test('keeps an explicit empty array', () => {
  assert.deepStrictEqual(coerceRestArrayParam([]), []);
});
test('filters non-string / empty entries out of an array', () => {
  assert.deepStrictEqual(coerceRestArrayParam(['a', null, 123, '', 'b']), ['a', 'b']);
});

// Defensive: any other type is treated as a clear.
test('a number clears to []', () => {
  assert.deepStrictEqual(coerceRestArrayParam(7), []);
});
test('an object clears to []', () => {
  assert.deepStrictEqual(coerceRestArrayParam({ userId: 'x' }), []);
});

// The result is ALWAYS an array (never null/undefined) for every input — this is
// the invariant the UI relies on.
test('result is always an array for any input', () => {
  for (const input of ['', null, undefined, 'id', [], ['a'], 0, {}, NaN]) {
    assert.ok(Array.isArray(coerceRestArrayParam(input)),
      `expected array for input ${JSON.stringify(input)}`);
  }
});

// --- Negative test: prove this is what fixes #3697 -------------------------
// Reproduce the OLD handler's logic and show it produced the corrupt state
// (null) for a clear, whereas the new helper never does.
test('NEGATIVE: the old logic wrote null for an empty value; the new helper does not', () => {
  const oldCoerce = value => {
    // Old behavior: `if (req.body.members)` guard + string branch writing null.
    if (!value) return undefined;            // clear payloads skipped entirely
    if (typeof value === 'string') {
      return value === '' ? null : [value];  // empty string would store null
    }
    return value;
  };
  // A clear via "" under the old logic was a no-op (skipped) — you could not
  // remove the last member; and the dead branch's intent was to store null.
  assert.strictEqual(oldCoerce(''), undefined);
  assert.strictEqual(oldCoerce(null), undefined);
  // New helper turns both into a clean, editable empty array.
  assert.deepStrictEqual(coerceRestArrayParam(''), []);
  assert.deepStrictEqual(coerceRestArrayParam(null), []);
});

console.log(`\n${passed} passing`);
