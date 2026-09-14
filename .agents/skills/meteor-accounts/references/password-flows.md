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

```javascript
Accounts.verifyEmail(token, (err) => {
  if (err) console.error(err);
});
```

The link is sent via `Accounts.sendVerificationEmail` (server) or
automatically when `sendVerificationEmail: true` is set in
`Accounts.config`. Customize the URL with `Accounts.urls.verifyEmail`.

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
