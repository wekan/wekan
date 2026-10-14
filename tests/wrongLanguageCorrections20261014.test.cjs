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
  assert.equal(bs['log-in'], 'Prijavi se');
  // Ijekavian Bosnian, not the Serbian ekavian the values were seeded with.
  assert.match(bs['activity-moved'], /premjestio/);
  assert.equal(bs['allboards.remaining'], 'Neraspoređene');
  assert.equal(bs.history, 'Historija');
  assert.equal(bs.week, 'Sedmica');
  for (const [key, value] of Object.entries(bs)) {
    assert.doesNotMatch(value, /\b(premest|uneti|neraspodelj|istorij|nedelj[ae]?\b|sledeć|vreme\b|mesec)/i, `bs ${key} is ijekavian Bosnian`);
  }
  console.log('  ok - Bosnian in Latin script and ijekavian, placeholders intact');

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
    rup: { calendar: 'Calendar' },
  };
  for (const [tag, values] of Object.entries(expected)) {
    const data = locale(tag);
    for (const [key, value] of Object.entries(values)) assert.equal(data[key], value, `${tag} ${key}`);
  }
  assert.match(locale('ms')['board-public-info'], /^Papan ini/, 'not the typo "Panpan"');
  console.log('  ok - the single values');

  // Negative: the wrong words are gone, whatever key they were under.
  const gone = {
    ro: /Scadenza|Calendario|Scheda/, 'ro-RO': /Scadenza|Calendario|Scheda/, lv: /[ąęėįųĄĘĖĮŲ]|\b(Ataskait|Migracij|darbo sri|Organizacij|Užrakint|Nustatym|Pasirink|Pridėti|Redaguoti|Ištrinti|Kortel|šiandien|rytoj)|\bTerminas\b/,
    'vi-VN': /\bStoran\b/, mk: /Настройки|По крајњем/, fa: /تنظمات/, uz: /Qo'shiq qo'shish/,
    yue_CN: /依戀/, oc: /Santa-Clara/,
  };
  for (const [tag, pattern] of Object.entries(gone)) {
    for (const [key, value] of Object.entries(locale(tag))) assert.doesNotMatch(value, pattern, `${tag} ${key}`);
  }
  // The Latvian file had 225 Lithuanian values; their placeholders survived.
  const en2 = locale('en');
  for (const [key, value] of Object.entries(locale('lv'))) {
    if (key in en2) assert.deepEqual(tokens(value), tokens(en2[key]), `lv ${key} keeps its placeholders`);
  }
  // Tsonga: 618 values were the filler "Hi Xitsonga: mhaka" and 831 were
  // Xitsonga words padded with a repeated "mhaka" where the generator had no
  // word. Neither is left, and the placeholders survived.
  for (const [key, value] of Object.entries(locale('ts'))) {
    assert.doesNotMatch(value, /Hi Xitsonga/, `ts ${key}`);
    assert.ok((value.match(/\bmhaka\b/g) || []).length < 2, `ts ${key} is not padded with mhaka`);
    if (key in en2) assert.deepEqual(tokens(value), tokens(en2[key]), `ts ${key} keeps its placeholders`);
  }
  console.log('  ok - and nowhere else in those files');
  console.log('\nwrongLanguageCorrections20261014: all tests passed');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
