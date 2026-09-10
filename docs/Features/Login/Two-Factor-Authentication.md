# Two-Factor Authentication (TOTP)

Opt-in per-user two-factor authentication (TOTP - the same standard used by
Google Authenticator, Authy, etc.), added for
[#3058](https://github.com/wekan/wekan/issues/3058). It is built on
Meteor's official `accounts-2fa` package - WeKan only draws the QR code and
enable/disable buttons; the secret generation and code verification is done
by Meteor itself.

## Where to find it

Click your **avatar/name (top left) → Two-Factor Authentication**, in the
member menu.

```
┌ (your avatar) ▾ ─────────────┐
│ Change Settings              │
│ Change Color                 │
│ Notifications                │
│ Change Font                  │
│ Change Avatar                │
│ Change Password              │
│ ▸ Two-Factor Authentication  │  <- here
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

## Steps to use it

1. Open your member menu and click **Two-Factor Authentication**.
2. Click **Enable** to start activation.
3. Scan the shown QR code with an authenticator app (Google Authenticator,
   Authy, etc.), or type the manual-entry secret shown under it into the app
   by hand.
4. Enter the 6-digit code the app now generates into the confirm field and
   submit.
5. Once confirmed, the popup shows "Two-Factor Authentication enabled" and a
   **Disable** button; from then on, logging in also asks for a 6-digit code.

## Prerequisites

- An authenticator app on a phone/device able to scan a QR code or accept a
  manual TOTP secret.
- Not available when logged in via Sandstorm or via an OAuth2 provider
  (Google/Azure/OIDC/etc. logins manage their own second factor, if any) -
  the menu entry only appears for password-based accounts.
