'use strict';

// #2290: an instance webhook on login and registration, off by default, with
// the user name and time only unless more is chosen.
// Run: node tests/accountWebhook.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { cleanAccountWebhook, sends, accountWebhookPayload } = require('../models/lib/accountWebhook.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const user = { _id: 'u1', username: 'alice', emails: [{ address: 'a@example.com' }],
  profile: { fullname: 'Alice A' }, authenticationMethod: 'ldap', services: { password: { bcrypt: 'x' } } };
const now = Date.UTC(2026, 9, 14, 12, 0, 0);

// Positive.
const login = cleanAccountWebhook({ url: 'https://hooks.example.com/x', onLogin: true }).value;
assert.equal(sends(login, 'login'), true);
assert.deepEqual(accountWebhookPayload('login', user, { config: login, ip: '10.1.2.3', now }),
  { event: 'login', username: 'alice', at: '2026-10-14T12:00:00.000Z' }, 'by default: event, user name, time - nothing else');
const all = cleanAccountWebhook({ url: 'https://h.example/x', onRegister: true, fields: ['email', 'ip', 'fullname', 'authMethod'] }).value;
assert.deepEqual(accountWebhookPayload('register', user, { config: all, ip: '10.1.2.3', now }),
  { event: 'register', username: 'alice', at: '2026-10-14T12:00:00.000Z', email: 'a@example.com', ip: '10.1.2.3', fullname: 'Alice A', authMethod: 'ldap' });
console.log('  ok - name and time by default; each extra field only when ticked');

// Negative: off by default, events separately, nothing secret ever sent.
assert.equal(sends(cleanAccountWebhook({}).value, 'login'), false);
assert.equal(sends(cleanAccountWebhook({ url: 'https://h.example/x' }).value, 'login'), false, 'an address alone sends nothing');
assert.equal(sends(login, 'register'), false, 'login does not imply registration');
assert.equal(sends({ onLogin: true }, 'login'), false, 'no address, nothing');
assert.equal(sends(login, 'logout'), false);
for (const bad of ['javascript:alert(1)', 'file:///etc/passwd', 'not a url', 'ftp://h/x']) {
  const r = cleanAccountWebhook({ url: bad, onLogin: true });
  assert.equal(r.error, 'invalid-url', bad);
  assert.equal(sends(r.value, 'login'), false);
}
assert.deepEqual(cleanAccountWebhook({ fields: ['password', 'services', 'email', 'email'] }).value.fields, ['email'], 'unknown fields dropped');
assert.equal(cleanAccountWebhook({ onLogin: 'true' }).value.onLogin, false, 'only a real true turns it on');
const body = JSON.stringify(accountWebhookPayload('login', user, { config: all, ip: 'x', now }));
assert.doesNotMatch(body, /bcrypt|services|u1/, 'never the password hash, services or the user id');
console.log('  ok - off by default, events separate, nothing beyond what was ticked');

// Server: site admin only, never published, through the SSRF guard, never blocking a login.
const server = read('server/accountWebhook.js');
assert.match(server, /async getAccountWebhook\(\) \{\s*await requireSiteAdmin\(this\.userId\);/);
assert.match(server, /async saveAccountWebhook\(input\) \{\s*check\(input, Object\);\s*await requireSiteAdmin\(this\.userId\);/);
assert.match(server, /const \{ webhookFetch \} = require\('\/server\/sandstormEgress'\);/);
assert.doesNotMatch(server, /(^|[^A-Za-z])fetch\(/, 'only webhookFetch, never a bare fetch');
assert.match(server, /Meteor\.defer\(async \(\) => \{\s*try \{/, 'fire and forget');
assert.match(server, /Accounts\.onLogin\(\(info\) => \{[\s\S]{0,200}send\('login'/);
assert.match(server, /Users\.after\.insert\(\(userId, doc\) => \{\s*if \(doc\) send\('register', doc\);/);
assert.doesNotMatch(read('server/publications/settings.js'), /accountWebhook/, 'never published');
assert.match(read('server/imports.js'), /import '\/server\/accountWebhook';/);
const jade = read('client/components/settings/settingBody.jade');
assert.match(jade, /\.account-webhook\s*\n\s*h2\.admin-pane-group-title \{\{_ 'account-webhook'\}\}/);
assert.match(jade, /a\.flex\.js-account-webhook-tick\(data-key="onLogin"\)/);
assert.match(jade, /a\.flex\.js-account-webhook-tick\(data-key="onRegister"\)/);
console.log('  ok - site admin only, unpublished, sent through the SSRF guard after the login');

console.log('\naccountWebhook: all tests passed');
