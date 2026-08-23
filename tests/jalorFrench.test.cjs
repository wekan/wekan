'use strict';

// French: the default language, and the words Jalor uses.
//
// Two different questions, and they get two different answers - which is the
// part that is easy to get wrong:
//
//   which language does somebody SEE?      French, unless they or their browser
//                                          asked for another Jalor has
//   what fills a MISSING string?           English, because every key is written
//                                          from English and a missing one must
//                                          still render words
//
// Run: node tests/jalorFrench.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('jalorFrench:');

const fr = JSON.parse(read('imports/i18n/data/fr.i18n.json'));
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

test('French is what somebody sees when nothing else was asked for', () => {
  const client = read('client/lib/i18n.js');
  assert.ok(/export const JALOR_DEFAULT_LANGUAGE = 'fr';/.test(client),
    'the default is named once and exported');
  // ...and it is applied AFTER the browser has been given its chance, not
  // instead of it: a user whose browser is in German still gets German.
  const order = client.indexOf('navigator.language');
  const fallback = client.indexOf('JALOR_DEFAULT_LANGUAGE)) {');
  assert.ok(order > -1 && fallback > order,
    'the browser is still consulted first');
  assert.ok(/document\.documentElement\.lang = JALOR_DEFAULT_LANGUAGE/.test(client),
    'and <html lang> starts on the same value');

  assert.ok(/return profile\.language \|\| 'fr';/.test(read('models/users.js')),
    'a user who never chose one is French on the server side too (e-mail)');
});

test('English is still the fallback for a missing string (negative)', () => {
  // This is NOT the same setting, and turning it to French would leave a key
  // with no French translation rendering nothing at all.
  const tap = read('imports/i18n/tap.js');
  assert.ok(/const DEFAULT_LANGUAGE = 'en';/.test(tap),
    'imports/i18n/tap.js must keep English as fallbackLng');
  assert.ok(/import enData from '\.\/data\/en\.i18n\.json'/.test(tap),
    'and English must stay statically bundled');
});

test('the multilingual machinery is untouched', () => {
  const dir = path.join(root, 'imports/i18n/data');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.i18n.json'));
  assert.ok(files.length > 200, `${files.length} language files - nothing was dropped`);
  const registry = read('imports/i18n/languages.js');
  assert.ok(/"fr":/.test(registry) && /"de":/.test(registry) && /"ar":/.test(registry));
  assert.ok(/rtl: true/.test(registry), 'right-to-left languages still declare it');
});

// --- terminology -------------------------------------------------------------

test('the glossary Jalor writes to', () => {
  // Board -> Tableau, List -> Liste, Card -> Carte, Due date -> Echeance,
  // Member -> Membre, Label -> Etiquette, Activity -> Activite,
  // Settings -> Parametres.
  const glossary = {
    board: 'Tableau',
    boards: 'Tableaux',
    list: 'Liste',
    lists: 'Listes',
    card: 'Carte',
    cards: 'Cartes',
    labels: 'Étiquettes',
    'due-date': 'Échéance',
    members: 'Membres',
    activity: 'Activité',
    activities: 'Activités',
    settings: 'Paramètres',
  };
  for (const [key, expected] of Object.entries(glossary)) {
    assert.strictEqual(fr[key], expected, `fr.i18n.json: ${key}`);
  }
});

test('"member" is one word throughout, not two', () => {
  // WeKan's French called a board member a "participant", which collided with
  // "Participating" - the notification state - and was not the word the rest of
  // the interface used. Every one of the 50-odd strings was moved to "membre".
  const offenders = Object.entries(fr)
    .filter(([, v]) => typeof v === 'string' && /\bparticipants?\b/i.test(v))
    .map(([k]) => k);
  assert.deepStrictEqual(offenders, [],
    'these still say participant where they mean member');
  // ...and the state kept a word of its own rather than being renamed to match.
  assert.strictEqual(fr.participating, 'Participation');
});

test('and every French variant says the same thing', () => {
  // fr-FR, not fr, is what a browser set to "Français (France)" actually loads,
  // so a glossary that only holds in fr.i18n.json is a glossary most French
  // users never see. That was the bug: the header navigation still read "Mes
  // Cartes" and "Chercher" after fr.i18n.json had been corrected.
  const fr = JSON.parse(read('imports/i18n/data/fr.i18n.json'));
  for (const tag of ['fr-FR', 'fr-CH', 'fr-CA', 'fr-BE']) {
    const doc = JSON.parse(read(`imports/i18n/data/${tag}.i18n.json`));
    const offenders = Object.entries(doc)
      .filter(([, v]) => typeof v === 'string' && /\bparticipants?\b/i.test(v))
      .map(([k]) => k);
    assert.deepStrictEqual(offenders, [], `${tag} still says participant`);

    for (const key of ['board', 'boards', 'list', 'card', 'labels', 'due-date',
      'members', 'settings', 'my-cards', 'search', 'dueCards-title', 'participating',
      'memberPopup-title', 'memberMenuPopup-title', 'officeReportTitle',
      'api-calls', 'attachment-limit-unit-bytes']) {
      assert.strictEqual(doc[key], fr[key],
        `${tag}: ${key} disagrees with fr.i18n.json`);
    }
  }
});

test('the reports that had never been translated now are', () => {
  for (const key of ['officeReportTitle', 'office-logins', 'office-first-seen',
    'office-last-seen', 'office-no-results', 'api-calls', 'api-first-called',
    'api-last-called', 'api-no-calls', 'api-report-desc', 'office-report-desc']) {
    assert.ok(fr[key] && fr[key] !== en[key], `${key} is still the English source`);
  }
});

test('the French file is still in en.i18n.json key order', () => {
  // Every language file is `key -> string` in ONE order. A key inserted in one
  // file and appended in another makes every later diff unreadable.
  const enKeys = Object.keys(en);
  const frKeys = Object.keys(fr);
  assert.deepStrictEqual(frKeys, enKeys,
    'fr.i18n.json must hold exactly en.i18n.json\'s keys, in the same order');
});

console.log(`\njalorFrench: ${passed} tests passed`);
