# ADFS 4.0 using OAuth 2 and OpenID

## What it is

Active Directory Federation Services (ADFS) is Microsoft's on-premise single
sign-on server. WeKan signs users in with ADFS through its generic OAuth2 /
OpenID Connect login (see [OAuth2](OAuth2.md)). ADFS puts the user's claims
inside the access token instead of answering them from the userinfo endpoint,
so WeKan has a setting, `OAUTH2_ADFS_ENABLED`, that makes it read the claims
from the token.

## Read more

- [Active Directory Federation Services on Wikipedia](https://en.wikipedia.org/wiki/Active_Directory_Federation_Services)
- [Microsoft: AD FS OpenID Connect/OAuth concepts](https://learn.microsoft.com/en-us/windows-server/identity/ad-fs/development/ad-fs-openid-connect-oauth-concepts)
- [Microsoft: AD FS FAQ](https://learn.microsoft.com/en-us/windows-server/identity/ad-fs/overview/ad-fs-faq),
  which says why the userinfo endpoint returns only the subject
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [Related WeKan issue #3184](https://github.com/wekan/wekan/issues/3184)
- WeKan: [OAuth2](OAuth2.md), [Azure AD B2C](B2C.md), which uses the same
  token-claims mechanism, and [Admin Panel / People / Login](../Admin-Panel/People/Login.md)

## How to use it

1. In ADFS, register WeKan as an application group with a server application,
   and use `https://<your WeKan ROOT_URL>/_oauth/oidc` as the redirect URI.
2. Configure the generic OAuth2 settings as in [OAuth2](OAuth2.md):
   `OAUTH2_ENABLED`, client id, secret, server URL, endpoints and the claim
   maps (`OAUTH2_ID_MAP`, `OAUTH2_USERNAME_MAP`, `OAUTH2_FULLNAME_MAP`,
   `OAUTH2_EMAIL_MAP`).
3. Turn on the ADFS setting, so the claims are read from the access token.

**Snap**

```
sudo snap set wekan oauth2-enabled='true'
sudo snap set wekan oauth2-adfs-enabled='true'
```
Unset:
```
sudo snap unset wekan oauth2-enabled
sudo snap unset wekan oauth2-adfs-enabled
```

**Docker and .sh/.bat**

```
OAUTH2_ENABLED=true
OAUTH2_ADFS_ENABLED=true
```
To disable, comment out or remove that line.

**Admin Panel** - every one of these settings can also be set in
**Admin Panel / People / OAuth2** (`/admin/people/oidc`), where a saved value
wins over the environment variable and applies to the next login.

4. Open WeKan at its `ROOT_URL` and click the OIDC button on the sign-in page.

## How the numbers are calculated

ADFS has no numbers of its own. It uses the OAuth2 login's ones
([packages/wekan-oidc/oidc_server.js](../../../packages/wekan-oidc/oidc_server.js)):
the session expiry is `now + 1000 * expires_in` milliseconds, and a token
response with no usable `expires_in` counts as 3600 seconds (one hour).

## How it works in WeKan

- [packages/wekan-oidc/oidc_server.js](../../../packages/wekan-oidc/oidc_server.js)
  registers the `oidc` OAuth service. When `OAUTH2_ADFS_ENABLED` (or
  `OAUTH2_B2C_ENABLED`) is `true`, it does not call the userinfo endpoint:
  `getTokenContent()` base64-decodes the middle part of the access token (or
  of the `id_token` when there is no access token) and uses that JSON as the
  user info. A token that cannot be decoded now stops the login with an error
  that says so, instead of a TypeError (#5174).
- The claims named by `OAUTH2_ID_MAP`, `OAUTH2_USERNAME_MAP`,
  `OAUTH2_FULLNAME_MAP` and `OAUTH2_EMAIL_MAP` become the user's
  `services.oidc` data and profile.
- Every setting is read per login through `authEnv()`, which takes the
  Admin Panel value first and the environment variable second
  ([server/lib/authConfig.js](../../../server/lib/authConfig.js), catalog in
  [models/lib/authConfigCatalog.js](../../../models/lib/authConfigCatalog.js),
  section `oidc`, field `adfsEnabled`).
- Tests: [tests/oidcNullUserinfo.test.cjs](../../../tests/oidcNullUserinfo.test.cjs)
  (an undecodable ADFS/B2C token), [tests/oidcEndpoint.test.cjs](../../../tests/oidcEndpoint.test.cjs),
  [tests/authConfigCatalog.test.cjs](../../../tests/authConfigCatalog.test.cjs).

## Commits

 - [Admin Panel / People / OAuth2 can override OAUTH2_ADFS_ENABLED and the other OAuth2 settings](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Log in by full-page redirect by default](https://github.com/wekan/wekan/commit/ad51a03731ed2daf039204ccc7423dd05b3c9506)
 - [A token that cannot be decoded names the problem instead of "'ocs' of null"](https://github.com/wekan/wekan/commit/a50b483ff92786886acf2faf99e7072e6b2c9607)
 - [Fresh per-login objects, and null user info checked before any claim is read](https://github.com/wekan/wekan/commit/9ddbc777dd417f1c9e226da845f7555be2ceb947)
 - [Azure AD B2C reuses the claims-in-access-token branch](https://github.com/wekan/wekan/commit/93be112a9454c894c1ce3146ed377e6a6aeca64a)
 - [Add the OAUTH2_ADFS_ENABLED setting to the platforms](https://github.com/wekan/wekan/commit/f6bdb4d694453d73f4bfa6a75814833594cf5000)
 - [Read the claims from the ADFS access token instead of the userinfo endpoint](https://github.com/wekan/wekan/commit/a1f953665773b2e0d415d0603f082acca15037ff)
