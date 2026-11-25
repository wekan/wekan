'use strict';
// Walloon (wa), 2026-11-25: about 1340 values corrected. They were French
// ("Ajouter une checklist", "Quand le mimbe", "Supprimer la checklist ?"),
// Catalan/Occitan or invented ("Esportar la căte", "Scolar la căte",
// "Mintrepond" for log in, move and uploaded by alike, "Mettre à jorn
// cătes"), spelled with "ă" which Walloon does not use (it writes "å"),
// English left behind, or stale translations of an older English text.
// The assignee is "responsåve" throughout, the word the file already used.
// wa-RR is Waray-Waray (languages.js), not Walloon, and is not touched.
// Run: node tests/walloonCorrections20261125.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const locale = tag => JSON.parse(read(`imports/i18n/data/${tag}.i18n.json`));
const en = locale('en');
const wa = locale('wa');

test('no "ă", and none of the French or invented words that were there', () => {
  const bad = /ă|cărd|\b(Esportar|Importar|Mintrepond|Scolar|Liguer|Nien de|Ajouter|Supprimer|Copier|Créer|Inviter|Filtrer|Sélectionner|Mettre à|Restorer|Restaura|Chosi une|Aouter|Quand|coulour|avec items|pour it|une checklist|la checklist|par defaut|Personne assignée|Personnes assignées|Inviter)\b/;
  assert.deepEqual(Object.entries(wa).filter(([, v]) => bad.test(v)).map(([k]) => k), []);
});

test('the values that were wrong, in Walloon now', () => {
  assert.equal(wa['add-card'], 'Radjouter ene cåte');
  assert.doesNotMatch(wa['log-in'], /Mintrepond/);
  assert.doesNotMatch(wa['export-card'], /Esportar|ă/);
  assert.equal(wa['assignee'], 'Responsåve');
  assert.equal(wa['cardAssigneePopup-title'], 'Responsåve');
  // The two import instructions that were still English.
  for (const key of ['import-board-instruction-todoist', 'import-board-instruction-planner']) {
    assert.notEqual(wa[key], en[key], key);
    assert.match(wa[key], /^Dins /, key);
  }
});

test('every placeholder is the English one, in every value', () => {
  const bad = Object.keys(en).filter(k => k in wa &&
    JSON.stringify(translationTokens(wa[k])) !== JSON.stringify(translationTokens(en[k])));
  assert.deepEqual(bad, []);
  assert.deepEqual(Object.keys(wa), Object.keys(en), 'every key, in en order');
});

test('negative: wa-RR is Waray-Waray and kept its own words', () => {
  const rr = locale('wa-RR');
  assert.equal(rr.board, 'Pisara');
  assert.doesNotMatch(rr.board + rr['add-card'], /cåte|tåvlea/);
});

// The search operators are typed, so a corrected word keeps the old one working.
const SOURCE = read('config/search-const.js').replace(/export /g, '') + '\n' +
  read('config/query-classes.js').replace(/import[\s\S]*?from ['"][^'"]+['"];\s*/g, '').replace(/export /g, '') +
  '\nthis.Query = Query;';
function parserFor(labels, language) {
  const context = { TAPi18n: { __: key => labels[key] || key, getLanguage: () => language },
    Boards: { colorMap: () => ({}) }, console };
  vm.createContext(context);
  vm.runInContext(SOURCE, context);
  return context;
}

test('the corrected search operators work, and so do the old words', () => {
  const { Query } = parserFor(wa, 'wa');
  for (const [word, predicate] of [[wa['operator-team'], 'team'], ['tèm', 'team'], [wa['operator-comment'], 'comment'], ['rawete', 'comment']]) {
    const q = new Query();
    q.buildParams(`${word}:Alpha`);
    assert.equal(q.hasErrors(), false, word);
    assert.equal(q.getQueryParams().getPredicate(predicate), 'Alpha', word);
  }
  // Negative: in English the old Walloon word is no operator.
  const q = new (parserFor(en, 'en').Query)();
  q.buildParams('tèm:Alpha');
  assert.equal(q.hasErrors(), true);
});
