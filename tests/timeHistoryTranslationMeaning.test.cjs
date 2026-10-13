'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const groups = require('./timeHistoryTranslationMeanings.json');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`)));
const source = read('en');
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json')));
const key = 'time-adjustment-note';
let count = 0;
for (const { locales, meanings } of groups) {
  assert.equal(meanings.length, 4, 'editor grouping, not sessions, negative corrections, no earlier attribution');
  for (const code of locales) {
    const text = read(code)[key];
    if (/^en(?:[-_]|$)/.test(code)) assert.equal(text, source[key], code);
    else assert.notEqual(text, source[key], code);
    assert.doesNotMatch(text, /(?:^|\s)Δ(?:\s|$)|≠/, `${code}: shorthand is not the explanation`);
    if (code === 'ja-HI') assert.doesNotMatch(text, /[\p{Script=Han}\p{Script=Katakana}]/u, 'Hiragana locale uses its declared script');
    for (const meaning of meanings) assert.ok(text.includes(meaning), `${code}: missing ${meaning}`);
    const repair = ledger.filter(row => row.locale === code && row.key === key).at(-1);
    assert.equal(repair.after, text, code);
    assert.match(repair.before, /Δ/, 'this batch repairs the abbreviated source, not newer wording');
    for (const meaning of meanings) assert.ok(!repair.before.includes(meaning), `${code}: regression fixture must expose the previous omission`);
    count++;
  }
}
assert.equal(new Set(groups.flatMap(row => row.locales)).size, count, 'each catalog tested once');
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  for (const code of groups.flatMap(row => row.locales)) assert.deepEqual(translationTokens(read(code)[key]), translationTokens(source[key]), code);
  console.log(`${count} time-history explanations retain all four source distinctions`);
})().catch(error => { console.error(error); process.exitCode = 1; });
