# Member Settings / SQRL

## What it is

SQRL ("Secure Quick Reliable Login") signs you in by scanning a QR code with a
SQRL app, without a password ([#2460](https://github.com/wekan/wekan/issues/2460)).
**SQRL** in the member menu is where you add your SQRL identity to your account
once, and remove it. The entry is shown only when a site administrator has
turned on **Sign in with SQRL** in
[Admin Panel / Settings / Features](../Admin-Panel/Settings/Features.md), and
never on Sandstorm.

## Read more

- [SQRL](https://en.wikipedia.org/wiki/SQRL) on Wikipedia.
- [SQRL at GRC](https://www.grc.com/sqrl/sqrl.htm) - the protocol's own pages.
- [Login Page / SQRL](../Login-Page/SQRL.md) - signing in with SQRL, how it works
  and what the locks mean.

## How to use it

**Add your SQRL identity**

1. Click your username or avatar at the top right, then **SQRL**.
2. The popup starts with a short description, and *No SQRL identity is
   added.*
3. Click **Add my SQRL identity**. A QR code appears with a hint.
4. Scan it with a SQRL app, or click **Open SQRL client** for a client on this
   computer.
5. When the client has answered, the popup says the identity was added. It also
   says when the code expired, when WeKan is not at an `https://` address, or
   when it failed.

**Remove it**

1. Open **SQRL**. With an identity added, the popup shows a check mark, then
   notes when your SQRL client has disabled SQRL, when the account is set to
   sign in with SQRL only, or when it is hardlocked.
2. Click **Remove my SQRL identity**. The identity is removed from your
   account.

While the account is hardlocked, [Edit Profile](Edit-Profile.md) refuses to
change your e-mail address; an administrator can still change it.

## How the numbers are calculated

- **A code lives 10 minutes** (`SESSION_MS = 10 * 60 * 1000` in
  [models/lib/sqrl.js](../../../models/lib/sqrl.js)); after that the popup says
  it expired.
- **The popup polls every two seconds** until the SQRL client has answered
  ([server/sqrl.js](../../../server/sqrl.js)).
- Further limits of the protocol are in
  [Login Page / SQRL](../Login-Page/SQRL.md#how-the-numbers-are-calculated).

## How it works in WeKan

- **Popup:** `sqrlPopup` in
  [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade);
  it calls `sqrlMine` and `sqrlRemoveMine`
  ([server/sqrl.js](../../../server/sqrl.js)) and adds through
  [client/lib/sqrl.js](../../../client/lib/sqrl.js). The menu entry is shown by
  the helper `sqrlOffered`.
- **Server:** the SQRL client posts signed requests to `/sqrl`; the page polls
  until the session is answered. The hardlock check `sqrlHardlocked()` is what
  `setEmail` asks before an e-mail change.
- **Tests:** [tests/sqrl.test.cjs](../../../tests/sqrl.test.cjs).

## Commits

 - [sqrlonly and hardlock lock an account to SQRL](https://github.com/wekan/wekan/commit/a539429fce594ad3423627a7471a142836a71f8d)
 - [Sign in with SQRL, from a phone or a computer](https://github.com/wekan/wekan/commit/c940b3e30131ed6675c5767468bdab56ab7852eb)
