'use strict';

// Plain-Node unit test (no Meteor) for non-Latin digit normalization in dates.
// Run: node tests/dateUtils.normalizeDigits.test.cjs
//
// Regression guard for #5752 ("Due date does not work when language uses
// non-Latin (e.g. Persian/Farsi) digits"): the native JavaScript `Date`
// constructor only understands ASCII digits, so a date/time string rendered
// with Persian/Extended Arabic-Indic digits (۰۱۲۳۴۵۶۷۸۹, U+06F0–U+06F9) or
// Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩, U+0660–U+0669) produces an Invalid Date.
// `normalizeDigits()` converts those to ASCII before parsing; `isValidDate()`
// and the rest of dateUtils run every string through it.
//
// dateUtils.js is an ES module (used by the Meteor client/server bundle), so we
// load it with a dynamic import() from this CommonJS test wrapper.

const assert = require('assert');

let passed = 0;
function test(name, fn) {
  return Promise.resolve(fn()).then(() => {
    passed += 1;
    console.log('  ok -', name);
  });
}

(async () => {
  const { normalizeDigits, isValidDate } = await import(
    '../imports/lib/dateUtils.js'
  );

  // --- Positive: non-Latin digits normalize to ASCII --------------------------

  // Persian / Extended Arabic-Indic digits (U+06F0–U+06F9).
  await test('Persian digits in a date normalize to ASCII', () => {
    assert.strictEqual(normalizeDigits('۲۰۲۶-۰۶-۲۳'), '2026-06-23');
  });
  await test('Persian digits in a time normalize to ASCII', () => {
    assert.strictEqual(normalizeDigits('۱۷:۳۰'), '17:30');
  });

  // Arabic-Indic digits (U+0660–U+0669).
  await test('Arabic-Indic digits in a date normalize to ASCII', () => {
    assert.strictEqual(normalizeDigits('٢٠٢٦-٠٦-٢٣'), '2026-06-23');
  });
  await test('Arabic-Indic digits in a time normalize to ASCII', () => {
    assert.strictEqual(normalizeDigits('٠٩:٤٥'), '09:45');
  });

  // The whole point: the normalized string must parse to the correct Date.
  await test('Persian datetime string parses to the correct Date', () => {
    const d = new Date(normalizeDigits('۲۰۲۶-۰۶-۲۳T۱۷:۳۰:00'));
    assert.ok(!isNaN(d.getTime()), 'should be a valid Date');
    assert.strictEqual(d.toISOString(), '2026-06-23T14:30:00.000Z');
  });
  await test('isValidDate() accepts a Persian-digit date string', () => {
    assert.strictEqual(isValidDate('۲۰۲۶-۰۶-۲۳'), true);
  });
  await test('isValidDate() accepts an Arabic-Indic date string', () => {
    assert.strictEqual(isValidDate('٢٠٢٦-٠٦-٢٣'), true);
  });

  // Mixed ASCII + non-Latin digits in one string are all converted.
  await test('mixed ASCII and Persian digits all normalize', () => {
    assert.strictEqual(normalizeDigits('2026-۰۶-23'), '2026-06-23');
  });

  // --- Negative: ASCII unchanged, garbage stays invalid, empties handled ------

  // Pure ASCII must be returned byte-for-byte unchanged and still parse.
  await test('pure ASCII date string is unchanged', () => {
    assert.strictEqual(normalizeDigits('2026-06-23'), '2026-06-23');
  });
  await test('pure ASCII date string still parses and is valid', () => {
    assert.strictEqual(isValidDate('2026-06-23'), true);
  });

  // Non-digit characters (including Persian letters / separators) are untouched.
  await test('non-digit characters are left untouched', () => {
    assert.strictEqual(normalizeDigits('سلام-abc'), 'سلام-abc');
  });

  // Genuinely invalid input must stay invalid — never silently coerced.
  await test('garbage string is rejected as an invalid date', () => {
    assert.strictEqual(isValidDate('not-a-date'), false);
  });
  await test('garbage string with Persian digits is still invalid', () => {
    // Digits normalize, but the surrounding garbage keeps it unparseable.
    assert.strictEqual(normalizeDigits('xx۱۲yy'), 'xx12yy');
    assert.strictEqual(isValidDate('xx۱۲yy'), false);
  });

  // Empty / non-string inputs are handled without throwing.
  await test('empty string is returned unchanged', () => {
    assert.strictEqual(normalizeDigits(''), '');
  });
  await test('empty string is not a valid date', () => {
    assert.strictEqual(isValidDate(''), false);
  });
  await test('non-string values pass through unchanged', () => {
    assert.strictEqual(normalizeDigits(1234), 1234);
    assert.strictEqual(normalizeDigits(null), null);
    assert.strictEqual(normalizeDigits(undefined), undefined);
    const dateObj = new Date(0);
    assert.strictEqual(normalizeDigits(dateObj), dateObj);
  });

  console.log(`\n${passed} assertions passed.`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
