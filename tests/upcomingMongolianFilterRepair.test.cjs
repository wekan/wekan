'use strict';

// The Upcoming release replaces Russian filter labels in Mongolian.
// Run: node tests/upcomingMongolianFilterRepair.test.cjs

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
const keys = [
  'filter-dates-label', 'list-filter-label', 'filter-labels-label',
  'filter-no-label', 'filter-member-label', 'filter-no-member',
  'filter-assignee-label', 'filter-custom-fields-label',
  'other-filters-label', 'advanced-filter-label',
  'filter-card-title-label',
];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('all filter labels differ from Russian', () => {
  for (const key of keys) {
    assert.notStrictEqual(mongolian[key], russian[key], `${key} is still Russian`);
  }
});

test('all repaired filters contain Cyrillic text', () => {
  for (const key of keys) {
    assert.match(mongolian[key], /\p{Script=Cyrillic}/u, `${key} lacks Cyrillic text`);
  }
});

test('filter actions use consistent Mongolian vocabulary', () => {
  for (const key of keys.filter(key => !key.startsWith('filter-no-'))) {
    assert.match(mongolian[key], /шүү/i, `${key} lacks the Mongolian filter stem`);
  }
  assert.match(mongolian['filter-labels-label'], /Шошго/);
  assert.match(mongolian['filter-member-label'], /Гишүүн/);
  assert.match(mongolian['filter-assignee-label'], /Хариуцагч/);
});

test('common Russian filter words do not remain (negative)', () => {
  const joined = keys.map(key => mongolian[key]).join('\n');
  assert.doesNotMatch(joined, /Фильтр|Фильтровать|Отфильтровать|участник|исполнитель/iu);
});

console.log(`\nupcomingMongolianFilterRepair: ${passed} tests passed`);
