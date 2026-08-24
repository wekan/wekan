'use strict';

// The Upcoming release repairs every locale that had two placeholder mismatches.
// Run: node tests/upcomingDoublePlaceholderRepair.test.cjs

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
  'cy-GB', 'cy', 'el-GR', 'el', 'es-CL', 'es-CO', 'es-LA', 'es-MX',
  'es-PE', 'es-PY', 'es', 'es_CO', 'eu', 'fi', 'hr', 'sl', 'sl_SI',
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

test('Welsh no longer contains machine placeholder remnants', () => {
  for (const language of ['cy-GB', 'cy']) {
    const serialized = JSON.stringify(readLanguage(language));
    assert.doesNotMatch(serialized, /@+PH\d+@+/);
  }
});

test('Greek activity text is not duplicated in English', () => {
  for (const language of ['el-GR', 'el']) {
    const value = readLanguage(language)['act-checkedItem'];
    assert.doesNotMatch(value, /^checked /);
    assert.doesNotMatch(value, /\n/);
    assert.match(value, /^επιλέχθηκε /);
  }
});

test('Basque operator text no longer contains Catalan prose or tokens', () => {
  const value = readLanguage('eu')['operator-number-expected'];
  assert.match(value, /__operator__/);
  assert.doesNotMatch(value, /l'operador|esperava|obtenir|__operador__/);
});

test('restored printf placeholders stay in their activity messages', () => {
  for (const language of [
    'es-CL', 'es-CO', 'es-LA', 'es-PE', 'es-PY', 'es', 'es_CO',
  ]) {
    const translated = readLanguage(language);
    assert.match(translated['activity-editComment'], /%s/);
    assert.match(translated['activity-deleteComment'], /%s/);
  }
  assert.match(readLanguage('hr')['activity-joined'], /%s/);
});

console.log(`\nupcomingDoublePlaceholderRepair: ${passed} tests passed`);
