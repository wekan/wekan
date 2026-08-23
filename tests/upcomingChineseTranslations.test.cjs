'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const read = code => JSON.parse(
  fs.readFileSync(path.join(DATA, `${code}.i18n.json`), 'utf8'),
);
const en = read('en');
const simplified = ['cmn', 'wuu-Hans', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh', 'zh_SG'];
const traditional = ['yue_CN', 'zh-HK', 'zh-Hant', 'zh-TW'];
const reportKeys = [
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
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('all Chinese tags translate every Office and API report placeholder', () => {
  for (const code of [...simplified, ...traditional]) {
    const lang = read(code);
    for (const key of reportKeys) {
      assert.equal(typeof lang[key], 'string', `${code} lacks ${key}`);
      assert.notEqual(lang[key], en[key], `${code} leaves ${key} in English`);
    }
  }
});

test('simplified and traditional tags use their established scripts', () => {
  for (const code of simplified) {
    assert.equal(read(code).officeReportTitle, '办公地点', `${code} must use simplified script`);
  }
  for (const code of traditional) {
    assert.equal(read(code).officeReportTitle, '辦公地點', `${code} must use traditional script`);
  }
});

test('technical tokens remain recognizable in translated report prose', () => {
  for (const code of [...simplified, ...traditional]) {
    const lang = read(code);
    assert.match(lang['office-report-desc'], /IPv4/);
    assert.match(lang['office-report-desc'], /IPv6/);
    assert.match(lang['api-report-desc'], /REST API/);
    assert.match(lang['api-no-calls'], /REST API/);
    assert.match(lang['api-no-calls'], /WITH_API=true/);
  }
});

test('universal API labels remain universal rather than receiving invented prose', () => {
  for (const code of [...simplified, ...traditional]) {
    const lang = read(code);
    assert.equal(lang.apiReportTitle, 'API');
    assert.equal(lang['api-endpoint'], 'API');
  }
});

console.log(`\nupcomingChineseTranslations: ${passed} tests passed`);
