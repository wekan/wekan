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
const keys = ['continuous-backup-encrypt', 'continuous-backup-key-file'];
for (const code of codes) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en).filter(key => Object.hasOwn(locale, key)), `${code}: relative source key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: missing translation`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: English placeholder`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: tokens`);
    if (code === 'ja-HI') {
      assert.match(locale[key], /\p{Script=Hiragana}/u, `${code}:${key}: hiragana prose`);
      assert.doesNotMatch(locale[key], /[\p{Script=Han}\p{Script=Katakana}]/u, `${code}:${key}: no kanji or katakana`);
    }
    if (code === 'sd' || code === 'ug' || code === 'uz-AR') {
      assert.match(locale[key], /\p{Script=Arabic}/u, `${code}:${key}: Arabic script`);
    }
  }
  assert.ok(locale[keys[0]].includes('AES-256-GCM'), `${code}: exact algorithm name`);
  assert.match(locale[keys[1]], /64/, `${code}: hexadecimal key length`);
  assert.match(locale[keys[1]], /16/, `${code}: minimum passphrase length`);
}
assert.match(read('fi')[keys[1]], /kohdehakemiston ulkopuolella.*vähintään 16.*ilman sitä varmuuskopiota ei voi palauttaa/);
assert.match(read('fr')[keys[1]], /hors du répertoire cible.*au moins 16.*sans elle, la sauvegarde ne peut pas être restaurée/);
assert.match(read('es')[keys[1]], /fuera del directorio de destino.*al menos 16.*sin ella no se puede restaurar/);
for (const code of ['kk', 'ky', 'tg', 'mn', 'tt', 'ba']) {
  for (const key of keys) assert.match(read(code)[key], /[\u0400-\u04ff]/u, `${code}:${key}: Cyrillic script`);
}
assert.match(read('mn')[keys[1]], /түлхүүрийн файл.*сэргээх боломжгүй/);
assert.match(read('ba')[keys[1]], /асҡысы.*һаҡлағыҙ/);
console.log(`Backup encryption: ${keys.length} messages in ${codes.length} locale variants passed`);
