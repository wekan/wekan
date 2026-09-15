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
  comments: 'ⵉⵖⴼⴰⵡⴰⵍⵏ',
  link: 'ⴰⵙⵖⵏ',
  'email-addresses': 'ⴰⵏⵙⵉⵡⵏ ⵏ ⵉⵎⴰⵢⵍ',
};
const tokens = value => [...value.matchAll(/__[A-Za-z0-9_]+__|%(?:\d+\$)?[sd]/g)]
  .map(([token]) => token).sort();
for (const [key, value] of Object.entries(expected)) {
  assert.equal(zgh[key], value, `${key} uses native Tamazight terminology`);
  assert.doesNotMatch(value, /[\u0600-\u06ff]/u,
    `${key} cannot regress to the Arabic seed`);
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key} preserves source placeholders`);
  assert.equal(ledger.filter(row => row.locale === 'zgh' &&
    row.key === key && row.after === value).length, 1,
  `${key} has exactly one correction record`);
}
assert.match(zgh['card-comments-title'], /ⵉⵖⴼⴰⵡⴰⵍⵏ/u,
  'Comments reuses the plural already shown on cards');
assert.match(zgh['link-to-search'], /ⴰⵙⵖⵏ/u,
  'Link reuses the existing search-link noun');
assert.equal(zgh['email-address'], 'ⴰⵏⵙⴰ ⵏ ⵉⵎⴰⵢⵍ',
  'Email Addresses preserves the established email compound');
assert.notEqual(zgh['email-addresses'], zgh['email-address'],
  'The plural label stays distinct from the singular address');
console.log('Tamazight common noun translations and correction ledger pass.');
