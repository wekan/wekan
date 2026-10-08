'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18next = require('i18next');
const directory = path.join(__dirname, '../imports/i18n/data');
const read = code => JSON.parse(fs.readFileSync(path.join(directory, code + '.i18n.json')));
const source = read('en');
const completed = ["af","af_ZA","ak","am","an","ar","ar-DZ","ar-EG","ary","as","ast-ES","az","az-AZ","az-LA","ba","be","bg","bho","bi","bn","br","bs","ca","ca@valencia","ca_ES","ckb","cmn","co","cs","cs-CZ","cy","cy-GB","da","de","de-AT","de-CH","de_DE","el","el-GR","eo","es","es-AR","es-CL","es-CO","es-LA","es-MX","es-PE","es-PY","es_CO","et-EE","eu","fa","fa-IR","fi","fo","fr","fr-BE","fr-CA","fr-CH","fr-FR","fy","fy-NL","ga","gd","gl","gl-ES","gu-IN","ha","he","he-IL","hi","hi-IN","hr","ht","hu","hy","id","ig","is","it","ja","ja-HI","ja-JP","jv","ka","kk","km","km-KH","km_KH","kn","ko","ko-KR","kok","ku","ky","la","lb","lt","lv","mai","mg","mi","mk","ml","mn","mr","ms","ms-MY","mt","my","nb","ne","nl","nl-NL","nso","oc","or_IN","pa","pl","pl-PL","ps","pt","pt-BR","pt-PT","pt_PT","rm","ro","ro-RO","ru","ru-RU","ru-UA","ru_RU","sc","scn","sd","si","sk","sl","sl_SI","so","sq","sr","sv","sw","ta","te-IN","tg","th","tk_TM","tl","tpi","tr","tt","ug","uk","uk-UA","ur","uz","uz-LA","uz-UZ","vi","vi-VN","wa-RR","wuu-Hans","yi","yo","yue_CN","zh","zh-CN","zh-GB","zh-HK","zh-Hans","zh-Hant","zh-TW","zh_SG"];
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

// These key names are displayed in Blockly's shortcut help. Retain recognizable
// physical legends while translating function labels, especially Home vs End.
test('six completed keyboard label batches retain key identities and navigation direction', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const suffixes = ['ALT_KEY', 'BACKSPACE_KEY', 'CAPS_LOCK_KEY', 'COMMAND_KEY',
    'CONTEXT_MENU_KEY', 'CONTROL_KEY', 'END_KEY', 'ENTER_KEY', 'ESCAPE', 'HOME_KEY',
    'INSERT_KEY', 'OPTION_KEY', 'PAGE_DOWN_KEY', 'PAGE_UP_KEY', 'PAUSE_KEY', 'SHIFT_KEY',
    'SPACE_KEY', 'TAB_KEY'];
  for (const code of ["ak","mi","nso","so","tpi","wa-RR"]) {
    const data = read(code);
    for (const suffix of suffixes) {
      const key = 'blockly-' + suffix;
      assert.ok(data[key]?.trim(), code + ':' + key);
      assert.notEqual(data[key], source[key], code + ':' + key);
      assert.deepEqual(translationTokens(data[key]), translationTokens(source[key]), code + ':' + key);
    }
    for (const name of ['Alt', 'Command', 'Control', 'Option', 'Shift', 'Tab', 'Enter']) {
      assert.ok(data['blockly-' + name.toUpperCase() + '_KEY'].includes(name), code + ':' + name);
    }
    assert.notEqual(data['blockly-HOME_KEY'], data['blockly-END_KEY'], code);
    assert.notEqual(data['blockly-PAGE_UP_KEY'], data['blockly-PAGE_DOWN_KEY'], code);
    assert.notEqual(data['blockly-BACKSPACE_KEY'], data['blockly-SPACE_KEY'], code);
  }
  for (const [code, up, down] of [['mi', /whakarunga/, /whakararo/],
    ['tpi', /antap/, /daun/], ['so', /kor/, /hoos/],
    ['ak', /soro/, /fam/], ['nso', /godimo/, /fase/], ['wa-RR', /tipaigbaw/, /tipaubos/]]) {
    assert.match(read(code)['blockly-PAGE_UP_KEY'], up, code);
    assert.match(read(code)['blockly-PAGE_DOWN_KEY'], down, code);
  }
});

test('additional card-field locales preserve their scripts and localized hiding clauses', () => {
  for (const code of ['ckb', 'ps', 'sd', 'ug']) {
    assert.match(read(code)['card-field-visibility-desc'], /\p{Script=Arabic}/u, code);
    assert.doesNotMatch(read(code)['card-field-visibility-desc'], /[A-Za-z]/, code);
  }
  assert.match(read('yi')['card-field-visibility-desc'], /\p{Script=Hebrew}/u);
  assert.match(read('or_IN')['card-field-visibility-desc'], /\p{Script=Oriya}/u);
  assert.match(read('as')['card-field-visibility-desc'], /\p{Script=Bengali}/u);
  assert.match(read('ba')['card-field-visibility-desc'], /[ҡғҙҫң]/);
  assert.match(read('yue_CN')['card-field-visibility-desc'], /唔會改變/);
  assert.match(read('wuu-Hans')['card-field-visibility-desc'], /侪勿会改变/);
  assert.match(read('ku')['card-field-visibility-desc'], /naguherin/);
});
