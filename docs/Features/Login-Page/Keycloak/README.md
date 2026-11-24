# Keycloak login using OAuth2/OIDC

## What it is

Keycloak is an open source identity and access management server. WeKan signs
people in with Keycloak through its generic OAuth2/OpenID Connect login:
Keycloak is the identity provider, WeKan is a confidential client in a
Keycloak realm, and the OIDC button on WeKan's sign-in page sends the user to
Keycloak and back. With `OAUTH2_LOGOUT_ENDPOINT` set, WeKan's Log Out also
ends the Keycloak session.

## Read more

- [Keycloak on Wikipedia](https://en.wikipedia.org/wiki/Keycloak)
- [Keycloak](https://www.keycloak.org/) and the
  [Keycloak Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/)
- [Keycloak: Getting started with Docker](https://www.keycloak.org/getting-started/getting-started-docker),
  image [quay.io/keycloak/keycloak](https://quay.io/repository/keycloak/keycloak).
  The old `jboss/keycloak` image on Docker Hub this page linked to no longer
  answers.
- [OpenID Connect RP-Initiated Logout 1.0](https://openid.net/specs/openid-connect-rpinitiated-1_0.html)
- [2022 KEYCLOAK CERTIFICATE FIX HERE](https://github.com/wekan/wekan/issues/4525)
- [Somebody got Keycloak working](https://github.com/wekan/wekan/issues/3277#issuecomment-696333794)
- WeKan: [OAuth2](../OAuth2.md), [autologin](../autologin.md),
  [Authelia](../Authelia.md)

## How to use it

1. In Keycloak, create a Client for WeKan. When creating a Client in keycloak,
   ensure the access type is confidential under the settings tab. After
   clicking save, you will have a Credentials tab. You can retrieve the
   secret from that location. Keycloak settings:
   [realm-export.zip](https://wekan.fi/keycloak/realm-export.zip) (a copy is
   also here: [realm-export.zip](realm-export.zip)).
2. Use `https://<your WeKan ROOT_URL>/_oauth/oidc` as the redirect URI, and
   add your WeKan `ROOT_URL` (for example `https://kanban.company.com`) to
   **Valid post logout redirect URIs** (Keycloak 18+).
3. Set the environment variables below in your WeKan environment (or in
   **Admin Panel / People / OAuth2**, `/admin/people/oidc`).
4. [Outstanding Bug](https://github.com/wekan/wekan/issues/1874#issuecomment-460802250):
   Create the first user (admin) with the regular process. Then the remaining
   users can use the Register with OIDC process.
5. Open WeKan at its `ROOT_URL` and click the OIDC button.

NOTE: Is that preffered_username setting wrong? Correct settings should be
for OIDC login:

```
sudo snap set wekan oauth2-username-map='email'

sudo snap set wekan oauth2-email-map='email'
```

**Snap**

Copy below commands to `auth.sh` textfile, make it executeable `chmod +x auth.sh` and run it with `./auth.sh`.
```
sudo snap set wekan oauth2-enabled='true'
sudo snap set wekan oauth2-client-id='<Keycloak create Client ID>'
sudo snap set wekan oauth2-secret='<Keycloak Client secret>'
sudo snap set wekan oauth2-server-url='<Keycloak server name>/auth'
sudo snap set wekan oauth2-auth-endpoint='/realms/<keycloak realm>/protocol/openid-connect/auth'
sudo snap set wekan oauth2-userinfo-endpoint='/realms/<keycloak realm>/protocol/openid-connect/userinfo'
sudo snap set wekan oauth2-token-endpoint='/realms/<keycloak realm>/protocol/openid-connect/token'
sudo snap set wekan oauth2-id-map='preferred_username'
sudo snap set wekan oauth2-username-map='preferred_username'
sudo snap set wekan oauth2-fullname-map='given_name'
sudo snap set wekan oauth2-email-map='email'
```

**Docker**

[docker-compose.yml](../../../../docker-compose.yml)
```
- DEBUG=true
- OAUTH2_ENABLED=true
- OAUTH2_CLIENT_ID=<Keycloak create Client ID>
- OAUTH2_SERVER_URL=<Keycloak server name>/auth
- OAUTH2_AUTH_ENDPOINT=/realms/<keycloak realm>/protocol/openid-connect/auth
- OAUTH2_USERINFO_ENDPOINT=/realms/<keycloak realm>/protocol/openid-connect/userinfo
- OAUTH2_TOKEN_ENDPOINT=/realms/<keycloak realm>/protocol/openid-connect/token
- OAUTH2_LOGOUT_ENDPOINT=/realms/<keycloak realm>/protocol/openid-connect/logout
- OAUTH2_SECRET=<keycloak client secret>
- OAUTH2_ID_MAP=preferred_username
- OAUTH2_USERNAME_MAP=preferred_username
- OAUTH2_FULLNAME_MAP=given_name
- OAUTH2_EMAIL_MAP=email
```

**Restrict sign-in to email domains.** To restrict OAuth2/OIDC sign-in to
specific email domains, set
`OAUTH2_ALLOWED_EMAIL_DOMAINS=example.internal,other.internal`. This also works
with an on-premise Keycloak server without Internet access and needs no DNS
lookup or additional dependency. The domains are comma-separated, trimmed and
compared without regard to case. Each domain matches exactly; subdomains must
be listed separately. Leave the variable unset or empty to allow all domains.
Malformed restrictions deny sign-in rather than disabling the restriction.

The policy checks the provider's mapped email on every new OAuth2 handshake,
for new and existing users, before any group or board memberships are changed.
Configure the identity provider to supply an authoritative email that users
cannot freely change. This setting does not revoke existing sessions or affect
local password, LDAP, CAS or SAML sign-in. Sign out existing users when changing
the policy if they must authenticate again immediately.

## How the numbers are calculated

- **Email domains** ([packages/wekan-oidc/emailDomainPolicy.js](../../../../packages/wekan-oidc/emailDomainPolicy.js)):
  the list is split at commas, each entry trimmed and lower-cased. Each entry
  must be a valid domain (letters, digits, `.` and `-`, no label starting or
  ending with `-`), or every login is refused. The email must have exactly one
  `@`, no whitespace, and its domain, lower-cased, must equal one entry.
- **Session expiry**: `now + 1000 * expires_in` milliseconds, 3600 seconds
  when Keycloak's token response has none
  ([packages/wekan-oidc/oidc_server.js](../../../../packages/wekan-oidc/oidc_server.js)).

## How it works in WeKan

- The OIDC login is [packages/wekan-oidc](../../../../packages/wekan-oidc):
  relative endpoints are joined to `OAUTH2_SERVER_URL`
  ([packages/wekan-oidc/endpoint.js](../../../../packages/wekan-oidc/endpoint.js)),
  and the email domain check runs before any group or board routine and before
  an account is created or merged.
- [server/lib/oauthLogoutUrl.js](../../../../server/lib/oauthLogoutUrl.js)
  builds the logout URL: `OAUTH2_LOGOUT_ENDPOINT` (joined to the server URL
  when relative) with `post_logout_redirect_uri=<ROOT_URL>` and
  `client_id=<OAUTH2_CLIENT_ID>`.
- Tests: [tests/oidcEmailDomainPolicy.test.cjs](../../../../tests/oidcEmailDomainPolicy.test.cjs),
  [tests/oauthLogoutUrl.test.cjs](../../../../tests/oauthLogoutUrl.test.cjs),
  [tests/oidcAutoRedirectLoop.test.cjs](../../../../tests/oidcAutoRedirectLoop.test.cjs),
  [tests/playwright/specs/oidc-redirect-guard.e2e.js](../../../../tests/playwright/specs/oidc-redirect-guard.e2e.js).

### Log Out redirects to the Keycloak home page (issue #6158)

With autologin (`OIDC_REDIRECTION_ENABLED=true`), clicking **Log Out** used to
redirect to the Keycloak server home page, which shows an error page for
non-admin users. Set `OAUTH2_LOGOUT_ENDPOINT` to Keycloak's end_session endpoint
so Wekan performs an OIDC RP-initiated logout: it ends the Keycloak session and
returns the user to Wekan (your `ROOT_URL`) via `post_logout_redirect_uri`.

In the Keycloak client settings, add your Wekan `ROOT_URL` (for example
`https://kanban.company.com`) to **Valid post logout redirect URIs** (Keycloak 18+),
otherwise Keycloak rejects the redirect back to Wekan.

### Debugging, if Snap OIDC login does not work
```
sudo snap set wekan debug='true'
```
Click Oidc button. Then:
```
sudo snap logs wekan.wekan
sudo systemctl status snap.wekan.wekan
```

### Debugging, if Docker OIDC login does not work
```
docker logs wekan-app
```

## Commits

 - [Admin Panel / People / OAuth2 overrides every OAuth2 setting](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Log in by full-page redirect by default](https://github.com/wekan/wekan/commit/ad51a03731ed2daf039204ccc7423dd05b3c9506)
 - [Add on-premise OAuth2 email domain restrictions](https://github.com/wekan/wekan/commit/2fd461fa5582fcdca820cc2dcacaae0e605a66b8)
 - [Extract the OIDC RP-Initiated Logout URL builder into a tested helper](https://github.com/wekan/wekan/commit/2e752c1e9677bf0bb1abc4627800df5a45afeb14)
 - [Log Out returns to WeKan through the provider's end_session endpoint](https://github.com/wekan/wekan/commit/f569eb9c0c0a654d39b927322eb606e473ad7ef4)
 - [Updated Keycloak link](https://github.com/wekan/wekan/commit/e0284f225b6567eb90ac0224fd348cf8e4e87229)
 - [Updated Keycloak login settings at start-wekan.bat and start-wekan.sh](https://github.com/wekan/wekan/commit/ab4c3bd2fc49e6fa82ec47dccdf9670110cddf98)
 - [Update the docker-compose.yml Keycloak part](https://github.com/wekan/wekan/commit/54b7591ca04142cc079581a2d00a5bd7bf0ef2cf)
 - [Revert autologin, because it broke OIDC login with Keycloak](https://github.com/wekan/wekan/commit/43a709675394f6aade42033c14c7fb5b78ac25c8)
