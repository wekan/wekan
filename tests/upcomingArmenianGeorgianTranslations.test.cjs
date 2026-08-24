'use strict';

// The Upcoming release completes Armenian and Georgian Office/API reports.
// Run: node tests/upcomingArmenianGeorgianTranslations.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const armenian = readLanguage('hy');
const georgian = readLanguage('ka');
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
  for (const language of [armenian, georgian]) {
    for (const key of translatedKeys) {
      assert.notStrictEqual(language[key], english[key], `${key} is still English`);
    }
  }
});

test('each language uses its own script', () => {
  for (const key of translatedKeys) {
    assert.match(armenian[key], /\p{Script=Armenian}/u, `hy ${key} lacks Armenian`);
    assert.doesNotMatch(armenian[key], /\p{Script=Georgian}/u, `hy ${key} uses Georgian`);
    assert.match(georgian[key], /\p{Script=Georgian}/u, `ka ${key} lacks Georgian`);
    assert.doesNotMatch(georgian[key], /\p{Script=Armenian}/u, `ka ${key} uses Armenian`);
  }
});

test('technical tokens remain recognizable', () => {
  for (const language of [armenian, georgian]) {
    assert.match(language['office-report-desc'], /IPv4/);
    assert.match(language['office-report-desc'], /IPv6/);
    assert.match(language['api-report-desc'], /REST API/);
    assert.match(language['api-no-calls'], /REST API/);
    assert.match(language['api-no-calls'], /WITH_API=true/);
  }
});

test('universal API labels remain unchanged', () => {
  for (const language of [armenian, georgian]) {
    assert.strictEqual(language.apiReportTitle, 'API');
    assert.strictEqual(language['api-endpoint'], 'API');
  }
});

console.log(`\nupcomingArmenianGeorgianTranslations: ${passed} tests passed`);
