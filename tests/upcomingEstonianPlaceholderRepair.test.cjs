'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const translated = read('et-EE');
// URL percent encoding is data, not a printf placeholder.
const { translationTokens: inventory } = require('../releases/translations/placeholder-tokens.mjs');
for (const [key, source] of Object.entries(english)) {
  assert.deepStrictEqual(inventory(translated[key] || ''), inventory(source),
    `et-EE:${key} changed a placeholder`);
}
const values = Object.values(translated).join('\n');
assert.doesNotMatch(values, /__(?:manus|kaart|kaardile|loend|nimekiri|laud|tahvel|kutsuja|kasutaja|loe|algus|lõpp|predikaat_)/);
const emailKeys = Object.keys(english).filter(key =>
  /^rule-email-(recovery|resolution|legacy)-/.test(key) || key === 'r-insert-variable');
assert.ok(emailKeys.length >= 55);
for (const key of emailKeys) {
  assert.ok(translated[key]?.trim(), `${key}: missing Estonian text`);
  assert.notStrictEqual(translated[key], english[key], `${key}: English placeholder`);
}
assert.match(translated['rule-email-recovery-resend-confirm'], /kaks korda/);
assert.match(translated['rule-email-legacy-discard-confirm'], /ei saadeta kunagi/);
assert.match(translated['rule-email-legacy-description'], /autoril on endiselt juurdepääs/);
assert.match(translated['rule-email-recovery-actions-hint'], /ei saada.*kunagi ise uuesti/);
console.log('upcomingEstonianPlaceholderRepair: placeholders and email recovery translations passed');
