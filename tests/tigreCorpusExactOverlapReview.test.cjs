'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const tigre = read('tig');
const tigrinya = read('ti');
const english = read('en');
const reviewed = {
  website: ['Website', 'መውቅዕ'],
  'theme-category-special': ['Special', 'ፍንቱይ'],
  'r-set-button-triggers': ['Buttons', 'ሰድፈታት'],
  collections: ['collections', 'አከቦታት'],
};
for (const [key, [source, result]] of Object.entries(reviewed)) {
  assert.equal(english[key], source, `${key}: expected source sense`);
  assert.equal(tigre[key], result, `${key}: reviewed Tigre result`);
  assert.notEqual(tigre[key], tigrinya[key], `${key}: Tigrinya seed removed`);
}
console.log('Four Tigre exact-overlap controls reviewed.');
