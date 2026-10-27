'use strict';

// Regression coverage for CookieTokenBleed (GHSA-8phm-9rqm-v9hc): WeKan's
// browser JavaScript mirrored Meteor's persistent resume token into a readable
// cookie, and Meteor kept it in Local Storage too. Meteor 3.5's native HttpOnly
// resume-cookie flow replaces both; nothing in the client tree may write a
// login token to a cookie or to Web Storage again.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const client = read('client/00-startup.js');
const server = read('server/accounts-common.js');
const headerLogin = read('server/header-login.js');

for (const [where, source] of [['client', client], ['server', server]]) {
  assert.match(source, /clientStorage: 'none'/,
    `${where} must not persist the resume token in Web Storage`);
  assert.match(source, /useHttpOnlyCookies: true/,
    `${where} must enable Meteor's native HttpOnly resume flow`);
}

assert.doesNotMatch(client, /document\.cookie\s*=/,
  'client JavaScript must never create a readable authentication cookie');
assert.match(client,
  /const legacyResumeToken = Accounts\._storedLoginToken\(\);[\s\S]*Accounts\.config\(\{ clientStorage: 'none', useHttpOnlyCookies: true \}\);/,
  'an upgrade must read its old token before config replaces local storage');
assert.doesNotMatch(client, /Accounts\.loginWithToken\(/,
  'startup must not repeat the legacy login already started by Accounts');
assert.match(client,
  /Accounts\._storeLoginToken\(legacyUserId, legacyResumeToken, legacyTokenExpires\)/,
  'the active credential and expiry must survive the switch to memory');
assert.match(client,
  /Accounts\._setHttpOnlyCookie\(legacyResumeToken, legacyTokenExpires\)/,
  'the native endpoint must validate the legacy token and create the cookie');
assert.doesNotMatch(client, /localStorage\.getItem\(['"]Meteor\.loginToken/,
  'reload recovery must not restore the old JavaScript-readable token flow');
assert.match(headerLogin, /\['Path=\/', 'SameSite=Lax', 'HttpOnly'\]/,
  'header login must issue its authentication cookies as HttpOnly');
assert.match(headerLogin, /cookieBase\.push\('Secure'\)/,
  'HTTPS header login must retain Secure in addition to HttpOnly');

// Execute the real startup block against storage with the native Accounts
// semantics. Cover both a completed initial login and one still in flight.
const vm = require('node:vm');
const startup = client.slice(client.indexOf('const legacyResumeToken ='),
  client.indexOf('// Subscribe to per-user'));
for (const pending of [false, true]) {
  const legacy = { userId: 'test-user', token: 'legacy-token', expires: '2099-01-01' };
  let storage = { ...legacy };
  let lastPolled = legacy.token;
  let cookies = 0;
  const Accounts = {
    _storedLoginToken: () => storage.token,
    _storedUserId: () => storage.userId,
    _storedLoginTokenExpires: () => storage.expires,
    _unstoreLoginToken() {
      storage = {};
      lastPolled = null;
    },
    config(options) {
      assert.equal(options.clientStorage, 'none');
      assert.equal(options.useHttpOnlyCookies, true);
      storage = {};
    },
    _storeLoginToken(userId, token, expires) {
      storage = { userId, token, expires };
      lastPolled = token;
    },
    _setHttpOnlyCookie(token, expires) {
      assert.equal(token, legacy.token);
      assert.equal(expires, legacy.expires);
      cookies++;
    },
    loginWithToken() { assert.fail('duplicate login would rebuild subscriptions'); },
    loginWithCookie() { assert.fail('legacy login is already underway'); },
  };
  vm.runInNewContext(startup, { Accounts });
  if (pending) Accounts._storeLoginToken(legacy.userId, legacy.token, legacy.expires);
  assert.deepEqual(storage, legacy);
  assert.equal(lastPolled, storage.token, 'the poller must not log out or resume again');
  assert.equal(cookies, 1);
}
let cookieResumes = 0;
vm.runInNewContext(startup, { Accounts: {
  _storedLoginToken: () => null,
  _storedUserId: () => null,
  _storedLoginTokenExpires: () => null,
  config() {},
  _storeLoginToken() { assert.fail('no legacy credential to migrate'); },
  loginWithCookie() { cookieResumes++; },
} });
assert.equal(cookieResumes, 1);

// Negative (CookieTokenBleed): the readable copy exists nowhere in code that
// reaches the browser - no cookie and no Web Storage entry carries a token.
{
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (['node_modules', 'tests', 'server'].includes(entry.name) || entry.name.startsWith('_build') || entry.name.startsWith('.')) continue;
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(rel); continue; }
      if (!/\.(js|jsx|ts|mjs|html)$/.test(entry.name)) continue;
      const src = read(rel);
      for (const m of src.matchAll(/document\.cookie\s*=([^;\n]*)/g)) {
        // The CAS client's ten-minute wekan_cas_state nonce is a login-flow
        // state value, not a session credential, so only session tokens count.
        if (/resume|login_?token|_storedLoginToken|authToken|Meteor\.loginToken/i.test(m[1])) offenders.push(`${rel}: ${m[0]}`);
      }
      for (const m of src.matchAll(/(?:local|session)Storage\.setItem\(([^)]*)\)/g)) {
        if (/Meteor\.loginToken|loginToken|resume|_storedLoginToken/i.test(m[1])) offenders.push(`${rel}: ${m[0]}`);
      }
      if (/Accounts\.config\([^)]*clientStorage:\s*'(?:local|session)'/.test(src)) offenders.push(`${rel}: persistent clientStorage`);
    }
  };
  for (const dir of ['client', 'imports', 'models', 'config', 'packages']) {
    if (fs.existsSync(path.join(root, dir))) walk(dir);
  }
  assert.deepEqual(offenders, [], 'a login token copied where browser scripts can read it');
  // Self-check: the scan recognises the removed shape.
  assert.match('document.cookie = `meteor_login_token=${Accounts._storedLoginToken()}`', /document\.cookie\s*=[^;\n]*_storedLoginToken/);
}

console.log('httpOnlySessionCookie: cookie guards and legacy startup scenarios passed');
