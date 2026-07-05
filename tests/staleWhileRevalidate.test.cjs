'use strict';

// Plain-Node unit test (no Meteor) for the DataCache stale-while-revalidate
// decision — the board-not-found flicker fix.
// Run: node tests/staleWhileRevalidate.test.cjs
//
// The client board cache re-fetches inside a reactive computation. When the board
// doc is briefly missing from minimongo (a subscription stop/restart momentarily
// removes it), the re-fetch returns null and the view flips to "Board not found"
// (WebKit also throws a Blaze "removed DomRange" error). shouldDeferCacheMiss
// decides when to KEEP the last value and re-check shortly instead of surfacing
// that transient miss. It must never defer a genuine first-load miss, and must
// only apply when the owning cache opted in.

const assert = require('assert');
const { shouldDeferCacheMiss } = require('../imports/lib/staleWhileRevalidate');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const SWR = { staleWhileRevalidate: true };
const OFF = {};
const BOARD = { _id: 'b1', title: 'Board' };

// --- POSITIVE: defer a transient miss over a cached value -------------------
test('POSITIVE: defers when a cached board momentarily re-fetches as null', () => {
  assert.strictEqual(shouldDeferCacheMiss(SWR, null, BOARD), true);
});

test('POSITIVE: defers for undefined too (findOne returns undefined)', () => {
  assert.strictEqual(shouldDeferCacheMiss(SWR, undefined, BOARD), true);
});

// --- NEGATIVE: never hide a real value or a genuine first-load miss ---------
test('NEGATIVE: a real fetched value is never deferred', () => {
  assert.strictEqual(shouldDeferCacheMiss(SWR, BOARD, BOARD), false);
  assert.strictEqual(shouldDeferCacheMiss(SWR, BOARD, null), false);
});

test('NEGATIVE: first-ever load (no cached value) surfaces the miss immediately', () => {
  // Nothing cached yet -> real "not found" must render promptly, not be deferred.
  assert.strictEqual(shouldDeferCacheMiss(SWR, null, null), false);
  assert.strictEqual(shouldDeferCacheMiss(SWR, null, undefined), false);
});

test('NEGATIVE: caches that did NOT opt in are unaffected (default behaviour)', () => {
  // Lists/cards/etc. keep the original immediate-write semantics.
  assert.strictEqual(shouldDeferCacheMiss(OFF, null, BOARD), false);
  assert.strictEqual(shouldDeferCacheMiss(undefined, null, BOARD), false);
});

test('NEGATIVE: a falsy-but-present cached value (0 / "") is still preserved', () => {
  // Guard uses null/undefined checks, not truthiness, so 0 or "" count as cached.
  assert.strictEqual(shouldDeferCacheMiss(SWR, null, 0), true);
  assert.strictEqual(shouldDeferCacheMiss(SWR, null, ''), true);
});

console.log(`\n${passed} passing`);
