# Admin Panel / People / Login

Was the **Registration** pane of Settings. It is one **Login: Allow** group of
checkboxes: each is ticked when the thing is allowed, and each saves on click.

- **Forgot password** — the "forgot password" link on the sign-in page.
- **Self-Registration** — anyone may create an account. Untick it and WeKan is
  invite-only: the pane then shows an **invite people** box for sending invitations
  to chosen boards.
- **Username Change** — a user may change their own username.
- **Self delete user account** — a user may delete their own account.
- **Display Authentication Method** — show the method selector on the sign-in page.

Stored the other way round, because the fields are older than the wording:
`disableForgotPassword` and `disableRegistration` are *disable* flags, so the
checkbox shows the opposite of what is stored. Only the display is inverted.

Below the group:

- **Default Authentication Method** — what the sign-in page starts with:
  `DEFAULT_AUTHENTICATION_METHOD` in the login settings form under the pane.
  Choosing a method there overrides the environment variable; **Default**
  leaves the variable in charge, as it was before.
- **OIDC button text** — what the OIDC / OAuth2 sign-in button says.

Under them, the Login pane's own environment variables, each overridable:
`PASSWORD_LOGIN_ENABLED`, `DEFAULT_AUTHENTICATION_METHOD` and
`ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS` (applied when WeKan starts).

`ACCOUNTS_COOKIE_REFRESH_RATE_LIMIT` is environment-only and also applied when
WeKan starts: how many login-cookie refreshes one client address may make per
10 seconds (Meteor's default is 30; every page load is one). Raise it when many
users reach WeKan through a proxy that WeKan does not trust for the client
address (`HTTP_FORWARDED_COUNT`), because they then share one address. The
browser tests set it, as they all come from localhost.

## Provider settings

Every login environment variable can be overridden in the Admin Panel, in the
section of its login method: **SAML**, **LDAP**, **OAuth2** (OpenID Connect,
Oracle OIM), **CAS**, **Header login**, **OAuth login providers** and
**Passwordless login** - `/admin/people/saml`, `/admin/people/ldap`,
`/admin/people/oidc`, `/admin/people/cas`, `/admin/people/header-login`,
`/admin/people/oauth` and `/admin/people/passwordless`.

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

The LDAP section has **Test connection**, which tries the LDAP settings in
effect. The list of variables per section is
`models/lib/authConfigCatalog.js`; SAML's is `models/lib/samlConfig.js` and the
OAuth login providers' is `models/lib/oauthProviders.js`.

## Related

- [Login / Authentication methods](../../../README.md#LoginAuth)
- [Locked Users](Locked-Users.md) — lockout after repeated failed attempts.
- [Login problems](../Problems/Login-Problems.md)
