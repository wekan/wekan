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
  info: 'ⵜⵓⵏⵖⵉⵍⵜ',
  Meteor_version: 'ⵜⵓⵏⵖⵉⵍⵜ ⵏ Meteor',
  MongoDB_version: 'ⵜⵓⵏⵖⵉⵍⵜ ⵢⴻⵎⵚⴰⴷⴰⵏ ⴷ MongoDB',
  FerretDB_version: 'ⵜⵓⵏⵖⵉⵍⵜ ⵏ FerretDB',
  Node_version: 'ⵜⵓⵏⵖⵉⵍⵜ ⵏ Node',
};
const tokens = value => [...value.matchAll(/__[A-Za-z0-9_]+__|%(?:\d+\$)?[sd]/g)]
  .map(([token]) => token).sort();
const statisticsPane = fs.readFileSync(path.join(root,
  'client/components/settings/informationBody.jade'), 'utf8');

for (const [key, value] of Object.entries(expected)) {
  assert.equal(zgh[key], value, `${key} uses the native version noun`);
  assert.doesNotMatch(value, /[\u0600-\u06ff]/u,
    `${key} cannot regress to Arabic-seeded prose`);
  assert.doesNotMatch(value, /\bVersion\b/u,
    `${key} cannot regress to the French/English version loan`);
  assert.deepEqual(tokens(value), tokens(en[key]),
    `${key} preserves English format tokens`);
  assert.ok(statisticsPane.includes(`{{_ '${key}'}}`),
    `${key} labels a real Admin Panel version row`);
  assert.equal(ledger.filter(row => row.locale === 'zgh' &&
    row.key === key && row.after === value).length, 1,
  `${key} has one exact correction record`);
}
assert.match(zgh.MongoDB_version, /ⵢⴻⵎⵚⴰⴷⴰⵏ/u,
  'MongoDB compatible-version qualifier survives the noun repair');
console.log('Tamazight version labels and Admin Panel wiring pass.');
