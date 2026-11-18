# Member Settings / SQRL

Open the top-right username menu, then **SQRL**
([#2460](https://github.com/wekan/wekan/issues/2460)). The entry is shown only
when a site administrator has turned on **Sign in with SQRL** in
[Admin Panel / Settings / Features](../Admin-Panel/Settings/Features.md), and
never on Sandstorm.

The popup starts with a short description, then:

- **No identity added yet:** a note saying so and **Add my SQRL identity**.
  Pressing it shows a QR code to scan with a SQRL app, a hint, and an **Open
  SQRL client** button for a client on this computer. When the client has
  answered, the popup says the identity was added; it also says when the code
  expired, when WeKan is not at an `https://` address, or when it failed.
- **Identity added:** a check mark, then notes when your SQRL client has
  disabled SQRL, when the account is set to sign in with SQRL only, or when it
  is hardlocked, and **Remove my SQRL identity**, which removes the identity
  from your account.

While the account is hardlocked, [Edit Profile](Edit-Profile.md) refuses to
change your e-mail address; an administrator can still change it.

Signing in with SQRL, how it works and what the locks mean are in
[Login Page / SQRL](../Login-Page/SQRL.md).

For developers: the popup is `sqrlPopup` in
`client/components/users/userHeader.jade`; it calls `sqrlMine` and
`sqrlRemoveMine` (`server/sqrl.js`) and adds through `client/lib/sqrl.js`.
