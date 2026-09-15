'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const zgh = read('imports/i18n/data/zgh.i18n.json');
const en = read('imports/i18n/data/en.i18n.json');
const ledger = read('releases/translations/audited-corrections.json');
const pairs = {
  'import-board-c': 'import-board',
  'invite-people': 'invitePeoplePopup-title',
  'no-name': 'custom-field-dropdown-unknown',
  'stats-scope': 'type',
  size: 'export-card-attachment-size',
  'backup-restore': 'restore',
};
const tokens = value => [...value.matchAll(/__[A-Za-z0-9_]+__|%(?:\d+\$)?[sd]/g)]
  .map(([token]) => token).sort();

for (const [key, source] of Object.entries(pairs)) {
  assert.equal(en[key].toLowerCase(), en[source].toLowerCase(),
    `${key} and ${source} must keep the same English meaning`);
  assert.equal(zgh[key], zgh[source], `${key} reuses the native local term`);
  assert.doesNotMatch(zgh[key], /[\u0600-\u06ff]/u,
    `${key} cannot regress to Arabic-seeded prose`);
  assert.deepEqual(tokens(zgh[key]), tokens(en[key]),
    `${key} preserves its exact format tokens`);
  assert.equal(ledger.filter(row => row.locale === 'zgh' &&
    row.key === key && row.after === zgh[key]).length, 1,
  `${key} has one exact correction record`);
}

const uses = {
  'import-board-c': 'client/components/sidebar/sidebar.jade',
  'invite-people': 'client/components/users/userHeader.jade',
  'no-name': 'client/components/cards/resultCard.jade',
  'stats-scope': 'client/components/settings/attachments.jade',
  'backup-restore': 'client/components/settings/attachments.jade',
};
for (const [key, file] of Object.entries(uses)) {
  assert.ok(fs.readFileSync(path.join(root, file), 'utf8').includes(`{{_ '${key}'}}`),
    `${key} remains wired to its production UI control`);
}
console.log('Tamazight shared UI noun and action translations pass.');
