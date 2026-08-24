'use strict';

// The Upcoming release restores every Mongolian placeholder from English.
// Run: node tests/upcomingMongolianPlaceholderRepair.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const mongolian = readLanguage('mn');
const tokenPattern = /__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g;
const inventory = value => (value.match(tokenPattern) || []).sort();

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('every Mongolian key has the English placeholder inventory', () => {
  for (const [key, source] of Object.entries(english)) {
    assert.deepStrictEqual(
      inventory(mongolian[key] || ''),
      inventory(source),
      `${key} changed a placeholder`,
    );
  }
});

test('email subjects use siteName rather than the translated url token', () => {
  for (const key of [
    'email-enrollAccount-subject',
    'email-resetPassword-subject',
    'email-verifyEmail-subject',
  ]) {
    assert.match(mongolian[key], /__siteName__/);
    assert.doesNotMatch(mongolian[key], /__url__/);
  }
});

test('the operator error restores the exact percent placeholder', () => {
  assert.match(mongolian['operator-unknown-error'], /^%s\b/u);
  assert.doesNotMatch(mongolian['operator-unknown-error'], /%1\b/u);
});

test('the repaired prose is Mongolian rather than Russian (negative)', () => {
  const repaired = [
    mongolian['email-enrollAccount-subject'],
    mongolian['email-resetPassword-subject'],
    mongolian['email-verifyEmail-subject'],
    mongolian['operator-unknown-error'],
  ].join('\n');
  assert.doesNotMatch(repaired, /Аккаунт|Пароль|Подтвердите|оператор$/iu);
});

console.log(`\nupcomingMongolianPlaceholderRepair: ${passed} tests passed`);
