'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname,
  '../imports/i18n/data', code + '.i18n.json'), 'utf8'));
const en = read('en');
const locale = read('lld');
const keys = [
  "auto-archive-days",
  "auto-archive-off",
  "auto-archive-hint",
  "filter-recency-any",
  "filter-recency-day",
  "filter-recency-week",
  "filter-recency-month",
  "filter-recency-older",
  "filter-movement-range",
  "filter-date-range-field",
  "filter-date-range-from",
  "filter-date-range-to",
  "filter-date-range-missing",
  "filter-date-range-list-entry",
  "filter-date-range-invalid",
  "filter-due-any",
  "filter-due-previous-week",
  "filter-due-next-month",
  "filter-column-age",
  "filter-column-age-disabled",
  "filter-column-age-days",
  "filter-column-age-hint",
  "advanced-filter-card-dates-hint"
];
assert.deepEqual(Object.keys(locale), Object.keys(en));
for (const key of keys) {
  assert.ok(locale[key]?.trim(), key);
  assert.notEqual(locale[key], en[key], key);
  assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), key);
  assert.deepEqual(locale[key].match(/%?\{[^}]+\}/g), en[key].match(/%?\{[^}]+\}/g), key);
  assert.deepEqual(locale[key].match(/<[^>]+>/g), en[key].match(/<[^>]+>/g), key);
}
assert.deepEqual(locale['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g),
  en['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g));
for (const literal of ["@endAt >= '2026-01-01'", '@endAt = none']) {
  assert.ok(locale['advanced-filter-card-dates-hint'].includes(literal), literal);
}
for (const [key, number] of [['filter-recency-day', '24'],
  ['filter-recency-week', '7'], ['filter-recency-month', '30']]) {
  assert.ok(locale[key].includes(number), key);
}
assert.match(locale['auto-archive-hint'], /modiei ne vën mai spostei/);
assert.match(locale['filter-column-age-hint'], /nia cunescudes resta visibles/);
assert.match(locale['filter-column-age-hint'], /ne mëter nia a zero/);
assert.notEqual(locale['filter-date-range-from'], locale['filter-date-range-to']);
assert.match(locale['filter-date-range-invalid'], /medemo di.*o do/);
console.log('Ladin date filter translation checks passed');
