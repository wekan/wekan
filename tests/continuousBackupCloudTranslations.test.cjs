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
codes.push('gu-IN', 'kn');
codes.push('ml', 'pa');
codes.push('si', 'as');
codes.push('ht', 'so');
codes.push('jv', 'mg');
codes.push('ha');
codes.push('yo');
const keys = ['upload', 'upload-none', 'upload-prefix', 'fetch', 'fetched'].map(key => `continuous-backup-${key}`);
for (const code of codes) {
  const locale = read(code);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: missing translation`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: English placeholder`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: source tokens`);
  }
  assert.notEqual(locale[keys[3]], locale[keys[4]], `${code}: fetch action and completed result differ`);
  assert.notEqual(locale[keys[0]], locale[keys[1]], `${code}: upload destination and local-only option differ`);
}
assert.match(read('fi')[keys[1]], /Ei mihinkään.*vain kohdehakemisto/);
assert.match(read('fr')[keys[1]], /Nulle part.*répertoire cible uniquement/);
assert.match(read('es')[keys[1]], /Ningún sitio.*solo el directorio de destino/);
console.log(`Backup cloud: ${keys.length} messages in ${codes.length} locale variants passed`);
