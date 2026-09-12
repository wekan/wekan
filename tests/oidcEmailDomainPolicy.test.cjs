'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { isEmailDomainAllowed } = require('../packages/wekan-oidc/emailDomainPolicy');

assert.equal(isEmailDomainAllowed(undefined, undefined), true);
assert.equal(isEmailDomainAllowed(undefined, ''), true);
assert.equal(isEmailDomainAllowed('person@EXAMPLE.internal', ' example.internal, other.internal '), true);
assert.equal(isEmailDomainAllowed('person@other.internal', 'example.internal,other.internal'), true);
assert.equal(isEmailDomainAllowed('person@intranet', 'intranet'), true);
for (const email of [undefined, null, {}, '', '@example.internal', 'person@evil.internal',
  'person@sub.example.internal', 'person@example.internal.evil', 'person@@example.internal',
  'person@example.internal ', 'person@example.internal\n']) {
  assert.equal(isEmailDomainAllowed(email, 'example.internal'), false, String(email));
}
for (const config of [' ', ',', 'example.internal,', '*.internal', 'example..internal',
  '-example.internal', 'example-.internal', 'https://example.internal', {}]) {
  assert.equal(isEmailDomainAllowed('person@example.internal', config), false, String(config));
}
const source = fs.readFileSync(path.join(__dirname, '../packages/wekan-oidc/oidc_server.js'), 'utf8');
const guard = source.indexOf('if (!isEmailDomainAllowed(serviceData.email, process.env.OAUTH2_ALLOWED_EMAIL_DOMAINS))');
assert.ok(guard > source.indexOf('mergeWhitelistedClaims('));
assert.ok(guard < source.indexOf("await Meteor.callAsync('groupRoutineOnLogin'"));
assert.ok(guard < source.indexOf("await Meteor.callAsync('boardRoutineOnLogin'"));
assert.match(source.slice(guard, guard + 220), /throw new Meteor.Error\(403, 'Login forbidden'\)/);
// Exercise the actual OAuth callback against an intranet provider response.
// Denied logins must not reach either routine that mutates memberships.
const vm = require('node:vm');
const callbackSource = source.slice(source.indexOf("OAuth.registerService('oidc'"), source.indexOf('var userAgent'));
async function handshake(email, restriction) {
  let callback;
  const calls = [];
  const context = {
    OAuth: { registerService(name, version, options, handler) { callback = handler; } },
    process: { env: {
      OAUTH2_EMAIL_MAP: 'mail', OAUTH2_ID_MAP: 'sub',
      OAUTH2_ALLOWED_EMAIL_DOMAINS: restriction,
    } },
    getToken: async () => ({ access_token: 'fake-provider-token' }),
    getUserInfo: async () => ({ sub: 'existing-or-new-user', mail: email }),
    getTokenContent: () => null,
    getConfiguration: async () => ({}),
    mergeWhitelistedClaims() {}, isEmailDomainAllowed,
    Meteor: {
      Error: class extends Error { constructor(code, reason) { super(reason); this.error = code; } },
      callAsync: async name => calls.push(name),
    },
  };
  vm.runInNewContext(callbackSource, context);
  try { return { result: await callback({}), calls }; }
  catch (error) { return { error, calls }; }
}
(async () => {
  const allowed = await handshake('person@example.internal', 'example.internal');
  assert.equal(allowed.result.serviceData.email, 'person@example.internal');
  assert.deepEqual(allowed.calls, ['groupRoutineOnLogin', 'boardRoutineOnLogin']);
  for (const email of ['person@evil.internal', undefined]) {
    const denied = await handshake(email, 'example.internal');
    assert.equal(denied.error.error, 403);
    assert.deepEqual(denied.calls, []);
  }
  const unrestricted = await handshake('person@other.internal', undefined);
  assert.ok(unrestricted.result);
  console.log('oidcEmailDomainPolicy: positive, negative and actual OAuth callback checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
