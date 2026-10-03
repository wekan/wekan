'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const codes = ["fi", "sv", "da", "nb", "de", "fr", "es", "pt", "pt-BR", "it", "nl", "pl", "cs", "sk", "sl", "hr", "ro", "hu", "bg", "uk", "ru", "lv", "lt", "et-EE", "el", "tr", "ja", "ko", "zh-Hans", "zh-Hant", "id", "ms", "vi", "ar", "he", "fa", "ur", "hi", "bn", "ca", "gl", "eu", "af", "sw", "bs", "sr", "mk", "is", "eo", "sq", "th", "tl", "be", "az", "ka", "hy", "de-AT", "de-CH", "de_DE", "fr-BE", "fr-CA", "fr-CH", "fr-FR", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "es_CO", "pt-PT", "pt_PT", "nl-NL", "vl-SS", "pl-PL", "cs-CZ", "sl_SI", "ro-RO", "uk-UA", "ru-RU", "ru_RU", "ru-UA", "el-GR", "ja-JP", "ko-KR", "cmn", "zh", "zh-CN", "zh-GB", "zh_SG", "zh-TW", "zh-HK", "ms-MY", "vi-VN", "ar-DZ", "ar-EG", "he-IL", "fa-IR", "hi-IN", "ca_ES", "ca@valencia", "gl-ES", "af_ZA", "az-AZ", "az-LA"];
codes.push('ga', 'cy', 'cy-GB', 'lb', 'mt', 'fo', 'fy', 'fy-NL', 'oc', 'ast-ES', 'an', 'co', 'scn', 'sc');
codes.push('uz', 'uz-UZ', 'uz-LA', 'kk', 'ky', 'tg', 'mn', 'tk_TM', 'tt', 'ba');
codes.push('ne', 'mr');
codes.push('ta', 'te-IN');
const keys = ['continuous-backup-encrypt', 'continuous-backup-key-file'];
for (const code of codes) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en).filter(key => Object.hasOwn(locale, key)), `${code}: relative source key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: missing translation`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: English placeholder`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: tokens`);
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
