'use strict';

// The Upcoming release completes Macedonian and Serbian Office/API reports.
// Run: node tests/upcomingMacedonianSerbianTranslations.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const languages = ['mk', 'sr'].map(readLanguage);
const translatedKeys = [
  'officeReportTitle',
  'office-report-desc',
  'office-logins',
  'office-first-seen',
  'office-last-seen',
  'office-shared',
  'office-no-results',
  'api-report-desc',
  'api-calls',
  'api-first-called',
  'api-last-called',
  'api-no-calls',
];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('both languages translate every report placeholder', () => {
  for (const language of languages) {
    for (const key of translatedKeys) {
      assert.notStrictEqual(language[key], english[key], `${key} is still English`);
    }
  }
});

test('both languages use Cyrillic report prose', () => {
  for (const language of languages) {
    for (const key of translatedKeys) {
      assert.match(language[key], /\p{Script=Cyrillic}/u, `${key} lacks Cyrillic text`);
    }
  }
});

test('the two languages retain distinct established vocabulary', () => {
  for (const key of translatedKeys) {
    assert.notStrictEqual(languages[0][key], languages[1][key], `${key} was copied`);
  }
});

test('technical tokens and universal API labels remain recognizable', () => {
  for (const language of languages) {
    assert.match(language['office-report-desc'], /IPv4/);
    assert.match(language['office-report-desc'], /IPv6/);
    assert.match(language['api-report-desc'], /REST API/);
    assert.match(language['api-no-calls'], /REST API/);
    assert.match(language['api-no-calls'], /WITH_API=true/);
    assert.strictEqual(language.apiReportTitle, 'API');
    assert.strictEqual(language['api-endpoint'], 'API');
  }
});

console.log(`\nupcomingMacedonianSerbianTranslations: ${passed} tests passed`);
