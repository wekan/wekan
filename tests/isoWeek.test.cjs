'use strict';

// Plain-Node regression guard for ISO week numbers.
// Run: node tests/isoWeek.test.cjs
//
// #4055 ("[Bug] Wrong week number displayed") reported that the week of
// 2021-10-25..31 (ISO week 43) showed 44 for Mon-Sat and 45 for Sunday. That
// was the old moment-based calculation. dateUtils.getISOWeek() (native Date,
// DST-safe) computes these correctly; this test pins that so the regression
// cannot silently return.

const assert = require('assert');

let passed = 0;
function test(name, fn) {
  return Promise.resolve(fn()).then(() => {
    passed += 1;
    console.log('  ok -', name);
  });
}

(async () => {
  const { getISOWeek } = await import('../imports/lib/dateUtils.js');
  const wk = ds => getISOWeek(new Date(ds + 'T12:00:00'));

  // --- POSITIVE: the exact dates from #4055 are ISO week 43 ------------------
  await test('#4055: Mon..Sun 2021-10-25..31 are all ISO week 43', () => {
    for (const d of [
      '2021-10-25', '2021-10-26', '2021-10-27', '2021-10-28',
      '2021-10-29', '2021-10-30', '2021-10-31',
    ]) {
      assert.strictEqual(wk(d), 43, `${d} should be week 43`);
    }
  });

  await test('ISO week 1 boundaries are correct', () => {
    assert.strictEqual(wk('2021-01-04'), 1); // first Monday of 2021
    assert.strictEqual(wk('2022-01-03'), 1); // first Monday of 2022
  });

  await test('ISO week 53 / year-boundary cases', () => {
    assert.strictEqual(wk('2021-01-01'), 53); // belongs to 2020's week 53
    assert.strictEqual(wk('2020-12-28'), 53);
  });

  // --- NEGATIVE: the #4055 off-by-one/two must NOT reappear ------------------
  await test('NEGATIVE: 2021-10-25 must NOT be 44 (was the bug)', () => {
    assert.notStrictEqual(wk('2021-10-25'), 44);
  });

  await test('NEGATIVE: Sunday 2021-10-31 must NOT be 45 (was the bug)', () => {
    assert.notStrictEqual(wk('2021-10-31'), 45);
    assert.strictEqual(wk('2021-10-31'), 43);
  });

  console.log(`\n${passed} tests passed`);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
