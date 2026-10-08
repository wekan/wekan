'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18next = require('i18next');
const directory = path.join(__dirname, '../imports/i18n/data');
const read = code => JSON.parse(fs.readFileSync(path.join(directory, code + '.i18n.json')));
const source = read('en');
const completed = ["af","af_ZA","am","an","ar","ar-DZ","ar-EG","ary","ast-ES","az","az-AZ","az-LA","be","bg","bn","br","bs","ca","ca@valencia","ca_ES","cmn","co","cs","cs-CZ","cy","cy-GB","da","de","de-AT","de-CH","de_DE","el","el-GR","eo","es","es-AR","es-CL","es-CO","es-LA","es-MX","es-PE","es-PY","es_CO","et-EE","eu","fa","fa-IR","fi","fo","fr","fr-BE","fr-CA","fr-CH","fr-FR","fy","fy-NL","ga","gd","gl","gl-ES","gu-IN","ha","he","he-IL","hi","hi-IN","hr","ht","hu","hy","id","ig","is","it","ja","ja-HI","ja-JP","ka","kk","km","km-KH","km_KH","kn","ko","ko-KR","ky","la","lb","lt","lv","mg","mk","ml","mn","mr","ms","ms-MY","mt","my","nb","ne","nl","nl-NL","oc","pa","pl","pl-PL","pt","pt-BR","pt-PT","pt_PT","rm","ro","ro-RO","ru","ru-RU","ru-UA","ru_RU","sc","scn","si","sk","sl","sl_SI","sq","sr","sv","sw","ta","te-IN","tg","th","tk_TM","tl","tr","tt","uk","uk-UA","ur","uz","uz-LA","uz-UZ","vi","vi-VN","yo","zh","zh-CN","zh-GB","zh-HK","zh-Hans","zh-Hant","zh-TW","zh_SG"];
const keys = ['card-field-visibility', 'card-field-visibility-desc'];

test('all locale catalogs contain the current source keys in order', () => {
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.i18n.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(directory, file)));
    assert.deepEqual(Object.keys(data), Object.keys(source), file);
  }
});

test('translated card-field labels render with interpolation enabled', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const i18n = i18next.createInstance();
  await i18n.init({ lng: 'en', fallbackLng: 'en', initImmediate: false,
    interpolation: { prefix: '__', suffix: '__' }, resources: { en: { translation: source } } });
  for (const code of completed) {
    const data = read(code);
    i18n.addResourceBundle(code, 'translation', data);
    for (const key of keys) {
      assert.ok(data[key]?.trim(), code + ':' + key);
      assert.notEqual(data[key], source[key], code + ':' + key);
      assert.deepEqual(translationTokens(data[key]), translationTokens(source[key]), code + ':' + key);
      assert.equal(i18n.t(key, { lng: code }), data[key], code + ': displays the translation without fallback');
    }
  }
});

test('card-field help keeps hiding, data preservation and board-specific ordering', () => {
  const samples = {
    nl: [/verborgen/, /Kaartgegevens en bordinstellingen veranderen niet/, /eigen volgorde van velden/],
    ja: [/非表示/, /データやボードの設定は変更されません/, /順序はボードごと/],
    ar: [/يُخفى/, /لا تتغير بيانات/, /لكل لوحة ترتيب/],
    uk: [/приховано/, /не змінюються/, /власний порядок/],
    hi: [/छिप जाता/, /डेटा और बोर्ड की सेटिंग नहीं बदलती/, /क्रम हर बोर्ड का अपना/],
  };
  for (const [code, patterns] of Object.entries(samples)) {
    for (const pattern of patterns) assert.match(read(code)[keys[1]], pattern, code);
  }
});
