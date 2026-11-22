# Admin Panel / People / Login

## What it is

The Login pane decides what is allowed at sign-in - forgot password,
self-registration, username change, self-deletion, the method selector - and
holds every login setting that an environment variable configures, so a site
administrator can override them without a restart: password login, the default
method, how long a login lasts, automatic and idle logout, password rules,
compulsory two-factor authentication, Windows single sign-on and
Strict-Transport-Security. The menu entries under it (SAML, LDAP, OAuth2, CAS,
Header login, OAuth login providers, Passwordless login) do the same for each
login method.

It was the **Registration** pane of Settings.

## Read more

- [Single sign-on](https://en.wikipedia.org/wiki/Single_sign-on),
  [Lightweight Directory Access Protocol](https://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol),
  [Security Assertion Markup Language](https://en.wikipedia.org/wiki/Security_Assertion_Markup_Language),
  [OAuth](https://en.wikipedia.org/wiki/OAuth),
  [OpenID](https://en.wikipedia.org/wiki/OpenID),
  [Central Authentication Service](https://en.wikipedia.org/wiki/Central_Authentication_Service),
  [HTTP Strict Transport Security](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security)
  and [Session (computer science)](https://en.wikipedia.org/wiki/Session_(computer_science))
  on Wikipedia.
- [Meteor Accounts](https://docs.meteor.com/api/accounts.html) - the account
  system WeKan's login is built on.
- [Login / Authentication methods](../../../README.md#LoginAuth)
- [LDAP](../../Login-Page/LDAP.md), [SAML](../../Login-Page/SAML.md),
  [OAuth2](../../Login-Page/OAuth2.md), [CAS](../../Login-Page/CAS.md),
  [Header login](../../Login-Page/Header-Login.md),
  [OAuth login providers](../../Login-Page/OAuth-Providers.md),
  [Passwordless](../../Login-Page/Passwordless.md),
  [Windows SSO](../../Login-Page/WindowsSSO.md),
  [Two-Factor Authentication](../../Login-Page/Two-Factor-Authentication.md),
  [Session cookies](../../Login-Page/Session-Cookies.md)
- [Locked Users](Locked-Users.md) — lockout after repeated failed attempts.
- [Login problems](../Problems/Login-Problems.md)
- [Password length](../Problems/Password-length.md)

## How to use it

**What is allowed at sign-in**

1. Open **Admin Panel**, **People**, **Login** (`/admin/people/login`).
2. The **Login: Allow** group is a list of checkboxes: each is ticked when the
   thing is allowed, and each saves on click.
   - **Forgot password** — the "forgot password" link on the sign-in page.
   - **Self-Registration** — anyone may create an account. Untick it and WeKan
     is invite-only: the pane then shows an **Invite People** box for sending
     invitations to chosen boards.
   - **Username Change** — a user may change their own username.
   - **Self delete user account** — a user may delete (or anonymize) their own
     account. Unticked, the server refuses it too, and the last site
     administrator can never remove themselves
     ([Settings enforced on the server](../Settings-Enforced-On-Server.md)).
   - **Display Authentication Method** — show the method selector on the
     sign-in page.

**Invite people while self-registration is off**

1. Untick **Self-Registration**.
2. In **Invite People**, type the e-mail addresses.
3. Under **To board(s)**, tick the boards they are invited to.
4. Click **Invite**. The result is shown under the button.

**The OIDC button**

1. In **Customize the OIDC button text**, type what the OIDC / OAuth2 sign-in
   button says.
2. Click **Save** under it.

**Override a login setting**

1. Below the button text is the login settings form. Each field is labelled
   with its environment variable and says which value is in effect: the Admin
   Panel's, the environment variable's, or the default.
2. Type a value or choose one, and save the form.
3. Leaving a field empty, or choosing **Default**, removes the override, and
   the environment variable applies again.
4. For one login method, open its own entry in the People menu instead:
   **SAML**, **LDAP**, **OAuth2**, **CAS**, **Header login**, **OAuth login
   providers** or **Passwordless login**.

**Test LDAP and sync it now**

1. Open **Admin Panel**, **People**, **LDAP**.
2. Click **Test LDAP Connection** to try the LDAP settings in effect.
3. Click **Sync LDAP users now** to run the LDAP background sync once.

## How the numbers are calculated

The defaults and limits are in [models/lib/authConfigCatalog.js](../../../../models/lib/authConfigCatalog.js):

| Setting | Default | Largest value |
| --- | --- | --- |
| `ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS` | 90 days (also when the value is not a number) | - |
| `ACCOUNTS_COOKIE_REFRESH_RATE_LIMIT` | Meteor's own: 30 refreshes per 10 seconds per address | 100000 |
| `LOGOUT_IN` | unset | 3650 days |
| `LOGOUT_ON_HOURS` | unset | 23 |
| `LOGOUT_ON_MINUTES` | unset | 59 |
| `LOGOUT_IDLE_MINUTES` | off (empty or 0) | 10080 (one week) |
| `USERS_DISABLE_INACTIVE_AFTER_DAYS` | off (empty or 0) | 36500 |
| `PASSWORD_MIN_LENGTH` | 8 | 256 |
| `HSTS_MAX_AGE` | 15552000 seconds (180 days) | 63072000 (two years) |

- **Cookie refresh limit**: how many login-cookie refreshes one client address
  may make per 10 seconds; every page load is one. Only a positive whole number
  changes it ([server/accounts-common.js](../../../../server/accounts-common.js)).
- **Automatic logout**: see the table below; the server checks once a minute
  (`SWEEP_MS` in [server/logoutTimer.js](../../../../server/logoutTimer.js)),
  so a login can last up to a minute past its deadline.
- **LDAP background sync**: runs on the schedule `LDAP_BACKGROUND_SYNC_INTERVAL`;
  **Sync LDAP users now** runs it once immediately.

## How it works in WeKan

Stored the other way round, because the fields are older than the wording:
`disableForgotPassword` and `disableRegistration` are *disable* flags, so the
checkbox shows the opposite of what is stored. Only the display is inverted.

**The Login pane's own settings.** Below the group:

- **Default Authentication Method** — what the sign-in page starts with:
  `DEFAULT_AUTHENTICATION_METHOD` in the login settings form under the pane.
  Choosing a method there overrides the environment variable; **Default**
  leaves the variable in charge, as it was before. The choices are password,
  LDAP, OAuth2, CAS, SAML, passwordless and each OAuth login provider.
- **OIDC button text** — what the OIDC / OAuth2 sign-in button says.

Under them, the Login pane's own environment variables, each overridable:
`PASSWORD_LOGIN_ENABLED`, `DEFAULT_AUTHENTICATION_METHOD`,
`ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS` and
`ACCOUNTS_COOKIE_REFRESH_RATE_LIMIT` (these two applied when WeKan starts),
`LOGOUT_WITH_TIMER`, `LOGOUT_IN`, `LOGOUT_ON_HOURS`, `LOGOUT_ON_MINUTES`,
`LOGOUT_IDLE_MINUTES`, `USERS_DISABLE_INACTIVE_AFTER_DAYS`,
`PASSWORD_MIN_LENGTH`, `PASSWORD_MIN_LENGTH_ENFORCE`, `PASSWORD_CHECK_PWNED`
and `REQUIRE_2FA` (off, admins, all). Under those come two more forms: Windows
single sign-on (`WINDOWS_SSO_ENABLED`, `WINDOWS_SSO_DOMAINS`,
`WINDOWS_SSO_ACTIVE_DIRECTORY`, `WINDOWS_SSO_MERGE_EXISTING_USERS`; it works
only on a Windows server) and Strict-Transport-Security (`HSTS_MAX_AGE`,
`HSTS_INCLUDE_SUBDOMAINS`, `HSTS_PRELOAD`; sent only when `ROOT_URL` is https).

`ACCOUNTS_COOKIE_REFRESH_RATE_LIMIT` is applied when WeKan starts: how many
login-cookie refreshes one client address may make per 10 seconds (Meteor's
default is 30; every page load is one). Raise it when many users reach WeKan
through a proxy that WeKan does not trust for the client address
(`HTTP_FORWARDED_COUNT`), because they then share one address. The browser
tests set it, as they all come from localhost. It used to be environment-only;
it is now also in the login settings form, like the other variables.

### Provider settings

Every login environment variable can be overridden in the Admin Panel, in the
section of its login method: **SAML**, **LDAP**, **OAuth2** (OpenID Connect,
Oracle OIM), **CAS**, **Header login**, **OAuth login providers** and
**Passwordless login** - `/admin/people/saml`, `/admin/people/ldap`,
`/admin/people/oidc`, `/admin/people/cas`, `/admin/people/header-login`,
`/admin/people/oauth` and `/admin/people/passwordless`.

**Header login is the exception: it is set by the environment only** (decided
on 2026-10-08). With `HEADER_LOGIN_ID` and `HEADER_LOGIN_TRUSTED_IPS` set, a
proxy at a trusted address signs in as anyone it names, so switching it on has
to take access to the host, not only a site administrator's session. Its
section shows the values in effect read-only, with no Save button; a value
stored there by an earlier version is ignored, and a save sent by hand is
refused and shown in Admin Panel → Problems as ProxyBleed.

Each field is labelled with its environment variable and says which value is in
effect: the Admin Panel's, the environment variable's, or the default. Leaving
a field empty, or choosing **Default**, removes the override, and the
environment variable applies again. A change applies to the next login without
a restart, except where the field says it takes effect after WeKan restarts.

Passwords and client secrets (`LDAP_AUTHENTIFICATION_PASSWORD`,
`OAUTH2_SECRET`) can also come from a file: `LDAP_AUTHENTIFICATION_PASSWORD_FILE`
and `OAUTH2_SECRET_FILE` name it (Docker / Kubernetes secrets), and WeKan reads
it at each login, so the password is never an environment variable. The order
is the Admin Panel, then the variable, then its file. The file path is an
environment variable only: settable in the Admin Panel beside the LDAP host or
the OAuth2 token endpoint, it would let the server read any file and send it
there. The page shows when the password comes from the file, and when that
file cannot be read. Secrets are never sent to the browser. The page shows only whether
one is set and where it comes from; typing a new one replaces it, and the
check box under it removes the one stored in the Admin Panel. Other values
are shown with any password written inside a URL masked by the server, and a
URL field refuses a user name or password in it.

The LDAP section has **Test LDAP Connection**, which tries the LDAP settings in
effect. With a service account (`LDAP_AUTHENTIFICATION`) it binds with it;
without one it does an anonymous base-scope search of `LDAP_BASEDN`, reading
no attributes. Either way it reports success only when the directory answered,
and otherwise shows the directory's own error; without a service account and
without `LDAP_BASEDN` it says that nothing could be tested.

**Sync LDAP users now** runs the LDAP background sync once, immediately, with
the settings in effect: `LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS` imports
directory users not in WeKan yet, and
`LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED` refreshes the ones that
are. `LDAP_BACKGROUND_SYNC` (the schedule) does not have to be on, but with
neither of the other two it says there is nothing to sync. A click during a
scheduled run waits for that run instead of starting a second one. The list of variables per section is
[models/lib/authConfigCatalog.js](../../../../models/lib/authConfigCatalog.js);
SAML's is [models/lib/samlConfig.js](../../../../models/lib/samlConfig.js) and the
OAuth login providers' is [models/lib/oauthProviders.js](../../../../models/lib/oauthProviders.js).

### Automatic logout

`LOGOUT_WITH_TIMER=true` signs users out automatically; Admin Panel / People /
Login overrides it and the three settings below like any other login setting.
A login ends at a deadline counted from when it was made:

| Settings | A login ends |
| --- | --- |
| `LOGOUT_IN=2` | two days after it was made |
| `LOGOUT_ON_HOURS=3` | at the next 03:00 |
| `LOGOUT_IN=1`, `LOGOUT_ON_HOURS=9`, `LOGOUT_ON_MINUTES=55` | at 09:55 on the day after the day it was made |

Times are the server's local time. Once a minute the server removes every login
that has passed its deadline, and the browsers using it are signed out. An
unusable combination (an hour over 23, minutes without an hour, neither
`LOGOUT_IN` nor `LOGOUT_ON_HOURS`) signs nobody out, and the server log says
why. The deadline arithmetic is [models/lib/logoutTimer.js](../../../../models/lib/logoutTimer.js).

### Files, methods and tests

- The pane is the `general` template in
  [client/components/settings/settingBody.jade](../../../../client/components/settings/settingBody.jade)
  (it moved here from Settings; Blaze templates are global, so it is still
  defined there), drawn by
  [peopleBody.jade](../../../../client/components/settings/peopleBody.jade)
  together with three `authProviderSettings` forms
  ([authProviderSettings.jade](../../../../client/components/settings/authProviderSettings.jade))
  for the `login`, `windowsSso` and `httpSecurity` sections of the catalog.
- At run time [server/lib/authConfig.js](../../../../server/lib/authConfig.js)
  resolves every setting: the Admin Panel value first, then the environment
  variable (and its older aliases), then for a secret its `_FILE`. Forms are
  loaded with `getAuthConfigSources` and saved with `saveAuthConfigSettings`,
  both site-admin only; every save is recorded in the
  [Audit log](Audit-Log.md).
- The People menu lists Login after Shared templates; a per-tenant
  Organization admin does not get this pane (see
  [Organizations](Organizations.md#organization-admins)).
- On Sandstorm the login panes are not shown: the grain's login is
  Sandstorm's own.
- Pinned by [tests/authConfigCatalog.test.cjs](../../../../tests/authConfigCatalog.test.cjs),
  [tests/logoutTimer.test.cjs](../../../../tests/logoutTimer.test.cjs),
  [tests/idleLogout.test.cjs](../../../../tests/idleLogout.test.cjs),
  [tests/cookieRefreshRateLimit.test.cjs](../../../../tests/cookieRefreshRateLimit.test.cjs),
  [tests/loginCookieExpiry.test.cjs](../../../../tests/loginCookieExpiry.test.cjs),
  [tests/ldapTestConnectionProbe.test.cjs](../../../../tests/ldapTestConnectionProbe.test.cjs),
  [tests/ldapSyncNow.test.cjs](../../../../tests/ldapSyncNow.test.cjs),
  [tests/ldapAdminOverrideSecurity.test.cjs](../../../../tests/ldapAdminOverrideSecurity.test.cjs),
  [tests/securityHeaders.test.cjs](../../../../tests/securityHeaders.test.cjs),
  [tests/loginEmailPanesMoved.test.cjs](../../../../tests/loginEmailPanesMoved.test.cjs)
  and the browser tests
  [admin-login-env-overrides.e2e.js](../../../../tests/playwright/specs/admin-login-env-overrides.e2e.js)
  and [admin-login-menu.e2e.js](../../../../tests/playwright/specs/admin-login-menu.e2e.js).

## Commits

 - [Problems / Password length, and the password minimum setting](https://github.com/wekan/wekan/commit/c99aa7f845ea41fe3a108d9c55abaa28298cdbf9)
 - [Idle logout after LOGOUT_IDLE_MINUTES](https://github.com/wekan/wekan/commit/41173f0f6b025da1ac9a3d5fdc6667ef4618794b)
 - [Password policy and compulsory two-factor authentication](https://github.com/wekan/wekan/commit/d7abe9910a3bbb4871b1bb512d60f232556f8b54)
 - [Strict-Transport-Security settings](https://github.com/wekan/wekan/commit/4993242c5f87b10170f07b0b6ae5c670ce7da80d)
 - [No login panes in the Sandstorm package](https://github.com/wekan/wekan/commit/e413cd4720274d50c6c02cf78dbdf56adada4684)
 - [The cookie refresh limit and the newest settings in the Admin Panel](https://github.com/wekan/wekan/commit/718fdb5dacf75d4b9048693cba65c27cf3595434)
 - [Disable accounts that have been inactive for a number of days](https://github.com/wekan/wekan/commit/b933a69cd4953543cece844865ab7dc72eb4a6c1)
 - [Log in by full-page redirect by default](https://github.com/wekan/wekan/commit/ad51a03731ed2daf039204ccc7423dd05b3c9506)
 - [Automatic logout with LOGOUT_WITH_TIMER and the LOGOUT_* settings](https://github.com/wekan/wekan/commit/c1d1a0479067db1ea59c27225b8c08e3bf62e9cb)
 - [Add the Sync LDAP users now button](https://github.com/wekan/wekan/commit/95147fc9995ebb40d3b4804ce6bf6fa3f97ad2f7)
 - [Test LDAP Connection proves the directory answered](https://github.com/wekan/wekan/commit/9d27f4be4da46d306578096aebeac24148972bda)
 - [Header login settings are environment-only](https://github.com/wekan/wekan/commit/a7628504f19294d49c249d49b80c7b9388bf2dd2)
 - [Let the login-cookie refresh limit be raised](https://github.com/wekan/wekan/commit/63a7fba46571bf61071ae74110da245bd34ef326)
 - [Read login secrets from _FILE, and override DEFAULT_AUTHENTICATION_METHOD](https://github.com/wekan/wekan/commit/031440665618f6e3492033ff65db26e8ea18c4bb)
 - [Override every login environment variable in Admin Panel / People](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Login methods get menu entries of their own](https://github.com/wekan/wekan/commit/ecdae60a8a9d0b069839193c45d6e5c8ee8a9f5d)
 - [LDAP overrides and the first Test LDAP Connection button](https://github.com/wekan/wekan/commit/ac363f979f3f73102e305302796eb6c65c5eefcb)
 - [The Login checkboxes save instead of throwing](https://github.com/wekan/wekan/commit/8593e9411efea968c67b210a523b44b97a52169c)
 - [The board-member restriction moves out of Login, to Organizations and Teams](https://github.com/wekan/wekan/commit/f0ea1601b3f6e2530501873efc5824d48ee79991)
 - [Login and E-mail move from Settings to People](https://github.com/wekan/wekan/commit/47b03ef89404c446dbaf0fc94c7271abaf82e5ef)
