// Login-setting translation coverage grows as each language is reviewed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
const english = read('en');
const keys = ['header-login', 'login-setting-clear-secret', 'login-setting-after-restart'];
const locales = ["af", "af_ZA", "ar", "ar-DZ", "ar-EG", "az", "az-AZ", "az-LA", "be", "bg", "bn", "bs", "ca", "ca_ES", "cmn", "cs", "cs-CZ", "cy", "cy-GB", "da", "de", "de-AT", "de-CH", "de_DE", "el", "el-GR", "eo", "es", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "es_CO", "et-EE", "eu", "fa", "fa-IR", "fi", "fr", "fr-BE", "fr-CA", "fr-CH", "fr-FR", "gl", "gl-ES", "gu-IN", "ha", "he", "he-IL", "hi", "hi-IN", "hr", "hu", "hy", "id", "is", "it", "ja", "ja-HI", "ja-JP", "ka", "kk", "km", "km-KH", "km_KH", "kn", "ko", "ko-KR", "ky", "lt", "lv", "mk", "ml", "mn", "mr", "ms", "ms-MY", "mt", "my", "nb", "ne", "nl", "nl-NL", "pa", "pl", "pl-PL", "ps", "pt", "pt-BR", "pt-PT", "pt_PT", "ro", "ro-RO", "ru", "ru-RU", "ru-UA", "ru_RU", "sd", "si", "sk", "sl", "sl_SI", "so", "sq", "sr", "sv", "sw", "ta", "te-IN", "tg", "th", "tl", "tr", "ug", "uk", "uk-UA", "ur", "uz", "uz-LA", "uz-UZ", "vi", "vi-VN", "zh", "zh-CN", "zh-GB", "zh-HK", "zh-Hans", "zh-Hant", "zh-TW", "zh_SG"];
for (const code of locales) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: translation exists`);
    assert.notEqual(locale[key], english[key], `${code}:${key}: no English fallback`);
  }
  assert.match(locale['header-login'], /HTTP/, `${code}: header means HTTP authentication`);
  assert.match(locale['login-setting-after-restart'], /WeKan/, `${code}: retain product name`);
  for (const key of Object.keys(english)) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: exact placeholders`);
  }
}
assert.match(read('fi')['login-setting-clear-secret'], /hallintapaneeliin/);
assert.match(read('ar')['login-setting-clear-secret'], /لوحة التحكم/);
assert.match(read('ja')['login-setting-after-restart'], /再起動後/);
const menu = fs.readFileSync(path.join(root, 'client/components/settings/peopleBody.js'), 'utf8');
assert.match(menu, /id: 'header-login-setting'[^}]*labelKey: 'header-login'/);
const form = fs.readFileSync(path.join(root, 'client/components/settings/authProviderSettings.jade'), 'utf8');
for (const key of keys.slice(1)) assert.ok(form.includes(`{{_ '${key}'}}`), `${key}: rendered by the provider form`);
console.log(`adminLoginTranslations: ${locales.length} locales passed`);
