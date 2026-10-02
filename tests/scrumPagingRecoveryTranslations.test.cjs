// Paging and import recovery are distinct actions; do not lose the count token.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ["af", "af_ZA", "an", "ar", "ar-DZ", "ar-EG", "ast-ES", "be", "bg", "bn", "br", "bs", "ca", "ca@valencia", "ca_ES", "cmn", "co", "cs", "cs-CZ", "csb", "cy", "cy-GB", "da", "de", "de-AT", "de-CH", "de_DE", "el", "el-GR", "eo", "es", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "es_CO", "et-EE", "eu", "fa", "fa-IR", "fi", "fr", "fr-BE", "fr-CA", "fr-CH", "fr-FR", "ga", "gd", "gl", "gl-ES", "gu-IN", "he", "he-IL", "hi", "hi-IN", "hr", "hu", "id", "is", "it", "ja", "ja-HI", "ja-JP", "kn", "ko", "ko-KR", "lt", "lv", "mk", "ms", "ms-MY", "nap", "nb", "ne", "nl", "nl-NL", "oc", "pl", "pl-PL", "pt", "pt-BR", "pt-PT", "pt_PT", "ro", "ro-RO", "ru", "ru-RU", "ru-UA", "ru_RU", "sc", "scn", "sk", "sl", "sl_SI", "sr", "sv", "ta", "th", "tr", "uk", "uk-UA", "ur", "vi", "vi-VN", "vl-SS", "zh", "zh-CN", "zh-GB", "zh-HK", "zh-Hans", "zh-Hant", "zh-TW", "zh_SG"];
const keys = ["scrum-show-more", "scrum-import-resume", "scrum-import-discard", "scrum-import-recovery-hint"];
for (const code of codes) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.notEqual(locale[keys[1]], locale[keys[2]], `${code}: finish and discard are distinct actions`);
}
const scripts = {
  fa: 'Arabic', 'fa-IR': 'Arabic', ur: 'Arabic', ar: 'Arabic', 'ar-DZ': 'Arabic', 'ar-EG': 'Arabic',
  he: 'Hebrew', 'he-IL': 'Hebrew',
  sr: 'Cyrillic', mk: 'Cyrillic', be: 'Cyrillic', ru: 'Cyrillic', 'ru-RU': 'Cyrillic', 'ru-UA': 'Cyrillic', ru_RU: 'Cyrillic', uk: 'Cyrillic', 'uk-UA': 'Cyrillic', bg: 'Cyrillic',
  hi: 'Devanagari', 'hi-IN': 'Devanagari', ne: 'Devanagari', bn: 'Bengali', ta: 'Tamil', 'gu-IN': 'Gujarati', kn: 'Kannada', th: 'Thai',
  ko: 'Hangul', 'ko-KR': 'Hangul', zh: 'Han', 'zh-CN': 'Han', 'zh-TW': 'Han', 'zh-HK': 'Han', 'zh-Hans': 'Han', 'zh-Hant': 'Han', 'zh-GB': 'Han', zh_SG: 'Han', cmn: 'Han',
};
for (const [code, script] of Object.entries(scripts)) {
  for (const key of keys) {
    const prose = read(code)[key].replace('__count__', '');
    assert.match(prose, new RegExp(`\\p{Script=${script}}`, 'u'), `${code}:${key}: native script`);
    assert.doesNotMatch(prose, /[A-Za-z]/, `${code}:${key}: unexpected Latin text`);
  }
}
assert.match(read('de')[keys[3]], /nur verworfen.*ändert sich nichts/);
assert.match(read('fr')[keys[3]], /uniquement être abandonnée.*ne modifie rien/);
assert.match(read('ja')[keys[3]], /破棄のみ可能.*変わりません/);
assert.match(read('fa')[keys[3]], /فقط.*لغو.*چیزی.*تغییر نمی‌دهد/);
assert.match(read('ms')[keys[3]], /hanya boleh dibatalkan.*tidak mengubah/);
assert.match(read('hr')[keys[3]], /samo odbaciti.*ništa ne mijenja/);
assert.match(read('hi')[keys[3]], /केवल रद्द.*कुछ नहीं बदलता/);
assert.match(read('eu')[keys[3]], /baztertu besterik.*ez du ezer aldatzen/);
assert.match(read('oc')[keys[3]], /reaviada/);
assert.doesNotMatch(read('oc')[keys[3]], /redémarrage/);
console.log(`Scrum paging and import recovery: ${keys.length} messages in ${codes.length} locales passed`);
