'use strict';

// The Upcoming release repairs placeholders inside four wrongly seeded locales.
// Run: node tests/upcomingSeededPlaceholderRepair.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const repairedLanguages = ['br', 'wa', 'wo', 'tlh'];
const repairedKeys = [
  'act-addSubtask',
  'act-removeChecklistItem',
  'act-setCustomField',
  'globalSearch-instructions-operator-at',
  'globalSearch-instructions-operator-has',
];
const tokenPattern = /__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g;
const inventory = value => (value.match(tokenPattern) || []).sort();

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('every repaired locale has the English placeholder inventory', () => {
  for (const language of repairedLanguages) {
    const translated = readLanguage(language);
    for (const [key, source] of Object.entries(english)) {
      assert.deepStrictEqual(
        inventory(translated[key] || ''),
        inventory(source),
        `${language}:${key} changed a placeholder`,
      );
    }
  }
});

test('Breton, Walloon and Wolof repairs reject their French seed prose', () => {
  for (const language of ['br', 'wa', 'wo']) {
    const translated = readLanguage(language);
    const values = repairedKeys.map(key => translated[key]).join('\n');
    assert.doesNotMatch(
      values,
      /a ajouté|a supprimé|a édité|raccourci|où .*champ|recherche les cartes/,
    );
  }
});

test('Klingon repairs reject their German seed prose', () => {
  const translated = readLanguage('tlh');
  const values = [
    translated['act-addChecklistItem'],
    translated['activity-checklist-completed'],
    translated['and-n-other-card'],
    translated['act-withDue'],
    translated['globalSearch-instructions-operator-has'],
  ].join('\n');
  assert.match(values, /'echletHom|tetlh|rInmoH|qawmoH|nej/);
  assert.doesNotMatch(
    values,
    /hat Checklisten|Abgeschlossene|und eine|Erinnerung|Fällig|Karten/,
  );
});

test('search examples remain literals rather than extra placeholders', () => {
  for (const language of repairedLanguages) {
    const translated = readLanguage(language);
    assert.match(translated['globalSearch-instructions-operator-at'], /user:</);
    assert.match(translated['globalSearch-instructions-operator-has'], /`has:-due`/);
    assert.doesNotMatch(
      translated['globalSearch-instructions-operator-has'],
      /__operator_has:-__/,
    );
  }
});

console.log(`\nupcomingSeededPlaceholderRepair: ${passed} tests passed`);
