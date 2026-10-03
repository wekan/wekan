'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
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
for (const code of ['tk_TM', 'tt', 'so', 'ku', 'ckb']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en), `${code}: source key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: exact placeholders`);
    assert.deepEqual(locale[key].match(/\d+/g), en[key].match(/\d+/g), `${code}:${key}: numeric bounds`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', "@endAt >= '2026-01-01'", '@endAt = none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: literal query syntax ${token}`);
  }
  assert.notEqual(locale['filter-date-range-from'], locale['filter-date-range-to'], `${code}: distinct range endpoints`);
  assert.notEqual(locale['filter-recency-month'], locale['filter-recency-older'], `${code}: within versus older than 30 days`);
  assert.notEqual(locale['filter-due-previous-week'], locale['filter-due-next-month'], `${code}: distinct due periods`);
}
assert.match(read('tk_TM')['auto-archive-hint'], /hiç wagt arhiwlenmeýär/);
assert.match(read('tt')['auto-archive-hint'], /беркайчан да архивка күчерелми/);
assert.match(read('so')['auto-archive-hint'], /waligood lama kaydiyo/);
assert.match(read('tk_TM')['filter-column-age-hint'], /täzeden başlatmaýar/);
assert.match(read('tt')['filter-column-age-hint'], /яңадан башламый/);
assert.match(read('so')['filter-column-age-hint'], /dib uma bilowdo/);
assert.match(read('ku')['auto-archive-hint'], /tu carî nayên arşîvkirin/);
assert.match(read('ckb')['auto-archive-hint'], /هەرگیز ناگوازرێنەوە/);
assert.match(read('ku')['filter-column-age-hint'], /ji nû ve nade destpêkirin/);
assert.match(read('ckb')['filter-column-age-hint'], /لە نوێوە دەست پێ ناکات/);
console.log('Archiving and date filters: 23 messages in 5 locales passed');
