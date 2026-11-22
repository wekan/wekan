# Login with Nextcloud

## What it is

Nextcloud users can sign in to WeKan with their Nextcloud account, in two ways.
With **OAuth2**, Nextcloud is the identity provider of WeKan's generic
[OAuth2 / OIDC](OAuth2.md) login, and the sign-in page has a "Sign in with
Oidc" button. With the **Nextcloud ExApp**, WeKan runs as an external app inside
Nextcloud (AppAPI), and the Nextcloud user is signed in to WeKan automatically,
with no WeKan sign-in page at all.

## Read more

- [Nextcloud at Wikipedia](https://en.wikipedia.org/wiki/Nextcloud)
- [Nextcloud OAuth2 in the Nextcloud admin manual](https://docs.nextcloud.com/server/latest/admin_manual/configuration_server/oauth2.html)
- [Nextcloud AppAPI and external apps](https://docs.nextcloud.com/server/latest/admin_manual/exapps_management/AppAPIAndExternalApps.html)
- [WeKan for Nextcloud: building, publishing and integrations](../../Platforms/FOSS/Container/Docker/Nextcloud/README.md)
- [OAuth2 / OIDC](OAuth2.md), the generic login Nextcloud plugs into
- Pull requests: [Implemented Nextcloud OAuth2 Hack, issue \#1874](https://github.com/wekan/wekan/pull/2897/files)
  and [Improving documentation for Nextcloud integration](https://github.com/wekan/wekan/pull/3248/files)

## How to use it

**OAuth2 login**

1. In Nextcloud open `https://your.nextcloud/index.php/settings/admin/security`
   and add an **OAuth 2.0 client**. Use `https://your.wekan/_oauth/oidc` (your
   WeKan `ROOT_URL` followed by `/_oauth/oidc`) as the redirect URI. Write down
   the client identifier and the secret.
2. Set WeKan's environment (or Admin Panel / People / OAuth2):

   ```
   OAUTH2_ENABLED=true
   OAUTH2_CLIENT_ID=xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx
   OAUTH2_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   OAUTH2_SERVER_URL=https://your-nextcloud.tld
   OAUTH2_AUTH_ENDPOINT=/index.php/apps/oauth2/authorize
   OAUTH2_USERINFO_ENDPOINT=/ocs/v2.php/cloud/user?format=json
   OAUTH2_TOKEN_ENDPOINT=/index.php/apps/oauth2/api/v1/token
   OAUTH2_ID_MAP=id
   OAUTH2_USERNAME_MAP=id
   OAUTH2_FULLNAME_MAP=display-name
   OAUTH2_EMAIL_MAP=email
   ```

   The same lines are commented out under `==== OAUTH2 Nextcloud ====` in
   [docker-compose.yml](../../../docker-compose.yml).
3. Restart WeKan (or save in the Admin Panel) and click **Sign in with Oidc**
   on the sign-in page.

Users of one Nextcloud often share no email domain; give every new OAuth2
account an organization with `OAUTH2_DEFAULT_ORGANIZATION` (see
[OAuth2](OAuth2.md)).

**Nextcloud ExApp**

1. Install the WeKan external app in Nextcloud 32-35 with a HaRP deploy
   daemon, as described in
   [WeKan for Nextcloud](../../Platforms/FOSS/Container/Docker/Nextcloud/README.md).
2. Set `NEXTCLOUD_ADMIN_USERS` to a JSON array of the exact Nextcloud user ids
   who are WeKan administrators, for example `["admin"]`.
3. Open WeKan from Nextcloud. The Nextcloud user is signed in.

## How the numbers are calculated

Nextcloud login has no numbers of its own. The ExApp identity it accepts is
limited: the signed identity payload is at most 4096 characters, the signature
is 64 hex characters (HMAC-SHA-256), and a user id is 1-255 characters without
control characters. The WeKan user id is `nc-` followed by the SHA-256 of the
Nextcloud URL and user id (`server/lib/nextcloudIdentity.js`).

## How it works in WeKan

**OAuth2.** Nextcloud's user info answer is wrapped in `ocs.data`;
[packages/wekan-oidc/oidc_server.js](../../../packages/wekan-oidc/oidc_server.js)
unwraps it ("Nextcloud hack"), and the rest is the generic OAuth2 login.

**ExApp**, only when `NEXTCLOUD_EXAPP=true`:

- The in-container gateway checks AppAPI's headers and replaces the identity
  headers with `x-wekan-nextcloud-user` and an HMAC signature made with
  `WEKAN_NEXTCLOUD_PROXY_KEY`, a random key only the gateway and WeKan know.
- [server/lib/nextcloudIdentity.js](../../../server/lib/nextcloudIdentity.js)
  verifies the signature and the issuer (`NEXTCLOUD_URL`), and derives the
  user id and the admin flag (`NEXTCLOUD_ADMIN_USERS`).
- [server/nextcloud.js](../../../server/nextcloud.js) registers the
  `nextcloud` login handler, creates the account on the first visit (never
  linking by email or username), keeps `isAdmin` in step with
  `NEXTCLOUD_ADMIN_USERS`, refuses a disabled account, and makes every login
  (resume tokens too) match the identity of the connection.
- [server/lib/nextcloudTransport.js](../../../server/lib/nextcloudTransport.js)
  keeps the verified identity bound to the WebSocket before SockJS drops
  custom headers.
- [client/nextcloud.js](../../../client/nextcloud.js) logs in with
  `{ nextcloud: true }` when the server says it runs as an ExApp.
- Tests: [tests/nextcloudLogin.test.cjs](../../../tests/nextcloudLogin.test.cjs),
  [tests/nextcloudIdentity.test.cjs](../../../tests/nextcloudIdentity.test.cjs),
  [tests/nextcloudTransport.test.cjs](../../../tests/nextcloudTransport.test.cjs)
  and the live Nextcloud runs in [tests/nextcloud](../../../tests/nextcloud).

## Commits

 - [Test real Nextcloud deployments and keep signed identities on the WebSocket](https://github.com/wekan/wekan/commit/91bfd08097c70f6321c112e482733afaadacf6b8)
 - [Nextcloud ExApp identities](https://github.com/wekan/wekan/commit/a325cfe991ce22b69258263312652290b9adb976)
 - [Nextcloud documentation: the admin security URL and the redirect URI](https://github.com/wekan/wekan/commit/bdd28444bb7a4b8692aa916b33781cf3ab951e40)
 - [Nextcloud OAuth2 login, unwrapping the ocs user info](https://github.com/wekan/wekan/commit/362b6432a904ac88160f1d026d980a4b39e8cdab)
