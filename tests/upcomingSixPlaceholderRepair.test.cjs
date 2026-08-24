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
const repairedLanguages = [
  'az-AZ', 'az-LA', 'az', 'ca_ES', 'ca', 'ca@valencia',
  'ru_RU', 'ru-RU', 'ru-UA', 'ru',
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
        inventory(translated[key] || ''), inventory(source),
        `${language}:${key} changed a placeholder`,
      );
    }
  }
});

test('Catalan search instructions reject corrupted predicate tokens', () => {
  for (const language of ['ca_ES', 'ca', 'ca@valencia']) {
    const translated = readLanguage(language);
    const values = [
      translated['globalSearch-instructions-operator-has'],
      translated['globalSearch-instructions-operator-sort'],
    ].join('\n');
    assert.match(values, /__predicate_assignee__/);
    assert.match(values, /__predicate_modified__/);
    assert.doesNotMatch(values, /____predicate__|__predicat_due__|predicat_due/);
  }
});

test('Russian subjects and printf placeholders use exact source forms', () => {
  for (const language of ['ru_RU', 'ru-RU', 'ru-UA', 'ru']) {
    const translated = readLanguage(language);
    for (const key of [
      'email-enrollAccount-subject',
      'email-resetPassword-subject',
      'email-verifyEmail-subject',
    ]) {
      assert.match(translated[key], /__siteName__/);
      assert.doesNotMatch(translated[key], /__url__/);
    }
    for (const key of [
      'label-not-found', 'label-color-not-found', 'operator-unknown-error',
    ]) assert.doesNotMatch(translated[key], /%1/);
  }
});

test('Azerbaijani activity messages retain every location value', () => {
  for (const language of ['az-AZ', 'az-LA', 'az']) {
    const translated = readLanguage(language);
    assert.deepStrictEqual(inventory(translated['act-createCard']), [
      '__board__', '__card__', '__list__', '__swimlane__',
    ]);
    assert.strictEqual(inventory(translated['activity-unchecked-item']).length, 3);
  }
});

console.log(`\nupcomingSixPlaceholderRepair: ${passed} tests passed`);
