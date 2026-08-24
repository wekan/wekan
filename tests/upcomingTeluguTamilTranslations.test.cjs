'use strict';

// The Upcoming release completes Telugu and Tamil Office/API reports.
// Run: node tests/upcomingTeluguTamilTranslations.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const telugu = readLanguage('te-IN');
const tamil = readLanguage('ta');
const translatedKeys = [
  'officeReportTitle', 'office-report-desc', 'office-logins',
  'office-first-seen', 'office-last-seen', 'office-shared',
  'office-no-results', 'api-report-desc', 'api-calls',
  'api-first-called', 'api-last-called', 'api-no-calls',
];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('both languages translate every report placeholder', () => {
  for (const language of [telugu, tamil]) {
    for (const key of translatedKeys) {
      assert.notStrictEqual(language[key], english[key], `${key} is still English`);
    }
  }
});

test('each language uses its own script', () => {
  for (const key of translatedKeys) {
    assert.match(telugu[key], /\p{Script=Telugu}/u, `te-IN ${key} lacks Telugu`);
    assert.doesNotMatch(telugu[key], /\p{Script=Tamil}/u, `te-IN ${key} uses Tamil`);
    assert.match(tamil[key], /\p{Script=Tamil}/u, `ta ${key} lacks Tamil`);
    assert.doesNotMatch(tamil[key], /\p{Script=Telugu}/u, `ta ${key} uses Telugu`);
  }
});

test('technical tokens remain recognizable', () => {
  for (const language of [telugu, tamil]) {
    assert.match(language['office-report-desc'], /IPv4/);
    assert.match(language['office-report-desc'], /IPv6/);
    assert.match(language['api-report-desc'], /REST API/);
    assert.match(language['api-no-calls'], /REST API/);
    assert.match(language['api-no-calls'], /WITH_API=true/);
  }
});

test('universal API labels remain unchanged', () => {
  for (const language of [telugu, tamil]) {
    assert.strictEqual(language.apiReportTitle, 'API');
    assert.strictEqual(language['api-endpoint'], 'API');
  }
});

console.log(`\nupcomingTeluguTamilTranslations: ${passed} tests passed`);
