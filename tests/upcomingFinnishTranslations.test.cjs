'use strict';

// The Upcoming release completes the Finnish Office and API report strings.
// Keep every report key translated while preserving product and protocol names.
// Run: node tests/upcomingFinnishTranslations.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const finnish = readLanguage('fi');
const reportKeys = Object.keys(english).filter(key =>
  key === 'officeReportTitle'
  || key === 'apiReportTitle'
  || key.startsWith('office-')
  || key.startsWith('api-report-')
  || key.startsWith('api-first-')
  || key.startsWith('api-last-')
  || key === 'api-endpoint'
  || key === 'api-calls'
  || key === 'api-no-calls');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('upcomingFinnishTranslations:');

test('every Office and API report key exists in Finnish', () => {
  assert.strictEqual(reportKeys.length, 17, 'update the expected report-key inventory intentionally');
  for (const key of reportKeys) {
    assert.strictEqual(typeof finnish[key], 'string', `${key} is missing`);
    assert.ok(finnish[key].trim(), `${key} is empty`);
  }
});

test('none of the report prose remains the English placeholder (negative)', () => {
  const intentionallyUniversal = new Set(['apiReportTitle', 'api-endpoint']);
  for (const key of reportKeys) {
    if (!intentionallyUniversal.has(key)) {
      assert.notStrictEqual(finnish[key], english[key], `${key} is still English`);
    }
  }
});

test('REST API and WITH_API stay recognizable in translated descriptions', () => {
  assert.match(finnish['api-report-desc'], /REST API/);
  assert.match(finnish['api-no-calls'], /REST API/);
  assert.match(finnish['api-no-calls'], /WITH_API=true/);
});

console.log(`\nupcomingFinnishTranslations: ${passed} tests passed`);
