'use strict';

// The Upcoming release repairs every locale that had four placeholder mismatches.
// Run: node tests/upcomingQuadruplePlaceholderRepair.test.cjs

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
  'eo', 'ja-HI', 'ko-KR', 'ko', 'ms-MY', 'ms', 'sv', 'te-IN',
  'uz-AR', 'uz-LA', 'uz-UZ', 'uz', 'vi-VN', 'vi',
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

test('Esperanto comments reject copied Spanish prose', () => {
  const translated = readLanguage('eo');
  const values = [
    translated['activity-editComment'],
    translated['activity-deleteComment'],
  ].join('\n');
  assert.match(values, /redaktis|forigis/);
  assert.doesNotMatch(values, /comentario|editado|eliminado/);
});

test('Japanese hiragana and Uzbek Arabic variants use their declared scripts', () => {
  const hiragana = readLanguage('ja-HI')['avatar-too-big'];
  assert.match(hiragana, /おおきすぎます|さいだい/);
  assert.doesNotMatch(hiragana, /最大520KB/);

  const arabicUzbek = [
    readLanguage('uz-AR')['act-addSubtask'],
    readLanguage('uz-AR')['activity-checklist-uncompleted'],
  ].join('\n');
  assert.match(arabicUzbek, /[\u0600-\u06ff]/u);
  assert.doesNotMatch(arabicUzbek, /Roʻyxat|nazorat|toʻldirilmagan/);
});

test('Korean member prompt contains each value placeholder once', () => {
  for (const language of ['ko-KR', 'ko']) {
    const value = readLanguage(language)['remove-member-pop'];
    assert.deepStrictEqual(inventory(value), [
      '__boardTitle__', '__name__', '__username__',
    ]);
  }
});

test('translated and malformed named tokens cannot return', () => {
  const repairedValues = [
    readLanguage('ms')['act-addAttachment'],
    readLanguage('ms')['act-addChecklist'],
    readLanguage('sv')['n-n-of-n-cards-found'],
    readLanguage('sv')['operator-number-expected'],
    readLanguage('vi')['act-withCardTitle'],
  ].join('\n');
  assert.doesNotMatch(
    repairedValues,
    /__(?:senarai|papan|slut|totala|värde|kartu|Panel)__/,
  );
});

console.log(`\nupcomingQuadruplePlaceholderRepair: ${passed} tests passed`);
