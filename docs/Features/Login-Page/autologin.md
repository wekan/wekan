# Autologin with OIDC/OAUTH2

## What it is

With autologin, a person who opens WeKan without being signed in is sent
straight to the OAuth2 / OIDC identity provider instead of seeing WeKan's
sign-in page, and comes back signed in. It makes WeKan part of a single
sign-on setup where the identity provider is the only login people see.
It needs a working [OAuth2 / OIDC](OAuth2.md) login.

## Read more

- [Single sign-on at Wikipedia](https://en.wikipedia.org/wiki/Single_sign-on)
- [How OpenID Connect works](https://openid.net/developers/how-connect-works/)
- [OAuth2 / OIDC](OAuth2.md) and [Keycloak](Keycloak/Keycloak.md)
- [Pull request \#4588: direct login from OIDC](https://github.com/wekan/wekan/pull/4588)

## How to use it

1. Configure the [OAuth2 / OIDC](OAuth2.md) login first and check that the
   **Sign in with Oidc** button works.
2. Turn autologin on:
   - Docker / environment: `OIDC_REDIRECTION_ENABLED=true`
   - Snap: `sudo snap set wekan oidc-redirection-enabled='true'`
     (`sudo snap unset wekan oidc-redirection-enabled` turns it off)
   - or Admin Panel / People / OAuth2.
3. So that **Log Out** also ends the identity provider's session and comes back
   to WeKan, set `OAUTH2_LOGOUT_ENDPOINT` to the provider's
   `end_session_endpoint`, for Keycloak
   `/realms/<keycloak realm>/protocol/openid-connect/logout`, and add WeKan's
   `ROOT_URL` to the provider's allowed post-logout redirect URIs.
4. Open WeKan in a new tab: it goes to the provider and back, signed in.

## How the numbers are calculated

Autologin has no numbers of its own, only one rule: it redirects **once per
browser tab**. The flag `wekan-oidc-auto-redirect-pending` in the tab's
`sessionStorage` is set before the redirect and cleared only by a successful
login, so a failed callback does not loop until the provider rate-limits it;
the Oidc button stays for a manual retry. When `sessionStorage` cannot be
written, autologin does not redirect at all. The default is off.

## How it works in WeKan

- [server/models/settings.js](../../../server/models/settings.js) -
  `isOidcRedirectionEnabled` answers true only when `OIDC_REDIRECTION_ENABLED`
  is `true` and an `oidc` service configuration exists.
- [client/components/main/layouts.js](../../../client/components/main/layouts.js) -
  `userFormsLayout.onCreated` asks it, rechecks that nobody signed in while the
  call was in flight, and calls `Meteor.loginWithOidc` with the redirect style.
- [client/lib/oidcAutoRedirect.js](../../../client/lib/oidcAutoRedirect.js) -
  the once-per-tab latch; [config/accounts.js](../../../config/accounts.js)
  clears it on login, and its `onLogoutHook` goes to `OAUTH2_LOGOUT_ENDPOINT`
  (built by [server/lib/oauthLogoutUrl.js](../../../server/lib/oauthLogoutUrl.js))
  or, without it, to the OAuth2 server.
- Tests: [tests/oidcAutoRedirectLoop.test.cjs](../../../tests/oidcAutoRedirectLoop.test.cjs),
  [tests/oauthLogoutUrl.test.cjs](../../../tests/oauthLogoutUrl.test.cjs).

## Commits

 - [Override every login variable, OIDC_REDIRECTION_ENABLED too, in Admin Panel / People](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Do not repeat the automatic OIDC login after a failed callback](https://github.com/wekan/wekan/commit/8263734f5ab8a0fc06db695ce0c877a1db764cba)
 - [Stop the OIDC auto-redirect looping until the provider rate-limits it](https://github.com/wekan/wekan/commit/89682c251f6f9edffe5e46410babee1ba457ce64)
 - [Await the OIDC config so the auto-redirect works on Meteor 3, among other fixes](https://github.com/wekan/wekan/commit/9ddbc777dd417f1c9e226da845f7555be2ceb947)
 - [Log Out ends the identity provider session with OAUTH2_LOGOUT_ENDPOINT](https://github.com/wekan/wekan/commit/f569eb9c0c0a654d39b927322eb606e473ad7ef4)
 - [Add autologin back, because reverting it broke Google OIDC login](https://github.com/wekan/wekan/commit/1e4fba3ec8366aac2e9fdd812aa047f5d53db749)
 - [Revert autologin, because it broke OIDC login with Keycloak](https://github.com/wekan/wekan/commit/43a709675394f6aade42033c14c7fb5b78ac25c8)
 - [Merge the direct login from OIDC pull request](https://github.com/wekan/wekan/commit/24598eaf00153b96be9098023b745cde4f03138d)
 - [Autologin settings for Docker, Snap, Source and Bundle](https://github.com/wekan/wekan/commit/284f4401369aadcec72e67fa935dfc3a9fead721)
