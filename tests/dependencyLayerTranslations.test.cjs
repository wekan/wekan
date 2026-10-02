const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', code + '.i18n.json'), 'utf8'));
const english = read('en');
const keys = ["show-my-dependencies", "show-board-dependencies", "my-dependencies", "board-dependencies", "importMemberDependenciesPopup-title", "exportMemberDependenciesPopup-title", "dependencies-open-a-board", "dependencies-board-edit-required", "import-dependencies-merged", "dependency-layer-mine", "dependency-read-only"];
for (const code of ["tig", "chr", "fi", "sv", "de", "de_DE", "de-AT", "de-CH", "fr", "fr-FR", "fr-BE", "fr-CA", "fr-CH", "es", "es-AR", "es-LA", "es-CL", "es_CO", "es-CO", "es-PY", "es-PE", "es-MX", "it", "pt", "pt-PT", "pt_PT", "pt-BR", "nl", "nl-NL", "ru", "ru-RU", "ru-UA", "ru_RU", "uk", "uk-UA", "pl", "pl-PL", "cs", "cs-CZ", "sk", "bg", "el", "el-GR", "ro", "ro-RO", "hu", "da", "nb", "et-EE", "tr", "id", "ms", "ms-MY", "vi", "vi-VN", "ja", "ja-JP", "ko", "ko-KR", "zh-CN", "zh-Hans", "zh", "cmn", "zh_SG", "zh-GB", "zh-TW", "zh-Hant", "zh-HK", "ar", "ar-DZ", "ar-EG", "he", "he-IL", "fa", "fa-IR", "hi", "hi-IN", "bn", "ur", "th", "sl", "sl_SI", "hr", "sr", "bs", "mk", "lt", "lv", "be", "ca", "ca_ES", "ca@valencia", "gl", "gl-ES", "eu", "af", "af_ZA", "kk", "az", "az-AZ", "az-LA", "hy", "ka", "mr", "ne", "pa", "si", "ta", "te-IN", "kn", "ml", "gu-IN", "sq", "sw", "tl", "eo", "is", "lb", "mt", "mn", "ky", "tg", "uz", "uz-LA", "uz-UZ", "ht", "la", "co", "oc", "so", "mg", "jv", "pap", "an", "ast-ES", "sc", "scn", "cy", "ga", "gd", "fo", "br", "fy", "fy-NL", "fur", "rm", "cy-GB", "ja-HI", "km", "km-KH", "km_KH", "my", "ps", "sd", "or_IN", "tt", "ba", "ku", "tk_TM", "ckb", "ug", "am", "as", "ha", "ig", "ny", "rw", "zu", "zu-ZA", "xh", "sn", "st", "tn", "ss", "ts", "nso", "yue_CN", "wuu-Hans", "yi", "ary", "bho", "mai", "kok", "mi", "sm", "tpi", "bi", "csb", "hsb", "szl", "nap", "haw", "fj", "to", "wa", "vl-SS", "wa-RR", "yo", "lg", "om", "rn", "ak", "bm", "wo", "nd", "ve", "uz-AR", "ace", "rup", "lld", "ve-CC", "ve-PP", "se", "bua", "sah", "cv", "kw", "gv", "bo", "dz", "qu", "ay", "ti", "gn", "ks", "ee", "ff", "tlh", "vo", "kl", "nah", "iu", "zgh", "wal"]) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), code + ': key order');
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), code + ':' + key);
    assert.notEqual(locale[key], english[key], code + ':' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), code + ':' + key);
  }
  assert.notEqual(locale['my-dependencies'], locale['board-dependencies']);
  assert.notEqual(locale['show-my-dependencies'], locale['show-board-dependencies']);
  assert.notEqual(locale['importMemberDependenciesPopup-title'], locale['exportMemberDependenciesPopup-title']);
}
console.log('Dependency layer translations: keys, tokens and distinct actions passed');

// English regional variants keep source prose while retaining the complete key set.
for (const code of ["en-BR", "en-DE", "en-GB", "en-IT", "en-MY", "en-YS", "en_AU", "en_ID", "en_SG", "en_TR", "en_ZA"]) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), code + ": key order");
  for (const key of keys) {
    assert.equal(locale[key], english[key], code + ":" + key);
  }
}

// Cherokee keeps the locale's dependency terminology and distinct ownership.
// Possessive reference: https://ebcikpep.com/wp-content/uploads/2019/05/ClothesVocabulary052919.pdf
// The composed technical prose still needs native-speaker review.
{
  const locale = read('chr');
  for (const key of keys) {
    assert.match(locale[key], /[\u13A0-\u13FF]/, key);
    assert.doesNotMatch(locale[key].replace(/__[A-Za-z]+__/g, ''), /[A-Za-z]/, key);
  }
  assert.match(locale['my-dependencies'], /ᎠᏆᏤᎵ/);
  assert.match(locale['board-dependencies'], /ᎦᏍᎩᎸ/);
  assert.match(locale['dependency-layer-mine'], /ᏂᎯ Ꮙ/);
  assert.match(locale['dependency-read-only'], /Ꮭ/);
}

// Tigre: preserve tokens and ownership/action distinctions, with no Tigrinya
// connective/negation substitutions in this batch. Vocabulary and grammar:
// Elias, The Tigre Language of Ginda, sections 3.2, 3.5, 4.6.8, 4.18;
// Beurmann, Vocabulary of the Tigre Language, causative "show" and "open".
// These checks do not establish fluency; technical wording is low confidence.
{
  const locale = read('tig');
  for (const key of keys) {
    assert.match(locale[key], /[\u1200-\u137F]/, key);
    assert.doesNotMatch(locale[key], /ጥራይ|ክኽእል|ይኽእል|ኣይተመሳሰለን/, key);
  }
  assert.match(locale['my-dependencies'], /ናይዬ/);
  assert.match(locale['board-dependencies'], /ናይ ምዱድ/);
  assert.match(locale['dependency-layer-mine'], /እንተ በስ/);
  assert.match(locale['dependency-read-only'], /ኢቀድር/);
}
