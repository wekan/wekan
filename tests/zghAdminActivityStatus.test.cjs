'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${name}.i18n.json`), 'utf8'));
const en = read('en');
const zgh = read('zgh');

const activeTerm = zgh['active-person'].split(' ').at(-1);
assert.equal(en.active, 'Active');
assert.equal(en['admin-people-filter-active'], 'Active');
assert.equal(en['admin-people-filter-inactive'], 'Not Active');
assert.equal(en['admin-people-active-status'], 'Active Status');
assert.equal(zgh.active, activeTerm);
assert.equal(zgh['admin-people-filter-active'], activeTerm);
assert.equal(zgh['admin-people-filter-inactive'], zgh['inactive-member'].split(' ').slice(1).join(' '));
assert.equal(zgh['admin-people-active-status'], zgh['operator-status'] + ' ' + activeTerm);
for (const key of ['active', 'admin-people-filter-active',
  'admin-people-filter-inactive', 'admin-people-active-status']) {
  assert.match(zgh[key], /[\u2d30-\u2d7f]/u, `${key}: native Tifinagh`);
  assert.doesNotMatch(zgh[key], /[\u0600-\u06ff]|\b(?:Désactivé|Statut|actif)\b/iu,
    `${key}: wrong-language seed removed`);
}
console.log('zghAdminActivityStatus: native active, inactive and status terms verified');
