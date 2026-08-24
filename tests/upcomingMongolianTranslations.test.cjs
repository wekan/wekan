'use strict';

// The Upcoming release completes the Mongolian Office/API reports.
// Run: node tests/upcomingMongolianTranslations.test.cjs

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
const translatedKeys = [
  'officeReportTitle', 'office-report-desc', 'office-logins',
  'office-first-seen', 'office-last-seen', 'office-shared',
  'office-no-results', 'api-report-desc', 'api-calls',
  'api-first-called', 'api-last-called', 'api-no-calls',
];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('every report placeholder is translated', () => {
  for (const key of translatedKeys) {
    assert.notStrictEqual(mongolian[key], english[key], `${key} is still English`);
  }
});

test('every translated value uses Cyrillic text', () => {
  for (const key of translatedKeys) {
    assert.match(mongolian[key], /\p{Script=Cyrillic}/u, `${key} lacks Cyrillic text`);
  }
});

test('technical tokens remain recognizable', () => {
  assert.match(mongolian['office-report-desc'], /IPv4/);
  assert.match(mongolian['office-report-desc'], /IPv6/);
  assert.match(mongolian['api-report-desc'], /REST API/);
  assert.match(mongolian['api-no-calls'], /REST API/);
  assert.match(mongolian['api-no-calls'], /WITH_API=true/);
});

test('universal API labels remain unchanged', () => {
  assert.strictEqual(mongolian.apiReportTitle, 'API');
  assert.strictEqual(mongolian['api-endpoint'], 'API');
});

console.log(`\nupcomingMongolianTranslations: ${passed} tests passed`);
