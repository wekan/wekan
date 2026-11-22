# Two-Factor Authentication (TOTP)

## What it is

Opt-in per-user two-factor authentication (TOTP - the same standard used by
Google Authenticator, Authy, etc.), added for
[\#3058](https://github.com/wekan/wekan/issues/3058). After the password,
signing in also asks for a 6-digit code from an authenticator app, so a
stolen password alone is not enough. An administrator can also make it
compulsory with `REQUIRE_2FA`. It is built on Meteor's official `accounts-2fa`
package - WeKan only draws the QR code and enable/disable buttons; the secret
generation and code verification is done by Meteor itself.

## Read more

- [Time-based one-time password (TOTP) at Wikipedia](https://en.wikipedia.org/wiki/Time-based_one-time_password)
- [Multi-factor authentication at Wikipedia](https://en.wikipedia.org/wiki/Multi-factor_authentication)
- [Meteor accounts-2fa documentation](https://docs.meteor.com/packages/accounts-2fa.html)
- [Passkeys](Passkeys.md), [Passwordless](Passwordless.md) and
  [Accounts Lockout](Accounts-Lockout.md)

## How to use it

Click your **avatar/name → Two-Factor Authentication**, in the member menu
(Member Settings).

```
┌ (your avatar) ▾ ─────────────┐
│ Change Settings              │
│ Change Color                 │
│ Notifications                │
│ Change Font                  │
│ Change Avatar                │
│ Change Password              │
│ ▸ Two-Factor Authentication  │  <- here
│ Hidden boards, Passkeys, ... │
│ Change Language              │
└─────────────────────────────────┘

┌ Two-Factor Authentication ───────────┐
│  Scan this QR code with your         │
│  authenticator app:                  │
│   ┌───────────┐                      │
│   │ ▓▓  ▓  ▓▓ │                      │
│   │ ▓ ▓▓▓▓ ▓  │   or enter manually: │
│   │ ▓▓  ▓  ▓▓ │   ABCD-EFGH-1234     │
│   └───────────┘                      │
│  Code: [______]  [Confirm] [Cancel]  │
└─────────────────────────────────────────┘
```

**Turn it on**

1. Open your member menu and click **Two-Factor Authentication**.
2. Click **Enable Two-Factor Authentication** to start activation.
3. Scan the shown QR code with an authenticator app (Google Authenticator,
   Authy, etc.), or type the manual-entry secret shown under it ("Or enter
   this code manually") into the app by hand.
4. Enter the 6-digit code the app now generates into **Enter your 6-digit
   authentication code** and click **Confirm and Enable**.
5. Once confirmed, the popup shows "Two-factor authentication is enabled for
   your account." and a **Disable Two-Factor Authentication** button; from
   then on, logging in also asks for a 6-digit code.

**Sign in with it**: after the user name and password, the sign-in page asks
**Enter your 6-digit authentication code**; type it and click **Verify**.

**Make it compulsory (administrator)**: Admin Panel / People / Login, or the
environment variable `REQUIRE_2FA` = `off` (default), `admins` or `all`. A
covered account without 2FA can still sign in, but sees only "Set up
two-factor authentication" until it has done so, and cannot switch it off
again while it is required.

Prerequisites:

- An authenticator app on a phone/device able to scan a QR code or accept a
  manual TOTP secret.
- Not available when logged in via Sandstorm, and the menu entry is hidden
  for OAuth2/OIDC accounts (Google/Azure/OIDC/etc. logins manage their own
  second factor, if any). Meteor asks for the code only on a **password**
  login, so for LDAP, SAML and CAS accounts it has no effect either, and
  `REQUIRE_2FA` covers only accounts that sign in with a WeKan password.
  (The old text said the entry appears only for password accounts; the code
  hides it only on Sandstorm and for `authenticationMethod` `oauth2`.)

## How the numbers are calculated

- **6 digits**: the code fields accept at most 6 digits; the code is the
  standard TOTP value, computed and checked by `accounts-2fa` from the shared
  secret and the current time.
- **`REQUIRE_2FA`**: `off` unless the value is exactly `admins` or `all`
  (case-insensitive); `admins` covers accounts with `isAdmin: true`
  (`models/lib/twoFactorRequirement.js`).
- An account "has 2FA" when `services.twoFactorAuthentication` has a `secret`
  and `type: 'otp'`, the same test `accounts-2fa` makes.

## How it works in WeKan

- [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade)
  and `userHeader.js` - the `twoFactorAuthPopup`, calling
  `Accounts.generate2faActivationQrCode`, `Accounts.enableUser2fa` and
  `Accounts.disableUser2fa`.
- [client/components/main/layouts.jade](../../../client/components/main/layouts.jade) -
  the second sign-in step, shown when a password login answers `no-2fa-code`
  or `invalid-2fa-code`
  ([imports/lib/twoFactorAuthLoginDecision.js](../../../imports/lib/twoFactorAuthLoginDecision.js),
  wired in [config/accounts.js](../../../config/accounts.js)).
- [models/lib/twoFactorRequirement.js](../../../models/lib/twoFactorRequirement.js)
  and [server/requireTwoFactor.js](../../../server/requireTwoFactor.js) - the
  compulsory mode: until enrolled, every method but signing in/out and the 2FA
  methods is refused, publications but the login page's are empty, HTTP routes
  and the REST API do not accept the login;
  [client/components/users/twoFactorRequired.jade](../../../client/components/users/twoFactorRequired.jade)
  shows only the set-up.
- Tests: [tests/requireTwoFactor.test.cjs](../../../tests/requireTwoFactor.test.cjs),
  [tests/twoFactorLoginState.test.cjs](../../../tests/twoFactorLoginState.test.cjs),
  [tests/twoFactorLockoutErrors.test.cjs](../../../tests/twoFactorLockoutErrors.test.cjs).

## Integration tests

See [local login protocol tests](Testing.md) for example identities, actual
request/response checks, failure cases and deployment limitations.

## Commits

 - [Every method and publication, the 2FA ones too, pass audit-argument-checks](https://github.com/wekan/wekan/commit/508484ef1e195a1db7a7e795faf1f20d6c5a387a)
 - [Compulsory two-factor authentication with REQUIRE_2FA](https://github.com/wekan/wekan/commit/d7abe9910a3bbb4871b1bb512d60f232556f8b54)
 - [Fix Firefox password login submit replay](https://github.com/wekan/wekan/commit/79cd465585b5d26cae55ea27ec0dea4598b16907)
 - [Hide two-factor challenges nobody asked for](https://github.com/wekan/wekan/commit/cc2833cd0e64fc2defd649811c092d5816d116ac)
 - [Document Two-Factor Authentication](https://github.com/wekan/wekan/commit/191472036028e303b92bec67751101f7c562a2da)
 - [Add native TOTP two-factor authentication via Meteor's accounts-2fa](https://github.com/wekan/wekan/commit/0eaa97230b601ef8ef716c855bd317ab2f1e4362)
