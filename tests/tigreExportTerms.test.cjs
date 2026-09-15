'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
const tig = read('tig');
const ti = read('ti');
const terms = {
  export: 'አግዕዞ',
  'exportChartPopup-title': 'አግዕዞ',
  'r-export': 'አግዕዞ',
  'exportListPopup-title': 'ዝርዝር አግዕዞ',
  'export-list': 'ዝርዝር አግዕዞ',
  'export-board': 'ምዱድ አግዕዞ',
  'exportBoardPopup-title': 'ምዱድ አግዕዞ',
};
for (const [key, value] of Object.entries(terms)) {
  assert.equal(tig[key], value);
  assert.notEqual(tig[key], ti[key], `${key} must not retain its Tigrinya seed`);
}
assert.ok(Object.values(terms).every(value => value.endsWith('አግዕዞ')));
console.log('Checked seven Tigre Export controls.');
