'use strict';

// Locale files that were found on 2026-10-14 to hold ANOTHER language, or
// machine-fill placeholders, where their own language belongs (CLAUDE.md: the
// locale tag is authoritative). Each was rewritten in its own language; this
// keeps the old shape from coming back, and checks that every placeholder of
// every value still matches English.
// Run: node tests/wrongLanguageLocales.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DATA = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const load = tag => JSON.parse(fs.readFileSync(path.join(DATA, `${tag}.i18n.json`), 'utf8'));
const en = load('en');
let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Whole words (or marks) that belong to the language that was there, not the
// locale's own: each was common in the file before the rewrite.
// A whole word, with letter-aware edges: JavaScript's \b treats "ț" or "ă" as
// an edge, which would read Romanian "Eliminați" as Italian "Elimina".
const words = list => new RegExp(`(?<!\\p{L})(${list.join('|')})(?!\\p{L})`, 'u');

const WRONG = {
  ro: { lang: 'Italian', re: words(['Aggiungi', 'Impostazioni', 'Accedi', 'Predefinito', 'Amministratore', 'Elimina', 'Annulla', 'Solo commenti', 'bacheca', 'Azioni']) },
  'ro-RO': { lang: 'Italian', re: words(['Aggiungi', 'Impostazioni', 'Accedi', 'Predefinito', 'Amministratore', 'Elimina', 'Annulla', 'Solo commenti', 'bacheca', 'Azioni']) },
  // 'bacheca' is not listed for ve-CC: Venetian uses it as a loan beside 'quadro'.
  've-CC': { lang: 'Italian or Zulu', re: words(['Aggiungi', 'Impostazioni', 'Accedi', 'Predefinito', 'Elimina', 'Annulla', 'Indima']) },
  gl: { lang: 'Portuguese', re: words(['Não', 'Sim', 'você', 'Conecte-se', 'Omissão', '\\p{L}*ções']) },
  'gl-ES': { lang: 'Portuguese', re: words(['Não', 'Sim', 'você', 'Conecte-se', 'Omissão', '\\p{L}*ções']) },
  ace: { lang: 'Malay/Indonesian', re: words(['Pentadbir', 'Setelan', 'Daftar Tindakan', 'Simpan']) },
  ve: { lang: 'Zulu', re: words(['Yebo', 'Ngena ngemvume', 'Sesha', 'Yamukela', 'Esidlangalaleni', 'Okuyimfihlo']) },
  sk: { lang: 'Czech', re: new RegExp(`[ěřůĚŘŮ]|${words(['Ano', 'Soukromý', 'jsou', 'není']).source}`, 'u') },
  // Upper Sorbian writes ř itself (přidać); ů and these words are Czech only.
  hsb: { lang: 'Czech', re: new RegExp(`[ůŮ]|${words(['jsou', 'není', 'také', 'uživatel', 'nastavení', 'Ano', 'Průběh', 'Důvod']).source}`, 'u') },
  rm: { lang: 'Italian', re: words(['Aggiungi', 'Impostazioni', 'Salva', 'Elimina', 'Annulla', 'Accedi', 'Predefinito']) },
  bi: { lang: 'Tok Pisin', re: words(['Dispela', 'bilong', 'kirapim', 'senisim', 'rausim']) },
  rup: { lang: 'Italian', re: words(['Accedi', 'Predefinito', 'Impostazioni', 'Aggiungi']) },
  lld: { lang: 'Italian', re: words(['Ruoli', 'Impostazioni', 'Aggiungi', 'Accedi', 'Predefinito']) },
  vo: { lang: 'Esperanto', re: words(['Akcepti', 'Fermi', 'Redakti', 'Renomi', 'Forigi', 'Aldoni']) },
  // Hong Kong writes Traditional: characters that exist only in Simplified.
  'zh-HK': { lang: 'Simplified Chinese', re: /[让与统项键凭据设户从误这为对还应选择录码开关务认证显链导视图发计划删编辑动们个时间]/ },
  // Flemish (languages.js "Vlaams"): Venda's letters do not occur in Dutch.
  'vl-SS': { lang: 'Venda', re: /[ḓḽṅṋṱḒḼṄṊṰ]|(?<!\p{L})(Vhutanzi|zwino|Khii ya)(?!\p{L})/u },
  cmn: { lang: 'a wooden plank for a board', re: /木板|节省/ },
  yue_CN: { lang: 'a wooden plank for a board', re: /木板/ },
};

