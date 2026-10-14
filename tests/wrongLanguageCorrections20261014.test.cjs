'use strict';

// Wrong-language values found by the 2026-10-14 translation rounds, replaced
// with the language each locale tag names.
// Run: node tests/wrongLanguageCorrections20261014.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const locale = tag => JSON.parse(fs.readFileSync(path.join(ROOT, `imports/i18n/data/${tag}.i18n.json`), 'utf8'));
const en = locale('en');
const tokens = value => (String(value).match(/__[A-Za-z0-9_]+__|%(?:\d+\$)?[sd]/g) || []).sort();

(async () => {
  // Spanish: "Añadir" is Add, and it was on every Save button.
  for (const tag of ['es', 'es-CL', 'es-CO', 'es-LA', 'es-MX', 'es-PY', 'es_CO']) {
    assert.equal(locale(tag).save, 'Guardar', tag);
  }
  console.log('  ok - Spanish Save says Guardar');

  // Bosnian is written in Latin script here; its file had 748 Serbian
  // Cyrillic values. None is left, and every placeholder survived.
  const bs = locale('bs');
  const cyrillic = Object.entries(bs).filter(([, v]) => /[Ѐ-ӿ]/.test(v)).map(([k]) => k);
  assert.deepEqual(cyrillic, [], 'no Cyrillic in the Bosnian file');
  for (const [key, value] of Object.entries(bs)) {
    if (key in en) assert.deepEqual(tokens(value), tokens(en[key]), `bs ${key} keeps its placeholders`);
  }
  assert.equal(bs.storage, 'Skladište');
  assert.equal(bs['log-in'], 'Prijavi se');
  console.log('  ok - Bosnian in Latin script, placeholders intact');

  // One value each, in the locale's own language.
  const expected = {
    ro: { 'card-due': 'Scadență', calendar: 'Calendar' },
    'ro-RO': { 'card-due': 'Scadență', calendar: 'Calendar' },
    lv: { storage: 'Krātuve', 'due-date': 'Termiņš' },
    'vi-VN': { storage: 'Lưu trữ' },
    zgh: { boards: 'ⵜⵉⴼⵍⵡⵉⵏ', card: 'ⵜⴰⴽⴰⵔⴹⴰ' },
    fa: { settings: 'تنظیمات' },
    mk: { 'due-date': 'Краен рок', settings: 'Поставки', password: 'Лозинка' },
    ka: { attachment: 'მიბმული ფაილი' },
    'et-EE': { private: 'Privaatne' },
    uz: { 'add-attachment': "Ilova qo'shish" },
    yue_CN: { attachment: '附件' },
    cmn: { public: '公开' },
    hi: { 'admin-panel': 'व्यवस्थापक पैनल' },
    sw: { private: 'Binafsi' },
    yi: { password: 'פּאַראָל' },
    oc: { password: 'Senhal' },
    ts: { storage: 'Vuhlayiselo' },
  };
  for (const [tag, values] of Object.entries(expected)) {
    const data = locale(tag);
    for (const [key, value] of Object.entries(values)) assert.equal(data[key], value, `${tag} ${key}`);
  }
  assert.match(locale('ms')['board-public-info'], /^Papan ini/, 'not the typo "Panpan"');
  console.log('  ok - the single values');

  // Negative: the wrong words are gone, whatever key they were under.
  const gone = {
    ro: /Scadenza|Calendario|Scheda/, 'ro-RO': /Scadenza|Calendario|Scheda/, lv: /Sandėliavimas|\bTerminas\b/,
    'vi-VN': /\bStoran\b/, mk: /Настройки|По крајњем/, fa: /تنظمات/, uz: /Qo'shiq qo'shish/,
    yue_CN: /依戀/, ts: /Hi Xitsonga: mhaka/, oc: /Santa-Clara/,
  };
  for (const [tag, pattern] of Object.entries(gone)) {
    for (const [key, value] of Object.entries(locale(tag))) assert.doesNotMatch(value, pattern, `${tag} ${key}`);
  }
  console.log('  ok - and nowhere else in those files');
  console.log('\nwrongLanguageCorrections20261014: all tests passed');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
