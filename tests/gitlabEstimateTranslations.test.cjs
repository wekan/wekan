'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ["cs", "cs-CZ", "hu", "ru", "ru-RU", "ru-UA", "ru_RU", "sk", "uk", "uk-UA", "et-EE", "he", "he-IL", "fa", "fa-IR", "ms", "ms-MY", "sl", "sl_SI", "hr", "sr", "bs", "mk", "bn", "ta", "ne", "ur", "th", "gu-IN", "be", "lt", "lv", "is", "af", "af_ZA", "hi", "hi-IN", "kn", "ga", "co", "sc", "scn", "nap", "an", "ast-ES", "oc", "br", "eu", "cy", "cy-GB", "gd", "csb", "de", "de-AT", "de-CH", "de_DE", "fr", "fr-FR", "fr-BE", "fr-CA", "fr-CH", "es", "es-AR", "es-CL", "es-CO", "es_CO", "es-LA", "es-MX", "es-PE", "es-PY", "pt", "pt-PT", "pt_PT", "pt-BR", "it", "nl", "nl-NL", "sv", "nb", "da", "fi", "pl", "pl-PL", "ro", "ro-RO", "el", "el-GR", "tr", "id", "vi", "vi-VN", "bg", "ja", "ja-JP", "ja-HI", "zh", "zh-CN", "zh-Hans", "zh-GB", "zh_SG", "zh-TW", "zh-HK", "zh-Hant", "ko", "ko-KR", "ar", "ar-DZ", "ar-EG", "ca", "ca@valencia", "ca_ES", "gl", "gl-ES", "eo", "lb", "mt", "sq", "hy", "ka", "az", "az-AZ", "az-LA", "sw", "tl", "la", "cmn", "yue_CN", "as", "ml", "mr", "pa", "te-IN", "or_IN", "si", "my", "km", "km-KH", "km_KH", "jv", "mn", "kk", "ky", "uz", "uz-LA", "uz-UZ", "tg", "am", "mg", "ha", "so", "sn", "ny", "rw", "ig", "yo", "ckb", "ku", "ps", "sd", "ug", "uz-AR", "tt", "tk_TM", "fo", "fy", "fy-NL", "ht", "pap", "yi", "fur", "rm", "bi", "tpi", "mi", "sm", "fj", "to", "haw", "wa-RR", "zu", "zu-ZA", "xh", "nd", "ss", "st", "tn", "nso", "ts", "ve", "rn", "om", "lg", "bho", "mai", "kok", "vl-SS", "ary", "wuu-Hans", "ve-CC", "szl", "hsb", "wa", "ba", "bua", "cv", "sah", "ak", "bm", "wo", "gv", "kw", "vo"];
const keys = ['sync-estimate-source', 'sync-estimate-source-weight', 'sync-estimate-source-time', 'sync-estimate-field-gitlab', 'sync-estimate-field-gitlab-hint'];
for (const code of codes) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: current key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.notEqual(locale[keys[1]], locale[keys[2]], `${code}: points and hours remain distinct`);
}
// Absence of weight clears the mapped value, unlike an ignored missing Jira field.
assert.match(read('cs')[keys[4]], /bez váhy vymaže/);
assert.match(read('hu')[keys[4]], /súly nélküli feladat törli/);
assert.match(read('ru')[keys[4]], /без веса очищает/);
assert.match(read('sk')[keys[4]], /bez váhy vymaže/);
assert.match(read('uk')[keys[4]], /без ваги очищує/);
assert.match(read('et-EE')[keys[4]], /kaaluta ülesanne tühjendab/);
assert.match(read('he')[keys[4]], /ללא משקל מנקה/);
assert.match(read('de')[keys[4]], /ohne Gewicht löscht/);
assert.match(read('fr')[keys[4]], /sans poids efface/);
assert.match(read('es')[keys[4]], /sin peso borra/);
assert.match(read('fi')[keys[4]], /ei ole painoa, tyhjentää/);
assert.match(read('zh-CN')[keys[4]], /没有权重.*清除/);
assert.match(read('gl')[keys[4]], /sen peso borra/);
assert.match(read('la')[keys[4]], /sine pondere.*delet/);
assert.match(read('ha')[keys[4]], /ba shi da nauyi.*goge/);
assert.match(read('mn')[keys[4]], /жингүй.*арилгана/);
assert.match(read('kk')[keys[4]], /салмағы жоқ.*өшіреді/);
assert.match(read('uz')[keys[4]], /vazni yo‘q.*tozalaydi/);
assert.match(read('rm')[keys[4]], /senza paisa stizza/);
assert.match(read('mi')[keys[4]], /kāore ōna taumaha e muku/);
assert.match(read('zu')[keys[4]], /olungenasisindo lusula/);
assert.match(read('fj')[keys[0]], /Esitimeti/);
assert.doesNotMatch(read('fj')[keys[4]], /vakatautauvata/i);
assert.match(read('ary')[keys[4]], /بلا وزن.*كيمسح/);
assert.match(read('wuu-Hans')[keys[4]], /呒没权重.*清除/);
assert.match(read('ve-CC')[keys[4]], /sensa pexo.*scanceła/);
assert.match(read('ba')[keys[4]], /ауырлығы булмаған.*таҙарта/);
assert.match(read('gv')[keys[4]], /cooish gyn trimmid scryssey/);
assert.match(read('kw')[keys[4]], /mater heb poos a skara/);
assert.match(read('vo')[keys[4]], /säkäd nen vät moükon/);
console.log(`GitLab estimate translations: ${keys.length} messages in ${codes.length} locales passed`);
