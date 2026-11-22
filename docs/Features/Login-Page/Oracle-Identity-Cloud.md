# Oracle Identity Cloud

## What it is

Oracle Identity Cloud Service (IDCS, now part of Oracle Cloud Infrastructure
Identity and Access Management) is Oracle's hosted identity provider. It can
sign users in to WeKan through WeKan's generic [OAuth2 / OIDC](OAuth2.md)
login, so there is no Oracle-specific code for it in WeKan.

## Read more

- [OpenID Connect at Wikipedia](https://en.wikipedia.org/wiki/OpenID)
- [How OpenID Connect works](https://openid.net/developers/how-connect-works/)
- [Oracle Identity Cloud Service documentation](https://docs.oracle.com/en/cloud/paas/identity-cloud/index.html)
- Article series at Medium:
  1. [Setting up Wekan with Docker, OAuth2 and Oracle Identity Cloud Service](https://medium.com/@arno.schots/setting-up-wekan-with-docker-oauth2-and-oracle-identity-cloud-service-57d4461c5bbe)
- [Oracle OIM](Oracle-OIM.md), Oracle's on-premise identity manager

## How to use it

1. In Oracle Identity Cloud, add a **Confidential Application** with the
   *Authorization Code* grant, and set its redirect URL to your WeKan
   `ROOT_URL` followed by `/_oauth/oidc`, for example
   `https://boards.example.com/_oauth/oidc`.
2. Take the client id and secret, and the endpoints from your tenant's
   `/.well-known/openid-configuration`.
3. Set the `OAUTH2_*` variables in WeKan's environment, or in Admin Panel /
   People / OAuth2, as the Medium article and [OAuth2](OAuth2.md) show:
   `OAUTH2_ENABLED=true`, `OAUTH2_CLIENT_ID`, `OAUTH2_SECRET`,
   `OAUTH2_SERVER_URL`, `OAUTH2_AUTH_ENDPOINT`, `OAUTH2_TOKEN_ENDPOINT`,
   `OAUTH2_USERINFO_ENDPOINT`, `OAUTH2_ID_MAP=sub`,
   `OAUTH2_USERNAME_MAP=email`, `OAUTH2_EMAIL_MAP=email`,
   `OAUTH2_REQUEST_PERMISSIONS=openid profile email`.
4. Click **Sign in with Oidc** on WeKan's sign-in page.

## How the numbers are calculated

This login has no numbers of its own; the defaults are those of
[OAuth2](OAuth2.md) (for example `OAUTH2_LOGIN_STYLE=redirect`).

## How it works in WeKan

It is the generic OIDC login:
[packages/wekan-oidc/oidc_server.js](../../../packages/wekan-oidc/oidc_server.js)
exchanges the code and reads the user info, and
[packages/wekan-oidc/endpoint.js](../../../packages/wekan-oidc/endpoint.js)
joins each endpoint to `OAUTH2_SERVER_URL` (a full `https://` endpoint is used
as it is). [server/authentication.js](../../../server/authentication.js)
writes the `oidc` service configuration from the settings in effect.

## Commits

 - [Override every login environment variable in Admin Panel / People](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Resolve absolute and relative OIDC endpoints](https://github.com/wekan/wekan/commit/aee94c2637594cd154be3973e68033aa77a3e6d3)
 - [Migrate the OIDC login to Meteor 3's async API](https://github.com/wekan/wekan/commit/0fcdf47545a61ab30b10e86b6a4fdb7324cfc2da)
