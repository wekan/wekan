'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
const source = read('en');
const keys = ['notification-delivery-daily-time', 'notification-delivery-quiet-to'];
assert.deepEqual(keys.map(key => source[key]), ['At', 'To']);
const locales = ["af", "af_ZA", "am", "ar-DZ", "ar-EG", "ar", "az-AZ", "az-LA", "az", "be", "bg", "bn", "bs", "ca", "ca@valencia", "ca_ES", "cmn", "cs-CZ", "cs", "cy-GB", "cy", "da", "de-AT", "de-CH", "de", "de_DE", "el-GR", "el", "eo", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "es", "es_CO", "et-EE", "eu", "fa-IR", "fa", "fi", "fo", "fr-BE", "fr-CA", "fr-CH", "fr-FR", "fr", "fy-NL", "fy", "ga", "gd", "gl-ES", "gl", "gu-IN", "ha", "he-IL", "he", "hi-IN", "hi", "hr", "ht", "hu", "hy", "id", "is", "it", "ja-HI", "ja-JP", "ja", "jv", "ka", "kk", "km-KH", "km", "km_KH", "kn", "ko-KR", "ko", "ku", "ky", "la", "lb", "lv", "mg", "mi", "mk", "ml", "mn", "mr", "ms-MY", "ms", "mt", "my", "nb", "ne", "nl-NL", "nl", "or_IN", "pa", "pl-PL", "pl", "ps", "pt-BR", "pt-PT", "pt", "pt_PT", "ro-RO", "ro", "ru-RU", "ru-UA", "ru", "ru_RU", "sd", "si", "sk", "sl", "sl_SI", "sn", "so", "sq", "sr", "sv", "sw", "ta", "te-IN", "tg", "th", "tk_TM", "tl", "tr", "tt", "ug", "uk-UA", "uk", "ur", "uz-LA", "uz-UZ", "uz", "vi-VN", "vi", "yue_CN", "zh-CN", "zh-GB", "zh-HK", "zh-Hans", "zh-Hant", "zh-TW", "zh", "zh_SG"];
for (const code of locales) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(source), `${code}: key order`);
  for (const key of keys) {
    assert.ok(locale[key].trim(), `${code}/${key}: nonempty`);
    assert.notEqual(locale[key], source[key], `${code}/${key}: no English placeholder`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), `${code}/${key}: exact tokens`);
  }
}
// The second label is the end of a time range, not a message recipient.
for (const [code, expected] of Object.entries({
  fi: ['Kello', 'Asti'], de: ['Um', 'Bis'], fr: ['À', 'Jusqu’à'],
  ar: ['الساعة', 'إلى'], ja: ['送信時刻', '終了時刻'],
  ko: ['전송 시각', '종료 시각'], ru: ['В', 'До'],
  tr: ['Saat', 'Bitiş'], uk: ['О', 'До'],
  ka: ['საათი', 'დასრულების დრო'], ug: ['سائەت', 'ئاخىرلىشىش ۋاقتى'],
  'zh-Hant': ['傳送時間', '結束時間'],
})) assert.deepEqual(keys.map(key => read(code)[key]), expected, code);
for (const file of fs.readdirSync(path.join(root, 'imports/i18n/data'))) {
  const code = file.replace(/\.i18n\.json$/, '');
  if (!/^en(?:[-_]|$)/.test(code)) continue;
  assert.deepEqual(keys.map(key => read(code)[key]), keys.map(key => source[key]), `${code}: English by design`);
}
const template = fs.readFileSync(path.join(root, 'client/components/settings/notificationDeliverySettings.jade'), 'utf8');
assert.match(template, /notification-delivery-daily-time[^\n]*\n[^\n]*data-key="dailyTime"/);
assert.match(template, /notification-delivery-quiet-to[^\n]*\n[^\n]*data-key="quietEnd"/);
assert.doesNotMatch(template, /notification-delivery-quiet-to[^\n]*\n[^\n]*data-key="quietStart"/);
console.log(`${locales.length} locale paths: send-time/quiet-end labels, source tokens and English variants pass.`);
