'use strict';

// A Transifex pull may hand a locale a value written in a neighbouring or
// major language (Indonesian in Acehnese, Persian in Arabic, Spanish in
// Asturian/Esperanto/Valencian, French in Breton, Finnish in Veps, Latin
// script in the Arabic-script Uzbek locale). The locale tag is authoritative:
// such values are rejected after the merge, and this test pins that the
// rejected ones from the 2026-09 pull are not back in the files.
// Run: node tests/transifexPullWrongLanguageRejection.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const rejected = {
  ace: {
    'card-comments-more': ['Lainnya', 'Leubeh'],
    'text-note-text': ['Teks', 'Teuks'],
    'ldap-test-connection-success': ['Koneksi sukses', 'Sambongan seuemah'],
    'no-assignee': ['tiada penerima tugas', 'Hana nyang geutanyong'],
    'no-label': ['Tidak ada label', 'Hana label'],
    'due-today': ['Tamat Hari ini', 'Jitôh uroe nyoe'],
  },
  ar: { 'due-today': ['مقتضی امروز', 'مستحق اليوم'], 'no-assignee': ['منتصب‌نشده', 'لا يوجد مُكلَّف'] },
  'ar-DZ': { 'due-today': ['مقتضی امروز', 'مستحق اليوم'], 'no-assignee': ['منتصب‌نشده', 'لا يوجد مُكلَّف'] },
  'ar-EG': { 'due-today': ['مقتضی امروز', 'مستحق اليوم'], 'no-assignee': ['منتصب‌نشده', 'لا يوجد مُكلَّف'] },
  ary: {
    'due-today': ['مقتضی امروز', 'خاصو اليوم'],
    'no-assignee': ['منتصب‌نشده', 'ماكاينش لي تعطات ليه'],
    'card-comments-more': ['المزيد', 'كتر'],
    'checklist-reset-interval-weekly': ['أسبوعياً', 'كل سيمانة'],
  },
  'ast-ES': {
    'text-note-text': ['Texto', 'Testu'],
    'no-assignee': ['No asignado', 'Ensin asignar'],
    'no-label': ['Sin etiqueta', 'Ensin etiqueta'],
    'twoFactorCode-cancel': ['Cancelar', 'Encaboxar'],
  },
  br: { 'no-assignee': ['Pas de personne assignée', 'Den ebet deverket'] },
  'ca@valencia': { 'text-note-text': ['Texto', 'Text lliure'] },
  eo: { 'twoFactorCode-cancel': ['Cancelar', 'Nuligi'] },
  tk_TM: { 'twoFactorCode-cancel': ['Elatyr', 'Ýatyr'] },
  'uz-AR': { 'twoFactorCode-cancel': ['Bekor qilish', 'بیکر قیلیش'] },
  've-PP': { 'twoFactorCode-cancel': ['Peruuta', "Hül'gäta"] },
};

test('rejected wrong-language values are not present and the expected value is', () => {
  for (const [code, keys] of Object.entries(rejected)) {
    const locale = read(code);
    for (const [key, [wrong, expected]] of Object.entries(keys)) {
      assert.notStrictEqual(locale[key], wrong, `${code}: ${key} is still "${wrong}"`);
      assert.strictEqual(locale[key], expected, `${code}: ${key}`);
    }
  }
});

test('Arabic locales carry no Persian-only letters in the repaired keys (negative)', () => {
  for (const code of ['ar', 'ar-DZ', 'ar-EG', 'ary']) {
    const locale = read(code);
    // filter-due-today / filter-no-assignee carried the same Persian strings
    // before the pull; they are repaired in the same commit.
    for (const key of ['due-today', 'no-assignee', 'filter-due-today', 'filter-no-assignee']) {
      // Farsi yeh/keheh and the ZWNJ are Persian orthography, not Arabic.
      assert.doesNotMatch(locale[key], /[یک‌]/, `${code}: ${key} looks Persian`);
    }
  }
});

test('the Arabic-script Uzbek locale keeps Arabic script for cancel (negative)', () => {
  assert.match(read('uz-AR')['twoFactorCode-cancel'], /\p{Script=Arabic}/u);
  assert.doesNotMatch(read('uz-AR')['twoFactorCode-cancel'], /\p{Script=Latin}/u);
});

test('correct-language Transifex values from the same pull were kept', () => {
  assert.strictEqual(read('be')['twoFactorCode-cancel'], 'Скасаваць');
  assert.strictEqual(read('fy')['twoFactorCode-cancel'], 'Ofbrekke');
  assert.strictEqual(read('sr')['twoFactorCode-cancel'], 'Откажи');
  assert.strictEqual(read('wa-RR')['twoFactorCode-cancel'], 'Kanselaha');
  assert.strictEqual(read('cmn')['list-sync-url'], '网址');
  assert.strictEqual(read('ace')['checklist-reset-interval-daily'], 'Tiep uroe');
});

console.log(`\ntransifexPullWrongLanguageRejection: ${passed} tests passed`);
