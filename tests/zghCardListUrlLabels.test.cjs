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
  'link-card': 'ⴰⵙⵖⵏ ⵖⵔ ⵜⴽⴰⵕⴹⴰ ⴰⴷ',
  'link-list': 'ⴰⵙⵖⵏ ⵖⵔ ⵜⴱⴷⴰⵔⵜ ⴰⴷ',
};
const tokens = value => [...value.matchAll(/__[A-Za-z0-9_]+__|%(?:\d+\$)?[sd]/g)]
  .map(([token]) => token).sort();

for (const [key, value] of Object.entries(expected)) {
  assert.equal(zgh[key], value);
  assert.ok(value.startsWith(zgh['link-to-search'].split(' ⵓⵔⵣⵣⵓ')[0]),
    `${key} follows the existing URL-link phrase`);
  assert.doesNotMatch(value, /[\u0600-\u06ff]/u,
    `${key} cannot regress to Arabic-seeded prose`);
  assert.deepEqual(tokens(value), tokens(en[key]),
    `${key} preserves source tokens`);
  assert.equal(ledger.filter(row => row.locale === 'zgh' &&
    row.key === key && row.after === value).length, 1,
  `${key} has one exact correction record`);
}
assert.match(zgh['link-list'], /ⵜⴱⴷⴰⵔⵜ/u,
  'the list URL uses the existing Tabdart list noun');
assert.notEqual(zgh['link-card'], zgh['link-list'],
  'card and list URL labels remain distinct');

const cardJade = fs.readFileSync(path.join(root,
  'client/components/cards/cardDetails.jade'), 'utf8');
const listJade = fs.readFileSync(path.join(root,
  'client/components/lists/listHeader.jade'), 'utf8');
assert.match(cardJade, /span \{\{_ 'link-card'\}\}[\s\S]{0,240}input\.inline-input\(type="text" id="cardURL" readonly/u,
  'the card label identifies a read-only URL');
assert.match(listJade, /span \{\{_ 'link-list'\}\}[\s\S]{0,650}input\.inline-input\(type="text" readonly/u,
  'the list label identifies a read-only URL');
assert.match(zgh['linkCardPopup-title'], /[\u0600-\u06ff]/u,
  'the distinct Link Card action remains a separate review item');
console.log('Tamazight card/list URL labels and source contexts pass.');
