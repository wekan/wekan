'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const readLocale = code => JSON.parse(fs.readFileSync(path.join(root,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = readLocale('en');
const zgh = readLocale('zgh');
const ledger = JSON.parse(fs.readFileSync(path.join(root,
  'releases/translations/audited-corrections.json'), 'utf8'));
const expected = {
  'copy-link-to-clipboard': 'ⵙⵙⵏⵖⵍ ⴰⵙⵖⵏ ⵖⵔ «ⵖⴼ ⵓⴼⵓⵙ»',
  'leaveBoardPopup-title': 'ⴼⴼⵖ ⵙⴳ ⵜⴼⵍⵡⵉⵜ?',
  'memberMenuPopup-title': 'ⵜⵉⵙⵖⴰⵍ ⵏ ⵓⴳⵎⴰⵎ',
  'moveCardPopup-title': 'ⵙⵎⵓⵜⵜⵉ ⵜⴰⴽⴰⵕⴹⴰ',
  'removeMemberPopup-title': 'ⴽⴽⵙ ⴰⴳⵎⴰⵎ?',
};
const tokens = value => [...value.matchAll(/__[A-Za-z0-9_]+__|%(?:\d+\$)?[sd]/g)]
  .map(([token]) => token).sort();
for (const [key, value] of Object.entries(expected)) {
  assert.equal(zgh[key], value);
  assert.doesNotMatch(value, /[\u0600-\u06ff]/u,
    `${key} cannot regress to the Arabic seed`);
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key} preserves source placeholders`);
  assert.equal(ledger.filter(row => row.locale === 'zgh' &&
    row.key === key && row.after === value).length, 1,
  `${key} has one exact correction record`);
}
assert.equal(zgh['memberMenuPopup-title'], zgh['memberPopup-title']);
assert.equal(zgh['leaveBoardPopup-title'], `${zgh['leave-board']}?`);
assert.equal(zgh['removeMemberPopup-title'], `${zgh['remove-member']}?`);
assert.ok(zgh['r-move-card-to'].startsWith(zgh['moveCardPopup-title']),
  'Move Card uses the phrase already shown by move-card actions');
assert.equal(zgh['copy-card-link-to-clipboard'].replace(' ⵏ ⵜⴽⴰⵕⴹⴰ', ''),
  zgh['copy-link-to-clipboard'],
  'Copy Link shares the same existing copy/link/clipboard phrase');
const cardDetails = fs.readFileSync(path.join(root,
  'client/components/cards/cardDetails.jade'), 'utf8');
assert.match(cardDetails, /\{\{_ 'moveCardPopup-title'\}\}/,
  'the card menu still displays the repaired Move Card label');
console.log('Tamazight popup reuse and source-wiring checks pass.');
