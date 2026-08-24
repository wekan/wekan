'use strict';

// The Upcoming release repairs every locale that had three placeholder mismatches.
// Run: node tests/upcomingTriplePlaceholderRepair.test.cjs

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
  'ast-ES', 'bg', 'cs-CZ', 'cs', 'da', 'fa-IR', 'fa', 'he-IL', 'he',
  'ja-JP', 'ja', 'ka', 'mk', 'sk', 'sr', 'ta', 've-PP', 'xh',
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

test('Xhosa no longer contains spaced machine placeholder remnants', () => {
  assert.doesNotMatch(JSON.stringify(readLanguage('xh')), /@+\s*PH\d+\s*@+/i);
});

test('wrong-language tier values use their declared languages', () => {
  const danish = readLanguage('da')['operator-number-expected'];
  assert.doesNotMatch(danish, /förväntade|värde/);
  assert.match(danish, /forventede|__value__/);

  const slovak = readLanguage('sk')['operator-limit-invalid'];
  assert.doesNotMatch(slovak, /není|musí být/);
  assert.match(slovak, /nie je|musí byť/);

  const venda = readLanguage('ve-PP')['email-verifyEmail-subject'];
  assert.doesNotMatch(venda, /Varmista|sähköposti/);
  assert.match(venda, /Khwathisedzani|__siteName__/);
});

test('Macedonian values reject Bulgarian and Serbian carryovers', () => {
  const translated = readLanguage('mk');
  const values = [
    translated['act-addChecklistItem'],
    translated['act-removeChecklistItem'],
    translated['act-setCustomField'],
  ].join('\n');
  assert.match(values, /додаде|отстрани|приспособеното/);
  assert.doesNotMatch(values, /добавен|премахнат|је изменио/);
});

test('translated and malformed named tokens cannot return', () => {
  const serialized = repairedLanguages
    .map(language => JSON.stringify(readLanguage(language)))
    .join('\n');
  assert.doesNotMatch(
    serialized,
    /__(?:operador|slut|totala|värde|اندازه|لوح|User|დაფა|ბარათი|laud)__|__siteName-ზე__|__list __|__ card__/,
  );
});

console.log(`\nupcomingTriplePlaceholderRepair: ${passed} tests passed`);
