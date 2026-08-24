'use strict';

// The Upcoming release completes Odia and Punjabi Office/API reports.
// Run: node tests/upcomingOdiaPunjabiTranslations.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const odia = readLanguage('or_IN');
const punjabi = readLanguage('pa');
const translatedKeys = [
  'officeReportTitle', 'office-report-desc', 'office-logins',
  'office-first-seen', 'office-last-seen', 'office-shared',
  'office-no-results', 'api-report-desc', 'api-calls',
  'api-first-called', 'api-last-called', 'api-no-calls',
];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('both languages translate every report placeholder', () => {
  for (const language of [odia, punjabi]) {
    for (const key of translatedKeys) {
      assert.notStrictEqual(language[key], english[key], `${key} is still English`);
    }
  }
});

test('each language uses its own script', () => {
  for (const key of translatedKeys) {
    assert.match(odia[key], /\p{Script=Oriya}/u, `or_IN ${key} lacks Odia`);
    assert.doesNotMatch(odia[key], /\p{Script=Gurmukhi}/u, `or_IN ${key} uses Gurmukhi`);
    assert.match(punjabi[key], /\p{Script=Gurmukhi}/u, `pa ${key} lacks Gurmukhi`);
    assert.doesNotMatch(punjabi[key], /\p{Script=Oriya}/u, `pa ${key} uses Odia`);
  }
});

test('technical tokens remain recognizable', () => {
  for (const language of [odia, punjabi]) {
    assert.match(language['office-report-desc'], /IPv4/);
    assert.match(language['office-report-desc'], /IPv6/);
    assert.match(language['api-report-desc'], /REST API/);
    assert.match(language['api-no-calls'], /REST API/);
    assert.match(language['api-no-calls'], /WITH_API=true/);
  }
});

test('universal API labels remain unchanged', () => {
  for (const language of [odia, punjabi]) {
    assert.strictEqual(language.apiReportTitle, 'API');
    assert.strictEqual(language['api-endpoint'], 'API');
  }
});

console.log(`\nupcomingOdiaPunjabiTranslations: ${passed} tests passed`);
