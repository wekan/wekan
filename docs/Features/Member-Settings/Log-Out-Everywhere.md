# Member Settings / Log out everywhere

## What it is

**Log out everywhere** ends every session of your account at once - on every
browser, phone and app where you are logged in, including this one
([#5847](https://github.com/wekan/wekan/issues/5847)). Use it when you lost a
device or signed in somewhere you no longer trust. **Log out**, just above it,
ends only this browser's session. Neither is shown on Sandstorm, where
Sandstorm manages the session.

## Read more

- [Session (computer science)](https://en.wikipedia.org/wiki/Session_(computer_science))
  on Wikipedia.
- [Login Page / Passkeys](../Login-Page/Passkeys.md).
- [Change Password](Change-Password.md) - changing the password also signs every
  session out.

## How to use it

**Log out everywhere**

1. Click your username or avatar at the top right.
2. Click **Log out everywhere**. It is the last entry, under **Log Out**.
3. A confirmation says that this logs you out on every browser, phone and app
   where you are logged in, including this one. Confirm with **Log out
   everywhere**.
4. Every login token of your account is removed, which ends all of its sessions
   at once, and then this browser signs out the usual way. If the server call
   fails, this browser stays signed in.

Your password, passkeys and settings are not changed.

**Log out**

1. Click your username or avatar at the top right, then **Log Out**.
2. Only this browser's session ends. For an account that signed in with SAML
   it first asks the server for the SAML logout address and goes there after
   signing out.

## How the numbers are calculated

This feature has no numbers of its own: it empties the account's whole list of
login tokens (`services.resume.loginTokens`), however many there are, so the
count of open sessions becomes 0.

## How it works in WeKan

- **Menu and popup:** `js-logout` and `js-logout-everywhere` in the member menu,
  and `logoutEverywherePopup`, in
  [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade).
  The event in [userHeader.js](../../../client/components/users/userHeader.js)
  calls `logoutEverywhere`, returns without signing out when it fails, and
  otherwise calls `AccountsTemplates.logout()`.
- **Method:** `logoutEverywhere` in
  [server/models/users.js](../../../server/models/users.js) refuses a caller who
  is not signed in and sets `services.resume.loginTokens` to an empty list.
  Meteor closes every connection whose token is gone.
- **Tests:** [tests/passkeys.test.cjs](../../../tests/passkeys.test.cjs) pins
  the method and its menu entry.

## Commits

 - [Passkey login, and Log out everywhere](https://github.com/wekan/wekan/commit/63ef900d56b97500bae0c1277d98ee3786b3e3c3)
