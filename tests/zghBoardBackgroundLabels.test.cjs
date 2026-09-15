'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${name}.i18n.json`), 'utf8'));
const en = read('en');
const zgh = read('zgh');

const keys = [
  'board-change-color', 'board-change-background-image',
  'board-background-image-url', 'add-background-image',
  'remove-background-image', 'boardChangeColorPopup-title',
  'boardChangeBackgroundImagePopup-title',
  'allBoardsChangeColorPopup-title',
  'allBoardsChangeBackgroundImagePopup-title',
];
for (const key of keys) {
  assert.ok(en[key], `${key}: source exists`);
  assert.match(zgh[key], /[\u2d30-\u2d7f]/u, `${key}: native Tifinagh`);
  assert.doesNotMatch(zgh[key], /[\u0600-\u06ff]/u,
    `${key}: Arabic seed removed`);
}
assert.equal(zgh['board-change-color'], zgh['change-color']);
assert.equal(zgh['allBoardsChangeColorPopup-title'], zgh['change-color']);
for (const key of ['boardChangeBackgroundImagePopup-title',
  'allBoardsChangeBackgroundImagePopup-title']) {
  assert.equal(zgh[key], zgh['board-change-background-image']);
}
const image = zgh['upload-background'].split(' ').slice(1).join(' ');
for (const key of ['board-change-background-image',
  'board-background-image-url', 'add-background-image',
  'remove-background-image']) {
  assert.ok(zgh[key].endsWith(image), `${key}: native background-image noun`);
}
assert.equal(zgh['board-background-image-url'].split(' ')[0], 'URL');
assert.ok(zgh['add-background-image'].startsWith(zgh['add-checklist'].split(' ')[0] + ' '));
assert.ok(zgh['remove-background-image'].startsWith(zgh['remove-member'].split(' ')[0] + ' '));
assert.ok(zgh['set-as-active'].includes('ⴰⴳⴰⵍⵉⵙ'),
  'board-backdrop noun is independently present in the locale');
assert.ok(zgh['boardChangeColorPopup-title'].includes('ⴰⴳⴰⵍⵉⵙ'),
  'board background uses local board-backdrop noun');
console.log('zghBoardBackgroundLabels: native board image/color controls verified');
