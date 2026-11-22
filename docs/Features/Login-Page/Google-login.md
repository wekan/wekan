# Google login with OAuth2/OIDC

## What it is

People can sign in to WeKan with their Google account. This page sets Google
up as WeKan's generic OAuth2/OpenID Connect provider (the `oauth2-*`
settings and the OIDC button). WeKan also has a separate built-in Google
button, configured on its own; see [OAuth providers](OAuth-Providers.md).

> **NOTE: BEFORE 2020-09-07 THERE WAS WRONG SETTING BELOW, IT CAUSED LOGIN
> WITH WRONG USER, YOU SHOULD FIX YOUR SETTINGS. CORRECT SETTINGS ARE:**
>
> ```
> snap set wekan oauth2-email-map='email'
> snap set wekan oauth2-username-map='email'
> ```

## Read more

- [Google: OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
- To create Google OAuth 2 credentials, you can follow this tutorial:
  https://developers.google.com/identity/sign-in/web/sign-in
- [OpenID on Wikipedia](https://en.wikipedia.org/wiki/OpenID)
- [Thanks to @mlazzje for this info below](https://github.com/wekan/wekan/issues/2527#issuecomment-654155289)
- WeKan: [OAuth2](OAuth2.md), [OAuth providers](OAuth-Providers.md),
  [Google Cloud](Google-Cloud.md)

## How to use it

1. Create Google OAuth 2 credentials (see the tutorial above). The redirect
   URL is your WeKan root-url+_oauth/oidc like this:
   https://boards.example.com/_oauth/oidc
2. In your WeKan config, set the following information in snap, replacing
   `CLIENT_ID` and `CLIENT_SECRET`:
```
sudo snap set wekan oauth2-enabled='true'
sudo snap set wekan oauth2-client-id='CLIENT_ID'
sudo snap set wekan oauth2-secret='CLIENT_SECRET'
sudo snap set wekan oauth2-auth-endpoint='https://accounts.google.com/o/oauth2/v2/auth'
sudo snap set wekan oauth2-token-endpoint='https://oauth2.googleapis.com/token'
sudo snap set wekan oauth2-userinfo-endpoint='https://openidconnect.googleapis.com/v1/userinfo'
sudo snap set wekan oauth2-id-map='sub'
sudo snap set wekan oauth2-email-map='email'
sudo snap set wekan oauth2-username-map='email'
sudo snap set wekan oauth2-fullname-map='name'
sudo snap set wekan oauth2-request-permissions='openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
sudo snap set wekan oauth2-login-style='redirect'
```
   The same settings can be overridden in **Admin Panel / People / OAuth2**
   (`/admin/people/oidc`).
3. Open WeKan at its `root-url` only: Google returns there, and a login
   started at any other address cannot finish. The sign-in page says so when
   it is opened at another address.
4. Click the OIDC button on the sign-in page.

`redirect` is the default login style; a popup can look closed to WeKan as
soon as Google's sign-in page opens, and the login then returns to the
sign-in page.

**Switching an existing password account to Google.** If you have existing
password account, and would like to switch to Google auth account, you need to
rename that username and email address, so you can autoregister with your
Google auth email address. Then share your boards from password account to
Google auth account and set that to Google auth user as BoardAdmin.

## How the numbers are calculated

Google login has no numbers of its own. The OAuth2 login's session expiry is
`now + 1000 * expires_in` milliseconds, 3600 seconds when the token response
has none
([packages/wekan-oidc/oidc_server.js](../../../packages/wekan-oidc/oidc_server.js)).

## How it works in WeKan

- The endpoints here are absolute URLs, so they are used as written instead of
  being joined to `OAUTH2_SERVER_URL`
  ([packages/wekan-oidc/endpoint.js](../../../packages/wekan-oidc/endpoint.js)).
- `OAUTH2_ID_MAP=sub` keeps Google's stable account id as the identity;
  username and email both come from the `email` claim.
- [models/lib/loginOriginMismatch.js](../../../models/lib/loginOriginMismatch.js)
  compares the page's origin with `ROOT_URL`'s; when they differ and a
  provider login is offered, the sign-in page shows the
  `login-origin-mismatch` message with both addresses
  ([client/components/main/layouts.jade](../../../client/components/main/layouts.jade)).
- After coming back from Google, the user is sent to All Boards rather than
  left on the sign-in route (#6512).
- Tests: [tests/loginOriginMismatch.test.cjs](../../../tests/loginOriginMismatch.test.cjs),
  [tests/oauth2LoginStyle.test.cjs](../../../tests/oauth2LoginStyle.test.cjs),
  [tests/playwright/specs/login-origin-mismatch.e2e.js](../../../tests/playwright/specs/login-origin-mismatch.e2e.js).

## Commits

 - [Say on the sign-in page why a Google login returns to it](https://github.com/wekan/wekan/commit/4fc4f19f02bae23d276c718555122fc43e76465a)
 - [Log in by full-page redirect by default with OAuth2/OIDC and Google](https://github.com/wekan/wekan/commit/ad51a03731ed2daf039204ccc7423dd05b3c9506)
 - [Admin Panel / People / OAuth2 overrides every OAuth2 setting](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Send Google/OAuth logins to All Boards, not the language selector](https://github.com/wekan/wekan/commit/79410e73d067723a23d6f5b58f0ad34bdd509db4)
 - [Fix Google SSO by reverting the not-working OAUTH2_LOGIN_STYLE=redirect changes](https://github.com/wekan/wekan/commit/1e837dec11dc5cb266b83efcff4f462aa02d733d)
