'use strict';

// The newest All Boards and permanent-delete controls should not fall back to
// English in the languages and regional variants translated for this release.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const read = lang => JSON.parse(fs.readFileSync(path.join(dir, `${lang}.i18n.json`), 'utf8'));
const en = read('en');
const keys = [
  'archive-permanent-delete-disabled-hint',
  'no-boards-selected',
  'select-only-one-board',
  'unset-selected-home',
  'select-none',
  'enable-permanent-delete',
  'enable-permanent-delete-description',
];
const languages = [
  'ar', 'ar-DZ', 'ar-EG', 'ary', 'cmn', 'cs', 'cs-CZ', 'da',
  'de', 'de-AT', 'de-CH', 'de_DE', 'el', 'el-GR', 'es', 'es-AR',
  'es-CL', 'es-CO', 'es-LA', 'es-MX', 'es-PE', 'es-PY', 'es_CO',
  'fi', 'fr', 'fr-BE', 'fr-CA', 'fr-CH', 'fr-FR', 'he', 'he-IL',
  'hi', 'hi-IN', 'id', 'it', 'ja', 'ja-HI', 'ja-JP', 'ko', 'ko-KR',
  'nb', 'nl', 'nl-NL', 'pl', 'pl-PL', 'pt', 'pt-BR', 'pt-PT', 'pt_PT',
  'ru', 'ru-RU', 'ru-UA', 'ru_RU', 'sv', 'tr', 'uk', 'uk-UA', 'vi',
  'vi-VN', 'wuu-Hans', 'yue_CN', 'zh', 'zh-CN', 'zh-GB', 'zh-Hans',
  'zh-Hant', 'zh-HK', 'zh-TW', 'zh_SG',
];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('recentBoardTranslations:');

test('the translated batch covers at least sixty locales', () => {
  assert.ok(languages.length >= 60);
});

test('every recent control exists and is no longer its English placeholder', () => {
  for (const lang of languages) {
    const data = read(lang);
    for (const key of keys) {
      assert.strictEqual(typeof data[key], 'string', `${lang}: missing ${key}`);
      assert.ok(data[key].length > 0, `${lang}: empty ${key}`);
      assert.notStrictEqual(data[key], en[key], `${lang}: ${key} remains English`);
    }
  }
});

test('NEGATIVE — permanent deletion is not translated as ordinary archive removal', () => {
  for (const lang of languages) {
    const data = read(lang);
    assert.notStrictEqual(data['enable-permanent-delete'], data['archive-board']);
  }
});

console.log(`\n${passed} tests passed`);
