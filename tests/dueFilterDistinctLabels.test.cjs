'use strict';
// #6887: in German the filter sidebar's "Due next week" option said "Diese
// Woche fällig", the same as "Due this week", so the two options that return
// different cards could not be told apart. The same copy sat in de-AT, de_DE,
// de-CH, lb, sv and ts, and in ak "Due today" and "Due next week" were both
// "search this".
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');

const dir = path.join(__dirname, '../imports/i18n/data');
const read = code => JSON.parse(fs.readFileSync(path.join(dir, `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = Object.keys(en).filter(key => key.startsWith('filter-due-'));
assert.ok(keys.includes('filter-due-this-week') && keys.includes('filter-due-next-week'), 'the due filter keys exist');

// Positive: the German labels say which week.
for (const [code, thisWeek, nextWeek] of [
  ['de', 'Diese Woche fällig', 'Nächste Woche fällig'],
  ['de-AT', 'Diese Woche fällig', 'Nächste Woche fällig'],
  ['de_DE', 'Diese Woche fällig', 'Nächste Woche fällig'],
  ['de-CH', 'diese Woche fällig', 'nächste Woche fällig'],
]) {
  const locale = read(code);
  assert.equal(locale['filter-due-this-week'], thisWeek, `${code}: this week`);
  assert.equal(locale['filter-due-next-week'], nextWeek, `${code}: next week`);
}
assert.equal(read('sv')['filter-due-next-week'], 'Förfaller nästa vecka', 'sv: next week');

// Negative: in no language do two due-date options share one label.
const locales = fs.readdirSync(dir).filter(file => file.endsWith('.i18n.json')).map(file => file.replace('.i18n.json', ''));
for (const code of locales) {
  const locale = read(code);
  const seen = new Map();
  for (const key of keys) {
    const value = locale[key];
    if (!value) continue;
    assert.deepEqual(translationTokens(value), translationTokens(en[key]), `${code}:${key}: exact placeholders`);
    assert.ok(!seen.has(value), `${code}: ${key} and ${seen.get(value)} are both ${JSON.stringify(value)}`);
    seen.set(value, key);
  }
}
console.log(`due filter labels distinct in ${locales.length} locales`);
