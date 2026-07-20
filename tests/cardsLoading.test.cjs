'use strict';

// Plain-Node unit test (no Meteor) for the CARDS_LOADING / lazy card-loading
// helpers. Run: node tests/cardsLoading.test.cjs
//
// resolveCardsLoadingMode: the CARDS_LOADING env var / Admin Panel setting maps
// to 'all' (only "all"), 'lazy' (only "lazy"), or 'auto' (the DEFAULT — anything
// else / unset). 'auto' decides per board by size and is safe (small boards load
// eagerly, exactly as 'all').
// parseCardsLoadingEnv: env is authoritative only when explicitly all|lazy|auto.
// cardsLoadingLazyThreshold: env parse with a safe default.
// effectiveBoardCardsMode: the per-board all|lazy decision from mode + card count.
// windowCountId: a falsy swimlaneId (undefined/null/'') MUST collapse to one id.

const assert = require('assert');
const {
  DEFAULT_LAZY_THRESHOLD,
  resolveCardsLoadingMode,
  parseCardsLoadingEnv,
  cardsLoadingLazyThreshold,
  effectiveBoardCardsMode,
  windowCountId,
} = require('../models/lib/cardsLoading');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- resolveCardsLoadingMode: explicit values -------------------------------
test('"lazy" -> lazy', () => assert.strictEqual(resolveCardsLoadingMode('lazy'), 'lazy'));
test('case/space-insensitive "  LAZY " -> lazy', () =>
  assert.strictEqual(resolveCardsLoadingMode('  LAZY '), 'lazy'));
test('"all" -> all', () => assert.strictEqual(resolveCardsLoadingMode('all'), 'all'));
test('"  ALL " -> all', () => assert.strictEqual(resolveCardsLoadingMode('  ALL '), 'all'));
test('"auto" -> auto', () => assert.strictEqual(resolveCardsLoadingMode('auto'), 'auto'));

// --- resolveCardsLoadingMode: DEFAULT is 'auto' (never silently 'lazy') -----
test('empty string -> auto', () => assert.strictEqual(resolveCardsLoadingMode(''), 'auto'));
test('undefined -> auto', () => assert.strictEqual(resolveCardsLoadingMode(undefined), 'auto'));
test('null -> auto', () => assert.strictEqual(resolveCardsLoadingMode(null), 'auto'));
test('garbage -> auto (never lazy/all by accident)', () => {
  for (const v of ['true', '1', 'yes', 'Lazyload', 'l', 'lazyy', 'allx', 42, {}]) {
    assert.strictEqual(resolveCardsLoadingMode(v), 'auto', `value ${JSON.stringify(v)}`);
  }
});

// --- parseCardsLoadingEnv: only explicit all|lazy|auto count ----------------
test('parseCardsLoadingEnv("lazy") -> lazy', () =>
  assert.strictEqual(parseCardsLoadingEnv('lazy'), 'lazy'));
test('parseCardsLoadingEnv("all") -> all', () =>
  assert.strictEqual(parseCardsLoadingEnv('all'), 'all'));
test('parseCardsLoadingEnv("auto") -> auto', () =>
  assert.strictEqual(parseCardsLoadingEnv('auto'), 'auto'));
test('parseCardsLoadingEnv unset/garbage -> undefined', () => {
  for (const v of ['', undefined, null, 'true', 'nope']) {
    assert.strictEqual(parseCardsLoadingEnv(v), undefined, `value ${JSON.stringify(v)}`);
  }
});

// --- cardsLoadingLazyThreshold ---------------------------------------------
test('threshold parses a valid integer', () =>
  assert.strictEqual(cardsLoadingLazyThreshold('1000'), 1000));
test('threshold 0 is allowed (every auto board lazy)', () =>
  assert.strictEqual(cardsLoadingLazyThreshold('0'), 0));
test('threshold unset/invalid/negative -> default', () => {
  for (const v of [undefined, null, '', 'abc', '-5', -1, {}]) {
    assert.strictEqual(cardsLoadingLazyThreshold(v), DEFAULT_LAZY_THRESHOLD, `value ${JSON.stringify(v)}`);
  }
});

// --- effectiveBoardCardsMode: explicit modes ignore the count ---------------
test('mode "all" is always all', () => {
  assert.strictEqual(effectiveBoardCardsMode('all', 999999, 500), 'all');
  assert.strictEqual(effectiveBoardCardsMode('all', 0, 500), 'all');
});
test('mode "lazy" is always lazy', () => {
  assert.strictEqual(effectiveBoardCardsMode('lazy', 0, 500), 'lazy');
  assert.strictEqual(effectiveBoardCardsMode('lazy', 999999, 500), 'lazy');
});

// --- effectiveBoardCardsMode: auto decides by size --------------------------
test('auto below threshold -> all', () =>
  assert.strictEqual(effectiveBoardCardsMode('auto', 500, 500), 'all'));
test('auto AT threshold -> all (strictly greater is lazy)', () =>
  assert.strictEqual(effectiveBoardCardsMode('auto', 500, 500), 'all'));
test('auto above threshold -> lazy', () =>
  assert.strictEqual(effectiveBoardCardsMode('auto', 501, 500), 'lazy'));
test('auto with threshold 0 -> lazy for any non-empty board', () => {
  assert.strictEqual(effectiveBoardCardsMode('auto', 1, 0), 'lazy');
  assert.strictEqual(effectiveBoardCardsMode('auto', 0, 0), 'all');
});
test('auto default: unset mode (-> auto) uses the count', () => {
  assert.strictEqual(effectiveBoardCardsMode(undefined, 10, 500), 'all');
  assert.strictEqual(effectiveBoardCardsMode(undefined, 1000, 500), 'lazy');
});
test('auto tolerates non-numeric count/threshold', () => {
  assert.strictEqual(effectiveBoardCardsMode('auto', NaN, 500), 'all'); // count -> 0
  assert.strictEqual(effectiveBoardCardsMode('auto', 1000, NaN), 'lazy'); // threshold -> default 500
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
