#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ['vi', 'vi-VN'];
const translatedKeys = [
  'officeReportTitle', 'office-report-desc', 'office-logins',
  'office-first-seen', 'office-last-seen', 'office-shared',
  'office-no-results', 'api-report-desc', 'api-calls',
  'api-first-called', 'api-last-called', 'api-no-calls',
];

test('Vietnamese translates every translatable report placeholder', () => {
  for (const code of codes) {
    const lang = read(code);
    for (const key of translatedKeys) {
      assert.notEqual(lang[key], english[key], `${code}.${key} remains English`);
      assert.match(lang[key], /[ăâđêôơưà-ỹ]/iu, `${code}.${key} must contain Vietnamese`);
    }
  }
});

test('Vietnamese variants use the same report vocabulary', () => {
  const base = read('vi');
  const regional = read('vi-VN');
  for (const key of translatedKeys) assert.equal(regional[key], base[key], `vi-VN.${key}`);
  assert.equal(base.officeReportTitle, 'Địa điểm đăng nhập');
});

test('Vietnamese keeps intentionally universal API labels and configuration literals', () => {
  for (const code of codes) {
    const lang = read(code);
    assert.equal(lang.apiReportTitle, 'API');
    assert.equal(lang['api-endpoint'], 'API');
    assert.match(lang['office-report-desc'], /IPv4/);
    assert.match(lang['office-report-desc'], /IPv6/);
    assert.match(lang['api-report-desc'], /REST API/);
    assert.match(lang['api-no-calls'], /REST API/);
    assert.match(lang['api-no-calls'], /WITH_API=true/);
  }
});

