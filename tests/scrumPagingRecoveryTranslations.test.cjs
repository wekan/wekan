// Paging and import recovery are distinct actions; do not lose the count token.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ["af", "af_ZA", "am", "an", "ar", "ar-DZ", "ar-EG", "ary", "as", "ast-ES", "az", "az-AZ", "az-LA", "be", "bg", "bho", "bi", "bn", "br", "bs", "ca", "ca@valencia", "ca_ES", "ckb", "cmn", "co", "cs", "cs-CZ", "csb", "cy", "cy-GB", "da", "de", "de-AT", "de-CH", "de_DE", "el", "el-GR", "eo", "es", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "es_CO", "et-EE", "eu", "fa", "fa-IR", "fi", "fj", "fo", "fr", "fr-BE", "fr-CA", "fr-CH", "fr-FR", "fur", "fy", "fy-NL", "ga", "gd", "gl", "gl-ES", "gu-IN", "ha", "haw", "he", "he-IL", "hi", "hi-IN", "hr", "ht", "hu", "hy", "id", "ig", "is", "it", "ja", "ja-HI", "ja-JP", "jv", "ka", "kk", "km", "km-KH", "km_KH", "kn", "ko", "ko-KR", "kok", "ku", "ky", "la", "lb", "lt", "lv", "mai", "mg", "mi", "mk", "ml", "mn", "mr", "ms", "ms-MY", "mt", "my", "nap", "nb", "ne", "nl", "nl-NL", "ny", "oc", "or_IN", "pa", "pap", "pl", "pl-PL", "ps", "pt", "pt-BR", "pt-PT", "pt_PT", "rm", "ro", "ro-RO", "ru", "ru-RU", "ru-UA", "ru_RU", "rw", "sc", "scn", "sd", "si", "sk", "sl", "sl_SI", "sm", "sn", "so", "sq", "sr", "sv", "sw", "ta", "te-IN", "tg", "th", "tk_TM", "tl", "to", "tpi", "tr", "tt", "ug", "uk", "uk-UA", "ur", "uz", "uz-LA", "uz-UZ", "vi", "vi-VN", "vl-SS", "wa-RR", "wuu-Hans", "xh", "yi", "yo", "yue_CN", "zh", "zh-CN", "zh-GB", "zh-HK", "zh-Hans", "zh-Hant", "zh-TW", "zh_SG", "zu", "zu-ZA"];
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
  ary: 'Arabic', 'wuu-Hans': 'Han', yue_CN: 'Han', bho: 'Devanagari', mai: 'Devanagari', kok: 'Devanagari',
  hy: 'Armenian', ka: 'Georgian', am: 'Ethiopic', ml: 'Malayalam', mr: 'Devanagari', pa: 'Gurmukhi', 'te-IN': 'Telugu', or_IN: 'Oriya', si: 'Sinhala', my: 'Myanmar', km: 'Khmer', 'km-KH': 'Khmer', km_KH: 'Khmer', mn: 'Cyrillic',
  kk: 'Cyrillic', ky: 'Cyrillic', tg: 'Cyrillic', tt: 'Cyrillic', ps: 'Arabic', sd: 'Arabic', ug: 'Arabic', ckb: 'Arabic', yi: 'Hebrew', as: 'Bengali',
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
assert.match(read('haw')[keys[1]], /Hoʻopau/);
assert.match(read('haw')[keys[2]], /Hoʻōki/);
assert.match(read('zu')[keys[3]], /uhlelo lokungenisa.*kuphela.*akushintshi lutho/);
assert.match(read('ary')[keys[3]], /غير نلغيوه.*ما كيبدّل والو/);
assert.match(read('wuu-Hans')[keys[3]], /呒没.*只好放弃.*勿会改动/);
assert.match(read('rm')[keys[3]], /avià danovamain.*mo vegnir rebuttà.*na mida nagut/);
assert.doesNotMatch(read('rm')[keys[3]], /reaviada/);
assert.match(read('fo')[keys[3]], /byrjaði av nýggjum.*bara til at sleppa.*broytir einki/);
assert.doesNotMatch(read('fo')[keys[3]], /endurræsing/);
assert.match(read('mn')[keys[3]], /зөвхөн цуцлах.*юу ч өөрчлөхгүй/);
assert.match(read('uz')[keys[3]], /faqat bekor.*hech narsani o‘zgartirmaydi/);
assert.match(read('sw')[keys[3]], /tu kughairiwa.*halibadilishi chochote/);
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
