#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ['km', 'km-KH', 'km_KH'];
const translatedKeys = [
  'officeReportTitle', 'office-report-desc', 'office-logins',
  'office-first-seen', 'office-last-seen', 'office-shared',
  'office-no-results', 'api-report-desc', 'api-calls',
  'api-first-called', 'api-last-called', 'api-no-calls',
];

test('Khmer translates every translatable report placeholder', () => {
  for (const code of codes) {
    const lang = read(code);
    for (const key of translatedKeys) {
      assert.notEqual(lang[key], english[key], `${code}.${key} remains English`);
      assert.match(lang[key], /[\u1780-\u17ff]/u, `${code}.${key} must contain Khmer`);
    }
  }
});

test('Khmer variants use the same report vocabulary', () => {
  const base = read('km');
  for (const code of codes.slice(1)) {
    const lang = read(code);
    for (const key of translatedKeys) assert.equal(lang[key], base[key], `${code}.${key}`);
  }
  assert.equal(base.officeReportTitle, 'ទីតាំងចូល');
});

test('Khmer keeps intentionally universal API labels and configuration literals', () => {
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

