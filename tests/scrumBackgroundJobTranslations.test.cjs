'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
// Discover every catalog so newly registered languages cannot escape this check.
const codes = fs.readdirSync(path.join(__dirname, '../imports/i18n/data'))
  .filter(file => file.endsWith('.i18n.json'))
  .map(file => file.slice(0, -'.i18n.json'.length))
  .filter(code => !/^en(?:[-_]|$)/.test(code));
assert.ok(codes.length > 0, 'locale catalogs must be present');
const scripts = {
  chr: /\p{Script=Cherokee}/u,
  iu: /\p{Script=Canadian_Aboriginal}/u,
  tig: /\p{Script=Ethiopic}/u,
  zgh: /\p{Script=Tifinagh}/u,
};
const keys = ['scrum-rollover-progress', 'scrum-history-job-running', 'scrum-history-job-failed'];
for (const code of codes) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en).filter(key => Object.hasOwn(locale, key)), `${code}: source key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: missing translation`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: English placeholder`);
    if (scripts[code]) {
      const prose = locale[key].replace(/__[A-Za-z0-9_]+__/g, '');
      assert.ok(scripts[code].test(prose), `${code}:${key}: declared locale script`);
      assert.ok(!/[A-Za-z]/.test(prose), `${code}:${key}: no English prose or romanization`);
    }
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: exact source tokens`);
  }
  assert.notEqual(locale[keys[0]], locale[keys[1]], `${code}: card rollover and history progress must differ`);
  assert.notEqual(locale[keys[1]], locale[keys[2]], `${code}: progress and stopped-job instruction must differ`);
}
console.log(`Scrum background jobs: ${keys.length} messages in ${codes.length} locale variants passed`);
