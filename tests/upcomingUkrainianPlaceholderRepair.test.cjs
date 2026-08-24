'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const pattern = /__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g;
const inventory = value => (value.match(pattern) || []).sort();
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('both Ukrainian variants have the English placeholder inventory', () => {
  for (const language of ['uk', 'uk-UA']) {
    const translated = read(language);
    for (const [key, source] of Object.entries(english)) {
      assert.deepStrictEqual(inventory(translated[key] || ''), inventory(source),
        `${language}:${key} changed a placeholder`);
    }
  }
});

test('Ukrainian search help retains every operator and predicate identifier', () => {
  for (const language of ['uk', 'uk-UA']) {
    const translated = read(language);
    const values = Object.entries(translated)
      .filter(([key]) => key.startsWith('globalSearch-instructions-'))
      .map(([, value]) => value).join('\n');
    assert.match(values, /__operator_board__/);
    assert.match(values, /__predicate_quarter__/);
    assert.doesNotMatch(values, /оператор operator|отримано 'value'/);
  }
});

console.log(`\nupcomingUkrainianPlaceholderRepair: ${passed} tests passed`);
