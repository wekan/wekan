'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ["cs", "cs-CZ", "hu", "ru", "ru-RU", "ru-UA", "ru_RU", "sk", "uk", "uk-UA", "et-EE", "he", "he-IL", "fa", "fa-IR", "ms", "ms-MY", "sl", "sl_SI", "hr", "sr", "bs", "mk", "bn", "ta", "ne", "ur", "th", "gu-IN", "be", "lt", "lv", "is", "af", "af_ZA", "hi", "hi-IN", "kn", "ga", "co", "sc", "scn", "nap", "an", "ast-ES", "oc", "br", "eu", "cy", "cy-GB", "gd", "csb", "de", "de-AT", "de-CH", "de_DE", "fr", "fr-FR", "fr-BE", "fr-CA", "fr-CH", "es", "es-AR", "es-CL", "es-CO", "es_CO", "es-LA", "es-MX", "es-PE", "es-PY", "pt", "pt-PT", "pt_PT", "pt-BR", "it", "nl", "nl-NL", "sv", "nb", "da", "fi", "pl", "pl-PL", "ro", "ro-RO", "el", "el-GR", "tr", "id", "vi", "vi-VN", "bg", "ja", "ja-JP", "ja-HI", "zh", "zh-CN", "zh-Hans", "zh-GB", "zh_SG", "zh-TW", "zh-HK", "zh-Hant", "ko", "ko-KR", "ar", "ar-DZ", "ar-EG", "ca", "ca@valencia", "ca_ES", "gl", "gl-ES", "eo", "lb", "mt", "sq", "hy", "ka", "az", "az-AZ", "az-LA", "sw", "tl", "la", "cmn", "yue_CN"];
const keys = [
  'scrum-scope-history', 'scrum-scope-history-help',
  'scrum-scope-history-inconsistent', 'scrum-scope-history-truncated',
  'scrum-scope-history-empty', 'scrum-scope-cause-start',
  'scrum-scope-cause-scrum', 'scrum-scope-cause-customFields',
  'scrum-scope-cause-dates', 'scrum-scope-cause-position',
  'scrum-scope-cause-lifecycle',
];
for (const code of codes) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: current key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  // Missing writes and a truncated read explain different kinds of incompleteness.
  assert.notEqual(locale[keys[2]], locale[keys[3]], `${code}: distinct warnings`);
  assert.equal(new Set(keys.slice(5).map(key => locale[key])).size, 6, `${code}: distinct change causes`);
}
// Preserve the missing-History and read-limit meanings, rather than reassuring
// readers that incomplete figures are a faithful account of the sprint.
assert.match(read('de')[keys[2]], /ohne Verlauf.*unvollständig/);
assert.match(read('de')[keys[3]], /Nur die ersten Änderungen.*unvollständig/);
assert.match(read('fr')[keys[2]], /sans historique.*incomplètes/);
assert.match(read('fr')[keys[3]], /Seules les premières modifications.*incomplète/);
assert.match(read('fi')[keys[2]], /ilman historiakirjausta.*puutteellisia/);
assert.match(read('fi')[keys[3]], /Vain ensimmäiset muutokset.*puutteellinen/);
assert.match(read('zh-CN')[keys[2]], /没有记录到历史中.*不完整/);
assert.match(read('zh-CN')[keys[3]], /只能读取最初.*不完整/);
console.log(`Scrum scope history: ${keys.length} messages in ${codes.length} locales passed`);
