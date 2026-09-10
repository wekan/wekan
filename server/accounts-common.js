import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import http from 'http';
import { ensureLoginCookieExpiry } from '/server/lib/loginCookieExpiry';

const LOGIN_EXPIRATION_DAYS =
  Number(process.env.ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS) || 90;

Meteor.startup(() => {
  Accounts.config({
    loginExpirationInDays: LOGIN_EXPIRATION_DAYS,
    clientStorage: 'none',
    useHttpOnlyCookies: true,
  });
});

// #6684: guarantee the HttpOnly login cookie always carries an expiry that
// matches LOGIN_EXPIRATION_DAYS, even on the rare request where accounts-base's
// own lookup fails to find one (see server/lib/loginCookieExpiry.js). Patched
// at the http.ServerResponse level, not as Connect middleware, because
// accounts-base's cookie handler (server_http_cookies.js) writes the header
// directly and returns without calling next().
const LOGIN_EXPIRATION_MAX_AGE_SECONDS = LOGIN_EXPIRATION_DAYS * 86400;
const originalSetHeader = http.ServerResponse.prototype.setHeader;
http.ServerResponse.prototype.setHeader = function setHeaderWithLoginCookieExpiry(
  name,
  value,
) {
  if (typeof name === 'string' && name.toLowerCase() === 'set-cookie') {
    if (Array.isArray(value)) {
      value = value.map(v =>
        ensureLoginCookieExpiry(v, LOGIN_EXPIRATION_MAX_AGE_SECONDS),
      );
    } else {
      value = ensureLoginCookieExpiry(value, LOGIN_EXPIRATION_MAX_AGE_SECONDS);
    }
  }
  return originalSetHeader.call(this, name, value);
};
