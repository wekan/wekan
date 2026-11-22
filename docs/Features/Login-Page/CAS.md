# CAS

## What it is

CAS (Central Authentication Service) is a single sign-on protocol: the user
logs in once on the organization's CAS server, and applications such as WeKan
trust the ticket the CAS server gives back. In WeKan, CAS signs the user in on
the CAS server's own login page, so WeKan never sees the password. Please send
pull requests if CAS login does not work.

## Read more

- [Central Authentication Service on Wikipedia](https://en.wikipedia.org/wiki/Central_Authentication_Service)
- [Apereo CAS documentation](https://apereo.github.io/cas/)
- [CAS issue #3204](https://github.com/wekan/wekan/issues/3204)
- Originally before moving to `packages/wekan-accounts-cas` the CAS code was
  at https://github.com/wekan/meteor-accounts-cas
- WeKan: [Admin Panel / People / Login](../Admin-Panel/People/Login.md),
  [local login protocol tests](Testing.md)

## How to use it

1. Set the CAS settings for your platform, or in **Admin Panel / People /
   CAS** (`/admin/people/cas`), where a saved value wins over the environment
   variable:
   - `CAS_ENABLED=true`
   - `CAS_BASE_URL` - the CAS server, for example `https://cas.example.com/cas`
   - `CAS_LOGIN_URL` - its login page
   - `CAS_VALIDATE_URL` - its ticket validation URL (the old misspelling
     `CASE_VALIDATE_URL` still works)
   - `CAS_MERGE_EXISTING_USERS=true` only if an existing WeKan account with the
     same username may be taken over by its CAS login.
2. Make CAS the method the sign-in button uses: set
   `DEFAULT_AUTHENTICATION_METHOD=cas`, or choose it in Admin Panel / People /
   Login. With **Display Authentication Method** ticked under **Login: Allow**,
   the sign-in page shows a method selector instead.
3. On the sign-in page click the sign-in button. The browser goes to the CAS
   login form and comes back to WeKan, signed in.

**Login style.** CAS signs in by full-page redirect: the browser leaves WeKan
for the CAS login form and comes back to the same page, which finishes the
login and shows any error on the sign-in page. To open the CAS form in a popup
instead, set `"popup": true` in both `cas` and `public.cas` of
`METEOR_SETTINGS`. A popup is blocked in iframes and on some phones, and a CAS
server's `Cross-Origin-Opener-Policy` can cut it off from WeKan so the login
never finishes, which is why redirect is the default (before 2026-10-08 it was
the popup, and a redirect login could not finish at all).

## How the numbers are calculated

CAS has no numbers that it computes. Its fixed values, set in
[server/authentication.js](../../../server/authentication.js)
`reconfigureCas()`, are CAS protocol version `3.0` and, for the popup style, a
810 × 610 pixel window.

## How it works in WeKan

- WeKan clientside code: [client/components/main/layouts.js](../../../client/components/main/layouts.js)
  calls `Meteor.loginWithCas()` when the chosen method is `cas`, and
  [packages/wekan-accounts-cas/cas_client.js](../../../packages/wekan-accounts-cas/cas_client.js)
  sends the browser to the CAS login URL.
- WeKan serverside code: [server/authentication.js](../../../server/authentication.js)
  `reconfigureCas()` writes the `cas` service configuration from the settings
  (re-run when they change in the Admin Panel), and
  [packages/wekan-accounts-cas/cas_server.js](../../../packages/wekan-accounts-cas/cas_server.js)
  validates the ticket and creates or finds the user.
- Only the browser that started a login may finish it: the server sets a
  `wekan_cas_state` cookie, and a callback whose cookie does not match the
  credential token is refused and recorded in Admin Panel / Problems
  (`cas.state-mismatch`).
- An existing non-CAS account with the same username is not taken over unless
  `CAS_MERGE_EXISTING_USERS=true` (`cas.account-conflict`); an
  `allowedLdapGroups` value in `cas` of `METEOR_SETTINGS` limits CAS logins to members of those groups
  ([packages/wekan-accounts-cas/groupPolicy.js](../../../packages/wekan-accounts-cas/groupPolicy.js),
  `cas.group-denied`).
- The original CAS settings came in with
  [the CAS settings commit](https://github.com/wekan/wekan/commit/214c86cc22f4c721a79ec0a4a4f3bbd90d673f93).
- Tests: [tests/casStateBinding.test.cjs](../../../tests/casStateBinding.test.cjs),
  [tests/casGroupBoundary.test.cjs](../../../tests/casGroupBoundary.test.cjs),
  [tests/casFirstLogin.test.cjs](../../../tests/casFirstLogin.test.cjs),
  [tests/casUrlParsing.test.cjs](../../../tests/casUrlParsing.test.cjs),
  [tests/oauth2LoginStyle.test.cjs](../../../tests/oauth2LoginStyle.test.cjs).

## Integration tests

See [local login protocol tests](Testing.md) for example identities, actual
request/response checks, failure cases and deployment limitations.

## Commits

 - [Log in by full-page redirect by default, CAS included](https://github.com/wekan/wekan/commit/ad51a03731ed2daf039204ccc7423dd05b3c9506)
 - [Admin Panel / People / CAS overrides every CAS setting](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Accept a CAS callback only from the browser that started that login](https://github.com/wekan/wekan/commit/d3095fefd6aa98b7b085b6720e411459bfc24805)
 - [Verify login provider exchanges and fix authentication failures](https://github.com/wekan/wekan/commit/4f7d28637e3c68d20c8c8462dfaea1289210c861)
 - [Report blocked CAS attempts in Admin Panel / Problems](https://github.com/wekan/wekan/commit/a1dfa88b49cc4262e43352202765ecb709c0dc37)
 - [Fix the reported CAS security issues](https://github.com/wekan/wekan/commit/4ce5cf6e102854d326e1dcacde6cd20614525dec)
 - [The CAS package uses the Meteor 3 async API](https://github.com/wekan/wekan/commit/6e489881182282ed93d053e3a910f316efa8ee78)
 - [Support subpath deployment](https://github.com/wekan/wekan/commit/bfb0c05e8389abea00bbfd9ff3427b8ab2dad700)
 - [Added back the WeKan lockout, LDAP, OIDC and CAS packages](https://github.com/wekan/wekan/commit/00768b4392109dec62a4dcf44dbceb295990d785)
 - [Added CAS settings](https://github.com/wekan/wekan/commit/214c86cc22f4c721a79ec0a4a4f3bbd90d673f93)
