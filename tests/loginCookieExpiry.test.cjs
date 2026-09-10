'use strict';

// Regression coverage for #6684 (No Persistent Login).
//
// Meteor's native HttpOnly-cookie resume flow (accounts-base's own
// server_http_cookies.js, enabled by useHttpOnlyCookies) only attaches an
// Expires/Max-Age to the meteor_login_token cookie when it can match the
// freshly issued resume token back to a stored token on the user document at
// the exact moment the cookie is written. When that lookup misses, the
// cookie is written with no expiry, so the browser treats it as a plain
// session cookie and drops it the moment the browser is closed -- silently
// downgrading a configured 90-day login into a same-session-only one.
// server/accounts-common.js patches http.ServerResponse.prototype.setHeader
// to guarantee a fallback expiry using this pure decision function.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  ensureLoginCookieExpiry,
  COOKIE_PREFIX,
} = require('../server/lib/loginCookieExpiry');

// Positive: a cookie with no expiry directive gets one appended.
assert.equal(
  ensureLoginCookieExpiry('meteor_login_token=abc123; Path=/; HttpOnly', 7776000),
  'meteor_login_token=abc123; Path=/; HttpOnly; Max-Age=7776000',
);

// Fractional/oversized inputs are normalized to a whole positive second count.
assert.equal(
  ensureLoginCookieExpiry('meteor_login_token=abc123', 7776000.7),
  'meteor_login_token=abc123; Max-Age=7776001',
);

// Negative: a cookie that already carries Expires is left untouched -- the
// real expiry (matched from the DB) must always win over the fallback.
assert.equal(
  ensureLoginCookieExpiry(
    'meteor_login_token=abc123; Expires=Wed, 09 Jun 2027 10:18:14 GMT',
    7776000,
  ),
  'meteor_login_token=abc123; Expires=Wed, 09 Jun 2027 10:18:14 GMT',
);

// Negative: a cookie that already carries Max-Age is left untouched.
assert.equal(
  ensureLoginCookieExpiry('meteor_login_token=abc123; Max-Age=60', 7776000),
  'meteor_login_token=abc123; Max-Age=60',
);

// Negative: an unrelated cookie (e.g. a header-login cookie, or any other
// Set-Cookie header) must never be touched by this fallback.
assert.equal(
  ensureLoginCookieExpiry('other_cookie=xyz; Path=/', 7776000),
  'other_cookie=xyz; Path=/',
);

// Negative: a non-string / non-finite maxAge must not corrupt the header.
assert.equal(
  ensureLoginCookieExpiry('meteor_login_token=abc123', NaN),
  'meteor_login_token=abc123',
);
assert.equal(
  ensureLoginCookieExpiry('meteor_login_token=abc123', 0),
  'meteor_login_token=abc123',
);
assert.equal(ensureLoginCookieExpiry(undefined, 7776000), undefined);
assert.deepEqual(ensureLoginCookieExpiry(['array'], 7776000), ['array']);

assert.equal(COOKIE_PREFIX, 'meteor_login_token=');

// Wiring: server/accounts-common.js must actually apply this helper to every
// Set-Cookie header, at the http.ServerResponse level (not Connect
// middleware, since accounts-base's handler writes the header directly and
// returns without calling next()), keyed off the same
// ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS the rest of the login-expiration
// policy already uses.
const root = path.resolve(__dirname, '..');
const accountsCommon = fs.readFileSync(
  path.join(root, 'server/accounts-common.js'),
  'utf8',
);
assert.match(
  accountsCommon,
  /http\.ServerResponse\.prototype\.setHeader = function/,
  'server/accounts-common.js must patch http.ServerResponse.prototype.setHeader',
);
assert.match(
  accountsCommon,
  /ensureLoginCookieExpiry/,
  'server/accounts-common.js must call the pure fallback-expiry decision',
);
assert.match(
  accountsCommon,
  /ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS/,
  'the fallback expiry must derive from the same configured login expiration',
);

// End-to-end: run the actual patch logic against a stub ServerResponse-like
// object, exactly as http.ServerResponse.prototype.setHeader would see it.
const vm = require('node:vm');
const patchSrc = accountsCommon.slice(
  accountsCommon.indexOf('const originalSetHeader'),
  accountsCommon.indexOf('http.ServerResponse.prototype.setHeader = function') +
    accountsCommon
      .slice(accountsCommon.indexOf('http.ServerResponse.prototype.setHeader = function'))
      .indexOf('};') + 2,
);
const calls = [];
const sandbox = {
  LOGIN_EXPIRATION_MAX_AGE_SECONDS: 90 * 86400,
  http: {
    ServerResponse: {
      prototype: {
        setHeader(name, value) {
          calls.push([name, value]);
        },
      },
    },
  },
  ensureLoginCookieExpiry,
};
vm.createContext(sandbox);
vm.runInContext(patchSrc, sandbox);
sandbox.http.ServerResponse.prototype.setHeader.call(
  {},
  'Set-Cookie',
  'meteor_login_token=tok; Path=/; HttpOnly',
);
sandbox.http.ServerResponse.prototype.setHeader.call({}, 'Content-Type', 'text/plain');
assert.deepEqual(calls[0], [
  'Set-Cookie',
  `meteor_login_token=tok; Path=/; HttpOnly; Max-Age=${90 * 86400}`,
]);
assert.deepEqual(calls[1], ['Content-Type', 'text/plain']);

console.log('loginCookieExpiry: fallback expiry guards and wiring passed');
