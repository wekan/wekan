# Passkeys, and Log out everywhere

## What it is

A passkey signs you in with your device's fingerprint, face, screen lock or a
security key, instead of a password. It is made on your device and never
leaves it; WeKan keeps only its public key. **Log out everywhere** ends every
session of your account at once, for when a device was lost or you stayed
signed in somewhere you should not have. Both came with
[\#5847](https://github.com/wekan/wekan/issues/5847).

## Read more

- [WebAuthn at Wikipedia](https://en.wikipedia.org/wiki/WebAuthn), the
  standard passkeys are built on
- [SimpleWebAuthn](https://simplewebauthn.dev/), the library WeKan verifies
  passkeys with ([source](https://github.com/MasterKale/SimpleWebAuthn))
- [Session cookies](Session-Cookies.md) and
  [Two-Factor Authentication](Two-Factor-Authentication.md)

## How to use it

**Add a passkey**

1. Click your avatar to open **Member Settings** and choose **Passkeys**.
2. Give it a name (like "My phone").
3. Click **Add a passkey on this device**. Your browser asks you to confirm
   with your screen lock.
4. Add one on each device you use; up to 20.

**Sign in with a passkey**

1. On the sign-in page click **Sign in with a passkey**.
2. The browser offers the passkeys it has for this WeKan; no user name is
   needed.

**Remove a passkey** in the same Passkeys popup, for example when a phone is
lost.

**Log out everywhere**

1. Member Settings → **Log out everywhere**.
2. Confirm. It ends every session of your account - other browsers, phones,
   the desktop app - and this one. Your passkeys, password and settings are
   unchanged.

Passkeys are not offered on Sandstorm, where Sandstorm signs you in.

## How the numbers are calculated

- **Up to 20 passkeys** per account (`MAX_PASSKEYS` in
  `models/lib/passkeys.js`); the add is refused with "You have the most
  passkeys an account can have" beyond that.
- **Challenge lifetime: five minutes** (`CHALLENGE_MS = 5 * 60 * 1000` in
  `server/passkeys.js`), used once; a TTL index removes expired ones.
- **Signature counter**: each sign-in must report a counter higher than the
  stored one, and the stored one is updated, so a copied passkey is refused.
- **Name**: control characters removed, trimmed, at most 60 characters;
  empty becomes "Passkey".
- **Rate limit**: each passkey method allows 10 calls per 10 seconds per
  connection.

## How it works in WeKan

How it is kept safe:

- A passkey belongs to WeKan's own address, `ROOT_URL`: it cannot sign in to
  another site, nor to this WeKan through another address. WeKan must be at an
  `https://` address (or `http://localhost` for testing); otherwise the popup
  says "Passkeys need WeKan at an https:// address."
- Each sign-in signs a fresh challenge that is used once and expires in five
  minutes, and the passkey's signature counter must move forward, so a copied
  passkey is refused.
- Your passkeys are never sent to other members' browsers. A disabled account
  cannot sign in with one.
- Verification is done by [SimpleWebAuthn](https://github.com/MasterKale/SimpleWebAuthn)
  (`@simplewebauthn/server`, MIT), pinned in `package.json`.

Files:

- [models/lib/passkeys.js](../../../models/lib/passkeys.js) - pure: the
  relying party from `ROOT_URL`, base64url, the browser option conversion,
  `passkeyName`, `MAX_PASSKEYS`.
- [server/passkeys.js](../../../server/passkeys.js) - the methods
  `passkeyRegistrationOptions`, `passkeyRegister`, `passkeyRemove`,
  `passkeyLoginOptions`, `passkeyList`, the `passkey` login handler, the
  `passkeyChallenges` collection, and the passkeys stored in the user's
  top-level `passkeys` field (never published).
- [client/lib/passkeys.js](../../../client/lib/passkeys.js) - the browser's
  `navigator.credentials` calls.
- [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade) -
  the `passkeysPopup` and `logoutEverywherePopup`;
  [client/components/main/layouts.jade](../../../client/components/main/layouts.jade) -
  the sign-in button.
- [server/models/users.js](../../../server/models/users.js) -
  `logoutEverywhere` empties `services.resume.loginTokens`, so Meteor ends
  every session.
- Test: [tests/passkeys.test.cjs](../../../tests/passkeys.test.cjs).

## Commits

 - [Passkey (WebAuthn) login, and Log out everywhere](https://github.com/wekan/wekan/commit/63ef900d56b97500bae0c1277d98ee3786b3e3c3)
