'use strict';

// #6942: why a sign-in was refused, for the administrator - every refusal in
// Admin Panel / Problems with its precise reason, grouped on the Summary with
// how to fix it - while the person signing in keeps one generic message.
// Run: node --test tests/loginRefusals.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const L = require('../models/lib/loginRefusals');
const { adminPath } = require('../models/lib/adminUrls');

test('a failed password sign-in is named by its reason', () => {
  assert.equal(L.reasonOfPasswordFailure({ reason: 'User not found' }), 'unknown-user');
  assert.equal(L.reasonOfPasswordFailure({ reason: 'Incorrect password' }, { _id: 'u' }), 'bad-password');
  assert.equal(L.reasonOfPasswordFailure({ reason: 'Login forbidden' }, { loginDisabled: true }), 'account-disabled');
  assert.equal(L.reasonOfPasswordFailure({ error: 'too-many-requests' }), 'braked');
  assert.equal(L.reasonOfPasswordFailure({ error: 'LDAP-login-error' }), null, 'LDAP records its own reason');
  assert.equal(L.sourceFor('nonsense'), 'login:unknown');
});

test('the Summary: one row per reason, most frequent first, the latest who and when', () => {
  const rows = [
    { source: 'login:bad-password', count: 3, firstAt: new Date('2026-11-20'), at: new Date('2026-11-23'), username: 'ann', ip: '10.0.0.1' },
    { source: 'login:bad-password', count: 2, firstAt: new Date('2026-11-21'), at: new Date('2026-11-24'), username: 'bob', ip: '10.0.0.2' },
    { source: 'login:ldap-not-in-allowed-group', count: 9, at: new Date('2026-11-22'), username: 'p.peters' },
    { source: 'ddp-login', count: 50 },
  ];
  const s = L.summarize(rows);
  assert.deepEqual(s.map(r => [r.reason, r.count]), [['ldap-not-in-allowed-group', 9], ['bad-password', 5]]);
  assert.equal(s[1].username, 'bob', 'the latest');
  assert.equal(s[1].firstAt.toISOString().slice(0, 10), '2026-11-20');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const reason of Object.keys(L.REASONS)) {
    assert.ok(en[`login-refused-${reason}`], reason);
    assert.ok(en[`login-refused-${reason}-fix`], `${reason} fix`);
    const [page, slug] = L.REASONS[reason].pane;
    assert.ok(adminPath(page, slug).endsWith(`/${slug}`), `${reason}: ${page}/${slug}`);
  }
});

test('negative: the person signing in gets one generic message, whatever the reason', () => {
  const ldap = read('packages/wekan-ldap/server/loginHandler.js');
  assert.equal((ldap.match(/new Meteor\.Error\('LDAP-login-error'/g) || []).length, 1, 'one place makes the error');
  assert.match(ldap, /return new Meteor\.Error\('LDAP-login-error', 'LDAP authentication failed'\);/);
  assert.doesNotMatch(ldap, /failed with provided username|already a matching Wekan account/, 'no username echoed, no "that account exists"');
  for (const reason of ['malformed-credentials', 'ldap-bad-credentials', 'ldap-not-in-allowed-group', 'ldap-bound-to-another-entry', 'ldap-account-not-linked']) {
    assert.match(ldap, new RegExp(`throw refuseLdapLogin\\('${reason}'`), reason);
  }
});

test('negative: recording a refusal never blocks the account tried', () => {
  const cat = read('models/lib/securityCategories.js').split('\n').find(l => l.includes("'authn.login-refused':"));
  assert.match(cat, /blocksAccount: false/);
  const srv = read('server/lib/loginRefusals.js');
  assert.match(srv, /targetUserId: targetUserId \|\| undefined,/, 'the account is the target, never the actor');
  assert.doesNotMatch(srv.slice(srv.indexOf('export function recordLoginRefusal'), srv.indexOf('global.__wekanLoginRefused')), /userId:/);
  assert.match(srv, /if \(!user \|\| user\.isAdmin !== true \|\| user\.loginDisabled === true\) throw new Meteor\.Error\('error-notAuthorized'\);/);
  assert.match(read('server/imports.js'), /import '\/server\/lib\/loginRefusals';/);
});

test('the Summary shows each area\'s most frequent kinds and the refusals with their fix', () => {
  assert.match(read('models/eventLog.js'), /sort: \{ count: -1, at: -1 \}, limit: 3,/);
  const jade = read('client/components/settings/problemsSummary.jade');
  assert.match(jade, /each row in area\.top/);
  assert.match(jade, /a\(href="\{\{paneHref pane\}\}"\) \{\{_ fixKey\}\}/);
});
