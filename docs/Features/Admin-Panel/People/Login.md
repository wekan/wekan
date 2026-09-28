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

## Provider settings

Provider configuration has separate People menu pages: **SAML**, **LDAP**,
**OAuth login providers**, and **Passwordless login**. Their URLs are `/admin/people/saml`,
`/admin/people/ldap`, `/admin/people/oauth`, and `/admin/people/passwordless`.
The Login page retains the general sign-in and registration controls.

SAML uses an override form showing each field's effective configuration source
and the service URLs. LDAP, OAuth and Passwordless select their corresponding
sections of the authentication settings interface. Configuring these pages is
separate from verifying an actual sign-in against an external identity provider.

## Related

- [Login / Authentication methods](../../../README.md#LoginAuth)
- [Locked Users](Locked-Users.md) — lockout after repeated failed attempts.
- [Login problems](../Problems/Login-Problems.md)
