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
  'boardInfoOnMyBoardsPopup-title', 'boardInfoOnMyBoards-title',
  'cardCustomFieldsPopup-title', 'changeLanguagePopup-title',
  'changeSettingsPopup-title', 'copyCardPopup-title',
  'createBoardPopup-title', 'chooseBoardSourcePopup-title',
  'createLabelPopup-title', 'editLabelPopup-title',
  'editNotificationPopup-title', 'editProfilePopup-title',
  'headerBarCreateBoardPopup-title',
];
for (const key of keys) {
  assert.ok(en[key], `${key}: English source exists`);
  assert.match(zgh[key], /[\u2d30-\u2d7f]/u, `${key}: native Tifinagh`);
  assert.doesNotMatch(zgh[key], /[\u0600-\u06ff]/u,
    `${key}: Arabic seed removed`);
}
assert.equal(zgh['boardInfoOnMyBoardsPopup-title'], zgh['boardInfoOnMyBoards-title']);
assert.equal(zgh['changeSettingsPopup-title'], zgh['change-settings']);
assert.equal(zgh['editProfilePopup-title'], zgh['edit-profile']);
assert.equal(zgh['createLabelPopup-title'], zgh['label-create']);
assert.equal(zgh['chooseBoardSourcePopup-title'], zgh['import-board']);
assert.equal(zgh['createBoardPopup-title'], zgh['headerBarCreateBoardPopup-title']);
assert.ok(zgh['changeLanguagePopup-title'].endsWith(zgh.language));
assert.ok(zgh['cardCustomFieldsPopup-title'].endsWith(
  zgh['filter-custom-fields-label'].split(' ⵙ ')[1]));
assert.ok(zgh['editNotificationPopup-title'].endsWith('ⵜⴰⵏⵖⵎⵉⵙⵜ'));
assert.ok(zgh['remove-member-pop'].includes('ⵜⴰⵏⵖⵎⵉⵙⵜ'));
console.log('zghCommonPopupTitles: native popup terms and wrong-language negatives verified');
