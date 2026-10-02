'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname,
  '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const locale = read('my');
assert.deepEqual(Object.keys(locale), Object.keys(en));
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
for (const key of keys) {
  assert.ok(locale[key]?.trim(), key);
  assert.notEqual(locale[key], en[key], key);
  assert.match(locale[key], /[\u1000-\u109F]/, key);
  assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), key);
  assert.deepEqual(locale[key].match(/%?\{[^}]+\}/g), en[key].match(/%?\{[^}]+\}/g), key);
  assert.deepEqual(locale[key].match(/<[^>]+>/g), en[key].match(/<[^>]+>/g), key);
}
assert.deepEqual(locale['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g),
  en['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g));
console.log('Burmese date filter translations passed');
