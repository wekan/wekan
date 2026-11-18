# Member Settings / Passkeys

Open the top-right username menu, then **Passkeys**
([#5847](https://github.com/wekan/wekan/issues/5847)). The entry is shown to
every signed-in member except on Sandstorm, where Sandstorm signs you in.

The popup:

- a short description of what a passkey is;
- your passkeys, one row each with its name, the date it was added and a trash
  icon that removes it (*No passkeys yet.* when there are none);
- a name field (*Name, like "My phone"*, up to 60 characters) and **Add a
  passkey on this device**, which makes a passkey on this device and saves it
  to your account. The browser asks you to confirm with your screen lock;
- when this browser cannot make passkeys (no WebAuthn support), *This browser
  cannot make passkeys.* instead of the field and button;
- a message line telling whether adding worked.

How passkeys are verified, what WeKan stores, the limit per account and how to
sign in with one are in
[Login Page / Passkeys](../Login-Page/Passkeys.md).

For developers: the popup is `passkeysPopup` in
`client/components/users/userHeader.jade`; it calls `passkeyList` and
`passkeyRemove`, and adds through `client/lib/passkeys.js`.
