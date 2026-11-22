# Oracle OIM

## What it is

Login with OIDC OAuth2 Oracle OIM, the on-premise identity manager. It uses
WeKan's [OAuth2 / OIDC](OAuth2.md) login with one switch,
`ORACLE_OIM_ENABLED=true`, which changes the two things Oracle OIM does
differently: how the token is requested, and where the email comes from.

## Read more

- [Oracle Identity Management at Wikipedia](https://en.wikipedia.org/wiki/Oracle_Identity_Management)
- [OpenID Connect at Wikipedia](https://en.wikipedia.org/wiki/OpenID)
- [OAuth2 / OIDC](OAuth2.md) and [Oracle Identity Cloud](Oracle-Identity-Cloud.md)

## How to use it

Other OIDC settings are similar like in OAuth2, Google, Azure etc settings.
Both username and email should be mapped to email.

1. Set the [OAuth2](OAuth2.md) settings of your OIM server
   (`OAUTH2_CLIENT_ID`, `OAUTH2_SECRET`, `OAUTH2_SERVER_URL`, the three
   endpoints, `OAUTH2_USERNAME_MAP` and `OAUTH2_EMAIL_MAP` both to the email
   claim), and the scopes OIM requires in `OAUTH2_REQUEST_PERMISSIONS`.
2. Turn Oracle OIM on.

   Snap:
   ```
   sudo snap set wekan oracle-oim-enabled='true'
   ```
   Unset Snap:
   ```
   sudo snap unset wekan oracle-oim-enabled
   ```
   Docker:
   ```
   - ORACLE_OIM_ENABLED=true
   ```
   It is also in Admin Panel / People / OAuth2.
3. Click **Sign in with Oidc** on the sign-in page.

## How the numbers are calculated

Oracle OIM has no numbers of its own. Its default is off
(`ORACLE_OIM_ENABLED` is `false` in
[models/lib/authConfigCatalog.js](../../../models/lib/authConfigCatalog.js)).

## How it works in WeKan

Here is a summary of code and changes by anonymous Wekan contributors and xet7:

- If the OAuth2 token doesn't contain the email address, Wekan raised an
  exception. The userinfo and servicedata were changed to avoid that.
- In the getToken function, OIM expects a POST request that contains
  OAUTH2_CLIENT_ID and OAUTH2_SECRET in its header. That is
  `getTokenOracleOim` in
  [packages/wekan-oidc/oidc_server.js](../../../packages/wekan-oidc/oidc_server.js):
  the client id and secret go base64-encoded in an `Authorization: Basic`
  header.
- A custom "scope" value first needed an edit of app.js; since a later commit
  it is set with the `OAUTH2_REQUEST_PERMISSIONS` environment variable.
- When the email is null or empty (it should not be, but sometimes it is),
  WeKan takes the value of `OAUTH2_USERNAME_MAP` instead of
  `OAUTH2_EMAIL_MAP`. When logging into Wekan with OIDC, both username and
  email should be mapped to email.
- It was tested that with these changes, this works well.

[server/authentication.js](../../../server/authentication.js)
(`reconfigureOidc`) writes the `oidc` service configuration when either
`ORACLE_OIM_ENABLED` or `OAUTH2_ENABLED` is true.

## Commits

 - [Override every login environment variable, ORACLE_OIM_ENABLED too, in Admin Panel / People](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [With ORACLE_OIM_ENABLED, set OAUTH2_REQUEST_PERMISSIONS freely with an environment variable](https://github.com/wekan/wekan/commit/1b429b3f99c32840ebb0ff9a29015aa8c28ec644)
 - [Login with Oracle OIM, with the setting ORACLE_OIM_ENABLED=true](https://github.com/wekan/wekan/commit/ec8a78537f1dc40e967de36a02ea09cf7398318a)
