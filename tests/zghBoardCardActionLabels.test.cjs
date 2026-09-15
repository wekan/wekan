'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const zgh = read('imports/i18n/data/zgh.i18n.json');
const en = read('imports/i18n/data/en.i18n.json');
const ledger = read('releases/translations/audited-corrections.json');
const expected = {
  'my-boards': 'ⵜⵉⴼⵍⵡⵉⵏ ⵉⵏⵓ',
  'my-cards': 'ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ ⵉⵏⵓ',
  'to-boards': 'ⵖⵔ ⵜⵉⴼⵍⵡⵉⵏ',
  'close-board': 'ⵔⴳⵍ ⵜⴰⴼⵍⵡⵉⵜ',
  'remove-from-board': 'ⴽⴽⵙ ⵙⴳ ⵜⴼⵍⵡⵉⵜ',
  'remove-member-from-card': 'ⴽⴽⵙ ⵙⴳ ⵜⴽⴰⵕⴹⴰ',
};
const tokens = value => [...value.matchAll(/__[A-Za-z0-9_]+__|%(?:\d+\$)?[sd]/g)]
  .map(([token]) => token).sort();

for (const [key, value] of Object.entries(expected)) {
  assert.equal(zgh[key], value, `${key} uses local native components`);
  assert.doesNotMatch(value, /[\u0600-\u06ff]|\bMes\b/u,
    `${key} cannot regress to Arabic/French prose`);
  assert.deepEqual(tokens(value), tokens(en[key]),
    `${key} preserves exact source tokens`);
  assert.equal(ledger.filter(row => row.locale === 'zgh' &&
    row.key === key && row.after === value).length, 1,
  `${key} has one correction record`);
}
assert.equal(zgh['my-cards'], zgh['shortcut-filter-my-cards'].replace(/^ⵣⵉⵣⴷⵉⴳ /u, ''),
  'My Cards reuses the exact shortcut-filter phrase');
assert.match(zgh['my-boards'], /ⵉⵏⵓ$/u,
  'My Boards uses the same possessive as My Attachments');
assert.equal(zgh['close-board'], `${zgh.close} ⵜⴰⴼⵍⵡⵉⵜ`,
  'Close Board reuses the existing command');
assert.equal(zgh['remove-from-board'], `${zgh['remove-member'].split(' ')[0]} ⵙⴳ ⵜⴼⵍⵡⵉⵜ`,
  'board removal keeps the member-removal verb and from-board phrase');
assert.equal(zgh['remove-member-from-card'], `${zgh['remove-member'].split(' ')[0]} ⵙⴳ ⵜⴽⴰⵕⴹⴰ`,
  'card removal keeps the member-removal verb and from-card phrase');

for (const [key, file] of Object.entries({
  'my-cards': 'client/components/main/myCards.jade',
  'to-boards': 'client/components/users/userHeader.jade',
  'remove-from-board': 'client/components/sidebar/sidebar.jade',
  'remove-member-from-card': 'client/components/cards/cardDetails.jade',
})) {
  assert.ok(fs.readFileSync(path.join(root, file), 'utf8').includes(`{{_ '${key}'}}`),
    `${key} remains wired to its active UI`);
}
console.log('Tamazight board/card headings and removal actions pass.');
