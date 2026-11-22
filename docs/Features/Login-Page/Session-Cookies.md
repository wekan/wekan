# Session cookies

## What it is

After signing in, WeKan keeps you signed in with a login cookie instead of a
token in the browser's Local Storage. WeKan resumes sessions using Meteor's
HttpOnly cookie flow: page scripts cannot read an HttpOnly cookie, so a script
injected into a page cannot steal the session. Login credentials are kept in
memory instead of Local Storage. The server validates resume cookies and
applies the configured login expiry; HTTPS cookies remain Secure.

This works on-premise without Internet access and adds no dependency.

## Read more

- [HTTP cookie at Wikipedia](https://en.wikipedia.org/wiki/HTTP_cookie)
  (the HttpOnly and Secure attributes)
- [Using HTTP cookies at MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [Meteor accounts-base documentation](https://docs.meteor.com/api/accounts.html)
- [Admin Panel / People / Login](../Admin-Panel/People/Login.md), where the
  expiry and the refresh limit are set
- [Calendar preferences](../Member-Settings/Date/Calendar-Systems.md) and
  [header login](Header-Login.md) for related behavior

## How to use it

Nothing has to be switched on; it is how every sign-in is kept.

1. Set `ROOT_URL` to the public address, including any deployment path, for
   example `https://boards.example.com/wekan`. Cookie set, refresh and clear
   requests include that path and use the browser's current origin. Reloading
   a prefixed board preserves the signed-in user and member preferences.
   Root deployments retain Meteor's native cookie methods.
2. To change how long a login lasts, set
   `ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS` (or Admin Panel / People /
   Login) and restart WeKan.
3. When many users reach WeKan through a proxy that WeKan does not trust for
   the client address (`HTTP_FORWARDED_COUNT`), raise
   `ACCOUNTS_COOKIE_REFRESH_RATE_LIMIT`, because they then share one address.
4. To end your sessions, use **Log out**, or **Log out everywhere** in Member
   Settings ([Passkeys](Passkeys.md)).

## How the numbers are calculated

- **Login expiry**: `ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS`, default 90
  days (a value that is not a number keeps 90). It is read once at startup.
- **Cookie expiry**: when Meteor writes the `meteor_login_token` cookie with
  no `Expires` or `Max-Age`, WeKan appends `Max-Age` = expiry days x 86400
  seconds, so the cookie survives closing the browser
  (`server/lib/loginCookieExpiry.js`).
- **Refresh limit**: Meteor allows 30 cookie refreshes per 10 seconds per
  client address (every page load is one) and answers more with 429.
  `ACCOUNTS_COOKIE_REFRESH_RATE_LIMIT` replaces the 30 with any positive whole
  number; another value keeps Meteor's default.
- **Passwordless codes** set in the same `Accounts.config`: 10 characters,
  valid 15 minutes (`loginTokenExpirationHours: 0.25`).

## How it works in WeKan

- [server/accounts-common.js](../../../server/accounts-common.js) -
  `Accounts.config({ clientStorage: 'none', useHttpOnlyCookies: true, ... })`,
  the login expiry, the refresh limit, and the `setHeader` wrapper that adds
  the fallback expiry.
- [server/lib/loginCookieExpiry.js](../../../server/lib/loginCookieExpiry.js) -
  the pure decision whether a `Set-Cookie` needs a `Max-Age`.
- [imports/lib/accountsCookiePaths.js](../../../imports/lib/accountsCookiePaths.js),
  installed from [client/00-startup.js](../../../client/00-startup.js) - sends
  the cookie set / refresh / clear requests to `<ROOT_URL path>/_accounts/cookie`
  when WeKan is under a path.
- A state-changing HTTP request that logs in only with the cookie must come
  from WeKan itself (`server/crossSiteRequestGuard.js`).
- Tests: [tests/httpOnlySessionCookie.test.cjs](../../../tests/httpOnlySessionCookie.test.cjs),
  [tests/loginCookieExpiry.test.cjs](../../../tests/loginCookieExpiry.test.cjs),
  [tests/accountsCookiePaths.test.cjs](../../../tests/accountsCookiePaths.test.cjs),
  [tests/cookieRefreshRateLimit.test.cjs](../../../tests/cookieRefreshRateLimit.test.cjs),
  [tests/playwrightCookieResume.test.cjs](../../../tests/playwrightCookieResume.test.cjs).

## Commits

 - [A state-changing request that logs in only with the cookie must come from WeKan itself](https://github.com/wekan/wekan/commit/48a2e97ea3af223bdb199d810c272c02681d082a)
 - [Let the login-cookie refresh limit be raised](https://github.com/wekan/wekan/commit/63a7fba46571bf61071ae74110da245bd34ef326)
 - [Override the login expiry in Admin Panel / People / Login](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Restore protected initial URLs after cookie login](https://github.com/wekan/wekan/commit/a171ac0cb517fb56e74993bfeb5a448569c94649)
 - [Verify prefixed cookie preferences and logout in all browsers](https://github.com/wekan/wekan/commit/8bdd2aa4e91517cc8d939dface0be5101a073fcc)
 - [Keep native cookie sessions working behind a URL prefix](https://github.com/wekan/wekan/commit/2c5d483a7646ae5cb214319d7859b238243c1e83)
 - [Give the HttpOnly login cookie a fallback expiry](https://github.com/wekan/wekan/commit/1e18c824d5950acf94e6fccd51f5c54dcbbcd09f)
 - [Migrate legacy sessions without repeating the initial login](https://github.com/wekan/wekan/commit/2f82d985e248ef68e81910800fa5691132de2944)
 - [Preserve profiles across HttpOnly session upgrades](https://github.com/wekan/wekan/commit/9f47f00cf6e2eb4de95fa1da7c37822427e759e4)
 - [Resume HttpOnly sessions after page reload](https://github.com/wekan/wekan/commit/924d8269ea4e1726543eaf2e68dc3032e3039ffe)
 - [Keep resume tokens in HttpOnly cookies](https://github.com/wekan/wekan/commit/78a3a21c394018d18b13041f167f9e8e98a86131)
 - [Make the login expiry in days configurable](https://github.com/wekan/wekan/commit/80319b0038f6c4dce84f23309c7d6bdf95eb5874)
