'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const codes = fs.readdirSync(path.join(__dirname, '../imports/i18n/data'))
  .filter(file => file.endsWith('.i18n.json'))
  .map(file => file.slice(0, -'.i18n.json'.length))
  .filter(code => !/^en(?:[-_]|$)/.test(code));
assert.ok(codes.length > 0, 'locale catalogs must be present');
const keys = ['upload', 'upload-none', 'upload-prefix', 'fetch', 'fetched', 'apply-on-restart'].map(key => `continuous-backup-${key}`);
for (const code of codes) {
  const locale = read(code);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: missing translation`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: English placeholder`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: source tokens`);
    if (code === 'ja-HI') {
      assert.match(locale[key], /\p{Script=Hiragana}/u, `${code}:${key}: hiragana prose`);
      assert.doesNotMatch(locale[key], /[\p{Script=Han}\p{Script=Katakana}]/u, `${code}:${key}: no kanji or katakana`);
    }
    if (code === 'sd' || code === 'ug' || code === 'uz-AR') {
      assert.match(locale[key], /\p{Script=Arabic}/u, `${code}:${key}: Arabic script`);
    }
  }
  assert.ok(locale[keys[5]].includes('SQLite'), `${code}: exact rebuilt database name`);
  assert.notEqual(locale[keys[3]], locale[keys[4]], `${code}: fetch action and completed result differ`);
  assert.notEqual(locale[keys[0]], locale[keys[1]], `${code}: upload destination and local-only option differ`);
}
assert.match(read('fi')[keys[1]], /Ei mihinkään.*vain kohdehakemisto/);
assert.match(read('fr')[keys[1]], /Nulle part.*répertoire cible uniquement/);
assert.match(read('es')[keys[1]], /Ningún sitio.*solo el directorio de destino/);
console.log(`Backup cloud: ${keys.length} messages in ${codes.length} locale variants passed`);
