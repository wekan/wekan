'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const repairedLanguages = ['or_IN', 'tk_TM', 'ug'];
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

test('Odia card ranges reject the remaining machine-marker fragment', () => {
  const value = readLanguage('or_IN')['n-n-of-n-cards-found'];
  assert.deepStrictEqual(inventory(value), ['__end__', '__start__', '__total__']);
  assert.doesNotMatch(value, /PH\d|@@/);
});

test('Turkmen member removal names the member and board once', () => {
  const value = readLanguage('tk_TM')['remove-member-pop'];
  assert.deepStrictEqual(inventory(value), [
    '__boardTitle__', '__name__', '__username__',
  ]);
});

test('Uyghur search help retains every predicate token', () => {
  const value = readLanguage('ug')['globalSearch-instructions-operator-has'];
  for (const token of [
    '__predicate_due__', '__predicate_end__', '__predicate_assignee__',
    '__predicate_member__',
  ]) assert.match(value, new RegExp(token));
});

console.log(`\nupcomingResidualMachinePlaceholderRepair: ${passed} tests passed`);