const PREFIXES = {
  to: /^Faka-Tonga:/,
  qu: /Kay willaymi:/,
  wal: /Wolayttatto:/,
  an: /En aragonés:/,
  fur: /Par furlan:/,
  lg: /\(mu Luganda\)/,
  hsb: /^WeKan: /,
};

const tokens = value => (String(value).match(/__[A-Za-z0-9_]+__|%(\d+\$)?[sd]/g) || []).sort().join('|');

test('no value is in the language that used to be there', () => {
  for (const [tag, { lang, re }] of Object.entries(WRONG)) {
    const data = load(tag);
    const hits = Object.entries(data).filter(([k, v]) => typeof v === 'string' && v !== en[k] && re.test(v));
    assert.deepEqual(hits.slice(0, 5), [], `${tag} still has ${lang}: ${hits.length} values`);
  }
});

test('no machine-fill prefix or note is left', () => {
  for (const [tag, re] of Object.entries(PREFIXES)) {
    const hits = Object.entries(load(tag)).filter(([, v]) => re.test(String(v)));
    assert.deepEqual(hits.slice(0, 5), [], `${tag}: ${hits.length} prefixed values`);
  }
});

test('every placeholder of every repaired value matches English', () => {
  for (const tag of [...Object.keys(WRONG), ...Object.keys(PREFIXES)]) {
    const data = load(tag);
    const bad = Object.keys(data).filter(k => k in en && tokens(data[k]) !== tokens(en[k]));
    assert.deepEqual(bad.slice(0, 5), [], `${tag}: placeholders differ from English in ${bad.length} values`);
  }
});

test('the poker cards show their numbers in every repaired locale', () => {
  const pokerKeys = Object.keys(en).filter(k => /^poker-(one|two|three|five|eight|thirteen|twenty|forty|oneHundred)$/.test(k));
  for (const tag of [...Object.keys(WRONG), ...Object.keys(PREFIXES)]) {
    const data = load(tag);
    for (const k of pokerKeys) assert.equal(data[k], en[k], `${tag} ${k}`);
  }
});

test('List actions means the actions of a list, not "list the actions"', () => {
  const was = { pa: 'ਕਾਰਵਾਈਆਂ ਦੀ ਸੂਚੀ ਬਣਾਓ', pt: 'Listar Ações', 'pt-BR': 'Listar Ações', ru_RU: 'Список действий', 'vi-VN': 'Liệt kê các hành động', hu: 'Műveletek felsorolása', ko: '동작 목록' };
  for (const [tag, old] of Object.entries(was)) {
    const value = load(tag)['listActionPopup-title'];
    assert.ok(value && value !== old && value !== en['listActionPopup-title'], `${tag}: ${value}`);
  }
  // "No" is the word, not an abbreviation of "number".
  assert.notEqual(load('pa').no, 'ਨੰ');
  assert.notEqual(load('lt').no, 'Nr');
  assert.notEqual(load('te-IN').no, 'నం');
  assert.notEqual(load('et-EE').board, 'Juhatus');
});

test('negative: the detectors find what they are for', () => {
  assert.ok(WRONG.ro.re.test('Aggiungi lista'));
  assert.ok(WRONG.gl.re.test('Não'));
  assert.ok(WRONG.ve.re.test('Yebo'));
  assert.ok(WRONG.sk.re.test('Soukromý'));
  assert.ok(PREFIXES.to.test('Faka-Tonga: Roles'));
  assert.ok(!WRONG.ro.re.test('Adaugă listă'), 'Romanian is not flagged');
  assert.ok(!WRONG.gl.re.test('Non, si'), 'Galician is not flagged');
});

console.log(`wrongLanguageLocales: ${passed} tests passed`);
