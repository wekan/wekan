'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const codes = ["fi", "sv", "da", "nb", "de", "fr", "es", "pt", "pt-BR", "it", "nl", "pl", "cs", "sk", "sl", "hr", "ro", "hu", "bg", "uk", "ru", "de-AT", "de-CH", "de_DE", "fr-BE", "fr-CA", "fr-CH", "fr-FR", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "es_CO", "pt-PT", "pt_PT", "nl-NL", "vl-SS", "pl-PL", "cs-CZ", "sl_SI", "ro-RO", "uk-UA", "ru_RU", "ru-UA", "ru-RU"];
codes.push(...["lv", "lt", "et-EE", "el", "ja", "ko", "zh-Hans", "zh-Hant", "id", "ms", "vi", "ar", "he", "fa", "ur", "hi", "bn", "ca", "gl", "eu", "af", "sw", "bs", "sr", "mk", "is", "eo", "sq", "th", "tl", "be", "az", "ka", "hy", "tr", "el-GR", "ja-JP", "ko-KR", "cmn", "zh", "zh-CN", "zh-GB", "zh_SG", "zh-TW", "zh-HK", "ms-MY", "vi-VN", "ar-DZ", "ar-EG", "he-IL", "fa-IR", "hi-IN", "ca_ES", "ca@valencia", "gl-ES", "af_ZA", "az-AZ", "az-LA"]);
codes.push(...["uz", "kk", "ky", "mn", "tg", "tk_TM", "tt", "ba", "uz-UZ", "uz-LA"]);
codes.push(...["ne", "mr", "ta", "te-IN", "gu-IN", "kn", "ml", "pa", "si", "as", "or_IN", "sd"]);
codes.push(...["ga", "cy", "lb", "mt", "fo", "fy", "rm", "la", "cy-GB", "fy-NL"]);
codes.push(...["my", "km", "jv", "ht", "oc", "ast-ES", "an", "yi", "ku", "ckb", "ps", "km_KH", "km-KH"]);
const keys = ['scrum-rollover-progress', 'scrum-history-job-running', 'scrum-history-job-failed'];
for (const code of codes) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en).filter(key => Object.hasOwn(locale, key)), `${code}: source key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: missing translation`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: English placeholder`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: exact source tokens`);
  }
  assert.notEqual(locale[keys[0]], locale[keys[1]], `${code}: card rollover and history progress must differ`);
  assert.notEqual(locale[keys[1]], locale[keys[2]], `${code}: progress and stopped-job instruction must differ`);
}
console.log(`Scrum background jobs: ${keys.length} messages in ${codes.length} locale variants passed`);
