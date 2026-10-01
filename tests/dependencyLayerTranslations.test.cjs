const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', code + '.i18n.json'), 'utf8'));
const english = read('en');
const keys = ["show-my-dependencies", "show-board-dependencies", "my-dependencies", "board-dependencies", "importMemberDependenciesPopup-title", "exportMemberDependenciesPopup-title", "dependencies-open-a-board", "dependencies-board-edit-required", "import-dependencies-merged", "dependency-layer-mine", "dependency-read-only"];
for (const code of ["fi", "sv", "de", "de_DE", "de-AT", "de-CH", "fr", "fr-FR", "fr-BE", "fr-CA", "fr-CH", "es", "es-AR", "es-LA", "es-CL", "es_CO", "es-CO", "es-PY", "es-PE", "es-MX", "it", "pt", "pt-PT", "pt_PT", "pt-BR", "nl", "nl-NL", "ru", "ru-RU", "ru-UA", "ru_RU", "uk", "uk-UA", "pl", "pl-PL", "cs", "cs-CZ", "sk", "bg", "el", "el-GR", "ro", "ro-RO", "hu", "da", "nb", "et-EE", "tr", "id", "ms", "ms-MY", "vi", "vi-VN", "ja", "ja-JP", "ko", "ko-KR", "zh-CN", "zh-Hans", "zh", "cmn", "zh_SG", "zh-GB", "zh-TW", "zh-Hant", "zh-HK", "ar", "ar-DZ", "ar-EG", "he", "he-IL", "fa", "fa-IR", "hi", "hi-IN", "bn", "ur", "th", "sl", "sl_SI", "hr", "sr", "bs", "mk", "lt", "lv", "be", "ca", "ca_ES", "ca@valencia", "gl", "gl-ES", "eu", "af", "af_ZA", "kk", "az", "az-AZ", "az-LA", "hy", "ka", "mr", "ne", "pa", "si", "ta", "te-IN", "kn", "ml", "gu-IN", "sq", "sw", "tl", "eo", "is", "lb", "mt", "mn", "ky", "tg", "uz", "uz-LA", "uz-UZ", "ht", "la", "co", "oc", "so", "mg", "jv", "pap"]) {
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
