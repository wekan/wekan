'use strict';
const assert = require('node:assert/strict');
const { installAccountsCookiePaths } = require('../imports/lib/accountsCookiePaths');
(async () => {
  const original = () => {};
  const root = { loginWithCookie: original, _setHttpOnlyCookie: original, _clearHttpOnlyCookie: original };
  installAccountsCookiePaths(root, 'https://example.com/', () => assert.fail('root native methods stay intact'));
  assert.equal(root.loginWithCookie, original);
  assert.equal(root._setHttpOnlyCookie, original);
  assert.equal(root._clearHttpOnlyCookie, original);
  for (const suffix of ['/wekan', '/wekan/', '/nested/boards/']) {
    const calls = []; let response = { ok: true, json: async () => ({ token: 'validated-token' }) };
    let loggedIn = 0, loggedOut = 0, rejectLogin = false;
    const accounts = {
      loginWithToken(token, callback) { assert.equal(token, 'validated-token'); loggedIn++; callback(rejectLogin); },
      async makeClientLoggedOut() { loggedOut++; },
    };
    installAccountsCookiePaths(accounts, `https://external.example${suffix}`, async (url, options) => {
      calls.push({ url, options }); return response;
    });
    await accounts.loginWithCookie();
    assert.equal(loggedIn, 1);
    const base = `${suffix.replace(/\/+$/, '')}/_accounts/cookie`;
    assert.equal(calls[0].url, `${base}/refresh`);
    assert.deepEqual(calls[0].options, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
    const expiry = '2026-12-12T12:00:00.000Z';
    await accounts._setHttpOnlyCookie('test-token', expiry);
    assert.equal(calls[1].url, `${base}/set`);
    assert.deepEqual(JSON.parse(calls[1].options.body), { token: 'test-token', tokenExpires: expiry });
    assert.equal(calls[1].options.credentials, 'include');
    await accounts._clearHttpOnlyCookie();
    assert.deepEqual(calls[2], { url: `${base}/clear`, options: { method: 'POST', credentials: 'include' } });
    response = { ok: false }; await accounts.loginWithCookie(); assert.equal(loggedIn, 1);
    response = { ok: true, json: async () => ({}) }; await accounts.loginWithCookie(); assert.equal(loggedIn, 1);
    response = { ok: true, json: async () => ({ token: 'validated-token' }) }; rejectLogin = true;
    await accounts.loginWithCookie(); assert.equal(loggedOut, 1);
    installAccountsCookiePaths(accounts, `https://external.example${suffix}`, async () => { throw new Error('offline'); });
    await accounts.loginWithCookie(); await accounts._setHttpOnlyCookie('test-token'); await accounts._clearHttpOnlyCookie();
  }
  console.log('Accounts cookie paths: native root, three prefixes, invalid/missing cookies, login rejection and offline checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
