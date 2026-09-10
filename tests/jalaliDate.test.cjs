'use strict';

// Plain-Node unit test (no Meteor) for the Gregorian <-> Jalali (Persian /
// Solar Hijri) display conversion added for #4335 ("is it possible to use
// jalali calendar? or at least jalali date preview on minicard").
// Run: node tests/jalaliDate.test.cjs
//
// Scope reminder: this is a DISPLAY-ONLY conversion. Dates are always stored
// as native Gregorian `Date` objects; `imports/lib/jalaliDate.js` only turns
// one into a Jalali-calendar string for users who opted into
// `profile.calendarSystem === 'jalali'`. Date pickers/inputs, storage and
// due-date reminder logic are untouched and stay Gregorian.
//
// jalaliDate.js is an ES module (used by the Meteor client/server bundle), so
// we load it with a dynamic import() from this CommonJS test wrapper, the
// same pattern as tests/dateUtils.normalizeDigits.test.cjs.

const assert = require('assert');

let passed = 0;
function test(name, fn) {
  return Promise.resolve(fn()).then(() => {
    passed += 1;
    console.log('  ok -', name);
  });
}

(async () => {
  const {
    gregorianToJalali,
    jalaliToGregorian,
    formatJalaliDate,
  } = await import('../imports/lib/jalaliDate.js');

  // --- Known reference date pairs (verified internally consistent below) ---

  await test('2026-03-21 Gregorian is 1405-01-01 Jalali (Nowruz)', () => {
    assert.deepStrictEqual(gregorianToJalali(2026, 3, 21), {
      jy: 1405,
      jm: 1,
      jd: 1,
    });
  });

  await test('1979-02-11 Gregorian is 1357-11-22 Jalali', () => {
    assert.deepStrictEqual(gregorianToJalali(1979, 2, 11), {
      jy: 1357,
      jm: 11,
      jd: 22,
    });
  });

  await test('2000-01-01 Gregorian is 1378-10-11 Jalali', () => {
    assert.deepStrictEqual(gregorianToJalali(2000, 1, 1), {
      jy: 1378,
      jm: 10,
      jd: 11,
    });
  });

  // --- Internal consistency: the day after Nowruz rolls the Jalali day, not
  // the year, and repeats for a short run of consecutive days. ---

  await test('the day after Nowruz is 1405-01-02', () => {
    assert.deepStrictEqual(gregorianToJalali(2026, 3, 22), {
      jy: 1405,
      jm: 1,
      jd: 2,
    });
  });

  await test('the day before Nowruz is still the previous Jalali year', () => {
    assert.deepStrictEqual(gregorianToJalali(2026, 3, 20), {
      jy: 1404,
      jm: 12,
      jd: 29,
    });
  });

  await test('a short run of consecutive days advances the Jalali day by one', () => {
    const start = gregorianToJalali(2026, 3, 22);
    for (let i = 1; i <= 5; i += 1) {
      const d = new Date(Date.UTC(2026, 2, 22 + i));
      const r = gregorianToJalali(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
      assert.strictEqual(r.jy, start.jy);
      assert.strictEqual(r.jm, start.jm);
      assert.strictEqual(r.jd, start.jd + i);
    }
  });

  // --- Round trip: jalaliToGregorian(gregorianToJalali(x)) === x -----------

  await test('round-trips through jalaliToGregorian for all three reference dates', () => {
    for (const [gy, gm, gd] of [
      [2026, 3, 21],
      [1979, 2, 11],
      [2000, 1, 1],
    ]) {
      const j = gregorianToJalali(gy, gm, gd);
      const back = jalaliToGregorian(j.jy, j.jm, j.jd);
      assert.deepStrictEqual(back, { gy, gm, gd });
    }
  });

  await test('round-trips across a wider sample of dates (every ~37 days for 10 years)', () => {
    const start = Date.UTC(2015, 0, 1);
    for (let i = 0; i < 100; i += 1) {
      const d = new Date(start + i * 37 * 86400000);
      const gy = d.getUTCFullYear();
      const gm = d.getUTCMonth() + 1;
      const gd = d.getUTCDate();
      const j = gregorianToJalali(gy, gm, gd);
      const back = jalaliToGregorian(j.jy, j.jm, j.jd);
      assert.deepStrictEqual(back, { gy, gm, gd }, `mismatch for ${gy}-${gm}-${gd}`);
    }
  });

  // --- formatJalaliDate() display formatting --------------------------------

  await test('formatJalaliDate defaults to YYYY-MM-DD, zero-padded', () => {
    assert.strictEqual(
      formatJalaliDate(new Date(Date.UTC(2026, 2, 21, 12, 0)), 'YYYY-MM-DD', false),
      '1405-01-01',
    );
  });

  await test('formatJalaliDate supports DD-MM-YYYY', () => {
    assert.strictEqual(
      formatJalaliDate(new Date(Date.UTC(2026, 2, 21, 12, 0)), 'DD-MM-YYYY', false),
      '01-01-1405',
    );
  });

  await test('formatJalaliDate supports MM-DD-YYYY', () => {
    assert.strictEqual(
      formatJalaliDate(new Date(Date.UTC(2026, 2, 21, 12, 0)), 'MM-DD-YYYY', false),
      '01-01-1405',
    );
  });

  await test('formatJalaliDate can include the time', () => {
    const d = new Date(2026, 2, 21, 9, 5);
    const s = formatJalaliDate(d, 'YYYY-MM-DD', true);
    assert.strictEqual(s, '1405-01-01 09:05');
  });

  await test('formatJalaliDate returns an empty string for an invalid date', () => {
    assert.strictEqual(formatJalaliDate('not-a-date'), '');
  });

  // --- Negative: gregorianToJalali never returns a Gregorian-shaped result -
  // (guards against a copy/paste regression that forgets to convert) --------

  await test('the Jalali year differs from the Gregorian year (never a no-op copy)', () => {
    for (const [gy, gm, gd] of [
      [2026, 3, 21],
      [1979, 2, 11],
      [2000, 1, 1],
    ]) {
      const j = gregorianToJalali(gy, gm, gd);
      assert.notStrictEqual(j.jy, gy);
    }
  });

  console.log(`\n${passed} assertions passed.`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
