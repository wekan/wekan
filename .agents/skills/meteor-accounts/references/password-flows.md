# Password flows

## Forgot password (client)

```javascript
Accounts.forgotPassword({ email }, (err) => {
  if (err) console.error(err);
});
```

The server sends an email containing a single-use token-bearing URL. The
URL pattern is controlled by `Accounts.urls.resetPassword`; the message
template is controlled by `Accounts.emailTemplates.resetPassword.*`.

```javascript
Accounts.urls.resetPassword = (token, extraParams) =>
  Meteor.absoluteUrl(`reset/${token}`);

Accounts.emailTemplates.resetPassword.subject = () => "Reset your password";
Accounts.emailTemplates.resetPassword.from = () => "no-reply@example.com";
Accounts.emailTemplates.resetPassword.text = (user, url) =>
  `Click to reset: ${url}`;
```

`Accounts.urls.*` setters accept async functions in Meteor 3.x. A
template-specific `Accounts.emailTemplates.<name>.from` overrides the global
`Accounts.emailTemplates.from`; otherwise Meteor falls back to the global
value. Configure at least one effective sender. Meteor 3.5+ logs a warning
when it cannot resolve a `from` address.

## Reset password (client, on the reset page)

```javascript
const token = new URL(location.href).pathname.split("/").pop();
Accounts.resetPassword(token, newPassword, (err) => {
  if (err) console.error(err);
});
```

After success, the user is logged in.

## Change password (authenticated user)

```javascript
Accounts.changePassword(oldPassword, newPassword, (err) => {
  if (err) console.error(err);
});
```

## Verify email

Verification-link expiry and password-change revocation require these patched pairs:

| Meteor release | `accounts-base` | `accounts-password` |
|---|---|---|
| 3.4.4 | 3.2.2 | 3.2.5 |
| 3.5.5 | 3.3.2 | 3.3.1_2 |
| 3.6.1 | 3.4.1 | 3.3.3 |

Check `.meteor/versions` against the release line. Earlier pairings reject
these `Accounts.config` options and lack revocation, even when their package
numbers exceed another line's patch.

Links expire after three days. Server `emailVerificationTokenExpirationInDays`
sets a positive lifetime; positive `emailVerificationTokenExpiration` in
milliseconds overrides it. Zero/null are not a supported expiry opt-out.

Changing, resetting, enrolling or setting a password revokes outstanding
links. Request a fresh link; changing expiry cannot restore a revoked token.

```javascript
Accounts.verifyEmail(token, (err) => {
  if (err) console.error(err);
});
```

The link is sent via `Accounts.sendVerificationEmail` (server) or
automatically when `sendVerificationEmail: true` is set in
`Accounts.config`. Customize the URL with `Accounts.urls.verifyEmail`.

With `accounts-password@3.3.2` (Meteor 3.6), verification consumes the token
and verifies its matching address in one conditional write. A concurrent
replay, replaced token or changed address can return an expired-link error.
Original 3.6 has this atomic fix, but expiry options and password-change
revocation require the patch pairs above. Check earlier packages before
relying on atomic completion. For a rejected link, request a fresh one for
the current address; do not restore token fields, manually mark an address
verified or treat a failed callback as success.

Email verification and login are separate outcomes: with 2FA enabled,
`2fa-enabled` can mean the email was verified but the user was not logged in.
Continue through the normal 2FA login flow; do not bypass it.

## Server APIs (async)

- `await Accounts.createUserAsync(options)`
- `await Accounts.setPasswordAsync(userId, newPassword, options?)`
- `await Accounts.sendVerificationEmail(userId, email?)`
- `await Accounts.sendEnrollmentEmail(userId, email?)`
- `await Accounts.sendResetPasswordEmail(userId, email?)`

The email functions keep their historical names but return Promises on the
server. Await them so delivery or configuration failures propagate.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/api/accounts.md
