'use strict';

// The Upcoming release repairs coherent five-mismatch locale variants.
// Run: node tests/upcomingFivePlaceholderRepair.test.cjs

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
  'fr-BE', 'fr-CA', 'fr-CH', 'fr-FR', 'fr',
  'de-AT', 'de-CH', 'de', 'de_DE', 'hi-IN', 'hi',
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

test('search examples use literals without inventing extra tokens', () => {
  for (const language of ['fr-BE', 'fr-CA', 'fr-CH', 'fr-FR', 'fr']) {
    const translated = readLanguage(language);
    assert.match(translated['globalSearch-instructions-operator-at'], /user:<nom>/);
    assert.doesNotMatch(translated['globalSearch-instructions-operator-at'], /__operator_user__:/);
    assert.match(translated['globalSearch-instructions-operator-has'], /`has:-due`/);
  }
  for (const language of ['de-AT', 'de-CH', 'de', 'de_DE']) {
    assert.match(
      readLanguage(language)['globalSearch-instructions-operator-has'],
      /`has:-due`/,
    );
  }
});

test('Hindi email placeholders contain no embedded spaces', () => {
  for (const language of ['hi-IN', 'hi']) {
    const value = readLanguage(language)['email-verifyEmail-text'];
    assert.match(value, /__user__/);
    assert.match(value, /__url__/);
    assert.doesNotMatch(value, /__user __|__url __|__आकार__/);
  }
});

test('named activity tokens cannot return in the wrong role', () => {
  for (const language of repairedLanguages) {
    const serialized = JSON.stringify(readLanguage(language));
    assert.doesNotMatch(serialized, /__customFieldValue(?!__)|__operator_has:-__/);
  }
});

console.log(`\nupcomingFivePlaceholderRepair: ${passed} tests passed`);
