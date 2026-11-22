# Azure AD B2C using OAuth2

## What it is

Azure AD B2C (Microsoft's customer identity service) can sign users in to
WeKan through WeKan's generic OAuth2 / OpenID Connect login. It is set up
much like [ADFS](./ADFS.md): the claims come from the token instead of a
userinfo endpoint. The difference is the email address, which B2C sends as
the first entry of the `emails` array in the token.

## Read more

- [Microsoft: What is Azure Active Directory B2C?](https://learn.microsoft.com/en-us/azure/active-directory-b2c/overview)
- [Microsoft: Web sign-in with OpenID Connect in Azure AD B2C](https://learn.microsoft.com/en-us/azure/active-directory-b2c/openid-connect)
- [OpenID on Wikipedia](https://en.wikipedia.org/wiki/OpenID) and
  [OAuth on Wikipedia](https://en.wikipedia.org/wiki/OAuth)
- Original issue: [#5242](https://github.com/wekan/wekan/issues/5242)
- WeKan: [OAuth2](OAuth2.md), [ADFS](ADFS.md), [Azure](Azure/Azure.md)

## How to use it

1. In Azure AD B2C, register WeKan as an application with the redirect URI
   `https://<your WeKan ROOT_URL>/_oauth/oidc`, create a client secret, and
   create the user flow (policy) WeKan should use. The tenant must release
   the `emails` claim for the requested scopes.
2. Set the settings below for your platform, replacing `B2C_TENANT_NAME` and
   `B2C_POLICY_NAME`. The same settings can be overridden in
   **Admin Panel / People / OAuth2** (`/admin/people/oidc`).
3. Open WeKan at its `ROOT_URL` and click the OIDC button on the sign-in page.

**Snap**

```
sudo snap set wekan oauth2-enabled='true'
sudo snap set wekan oauth2-b2c-enabled='true'
sudo snap set wekan oauth2-username-map='sub'
sudo snap set wekan oauth2-request-permissions='openid email profile'
sudo snap set wekan oauth2-client-id='xxxxxxxx'
sudo snap set wekan oauth2-secret='xxxxxxx'
sudo snap set wekan oauth2-server-url='https://B2C_TENANT_NAME.b2clogin.com/B2C_TENANT_NAME.onmicrosoft.com/B2C_POLICY_NAME'
sudo snap set wekan oauth2-auth-endpoint='/oauth2/v2.0/authorize'
sudo snap set wekan oauth2-token-endpoint='/oauth2/v2.0/token'
sudo snap set wekan oauth2-username-map='sub'
sudo snap set wekan oauth2-email-map='email'
sudo snap set wekan oauth2-fullname-map='name'
sudo snap set wekan oauth2-id-map='sub'
```

**Docker**

[docker-compose.yml](../../../docker-compose.yml)

```
      - OAUTH2_ENABLED=true
      - OAUTH2_B2C_ENABLED=true
      - OAUTH2_USERNAME_MAP=sub
      - OAUTH2_REQUEST_PERMISSIONS=openid email profile
      - OAUTH2_CLIENT_ID=xxxxxxxx
      - OAUTH2_SECRET=xxxxxxx
      - OAUTH2_SERVER_URL=https://B2C_TENANT_NAME.b2clogin.com/B2C_TENANT_NAME.onmicrosoft.com/B2C_POLICY_NAME
      - OAUTH2_AUTH_ENDPOINT=/oauth2/v2.0/authorize
      - OAUTH2_TOKEN_ENDPOINT=/oauth2/v2.0/token
      - OAUTH2_USERNAME_MAP=sub
      - OAUTH2_EMAIL_MAP=email
      - OAUTH2_FULLNAME_MAP=name
      - OAUTH2_ID_MAP=sub
```

**Others** - similar like above Docker.

## How the numbers are calculated

- The email is `emails[0]`, the first element of the token's `emails` array;
  `OAUTH2_EMAIL_MAP` is not used for it while `OAUTH2_B2C_ENABLED=true`.
- The session expiry is `now + 1000 * expires_in` milliseconds; a token
  response without a usable `expires_in` counts as 3600 seconds
  ([packages/wekan-oidc/oidc_server.js](../../../packages/wekan-oidc/oidc_server.js)).

## How it works in WeKan

- [packages/wekan-oidc/oidc_server.js](../../../packages/wekan-oidc/oidc_server.js):
  with `OAUTH2_B2C_ENABLED=true` (like `OAUTH2_ADFS_ENABLED`) the claims are
  decoded from the access token (`getTokenContent()`), not fetched from a
  userinfo endpoint. Both `serviceData.email` and `profile.email` are set
  from `userinfo.emails[0]`. A token without a non-empty `emails` array stops
  the login with "the token carries no "emails" claim" (#5174) instead of a
  TypeError.
- The setting is field `b2cEnabled` of section `oidc` in
  [models/lib/authConfigCatalog.js](../../../models/lib/authConfigCatalog.js),
  resolved per login by [server/lib/authConfig.js](../../../server/lib/authConfig.js).
- Tests: [tests/oidcNullUserinfo.test.cjs](../../../tests/oidcNullUserinfo.test.cjs)
  (missing `emails` claim, undecodable token),
  [tests/authConfigCatalog.test.cjs](../../../tests/authConfigCatalog.test.cjs).

## Commits

 - [Admin Panel / People / OAuth2 can override OAUTH2_B2C_ENABLED and the other OAuth2 settings](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Log in by full-page redirect by default](https://github.com/wekan/wekan/commit/ad51a03731ed2daf039204ccc7423dd05b3c9506)
 - [A B2C token without the emails claim says so instead of failing on undefined](https://github.com/wekan/wekan/commit/a50b483ff92786886acf2faf99e7072e6b2c9607)
 - [Add Azure AD B2C login: claims from the access token, email from emails[0]](https://github.com/wekan/wekan/commit/93be112a9454c894c1ce3146ed377e6a6aeca64a)
