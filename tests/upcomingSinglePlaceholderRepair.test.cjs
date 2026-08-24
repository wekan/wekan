'use strict';

// The Upcoming release repairs every locale that had one placeholder mismatch.
// Run: node tests/upcomingSinglePlaceholderRepair.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const repairedLanguages = [
  'es-AR', 'gl-ES', 'gl', 'gu-IN', 'hu', 'pl-PL', 'pl',
  'pt_PT', 'pt-BR', 'pt-PT', 'pt',
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

test('named placeholders keep their exact English spelling and case', () => {
  assert.match(
    readLanguage('es-AR')['act-removeChecklistItem'],
    /__checkList__/,
  );
  assert.match(
    readLanguage('gu-IN')['act-uncheckedItem'],
    /__checklistItem__/,
  );
  for (const language of ['pl-PL', 'pl']) {
    const value = readLanguage(language)['act-moveCardToOtherBoard'];
    assert.match(value, /__list__/);
    assert.doesNotMatch(value, /__listy__/);
  }
});

test('format placeholders are present without obsolete named tokens', () => {
  for (const language of ['gl-ES', 'gl', 'hu', 'pt_PT', 'pt-BR', 'pt-PT', 'pt']) {
    const translated = readLanguage(language);
    const key = language === 'hu'
      ? 'activity-checklist-uncompleted-card'
      : 'activity-subtask-added';
    assert.deepStrictEqual(inventory(translated[key]), ['%s']);
  }
  assert.doesNotMatch(
    readLanguage('hu')['activity-checklist-uncompleted-card'],
    /__(?:checklist|card|list|swimlane|board)__/
  );
});

test('Galician repairs no longer use copied Portuguese wording', () => {
  for (const language of ['gl-ES', 'gl']) {
    const value = readLanguage(language)['activity-subtask-added'];
    assert.match(value, /^engadiu a subtarefa a %s$/);
    assert.doesNotMatch(value, /adicionou|sub-tarefa/);
  }
});

console.log(`\nupcomingSinglePlaceholderRepair: ${passed} tests passed`);
