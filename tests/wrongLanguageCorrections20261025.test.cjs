'use strict';

// Wrong-language values found on 2026-10-25 and replaced with the language each
// locale tag names (CLAUDE.md: the locale tag is authoritative):
//   - ro, ro-RO: about 160 values each were Italian ("Sposta in cima",
//     "rosso", "ti ha inviato un invito"), with some Spanish and French;
//   - zgh: about 100 values were Arabic and 230 Kabyle or French in Latin
//     letters - Standard Moroccan Tamazight is written in Tifinagh here;
//   - ur: about 2,400 values were English spelled letter by letter in Urdu
//     script ("منتقل کو توپ" for Move to Top - توپ is a cannon) or English word
//     order word for word.
// Run: node tests/wrongLanguageCorrections20261025.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DATA = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const load = tag => JSON.parse(fs.readFileSync(path.join(DATA, `${tag}.i18n.json`), 'utf8'));
const en = load('en');
const tokens = value => (String(value).match(/__[A-Za-z0-9_]+__|%(?:\d+\$)?[sd]/g) || []).sort().join('|');
const words = list => new RegExp(`(?<!\\p{L})(${list.join('|')})(?!\\p{L})`, 'u');
const TAGS = ['ro', 'ro-RO', 'zgh', 'ur'];
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// What used to be there, as whole words or marks.
const ITALIAN = words(['Sposta', 'rosso', 'giallo', 'nero', 'bianco', 'Crea', 'Importa', 'Esporta', 'scheda', 'Rimuovi',
  'ti ha inviato', 'Nascondi', 'Mostra', 'Scegli', 'Statistiche', 'secondi', 'giorni', 'Attivo', 'Azione', 'in uscita',
  'Eliminare', 'cancella', 'aggiunta', 'creato', 'scadenza', 'commento', 'disparador', 'carril', 'Connexion', 'Erreur']);
const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/u;
// Urdu: English spelled out (توپ top, بوتتوم bottom, سیزے size, "ارے آپ سورے"
// are you sure, تہیس this, تہے the), and the machine fill's "اردو:" prefix.
const URDU_TRANSLITERATED = /توپ|بوتتوم|سیزے|ارے آپ سورے|(?<!\p{L})(تہیس|تہے|ات|ینویتاتیون|اپپلی|تابلے|سومےتہینگ)(?!\p{L})|^اردو:/u;

test('Romanian is Romanian, not Italian, Spanish or French', () => {
  for (const tag of ['ro', 'ro-RO']) {
    const data = load(tag);
    const hits = Object.entries(data).filter(([k, v]) => v !== en[k] && ITALIAN.test(v));
    assert.deepEqual(hits.slice(0, 5), [], `${tag}: ${hits.length} values`);
    assert.equal(data['moveCardToTop-title'], 'Mută la început');
    assert.equal(data['moveCardToBottom-title'], 'Mută la sfârșit');
    assert.equal(data['color-red'], 'roșu');
    assert.doesNotMatch(Object.values(data).join('\n'), /[şţŞŢ]/, `${tag}: comma-below ș ț, not cedilla`);
  }
});

test('Tamazight is in Tifinagh: no Arabic left', () => {
  const zgh = load('zgh');
  const arabic = Object.entries(zgh).filter(([, v]) => ARABIC.test(v)).map(([k]) => k);
  assert.deepEqual(arabic, []);
  assert.match(zgh['moveCardToTop-title'], /[ⴰ-⵿]/u);
  assert.doesNotMatch(zgh['remove-sort'], /\n/, 'the stray line break is gone');
});

test('Urdu is Urdu, not English spelled in Urdu letters', () => {
  const ur = load('ur');
  const hits = Object.entries(ur).filter(([k, v]) => v !== en[k] && URDU_TRANSLITERATED.test(v));
  assert.deepEqual(hits.slice(0, 5), [], `ur: ${hits.length} values`);
  assert.equal(ur['moveCardToTop-title'], 'سب سے اوپر منتقل کریں');
  assert.notEqual(ur.size, 'سیزے');
  assert.equal(ur['poker-one'], en['poker-one'], 'the poker cards show their numbers');
});

test('every placeholder of every value in these locales matches English', () => {
  for (const tag of TAGS) {
    const data = load(tag);
    const bad = Object.keys(data).filter(k => k in en && tokens(data[k]) !== tokens(en[k]));
    assert.deepEqual(bad.slice(0, 5), [], `${tag}: ${bad.length} values`);
  }
});

test('the search keywords can be typed: one word, letters only, none twice', () => {
  // config/query-classes.js reads `<operator>:` as letters and marks only - a
  // space, an underscore or a zero-width non-joiner makes the keyword unusable.
  const keys = Object.keys(en).filter(k => k.startsWith('operator-') && !/error|invalid|expected|unknown|abbrev/.test(k));
  for (const tag of TAGS) {
    const data = load(tag);
    for (const k of keys) assert.match(data[k], /^[\p{L}\p{M}'’]+$/u, `${tag} ${k}: ${JSON.stringify(data[k])}`);
    const values = keys.map(k => data[k].toLowerCase());
    assert.equal(new Set(values).size, values.length, `${tag}: two operators share a keyword`);
  }
});

test('negative: the detectors find what they are for, and pass the language itself', () => {
  assert.ok(ITALIAN.test('Sposta in cima'));
  assert.ok(!ITALIAN.test('Mută la început'));
  assert.ok(ARABIC.test('التحرك إلى الأعلى'));
  assert.ok(!ARABIC.test('ⵙⵙⴰⵍⵉ ⵙ ⴰⴷⴷⴰⵢ'));
  assert.ok(URDU_TRANSLITERATED.test('منتقل کو توپ'));
  assert.ok(URDU_TRANSLITERATED.test('ارے آپ سورے آپ وانت کو حذف تہے تبصرہ?'));
  assert.ok(!URDU_TRANSLITERATED.test('کیا آپ واقعی یہ تبصرہ حذف کرنا چاہتے ہیں؟'));
  assert.doesNotMatch('listă_de_verificare', /^[\p{L}\p{M}'’]+$/u, 'an underscore is not a keyword');
  assert.doesNotMatch('سہ‌ماہی', /^[\p{L}\p{M}'’]+$/u, 'nor is a zero-width non-joiner');
});

console.log(`wrongLanguageCorrections20261025: ${passed} passed`);
