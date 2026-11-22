# Zitadel

## What it is

Zitadel login using OAuth2. [Zitadel](https://zitadel.com/docs) is an open
source identity provider with OpenID Connect. It signs users in to WeKan
through WeKan's generic [OAuth2 / OIDC](OAuth2.md) login: the sign-in page gets
a **Sign in with Oidc** button, and the first login creates the WeKan account.

- Original issue: https://github.com/wekan/wekan/issues/5250

## Read more

- [OAuth at Wikipedia](https://en.wikipedia.org/wiki/OAuth) and
  [OpenID Connect at Wikipedia](https://en.wikipedia.org/wiki/OpenID)
- [Zitadel documentation](https://zitadel.com/docs) and its
  [OpenID Connect endpoints](https://zitadel.com/docs/apis/openidoauth/endpoints)
- [OAuth2 / OIDC](OAuth2.md), the generic login used here

## How to use it

1. In Zitadel, create a project and a **Web** application with the code flow,
   and set its redirect URI to your WeKan `ROOT_URL` followed by
   `/_oauth/oidc`, for example `https://boards.example.com/_oauth/oidc`. Take
   the client id and the secret.
2. Set the WeKan settings for your platform.

   **Snap**

   ```
   sudo snap set wekan oauth2-enabled='true'
   sudo snap set wekan oauth2-client-id='xxxxxxxx'
   sudo snap set wekan oauth2-secret='xxxxxxx'
   sudo snap set wekan oauth2-server-url='https://auth.yourserver.com'
   sudo snap set wekan oauth2-auth-endpoint='/oauth/v2/authorize'
   sudo snap set wekan oauth2-userinfo-endpoint='/oidc/v1/userinfo'
   sudo snap set wekan oauth2-token-endpoint='/oauth/v2/token'
   sudo snap set wekan oauth2-id-map='sub'
   sudo snap set wekan oauth2-username-map='email'
   sudo snap set wekan oauth2-email-map='email'
   sudo snap set wekan oauth2-fullname-map='given_name'
   sudo snap set wekan oauth2-request-permissions='openid email profile'
   ```

   **Docker** ([docker-compose.yml](../../../docker-compose.yml))

   ```
         - OAUTH2_ENABLED=true
         - OAUTH2_CLIENT_ID=xxxxxxxx
         - OAUTH2_SECRET=xxxxxxxx
         - OAUTH2_SERVER_URL=https://auth.yourserver.com
         - OAUTH2_AUTH_ENDPOINT=/oauth/v2/authorize
         - OAUTH2_USERINFO_ENDPOINT=/oidc/v1/userinfo
         - OAUTH2_TOKEN_ENDPOINT=/oauth/v2/token
         - OAUTH2_ID_MAP=sub
         - OAUTH2_USERNAME_MAP=email
         - OAUTH2_EMAIL_MAP=email
         - OAUTH2_FULLNAME_MAP=given_name
         - OAUTH2_REQUEST_PERMISSIONS=openid profile email
   ```

   **Others**: similar like above Docker, or Admin Panel / People / OAuth2.
3. Click **Sign in with Oidc** on WeKan's sign-in page.

Do not turn on `OAUTH2_B2C_ENABLED` for Zitadel: it is for Azure AD B2C, and
makes WeKan read the claims from the access token and require an `emails`
claim, which Zitadel's user info does not have. The variable is
`OAUTH2_USERNAME_MAP`, not `OAUTH2_USERNAME`. Map the id to `sub`, the
per-user unique id; `preferred_username` is not guaranteed to be unique.

## How the numbers are calculated

Zitadel login has no numbers of its own. When a token answer has no
`expires_in`, WeKan uses the OAuth2 default of 3600 seconds
(`packages/wekan-oidc/oidc_server.js`); Zitadel sends one (43199 seconds in
the issue's log).

## How it works in WeKan

It is the generic OIDC login:
[packages/wekan-oidc/oidc_server.js](../../../packages/wekan-oidc/oidc_server.js)
exchanges the code at `OAUTH2_TOKEN_ENDPOINT`, reads `OAUTH2_USERINFO_ENDPOINT`,
and maps the claims with the `OAUTH2_*_MAP` settings;
[packages/wekan-oidc/endpoint.js](../../../packages/wekan-oidc/endpoint.js)
joins each endpoint to `OAUTH2_SERVER_URL`.

## Commits

 - [Override every OAuth2 setting in Admin Panel / People / OAuth2](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Log in by full-page redirect by default with OAuth2/OIDC](https://github.com/wekan/wekan/commit/ad51a03731ed2daf039204ccc7423dd05b3c9506)
 - [Resolve absolute and relative OIDC endpoints](https://github.com/wekan/wekan/commit/aee94c2637594cd154be3973e68033aa77a3e6d3)
