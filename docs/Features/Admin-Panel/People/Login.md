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

## Legacy HTML4 and shared security boundary

The same URL has an equivalent semantic Legacy HTML4 view when JavaScript drag
and drop is unavailable. Five signed Enable/Disable POST controls preserve the
modern ticked-when-allowed meaning. One labelled fieldset saves the default
authentication method and bounded OIDC text in natural Tab order. When
self-registration is disabled, a second fieldset offers the same administrator
boards and accepts newline- or comma-separated invitation addresses plus the
chosen boards. It calls the same invitation-code and email operation as Meteor.

Both renderers read and write through one Global Admin-only login-policy
service. It allowlists the five Boolean keys, accepts only an authentication
method enabled by this server, trims the OIDC label and caps it at 500
characters. The two account-policy documents and five Settings fields cannot be
changed directly over DDP; refused authorization, forged keys and invalid values
are reported as `LoginSettingsBleed` in Admin Panel / Problems / Security with
the available actor, address and location context.

Moving Login from Settings to People had left its invitation-board helper and
AccountSettings subscription on the old parent template. They now belong to the
Login template itself. Board selection also uses one `$elemMatch`, so the
current user and administrator flag must occur on the same membership row.
Paired same-URL browser coverage changes every Boolean, saves both identity
fields, exercises the invitation form without sending external mail, verifies
the modern read and write paths, captures both views, restores global state and
proves anonymous isolation. Invitation email/code behavior retains its separate
positive and failure regression suite.

## Related

- [Login / Authentication methods](../../../README.md#LoginAuth)
- [Locked Users](Locked-Users.md) — lockout after repeated failed attempts.
- [Login problems](../Problems/Login-Problems.md)
