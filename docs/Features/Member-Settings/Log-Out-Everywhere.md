# Member Settings / Log out everywhere

Open the top-right username menu, then **Log out everywhere**
([#5847](https://github.com/wekan/wekan/issues/5847)). It is the last entry,
under **Log out**. Neither is shown on Sandstorm, where Sandstorm manages the
session.

A confirmation says that this logs you out on every browser, phone and app
where you are logged in, including this one. Confirming removes every login
token of your account, which ends all of its sessions at once, and then signs
this browser out the usual way. If the server call fails, this browser stays
signed in.

Your password, passkeys and settings are not changed.

**Log out**, just above it, ends only this browser's session. For an account
that signed in with SAML it first asks the server for the SAML logout address
and goes there after signing out.

For developers: the method is `logoutEverywhere` in `server/models/users.js`.
See also [Login Page / Passkeys](../Login-Page/Passkeys.md#log-out-everywhere).
