'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
const tig = read('tig');
const ti = read('ti');
const en = read('en');
const terms = {
  rename: 'ስሜት ቀይር',
  'attachmentRenamePopup-title': 'ስሜት ቀይር',
  'board-change-background-image': 'ተምስል ለሀላ መበገሲ ቀይር',
  'boardChangeBackgroundImagePopup-title': 'ተምስል ለሀላ መበገሲ ቀይር',
  'allBoardsChangeBackgroundImagePopup-title': 'ተምስል ለሀላ መበገሲ ቀይር',
  'boardBackgroundsPopup-title': 'መበገሲታት ምዱድ',
  'board-backgrounds': 'መበገሲታት ምዱድ',
  'boardBackgrounds-title': 'መበገሲታት ምዱድ',
};
for (const [key, value] of Object.entries(terms)) {
  assert.equal(tig[key], value);
  assert.notEqual(tig[key], ti[key]);
}
assert.equal(en['color-darkgreen'], 'darkgreen');
assert.equal(tig['color-darkgreen'], 'ጽልም አክደር');
assert.notEqual(tig['color-darkgreen'], ti['color-darkgreen']);
assert.notEqual(tig['color-darkgreen'], 'ጸሊም ቀጠልያ');
assert.equal(en['color-slateblue'], 'slateblue');
assert.equal(tig['color-slateblue'], 'ስሌት አዝረቁ');
assert.notEqual(tig['color-slateblue'], ti['color-slateblue']);
assert.notEqual(tig['color-slateblue'], 'ስሌት ሰማያዊ');
for (const key of ['color-red', 'color-black']) {
  assert.equal(tig[key], ti[key], `${key}: independently attested shared Tigre term`);
}
assert.match(tig.rename, /^ስሜት /);
assert.match(tig['board-change-background-image'], /^ተምስል /);
console.log('Checked eight Tigre visual and Rename controls.');
