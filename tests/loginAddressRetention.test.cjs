'use strict';
// Sign-in addresses expire (docs/Compliance/README.md WP-2): on the account, in
// loginAddresses and in shortPasswordLogins, an entry whose last use is older
// than LOGIN_ADDRESS_RETENTION_DAYS (default 365) is removed once a day; an
// address still in use stays; 0 keeps everything.
// Run: node tests/loginAddressRetention.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const lib = require('../models/lib/loginAddressRetention');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const now = Date.parse('2026-11-22T12:00:00Z');
const day = 24 * 60 * 60 * 1000;
assert.equal(lib.retentionDays({}), 365);
assert.equal(lib.retentionDays({ LOGIN_ADDRESS_RETENTION_DAYS: '30' }), 30);
assert.equal(lib.retentionDays({ LOGIN_ADDRESS_RETENTION_DAYS: '0' }), 0, '0 keeps them');
assert.equal(lib.retentionDays({ LOGIN_ADDRESS_RETENTION_DAYS: 'x' }), 365, 'negative: not a number is the default');
assert.equal(lib.cutoffFor(0, now), null);
const cutoff = lib.cutoffFor(365, now);

const user = { loginAddresses: { entries: {
  old: { value: '10.0.0.1', at: new Date(now - 400 * day), count: 3 },
  recent: { value: '10.0.0.2', at: new Date(now - 10 * day), count: 9 },
  nodate: { value: '10.0.0.3' },
} } };
assert.deepEqual(lib.userUnset(user, cutoff), { 'loginAddresses.entries.old': '' }, 'only the address not used for a year');
assert.equal(lib.userUnset({ loginAddresses: { entries: { recent: user.loginAddresses.entries.recent } } }, cutoff), null);
assert.equal(lib.userUnset({}, cutoff), null);
assert.equal(lib.userUnset(user, null), null, 'negative: no cutoff (0 days) removes nothing');

assert.deepEqual(lib.addressDecision({ at: new Date(now - 500 * day) }, cutoff), { remove: true, unset: null }, 'an address nobody used for a year goes');
assert.deepEqual(lib.addressDecision({ at: new Date(now - day), users: { entries: {
  anna: { at: new Date(now - 400 * day) }, ben: { at: new Date(now - day) } } } }, cutoff),
{ remove: false, unset: { 'users.entries.anna': '' } }, 'an office still in use loses only who stopped using it');

const server = read('server/lib/loginAddressRetention.js');
assert.match(server, /claimDailyJob\(LoginAddresses\.rawDatabase\(\), 'login-address-retention'\)/, 'once a day for the installation');
assert.match(server, /ShortPasswordLogins\.rawCollection\(\)\.deleteMany\(\{ at: \{ \$lt: cutoff \} \}\)/);
assert.match(server, /LoginAddresses\.rawCollection\(\)\.deleteMany\(\{ at: \{ \$lt: cutoff \} \}\)/);
assert.match(read('server/imports.js'), /import '\/server\/lib\/loginAddressRetention';/);
console.log('loginAddressRetention: stale addresses expire, recent ones stay, 0 keeps them');

// P3 (docs/Compliance/README.md): LOGIN_ADDRESS_RECORDED=false writes no
// sign-in address down at all.
assert.equal(lib.addressRecorded({}), true);
assert.equal(lib.addressRecorded({ LOGIN_ADDRESS_RECORDED: 'false' }), false);
assert.equal(lib.addressRecorded({ LOGIN_ADDRESS_RECORDED: ' FALSE ' }), false);
assert.equal(lib.addressRecorded({ LOGIN_ADDRESS_RECORDED: 'true' }), true);
{
  const tally = read('server/lib/loginTally.js');
  const body = tally.slice(tally.indexOf('export async function recordLogin('));
  assert.match(body.slice(0, 400), /if \(!require\('\/models\/lib\/loginAddressRetention'\)\.addressRecorded\(\{ LOGIN_ADDRESS_RECORDED: process\.env\.LOGIN_ADDRESS_RECORDED \}\)\) return;/,
    'checked first, before anything is written');
  assert.match(read('server/lib/shortPasswordLogins.js'), /address: recorded \? value : ''/,
    'a short-password sign-in is still listed, without where from');
}
