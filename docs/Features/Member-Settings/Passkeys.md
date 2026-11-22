# Member Settings / Passkeys

## What it is

A passkey lets you sign in with this device's fingerprint, face, screen lock or
security key instead of your password
([#5847](https://github.com/wekan/wekan/issues/5847)). It stays on your device;
WeKan keeps only its public key. **Passkeys** in the member menu is where you add
passkeys to your account and remove them. The entry is shown to every
signed-in member except on Sandstorm, where Sandstorm signs you in.

## Read more

- [WebAuthn](https://en.wikipedia.org/wiki/WebAuthn) on Wikipedia and the
  [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
  on MDN.
- [passkeys.dev](https://passkeys.dev/) and
  [FIDO Alliance: Passkeys](https://fidoalliance.org/passkeys/).
- [Login Page / Passkeys](../Login-Page/Passkeys.md) - how passkeys are
  verified, what WeKan stores, the limit per account and how to sign in with one.
- [Log out everywhere](Log-Out-Everywhere.md).

## How to use it

**Add a passkey**

1. Click your username or avatar at the top right, then **Passkeys**.
2. Type a name in the field (*Name, like "My phone"*, up to 60 characters).
3. Click **Add a passkey on this device**. The browser asks you to confirm with
   your screen lock; the passkey is made on this device and saved to your
   account. The message line tells whether adding worked.

**Remove a passkey**

1. Open **Passkeys**. Your passkeys are listed one per row, with the name, the
   date it was added and a trash icon (*No passkeys yet.* when there are none).
2. Click the trash icon of the passkey to remove it.

When this browser cannot make passkeys (no WebAuthn support), the popup says
*This browser cannot make passkeys.* instead of the field and button.

## How the numbers are calculated

- **Up to 20 passkeys** per account (`MAX_PASSKEYS` in
  [models/lib/passkeys.js](../../../models/lib/passkeys.js)); adding one more
  is refused.
- **Name:** control characters are removed, the rest trimmed and cut to 60
  characters; an empty name becomes *Passkey* (`passkeyName()`). The field
  itself also has `maxlength="60"`.
- The rest - the five-minute challenge, the signature counter and the rate
  limit - is in
  [Login Page / Passkeys](../Login-Page/Passkeys.md#how-the-numbers-are-calculated).

## How it works in WeKan

- **Popup:** `passkeysPopup` in
  [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade);
  it calls `passkeyList` and `passkeyRemove`, and adds through
  [client/lib/passkeys.js](../../../client/lib/passkeys.js).
- **Server:** [server/passkeys.js](../../../server/passkeys.js) creates the
  registration options for `ROOT_URL`'s host, verifies the answer and pushes
  the passkey onto the user's `passkeys` list only while it has fewer than 20.
- **Tests:** [tests/passkeys.test.cjs](../../../tests/passkeys.test.cjs).

## Commits

 - [Passkey (WebAuthn) login, and Log out everywhere](https://github.com/wekan/wekan/commit/63ef900d56b97500bae0c1277d98ee3786b3e3c3)
