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

- **Default Authentication Method** — what the sign-in page starts with. The
  `DEFAULT_AUTHENTICATION_METHOD` environment variable, when set, wins on every
  startup.
- **OIDC button text** — what the OIDC / OAuth2 sign-in button says.

Under them, the Login pane's own environment variables, each overridable:
`PASSWORD_LOGIN_ENABLED` and `ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS` (applied
when WeKan starts).

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
`OAUTH2_SECRET`) are never sent to the browser. The page shows only whether
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
