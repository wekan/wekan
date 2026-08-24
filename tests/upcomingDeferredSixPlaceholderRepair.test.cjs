'use strict';

// The Upcoming release repairs Italian and two wrongly seeded six-mismatch files.
// Run: node tests/upcomingDeferredSixPlaceholderRepair.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const repairedLanguages = ['it', 've-CC', 'vo'];
const tokenPattern = /__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g;
const inventory = value => (value.match(tokenPattern) || []).sort();

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('every repaired locale has the English placeholder inventory', () => {
  for (const language of repairedLanguages) {
    const translated = readLanguage(language);
    for (const [key, source] of Object.entries(english)) {
      assert.deepStrictEqual(
        inventory(translated[key] || ''), inventory(source),
        `${language}:${key} changed a placeholder`,
      );
    }
  }
});

test('Venda repairs reject their Italian seed prose', () => {
  const translated = readLanguage('ve-CC');
  const values = [
    translated['act-addChecklist'],
    translated['act-createCustomField'],
    translated['act-deleteCustomField'],
    translated['activity-changedListTitle'],
    translated['activity-checklist-uncompleted'],
    translated['act-a-dueAt'],
  ].join('\n');
  assert.match(values, /mutevhe|tshimu|bodo|Lini|Ngafhi/);
  assert.doesNotMatch(values, /aggiunta|campo personalizzato|lista rinominata|Scadenza/);
});

test('Volapük repairs reject Esperanto and French seed prose', () => {
  const translated = readLanguage('vo');
  const values = [
    translated['act-addLabel'],
    translated['act-removeChecklistItem'],
    translated['act-setCustomField'],
    translated['globalSearch-instructions-operator-at'],
    translated['globalSearch-instructions-operator-has'],
  ].join('\n');
  assert.match(values, /pelüükon|pämoükon|pevotükon|gebanem/);
  assert.doesNotMatch(values, /Aldonita|etikedo|a supprimé|a édité|raccourci|recherche/);
});

test('due-time activities retain when, where and previous values', () => {
  for (const language of ['it', 've-CC']) {
    assert.deepStrictEqual(inventory(readLanguage(language)['act-a-dueAt']), [
      '__card__', '__timeOldValue__', '__timeValue__',
    ]);
  }
});

console.log(`\nupcomingDeferredSixPlaceholderRepair: ${passed} tests passed`);
