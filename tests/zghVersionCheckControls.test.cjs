'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const zgh = read('imports/i18n/data/zgh.i18n.json');
const en = read('imports/i18n/data/en.i18n.json');
const ledger = read('releases/translations/audited-corrections.json');
const keys = ['check-version', 'version-check-failed'];
const tokens = value => [...value.matchAll(/__[A-Za-z0-9_]+__|%(?:\d+\$)?[sd]/g)]
  .map(([token]) => token).sort();

for (const key of keys) {
  assert.match(zgh[key], /ⵙⵙⵉⴷⴻⴷ/u,
    `${key} names the version-check action`);
  assert.match(zgh[key], /ⵜⵓⵏⵖⵉⵍⵜ/u,
    `${key} uses the same native version noun as the Admin Panel rows`);
  assert.doesNotMatch(zgh[key], /[\u0600-\u06ff]|Cocher|Erreur/u,
    `${key} cannot regress to mixed-language text`);
  assert.deepEqual(tokens(zgh[key]), tokens(en[key]),
    `${key} keeps source tokens`);
  assert.equal(ledger.filter(row => row.locale === 'zgh' &&
    row.key === key && row.after === zgh[key]).length, 1,
  `${key} has one exact correction record`);
}
assert.match(zgh['version-check-failed'], /ⵓⵔ ⵉⵣⵎⵉⵔ ⴰⵔⴰ/u,
  'the failure text retains the existing could-not construction');
assert.match(zgh['version-check-failed'], /ⴰⵎⴹⴰⵏ/u,
  'the failure text names the version number');

const jade = fs.readFileSync(path.join(root,
  'client/components/settings/informationBody.jade'), 'utf8');
const js = fs.readFileSync(path.join(root,
  'client/components/settings/informationBody.js'), 'utf8');
assert.match(jade, /\{\{_ 'check-version'\}\}/,
  'the Admin Panel button displays the checked label');
assert.match(js, /TAPi18n\.__\('version-check-failed'\)/,
  'the failure path displays the checked error message');
console.log('Tamazight version-check button and failure text pass.');
