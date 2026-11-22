# Authelia login using OAuth2/OIDC

## What it is

Authelia is a self-hosted authentication and single sign-on server that speaks
OpenID Connect (OIDC). WeKan signs people in with Authelia through its generic
OAuth2/OIDC login: Authelia is registered as the identity provider, WeKan as
one of its clients, and the OIDC button on WeKan's sign-in page sends the
user to Authelia and back.

## Read more

- [Authelia OpenID Connect introduction](https://www.authelia.com/integration/openid-connect/introduction/)
- [Authelia OpenID Connect clients configuration](https://www.authelia.com/configuration/identity-providers/openid-connect/clients/)
- [Authelia OpenID Connect provider configuration](https://www.authelia.com/configuration/identity-providers/openid-connect/provider/)
- [Single sign-on on Wikipedia](https://en.wikipedia.org/wiki/Single_sign-on)
  and [OpenID on Wikipedia](https://en.wikipedia.org/wiki/OpenID)
- [OpenID Connect RP-Initiated Logout 1.0](https://openid.net/specs/openid-connect-rpinitiated-1_0.html)
- Original issue: [#4210](https://github.com/wekan/wekan/issues/4210)
- WeKan: [OAuth2](OAuth2.md), [Keycloak](Keycloak/Keycloak.md)

## How to use it

1. Register WeKan as a client in Authelia's
   `identity_providers.oidc.clients` configuration, using
   `https://your-wekan.tld/_oauth/oidc` as the `redirect_uris` value.
2. In Authelia's client configuration, set `scopes` to at least `openid`,
   `profile` and `email` so the `preferred_username`, `name` and `email`
   claims are returned to WeKan, and set `authorization_policy` and
   `consent_mode` as needed for your deployment.
3. Point WeKan at Authelia's OIDC endpoints with the settings below (they can
   also be overridden in **Admin Panel / People / OAuth2**,
   `/admin/people/oidc`).
4. Open WeKan at its `ROOT_URL` and click the OIDC button on the sign-in page.

Authelia's discoverable endpoints (from
`https://auth.example.com/.well-known/openid-configuration`) are:
- `authorization_endpoint`: `/api/oidc/authorization`
- `token_endpoint`: `/api/oidc/token`
- `userinfo_endpoint`: `/api/oidc/userinfo`
- `jwks_uri`: `/jwks.json`

**Snap**

```
sudo snap set wekan oauth2-enabled='true'
sudo snap set wekan oauth2-client-id='<Authelia client id>'
sudo snap set wekan oauth2-secret='<Authelia client secret>'
sudo snap set wekan oauth2-server-url='https://auth.yourserver.com'
sudo snap set wekan oauth2-auth-endpoint='/api/oidc/authorization'
sudo snap set wekan oauth2-userinfo-endpoint='/api/oidc/userinfo'
sudo snap set wekan oauth2-token-endpoint='/api/oidc/token'
sudo snap set wekan oauth2-id-map='sub'
sudo snap set wekan oauth2-username-map='preferred_username'
sudo snap set wekan oauth2-fullname-map='name'
sudo snap set wekan oauth2-email-map='email'
sudo snap set wekan oauth2-request-permissions='openid profile email'
```

**Docker**

[docker-compose.yml](../../../docker-compose.yml)

```
      - OAUTH2_ENABLED=true
      - OAUTH2_CLIENT_ID=<Authelia client id>
      - OAUTH2_SECRET=<Authelia client secret>
      - OAUTH2_SERVER_URL=https://auth.yourserver.com
      - OAUTH2_AUTH_ENDPOINT=/api/oidc/authorization
      - OAUTH2_USERINFO_ENDPOINT=/api/oidc/userinfo
      - OAUTH2_TOKEN_ENDPOINT=/api/oidc/token
      - OAUTH2_ID_MAP=sub
      - OAUTH2_USERNAME_MAP=preferred_username
      - OAUTH2_EMAIL_MAP=email
      - OAUTH2_FULLNAME_MAP=name
      - OAUTH2_REQUEST_PERMISSIONS=openid profile email
```

**Others** - similar like above Docker.

**Log out.** Unlike Keycloak, Authelia does not implement OpenID Connect
RP-Initiated Logout 1.0 yet, so there is no `end_session_endpoint` to set as
`OAUTH2_LOGOUT_ENDPOINT` (see [Keycloak's logout
notes](./Keycloak/Keycloak.md#log-out-redirects-to-the-keycloak-home-page-issue-6158)
for what that setting does where a provider supports it). Leave
`OAUTH2_LOGOUT_ENDPOINT` unset for Authelia; "Log Out" in WeKan ends the WeKan
session only.

## How the numbers are calculated

Authelia has no numbers of its own. The OAuth2 login's session expiry is
`now + 1000 * expires_in` milliseconds, 3600 seconds when Authelia's token
response has no `expires_in`, and when `OAUTH2_REQUEST_PERMISSIONS` is unset
the requested scope is `openid profile email`
([packages/wekan-oidc/oidc_client.js](../../../packages/wekan-oidc/oidc_client.js)).

## How it works in WeKan

- [packages/wekan-oidc/oidc_client.js](../../../packages/wekan-oidc/oidc_client.js)
  builds the authorization request (`response_type=code`, `redirect_uri`
  `<ROOT_URL>/_oauth/oidc`, `state`, `scope`).
- [packages/wekan-oidc/oidc_server.js](../../../packages/wekan-oidc/oidc_server.js)
  exchanges the code at the token endpoint, calls the userinfo endpoint with
  the access token and maps the claims named by the `OAUTH2_*_MAP` settings.
  Relative endpoints are joined to `OAUTH2_SERVER_URL`, absolute ones are used
  as written ([packages/wekan-oidc/endpoint.js](../../../packages/wekan-oidc/endpoint.js)).
- With `OAUTH2_LOGOUT_ENDPOINT` unset, the logout URL builder
  ([server/lib/oauthLogoutUrl.js](../../../server/lib/oauthLogoutUrl.js))
  returns an empty string and WeKan does not redirect to the provider.
- Tests: [tests/oidcEndpoint.test.cjs](../../../tests/oidcEndpoint.test.cjs),
  [tests/oauthLogoutUrl.test.cjs](../../../tests/oauthLogoutUrl.test.cjs),
  [tests/oauth2LoginStyle.test.cjs](../../../tests/oauth2LoginStyle.test.cjs).

## Commits

 - [Admin Panel / People / OAuth2 can override every OAuth2 setting](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Log in by full-page redirect by default](https://github.com/wekan/wekan/commit/ad51a03731ed2daf039204ccc7423dd05b3c9506)
 - [Extract the OIDC RP-Initiated Logout URL builder into a tested helper](https://github.com/wekan/wekan/commit/2e752c1e9677bf0bb1abc4627800df5a45afeb14)
 - [Add the example Authelia OAuth2/OIDC configuration](https://github.com/wekan/wekan/commit/87c1e82ec7d2b9579fd3255a0a9cfc7a702ef38c)
 - [Resolve absolute and relative OIDC endpoints](https://github.com/wekan/wekan/commit/aee94c2637594cd154be3973e68033aa77a3e6d3)
