'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { guardPasswordlessPayload, recordPasswordlessLimitDenial } =
  require('../models/lib/passwordlessRequestGuard.cjs');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('closed registration blocks account creation without changing selector or user data', () => {
  const payload = { selector: { email: 'new@example.invalid' },
    userData: { email: 'new@example.invalid', passwordless: true },
    options: { userCreationDisabled: false } };
  const guarded = guardPasswordlessPayload(payload, true);
  assert.deepEqual(guarded, { ...payload, options: { userCreationDisabled: true } });
  assert.equal(payload.options.userCreationDisabled, false);
  assert.strictEqual(guardPasswordlessPayload(payload, false), payload);
});

test('malformed requests remain malformed for the upstream validator', () => {
  for (const payload of [null, [], { selector: { email: 'a@b.co' }, options: 0 },
    { selector: { email: 'a@b.co' }, options: [] }]) {
    assert.strictEqual(guardPasswordlessPayload(payload, true), payload);
  }
});

test('only rejected passwordless requests create a Security Report event', () => {
  const events = [];
  const record = event => events.push(event);
  assert.equal(recordPasswordlessLimitDenial({ allowed: true },
    { clientAddress: '192.0.2.10' }, record), false);
  assert.equal(recordPasswordlessLimitDenial({ allowed: false },
    { clientAddress: '192.0.2.10' }, record), true);
  assert.deepEqual(events, [{
    key: 'brute.passwordless-request', action: 'blocked',
    source: 'requestLoginTokenForUser', ip: '192.0.2.10',
    detail: 'passwordless code request rate limit exceeded',
  }]);
  assert.doesNotThrow(() => recordPasswordlessLimitDenial({ allowed: false }, {},
    () => { throw new Error('report unavailable'); }));
  const { CATALOG } = require('../models/lib/securityCategories.js');
  assert.equal(CATALOG['brute.passwordless-request'].category, 'brute-force');
});

test('the client and server use the Meteor 3.6 passwordless contract', () => {
  const client = read('client/components/main/layouts.js');
  const server = read('server/lib/oauthProviders.js');
  assert.match(client, /selector: \{ email \}, userData: \{ email, passwordless: true \}/);
  assert.match(server, /guardPasswordlessPayload\(payload, registrationClosed\)/);
  assert.match(server, /check\(payload, Match\.Any\)/);
  assert.match(server, /name: 'requestLoginTokenForUser', clientAddress\(\) \{ return true; \}/);
  assert.match(server, /recordPasswordlessLimitDenial/);
});

test('HttpOnly cookie hardening is enabled in both WeKan runtimes', () => {
  assert.match(read('server/accounts-common.js'),
    /clientStorage: 'none',[\s\S]*?useHttpOnlyCookies: true/);
  assert.match(read('client/00-startup.js'),
    /Accounts\.config\(\{ clientStorage: 'none', useHttpOnlyCookies: true \}\)/);
});
