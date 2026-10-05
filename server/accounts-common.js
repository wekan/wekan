import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import http from 'http';
import { ensureLoginCookieExpiry } from '/server/lib/loginCookieExpiry';

import { authEnv, authConfigReady } from '/server/lib/authConfig';

// ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS, or its Admin Panel / People / Login
// override. Accounts.config() accepts it once, so it is read at startup and a
// change applies from the next start; the cookie below uses the same value.
let loginExpirationDays = 90;

Meteor.startup(async () => {
  await authConfigReady;
  loginExpirationDays = Number(authEnv('ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS')) || 90;
  Accounts.config({
    loginExpirationInDays: loginExpirationDays,
    clientStorage: 'none',
    useHttpOnlyCookies: true,
    // CodeBleed (2026-10-02): a passwordless sign-in code was 6 hex
    // characters (16.7 million values) valid for an hour, and failed codes are
    // not counted by the lockout - only Meteor's per-connection rate limit
    // stood in the way, which many connections walk around. 10 characters is
    // over a trillion values, and a code now lives 15 minutes.
    tokenSequenceLength: 10,
    loginTokenExpirationHours: 0.25,
  });
});

// #6684: guarantee the HttpOnly login cookie always carries an expiry that
// matches loginExpirationDays, even on the rare request where accounts-base's
// own lookup fails to find one (see server/lib/loginCookieExpiry.js). Patched
// at the http.ServerResponse level, not as Connect middleware, because
// accounts-base's cookie handler (server_http_cookies.js) writes the header
// directly and returns without calling next().
const originalSetHeader = http.ServerResponse.prototype.setHeader;
http.ServerResponse.prototype.setHeader = function setHeaderWithLoginCookieExpiry(
  name,
  value,
) {
  if (typeof name === 'string' && name.toLowerCase() === 'set-cookie') {
    if (Array.isArray(value)) {
      value = value.map(v =>
        ensureLoginCookieExpiry(v, loginExpirationDays * 86400),
      );
    } else {
      value = ensureLoginCookieExpiry(value, loginExpirationDays * 86400);
    }
  }
  return originalSetHeader.call(this, name, value);
};
