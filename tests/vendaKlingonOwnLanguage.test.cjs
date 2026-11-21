'use strict';

// ve.i18n.json is Venda (Tshivenḓa) and tlh.i18n.json is Klingon (tlhIngan
// Hol), and nothing else. Both were partly seeded from other languages: the
// Venda file had Zulu and Xhosa ("Susa", "Isihloko sekhadi", "umsebenzisi",
// "amakhadi") and English, the Klingon file French ("Êtes-vous sûr…", "Tous
// les participants du tableau", "Personne", "Début", "Serveur"), German
// ("Brett", "Jeden Tag") and English. CLAUDE.md: a locale file contains its
// declared language, not whichever language happened to seed it.
// Run: node tests/vendaKlingonOwnLanguage.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Zulu/Xhosa words that are not Venda, as they appeared in the file. (Venda
// has its own: u bvisa for remove, ṱhoho for title, mushumisi for user, khadi
// for card, nzudzanyo for settings.) "thutha" is Venda, but means moving house,
// and had been used for delete.
const ZULU = /(?<![\p{L}'])(susa\p{L}*|isihloko|incazelo|ukubuka|umsebenzisi|ikhadi|ibhodi|amakhadi|izilungiselelo|okuyisisekelo|kwamukelwe|isimo|isenzo|inombolo|isizindalwazi|imeyili|qala|qedela|konke|indima|ngoku|lokhu|zonke|thutha\p{L}*)(?![\p{L}'])/iu;
// French and German in the Klingon file, matched case-sensitively: Klingon
// spelling uses capitals as letters (leS "rest" is not French les), and its
// le' ("special") carries an apostrophe.
const FRENCH = /[éèêàçùâîôûœ]|(?<![\p{L}'])([Ll]es|[Dd]es|[Uu]ne|[Pp]our|[Aa]vec|[Dd]ans|[Vv]ous|[Vv]otre|[Aa]ucun|[Aa]jouter|[Ss]upprimer|[Tt]ableau|[Cc]arte|[Ss]erveur|[Pp]ersonne|[Ss]tatut)(?![\p{L}'])/u;
const GERMAN = /[äöüß]|(?<![\p{L}'])(und|nicht|jeden|brett|anhänge|auswählen)(?![\p{L}'])/iu;

function offenders(locale, pattern) {
  const data = read(locale);
  return Object.keys(data).filter(key => typeof data[key] === 'string' && pattern.test(data[key]));
}

test('the Venda file has no Zulu or Xhosa words', () => {
  assert.deepEqual(offenders('ve', ZULU), []);
});

test('the Klingon file has no French and no German', () => {
  assert.deepEqual(offenders('tlh', FRENCH), []);
  assert.deepEqual(offenders('tlh', GERMAN), []);
});

test('neither file keeps English where a translation belongs', () => {
  // Product names, formats and units stay as they are everywhere; ordinary
  // English sentences do not.
  const sentence = /\b(the|and|your|this|with|for|cannot|please)\b.*\s\S+\s/i;
  for (const locale of ['ve', 'tlh']) {
    const data = read(locale);
    const english_ = Object.keys(english).filter(key => data[key] === english[key] && sentence.test(english[key]));
    assert.deepEqual(english_, [], locale);
  }
});

test('the words the corrections settled on are used', () => {
  const ve = read('ve');
  const tlh = read('tlh');
  assert.match(ve.delete, /bvisa/i);
  assert.match(ve.cards, /khadi/i);
  assert.doesNotMatch(ve['copyManyCardsPopup-format'], /Isihloko|Incazelo/);
  assert.deepEqual(JSON.parse(ve['copyManyCardsPopup-format']).map(card => Object.keys(card)), [
    ['title', 'description'], ['title', 'description'], ['title', 'description']]);
  assert.equal(tlh.server, "QumwI'");
  assert.doesNotMatch(tlh.person, /Personne/);
  assert.doesNotMatch(tlh['card-start'], /Début/);
});

test('every placeholder of both files is the English one', () => {
  const tokens = value => (String(value).match(/__[A-Za-z0-9_-]+__|%(?:\d+\$)?[sd]/g) || []).sort().join(' ');
  for (const locale of ['ve', 'tlh']) {
    const data = read(locale);
    const wrong = Object.keys(english).filter(key => tokens(data[key]) !== tokens(english[key]));
    assert.deepEqual(wrong, [], locale);
  }
});

test('negative: the detectors catch what was there', () => {
  assert.match('Susa i-ikhadi', ZULU);
  assert.match('Isihloko sekhadi lokuqala', ZULU);
  assert.match('Thutha bodo', ZULU);
  assert.doesNotMatch('U bvisa khadi', ZULU);
  assert.match('Êtes-vous sûr ?', FRENCH);
  assert.match('Tous les participants du tableau', FRENCH);
  assert.doesNotMatch("De' le' chenmoHlu'pu'", FRENCH, "Klingon le' is not French");
  assert.doesNotMatch("Hoch 15 tup leS Qu' nuD", FRENCH, 'Klingon leS is not French les');
  assert.match('Jeden Tag', GERMAN);
});

console.log(`\nvendaKlingonOwnLanguage: ${passed} tests passed`);
