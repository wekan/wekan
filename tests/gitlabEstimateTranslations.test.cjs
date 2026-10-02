'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ["cs", "cs-CZ", "hu", "ru", "ru-RU", "ru-UA", "ru_RU", "sk", "uk", "uk-UA", "et-EE", "he", "he-IL", "fa", "fa-IR", "ms", "ms-MY", "sl", "sl_SI", "hr", "sr", "bs", "mk", "bn", "ta", "ne", "ur", "th", "gu-IN", "be", "lt", "lv", "is", "af", "af_ZA", "hi", "hi-IN", "kn", "ga", "co", "sc", "scn", "nap", "an", "ast-ES", "oc", "br", "eu", "cy", "cy-GB", "gd", "csb"];
const keys = ['sync-estimate-source', 'sync-estimate-source-weight', 'sync-estimate-source-time', 'sync-estimate-field-gitlab', 'sync-estimate-field-gitlab-hint'];
for (const code of codes) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: current key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.notEqual(locale[keys[1]], locale[keys[2]], `${code}: points and hours remain distinct`);
}
// Absence of weight clears the mapped value, unlike an ignored missing Jira field.
assert.match(read('cs')[keys[4]], /bez váhy vymaže/);
assert.match(read('hu')[keys[4]], /súly nélküli feladat törli/);
assert.match(read('ru')[keys[4]], /без веса очищает/);
assert.match(read('sk')[keys[4]], /bez váhy vymaže/);
assert.match(read('uk')[keys[4]], /без ваги очищує/);
assert.match(read('et-EE')[keys[4]], /kaaluta ülesanne tühjendab/);
assert.match(read('he')[keys[4]], /ללא משקל מנקה/);
console.log(`GitLab estimate translations: ${keys.length} messages in ${codes.length} locales passed`);
