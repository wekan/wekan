# Passkeys, and Log out everywhere

[#5847](https://github.com/wekan/wekan/issues/5847).

## Passkeys

A passkey signs you in with your device's fingerprint, face, screen lock or a
security key, instead of a password. It is made on your device and never
leaves it; WeKan keeps only its public key.

- **Add one:** Member Settings → **Passkeys** → give it a name (like "My
  phone") → **Add a passkey on this device**. Your browser asks you to confirm
  with your screen lock. Add one on each device you use; up to 20.
- **Sign in:** on the sign-in page, **Sign in with a passkey**. The browser
  offers the passkeys it has for this WeKan; no user name is needed.
- **Remove one** in the same popup, for example when a phone is lost.

How it is kept safe:

- A passkey belongs to WeKan's own address, `ROOT_URL`: it cannot sign in to
  another site, nor to this WeKan through another address. WeKan must be at an
  `https://` address (or `http://localhost` for testing).
- Each sign-in signs a fresh challenge that is used once and expires in five
  minutes, and the passkey's signature counter must move forward, so a copied
  passkey is refused.
- Your passkeys are never sent to other members' browsers. A disabled account
  cannot sign in with one.
- Verification is done by [SimpleWebAuthn](https://github.com/MasterKale/SimpleWebAuthn)
  (`@simplewebauthn/server`, MIT), pinned in `package.json`.

Passkeys are not offered on Sandstorm, where Sandstorm signs you in.

## Log out everywhere

Member Settings → **Log out everywhere** ends every session of your account -
other browsers, phones, the desktop app - and this one, after a confirmation.
Use it when a device was lost or you signed in somewhere you should not have
stayed signed in. Your passkeys, password and settings are unchanged.
