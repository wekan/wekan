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
  'boardChangeTitlePopup-title', 'boardChangeVisibilityPopup-title',
  'boardChangeWatchPopup-title', 'setCardColorPopup-title',
  'setCardActionsColorPopup-title', 'setSwimlaneColorPopup-title',
  'setListColorPopup-title', 'change-visibility',
];
for (const key of keys) {
  assert.ok(en[key], `${key}: English source exists`);
  assert.match(zgh[key], /[\u2d30-\u2d7f]/u, `${key}: native Tifinagh`);
  assert.doesNotMatch(zgh[key], /[\u0600-\u06ff]/u,
    `${key}: Arabic seed removed`);
}
assert.equal(zgh['boardChangeTitlePopup-title'], zgh['rename-board']);
assert.equal(zgh['boardChangeVisibilityPopup-title'], zgh['change-visibility']);
assert.ok(zgh['boardChangeVisibilityPopup-title'].endsWith(zgh.visibility));
assert.ok(zgh['boardChangeWatchPopup-title'].endsWith(zgh.watching));
assert.ok(zgh['setCardColorPopup-title'].endsWith(zgh['change-color'].split(' ')[1]));
for (const key of ['setCardActionsColorPopup-title',
  'setSwimlaneColorPopup-title', 'setListColorPopup-title']) {
  assert.equal(zgh[key], zgh['select-color']);
}
console.log('zghBoardSettingsPopups: native settings and color titles verified');
