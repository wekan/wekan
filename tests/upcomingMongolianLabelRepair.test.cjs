'use strict';

// The Upcoming release replaces Russian label text in Mongolian.
// Run: node tests/upcomingMongolianLabelRepair.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const mongolian = readLanguage('mn');
const russian = readLanguage('ru');
const english = readLanguage('en');
const keys = [
  'act-addLabel', 'act-addedLabel', 'act-removeLabel', 'act-removedLabel',
  'deleteLabelPopup-title', 'disambiguateMultiLabelPopup-title',
  'label-default', 'label-delete-pop', 'labels', 'multi-selection-label',
  'remove-label', 'toggle-labels', 'remove-labels-multiselect',
  'showLabel-field-on-card', 'activity-added-label',
  'activity-removed-label', 'activity-added-label-card',
  'activity-removed-label-card', 'r-when-a-label-is', 'r-when-the-label',
  'r-label', 'r-d-add-label', 'r-d-remove-label',
  'hide-minicard-label-text', 'label-not-found', 'label-color-not-found',
  'operator-label', 'globalSearch-instructions-operator-label',
  'label-colors', 'label-names',
];

const tokens = value => value.match(/__[A-Za-z0-9_]+__|%s|<[^>]+>/g) || [];
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('all label values differ from Russian', () => {
  for (const key of keys) {
    assert.notStrictEqual(mongolian[key], russian[key], `${key} is still Russian`);
  }
});

test('all repaired values contain Cyrillic text', () => {
  for (const key of keys) {
    assert.match(mongolian[key], /\p{Script=Cyrillic}/u, `${key} lacks Cyrillic text`);
  }
});

test('source placeholders survive every translated label', () => {
  for (const key of keys) {
    assert.deepStrictEqual(tokens(mongolian[key]).sort(), tokens(english[key]).sort(), key);
  }
});

test('label controls use established Mongolian vocabulary', () => {
  for (const key of keys.filter(key => key !== 'showLabel-field-on-card')) {
    assert.match(mongolian[key], /шошг/i, `${key} lacks the Mongolian label stem`);
  }
});

test('common Russian label words do not remain (negative)', () => {
  const joined = keys.map(key => mongolian[key]).join('\n');
  assert.doesNotMatch(joined, /метк|Добавить|Удалить|Цвета|Названия/iu);
});

console.log(`\nupcomingMongolianLabelRepair: ${passed} tests passed`);
