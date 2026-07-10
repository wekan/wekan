'use strict';

// Plain-Node unit test (no Meteor) for the CARDS_LOADING / lazy card-loading
// helpers. Run: node tests/cardsLoading.test.cjs
//
// resolveCardsLoadingMode: the CARDS_LOADING env var / Admin Panel setting maps
// to exactly 'lazy' (only for "lazy") or 'all' (everything else) — a wrong value
// must NEVER silently enable the experimental lazy mode.
// parseCardsLoadingEnv: env is authoritative only when explicitly all|lazy.
// windowCountId: a falsy swimlaneId (undefined/null/'') MUST collapse to one id,
// because listBody subscribes with undefined while listHeader reads with '' —
// they must reference the same reactive count doc.

const assert = require('assert');
const {
  resolveCardsLoadingMode,
  parseCardsLoadingEnv,
  windowCountId,
} = require('../models/lib/cardsLoading');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- resolveCardsLoadingMode: POSITIVE (enables lazy) -----------------------
test('"lazy" -> lazy', () => assert.strictEqual(resolveCardsLoadingMode('lazy'), 'lazy'));
test('case/space-insensitive "  LAZY " -> lazy', () =>
  assert.strictEqual(resolveCardsLoadingMode('  LAZY '), 'lazy'));

// --- resolveCardsLoadingMode: NEGATIVE (defaults to all, never lazy) --------
test('"all" -> all', () => assert.strictEqual(resolveCardsLoadingMode('all'), 'all'));
test('empty string -> all', () => assert.strictEqual(resolveCardsLoadingMode(''), 'all'));
test('undefined -> all', () => assert.strictEqual(resolveCardsLoadingMode(undefined), 'all'));
test('null -> all', () => assert.strictEqual(resolveCardsLoadingMode(null), 'all'));
test('garbage never enables lazy', () => {
  for (const v of ['true', '1', 'yes', 'Lazyload', 'l', 'lazyy', 'ALL', 42, {}]) {
    assert.strictEqual(resolveCardsLoadingMode(v), 'all', `value ${JSON.stringify(v)}`);
  }
});

// --- parseCardsLoadingEnv: only explicit all|lazy count ---------------------
test('parseCardsLoadingEnv("lazy") -> lazy', () =>
  assert.strictEqual(parseCardsLoadingEnv('lazy'), 'lazy'));
test('parseCardsLoadingEnv("all") -> all', () =>
  assert.strictEqual(parseCardsLoadingEnv('all'), 'all'));
test('parseCardsLoadingEnv unset/garbage -> undefined', () => {
  for (const v of ['', undefined, null, 'true', 'nope']) {
    assert.strictEqual(parseCardsLoadingEnv(v), undefined, `value ${JSON.stringify(v)}`);
  }
});

// --- windowCountId ----------------------------------------------------------
test('undefined / null / "" swimlane collapse to the SAME id', () => {
  const a = windowCountId('list1', undefined);
  assert.strictEqual(a, windowCountId('list1', null));
  assert.strictEqual(a, windowCountId('list1', ''));
  assert.strictEqual(a, 'list1::');
});
test('a real swimlane id produces a distinct id', () => {
  assert.strictEqual(windowCountId('list1', 'sw1'), 'list1::sw1');
  assert.notStrictEqual(windowCountId('list1', 'sw1'), windowCountId('list1', undefined));
});
test('different lists never collide', () => {
  assert.notStrictEqual(windowCountId('l1', 's1'), windowCountId('l2', 's1'));
});

console.log(`\ncardsLoading: ${passed} tests passed`);
