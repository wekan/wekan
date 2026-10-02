'use strict';

// Guard: SignupBleed, DDP sibling (2026-10-02). With "Disable registration"
// on, the sign-up form's ATCreateUserServer method still created an account
// for anyone who added `from: 'admin'` or `ldap: true` to the options - the
// hook that decides trusted them, and the method passes the client's options
// (all but the profile) through to Accounts.createUser.
// Run: node tests/signupBleedDdp.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { clientCreationOptions, SERVER_ONLY_CREATION_OPTIONS } = require('../models/lib/clientAccountCreation');

test('the reported attack: a client sign-up loses the server-only options', () => {
  for (const extra of [{ from: 'admin' }, { ldap: true }, { from: 'admin', ldap: true }]) {
    const sent = { username: 'mallory', email: 'm@example.com', password: { digest: 'x', algorithm: 'sha-256' }, ...extra };
    const { options, refused } = clientCreationOptions(sent);
    assert.deepEqual(Object.keys(options).sort(), ['email', 'password', 'username']);
    assert.deepEqual(refused.sort(), Object.keys(extra).sort());
    assert.equal(sent.from, extra.from, 'the caller\'s object is not mutated');
  }
  // An ordinary sign-up, with an invitation code, passes unchanged (negative).
  const ordinary = { username: 'u', email: 'u@example.com', password: 'x', profile: { invitationcode: 'abc' } };
  assert.deepEqual(clientCreationOptions(ordinary), { options: ordinary, refused: [] });
  assert.deepEqual(SERVER_ONLY_CREATION_OPTIONS, ['from', 'ldap']);
});

test('the createUser DDP method is wrapped, loaded, and records the attempt', () => {
  const guard = read('server/lib/clientAccountCreationGuard.js');
  // Both client sign-up methods: useraccounts' ATCreateUserServer is the one
  // the sign-up form uses, and it hands the client's options (all but the
  // profile) to Accounts.createUser - found by the browser test, 2026-10-02.
  assert.match(guard, /export const CLIENT_ACCOUNT_CREATION_METHODS = \['ATCreateUserServer', 'createUser'\];/);
  assert.match(guard, /if \(typeof original === 'function' && !original\.__wekanClientOptionsGuard\) handlers\[name\] = guard\(name, original\);/);
  assert.match(guard, /return original\.call\(this, clean, \.\.\.rest\);/);
  // The client's own arguments are check()ed, or audit-argument-checks fails
  // every ordinary sign-up (found by the browser test, 2026-10-02).
  assert.ok(guard.indexOf('check(options, Match.Any);') < guard.indexOf('clientCreationOptions(options)'));
  assert.match(guard, /rest\.forEach\(arg => check\(arg, Match\.Any\)\);/);
  assert.match(guard, /key: 'authz\.register', action: 'blocked', source: `ddp:\$\{methodName\}`/);
  assert.match(guard, /catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
  assert.match(read('server/imports.js'), /import '\/server\/lib\/clientAccountCreationGuard';/);
});

test('negative: every option onCreateUser trusts as a server-only signal is stripped from clients', () => {
  const users = read('server/models/users.js');
  const hook = users.slice(users.indexOf('Accounts.onCreateUser('), users.indexOf('\n});', users.indexOf('Accounts.onCreateUser(')));
  // An option that returns early (skipping the registration checks) is a
  // server-only signal; each must be in the stripped list.
  const trusted = [...hook.matchAll(/options(?:\s*&&\s*options)?\.(\w+)(?:\s*===\s*'[^']*'|\s*===\s*true)?\)\s*\{[^}]*?return user;/g)].map(m => m[1]);
  assert.ok(trusted.includes('from') && trusted.includes('ldap'), `found ${trusted}`);
  for (const option of trusted) assert.ok(SERVER_ONLY_CREATION_OPTIONS.includes(option), `${option} is trusted but not stripped`);
});
